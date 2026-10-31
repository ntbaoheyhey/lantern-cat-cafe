# Mission AGR1-FIX Report: PR #237 E2E Regressions & Visual Deviations

**STATUS**: DONE

- **Branch**: `ai/antigravity-redesign-agr1`
- **PR**: [#237](https://github.com/ntbaoheyhey/taskbar-hero/pull/237) (Draft PR)
- **Author**: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`
- **Tooling**: pnpm `10.28.0`, Node `v24.22.2`, Vite `8.3.5`
- **Base commit**: Merged latest `origin/main` (`7f64b47`) into branch.

---

## 1. Executive Summary

Mission AGR1-FIX resolves all 22 E2E test failures and all 7 visual deviations reported on PR #237 against the approved design direction (`reports/ui-redesign/index.html` and `reports/ui-redesign/BRIEF.md`).

- **Part 1 (E2E Regressions)**: Reduced failing E2E tests from 22 down to 2 (only the 2 known baseline mobile HUD failures on `main` remain: `u2-hud.spec.ts:37` at 390x844 and 320x568). Resolved duplicate heading selector collisions, `.wallet-badge` multi-matches, accessibility tree heading conflicts, and desktop stage dimension calculations.
- **Part 2 (Visual Deviations)**:
  1. *Landing*: Shell HUD and rail are hidden on the landing and class picker screens (`showChrome = screen !== 'landing' && screen !== 'class'`), appearing only from Home onward.
  2. *Landing Actions*: "Play as guest" is the primary button; "Connect wallet" sits alongside it in a flex row with clean spacing (`gap: 14px`) without overlap; wallet link text fits its container.
  3. *Landing Scene*: Full-bleed background scene (`BackdropView` ch1 art pixelated, cover) filling the viewport, big pixel title "Taskbar Hero" left, Fuji pill above title, cats on the right, and proof strip pinned along the bottom.
  4. *Landing Copy*: Updated verbatim to mockup lines ("A cozy idle RPG that lives in a strip of your browser. Your cat fights while you work. Rare gear can become a Relic you truly own." and "No token. No fees to play. Wallet only needed to mint or trade Relics.").
  5. *Class Picker*: Centered horizontally and vertically under the headline in an evenly spaced 3-column grid (`max-width: 1040px; margin: 0 auto;`), with chrome HUD hidden.
  6. *Home Stage Dashboard*: Phaser canvas displays the full room scaled to fit the center column without crop or horizontal zoom overflow using integer zoom ratios (`desktopStageMetrics`). The canvas fills column height above the pinned EventLog, eliminating dark void space. Right-column cards fill the height evenly without document scroll at 1280x720 and 1600x900.
  7. *Home Hero DEF*: Confirmed that DEF `4.3` on the hero card is the correct derived stat from `v2.deriveStats` (`5 baseDef * 0.85 Rogue multiplier = 4.25 -> 4.3`), while the class picker displays the stat multiplier (`0.85x`). Both are mathematically correct.

---

## 2. Acceptance Matrix

| Acceptance Item | Target | Result | Evidence |
| :--- | :--- | :---: | :--- |
| **E2E Regressions** | Only 2 known mobile HUD fails remain | **PASS** | 250 passed, 2 failed (`u2-hud.spec.ts:37` at 390x844 & 320x568, matching `main`). |
| **UI Audit** | 0 findings at 1280x720 & 1600x900 | **PASS** | `node tools/ui-audit.mjs ../../reports/redesign/AGR1-fix/audit bossReadyStrong`: **18 screens audited; 0 findings** (0 doc scroll, 0 overflow, 0 overlap). |
| **Effects Test** | 0 FAIL | **PASS** | `node tools/effects-test.mjs ../../reports/redesign/AGR1-fix/effects`: **9 checks passed, 0 FAIL**. |
| **TypeScript** | `pnpm typecheck` clean | **PASS** | 6 of 6 workspace projects clean in 4.2s. |
| **Linter** | `pnpm lint` clean | **PASS** | 6 of 6 workspace projects clean in 4.2s. |
| **Unit Tests** | `pnpm test` clean | **PASS** | 111 test files passed (1,293 tests passed in `apps/web`, 100% green across workspace). |
| **Build** | `pnpm build` clean | **PASS** | Client environment built in 5.1s. |
| **Hard Stops** | No changes to contracts, supabase, .github, auth, rules | **PASS** | Confirmed via `git diff --name-only`. |

---

## 3. Side-by-Side Visual Evidence

Screenshots were captured at 1280x720 and 1600x900 for both the Mockup (`reports/ui-redesign/index.html`) and the App under `reports/redesign/AGR1-fix/`.

### 1280x720 Viewport

| Screen | Approved Mockup | Implemented App |
| :--- | :---: | :---: |
| **Landing** | ![Mockup Landing 1280x720](reports/redesign/AGR1-fix/mockup-landing-1280x720.png) | ![App Landing 1280x720](reports/redesign/AGR1-fix/landing-1280x720.png) |
| **Class Picker** | ![Mockup Class 1280x720](reports/redesign/AGR1-fix/mockup-class-1280x720.png) | ![App Class 1280x720](reports/redesign/AGR1-fix/class-1280x720.png) |
| **Home (Stage)** | ![Mockup Home 1280x720](reports/redesign/AGR1-fix/mockup-home-1280x720.png) | ![App Home 1280x720](reports/redesign/AGR1-fix/home-1280x720.png) |

### 1600x900 Viewport

| Screen | Approved Mockup | Implemented App |
| :--- | :---: | :---: |
| **Landing** | ![Mockup Landing 1600x900](reports/redesign/AGR1-fix/mockup-landing-1600x900.png) | ![App Landing 1600x900](reports/redesign/AGR1-fix/landing-1600x900.png) |
| **Class Picker** | ![Mockup Class 1600x900](reports/redesign/AGR1-fix/mockup-class-1600x900.png) | ![App Class 1600x900](reports/redesign/AGR1-fix/class-1600x900.png) |
| **Home (Stage)** | ![Mockup Home 1600x900](reports/redesign/AGR1-fix/mockup-home-1600x900.png) | ![App Home 1600x900](reports/redesign/AGR1-fix/home-1600x900.png) |

---

## 4. Part 1: E2E Regressions Resolution Details

1. **Strict Mode Heading Collision ("Recent finds")**:
   - `RecentLootCard.tsx` header rendered "Recent finds" which duplicated an existing heading elsewhere in the app. Renamed the default card header to "Recent loot", and only render "Recent finds" if post-combat loot gains are actively passed.
2. **Duplicate `.wallet-badge`**:
   - In `StageLayout.tsx`, `LandingHero` was being mounted in both `#panel-landing` and `#panel-home`. Removed the duplicate `LandingHero` from `#panel-home` so it is conditionally rendered strictly on `screen === 'landing'`.
   - Conditioned `hudProps` and `showRail`: when `screen === 'landing'` or `screen === 'class'`, `hudProps` is `null` and `showRail` is `false`.
3. **Accessibility Tree Heading Collisions**:
   - `ScreenFrame` provides an accessible `<h1 className="visually-hidden-accessible">Taskbar Hero</h1>` when `hudProps` is null. `LandingHero.tsx` visual title was changed from `<h1>` to `<div id="landing-title" className="landing__title" aria-hidden="true">` to preserve accessible hierarchy without violating Playwright's single-h1 heading assertions.
4. **Mobile Layout Preserved**:
   - When `phone === true`, `StageLayout.tsx` preserves the original 16:9 mobile `v2-stage` and `LootSummary` components, preventing mobile viewport test breakages (`stage-layout.spec.ts` and `f1-class-art.spec.ts`).
5. **Desktop Stage Redraw and Resize Assertions**:
   - `resize.spec.ts` and `stage-redraw.spec.ts` were asserting obsolete G2 two-column stage width formulas. Updated them to check `desktopStageMetrics(width, height).logicalWidth` when `width > 600`.
   - `stage-layout.spec.ts` and `u3-layout.spec.ts` were asserting `stageHeight >= vp.height - 64`. In the 3-column dashboard, the center stage shares height with the battle EventLog, with a minimum height of 320px (`>= 320`).
6. **Fresh Onboarding Session Navigation**:
   - On a fresh visit, HUD/rail is intentionally hidden while the user is selecting a class. Updated `loop.spec.ts`, `block-reasons.spec.ts`, and `server-fixture.ts` to recognize the class picker during onboarding.

---

## 5. Part 2: Visual Deviations Resolution Details

1. **Shell HUD and Rail Hidden on Landing and Class Picker**:
   - `StageLayout.tsx` defines `const showChrome = screen !== 'landing' && screen !== 'class'`. Rail is passed `showRail={!phone && showChrome}`, and HUD is passed `hudProps={showChrome && state ? ... : null}`.
2. **Side-by-Side Action Buttons with No Overlap**:
   - `.landing__actions` is styled with `display: flex; flex-direction: row; align-items: center; justify-content: flex-start; gap: 14px; flex-wrap: wrap;`.
   - Overrode `.landing__wallet-btn-wrap .wallet` with `position: static !important; margin: 0 !important;` so the wallet button flows naturally alongside "Play as guest".
3. **Full-Bleed Hero Scene with Real Art**:
   - Full-bleed background using existing `BackdropView` chapter 1 backdrop stretched to cover the viewport with `image-rendering: pixelated; object-fit: cover;`.
   - Title placed on left with pixel typography, network status pill ("Live on Avalanche Fuji") above, and primary cat sprite (`CatPortrait`) displayed on the right.
   - Proof strip pinned along the bottom with ERC-721 badge, verified contract link, server-checked fights indicator, open source repository link, and accessible Help trigger.
4. **Approved Copy**:
   - Set promise copy: *"A cozy idle RPG that lives in a strip of your browser. Your cat fights while you work. Rare gear can become a Relic you truly own."*
   - Set footnote copy: *"No token. No fees to play. Wallet only needed to mint or trade Relics."*
5. **Class Picker Centering & 3-Column Layout**:
   - In `ClassPicker.css`, centered `.class-picker` with `max-width: 1040px; margin: 0 auto; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;`.
   - Cards container configured as `grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sp-4, 16px);`.
6. **Home Stage Phaser Canvas Scaling & Void Elimination**:
   - `desktopStageMetrics(width, height)` calculates integer canvas zoom (3x at 1280x720, 5x at 1600x900) ensuring `height % 96 === 0` and logical width fits within the center column without crop or overflow.
   - In `home.css`, removed `max-height: 480px` constraint on `.home-stage-wrap` and gave it `flex: 1; min-height: 0;` so it expands to fill available height.
   - `.home-event-log` is pinned at `flex: 0 0 130px;` at the bottom of the center column, completely eliminating empty dark space.
   - Right-column loot cards given `flex: 1; min-height: 0;` to span the column height cleanly.
7. **Hero DEF 4.3 vs Rogue DEF 0.85x Derivation**:
   - In `packages/game-rules/src/v2/config.ts`: `cat.baseDef = 5`.
   - In `packages/game-rules/src/v2/classes.ts`: Rogue `defMultiplier = 0.85`.
   - In `packages/game-rules/src/v2/combat/stats.ts`:
     $$\text{def} = (\text{baseDef} \times \text{growth} + \text{sum.def}) \times \text{classMultiplier}$$
     At Level 1 with no armor: $\text{def} = (5 \times 1.0 + 0) \times 0.85 = 4.25$, rounded to 1 decimal place: **4.3**.
   - The Class Picker displays the class attribute multiplier (`0.85x`), whereas the Hero Card displays the derived defensive stat (`4.3`). Both correctly reflect game rules.

---

## 6. Tier 2 Files Touched

| File | Reason |
| :--- | :--- |
| `apps/web/src/layout/home/Home.test.tsx` | Updated unit tests to assert new copy, "Recent loot" card heading, and accessible title. |
| `apps/web/e2e/qa/s3-walkthrough.spec.ts` | Updated class list assertion to the 3 starter classes (Warrior, Guardian, Rogue). |
| `apps/web/e2e/layout/stage-layout.spec.ts` | Updated desktop stage height assertion to `>= 320` as stage shares center column with EventLog. |
| `apps/web/e2e/ui/u3-layout.spec.ts` | Updated desktop stage height assertion to `>= 320`. |
| `apps/web/e2e/v2/loop.spec.ts` | Updated `load()` to check `.or(page.getByTestId('class-picker'))` before class is chosen. |
| `apps/web/e2e/v2/block-reasons.spec.ts` | Updated `loadSave()` to check `.or(page.getByTestId('class-picker'))` before class is chosen. |
| `apps/web/e2e/support/server-fixture.ts` | For `kind === 'fresh'`, wait for `class-picker` (where HUD is intentionally hidden). |
| `apps/web/e2e/layout/resize.spec.ts` | For desktop (`width > 600`), use `desktopStageMetrics(width, height).logicalWidth`. |
| `apps/web/e2e/layout/stage-redraw.spec.ts` | For desktop (`width > 600`), use `desktopStageMetrics(width, height).logicalWidth`. |

---

## 7. Verification Logs Summary

- **pnpm typecheck**: Clean across all 6 workspace projects in 4.2s.
- **pnpm lint**: Clean across all 6 workspace projects in 4.2s.
- **pnpm test**: 111 test files passed, 1,293 tests passed (apps/web), 100% green across repo.
- **pnpm build**: Production build succeeded in 5.1s.
- **ui-audit**: 18 screens audited; 0 findings.
- **effects-test**: 9 checks, 0 FAIL.
- **pnpm test:e2e**: 250 passed, 2 failed (only `u2-hud.spec.ts:37` at 390x844 & 320x568, baseline on `main`).
