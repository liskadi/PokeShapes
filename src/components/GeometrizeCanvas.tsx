import React, { useEffect, useState } from 'react';
import {
  Eye,
  Layers,
  Loader2,
  RefreshCw,
  Share2,
  Sparkles,
  Trophy,
  AlertTriangle,
  Shuffle,
} from 'lucide-react';
import { getGenerationRoman } from '../api/pokeapi';
import {
  GameMode,
  GameStatus,
  INITIAL_SHAPES,
  MAX_GUESSES,
  MAX_SHAPES,
  PlayCategory,
  SHAPES_PER_WRONG_GUESS,
} from '../types/game';
import { PokemonDetails } from '../types/pokemon';

interface GeometrizeCanvasProps {
  mode: GameMode;
  playCategory: PlayCategory;
  status: GameStatus;
  shapes: string[];
  canvasSize: number;
  unlockedShapeCount: number;
  guessesUsed: number;
  isInitialLoading: boolean;
  isBackgroundComputing: boolean;
  error: string | null;
  onRetry: () => void;
  targetPokemon: PokemonDetails | null;
  highContrastCanvas: boolean;
  animateShapes: boolean;
  onOpenStats: () => void;
  onNextMode: () => void;
  onNewPracticePuzzle: () => void;
}

const SHAPE_TIERS = Array.from(
  { length: MAX_GUESSES },
  (_, i) => INITIAL_SHAPES + i * SHAPES_PER_WRONG_GUESS
); // [15, 25, 35, 45, 55, 65, 75, 85, 95, 105]

const TYPE_COLORS: Record<string, string> = {
  normal: 'bg-stone-500 text-white',
  fire: 'bg-orange-500 text-white',
  water: 'bg-blue-500 text-white',
  electric: 'bg-amber-400 text-slate-950',
  grass: 'bg-emerald-500 text-white',
  ice: 'bg-cyan-400 text-slate-950',
  fighting: 'bg-red-700 text-white',
  poison: 'bg-purple-600 text-white',
  ground: 'bg-amber-700 text-white',
  flying: 'bg-indigo-400 text-white',
  psychic: 'bg-pink-500 text-white',
  bug: 'bg-lime-600 text-white',
  rock: 'bg-yellow-700 text-white',
  ghost: 'bg-violet-800 text-white',
  dragon: 'bg-indigo-700 text-white',
  dark: 'bg-slate-800 text-white border border-slate-600',
  steel: 'bg-slate-500 text-white',
  fairy: 'bg-rose-400 text-white',
};

export const GeometrizeCanvas: React.FC<GeometrizeCanvasProps> = ({
  mode,
  playCategory,
  status,
  shapes,
  canvasSize,
  unlockedShapeCount,
  guessesUsed,
  isInitialLoading,
  isBackgroundComputing,
  error,
  onRetry,
  targetPokemon,
  highContrastCanvas,
  animateShapes,
  onOpenStats,
  onNextMode,
  onNewPracticePuzzle,
}) => {
  // Allows user to scrub back through unlocked shape steps (15, 25, 35, ...)
  const [selectedTier, setSelectedTier] = useState<number>(unlockedShapeCount);
  // Post-game original artwork comparison opacity (0 = pure geometry, 100 = original sprite)
  const [artworkOverlayOpacity, setArtworkOverlayOpacity] = useState<number>(0);

  // Automatically advance the displayed shape tier whenever unlockedShapeCount increases
  useEffect(() => {
    setSelectedTier(unlockedShapeCount);
  }, [unlockedShapeCount, mode, targetPokemon?.id]);

  // Reset overlay when switching modes or starting a new puzzle
  useEffect(() => {
    if (status === 'playing') {
      setArtworkOverlayOpacity(0);
    }
  }, [status, mode, targetPokemon?.id]);

  const effectiveShapeCount = Math.min(
    selectedTier,
    unlockedShapeCount,
    shapes.length || INITIAL_SHAPES
  );

  // Split shapes into older shapes and newly added batch (last 10 shapes) for smooth pop animation
  const previousBatchCutoff = Math.max(0, effectiveShapeCount - SHAPES_PER_WRONG_GUESS);
  const olderShapesMarkup = shapes.slice(0, previousBatchCutoff).join('\n');
  const newestShapesMarkup = shapes
    .slice(previousBatchCutoff, effectiveShapeCount)
    .join('\n');

  const modeBadgeLabel =
    mode === 'circles'
      ? '● Circles Primitive'
      : mode === 'triangles'
      ? '▲ Triangles Primitive'
      : '╱ Lines Primitive';

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl shadow-slate-900/5 dark:shadow-black/40">
      {/* Top Scanner Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <Layers className="w-3.5 h-3.5 text-rose-500" />
            <span>{modeBadgeLabel}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
            <span>{effectiveShapeCount}</span>
            <span className="opacity-60">/</span>
            <span>{MAX_SHAPES} Shapes</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isBackgroundComputing && !isInitialLoading && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-500 dark:text-sky-400"
              title="Pre-computing remaining geometric steps in background worker"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="hidden sm:inline">Refining mesh…</span>
            </span>
          )}

          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              status === 'won'
                ? 'badge-exact'
                : status === 'lost'
                ? 'badge-none'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {status === 'won'
              ? `Caught in ${guessesUsed}/${MAX_GUESSES}!`
              : status === 'lost'
              ? `Fled (${MAX_GUESSES}/${MAX_GUESSES})`
              : `Guess ${guessesUsed + 1} of ${MAX_GUESSES}`}
          </span>
        </div>
      </div>

      {/* Main Geometric Scanner Viewport */}
      <div className="relative mx-auto w-full max-w-[380px] aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-inner group">
        {/* Background Canvas Surface */}
        <div
          className={`w-full h-full flex items-center justify-center transition-colors ${
            highContrastCanvas
              ? 'bg-black'
              : 'bg-[#0F172A] bg-pokedex-grid'
          }`}
        >
          {isInitialLoading ? (
            <div className="flex flex-col items-center justify-center text-center p-6 text-slate-300">
              <div className="relative w-14 h-14 mb-3 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
                <Sparkles className="w-6 h-6 text-rose-400 animate-pulse" />
              </div>
              <p className="font-display font-bold text-sm text-white">
                Geometrizing Pokémon Sprite…
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Constructing {INITIAL_SHAPES} {mode} primitives via Geometrize
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center text-center p-6 text-rose-300">
              <AlertTriangle className="w-10 h-10 text-rose-500 mb-2" />
              <p className="font-semibold text-sm text-white mb-1">
                Scanner Signal Interrupted
              </p>
              <p className="text-xs text-slate-400 mb-4 max-w-xs">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Geometrization</span>
              </button>
            </div>
          ) : (
            <>
              {/* Geometrized SVG Output */}
              <svg
                viewBox={`0 0 ${canvasSize} ${canvasSize}`}
                className={`w-full h-full select-none transition-opacity duration-200 ${
                  animateShapes ? 'animate-shapes-enabled' : ''
                }`}
                style={{
                  opacity:
                    status !== 'playing'
                      ? Math.max(0.1, 1 - artworkOverlayOpacity / 115)
                      : 1,
                }}
                aria-label={`Geometrized Pokémon rendered with ${effectiveShapeCount} ${mode}`}
              >
                <rect
                  x="0"
                  y="0"
                  width={canvasSize}
                  height={canvasSize}
                  fill={highContrastCanvas ? '#000000' : '#0F172A'}
                />
                <g
                  className="shape-batch-older"
                  dangerouslySetInnerHTML={{ __html: olderShapesMarkup }}
                />
                <g
                  key={`batch-${effectiveShapeCount}`}
                  className="shape-batch-new"
                  dangerouslySetInnerHTML={{ __html: newestShapesMarkup }}
                />
              </svg>

              {/* Post-Game Official Artwork Overlay (Unlocked only when game is won or lost) */}
              {status !== 'playing' && targetPokemon && (
                <img
                  src={targetPokemon.officialArtworkUrl}
                  alt={targetPokemon.displayName}
                  className="absolute inset-0 w-full h-full object-contain p-[5%] pointer-events-none transition-opacity duration-150"
                  style={{ opacity: artworkOverlayOpacity / 100 }}
                />
              )}
            </>
          )}
        </div>

        {/* Corner HUD Brackets */}
        <div className="pointer-events-none absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-sky-400/50 rounded-tl" />
        <div className="pointer-events-none absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-sky-400/50 rounded-tr" />
        <div className="pointer-events-none absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-sky-400/50 rounded-bl" />
        <div className="pointer-events-none absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-sky-400/50 rounded-br" />
      </div>

      {/* Shape Progression Tier Scrubber (15 -> 25 -> 35 -> ... -> 105) */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="font-medium">
            Shape Resolution Tiers (+10 per wrong guess):
          </span>
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
            Viewing: {effectiveShapeCount} shapes
          </span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {SHAPE_TIERS.map((tier) => {
            const isUnlocked = tier <= unlockedShapeCount;
            const isSelected = tier === effectiveShapeCount;
            return (
              <button
                key={tier}
                type="button"
                disabled={!isUnlocked}
                onClick={() => setSelectedTier(tier)}
                className={`py-1.5 rounded-lg font-mono text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm scale-[1.03]'
                    : isUnlocked
                    ? 'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400'
                    : 'bg-slate-50 dark:bg-slate-900/40 text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-800/50 cursor-not-allowed'
                }`}
                title={
                  isUnlocked
                    ? `Inspect ${tier} shapes`
                    : `Unlocks at ${tier} shapes`
                }
              >
                {tier}
              </button>
            );
          })}
        </div>
      </div>

      {/* End-of-Game Reveal & Artwork Comparison Panel */}
      {status !== 'playing' && targetPokemon && (
        <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 animate-pop">
          {/* Official Artwork Opacity Slider */}
          <div className="bg-slate-100/90 dark:bg-slate-800/70 rounded-2xl p-3.5 mb-4 border border-slate-200/80 dark:border-slate-700/70">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-sky-500" />
                <span>Compare Geometrized vs. Official Artwork</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setArtworkOverlayOpacity((prev) => (prev > 50 ? 0 : 100))
                  }
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] font-mono hover:border-sky-400 transition-colors"
                >
                  {artworkOverlayOpacity > 50
                    ? 'Show Geometry'
                    : 'Show Official Sprite'}
                </button>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={artworkOverlayOpacity}
              onChange={(e) => setArtworkOverlayOpacity(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg"
              aria-label="Blend between geometrized shapes and official Pokémon artwork"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1">
              <span>100% Geometrized ({effectiveShapeCount} shapes)</span>
              <span>50% Blend</span>
              <span>100% Official Artwork</span>
            </div>
          </div>

          {/* Revealed Pokemon Identity Card */}
          <div
            className={`rounded-2xl p-4 border-2 flex flex-col sm:flex-row items-center justify-between gap-4 ${
              status === 'won' ? 'badge-exact' : 'badge-none'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-white/15 p-1.5 flex items-center justify-center shrink-0">
                <img
                  src={targetPokemon.officialArtworkUrl}
                  alt={targetPokemon.displayName}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold opacity-80">
                    #{String(targetPokemon.id).padStart(4, '0')}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/15 dark:bg-white/10">
                    Gen {getGenerationRoman(targetPokemon.generation)}
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white">
                  {targetPokemon.displayName}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  {targetPokemon.types.map((t) => (
                    <span
                      key={t}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        TYPE_COLORS[t] || 'bg-slate-600 text-white'
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto justify-center">
              {playCategory === 'daily' ? (
                <>
                  <button
                    type="button"
                    onClick={onOpenStats}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-display font-bold text-xs shadow hover:opacity-90 transition-opacity"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                    <span>Stats & Share</span>
                    <Share2 className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onNextMode}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-xs font-semibold transition-colors"
                  >
                    <span>Try Next Shape Mode →</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onNewPracticePuzzle}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-xs shadow transition-colors"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>New Random Pokémon</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
