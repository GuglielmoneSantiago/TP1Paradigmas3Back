require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const priceRoutes = require('./routes/priceRoutes');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGODB_URI;

app.use('/api', priceRoutes);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
});

