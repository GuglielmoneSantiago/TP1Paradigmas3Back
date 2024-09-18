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

// Escuchar conexiones desde la Máquina A
io.on('connection', (socket) => {
    console.log('Conexión establecida con la Máquina A');

    // Inicializar el StorageActor, que ahora se encargará de manejar los eventos
    const storageActor = new StorageActor(socket);
});
