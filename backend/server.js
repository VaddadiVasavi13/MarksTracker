const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Import routes (ADD THESE LINES)
const auth = require('./routes/auth');
const marksRoutes = require('./routes/marks');

// CORS configuration - Allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://marks-tracker-two.vercel.app',
  'https://marks-tracker.vercel.app',
  'https://your-vercel-app.vercel.app', // Replace with your actual Vercel URL
  process.env.FRONTEND_URL // Optional: Add from environment variable
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(null, true); // For development, accept all (remove in production)
      // callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  console.log('Headers:', req.headers);
  next();
});

// Your routes
app.use('/api/auth', auth);
app.use('/api/marks', marksRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for CORS
app.get('/api/test-cors', (req, res) => {
  res.json({ message: 'CORS is working!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// MongoDB connection (ADD THIS IF NOT PRESENT)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marks-tracker')
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`✅ CORS enabled for origins:`, allowedOrigins);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });