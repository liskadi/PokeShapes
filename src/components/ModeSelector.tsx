import React from 'react';
import { Check, X } from 'lucide-react';
import { GameMode, MAX_GUESSES, ModeGameState } from '../types/game';

interface ModeSelectorProps {
  activeMode: GameMode;
  modesState: Record<GameMode, ModeGameState>;
  onSelectMode: (mode: GameMode) => void;
}

interface ModeConfig {
  id: GameMode;
  label: string;
  iconBgClass: string;
  activeBorderClass: string;
  icon: React.ReactNode;
}

const MODES: ModeConfig[] = [
  {
    id: 'circles',
    label: 'Circles',
    iconBgClass:
      'bg-sky-500/15 border-sky-500/35 text-sky-600 dark:text-sky-400',
    activeBorderClass:
      'border-sky-500 border-b-sky-600 dark:border-sky-400 dark:border-b-sky-500 bg-sky-500/10 dark:bg-sky-500/18 shadow-[0_3px_0_rgba(56,189,248,0.28)] bg-diagonal-stripes',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 fill-current">
        <circle cx="10" cy="12" r="7" opacity="0.9" />
        <circle cx="16" cy="9" r="5" opacity="0.6" />
        <circle cx="15" cy="16" r="4" opacity="0.45" />
      </svg>
    ),
  },
  {
    id: 'triangles',
    label: 'Triangles',
    iconBgClass:
      'bg-rose-500/15 border-rose-500/35 text-rose-600 dark:text-rose-400',
    activeBorderClass:
      'border-rose-500 border-b-rose-700 dark:border-rose-400 dark:border-b-rose-500 bg-rose-500/10 dark:bg-rose-500/18 shadow-[0_3px_0_rgba(244,63,94,0.28)] bg-diagonal-stripes',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 fill-current">
        <polygon points="12,3 21,19 3,19" opacity="0.9" />
        <polygon points="16,6 23,17 11,17" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: 'lines',
    label: 'Lines',
    iconBgClass:
      'bg-purple-500/15 border-purple-500/35 text-purple-600 dark:text-purple-400',
    activeBorderClass:
      'border-purple-500 border-b-purple-700 dark:border-purple-400 dark:border-b-purple-500 bg-purple-500/10 dark:bg-purple-500/18 shadow-[0_3px_0_rgba(168,85,247,0.28)] bg-diagonal-stripes',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4 sm:w-5 sm:h-5 stroke-current"
        fill="none"
        strokeWidth="2.8"
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
      className="grid grid-cols-3 gap-2 sm:gap-4"
      role="tablist"
      aria-label="Geometric Shape Game Modes"
    >
      {MODES.map((m) => {
        const state = modesState[m.id];
        const isActive = activeMode === m.id;
        const guessCount = state.guesses.length;

        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectMode(m.id)}
            className={`btn-tactile flex items-center justify-between gap-1.5 sm:gap-2 px-2.5 py-2 sm:px-3.5 sm:py-3 rounded-2xl text-left cursor-pointer ${
              isActive
                ? m.activeBorderClass
                : 'border-slate-300 border-b-slate-400 dark:border-[#334770] dark:border-b-[#435C8F] bg-white dark:bg-[#172138] hover:bg-slate-50 dark:hover:bg-[#1E2B48]'
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <span
                className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 ${m.iconBgClass}`}
              >
                {m.icon}
              </span>
              <span className="font-display font-bold text-xs sm:text-lg text-slate-900 dark:text-white truncate">
                {m.label}
              </span>
            </div>

            {/* Single Clean Status Indicator */}
            {state.status === 'won' && (
              <span
                className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full badge-exact border-2 shrink-0"
                title={`Caught in ${guessCount}/${MAX_GUESSES}`}
              >
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
              </span>
            )}
            {state.status === 'lost' && (
              <span
                className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full badge-none border-2 shrink-0"
                title="Missed"
              >
                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
              </span>
            )}
            {state.status === 'playing' && guessCount > 0 && (
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-mono font-bold bg-slate-100 dark:bg-[#0D1322] border border-slate-200 dark:border-[#2C3E63] text-slate-600 dark:text-slate-300 shrink-0">
                {guessCount}/{MAX_GUESSES}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
