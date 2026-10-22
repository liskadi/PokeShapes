import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Layers,
  Minus,
  Sparkles,
  X,
} from 'lucide-react';
import { getGenerationRoman } from '../api/pokeapi';
import { GuessRecord, INITIAL_SHAPES, MAX_GUESSES } from '../types/game';
import { DirectionHint, MatchStatus } from '../types/pokemon';

interface GuessListProps {
  guesses: GuessRecord[];
  showAttributeHints: boolean;
}

function renderStatusSymbol(status: MatchStatus, direction?: DirectionHint) {
  if (status === 'exact') {
    return <Check className="w-3.5 h-3.5 stroke-[2.5]" />;
  }
  if (direction === 'higher') {
    return <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />;
  }
  if (direction === 'lower') {
    return <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />;
  }
  if (status === 'partial') {
    return <Minus className="w-3.5 h-3.5 stroke-[2.5]" />;
  }
  return <X className="w-3.5 h-3.5 stroke-[2.5]" />;
}

function getBadgeClass(status: MatchStatus): string {
  if (status === 'exact') return 'badge-exact';
  if (status === 'partial') return 'badge-partial';
  return 'badge-none';
}

export const GuessList: React.FC<GuessListProps> = ({
  guesses,
  showAttributeHints,
}) => {
  if (guesses.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 p-6 text-center">
        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-2.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <h3 className="font-display font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200">
          No Guesses Yet ({INITIAL_SHAPES} Shapes Active)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Examine the {INITIAL_SHAPES} geometric primitives and enter your first
          guess above. Each wrong guess adds{' '}
          <strong className="text-rose-500 font-semibold">+10 shapes</strong> to
          the Pokémon up to {MAX_GUESSES} guesses!
        </p>
      </div>
    );
  }

  // Show most recent guess first
  const reversedGuesses = [...guesses].reverse();

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Guess History ({guesses.length} / {MAX_GUESSES})
        </h2>
        {showAttributeHints && (
          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Match
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Close / Partial
            </span>
            <span className="inline-flex items-center gap-1">
              <span>↑/↓ Target is Higher/Lower</span>
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {reversedGuesses.map((record) => {
          const { pokemon, comparison, guessNumber, shapesUnlockedAfter } =
            record;

          return (
            <div
              key={`${pokemon.id}-${guessNumber}`}
              className={`rounded-2xl border p-3 sm:p-3.5 transition-all animate-pop ${
                comparison.isCorrect
                  ? 'badge-exact border-2'
                  : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left: Guessed Pokemon Identity */}
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                      #{guessNumber}
                    </span>

                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 flex items-center justify-center shrink-0">
                      <img
                        src={pokemon.officialArtworkUrl}
                        alt={pokemon.displayName}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                          {pokemon.displayName}
                        </span>
                        <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                          #{String(pokemon.id).padStart(4, '0')}
                        </span>
                      </div>

                      {/* Shape progression status */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {comparison.isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold">
                            <Check className="w-3.5 h-3.5" /> Target Pokémon Identified!
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-500 dark:text-rose-400">
                            <Layers className="w-3 h-3" />
                            <span>
                              +10 Shapes → {shapesUnlockedAfter} Shapes Active
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Optional Attribute Comparison Chips (Color-Blind Safe with Icons) */}
                {showAttributeHints && (
                  <div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center sm:gap-2">
                    {/* Generation */}
                    <div
                      className={`px-2.5 py-1.5 rounded-xl border text-center flex flex-col items-center justify-center min-w-[66px] ${getBadgeClass(
                        comparison.generationMatch
                      )}`}
                      title={
                        comparison.generationDirection === 'equal'
                          ? 'Same Generation!'
                          : comparison.generationDirection === 'higher'
                          ? 'Target Pokémon is from a NEWER Generation (Higher)'
                          : 'Target Pokémon is from an OLDER Generation (Lower)'
                      }
                    >
                      <span className="text-[9px] uppercase font-bold opacity-75">
                        Gen
                      </span>
                      <span className="font-mono text-xs font-bold inline-flex items-center gap-0.5">
                        <span>{getGenerationRoman(pokemon.generation)}</span>
                        {renderStatusSymbol(
                          comparison.generationMatch,
                          comparison.generationDirection
                        )}
                      </span>
                    </div>

                    {/* Types */}
                    <div
                      className={`px-2.5 py-1.5 rounded-xl border text-center flex flex-col items-center justify-center min-w-[82px] ${getBadgeClass(
                        comparison.typesMatch
                      )}`}
                      title={
                        comparison.typesMatch === 'exact'
                          ? 'Exact Type Match!'
                          : comparison.typesMatch === 'partial'
                          ? `Partial Type Match (${comparison.sharedTypes.join(', ')})`
                          : 'No Shared Types'
                      }
                    >
                      <span className="text-[9px] uppercase font-bold opacity-75">
                        Types
                      </span>
                      <span className="font-mono text-[11px] font-bold inline-flex items-center gap-0.5 capitalize truncate max-w-[90px]">
                        <span>{pokemon.types.join('/')}</span>
                        {renderStatusSymbol(comparison.typesMatch)}
                      </span>
                    </div>

                    {/* Height */}
                    <div
                      className={`px-2.5 py-1.5 rounded-xl border text-center flex flex-col items-center justify-center min-w-[68px] ${getBadgeClass(
                        comparison.heightMatch
                      )}`}
                      title={
                        comparison.heightDirection === 'equal'
                          ? 'Same Height!'
                          : comparison.heightDirection === 'higher'
                          ? 'Target Pokémon is TALLER (↑)'
                          : 'Target Pokémon is SHORTER (↓)'
                      }
                    >
                      <span className="text-[9px] uppercase font-bold opacity-75">
                        Height
                      </span>
                      <span className="font-mono text-xs font-bold inline-flex items-center gap-0.5">
                        <span>{pokemon.heightMeters}m</span>
                        {renderStatusSymbol(
                          comparison.heightMatch,
                          comparison.heightDirection
                        )}
                      </span>
                    </div>

                    {/* Weight */}
                    <div
                      className={`px-2.5 py-1.5 rounded-xl border text-center flex flex-col items-center justify-center min-w-[72px] ${getBadgeClass(
                        comparison.weightMatch
                      )}`}
                      title={
                        comparison.weightDirection === 'equal'
                          ? 'Same Weight!'
                          : comparison.weightDirection === 'higher'
                          ? 'Target Pokémon is HEAVIER (↑)'
                          : 'Target Pokémon is LIGHTER (↓)'
                      }
                    >
                      <span className="text-[9px] uppercase font-bold opacity-75">
                        Weight
                      </span>
                      <span className="font-mono text-xs font-bold inline-flex items-center gap-0.5">
                        <span>{pokemon.weightKg}kg</span>
                        {renderStatusSymbol(
                          comparison.weightMatch,
                          comparison.weightDirection
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
