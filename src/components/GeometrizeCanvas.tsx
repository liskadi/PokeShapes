import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Download,
  Eye,
  Flag,
  Layers,
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
  shapes,
  canvasSize,
  croppedArtworkDataUrl,
  unlockedShapeCount,
  isInitialLoading,
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
  const { initialShapes, increment, maxShapes } = shapeCfg;

  // Post-game original artwork toggle (false = geometrized shapes, true = original sprite)
  const [showOriginalSprite, setShowOriginalSprite] = useState<boolean>(false);

  // Timelapse Replay state (1 -> maxShapes)
  const [isReplayingTimelapse, setIsReplayingTimelapse] =
    useState<boolean>(false);
  const [timelapseStep, setTimelapseStep] = useState<number | null>(null);
  const timelapseTimerRef = useRef<number | null>(null);

  // Two-click Give Up confirmation state
  const [confirmingGiveUp, setConfirmingGiveUp] = useState<boolean>(false);

  // Reset confirmation when unlocked shapes or target change
  useEffect(() => {
    setConfirmingGiveUp(false);
  }, [unlockedShapeCount, mode, targetPokemon?.id]);

  // Reset overlay & timelapse when switching modes or starting a new puzzle
  useEffect(() => {
    setIsReplayingTimelapse(false);
    setTimelapseStep(null);
    setConfirmingGiveUp(false);
    setShowOriginalSprite(false);
    if (timelapseTimerRef.current) {
      window.clearInterval(timelapseTimerRef.current);
      timelapseTimerRef.current = null;
    }
  }, [status, mode, targetPokemon?.id]);

  // Start / Stop 1 -> maxShapes Timelapse Replay
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

    setShowOriginalSprite(false);
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
      : Math.min(unlockedShapeCount, shapes.length || initialShapes);

  // Build standalone SVG string for high-res PNG export
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

  // Save Image (1024x1024 high-res PNG)
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
        link.download = `pokeshapes-${slug}-${mode}.png`;
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

  return (
    <div className="game-card bg-white dark:bg-[#141C2F] rounded-3xl p-3 sm:p-5">
      {/* Clean Pokédex Screen Frame ("WHO'S THAT POKÉMON?" Window) */}
      <div className="mx-auto w-full max-w-[330px] sm:max-w-[404px] rounded-3xl bg-slate-200/90 dark:bg-[#0B101D] p-2.5 sm:p-3 border-2 border-slate-300 dark:border-[#2C3E63] shadow-inner">
        {/* Top Bezel Header */}
        <div className="flex items-center justify-between px-2 pb-2 text-[10px] font-display font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.8)]" />
            <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.8)]" />
          </div>
          <span>WHO&apos;S THAT POKÉMON?</span>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
          </div>
        </div>

        {/* Main Geometric Viewport */}
        <div className="relative mx-auto w-full aspect-square rounded-2xl overflow-hidden border-2 border-slate-700 dark:border-[#243454] shadow-lg group">
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
                  Loading Mystery Pokémon…
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
                  className="btn-tactile inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 border-rose-400 border-b-rose-800 text-white text-xs font-display font-bold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
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
                      status !== 'playing' && showOriginalSprite ? 0.12 : 1,
                  }}
                  aria-label={`Geometrized Pokémon mystery puzzle (${effectiveShapeCount} shapes)`}
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

                {/* Post-Game Official Artwork Overlay */}
                {status !== 'playing' && targetPokemon && (
                  <img
                    src={
                      croppedArtworkDataUrl || targetPokemon.officialArtworkUrl
                    }
                    alt={targetPokemon.displayName}
                    className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-200 ${
                      croppedArtworkDataUrl ? 'p-0' : 'p-[6%]'
                    }`}
                    style={{ opacity: showOriginalSprite ? 1 : 0 }}
                  />
                )}
              </>
            )}
          </div>

          {/* Corner HUD Brackets */}
          <div className="pointer-events-none absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-sky-400/60 rounded-tl" />
          <div className="pointer-events-none absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-sky-400/60 rounded-tr" />
          <div className="pointer-events-none absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-sky-400/60 rounded-bl" />
          <div className="pointer-events-none absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-sky-400/60 rounded-br" />
        </div>

        {/* Bottom Bezel Bar: Single Shape Count Readout */}
        <div className="flex items-center justify-between px-2.5 pt-2 pb-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'won'
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                  : 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
              }`}
            />
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
              <Layers className="w-3 h-3 text-rose-500 shrink-0" />
              <span>{effectiveShapeCount} Shapes</span>
            </span>
          </div>

          <div className="flex items-center gap-1" aria-hidden="true">
            <span className="w-3.5 h-1 rounded-full bg-slate-400/70 dark:bg-slate-700" />
            <span className="w-3.5 h-1 rounded-full bg-slate-400/70 dark:bg-slate-700" />
            <span className="w-3.5 h-1 rounded-full bg-slate-400/70 dark:bg-slate-700" />
          </div>
        </div>
      </div>

      {/* Give Up / Reveal Option while Playing */}
      {status === 'playing' && !isInitialLoading && (
        <div className="mt-3 flex items-center justify-end">
          {!confirmingGiveUp ? (
            <button
              type="button"
              onClick={() => setConfirmingGiveUp(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Flag className="w-3 h-3" />
              <span>Give Up</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setConfirmingGiveUp(false);
                  onGiveUp();
                }}
                className="btn-tactile inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-display font-bold bg-rose-600 hover:bg-rose-500 border-rose-400 border-b-rose-800 text-white cursor-pointer"
              >
                <span>Reveal Answer</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmingGiveUp(false)}
                className="btn-tactile px-2.5 py-1 rounded-xl text-xs font-display font-bold bg-slate-200 dark:bg-[#1C2842] border-slate-300 border-b-slate-400 dark:border-[#334770] dark:border-b-[#435C8F] text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* End-of-Game Compact Action Bar & Revealed Identity Card */}
      {status !== 'playing' && targetPokemon && (
        <div className="mt-4 pt-3.5 border-t-2 border-slate-200 dark:border-[#24304d] space-y-3.5 animate-pop">
          {/* Compact 3-Button Post-Game Action Bar */}
          <div className="grid grid-cols-3 gap-2">
            {/* 1. Show Original / Show Shapes Toggle */}
            <button
              type="button"
              onClick={() => {
                if (isReplayingTimelapse) handleToggleTimelapse();
                setShowOriginalSprite((prev) => !prev);
              }}
              className={`btn-tactile inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-display font-bold cursor-pointer ${
                showOriginalSprite
                  ? 'bg-sky-500 text-white border-sky-400 border-b-sky-700'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#1C2842] dark:hover:bg-[#243354] text-slate-800 dark:text-slate-100 border-slate-300 border-b-slate-400 dark:border-[#334770] dark:border-b-[#435C8F]'
              }`}
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {showOriginalSprite ? 'Show Shapes' : 'Show Original'}
              </span>
            </button>

            {/* 2. Replay Timelapse */}
            <button
              type="button"
              onClick={handleToggleTimelapse}
              className={`btn-tactile inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-display font-bold cursor-pointer ${
                isReplayingTimelapse
                  ? 'bg-amber-400 text-slate-950 border-amber-300 border-b-amber-600'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#1C2842] dark:hover:bg-[#243354] text-slate-800 dark:text-slate-100 border-slate-300 border-b-slate-400 dark:border-[#334770] dark:border-b-[#435C8F]'
              }`}
            >
              {isReplayingTimelapse ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span className="truncate">Stop</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-rose-500 shrink-0" />
                  <span className="truncate">Replay</span>
                </>
              )}
            </button>

            {/* 3. Save Image (PNG) */}
            <button
              type="button"
              onClick={handleDownloadPng}
              className="btn-tactile inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-display font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#1C2842] dark:hover:bg-[#243354] text-slate-800 dark:text-slate-100 border-slate-300 border-b-slate-400 dark:border-[#334770] dark:border-b-[#435C8F] cursor-pointer"
              title="Download High-Res PNG Image"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">Save Image</span>
            </button>
          </div>

          {/* Revealed Pokémon Identity Card */}
          <div
            className={`rounded-2xl p-4 border-2 border-b-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-diagonal-stripes ${
              status === 'won' ? 'badge-exact' : 'badge-none'
            }`}
          >
            <div className="flex items-center gap-3.5">
              {/* Sprite with Pokéball Backdrop + Cry Button */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="relative w-16 h-16 rounded-2xl bg-slate-900/95 border-2 border-white/20 p-1.5 flex items-center justify-center overflow-hidden shadow-md">
                  <svg
                    viewBox="0 0 100 100"
                    className="absolute inset-0 w-full h-full opacity-15 pointer-events-none"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="8"
                    />
                    <line
                      x1="8"
                      y1="50"
                      x2="92"
                      y2="50"
                      stroke="#ffffff"
                      strokeWidth="8"
                    />
                    <circle cx="50" cy="50" r="14" fill="#ffffff" />
                  </svg>
                  <img
                    src={targetPokemon.officialArtworkUrl}
                    alt={targetPokemon.displayName}
                    className="relative z-10 w-full h-full object-contain drop-shadow"
                  />
                </div>
                {targetPokemon.cryUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      soundEngine.playPokemonCry(targetPokemon.cryUrl, true)
                    }
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-black/20 hover:bg-black/30 dark:bg-white/15 dark:hover:bg-white/25 transition-colors w-full cursor-pointer"
                    title="Play Official Pokémon Cry"
                  >
                    <Volume2 className="w-3 h-3 shrink-0" />
                    <span>Cry</span>
                  </button>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-xs font-bold opacity-85">
                    #{String(targetPokemon.id).padStart(4, '0')}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/15 dark:bg-white/10">
                    Gen {getGenerationRoman(targetPokemon.generation)} •{' '}
                    {targetPokemon.regionName}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white">
                  {targetPokemon.displayName}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {targetPokemon.types.map((t) => (
                    <span
                      key={t}
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider shadow-2xs ${
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
                className="btn-tactile flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-700 border-b-slate-500 dark:border-slate-200 dark:border-b-slate-400 font-display font-bold text-xs whitespace-nowrap cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600 shrink-0" />
                <span>Stats & Share</span>
                <Share2 className="w-3.5 h-3.5 ml-0.5 shrink-0" />
              </button>
              <button
                type="button"
                onClick={onNextMode}
                className="btn-tactile flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/70 dark:bg-[#1C2842]/90 hover:bg-white dark:hover:bg-[#243354] border-slate-300 border-b-slate-400 dark:border-[#334770] dark:border-b-[#435C8F] text-slate-900 dark:text-white text-xs font-display font-bold whitespace-nowrap cursor-pointer"
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
