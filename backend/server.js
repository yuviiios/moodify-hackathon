// server.js - Main backend server
// Save this as: backend/server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import the Moodify helpers
const { 
  createMoodifyRoutes 
} = require('./helpers');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Create Moodify routes
createMoodifyRoutes(app, null);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Moodify Backend Server is running! 🚀',
    endpoints: {
      health: '/api/health',
      moodify: '/api/moodify (POST)',
    },
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Moodify Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎵 Main API: http://localhost:${PORT}/api/moodify`);
});