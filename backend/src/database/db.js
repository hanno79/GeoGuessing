const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// In production on Railway, set DATABASE_PATH to a persistent volume path,
// e.g. DATABASE_PATH=/data/leaderboard.db  (mount a Railway volume at /data).
// Falls back to the local data directory for development.
const DB_PATH =
  process.env.DATABASE_PATH || path.join(__dirname, '../../data/leaderboard.db');

const DATA_DIR = path.dirname(DB_PATH);

let db;

function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  try {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');

    db.exec(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        totalScore INTEGER NOT NULL,
        difficulty TEXT NOT NULL,
        roundsCount INTEGER NOT NULL,
        avgDistanceKm REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized at', DB_PATH);
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    process.exit(1);
  }
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

module.exports = { initDatabase, getDb };
