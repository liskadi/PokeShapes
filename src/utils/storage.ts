import {
  AllStats,
  DailyGameState,
  GameMode,
  MAX_GUESSES,
  ModeGameState,
  ModeStats,
  UserSettings,
} from '../types/game';
import {
  daysBetweenDateKeys,
  getDailyTargets,
  getGeometrizeSeed,
  getPuzzleNumber,
} from './dailySeed';

const DAILY_STATE_KEY = 'polymon:daily-state-v1';
const STATS_KEY = 'polymon:stats-v1';
const SETTINGS_KEY = 'polymon:settings-v1';
const ONBOARDED_KEY = 'polymon:onboarded-v1';

const IDB_NAME = 'polymon-shapes-db-v1';
const IDB_STORE = 'shapes';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  colorBlindMode: 'none',
  highContrastCanvas: false,
  animateShapes: true,
  showAttributeHints: true,
  soundEnabled: true,
};

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

export function loadDailyState(todayDateKey: string): DailyGameState {
  try {
    const raw = localStorage.getItem(DAILY_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyGameState;
      // If saved state matches today's dateKey, restore it!
      if (parsed && parsed.dateKey === todayDateKey && parsed.modes) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse error
  }

  // Otherwise initialize a fresh Daily Game State for todayDateKey
  const fresh = createInitialDailyState(todayDateKey);
  saveDailyState(fresh);
  return fresh;
}

export function saveDailyState(state: DailyGameState): void {
  try {
    localStorage.setItem(DAILY_STATE_KEY, JSON.stringify(state));
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
 */
export function recordDailyGameResult(
  currentStats: AllStats,
  mode: GameMode,
  dateKey: string,
  won: boolean,
  guessCount: number,
  allModesState: Record<GameMode, ModeGameState>
): AllStats {
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
    mStats.guessDistribution[distIdx] = (mStats.guessDistribution[distIdx] || 0) + 1;

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
        const dailyGap = daysBetweenDateKeys(next.lastDailyWinDateKey, dateKey);
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

    // Check if all 3 modes are now won today (Triple Crown!)
    const allThreeWon = (['circles', 'triangles', 'lines'] as GameMode[]).every(
      (m) => (m === mode ? won : allModesState[m]?.status === 'won')
    );
    if (
      allThreeWon &&
      !next.completedTripleCrownDates.includes(dateKey)
    ) {
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
 * IndexedDB helper to cache the 105 SVG shape strings per puzzle so reloading is instant.
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

    // Prune stale daily cache entries from older dates
    const keysReq = store.getAllKeys();
    keysReq.onsuccess = () => {
      const keys = keysReq.result as string[];
      for (const k of keys) {
        if (
          typeof k === 'string' &&
          !k.startsWith(activeDateKey) &&
          !k.startsWith('practice-')
        ) {
          store.delete(k);
        }
      }
    };

    store.put(shapes, cacheKey);
  } catch {
    // Ignore IDB write error
  }
}
