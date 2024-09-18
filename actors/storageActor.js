const Sneaker = require('../models/sneakerModel');
const EventEmitter = require('events');

class StorageActor extends EventEmitter {
    constructor(socket) {
        super();
        this.socket = socket;

        // Asegurarse de que socket esté definido antes de usarlo
        if (this.socket) {
            this.socket.on('priceExtracted', async (data) => {
                try {
                    console.log(`\nPrecio recibido para el modelo ${data.model}: ${JSON.stringify(data.result)}`);

                    const cleanedPrices = {
                        storeName: data.result.storeName,
                        model: data.result.model,
                        originalPrice: this.cleanPrice(data.result.originalPrice),
                        discountPrice: this.cleanPrice(data.result.discountPrice),
                        inStock: data.result.inStock
                    };

                    await this.store(data.model, [cleanedPrices]);
                } catch (error) {
                    console.error(`Error al procesar y almacenar los precios recibidos: ${error.message}`);
                }
            });
        } else {
            console.error('Socket no definido en StorageActor');
        }
    }

    cleanPrice(price) {
        // Lógica para limpiar el precio
    }

    async store(model, prices) {
        // Lógica para almacenar los precios en la base de datos
    }
}

module.exports = StorageActor;
