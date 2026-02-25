require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Date-Track backend running on port ${PORT}`);
});

module.exports = app;
