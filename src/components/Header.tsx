import React from 'react';
import {
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  Flame,
  HelpCircle,
  History,
  Moon,
  Settings,
  Sun,
} from 'lucide-react';
import { ThemeMode } from '../types/game';

interface HeaderProps {
  puzzleNumber: number;
  dateKey: string;
  isArchiveDate: boolean;
  countdownFormatted: string;
  dailyStreak: number;
  polyDexCount: number;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onSelectToday: () => void;
  onOpenArchive: () => void;
  onOpenPolyDex: () => void;
  onOpenHowToPlay: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  puzzleNumber,
  dateKey,
  isArchiveDate,
  countdownFormatted,
  dailyStreak,
  polyDexCount,
  theme,
  onToggleTheme,
  onSelectToday,
  onOpenArchive,
  onOpenPolyDex,
  onOpenHowToPlay,
  onOpenStats,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 via-red-600 to-indigo-600 p-0.5 shadow-lg shadow-rose-500/20 flex items-center justify-center group">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
              <svg
                viewBox="0 0 100 100"
                className="w-7 h-7 transition-transform duration-300 group-hover:rotate-12"
              >
                <polygon
                  points="50,6 88,24 95,48 5,48 12,24"
                  fill="#F43F5E"
                />
                <polygon
                  points="50,6 88,24 50,48"
                  fill="#FDA4AF"
                  opacity="0.45"
                />
                <polygon
                  points="5,52 95,52 88,76 50,94 12,76"
                  fill="#F1F5F9"
                />
                <polygon
                  points="50,32 66,41 66,59 50,68 34,59 34,41"
                  fill="#0F172A"
                />
                <circle cx="50" cy="50" r="10" fill="#38BDF8" />
              </svg>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900 dark:text-white">
                POKÉ<span className="text-rose-500">SHAPES</span>
              </h1>
              <button
                type="button"
                onClick={onOpenArchive}
                className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border transition-colors ${
                  isArchiveDate
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 hover:bg-rose-500/20'
                }`}
                title="Click to browse Past Daily Archive or Yesterday's Champions"
              >
                <span>
                  {isArchiveDate ? 'ARCHIVE' : 'DAILY'} #{puzzleNumber}
                </span>
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>{dateKey}</span>
              <span className="hidden md:inline text-slate-300 dark:text-slate-700">
                •
              </span>
              <span className="hidden md:inline-flex items-center gap-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                <Clock className="w-3 h-3 text-sky-400" />
                Reset in {countdownFormatted}
              </span>
            </p>
          </div>
        </div>

        {/* Center Switcher (Today's Daily vs Past Archive) */}
        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onSelectToday}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !isArchiveDate
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Play Today's Live Daily Puzzles"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Today&apos;s Daily</span>
          </button>
          <button
            type="button"
            onClick={onOpenArchive}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isArchiveDate
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Browse Yesterday's Champions & Past Daily Archive"
          >
            <History className="w-3.5 h-3.5" />
            <span>Past Archive</span>
          </button>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* PolyDex Button */}
          <button
            type="button"
            onClick={onOpenPolyDex}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-colors"
            title="Open Personal PolyDex & Trainer Rank"
          >
            <BookOpen className="w-4 h-4" />
            <span className="font-mono">{polyDexCount}</span>
          </button>

          {/* Streak Pill */}
          <button
            type="button"
            onClick={onOpenStats}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-bold transition-colors"
            title="Current Daily Streak — Click to view Statistics"
          >
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span className="font-mono">{dailyStreak}</span>
          </button>

          {/* Quick Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 transition-colors"
            aria-label="Toggle Light/Dark Theme"
            title={
              theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'
            }
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* How to Play */}
          <button
            type="button"
            onClick={onOpenHowToPlay}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 transition-colors"
            aria-label="How to Play"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Statistics */}
          <button
            type="button"
            onClick={onOpenStats}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 transition-colors"
            aria-label="Statistics"
            title="Statistics & Streaks"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 transition-colors"
            aria-label="Game Settings"
            title="Game Settings (Theme, Color Blind Mode, Hints)"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Today / Archive Bar */}
      <div className="sm:hidden px-4 pb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onSelectToday}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
              !isArchiveDate
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>Today</span>
          </button>
          <button
            type="button"
            onClick={onOpenArchive}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
              isArchiveDate
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            <History className="w-3 h-3" />
            <span>Archive</span>
          </button>
        </div>

        <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
          <Clock className="w-3 h-3 text-sky-400" />
          Next: {countdownFormatted}
        </span>
      </div>
    </header>
  );
};
