import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Download,
  Eye,
  Flag,
  Image as ImageIcon,
  Layers,
  Loader2,
  Play,
  RefreshCw,
  Share2,
  Sparkles,
  Square,
  Trophy,
  Volume2,
} from 'lucide-react';
import { getGenerationRoman } from '../api/pokeapi';
import {
  GameMode,
  GameStatus,
  getModeShapeConfig,
  MAX_GUESSES,
} from '../types/game';
import { PokemonDetails } from '../types/pokemon';
import { soundEngine } from '../utils/sound';

interface GeometrizeCanvasProps {
  mode: GameMode;
  status: GameStatus;
  gaveUp?: boolean;
  shapes: string[];
  canvasSize: number;
  croppedArtworkDataUrl: string | null;
  unlockedShapeCount: number;
  guessesUsed: number;
  isInitialLoading: boolean;
  isBackgroundComputing: boolean;
  error: string | null;
  onRetry: () => void;
  targetPokemon: PokemonDetails | null;
  highContrastCanvas: boolean;
  animateShapes: boolean;
  onGiveUp: () => void;
  onOpenStats: () => void;
  onNextMode: () => void;
}

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
  status,
  gaveUp,
  shapes,
  canvasSize,
  croppedArtworkDataUrl,
  unlockedShapeCount,
  guessesUsed,
  isInitialLoading,
  isBackgroundComputing,
  error,
  onRetry,
  targetPokemon,
  highContrastCanvas,
  animateShapes,
  onGiveUp,
  onOpenStats,
  onNextMode,
}) => {
  const shapeCfg = getModeShapeConfig(mode);
  const { initialShapes, increment, maxShapes, tiers: shapeTiers } = shapeCfg;

  // Allows user to scrub back through unlocked shape steps
  const [selectedTier, setSelectedTier] = useState<number>(unlockedShapeCount);
  // Post-game original artwork comparison opacity (0 = pure geometry, 100 = original sprite)
  const [artworkOverlayOpacity, setArtworkOverlayOpacity] = useState<number>(0);

  // 2.2 Timelapse Replay state (1 -> maxShapes)
  const [isReplayingTimelapse, setIsReplayingTimelapse] =
    useState<boolean>(false);
  const [timelapseStep, setTimelapseStep] = useState<number | null>(null);
  const timelapseTimerRef = useRef<number | null>(null);

  // 2.5 Two-click Give Up confirmation state
  const [confirmingGiveUp, setConfirmingGiveUp] = useState<boolean>(false);

  // Automatically advance the displayed shape tier whenever unlockedShapeCount increases
  useEffect(() => {
    setSelectedTier(unlockedShapeCount);
    setConfirmingGiveUp(false);
  }, [unlockedShapeCount, mode, targetPokemon?.id]);

  // Reset overlay & timelapse when switching modes or starting a new puzzle
  useEffect(() => {
    setIsReplayingTimelapse(false);
    setTimelapseStep(null);
    setConfirmingGiveUp(false);
    if (timelapseTimerRef.current) {
      window.clearInterval(timelapseTimerRef.current);
      timelapseTimerRef.current = null;
    }
    if (status === 'playing') {
      setArtworkOverlayOpacity(0);
    }
  }, [status, mode, targetPokemon?.id]);

  // 2.2 Start / Stop 1 -> maxShapes Timelapse Replay
  const handleToggleTimelapse = () => {
    if (isReplayingTimelapse) {
      if (timelapseTimerRef.current) {
        window.clearInterval(timelapseTimerRef.current);
        timelapseTimerRef.current = null;
      }
      setIsReplayingTimelapse(false);
      setTimelapseStep(null);
      return;
    }

    setArtworkOverlayOpacity(0);
    setIsReplayingTimelapse(true);
    setTimelapseStep(1);

    const maxAvailable = Math.min(maxShapes, shapes.length || maxShapes);
    let current = 1;
    // Advance 1 shape at a time at a relaxed pace (~4.8 - 6.0 seconds total)
    const intervalMs = Math.max(
      22,
      Math.min(45, Math.round(5200 / maxAvailable))
    );

    timelapseTimerRef.current = window.setInterval(() => {
      current += 1;
      if (current >= maxAvailable) {
        setTimelapseStep(maxAvailable);
        setSelectedTier(maxAvailable);
        setIsReplayingTimelapse(false);
        if (timelapseTimerRef.current) {
          window.clearInterval(timelapseTimerRef.current);
          timelapseTimerRef.current = null;
        }
      } else {
        setTimelapseStep(current);
      }
    }, intervalMs);
  };

  const effectiveShapeCount =
    timelapseStep !== null
      ? Math.min(timelapseStep, shapes.length || initialShapes)
      : Math.min(
          selectedTier,
          unlockedShapeCount,
          shapes.length || initialShapes
        );

  // Build standalone SVG string for export (2.2 Download SVG / PNG)
  const buildStandaloneSvgString = (count: number = effectiveShapeCount) => {
    const bgHex = highContrastCanvas ? '#000000' : '#0F172A';
    const body = shapes.slice(0, count).join('\n  ');
    return [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasSize} ${canvasSize}" width="1024" height="1024">`,
      `  <rect x="0" y="0" width="${canvasSize}" height="${canvasSize}" fill="${bgHex}" />`,
      `  ${body}`,
      `</svg>`,
    ].join('\n');
  };

  // 2.2 Download SVG
  const handleDownloadSvg = () => {
    const svgContent = buildStandaloneSvgString(effectiveShapeCount);
    const blob = new Blob([svgContent], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = targetPokemon?.name || 'pokemon';
    link.href = url;
    link.download = `pokeshapes-${slug}-${mode}-${effectiveShapeCount}shapes.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2.2 Download PNG (1024x1024 high-res rasterization)
  const handleDownloadPng = () => {
    const svgContent = buildStandaloneSvgString(effectiveShapeCount);
    const blob = new Blob([svgContent], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const exportSize = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = exportSize;
      canvas.height = exportSize;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, exportSize, exportSize);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const slug = targetPokemon?.name || 'pokemon';
        link.href = pngUrl;
        link.download = `pokeshapes-${slug}-${mode}-${effectiveShapeCount}shapes.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Split shapes into older shapes and newly added batch for smooth pop animation
  const previousBatchCutoff = Math.max(0, effectiveShapeCount - increment);
  const olderShapesMarkup = shapes.slice(0, previousBatchCutoff).join('\n');
  const newestShapesMarkup = shapes
    .slice(previousBatchCutoff, effectiveShapeCount)
    .join('\n');

  const modeBadgeLabel =
    mode === 'circles'
      ? '● Circles'
      : mode === 'triangles'
      ? '▲ Triangles'
      : '╱ Lines';

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl shadow-slate-900/5 dark:shadow-black/40">
      {/* Top Scanner Status Bar — Forced Single Line */}
      <div className="flex items-center justify-between gap-1.5 mb-4 whitespace-nowrap overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-display font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <Layers className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>{modeBadgeLabel}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
            <span>{effectiveShapeCount}</span>
            <span className="opacity-60">/</span>
            <span>{maxShapes} Shapes</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isBackgroundComputing && !isInitialLoading && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-500 dark:text-sky-400"
              title="Pre-computing remaining geometric steps in background worker"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="hidden xl:inline">Refining…</span>
            </span>
          )}

          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
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
              ? gaveUp
                ? 'Revealed (Gave Up)'
                : `Fled (${MAX_GUESSES}/${MAX_GUESSES})`
              : `Guess ${guessesUsed + 1} of ${MAX_GUESSES}`}
          </span>
        </div>
      </div>

      {/* Main Geometric Scanner Viewport */}
      <div className="relative mx-auto w-full max-w-[380px] aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-inner group">
        {/* Background Canvas Surface */}
        <div
          className={`w-full h-full flex items-center justify-center transition-colors ${
            highContrastCanvas ? 'bg-black' : 'bg-[#0F172A] bg-pokedex-grid'
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
                Auto-cropping bounding box & constructing {initialShapes} {mode}
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
                  animateShapes && !isReplayingTimelapse
                    ? 'animate-shapes-enabled'
                    : ''
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

              {/* Post-Game Official Artwork Overlay (Uses auto-cropped data URL for 1:1 pixel alignment) */}
              {status !== 'playing' && targetPokemon && (
                <img
                  src={
                    croppedArtworkDataUrl || targetPokemon.officialArtworkUrl
                  }
                  alt={targetPokemon.displayName}
                  className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-150 ${
                    croppedArtworkDataUrl ? 'p-0' : 'p-[6%]'
                  }`}
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

      {/* Shape Progression Tier Scrubber */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="font-medium">
            Shape Resolution Tiers (+{increment} per wrong guess):
          </span>
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
            Viewing: {effectiveShapeCount} shapes
          </span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {shapeTiers.map((tier) => {
            const isUnlocked = tier <= unlockedShapeCount;
            const isSelected =
              !isReplayingTimelapse && tier === effectiveShapeCount;
            return (
              <button
                key={tier}
                type="button"
                disabled={!isUnlocked}
                onClick={() => {
                  setIsReplayingTimelapse(false);
                  setTimelapseStep(null);
                  setSelectedTier(tier);
                }}
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

      {/* 2.5 Give Up / Reveal Button */}
      {status === 'playing' && !isInitialLoading && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Stuck on this geometric silhouette?
          </span>

          {!confirmingGiveUp ? (
            <button
              type="button"
              onClick={() => setConfirmingGiveUp(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 hover:bg-rose-500/10 dark:bg-slate-800/70 dark:hover:bg-rose-500/15 border border-slate-200 dark:border-slate-700/80 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Give Up / Reveal Pokémon</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setConfirmingGiveUp(false);
                  onGiveUp();
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                <span>Confirm Reveal Answer</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmingGiveUp(false)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* End-of-Game Reveal, Timelapse Replay, Export & Comparison Panel */}
      {status !== 'playing' && targetPokemon && (
        <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-pop">
          {/* 2.2 Timelapse Replay & Download SVG / PNG Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleToggleTimelapse}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display font-bold border transition-all ${
                isReplayingTimelapse
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              {isReplayingTimelapse ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>
                    Stop Timelapse ({effectiveShapeCount}/{maxShapes})
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-rose-500" />
                  <span>Timelapse Replay (1 → {maxShapes})</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Download Vector SVG Artwork"
              >
                <Download className="w-3.5 h-3.5 text-sky-500" />
                <span>SVG</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPng}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Download High-Res 1024x1024 PNG Artwork"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>PNG</span>
              </button>
            </div>
          </div>

          {/* Official Artwork Opacity Slider */}
          <div className="bg-slate-100/90 dark:bg-slate-800/70 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/70">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
              <span className="flex items-center gap-1.5 truncate">
                <Eye className="w-4 h-4 text-sky-500 shrink-0" />
                <span className="truncate">
                  Compare Geometrized vs. Official Artwork
                </span>
              </span>
              <button
                type="button"
                onClick={() =>
                  setArtworkOverlayOpacity((prev) => (prev > 50 ? 0 : 100))
                }
                className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] font-mono hover:border-sky-400 transition-colors whitespace-nowrap shrink-0"
              >
                {artworkOverlayOpacity > 50 ? 'Show Geometry' : 'Show Sprite'}
              </button>
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
              {/* Sprite + Cry Button Directly Below */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-white/15 p-1.5 flex items-center justify-center">
                  <img
                    src={targetPokemon.officialArtworkUrl}
                    alt={targetPokemon.displayName}
                    className="w-full h-full object-contain"
                  />
                </div>
                {targetPokemon.cryUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      soundEngine.playPokemonCry(targetPokemon.cryUrl, true)
                    }
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/20 hover:bg-black/30 dark:bg-white/15 dark:hover:bg-white/25 transition-colors w-full"
                    title="Play Normalized Official Pokémon Cry"
                  >
                    <Volume2 className="w-3 h-3 shrink-0" />
                    <span>Cry</span>
                  </button>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-xs font-bold opacity-80">
                    #{String(targetPokemon.id).padStart(4, '0')}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/15 dark:bg-white/10">
                    Gen {getGenerationRoman(targetPokemon.generation)} •{' '}
                    {targetPokemon.regionName}
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white">
                  {targetPokemon.displayName}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
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

            <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto justify-center shrink-0">
              <button
                type="button"
                onClick={onOpenStats}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-display font-bold text-xs shadow hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600 shrink-0" />
                <span>Stats & Share</span>
                <Share2 className="w-3.5 h-3.5 ml-0.5 shrink-0" />
              </button>
              <button
                type="button"
                onClick={onNextMode}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <span>Try Next Shape Mode →</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
