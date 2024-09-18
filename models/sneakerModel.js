const mongoose = require('mongoose');

const sneakerSchema = new mongoose.Schema({
  model: { type: String, required: true},
  prices: [{
    storeName: String,
    originalPrice: { type: String, required: true },  // Guardar como cadena
    discountPrice: { type: String, default: null },   // Guardar como cadena o null si no hay descuento
    inStock: String
  }]
});

module.exports = mongoose.model('Sneaker', sneakerSchema);