const { haversineDistance } = require('../src/utils/haversine');

describe('haversineDistance', () => {
  test('returns 0 for identical points', () => {
    expect(haversineDistance(52.52, 13.405, 52.52, 13.405)).toBe(0);
  });

  test('calculates distance between Berlin and Paris (~878 km)', () => {
    const dist = haversineDistance(52.52, 13.405, 48.8566, 2.3522);
    expect(dist).toBeGreaterThan(870);
    expect(dist).toBeLessThan(890);
  });

  test('calculates distance between New York and London (~5570 km)', () => {
    const dist = haversineDistance(40.7128, -74.006, 51.5074, -0.1278);
    expect(dist).toBeGreaterThan(5550);
    expect(dist).toBeLessThan(5600);
  });

  test('calculates distance between antipodal points (~20015 km)', () => {
    const dist = haversineDistance(0, 0, 0, 180);
    expect(dist).toBeGreaterThan(20000);
    expect(dist).toBeLessThan(20100);
  });

  test('handles negative coordinates (Sydney to Buenos Aires)', () => {
    const dist = haversineDistance(-33.8688, 151.2093, -34.6037, -58.3816);
    expect(dist).toBeGreaterThan(11000);
    expect(dist).toBeLessThan(12500);
  });

  test('returns 0 for NaN inputs instead of NaN', () => {
    expect(haversineDistance(NaN, 0, 0, 0)).toBe(0);
  });
});
