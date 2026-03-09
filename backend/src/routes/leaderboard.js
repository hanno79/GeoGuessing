const express = require('express');
const { getDb } = require('../database/db');
const { validateScorePayload } = require('../utils/validation');

const router = express.Router();

const ALLOWED_SORT_COLUMNS = ['totalScore', 'avgDistanceKm', 'timestamp', 'name', 'difficulty', 'roundsCount'];
const ALLOWED_ORDERS = ['asc', 'desc'];

// GET /api/leaderboard
router.get('/leaderboard', (req, res) => {
  try {
    const db = getDb();
    const { difficulty, roundsCount, sort = 'totalScore', order = 'desc', limit = 50 } = req.query;

    const sortCol = ALLOWED_SORT_COLUMNS.includes(sort) ? sort : 'totalScore';
    const sortOrder = ALLOWED_ORDERS.includes(order?.toLowerCase()) ? order.toUpperCase() : 'DESC';
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

    let query = 'SELECT * FROM leaderboard WHERE 1=1';
    const params = [];

    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }
    if (roundsCount) {
      query += ' AND roundsCount = ?';
      params.push(parseInt(roundsCount, 10));
    }

    query += ` ORDER BY ${sortCol} ${sortOrder}`;
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

    const { totalScore, difficulty, roundsCount, avgDistanceKm } = req.body;
    const name = validation.name;

    // Check for duplicate entry
    const existing = db
      .prepare(
        'SELECT id FROM leaderboard WHERE name = ? AND totalScore = ? AND difficulty = ? AND roundsCount = ?'
      )
      .get(name, totalScore, difficulty, roundsCount);

    if (existing) {
      return res.status(409).json({ error: 'Eintrag existiert bereits.' });
    }

    const stmt = db.prepare(
      'INSERT INTO leaderboard (name, totalScore, difficulty, roundsCount, avgDistanceKm) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(name, totalScore, difficulty, roundsCount, avgDistanceKm ?? null);

    const newEntry = db.prepare('SELECT * FROM leaderboard WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newEntry);
  } catch (err) {
    console.error('POST /api/score error:', err.message);
    res.status(500).json({ error: 'Datenbankfehler.' });
  }
});

module.exports = router;
