import { GameMode } from '../types/game';

/**
 * PokéShapes Epoch Date (Puzzle #1 = 2026-09-22 so Archive has 30+ playable past days immediately)
 * Stored as UTC midnight components of local calendar date to avoid DST drift.
 */
export const EPOCH_YEAR = 2026;
export const EPOCH_MONTH = 9; // September (1-indexed)
export const EPOCH_DAY = 22;
export const TOTAL_MAINLINE_POKEMON = 1025;

/**
 * Returns the local calendar date string in "YYYY-MM-DD" format.
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the "YYYY-MM-DD" dateKey offset by `offsetDays` from `baseDateKey`.
 * e.g., offsetDateKey("2026-10-22", -1) => "2026-10-21" (Yesterday).
 */
export function getOffsetDateKey(baseDateKey: string, offsetDays: number): string {
  const utcMs = parseDateKeyToUtcMs(baseDateKey) + offsetDays * 86_400_000;
  const d = new Date(utcMs);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates a list of playable Archive dateKeys from today back to Epoch (up to `maxDays`).
 */
export function getArchiveDateKeys(
  todayDateKey: string,
  maxDays: number = 31
): { dateKey: string; puzzleNumber: number; isToday: boolean; isYesterday: boolean }[] {
  const todayIdx = getDayIndexFromEpoch(todayDateKey);
  const count = Math.min(maxDays, todayIdx + 1);
  const list = [];
  for (let i = 0; i < count; i++) {
    const dk = getOffsetDateKey(todayDateKey, -i);
    list.push({
      dateKey: dk,
      puzzleNumber: getPuzzleNumber(dk),
      isToday: i === 0,
      isYesterday: i === 1,
    });
  }
  return list;
}

/**
 * Parses a "YYYY-MM-DD" date key into a UTC timestamp at 00:00:00.
 */
export function parseDateKeyToUtcMs(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) {
    const now = new Date();
    return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return Date.UTC(y, m - 1, d);
}

/**
 * Computes the number of calendar days between two "YYYY-MM-DD" keys.
 */
export function daysBetweenDateKeys(startKey: string, endKey: string): number {
  const startMs = parseDateKeyToUtcMs(startKey);
  const endMs = parseDateKeyToUtcMs(endKey);
  return Math.round((endMs - startMs) / 86_400_000);
}

/**
 * Returns the 0-based day index since the PokéShapes Epoch.
 */
export function getDayIndexFromEpoch(dateKey: string): number {
  const epochUtc = Date.UTC(EPOCH_YEAR, EPOCH_MONTH - 1, EPOCH_DAY);
  const currentUtc = parseDateKeyToUtcMs(dateKey);
  const diffDays = Math.round((currentUtc - epochUtc) / 86_400_000);
  return Math.max(0, diffDays);
}

/**
 * Returns the 1-based Daily Puzzle Number (#1, #2, #3, ...).
 */
export function getPuzzleNumber(dateKey: string): number {
  return getDayIndexFromEpoch(dateKey) + 1;
}

/**
 * Deterministic 32-bit string hash (FNV-1a + Murmur3 finalizer avalanche).
 */
export function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Mulberry32 deterministic 32-bit PRNG returning floats in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function () {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds a deterministically shuffled deck of Pokemon IDs [1..totalPokemon]
 * using Fisher-Yates shuffle seeded by `seedStr`.
 * Guarantees zero repeat Pokemon within a full 1,025-day cycle.
 */
export function buildShuffledDeck(
  seedStr: string,
  totalPokemon: number = TOTAL_MAINLINE_POKEMON
): number[] {
  const deck = Array.from({ length: totalPokemon }, (_, i) => i + 1);
  const rng = mulberry32(hashString(seedStr));

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }

  return deck;
}

/**
 * Resolves the 3 daily target Pokemon IDs for a given "YYYY-MM-DD" dateKey.
 * Uses independent cycle permutations per mode + a cross-mode collision guard
 * so Circles, Triangles, and Lines are guaranteed to be 3 distinct Pokemon every day.
 */
export function getDailyTargets(
  dateKey: string,
  totalPokemon: number = TOTAL_MAINLINE_POKEMON
): Record<GameMode, number> {
  const dayIndex = getDayIndexFromEpoch(dateKey);
  const cycle = Math.floor(dayIndex / totalPokemon);
  const slot = dayIndex % totalPokemon;

  const circlesDeck = buildShuffledDeck(`pokeshapes-deck-v1:circles:cycle-${cycle}`, totalPokemon);
  const trianglesDeck = buildShuffledDeck(`pokeshapes-deck-v1:triangles:cycle-${cycle}`, totalPokemon);
  const linesDeck = buildShuffledDeck(`pokeshapes-deck-v1:lines:cycle-${cycle}`, totalPokemon);

  const circlesId = circlesDeck[slot];

  let tSlot = slot;
  while (trianglesDeck[tSlot] === circlesId) {
    tSlot = (tSlot + 1) % totalPokemon;
  }
  const trianglesId = trianglesDeck[tSlot];

  let lSlot = slot;
  while (linesDeck[lSlot] === circlesId || linesDeck[lSlot] === trianglesId) {
    lSlot = (lSlot + 1) % totalPokemon;
  }
  const linesId = linesDeck[lSlot];

  return {
    circles: circlesId,
    triangles: trianglesId,
    lines: linesId,
  };
}

/**
 * Generates a deterministic 32-bit seed for the Geometrize Web Worker
 * so every player on the same day gets the exact same 105 geometric shapes.
 */
export function getGeometrizeSeed(
  dateKey: string,
  mode: GameMode,
  pokemonId: number
): number {
  return hashString(`pokeshapes-geometrize-v1:${dateKey}:${mode}:pokemon-${pokemonId}`);
}
