const mongoose = require('mongoose');

const sneakerSchema = new mongoose.Schema({
  model: { type: String, required: true},
  prices: [{
    storeName: String,
    originalPrice: { type: String, required: true }, 
    discountPrice: { type: String, default: null },  
    inStock: String
  }]
});

module.exports = mongoose.model('Sneaker', sneakerSchema);