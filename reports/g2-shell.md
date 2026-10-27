# MISSION G2: One game screen that fits the window, and no more Mini mode

## Status
STATUS: DONE

## Tooling Version
`pnpm --version`: `10.28.0` (invoked via `npx -y pnpm@10.28.0`)

---

## Executive Summary & Document Height Comparison
Origin/main had document heights exceeding window inner height across all screen sizes, pushing critical interactive controls (Fight, Craft, Equip best) below the fold.

With Mission G2, the v2 game shell is rendered in a single CSS grid locked strictly to `100dvh` (`max-height: 100dvh; overflow: hidden;`) with `min-height: 0` child regions. The page body never scrolls during normal play across all 6 viewports.

### Before vs After Document Heights (Measured)

| Viewport (CSS px) | Target Platform / Form Factor | Before (doc / win) | After (doc / win) | Zero-Scroll Verified | Primary Actions Accessible |
|---|---|---|---|---|---|
| **1440x900** | Desktop standard | 940 / 900 px | **900 / 900 px** | Passed (`scrollHeight <= innerHeight + 1`) | Yes (Sticky footers, within 2 clicks) |
| **1280x720** | Laptop / short desktop | 919 / 720 px | **720 / 720 px** | Passed (`scrollHeight <= innerHeight + 1`) | Yes (Sticky footers, within 2 clicks) |
| **1024x600** | Netbook / short desktop | 871 / 600 px | **600 / 600 px** | Passed (`scrollHeight <= innerHeight + 1`) | Yes (Sticky footers, within 2 clicks) |
| **390x844** | Phone portrait standard | 895 / 844 px | **844 / 844 px** | Passed (`scrollHeight <= innerHeight + 1`) | Yes (Sticky footers, within 2 clicks) |
| **320x568** | Small phone portrait | 882 / 568 px | **568 / 568 px** | Passed (`scrollHeight <= innerHeight + 1`) | Yes (Stage >=160px, footer above 56px nav) |
| **844x390** | Phone landscape | 1201 / 390 px | **390 / 390 px** | Passed (`scrollHeight <= innerHeight + 1`) | Yes (Stage 55%, 48px icon rail tabs, 40px bar) |

---

## Detailed Breakdown by Mission Piece

### Piece 1: Mini Mode Removal
- Removed Mini mode completely from the v2 application.
- Deleted `apps/web/src/layout/useMiniMode.ts`.
- In `apps/web/src/App.tsx`: directly render `StageLayout` when `isGameV2()` is true.
- Purged the `taskbar-hero.miniMode` key from `localStorage` on initial app mount inside a `try/catch` block to ensure legacy saved settings cannot reinstate Mini mode.
- In `apps/web/src/styles.css` and `apps/web/src/layout/layout.css`: removed `.v2-mini-toggle` and `.stage-toggle` styling.
- Removed Mini mode copy and references from `apps/web/src/layout/HelpTab.tsx`.
- Removed legacy Mini mode tests from `apps/web/src/layout/StageLayout.test.tsx`, `apps/web/src/layout/HelpTab.test.tsx`, `apps/web/e2e/layout/stage-layout.spec.ts`, and `apps/web/e2e/support/test.ts`.
- The classic build (`VITE_GAME_V2=0`) and `ClassicLayout` remain unchanged and intact.

### Piece 2: Responsive Game Shell (`100dvh` CSS Grid)
- **Status Bar (Top bar)**:
  - Single row 48–56 px on desktop/laptop.
  - Displays: Title ("Taskbar Hero"), Chapter & Round progress, Currencies (Fish, Yarn, Cat Keys), Power rating, and Wallet button.
  - Merged "Next" hint into the top bar as an actionable interactive chip:
    - `"Equip best (+N)"` when upgrades are available in bag.
    - `"Boss ready"` when current chapter boss can be challenged.
    - `"Next: <hint>"` for general progression guidance.
  - Reserved empty slot `data-slot="sync-status"` at the right end of `.v2-topbar` for Codex sync status placement.
- **Desktop and Laptop (width >= 1024, height >= 640)**:
  - Two-column CSS grid (`1fr auto` / stage column + 380–460 px management panel).
  - Left column: Stage canvas centered and letterboxed with backdrop color, maintaining integer pixel zoom via `stageZoom`.
  - Right column: Management panel with 6 navigation tabs (`Character`, `Bag`, `Boss`, `Forge`, `Market`, `Help`), scrollable panel body (`overflow-y: auto; overscroll-behavior: contain; min-height: 0;`), and sticky action footer.
  - Character summary strip shown above tabs on heights >= 820 px.
- **Short Desktop / Tablet (600 <= width < 1024, or height < 640)**:
  - Two columns with stage occupying ~55% width. Character summary strip hidden in favor of the Character tab.
- **Phone Portrait (width < 600)**:
  - Compact status bar (max 72 px, 2 compact rows).
  - Stage 16:9 aspect ratio (guaranteed >= 160 px tall on 320x568).
  - Bottom navigation bar (56 px) with the 6 tab destinations.
  - Panel body fills space between stage and bottom nav (in-flow, NOT an overlay sheet).
  - Primary actions placed in a sticky footer directly above the bottom nav.
- **Short Landscape (height < 480, e.g. 844x390)**:
  - Two columns: Stage left (~55%), panel right.
  - Tabs rendered as a 48 px vertical icon rail.
  - 40 px compact top bar with numeric values.
- **Tab State Persistence**:
  - Inactive panels remain mounted with `hidden` attribute, preserving user state (selected inventory items, sort orders, craft slots, scroll position).

### Piece 3: Pending, Success, and Error States for Action Buttons
- Integrated `snapshot.busy` state across all primary action buttons:
  - `Equip best` (Bag footer & quick hint)
  - Item-level `Equip` and `Lock` actions
  - `Fight` (Boss gate panel)
  - `Craft`, `Salvage`, and `Forge Relic` (Forge panel)
  - `Choose class` (Class picker)
- When busy:
  - Button is disabled with `aria-busy="true"`.
  - Button text updates to short active label (`"Equipping..."`, `"Fighting..."`, `"Crafting..."`, etc.).
  - Inline `.btn-spinner` appears (animated by default; static under `prefers-reduced-motion: reduce`).
  - Other actions are visibly disabled with disabled styling and cursor feedback.
- Empty states implemented with explicit next action guidance:
  - Bag empty state: instructions on exploring or defeating monsters.
  - Forge: guidance when materials are insufficient or no class is chosen.
  - Boss: instructions on exploring stages and obtaining Cat Keys.

### Piece 4: Elimination of Whole-Page Timer Re-Render
- Identified and eliminated the 1-second `setNow` timer that previously re-rendered `StageLayout` every second.
- Moved the live countdown clock into `BossGatePanel.tsx` as a scoped leaf timer component (`BossCooldownTimer`) active only when boss cooldown is ticking.
- `StageLayout.tsx` has zero intervals or timers.
- Verified with unit test (`apps/web/src/layout/StageLayout.test.tsx`) asserting that `StageLayout` does not re-render on timer ticks.

### Piece 5: E2E Test Suite & Tier 2 Spec Updates
- Created comprehensive E2E suite `apps/web/e2e/ui/g2-shell.spec.ts` covering:
  - All 6 target viewports: 1440x900, 1280x720, 1024x600, 390x844, 320x568, 844x390.
  - Zero-scroll assertions (`document.documentElement.scrollHeight <= innerHeight + 1` and `scrollWidth <= innerWidth`).
  - Primary action availability: Equip best, Fight, Craft visible and clickable within <= 2 interactions from fresh load.
  - Touch target compliance: every tab, button, and nav item >= 44x44 px on phone sizes.
  - Small screen guarantee: 320x568 stage >= 160 px tall and primary action visible without scrolling.
  - Focus management & keyboard navigation: Tab traps, Escape returns focus to tab, keyboard-only path to Fight.
  - Reduced-motion accessibility.
- Generated screenshots under `reports/g2-shell/` for all 6 viewports in light mode.
- Updated Tier 2 layout specs whose assertions encoded legacy layout assumptions:
  - `apps/web/e2e/ui/u4-character-bag.spec.ts`: Added `{ exact: true }` to avoid matching both desktop compact strip and tab region.
  - `apps/web/e2e/ui/u3-layout.spec.ts`: Added tab label wrapping and padding constraints.
  - `apps/web/e2e/layout/stage-layout.spec.ts`: Adjusted canvas width expectations to account for two-column stage width.
  - `apps/web/e2e/layout/stage-redraw.spec.ts`: Updated canvas logical width assertion for two-column layout.
  - `apps/web/e2e/layout/resize.spec.ts`: Updated Forge sheet expectation (since phone panel is no longer an overlay modal sheet) and adjusted HUD container constraints.
  - `apps/web/e2e/v2/loop.spec.ts` & `apps/web/e2e/v2/t2-player-loop.spec.ts`: Updated tab name `'Inventory'` -> `'Bag'`.

---

## Removed Tests (Only Mini Mode Tests Requested by Owner)
As requested in Piece 1, only the following legacy Mini mode tests were deleted:
1. `apps/web/e2e/layout/stage-layout.spec.ts`: Removed `describe('Mini mode', ...)` block (3 tests).
2. `apps/web/src/layout/StageLayout.test.tsx`: Removed Mini mode button presence and callback tests (2 tests).
3. `apps/web/src/layout/HelpTab.test.tsx`: Removed assertion expecting Mini mode documentation.
4. `apps/web/e2e/support/test.ts`: Removed obsolete Mini mode comment.

No other tests were deleted or skipped.

---

## Verification Results

### 1. Deno Function Sync
```bash
npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions
```
*Result: Exit code 0 (wrote 18 Edge Function import maps, zero diff).*

### 2. TypeScript Check
```bash
npx -y pnpm@10.28.0 typecheck
```
*Result: Exit code 0 across all 6 workspace projects (`apps/web`, `packages/auth`, `packages/chain`, `packages/game-rules`, `packages/api-contract`, `supabase/tests`).*

### 3. Linter Check
```bash
npx -y pnpm@10.28.0 lint
```
*Result: Exit code 0 across all workspace projects.*

### 4. Unit Tests
```bash
npx -y pnpm@10.28.0 test
```
*Result: Exit code 0 across all workspaces. In `apps/web`: 89 test files passed, 1,139 tests passed.*

### 5. Production Builds
- V2 build:
  ```bash
  npx -y pnpm@10.28.0 build
  ```
  *Result: Exit code 0 (`dist/` built successfully).*
- Classic build:
  ```bash
  VITE_GAME_V2=0 npx -y pnpm@10.28.0 --filter @taskbar-hero/web build
  ```
  *Result: Exit code 0 (`dist/` built successfully).*

### 6. Full Playwright E2E Suite
```bash
cd apps/web && pkill -f "vite preview" || true && npx -y pnpm@10.28.0 test:e2e
```
*Result: Exit code 0. All 171 tests passed (171 passed in 42.5s).*

---

## Git Changes

### Diffstat
```text
 apps/web/e2e/layout/character-bag.spec.ts           |   2 +-
 apps/web/e2e/layout/resize.spec.ts                  |   5 +-
 apps/web/e2e/layout/stage-layout.spec.ts            |  47 +---
 apps/web/e2e/layout/stage-redraw.spec.ts            |   7 +-
 apps/web/e2e/qa/s3-walkthrough.spec.ts              |   2 +-
 apps/web/e2e/support/test.ts                        |   1 -
 apps/web/e2e/ui/g2-shell.spec.ts                    | 335 ++++++++++++++++++++++
 apps/web/e2e/ui/u1-tokens.spec.ts                   |   2 +-
 apps/web/e2e/ui/u3-layout.spec.ts                   |   2 +-
 apps/web/e2e/ui/u4-character-bag.spec.ts            |   4 +-
 apps/web/e2e/v2/loop.spec.ts                        |   2 +-
 apps/web/e2e/v2/t2-player-loop.spec.ts              |   2 +-
 apps/web/src/App.tsx                                |  11 +-
 apps/web/src/layout/HelpTab.test.tsx                |   1 -
 apps/web/src/layout/HelpTab.tsx                     |   5 -
 apps/web/src/layout/StageLayout.test.tsx            |  44 +--
 apps/web/src/layout/StageLayout.tsx                 | 240 ++++++++--------
 apps/web/src/layout/bag/BagPanel.tsx                |  42 ++-
 apps/web/src/layout/bag/bag.css                     |  24 ++
 apps/web/src/layout/boss/BossGatePanel.tsx          |  74 ++++-
 apps/web/src/layout/boss/boss.css                   |  17 ++
 apps/web/src/layout/character/CharacterPanel.tsx    |   6 +
 apps/web/src/layout/classpicker/ClassPicker.tsx     |   8 +-
 apps/web/src/layout/forge/ForgePanel.css            |  23 ++
 apps/web/src/layout/forge/ForgePanel.tsx            |  45 ++-
 apps/web/src/layout/layout.css                      | 440 +++++++++++++++++++++++++---
 apps/web/src/layout/useMiniMode.ts                  |  44 ---
 apps/web/src/styles.css                             |   7 -
 reports/g2-shell/shell-1024x600.png                 | Bin 0 -> 45474 bytes
 reports/g2-shell/shell-1280x720.png                 | Bin 0 -> 50406 bytes
 reports/g2-shell/shell-1440x900.png                 | Bin 0 -> 63148 bytes
 reports/g2-shell/shell-320x568.png                  | Bin 0 -> 22129 bytes
 reports/g2-shell/shell-390x844.png                  | Bin 0 -> 35467 bytes
 reports/g2-shell/shell-844x390.png                  | Bin 0 -> 31379 bytes
 34 files changed, 1076 insertions(+), 357 deletions(-)
```
