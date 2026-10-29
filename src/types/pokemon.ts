export interface PokemonIndexEntry {
  id: number;
  name: string; // raw slug from PokeAPI e.g. "bulbasaur"
  displayName: string; // formatted e.g. "Bulbasaur"
  generation: number; // 1 to 9
  officialArtworkUrl: string;
}

export interface PokemonDetails {
  id: number;
  name: string;
  displayName: string;
  generation: number;
  regionName: string; // e.g. "Kanto", "Sinnoh"
  types: string[]; // e.g. ["grass", "poison"]
  heightMeters: number; // converted from decimeters
  weightKg: number; // converted from hectograms
  habitat: string; // e.g. "Grassland", "Forest", "Cave", "Waters-Edge"
  genus?: string; // e.g. "Seed Pokémon"
  officialArtworkUrl: string; // from pokemon/sprites/other/official-artwork/front_default
  cryUrl?: string;
}

export type MatchStatus = 'exact' | 'partial' | 'none';
export type DirectionHint = 'equal' | 'higher' | 'lower';

export interface GuessComparison {
  isCorrect: boolean;
  generationMatch: MatchStatus;
  generationDirection: DirectionHint; // 'higher' means Target Gen > Guessed Gen
  typesMatch: MatchStatus; // 'exact' if identical set, 'partial' if 1 shared type, 'none' otherwise
  sharedTypes: string[];
  heightMatch: MatchStatus; // 'exact' if equal, 'partial' if within 0.4m
  heightDirection: DirectionHint; // 'higher' means Target is taller
  weightMatch: MatchStatus; // 'exact' if equal, 'partial' if within 8kg
  weightDirection: DirectionHint; // 'higher' means Target is heavier
  dexDirection: DirectionHint; // 'higher' means Target # > Guessed #
}
