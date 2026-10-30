import React from 'react';
import { HelpCircle, Layers, Sparkles, Target, X } from 'lucide-react';
import { MAX_GUESSES } from '../types/game';

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
      <div className="game-card relative w-full max-w-md rounded-3xl bg-white dark:bg-[#141C2F] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b-2 border-slate-200 dark:border-[#24304d] bg-diagonal-stripes flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2
              id="howto-modal-title"
              className="font-display font-extrabold text-lg text-slate-900 dark:text-white"
            >
              How to Play PokéShapes
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close How to Play"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Concise 3-Step Body */}
        <div className="p-5 space-y-3.5 text-sm text-slate-600 dark:text-slate-300">
          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#0D1322] border border-slate-200 dark:border-[#1E2942]">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-display font-bold text-slate-900 dark:text-white">
                1. Spot the Pokémon
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Three daily mystery Pokémon are hidden behind{' '}
                <strong className="text-sky-500">Circles</strong>,{' '}
                <strong className="text-rose-500">Triangles</strong>, and{' '}
                <strong className="text-purple-500">Lines</strong>.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#0D1322] border border-slate-200 dark:border-[#1E2942]">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0 mt-0.5">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="font-display font-bold text-slate-900 dark:text-white">
                2. {MAX_GUESSES} Guesses
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Every wrong guess adds more shapes to make the picture clearer.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#0D1322] border border-slate-200 dark:border-[#1E2942]">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="font-display font-bold text-slate-900 dark:text-white">
                3. Auto-Clues
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Hints unlock automatically at <strong>3 guesses</strong> (Gen),{' '}
                <strong>5 guesses</strong> (Type), and{' '}
                <strong>7 guesses</strong> (Habitat).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-tactile w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 border-rose-400 border-b-rose-700 text-white font-display font-bold text-sm cursor-pointer mt-1"
          >
            Start Guessing Pokémon!
          </button>
        </div>
      </div>
    </div>
  );
};
