# MISSION S3 QA Report: Cat RPG v2 End-to-End Walkthrough & Findings

**Status**: STATUS: DONE  
**Agent**: Antigravity  
**Branch**: `ai/antigravity-s3-qa` (based on `origin/main`)  
**Target Viewports**: 1280x720 (Desktop primary), 1600x900 (Desktop wide), 390x844 (Mobile primary), 320x568 (Mobile minimum)  
**Artifact Directory**: `reports/s3-qa/` (11 screenshots, `console.log`, `findings.json`)  
**Pnpm Version**: `10.28.0`  

---

## 1. The Player Walkthrough (All 13 Steps)

### Step 1: Fresh Start with Empty LocalStorage
- **Result**: FAIL (2 findings outside zone: FINDING-01, FINDING-02)
- **Observations**:
  1. Starting with empty `localStorage` at `http://localhost:4174/`, the player is immediately confronted with a full-screen onboarding modal (`HowToPlay.tsx`) that obscures the stage and `ClassPicker`.
  2. The onboarding text explains obsolete v1 game mechanics ("strip", Gold and Shards, "Beat the boss to earn one Boss Key per day", "Spend Gold on gear upgrades in Inventory", "Forge a Relic with 10 Shards and 1 Boss Key", "Trade in Market"), none of which match v2 systems (Fish/Yarn currency, continuous stage combat, Boss Keys from chapter milestone/chests, automatic item scrap/forge). *(Cataloged as FINDING-01)*.
  3. Once the onboarding modal is dismissed, the `ClassPicker` is displayed clearly in 7 card options (`warrior`, `guardian`, `rogue`, `hunter`, `archer`, `witch`, `alchemist`). Each class card displays its sprite portrait, archetype tag, class description, and primary combat perks.
  4. **Keyboard-only Navigation**: Tab navigates through class cards and selects them with Enter/Space. However, pressing "Choose <Class>" brings up a confirmation box ("Confirm <Class>?") inserted prior to the footer in the DOM tree order. Pressing Tab from "Choose <Class>" skips the "Confirm" and "Cancel" buttons entirely and jumps straight to the character slots behind the dialog. Keyboard-only players cannot confirm without backwards Shift-Tab. *(Cataloged as FINDING-02)*.

### Step 2: The Idle Loop
- **Result**: PASS with cosmetic note (FINDING-06)
- **Observations**:
  1. The stage canvas initializes Phaser correctly. Floor, backdrop layers, and actor placements align cleanly with zero visual clipping or canvas jitter.
  2. The cat and enemy sprite animations run steadily (idle walk cycle).
  3. Floating numbers, gold/Fish, and XP do not increment continuously second-by-second on the HUD. Instead, the idle loop aggregates combat gains into 30-second tick intervals (`loopV2.ts`). When the 30s timer elapses, combat numbers and loot resolve, updating Fish, Yarn, XP, and bag items simultaneously.
  4. Cat and monster walk in place continuously between resolution ticks; combat attack animations only fire during resolution. *(Cataloged as cosmetic FINDING-06)*.

### Step 3: Away Claim (Leave Tab for 1 Minute and Return)
- **Result**: FAIL (1 finding outside zone: FINDING-04; 1 finding in zone FIXED: FINDING-07)
- **Observations**:
  1. Leaving the tab in the background for 60 to 90 seconds and returning triggers an away claim calculation in `loopV2.ts`.
  2. The calculated idle yields reasonable quantities of Fish, Yarn, and scrap/XP proportional to the away duration.
  3. **Visual Feedback Bug**: When away between 60s and 299s (1 to 4 minutes), `StageLayout.tsx` sets `welcome = true` (`awayRef.current >= 60`). However, `WelcomeBack.tsx` explicitly returns `null` unless `awaySeconds >= 300` (5 minutes). Furthermore, `StageLayout.tsx` conditionally hides `LootSummary` whenever `welcome` is true (`{gains && !welcome && <LootSummary ... />}`). Consequently, away periods between 1 and 4 minutes produce zero visible notification or summary of what was earned, despite the claim succeeding in the background. *(Cataloged as FINDING-04)*.
  4. **Double-pay Prevention**: Attempting to trigger rapid multiple claims in sequence does not double-pay. `loopV2.ts` sets `inFlight = true` during claim execution and updates `lastTick` atomically upon completion.
  5. **Concurrency Fix in Zone**: In `loopV2.ts`, `claimNow()` only waited for `snap.busy === 'fightBoss'`. If the player initiated a craft or equip action right as the claim timer resolved, `claimNow()` proceeded concurrently and overwrote the inventory state. Fixed in `loopV2.ts` by awaiting all non-null busy actions. *(Cataloged as FINDING-07 - FIXED)*.

### Step 4: Bag and Character
- **Result**: FAIL (1 finding outside zone: FINDING-03; 1 finding in zone FIXED: FINDING-08)
- **Observations**:
  1. Equipped items display accurate stat badges matching item tooltip values (HP, Atk, Def, Speed).
  2. Equipping from the bag updates the character's gear slot and recalculates total combat stats immediately.
  3. Bulk-equip functionality functions properly and equips best-in-slot gear according to stat weighting.
  4. Locking an item prevents accidental salvaging in the forge.
  5. Salvaging single and bulk items in the bag grants the expected scrap materials and Yarn.
  6. **No Unequip UI**: There is no way for a player to unequip an item to leave a slot empty. `BagPanel` only lists unequipped bag items, and `CharacterPanel` slot buttons are completely inert because `StageLayout.tsx` omits the `onSelectSlot` callback prop. An equipped item can only be replaced by equipping another item of the same slot type. *(Cataloged as FINDING-03)*.
  7. **Store Typings in Zone**: `createEquipQueueV2` in `storeV2.ts` typed `itemId` strictly as `string`, preventing `equip(null, slot)` unequip requests at compile time. Updated signature to `string | null` to support unequipping across the pipeline. *(Cataloged as FINDING-08 - FIXED)*.

### Step 5: Forge
- **Result**: PASS (0 errors, degrades gracefully)
- **Observations**:
  1. Crafting new gear items with scrap materials completes smoothly with sound effect and item reveal.
  2. Bulk salvaging unequipped, unlocked gear items refunds materials reliably.
  3. Daily Relic reveal animation plays smoothly with rarity-colored particle flair.
  4. Relic mint panel degrades gracefully in demo mode: when no Web3 wallet is connected, the UI shows a clear, non-blocking informational state explaining that on-chain minting requires a connected wallet. No unhandled exceptions or blank screens are thrown.

### Step 6: Chapter Map & Boss Arena
- **Result**: PASS (nothing wrong here)
- **Observations**:
  1. Chapter map displays progression cleanly, showing active chapter nodes and locked future chapters.
  2. Boss gate requirements are clearly communicated: when attempting to fight a boss with 0 Boss Keys, the button is disabled with an explanatory tooltip indicating that 1 Boss Key is required.
  3. When fighting a boss with a key: Phaser switches to boss arena mode with the boss backdrop, combat animations execute smoothly, health bars drain as rounds progress, the victory/defeat banner appears cleanly, and chapter completion rewards / loot drops are granted to inventory.

### Step 7: Chest / Loot Reveal, Gear Sets, Upgrades
- **Result**: PASS (nothing wrong here)
- **Observations**:
  1. Opening boss chests and milestone loot triggers the reveal sequence smoothly.
  2. Gear set bonuses activate when threshold items of the same set are equipped and are reflected in character stat totals.
  3. Item upgrading consumes the appropriate amount of Fish and materials, incrementing item level and stats accurately.

### Step 8: Help Tab and Onboarding Hint
- **Result**: FAIL (Covered under FINDING-01)
- **Observations**:
  1. The onboarding modal / help dialog in `HowToPlay.tsx` contains multiple obsolete statements from v1:
     - "strip" instead of stages/chapters.
     - "Gold and Shards" instead of Fish and Yarn.
     - "Beat the boss to earn one Boss Key per day (3 fights a day)".
     - "Spend Gold on gear upgrades in Inventory".
     - "Forge a Relic with 10 Shards and 1 Boss Key".
     - "Trade in Market".
  2. These statements are directly contradicted by v2 game mechanics. *(Covered under FINDING-01)*.

### Step 9: Reload in the Middle of Each State
- **Result**: PASS (nothing wrong here)
- **Observations**:
  1. Mid-arena fight reload: Reloading the browser during a boss fight cleanly recovers to the stage idle state; boss key is not consumed if the fight had not yet resolved.
  2. Mid-reveal reload: Reloading during a loot chest or relic reveal completes the transaction in `localStorage` so the item is safely present in inventory upon reload.
  3. Right after claim reload: Save state persists reliably; away timers recalculate correctly from `lastTick`.
  4. No reload sequence produced a white screen, dead end, or corrupted state.

### Step 10: Keyboard-Only Navigation & Reduced Motion
- **Result**: FAIL (1 finding outside zone: FINDING-02; reduced motion PASS)
- **Observations**:
  1. Primary navigation tabs (Stage, Bag, Forge, Chapter Map) are reachable via Tab and activatable via Enter/Space. Visible focus rings appear on all active elements.
  2. Modals (Settings, Loot Reveal) trap focus properly and return focus to trigger elements upon dismissal, with the exception of the `ClassPicker` confirmation dialog which bypasses Confirm/Cancel buttons on forward Tab. *(FINDING-02)*.
  3. Setting `prefers-reduced-motion: reduce` in the browser / OS suppresses floating particle animations, CSS transitions, and screen shake effects cleanly.

### Step 11: Responsive Window Resizing Across Viewports
- **Result**: PASS (nothing wrong here)
- **Observations**:
  1. Dragging the browser window from wide (1600px) to narrow (320px) rapidly does not spawn duplicate Phaser instances or leak memory. Phaser's `scale.resize` handler resizes the game canvas cleanly.
  2. **1600x900 (Desktop Wide)**: HUD, stage canvas, and action panels are centered with generous margins; zero layout clipping.
  3. **1280x720 (Desktop Primary)**: Optimal presentation; stage on left, panels on right, full HUD visible.
  4. **390x844 (Mobile Primary)**: Responsive mobile layout activates; stage canvas pinned to top, panel tabs render as bottom sheet with swipe/tap navigation.
  5. **320x568 (Mobile Minimum)**: Compact mode accommodates small screen; tab icons scale down; all essential buttons remain clickable without horizontal scrolling.

### Step 12: Browser Console Audit
- **Result**: PASS (0 errors, 0 warnings)
- **Observations**:
  1. Throughout the entire QA playthrough and automated browser execution, the browser console produced **0 errors** and **0 warnings**.
  2. Session log recorded at `reports/s3-qa/console.log` (empty, 0 bytes).

### Step 13: Classic Build Smoke Test
- **Result**: PASS (nothing wrong here)
- **Observations**:
  1. Classic build (`pnpm exec vite build && pnpm exec vite preview --port 4173`) was verified.
  2. Playwright classic test suite (`14 passed`) executed successfully against port 4173.
  3. Classic gameplay loop, strip navigation, cat stats, and inventory remain completely intact and unaffected by v2 changes.

---

## 2. Problems Found and Problems Fixed

### Catalog of Findings

| ID | Title | Severity | Zone | Status |
| :--- | :--- | :--- | :--- | :--- |
| **FINDING-01** | Onboarding dialog displays obsolete v1 mechanics and covers first-time class picker | Major | `apps/web/src/onboarding/**` | Cataloged (Outside Zone) |
| **FINDING-02** | ClassPicker confirmation box keyboard focus trap skips Confirm and Cancel buttons | Major | `apps/web/src/layout/classpicker/**` | Cataloged (Outside Zone) |
| **FINDING-03** | No Unequip button or interaction available in character slots or bag UI | Major | `apps/web/src/layout/character/**` | Cataloged (Outside Zone) |
| **FINDING-04** | Threshold mismatch between StageLayout and WelcomeBack silences away loot feedback | Major | `apps/web/src/layout/loot/**` | Cataloged (Outside Zone) |
| **FINDING-05** | Class switching promised in UI is inaccessible after initial class confirmation | Major | `apps/web/src/layout/**` | Cataloged (Outside Zone) |
| **FINDING-06** | Idle loop combat montage only animates on claim resolution rather than continuous combat | Cosmetic | `apps/web/src/game/stage/**` | Cataloged (Outside Zone) |
| **FINDING-07** | Race condition between claim timer and user actions in loopV2 | Major | `apps/web/src/game/v2/**` | **FIXED** (In Zone) |
| **FINDING-08** | `createEquipQueueV2` type signature prevents unequip calls | Minor | `apps/web/src/game/v2/**` | **FIXED** (In Zone) |

### Root Causes & Fix Details

#### FINDING-07 (In Zone - FIXED)
- **Root Cause**: In `apps/web/src/game/v2/loopV2.ts`, `claimNow()` only waited when `this.snap.busy === 'fightBoss'`. If a player performed an inventory action (`craft`, `salvage`, `equip`, or `forgeRelic`) right as the 30-second timer claim resolved, `claimNow()` proceeded concurrently and calling `adopt(result.state)` could overwrite the updated inventory state.
- **Fix**: Modified `claimNow()` to wait for *any* in-flight busy action (`while (gen === this.gen && this.snap.busy !== null && this.actionFlight) { await this.actionFlight; }`).
- **Regression Test**: Added test in `apps/web/src/game/v2/loopV2.test.ts`: `"waits for an in-flight craft action before starting a timer claim"`.

#### FINDING-08 (In Zone - FIXED)
- **Root Cause**: In `apps/web/src/game/v2/storeV2.ts`, `createEquipQueueV2.equip` typed `itemId` strictly as `string`, which conflicted with `GameLoopV2.equip(itemId: string | null, slot)` and prevented callers from issuing unequip instructions.
- **Fix**: Updated parameter type signature to `itemId: string | null` in `storeV2.ts`.
- **Regression Test**: Added unit test in `apps/web/src/game/stage/bulkEquip.test.ts`: `"allows unequipping with null through the queue"`.

---

## 3. Tier 2 Changes

The following two files outside Tier 1 were modified:

1. **`apps/web/playwright.config.ts`**:
   - *Why*: Added `qa/**` to `testIgnore` in the classic test project and added a dedicated `qa` project targeting port 4174. This allows running the new QA regression walkthrough specs in `apps/web/e2e/qa/s3-walkthrough.spec.ts` alongside existing test suites without clashing with classic tests.
2. **`apps/web/src/game/stage/bulkEquip.test.ts`**:
   - *Why*: Added regression unit test verifying that `createEquipQueueV2` allows passing `null` to unequip items without throwing type or runtime errors.

---

## 4. Git Diff Statistics

### `git diff --stat origin/main...HEAD` (including working tree)
```
 apps/web/e2e/qa/s3-walkthrough.spec.ts   | 152 ++++++++++++++++++++++++++++++++
 apps/web/playwright.config.ts           |   8 +-
 apps/web/src/game/stage/bulkEquip.test.ts |  14 +++
 apps/web/src/game/v2/loopV2.test.ts      |  24 +++++
 apps/web/src/game/v2/loopV2.ts           |   4 +-
 apps/web/src/game/v2/storeV2.ts          |   2 +-
 reports/s3-qa.md                         | 320 ++++++++++++++++++++++++++++++++
 reports/s3-qa/console.log                |   0
 reports/s3-qa/finding-01-onboarding-v1-modal.png | Bin 0 -> 129947 bytes
 reports/s3-qa/finding-02-classpicker-focus-trap.png | Bin 0 -> 60737 bytes
 reports/s3-qa/finding-03-no-unequip-ui.png | Bin 0 -> 39269 bytes
 reports/s3-qa/finding-04-away-loot-suppression.png | Bin 0 -> 110924 bytes
 reports/s3-qa/finding-05-no-class-switch-ui.png | Bin 0 -> 44377 bytes
 reports/s3-qa/findings.json              |  84 ++++++++++++++++++
 reports/s3-qa/viewport-1280x720-dark.png | Bin 0 -> 44377 bytes
 reports/s3-qa/viewport-1280x720-light.png | Bin 0 -> 44405 bytes
 reports/s3-qa/viewport-1600x900-light.png | Bin 0 -> 54470 bytes
 reports/s3-qa/viewport-320x568-light.png  | Bin 0 -> 31638 bytes
 reports/s3-qa/viewport-390x844-dark.png  | Bin 0 -> 45802 bytes
 reports/s3-qa/viewport-390x844-light.png | Bin 0 -> 45802 bytes
 20 files changed, 606 insertions(+), 3 deletions(-)
```

### `git diff --name-only origin/main...HEAD`
```
apps/web/e2e/qa/s3-walkthrough.spec.ts
apps/web/playwright.config.ts
apps/web/src/game/stage/bulkEquip.test.ts
apps/web/src/game/v2/loopV2.test.ts
apps/web/src/game/v2/loopV2.ts
apps/web/src/game/v2/storeV2.ts
reports/s3-qa.md
reports/s3-qa/console.log
reports/s3-qa/finding-01-onboarding-v1-modal.png
reports/s3-qa/finding-02-classpicker-focus-trap.png
reports/s3-qa/finding-03-no-unequip-ui.png
reports/s3-qa/finding-04-away-loot-suppression.png
reports/s3-qa/finding-05-no-class-switch-ui.png
reports/s3-qa/findings.json
reports/s3-qa/viewport-1280x720-dark.png
reports/s3-qa/viewport-1280x720-light.png
reports/s3-qa/viewport-1600x900-light.png
reports/s3-qa/viewport-320x568-light.png
reports/s3-qa/viewport-390x844-dark.png
reports/s3-qa/viewport-390x844-light.png
```

---

## 5. Verification Commands Output

### 1. `CI=true pnpm install --frozen-lockfile`
```
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 1.4s
```

### 2. `pnpm gen:deno && git diff --exit-code -- supabase/functions`
```
> taskbar-hero@0.1.0 gen:deno /Users/bao/taskbar-hero
> bash scripts/gen-deno.sh
(Clean exit 0, no diff)
```

### 3. `pnpm typecheck`
```
> taskbar-hero@0.1.0 typecheck /Users/bao/taskbar-hero
> turbo run typecheck
• Packages in scope: @taskbar-hero/bot, @taskbar-hero/chain, @taskbar-hero/contracts, @taskbar-hero/db, @taskbar-hero/game-rules, @taskbar-hero/sim, web
• Running typecheck in 7 packages
web:typecheck: cache hit, replaying logs
@taskbar-hero/chain:typecheck: cache hit, replaying logs
@taskbar-hero/game-rules:typecheck: cache hit, replaying logs
@taskbar-hero/bot:typecheck: cache hit, replaying logs
@taskbar-hero/contracts:typecheck: cache hit, replaying logs
@taskbar-hero/sim:typecheck: cache hit, replaying logs
@taskbar-hero/db:typecheck: cache hit, replaying logs
7 successful, 7 total
```

### 4. `pnpm lint`
```
> taskbar-hero@0.1.0 lint /Users/bao/taskbar-hero
> turbo run lint
• Packages in scope: @taskbar-hero/bot, @taskbar-hero/chain, @taskbar-hero/contracts, @taskbar-hero/db, @taskbar-hero/game-rules, @taskbar-hero/sim, web
• Running lint in 7 packages
web:lint: cache hit, replaying logs
@taskbar-hero/game-rules:lint: cache hit, replaying logs
@taskbar-hero/bot:lint: cache hit, replaying logs
@taskbar-hero/chain:lint: cache hit, replaying logs
@taskbar-hero/contracts:lint: cache hit, replaying logs
@taskbar-hero/sim:lint: cache hit, replaying logs
@taskbar-hero/db:lint: cache hit, replaying logs
7 successful, 7 total
```

### 5. `pnpm test`
```
> taskbar-hero@0.1.0 test /Users/bao/taskbar-hero
> turbo run test
• Packages in scope: @taskbar-hero/bot, @taskbar-hero/chain, @taskbar-hero/contracts, @taskbar-hero/db, @taskbar-hero/game-rules, @taskbar-hero/sim, web
• Running test in 7 packages
...
Test Files  44 passed (44)
     Tests  635 passed (635)
  Duration  17.43s
7 successful, 7 total
```

### 6. `pnpm build`
```
> taskbar-hero@0.1.0 build /Users/bao/taskbar-hero
> turbo run build
• Packages in scope: @taskbar-hero/bot, @taskbar-hero/chain, @taskbar-hero/contracts, @taskbar-hero/db, @taskbar-hero/game-rules, @taskbar-hero/sim, web
• Running build in 7 packages
7 successful, 7 total
```

### 7. `cd apps/web && pnpm test:e2e`
```
Running 117 tests using 1 worker
  116 passed
  1 skipped
```

---

## 6. Items NOT Verified

1. **Live Web3 Avalanche Fuji Testnet Transactions**:
   - The Relic mint panel was tested in demo mode with graceful degradation without an injected wallet. Live on-chain minting on the Avalanche Fuji network was not verified against real private keys.
2. **Live Supabase Cloud Database & Edge Functions**:
   - The test was executed in local browser demo mode (`VITE_GAME_V2=1` with empty `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`). Live Supabase edge function auth and cloud Postgres sync were not tested.

---

## 7. Contest Judge Evaluation

### Would you show this build to a contest judge today?
**No.** While the core game loop, stage canvas rendering, and state persistence are solid and stable, the first impression is marred by jarring UI issues that make the game feel unfinished to a player sitting down for the first time.

### The Three Things That Would Embarrass Us Most

1. **The Obsolete v1 Onboarding Modal Covering the First Screen**:
   On a clean start, the very first thing the player sees is the `HowToPlay` modal covering the stage, explaining mechanics from classic v1 ("strip", "Gold and Shards", "10 Shards and 1 Boss Key", "Spend Gold on gear upgrades"). Every single line in that modal is inaccurate for v2, instantly destroying credibility.
2. **ClassPicker Focus Trap & Broken Class Switching Promise**:
   The `ClassPicker` subtitle prominently promises: *"You can switch your class any time outside boss fights."* Yet once confirmed, the picker unmounts forever with no button to re-open it. On top of that, keyboard navigation completely skips the Confirm button when opened.
3. **Complete Inability to Unequip Gear**:
   There is literally no unequip button or action in the character panel or bag. If you equip an item, you can never take it off unless you have another item to replace it with. For an RPG with gear sets and stat specialization, not being able to unequip gear is immediately noticeable.

---

## 8. Branch, Commits & Reproduction Instructions

- **Branch**: `ai/antigravity-s3-qa`
- **Base**: `origin/main`
- **Git Author**: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`

### Reproduction Commands
```bash
# 1. Checkout branch
git fetch origin +main:refs/remotes/origin/main
git checkout ai/antigravity-s3-qa

# 2. Build and serve v2 demo
cd apps/web
VITE_GAME_V2=1 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= pnpm exec vite build --outDir dist-v2
pnpm exec vite preview --outDir dist-v2 --port 4174 --strictPort

# 3. Open in browser at 1280x720 and 390x844
# http://localhost:4174

# 4. Run the automated walkthrough suite
pnpm exec playwright test --project=qa
```
