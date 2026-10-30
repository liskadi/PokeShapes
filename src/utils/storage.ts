import {
  AllStats,
  DailyGameState,
  GameMode,
  MAX_GUESSES,
  ModeGameState,
  ModeStats,
  PolyDexMap,
  TrainerRankDefinition,
  TrainerRankInfo,
  UserSettings,
} from '../types/game';
import {
  daysBetweenDateKeys,
  getDailyTargets,
  getGeometrizeSeed,
  getPuzzleNumber,
} from './dailySeed';

const DAILY_STATE_KEY = 'pokeshapes:daily-state-v2';
const ARCHIVE_STATE_PREFIX = 'pokeshapes:archive-state-v2:';
const STATS_KEY = 'pokeshapes:stats-v2';
const POLYDEX_KEY = 'pokeshapes:polydex-v2';
const SETTINGS_KEY = 'pokeshapes:settings-v2';
const ONBOARDED_KEY = 'pokeshapes:onboarded-v2';

const IDB_NAME = 'pokeshapes-shapes-db-v2';
const IDB_STORE = 'shapes';

// Automatically purge legacy v1 storage keys on startup so all users start fresh on the v2 epoch
(function purgeLegacyV1Storage() {
  try {
    if (typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('pokeshapes:') && key.includes('-v1')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
    if (typeof indexedDB !== 'undefined') {
      indexedDB.deleteDatabase('pokeshapes-shapes-db-v1');
    }
  } catch {
    // Ignore storage cleanup error
  }
})();

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  colorBlindMode: 'none',
  highContrastCanvas: false,
  animateShapes: true,
  soundEnabled: true,
};

export const TRAINER_RANKS: TrainerRankDefinition[] = [
  {
    min: 0,
    title: 'Rookie Scanner',
    badgeColor: 'text-slate-400 bg-slate-500/15 border-slate-500/30',
  },
  {
    min: 3,
    title: 'Bug Catcher',
    badgeColor: 'text-lime-500 dark:text-lime-400 bg-lime-500/15 border-lime-500/30',
  },
  {
    min: 10,
    title: 'Poké Maniac',
    badgeColor: 'text-sky-500 dark:text-sky-400 bg-sky-500/15 border-sky-500/30',
  },
  {
    min: 25,
    title: 'Ace Trainer',
    badgeColor: 'text-purple-500 dark:text-purple-400 bg-purple-500/15 border-purple-500/30',
  },
  {
    min: 50,
    title: 'Gym Leader',
    badgeColor: 'text-rose-500 dark:text-rose-400 bg-rose-500/15 border-rose-500/30',
  },
  {
    min: 100,
    title: 'Elite Four',
    badgeColor: 'text-amber-500 dark:text-amber-400 bg-amber-500/15 border-amber-500/30',
  },
  {
    min: 250,
    title: 'Grand Master',
    badgeColor: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
  },
];

function createEmptyModeStats(): ModeStats {
  return {
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastPlayedDateKey: null,
    lastWonDateKey: null,
    guessDistribution: Array(MAX_GUESSES).fill(0),
  };
}

export function createDefaultStats(): AllStats {
  return {
    modes: {
      circles: createEmptyModeStats(),
      triangles: createEmptyModeStats(),
      lines: createEmptyModeStats(),
    },
    dailyOverallStreak: 0,
    dailyMaxOverallStreak: 0,
    lastDailyWinDateKey: null,
    tripleCrownDays: 0,
    completedTripleCrownDates: [],
  };
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage error
  }
}

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markOnboardingSeen(): void {
  try {
    localStorage.setItem(ONBOARDED_KEY, 'true');
  } catch {
    // Ignore
  }
}

export function createInitialDailyState(dateKey: string): DailyGameState {
  const targets = getDailyTargets(dateKey);
  const puzzleNumber = getPuzzleNumber(dateKey);

  const modes: Record<GameMode, ModeGameState> = {
    circles: {
      mode: 'circles',
      dateKey,
      targetPokemonId: targets.circles,
      geometrizeSeed: getGeometrizeSeed(dateKey, 'circles', targets.circles),
      guesses: [],
      status: 'playing',
    },
    triangles: {
      mode: 'triangles',
      dateKey,
      targetPokemonId: targets.triangles,
      geometrizeSeed: getGeometrizeSeed(dateKey, 'triangles', targets.triangles),
      guesses: [],
      status: 'playing',
    },
    lines: {
      mode: 'lines',
      dateKey,
      targetPokemonId: targets.lines,
      geometrizeSeed: getGeometrizeSeed(dateKey, 'lines', targets.lines),
      guesses: [],
      status: 'playing',
    },
  };

  return {
    dateKey,
    puzzleNumber,
    modes,
  };
}

export function loadDailyState(dateKey: string, isToday: boolean = true): DailyGameState {
  const storageKey = isToday
    ? DAILY_STATE_KEY
    : `${ARCHIVE_STATE_PREFIX}${dateKey}`;

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyGameState;
      if (parsed && parsed.dateKey === dateKey && parsed.modes) {
        return parsed;
      }
    }
    // Also check archive prefix in case today rolled over or vice versa
    const fallbackRaw = localStorage.getItem(`${ARCHIVE_STATE_PREFIX}${dateKey}`);
    if (fallbackRaw) {
      const parsed = JSON.parse(fallbackRaw) as DailyGameState;
      if (parsed && parsed.dateKey === dateKey && parsed.modes) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse error
  }

  const fresh = createInitialDailyState(dateKey);
  saveDailyState(fresh, isToday);
  return fresh;
}

export function saveDailyState(state: DailyGameState, isToday: boolean = true): void {
  try {
    if (isToday) {
      localStorage.setItem(DAILY_STATE_KEY, JSON.stringify(state));
    }
    localStorage.setItem(
      `${ARCHIVE_STATE_PREFIX}${state.dateKey}`,
      JSON.stringify(state)
    );
  } catch {
    // Ignore storage error
  }
}

export function loadStats(todayDateKey: string): AllStats {
  let stats = createDefaultStats();
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AllStats;
      if (parsed && parsed.modes) {
        stats = {
          ...stats,
          ...parsed,
          modes: {
            circles: { ...createEmptyModeStats(), ...parsed.modes.circles },
            triangles: { ...createEmptyModeStats(), ...parsed.modes.triangles },
            lines: { ...createEmptyModeStats(), ...parsed.modes.lines },
          },
        };
      }
    }
  } catch {
    // Ignore parse error
  }

  // Reconcile streaks if the user missed more than 1 calendar day
  let mutated = false;
  (['circles', 'triangles', 'lines'] as GameMode[]).forEach((mode) => {
    const mStats = stats.modes[mode];
    if (mStats.lastWonDateKey && mStats.currentStreak > 0) {
      const gap = daysBetweenDateKeys(mStats.lastWonDateKey, todayDateKey);
      if (gap > 1) {
        mStats.currentStreak = 0;
        mutated = true;
      }
    }
  });

  if (stats.lastDailyWinDateKey && stats.dailyOverallStreak > 0) {
    const gap = daysBetweenDateKeys(stats.lastDailyWinDateKey, todayDateKey);
    if (gap > 1) {
      stats.dailyOverallStreak = 0;
      mutated = true;
    }
  }

  if (mutated) {
    saveStats(stats);
  }

  return stats;
}

export function saveStats(stats: AllStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage error
  }
}

/**
 * Records a completed daily game (won or lost) into lifetime statistics.
 * Playing past archive puzzles (`isTodayPuzzle === false`) does NOT affect any statistics or streaks.
 */
export function recordDailyGameResult(
  currentStats: AllStats,
  mode: GameMode,
  dateKey: string,
  won: boolean,
  guessCount: number,
  allModesState: Record<GameMode, ModeGameState>,
  isTodayPuzzle: boolean = true
): AllStats {
  // Past archive games never modify stats or streaks
  if (!isTodayPuzzle) {
    return currentStats;
  }

  const next: AllStats = JSON.parse(JSON.stringify(currentStats));
  const mStats = next.modes[mode];

  // Prevent double-counting the same mode on the same dateKey
  if (mStats.lastPlayedDateKey === dateKey) {
    return next;
  }

  mStats.played += 1;
  mStats.lastPlayedDateKey = dateKey;

  if (won) {
    mStats.won += 1;
    const distIdx = Math.max(0, Math.min(MAX_GUESSES - 1, guessCount - 1));
    mStats.guessDistribution[distIdx] =
      (mStats.guessDistribution[distIdx] || 0) + 1;

    if (mStats.lastWonDateKey) {
      const gap = daysBetweenDateKeys(mStats.lastWonDateKey, dateKey);
      if (gap === 1) {
        mStats.currentStreak += 1;
      } else if (gap > 1) {
        mStats.currentStreak = 1;
      }
    } else {
      mStats.currentStreak = 1;
    }

    mStats.lastWonDateKey = dateKey;
    if (mStats.currentStreak > mStats.maxStreak) {
      mStats.maxStreak = mStats.currentStreak;
    }

    // Update overall daily streak (at least 1 mode won today)
    if (next.lastDailyWinDateKey !== dateKey) {
      if (next.lastDailyWinDateKey) {
        const dailyGap = daysBetweenDateKeys(
          next.lastDailyWinDateKey,
          dateKey
        );
        if (dailyGap === 1) {
          next.dailyOverallStreak += 1;
        } else {
          next.dailyOverallStreak = 1;
        }
      } else {
        next.dailyOverallStreak = 1;
      }
      next.lastDailyWinDateKey = dateKey;
      if (next.dailyOverallStreak > next.dailyMaxOverallStreak) {
        next.dailyMaxOverallStreak = next.dailyOverallStreak;
      }
    }

    // Check if all 3 modes are now won for today's dateKey (Triple Crown!)
    const allThreeWon = (['circles', 'triangles', 'lines'] as GameMode[]).every(
      (m) => (m === mode ? won : allModesState[m]?.status === 'won')
    );
    if (allThreeWon && !next.completedTripleCrownDates.includes(dateKey)) {
      next.tripleCrownDays += 1;
      next.completedTripleCrownDates.push(dateKey);
    }
  } else {
    // Loss resets current streak for this mode
    mStats.currentStreak = 0;
  }

  saveStats(next);
  return next;
}

/**
 * 2.4 PolyDex Collection & Trainer Ranks Persistence
 */
export function loadPolyDex(): PolyDexMap {
  try {
    const raw = localStorage.getItem(POLYDEX_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PolyDexMap;
  } catch {
    return {};
  }
}

export function savePolyDex(dex: PolyDexMap): void {
  try {
    localStorage.setItem(POLYDEX_KEY, JSON.stringify(dex));
  } catch {
    // Ignore storage error
  }
}

export function recordPolyDexCatch(
  currentDex: PolyDexMap,
  pokemonId: number,
  mode: GameMode,
  dateKey: string
): PolyDexMap {
  const next: PolyDexMap = { ...currentDex };
  const existing = next[pokemonId];

  if (existing) {
    next[pokemonId] = {
      ...existing,
      modesCaught: {
        ...existing.modesCaught,
        [mode]: true,
      },
      caughtDates: {
        ...(existing.caughtDates || {}),
        [mode]: existing.caughtDates?.[mode] || dateKey,
      },
      totalTimesCaught: (existing.totalTimesCaught || 1) + 1,
    };
  } else {
    next[pokemonId] = {
      pokemonId,
      modesCaught: { [mode]: true },
      caughtDates: { [mode]: dateKey },
      firstCaughtDate: dateKey,
      totalTimesCaught: 1,
    };
  }

  savePolyDex(next);
  return next;
}

export function getTrainerRank(uniqueCaughtCount: number): TrainerRankInfo {
  let currentIdx = 0;
  for (let i = 0; i < TRAINER_RANKS.length; i++) {
    if (uniqueCaughtCount >= TRAINER_RANKS[i].min) {
      currentIdx = i;
    }
  }

  const current = TRAINER_RANKS[currentIdx];
  const next = TRAINER_RANKS[currentIdx + 1] || null;

  return {
    title: current.title,
    badgeColor: current.badgeColor,
    minCaught: current.min,
    nextRankTitle: next ? next.title : null,
    nextRankTarget: next ? next.min : null,
  };
}

/**
 * IndexedDB helper to cache the SVG shape strings per puzzle so reloading is instant.
 */
function openShapesDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getCachedShapes(cacheKey: string): Promise<string[] | null> {
  try {
    const db = await openShapesDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(cacheKey);
      req.onsuccess = () => {
        const res = req.result;
        if (Array.isArray(res) && res.length > 0) {
          resolve(res);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setCachedShapes(
  cacheKey: string,
  shapes: string[],
  activeDateKey: string
): Promise<void> {
  try {
    const db = await openShapesDb();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);

    // Keep cache bounded to recent entries (max 45 puzzles)
    const keysReq = store.getAllKeys();
    keysReq.onsuccess = () => {
      const keys = keysReq.result as string[];
      if (keys.length > 45) {
        const toDelete = keys
          .filter((k) => typeof k === 'string' && !k.startsWith(activeDateKey))
          .slice(0, keys.length - 45);
        for (const k of toDelete) {
          store.delete(k);
        }
      }
    };

    store.put(shapes, cacheKey);
  } catch {
    // Ignore IDB write error
  }
}

/**
 * Resets all user gameplay data (Daily state, Archive states, Statistics, Streaks, PolyDex, and cached shapes).
 */
export async function clearAllUserData(): Promise<void> {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key === DAILY_STATE_KEY ||
          key === STATS_KEY ||
          key === POLYDEX_KEY ||
          key.startsWith(ARCHIVE_STATE_PREFIX) ||
          key.startsWith('pokeshapes:daily-state') ||
          key.startsWith('pokeshapes:archive-state') ||
          key.startsWith('pokeshapes:stats') ||
          key.startsWith('pokeshapes:polydex'))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore localStorage error
  }

  try {
    const db = await openShapesDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // Ignore IDB clear error
  }
}
