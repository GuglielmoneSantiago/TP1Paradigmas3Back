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
                    console.log(`\nPrecio recibido para el modelo ${data.model}: ${JSON.stringify(data.result)}\n`);

                    // Crear un objeto de precios sin array
                    const priceData = {
                        storeName: data.result.storeName,
                        model: data.result.model,
                        originalPrice: data.result.originalPrice || 'No disponible',  // Asegurarse de que sea cadena
                        discountPrice: data.result.discountPrice || 'No hay descuento',  // Asegurarse de que sea cadena
                        inStock: data.result.inStock || 'Desconocido'  // Asegurar que 'inStock' esté definido
                    };

                    // Guardar los precios en la base de datos
                    await this.store(data.model, priceData);  // Eliminar el array innecesario
                } catch (error) {
                    console.error(`Error al procesar y almacenar los precios recibidos: ${error.message}`);
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
                sneaker.prices.push(price);  // Aquí solo agregamos el objeto de precios, no un array
                await sneaker.save();
            } else {
                // Si el modelo no existe, crear uno nuevo con los precios
                const newSneaker = new Sneaker({
                    model: model,
                    prices: [price]  // Crear un nuevo documento con los precios en un array
                });
                await newSneaker.save();
            }
        } catch (error) {
            console.error(`Error al guardar precios para el modelo ${model}: ${error.message}`);
        }
    }
}

module.exports = StorageActor;
