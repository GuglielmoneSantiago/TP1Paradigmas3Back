// models/sneakerModel.js
const mongoose = require('mongoose');

const sneakerSchema = new mongoose.Schema({
  model: { type: String, required: true, unique: true },
  prices: [String],  // Array de precios obtenidos
});

module.exports = mongoose.model('Sneaker', sneakerSchema);
