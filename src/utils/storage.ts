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

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota full or unavailable
  }
}

// Purge legacy v1 storage keys on startup so all users start fresh on the v2 epoch
(function purgeLegacyV1Storage() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith('pokeshapes:') && key.includes('-v1')) {
        localStorage.removeItem(key);
      }
    }
    indexedDB?.deleteDatabase('pokeshapes-shapes-db-v1');
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
  const saved = readJson<Partial<UserSettings>>(SETTINGS_KEY);
  return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
}

export function saveSettings(settings: UserSettings): void {
  writeJson(SETTINGS_KEY, settings);
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

  const buildModeState = (mode: GameMode): ModeGameState => ({
    mode,
    dateKey,
    targetPokemonId: targets[mode],
    geometrizeSeed: getGeometrizeSeed(dateKey, mode, targets[mode]),
    guesses: [],
    status: 'playing',
  });

  return {
    dateKey,
    puzzleNumber,
    modes: {
      circles: buildModeState('circles'),
      triangles: buildModeState('triangles'),
      lines: buildModeState('lines'),
    },
  };
}

export function loadDailyState(dateKey: string, isToday: boolean = true): DailyGameState {
  const primaryKey = isToday ? DAILY_STATE_KEY : `${ARCHIVE_STATE_PREFIX}${dateKey}`;
  const primary = readJson<DailyGameState>(primaryKey);
  if (primary?.dateKey === dateKey && primary.modes) {
    return primary;
  }

  const fallback = readJson<DailyGameState>(`${ARCHIVE_STATE_PREFIX}${dateKey}`);
  if (fallback?.dateKey === dateKey && fallback.modes) {
    return fallback;
  }

  const fresh = createInitialDailyState(dateKey);
  saveDailyState(fresh, isToday);
  return fresh;
}

export function saveDailyState(state: DailyGameState, isToday: boolean = true): void {
  if (isToday) {
    writeJson(DAILY_STATE_KEY, state);
  }
  writeJson(`${ARCHIVE_STATE_PREFIX}${state.dateKey}`, state);
}

export function loadStats(todayDateKey: string): AllStats {
  let stats = createDefaultStats();
  const parsed = readJson<AllStats>(STATS_KEY);
  if (parsed?.modes) {
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

  let mutated = false;
  (['circles', 'triangles', 'lines'] as GameMode[]).forEach((mode) => {
    const mStats = stats.modes[mode];
    if (mStats.lastWonDateKey && mStats.currentStreak > 0) {
      if (daysBetweenDateKeys(mStats.lastWonDateKey, todayDateKey) > 1) {
        mStats.currentStreak = 0;
        mutated = true;
      }
    }
  });

  if (stats.lastDailyWinDateKey && stats.dailyOverallStreak > 0) {
    if (daysBetweenDateKeys(stats.lastDailyWinDateKey, todayDateKey) > 1) {
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
  writeJson(STATS_KEY, stats);
}

export function recordDailyGameResult(
  currentStats: AllStats,
  mode: GameMode,
  dateKey: string,
  won: boolean,
  guessCount: number,
  allModesState: Record<GameMode, ModeGameState>
): AllStats {
  const mCurrent = currentStats.modes[mode];
  if (mCurrent.lastPlayedDateKey === dateKey) {
    return currentStats;
  }

  const mStats: ModeStats = {
    ...mCurrent,
    played: mCurrent.played + 1,
    lastPlayedDateKey: dateKey,
    guessDistribution: [...mCurrent.guessDistribution],
  };

  const next: AllStats = {
    ...currentStats,
    modes: {
      ...currentStats.modes,
      [mode]: mStats,
    },
    completedTripleCrownDates: [...currentStats.completedTripleCrownDates],
  };

  if (won) {
    mStats.won += 1;
    const distIdx = Math.max(0, Math.min(MAX_GUESSES - 1, guessCount - 1));
    mStats.guessDistribution[distIdx] = (mStats.guessDistribution[distIdx] || 0) + 1;

    const modeGap = mStats.lastWonDateKey
      ? daysBetweenDateKeys(mStats.lastWonDateKey, dateKey)
      : 0;
    mStats.currentStreak = modeGap === 1 ? mStats.currentStreak + 1 : 1;
    mStats.lastWonDateKey = dateKey;
    mStats.maxStreak = Math.max(mStats.maxStreak, mStats.currentStreak);

    if (next.lastDailyWinDateKey !== dateKey) {
      const dailyGap = next.lastDailyWinDateKey
        ? daysBetweenDateKeys(next.lastDailyWinDateKey, dateKey)
        : 0;
      next.dailyOverallStreak = dailyGap === 1 ? next.dailyOverallStreak + 1 : 1;
      next.lastDailyWinDateKey = dateKey;
      next.dailyMaxOverallStreak = Math.max(
        next.dailyMaxOverallStreak,
        next.dailyOverallStreak
      );
    }

    const allThreeWon = (['circles', 'triangles', 'lines'] as GameMode[]).every(
      (m) => (m === mode ? won : allModesState[m]?.status === 'won')
    );
    if (allThreeWon && !next.completedTripleCrownDates.includes(dateKey)) {
      next.tripleCrownDays += 1;
      next.completedTripleCrownDates.push(dateKey);
    }
  } else {
    mStats.currentStreak = 0;
  }

  saveStats(next);
  return next;
}

export function loadPolyDex(): PolyDexMap {
  return readJson<PolyDexMap>(POLYDEX_KEY) || {};
}

export function savePolyDex(dex: PolyDexMap): void {
  writeJson(POLYDEX_KEY, dex);
}

export function recordPolyDexCatch(
  currentDex: PolyDexMap,
  pokemonId: number,
  mode: GameMode,
  dateKey: string
): PolyDexMap {
  const existing = currentDex[pokemonId];
  const next: PolyDexMap = {
    ...currentDex,
    [pokemonId]: existing
      ? {
          ...existing,
          modesCaught: { ...existing.modesCaught, [mode]: true },
          caughtDates: {
            ...existing.caughtDates,
            [mode]: existing.caughtDates?.[mode] || dateKey,
          },
          totalTimesCaught: (existing.totalTimesCaught || 1) + 1,
        }
      : {
          pokemonId,
          modesCaught: { [mode]: true },
          caughtDates: { [mode]: dateKey },
          firstCaughtDate: dateKey,
          totalTimesCaught: 1,
        },
  };

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
      const req = tx.objectStore(IDB_STORE).get(cacheKey);
      req.onsuccess = () => {
        const res = req.result;
        resolve(Array.isArray(res) && res.length > 0 ? res : null);
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

export async function clearAllUserData(): Promise<void> {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (
        key &&
        (key === DAILY_STATE_KEY ||
          key === STATS_KEY ||
          key === POLYDEX_KEY ||
          key.startsWith(ARCHIVE_STATE_PREFIX))
      ) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore localStorage error
  }

  try {
    const db = await openShapesDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const req = tx.objectStore(IDB_STORE).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // Ignore IDB clear error
  }
}
