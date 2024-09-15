// storageActor.js
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
                console.log(`Received prices for model ${data.model}: ${data.prices}`);
                await this.store(data.model, data.prices);
            });
        });
    }

    async store(model, prices) {
        try {
            await Sneaker.findOneAndUpdate({ model }, { prices }, { upsert: true });
            console.log(`Stored prices for model ${model}`);
        } catch (error) {
            console.error(`Error storing prices for model ${model}: ${error.message}`);
        }
    }
}

module.exports = StorageActor;
