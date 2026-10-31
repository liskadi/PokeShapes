import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircleQuestion, X } from 'lucide-react';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What is PokéShapes?',
    answer:
      'PokéShapes is a free daily Pokémon guessing game where official Pokémon artwork is progressively reconstructed using geometric primitives (Circles, Triangles, and Lines). Each day features three unique Pokémon to identify within 10 guesses per mode.',
  },
  {
    question: 'How does shape progression work across the three modes?',
    answer:
      'Each mode starts at a base shape count and adds more shapes after every incorrect guess across up to 10 guesses: Circles Mode starts at 40 shapes (+20 per guess, up to 220), Triangles Mode starts at 20 shapes (+10 per guess, up to 110), and Lines Mode starts at 50 shapes (+25 per guess, up to 275).',
  },
  {
    question: 'When do new daily puzzles reset?',
    answer:
      'New daily puzzles unlock automatically at local midnight (00:00). Everyone playing the same daily puzzle number gets the exact same three target Pokémon and deterministic geometric reconstructions.',
  },
  {
    question: 'How do Pokédex Clues work?',
    answer:
      'As you make guesses in a mode, Pokédex clues automatically reveal to help narrow down the mystery Pokémon: the Generation clue unlocks at 3 guesses, the Primary Type clue unlocks at 5 guesses, and the Habitat clue unlocks at 7 guesses.',
  },
  {
    question: 'Does playing past puzzles in the Daily Archive affect my stats or PolyDex?',
    answer:
      'No! Playing past puzzles from the Daily Archive is purely for fun and practice. Only today’s live Daily puzzles count toward your Trainer Statistics, Win Streaks, Triple Crown days, Personal PolyDex catches, and Trainer Rank.',
  },
  {
    question: 'How do I unlock entries and geometric previews in my PolyDex?',
    answer:
      'Whenever you catch a Pokémon in today’s Daily puzzle, it is registered in your Personal PolyDex for that shape mode. Clicking any caught Pokémon in the PolyDex opens a showcase of its final geometric reconstructions for every mode you have caught it in.',
  },
  {
    question: 'Where is my game progress stored?',
    answer:
      'All of your daily progress, statistics, streaks, and PolyDex catches are saved locally in your browser’s storage on your device—no account or sign-up required. You can reset your local data anytime from the Settings menu.',
  },
];

export const FaqModal: React.FC<FaqModalProps> = ({ isOpen, onClose }) => {
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const toggleIndex = (idx: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-pop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="faq-modal-title"
      onClick={onClose}
    >
      <div
        className="game-card relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#141C2F] overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-slate-200 dark:border-[#24304d] bg-diagonal-stripes flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <MessageCircleQuestion className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="faq-modal-title"
                className="font-display font-extrabold text-lg text-slate-900 dark:text-white"
              >
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Everything you need to know about PokéShapes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close FAQ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Smoothly Animated Collapsible & Expandable FAQ Accordion List */}
        <div className="p-6 overflow-y-auto space-y-2.5 text-sm">
          {FAQ_ITEMS.map((item, idx) => {
            const isExpanded = openIndices.has(idx);
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(idx)}
                  aria-expanded={isExpanded}
                  className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left font-display font-bold text-slate-900 dark:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{item.question}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ease-out ${
                      isExpanded ? 'rotate-180 text-rose-500' : ''
                    }`}
                  />
                </button>

                {/* Animated Accordion Body using CSS Grid 0fr -> 1fr transition */}
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isExpanded
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-3.5 pt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300 pl-10 border-t border-slate-200/50 dark:border-slate-800/80">
                      {item.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Button */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-tactile px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 border-rose-400 border-b-rose-700 text-white font-display font-bold text-xs cursor-pointer"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
