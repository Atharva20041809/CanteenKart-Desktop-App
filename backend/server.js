const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
  override: true,
});

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Track DB connection state
let dbConnected = false;
let dbError = null;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://demo_user:DEMO_PASSWORD@cluster0.xxxxx.mongodb.net/canteenkart?retryWrites=true&w=majority';
const PORT = process.env.PORT || 5000;

// Health / status endpoint so desktop app can verify connection status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dbConnected,
    dbError: dbError ? dbError.message : null,
    time: new Date()
  });
});

// Routes
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

let serverInstance = null;

// Function to start DB connection
function connectDB() {
  return mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000 // Quick timeout so desktop can quickly report connection issue
  })
  .then(() => {
    dbConnected = true;
    dbError = null;
    console.log('[Backend] MongoDB connected successfully');
  })
  .catch(err => {
    dbConnected = false;
    dbError = err;
    console.error('[Backend] MongoDB connection error:', err.message);
  });
}

function startServer(port = PORT) {
  connectDB();
  serverInstance = app.listen(port, () => {
    console.log(`[Backend] CanteenKart API server running on port ${port}`);
  });
  return serverInstance;
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, connectDB };
