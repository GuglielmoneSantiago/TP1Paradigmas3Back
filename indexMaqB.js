require('dotenv').config();
const mongoose = require('mongoose');
const io = require('socket.io')(3002);
const StorageActor = require('./actors/storageActor');

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conectado a MongoDB en la Máquina B');
  })
  .catch((err) => {
    console.error('Error al conectar con MongoDB:', err);
    process.exit(1);
  });

let completedModels = 0;  // Contador para los modelos procesados
const totalModels = 3;  // Número total de modelos que vas a procesar

// Escuchar conexiones desde la Máquina A
io.on('connection', (socket) => {
    console.log('Conexión establecida con la Máquina A');

    const storageActor = new StorageActor(socket);

    socket.once('priceExtracted', async (data) => {
        try {
            console.log(`Precio recibido para el modelo ${data.model}: ${JSON.stringify(data.result)}`);
            await storageActor.store(data.model, [data.result]);

            console.log(`Precio del modelo ${data.model} guardado en la base de datos correctamente`);
            
            completedModels++;

            // Verifica si todos los modelos han sido procesados
            if (completedModels === totalModels) {
                console.log('Todos los modelos han sido procesados. Cerrando conexiones...');
                socket.disconnect();  // Desconectar el socket
                mongoose.connection.close();  // Cerrar conexión a MongoDB
                process.exit(0);  // Cerrar el proceso
            }
        } catch (error) {
            console.error(`Error al procesar el modelo ${data.model}: ${error.message}`);
        }
    });
});
