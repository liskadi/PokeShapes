import React from 'react';
import { Compass, Flame, Lock, MapPin } from 'lucide-react';
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
  if (!targetPokemon) return null;

  const isGameOver = status !== 'playing';
  const genUnlocked = isGameOver || wrongGuessesCount >= 3;
  const typeUnlocked = isGameOver || wrongGuessesCount >= 5;
  const habitatUnlocked = isGameOver || wrongGuessesCount >= 7;

  return (
    <div
      className="grid grid-cols-3 gap-2"
      aria-label="Auto-revealing Pokédex clues"
    >
      {/* Slot 1: Generation (Auto-reveals at 3 guesses) */}
      <div
        className={`h-[54px] sm:h-[56px] w-full overflow-hidden rounded-2xl border px-2.5 sm:px-3 py-1.5 sm:py-2 flex flex-col justify-between transition-colors ${
          genUnlocked
            ? 'bg-sky-500/12 dark:bg-sky-500/15 border-sky-500/40 text-sky-800 dark:text-sky-200'
            : 'bg-slate-100/80 dark:bg-[#11182A] border-slate-200/80 dark:border-[#243454] text-slate-400 dark:text-slate-500'
        }`}
      >
        <div className="flex items-center justify-between gap-1 w-full min-w-0 text-[9.5px] sm:text-[10px] font-mono uppercase font-bold tracking-tight">
          <span className="inline-flex items-center gap-1 min-w-0 truncate">
            <Compass className="w-3 h-3 shrink-0" />
            <span className="truncate">Gen</span>
          </span>
          {!genUnlocked && (
            <span className="text-[9px] opacity-80 shrink-0">3 guesses</span>
          )}
        </div>

        <div className="w-full min-w-0 font-display font-bold text-[11px] sm:text-xs leading-tight truncate">
          {genUnlocked ? (
            <span
              className="truncate block text-slate-900 dark:text-white"
              title={`Gen ${getGenerationRoman(targetPokemon.generation)} (${targetPokemon.regionName})`}
            >
              Gen {getGenerationRoman(targetPokemon.generation)} (
              {targetPokemon.regionName})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium opacity-75 truncate">
              <Lock className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">Locked</span>
            </span>
          )}
        </div>
      </div>

      {/* Slot 2: Primary Type (Auto-reveals at 5 guesses) */}
      <div
        className={`h-[54px] sm:h-[56px] w-full overflow-hidden rounded-2xl border px-2.5 sm:px-3 py-1.5 sm:py-2 flex flex-col justify-between transition-colors ${
          typeUnlocked
            ? 'bg-rose-500/12 dark:bg-rose-500/15 border-rose-500/40 text-rose-800 dark:text-rose-200'
            : 'bg-slate-100/80 dark:bg-[#11182A] border-slate-200/80 dark:border-[#243454] text-slate-400 dark:text-slate-500'
        }`}
      >
        <div className="flex items-center justify-between gap-1 w-full min-w-0 text-[9.5px] sm:text-[10px] font-mono uppercase font-bold tracking-tight">
          <span className="inline-flex items-center gap-1 min-w-0 truncate">
            <Flame className="w-3 h-3 shrink-0" />
            <span className="truncate">Type</span>
          </span>
          {!typeUnlocked && (
            <span className="text-[9px] opacity-80 shrink-0">5 guesses</span>
          )}
        </div>

        <div className="w-full min-w-0 font-display font-bold text-[11px] sm:text-xs leading-tight capitalize truncate">
          {typeUnlocked ? (
            <span className="truncate block text-slate-900 dark:text-white">
              {targetPokemon.types[0]}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium normal-case opacity-75 truncate">
              <Lock className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">Locked</span>
            </span>
          )}
        </div>
      </div>

      {/* Slot 3: Habitat (Auto-reveals at 7 guesses) */}
      <div
        className={`h-[54px] sm:h-[56px] w-full overflow-hidden rounded-2xl border px-2.5 sm:px-3 py-1.5 sm:py-2 flex flex-col justify-between transition-colors ${
          habitatUnlocked
            ? 'bg-emerald-500/12 dark:bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
            : 'bg-slate-100/80 dark:bg-[#11182A] border-slate-200/80 dark:border-[#243454] text-slate-400 dark:text-slate-500'
        }`}
      >
        <div className="flex items-center justify-between gap-1 w-full min-w-0 text-[9.5px] sm:text-[10px] font-mono uppercase font-bold tracking-tight">
          <span className="inline-flex items-center gap-1 min-w-0 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">Habitat</span>
          </span>
          {!habitatUnlocked && (
            <span className="text-[9px] opacity-80 shrink-0">7 guesses</span>
          )}
        </div>

        <div className="w-full min-w-0 font-display font-bold text-[11px] sm:text-xs leading-tight truncate">
          {habitatUnlocked ? (
            <span
              className="truncate block text-slate-900 dark:text-white"
              title={targetPokemon.habitat}
            >
              {targetPokemon.habitat}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium opacity-75 truncate">
              <Lock className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">Locked</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
