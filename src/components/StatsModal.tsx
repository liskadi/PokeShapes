import React, { useState } from 'react';
import {
  Award,
  BarChart3,
  Check,
  Clock,
  Crown,
  Flame,
  Share2,
  Trophy,
  X,
} from 'lucide-react';
import {
  AllStats,
  DailyGameState,
  GameMode,
  INITIAL_SHAPES,
  MAX_GUESSES,
  ModeStats,
  SHAPES_PER_WRONG_GUESS,
} from '../types/game';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: AllStats;
  dailyState: DailyGameState;
  activeMode: GameMode;
  countdownFormatted: string;
}

type StatsTab = 'all' | GameMode;

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  dailyState,
  activeMode,
  countdownFormatted,
}) => {
  const [selectedTab, setSelectedTab] = useState<StatsTab>(activeMode);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Compute aggregate stats when "all" tab is active
  const displayStats: ModeStats =
    selectedTab === 'all'
      ? {
          played:
            stats.modes.circles.played +
            stats.modes.triangles.played +
            stats.modes.lines.played,
          won:
            stats.modes.circles.won +
            stats.modes.triangles.won +
            stats.modes.lines.won,
          currentStreak: stats.dailyOverallStreak,
          maxStreak: stats.dailyMaxOverallStreak,
          lastPlayedDateKey: stats.lastDailyWinDateKey,
          lastWonDateKey: stats.lastDailyWinDateKey,
          guessDistribution: Array.from({ length: MAX_GUESSES }, (_, i) =>
            (stats.modes.circles.guessDistribution[i] || 0) +
            (stats.modes.triangles.guessDistribution[i] || 0) +
            (stats.modes.lines.guessDistribution[i] || 0)
          ),
        }
      : stats.modes[selectedTab];

  const winPercent =
    displayStats.played > 0
      ? Math.round((displayStats.won / displayStats.played) * 100)
      : 0;

  const maxDistributionVal = Math.max(1, ...displayStats.guessDistribution);

  // Highlight today's winning guess count bar if viewing a specific mode that was won today
  const todayModeWinGuessCount =
    selectedTab !== 'all' && dailyState.modes[selectedTab].status === 'won'
      ? dailyState.modes[selectedTab].guesses.length
      : null;

  const handleShareResults = () => {
    const modeMeta: { mode: GameMode; icon: string; name: string }[] = [
      { mode: 'circles', icon: '🔵', name: 'Circles' },
      { mode: 'triangles', icon: '🔺', name: 'Triangles' },
      { mode: 'lines', icon: '⚡', name: 'Lines' },
    ];

    const lines = modeMeta.map(({ mode, icon, name }) => {
      const mState = dailyState.modes[mode];
      if (mState.status === 'playing' && mState.guesses.length === 0) {
        return `${icon} ${name}: Not played yet`;
      }
      const blocks = mState.guesses
        .map((g) => (g.comparison.isCorrect ? '🟩' : '🟥'))
        .join('');
      const wrongCount = mState.guesses.filter(
        (g) => !g.comparison.isCorrect
      ).length;
      const finalShapes =
        INITIAL_SHAPES + wrongCount * SHAPES_PER_WRONG_GUESS;

      const scoreStr =
        mState.status === 'won'
          ? `${mState.guesses.length}/${MAX_GUESSES} (${finalShapes} shapes)`
          : mState.status === 'lost'
          ? `X/${MAX_GUESSES}`
          : `${mState.guesses.length}/${MAX_GUESSES} (in progress)`;

      return `${icon} ${name}: ${scoreStr} ${blocks}`;
    });

    const shareText = [
      `PolyMon Daily #${dailyState.puzzleNumber} (${dailyState.dateKey})`,
      ...lines,
      `🔥 Daily Streak: ${stats.dailyOverallStreak}`,
    ].join('\n');

    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-pop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stats-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="stats-modal-title"
                className="font-display font-extrabold text-lg text-slate-900 dark:text-white"
              >
                Trainer Statistics & Streaks
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily Puzzle #{dailyState.puzzleNumber} • {dailyState.dateKey}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close Statistics"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Filter Tabs */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {(
              [
                { id: 'all', label: 'Overall' },
                { id: 'circles', label: '● Circles' },
                { id: 'triangles', label: '▲ Triangles' },
                { id: 'lines', label: '╱ Lines' },
              ] as { id: StatsTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTab(tab.id)}
                className={`py-1.5 px-2 rounded-lg text-xs font-display font-bold transition-all ${
                  selectedTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 4 KPI Metric Cards */}
          <div className="grid grid-cols-4 gap-2.5">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 p-3 text-center">
              <div className="font-mono font-extrabold text-2xl text-slate-900 dark:text-white">
                {displayStats.played}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Played
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 p-3 text-center">
              <div className="font-mono font-extrabold text-2xl text-emerald-500">
                {winPercent}%
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Win Rate
              </div>
            </div>

            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3 text-center">
              <div className="font-mono font-extrabold text-2xl text-amber-500 flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 fill-amber-500" />
                <span>{displayStats.currentStreak}</span>
              </div>
              <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300 mt-0.5">
                Current Streak
              </div>
            </div>

            <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/25 p-3 text-center">
              <div className="font-mono font-extrabold text-2xl text-indigo-500 dark:text-indigo-400 flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" />
                <span>{displayStats.maxStreak}</span>
              </div>
              <div className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300 mt-0.5">
                Max Streak
              </div>
            </div>
          </div>

          {/* Triple Crown Achievement Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border border-amber-500/25 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Crown className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <div className="text-xs font-display font-bold text-slate-900 dark:text-white">
                  Triple Crown Days (All 3 Shape Modes Solved)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Catch the daily Pokémon in Circles, Triangles & Lines on the same day
                </div>
              </div>
            </div>
            <span className="font-mono font-extrabold text-lg text-amber-500 px-2.5 py-0.5 rounded-lg bg-amber-500/15">
              {stats.tripleCrownDays}
            </span>
          </div>

          {/* Guess Distribution Chart (1 to 10) */}
          <div>
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-between">
              <span>Guess Distribution (1 – 10 Guesses)</span>
              <span className="font-mono text-[11px] normal-case">
                15 → 105 Shapes
              </span>
            </h3>

            <div className="space-y-1.5">
              {displayStats.guessDistribution.map((count, index) => {
                const guessNum = index + 1;
                const shapesAtGuess =
                  INITIAL_SHAPES + index * SHAPES_PER_WRONG_GUESS;
                const widthPercent = Math.max(
                  7,
                  Math.round((count / maxDistributionVal) * 100)
                );
                const isTodayHighlight = todayModeWinGuessCount === guessNum;

                return (
                  <div
                    key={guessNum}
                    className="flex items-center gap-2 text-xs font-mono"
                  >
                    <span className="w-5 text-right font-bold text-slate-600 dark:text-slate-400">
                      {guessNum}
                    </span>
                    <span className="w-14 text-[10px] text-slate-400 dark:text-slate-500">
                      ({shapesAtGuess}sh)
                    </span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800/70 rounded-lg overflow-hidden h-6 p-0.5">
                      <div
                        style={{ width: `${widthPercent}%` }}
                        className={`h-full rounded-md px-2 flex items-center justify-end font-bold text-xs transition-all ${
                          isTodayHighlight
                            ? 'bg-emerald-500 text-white'
                            : count > 0
                            ? 'bg-rose-500/85 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer: Next Daily Puzzle Countdown & Share Button */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Next Daily PolyMon
                </div>
                <div className="font-mono font-extrabold text-xl text-slate-900 dark:text-white">
                  {countdownFormatted}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShareResults}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-display font-bold text-sm shadow-lg shadow-rose-500/25 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied Daily Summary!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share Daily Results</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
