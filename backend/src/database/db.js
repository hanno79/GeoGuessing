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
        gameMode TEXT NOT NULL DEFAULT 'Classic',
        totalTimeTakenSeconds REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration: add columns if they don't exist (for existing databases)
    const cols = db.prepare("PRAGMA table_info(leaderboard)").all().map(c => c.name);
    if (!cols.includes('gameMode')) {
      db.exec("ALTER TABLE leaderboard ADD COLUMN gameMode TEXT NOT NULL DEFAULT 'Classic'");
    }
    if (!cols.includes('totalTimeTakenSeconds')) {
      db.exec("ALTER TABLE leaderboard ADD COLUMN totalTimeTakenSeconds REAL");
    }
    if (!cols.includes('gameCategory')) {
      db.exec("ALTER TABLE leaderboard ADD COLUMN gameCategory TEXT NOT NULL DEFAULT 'SkyView'");
    }

    // Migration: normalize existing Zen scores from 6000-scale to 5000-scale
    const migrationTable = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'"
    ).get();
    if (!migrationTable) {
      db.exec("CREATE TABLE _migrations (name TEXT PRIMARY KEY, applied_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
    }
    const zenMigration = db.prepare(
      "SELECT name FROM _migrations WHERE name = 'normalize_zen_scores_v1'"
    ).get();
    if (!zenMigration) {
      db.transaction(() => {
        db.exec(`
          UPDATE leaderboard
          SET totalScore = CAST(ROUND(totalScore * 5000.0 / 6000.0) AS INTEGER)
          WHERE gameMode = 'Zen'
        `);
        db.prepare("INSERT INTO _migrations (name) VALUES (?)").run('normalize_zen_scores_v1');
      })();
      console.log('Migration: normalized existing Zen scores to 5000-scale');
    }

    // Migration: fill NULL totalTimeTakenSeconds for existing Classic entries with max time
    const timeMigration = db.prepare(
      "SELECT name FROM _migrations WHERE name = 'backfill_classic_time_v1'"
    ).get();
    if (!timeMigration) {
      // Classic timer limits: Easy=60s, Medium=45s, Hard=30s — use max time × roundsCount
      db.transaction(() => {
        db.exec(`
          UPDATE leaderboard
          SET totalTimeTakenSeconds = CASE difficulty
            WHEN 'Easy' THEN 60.0 * roundsCount
            WHEN 'Medium' THEN 45.0 * roundsCount
            WHEN 'Hard' THEN 30.0 * roundsCount
            ELSE 45.0 * roundsCount
          END
          WHERE totalTimeTakenSeconds IS NULL
        `);
        db.prepare("INSERT INTO _migrations (name) VALUES (?)").run('backfill_classic_time_v1');
      })();
      console.log('Migration: backfilled Classic entries with default max time');
    }

    // Migration: add dailyDate column for Daily Challenge
    const cols2 = db.prepare("PRAGMA table_info(leaderboard)").all().map(c => c.name);
    if (!cols2.includes('dailyDate')) {
      db.exec("ALTER TABLE leaderboard ADD COLUMN dailyDate TEXT DEFAULT NULL");
      console.log('Migration: added dailyDate column');
    }

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
