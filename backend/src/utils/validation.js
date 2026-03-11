const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const VALID_ROUNDS = [3, 5, 7];
const VALID_GAME_MODES = ['Classic', 'Zen', 'Daily', 'Streak'];
const VALID_GAME_CATEGORIES = ['SkyView', 'CityHunt'];
const NAME_REGEX = /^[a-zA-Z0-9\-_]+$/;

/**
 * Validates and trims a player name.
 * Rules: 1-20 chars, only letters, digits, hyphens, underscores.
 */
function validateName(name) {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Name must be a string.' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 1) {
    return { valid: false, error: 'Name must not be empty.' };
  }
  if (trimmed.length > 20) {
    return { valid: false, error: 'Name must not exceed 20 characters.' };
  }
  if (!NAME_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Name may only contain letters, digits, hyphens (-) and underscores (_).',
    };
  }
  return { valid: true, value: trimmed };
}

/**
 * Validates a score submission payload.
 */
function validateScorePayload(body) {
  const errors = [];

  const nameResult = validateName(body.name);
  if (!nameResult.valid) errors.push(nameResult.error);

  if (typeof body.totalScore !== 'number' || !Number.isInteger(body.totalScore) || body.totalScore < 0) {
    errors.push('totalScore must be a non-negative integer.');
  }

  if (!VALID_DIFFICULTIES.includes(body.difficulty)) {
    errors.push(`difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}.`);
  }

  if (body.gameMode === 'Streak' || body.gameMode === 'Daily') {
    if (typeof body.roundsCount !== 'number' || !Number.isInteger(body.roundsCount) || body.roundsCount < 1) {
      errors.push('roundsCount must be a positive integer.');
    }
  } else if (!VALID_ROUNDS.includes(body.roundsCount)) {
    errors.push(`roundsCount must be one of: ${VALID_ROUNDS.join(', ')}.`);
  }

  if (body.avgDistanceKm !== undefined && body.avgDistanceKm !== null) {
    if (typeof body.avgDistanceKm !== 'number' || body.avgDistanceKm < 0) {
      errors.push('avgDistanceKm must be a non-negative number.');
    }
  }

  if (!VALID_GAME_MODES.includes(body.gameMode)) {
    errors.push(`gameMode must be one of: ${VALID_GAME_MODES.join(', ')}.`);
  }

  if (body.totalTimeTakenSeconds !== undefined && body.totalTimeTakenSeconds !== null) {
    if (typeof body.totalTimeTakenSeconds !== 'number' || body.totalTimeTakenSeconds < 0) {
      errors.push('totalTimeTakenSeconds must be a non-negative number.');
    }
  }

  if (!VALID_GAME_CATEGORIES.includes(body.gameCategory)) {
    errors.push(`gameCategory must be one of: ${VALID_GAME_CATEGORIES.join(', ')}.`);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, name: nameResult.value };
}

/**
 * Validates that a location object has valid coordinates.
 * Latitude must be between -90 and 90, longitude between -180 and 180.
 */
function validateCoordinates(location) {
  if (location == null || typeof location !== 'object') return false;
  const { latitude, longitude } = location;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (!isFinite(latitude) || !isFinite(longitude)) return false;
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

module.exports = { validateName, validateScorePayload, validateCoordinates, VALID_GAME_CATEGORIES };
