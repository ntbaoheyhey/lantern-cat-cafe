# UI Wave Card U5: Tab Panels Visual Refresh Report

STATUS: DONE

## 1. Tooling & Environment
- **Package Manager**: pnpm 10.28.0 (`/opt/homebrew/bin/pnpm 10.28.0`)
- **Base Commit**: `577faaeef7868bb5c013d54f17f8ea761c53d4b2` (`origin/ai/codex-integrate-v2-stage`)
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
Done in 406ms using pnpm v10.28.0
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
Done in 3.5s
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
Done in 3.1s
```

### `pnpm test`
```
> taskbar-hero@0.0.0 test /private/tmp/taskbar-hero-u5
> pnpm -r test

Scope: 6 of 7 workspace projects
Test Files  83 passed (83) in apps/web
     Tests  1082 passed (1082)
All workspace packages passed (packages/auth, packages/chain, packages/game-rules, supabase/tests).
```

### `pnpm build`
```
> taskbar-hero@0.0.0 build /private/tmp/taskbar-hero-u5
> pnpm -r build

Scope: 6 of 7 workspace projects
apps/web build$ tsc --noEmit && vite build
✓ 1793 modules transformed.
dist/index.html                               2.05 kB │ gzip:   0.75 kB
dist/assets/index-BUPGst-9.css               91.32 kB │ gzip:  15.48 kB
dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
dist/assets/assets-Nb859oHo.js                0.97 kB │ gzip:   0.58 kB
dist/assets/StageScene-C5Z1bky4.js            2.13 kB │ gzip:   1.03 kB
dist/assets/ArenaScene-D6So_Gbz.js            5.91 kB │ gzip:   2.32 kB
dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
dist/assets/index-n9BeGTTp.js               716.39 kB │ gzip: 112.19 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.48 kB
✓ built in 344ms
Done in 4.5s
```

### `apps/web/e2e/ui/u5-panels.spec.ts`
```
Running 10 tests using 1 worker

  ✓  1 [stage-layout] › e2e/ui/u5-panels.spec.ts:43:7 › Panel verification at desktop (1280x720) › panel Forge satisfies acceptance criteria (a, b, d) (828ms)
  ✓  2 [stage-layout] › e2e/ui/u5-panels.spec.ts:43:7 › Panel verification at desktop (1280x720) › panel Boss satisfies acceptance criteria (a, b, d) (809ms)
  ✓  3 [stage-layout] › e2e/ui/u5-panels.spec.ts:43:7 › Panel verification at desktop (1280x720) › panel Help satisfies acceptance criteria (a, b, d) (830ms)
  ✓  4 [stage-layout] › e2e/ui/u5-panels.spec.ts:43:7 › Panel verification at desktop (1280x720) › panel Market satisfies acceptance criteria (a, b, d) (835ms)
  ✓  5 [stage-layout] › e2e/ui/u5-panels.spec.ts:149:5 › Panel verification at desktop (1280x720) › Forge segmented control segments share the same top and height (785ms)
  ✓  6 [stage-layout] › e2e/ui/u5-panels.spec.ts:43:7 › Panel verification at phone (390x844) › panel Forge satisfies acceptance criteria (a, b, d) (821ms)
  ✓  7 [stage-layout] › e2e/ui/u5-panels.spec.ts:43:7 › Panel verification at phone (390x844) › panel Boss satisfies acceptance criteria (a, b, d) (831ms)
  ✓  8 [stage-layout] › e2e/ui/u5-panels.spec.ts:43:7 › Panel verification at phone (390x844) › panel Help satisfies acceptance criteria (a, b, d) (856ms)
  ✓  9 [stage-layout] › e2e/ui/u5-panels.spec.ts:43:7 › Panel verification at phone (390x844) › panel Market satisfies acceptance criteria (a, b, d) (843ms)
  ✓ 10 [stage-layout] › e2e/ui/u5-panels.spec.ts:149:5 › Panel verification at phone (390x844) › Forge segmented control segments share the same top and height (772ms)
  10 passed (9.6s)
```

## 6. NOT Verified
- Live database writes and Supabase cloud functions (prohibited by shared rules hard stop).
- Public deployment / PR submission (prohibited by shared rules).

## 7. Diff Scope
```
 apps/web/e2e/ui/u5-panels.spec.ts            | 177 ++++++++++
 apps/web/src/layout/HelpTab.css              | 109 ++++++-
 apps/web/src/layout/HelpTab.tsx              |  22 +-
 apps/web/src/layout/boss/BossGatePanel.tsx   |  64 +++-
 apps/web/src/layout/boss/boss.css            | 299 ++++++++++-------
 apps/web/src/layout/forge/ForgePanel.css     | 470 ++++++++++++++++-----------
 apps/web/src/layout/forge/ForgePanel.tsx     |  41 ++-
 apps/web/src/layout/loot/loot.css            |  28 +-
 apps/web/src/market/market.css               | 363 +++++++++++++++++++--
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
 reports/u5-panels.md                         | (this report)
```
All modified files belong strictly to the card allowlist.
