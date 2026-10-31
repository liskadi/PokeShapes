import { useEffect, useRef, useState } from 'react';
import { loadArtworkBitmapBytes } from '../api/pokeapi';
import { GameMode, getModeShapeConfig } from '../types/game';
import { getCachedShapes, setCachedShapes } from '../utils/storage';
import type {
  GeometrizeWorkerRequest,
  GeometrizeWorkerResponse,
} from '../workers/geometrize.worker';

export interface BackgroundPrewarmTask {
  dateKey: string;
  mode: GameMode;
  pokemonId: number;
  officialArtworkUrl: string;
  seed: number;
}

interface UseGeometrizeParams {
  dateKey: string;
  mode: GameMode;
  pokemonId: number;
  officialArtworkUrl: string | null;
  seed: number;
  backgroundTasks?: BackgroundPrewarmTask[];
}

interface UseGeometrizeResult {
  shapes: string[];
  canvasSize: number;
  croppedArtworkDataUrl: string | null;
  isInitialLoading: boolean;
  error: string | null;
  retry: () => void;
}

export const TARGET_CANVAS_SIZE = 180;
export const RUNNER_BG_COLOR: [number, number, number] = [15, 23, 42];
export const CACHE_VERSION = 'v5';

export function useGeometrize({
  dateKey,
  mode,
  pokemonId,
  officialArtworkUrl,
  seed,
  backgroundTasks = [],
}: UseGeometrizeParams): UseGeometrizeResult {
  const [shapes, setShapes] = useState<string[]>([]);
  const [croppedArtworkDataUrl, setCroppedArtworkDataUrl] = useState<
    string | null
  >(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isBackgroundComputing, setIsBackgroundComputing] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const workerRef = useRef<Worker | null>(null);
  const bgWorkerRef = useRef<Worker | null>(null);
  const [activeCompleteTick, setActiveCompleteTick] = useState<number>(0);

  useEffect(() => {
    if (!officialArtworkUrl || !pokemonId) {
      return;
    }

    let cancelled = false;
    const modeCfg = getModeShapeConfig(mode);
    const cacheKey = `${CACHE_VERSION}:${dateKey}:${mode}:${pokemonId}:${seed}`;
    const jobId = `${cacheKey}:${Date.now()}`;

    setShapes([]);
    setCroppedArtworkDataUrl(null);
    setIsInitialLoading(true);
    setIsBackgroundComputing(false);
    setError(null);

    async function runPipeline() {
      try {
        const bitmapDataPromise = loadArtworkBitmapBytes(
          officialArtworkUrl!,
          TARGET_CANVAS_SIZE,
          RUNNER_BG_COLOR
        );

        const cached = await getCachedShapes(cacheKey);
        if (cancelled) return;

        if (cached && cached.length >= modeCfg.maxShapes) {
          setShapes(cached);
          setIsInitialLoading(false);
          setIsBackgroundComputing(false);
          bitmapDataPromise
            .then((res) => {
              if (!cancelled) setCroppedArtworkDataUrl(res.croppedArtworkDataUrl);
            })
            .catch(() => {});
          setActiveCompleteTick((t) => t + 1);
          return;
        }

        const {
          width,
          height,
          rgbaBytes,
          croppedArtworkDataUrl: croppedUrl,
        } = await bitmapDataPromise;
        if (cancelled) return;
        setCroppedArtworkDataUrl(croppedUrl);

        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }

        const worker = new Worker(
          new URL('../workers/geometrize.worker.ts', import.meta.url),
          { type: 'module' }
        );
        workerRef.current = worker;

        worker.onmessage = (event: MessageEvent<GeometrizeWorkerResponse>) => {
          if (cancelled || event.data.jobId !== jobId) return;
          const {
            type,
            shapes: workerShapes,
            error: workerError,
          } = event.data;

          if (type === 'INITIAL_READY') {
            setShapes(workerShapes);
            setIsInitialLoading(false);
            setIsBackgroundComputing(true);
          } else if (type === 'PROGRESS') {
            setShapes(workerShapes);
          } else if (type === 'COMPLETE') {
            setShapes(workerShapes);
            setIsInitialLoading(false);
            setIsBackgroundComputing(false);
            setCachedShapes(cacheKey, workerShapes, `${CACHE_VERSION}:${dateKey}`);
            setActiveCompleteTick((t) => t + 1);
            worker.terminate();
            if (workerRef.current === worker) {
              workerRef.current = null;
            }
          } else if (type === 'ERROR') {
            setError(workerError || 'Geometrization failed');
            setIsInitialLoading(false);
            setIsBackgroundComputing(false);
          }
        };

        worker.onerror = (err: ErrorEvent) => {
          if (cancelled) return;
          setError(err.message || 'Geometrize Worker error');
          setIsInitialLoading(false);
          setIsBackgroundComputing(false);
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
          initialShapes: modeCfg.initialShapes,
          totalShapes: modeCfg.maxShapes,
        };

        worker.postMessage(req, [bufferCopy]);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : 'Failed to load Pokémon sprite'
        );
        setIsInitialLoading(false);
        setIsBackgroundComputing(false);
      }
    }

    runPipeline();

    return () => {
      cancelled = true;
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [dateKey, mode, pokemonId, officialArtworkUrl, seed, retryCount]);

  useEffect(() => {
    if (isInitialLoading || isBackgroundComputing || backgroundTasks.length === 0) {
      return;
    }

    let cancelled = false;

    async function prewarmNext() {
      for (const task of backgroundTasks) {
        if (cancelled) return;
        const taskCfg = getModeShapeConfig(task.mode);
        const bgCacheKey = `${CACHE_VERSION}:${task.dateKey}:${task.mode}:${task.pokemonId}:${task.seed}`;
        const existing = await getCachedShapes(bgCacheKey);
        if (cancelled) return;
        if (existing && existing.length >= taskCfg.maxShapes) {
          continue;
        }

        try {
          const { width, height, rgbaBytes } = await loadArtworkBitmapBytes(
            task.officialArtworkUrl,
            TARGET_CANVAS_SIZE,
            RUNNER_BG_COLOR
          );
          if (cancelled) return;

          await new Promise<void>((resolve) => {
            const bgWorker = new Worker(
              new URL('../workers/geometrize.worker.ts', import.meta.url),
              { type: 'module' }
            );
            bgWorkerRef.current = bgWorker;
            const jobId = `bg:${bgCacheKey}:${Date.now()}`;

            const cleanup = () => {
              bgWorker.terminate();
              if (bgWorkerRef.current === bgWorker) {
                bgWorkerRef.current = null;
              }
              resolve();
            };

            bgWorker.onmessage = (
              event: MessageEvent<GeometrizeWorkerResponse>
            ) => {
              if (cancelled || event.data.jobId !== jobId) return;
              if (event.data.type === 'COMPLETE') {
                setCachedShapes(
                  bgCacheKey,
                  event.data.shapes,
                  `${CACHE_VERSION}:${task.dateKey}`
                );
                cleanup();
              } else if (event.data.type === 'ERROR') {
                cleanup();
              }
            };

            bgWorker.onerror = cleanup;

            const bufferCopy = rgbaBytes.buffer.slice(0);
            const req: GeometrizeWorkerRequest = {
              jobId,
              mode: task.mode,
              seed: task.seed,
              width,
              height,
              rgbaBuffer: bufferCopy,
              bgColor: RUNNER_BG_COLOR,
              initialShapes: taskCfg.initialShapes,
              totalShapes: taskCfg.maxShapes,
            };
            bgWorker.postMessage(req, [bufferCopy]);
          });
        } catch {
          // Ignore background prewarm error
        }
      }
    }

    prewarmNext();

    return () => {
      cancelled = true;
      if (bgWorkerRef.current) {
        bgWorkerRef.current.terminate();
        bgWorkerRef.current = null;
      }
    };
  }, [activeCompleteTick, isInitialLoading, isBackgroundComputing, backgroundTasks]);

  return {
    shapes,
    canvasSize: TARGET_CANVAS_SIZE,
    croppedArtworkDataUrl,
    isInitialLoading,
    error,
    retry: () => setRetryCount((c) => c + 1),
  };
}
