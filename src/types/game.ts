import { GuessComparison, PokemonDetails } from './pokemon';

export type GameMode = 'circles' | 'triangles' | 'lines';

export type PlayCategory = 'daily' | 'practice';

export type GameStatus = 'playing' | 'won' | 'lost';

export const INITIAL_SHAPES = 15;
export const SHAPES_PER_WRONG_GUESS = 10;
export const MAX_GUESSES = 10;
export const MAX_SHAPES = INITIAL_SHAPES + (MAX_GUESSES - 1) * SHAPES_PER_WRONG_GUESS; // 105 shapes

export interface GuessRecord {
  pokemon: PokemonDetails;
  comparison: GuessComparison;
  guessNumber: number; // 1..10
  shapesUnlockedAfter: number; // e.g., 25 after 1st wrong guess
  timestamp: number;
}

export interface ModeGameState {
  mode: GameMode;
  dateKey: string; // "YYYY-MM-DD" or "practice-<seed>"
  targetPokemonId: number;
  geometrizeSeed: number;
  guesses: GuessRecord[];
  status: GameStatus;
  completedAt?: number;
}

export interface DailyGameState {
  dateKey: string;
  puzzleNumber: number;
  modes: Record<GameMode, ModeGameState>;
}

export interface ModeStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDateKey: string | null;
  lastWonDateKey: string | null;
  guessDistribution: number[]; // length 10 (index 0 = won in 1 guess, index 9 = won in 10 guesses)
}

export interface AllStats {
  modes: Record<GameMode, ModeStats>;
  dailyOverallStreak: number;
  dailyMaxOverallStreak: number;
  lastDailyWinDateKey: string | null;
  tripleCrownDays: number; // Number of days all 3 modes were won
  completedTripleCrownDates: string[];
}

export type ThemeMode = 'dark' | 'light';
export type ColorBlindMode = 'none' | 'deuteranopia' | 'tritanopia';

export interface UserSettings {
  theme: ThemeMode;
  colorBlindMode: ColorBlindMode;
  highContrastCanvas: boolean;
  animateShapes: boolean;
  showAttributeHints: boolean;
  soundEnabled: boolean;
}
