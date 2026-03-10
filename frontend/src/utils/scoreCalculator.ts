const MAX_SCORE = 5000;
const MAX_DISTANCE_KM = 5000;
const MAX_DISTANCE_SCORE_ZEN = 4000;

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

/**
 * Calculates the distance score for Zen mode (max 4000).
 * Combined with time bonus (max 1000) the total max equals 5000,
 * matching Classic mode's maximum for fair leaderboard comparison.
 */
export function calculateZenDistanceScore(distanceKm: number): number {
  if (distanceKm <= 0) return MAX_DISTANCE_SCORE_ZEN;
  return Math.max(0, Math.floor(MAX_DISTANCE_SCORE_ZEN * (1 - distanceKm / MAX_DISTANCE_KM)));
}

const MAX_TIME_BONUS = 1000;

/**
 * Calculates the time bonus for Zen mode.
 * Faster guesses earn more bonus points, scaled by difficulty.
 */
export function calculateTimeBonus(elapsedSeconds: number, timeBonusWindow: number): number {
  if (elapsedSeconds <= 0) return MAX_TIME_BONUS;
  if (elapsedSeconds >= timeBonusWindow) return 0;
  return Math.max(0, Math.floor(MAX_TIME_BONUS * (1 - elapsedSeconds / timeBonusWindow)));
}

export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${Math.round(km).toLocaleString('de-DE')} km`;
}

export function formatScore(score: number): string {
  return score.toLocaleString('de-DE');
}
