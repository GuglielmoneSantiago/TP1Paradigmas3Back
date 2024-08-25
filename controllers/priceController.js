// controllers/priceController.js
const priceService = require('../services/priceService');

exports.getPrices = async (req, res) => {
  const { model } = req.params;
  try {
    const prices = await priceService.getPrices(model);
    res.json({ model, prices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
