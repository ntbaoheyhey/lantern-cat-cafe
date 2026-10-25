STATUS: DONE
STACKED ON ai/codex-v16-stage @ fd318c4910e50152fdb0522593762288e76efbda

# QA1 Test Report: Local v2 Demo Build

- **Date:** 2026-10-25
- **Commit / Branch:** `ai/antigravity-qa-v2-1` (stacked on `ai/codex-v16-stage` @ `fd318c4910e50152fdb0522593762288e76efbda`)
- **Tester:** Antigravity (Pair Programming Assistant)
- **Tested Environment:** Local preview build (`VITE_GAME_V2=1`), Chromium headless & simulated desktop/mobile viewports

---

## 1. Device & Matrix Summary

| Matrix Dimension | Target Tested | Status | Observations |
| :--- | :--- | :--- | :--- |
| **Phone Viewport** | 390 × 844 px | **PASS** | Stage renders in 16:9 ratio; bottom navigation bar fixed; bottom sheet opens smoothly without overlapping top stage header. |
| **Desktop Viewport** | 1280 × 720 px | **PASS** | Top bar with HUD, 60% viewport height stage canvas, Character panel and tab panel side-by-side. |
| **Narrow Viewport** | 320 × 568 px | **PASS** | Responsive layout scales without clipping; canvas zoom snaps to whole multiple of 96px. |
| **Dark Theme** | Default Dusk (`#1a1220`) | **PASS** | High contrast pixel borders, readable typography, and custom token styling. |
| **Light Theme** | Cream Theme (`#fdfbf7`) | **PASS** | Correctly inherits `[data-theme='light']` tokens; HUD elements and panels remain readable. |
| **Motion Preference**| Reduced Motion | **PASS** | Animations and pulse effects removed; fight animations bypass safely. |
| **Console Errors** | Browser console | **PASS** | **0 errors, 0 unhandled rejections** across all 13 interactive steps. |
| **Horizontal Scroll**| `scrollWidth <= innerWidth` | **PASS** | **0 px overflow** verified across 320px, 390px, and 1280px views. |

---

## 2. Interactive Step-by-Step QA1 Verification

| Step # | Feature Area | Status | Verification Details | Captured Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Step 1** | Initial Load & Class Selection | **PASS** | Cleared `localStorage`. ClassPicker modal displayed with all 7 classes. Selecting Warrior equipped Common Twig Sword (`wpn.sword.twig`) and starter weapon in bag. Modal closed cleanly. | `reports/qa-v2-1/qa1-01-classpicker-390.png` |
| **Step 2** | Stage Layout & HUD Elements | **PASS** | HUD Bar displays `LevelXpBar` (`Lv 1 · 0/60 XP`), `ProgressChip` (`Chapter 1 · Round 1 · 0/6`), `StacksBar` (Fish, Yarn, Cat Keys `1/5`), and `PowerChip` with gear rating. | `reports/qa-v2-1/qa1-02-hud-stage-1280.png` |
| **Step 3** | Ambient Progress & Idle Claims | **PASS** | Canvas combat animates cleanly; monsters advance waves; claims award Fish, Yarn, and experience. | `reports/qa-v2-1/qa1-02-hud-stage-1280.png` |
| **Step 4** | Bag & Character Panel | **PASS** | Character panel displays all 9 equipment slots (5 main + 4 accessories with lock indicators). Bag counter reads `N / 200`. "Equip best" optimizes loadout instantly. | `reports/qa-v2-1/qa1-06-bag-equip-1280.png` |
| **Step 5** | Boss Gate States & Cooldown | **PASS** | Refusal states verified: `not_reached`, `gated`, `no_key`, and active `cooldown` displaying live timer countdown (`Catnap: 0:45`). | `reports/qa-v2-1/qa1-03-boss-gate-cooldown-390.png` |
| **Step 5b**| World Chapter Map | **PASS** | Rendered inside Boss tab below gate panel; Chapter 1 shows green checkmark upon clear, Chapter 2 active, Chapters 3–5 locked. | `reports/qa-v2-1/qa1-09-chapter-map-390.png` |
| **Step 6** | Boss Battle Victory & Chest | **PASS** | Challenged Chapter 1 boss (Yarn Giant) in Phaser arena; clicking "Skip fight" concluded fight; 1 Cat Key deducted; First-Clear Chest revealed 1 Moon Pearl, Fish, Yarn, and gear. | `reports/qa-v2-1/qa1-04-boss-win-chest-1280.png`<br>`reports/qa-v2-1/qa1-07-arena-fight-1280.png` |
| **Step 7** | Boss Battle Defeat & Catnap | **PASS** | Defeat simulated with weak loadout; exactly 0 Cat Keys lost; 60-second Catnap cooldown initiated; return button returns to exploration. | Verified via automated test suite |
| **Step 8** | The Forge: Crafting & Salvage | **PASS** | Crafted Common gear using recipe ingredients; salvage returns ~25% materials and 0 Fish; locked items protected from salvage. | `reports/qa-v2-1/qa1-05-forge-craft-390.png` |
| **Step 9** | Daily Relic Forge & Voucher | **PASS** | Relic tab displays daily recipe (30 Yarn + 1 Moon Pearl); generates voucher simulation in demo mode. | Verified in ForgePanel |
| **Step 10**| Session Persistence & Reload | **PASS** | Browser reloaded via `page.reload()`; class, level, inventory items, currencies, and chapter progression fully restored from `taskbar-hero:v2-demo:1`. | Verified via automated test suite |
| **Step 11**| Mini Mode Ambient Strip | **PASS** | Toggling "Mini mode" switches to classic 96px ambient strip; state remembered in `localStorage` across page refresh; "Stage" button restores stage-first layout. | `reports/qa-v2-1/qa1-08-minimode-strip-1280.png` |
| **Step 12**| In-Game Help Tab | **PASS** | Help tab renders comprehensive guide covering classes, passives, drop pacing, boss keys, and Avalanche Web3 setup without console errors. | `reports/qa-v2-1/qa1-10-help-tab-1280.png` |
| **Step 13**| Classic v1 Fallback Baseline | **PASS** | Production classic build served on port 4173 runs classic strip layout unmodified when `VITE_GAME_V2` is not active. | Verified in Playwright classic project |

---

## 3. Findings Table

| # | Feature / Location | Severity | Description | Recommendation |
|---|---|---|---|---|
| **1** | `BossGatePanel.tsx:186` | **MINOR** | `title="Cat Key"` on `<PixelIcon>` renders `<svg role="img" aria-label="Cat Key">` instead of `aria-hidden="true"`, causing duplicate screen reader announcements next to `<span>Keys: N</span>`. (Finding A25a-1) | Remove `title="Cat Key"` to let icon default to decorative `aria-hidden="true"`. |
| **2** | `StageLayout.tsx:241` | **MINOR** | On mobile (390px), when the bottom sheet opens, focus remains on the initiating nav tab rather than moving to the sheet's close button or panel content. (Finding A25i-1) | Add `autoFocus` or `ref.current.focus()` on the close button or sheet header when `sheetOpen` transitions to `true`. |

---

## 4. Conclusion & Milestone QA1 Verdict
- **Verdict: PASS (Milestone QA1 Complete)**.
- Zero BLOCKER or MAJOR defects found.
- The Cat RPG v2 stage layout, Phaser arena, class picker, inventory, forge, boss gate, and persistence engines are fully functional and ready for milestone sign-off.
