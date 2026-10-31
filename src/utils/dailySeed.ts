import { GameMode } from '../types/game';

export const EPOCH_YEAR = 2026;
export const EPOCH_MONTH = 10;
export const EPOCH_DAY = 26;
export const TOTAL_MAINLINE_POKEMON = 1025;

const DAY_MS = 86_400_000;

function formatDateParts(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getLocalDateKey(date: Date = new Date()): string {
  return formatDateParts(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function parseDateKeyToUtcMs(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function getOffsetDateKey(baseDateKey: string, offsetDays: number): string {
  const d = new Date(parseDateKeyToUtcMs(baseDateKey) + offsetDays * DAY_MS);
  return formatDateParts(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function getArchiveDateKeys(
  todayDateKey: string,
  maxDays: number = 31
): { dateKey: string; puzzleNumber: number; isToday: boolean; isYesterday: boolean }[] {
  const todayIdx = getDayIndexFromEpoch(todayDateKey);
  const count = Math.min(maxDays, todayIdx + 1);
  return Array.from({ length: count }, (_, i) => {
    const dk = getOffsetDateKey(todayDateKey, -i);
    return {
      dateKey: dk,
      puzzleNumber: getPuzzleNumber(dk),
      isToday: i === 0,
      isYesterday: i === 1,
    };
  });
}

export function daysBetweenDateKeys(startKey: string, endKey: string): number {
  return Math.round((parseDateKeyToUtcMs(endKey) - parseDateKeyToUtcMs(startKey)) / DAY_MS);
}

export function getDayIndexFromEpoch(dateKey: string): number {
  const epochUtc = Date.UTC(EPOCH_YEAR, EPOCH_MONTH - 1, EPOCH_DAY);
  const diffDays = Math.round((parseDateKeyToUtcMs(dateKey) - epochUtc) / DAY_MS);
  return Math.max(0, diffDays);
}

export function getPuzzleNumber(dateKey: string): number {
  return getDayIndexFromEpoch(dateKey) + 1;
}

/**
 * Deterministic 32-bit FNV-1a + Murmur3 avalanche hash.
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

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function () {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
 * Resolves the 3 daily target Pokémon IDs for a dateKey using independent per-mode
 * Fisher-Yates decks and a collision guard so all 3 modes feature distinct Pokémon.
 */
export function getDailyTargets(
  dateKey: string,
  totalPokemon: number = TOTAL_MAINLINE_POKEMON
): Record<GameMode, number> {
  const dayIndex = getDayIndexFromEpoch(dateKey);
  const cycle = Math.floor(dayIndex / totalPokemon);
  const slot = dayIndex % totalPokemon;

  const circlesDeck = buildShuffledDeck(`pokeshapes-deck-v2:circles:cycle-${cycle}`, totalPokemon);
  const trianglesDeck = buildShuffledDeck(`pokeshapes-deck-v2:triangles:cycle-${cycle}`, totalPokemon);
  const linesDeck = buildShuffledDeck(`pokeshapes-deck-v2:lines:cycle-${cycle}`, totalPokemon);

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

export function getGeometrizeSeed(
  dateKey: string,
  mode: GameMode,
  pokemonId: number
): number {
  return hashString(`pokeshapes-geometrize-v2:${dateKey}:${mode}:pokemon-${pokemonId}`);
}
