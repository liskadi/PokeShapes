# PolyMon — Game Design & UI/UX Specification

## 1. Core Rules
- **Daily Refresh**: Every day at `00:00:00` local time, three new daily Pokémon puzzles unlock—one for each geometric primitive mode:
  1. **Circles Mode** (`●`): Constructed purely from translucent circles.
  2. **Triangles Mode** (`▲`): Constructed purely from triangles (low-poly shard style).
  3. **Lines Mode** (`╱`): Constructed purely from geometric line strokes.
- **Starting State**: Every puzzle starts with **15 shapes** rendered on the scanner viewport.
- **Wrong Guesses & Shape Progression**:
  - Players have up to **10 guesses** per game.
  - Each wrong guess reveals **+10 additional shapes**, progressing through:
    `15 → 25 → 35 → 45 → 55 → 65 → 75 → 85 → 95 → 105 shapes`.
- **Win / Loss Conditions**:
  - **Win**: Guessing the target Pokémon on Guess $k \in \{1 \dots 10\}$ locks in the win, awards streak/distribution stats, and unlocks the full **Original Artwork vs. Geometrized** comparison slider.
  - **Loss**: Using all 10 guesses without finding the target Pokémon ends the round, reveals the Pokémon's identity and full artwork comparison, and resets the current streak for that mode.

---

## 2. Guess Feedback & Optional Pokédex Hints
Each guess adds a row to the **Guess Log**:
- Displays the guessed Pokémon's official artwork thumbnail, National Dex `#ID`, and Name.
- Shows a badge indicating `+10 Shapes Added (Now X Shapes)` on wrong guesses.
- When **Pokédex Attribute Hints** are enabled in Settings (default: On; can be disabled for Pure Shape Hard Mode), each guess also compares:
  - **Generation** (`Gen I` – `Gen IX`): Match (`✓`), Higher (`↑`), or Lower (`↓`).
  - **Types** (`Type 1 / Type 2`): Exact match (`✓`), Partial match (`≈`), or No match (`✕`).
  - **Height & Weight**: Match (`✓`), Target is Taller/Heavier (`↑`), or Target is Shorter/Lighter (`↓`).

---

## 3. Accessibility & Settings
- **Light / Dark Theme**:
  - **Dark Mode**: Cyber-Pokédex Obsidian (`#0B0F19`) with electric cyan, crimson, and amber accents.
  - **Light Mode**: Silph Co. Pearl (`#F8FAFC`) with crisp slate cards and Pokéball crimson accents.
- **Color Blind Palettes**:
  - **Standard**: Emerald (Match) / Amber (Partial) / Rose (Miss).
  - **Deuteranopia / Protanopia Safe**: Royal Blue (Match) / Gold-Orange (Partial) / Charcoal-Slate (Miss).
  - **Tritanopia Safe**: Teal-Cyan (Match) / Magenta-Pink (Partial) / Slate (Miss).
  - All status chips pair color with distinct geometric icons (`✓`, `≈`, `↑`, `↓`, `✕`) so color is never the sole indicator of meaning.
- **Bonus Unlimited / Practice Mode Toggle**:
  - In addition to the 3 official Daily Puzzles, players can toggle a **Practice / Unlimited Mode** in the header to generate endless random puzzles with any shape mode without affecting their Daily Streaks.
