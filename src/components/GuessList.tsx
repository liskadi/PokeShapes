import React from 'react';
import { Check, X } from 'lucide-react';
import { GameMode, GuessRecord, MAX_GUESSES } from '../types/game';

interface GuessListProps {
  mode: GameMode;
  guesses: GuessRecord[];
}

export const GuessList: React.FC<GuessListProps> = ({ guesses }) => {
  if (guesses.length === 0) {
    return null;
  }

  // Show most recent guess first
  const reversedGuesses = [...guesses].reverse();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Guesses ({guesses.length} / {MAX_GUESSES})
        </h2>
      </div>

      <div className="space-y-2">
        {reversedGuesses.map((record) => {
          const { pokemon, comparison, guessNumber } = record;

          return (
            <div
              key={`${pokemon.id}-${guessNumber}`}
              className={`rounded-2xl px-3.5 py-2.5 transition-all animate-pop ${
                comparison.isCorrect
                  ? 'badge-exact border-2 border-b-4 bg-diagonal-stripes'
                  : 'game-card bg-white dark:bg-[#141C2F]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-[#0D1322] border border-slate-200 dark:border-[#24304d] font-mono text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                    #{guessNumber}
                  </span>

                  <div className="relative w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#0D1322] border border-slate-200 dark:border-[#24304d] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={pokemon.officialArtworkUrl}
                      alt={pokemon.displayName}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex items-baseline gap-1.5 min-w-0">
                    <span className="font-display font-bold text-base text-slate-900 dark:text-white truncate">
                      {pokemon.displayName}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 shrink-0">
                      #{String(pokemon.id).padStart(4, '0')}
                    </span>
                  </div>
                </div>

                {/* Clean Right Status Icon */}
                {comparison.isCorrect ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-500/15 text-rose-500 dark:text-rose-400 shrink-0">
                    <X className="w-4 h-4 stroke-[2.8]" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
