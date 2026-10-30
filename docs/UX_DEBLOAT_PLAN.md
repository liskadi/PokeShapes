# PokéShapes — UI/UX Debloating & Streamlining Plan

Based on the UI/UX design review, our visual aesthetic (colors, typography, tactile Pokémon feel) is strong, but the **information density, repeated stats, and number of clickable/unclickable buttons** create unnecessary cognitive load for the average player.

This plan systematically removes redundant information, eliminates unclickable "fake buttons," and simplifies every screen and modal to the essentials.

---

## 1. Audit of Current UX Bloat & Redundancies

### 1.1 Redundant Information (Shown 3–4× on the Same Screen)
1. **Shape Counts Repeated 4×**:
   - Shown in the Mode Tabs (`40 → 220 Shapes` + `40 sh`), above the canvas (`40 / 220 Shapes`), below the canvas (`Shape Resolution Tiers (+20 per guess): Viewing 40 shapes` + 10 tier buttons), and in every Guess History row (`+20 Shapes → 60 Shapes Active`).
   - *Reality*: Players don't need to do shape math—they just need to see the image get clearer after each guess.
2. **Guess Counter Repeated 4×**:
   - Shown as 10 mini Pokéballs in the Mode Tabs, `Guess 1 of 10` pill above the canvas, `(10 guesses left)` in the search input, and `Guess History (0 / 10)` below the search input.
3. **Today vs. Archive Switcher Repeated 3×**:
   - Shown as the `DAILY #38` button next to the logo, the `[Today's Daily | Past Archive]` rocker switch in the center of the header, and the mobile switcher bar.

### 1.2 "Button Overload" & Unclickable Buttons
1. **10 Shape Tier Scrubber Buttons (`40, 60, ... 220`)**:
   - Renders 10 `.btn-tactile` buttons right below the image—**9 of which are disabled/unclickable** on Guess #1. Players trying to solve a puzzle never want to view a *worse* (lower-shape) hint.
2. **3 Scanner Clue Buttons (`1. Generation`, `2. Primary Type`, `3. Habitat`)**:
   - Styled as 3 chunky 3D buttons that are **disabled/unclickable** until guesses 3, 5, and 7—and once unlocked, they force the user to click them just to read the hint they already earned.
3. **3 Non-Clickable Status Pills Above the Canvas (`● Circles`, `40 / 220 Shapes`, `Guess 1 of 10`)**:
   - Styled with thick borders like buttons even though none of them are clickable, and all 3 repeat data already on screen.
4. **Post-Game Button & Slider Clutter**:
   - Spawns 7 buttons (`Timelapse`, `SVG`, `PNG`, `Show Sprite`, `Cry`, `Stats & Share`, `Try Next Shape Mode`) plus a range slider and 3 percentage labels all at once.

---

## 2. Concrete Debloating Plan (Component by Component)

### 2.1 Header (`src/components/Header.tsx`) — Clean & Focused
- **Remove** the center `[Today's Daily | Past Archive]` 2-button rocker switch and the mobile duplicate bar.
- **Remove** the date string and live ticking countdown clock from the header subtitle (the countdown already lives in the Stats modal when a round finishes).
- **Consolidate Archive Access**: Keep a single clean **Archive (`<History />`)** button in the header toolbar (and clicking the `Daily #38` badge also opens the Archive).

### 2.2 Mode Selector Tabs (`src/components/ModeSelector.tsx`) — Simple 3-Tab Switcher
- **Remove** the `"40 → 220 Shapes"` subtitle and the `"40 sh"` badge from the tabs.
- **Remove** the 30 mini Pokéball icons (`10` per tab × `3` tabs) from the bottom of the mode tabs.
- **Keep Only**: The **Shape Icon (`●`, `▲`, `╱`)**, the **Mode Name (`Circles`, `Triangles`, `Lines`)**, and a single clean status indicator (e.g., `✓` if won, `✕` if lost, or `2/10` if in progress).

### 2.3 Geometrize Viewport (`src/components/GeometrizeCanvas.tsx`) — Pure Visual Focus
- **Remove the 3 non-clickable top status pills** (`● Circles`, `40 / 220 Shapes`, `Guess 1 of 10`).
- **Remove the 10-button Shape Resolution Tier Scrubber keypad** completely (eliminating 10 buttons, 9 of which start unclickable).
- **Simplify the Bezel**: Keep the clean dark canvas frame without noisy `"OPTICAL SCANNER"` text labels.
- **Simplify Post-Game Controls**:
  - Replace the range slider + `"Show Sprite"` button + `"SVG"` button + `"PNG"` button with a compact, single-line 3-button action bar under the canvas:
    1. **`Show Original` / `Show Shapes`** (simple 1-click toggle between the official sprite and the geometrized art)
    2. **`Replay`** (plays the `1 → max` shape timelapse)
    3. **`Save Image`** (downloads the high-res PNG directly—average users don't need separate SVG vs. PNG buttons)

### 2.4 Pokédex Scanner Clues (`src/components/ScannerClues.tsx`) — Auto-Revealing Read-Only Strip (Zero Buttons!)
- **Stop styling clues as 3D buttons** (`.btn-tactile`) and **remove the manual "Click to Reveal" step**.
- Instead, render a **clean, flat, non-button 3-column Clue Strip**:
  - Before unlocking: Displays a quiet, recessed label (`Gen • 3 guesses`, `Type • 5 guesses`, `Habitat • 7 guesses`) that clearly looks like an info slot, **not** a button.
  - Upon reaching 3, 5, or 7 guesses: **Automatically reveals** the clue (`Gen I (Kanto)`, `Fire`, `Mountain`) in that slot with a subtle color highlight!
  - This eliminates **3 unclickable buttons** and saves the player 3 unnecessary clicks every game.

### 2.5 Guess History (`src/components/GuessList.tsx`) — Ultra-Clean List
- **Remove the big `"Ready to Catch! (40 Shapes Active)..."` empty-state card** when 0 guesses have been made. Before the first guess, the right column simply shows the **Clue Strip** and the **Search Bar**—making the page feel airy, calm, and uncluttered!
- **Remove the `"+20 Shapes → 60 Shapes Active"` math text** from each wrong guess row. Each guess row simply shows `#1`, the Pokémon's sprite, its name (`Pikachu #0025`), and a clean `✕` or `✓` icon.

### 2.6 "How to Play PokéShapes" Modal (`src/components/HowToPlayModal.tsx`) — Short & Straight to the Point
- Cut the text volume by **75%**. Replace the multi-box paragraphs and shape-math bullet lists with **3 concise, 1-sentence steps**:
  1. **Spot the Pokémon**: A mystery Pokémon is hidden behind **Circles**, **Triangles**, or **Lines**.
  2. **10 Guesses**: Every wrong guess adds more shapes to make the picture clearer.
  3. **Auto-Clues**: Hints unlock automatically at **3 guesses** (Generation), **5 guesses** (Type), and **7 guesses** (Habitat).
- Followed immediately by the **"Start Guessing Pokémon!"** button.

### 2.7 PolyDex Modal (`src/components/PolyDexModal.tsx`) — Less Clutter
- Replace the **10 separate Generation filter buttons (`All`, `Gen I`..`Gen IX`)** with a **single compact `<select>` dropdown** (removing 9 buttons).
- Hide the 7-column Trainer Ranks ladder behind a compact **"View Ranks"** toggle so 7 non-clickable boxes don't permanently crowd the top of the modal.
- Render uncaught Pokémon as quiet non-button `<div>` slots so only caught Pokémon look and act like clickable buttons.
