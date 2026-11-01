# Mission AGR1 Report: P1 Landing + Class picker + Home (stage)

**STATUS**: DONE

- **Branch**: `ai/antigravity-redesign-agr1`
- **Base commit**: `ea3da8c85a5486863403ea11c2d9172b416b332f` (`origin/main`)
- **Author**: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`
- **Tooling**: pnpm `10.28.0`, Node `v24.22.2`, Vite `8.3.5`

---

## 1. Executive Summary

Mission AGR1 implements the desktop UI redesign across three primary screens (Landing, Class Picker, and Home stage dashboard) aligned with the approved design direction (`reports/ui-redesign/index.html` and `reports/ui-redesign/BRIEF.md`).

- **Landing Page**: Full-width cozy scene using repo art (`BackdropView` ch1 background + `CatPortrait` Mochi sprite), live status badge ("Live on Avalanche Fuji"), game title ("A cat RPG that plays itself"), tagline, "Play as guest" primary CTA button, "Connect wallet" secondary action (`WalletButton` wrapper), and an Avalanche Fuji proof strip highlighting:
  - Relic NFT ERC-721 badge (`0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`)
  - Verified contract link on Routescan
  - Server-checked fights badge
  - Open source repository link
  - "Help & Guide" accessible trigger
- **Class Picker Screen**: Displays starter classes (Warrior, Guardian, Rogue) derived directly from `packages/game-rules` registry (`v2.CLASSES`), showing real class descriptions and baseline stats. Highlights selected class and provides a dynamic primary action button ("Start Adventure as [Class]" for new game or "Choose [Class]" when switching).
- **Home Stage Dashboard**: Replaced the previous single-stage view with a structured 3-column desktop dashboard:
  - **Left column**: Hero card (`HeroCard`) displaying cat name "Mochi", class, level, power rating, and live derived stats (`HP`, `ATK`, `Crit %`, `DEF`, `Speed`) calculated via `v2.deriveStats`; and Next-goal card (`NextGoalCard`) tracking current chapter monster hunt progress with a direct "Go to map" action (`data-testid="home-goal-map"`).
  - **Center column**: Centered Phaser canvas (`StageCanvas`, zero game logic altered) with the battle event log (`EventLog`) mounted directly beneath it, subscribing in real time to `LoopEventV2` events (`claimed`, `levelUp`, `roundUp`, `bossFight`, `forged`, etc.).
  - **Right column**: Recent finds card (`RecentLootCard`) displaying currency totals (Fish, Yarn, Keys) and latest loot drops with real item pixel icons (`ItemIcon`) and localized names.

---

## 2. Test Cases Matrix

| Test Case | Status | Concrete Evidence |
| :--- | :---: | :--- |
| **T1: Guest start works with no wallet** | **PASS** | Clicking "Play as guest" (`data-testid="landing-guest-button"`) invokes `onStartGuest` and transitions directly to the class picker without opening a wallet prompt or requiring an address. |
| **T2: Wallet connect button opens flow** | **PASS** | `WalletButton` rendered in secondary position inside `.landing__actions-secondary`. In non-wallet environments it renders `<a className="wallet-btn" href="https://core.app">Get a browser wallet</a>`; in wallet environments it invokes standard SIWE / wallet connection flow. Zero transaction completed. |
| **T3: Class choice persists after reload** | **PASS** | In Chromium live test: chosen "Rogue" was persisted to browser state; after full page reload, the active class remained Rogue and dashboard loaded directly into Home. |
| **T4: Home shows real state** | **PASS** | `HeroCard` displays derived stats from live `v2.deriveStats({ classId, level }, worn)` (e.g. Rogue Lv. 1 shows HP: 85, ATK: 5.4, Crit: 25%, DEF: 0, SPD: 1.1s). `NextGoalCard` displays chapter 1 progress (0 / 10 monsters). `RecentLootCard` displays real `state.currencies` (Fish, Yarn, Keys). `EventLog` logs game events. |
| **T5: Next-goal button navigates to Map** | **PASS** | Clicking "Go to map" (`data-testid="home-goal-map"`) on `NextGoalCard` invokes `handleSelectScreen('map')`, switching active view to `#panel-map` with Map screen active. |
| **T6: Viewport audit & effects test** | **PASS** | `node tools/ui-audit.mjs ../../reports/redesign/AGR1/audit bossReadyStrong` passed with **0 findings** across 18 screens at both 1280x720 and 1600x900 (0 document scroll, 0 horizontal overflow, 0 element overlap). `node tools/effects-test.mjs ../../reports/redesign/AGR1/effects` passed **9/9 checks, 0 FAIL**. |
| **T7: Existing art preserved; none removed** | **PASS** | Reused `BackdropView`, `CatPortrait`, and `ItemIcon` from `apps/web/src/art/`. `git diff --stat` against `origin/main` shows 0 deleted or renamed art files. |

---

## 3. Visual Evidence

Screenshots captured across viewports (1280x720 and 1600x900):

### Landing Page
- 1280x720: `reports/redesign/AGR1/audit/landing-1280x720.png`
- 1600x900: `reports/redesign/AGR1/audit/landing-1600x900.png`

### Class Picker Screen
- 1280x720: `reports/redesign/AGR1/audit/class-1280x720.png`
- 1600x900: `reports/redesign/AGR1/audit/class-1600x900.png`

### Home Stage Screen
- 1280x720: `reports/redesign/AGR1/audit/home-1280x720.png`
- 1600x900: `reports/redesign/AGR1/audit/home-1600x900.png`

Audit findings JSON: `reports/redesign/AGR1/audit/findings.json` (0 findings across 18 screens).
Effects test summary: `reports/redesign/AGR1/effects/summary.json` (9 checks passed).

---

## 4. Scope & Tiers

### Tier 1 (Zone Files Owned by AGR1)
- `apps/web/src/layout/LandingHero.tsx`: Full redesign with Fuji pill, full-width scene, title, guest CTA, wallet connect wrapper, and proof strip.
- `apps/web/src/layout/landing.css`: Landing styles with cozy theme tokens, button z-index protection, reduced motion support.
- `apps/web/src/layout/classpicker/ClassPicker.tsx`: Starter class list (`STARTER_CLASSES`), dynamic button text, directStart flow.
- `apps/web/src/layout/classpicker/ClassPicker.css`: 3-column card grid layout for starter classes.
- `apps/web/src/layout/home/HeroCard.tsx`: Cat hero overview card with live derived stats.
- `apps/web/src/layout/home/NextGoalCard.tsx`: Chapter progression card with "Go to map" CTA.
- `apps/web/src/layout/home/RecentLootCard.tsx`: Loot & currency overview with real icons.
- `apps/web/src/layout/home/EventLog.tsx`: Real-time combat event log under Phaser stage.
- `apps/web/src/layout/home/home.css`: 3-column desktop layout styling for Home screen.
- `apps/web/src/layout/StageLayout.tsx`: Mounting of Home dashboard components, LandingHero wiring, starter classes in ClassPicker, hashchange navigation.

### Tier 2 Changes (Adjacent Files & Tests)
- `apps/web/src/layout/classpicker/ClassPicker.test.tsx`: Added unit test covering 3 starter class cards rendering and directStart flow.
- `apps/web/src/layout/home/Home.test.tsx`: Added comprehensive unit tests for `HeroCard`, `NextGoalCard`, `RecentLootCard`, `EventLog`, and `LandingHero`.

### Untouched Files (Owned by Other Agents or Hard Stops)
- `apps/web/src/shell/*`: Untouched (owned by AGR0).
- `apps/web/src/layout/bag/*`: Untouched (owned by AGR2).
- `contracts/**`, `supabase/**`, `packages/game-rules/src/v2/config.ts`: Untouched (Tier 3 Hard Stops).

---

## 5. Verification Outputs

### pnpm version
```
10.28.0
```

### Frozen Install
```
CI=true pnpm install --frozen-lockfile
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 398ms using pnpm v10.28.0
```

### Deno Generation & Supabase Diff
```
pnpm gen:deno && git diff --exit-code -- supabase/functions
wrote 18 Edge Function import maps
(exit code 0 - clean)
```

### TypeScript Check
```
pnpm typecheck
Scope: 6 of 7 workspace projects
packages/auth typecheck: Done in 1.4s
packages/chain typecheck: Done in 2.6s
packages/game-rules typecheck: Done in 3.1s
supabase/tests typecheck: Done in 3.8s
packages/api-contract typecheck: Done in 606ms
apps/web typecheck: Done in 5.5s
(exit code 0 - clean)
```

### Linter Check
```
pnpm lint
Scope: 6 of 7 workspace projects
packages/chain lint: Done in 442ms
packages/game-rules lint: Done in 971ms
packages/auth lint: Done in 1.1s
supabase/tests lint: Done in 1.7s
packages/api-contract lint: Done in 428ms
apps/web lint: Done in 4.6s
(exit code 0 - clean)
```

### Vitest Unit Tests
```
pnpm test
packages/auth: 2 test files passed (7 tests)
packages/chain: 2 test files passed (7 tests)
packages/game-rules: 24 test files passed (366 tests)
supabase/tests: 18 test files passed
packages/api-contract: 1 test file passed (16 tests)
apps/web: 111 test files passed (1,292 tests)
(exit code 0 - 100% green)
```

### Production Builds
```
pnpm build
✓ built in 369ms (exit code 0)

VITE_GAME_V2=0 pnpm --filter @taskbar-hero/web build
✓ built in 370ms (exit code 0)
```

### UI Audit
```
cd apps/web && node tools/ui-audit.mjs ../../reports/redesign/AGR1/audit bossReadyStrong
18 screens audited; 0 with findings.
JSON: reports/redesign/AGR1/audit/findings.json
(exit code 0)
```

### Effects Test
```
cd apps/web && node tools/effects-test.mjs ../../reports/redesign/AGR1/effects
9 checks, 0 FAIL.
(exit code 0)
```

---

## 6. What is NOT VERIFIED
- Live blockchain transactions (e.g. executing real on-chain minting or marketplace purchasing) were intentionally not completed, in accordance with the mission's Tier 3 hard-stop instructions ("Draft PR only: no merge, no Actions changes, no deploy, no live writes, no transaction"). The wallet connection button and install link trigger correctly without submitting transactions.
