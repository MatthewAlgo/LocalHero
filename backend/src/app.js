/**
 * LocalHero Backend Server
 * Express application entry point
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { initDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// Middleware
// ============================================================

// CORS - allow frontend to connect
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Request logging (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================
// Routes
// ============================================================

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'LocalHero API',
    version: '1.0.0',
    description: 'Hyper-Local Content Generator for Local SEO',
    docs: '/api/health'
  });
});

// ============================================================
// Error Handling
// ============================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV !== 'production' ? err.message : undefined
  });
});

// ============================================================
// Server Startup
// ============================================================

async function startServer() {
  try {
    // Initialize database first
    await initDatabase();
    console.log('✓ Database initialized');

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🦸 LocalHero API Server                                ║
║                                                          ║
║   Running on: http://localhost:${PORT}                     ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(26)}║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
