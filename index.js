require('dotenv').config();
const mongoose = require('mongoose');
const priceRoutes = require('./routes/priceRoutes');

const app = express();
app.use(express.json());

const MONGO_URI = process.env.MONGODB_URI;

app.use('/api', priceRoutes);

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  });