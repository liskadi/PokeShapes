import React from 'react';
import {
  Calendar,
  HelpCircle,
  Layers,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import {
  INITIAL_SHAPES,
  MAX_GUESSES,
  MAX_SHAPES,
  SHAPES_PER_WRONG_GUESS,
} from '../types/game';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-pop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="howto-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="howto-modal-title"
                className="font-display font-extrabold text-lg text-slate-900 dark:text-white"
              >
                How to Play PolyMon
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily Geometric Pokémon Identification Protocol
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close How to Play"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-600 dark:text-slate-300">
          <p className="leading-relaxed">
            Welcome to <strong className="text-slate-900 dark:text-white">PolyMon</strong>!
            Your mission is to identify the mystery Pokémon of the day from its{' '}
            <strong className="text-rose-500">geometrized official artwork</strong>{' '}
            within <strong className="text-slate-900 dark:text-white">{MAX_GUESSES} guesses</strong>.
          </p>

          {/* 3 Daily Shape Modes */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center gap-2 font-display font-bold text-slate-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>Three Daily Shape Modes</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Every day features three distinct Pokémon puzzles—one for each
              geometric primitive powered by Geometrize:
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="text-sky-500 font-bold text-base mb-0.5">●</div>
                <div className="font-display font-bold text-slate-900 dark:text-white">
                  Circles
                </div>
                <div className="text-[10px] text-slate-500">Layered Orbs</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="text-rose-500 font-bold text-base mb-0.5">▲</div>
                <div className="font-display font-bold text-slate-900 dark:text-white">
                  Triangles
                </div>
                <div className="text-[10px] text-slate-500">Low-Poly Mesh</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="text-purple-500 font-bold text-base mb-0.5">╱</div>
                <div className="font-display font-bold text-slate-900 dark:text-white">
                  Lines
                </div>
                <div className="text-[10px] text-slate-500">Vector Strokes</div>
              </div>
            </div>
          </div>

          {/* Shape Progression Rule */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 font-display font-bold text-slate-900 dark:text-white">
              <Layers className="w-4 h-4 text-sky-500" />
              <span>Progressive Shape Resolution</span>
            </div>
            <ul className="space-y-1.5 text-xs list-disc list-inside text-slate-600 dark:text-slate-300">
              <li>
                Each game begins with an abstract image made of only{' '}
                <strong className="font-mono text-rose-500">
                  {INITIAL_SHAPES} shapes
                </strong>
                .
              </li>
              <li>
                Every wrong guess adds{' '}
                <strong className="font-mono text-rose-500">
                  +{SHAPES_PER_WRONG_GUESS} shapes
                </strong>{' '}
                to sharpen the Pokémon&apos;s silhouette and colors:
                <div className="mt-1.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-center text-slate-700 dark:text-slate-300">
                  15 → 25 → 35 → 45 → 55 → 65 → 75 → 85 → 95 → {MAX_SHAPES}{' '}
                  Shapes
                </div>
              </li>
              <li>
                Use the <strong>Shape Tier Scrubber</strong> below the scanner
                to inspect how the image evolved across your unlocked tiers!
              </li>
            </ul>
          </div>

          {/* Daily Refresh & Pokédex Hints */}
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-display font-bold text-slate-900 dark:text-white mb-1">
                <Target className="w-4 h-4 text-emerald-500" />
                <span>Pokédex Attribute Clues</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Wrong guesses also reveal whether the mystery Pokémon shares
                types, generation, or is taller/heavier (can be toggled off in
                Settings for Pure Shape Hard Mode).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-display font-bold text-slate-900 dark:text-white mb-1">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Daily Midnight Reset</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                A new set of 3 daily Pokémon puzzles unlocks every night at{' '}
                <strong>00:00 (Midnight)</strong>. Want extra practice? Switch
                to <strong>Unlimited Mode</strong> anytime!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-display font-bold text-sm shadow-lg shadow-rose-500/25 transition-all"
          >
            Start Scanning Pokémon!
          </button>
        </div>
      </div>
    </div>
  );
};
