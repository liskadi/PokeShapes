import * as GeometrizePkg from 'geometrizejs';
import { GameMode, getModeShapeConfig } from '../types/game';
import { mulberry32 } from '../utils/dailySeed';

// Support both ESM and CommonJS interop from geometrizejs across Vite dev & build
const Geometrize =
  'Bitmap' in GeometrizePkg && GeometrizePkg.Bitmap
    ? GeometrizePkg
    : (GeometrizePkg as unknown as { default?: typeof GeometrizePkg }).default ||
      GeometrizePkg;
const { Bitmap, ImageRunner, ShapeTypes, SvgExporter } = Geometrize;

export interface GeometrizeWorkerRequest {
  jobId: string;
  mode: GameMode;
  seed: number;
  width: number;
  height: number;
  rgbaBuffer: ArrayBuffer;
  bgColor: [number, number, number];
  initialShapes?: number;
  totalShapes?: number;
}

export interface GeometrizeWorkerResponse {
  jobId: string;
  type: 'INITIAL_READY' | 'PROGRESS' | 'COMPLETE' | 'ERROR';
  shapes: string[];
  width: number;
  height: number;
  error?: string;
}

function createRgbaInt(r: number, g: number, b: number, a: number = 255): number {
  return ((r & 255) << 24) + ((g & 255) << 16) + ((b & 255) << 8) + (a & 255);
}

/**
 * 3.3 Thicker Line Rasterization Tuning for Lines Mode (50 -> 275 lines):
 * Upgrades 1px hairline strokes from SvgExporter into graduated, high-impact
 * rounded vector brush strokes:
 * - Foundational silhouette strokes (0..49): 5.8px stroke-width
 * - Mid-tier structural strokes (50..149): 4.2px stroke-width
 * - Fine detail strokes (150..274): 3.0px stroke-width
 */
function enhanceSvgShape(rawSvg: string, mode: GameMode, stepIndex: number): string {
  if (mode === 'lines') {
    const strokeWidth =
      stepIndex < 50 ? '5.8' : stepIndex < 150 ? '4.2' : '3.0';
    return rawSvg.replace(
      'stroke-width="1"',
      `stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`
    );
  }
  return rawSvg;
}

self.onmessage = (event: MessageEvent<GeometrizeWorkerRequest>) => {
  const {
    jobId,
    mode,
    seed,
    width,
    height,
    rgbaBuffer,
    bgColor = [15, 23, 42],
  } = event.data;

  const modeCfg = getModeShapeConfig(mode);
  const initialShapes = event.data.initialShapes ?? modeCfg.initialShapes;
  const totalShapes = event.data.totalShapes ?? modeCfg.maxShapes;

  const originalRandom = Math.random;

  try {
    // Install deterministic Mulberry32 PRNG over Math.random so hill-climbing
    // produces the exact same shapes for every player on the same day!
    const seededRng = mulberry32(seed);
    Math.random = seededRng;

    const rgbaBytes = new Uint8ClampedArray(rgbaBuffer);
    const bitmap = Bitmap.createFromByteArray(
      width,
      height,
      rgbaBytes as unknown as number[]
    );

    const bgRgbaInt = createRgbaInt(bgColor[0], bgColor[1], bgColor[2], 255);
    const RunnerCtor = ImageRunner as unknown as new (
      inputImage: unknown,
      backgroundColor?: number
    ) => InstanceType<typeof ImageRunner>;
    const runner = new RunnerCtor(bitmap, bgRgbaInt);

    const shapeTypeMap: Record<GameMode, number> = {
      circles: ShapeTypes.CIRCLE,
      triangles: ShapeTypes.TRIANGLE,
      lines: ShapeTypes.LINE,
    };

    // 3.3 Tuned candidate & mutation counts for Lines Mode vs Circles/Triangles
    const options =
      mode === 'lines'
        ? {
            shapeTypes: [shapeTypeMap[mode]],
            alpha: 235,
            candidateShapesPerStep: 75,
            shapeMutationsPerStep: 110,
          }
        : {
            shapeTypes: [shapeTypeMap[mode]],
            alpha: 180,
            candidateShapesPerStep: 60,
            shapeMutationsPerStep: 95,
          };

    const shapes: string[] = [];

    for (let i = 0; i < totalShapes; i++) {
      const stepResults = runner.step(options);
      const rawSvg = SvgExporter.exportShapes(stepResults);
      const enhancedSvg = enhanceSvgShape(rawSvg, mode, i);
      shapes.push(enhancedSvg);

      // Stream the initial shapes immediately so the game is playable right away
      if (i + 1 === initialShapes) {
        const msg: GeometrizeWorkerResponse = {
          jobId,
          type: 'INITIAL_READY',
          shapes: shapes.slice(),
          width,
          height,
        };
        self.postMessage(msg);
      } else if (
        i + 1 > initialShapes &&
        (i + 1 - initialShapes) % modeCfg.increment === 0 &&
        i + 1 < totalShapes
      ) {
        const msg: GeometrizeWorkerResponse = {
          jobId,
          type: 'PROGRESS',
          shapes: shapes.slice(),
          width,
          height,
        };
        self.postMessage(msg);
      }
    }

    const doneMsg: GeometrizeWorkerResponse = {
      jobId,
      type: 'COMPLETE',
      shapes,
      width,
      height,
    };
    self.postMessage(doneMsg);
  } catch (err) {
    const errMsg: GeometrizeWorkerResponse = {
      jobId,
      type: 'ERROR',
      shapes: [],
      width,
      height,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(errMsg);
  } finally {
    Math.random = originalRandom;
  }
};
