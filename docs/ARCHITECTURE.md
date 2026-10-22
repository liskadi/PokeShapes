# PolyMon — Technical Architecture

## 1. System Overview
PolyMon is a serverless, client-side single-page application (SPA) built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**. It consumes [PokéAPI v2](https://pokeapi.co/docs/v2) as a read-only data source and uses [`geometrizejs`](https://github.com/Tw1ddle/geometrize) inside an isolated **Web Worker** to reconstruct Pokémon official artwork (`sprites.other["official-artwork"].front_default`) using geometric primitives (`CIRCLE`, `TRIANGLE`, `LINE`).

---

## 2. Deterministic Daily Puzzle Engine (`src/utils/dailySeed.ts`)

### 2.1 Epoch & Date Indexing
- **Epoch Date**: `2026-10-21` (Puzzle `#1`).
- **Date Key Format**: Local `YYYY-MM-DD` (e.g., `"2026-10-22"`).
- **DST-Safe Day Index Calculation**:
  ```ts
  const [y, m, d] = dateKey.split('-').map(Number);
  const targetUtc = Date.UTC(y, m - 1, d);
  const epochUtc = Date.UTC(2026, 9, 21);
  const dayIndex = Math.max(0, Math.floor((targetUtc - epochUtc) / 86_400_000));
  ```

### 2.2 Seeded PRNG & Fisher-Yates Deck Shuffle
- **Hash Function (`cyrb128` / `fnv1a32`)**: Converts any string key (e.g. `"polymon-v1:circles:cycle-0"`) into a deterministic 32-bit unsigned integer seed.
- **PRNG (`mulberry32`)**: Produces deterministic pseudo-random numbers in $[0, 1)$.
- **Cycle Deck Shuffle**:
  - For $N = 1025$ mainline Pokémon (`1..1025`), each cycle of $1025$ days generates a full permutation via Fisher-Yates shuffle.
  - Within any 1,025-day cycle, no Pokémon repeats within the same shape mode.
  - A cross-mode collision guard ensures `circles`, `triangles`, and `lines` never select the same Pokémon on the same calendar day.

---

## 3. Seeded Geometrize Web Worker (`src/workers/geometrize.worker.ts`)

### 3.1 Why a Web Worker?
Hill-climbing image approximation (`ImageRunner.step`) tests 50–75 random candidate shapes and mutates each candidate 100+ times per step across 105 steps. Running this on the main UI thread would freeze animations and input responsiveness. Running inside a Web Worker keeps the UI at a locked 60 FPS.

### 3.2 Deterministic Shape Generation
`geometrizejs` internally calls `Math.random()` when generating random candidate primitives and mutating them. Inside `geometrize.worker.ts`, before stepping `ImageRunner`, we override `Math.random` with our `mulberry32` PRNG seeded with `"polymon-shapes:${dateKey}:${mode}:${pokemonId}"`. Every player on the same day receives the exact same 105 SVG shapes in the exact same order.

### 3.3 Progressive Streaming Protocol
1. Main thread fetches the official artwork PNG (`sprites.other['official-artwork'].front_default`), decodes it onto an offscreen canvas (`256×256`), extracts raw `Uint8ClampedArray` RGBA pixel data, and transfers the buffer to the worker.
2. Worker creates `Bitmap.createFromByteArray(width, height, rgbaData)` and `new ImageRunner(bitmap)`.
3. Worker runs steps `1..15` and posts `{ type: 'PARTIAL_SHAPES', shapes: svgShapes.slice(0, 15) }` so the initial 15-shape puzzle is immediately playable.
4. Worker continues steps `16..105`, posting progress updates and finally `{ type: 'COMPLETE_SHAPES', shapes: all105SvgShapes }`.
5. Main thread caches the 105 SVG strings in `IndexedDB` (`polymon-shapes-db`) under `${dateKey}:${mode}:${pokemonId}` so page reloads are instantaneous.

---

## 4. Consumption-Only PokéAPI Layer (`src/api/pokeapi.ts`)

- **Master Directory (`GET /api/v2/pokemon?limit=1025`)**:
  - Fetched once and cached in `localStorage` (`polymon:pokemon-index-v1`).
  - Powers instant client-side autocomplete search with Pokédex ID (`#0025`), formatted name, and official artwork thumbnail URL.
- **Individual Pokémon (`GET /api/v2/pokemon/{id}`)**:
  - Extracts:
    - `sprites.other['official-artwork'].front_default` (primary sprite used for Geometrize)
    - `types` (Type 1, Type 2)
    - `height` (in decimeters → meters)
    - `weight` (in hectograms → kilograms)
    - `generation` (derived deterministically from National Pokédex ID ranges Gen I–IX)
    - `cries.latest` (optional official cry audio if available)

---

## 5. Persistence Schema (`src/utils/storage.ts`)

- `polymon:settings-v1`: Theme (`dark` | `light`), Color Blind mode (`none` | `deuteranopia` | `tritanopia`), High-Contrast Canvas, Animate Shapes, Show Attribute Hints, Sound Effects, Practice Mode state.
- `polymon:daily-state-v1`: Active `dateKey` (`YYYY-MM-DD`) and per-mode state (`circles`, `triangles`, `lines`), including target Pokémon ID, `guesses[]`, `status` (`playing` | `won` | `lost`), and selected scrubber step.
- `polymon:stats-v1`: Per-mode and aggregate statistics (`played`, `won`, `currentStreak`, `maxStreak`, `lastPlayedDateKey`, `lastWonDateKey`, `guessDistribution` array of length 10, and `history` log).
