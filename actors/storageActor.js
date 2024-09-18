const Sneaker = require('../models/sneakerModel');
const EventEmitter = require('events');
const mongoose = require('mongoose');
const config = require('../config/config');

class StorageActor extends EventEmitter {
    constructor(socket) {
        super();
        this.socket = socket;
        this.processedCount = 0;
        this.totalModels = config.models.length * config.stores.length;

        // El StorageActor escucha directamente el evento `priceExtracted`
        if (this.socket) {
            this.socket.on('priceExtracted', async ({ model, result }) => {
                try {
                    console.log(`\nPrecio recibido para el modelo ${model}: ${JSON.stringify(result)}\n`);

                    // Lógica de almacenamiento
                    await this.store(model, result);
                    this.processedCount++;

                    console.log(`Datos del modelo ${model} de la tienda ${result.storeName} almacenados correctamente en Base de Datos\n`);

                    // Verificar si ya se han procesado todos los modelos
                    if (this.processedCount === this.totalModels) {
                        console.log('\nTodos los modelos han sido procesados y guardados en la base de datos.');

                        // Cerrar la conexión a MongoDB y el socket
                        await mongoose.connection.close();
                        console.log('Conexión a MongoDB cerrada.');
                        this.socket.disconnect();
                        console.log('Socket desconectado.');
                        process.exit(0);  // Finalizar el proceso
                    }
                } catch (error) {
                    console.error(`Error al almacenar los datos en la Máquina B: ${error.message}`);
                    this.socket.emit('dataStoredError', `Error al almacenar los datos para el modelo ${model}: ${error.message}`);
                }
            });
        } else {
            console.error('Socket no definido en StorageActor');
        }
    }

    // Función para almacenar precios en la base de datos
    async store(model, price) {
        try {
            // Buscar si el modelo ya existe en la base de datos
            const sneaker = await Sneaker.findOne({ model });

            if (sneaker) {
                // Si el modelo ya existe, agregar el nuevo precio a la lista de precios
                sneaker.prices.push(price);
                await sneaker.save();
            } else {
                // Si el modelo no existe, crear uno nuevo con los precios
                const newSneaker = new Sneaker({
                    model: model,
                    prices: [price]
                });
                await newSneaker.save();
            }
        } catch (error) {
            console.error(`Error al guardar precios para el modelo ${model}: ${error.message}`);
        }
    }
}

module.exports = StorageActor;
