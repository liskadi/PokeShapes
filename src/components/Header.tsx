import React from 'react';
import {
  BarChart3,
  BookOpen,
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
  isArchiveDate: boolean;
  dailyStreak: number;
  polyDexCount: number;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenArchive: () => void;
  onOpenPolyDex: () => void;
  onOpenHowToPlay: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  puzzleNumber,
  isArchiveDate,
  dailyStreak,
  polyDexCount,
  theme,
  onToggleTheme,
  onOpenArchive,
  onOpenPolyDex,
  onOpenHowToPlay,
  onOpenStats,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-slate-300 dark:border-[#2C3E63] bg-white/95 dark:bg-[#11182B]/95 backdrop-blur-md shadow-[0_3px_0_rgba(203,213,225,0.65)] dark:shadow-[0_3px_0_rgba(30,43,71,0.85)] transition-colors">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-900 dark:bg-[#0B101D] border-2 border-slate-800 dark:border-[#334770] shadow-[0_2px_0_#1e293b] flex items-center justify-center group overflow-hidden shrink-0">
            <svg
              viewBox="0 0 100 100"
              className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 group-hover:rotate-12"
            >
              <polygon
                points="50,6 88,24 95,48 5,48 12,24"
                fill="#FF385C"
              />
              <polygon
                points="50,6 88,24 50,48"
                fill="#FDA4AF"
                opacity="0.45"
              />
              <polygon
                points="5,52 95,52 88,76 50,94 12,76"
                fill="#F8FAFC"
              />
              <polygon
                points="50,32 66,41 66,59 50,68 34,59 34,41"
                fill="#0F172A"
              />
              <circle cx="50" cy="50" r="10" fill="#38BDF8" />
              <circle cx="47" cy="47" r="3.5" fill="#E0F2FE" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <h1 className="font-display font-bold text-lg sm:text-2xl tracking-wide text-slate-900 dark:text-white leading-none truncate">
              POKÉ<span className="text-rose-500">SHAPES</span>
            </h1>
            <button
              type="button"
              onClick={onOpenArchive}
              className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold border-2 transition-all cursor-pointer shrink-0 ${
                isArchiveDate
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/35 hover:bg-rose-500/25'
              }`}
              title="Browse Past Daily Archive"
            >
              <span className="hidden sm:inline">
                {isArchiveDate ? 'ARCHIVE' : 'DAILY'}{' '}
              </span>
              <span>#{puzzleNumber}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenPolyDex}
            className="btn-tactile flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 border-b-emerald-600/80 dark:border-emerald-400/45 dark:border-b-emerald-500/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold cursor-pointer"
            title="Open Personal PolyDex & Trainer Rank"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-mono font-bold">{polyDexCount}</span>
          </button>

          <button
            type="button"
            onClick={onOpenStats}
            className="btn-tactile flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 border-b-amber-600/80 dark:border-amber-400/45 dark:border-b-amber-500/80 text-amber-700 dark:text-amber-300 text-xs font-bold cursor-pointer"
            title="Current Daily Streak — Click to view Statistics"
          >
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-500 text-amber-500" />
            <span className="font-mono font-bold">{dailyStreak}</span>
          </button>

          <button
            type="button"
            onClick={onOpenArchive}
            className={`btn-tactile p-1.5 sm:p-2 rounded-xl cursor-pointer ${
              isArchiveDate
                ? 'bg-amber-500 text-slate-950 border-amber-400 border-b-amber-700'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#1C2842] dark:hover:bg-[#243354] text-slate-700 dark:text-slate-100 border-slate-300 border-b-slate-400 dark:border-[#334770] dark:border-b-[#435C8F]'
            }`}
            aria-label="Past Daily Archive"
            title="Past Daily Archive"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenStats}
            className="btn-tactile p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1C2842] dark:hover:bg-[#243354] text-slate-700 dark:text-slate-100 border-slate-300 border-b-slate-400 dark:border-[#334770] dark:border-b-[#435C8F] cursor-pointer"
            aria-label="Statistics"
            title="Statistics & Streaks"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenHowToPlay}
            className="btn-tactile p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1C2842] dark:hover:bg-[#243354] text-slate-700 dark:text-slate-100 border-slate-300 border-b-slate-400 dark:border-[#334770] dark:border-b-[#435C8F] cursor-pointer"
            aria-label="How to Play"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="btn-tactile p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1C2842] dark:hover:bg-[#243354] text-slate-700 dark:text-slate-100 border-slate-300 border-b-slate-400 dark:border-[#334770] dark:border-b-[#435C8F] cursor-pointer"
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

          <button
            type="button"
            onClick={onOpenSettings}
            className="btn-tactile p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1C2842] dark:hover:bg-[#243354] text-slate-700 dark:text-slate-100 border-slate-300 border-b-slate-400 dark:border-[#334770] dark:border-b-[#435C8F] cursor-pointer"
            aria-label="Game Settings"
            title="Game Settings & Accessibility"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
