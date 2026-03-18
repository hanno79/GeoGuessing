const { validateName, validateScorePayload, validateCoordinates } = require('../src/utils/validation');

describe('validateName', () => {
  test('accepts valid alphanumeric name', () => {
    expect(validateName('Player1')).toEqual({ valid: true, value: 'Player1' });
  });

  test('accepts hyphens and underscores', () => {
    expect(validateName('cool-player_99')).toEqual({ valid: true, value: 'cool-player_99' });
  });

  test('trims whitespace', () => {
    expect(validateName('  Alice  ')).toEqual({ valid: true, value: 'Alice' });
  });

  test('rejects empty string', () => {
    expect(validateName('')).toEqual({ valid: false, error: 'Name must not be empty.' });
  });

  test('rejects whitespace-only string', () => {
    expect(validateName('   ')).toEqual({ valid: false, error: 'Name must not be empty.' });
  });

  test('rejects name longer than 20 characters', () => {
    const result = validateName('a'.repeat(21));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/20 characters/);
  });

  test('accepts name exactly 20 characters', () => {
    expect(validateName('a'.repeat(20)).valid).toBe(true);
  });

  test('rejects special characters', () => {
    expect(validateName('player!@#').valid).toBe(false);
  });

  test('rejects non-string input', () => {
    expect(validateName(123).valid).toBe(false);
    expect(validateName(null).valid).toBe(false);
  });
});

describe('validateScorePayload', () => {
  const validPayload = {
    name: 'TestPlayer',
    totalScore: 15000,
    difficulty: 'Medium',
    roundsCount: 5,
    avgDistanceKm: 123.45,
    gameMode: 'Classic',
    gameCategory: 'SkyView',
  };

  test('accepts valid payload', () => {
    const result = validateScorePayload(validPayload);
    expect(result.valid).toBe(true);
    expect(result.name).toBe('TestPlayer');
  });

  test('accepts valid Zen payload with totalTimeTakenSeconds', () => {
    const result = validateScorePayload({
      ...validPayload,
      gameMode: 'Zen',
      totalTimeTakenSeconds: 42.5,
    });
    expect(result.valid).toBe(true);
  });

  test('accepts null avgDistanceKm', () => {
    const result = validateScorePayload({ ...validPayload, avgDistanceKm: null });
    expect(result.valid).toBe(true);
  });

  test('rejects negative totalScore', () => {
    const result = validateScorePayload({ ...validPayload, totalScore: -1 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('totalScore must be a non-negative integer.');
  });

  test('rejects non-integer totalScore', () => {
    const result = validateScorePayload({ ...validPayload, totalScore: 100.5 });
    expect(result.valid).toBe(false);
  });

  test('rejects invalid difficulty', () => {
    const result = validateScorePayload({ ...validPayload, difficulty: 'Expert' });
    expect(result.valid).toBe(false);
  });

  test('rejects invalid roundsCount', () => {
    const result = validateScorePayload({ ...validPayload, roundsCount: 10 });
    expect(result.valid).toBe(false);
  });

  test('rejects invalid gameMode', () => {
    const result = validateScorePayload({ ...validPayload, gameMode: 'Turbo' });
    expect(result.valid).toBe(false);
  });

  test('rejects invalid gameCategory', () => {
    const result = validateScorePayload({ ...validPayload, gameCategory: 'FreeRoam' });
    expect(result.valid).toBe(false);
  });

  test('rejects negative avgDistanceKm', () => {
    const result = validateScorePayload({ ...validPayload, avgDistanceKm: -5 });
    expect(result.valid).toBe(false);
  });

  test('rejects negative totalTimeTakenSeconds', () => {
    const result = validateScorePayload({ ...validPayload, totalTimeTakenSeconds: -1 });
    expect(result.valid).toBe(false);
  });

  test('collects multiple errors', () => {
    const result = validateScorePayload({
      name: '',
      totalScore: -1,
      difficulty: 'X',
      roundsCount: 99,
      gameMode: 'X',
      gameCategory: 'X',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(5);
  });
});

describe('validateCoordinates', () => {
  test('accepts valid coordinates', () => {
    expect(validateCoordinates({ latitude: 52.52, longitude: 13.405 })).toBe(true);
  });

  test('accepts boundary values', () => {
    expect(validateCoordinates({ latitude: 90, longitude: 180 })).toBe(true);
    expect(validateCoordinates({ latitude: -90, longitude: -180 })).toBe(true);
  });

  test('rejects out-of-range latitude', () => {
    expect(validateCoordinates({ latitude: 91, longitude: 0 })).toBe(false);
    expect(validateCoordinates({ latitude: -91, longitude: 0 })).toBe(false);
  });

  test('rejects out-of-range longitude', () => {
    expect(validateCoordinates({ latitude: 0, longitude: 181 })).toBe(false);
  });

  test('rejects null input', () => {
    expect(validateCoordinates(null)).toBe(false);
  });

  test('rejects non-numeric coordinates', () => {
    expect(validateCoordinates({ latitude: 'abc', longitude: 0 })).toBe(false);
  });

  test('rejects Infinity', () => {
    expect(validateCoordinates({ latitude: Infinity, longitude: 0 })).toBe(false);
  });
});
