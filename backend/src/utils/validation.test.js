const { validateName, validateScorePayload, validateCoordinates } = require('./validation');

// ── validateName ─────────────────────────────────────────────────────────────

describe('validateName', () => {
  test('valid names', () => {
    expect(validateName('Alice')).toEqual({ valid: true, value: 'Alice' });
    expect(validateName('a-b_1')).toEqual({ valid: true, value: 'a-b_1' });
    expect(validateName('X')).toEqual({ valid: true, value: 'X' });
  });

  test('trims whitespace', () => {
    expect(validateName('  Bob  ')).toEqual({ valid: true, value: 'Bob' });
  });

  test('empty string rejected', () => {
    expect(validateName('')).toMatchObject({ valid: false });
  });

  test('whitespace-only rejected', () => {
    expect(validateName('   ')).toMatchObject({ valid: false });
  });

  test('exceeds 20 characters rejected', () => {
    expect(validateName('a'.repeat(21))).toMatchObject({ valid: false });
  });

  test('exactly 20 characters accepted', () => {
    expect(validateName('a'.repeat(20))).toMatchObject({ valid: true });
  });

  test('special characters rejected', () => {
    expect(validateName('<script>')).toMatchObject({ valid: false });
    expect(validateName('a b')).toMatchObject({ valid: false });
    expect(validateName('a@b')).toMatchObject({ valid: false });
    expect(validateName('hello!')).toMatchObject({ valid: false });
  });

  test('non-string inputs rejected', () => {
    expect(validateName(123)).toMatchObject({ valid: false });
    expect(validateName(null)).toMatchObject({ valid: false });
    expect(validateName(undefined)).toMatchObject({ valid: false });
  });
});

// ── validateScorePayload ─────────────────────────────────────────────────────

const validPayload = {
  name: 'TestUser',
  totalScore: 15000,
  difficulty: 'Medium',
  roundsCount: 5,
  avgDistanceKm: 123.4,
  gameMode: 'Classic',
  gameCategory: 'SkyView',
  totalTimeTakenSeconds: 90.5,
};

describe('validateScorePayload', () => {
  test('valid payload accepted', () => {
    const result = validateScorePayload(validPayload);
    expect(result).toEqual({ valid: true, name: 'TestUser' });
  });

  test('invalid name rejected', () => {
    const result = validateScorePayload({ ...validPayload, name: '' });
    expect(result.valid).toBe(false);
  });

  test('totalScore must be non-negative integer', () => {
    expect(validateScorePayload({ ...validPayload, totalScore: -1 }).valid).toBe(false);
    expect(validateScorePayload({ ...validPayload, totalScore: 1.5 }).valid).toBe(false);
    expect(validateScorePayload({ ...validPayload, totalScore: 'abc' }).valid).toBe(false);
  });

  test('invalid difficulty rejected', () => {
    expect(validateScorePayload({ ...validPayload, difficulty: 'Extreme' }).valid).toBe(false);
  });

  test('invalid roundsCount rejected', () => {
    expect(validateScorePayload({ ...validPayload, roundsCount: 4 }).valid).toBe(false);
  });

  test('invalid gameMode rejected', () => {
    expect(validateScorePayload({ ...validPayload, gameMode: 'Turbo' }).valid).toBe(false);
  });

  test('invalid gameCategory rejected', () => {
    expect(validateScorePayload({ ...validPayload, gameCategory: 'FreeRoam' }).valid).toBe(false);
  });

  test('avgDistanceKm negative rejected', () => {
    expect(validateScorePayload({ ...validPayload, avgDistanceKm: -5 }).valid).toBe(false);
  });

  test('totalTimeTakenSeconds negative rejected', () => {
    expect(validateScorePayload({ ...validPayload, totalTimeTakenSeconds: -1 }).valid).toBe(false);
  });

  test('optional fields can be null or undefined', () => {
    expect(validateScorePayload({ ...validPayload, avgDistanceKm: null }).valid).toBe(true);
    expect(validateScorePayload({ ...validPayload, avgDistanceKm: undefined }).valid).toBe(true);
    expect(validateScorePayload({ ...validPayload, totalTimeTakenSeconds: null }).valid).toBe(true);
  });

  test('multiple errors collected', () => {
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

// ── validateCoordinates ──────────────────────────────────────────────────────

describe('validateCoordinates', () => {
  test('valid coordinates', () => {
    expect(validateCoordinates({ latitude: 52.52, longitude: 13.405 })).toBe(true);
  });

  test('boundary values accepted', () => {
    expect(validateCoordinates({ latitude: 90, longitude: 180 })).toBe(true);
    expect(validateCoordinates({ latitude: -90, longitude: -180 })).toBe(true);
  });

  test('out of range rejected', () => {
    expect(validateCoordinates({ latitude: 91, longitude: 0 })).toBe(false);
    expect(validateCoordinates({ latitude: 0, longitude: 181 })).toBe(false);
  });

  test('Infinity rejected', () => {
    expect(validateCoordinates({ latitude: Infinity, longitude: 0 })).toBe(false);
    expect(validateCoordinates({ latitude: 0, longitude: -Infinity })).toBe(false);
  });

  test('NaN rejected', () => {
    expect(validateCoordinates({ latitude: NaN, longitude: 0 })).toBe(false);
  });

  test('null and non-object rejected', () => {
    expect(validateCoordinates(null)).toBe(false);
    expect(validateCoordinates(undefined)).toBe(false);
    expect(validateCoordinates('string')).toBe(false);
  });

  test('missing fields rejected', () => {
    expect(validateCoordinates({ latitude: 52 })).toBe(false);
    expect(validateCoordinates({ longitude: 13 })).toBe(false);
    expect(validateCoordinates({})).toBe(false);
  });
});
