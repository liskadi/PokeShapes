# PokéShapes — Competitive Research & Improvement Roadmap

## 1. Competitive Landscape: Popular Daily Pokémon Web Games

We analyzed the most popular daily Pokémon browser games in the Wordle/trivia ecosystem—frequently featured by creators and daily puzzle communities—to benchmark **PokéShapes**'s gameplay loop, visual identity, replayability model (**Unlimited Mode vs. Past Archive**), and technical architecture.

### 1.1 Master Comparison Matrix (12 Daily Pokémon Games + PokéShapes)

| Game | Core Mechanic | Visual / Sensory Hook | Unlimited Mode? | Past Daily Archive? | Key Engagement & Retention Features |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Squirdle** (`squirdle.fireblend.com`) | Guess the mystery Pokémon in 8–9 tries via attribute deduction (Gen, Type 1, Type 2, Height, Weight) | Color-coded spreadsheet grid (`🟩🟨🟥`) + directional arrows (`🔼🔽`) | **Yes** (*Freeplay*) | **No** | • Generation filters (`Gen 1`, `Gen 1–3`, `All`) in Freeplay<br>• Detailed per-row emoji grid sharing |
| **PokéDoku** (`pokedoku.com`) | $3 \times 3$ Immaculate Grid: fill 9 cells matching intersecting Row & Column criteria in 9 PP | Official sprites populate solved grid cells with rarity % badges | **Yes** (*Unlimited*) | **Yes** (*Archive*) | • **Uniqueness / Rarity % Score**<br>• **Personal Pokédex Mastery Tracker** collecting every Pokémon used |
| **PokéGuess** (`pokeguess.net`) | Multi-mode daily trivia hub: *Category Guess*, *Color/Shiny Hue Guess*, *Stat Guess*, *Find the Pokémon*, *Move Guess* | Interactive HSL color-restoration sliders, crowded sprite search walls & base stat bars | **Yes** (*Practice*) | **Partial** | • 5 distinct mini-game formats testing visual, stat, and move knowledge |
| **PokéConnection** (`pokennection.com`) | *NYT Connections* spin-off: group 16 Pokémon into 4 hidden categories of 4 before losing 4 lives | $4 \times 4$ tile board that locks color-coded difficulty rows (`🟨🟩🟦🟪`) | **Yes** (*Unlimited & Custom*) | **Yes** (*Archive*) | • Obscure lore/move/ability categories<br>• Community-created custom boards & full daily archive |
| **PokéWeaver** (`pokeweaver.com`) | Drag and place a hand of Pokémon onto a geometric grid so every adjacent neighbor shares at least one Type | Square, Triangle, Hexagon, and Octagon boards with locked anchor Pokémon hints | **No** *(Daily Only)* | **No** | • Rotating board topologies (Hexagon/Triangle/Square)<br>• Generation filter settings |
| **PokéSize Up** (`pokesizeup.com`) | Compare, scale, and sort Pokémon by official Pokédex height/weight (*Scale*, *Stairs*, *Higher/Lower*) | Interactive visual size-scaling silhouettes side-by-side | **Yes** (*Survival Unlimited*) | **Yes** (*Calendar*) | • 3-life survival Unlimited mode with scaling score thresholds (`400 → 950` pts)<br>• Calendar archive of past dailies |
| **PokkeMap** (`pokkemap.com`) | *GeoGuessr*-style location game: pinpoint wild Pokémon encounter routes on regional maps (Kanto, Johto, Hoenn) | Interactive zoomable classic & modern regional overworld maps | **Yes** (*Unlimited & Adventure*) | **No** | • Multi-round daily scaling in difficulty<br>• Adventure & Unlimited regional mastery modes |
| **PokéWired** (`pokewired.com`) | Bridge a starting Pokémon to an ending Pokémon through a circuit of intermediate trait/type/evolution links | Node-and-wire circuit board where valid connections light up | **Yes** (*Unlimited & Endless Chain*) | **No** | • Multiple valid logical paths per puzzle<br>• Endless Chain survival mode |
| **PokéCryptic** (`pokecryptic.com`) | *Minute Cryptic* spin-off: solve a single clever cryptic crossword clue (anagrams, charades, containers) for a Pokémon term | Letter slots with progressive definition/wordplay indicator hints | **No** *(Daily Only)* | **Yes** (*Archive*) | • High-"aha!" moment wordplay<br>• Strict 1-per-day curated clue + sequential archive of past clues |
| **PokéDoodle** (`pokedoodle.com`) | Visual doodle/sketch identification & fast daily stat/BST mini-challenges | Hand-drawn/stylized doodle cards and visual comparisons | **No** *(Daily Focus)* | **Yes** *(Sequential)* | • Quick, snackable visual recognition loop |
| **Pokémantle** (`pokemantle`) | *Semantle* spin-off: guess the secret Pokémon ranked by continuous feature-vector similarity % | Similarity score ranking table (`0–100%` cold-to-hot progress bar) | **No** *(Strict Daily Only)* | **No** *(Yesterday Only)* | • Deep multi-feature similarity vector (stats, egg groups, types, gen, evo stage)<br>• Strict once-a-day limit to prevent burnout |
| **Pokédle** (`pokedle.net`) | 5 Daily Modes: *Classic*, *Silhouette*, *Card Blur*, *Description*, *Cry* | Static black silhouette or Gaussian-blurred TCG card that unblurs per wrong guess | **No** *(Daily Only)* | **No** *(Yesterday Only)* | • Progressive Hint Unlocks after $N$ wrong guesses<br>• Auto-advance prompt to next daily mode |
| **PokéShapes** *(Ours)* | **3 Geometric Primitive Daily Modes**: *Circles* (`●`), *Triangles* (`▲`), *Lines* (`╱`) | **Procedural hill-climbing vector art** (`15 → 105` shapes, `+10` per wrong guess) + Pokédex attribute clues | **No** *(Daily + Archive Only)* | **Yes** (*Archive Picker*) | • Interactive Shape Tier Scrubber (`15..105`)<br>• Progressive Scanner Clues (`3 / 5 / 7` wrong guesses) + Official Cry<br>• Timelapse Replay (`1 → 105`) & SVG/PNG Export<br>• Personal PolyDex & Trainer Ranks |

---

### 1.2 Unlimited Mode vs. Past Daily Archive: Industry Breakdown & Recommendation for PokéShapes

Out of the **11 benchmarked games** above:
- **6 Games Have an Unlimited Mode**: *Squirdle*, *PokéDoku*, *PokéGuess*, *PokéConnection*, *PokéSize Up*, *PokkeMap*, and *PokéWired*.
  - Notice a pattern: games like *PokéSize Up* (higher/lower scaling), *PokéWired* (chain building), and *PokkeMap* (map pinpointing) are **arcade-style highscore/survival loops** where a single round takes 15–30 seconds, so players expect an endless arcade mode.
- **5 Games Strictly Omit Unlimited Mode (Daily + Archive Only)**: *PokéWeaver*, *PokéCryptic*, *PokéDoodle*, *Pokémantle*, and *Pokédle*.
  - Games built around a **single mystery reveal** (*Pokédle*, *Pokémantle*, *PokéCryptic*, *PokéWeaver*) intentionally **do NOT offer an Unlimited Mode**—instead relying on **multiple daily modes** and/or a **Past Daily Archive**.

#### Why Scrapping "Unlimited Mode" in Favor of "Past Daily Archive" Makes Sense for PokéShapes:
1. **Prevents Day-1 Novelty Burnout**:
   - In a visual reveal game like PokéShapes, the core magic is watching the geometric shapes (`Circles`, `Triangles`, `Lines`) resolve into a mystery Pokémon. When a game offers an *Unlimited Mode*, new players often binge 25–40 random puzzles in their first sitting, burn out on the visual novelty, and never build a daily return habit.
2. **PokéShapes Already Has 3 Distinct Puzzles Per Day + Full Past Archive**:
   - Because PokéShapes has **3 modes per day**, a single day already provides 3× the content of *Wordle* or *Pokémantle*.
   - If a player still wants more after finishing today's 3 modes, the **Past Daily Archive** gives them **dozens of deterministic, numbered historical puzzles** (`Daily #1`, `Daily #2`, …) with completion tracking (`✓ 3/3 Solved`).
3. **Protects the Integrity of the Personal PolyDex & Trainer Ranks**:
   - With Unlimited Mode enabled, a player can spam random puzzles (or filter by Generation in Unlimited Mode) to farm **PolyDex** catches and reach *PokéShapes Grand Master* in a single weekend.
   - If catches only come from **Today's Daily Puzzles** and **Past Daily Archive Puzzles**, every single entry in a player's **PolyDex** is earned from an official, finite daily challenge—making PolyDex completion and Trainer Ranks genuinely prestigious!
4. **Cleaner, More Focused UI**:
   - Scrapping Unlimited Mode removes the `Daily / Unlimited` header toggle, the `New Random` button, and the secondary `Generation Filter` bar—putting 100% of the spotlight on **Today's Daily Puzzles** and the **Archive (`Yesterday & Past Dailies`)** modal.

---

## 2. Implemented Design & UX Improvements (`v2.0`)

### 2.1 Progressive "Scanner Clues" & Official Pokémon Cry Audio — ✅ Implemented
- **Files**: [`src/components/ScannerClues.tsx`](../src/components/ScannerClues.tsx), [`src/api/pokeapi.ts`](../src/api/pokeapi.ts), [`src/utils/sound.ts`](../src/utils/sound.ts)
- **Specification & Implementation**:
  - `fetchPokemonDetails` in [`src/api/pokeapi.ts`](../src/api/pokeapi.ts) fetches both `/api/v2/pokemon/{id}` and `/api/v2/pokemon-species/{id}` in parallel to populate `regionName`, `genus`, `habitat` (with deterministic biome fallback when PokéAPI `habitat` is `null` on Gen 4–9 species), and `cryUrl` (`cries.latest`).
  - [`ScannerClues.tsx`](../src/components/ScannerClues.tsx) renders a 3-slot progressive clue panel with click-to-reveal pills and an official Pokémon Cry audio button:
    - **3 Wrong Guesses (45 Shapes)**: Unlocks **Generation Hint** (e.g., `Gen I · Kanto`).
    - **5 Wrong Guesses (65 Shapes)**: Unlocks **Primary Type Hint** (e.g., `Fire`).
    - **7 Wrong Guesses (85 Shapes)**: Unlocks **Habitat Hint** (e.g., `Mountain` / `Waters-Edge`) **plus** the **Official Pokémon Cry (`cries.latest`)** audio player button (`playPokemonCry`).
  - On round completion (won or lost), all clues unlock automatically and a **"Cry"** button is also available on the post-game reveal banner in [`GeometrizeCanvas.tsx`](../src/components/GeometrizeCanvas.tsx).

### 2.2 Post-Game Timelapse Replay (`1 → 105`) & SVG / PNG Art Export — ✅ Implemented
- **Files**: [`src/components/GeometrizeCanvas.tsx`](../src/components/GeometrizeCanvas.tsx)
- **Specification & Implementation**:
  - **Timelapse Replay (`1 → 105`)**: Added a `Replay 1→105` button on the post-game panel that animates the reconstruction from `1` shape up to `105` shapes (`35ms` per frame) with a live progress bar (`Timelapse: N / 105 shapes`) and Stop toggle.
  - **Download SVG**: Exports a standalone vector `.svg` file (`pokeshapes-dayN-mode-name-105shapes.svg`) containing the dark scanner backdrop and all visible geometric primitives.
  - **Download PNG (`1024×1024`)**: Rasterizes the SVG onto an offscreen `1024×1024` HTML5 Canvas and triggers a crisp high-DPI `.png` download.

### 2.3 "Yesterday's Champions" & Past Daily Archive Picker — ✅ Implemented
- **Files**: [`src/components/ArchiveModal.tsx`](../src/components/ArchiveModal.tsx), [`src/utils/dailySeed.ts`](../src/utils/dailySeed.ts), [`src/utils/storage.ts`](../src/utils/storage.ts), [`src/hooks/useDailyGame.ts`](../src/hooks/useDailyGame.ts)
- **Specification & Implementation**:
  - **Yesterday's Champions**: Displays yesterday's date key (`getOffsetDateKey(todayDateKey, -1)`), puzzle number, and the 3 daily Pokémon answers (`Circles`, `Triangles`, `Lines`) with a **Reveal / Hide Spoilers** toggle and official artwork thumbnails.
  - **Past Daily Archive Picker**: Lists all past daily puzzles since Epoch (`2026-09-22`) with per-mode completion badges (`✓ Won`, `✕ Lost`, `••• In Progress`). Selecting any past date loads that date's deterministic puzzles in Archive Mode (`pokeshapes:archive-state-v1:${dateKey}`) without risking the user's live Daily Streak, with a prominent banner to return to Today's Live Daily Puzzle.

### 2.4 Personal "PolyDex" Collection & Trainer Ranks — ✅ Implemented
- **Files**: [`src/components/PolyDexModal.tsx`](../src/components/PolyDexModal.tsx), [`src/utils/storage.ts`](../src/utils/storage.ts), [`src/types/game.ts`](../src/types/game.ts)
- **Specification & Implementation**:
  - Every time a player wins a puzzle, `recordPolyDexCatch` records the Pokémon ID, caught shape modes (`● Circles`, `▲ Triangles`, `╱ Lines`), best guess count, and minimum shape count in `localStorage` (`pokeshapes:polydex-v1`).
  - **Trainer Ranks (`getTrainerRank`)**: Calculates progression across 7 tiers based on unique species caught:
    1. `Rookie Scanner` (`0+` caught)
    2. `Bug Catcher` (`3+` caught)
    3. `Ace Trainer` (`10+` caught)
    4. `Gym Leader` (`25+` caught)
    5. `Elite Four` (`50+` caught)
    6. `Regional Champion` (`100+` caught)
    7. `PokéShapes Grand Master` (`250+` caught)
  - [`PolyDexModal.tsx`](../src/components/PolyDexModal.tsx) provides search & mode filters (`All Caught`, `3/3 Mastered`, `● Circles`, `▲ Triangles`, `╱ Lines`) and displays mastery badges per species.

### 2.5 "Give Up / Reveal Pokémon" Button (Daily & Archive Modes) — ✅ Implemented
- **Files**: [`src/components/GeometrizeCanvas.tsx`](../src/components/GeometrizeCanvas.tsx), [`src/hooks/useDailyGame.ts`](../src/hooks/useDailyGame.ts)
- **Specification & Implementation**:
  - **Unlimited Mode Removed**: Replaced Unlimited Mode with the **Today's Daily / Past Archive** header switcher so all replayability and **PolyDex** progression comes from official daily puzzles.
  - **2-Step "Give Up / Reveal Pokémon" Button**: Added a 2-step confirmation `Give Up / Reveal Pokémon` button in [`GeometrizeCanvas.tsx`](../src/components/GeometrizeCanvas.tsx) while a game is in progress. Confirming reveals all `105` shapes, unlocks the post-game comparison slider and Pokémon identity, and records the round as a loss (`gaveUp: true`).

---

## 3. Implemented Technical & Engine Improvements (`v2.0`)

### 3.1 Alpha Bounding-Box Auto-Crop Before Geometrization — ✅ Implemented
- **Files**: [`src/api/pokeapi.ts`](../src/api/pokeapi.ts), [`src/hooks/useGeometrize.ts`](../src/hooks/useGeometrize.ts), [`src/components/GeometrizeCanvas.tsx`](../src/components/GeometrizeCanvas.tsx)
- **Technical Implementation**:
  - `loadArtworkBitmapBytes` in [`src/api/pokeapi.ts`](../src/api/pokeapi.ts) decodes the raw official artwork onto a temporary canvas and scans all pixels for `alpha > 16` to compute the tight bounding box $(x_{\min}, y_{\min}, x_{\max}, y_{\max})$.
  - It crops and centers that bounding box so the Pokémon's longest dimension fills **88% of the `180×180` bitmap** (`fillRatio = 0.88`), eliminating wasted transparent margins on small Pokémon.
  - It also exports `croppedArtworkDataUrl` (`canvas.toDataURL('image/png')`) so the post-game **Original Artwork vs. Geometry Blend Slider** aligns 1:1 with the generated SVG primitives.

### 3.2 Idle Background Pre-Generation for All 3 Daily Modes — ✅ Implemented
- **Files**: [`src/hooks/useGeometrize.ts`](../src/hooks/useGeometrize.ts), [`src/hooks/useDailyGame.ts`](../src/hooks/useDailyGame.ts), [`src/App.tsx`](../src/App.tsx)
- **Technical Implementation**:
  - `useDailyGame` computes `backgroundPrewarmTasks` for the two non-active daily modes (`circles`, `triangles`, `lines`).
  - Once the active mode finishes generating its 105 shapes (`isGenerating === false`), `useGeometrize` waits `250ms` for idle UI settle and sequentially pre-generates any uncached sibling daily modes in the Web Worker (`pokeshapes-v2:${dateKey}:${mode}:${pokemonId}`), storing their 105 SVG shapes in `IndexedDB`.
  - Switching between `● Circles`, `▲ Triangles`, and `╱ Lines` becomes **instantaneous (`0ms`)**.

### 3.3 Thicker Line Rasterization Tuning for Lines Mode — ✅ Implemented
- **Files**: [`src/workers/geometrize.worker.ts`](../src/workers/geometrize.worker.ts)
- **Technical Implementation**:
  - Increased `Lines Mode` hill-climbing search density to `candidateShapesPerStep: 95`, `shapeMutationsPerStep: 130`, and `alpha: 235`.
  - Upgraded `enhanceSvgPrimitive` with graduated stroke widths (`6.4px` for structural lines `0..14`, `4.8px` for mid-tier lines `15..44`, and `3.5px` for fine detail lines `45..104`) and boosted minimum `stroke-opacity` (`0.92` for initial 15 lines) with `stroke-linecap="round"`.

### 3.4 Richer Emoji Grid Sharing — ✅ Implemented
- **Files**: [`src/components/StatsModal.tsx`](../src/components/StatsModal.tsx)
- **Technical Implementation**:
  - Upgraded `buildShareText` in [`StatsModal.tsx`](../src/components/StatsModal.tsx) with `formatGuessEmojiRow(guess)`:
    - Displays summary badges across all 3 daily modes (`● Circles`, `▲ Triangles`, `╱ Lines`) plus a detailed per-guess attribute matrix (`[Gen, Types, Height, Weight]`) using `🟩` (Exact Match), `🟨` (Partial Type Match), `🔼` (Target Higher), `🔽` (Target Lower), and `⬛` (No Match), along with the shape count at each step (`15s`, `25s`, etc.).
