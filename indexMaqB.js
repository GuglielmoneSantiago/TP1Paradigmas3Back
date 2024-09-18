require('dotenv').config();
const mongoose = require('mongoose');
const io = require('socket.io')(3002);
const StorageActor = require('./actors/storageActor');
const config = require('./config/config');

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
    console.log('Conexión establecida con la Máquina A');

    // Inicializa el StorageActor con el socket
    const storageActor = new StorageActor(socket);

    // Variables de control
    const totalModels = config.models.length * config.stores.length; // Número total de combinaciones de modelos y tiendas
    let processedCount = 0;

    // El almacenamiento y procesamiento se delega completamente al StorageActor
    socket.on('priceExtracted', async ({ model, result }) => {
        try {
            // Delegar el almacenamiento al StorageActor
            await storageActor.store(model, result);
            processedCount++;

            console.log(`Datos del modelo ${model} de la tienda ${result.storeName} almacenados correctamente en Base de Datos\n`);

            if (processedCount === totalModels) {
                console.log('\nTodos los modelos han sido procesados y guardados en la base de datos.');

                // Cerrar la conexión a MongoDB y el socket
                await mongoose.connection.close();
                console.log('Conexión a MongoDB cerrada.');
                socket.disconnect();
                console.log('Socket desconectado.');
                process.exit(0);  // Finalizar el proceso
            }
        } catch (error) {
            console.error(`Error al almacenar los datos en la Máquina B: ${error.message}`);
            socket.emit('dataStoredError', `Error al almacenar los datos para el modelo ${model}: ${error.message}`);
        }
    });
});
