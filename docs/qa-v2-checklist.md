# Cat RPG v2 QA Checklist: QA1 & V28 (Card A29)

> **Purpose:** Standardized operational procedure and script for testing Cat RPG v2:
> 1. **QA1 (Local Milestone M3 Pass):** Run against the local preview build (`VITE_GAME_V2=1`) in demo mode once V16 (Stage + HUD wiring) and V19 (Boss Arena) are merged.
> 2. **V28 (Production Cut-Over Pass):** Run against the live production site (`https://taskbar-hero.vercel.app`) immediately after the V29 cut-over flag flip.

---

## 1. Setup & Environment

### QA1: Local Demo Build Setup
To test locally prior to production deployment:
```bash
# 1. Clean install and build with v2 flag enabled
pnpm install --frozen-lockfile
VITE_GAME_V2=1 pnpm build

# 2. Serve the production preview locally
pnpm --filter @taskbar-hero/web preview
# Available at http://localhost:4173 (or as printed)
```

### V28: Live Production Setup
To test following cut-over:
```bash
# Verify the live production URL in an incognito / clean browser profile
open https://taskbar-hero.vercel.app
```

---

## 2. Test Devices, Viewports & Themes

Every QA pass must execute test passes across four matrix axes:

| Matrix Axis | Configurations to Test | Verification Method |
| :--- | :--- | :--- |
| **Viewports** | **Mobile Phone:** 390 × 844 px (iPhone 12/13/14 viewport)<br>**Laptop Desktop:** 1280 × 720 px (standard HD landscape)<br>**Narrow Mobile:** 320 × 568 px (minimum responsive width) | Chrome / Safari DevTools Device Mode emulation |
| **Color Schemes** | **Dark Theme:** Default dusk Cat Café palette (`#1a1220` bg, `#2a1f36` surface)<br>**Light Theme:** Cream café palette (`#fdfbf7` surface, `#2a1a08` text) | `prefers-color-scheme: light` emulation in DevTools Rendering panel |
| **Motion Mode** | **Default Motion:** Animated XP bar fills, card transitions<br>**Reduced Motion:** Transitions disabled (`transition: none`), instant state updates | `prefers-reduced-motion: reduce` emulation in DevTools Rendering panel |
| **Auth Context** | **Demo Mode:** Local storage engine, simulated vouchers<br>**Signed-In Mode:** Ethereum wallet connected, Supabase cloud sync (V28 live) | Connect via browser wallet extension (MetaMask/Rabby) on Fuji |

---

## 3. Dependency Status & Milestone Readiness

| Step # | Feature Area | Required Milestone | Testable in Current Repo State (origin/main c95f0ce)? |
| :--- | :--- | :--- | :--- |
| **Step 1** | Class Picker & Starter Weapon | V16 (Stage wiring) | **Pending V16** (Component unit-tested in isolation) |
| **Step 2** | Stage Layout & HUD Elements | V16 (Stage wiring) | **Pending V16** (Presentational pieces merged in A20) |
| **Step 3** | Ambient Progress & Idle Claims | V16 (Stage wiring) | **Pending V16** (Loop engine merged in V16a) |
| **Step 4** | Bag Management & Equip Best | V17b / V20 | **Ready for testing** (BagPanel & CharacterPanel merged) |
| **Step 5** | Boss Gate Status Refusals | V16 (Stage wiring) | **Pending V16** (Panel merged in A21 / V19d) |
| **Step 6** | Boss Battle Win & Chest Reveal | V16 + V19 (Phaser Arena) | **Pending V16 + V19** (Edge Function merged in C12) |
| **Step 7** | Boss Battle Loss & Catnap Cooldown | V16 + V19 (Phaser Arena) | **Pending V16 + V19** (Cooldown logic merged in C12) |
| **Step 8** | The Forge: Craft, Salvage, Lock | V20 | **Ready for testing** (ForgePanel merged) |
| **Step 9** | Daily Relic Forge & Voucher | V20 / CL10 | **Ready for testing** (Relic tab merged) |
| **Step 10**| Persistence & Tab Reload | V16a / V12 | **Ready for testing** (localStorage adapter merged) |
| **Step 11**| Mini Mode 96px Strip | V13 | **Ready for testing** (Mini mode toggle merged) |
| **Step 12**| In-Game Help Tab | A23 | **Ready for testing** (HelpTab merged in #169) |
| **Step 13**| Classic v1 Fallback (Pre-Cut-Over)| V29 | **Ready for testing** (Live site currently v1) |

---

## 4. Full Loop Test Steps & Expected Results

Follow these numbered steps in sequence during a QA pass. Record each step as PASS or FAIL.

### Step 1: Initial Load & Class Selection
*(Requires V16 stage wiring)*
1. Clear browser storage (`localStorage.clear()`) and load the application.
2. Verify the **Class Picker** modal opens on first load, displaying all 7 classes: Warrior, Guardian, Rogue, Hunter, Archer, Witch, Alchemist.
3. Select **Warrior** and click **Choose Warrior**.
4. **Expected Result:** Modal closes; cat appears in the stage equipped with a Common Twig Sword (`wpn.sword.twig`); bag inventory contains starter weapon.

### Step 2: Stage & HUD Status Inspection
*(Requires V16 stage wiring)*
1. Inspect the HUD bar (`apps/web/src/layout/hud/HudBar.tsx`) at the top of the stage.
2. Verify **LevelXpBar**: displays `Lv 1`, empty/beginning XP track, and `0 / 60 XP`.
3. Verify **ProgressChip**: reads `Chapter 1 · Round 1 · 0/6` (or appropriate initial kills).
4. Verify **StacksBar**: shows Fish (`0`), Yarn (`0`), and Cat Keys (`1/5`).
5. Verify **PowerChip**: shows calculated Power.
6. **Expected Result:** All 4 HUD elements render without layout shifts or text wrapping at both 390px and 1280px.

### Step 3: Ambient Progress & Idle Claims
*(Requires V16 stage wiring)*
1. Allow the ambient loop to run for 30–60 seconds.
2. Observe monster defeat animations, walk pacing (~1,000 ms between monsters), and round advances.
3. Wait 10 seconds and click the **Claim** action.
4. **Expected Result:** Gained Fish, Yarn, and experience credit to the player; HUD numbers increment smoothly without page reload.

### Step 4: Bag & Character Panel
1. Open the **Bag** tab (`apps/web/src/layout/bag/BagPanel.tsx`).
2. Verify all 9 equipment slots are visible (Weapon, Helmet, Armor, Gloves, Boots, Collar, Earring, Ring, Charm).
3. Click **Equip Best**.
4. Click on an equipped or inventory item, click **Lock**, and verify a lock icon renders. Click **Unlock**.
5. **Expected Result:** Gear stats apply to total Power; bag count displays `N / 200`; locked items cannot be salvaged.

### Step 5: Boss Gate Encounters & Statuses
*(Requires V16 stage wiring)*
1. Navigate to the **Boss** tab (`apps/web/src/layout/boss/BossGatePanel.tsx`).
2. Test the 5 refusal/readiness states:
   - **`not_reached`**: Displays *"Clear N more rounds and K more monsters to reach the boss."* Fight button is disabled.
   - **`gated`**: When power is below requirement, displays *"Needs about N power: upgrade your weapon or armor..."*. Fight button is disabled.
   - **`no_key`**: When holding 0 keys at Round 10, displays *"You need a Cat Key. You get one each day..."*. Fight button is disabled.
   - **`cooldown`**: While on loss cooldown, displays live timer *"Catnap: m:ss"*. Fight button is disabled.
   - **`ready` / `rematch`**: When reached with 1 key, Fight button is enabled. On cleared chapters, button reads "Rematch" and notes smaller chest.
3. **Expected Result:** `aria-describedby` on the disabled Fight button links to the visible reason; no stale attributes when enabled.

### Step 6: Boss Battle Victory & Chest Reveal
*(Requires V16 + V19)*
1. Challenge Chapter 1 boss (Yarn Giant) with sufficient power and 1 Cat Key.
2. Watch the Phaser arena combat replay: observe cat attacks, boss telegraphs, `big` attacks, and dodges.
3. On victory, verify the **Chest Reveal** modal opens (`apps/web/src/layout/loot/ChestReveal.tsx`).
4. **Expected Result:** 1 Cat Key is deducted (`keys` becomes 0); 1 Moon Pearl, Fish, Yarn, and equipment are awarded; Chapter 2 unlocks in chapter selector.

### Step 7: Boss Battle Defeat & Catnap Cooldown
*(Requires V16 + V19)*
1. Challenge a boss with low gear/power to trigger a defeat.
2. Upon defeat, observe battle outcome modal.
3. **Expected Result:** **Zero Cat Keys are lost** (key count remains unchanged); a 60-second Catnap cooldown begins; Boss Gate panel displays *"Catnap: 0:59"* counting down.

### Step 8: The Forge (Craft, Salvage, Lock)
1. Open the **Forge** tab (`apps/web/src/layout/forge/ForgePanel.tsx`).
2. Craft a Common item using 50 Fish, 10 Yarn, and 4 Fluff Tuft.
3. Verify crafted item appears in the bag.
4. Navigate to the **Salvage** sub-tab and salvage an unlocked item.
5. **Expected Result:** Crafting deducts exact recipe ingredients; salvaging returns ~25% materials and 0 Fish; locked items do not appear in salvage list.

### Step 9: Daily Relic Forge
1. Open the **Relic** sub-tab in the Forge.
2. With 30 Yarn and 1 Moon Pearl available, forge the daily Relic.
3. Verify voucher generation.
4. Attempt to forge a second Relic on the same day.
5. **Expected Result:** First forge succeeds; second forge is blocked with explanation that 1 Relic is permitted per account per day.

### Step 10: Persistence & Reload
1. Note current level, gold/fish, and equipped gear.
2. Hard-refresh the browser tab (`Ctrl+F5` or `Cmd+Shift+R`).
3. **Expected Result:** Game reloads without showing the ClassPicker; cat level, equipped gear, bag items, and chapter progress are completely preserved.

### Step 11: Mini Mode Ambient Strip
1. Click the **Mini Mode** toggle in the header.
2. Observe layout switches to compact 96px ambient strip (`apps/web/src/GameCanvas.tsx`).
3. Refresh the page.
4. Toggle back to Full Mode.
5. **Expected Result:** Mini mode state is remembered across reloads; stage canvas continues rendering without freezing.

### Step 12: In-Game Help Tab
1. Click the **Help** tab in navigation (`apps/web/src/layout/HelpTab.tsx`).
2. Navigate through the accordion/tabs: Quick Start, Classes, Gear, Bosses, Forge, Fuji Web3.
3. **Expected Result:** All help cards expand/collapse cleanly; text and code snippets are readable; zero console warnings.

### Step 13: Classic v1 Verification (Pre-Cut-Over Only)
1. In a separate tab without `VITE_GAME_V2=1`, load `https://taskbar-hero.vercel.app`.
2. Verify the classic v1 strip, onboarding, and tabs function normally.
3. **Expected Result:** v1 production remains 100% operational until cut-over day (V29).

---

## 5. Accessibility, Hygiene & Health Checks

### A11y Spot Checks
- [ ] **Keyboard Navigation:** Tab key visits all interactive elements in logical order. No keyboard traps. `Escape` closes modals (Help, Chest Reveal, Class Picker).
- [ ] **Focus Indicator:** Active element has a high-contrast focus outline (golden `--focus` `#ffd75e`).
- [ ] **Screen Reader Labels:** All icon buttons have an `aria-label` or visible text. Decorative SVG icons are `aria-hidden="true"`.
- [ ] **Reduced Motion:** With `prefers-reduced-motion: reduce`, animations are disabled; XP bar width updates instantly without transition delay.

### Robustness & Layout Hygiene
- [ ] **Console Errors:** 0 uncaught errors or unhandled rejections in browser DevTools Console.
- [ ] **Horizontal Scroll Check:** At 320px, 390px, and 1280px widths, verify:
  ```javascript
  document.documentElement.scrollWidth <= window.innerWidth
  ```
  *(Must evaluate to `true` on every tab and sheet).*

### Automated Health Checks
Run from the repository root:
```bash
# 1. Standard production health check (pre-cutover or post-cutover baseline)
node scripts/check-live.mjs

# 2. Post-cutover v2 health check (after flag flip)
CHECK_LIVE_V2=post node scripts/check-live.mjs
```

---

## 6. Issue Severity Scale

When logging findings in the report, assign one of three severity ratings:

| Severity | Definition | Examples |
| :--- | :--- | :--- |
| **BLOCKER** | Prevents core game loop execution, causes crash/white screen, loses player data, or breaks live v1. Must be fixed before release. | Infinite loop, claim fails with 500, class picker unclosable, unhandled React error boundary crash. |
| **MAJOR** | Severe functional or accessibility defect, but workaround exists. Core loop playable. | Boss gate reason not announced to screen readers, equip best equips wrong slot, keyboard navigation trapped in modal. |
| **MINOR** | Cosmetic flaw, minor spacing/alignment defect, typo, or non-blocking polish item. | Text wraps awkwardly at 320px, minor contrast discrepancy on inactive chip, animation stutter. |

---

## 7. QA Report Templates

### Template for QA1: Local Build (Saved to reports/qa-v2-1.md)
```markdown
STATUS: DONE | PARTIAL | FAILED

# QA1 Test Report: Local v2 Demo Build

- **Date:** YYYY-MM-DD
- **Commit / Branch:** <sha> on <branch>
- **Tester:** Antigravity / <name>
- **Tested Environment:** Local preview build (`VITE_GAME_V2=1`), Chrome / Safari

## Findings Table
| # | Step | Severity | Expected Result | Actual Result | Screenshot |
|---|---|---|---|---|---|
| 1 | Step 5 | Minor | Cooldown countdown m:ss | Text flickered at 0:00 | qa1-01-cooldown.png |

## Device & Matrix Summary
- [x] 390x844 Dark Mode: PASS
- [x] 390x844 Light Mode: PASS
- [x] 1280x720 Dark Mode: PASS
- [x] Reduced Motion: PASS
- [x] Console Errors: 0 errors
- [x] Horizontal Overflow: 0 px
```

### Template for V28: Live Production Site (Saved to reports/qa-v2-live.md)
```markdown
STATUS: DONE | PARTIAL | FAILED

# V28 Test Report: Live Production Site (Post-Cutover)

- **Date:** YYYY-MM-DD
- **Live URL:** https://taskbar-hero.vercel.app
- **Tester:** Antigravity / <name>
- **Health Check Result:** `node scripts/check-live.mjs` (PASS)

## Verification Checklist
- [ ] Step 1–12 Full Loop: PASS
- [ ] Real wallet SIWE sign-in: PASS
- [ ] Avalanche Fuji Relic mint: PASS
- [ ] Console Errors: 0
- [ ] Health Check: 100% green
```

### Screenshot Naming Convention
Save all captures in the designated reports directory using standard naming:
```text
reports/qa-v2-1/qa1-01-classpicker-390.png
reports/qa-v2-1/qa1-02-hud-stage-1280.png
reports/qa-v2-1/qa1-03-boss-gate-cooldown-390.png
reports/qa-v2-1/qa1-04-boss-win-chest-1280.png
reports/qa-v2-1/qa1-05-forge-craft-390.png
reports/qa-v2-live/v28-live-01-cutover-stage-1280.png
```
