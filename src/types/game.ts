import { GuessComparison, PokemonDetails } from './pokemon';

export type GameMode = 'circles' | 'triangles' | 'lines';

export type GameStatus = 'playing' | 'won' | 'lost';

export type GenerationFilter = 'all' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const MAX_GUESSES = 10;

export interface ModeShapeConfig {
  initialShapes: number;
  increment: number;
  maxShapes: number;
  tiers: number[];
}

function buildTiers(initial: number, increment: number): number[] {
  return Array.from({ length: MAX_GUESSES }, (_, i) => initial + i * increment);
}

/**
 * Per-mode shape progression rules across 10 guesses:
 * - Circles: starts at 40, +20 per wrong guess (40 -> 220 shapes)
 * - Triangles: starts at 20, +10 per wrong guess (20 -> 110 shapes)
 * - Lines: starts at 50, +25 per wrong guess (50 -> 275 shapes)
 */
export const MODE_SHAPE_CONFIG: Record<GameMode, ModeShapeConfig> = {
  circles: {
    initialShapes: 40,
    increment: 20,
    maxShapes: 40 + (MAX_GUESSES - 1) * 20, // 220
    tiers: buildTiers(40, 20),
  },
  triangles: {
    initialShapes: 20,
    increment: 10,
    maxShapes: 20 + (MAX_GUESSES - 1) * 10, // 110
    tiers: buildTiers(20, 10),
  },
  lines: {
    initialShapes: 50,
    increment: 25,
    maxShapes: 50 + (MAX_GUESSES - 1) * 25, // 275
    tiers: buildTiers(50, 25),
  },
};

export function getModeShapeConfig(mode: GameMode): ModeShapeConfig {
  return MODE_SHAPE_CONFIG[mode];
}

export interface GuessRecord {
  pokemon: PokemonDetails;
  comparison: GuessComparison;
  guessNumber: number; // 1..10
  shapesUnlockedAfter: number;
  timestamp: number;
}

export interface ModeGameState {
  mode: GameMode;
  dateKey: string; // "YYYY-MM-DD"
  targetPokemonId: number;
  geometrizeSeed: number;
  guesses: GuessRecord[];
  status: GameStatus;
  gaveUp?: boolean;
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

export interface PolyDexEntry {
  pokemonId: number;
  modesCaught: Partial<Record<GameMode, boolean>>;
  caughtDates?: Partial<Record<GameMode, string>>;
  firstCaughtDate: string;
  totalTimesCaught: number;
}

export type PolyDexMap = Record<number, PolyDexEntry>;

export interface TrainerRankDefinition {
  min: number;
  title: string;
  badgeColor: string;
}

export interface TrainerRankInfo {
  title: string;
  badgeColor: string;
  minCaught: number;
  nextRankTitle: string | null;
  nextRankTarget: number | null;
}

export type ThemeMode = 'dark' | 'light';
export type ColorBlindMode = 'none' | 'deuteranopia' | 'tritanopia';

export interface UserSettings {
  theme: ThemeMode;
  colorBlindMode: ColorBlindMode;
  highContrastCanvas: boolean;
  animateShapes: boolean;
  soundEnabled: boolean;
}
