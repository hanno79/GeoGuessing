require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database/db');
const leaderboardRouter = require('./routes/leaderboard');
const locationRouter = require('./routes/location');

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// CORS: in production the frontend is served from the same origin,
// so we only need permissive CORS for local development.
const corsOrigins = IS_PROD
  ? [] // same-origin in prod; no CORS headers needed
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

if (!IS_PROD) {
  app.use(cors({ origin: corsOrigins }));
}

app.use(express.json());

// Initialize SQLite database
initDatabase();

// API Routes
app.use('/api', leaderboardRouter);
app.use('/api', locationRouter);

// Health check
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// In production: serve the built React frontend as static files
if (IS_PROD) {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));

  // SPA fallback – all non-API routes return index.html for client-side routing
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Central error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`GeoGuessing Backend listening on http://localhost:${PORT} [${IS_PROD ? 'production' : 'development'}]`);
});

module.exports = app;
