import { PokemonDetails } from './pokemon';

export type GameMode = 'circles' | 'triangles' | 'lines';
export type GameStatus = 'playing' | 'won' | 'lost';
export type GenerationFilter = 'all' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const MAX_GUESSES = 10;

export interface ModeShapeConfig {
  initialShapes: number;
  increment: number;
  maxShapes: number;
}

export const MODE_SHAPE_CONFIG: Record<GameMode, ModeShapeConfig> = {
  circles: {
    initialShapes: 40,
    increment: 20,
    maxShapes: 40 + (MAX_GUESSES - 1) * 20,
  },
  triangles: {
    initialShapes: 20,
    increment: 10,
    maxShapes: 20 + (MAX_GUESSES - 1) * 10,
  },
  lines: {
    initialShapes: 50,
    increment: 25,
    maxShapes: 50 + (MAX_GUESSES - 1) * 25,
  },
};

export function getModeShapeConfig(mode: GameMode): ModeShapeConfig {
  return MODE_SHAPE_CONFIG[mode];
}

export interface GuessRecord {
  pokemon: PokemonDetails;
  isCorrect: boolean;
  guessNumber: number;
}

export interface ModeGameState {
  mode: GameMode;
  dateKey: string;
  targetPokemonId: number;
  geometrizeSeed: number;
  guesses: GuessRecord[];
  status: GameStatus;
  gaveUp?: boolean;
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
  guessDistribution: number[];
}

export interface AllStats {
  modes: Record<GameMode, ModeStats>;
  dailyOverallStreak: number;
  dailyMaxOverallStreak: number;
  lastDailyWinDateKey: string | null;
  tripleCrownDays: number;
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
