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
  const idx = Math.floor(Math.random() * locs.length);
  const loc = locs[idx];
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

  const idx = Math.floor(Math.random() * selected.length);
  const city = selected[idx];

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

module.exports = router;
