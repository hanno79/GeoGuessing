const express = require('express');
const { getDb } = require('../database/db');
const { validateScorePayload } = require('../utils/validation');

const router = express.Router();

// Simple in-memory rate limiter for score submissions (per IP).
// Allows RATE_LIMIT_MAX requests per RATE_LIMIT_WINDOW_MS window.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const rateLimitMap = new Map(); // ip -> { count, resetTime }

function scoreRateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  let entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    entry = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(ip, entry);
    return next();
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' });
  }

  return next();
}

// Periodically clean up expired entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetTime) rateLimitMap.delete(ip);
  }
}, 5 * 60_000).unref();

const ALLOWED_SORT_COLUMNS = ['totalScore', 'scorePerRound', 'avgDistanceKm', 'timestamp', 'name', 'difficulty', 'roundsCount', 'gameMode', 'gameCategory', 'totalTimeTakenSeconds'];
const ALLOWED_ORDERS = ['asc', 'desc'];

// GET /api/leaderboard
router.get('/leaderboard', (req, res) => {
  try {
    const db = getDb();
    const { difficulty, roundsCount, gameMode, gameCategory, sort = 'scorePerRound', order = 'desc', limit = 50 } = req.query;

    const sortCol = ALLOWED_SORT_COLUMNS.includes(sort) ? sort : 'scorePerRound';
    const sortOrder = ALLOWED_ORDERS.includes(order?.toLowerCase()) ? order.toUpperCase() : 'DESC';
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

    let query = 'SELECT *, ROUND(CAST(totalScore AS REAL) / roundsCount, 1) AS scorePerRound FROM leaderboard WHERE 1=1';
    const params = [];

    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }
    if (roundsCount) {
      query += ' AND roundsCount = ?';
      params.push(parseInt(roundsCount, 10));
    }
    if (gameMode) {
      query += ' AND gameMode = ?';
      params.push(gameMode);
    }
    if (gameCategory) {
      query += ' AND gameCategory = ?';
      params.push(gameCategory);
    }

    const { dailyDate } = req.query;
    if (dailyDate) {
      query += ' AND dailyDate = ?';
      params.push(dailyDate);
    }

    query += ` ORDER BY ${sortCol} ${sortOrder}`;
    if (sortCol !== 'totalTimeTakenSeconds') query += ', totalTimeTakenSeconds ASC';
    if (sortCol !== 'avgDistanceKm') query += ', avgDistanceKm ASC';
    if (sortCol !== 'timestamp') query += ', timestamp ASC';
    query += ' LIMIT ?';
    params.push(limitNum);

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/leaderboard error:', err.message);
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

// POST /api/score
router.post('/score', scoreRateLimit, (req, res) => {
  try {
    const db = getDb();
    const validation = validateScorePayload(req.body);

    if (!validation.valid) {
      return res.status(400).json({ error: 'Ungültige Daten.', details: validation.errors });
    }

    const { totalScore, difficulty, roundsCount, avgDistanceKm, gameMode, gameCategory, totalTimeTakenSeconds, dailyDate } = req.body;
    const name = validation.name;

    // Daily Challenge: only one attempt per player per day per category
    if (gameMode === 'Daily' && dailyDate) {
      const dailyExisting = db
        .prepare('SELECT id FROM leaderboard WHERE name = ? AND gameMode = ? AND dailyDate = ? AND gameCategory = ?')
        .get(name, 'Daily', dailyDate, gameCategory);
      if (dailyExisting) {
        return res.status(409).json({ error: 'Du hast die heutige Challenge bereits gespielt.' });
      }
    }

    // Check for duplicate entry
    const existing = db
      .prepare(
        'SELECT id FROM leaderboard WHERE name = ? AND totalScore = ? AND difficulty = ? AND roundsCount = ? AND gameMode = ? AND gameCategory = ?'
      )
      .get(name, totalScore, difficulty, roundsCount, gameMode, gameCategory);

    if (existing) {
      return res.status(409).json({ error: 'Eintrag existiert bereits.' });
    }

    const stmt = db.prepare(
      'INSERT INTO leaderboard (name, totalScore, difficulty, roundsCount, avgDistanceKm, gameMode, gameCategory, totalTimeTakenSeconds, dailyDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(name, totalScore, difficulty, roundsCount, avgDistanceKm ?? null, gameMode, gameCategory, totalTimeTakenSeconds ?? null, dailyDate ?? null);

    const newEntry = db.prepare('SELECT * FROM leaderboard WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newEntry);
  } catch (err) {
    console.error('POST /api/score error:', err.message);
    res.status(500).json({ error: 'Datenbankfehler.' });
  }
});

// GET /api/daily/check — check if a player already played today's daily
router.get('/daily/check', (req, res) => {
  try {
    const db = getDb();
    const { name, date, category } = req.query;

    if (!name || !date) {
      return res.status(400).json({ error: 'name and date are required.' });
    }

    const existing = db
      .prepare('SELECT id FROM leaderboard WHERE name = ? AND gameMode = ? AND dailyDate = ? AND gameCategory = ?')
      .get(name, 'Daily', date, category || 'SkyView');

    res.json({ played: !!existing });
  } catch (err) {
    console.error('GET /api/daily/check error:', err.message);
    res.status(500).json({ error: 'Datenbankfehler.' });
  }
});

module.exports = router;
