const mongoose = require('mongoose');

const sneakerSchema = new mongoose.Schema({
  model: { type: String, required: true, unique: true },
  prices: [{
    store: String,
    originalPrice: Number,  // Asegúrate de que este campo es un número
    discountPrice: Number,  // Asegúrate de que este campo es un número (puede ser null)
    inStock: String
  }]
});

module.exports = mongoose.model('Sneaker', sneakerSchema);
