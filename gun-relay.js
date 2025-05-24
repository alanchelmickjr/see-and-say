const Gun = require('gun');
const express = require('express');
const cors = require('cors');

const app = express();
const port = 8765;

// Enable CORS for all routes
app.use(cors());

// Serve Gun.js
app.use(Gun.serve);

// Create Gun instance
const gun = Gun({
  web: app,
  localStorage: false, // Disable localStorage on server
  radisk: true // Enable disk storage
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: Date.now(),
    peers: Object.keys(gun._.opt.peers || {}).length 
  });
});

const server = app.listen(port, () => {
  console.log(`🔫 Gun.js relay server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔄 P2P sync enabled for mobile-first data`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down Gun.js relay server...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down Gun.js relay server...');
  server.close(() => {
    process.exit(0);
  });
});
