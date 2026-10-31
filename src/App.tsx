import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Coffee,
  Github,
  HelpCircle,
  History,
  Mail,
} from 'lucide-react';
import { ArchiveModal } from './components/ArchiveModal';
import { FaqModal } from './components/FaqModal';
import { GeometrizeCanvas } from './components/GeometrizeCanvas';
import { GuessList } from './components/GuessList';
import { Header } from './components/Header';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ModeSelector } from './components/ModeSelector';
import { PokemonSearch } from './components/PokemonSearch';
import { PolyDexModal } from './components/PolyDexModal';
import { ScannerClues } from './components/ScannerClues';
import { SettingsModal } from './components/SettingsModal';
import { StatsModal } from './components/StatsModal';
import { useDailyGame } from './hooks/useDailyGame';
import { useGeometrize } from './hooks/useGeometrize';
import { useMidnightRollover } from './hooks/useMidnightRollover';
import { useSettings } from './hooks/useSettings';
import { GameMode } from './types/game';
import { hasSeenOnboarding, markOnboardingSeen } from './utils/storage';

const MODE_ORDER: GameMode[] = ['circles', 'triangles', 'lines'];

export function App() {
  const { settings, updateSettings } = useSettings();
  const [rolloverBanner, setRolloverBanner] = useState<string | null>(null);

  const { currentDateKey, countdownFormatted } = useMidnightRollover(
    (newDateKey) => {
      setRolloverBanner(
        `Midnight reached! Daily puzzles have refreshed for ${newDateKey}.`
      );
    }
  );

  const {
    activeMode,
    selectMode,
    selectedDailyDateKey,
    selectArchiveDate,
    dailyState,
    currentModeState,
    targetPokemon,
    targetDetailsMap,
    yesterdayDateKey,
    yesterdayPuzzleNumber,
    yesterdayTargets,
    backgroundPrewarmTasks,
    pokemonIndex,
    isIndexLoading,
    unlockedShapeCount,
    wrongGuessesCount,
    guessesRemaining,
    isSubmittingGuess,
    submitGuess,
    giveUpCurrentGame,
    resetAllGameData,
    stats,
    polyDex,
  } = useDailyGame({
    currentDateKey,
    soundEnabled: settings.soundEnabled,
  });

  const {
    shapes,
    canvasSize,
    croppedArtworkDataUrl,
    isInitialLoading,
    isBackgroundComputing,
    error,
    retry,
  } = useGeometrize({
    dateKey: currentModeState.dateKey,
    mode: activeMode,
    pokemonId: currentModeState.targetPokemonId,
    officialArtworkUrl: targetPokemon?.officialArtworkUrl || null,
    seed: currentModeState.geometrizeSeed,
    backgroundTasks: backgroundPrewarmTasks,
  });

  // Modals state
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(
    () => !hasSeenOnboarding()
  );
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(false);
  const [isPolyDexOpen, setIsPolyDexOpen] = useState<boolean>(false);
  const [isFaqOpen, setIsFaqOpen] = useState<boolean>(false);

  const handleCloseHowToPlay = () => {
    markOnboardingSeen();
    setIsHowToPlayOpen(false);
  };

  const guessedIds = useMemo(
    () => new Set(currentModeState.guesses.map((g) => g.pokemon.id)),
    [currentModeState.guesses]
  );

  const handleNextMode = () => {
    const currentIdx = MODE_ORDER.indexOf(activeMode);
    const nextMode = MODE_ORDER[(currentIdx + 1) % MODE_ORDER.length];
    selectMode(nextMode);
  };

  const isArchiveDate = selectedDailyDateKey !== currentDateKey;

  return (
    <div className="min-h-screen flex flex-col bg-pokeball-wallpaper text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation Header */}
      <Header
        puzzleNumber={dailyState.puzzleNumber}
        isArchiveDate={isArchiveDate}
        dailyStreak={stats.dailyOverallStreak}
        polyDexCount={Object.keys(polyDex).length}
        theme={settings.theme}
        onToggleTheme={() =>
          updateSettings({
            theme: settings.theme === 'dark' ? 'light' : 'dark',
          })
        }
        onOpenArchive={() => setIsArchiveOpen(true)}
        onOpenPolyDex={() => setIsPolyDexOpen(true)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Midnight Live Rollover Notification */}
      {rolloverBanner && (
        <div className="bg-sky-500/15 border-b border-sky-500/30 px-4 py-2 text-center text-xs font-medium text-sky-600 dark:text-sky-300 flex items-center justify-center gap-3">
          <span>{rolloverBanner}</span>
          <button
            type="button"
            onClick={() => setRolloverBanner(null)}
            className="underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Past Daily Archive Active Banner */}
      {isArchiveDate && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs font-medium text-amber-700 dark:text-amber-300">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>
                Playing Past Archive Puzzle:{' '}
                <strong>
                  Daily #{dailyState.puzzleNumber} ({dailyState.dateKey})
                </strong>
              </span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsArchiveOpen(true)}
                className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 font-semibold transition-colors"
              >
                Browse Archive
              </button>
              <button
                type="button"
                onClick={() => selectArchiveDate(currentDateKey)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-500 text-white font-bold hover:bg-rose-600 transition-colors"
              >
                <Calendar className="w-3 h-3" />
                <span>Return to Today</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 py-3 sm:px-4 sm:py-6 space-y-3.5 sm:space-y-5">
        {/* 3 Shape Game Modes Selector (Circles, Triangles, Lines) */}
        <ModeSelector
          activeMode={activeMode}
          modesState={dailyState.modes}
          onSelectMode={selectMode}
        />

        {/* Responsive Game Arena Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:gap-6 items-start">
          {/* Left Column: Geometrize Scanner Viewport */}
          <div className="lg:col-span-6">
            <GeometrizeCanvas
              mode={activeMode}
              status={currentModeState.status}
              gaveUp={currentModeState.gaveUp}
              shapes={shapes}
              canvasSize={canvasSize}
              croppedArtworkDataUrl={croppedArtworkDataUrl}
              unlockedShapeCount={unlockedShapeCount}
              guessesUsed={currentModeState.guesses.length}
              isInitialLoading={isInitialLoading || !targetPokemon}
              isBackgroundComputing={isBackgroundComputing}
              error={error}
              onRetry={retry}
              targetPokemon={targetPokemon}
              highContrastCanvas={settings.highContrastCanvas}
              animateShapes={settings.animateShapes}
              onGiveUp={giveUpCurrentGame}
              onOpenStats={() => setIsStatsOpen(true)}
              onNextMode={handleNextMode}
            />
          </div>

          {/* Right Column: Scanner Clues, Search Combobox & Guess Log */}
          <div className="lg:col-span-6 space-y-3 sm:space-y-4">
            {/* 2.1 Progressive Scanner Clues (3 Wrong = Gen, 5 Wrong = Primary Type, 7 Wrong = Habitat + Official Cry) */}
            <ScannerClues
              wrongGuessesCount={wrongGuessesCount}
              status={currentModeState.status}
              targetPokemon={targetPokemon}
            />

            <PokemonSearch
              pokemonIndex={pokemonIndex}
              isIndexLoading={isIndexLoading}
              guessedIds={guessedIds}
              disabled={
                currentModeState.status !== 'playing' ||
                isInitialLoading ||
                !targetPokemon
              }
              isSubmitting={isSubmittingGuess}
              guessesRemaining={guessesRemaining}
              onSubmitGuess={submitGuess}
            />

            <GuessList
              mode={activeMode}
              guesses={currentModeState.guesses}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-slate-300 dark:border-[#2C3E63] py-5 px-4 text-xs text-slate-600 dark:text-slate-400 bg-white/90 dark:bg-[#11182B]/90 backdrop-blur-xs">
        <div className="max-w-5xl mx-auto space-y-3">
          {/* Top Row: Left Project Version/Year, Center Action Buttons, Right Geometrize Credit */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Left: Project Name - Version - Year */}
            <div className="font-display font-bold text-sm text-slate-800 dark:text-slate-200 whitespace-nowrap">
              PokéShapes - v1.0.0 - 2026
            </div>

            {/* Center: Action Icon Buttons with Hover Text */}
            <div className="flex items-center justify-center gap-2">
              <a
                href="mailto:?subject=Pok%C3%A9Shapes%20Feedback%20%26%20Bugs"
                title="Feedback & Bugs"
                aria-label="Feedback & Bugs"
                className="btn-tactile inline-flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-[#1C2842] border-slate-300 border-b-slate-400 dark:border-[#334770] dark:border-b-[#435C8F] hover:border-rose-500 text-slate-700 dark:text-slate-100 hover:text-rose-500 dark:hover:text-rose-400"
              >
                <Mail className="w-4 h-4" />
              </a>

              <a
                href="https://github.com/liskadi/PokeShapes"
                target="_blank"
                rel="noreferrer"
                title="Github"
                aria-label="Github"
                className="btn-tactile inline-flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-[#1C2842] border-slate-300 border-b-slate-400 dark:border-[#334770] dark:border-b-[#435C8F] hover:border-rose-500 text-slate-700 dark:text-slate-100 hover:text-rose-500 dark:hover:text-rose-400"
              >
                <Github className="w-4 h-4" />
              </a>

              <a
                href="https://ko-fi.com/liskadi"
                target="_blank"
                rel="noreferrer"
                title="Ko-Fi"
                aria-label="Ko-Fi"
                className="btn-tactile inline-flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-[#1C2842] border-slate-300 border-b-slate-400 dark:border-[#334770] dark:border-b-[#435C8F] hover:border-rose-500 text-slate-700 dark:text-slate-100 hover:text-rose-500 dark:hover:text-rose-400"
              >
                <Coffee className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => setIsFaqOpen(true)}
                title="FAQ"
                aria-label="FAQ"
                className="btn-tactile inline-flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-[#1C2842] border-slate-300 border-b-slate-400 dark:border-[#334770] dark:border-b-[#435C8F] hover:border-rose-500 text-slate-700 dark:text-slate-100 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Next Daily Timer + Powered by geometrize */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 whitespace-nowrap font-medium">
              <span
                className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 dark:text-slate-400"
                title="Time until the next daily PokéShapes puzzle"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Next in {countdownFormatted}</span>
              </span>
              <span
                className="text-slate-300 dark:text-slate-700"
                aria-hidden="true"
              >
                •
              </span>
              <div>
                Powered by{' '}
                <a
                  href="https://github.com/Tw1ddle/geometrize"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-rose-500 transition-colors font-display font-bold text-slate-800 dark:text-slate-200"
                >
                  geometrize
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Row: Legal & Trademark Disclaimer */}
          <p className="text-[11px] leading-relaxed text-center text-slate-400 dark:text-slate-500 max-w-4xl mx-auto">
            PokéShapes is an unofficial fan-made project and is not affiliated with,
            endorsed, sponsored, or approved by Nintendo, Creatures Inc., GAME
            FREAK inc., or The Pokémon Company. We do not own or claim any rights
            to any Pokémon names, images, audio, or trademarks. All Pokémon
            properties and references are copyright of their respective owners
            and are used strictly for non-commercial, informational, and
            educational purposes only.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={handleCloseHowToPlay}
      />
      <FaqModal
        isOpen={isFaqOpen}
        onClose={() => setIsFaqOpen(false)}
      />
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        dailyState={dailyState}
        activeMode={activeMode}
        countdownFormatted={countdownFormatted}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        onResetAllData={resetAllGameData}
      />
      <ArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        todayDateKey={currentDateKey}
        selectedDateKey={selectedDailyDateKey}
        onSelectArchiveDate={selectArchiveDate}
        yesterdayDateKey={yesterdayDateKey}
        yesterdayPuzzleNumber={yesterdayPuzzleNumber}
        yesterdayTargets={yesterdayTargets}
        targetDetailsMap={targetDetailsMap}
      />
      <PolyDexModal
        isOpen={isPolyDexOpen}
        onClose={() => setIsPolyDexOpen(false)}
        polyDex={polyDex}
        pokemonIndex={pokemonIndex}
      />
    </div>
  );
}
export default App;
