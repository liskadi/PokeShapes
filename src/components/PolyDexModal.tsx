import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  Search,
  Shield,
  X,
} from 'lucide-react';
import { getGenerationRoman, loadArtworkBitmapBytes } from '../api/pokeapi';
import {
  CACHE_VERSION,
  RUNNER_BG_COLOR,
  TARGET_CANVAS_SIZE,
} from '../hooks/useGeometrize';
import {
  GameMode,
  GenerationFilter,
  getModeShapeConfig,
  PolyDexEntry,
  PolyDexMap,
} from '../types/game';
import { PokemonIndexEntry } from '../types/pokemon';
import { getGeometrizeSeed, TOTAL_MAINLINE_POKEMON } from '../utils/dailySeed';
import {
  getCachedShapes,
  getTrainerRank,
  setCachedShapes,
  TRAINER_RANKS,
} from '../utils/storage';
import type {
  GeometrizeWorkerRequest,
  GeometrizeWorkerResponse,
} from '../workers/geometrize.worker';

interface PolyDexModalProps {
  isOpen: boolean;
  onClose: () => void;
  polyDex: PolyDexMap;
  pokemonIndex: PokemonIndexEntry[];
}

interface ModePreviewBoxProps {
  mode: GameMode;
  label: string;
  pokemon: PokemonIndexEntry;
  caughtRecord: PolyDexEntry;
}

const ModeGeometryPreviewCard: React.FC<ModePreviewBoxProps> = ({
  mode,
  label,
  pokemon,
  caughtRecord,
}) => {
  const isModeCaught = Boolean(caughtRecord.modesCaught[mode]);
  const shapeCfg = getModeShapeConfig(mode);
  const [shapes, setShapes] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isModeCaught) {
      setShapes(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let activeWorker: Worker | null = null;

    const dateKey =
      caughtRecord.caughtDates?.[mode] ||
      caughtRecord.firstCaughtDate ||
      'polydex';
    const seed = getGeometrizeSeed(dateKey, mode, pokemon.id);
    const cacheKey = `${CACHE_VERSION}:${dateKey}:${mode}:${pokemon.id}:${seed}`;

    setIsLoading(true);

    async function loadOrGenerateFinalGeometry() {
      try {
        const cached = await getCachedShapes(cacheKey);
        if (cancelled) return;
        if (cached && cached.length >= shapeCfg.maxShapes) {
          setShapes(cached.slice(0, shapeCfg.maxShapes));
          setIsLoading(false);
          return;
        }

        const { width, height, rgbaBytes } = await loadArtworkBitmapBytes(
          pokemon.officialArtworkUrl,
          TARGET_CANVAS_SIZE,
          RUNNER_BG_COLOR
        );
        if (cancelled) return;

        const worker = new Worker(
          new URL('../workers/geometrize.worker.ts', import.meta.url),
          { type: 'module' }
        );
        activeWorker = worker;
        const jobId = `polydex:${cacheKey}:${Date.now()}`;

        const cleanup = () => {
          worker.terminate();
          activeWorker = null;
        };

        worker.onmessage = (e: MessageEvent<GeometrizeWorkerResponse>) => {
          if (cancelled || e.data.jobId !== jobId) return;
          if (e.data.type === 'COMPLETE') {
            setShapes(e.data.shapes.slice(0, shapeCfg.maxShapes));
            setIsLoading(false);
            setCachedShapes(
              cacheKey,
              e.data.shapes,
              `${CACHE_VERSION}:${dateKey}`
            );
            cleanup();
          } else if (e.data.type === 'ERROR') {
            setIsLoading(false);
            cleanup();
          }
        };

        worker.onerror = () => {
          if (!cancelled) setIsLoading(false);
          cleanup();
        };

        const bufferCopy = rgbaBytes.buffer.slice(0);
        const req: GeometrizeWorkerRequest = {
          jobId,
          mode,
          seed,
          width,
          height,
          rgbaBuffer: bufferCopy,
          bgColor: RUNNER_BG_COLOR,
          initialShapes: shapeCfg.initialShapes,
          totalShapes: shapeCfg.maxShapes,
        };
        worker.postMessage(req, [bufferCopy]);
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadOrGenerateFinalGeometry();

    return () => {
      cancelled = true;
      if (activeWorker) {
        activeWorker.terminate();
        activeWorker = null;
      }
    };
  }, [
    isModeCaught,
    mode,
    pokemon.id,
    pokemon.officialArtworkUrl,
    caughtRecord,
    shapeCfg.initialShapes,
    shapeCfg.maxShapes,
  ]);

  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 p-3 flex flex-col items-center text-center">
      <div className="w-full flex items-center justify-between text-xs font-display font-bold text-slate-800 dark:text-slate-200 mb-2">
        <span>{label}</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            isModeCaught
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          {isModeCaught ? 'Unlocked' : 'Missing'}
        </span>
      </div>

      <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#0F172A] border border-slate-300 dark:border-slate-700 flex items-center justify-center relative">
        {!isModeCaught ? (
          <div className="flex flex-col items-center justify-center p-4 text-slate-400">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-2">
              <Lock className="w-4 h-4 text-slate-500" />
            </div>
            <span className="font-display font-bold text-xs text-slate-300">
              Missing Geometry
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">
              Catch in {label} mode to unlock
            </span>
          </div>
        ) : isLoading || !shapes ? (
          <div className="flex flex-col items-center justify-center p-4 text-slate-300">
            <Loader2 className="w-6 h-6 text-rose-500 animate-spin mb-2" />
            <span className="text-[11px] font-mono text-slate-400">
              Rendering…
            </span>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${TARGET_CANVAS_SIZE} ${TARGET_CANVAS_SIZE}`}
            className="w-full h-full select-none"
          >
            <rect
              x="0"
              y="0"
              width={TARGET_CANVAS_SIZE}
              height={TARGET_CANVAS_SIZE}
              fill="#0F172A"
            />
            <g dangerouslySetInnerHTML={{ __html: shapes.join('\n') }} />
          </svg>
        )}
      </div>
    </div>
  );
};

export const PolyDexModal: React.FC<PolyDexModalProps> = ({
  isOpen,
  onClose,
  polyDex,
  pokemonIndex,
}) => {
  const [genFilter, setGenFilter] = useState<GenerationFilter>('all');
  const [onlyCaught, setOnlyCaught] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showRanks, setShowRanks] = useState<boolean>(false);
  const [selectedPokemon, setSelectedPokemon] =
    useState<PokemonIndexEntry | null>(null);

  const uniqueCaughtCount = Object.keys(polyDex).length;
  const rankInfo = getTrainerRank(uniqueCaughtCount);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return pokemonIndex.filter((entry) => {
      if (genFilter !== 'all' && entry.generation !== genFilter) {
        return false;
      }
      if (onlyCaught && !polyDex[entry.id]) {
        return false;
      }
      if (q) {
        const matchesName = entry.displayName.toLowerCase().includes(q);
        const matchesId = String(entry.id).includes(q.replace(/^#/, ''));
        if (!matchesName && !matchesId) return false;
      }
      return true;
    });
  }, [pokemonIndex, genFilter, onlyCaught, searchQuery, polyDex]);

  if (!isOpen) return null;

  const progressPercent = rankInfo.nextRankTarget
    ? Math.min(
        100,
        Math.round(
          ((uniqueCaughtCount - rankInfo.minCaught) /
            Math.max(1, rankInfo.nextRankTarget - rankInfo.minCaught)) *
            100
        )
      )
    : 100;

  const selectedCaughtRecord = selectedPokemon
    ? polyDex[selectedPokemon.id]
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-pop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="polydex-modal-title"
      onClick={onClose}
    >
      <div
        className="game-card relative w-full max-w-3xl rounded-3xl bg-white dark:bg-[#141C2F] overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b-2 border-slate-200 dark:border-[#24304d] bg-diagonal-stripes flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="polydex-modal-title"
                className="font-display font-extrabold text-lg text-slate-900 dark:text-white"
              >
                PolyDex
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click any caught Pokémon to inspect its unlocked shape art
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close PolyDex"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`px-3 py-1.5 rounded-xl border font-display font-extrabold text-xs sm:text-sm flex items-center gap-1.5 ${rankInfo.badgeColor}`}
              >
                <Shield className="w-4 h-4" />
                <span>{rankInfo.title}</span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {uniqueCaughtCount} / {TOTAL_MAINLINE_POKEMON} Caught
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {rankInfo.nextRankTitle
                    ? `${
                        rankInfo.nextRankTarget! - uniqueCaughtCount
                      } more to reach ${rankInfo.nextRankTitle}`
                    : 'Maximum Rank Achieved!'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-mono text-slate-600 dark:text-slate-300">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>{progressPercent}%</span>
              </span>

              <button
                type="button"
                onClick={() => setShowRanks((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-400 transition-colors cursor-pointer"
              >
                <span>{showRanks ? 'Hide Ranks' : 'View Ranks'}</span>
                {showRanks ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {showRanks && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 pt-1">
              {TRAINER_RANKS.map((r) => {
                const isUnlocked = uniqueCaughtCount >= r.min;
                const isCurrent = rankInfo.title === r.title;
                return (
                  <div
                    key={r.title}
                    className={`px-2 py-1.5 rounded-xl border text-center flex flex-col items-center justify-center ${
                      isCurrent
                        ? `${r.badgeColor} ring-2 ring-rose-500/40 font-bold`
                        : isUnlocked
                        ? 'bg-white dark:bg-slate-900 border-emerald-500/30 text-slate-800 dark:text-slate-200'
                        : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/70 text-slate-400 dark:text-slate-600 opacity-70'
                    }`}
                  >
                    <div className="text-[10px] font-display font-bold leading-tight truncate w-full">
                      {r.title}
                    </div>
                    <div className="text-[9px] font-mono mt-0.5 inline-flex items-center gap-0.5">
                      {isUnlocked ? (
                        <Check className="w-2.5 h-2.5 text-emerald-500 stroke-[3]" />
                      ) : (
                        <Lock className="w-2.5 h-2.5" />
                      )}
                      <span>{r.min}+</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2">
              <select
                value={String(genFilter)}
                onChange={(e) => {
                  const val = e.target.value;
                  setGenFilter(
                    val === 'all' ? 'all' : (Number(val) as GenerationFilter)
                  );
                }}
                aria-label="Filter by Generation"
                className="px-2.5 py-1.5 rounded-xl text-xs font-display font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="all">All Generations</option>
                {([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((g) => (
                  <option key={g} value={g}>
                    Generation {getGenerationRoman(g)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setOnlyCaught((v) => !v)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  onlyCaught
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Caught Only ({uniqueCaughtCount})
              </button>
            </div>

            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Pokémon…"
                className="w-full sm:w-44 pl-7 pr-2.5 py-1.5 rounded-xl text-base sm:text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No Pokémon match the current PolyDex filter.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {filteredList.slice(0, 200).map((entry) => {
                const caughtRecord = polyDex[entry.id];
                const isCaught = Boolean(caughtRecord);

                if (!isCaught) {
                  return (
                    <div
                      key={entry.id}
                      className="rounded-2xl border p-2.5 flex flex-col items-center text-center bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-50 select-none"
                    >
                      <div className="w-full text-left text-[10px] font-mono text-slate-400 mb-1">
                        #{String(entry.id).padStart(4, '0')}
                      </div>
                      <div className="w-14 h-14 flex items-center justify-center my-1">
                        <div className="w-10 h-10 rounded-full bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center font-mono text-xs font-bold text-slate-400">
                          ?
                        </div>
                      </div>
                      <div className="font-display font-bold text-xs text-slate-500 dark:text-slate-400 truncate w-full">
                        ???
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedPokemon(entry)}
                    className="rounded-2xl border p-2.5 flex flex-col items-center text-center transition-all bg-white dark:bg-slate-800/90 border-emerald-500/35 hover:border-emerald-500 hover:shadow-md cursor-pointer"
                    title={`View ${entry.displayName}'s unlocked geometry`}
                  >
                    <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>#{String(entry.id).padStart(4, '0')}</span>
                      <div className="flex items-center gap-1">
                        <span
                          className={`inline-flex items-center justify-center ${
                            caughtRecord.modesCaught.circles
                              ? 'text-sky-400'
                              : 'opacity-20'
                          }`}
                          title="Circles Mode"
                        >
                          <svg
                            viewBox="0 0 16 16"
                            className="w-3 h-3 fill-current"
                          >
                            <circle cx="8" cy="8" r="6" />
                          </svg>
                        </span>
                        <span
                          className={`inline-flex items-center justify-center ${
                            caughtRecord.modesCaught.triangles
                              ? 'text-rose-400'
                              : 'opacity-20'
                          }`}
                          title="Triangles Mode"
                        >
                          <svg
                            viewBox="0 0 16 16"
                            className="w-3 h-3 fill-current"
                          >
                            <polygon points="8,2 14,14 2,14" />
                          </svg>
                        </span>
                        <span
                          className={`inline-flex items-center justify-center ${
                            caughtRecord.modesCaught.lines
                              ? 'text-purple-400'
                              : 'opacity-20'
                          }`}
                          title="Lines Mode"
                        >
                          <svg
                            viewBox="0 0 16 16"
                            className="w-3 h-3 stroke-current"
                            fill="none"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          >
                            <line x1="3" y1="13" x2="13" y2="3" />
                          </svg>
                        </span>
                      </div>
                    </div>

                    <div className="w-14 h-14 flex items-center justify-center my-1">
                      <img
                        src={entry.officialArtworkUrl}
                        alt={entry.displayName}
                        loading="lazy"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="font-display font-bold text-xs text-slate-800 dark:text-slate-200 truncate w-full">
                      {entry.displayName}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {filteredList.length > 200 && (
            <p className="text-center text-xs text-slate-400 mt-4 font-mono">
              Showing first 200 matches — use Generation or Search filters above to narrow down.
            </p>
          )}
        </div>

        {selectedPokemon && selectedCaughtRecord && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-pop"
            onClick={() => setSelectedPokemon(null)}
          >
            <div
              className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1.5 flex items-center justify-center">
                    <img
                      src={selectedPokemon.officialArtworkUrl}
                      alt={selectedPokemon.displayName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        #{String(selectedPokemon.id).padStart(4, '0')}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/10 text-rose-500">
                        Gen {getGenerationRoman(selectedPokemon.generation)}
                      </span>
                    </div>
                    <h3 className="font-display font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white">
                      {selectedPokemon.displayName}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPokemon(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close Geometry Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ModeGeometryPreviewCard
                  mode="circles"
                  label="● Circles"
                  pokemon={selectedPokemon}
                  caughtRecord={selectedCaughtRecord}
                />
                <ModeGeometryPreviewCard
                  mode="triangles"
                  label="▲ Triangles"
                  pokemon={selectedPokemon}
                  caughtRecord={selectedCaughtRecord}
                />
                <ModeGeometryPreviewCard
                  mode="lines"
                  label="╱ Lines"
                  pokemon={selectedPokemon}
                  caughtRecord={selectedCaughtRecord}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
