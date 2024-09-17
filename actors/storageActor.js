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
                console.log(`Precio recibido para el modelo ${data.model}: ${JSON.stringify(data.result)}`);
                await this.store(data.model, [data.result]);
            });
        });
    }

    async store(model, prices) {
        try {
            await Sneaker.findOneAndUpdate(
                { model },
                { $push: { prices: { $each: prices } } },
                { upsert: true, new: true }
            );
            console.log(`Precio del modelo ${model} guardado en la base de datos`);
        } catch (error) {
            console.error(`Error al guardar precios para el modelo ${model}: ${error.message}`);
        }
    }
}

module.exports = StorageActor;
