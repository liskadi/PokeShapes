# PokéShapes — Ad Placement & Monetization Strategy

This guide outlines the most effective, player-friendly way to place advertisements in **PokéShapes** to generate sustainable ad revenue while keeping the UI clean, fast, and non-intrusive.

---

## 1. Executive Summary: How Many Ads Should PokéShapes Have?

For daily web games (*PokéDoku, Pokedle, Wordle-style games*), **less is more**. Overloading a page with 4–6 ad banners tanks advertiser bid rates (due to low viewability and accidental-click penalties) and drives players to install ad blockers or abandon their daily streak.

### Recommended Maximum Ad Count:
| Device / Viewport | Max Simultaneous Ads | Ad Unit Sizes (IAB Standard) | Placement Location |
| :--- | :--- | :--- | :--- |
| **Wide Desktop (`≥ 1440px`)** | **2 Ads Total** | `160×600` (Wide Skyscraper) or `300×600` (Half-Page) | **Left Sticky Side Rail** + **Right Sticky Side Rail** (outside the central `max-w-5xl` game container) |
| **Standard Laptop (`1280px – 1439px`)** | **2 Ads Total** | `160×600` (Wide Skyscraper) | **Left Sticky Side Rail** + **Right Sticky Side Rail** |
| **Tablet (`768px – 1279px`)** | **1 Ad Total** | `728×90` (Leaderboard) | **Single Bottom Banner** placed above the footer (below the main game grid) |
| **Mobile (`< 768px`)** | **1 Ad Total** | `320×50` (Mobile Leaderboard) | **Single Bottom Banner** above the footer (never between the Scanner and Search Bar) |

> **Golden Rule**: Never show more than **2 ads on Desktop** or **1 ad on Mobile/Tablet** at any given time, and **never place an ad inside the central gameplay container** (`<main className="max-w-5xl">`).

---

## 2. Why Side-Rail Ads Are Ideal for PokéShapes

PokéShapes uses a centered `max-w-5xl` (`1024px`) gameplay arena:
- On a standard **`1920×1080` desktop monitor**, `1920px - 1024px = 896px` of empty horizontal margin (`448px` on the left and `448px` on the right).
- On a **`1440×900` laptop screen**, `1440px - 1024px = 416px` of empty horizontal margin (`208px` on the left and `208px` on the right).

This makes **Left and Right Sticky Side-Rail Ads** the highest-performing, least-annoying placement possible:
1. **Zero Gameplay Interference**: The player's eyes and mouse stay inside the central `1024px` arena (switching between Circles/Triangles/Lines, scrubbing shape tiers, typing in the Pokémon search bar, and viewing Scanner Clues). The autocomplete dropdown is never covered or pushed down by an ad.
2. **85%+ Viewability Score**: Because the side rails sit `sticky top-20` in the left and right margins while the player spends 3–8 minutes solving all 3 daily modes, advertisers measure very high "in-view time," which commands **2× to 3× higher CPMs** than bottom-of-page banners.
3. **Zero Cumulative Layout Shift (CLS)**: Because side rails live in fixed-width outer columns (`w-[160px]` or `w-[300px]`), loading or refreshing an ad never shifts the game board by even a single pixel.

---

## 3. Recommended Layout Wireframe & CSS Structure

### 3.1 Desktop Side-Rail Wireframe (`≥ 1280px`)

```text
+-----------------------------------------------------------------------------------+
|                                  TOP HEADER BAR                                   |
+---------------+---------------------------------------------------+---------------+
|               |  [ ● Circles ]   [ ▲ Triangles ]   [ ╱ Lines ]    |               |
|  LEFT SIDE AD |                                                   | RIGHT SIDE AD |
|   (Sticky)    |  +---------------------+  +--------------------+  |   (Sticky)    |
|               |  |                     |  |  Scanner Clues     |  |               |
|   160 x 600   |  |  Geometrize Canvas  |  |--------------------+  |   160 x 600   |
|      or       |  |    (380 x 380)      |  |  Pokemon Search    |  |      or       |
|   300 x 600   |  |                     |  |--------------------+  |   300 x 600   |
|               |  |  Shape Scrubber     |  |  Guess History     |  |               |
|  [Ad Label]   |  +---------------------+  +--------------------+  |  [Ad Label]   |
+---------------+---------------------------------------------------+---------------+
|                                      FOOTER                                       |
+-----------------------------------------------------------------------------------+
```

### 3.2 How to Implement the Outer Shell in `App.tsx` (When Ready)

Wrap the existing `<main>` inside a 3-column flex/grid wrapper so the central `max-w-5xl` arena stays untouched while the left and right rails only appear on `xl` (`≥ 1280px`) screens:

```tsx
<div className="flex-1 w-full max-w-[1720px] mx-auto px-2 sm:px-4 py-5 sm:py-7 flex items-start justify-center gap-4 2xl:gap-6">
  {/* Left Side-Rail Ad (Desktop Only: >= 1280px) */}
  <aside
    aria-label="Advertisement"
    className="hidden xl:flex flex-col items-center sticky top-20 shrink-0 w-[160px] 2xl:w-[300px] min-h-[600px] rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/30 dark:bg-slate-900/30 p-2"
  >
    <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-1">
      Advertisement
    </span>
    <div id="ad-rail-left" className="w-[160px] 2xl:w-[300px] h-[600px]" />
  </aside>

  {/* Existing Central Game Arena (Untouched max-w-5xl) */}
  <main className="flex-1 max-w-5xl w-full space-y-5">
    {/* ModeSelector, GeometrizeCanvas, ScannerClues, PokemonSearch, GuessList */}
  </main>

  {/* Right Side-Rail Ad (Desktop Only: >= 1280px) */}
  <aside
    aria-label="Advertisement"
    className="hidden xl:flex flex-col items-center sticky top-20 shrink-0 w-[160px] 2xl:w-[300px] min-h-[600px] rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/30 dark:bg-slate-900/30 p-2"
  >
    <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-1">
      Advertisement
    </span>
    <div id="ad-rail-right" className="w-[160px] 2xl:w-[300px] h-[600px]" />
  </aside>
</div>
```

### 3.3 Mobile & Tablet Fallback (`< 1280px`)
On screens narrower than `1280px`, side rails are hidden (`hidden xl:flex`). Instead, place **one single horizontal ad slot** right below `<main>` (above `<footer>`):
- **Tablet (`768px – 1279px`)**: `728×90` Leaderboard container (`min-h-[90px]`).
- **Mobile (`< 768px`)**: `320×50` Mobile Banner container (`min-h-[50px]`).

---

## 4. How to Maximize Revenue Without Adding More Ads

Because PokéShapes is a **Single-Page Application (SPA)** where players stay on the same URL for **3 to 8 minutes** (playing *Circles*, *Triangles*, and *Lines* back-to-back, plus checking their *PolyDex* or *Archive*), a static ad that only loads once per pageview leaves 70% of your revenue on the table.

Instead of adding more ad slots, use **Smart Viewable Refresh**:

1. **Mode-Switch Ad Refresh (Event-Driven)**:
   - Trigger an ad refresh on the 2 side-rail slots when the player switches between **● Circles**, **▲ Triangles**, and **╱ Lines** (throttled to at least `30 seconds` between refreshes).
   - Because each mode is a full game round, refreshing the side rails between modes triples your impressions per daily visitor with zero extra clutter.
2. **Active-Tab Viewable Timer Refresh (`45–60s`)**:
   - Gaming ad networks (NitroPay, Playwire, Venatus) automatically refresh sticky `160×600` / `300×600` side-rail units every **45 to 60 seconds**, **only** when:
     - The browser tab is focused (`document.visibilityState === 'visible'`),
     - The user has interacted with the page recently, and
     - At least 50% of the ad unit is in the viewport (IAB Viewability Standard).

---

## 5. Ad Network Progression Roadmap

Different ad networks have different traffic thresholds and features for web games:

| Stage | Monthly Pageviews / Sessions | Recommended Network | Why It Fits PokéShapes |
| :--- | :--- | :--- | :--- |
| **Stage 1: Launch** | `0 – 15,000 / mo` | **Google AdSense** + **Ko-Fi** | No minimum traffic requirement. Use manual `160×600` / `300×600` display units in the left/right rails and disable AdSense "Auto Ads" (especially Vignette/Interstitial popups). |
| **Stage 2: Growth** | `15,000 – 100,000 / mo` | **NitroPay (Nitro)** or **Monumetric** | **NitroPay** is the industry standard for daily Pokémon & Wordle games (*PokéDoku*, *Pokedle*, community wikis). Built-in SPA viewability refresh brings **3×–4× higher RPM** than raw AdSense. |
| **Stage 3: Scale** | `100,000+ / mo` | **Playwire**, **Venatus**, or **Mediavine** | Direct gaming brand sponsorships, custom skin takeovers in the side gutters, and highest header-bidding CPMs. |

---

## 6. Strict UX Guardrails (What to Avoid)

To ensure players never feel annoyed or driven away:
1. **Never Enable Full-Screen Interstitial / Vignette Ads**: Pop-up ads when clicking `"Try Next Shape Mode →"` or opening the `"PolyDex"` break player flow and hurt daily retention.
2. **Block Auto-Playing Audio Ads**: PokéShapes plays Web Audio feedback and official Pokémon cries on win—any ad with unmuted audio will clash with the game and frustrate players.
3. **Never Place Ads Near the Search Input or Guess Button**: Avoid placing any banner between the Geometrize Canvas, Scanner Clues, and Pokémon Search combobox; accidental clicks get penalized by ad networks ("invalid traffic") and annoy players on mobile.
4. **Always Reserve Fixed `min-width` / `min-height` Containers**: Give every ad slot a subtle `"Advertisement"` label and fixed dimensions so the layout never jumps when an ad finishes loading.
