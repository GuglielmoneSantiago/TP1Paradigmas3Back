const Sneaker = require('../models/sneakerModel');
const EventEmitter = require('events');

class StorageActor extends EventEmitter {
    constructor(socket) {
        super();
        this.socket = socket;

        socket.on('priceExtracted', async (data) => {
            try {
                console.log(`Precio recibido para el modelo ${data.model}: ${JSON.stringify(data.result)}`);
                
                // Limpiar los precios antes de almacenarlos
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

        socket.on('disconnect', () => {
            console.log('Cliente desconectado del StorageActor');
        });
    }

    // Función para limpiar los precios (elimina el símbolo "$" y convierte a número)
    cleanPrice(price) {
        if (typeof price === 'string') {
            const cleanedPrice = parseFloat(price.replace(/[^\d.-]/g, ''));  // Eliminar cualquier carácter que no sea número, punto o guión
            return isNaN(cleanedPrice) ? null : cleanedPrice;
        }
        return price;
    }

    // Función para almacenar precios en la base de datos
    async store(model, prices) {
        try {
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
