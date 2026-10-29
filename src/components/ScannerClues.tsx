import React, { useEffect, useState } from 'react';
import {
  Compass,
  Flame,
  Lock,
  MapPin,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { getGenerationRoman } from '../api/pokeapi';
import { GameStatus } from '../types/game';
import { PokemonDetails } from '../types/pokemon';

interface ScannerCluesProps {
  wrongGuessesCount: number;
  status: GameStatus;
  targetPokemon: PokemonDetails | null;
}

export const ScannerClues: React.FC<ScannerCluesProps> = ({
  wrongGuessesCount,
  status,
  targetPokemon,
}) => {
  const [revealedGen, setRevealedGen] = useState(false);
  const [revealedType, setRevealedType] = useState(false);
  const [revealedHabitat, setRevealedHabitat] = useState(false);

  // Reset revealed clue states when target Pokemon changes
  useEffect(() => {
    setRevealedGen(false);
    setRevealedType(false);
    setRevealedHabitat(false);
  }, [targetPokemon?.id]);

  if (!targetPokemon) return null;

  const isGameOver = status !== 'playing';
  const genUnlocked = isGameOver || wrongGuessesCount >= 3;
  const typeUnlocked = isGameOver || wrongGuessesCount >= 5;
  const habitatUnlocked = isGameOver || wrongGuessesCount >= 7;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-md">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Pokédex Scanner Clues</span>
        </div>
      </div>

      {/* 3 Progressive Clues Grid: Fixed height & overflow-safe so boxes never shift or spill */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Clue 1: Generation Hint (3 Guesses) */}
        <button
          type="button"
          disabled={!genUnlocked}
          onClick={() => setRevealedGen(true)}
          className={`h-[58px] w-full overflow-hidden flex flex-col items-start justify-between px-2.5 py-2 rounded-xl border text-left transition-all ${
            !genUnlocked
              ? 'bg-slate-50 dark:bg-slate-950/50 border-slate-200/70 dark:border-slate-800/70 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              : revealedGen || isGameOver
              ? 'bg-sky-500/10 border-sky-500/35 text-sky-700 dark:text-sky-300'
              : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/35 text-amber-700 dark:text-amber-300 cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between gap-1 w-full min-w-0 text-[9.5px] font-mono uppercase font-bold tracking-tight opacity-85">
            <span className="inline-flex items-center gap-1 min-w-0 truncate">
              <Compass className="w-3 h-3 shrink-0" />
              <span className="truncate">1. Generation</span>
            </span>
            {genUnlocked ? (
              <Unlock className="w-3 h-3 shrink-0" />
            ) : (
              <span className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800/80 text-[9px] leading-none shrink-0">
                {wrongGuessesCount}/3
              </span>
            )}
          </div>

          <div className="w-full min-w-0 font-display font-bold text-[11px] leading-tight text-slate-900 dark:text-white truncate">
            {!genUnlocked ? (
              <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 w-full truncate">
                <Lock className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">Unlocks at 3 guesses</span>
              </span>
            ) : revealedGen || isGameOver ? (
              <span className="truncate block">
                Gen {getGenerationRoman(targetPokemon.generation)} (
                {targetPokemon.regionName})
              </span>
            ) : (
              <span className="underline truncate block">
                Click to Reveal Gen
              </span>
            )}
          </div>
        </button>

        {/* Clue 2: Primary Type Hint (5 Guesses) */}
        <button
          type="button"
          disabled={!typeUnlocked}
          onClick={() => setRevealedType(true)}
          className={`h-[58px] w-full overflow-hidden flex flex-col items-start justify-between px-2.5 py-2 rounded-xl border text-left transition-all ${
            !typeUnlocked
              ? 'bg-slate-50 dark:bg-slate-950/50 border-slate-200/70 dark:border-slate-800/70 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              : revealedType || isGameOver
              ? 'bg-rose-500/10 border-rose-500/35 text-rose-700 dark:text-rose-300'
              : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/35 text-amber-700 dark:text-amber-300 cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between gap-1 w-full min-w-0 text-[9.5px] font-mono uppercase font-bold tracking-tight opacity-85">
            <span className="inline-flex items-center gap-1 min-w-0 truncate">
              <Flame className="w-3 h-3 shrink-0" />
              <span className="truncate">2. Primary Type</span>
            </span>
            {typeUnlocked ? (
              <Unlock className="w-3 h-3 shrink-0" />
            ) : (
              <span className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800/80 text-[9px] leading-none shrink-0">
                {wrongGuessesCount}/5
              </span>
            )}
          </div>

          <div className="w-full min-w-0 font-display font-bold text-[11px] leading-tight text-slate-900 dark:text-white capitalize truncate">
            {!typeUnlocked ? (
              <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 normal-case w-full truncate">
                <Lock className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">Unlocks at 5 guesses</span>
              </span>
            ) : revealedType || isGameOver ? (
              <span className="truncate block">
                {targetPokemon.types[0]} Type
              </span>
            ) : (
              <span className="underline normal-case truncate block">
                Click to Reveal Type
              </span>
            )}
          </div>
        </button>

        {/* Clue 3: Habitat Hint (7 Guesses) */}
        <button
          type="button"
          disabled={!habitatUnlocked}
          onClick={() => setRevealedHabitat(true)}
          className={`h-[58px] w-full overflow-hidden flex flex-col items-start justify-between px-2.5 py-2 rounded-xl border text-left transition-all ${
            !habitatUnlocked
              ? 'bg-slate-50 dark:bg-slate-950/50 border-slate-200/70 dark:border-slate-800/70 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              : revealedHabitat || isGameOver
              ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/35 text-amber-700 dark:text-amber-300 cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between gap-1 w-full min-w-0 text-[9.5px] font-mono uppercase font-bold tracking-tight opacity-85">
            <span className="inline-flex items-center gap-1 min-w-0 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">3. Habitat</span>
            </span>
            {habitatUnlocked ? (
              <Unlock className="w-3 h-3 shrink-0" />
            ) : (
              <span className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800/80 text-[9px] leading-none shrink-0">
                {wrongGuessesCount}/7
              </span>
            )}
          </div>

          <div className="w-full min-w-0 font-display font-bold text-[11px] leading-tight text-slate-900 dark:text-white truncate">
            {!habitatUnlocked ? (
              <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 w-full truncate">
                <Lock className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">Unlocks at 7 guesses</span>
              </span>
            ) : revealedHabitat || isGameOver ? (
              <span className="truncate block" title={targetPokemon.habitat}>
                {targetPokemon.habitat}
              </span>
            ) : (
              <span className="underline truncate block">
                Click to Reveal Habitat
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};
