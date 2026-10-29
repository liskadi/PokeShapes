import React from 'react';
import { Check, Layers, Sparkles } from 'lucide-react';
import {
  GameMode,
  getModeShapeConfig,
  GuessRecord,
  MAX_GUESSES,
} from '../types/game';

interface GuessListProps {
  mode: GameMode;
  guesses: GuessRecord[];
}

export const GuessList: React.FC<GuessListProps> = ({ mode, guesses }) => {
  const shapeCfg = getModeShapeConfig(mode);

  if (guesses.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 p-6 text-center">
        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-2.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <h3 className="font-display font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200">
          No Guesses Yet ({shapeCfg.initialShapes} Shapes Active)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Examine the {shapeCfg.initialShapes} geometric primitives and enter
          your first guess above. Each wrong guess adds{' '}
          <strong className="text-rose-500 font-semibold">
            +{shapeCfg.increment} shapes
          </strong>{' '}
          to the Pokémon up to {MAX_GUESSES} guesses!
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
              <div className="flex items-center justify-between gap-3">
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
                          <Check className="w-3.5 h-3.5" /> Target Pokémon
                          Identified!
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-500 dark:text-rose-400">
                          <Layers className="w-3 h-3" />
                          <span>
                            +{shapeCfg.increment} Shapes →{' '}
                            {shapesUnlockedAfter} Shapes Active
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
