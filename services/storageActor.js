const Sneaker = require('../models/sneakerModel');
const EventEmitter = require('events');
const io = require('socket.io')(3002); // Puerto donde correrá el socket del StorageActor

class StorageActor extends EventEmitter {
    constructor() {
        super();
        // Escuchar eventos desde el socket
        io.on('connection', (socket) => {
            console.log('StorageActor connected to socket');

            // Escucha cuando el ScrapingActor envía precios
            socket.on('priceExtracted', async (data) => {
                console.log(`Received prices for model ${data.model}: ${JSON.stringify(data.prices)}`);
                await this.store(data.model, data.prices);
            });
        });
    }

    async store(model, prices) {
        try {
            // Estructura clara para almacenar los detalles de precios
            const priceEntries = prices.map(price => ({
                store: price.storeName,
                originalPrice: price.originalPrice,
                discountPrice: price.discountPrice,
                inStock: price.inStock
            }));

            // Actualiza el modelo o lo crea si no existe, guardando la información de precios
            await Sneaker.findOneAndUpdate(
                { model },
                { $push: { prices: { $each: priceEntries } } }, // Guardar cada precio como un objeto con más detalles
                { upsert: true }
            );
            console.log(`Stored prices for model ${model}`);
        } catch (error) {
            console.error(`Error storing prices for model ${model}: ${error.message}`);
        }
    }
}

module.exports = StorageActor;
