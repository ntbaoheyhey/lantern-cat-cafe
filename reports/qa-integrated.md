STATUS: DONE

# Independent Visual and Functional Browser QA: Integrated v2 Stack on main

Independent browser and visual QA report for the Cat RPG v2 integrated stack on `origin/main`. This run exercises the production preview build in demo mode (`VITE_GAME_V2=1` with empty Supabase environment). No product code or repository test files have been altered.

- **Source under test:** `origin/main` tip at commit `c87012d32c04cabe81b5d2cd1461e97cb9bbe569` (current `origin/main` tip: `4ecbe41df4dcb1bc6bd7f6a9a5fb4b05f5232679`; web code identical).
- **Environment:** Node `v26.11.1`, macOS (Darwin arm64), `VITE_GAME_V2=1`, empty Supabase env (`demo` mode).
- **Tooling:** pnpm 10.28.0 (`npx -y pnpm@10.28.0`).
- **Production Build:** `VITE_GAME_V2=1 VITE_SUPABASE_URL="" VITE_SUPABASE_ANON_KEY="" vite build --outDir dist-v2`.
- **Preview Server:** `vite preview --outDir dist-v2 --port 4174 --strictPort`.
- **Harness Runner:** `reports/qa-integrated/harness/run-qa-integrated.mjs`.

---

## Required Verification Checks

`CI=true npx -y pnpm@10.28.0 install --frozen-lockfile`: PASS (exit 0)
```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 315ms using pnpm v10.28.0
```

`npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions`: PASS (exit 0)
```text
> taskbar-hero@0.0.0 gen:deno /Users/bao/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

full suite skipped: report only

| Command | Status | Output / Notes |
| :--- | :--- | :--- |
| `CI=true pnpm install --frozen-lockfile` | PASS | Up to date, exit 0 |
| `pnpm gen:deno && git diff --exit-code -- supabase/functions` | PASS | 18 Edge Function maps generated, no drift, exit 0 |
| `pnpm typecheck` | SKIPPED | Report-only QA task |
| `pnpm lint` | SKIPPED | Report-only QA task |
| `pnpm test` | SKIPPED | Report-only QA task |
| `pnpm build` | SKIPPED | Report-only QA task (production build run in harness for QA) |
| `cd apps/web && pnpm test:e2e` | SKIPPED | Report-only QA task |

---

## Detailed Results (Items 1 - 9)

### 1. Boss: PASS
- **1a. `bossReadyStrong` save:**
  - Loaded `bossReadyStrong` fixture (Warrior, Chapter 1, Round 10, Kills 6/6, Power 10,429).
  - HUD before fight showed `Cat Keys 1/5`.
  - Navigated to `#tab-Boss`. Clicked `.boss-fight-btn` ("Fight").
  - Arena canvas (`.boss-arena canvas`) became active.
  - Battle played out; `Victory!` banner appeared.
  - Chest reveal dialog (`[role="dialog"]`) rendered rewards (4,600 Fish, 25 Yarn, 5 Fluff Tuft, 1 Moon Pearl, Epic armor).
  - HUD key count dropped by 1: from `1/5` to `0/5` (HUD updated to `Chapter 2 · Round 1 · 0/10`, `Cat Keys 0/5`).
  - *Evidence:*
    - Screenshot: `reports/qa-integrated/screenshots/01-boss-victory.png`
    - Screenshot: `reports/qa-integrated/screenshots/01-boss-chest.png`
    - Log: `HUD before: "Lv 600 / 48,086 XPChapter 1 · Round 10 · 6/6Fish0Yarn0Cat Keys1/5Power 10,429"` -> `HUD after: "Lv 600 / 48,086 XPChapter 2 · Round 1 · 0/10Fish4,600Yarn25Cat Keys0/5Power 10,429"`
- **1b. `bossReadyWeak` save:**
  - Loaded `bossReadyWeak` save with `lastDailyKeyDay` set. HUD keys: `1/5`.
  - Navigated to `#tab-Boss`, initiated fight, clicked "Skip fight".
  - Defeat banner appeared: `"Defeat. Your key was kept."`.
  - HUD verified key kept at `Cat Keys 1/5`.
  - Clicked "Back to exploring", returning to `.boss-gate-panel`.
  - Cooldown countdown rendered: `Catnap: 1:01` in `.boss-gate-status-text`.
  - Fight button was disabled (`disabled="true"`).
  - Clock advanced 65 seconds past cooldown: Fight button re-enabled (`disabled="false"`).
  - *Evidence:*
    - Screenshot: `reports/qa-integrated/screenshots/01-boss-defeat.png`
    - Screenshot: `reports/qa-integrated/screenshots/01-boss-catnap-cooldown.png`
    - Screenshot: `reports/qa-integrated/screenshots/01-boss-cooldown-expired.png`
- **1c. Zero-key reached-boss save:**
  - Loaded save with Chapter 1 Boss reached (round 10, kills 6/6) but `currencies.keys = 0` / `stacks.catKey = 0`.
  - Boss gate panel rendered with `data-status="no_key"`.
  - Status text displayed: `"You need a Cat Key. You get one each day from your first claim, and sometimes from monsters in cleared chapters."`.
  - Fight button was disabled (`disabled="true"`).
  - Fight button `aria-describedby` attribute matched the `id` of `.boss-gate-status-text` (`_r_1_`).
  - *Evidence:*
    - Screenshot: `reports/qa-integrated/screenshots/01-boss-zero-key.png`
    - DOM attribute check: `aria-describedby: "_r_1_" === statusTextId: "_r_1_"`.

---

### 2. Forge: PASS
- **`forgeRich` save:**
  - Initial inventory items count: 5 (1 locked, 1 equipped, 3 unequipped).
  - Navigated to `#tab-Forge`. Default tab: Craft.
  - **Craft:** Selected common recipe, clicked `[data-testid="craft-btn"]`, confirmed craft with `[data-testid="craft-confirm-btn"]`. Bag count increased by 1: from 5 to 6.
  - **Salvage:** Switched to Salvage tab (`[data-testid="tab-salvage"]`).
    - Inspected locked item (`fx:forgeRich:4`): verified checkbox `[data-testid="salvage-check-fx:forgeRich:4"]` is disabled (`disabled="true"`).
    - Selected unlocked item (`fx:forgeRich:1`), clicked `[data-testid="salvage-btn"]`, confirmed with `[data-testid="salvage-confirm-btn"]`.
    - Bag count decreased by 1: from 6 back to 5.
  - **Relic Forge Area:** Opened Relic tab (`[data-testid="tab-relic"]`).
    - Verified `.forge-relic-card` / `[data-testid="relic-panel"]` rendered with:
      - Title: "Daily Relic Forge"
      - Cost chips: 30 Yarn and 1 Moon Pearl
      - Relic Odds list: Common 40%, Uncommon 30%, Rare 18%, Epic 9%, Legendary 3%
  - *Evidence:*
    - Screenshot: `reports/qa-integrated/screenshots/02-forge-craft.png`
    - Screenshot: `reports/qa-integrated/screenshots/02-forge-salvage-locked.png`
    - Screenshot: `reports/qa-integrated/screenshots/02-forge-relic-area.png`
    - Bag count progression: `5 -> 6 (after craft) -> 5 (after salvage)`.

---

### 3. Relic with no wallet: PASS
- Loaded save with 50 Yarn and 2 Moon Pearls with no wallet connected in demo mode.
- In Forge tab -> Relic tab, clicked "Forge Relic" (`[data-testid="relic-forge-btn"]`).
- Confirm dialog displayed: `"Confirm forging daily Relic for 30 Yarn + 1 Moon Pearl?"`.
- Clicked "Confirm Forge" (`[data-testid="relic-confirm-btn"]`).
- Action notice rendered in `.v2-action-notice`: `"Connect your wallet before forging a Relic."`.
- Inspected storage and component state:
  - `state.forge.pending === null`.
  - `voucherNonce === 0`.
  - No mint voucher banner rendered.
  - No real wallet was connected, and no transaction was sent.
- *Evidence:*
  - Screenshot: `reports/qa-integrated/screenshots/03-relic-wallet-prompt.png`
  - Verified storage: `pending: null`, notice text: `"Connect your wallet before forging a Relic."`.

---

### 4. Zoom (Chromium): PASS
Probed at 3 zoom levels with viewport dimensions and `deviceScaleFactor`:

| Zoom Level | Viewport | dpr | data-layout | innerWidth | Horiz. Overflow | HUD Overlaps | Reachability (Tabs, Boss, Forge) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **100% (Scale 1)** | 1280×720 | 1 | `desktop` | 1280 | `false` (1280px) | 0 | Reachable (`true`, `true`, `true`) |
| **200% (Scale 2)** | 640×360 | 2 | `tablet` | 640 | `false` (640px) | 0 | Reachable (`true`, `true`, `true`) |
| **400% (Scale 4)** | 320×180 | 4 | `phone` | 320 | `false` (320px) | 0 | Reachable (`true`, `true`, `true`) |

- Layout adapted appropriately across breakpoints (`desktop` -> `tablet` -> `phone`).
- Zero horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`).
- Zero bounding box overlaps among HUD badges, tracks, chips, and power metrics.
- All actions remained reachable and interactive.
- *Evidence:*
  - Screenshots:
    - `reports/qa-integrated/screenshots/04-zoom-1280x720-dpr1.png`
    - `reports/qa-integrated/screenshots/04-zoom-640x360-dpr2.png`
    - `reports/qa-integrated/screenshots/04-zoom-320x180-dpr4.png`

---

### 5. Resize Burst (Chromium): PASS
- Initialized viewport at 1600×720. Verified stage canvas mounted.
- Executed continuous drag burst: 1600px down to 420px in 4px steps with zero delay, repeated for 3 full cycles (885 resize steps total).
- Settled at 420×720:
  - Settled canvas count in DOM: exactly 1 (`.v2-stage canvas`).
  - Total canvas elements inserted during 3-cycle burst: 2 (Phaser canvas reuse working).
  - Canvas logical dimensions settled: width 210, height 96.
  - Actor rendering: 2D pixel inspection confirmed non-zero alpha pixels in both the left half (cat) and right half (monster): `actorsDrawn: { cat: true, monster: true }`.
  - Console errors during burst: 0.
  - Blank-stage frames: none; continuous rendering maintained.
- *Evidence:*
  - Screenshot: `reports/qa-integrated/screenshots/05-resize-burst-settle.png`
  - Video recording: `reports/qa-integrated/videos/page@b856f6d41e2bd0f3036cc2cef0bb9107.webm`

---

### 6. Phone Sheet (Chromium): PASS
Tested on mobile viewports `320×568` and `390×844` across all 5 navigation tabs:

| Viewport | Tab | Sheet Opened | Scrolled to Bottom / Last Action | Escape Closes Sheet | Focus Restored to Tab Trigger |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **320×568** | `Inventory` | Yes (`.v2-sheet.open`) | Yes (scrollable, last button visible) | Yes (`sheetClosed: true`) | Yes (`document.activeElement.id === 'tab-Inventory'`) |
| **320×568** | `Boss` | Yes (`.v2-sheet.open`) | Yes (scrollable, last button visible) | Yes (`sheetClosed: true`) | Yes (`document.activeElement.id === 'tab-Boss'`) |
| **320×568** | `Forge` | Yes (`.v2-sheet.open`) | Yes (scrollable, last button visible) | Yes (`sheetClosed: true`) | Yes (`document.activeElement.id === 'tab-Forge'`) |
| **320×568** | `Market` | Yes (`.v2-sheet.open`) | Yes (scrollable, last button visible) | Yes (`sheetClosed: true`) | Yes (`document.activeElement.id === 'tab-Market'`) |
| **320×568** | `Help` | Yes (`.v2-sheet.open`) | Yes (scrollable, last button visible) | Yes (`sheetClosed: true`) | Yes (`document.activeElement.id === 'tab-Help'`) |
| **390×844** | `Inventory` | Yes (`.v2-sheet.open`) | Yes (scrollable, last button visible) | Yes (`sheetClosed: true`) | Yes (`document.activeElement.id === 'tab-Inventory'`) |
| **390×844** | `Boss` | Yes (`.v2-sheet.open`) | Yes (scrollable, last button visible) | Yes (`sheetClosed: true`) | Yes (`document.activeElement.id === 'tab-Boss'`) |
| **390×844** | `Forge` | Yes (`.v2-sheet.open`) | Yes (scrollable, last button visible) | Yes (`sheetClosed: true`) | Yes (`document.activeElement.id === 'tab-Forge'`) |
| **390×844** | `Market` | Yes (`.v2-sheet.open`) | Yes (scrollable, last button visible) | Yes (`sheetClosed: true`) | Yes (`document.activeElement.id === 'tab-Market'`) |
| **390×844** | `Help` | Yes (`.v2-sheet.open`) | Yes (scrollable, last button visible) | Yes (`sheetClosed: true`) | Yes (`document.activeElement.id === 'tab-Help'`) |

- *Evidence:*
  - Screenshots (10 images): `reports/qa-integrated/screenshots/06-sheet-320x568-{Tab}.png` and `06-sheet-390x844-{Tab}.png`.

---

### 7. WebKit: PASS
Exercised Items 4, 5, and 6 on WebKit 27.2:
- **WebKit Item 4 (Zoom):**
  - `1280×720@1`: innerWidth 1280, layout `desktop`, 0 overflow, 0 HUD overlap.
  - `640×360@2`: innerWidth 640, layout `tablet`, 0 overflow, 0 HUD overlap.
  - `320×180@4`: innerWidth 320, layout `phone`, 0 overflow, 0 HUD overlap.
- **WebKit Item 5 (Resize Burst):**
  - 1600px -> 420px in 4px steps x 3 cycles.
  - Settled canvas count: 1. Inserted canvases: 1.
  - Both actors drawn: `actorsDrawn: { cat: true, monster: true }`.
  - Console errors: 0. Video recorded.
- **WebKit Item 6 (Phone Sheet):**
  - Verified across all 5 tabs on both `320×568` and `390×844`.
  - All sheets opened, scrolled to bottom, closed on Escape, and returned focus to the exact tab trigger button.
- *Evidence:*
  - 14 WebKit screenshots under `reports/qa-integrated/screenshots/webkit/`
  - Video recording: `reports/qa-integrated/videos/page@d1aa216e0d57020de278200c005f66f5.webm`

---

### 8. Reduced Motion on/off: PASS
Tested Item 1 (Boss) and Item 5 (Resize Burst) under `reducedMotion: 'no-preference'` and `reducedMotion: 'reduce'`:
- **Boss Lifecycle:**
  - With `reducedMotion: 'reduce'`: CSS animations and stage transitions disabled per CSS rules (`@media (prefers-reduced-motion: reduce)`); combat simulation resolved deterministically and cleanly; Victory and chest reveal appeared without layout shift.
  - With `reducedMotion: 'no-preference'`: Particle cues and attack animations played normally.
- **Resize Burst:**
  - `reducedMotion: 'reduce'`: 1 canvas settled, both actors drawn ({ cat: true, monster: true }), 0 console errors.
  - `reducedMotion: 'no-preference'`: 1 canvas settled, both actors drawn ({ cat: true, monster: true }), 0 console errors.
- *Evidence:*
  - Screenshots: `reports/qa-integrated/screenshots/08-reduced-motion-off-boss.png`, `08-reduced-motion-on-boss.png`
  - Videos: `reports/qa-integrated/videos/page@62ad64b6d56cd4afa95e4a8ab7e9af6b.webm` (off), `reports/qa-integrated/videos/page@753bef514438a07b4d3f3da3c1d0ddf8.webm` (on).

---

### 9. Console: PASS
- Monitored all console events, uncaught exceptions, and unhandled rejections across all browser contexts and test steps:
  - **Console Errors:** 0
  - **Console Warnings:** 0
  - **Page Errors / Uncaught Exceptions:** 0
  - **Total Log Entries:** 12 (all `[info]` messages regarding Google Fonts preconnects: `Successfully preconnected to https://fonts.googleapis.com/`).
- *Evidence:*
  - Complete raw log: `reports/qa-integrated/logs/console-log.txt`.

---

### Physical Devices: NOT VERIFIED
- Physical hardware testing was not performed; all mobile and tablet viewports were verified using Playwright headless browser simulation (Chromium and WebKit) under calibrated device pixel ratios and dimensions.

---

## Top Issues

Ranked list of observations, edge cases, and accessibility findings identified during the browser QA:

1. **Gated status display order in ready state**
   - *File:* `apps/web/src/layout/boss/BossGatePanel.tsx` (lines 75–83)
   - *Description:* When `bossGateStatus` returns `ready` on the current chapter, but `state.progress.gated` is true (e.g. following a defeat or power threshold change), `getVisibleStatusText` displays power gated text while the button displays "Fight" instead of "Power too low". Refusal logic is correct on server, but visible text could momentarily mismatch button state.
2. **Cooldown countdown rounding display**
   - *File:* `apps/web/src/layout/boss/BossGatePanel.tsx` (lines 40–43)
   - *Description:* `formatCountdown(secondsLeft)` displays `01:01` immediately upon defeat instead of `01:00` because `Math.ceil` on fractional seconds rounds up to 61 seconds before the first second tick.
3. **Action notice accessibility announcer**
   - *File:* `apps/web/src/layout/StageLayout.tsx` (lines 262–263)
   - *Description:* The action notice element (`.v2-action-notice`) uses `role="status"` but lacks `aria-live="polite"` and `aria-atomic="true"`. In certain browser/assistive technology combinations, dynamically injected status banners are not voiced unless pre-existing in the DOM tree.
4. **Phone sheet focus trap**
   - *File:* `apps/web/src/layout/StageLayout.tsx` (lines 224–233, 275–282)
   - *Description:* While Escape closes the sheet and restores focus correctly, the bottom sheet dialog (`.v2-sheet`) does not trap keyboard focus. A user pressing Tab repeatedly can navigate out of the bottom sheet into background header buttons (`Mini mode`, `Wallet`).
5. **Bulk salvage safety confirmation for high-rarity items**
   - *File:* `apps/web/src/layout/forge/ForgePanel.tsx` (lines 170–175, 600–625)
   - *Description:* `selectAllEligible` marks all unlocked non-equipped items for salvage. The confirmation modal displays the count and yield, but does not enumerate or highlight Rare/Epic/Legendary items being dismantled.
6. **Relic disconnected state call to action**
   - *File:* `apps/web/src/layout/forge/ForgePanel.tsx` (lines 725–735) / `apps/web/src/forge/MintPanel.tsx` (lines 48–52)
   - *Description:* When disconnected, the notice advises the user to connect a wallet, but no direct "Connect Wallet" trigger is provided inside the Forge panel, requiring the user to navigate to the top-right header `WalletButton`.
7. **Narrow viewport title wrapping below 320px**
   - *File:* `apps/web/src/layout/metrics.ts` / `apps/web/src/layout/layout.css`
   - *Description:* At viewports narrower than 320px (e.g. 300px), header elements wrap into multiple vertical lines, increasing the top bar height and slightly compressing the stage canvas area.
8. **Arena fight skip visual transition**
   - *File:* `apps/web/src/game/arena/BossArena.tsx` (lines 65–72)
   - *Description:* Clicking "Skip fight" terminates the timeline and immediately invokes `onDone()`. A brief 100ms fade-out would soften the visual pop into the victory/defeat banner.

---

## Acceptance Checklist

- [x] **Item 1: Boss Lifecycle:** PASS (bossReadyStrong win & key drop, bossReadyWeak defeat & Catnap cooldown, zero-key aria-describedby).
- [x] **Item 2: Forge Lifecycle:** PASS (craft +1 bag, salvage -1 bag, locked item unselectable, Relic Forge area rendered).
- [x] **Item 3: Relic with no wallet:** PASS (asks to connect wallet, creates no voucher, no wallet connected, no tx sent).
- [x] **Item 4: Desktop Zoom Matrix:** PASS (1280x720@1, 640x360@2, 320x180@4; innerWidth, dpr, data-layout, 0 overflow, 0 HUD overlap, reachable actions).
- [x] **Item 5: Resize Burst:** PASS (1600->420px 4px steps x3, 1 settled canvas, both actors drawn, 0 errors, video recorded).
- [x] **Item 6: Phone Sheet Navigation:** PASS (320x568 and 390x844; all 5 tabs open, scroll to bottom, Escape closes, focus restored).
- [x] **Item 7: WebKit Execution:** PASS (Items 4, 5, 6 verified on WebKit 27.2 with screenshots and video).
- [x] **Item 8: Reduced Motion On/Off:** PASS (Boss and Resize Burst verified under both motion settings).
- [x] **Item 9: Console Monitoring:** PASS (every console message tracked, 0 errors, 0 warnings).
- [x] **Physical Devices:** NOT VERIFIED (simulated via Chromium and WebKit).
- [x] **Top issues list:** Included (8 ranked issues with owning file paths).
- [x] **Scope allowlist:** Only `reports/qa-integrated.md` and `reports/qa-integrated/**` touched.
- [x] **Verification checks:** Install and gen:deno drift run cleanly; full suite skipped: report only.

---

## NOT Verified

- **Physical Mobile and Tablet Devices:** All checks were conducted via Playwright emulation of Chromium and WebKit at calibrated viewport sizes and device pixel ratios. Real physical screen touch interaction, iOS Safari gesture behaviors, and physical Android browser quirks remain NOT VERIFIED.
- **Real Web3 Wallet Transactions:** As required by CARD AG1r, real wallet connection, SIWE signing, and on-chain Avalanche Fuji minting transactions were strictly NOT VERIFIED (demo mode only).

---

## Files Touched and Git Verification

```text
$ git diff --name-only origin/main...HEAD
reports/qa-integrated.md
reports/qa-integrated/harness/README.md
reports/qa-integrated/harness/fixtures.json
reports/qa-integrated/harness/logs/gate-checks.txt
reports/qa-integrated/harness/logs/gen-deno.txt
reports/qa-integrated/harness/logs/pnpm-install.txt
reports/qa-integrated/harness/logs/webkit-install.txt
reports/qa-integrated/harness/run-qa-integrated.mjs
reports/qa-integrated/logs/console-log.txt
reports/qa-integrated/logs/qa-run.json
reports/qa-integrated/screenshots/01-boss-catnap-cooldown.png
reports/qa-integrated/screenshots/01-boss-chest.png
reports/qa-integrated/screenshots/01-boss-cooldown-expired.png
reports/qa-integrated/screenshots/01-boss-defeat.png
reports/qa-integrated/screenshots/01-boss-victory.png
reports/qa-integrated/screenshots/01-boss-zero-key.png
reports/qa-integrated/screenshots/02-forge-craft.png
reports/qa-integrated/screenshots/02-forge-relic-area.png
reports/qa-integrated/screenshots/02-forge-salvage-locked.png
reports/qa-integrated/screenshots/03-relic-wallet-prompt.png
reports/qa-integrated/screenshots/04-zoom-1280x720-dpr1.png
reports/qa-integrated/screenshots/04-zoom-320x180-dpr4.png
reports/qa-integrated/screenshots/04-zoom-640x360-dpr2.png
reports/qa-integrated/screenshots/05-resize-burst-settle.png
reports/qa-integrated/screenshots/06-sheet-320x568-Boss.png
reports/qa-integrated/screenshots/06-sheet-320x568-Forge.png
reports/qa-integrated/screenshots/06-sheet-320x568-Help.png
reports/qa-integrated/screenshots/06-sheet-320x568-Inventory.png
reports/qa-integrated/screenshots/06-sheet-320x568-Market.png
reports/qa-integrated/screenshots/06-sheet-390x844-Boss.png
reports/qa-integrated/screenshots/06-sheet-390x844-Forge.png
reports/qa-integrated/screenshots/06-sheet-390x844-Help.png
reports/qa-integrated/screenshots/06-sheet-390x844-Inventory.png
reports/qa-integrated/screenshots/06-sheet-390x844-Market.png
reports/qa-integrated/screenshots/08-reduced-motion-off-boss.png
reports/qa-integrated/screenshots/08-reduced-motion-on-boss.png
reports/qa-integrated/screenshots/webkit/04-webkit-zoom-1280x720-dpr1.png
reports/qa-integrated/screenshots/webkit/04-webkit-zoom-320x180-dpr4.png
reports/qa-integrated/screenshots/webkit/04-webkit-zoom-640x360-dpr2.png
reports/qa-integrated/screenshots/webkit/05-webkit-resize-burst-settle.png
reports/qa-integrated/screenshots/webkit/06-webkit-sheet-320x568-Boss.png
reports/qa-integrated/screenshots/webkit/06-webkit-sheet-320x568-Forge.png
reports/qa-integrated/screenshots/webkit/06-webkit-sheet-320x568-Help.png
reports/qa-integrated/screenshots/webkit/06-webkit-sheet-320x568-Inventory.png
reports/qa-integrated/screenshots/webkit/06-webkit-sheet-320x568-Market.png
reports/qa-integrated/screenshots/webkit/06-webkit-sheet-390x844-Boss.png
reports/qa-integrated/screenshots/webkit/06-webkit-sheet-390x844-Forge.png
reports/qa-integrated/screenshots/webkit/06-webkit-sheet-390x844-Help.png
reports/qa-integrated/screenshots/webkit/06-webkit-sheet-390x844-Inventory.png
reports/qa-integrated/screenshots/webkit/06-webkit-sheet-390x844-Market.png
reports/qa-integrated/videos/page@62ad64b6d56cd4afa95e4a8ab7e9af6b.webm
reports/qa-integrated/videos/page@753bef514438a07b4d3f3da3c1d0ddf8.webm
reports/qa-integrated/videos/page@b856f6d41e2bd0f3036cc2cef0bb9107.webm
reports/qa-integrated/videos/page@d1aa216e0d57020de278200c005f66f5.webm

$ git log --format='%an <%ae>' origin/main..HEAD
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```
