const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
  console.log('📊 Database:', mongoose.connection.name);
})
.catch((err) => {
  console.error('❌ MongoDB Connection Error:', err.message);
  console.log('\n💡 Troubleshooting:');
  console.log('1. Check your .env file has correct MONGODB_URI');
  console.log('2. Verify username/password in MongoDB Atlas');
  console.log('3. Add your IP to MongoDB Atlas whitelist (0.0.0.0/0)');
  process.exit(1);
});

// Import Models
const User = require('./models/User');
const Marks = require('./models/Marks');

// Import Routes
const authRoutes = require('./routes/auth');
const marksRoutes = require('./routes/marks');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/marks', marksRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 API available at http://localhost:${PORT}/api`);
});