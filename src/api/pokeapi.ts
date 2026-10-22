import {
  DirectionHint,
  GuessComparison,
  MatchStatus,
  PokemonDetails,
  PokemonIndexEntry,
} from '../types/pokemon';
import { TOTAL_MAINLINE_POKEMON } from '../utils/dailySeed';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const INDEX_CACHE_KEY = 'polymon:pokemon-index-v1';
const DETAILS_CACHE_PREFIX = 'polymon:pokemon-detail-v1:';

const memoryDetailsCache = new Map<number, PokemonDetails>();
let memoryIndexCache: PokemonIndexEntry[] | null = null;

/**
 * Determines the Pokemon Generation (1-9) from its National Pokedex ID.
 */
export function getGenerationById(id: number): number {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  if (id <= 649) return 5;
  if (id <= 721) return 6;
  if (id <= 809) return 7;
  if (id <= 905) return 8;
  return 9;
}

export function getGenerationRoman(gen: number): string {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
  return romans[gen - 1] || String(gen);
}

/**
 * Formats a PokeAPI slug name into a human-friendly Pokemon display name.
 */
export function formatPokemonName(slug: string): string {
  const specialNames: Record<string, string> = {
    'nidoran-f': 'Nidoran♀',
    'nidoran-m': 'Nidoran♂',
    'mr-mime': 'Mr. Mime',
    'mr-rime': 'Mr. Rime',
    'mime-jr': 'Mime Jr.',
    'farfetchd': "Farfetch'd",
    'sirfetchd': "Sirfetch'd",
    'ho-oh': 'Ho-Oh',
    'porygon-z': 'Porygon-Z',
    'type-null': 'Type: Null',
    'jangmo-o': 'Jangmo-o',
    'hakamo-o': 'Hakamo-o',
    'kommo-o': 'Kommo-o',
    'tapu-koko': 'Tapu Koko',
    'tapu-lele': 'Tapu Lele',
    'tapu-bulu': 'Tapu Bulu',
    'tapu-fini': 'Tapu Fini',
    'flabebe': 'Flabébé',
    'chi-yu': 'Chi-Yu',
    'chien-pao': 'Chien-Pao',
    'ting-lu': 'Ting-Lu',
    'wo-chien': 'Wo-Chien',
  };

  if (specialNames[slug]) {
    return specialNames[slug];
  }

  // Strip form suffixes for species that PokeAPI returns with default form suffix (e.g., deoxys-normal, giratina-altered)
  const formSuffixes = [
    '-normal',
    '-altered',
    '-land',
    '-red-striped',
    '-standard',
    '-incarnate',
    '-ordinary',
    '-aria',
    '-male',
    '-shield',
    '-average',
    '-50',
    '-baile',
    '-midday',
    '-solo',
    '-red-meteor',
    '-disguised',
    '-amped',
    '-ice',
    '-full-belly',
    '-single-strike',
    '-green-plumage',
    '-family-of-four',
    '-zero',
    '-curly',
    '-two-segment',
  ];

  let cleaned = slug;
  for (const suffix of formSuffixes) {
    if (cleaned.endsWith(suffix)) {
      cleaned = cleaned.slice(0, -suffix.length);
      break;
    }
  }

  return cleaned
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Constructs the default Official Artwork URL matching PokeAPI's `sprites.other['official-artwork'].front_default`.
 */
export function getDefaultOfficialArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

/**
 * Fetches the master directory of all 1,025 Pokemon from PokeAPI v2.
 */
export async function fetchPokemonIndex(): Promise<PokemonIndexEntry[]> {
  if (memoryIndexCache && memoryIndexCache.length > 0) {
    return memoryIndexCache;
  }

  try {
    const cachedRaw = localStorage.getItem(INDEX_CACHE_KEY);
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw) as PokemonIndexEntry[];
      if (Array.isArray(parsed) && parsed.length >= 1000) {
        memoryIndexCache = parsed;
        return parsed;
      }
    }
  } catch {
    // Ignore localStorage parse error and refetch
  }

  const response = await fetch(
    `${POKEAPI_BASE}/pokemon?limit=${TOTAL_MAINLINE_POKEMON}&offset=0`
  );
  if (!response.ok) {
    throw new Error(`PokéAPI index request failed with status ${response.status}`);
  }

  const data = await response.json();
  const entries: PokemonIndexEntry[] = (data.results || []).map(
    (item: { name: string; url: string }, idx: number) => {
      const match = item.url.match(/\/pokemon\/(\d+)\/?$/);
      const id = match ? parseInt(match[1], 10) : idx + 1;
      return {
        id,
        name: item.name,
        displayName: formatPokemonName(item.name),
        generation: getGenerationById(id),
        officialArtworkUrl: getDefaultOfficialArtworkUrl(id),
      };
    }
  );

  memoryIndexCache = entries;
  try {
    localStorage.setItem(INDEX_CACHE_KEY, JSON.stringify(entries));
  } catch {
    // Storage quota full, ignore
  }

  return entries;
}

/**
 * Fetches full Pokemon details from `GET https://pokeapi.co/api/v2/pokemon/{id}`
 * Explicitly extracts `sprites.other['official-artwork'].front_default` as required.
 */
export async function fetchPokemonDetails(id: number): Promise<PokemonDetails> {
  if (memoryDetailsCache.has(id)) {
    return memoryDetailsCache.get(id)!;
  }

  const storageKey = `${DETAILS_CACHE_PREFIX}${id}`;
  try {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached) as PokemonDetails;
      if (parsed && parsed.id === id && parsed.officialArtworkUrl) {
        memoryDetailsCache.set(id, parsed);
        return parsed;
      }
    }
  } catch {
    // Ignore cache error
  }

  const response = await fetch(`${POKEAPI_BASE}/pokemon/${id}`);
  if (!response.ok) {
    throw new Error(`PokéAPI pokemon/${id} failed with status ${response.status}`);
  }

  const raw = await response.json();

  // Extract from pokemon -> sprites -> other -> official-artwork -> front_default
  const officialArtworkUrl: string =
    raw?.sprites?.other?.['official-artwork']?.front_default ||
    raw?.sprites?.front_default ||
    getDefaultOfficialArtworkUrl(id);

  const types: string[] = Array.isArray(raw?.types)
    ? raw.types
        .sort((a: { slot: number }, b: { slot: number }) => a.slot - b.slot)
        .map((t: { type: { name: string } }) => t.type.name)
    : ['normal'];

  const details: PokemonDetails = {
    id: raw.id || id,
    name: raw.name || `pokemon-${id}`,
    displayName: formatPokemonName(raw.name || `pokemon-${id}`),
    generation: getGenerationById(raw.id || id),
    types,
    heightMeters: Number(((raw.height || 10) / 10).toFixed(1)),
    weightKg: Number(((raw.weight || 100) / 10).toFixed(1)),
    officialArtworkUrl,
    cryUrl: raw?.cries?.latest || undefined,
  };

  memoryDetailsCache.set(id, details);
  try {
    localStorage.setItem(storageKey, JSON.stringify(details));
  } catch {
    // Ignore storage quota error
  }

  return details;
}

/**
 * Loads a Pokemon's official artwork PNG into a normalized RGBA byte array
 * composited onto a dark slate background so Geometrize focuses 100% of shapes on the Pokemon.
 */
export async function loadArtworkBitmapBytes(
  imageUrl: string,
  targetSize: number = 180,
  bgColor: [number, number, number] = [15, 23, 42]
): Promise<{ width: number; height: number; rgbaBytes: Uint8ClampedArray }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('Could not initialize 2D canvas context'));
          return;
        }

        // Fill background with exact solid color matching the Geometrize ImageRunner background
        ctx.fillStyle = `rgb(${bgColor[0]}, ${bgColor[1]}, ${bgColor[2]})`;
        ctx.fillRect(0, 0, targetSize, targetSize);

        // Add subtle padding (6%) so circles/triangles near the edge frame cleanly
        const pad = Math.round(targetSize * 0.05);
        const drawSize = targetSize - pad * 2;
        ctx.drawImage(img, pad, pad, drawSize, drawSize);

        const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
        resolve({
          width: targetSize,
          height: targetSize,
          rgbaBytes: imageData.data,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load Pokémon official artwork from ${imageUrl}`));
    };

    img.src = imageUrl;
  });
}

/**
 * Compares a guessed Pokemon against the target Pokemon for attribute hint badges.
 */
export function comparePokemonAttributes(
  guessed: PokemonDetails,
  target: PokemonDetails
): GuessComparison {
  const isCorrect = guessed.id === target.id;

  // Generation
  const generationMatch: MatchStatus =
    guessed.generation === target.generation
      ? 'exact'
      : Math.abs(guessed.generation - target.generation) === 1
      ? 'partial'
      : 'none';
  const generationDirection: DirectionHint =
    target.generation === guessed.generation
      ? 'equal'
      : target.generation > guessed.generation
      ? 'higher'
      : 'lower';

  // Types
  const sharedTypes = guessed.types.filter((t) => target.types.includes(t));
  let typesMatch: MatchStatus = 'none';
  if (
    sharedTypes.length === target.types.length &&
    guessed.types.length === target.types.length
  ) {
    typesMatch = 'exact';
  } else if (sharedTypes.length > 0) {
    typesMatch = 'partial';
  }

  // Height
  const heightDiff = Math.abs(guessed.heightMeters - target.heightMeters);
  const heightMatch: MatchStatus =
    heightDiff < 0.05 ? 'exact' : heightDiff <= 0.4 ? 'partial' : 'none';
  const heightDirection: DirectionHint =
    heightDiff < 0.05
      ? 'equal'
      : target.heightMeters > guessed.heightMeters
      ? 'higher'
      : 'lower';

  // Weight
  const weightDiff = Math.abs(guessed.weightKg - target.weightKg);
  const weightMatch: MatchStatus =
    weightDiff < 0.1 ? 'exact' : weightDiff <= 8.0 ? 'partial' : 'none';
  const weightDirection: DirectionHint =
    weightDiff < 0.1
      ? 'equal'
      : target.weightKg > guessed.weightKg
      ? 'higher'
      : 'lower';

  const dexDirection: DirectionHint =
    target.id === guessed.id
      ? 'equal'
      : target.id > guessed.id
      ? 'higher'
      : 'lower';

  return {
    isCorrect,
    generationMatch,
    generationDirection,
    typesMatch,
    sharedTypes,
    heightMatch,
    heightDirection,
    weightMatch,
    weightDirection,
    dexDirection,
  };
}
