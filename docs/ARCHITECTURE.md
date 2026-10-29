# PokéShapes — Technical Architecture

## 1. System Overview
PokéShapes is a serverless, client-side single-page application (SPA) built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS v4**. It consumes [PokéAPI v2](https://pokeapi.co/docs/v2) as a read-only data source and uses [`geometrizejs`](https://github.com/Tw1ddle/geometrize) inside an isolated **Web Worker** to reconstruct Pokémon official artwork (`sprites.other["official-artwork"].front_default`) using geometric primitives (`CIRCLE`, `TRIANGLE`, `LINE`).

---

## 2. Deterministic Daily Puzzle & Archive Engine (`src/utils/dailySeed.ts`)

### 2.1 Epoch, Date Indexing & Archive Helpers
- **Epoch Date**: `2026-09-22` (Puzzle `#1`), providing an immediate multi-week archive of playable historical puzzles.
- **Date Key Format**: Local `YYYY-MM-DD` (e.g., `"2026-10-22"`).
- **DST-Safe Day Index Calculation**:
  ```ts
  const [y, m, d] = dateKey.split('-').map(Number);
  const targetUtc = Date.UTC(y, m - 1, d);
  const epochUtc = Date.UTC(2026, 8, 22);
  const dayIndex = Math.max(0, Math.floor((targetUtc - epochUtc) / 86_400_000));
  ```
- **Yesterday & Archive Helpers**:
  - `getOffsetDateKey(baseDateKey, -1)` resolves yesterday's `YYYY-MM-DD` key for the **Yesterday's Champions** panel.
  - `getArchiveDateKeys(todayDateKey, maxDays)` enumerates past daily puzzle dates back to the epoch for the **Past Daily Archive Picker**.

### 2.2 Seeded PRNG & Fisher-Yates Deck Shuffle
- **Hash Function (`hashString`)**: Converts any string key (e.g. `"pokeshapes-deck-v1:circles:cycle-0"`) into a deterministic 32-bit unsigned integer seed.
- **PRNG (`mulberry32`)**: Produces deterministic pseudo-random numbers in $[0, 1)$.
- **Cycle Deck Shuffle**:
  - For $N = 1025$ mainline Pokémon (`1..1025`), each cycle of $1025$ days generates a full permutation via Fisher-Yates shuffle.
  - Within any 1,025-day cycle, no Pokémon repeats within the same shape mode.
  - A cross-mode collision guard ensures `circles`, `triangles`, and `lines` never select the same Pokémon on the same calendar day.

---

## 3. Seeded Geometrize Web Worker & Idle Pre-Warming

### 3.1 Alpha Bounding-Box Auto-Crop (`src/api/pokeapi.ts`)
Before transferring sprite pixels to the Web Worker, `loadArtworkBitmapBytes` performs an **Alpha Bounding-Box Auto-Crop**:
1. Decodes the raw official artwork (`475×475`) onto a temporary canvas and scans all pixels for `alpha > 16` to find $(x_{\min}, y_{\min}, x_{\max}, y_{\max})$.
2. Crops to the non-transparent Pokémon bounds and scales/centers the sprite so its longest dimension occupies **88% of the `180×180` bitmap** (`fillRatio = 0.88`).
3. Exports `croppedArtworkDataUrl` (`canvas.toDataURL('image/png')`) so the post-game **Original Artwork vs. Geometrized** blend overlay aligns 1:1 with the generated SVG primitives.

### 3.2 Deterministic Shape Generation & Thicker Line Tuning (`src/workers/geometrize.worker.ts`)
- Inside `geometrize.worker.ts`, before stepping `ImageRunner`, `Math.random` is overridden with `mulberry32` seeded with `"pokeshapes-shapes-v2:${dateKey}:${mode}:${pokemonId}"`. Every player on the same day receives the exact same 105 SVG shapes in the exact same order.
- **Thicker Line Rasterization Tuning (Lines Mode)**:
  - Uses `candidateShapesPerStep: 95`, `shapeMutationsPerStep: 130`, and `alpha: 235`.
  - Applies graduated stroke widths (`6.4px` for structural lines `0..14`, `4.8px` for mid-layer lines `15..44`, `3.5px` for fine detail lines `45..104`) and boosted minimum `stroke-opacity` (`0.92` on initial 15 lines) with `stroke-linecap="round"`.

### 3.3 Progressive Streaming & Idle Background Pre-Generation (`src/hooks/useGeometrize.ts`)
1. **Stage A (Immediate 15-Shape Playability)**: The worker runs steps `1..15` and posts `PARTIAL_SHAPES` so the puzzle is playable within ~300ms.
2. **Stage B (Remaining 90 Shapes)**: The worker streams steps `16..105` and caches the complete 105 SVG strings in `IndexedDB` (`pokeshapes-shapes-db`) under `pokeshapes-v2:${dateKey}:${mode}:${pokemonId}`.
3. **Stage C (Idle Background Pre-Generation)**: Once the active mode finishes generating its 105 shapes, `useGeometrize` automatically runs a low-priority background queue (`backgroundTasks`) to pre-generate and cache the remaining 2 daily shape modes in `IndexedDB`, making mode tab switches (`● Circles`, `▲ Triangles`, `╱ Lines`) `0ms` instantaneous.

---

## 4. Consumption-Only PokéAPI Layer (`src/api/pokeapi.ts`)

- **Master Directory (`GET /api/v2/pokemon?limit=1025`)**:
  - Fetched once and cached in `localStorage` (`pokeshapes:pokemon-index-v1`).
  - Powers instant client-side autocomplete search with Pokédex ID (`#0025`), formatted name, and official artwork thumbnail URL.
- **Individual Pokémon + Species (`GET /api/v2/pokemon/{id}` & `GET /api/v2/pokemon-species/{id}`)**:
  - Fetched in parallel and cached in `localStorage` (`pokeshapes:pokemon-details-v2:{id}`).
  - Extracts:
    - `sprites.other['official-artwork'].front_default` (primary sprite used for Geometrize)
    - `types` (Type 1, Type 2)
    - `height` (decimeters → meters) & `weight` (hectograms → kilograms)
    - `generation` (`1..9`) & `regionName` (`Kanto` .. `Paldea`)
    - `habitat` (from `pokemon-species.habitat`, with deterministic type-based biome fallback for Gen 4–9 species where PokéAPI `habitat` is null)
    - `genus` (English Pokédex category, e.g., `"Mouse Pokémon"`)
    - `cries.latest` (Official Pokémon Cry OGG audio URL played via `playPokemonCry` in `src/utils/sound.ts`)

---

## 5. Persistence Schema (`src/utils/storage.ts`)

- `pokeshapes:settings-v1`: Theme (`dark` | `light`), Color Blind mode (`none` | `deuteranopia` | `tritanopia`), High-Contrast Canvas, Animate Shapes, Show Attribute Hints, Sound Effects, Practice Mode state.
- `pokeshapes:daily-state-v1`: Active live `dateKey` (`YYYY-MM-DD`) and per-mode state (`circles`, `triangles`, `lines`), including target Pokémon ID, `guesses[]`, `status` (`playing` | `won` | `lost`), `gaveUp`, and selected scrubber step.
- `pokeshapes:archive-state-v1:{dateKey}`: Per-date saved progress for historical puzzles played via the **Past Daily Archive Picker**.
- `pokeshapes:polydex-v1`: Personal **PolyDex** collection map (`Record<number, PolyDexEntry>`) storing caught Pokémon IDs, solved shape modes (`circles`, `triangles`, `lines`), best guess count, minimum shape count, and timestamp, powering **Trainer Ranks** (`getTrainerRank`).
- `pokeshapes:stats-v1`: Per-mode and aggregate statistics (`played`, `won`, `currentStreak`, `maxStreak`, `tripleCrownDays`, `lastPlayedDateKey`, `lastWonDateKey`, `guessDistribution` array of length 10, and `history` log).
