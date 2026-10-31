import { PokemonDetails, PokemonIndexEntry } from '../types/pokemon';
import { TOTAL_MAINLINE_POKEMON } from '../utils/dailySeed';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const INDEX_CACHE_KEY = 'pokeshapes:pokemon-index-v2';
const DETAILS_CACHE_PREFIX = 'pokeshapes:pokemon-detail-v4:';

const memoryDetailsCache = new Map<number, PokemonDetails>();
let memoryIndexCache: PokemonIndexEntry[] | null = null;

// Clean up legacy v1 index cache so all users immediately get version sprite URLs
(function purgeLegacyIndexCache() {
  try {
    localStorage.removeItem('pokeshapes:pokemon-index-v1');
  } catch {
    // Ignore storage error
  }
})();

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

export function getRegionByGeneration(gen: number): string {
  const regions: Record<number, string> = {
    1: 'Kanto',
    2: 'Johto',
    3: 'Hoenn',
    4: 'Sinnoh',
    5: 'Unova',
    6: 'Kalos',
    7: 'Alola',
    8: 'Galar',
    9: 'Paldea',
  };
  return regions[gen] || 'Unknown';
}

export function formatHabitat(
  rawHabitat: string | null | undefined,
  types: string[]
): string {
  if (rawHabitat) {
    const map: Record<string, string> = {
      cave: 'Cave',
      forest: 'Forest',
      grassland: 'Grassland',
      mountain: 'Mountain',
      rare: 'Rare Sanctuary',
      'rough-terrain': 'Rough Terrain',
      sea: 'Sea',
      urban: 'Urban',
      'waters-edge': "Water's Edge",
    };
    if (map[rawHabitat]) return map[rawHabitat];
    return rawHabitat
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // PokéAPI only populates species.habitat for Gen 1-3; infer a fitting habitat from primary type for Gen 4-9
  const primary = types[0] || 'normal';
  const typeHabitatMap: Record<string, string> = {
    water: "Water's Edge",
    fire: 'Volcanic Terrain',
    grass: 'Grassland',
    bug: 'Forest',
    rock: 'Mountain',
    ground: 'Rough Terrain',
    steel: 'Mountain Cave',
    ice: 'Snowy Peak',
    ghost: 'Shadow Realm',
    dark: 'Nocturnal',
    dragon: 'Mythic Sanctuary',
    fairy: 'Enchanted Glade',
    electric: 'Power Plant',
    psychic: 'Mystic Ruins',
    fighting: 'Mountain Dojo',
    poison: 'Wetlands',
    flying: 'High Skies',
    normal: 'Grassland',
  };
  return typeHabitatMap[primary] || 'Grassland';
}

export function formatPokemonName(slug: string): string {
  const specialNames: Record<string, string> = {
    'nidoran-f': 'Nidoran♀',
    'nidoran-m': 'Nidoran♂',
    'mr-mime': 'Mr. Mime',
    'mr-rime': 'Mr. Rime',
    'mime-jr': 'Mime Jr.',
    farfetchd: "Farfetch'd",
    sirfetchd: "Sirfetch'd",
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
    flabebe: 'Flabébé',
    'chi-yu': 'Chi-Yu',
    'chien-pao': 'Chien-Pao',
    'ting-lu': 'Ting-Lu',
    'wo-chien': 'Wo-Chien',
  };

  if (specialNames[slug]) {
    return specialNames[slug];
  }

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

export function getDefaultOfficialArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

/**
 * Returns the 2D pixel sprite from `sprites.versions['generation-v']['black-white'].front_default`
 * (which covers all 1,025 Pokémon in PokéAPI), distinct from the official artwork used for geometrization.
 */
export function getDefaultVersionSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/${id}.png`;
}

export function getFallbackFrontSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export async function fetchPokemonIndex(): Promise<PokemonIndexEntry[]> {
  if (memoryIndexCache && memoryIndexCache.length > 0) {
    return memoryIndexCache;
  }

  try {
    const cachedRaw = localStorage.getItem(INDEX_CACHE_KEY);
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw) as PokemonIndexEntry[];
      if (
        Array.isArray(parsed) &&
        parsed.length >= 1000 &&
        parsed[0]?.spriteUrl
      ) {
        memoryIndexCache = parsed;
        return parsed;
      }
    }
  } catch {
    // Fall through to network fetch
  }

  const response = await fetch(
    `${POKEAPI_BASE}/pokemon?limit=${TOTAL_MAINLINE_POKEMON}&offset=0`
  );
  if (!response.ok) {
    throw new Error(`PokéAPI index request failed (${response.status})`);
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
        spriteUrl: getDefaultVersionSpriteUrl(id),
      };
    }
  );

  memoryIndexCache = entries;
  try {
    localStorage.setItem(INDEX_CACHE_KEY, JSON.stringify(entries));
  } catch {
    // Storage quota full
  }

  return entries;
}

export async function fetchPokemonDetails(id: number): Promise<PokemonDetails> {
  const cachedMem = memoryDetailsCache.get(id);
  if (cachedMem) return cachedMem;

  const storageKey = `${DETAILS_CACHE_PREFIX}${id}`;
  try {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached) as PokemonDetails;
      if (
        parsed?.id === id &&
        parsed.officialArtworkUrl &&
        parsed.spriteUrl &&
        parsed.habitat
      ) {
        memoryDetailsCache.set(id, parsed);
        return parsed;
      }
    }
  } catch {
    // Fall through to network fetch
  }

  const [pokemonRes, speciesRes] = await Promise.all([
    fetch(`${POKEAPI_BASE}/pokemon/${id}`),
    fetch(`${POKEAPI_BASE}/pokemon-species/${id}`).catch(() => null),
  ]);

  if (!pokemonRes.ok) {
    throw new Error(`PokéAPI pokemon/${id} failed (${pokemonRes.status})`);
  }

  const raw = await pokemonRes.json();
  let rawHabitat: string | null = null;

  if (speciesRes?.ok) {
    try {
      const speciesData = await speciesRes.json();
      rawHabitat = speciesData?.habitat?.name || null;
    } catch {
      // Optional species metadata
    }
  }

  const officialArtworkUrl: string =
    raw?.sprites?.other?.['official-artwork']?.front_default ||
    raw?.sprites?.front_default ||
    getDefaultOfficialArtworkUrl(id);

  const spriteUrl: string =
    raw?.sprites?.versions?.['generation-v']?.['black-white']?.front_default ||
    raw?.sprites?.front_default ||
    getDefaultVersionSpriteUrl(id);

  const types: string[] = Array.isArray(raw?.types)
    ? raw.types
        .sort((a: { slot: number }, b: { slot: number }) => a.slot - b.slot)
        .map((t: { type: { name: string } }) => t.type.name)
    : ['normal'];

  const generation = getGenerationById(raw.id || id);

  const details: PokemonDetails = {
    id: raw.id || id,
    name: raw.name || `pokemon-${id}`,
    displayName: formatPokemonName(raw.name || `pokemon-${id}`),
    generation,
    regionName: getRegionByGeneration(generation),
    types,
    habitat: formatHabitat(rawHabitat, types),
    officialArtworkUrl,
    spriteUrl,
    cryUrl: raw?.cries?.latest || undefined,
  };

  memoryDetailsCache.set(id, details);
  try {
    localStorage.setItem(storageKey, JSON.stringify(details));
  } catch {
    // Storage quota full
  }

  return details;
}

/**
 * Auto-crops transparent padding around the sprite so the Pokémon fills 88% of `targetSize`,
 * and returns both the RGBA byte buffer for Geometrize and a matching high-res transparent data URL.
 */
export async function loadArtworkBitmapBytes(
  imageUrl: string,
  targetSize: number = 180,
  bgColor: [number, number, number] = [15, 23, 42]
): Promise<{
  width: number;
  height: number;
  rgbaBytes: Uint8ClampedArray;
  croppedArtworkDataUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const srcW = img.naturalWidth || img.width || 475;
        const srcH = img.naturalHeight || img.height || 475;

        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = srcW;
        srcCanvas.height = srcH;
        const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
        if (!srcCtx) {
          reject(new Error('Could not initialize source 2D canvas context'));
          return;
        }
        srcCtx.drawImage(img, 0, 0, srcW, srcH);
        const srcData = srcCtx.getImageData(0, 0, srcW, srcH).data;

        let xMin = srcW;
        let yMin = srcH;
        let xMax = 0;
        let yMax = 0;
        let foundOpaque = false;

        for (let y = 0; y < srcH; y++) {
          for (let x = 0; x < srcW; x++) {
            if (srcData[(y * srcW + x) * 4 + 3] > 16) {
              if (x < xMin) xMin = x;
              if (x > xMax) xMax = x;
              if (y < yMin) yMin = y;
              if (y > yMax) yMax = y;
              foundOpaque = true;
            }
          }
        }

        if (!foundOpaque) {
          xMin = 0;
          yMin = 0;
          xMax = srcW - 1;
          yMax = srcH - 1;
        }

        const cropW = Math.max(1, xMax - xMin + 1);
        const cropH = Math.max(1, yMax - yMin + 1);

        const usableSpan = targetSize * 0.88;
        const scale = usableSpan / Math.max(cropW, cropH);
        const destW = cropW * scale;
        const destH = cropH * scale;
        const destX = (targetSize - destW) / 2;
        const destY = (targetSize - destH) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('Could not initialize 2D canvas context'));
          return;
        }

        ctx.fillStyle = `rgb(${bgColor[0]}, ${bgColor[1]}, ${bgColor[2]})`;
        ctx.fillRect(0, 0, targetSize, targetSize);
        ctx.drawImage(img, xMin, yMin, cropW, cropH, destX, destY, destW, destH);

        const imageData = ctx.getImageData(0, 0, targetSize, targetSize);

        const overlaySize = 360;
        const overlayCanvas = document.createElement('canvas');
        overlayCanvas.width = overlaySize;
        overlayCanvas.height = overlaySize;
        const overlayCtx = overlayCanvas.getContext('2d');
        const ratio = overlaySize / targetSize;
        if (overlayCtx) {
          overlayCtx.drawImage(
            img,
            xMin,
            yMin,
            cropW,
            cropH,
            destX * ratio,
            destY * ratio,
            destW * ratio,
            destH * ratio
          );
        }

        resolve({
          width: targetSize,
          height: targetSize,
          rgbaBytes: imageData.data,
          croppedArtworkDataUrl: overlayCanvas.toDataURL('image/png'),
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load Pokémon artwork from ${imageUrl}`));
    };

    img.src = imageUrl;
  });
}
