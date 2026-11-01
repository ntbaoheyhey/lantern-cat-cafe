# Mission AGR2-FIX-B Report: Mobile Bag Layout & Pointer Interception Fixes

STATUS: DONE

- **Branch**: `ai/antigravity-redesign-agr2` (PR #236)
- **Base**: `origin/main` (commit `4a025fb`, merged latest origin/main containing AGR1 #237 and CXN2)
- **Git Author**: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`
- **Date**: 2026-11-01

---

## 1. Problem Statement & Root Cause Analysis

Following the AGR2 Bag redesign, desktop viewports (1280x720, 1600x900) were verified and visually confirmed, but two mobile E2E test failures remained:

### Failure 1: Horizontal Clip on `.bag-main` at 390x844
- **Failure**: `e2e/ui/u4-character-bag.spec.ts:67` reported `.bag-main` has `scrollWidth 371 > clientWidth 362` (horizontal clip).
- **Root Cause**: `.bag-filters` had `flex-shrink: 0` in base CSS without `max-width: 100%` or `min-width: 0`. The 5 category filter chips ("All", "Weapons", "Armor", "Materials", "Relics") took ~373px intrinsic width on a single line inside the toolbar. Because `.bag-main` has `overflow: hidden`, an intrinsic width of 373px inside a 338px content box caused `scrollWidth (371px) > clientWidth (362px)`, triggering Playwright's text clipping assertion.

### Failure 2: Pointer Event Interception on Item Cards at 320px
- **Failure**: `e2e/layout/character-bag.spec.ts:79` timed out clicking item "Silverclaw Saber" at 320px.
- **Root Cause**: On mobile viewports (`<= 768px`), `.bag-layout` used `flex-direction: column`. However, `.bag-main` retained `flex: 1 1 0; min-height: 0; overflow: hidden;` while `.bag-sidebar` below it had `flex-shrink: 0; height: 189px;`. In a 320x568 viewport, `.bag-main` was squished down to 137px total height. With the toolbar taking ~100px, equip note ~30px, and padding 16px, `.bag-grid-container` was crushed to **`height: 0`**. The item buttons overflowed out of the 0-height container and directly underneath `.bag-sidebar` (containing `compare-skeleton`), meaning `.bag-sidebar` intercepted all pointer events at the button's viewport coordinates.

---

## 2. Implemented Fixes (`apps/web/src/layout/bag/bag.css`)

All modifications were strictly constrained to `apps/web/src/layout/bag/bag.css`:

1. **Toolbar & Filter Wrapping on Mobile**:
   - In base styles, added `min-width: 0; max-width: 100%;` to `.bag-filters`.
   - In `@media (max-width: 768px)`:
     - Configured `.bag-toolbar` to `flex-direction: column; align-items: stretch; gap: var(--sp-2, 8px); width: 100%; min-width: 0;`.
     - Gave `.bag-filters` `display: flex; flex-wrap: wrap; width: 100%; min-width: 0; max-width: 100%; flex-shrink: 1;`.
     - Set `.bag-filter-chip` to `padding: 0 8px; font-size: 11px; height: 28px; min-height: 28px; min-width: 0;` so chips wrap cleanly on narrow screens without horizontal overflow.
     - Set `.bag-toolbar-actions` to `display: flex; align-items: center; gap: var(--sp-2, 8px); width: 100%; min-width: 0;` with `.sort-select` taking `flex: 1 1 0; min-width: 0;`.

2. **Mobile Stacking & Defined Grid Container Height**:
   - In `@media (max-width: 768px)`:
     - `.bag-layout`: `flex-direction: column; overflow-y: auto; overflow-x: hidden; padding: var(--sp-2, 8px); gap: var(--sp-2, 8px); height: 100%; min-height: 0;`.
     - `.bag-main`: `flex: 0 0 auto; min-height: auto; min-width: 0; max-width: 100%; padding: var(--sp-2, 8px); gap: var(--sp-2, 8px); overflow: hidden;`.
     - `.bag-grid-container`: `height: 220px; max-height: 45vh; min-height: 160px; overflow-y: auto; overflow-x: hidden; flex: none; width: 100%; min-width: 0; box-sizing: border-box;`.
     - Added `min-width: 0;` to grid children (`.bag-slot`, `.bag-card`, `.bag-tile`).
     - `.bag-sidebar`: `width: 100%; max-width: 100%; flex: 0 0 auto; min-height: auto; overflow: visible;`.
     - `.bag-detail`: `width: 100%; box-sizing: border-box; overflow: visible;`.
   - Result: `.bag-grid-container` maintains a healthy 220px scrollable window displaying ~3.5 rows of items. Row 2 items (such as "Silverclaw Saber") are completely visible and un-occluded. `.bag-sidebar` sits cleanly below `.bag-main` at `y ≈ 380px` rather than overlapping.

3. **Narrow Viewport Grid Columns (`<= 480px`)**:
   - Added `@media (max-width: 480px)` rule:
     ```css
     .bag-grid {
       grid-template-columns: repeat(4, 56px);
       justify-content: center;
     }
     ```
   - 4 columns of 56px + 3 gaps of 8px = 248px total grid width, fitting centered inside the 284px content width at 320px with zero horizontal scroll.

4. **Desktop Layout Intact**:
   - The desktop layout (1280x720 and 1600x900) remains 100% identical: 8 columns of 56px slots, side-by-side fixed 320px right detail sidebar, comparison deltas, and zero document scroll.

---

## 3. Verification Matrix & Acceptance Results

| Test / Gate | Target | Status | Result / Details |
|---|---|:---:|---|
| **Typecheck** | `pnpm typecheck` | **PASS** | Exit code 0 across all 6 workspace packages (`tsc --noEmit`). |
| **Lint** | `pnpm lint` | **PASS** | Exit code 0 across all 6 workspace packages. |
| **Unit Tests** | `pnpm test` | **PASS** | 111 test files passed, 1303 tests passed. |
| **Bag Unit Tests** | `pnpm --filter @taskbar-hero/web test src/layout/bag/BagPanel.test.tsx` | **PASS** | 24 tests passed (0 failures). |
| **Production Build** | `pnpm build` | **PASS** | Vite production client built cleanly in 441ms. |
| **UI Audit (1280 & 1600)** | `node tools/ui-audit.mjs ../../reports/redesign/AGR2-fix-b/audit bossReadyStrong` | **PASS** | 18 screens audited; **0 findings** (`findings.json`). |
| **Bag E2E Tests** | `pnpm playwright test e2e/ui/u4-character-bag.spec.ts e2e/layout/character-bag.spec.ts` | **PASS** | 9 passed (0 failures). Both 390x844 clipping and 320px item clicks pass. |
| **Full E2E Suite** | `cd apps/web && pnpm test:e2e` | **PASS** | Only the **2 known mobile HUD failures** (`u2-hud.spec.ts:37:3 › HUD readable at 390x844` and `at 320x568`). All 249 other tests pass. |

---

## 4. Scope & Boundary Compliance

`git diff --name-only` confirms that modifications are strictly limited to allowed files:
- [apps/web/src/layout/bag/bag.css](file:///Users/bao/taskbar-hero/apps/web/src/layout/bag/bag.css)

**Zero touches** to:
- `contracts/`
- `supabase/`
- `.github/`
- `packages/`
- `auth/` / SIWE

---

## 5. What is NOT Verified

1. **Mobile HUD Header Compactness**: The 2 known mobile HUD failures (`u2-hud.spec.ts:37:3` checking header height `<= 88px` at 390px/320px) are part of a separate HUD task and not modified here.
2. **Live On-Chain Contracts**: Avalanche Fuji testnet transactions are mocked via loopback harnesses.
3. **Production Supabase DB**: Remote Supabase mutations are mocked via local storage and PGlite fixtures.
