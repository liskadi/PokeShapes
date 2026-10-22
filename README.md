# PolyMon — Daily Geometric Pokémon Guessing Game

**PolyMon** is a Wordle-inspired daily Pokémon guessing web application where players identify the daily mystery Pokémon from a progressive geometric primitive reconstruction of its official artwork.

## Features
- **Three Daily Shape Game Modes** powered by [Tw1ddle/geometrize](https://github.com/Tw1ddle/geometrize) (`geometrizejs`):
  - **● Circles Mode** (`ShapeTypes.CIRCLE`)
  - **▲ Triangles Mode** (`ShapeTypes.TRIANGLE`)
  - **╱ Lines Mode** (`ShapeTypes.LINE`)
- **Progressive Shape Resolution (`15 → 105 Shapes`)**:
  - Starts with **15 shapes**.
  - Every wrong guess adds **+10 shapes** (`15, 25, 35, 45, 55, 65, 75, 85, 95, 105`) for up to **10 guesses**.
  - Interactive **Shape Tier Scrubber** to inspect unlocked shape tiers and post-game **Official Artwork vs. Geometrized** blend slider.
- **Deterministic Daily Puzzle Engine**:
  - Synchronized to local midnight (`00:00:00`) with a live countdown timer and automatic midnight rollover detection.
  - Uses a seeded `Mulberry32` PRNG + non-repeating **Fisher-Yates 1,025-Pokémon cycle deck** with a cross-mode collision guard so all 3 daily modes always pick 3 different Pokémon.
  - Seeds the Web Worker hill-climbing algorithm so every player gets the exact same 105 shapes on any given day.
- **PokéAPI v2 Integration**:
  - Consumes [PokéAPI v2](https://pokeapi.co/docs/v2) (`sprites.other['official-artwork'].front_default`) across all 1,025 mainline Pokémon.
- **Settings & Accessibility**:
  - **Light / Dark Mode** (Cyber-Pokédex Dark UI & Silph Co. Light UI).
  - **Color Blind Mode** (**Standard**, **Deuteranopia/Protanopia Safe**, and **Tritanopia Safe** palettes paired with explicit directional/symbolic icons).
  - **High-Contrast Scanner Backdrop**, **Pokédex Attribute Clues Toggle**, **Shape Animation Toggle**, and **Web Audio Pokédex Chimes**.
- **Trainer Statistics & Streaks**:
  - Tracks **Played**, **Win %**, **Current Streak 🔥**, **Max Streak 🏆**, **Triple Crown Days 👑**, and **1–10 Guess Distribution** across Overall and individual Shape Modes, plus one-click **Wordle-style Emoji Result Sharing**.

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
