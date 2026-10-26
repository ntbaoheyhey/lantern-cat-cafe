# UI Wave Card U5: Tab Panels Visual Refresh Report

STATUS: DONE

## Fix round 1 (2026-10-26)
- **Status**: STATUS: DONE
- **What Failed on PR #174**:
  - Orchestrator `verify-pr.sh` failed during Playwright E2E (`cd apps/web && pnpm test:e2e`) on `apps/web/e2e/ui/u5-panels.spec.ts` under project `[classic]`.
  - Failure: All 10 tests timed out waiting for `.v2-shell` (`locator('.v2-shell') waiting to be visible`).
  - Root Cause: `apps/web/e2e/ui/u5-panels.spec.ts` lacked a custom `baseURL`, so project `[classic]` defaulted to port 4173 (`dist` with `VITE_GAME_V2=0`), where `.v2-shell` does not exist.
- **What Changed**:
  - Merged latest `origin/main` into `ai/antigravity-u5-panels`.
  - Added `test.use({ baseURL: 'http://localhost:4174' });` right after imports in `apps/web/e2e/ui/u5-panels.spec.ts` (matching `apps/web/e2e/ui/u4-character-bag.spec.ts`).
  - Panel markup, CSS, and game logic were untouched.
- **Commands Re-run with Output**:
  - `pnpm install --frozen-lockfile`: PASS (pnpm v10.28.0)
  - `pnpm gen:deno && git diff --exit-code -- supabase/functions`: PASS (wrote 18 Edge Function import maps)
  - `pnpm typecheck`: PASS (all 6 projects clean)
  - `pnpm lint`: PASS (all 6 projects clean)
  - `pnpm test`: PASS (83 test files, 1,082 unit tests passed in apps/web, all workspace packages passed)
  - `pnpm build`: PASS (all 6 projects built clean)
  - `cd apps/web && pnpm test:e2e`: PASS (106 passed, 1 skipped across all projects: `v2-loop`, `classic`, `stage-layout`)
- **u5-panels Test Execution**:
  All 10 tests executed under project `[classic]` targeting port 4174:
  - `[classic] › e2e/ui/u5-panels.spec.ts › desktop (1280x720) › panel Forge satisfies acceptance criteria (a, b, d)`: PASS
  - `[classic] › e2e/ui/u5-panels.spec.ts › desktop (1280x720) › panel Boss satisfies acceptance criteria (a, b, d)`: PASS
  - `[classic] › e2e/ui/u5-panels.spec.ts › desktop (1280x720) › panel Help satisfies acceptance criteria (a, b, d)`: PASS
  - `[classic] › e2e/ui/u5-panels.spec.ts › desktop (1280x720) › panel Market satisfies acceptance criteria (a, b, d)`: PASS
  - `[classic] › e2e/ui/u5-panels.spec.ts › desktop (1280x720) › Forge segmented control segments share the same top and height`: PASS
  - `[classic] › e2e/ui/u5-panels.spec.ts › phone (390x844) › panel Forge satisfies acceptance criteria (a, b, d)`: PASS
  - `[classic] › e2e/ui/u5-panels.spec.ts › phone (390x844) › panel Boss satisfies acceptance criteria (a, b, d)`: PASS
  - `[classic] › e2e/ui/u5-panels.spec.ts › phone (390x844) › panel Help satisfies acceptance criteria (a, b, d)`: PASS
  - `[classic] › e2e/ui/u5-panels.spec.ts › phone (390x844) › panel Market satisfies acceptance criteria (a, b, d)`: PASS
  - `[classic] › e2e/ui/u5-panels.spec.ts › phone (390x844) › Forge segmented control segments share the same top and height`: PASS

## 1. Tooling & Environment
- **Package Manager**: pnpm 10.28.0 (`10.28.0`)
- **Base Commit**: `577faaeef7868bb5c013d54f17f8ea761c53d4b2` (`origin/ai/codex-integrate-v2-stage`), merged with `origin/main`
- **Task Branch**: `ai/antigravity-u5-panels`
- **Git Author**: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`

## 2. Summary of Changes
- **Standardized Panel Headers & Dark Surfaces**:
  - Replaced cream/white container backgrounds across Forge, Boss, Help, and Market with dark plum surfaces (`--surface: #2a1f36`, `--surface-2: #3a2c4a`, `--border: #5b4572`).
  - Added unified header structure with titles in `--font-display --fs-lg` and helper copy in `--font-body --fs-sm --muted`.
- **Forge Segmented Control**:
  - Transformed Craft, Salvage, and Relic tabs into a single contiguous segmented control (`.forge-nav`) where the active tab is filled with `--accent` (`#ffb86b`) and `--on-accent`, and inactive tabs sit on `--surface-2`.
  - Maintained accessibility roles (`role="tab"`, `role="tablist"`), testids, and verified identical `y` and `height` dimensions across desktop and mobile viewports.
  - Implemented empty state for Salvage with a 32 px icon, descriptive helper copy, and a direct action to Craft.
- **Boss Gate Card**:
  - Restyled Boss panel into a cohesive card layout featuring a large pixel-framed portrait, boss name and chapter subtitle, and dual-bar power comparison on a single scale ("Your power vs boss").
  - Formatted key costs and key inventory as chips with pixel icons, and cooldown display in `--font-num`.
  - Ensured "Fight" is the single primary action button (`.pixel-btn.boss-fight-btn`), retaining clear disabled reason copy when gated.
- **Help Tab**:
  - Implemented a single reading column capped at `65ch` with `--sp-4` spacing between sections.
  - Preserved all 7 required `<h3>` sections in their exact sequence.
  - Formatted terminology with a `<dl>` definition list and added a primary action button ("Start Exploring").
- **Market Tab**:
  - Formatted listing cards as clean rows with icon, name, right-aligned price in `--font-num`, and secondary View / primary Buy actions.
  - Added friendly empty state with 32 px icon for empty market inventory.
- **Loot & Chest Dialogs**:
  - Preserved parchment dialog exception while aligning modal buttons (`.chest-reveal-btn`, `.welcome-back-btn`) to `pixel-btn` and numbers/durations to `--font-num`.

## 3. Acceptance Verification

| Criteria | Status | Details |
|---|---|---|
| Existing forge, boss, help, market, loot, a11y tests pass unchanged | PASS | 13 test files (165 tests) passed in `apps/web` |
| V2 loop tests pass unchanged | PASS | 15/15 tests in `e2e/v2/loop.spec.ts` passed |
| Stage layout e2e tests pass | PASS | 31/31 tests in `e2e/layout/**` passed |
| (a) No panel content background luminance > 0.5 (dialogs excluded) | PASS | Verified in `e2e/ui/u5-panels.spec.ts` at 1280x720 and 390x844 |
| (b) Exactly one visible element with primary button class/accent per view | PASS | Verified in `e2e/ui/u5-panels.spec.ts` at 1280x720 and 390x844 |
| (c) Forge segmented control segments share same top and height | PASS | Verified in `e2e/ui/u5-panels.spec.ts` (`diff <= 1.5px`) at 1280x720 and 390x844 |
| (d) No text clipping, no horizontal overflow | PASS | Verified in `e2e/ui/u5-panels.spec.ts` at 1280x720 and 390x844 |
| Before/After screenshots captured (<= 14 PNGs, < 200 KB each) | PASS | Exactly 14 PNGs in `reports/u5-panels/`, each between 29 KB and 62 KB |

## 4. Evidence Screenshots
Saved in `reports/u5-panels/`:
- `before-forge-1280x720.png` (32 KB) / `after-forge-1280x720.png` (29 KB)
- `before-forge-390x844.png` (60 KB) / `after-forge-390x844.png` (61 KB)
- `before-boss-1280x720.png` (35 KB) / `after-boss-1280x720.png` (35 KB)
- `before-boss-390x844.png` (41 KB) / `after-boss-390x844.png` (42 KB)
- `before-help-1280x720.png` (52 KB) / `after-help-1280x720.png` (46 KB)
- `before-help-390x844.png` (61 KB) / `after-help-390x844.png` (59 KB)
- `before-market-1280x720.png` (33 KB) / `after-market-1280x720.png` (30 KB)

## 5. Verification Commands Output

### `pnpm install --frozen-lockfile`
```
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 416ms using pnpm v10.28.0
```

### `pnpm gen:deno && git diff --exit-code -- supabase/functions`
```
> taskbar-hero@0.0.0 gen:deno /private/tmp/taskbar-hero-u5
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

### `pnpm typecheck`
```
> taskbar-hero@0.0.0 typecheck /private/tmp/taskbar-hero-u5
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/api-contract typecheck$ tsc --noEmit
apps/web typecheck$ tsc --noEmit
Done in 4s
```

### `pnpm lint`
```
> taskbar-hero@0.0.0 lint /private/tmp/taskbar-hero-u5
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
packages/api-contract lint$ tsc --noEmit
apps/web lint$ tsc --noEmit
Done in 4s
```

### `pnpm test`
```
> taskbar-hero@0.0.0 test /private/tmp/taskbar-hero-u5
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth: 2 tests passed
packages/chain: 7 tests passed
packages/game-rules: 330 tests passed (2 expected fail, 11 skipped)
supabase/tests: 7 tests passed
packages/api-contract: 16 tests passed
apps/web: 83 test files passed, 1082 tests passed
Done in 8.6s
```

### `pnpm build`
```
> taskbar-hero@0.0.0 build /private/tmp/taskbar-hero-u5
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth: Done in 348ms
packages/chain: Done in 802ms
packages/game-rules: Done in 891ms
supabase/tests: Done in 1.3s
packages/api-contract: Done in 433ms
apps/web: tsc --noEmit && vite build
✓ 1793 modules transformed.
dist/index.html                               2.05 kB │ gzip:   0.75 kB
dist/assets/index-H6xz1E5P.css               99.31 kB │ gzip:  16.43 kB
dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
dist/assets/assets-DRaqBMmK.js                0.97 kB │ gzip:   0.58 kB
dist/assets/StageScene-aczkRHdx.js            2.13 kB │ gzip:   1.03 kB
dist/assets/ArenaScene-D5JKfxRK.js            5.91 kB │ gzip:   2.32 kB
dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
dist/assets/index-BxauymyV.js               730.41 kB │ gzip: 112.73 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
✓ built in 348ms
Done in 4.6s
```

### `cd apps/web && pnpm test:e2e`
```
> @taskbar-hero/web@0.0.0 test:e2e /private/tmp/taskbar-hero-u5/apps/web
> playwright test

Running 107 tests using 6 workers
  1 skipped
  106 passed (28.9s)
```

## 6. NOT Verified
- Live database writes and Supabase cloud functions (prohibited by shared rules hard stop).
- Public deployment / PR submission (prohibited by shared rules).

## 7. Diff Scope
```
 apps/web/e2e/ui/u5-panels.spec.ts            | 179 ++++++++++
 apps/web/src/layout/HelpTab.css              | 109 ++++++-
 apps/web/src/layout/HelpTab.tsx              |  22 +-
 apps/web/src/layout/boss/BossGatePanel.tsx   |  64 +++-
 apps/web/src/layout/boss/boss.css            | 299 ++++++++++-------
 apps/web/src/layout/forge/ForgePanel.css     | 470 ++++++++++++++++-----------
 apps/web/src/layout/forge/ForgePanel.tsx     |  41 ++-
 apps/web/src/layout/loot/loot.css            |  28 +-
 apps/web/src/market/market.css               | 363 +++++++++++++++++++--
 reports/u5-panels.md                         | (this report)
 reports/u5-panels/after-boss-1280x720.png    | Bin 0 -> 35550 bytes
 reports/u5-panels/after-boss-390x844.png     | Bin 0 -> 42532 bytes
 reports/u5-panels/after-forge-1280x720.png   | Bin 0 -> 29582 bytes
 reports/u5-panels/after-forge-390x844.png    | Bin 0 -> 61225 bytes
 reports/u5-panels/after-help-1280x720.png    | Bin 0 -> 46835 bytes
 reports/u5-panels/after-help-390x844.png     | Bin 0 -> 60326 bytes
 reports/u5-panels/after-market-1280x720.png  | Bin 0 -> 30490 bytes
 reports/u5-panels/before-boss-1280x720.png   | Bin 0 -> 36016 bytes
 reports/u5-panels/before-boss-390x844.png    | Bin 0 -> 42160 bytes
 reports/u5-panels/before-forge-1280x720.png  | Bin 0 -> 32438 bytes
 reports/u5-panels/before-forge-390x844.png   | Bin 0 -> 61231 bytes
 reports/u5-panels/before-help-1280x720.png   | Bin 0 -> 53483 bytes
 reports/u5-panels/before-help-390x844.png    | Bin 0 -> 62277 bytes
 reports/u5-panels/before-market-1280x720.png | Bin 0 -> 33496 bytes
```
All modified files belong strictly to the card allowlist.
