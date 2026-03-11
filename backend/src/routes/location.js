const express = require('express');
const path = require('path');
const fs = require('fs');
const { validateCoordinates } = require('../utils/validation');

const router = express.Router();

const LOCATIONS_PATH = path.join(__dirname, '../../data/locations.json');
const CITIES_PATH = path.join(__dirname, '../../data/cities.json');
const FALLBACK_LOCATION = { latitude: 52.52, longitude: 13.405 }; // Berlin
const FALLBACK_CITY = { city: 'Berlin', country: 'Deutschland', latitude: 52.52, longitude: 13.405, difficulty: 'easy' };

let locations = null;
let cities = null;

function parseExclude(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadLocations() {
  if (locations !== null) return locations;
  try {
    const raw = fs.readFileSync(LOCATIONS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.warn('locations.json is empty or invalid. Using fallback.');
      locations = [FALLBACK_LOCATION];
    } else {
      const valid = parsed.filter((loc, i) => {
        if (!validateCoordinates(loc)) {
          console.warn(`Skipping invalid location at index ${i}:`, JSON.stringify(loc));
          return false;
        }
        return true;
      });
      locations = valid.length > 0 ? valid : [FALLBACK_LOCATION];
      if (valid.length < parsed.length) {
        console.warn(`Filtered out ${parsed.length - valid.length} invalid location(s).`);
      }
    }
  } catch (err) {
    console.error('Failed to load locations.json:', err.message, '- Using fallback.');
    locations = [FALLBACK_LOCATION];
  }
  return locations;
}

// GET /api/location
router.get('/location', (req, res) => {
  const locs = loadLocations();
  const exclude = new Set(parseExclude(req.query.exclude));
  let pool = exclude.size > 0
    ? locs.filter((l) => !exclude.has(`${l.latitude},${l.longitude}`))
    : locs;
  if (pool.length === 0) pool = locs;

  const idx = Math.floor(Math.random() * pool.length);
  const loc = pool[idx];
  res.json({ latitude: loc.latitude, longitude: loc.longitude });
});

// ── City data loading ────────────────────────────────────────────────────────

const DIFFICULTY_POOLS = {
  Easy: ['easy'],
  Medium: ['easy', 'medium'],
  Hard: ['easy', 'medium', 'hard'],
};

function loadCities() {
  if (cities !== null) return cities;
  try {
    const raw = fs.readFileSync(CITIES_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.warn('cities.json is empty or invalid. Using fallback.');
      cities = [FALLBACK_CITY];
    } else {
      const valid = parsed.filter((c, i) => {
        if (!c.city || typeof c.city !== 'string' || !validateCoordinates(c)) {
          console.warn(`Skipping invalid city at index ${i}:`, JSON.stringify(c));
          return false;
        }
        return true;
      });
      cities = valid.length > 0 ? valid : [FALLBACK_CITY];
    }
  } catch (err) {
    console.error('Failed to load cities.json:', err.message, '- Using fallback.');
    cities = [FALLBACK_CITY];
  }
  return cities;
}

// GET /api/city?difficulty=Easy|Medium|Hard
router.get('/city', (req, res) => {
  const allCities = loadCities();
  const difficulty = req.query.difficulty;
  const allowedDiffs = DIFFICULTY_POOLS[difficulty] || DIFFICULTY_POOLS.Hard;
  const pool = allCities.filter((c) => allowedDiffs.includes(c.difficulty));
  const selected = pool.length > 0 ? pool : allCities;

  const exclude = new Set(parseExclude(req.query.exclude));
  let filtered = exclude.size > 0
    ? selected.filter((c) => !exclude.has(c.city))
    : selected;
  if (filtered.length === 0) filtered = selected;

  const idx = Math.floor(Math.random() * filtered.length);
  const city = filtered[idx];

  const result = {
    city: city.city,
    latitude: city.latitude,
    longitude: city.longitude,
  };

  // Only include country on Easy difficulty
  if (difficulty === 'Easy' && city.country) {
    result.country = city.country;
  }

  res.json(result);
});

// ── Seeded PRNG for Daily Challenge ─────────────────────────────────────────

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateToSeed(dateStr) {
  return parseInt(dateStr.replace(/-/g, ''), 10);
}

// Deterministically pick `count` items from an array using a seeded PRNG
function seededPick(arr, seed, count) {
  const rng = mulberry32(seed);
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    const idx = Math.floor(rng() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

// GET /api/daily?date=YYYY-MM-DD&round=0..4&category=SkyView|CityHunt
router.get('/daily', (req, res) => {
  const { date, round, category } = req.query;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date must be in YYYY-MM-DD format.' });
  }

  const roundIdx = parseInt(round, 10);
  if (isNaN(roundIdx) || roundIdx < 0 || roundIdx > 4) {
    return res.status(400).json({ error: 'round must be 0-4.' });
  }

  const seed = dateToSeed(date) + (category === 'CityHunt' ? 99999 : 0);

  if (category === 'CityHunt') {
    const allCities = loadCities();
    const pool = allCities.filter((c) => ['easy', 'medium'].includes(c.difficulty));
    const selected = pool.length > 0 ? pool : allCities;
    const dailyCities = seededPick(selected, seed, 5);
    const city = dailyCities[roundIdx];
    if (!city) return res.status(404).json({ error: 'No city available.' });
    res.json({
      city: city.city,
      latitude: city.latitude,
      longitude: city.longitude,
      country: city.country || undefined,
    });
  } else {
    const locs = loadLocations();
    const dailyLocs = seededPick(locs, seed, 5);
    const loc = dailyLocs[roundIdx];
    if (!loc) return res.status(404).json({ error: 'No location available.' });
    res.json({ latitude: loc.latitude, longitude: loc.longitude });
  }
});

module.exports = router;
