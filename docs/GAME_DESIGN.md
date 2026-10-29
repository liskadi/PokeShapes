# PokéShapes — Game Design & UI/UX Specification

## 1. Core Rules
- **Daily Refresh**: Every day at `00:00:00` local time, three new daily Pokémon puzzles unlock—one for each geometric primitive mode:
  1. **Circles Mode** (`●`): Constructed purely from translucent circles.
  2. **Triangles Mode** (`▲`): Constructed purely from triangles (low-poly shard style).
  3. **Lines Mode** (`╱`): Constructed purely from geometric line strokes with graduated stroke widths.
- **Starting State & Per-Mode Shape Progression**:
  - Players have up to **10 guesses** per game.
  - Each geometric mode has its own tailored starting shape count and wrong-guess increment:
    - **Circles Mode (`●`)**: Starts at **40 shapes**, adds **+20 shapes** per wrong guess (`40 → 60 → 80 → 100 → 120 → 140 → 160 → 180 → 200 → 220 shapes`).
    - **Triangles Mode (`▲`)**: Starts at **20 shapes**, adds **+10 shapes** per wrong guess (`20 → 30 → 40 → 50 → 60 → 70 → 80 → 90 → 100 → 110 shapes`).
    - **Lines Mode (`╱`)**: Starts at **50 shapes**, adds **+25 shapes** per wrong guess (`50 → 75 → 100 → 125 → 150 → 175 → 200 → 225 → 250 → 275 shapes`).
- **Win / Loss / Give Up Conditions**:
  - **Win**: Guessing the target Pokémon on Guess $k \in \{1 \dots 10\}$ locks in the win, registers the Pokémon in the player's **PolyDex** (on Today's live puzzle), awards streak/distribution stats, and unlocks the post-game **Original Artwork vs. Geometrized** blend slider, **Timelapse Replay**, **SVG / PNG Download**, and **Volume-Normalized Official Cry**.
  - **Loss / Give Up**: Using all 10 guesses or clicking **Give Up / Reveal Pokémon** (with 2-step confirmation) ends the round, reveals all shapes and the Pokémon's identity, and resets the current streak for that mode (on Today's live puzzle).
  - **Past Archive Isolation**: Playing past daily puzzles from the Archive is purely for fun/practice and **never affects** PolyDex, Trainer Rank, Trainer Statistics, or Streaks.

---

## 2. Progressive "Scanner Clues"
In addition to the visual shape progression, the **Pokédex Scanner Clues Bar** (`src/components/ScannerClues.tsx`) progressively unlocks optional hints as wrong guesses accumulate:
1. **3 Wrong Guesses**: Unlocks **Generation Hint** (e.g., `Gen I (Kanto)`).
2. **5 Wrong Guesses**: Unlocks **Primary Type Hint** (e.g., `Fire Type`).
3. **7 Wrong Guesses**: Unlocks **Habitat Hint** (e.g., `Mountain`, `Forest`, `Waters-Edge`).

---

## 3. Guess History Log
Each guess adds a row to the **Guess History**:
- Displays the guess number (`#1..#10`), guessed Pokémon's official artwork thumbnail, National Dex `#ID`, and Name.
- Shows a badge indicating `+20 / +10 / +25 Shapes → X Shapes Active` on wrong guesses, or `Target Pokémon Identified!` on a winning guess.

---

## 4. Post-Game Art Tools: Timelapse Replay & SVG / PNG Export
Once a game concludes (won, lost, or given up):
- **Blend Slider**: Smoothly cross-fade (`0%–100%`) between the 105-shape geometric reconstruction and the auto-cropped official Pokémon artwork.
- **Replay `1 → 105` Timelapse**: Animates the artwork being constructed shape-by-shape from `1` to `105` primitives.
- **Download SVG / PNG**: Exports the geometric Pokémon portrait as either a scalable vector `.svg` file or a crisp `1024×1024` `.png` image.
- **Official Cry Button**: Plays the Pokémon's official cry audio (`cries.latest`).

---

## 5. Retention & Collection Features
- **Yesterday's Champions & Past Daily Archive (`ArchiveModal.tsx`)**:
  - View yesterday's 3 daily Pokémon answers behind a spoiler-safe reveal toggle.
  - Browse and play any historical daily puzzle (`Daily #1`, `Daily #2`, …) in Archive Mode without risking your live Daily Streak.
- **Personal "PolyDex" & Trainer Ranks (`PolyDexModal.tsx`)**:
  - Collect every Pokémon you solve across Circles (`●`), Triangles (`▲`), and Lines (`╱`) modes (with Generation I–IX filtering inside the PolyDex).
  - Rank up through 7 Trainer Ranks based on unique species caught: *Rookie Scanner* (`0+`) → *Bug Catcher* (`3+`) → *Poké Maniac* (`10+`) → *Ace Trainer* (`25+`) → *Gym Leader* (`50+`) → *Elite Four* (`100+`) → *Grand Master* (`250+`).
- **Richer Emoji Grid Sharing (`StatsModal.tsx`)**:
  - Share spoiler-free daily results featuring per-mode summaries and a 4-column attribute emoji matrix (`[Gen, Types, Height, Weight]`) using `🟩🟨🔼🔽⬛` alongside shape counts (`15s`, `25s`, …).

---

## 6. Accessibility & Settings
- **Light / Dark Theme**:
  - **Dark Mode**: Cyber-Pokédex Obsidian (`#0B0F19`) with electric cyan, crimson, and amber accents.
  - **Light Mode**: Silph Co. Pearl (`#F8FAFC`) with crisp slate cards and Pokéball crimson accents.
- **Color Blind Palettes**:
  - **Standard**: Emerald (Match) / Amber (Partial) / Rose (Miss).
  - **Deuteranopia / Protanopia Safe**: Royal Blue (Match) / Gold-Orange (Partial) / Charcoal-Slate (Miss).
  - **Tritanopia Safe**: Teal-Cyan (Match) / Magenta-Pink (Partial) / Slate (Miss).
  - All status chips pair color with distinct geometric icons (`✓`, `≈`, `↑`, `↓`, `✕`) so color is never the sole indicator of meaning.
