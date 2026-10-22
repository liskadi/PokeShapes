import * as GeometrizePkg from 'geometrizejs';
import { GameMode, INITIAL_SHAPES, MAX_SHAPES } from '../types/game';
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
 * Enhances raw SVG shape markup exported by Geometrize SvgExporter:
 * - For Lines mode (`<line .../>`), upgrades 1px hairline strokes into bold,
 *   expressive rounded geometric brush strokes (`stroke-width="4.5" stroke-linecap="round"`).
 * - Adds `vector-effect="non-scaling-stroke"` avoidance so shapes scale proportionally with SVG viewBox.
 */
function enhanceSvgShape(rawSvg: string, mode: GameMode, stepIndex: number): string {
  if (mode === 'lines') {
    // Earlier strokes slightly thicker to establish silhouette, later strokes finer for detail
    const strokeWidth = stepIndex < 25 ? '5.2' : stepIndex < 65 ? '4.2' : '3.4';
    return rawSvg.replace(
      'stroke-width="1"',
      `stroke-width="${strokeWidth}" stroke-linecap="round"`
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
    initialShapes = INITIAL_SHAPES,
    totalShapes = MAX_SHAPES,
  } = event.data;

  const originalRandom = Math.random;

  try {
    // Install deterministic Mulberry32 PRNG over Math.random so hill-climbing
    // produces the exact same 105 shapes for every player on the same day!
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

    const options =
      mode === 'lines'
        ? {
            shapeTypes: [shapeTypeMap[mode]],
            alpha: 225,
            candidateShapesPerStep: 75,
            shapeMutationsPerStep: 110,
          }
        : {
            shapeTypes: [shapeTypeMap[mode]],
            alpha: 178,
            candidateShapesPerStep: 55,
            shapeMutationsPerStep: 95,
          };

    const shapes: string[] = [];

    for (let i = 0; i < totalShapes; i++) {
      const stepResults = runner.step(options);
      const rawSvg = SvgExporter.exportShapes(stepResults);
      const enhancedSvg = enhanceSvgShape(rawSvg, mode, i);
      shapes.push(enhancedSvg);

      // Stream the initial 15 shapes immediately so the game is playable right away
      if (i + 1 === initialShapes) {
        const msg: GeometrizeWorkerResponse = {
          jobId,
          type: 'INITIAL_READY',
          shapes: shapes.slice(),
          width,
          height,
        };
        self.postMessage(msg);
      } else if (i + 1 > initialShapes && (i + 1 - initialShapes) % 20 === 0 && i + 1 < totalShapes) {
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
