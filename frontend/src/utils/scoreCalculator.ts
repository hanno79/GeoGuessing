const MAX_SCORE = 5000;
const MAX_DISTANCE_KM = 5000;

/**
 * Calculates the round score based on distance.
 * Formula: Math.max(0, Math.floor(5000 * (1 - distanceKm / 5000)))
 * - Perfect guess (0 km) → 5000 points
 * - 5000 km or more  → 0 points
 */
export function calculateScore(distanceKm: number): number {
  if (distanceKm <= 0) return MAX_SCORE;
  return Math.max(0, Math.floor(MAX_SCORE * (1 - distanceKm / MAX_DISTANCE_KM)));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${Math.round(km).toLocaleString('de-DE')} km`;
}

export function formatScore(score: number): string {
  return score.toLocaleString('de-DE');
}
