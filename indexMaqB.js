require('dotenv').config();
const mongoose = require('mongoose');
const io = require('socket.io')(3002);  // Cambia el puerto donde escuchará la Máquina B
const StorageActor = require('./actors/storageActor');

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Conectado a MongoDB en la Máquina B');
  })
  .catch((err) => {
    console.error('Error al conectar con MongoDB:', err);
    process.exit(1);
  });

// Inicializa el StorageActor
const storageActor = new StorageActor();

// Escuchar conexiones desde la Máquina A
io.on('connection', (socket) => {
    console.log('Conexión establecida con la Máquina A');

    // Escuchar el evento 'priceExtracted' desde la Máquina A
    socket.on('priceExtracted', async ({ model, priceData }) => {
        try {
            console.log(`Recibidos datos para el modelo ${model} en la Máquina B:`, priceData);

            // Almacenar los precios recibidos en la base de datos
            await storageActor.store(model, [priceData]);
            console.log(`Datos del modelo ${model} almacenados correctamente en la Máquina B`);
            
            // Enviar confirmación a la Máquina A
            socket.emit('dataStored', `Datos del modelo ${model} almacenados correctamente`);
        } catch (error) {
            console.error(`Error al almacenar los datos en la Máquina B: ${error.message}`);
            socket.emit('dataStoredError', `Error al almacenar los datos para el modelo ${model}: ${error.message}`);
        }
    });
});
