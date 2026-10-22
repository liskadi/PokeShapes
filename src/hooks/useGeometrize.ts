import { useEffect, useRef, useState } from 'react';
import { loadArtworkBitmapBytes } from '../api/pokeapi';
import { GameMode, INITIAL_SHAPES, MAX_SHAPES } from '../types/game';
import { getCachedShapes, setCachedShapes } from '../utils/storage';
import type {
  GeometrizeWorkerRequest,
  GeometrizeWorkerResponse,
} from '../workers/geometrize.worker';

interface UseGeometrizeParams {
  dateKey: string;
  mode: GameMode;
  pokemonId: number;
  officialArtworkUrl: string | null;
  seed: number;
}

interface UseGeometrizeResult {
  shapes: string[];
  canvasSize: number;
  isInitialLoading: boolean;
  isBackgroundComputing: boolean;
  error: string | null;
  retry: () => void;
}

const TARGET_CANVAS_SIZE = 180;
const RUNNER_BG_COLOR: [number, number, number] = [15, 23, 42];

export function useGeometrize({
  dateKey,
  mode,
  pokemonId,
  officialArtworkUrl,
  seed,
}: UseGeometrizeParams): UseGeometrizeResult {
  const [shapes, setShapes] = useState<string[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isBackgroundComputing, setIsBackgroundComputing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!officialArtworkUrl || !pokemonId) {
      return;
    }

    let cancelled = false;
    const cacheKey = `${dateKey}:${mode}:${pokemonId}:${seed}`;
    const jobId = `${cacheKey}:${Date.now()}`;

    setShapes([]);
    setIsInitialLoading(true);
    setIsBackgroundComputing(false);
    setError(null);

    async function runPipeline() {
      // 1. Check IndexedDB cache first
      const cached = await getCachedShapes(cacheKey);
      if (cancelled) return;

      if (cached && cached.length >= MAX_SHAPES) {
        setShapes(cached);
        setIsInitialLoading(false);
        setIsBackgroundComputing(false);
        return;
      }

      // 2. Load official artwork PNG and extract RGBA byte buffer
      try {
        const { width, height, rgbaBytes } = await loadArtworkBitmapBytes(
          officialArtworkUrl!,
          TARGET_CANVAS_SIZE,
          RUNNER_BG_COLOR
        );
        if (cancelled) return;

        // Terminate any previous worker job
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
          const { type, shapes: workerShapes, error: workerError } = event.data;

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
            setCachedShapes(cacheKey, workerShapes, dateKey);
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
          initialShapes: INITIAL_SHAPES,
          totalShapes: MAX_SHAPES,
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

  return {
    shapes,
    canvasSize: TARGET_CANVAS_SIZE,
    isInitialLoading,
    isBackgroundComputing,
    error,
    retry: () => setRetryCount((c) => c + 1),
  };
}
