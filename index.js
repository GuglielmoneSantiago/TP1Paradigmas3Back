require('dotenv').config();
const mongoose = require('mongoose');
const priceService = require('./services/priceService');
const config = require('./config/config');

const MONGO_URI = process.env.MONGODB_URI;

// Conexión a MongoDB
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Ejecutar el servicio para buscar precios del modelo especificado en el archivo de configuración
      const pricePromises = config.models.map((model) => {
        console.log(`Iniciando búsqueda para el modelo: ${model.name}`);
        return priceService.getPricesForModel(model.name); // Asegúrate de pasar solo el nombre
      });
      
      // Esperar a que todas las promesas se resuelvan
      await Promise.all(pricePromises);

      console.log('Búsquedas de precios completadas');
    } catch (error) {
      console.error('Error en la búsqueda de precios:', error.message);
    } finally {
      // Cerrar la conexión a MongoDB sin callback
      await mongoose.connection.close();
      console.log('Conexión a MongoDB cerrada');
    
    }
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  });