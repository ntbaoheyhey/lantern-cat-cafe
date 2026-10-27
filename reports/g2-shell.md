# MISSION G2: One game screen that fits the window, and no more Mini mode

## Status
STATUS: DONE

## Tooling Version
`pnpm --version`: `10.28.0` (invoked via `npx -y pnpm@10.28.0`)

---

## G2 Fix 1 Addendum (Post-G1 Merge)
Following the merge of origin/main (PR #193, G1 speed/perf improvements) into `ai/antigravity-g2-shell`, the following fixes were applied and verified:
1. **`g1-perf.spec.ts` Navigation Step**:
   - In the responsive shell, `Equip best` resides inside the Bag panel footer.
   - Updated `e2e/ui/g1-perf.spec.ts` line 92 to switch to the Bag tab (`await page.getByRole('tab', { name: 'Bag', exact: true }).click();`) before querying `page.getByRole('button', { name: 'Equip best', exact: true })`, matching how Forge and Boss tabs are opened prior to their actions.
   - All performance thresholds, timing expectations, heap/event listeners leak checks, and plain-claim assertions remain strictly unchanged.
2. **Purge of Leftover Mini Mode Remnants**:
   - Removed obsolete `onMiniMode?: () => void` prop declaration from `apps/web/src/layout/StageLayout.tsx`.
   - Removed `onMiniMode={() => {}}` prop argument from `apps/web/src/game/stage/relicWiring.ui.test.tsx`.
   - Removed legacy `Mini mode` assertion from `apps/web/src/layout/StageLayout.test.tsx`.
   - Removed outdated Mini mode references from `docs/judge-walkthrough.md`, `docs/prompts/antigravity-responsive-retest.md`, and `docs/test-stability.md`.
   - Verification command `grep -rn "onMiniMode\|useMiniMode\|Mini mode" apps docs` returns zero matches outside historical reports.

---

## Acceptance Criteria Checklist
- [x] **PASS**: The six target sizes fit the window without page body scrolling (`scrollHeight <= innerHeight + 1` and `scrollWidth <= innerWidth`).
- [x] **PASS**: Equip best, Fight, and Craft visible and clickable within <= 2 interactions from a fresh load.
- [x] **PASS**: Every tab, button, and nav item >= 44x44 px touch target on phone sizes.
- [x] **PASS**: 320x568 shows stage >= 160 px tall and primary action visible without scrolling.
- [x] **PASS**: Keyboard navigation and focus return on Escape work properly.
- [x] **PASS**: Mini mode completely gone from v2 build and localStorage cleared on boot; `grep -rn "onMiniMode\|useMiniMode\|Mini mode" apps docs` clean.
- [x] **PASS**: Classic build (`VITE_GAME_V2=0`) and classic Playwright suite unchanged and green.
- [x] **PASS**: Whole-page timer re-render eliminated (clock moved to `BossGatePanel.tsx` leaf).
- [x] **PASS**: Full test suite green (typecheck, lint, 1,160 unit tests, 173 E2E tests).

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

## Real Check Verification Outputs

### 1. `pnpm install --frozen-lockfile`
```bash
CI=true npx -y pnpm@10.28.0 install --frozen-lockfile
```
```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 304ms using pnpm v10.28.0
```

### 2. Deno Function Sync Check
```bash
npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions
```
```text
wrote 18 Edge Function import maps
(exit code: 0)
```

### 3. TypeScript Typecheck
```bash
npx -y pnpm@10.28.0 typecheck
```
```text
Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/api-contract typecheck$ tsc --noEmit
apps/web typecheck$ tsc --noEmit
Done in 4s (exit code: 0)
```

### 4. Linter Check
```bash
npx -y pnpm@10.28.0 lint
```
```text
Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
packages/api-contract lint$ tsc --noEmit
apps/web lint$ tsc --noEmit
Done in 3.4s (exit code: 0)
```

### 5. Unit Tests
```bash
npx -y pnpm@10.28.0 test
```
```text
Test Files  92 passed (92)
Tests       1160 passed (1160)
Done in 9.7s (exit code: 0)
```

### 6. Production Builds
- V2 build:
  ```bash
  npx -y pnpm@10.28.0 build
  ```
  ```text
  vite v8.3.5 building client environment for production...
  ✓ 1796 modules transformed.
  ✓ built in 342ms
  Done in 4.6s (exit code: 0)
  ```
- Classic build:
  ```bash
  VITE_GAME_V2=0 npx -y pnpm@10.28.0 --filter @taskbar-hero/web build
  ```
  ```text
  vite v8.3.5 building client environment for production...
  ✓ 1796 modules transformed.
  ✓ built in 320ms (exit code: 0)
  ```

### 7. Full Playwright E2E Suite
```bash
cd apps/web && pkill -f "vite preview" || true && npx -y pnpm@10.28.0 test:e2e
```
```text
Running 173 tests using 6 workers
173 passed (47.0s) (exit code: 0)
```
