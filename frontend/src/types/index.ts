export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type RoundsCount = 3 | 5 | 7;
export type GameMode = 'Classic' | 'Zen' | 'Daily' | 'Streak';
export type GameCategory = 'SkyView' | 'CityHunt' | 'FlagMode' | 'SilhouetteMode' | 'ZoomOut' | 'PuzzleMode';

export type PuzzleRegion = 'Europa' | 'Asien' | 'Afrika' | 'Amerika' | 'Ozeanien';

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
  roundsCount: number;
  gameMode: GameMode;
  gameCategory: GameCategory;
  dailyDate?: string;
  puzzleRegion?: PuzzleRegion;
}

export interface GameState extends GameConfig {
  rounds: RoundResult[];
  currentRoundIndex: number;
  phase: 'setup' | 'playing' | 'result' | 'summary';
  streakFailed?: boolean;
}

export const STREAK_THRESHOLD: Record<Difficulty, number> = {
  Easy: 500,
  Medium: 300,
  Hard: 150,
};

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

/** ZoomOut mode: starts close up, zooms out to reveal context */
export const ZOOM_OUT_START: Record<Difficulty, number> = {
  Easy: 16,
  Medium: 17,
  Hard: 18,
};
export const ZOOM_OUT_END: Record<Difficulty, number> = {
  Easy: 6,
  Medium: 10,
  Hard: 13,
};

/** Zoom animation duration for ZoomOut mode */
export const ZOOM_DURATION: Record<Difficulty, number> = {
  Easy: 60,
  Medium: 45,
  Hard: 30,
};

export const ZEN_TIME_BONUS_WINDOW: Record<Difficulty, number> = {
  Easy: 120,
  Medium: 90,
  Hard: 60,
};

/** Puzzle mode: points awarded for correct placement */
export const PUZZLE_CORRECT_SCORE = 1000;
/** Puzzle mode: max time bonus for fast placement */
export const PUZZLE_TIME_BONUS_MAX = 500;
/** Puzzle mode: time window (seconds) for time bonus per difficulty */
export const PUZZLE_TIME_WINDOW: Record<Difficulty, number> = {
  Easy: 30,
  Medium: 20,
  Hard: 15,
};

/** Puzzle regions → which continent values to include */
export const PUZZLE_REGION_CONTINENTS: Record<PuzzleRegion, string[]> = {
  Europa: ['Europa', 'Europa/Asien'],
  Asien: ['Asien', 'Europa/Asien'],
  Afrika: ['Afrika'],
  Amerika: ['Nordamerika', 'Südamerika'],
  Ozeanien: ['Ozeanien'],
};
