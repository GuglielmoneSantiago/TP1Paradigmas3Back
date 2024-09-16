const mongoose = require('mongoose');

const sneakerSchema = new mongoose.Schema({
  model: { type: String, required: true, unique: true },
  prices: [{
    store: String,
    originalPrice: String,
    discountPrice: String,
    inStock: String
  }]  // Array de objetos con los detalles del precio
});

module.exports = mongoose.model('Sneaker', sneakerSchema);
