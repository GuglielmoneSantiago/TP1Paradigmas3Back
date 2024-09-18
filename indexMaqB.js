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

// Escuchar conexiones desde la Máquina A
io.on('connection', (socket) => {
    console.log('Conexión establecida con la Máquina A');

    // Inicializa el StorageActor con el socket de conexión
    const storageActor = new StorageActor(socket);
});
