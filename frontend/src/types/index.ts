export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type RoundsCount = 3 | 5 | 7;
export type GameMode = 'Classic' | 'Zen';
export type GameCategory = 'SkyView' | 'CityHunt';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RoundResult {
  roundNumber: number;
  targetLocation: LatLng;
  playerGuess: LatLng | null;
  distanceKm: number | null;
  score: number;
  timedOut: boolean;
  timeTakenSeconds: number | null;
  cityName?: string;
  countryName?: string;
}

export interface GameConfig {
  playerName: string;
  difficulty: Difficulty;
  roundsCount: RoundsCount;
  gameMode: GameMode;
  gameCategory: GameCategory;
}

export interface GameState extends GameConfig {
  rounds: RoundResult[];
  currentRoundIndex: number;
  phase: 'setup' | 'playing' | 'result' | 'summary';
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  totalScore: number;
  difficulty: Difficulty;
  roundsCount: number;
  avgDistanceKm: number | null;
  gameMode: GameMode;
  gameCategory: GameCategory;
  totalTimeTakenSeconds: number | null;
  scorePerRound: number;
  timestamp: string;
}

export interface DiscoverData {
  changelog: ChangelogEntry[];
  upcomingModes: UpcomingMode[];
  socialSharing: SocialSharing;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  entries: string[];
}

export interface UpcomingMode {
  title: string;
  description: string;
  url: string;
}

export interface SocialSharing {
  twitter?: string;
  whatsapp?: string;
  facebook?: string;
}

export const DIFFICULTY_TIMER: Record<Difficulty, number> = {
  Easy: 60,
  Medium: 45,
  Hard: 30,
};

export const DIFFICULTY_ZOOM: Record<Difficulty, number> = {
  Easy: 6,
  Medium: 10,
  Hard: 13,
};

export const ZEN_TIME_BONUS_WINDOW: Record<Difficulty, number> = {
  Easy: 120,
  Medium: 90,
  Hard: 60,
};
