import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import {
  GameMode,
  INITIAL_SHAPES,
  MAX_GUESSES,
  MAX_SHAPES,
  ModeGameState,
  SHAPES_PER_WRONG_GUESS,
} from '../types/game';

interface ModeSelectorProps {
  activeMode: GameMode;
  modesState: Record<GameMode, ModeGameState>;
  onSelectMode: (mode: GameMode) => void;
}

interface ModeConfig {
  id: GameMode;
  label: string;
  subtitle: string;
  accentClass: string;
  activeBorderClass: string;
  icon: React.ReactNode;
}

const MODES: ModeConfig[] = [
  {
    id: 'circles',
    label: 'Circles',
    subtitle: 'Orb Primitives',
    accentClass: 'text-sky-500 dark:text-sky-400',
    activeBorderClass:
      'border-sky-500 bg-sky-500/10 dark:bg-sky-500/15 shadow-lg shadow-sky-500/10',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <circle cx="10" cy="12" r="7" opacity="0.85" />
        <circle cx="16" cy="9" r="5" opacity="0.55" />
        <circle cx="15" cy="16" r="4" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: 'triangles',
    label: 'Triangles',
    subtitle: 'Poly Shards',
    accentClass: 'text-rose-500 dark:text-rose-400',
    activeBorderClass:
      'border-rose-500 bg-rose-500/10 dark:bg-rose-500/15 shadow-lg shadow-rose-500/10',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <polygon points="12,3 21,19 3,19" opacity="0.85" />
        <polygon points="16,6 23,17 11,17" opacity="0.45" />
      </svg>
    ),
  },
  {
    id: 'lines',
    label: 'Lines',
    subtitle: 'Vector Strokes',
    accentClass: 'text-purple-500 dark:text-purple-400',
    activeBorderClass:
      'border-purple-500 bg-purple-500/10 dark:bg-purple-500/15 shadow-lg shadow-purple-500/10',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5 stroke-current"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
      >
        <line x1="4" y1="18" x2="18" y2="4" />
        <line x1="9" y1="20" x2="21" y2="8" opacity="0.7" />
        <line x1="3" y1="11" x2="13" y2="3" opacity="0.5" />
      </svg>
    ),
  },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  activeMode,
  modesState,
  onSelectMode,
}) => {
  return (
    <div
      className="grid grid-cols-3 gap-2.5 sm:gap-3.5"
      role="tablist"
      aria-label="Geometric Shape Game Modes"
    >
      {MODES.map((m) => {
        const state = modesState[m.id];
        const isActive = activeMode === m.id;
        const wrongCount = state.guesses.filter(
          (g) => !g.comparison.isCorrect
        ).length;
        const shapesCount =
          state.status === 'playing'
            ? Math.min(
                MAX_SHAPES,
                INITIAL_SHAPES + wrongCount * SHAPES_PER_WRONG_GUESS
              )
            : MAX_SHAPES;

        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectMode(m.id)}
            className={`relative flex flex-col justify-between p-3 sm:p-3.5 rounded-2xl border-2 text-left transition-all duration-200 ${
              isActive
                ? m.activeBorderClass
                : 'border-slate-200/90 dark:border-slate-800/90 bg-white/75 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-1.5 w-full">
              <div className="flex items-center gap-2">
                <span className={m.accentClass}>{m.icon}</span>
                <div>
                  <div className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                    {m.label}
                  </div>
                  <div className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400">
                    {m.subtitle}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              {state.status === 'won' && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-mono font-bold badge-exact border"
                  title={`Caught in ${state.guesses.length}/${MAX_GUESSES} guesses`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">
                    {state.guesses.length}/{MAX_GUESSES}
                  </span>
                </span>
              )}
              {state.status === 'lost' && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-mono font-bold badge-none border"
                  title="Out of guesses"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">X/{MAX_GUESSES}</span>
                </span>
              )}
              {state.status === 'playing' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {shapesCount} sh
                </span>
              )}
            </div>

            {/* Bottom Progress Bar (10 guess slots) */}
            <div className="mt-2.5 flex items-center gap-1 w-full">
              {Array.from({ length: MAX_GUESSES }).map((_, idx) => {
                const guess = state.guesses[idx];
                let dotClass = 'bg-slate-200 dark:bg-slate-800';
                if (guess) {
                  dotClass = guess.comparison.isCorrect
                    ? 'bg-emerald-500'
                    : 'bg-rose-500/80';
                }
                return (
                  <span
                    key={idx}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${dotClass}`}
                  />
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
};
