import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  History,
  Play,
  Trophy,
  X,
  XCircle,
} from 'lucide-react';
import { GameMode } from '../types/game';
import { PokemonDetails } from '../types/pokemon';
import { getArchiveDateKeys } from '../utils/dailySeed';
import { loadDailyState } from '../utils/storage';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayDateKey: string;
  selectedDateKey: string;
  onSelectArchiveDate: (dateKey: string) => void;
  yesterdayDateKey: string;
  yesterdayPuzzleNumber: number;
  yesterdayTargets: Record<GameMode, number>;
  targetDetailsMap: Record<number, PokemonDetails>;
}

function renderShapeModeSvg(mode: GameMode) {
  if (mode === 'circles') {
    return (
      <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current">
        <circle cx="10" cy="10" r="6.5" />
      </svg>
    );
  }
  if (mode === 'triangles') {
    return (
      <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current">
        <polygon points="10,3 17.5,16.5 2.5,16.5" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 20 20"
      className="w-3.5 h-3.5 stroke-current"
      fill="none"
      strokeWidth="2.8"
      strokeLinecap="round"
    >
      <line x1="4" y1="16" x2="16" y2="4" />
    </svg>
  );
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  todayDateKey,
  selectedDateKey,
  onSelectArchiveDate,
  yesterdayDateKey,
  yesterdayPuzzleNumber,
  yesterdayTargets,
  targetDetailsMap,
}) => {
  const [revealYesterday, setRevealYesterday] = useState(false);

  if (!isOpen) return null;

  const archiveDates = getArchiveDateKeys(todayDateKey, 31);

  const yesterdayModes: { mode: GameMode; label: string }[] = [
    { mode: 'circles', label: 'Circles' },
    { mode: 'triangles', label: 'Triangles' },
    { mode: 'lines', label: 'Lines' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-pop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-modal-title"
      onClick={onClose}
    >
      <div
        className="game-card relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#141C2F] overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b-2 border-slate-200 dark:border-[#24304d] bg-diagonal-stripes flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="archive-modal-title"
                className="font-display font-extrabold text-lg text-slate-900 dark:text-white"
              >
                Yesterday&apos;s Champions & Daily Archive
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check yesterday&apos;s answers or replay past puzzles (past puzzles do not affect stats or streaks)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close Archive"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex flex-col gap-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Yesterday&apos;s Champions (Daily #{yesterdayPuzzleNumber} •{' '}
                  {yesterdayDateKey})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRevealYesterday((v) => !v)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-400 transition-colors"
                >
                  {revealYesterday ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide Answers</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-rose-500" />
                      <span>Reveal Yesterday&apos;s Pokémon</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectArchiveDate(yesterdayDateKey);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors"
                >
                  <Play className="w-3 h-3" />
                  <span>Play #{yesterdayPuzzleNumber}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {yesterdayModes.map(({ mode, label }) => {
                const pokeId = yesterdayTargets[mode];
                const details = targetDetailsMap[pokeId];

                return (
                  <div
                    key={mode}
                    className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 flex flex-col items-center text-center"
                  >
                    <span className="inline-flex items-center gap-1 text-[11px] font-display font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                      {renderShapeModeSvg(mode)}
                      <span>{label}</span>
                    </span>

                    {revealYesterday && details ? (
                      <>
                        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 p-1.5 mb-1.5">
                          <img
                            src={details.officialArtworkUrl}
                            alt={details.displayName}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="font-display font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {details.displayName}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">
                          #{String(details.id).padStart(4, '0')}
                        </div>
                      </>
                    ) : (
                      <div className="py-4 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono font-bold text-sm mb-1">
                          ?
                        </div>
                        <span className="text-[10px]">Spoiler Protected</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>Select a Daily Puzzle From the Archive</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {archiveDates.length} Days Available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {archiveDates.map(({ dateKey, puzzleNumber, isToday, isYesterday }) => {
                const savedDay = loadDailyState(dateKey, isToday);
                const isSelected = selectedDateKey === dateKey;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => {
                      onSelectArchiveDate(dateKey);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                          Daily #{puzzleNumber}
                        </span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500 text-white">
                            TODAY
                          </span>
                        )}
                        {isYesterday && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-500">
                            YESTERDAY
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {dateKey}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(['circles', 'triangles', 'lines'] as GameMode[]).map(
                        (m) => {
                          const st = savedDay.modes[m]?.status || 'playing';
                          const hasGuesses =
                            (savedDay.modes[m]?.guesses?.length || 0) > 0;
                          return (
                            <span
                              key={m}
                              className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center border ${
                                st === 'won'
                                  ? 'badge-exact'
                                  : st === 'lost'
                                  ? 'badge-none'
                                  : hasGuesses
                                  ? 'badge-partial'
                                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                              }`}
                              title={`${m}: ${st}`}
                            >
                              {st === 'won' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : st === 'lost' ? (
                                <XCircle className="w-3.5 h-3.5" />
                              ) : (
                                renderShapeModeSvg(m)
                              )}
                            </span>
                          );
                        }
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
