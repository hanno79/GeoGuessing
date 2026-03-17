const { haversineDistance } = require('./haversine');

describe('haversineDistance', () => {
  test('same point returns 0', () => {
    expect(haversineDistance(52.52, 13.405, 52.52, 13.405)).toBe(0);
  });

  test('Berlin to Paris ≈ 878 km', () => {
    const dist = haversineDistance(52.52, 13.405, 48.8566, 2.3522);
    expect(dist).toBeGreaterThan(876);
    expect(dist).toBeLessThan(880);
  });

  test('antipodal points ≈ 20015 km', () => {
    const dist = haversineDistance(0, 0, 0, 180);
    expect(dist).toBeGreaterThan(20010);
    expect(dist).toBeLessThan(20020);
  });

  test('date-line crossing', () => {
    const dist = haversineDistance(0, 179, 0, -179);
    expect(dist).toBeGreaterThan(220);
    expect(dist).toBeLessThan(225);
  });

  test('equator 1 degree longitude ≈ 111 km', () => {
    const dist = haversineDistance(0, 0, 0, 1);
    expect(dist).toBeGreaterThan(110);
    expect(dist).toBeLessThan(112);
  });

  test('NaN inputs return 0', () => {
    expect(haversineDistance(NaN, 0, 0, 0)).toBe(0);
    expect(haversineDistance(0, NaN, 0, 0)).toBe(0);
  });
});
