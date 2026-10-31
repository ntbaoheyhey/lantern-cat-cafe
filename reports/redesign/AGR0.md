# Mission AGR0 Report: P0 Tokens + App Shell (Left Nav Rail & Top HUD)

**STATUS**: DONE  
**Branch**: `ai/antigravity-redesign-agr0`  
**Base**: `origin/main` (commit `d9299af`)  
**Git Author**: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`  
**Date**: 2026-10-31  

---

## 1. Executive Summary

Mission AGR0 establishes the core redesign shell and design tokens for Cat RPG v2:
- **Design Tokens**: Added approved shell sizing tokens (`--rail-w`, `--rail-width`, `--hud-h`, `--hud-height`) additively to [apps/web/src/theme.css](file:///Users/bao/taskbar-hero/apps/web/src/theme.css).
- **Typed Screen Registry**: Created [apps/web/src/nav/screens.ts](file:///Users/bao/taskbar-hero/apps/web/src/nav/screens.ts) defining all nine screens (`landing`, `class`, `home`, `bag`, `map`, `forge`, `market`, `hero`, `help`), bidirectional tab-to-screen mappings, and re-exporting `TABS` and `TabName` for backward compatibility with onboarding.
- **Left Nav Rail (92px)**: Implemented in [apps/web/src/shell/Rail.tsx](file:///Users/bao/taskbar-hero/apps/web/src/shell/Rail.tsx), featuring:
  - Top Mochi logo button (`data-testid="rail-logo"`).
  - 7 primary in-game navigation items (`Home`, `Bag`, `Map`, `Forge`, `Market`, `Hero`, `Help`) with `data-testid="nav-<id>"`, `aria-current="page"` and `aria-selected="true"` on the active screen, full roving tabindex keyboard navigation (ArrowDown, ArrowUp, Home, End), and visible focus rings.
  - Bottom Fuji testnet status badge (`data-testid="rail-fuji"`).
- **Top HUD (56px)**: Implemented in [apps/web/src/shell/Hud.tsx](file:///Users/bao/taskbar-hero/apps/web/src/shell/Hud.tsx), featuring:
  - Cat status region (`role="region"` `aria-label="Cat status"`): Level + XP bar (`data-testid="hud-level"`), Chapter progress chip (`data-testid="hud-progress"`), Gold / Fish chip (`data-testid="hud-gold"`), Shards / Yarn chip (`data-testid="hud-shards"`), Cat Keys chip (`data-testid="hud-keys"`), and Power chip (`data-testid="hud-power"`).
  - Center onboarding hint chip (`data-testid="next-hint"`).
  - Right sync status indicator (`data-slot="sync-status"`) and wallet connect wrapper (`data-testid="hud-wallet"`).
- **App Shell & Screen Framing**: Implemented in [apps/web/src/shell/ScreenFrame.tsx](file:///Users/bao/taskbar-hero/apps/web/src/shell/ScreenFrame.tsx) and [apps/web/src/layout/StageLayout.tsx](file:///Users/bao/taskbar-hero/apps/web/src/layout/StageLayout.tsx):
  - Hides left rail on `landing` and `class` picker screens.
  - Mounts all existing screen contents unchanged inside the flexing `<main data-testid="screen">` area.
  - Preserves full desktop (1280x720, 1600x900) layout guarantees, zero scroll / overlap, and full responsiveness.

---

## 2. Test Cases & Verification Matrix

| Test Case | Description | Status | Evidence |
|---|---|---|---|
| **T1** | All nine screens reachable from rail/landing; each renders without console errors | **PASS** | Automated audit tool `ui-audit.mjs` walked all 9 screens (`Home`, `Hero`, `Bag`, `Map`, `Forge-craft`, `Forge-salvage`, `Forge-relic`, `Market`, `Help`, plus `landing` & `class`). 0 console errors, 0 runtime exceptions. |
| **T2** | Rail item has `aria-current="page"` on active screen and visible focus ring (keyboard Tab/Enter/Arrows) | **PASS** | Verified via `Rail.test.tsx` (all 4 tests pass) and `StageLayout.test.tsx`. Arrow keys navigate with wrapping and update active selection. Visible 2px outline focus rings confirmed in `shell.css`. |
| **T3** | HUD shows live values from existing state (no hardcoded numbers) | **PASS** | Verified in `Hud.test.tsx` and `StageLayout.test.tsx`. Level, XP, Gold (fish), Shards (yarn), Keys, and Power dynamically format from live `ServerStateV2`. |
| **T4** | Landing and Class picker have no rail | **PASS** | Verified in `ScreenFrame.test.tsx` and `screens.ts` (`rail: false` for `landing` and `class`). Rail root element (`data-testid="rail"`) is not mounted. |
| **T5** | 1280x720 and 1600x900: no page scroll (`scrollHeight <= innerHeight`), no overlap | **PASS** | Verified via `node tools/ui-audit.mjs ../../reports/redesign/AGR0/audit bossReadyStrong` across 1280x720 and 1600x900 viewports. Output: `no automatic findings` (0 scroll breaches, 0 element overlaps). |
| **T6** | Existing tests green; HintTab onboarding still navigates | **PASS** | All 110 Vitest test files (1,285 tests) pass cleanly across `@taskbar-hero/web`. E2E suite (`u2-hud.spec.ts`, `u3-layout.spec.ts`, `u5-panels.spec.ts`) green. Hint button navigates to recommended actions. |
| **T7** | Existing art still referenced (no deleted or renamed files under art folders) | **PASS** | `git diff --name-status origin/main...HEAD -- apps/web/src/art` reports 0 deletions and 0 renames. 100% of sprites, backdrops, monsters, and pixel icons are intact. |

---

## 3. Tooling and Test Results

### Tooling Version
- **pnpm version**: `10.28.0` (`npx -y pnpm@10.28.0`)
- **Node.js**: `v24.22.2`

### Build (`pnpm build`)
```text
> taskbar-hero@0.0.0 build /Users/bao/taskbar-hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth: Done in 351ms
packages/chain: Done in 844ms
packages/game-rules: Done in 959ms
supabase/tests: Done in 1.5s
packages/api-contract: Done in 396ms
apps/web: tsc --noEmit && vite build
✓ 1820 modules transformed.
dist/index.html                               2.21 kB │ gzip:   0.78 kB
dist/assets/index-WeTDofHL.css              124.25 kB │ gzip:  19.73 kB
dist/assets/index-CCjhtACF.js               806.28 kB │ gzip: 110.58 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
✓ built in 348ms
└─ Done in 4.7s
```

### Typecheck & Lint (`pnpm typecheck && pnpm lint`)
```text
Scope: 6 of 7 workspace projects
packages/auth typecheck: Done in 346ms
packages/chain typecheck: Done in 822ms
packages/game-rules typecheck: Done in 1s
supabase/tests typecheck: Done in 1.5s
packages/api-contract typecheck: Done in 406ms
apps/web typecheck: Done in 3.9s
Lint checks: All 6 projects passed without errors.
```

### Vitest Suite (`pnpm test`)
```text
Test Files  110 passed (110)
     Tests  1285 passed (1285)
  Duration  15.52s
```

### Automated UI Audit (`ui-audit.mjs` & `effects-test.mjs`)
- `ui-audit.mjs`: `no automatic findings` at 1280x720 and 1600x900.
- `effects-test.mjs`: `9 checks, 0 FAIL` (canvas animations, hit impact cues, damage numbers, idle loop, 60fps frame rate, reduced motion hygiene).

---

## 4. Visual Evidence (Screenshots)

Screenshots captured across viewports are stored in `reports/redesign/AGR0/audit/`:

### 1280x720 Desktop
- **Home (Stage)**: `reports/redesign/AGR0/audit/home-1280x720.png`
- **Hero (Sheet)**: `reports/redesign/AGR0/audit/hero-1280x720.png`
- **Bag**: `reports/redesign/AGR0/audit/bag-1280x720.png`
- **Map**: `reports/redesign/AGR0/audit/map-1280x720.png`
- **Forge (Craft)**: `reports/redesign/AGR0/audit/forge-craft-1280x720.png`
- **Forge (Salvage)**: `reports/redesign/AGR0/audit/forge-salvage-1280x720.png`
- **Forge (Relic)**: `reports/redesign/AGR0/audit/forge-relic-1280x720.png`
- **Market**: `reports/redesign/AGR0/audit/market-1280x720.png`
- **Help**: `reports/redesign/AGR0/audit/help-1280x720.png`

### 1600x900 Desktop
- **Home (Stage)**: `reports/redesign/AGR0/audit/home-1600x900.png`
- **Hero (Sheet)**: `reports/redesign/AGR0/audit/hero-1600x900.png`
- **Bag**: `reports/redesign/AGR0/audit/bag-1600x900.png`
- **Map**: `reports/redesign/AGR0/audit/map-1600x900.png`
- **Forge (Craft)**: `reports/redesign/AGR0/audit/forge-craft-1600x900.png`
- **Forge (Salvage)**: `reports/redesign/AGR0/audit/forge-salvage-1600x900.png`
- **Forge (Relic)**: `reports/redesign/AGR0/audit/forge-relic-1600x900.png`
- **Market**: `reports/redesign/AGR0/audit/market-1600x900.png`
- **Help**: `reports/redesign/AGR0/audit/help-1600x900.png`

---

## 5. Scope & Tier Classification

### Tier 1 (Zone Files)
- `apps/web/src/theme.css`: Additive tokens (`--rail-w`, `--rail-width`, `--hud-h`, `--hud-height`). Old tokens untouched.
- `apps/web/src/nav/screens.ts`: New screen registry with IDs, labels, icons, and rail visibility flags. Re-exports `TABS` and `TabName` for backward compatibility.
- `apps/web/src/shell/Rail.tsx`: 92px left rail navigation component adhering to test ID and accessibility contracts.
- `apps/web/src/shell/Hud.tsx`: 56px top HUD component adhering to test ID and accessibility contracts.
- `apps/web/src/shell/ScreenFrame.tsx`: App shell frame mounting Rail, HUD, and flexing screen contents.
- `apps/web/src/shell/shell.css`: Shell layout styling, focus indicators, and reduced motion styles.
- `apps/web/src/shell/index.ts`: Public barrel exports for shell components.
- `apps/web/src/layout/StageLayout.tsx`: Shell adoption hosting unchanged screen views.
- `apps/web/src/layout/layout.css`: Added `.shell-panel-container` and `.shell-panel-view` helper classes.

### Tier 2 Changes (Allowed with Note)
- `apps/web/src/layout/StageLayout.test.tsx`: Updated tests asserting old tab navigation to reflect the 7 rail tabs (`Home`, `Bag`, `Map`, `Forge`, `Market`, `Hero`, `Help`).
- `apps/web/e2e/support/server-fixture.ts`: Added screen ID mapping so E2E test helpers selecting legacy tab names (`Boss`, `Character`, `Inventory`) map cleanly to new rail screens (`Map`, `Hero`, `Bag`).
- `apps/web/e2e/ui/u5-panels.spec.ts`: Mapped legacy panel test navigation `Boss` -> `Map` in `openPanel` helper.
- `apps/web/e2e/ui/u3-layout.spec.ts`: Updated heading check to target `Hero` screen when verifying the character sheet in the new shell.
- `apps/web/tools/ui-audit.mjs`: Added `[1600, 900]` viewport check and updated rail tabs list for automated audits.
- `apps/web/tools/effects-test.mjs`: Configured fallback chromium path for macOS testing and ensured return to `Home` before sampling canvas.

### Tier 3 (Hard Stops)
- `contracts/`: Untouched.
- `supabase/`: Untouched (`gen:deno` confirmed 0 diff).
- `auth/` / `SIWE`: Untouched.
- `packages/game-rules`: Untouched (no numbers changed).
- Dependencies: Untouched (no package additions or removals).
- No migrations, no live database or chain writes.

---

## 6. What is Not Verified / Open Questions

- **Mobile Viewport Restyling**: In accordance with the prompt ("DESKTOP ONLY: design and test at 1280x720 and 1600x900. No mobile work now"), mobile-specific UI redesign is deferred to subsequent UI phases. Responsive CSS and phone bottom navigation remain functional.
- **Screen Content Modernization**: Existing screens (Bag, Forge, Market, Map/Boss, Hero sheet) are mounted unchanged inside the new shell; styling of screen interiors will occur in subsequent redesign missions (AGR1-AGR5).
