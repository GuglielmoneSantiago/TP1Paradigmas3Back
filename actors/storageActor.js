const Sneaker = require('../models/sneakerModel');
const EventEmitter = require('events');
const io = require('socket.io')(3002); // Máquina B escucha en el puerto 3002

class StorageActor extends EventEmitter {
    constructor() {
        super();
        // Escuchar los eventos de scraping desde la Máquina A
        io.on('connection', (socket) => {
            console.log('StorageActor connected to socket');

            // Escuchar cuando la Máquina A envía precios
            socket.on('priceExtracted', async (data) => {
                console.log(`Precio del modelo recibido ${data.model}: ${JSON.stringify(data.prices)}`);
                
                // Validar datos antes de almacenar
                if (this.validatePrices(data.prices)) {
                    await this.store(data.model, data.prices);
                } else {
                    console.error(`Datos inválidos recibidos para el modelo ${data.model}`);
                }
            });

            // Manejar desconexiones de sockets
            socket.on('disconnect', () => {
                console.log('Conexión de socket perdida');
            });
        });
    }

    // Método para validar los precios
    validatePrices(prices) {
        return prices.every(price => 
            price.storeName && 
            price.originalPrice && 
            typeof price.inStock === 'string'
        );
    }

    // Almacenar precios en la base de datos
    async store(model, prices) {
        try {
            const priceEntries = prices.map(price => ({
                store: price.storeName,
                originalPrice: price.originalPrice,
                discountPrice: price.discountPrice,
                inStock: price.inStock
            }));

            await Sneaker.findOneAndUpdate(
                { model },
                { $push: { prices: { $each: priceEntries } } },
                { upsert: true, new: true } // upsert para crear si no existe, new para devolver el documento actualizado
            );
            console.log(`Precio del modelo: ${model} guardado en la base de datos`);
        } catch (error) {
            console.error(`Error al guardar precios para el modelo ${model}: ${error.message}`);
        }
    }
}

module.exports = StorageActor;
