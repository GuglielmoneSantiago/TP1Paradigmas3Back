require('dotenv').config();
const mongoose = require('mongoose');
const io = require('socket.io')(3002);
const StorageActor = require('./actors/storageActor');

// Variables de control
let totalModels = 3;  // Ajusta esto según la cantidad de modelos que esperas recibir
let processedCount = 0;

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conectado a MongoDB en la Máquina B');
  })
  .catch((err) => {
    console.error('Error al conectar con MongoDB:', err);
    process.exit(1);
  });

// Escuchar conexiones desde la Máquina A
io.on('connection', (socket) => {
    console.log('Conexión establecida con la Máquina A\n');

    const storageActor = new StorageActor(socket);

    socket.on('priceExtracted', async (data) => {
        try {
            console.log(`\nPrecio recibido para el modelo ${data.model}: ${JSON.stringify(data.result)}\n`);
            
            const cleanedPrices = {
                storeName: data.result.storeName,
                model: data.result.model,
                originalPrice: data.result.originalPrice,
                discountPrice: data.result.discountPrice,
                inStock: data.result.inStock
            };

            await storageActor.store(data.model, [cleanedPrices]);
            console.log(`\nPrecio del modelo ${data.model} de la tienda ${data.result.storeName} guardado en la base de datos correctamente\n`);

            processedCount++;

            // Verificar si hemos procesado todos los modelos
            if (processedCount === totalModels) {
                console.log('\nTodos los modelos han sido procesados. Cerrando conexiones...\n');
                socket.disconnect();  // Desconectar el socket
                await mongoose.connection.close();  // Cerrar conexión a MongoDB
                process.exit(0);  // Cerrar el proceso
            }
        } catch (error) {
            console.error(`Error al procesar y almacenar los precios recibidos: ${error.message}`);
        }
    });
});
