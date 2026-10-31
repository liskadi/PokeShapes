export interface PokemonIndexEntry {
  id: number;
  name: string;
  displayName: string;
  generation: number;
  officialArtworkUrl: string;
  spriteUrl: string;
}

export interface PokemonDetails {
  id: number;
  name: string;
  displayName: string;
  generation: number;
  regionName: string;
  types: string[];
  habitat: string;
  officialArtworkUrl: string;
  spriteUrl: string;
  cryUrl?: string;
}
