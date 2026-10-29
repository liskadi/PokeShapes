# PokéShapes — Daily Geometric Pokémon Guessing Game

**PokéShapes** is a Wordle-inspired daily Pokémon guessing web application where players identify the daily mystery Pokémon from a progressive geometric primitive reconstruction of its official artwork.

## Features
- **Three Daily Shape Game Modes** powered by [Tw1ddle/geometrize](https://github.com/Tw1ddle/geometrize) (`geometrizejs`):
  - **● Circles Mode** (`ShapeTypes.CIRCLE`)
  - **▲ Triangles Mode** (`ShapeTypes.TRIANGLE`)
  - **╱ Lines Mode** (`ShapeTypes.LINE` — with tuned thicker stroke rasterization)
- **Per-Mode Progressive Shape Resolution (10 Guesses)**:
  - **● Circles**: Starts at **40 shapes**, adds **+20 shapes** per wrong guess (`40 → 220 shapes`).
  - **▲ Triangles**: Starts at **20 shapes**, adds **+10 shapes** per wrong guess (`20 → 110 shapes`).
  - **╱ Lines**: Starts at **50 shapes**, adds **+25 shapes** per wrong guess (`50 → 275 shapes`).
  - Interactive **Shape Tier Scrubber** to inspect unlocked shape tiers and **Give Up / Reveal Pokémon** option.
- **Progressive Pokédex Scanner Clues**:
  - **3 Guesses**: Unlocks **Generation Hint** (`Gen I – Gen IX` & Region).
  - **5 Guesses**: Unlocks **Primary Type Hint**.
  - **7 Guesses**: Unlocks **Habitat Hint**.
- **Post-Game Timelapse Replay, SVG/PNG Export & Normalized Cry Audio**:
  - Watch a shape-by-shape **Timelapse Replay**, blend between Geometry and the Original Artwork, listen to the **RMS Volume-Normalized Official Pokémon Cry**, and download your daily geometric portrait as a scalable **SVG** or **`1024×1024` PNG**.
- **Yesterday's Champions & Past Daily Archive Picker**:
  - View yesterday's 3 daily Pokémon answers and replay any past daily puzzle from the **Archive** without affecting your PolyDex, Trainer Rank, Statistics, or Daily Streaks.
- **Personal "PolyDex" Collection, Final Geometry Viewer & Trainer Ranks**:
  - Track every Pokémon you catch on Today's Daily Puzzles across Circles (`●`), Triangles (`▲`), and Lines (`╱`) modes, view all 7 available **Trainer Ranks** (*Rookie Scanner* to *Grand Master*), and click any caught Pokémon to inspect its **final geometry** across all 3 shape modes!
- **Alpha Bounding-Box Auto-Crop & Idle Background Pre-Generation**:
  - Automatically crops transparent sprite margins so every Pokémon fills **88% of the `180×180` bitmap** before geometrization, and pre-generates sibling daily modes in the background for `0ms` tab switching.
- **Settings, Accessibility & Rich Emoji Sharing**:
  - **Light / Dark Mode**, **Color Blind Palettes** (*Standard*, *Deuteranopia/Protanopia*, *Tritanopia*), and **Richer Emoji Grid Sharing** (`🟩🟨🔼🔽⬛` per-guess attribute matrix + shape tier counts).

## Getting Started

```bash
npm install
npm run dev
```

## Documentation
See the [`docs/`](./docs/) directory:
- [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md)
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- [`docs/GAME_DESIGN.md`](./docs/GAME_DESIGN.md)
- [`docs/COMPETITIVE_RESEARCH_AND_IMPROVEMENTS.md`](./docs/COMPETITIVE_RESEARCH_AND_IMPROVEMENTS.md)
