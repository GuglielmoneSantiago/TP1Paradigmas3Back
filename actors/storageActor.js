const Sneaker = require('../models/sneakerModel');
const EventEmitter = require('events');
const io = require('socket.io')(3000);  // La máquina receptora escucha en este puerto

class StorageActor extends EventEmitter {
    constructor() {
        super();

        // Escuchar los eventos de scraping desde la máquina de scraping (ScrapingActor)
        io.on('connection', (socket) => {
            console.log('StorageActor conectado al socket');

            // Escucha cuando la máquina remota envía los precios extraídos
            socket.on('priceExtracted', async (data) => {
                try {
                    console.log(`Precio recibido para el modelo ${data.model}: ${JSON.stringify(data.result)}`);
                    await this.store(data.model, [data.result]);  // Almacenar los precios recibidos
                } catch (error) {
                    console.error(`Error al procesar y almacenar los precios recibidos: ${error.message}`);
                }
            });

            // Escuchar cuando se cierra la conexión
            socket.on('disconnect', () => {
                console.log('Cliente desconectado del StorageActor');
            });
        });
    }

    // Función para almacenar precios en la base de datos
    async store(model, prices) {
        try {
            // Se utiliza upsert para actualizar o crear el modelo en caso de que no exista
            await Sneaker.findOneAndUpdate(
                { model },  // Buscar el modelo de zapatilla en la base de datos
                { $push: { prices: { $each: prices } } },  // Agregar los precios a la lista de precios
                { upsert: true, new: true }  // Crear el documento si no existe (upsert) y retornar el nuevo documento (new)
            );
            console.log(`Precio del modelo ${model} guardado en la base de datos correctamente`);
        } catch (error) {
            console.error(`Error al guardar precios para el modelo ${model}: ${error.message}`);
        }
    }
}

module.exports = StorageActor;
