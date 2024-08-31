const Sneaker = require('../models/sneakerModel');
const EventEmitter = require('events');

class StorageActor extends EventEmitter {
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
