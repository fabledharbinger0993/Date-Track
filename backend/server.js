require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const integrationsRoutes = require('./routes/integrations');
const aiRoutes = require('./routes/ai');
const emailRoutes = require('./routes/email');
const { getInstance: getMCPService } = require('./services/mcpService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// NOTE: FRONTEND_URL must match exactly (protocol, host, and port) for credentials (cookies/sessions) to work.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    // Allow common headers used by the frontend when calling this API.
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    // Expose any non-simple headers the frontend may need to read.
    exposedHeaders: ['Content-Length', 'ETag'],
  })
);
app.use(express.json());
if (!process.env.SESSION_SECRET) {
  console.warn('WARNING: SESSION_SECRET env var is not set. Using an insecure default — set it before deploying to production.');
}
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'date-track-default-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/email', emailRoutes);

// MCP status endpoint
app.get('/api/mcp/status', (req, res) => {
  const mcpService = getMCPService();
  res.json({
    status: 'ok',
    servers: mcpService.getStatus(),
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React frontend in production (Replit)
if (process.env.NODE_ENV === 'production' || process.env.REPLIT) {
  const frontendBuildPath = path.join(__dirname, '../frontend/build');
  
// Initialize MCP servers
const mcpService = getMCPService();
mcpService.initialize().catch(err => {
  console.error('Failed to initialize MCP servers:', err.message);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  
  try {
    await mcpService.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  app.use(express.static(frontendBuildPath));
  
  // Handle React Router - send all non-API requests to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
  
  console.log('✓ Serving React frontend from build folder');
}

app.listen(PORT, () => {
  console.log(`Date-Track backend running on port ${PORT}`);
});

module.exports = app;
