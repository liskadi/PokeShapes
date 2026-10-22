import React, { useMemo, useState } from 'react';
import { GeometrizeCanvas } from './components/GeometrizeCanvas';
import { GuessList } from './components/GuessList';
import { Header } from './components/Header';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ModeSelector } from './components/ModeSelector';
import { PokemonSearch } from './components/PokemonSearch';
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
    playCategory,
    selectPlayCategory,
    dailyState,
    currentModeState,
    targetPokemon,
    pokemonIndex,
    isIndexLoading,
    unlockedShapeCount,
    guessesRemaining,
    isSubmittingGuess,
    submitGuess,
    startNewPracticePuzzle,
    stats,
  } = useDailyGame({
    currentDateKey,
    soundEnabled: settings.soundEnabled,
  });

  const {
    shapes,
    canvasSize,
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
  });

  // Modals state
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(
    () => !hasSeenOnboarding()
  );
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation Header */}
      <Header
        puzzleNumber={dailyState.puzzleNumber}
        dateKey={dailyState.dateKey}
        countdownFormatted={countdownFormatted}
        dailyStreak={stats.dailyOverallStreak}
        playCategory={playCategory}
        onSelectCategory={selectPlayCategory}
        theme={settings.theme}
        onToggleTheme={() =>
          updateSettings({
            theme: settings.theme === 'dark' ? 'light' : 'dark',
          })
        }
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

      {/* Main Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-5 sm:py-7 space-y-5">
        {/* 3 Shape Game Modes Selector (Circles, Triangles, Lines) */}
        <ModeSelector
          activeMode={activeMode}
          modesState={
            playCategory === 'daily'
              ? dailyState.modes
              : {
                  circles:
                    activeMode === 'circles'
                      ? currentModeState
                      : dailyState.modes.circles,
                  triangles:
                    activeMode === 'triangles'
                      ? currentModeState
                      : dailyState.modes.triangles,
                  lines:
                    activeMode === 'lines'
                      ? currentModeState
                      : dailyState.modes.lines,
                }
          }
          onSelectMode={selectMode}
        />

        {/* Responsive Game Arena Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Geometrize Scanner Viewport */}
          <div className="lg:col-span-6">
            <GeometrizeCanvas
              mode={activeMode}
              playCategory={playCategory}
              status={currentModeState.status}
              shapes={shapes}
              canvasSize={canvasSize}
              unlockedShapeCount={unlockedShapeCount}
              guessesUsed={currentModeState.guesses.length}
              isInitialLoading={isInitialLoading || !targetPokemon}
              isBackgroundComputing={isBackgroundComputing}
              error={error}
              onRetry={retry}
              targetPokemon={targetPokemon}
              highContrastCanvas={settings.highContrastCanvas}
              animateShapes={settings.animateShapes}
              onOpenStats={() => setIsStatsOpen(true)}
              onNextMode={handleNextMode}
              onNewPracticePuzzle={() => startNewPracticePuzzle(activeMode)}
            />
          </div>

          {/* Right Column: Search Combobox & Guess Log */}
          <div className="lg:col-span-6 space-y-4">
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
              guesses={currentModeState.guesses}
              showAttributeHints={settings.showAttributeHints}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 dark:border-slate-800/70 py-4 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="font-display text-slate-700 dark:text-slate-300">
              PolyMon
            </strong>{' '}
            — Daily Geometric Pokémon Guessing Game
          </div>
          <div className="flex items-center gap-3">
            <span>
              Powered by{' '}
              <a
                href="https://github.com/Tw1ddle/geometrize"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-rose-500 transition-colors"
              >
                Tw1ddle/geometrize
              </a>
            </span>
            <span>•</span>
            <span>
              Sprites via{' '}
              <a
                href="https://pokeapi.co/docs/v2"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-rose-500 transition-colors"
              >
                PokéAPI v2
              </a>
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={handleCloseHowToPlay}
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
      />
    </div>
  );
}
export default App;
