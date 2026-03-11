const express = require('express');
const { getDb } = require('../database/db');
const { validateScorePayload } = require('../utils/validation');

const router = express.Router();

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
router.post('/score', (req, res) => {
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

module.exports = router;
