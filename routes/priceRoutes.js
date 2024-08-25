// routes/priceRoutes.js
const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');

router.get('/prices/:model', priceController.getPrices);

module.exports = router;
