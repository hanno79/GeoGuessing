const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const LOCATIONS_PATH = path.join(__dirname, '../../data/locations.json');
const FALLBACK_LOCATION = { latitude: 52.52, longitude: 13.405 }; // Berlin

let locations = null;

function loadLocations() {
  if (locations !== null) return locations;
  try {
    const raw = fs.readFileSync(LOCATIONS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.warn('locations.json is empty or invalid. Using fallback.');
      locations = [FALLBACK_LOCATION];
    } else {
      locations = parsed;
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

module.exports = router;
