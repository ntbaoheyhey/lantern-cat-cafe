STATUS: PARTIAL
STACKED ON origin/main @ 337977751204b5ea59d8f0cabfb91fb4cd4a391f
AUDITED COMMIT ai/codex-responsive-window @ d4fb8ec745a92c1052a8250f57a4108b8ce59ac4

# A-R1: Independent Responsive Window QA Report

- **Date:** 2026-10-26
- **Audited Commit / Branch:** `ai/codex-responsive-window` @ `d4fb8ec745a92c1052a8250f57a4108b8ce59ac4`
- **Base / Stack Branch:** `origin/main` @ `337977751204b5ea59d8f0cabfb91fb4cd4a391f`
- **Published Branch:** `ai/antigravity-responsive-qa`
- **Reviewer:** Antigravity (Independent QA Assistant)
- **Engine Verification:** Chromium (Headless / Playwright 1.64.1) verified; WebKit **NOT VERIFIED** (engine binary not installed in test environment); Physical iOS/Android **NOT VERIFIED** (no physical device attached; simulated viewports do not substitute for real hardware).

---

## 1. Executive Summary & Verdict

This report documents the independent quality assurance audit of `ai/codex-responsive-window` (`d4fb8ec745a92c1052a8250f57a4108b8ce59ac4`) conducted in a detached, read-only checkout pursuant to `docs/prompts/antigravity-responsive-qa.md` and `docs/responsive-coordination.md`.

### Verdict: PARTIAL (HUD Layout PASS / Stage Actor Redraw FAIL)
1. **HUD Wrapping & Layout Adaptation: PASS**
   - The CSS wrapping fix scoped to `.v2-shell` in `apps/web/src/layout/layout.css` functions correctly. Across all 12 viewports tested in a single continuous session (from 1600×900 down to 320×568 and back), leaf HUD elements have **0 overlaps** and **0 clipped bounds**.
   - Page horizontal scroll is 0 px (`scrollWidth <= innerWidth`).
   - Extreme currency/XP values (`99,999,999 XP`, `99,999,999 Fish`, `88,888,888 Yarn`) wrap into two full-width rows without clipping.
2. **Stage Actor Redraw on Viewport Resize: FAIL (Reproduced Independently)**
   - Viewport resizing drops cat and monster sprites from the Phaser canvas, leaving the canvas 100% transparent (0 non-transparent pixels).
   - This failure has been reproduced and isolated: `StageScene.ts:21` guards execution with `sys.isActive()`, which evaluates to `false` during `StageScene.create()` because Phaser is in `Phaser.Scenes.CREATING` (status `2`), not `Phaser.Scenes.RUNNING` (status `3`).
   - Recorded as eligible named bug **`Finding A-R1-1`** in `reports/qa-v2-1.md` to unblock Codex card C-R2 under Q13 rules.

---

## 2. Priority Finding: Missing Cat / Monster Actors Redraw Bug

### Finding A-R1-1: StageScene create-time isActive guard drops actor redraw after viewport resize
- **Severity:** MAJOR
- **Affected Files:**
  - `apps/web/src/game/stage/StageScene.ts:21`
  - `apps/web/src/game/stage/StageCanvas.tsx:18`
- **Observed Behavior:**
  - Upon initial load or after user actions (e.g., class selection or state change), the game stage displays the animated player cat and exploring monster.
  - As soon as the browser window is resized across any threshold altering `logicalWidth` (`Math.max(160, Math.floor(width / zoom))`), the Phaser stage canvas becomes blank.
  - Pixel audit reveals **0 non-transparent pixels** (`for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) return true` returns `false`).
  - The backdrop (rendered outside Phaser by HTML/SVG `BackdropView`) remains visible, but the actors disappear completely until a subsequent state mutation occurs.

### Technical Root Cause & Timing Analysis
1. In `StageCanvas.tsx` (lines 14–22):
   ```tsx
   void Promise.all([import('phaser'), import('./StageScene')]).then(([{ default: Phaser }, { StageScene }]) => {
     if (cancelled) return;
     const stage = new StageScene(); scene.current = stage;
     game = new Phaser.Game({ type: Phaser.CANVAS, parent: host.current!, width: logicalWidth, height: 96, transparent: true, pixelArt: true, banner: false, audio: { noAudio: true }, scene: [] });
     game.scene.add('v2-stage', stage, true);
     stage.show(latest.current.state, latest.current.reducedMotion);
     onVisibility();
   });
   ```
2. When `stage.show()` is called synchronously right after `game.scene.add('v2-stage', stage, true)`:
   - `StageScene.ts:21`: `if (!this.sys.isActive() || !state.cat.classId) return;`
   - Phaser's scene has not booted yet; `this.sys.isActive()` returns `false`. `show()` caches state into `this.state0` and returns immediately without instantiating sprites.
3. Phaser proceeds to boot and invokes `StageScene.create()`:
   ```ts
   create() {
     this.events.once('shutdown', () => this.director?.destroy());
     if (this.state0) this.show(this.state0, this.reduced);
   }
   ```
4. Inside `create()`, `this.show(this.state0, this.reduced)` is called.
5. In Phaser 3 (`SceneManager.js:618–628`):
   ```javascript
   if (scene.create) {
     settings.status = CONST.CREATING; // value 2
     scene.create.call(scene, settings.data);
     ...
   }
   settings.status = CONST.RUNNING; // value 3
   sys.events.emit(Events.CREATE, scene);
   ```
6. In Phaser 3 (`Systems.js:611–614`):
   ```javascript
   isActive: function () {
     return (this.settings.status === CONST.RUNNING);
   }
   ```
7. Because `this.settings.status` is `CONST.CREATING` during `scene.create.call()`, `this.sys.isActive()` strictly returns `false`!
8. `show()` exits early again without constructing `this.cat`, `this.monster`, or `this.director`.
9. Phaser transitions to `RUNNING` and emits `Events.CREATE`, but `StageScene` registers no listener for `CREATE`.
10. Result: The canvas remains blank and transparent indefinitely unless an unrelated game loop tick or user mutation triggers `useEffect([state, reducedMotion])` while the scene is running.

### Photographic Evidence
- Stage art before resize (actors present): `reports/responsive-qa/01-stage-art-with-actors.png`
- Stage art after resize (canvas blank, actors disappeared): `reports/responsive-qa/02-stage-art-disappeared.png`
- Close-up stage canvas regression: `reports/responsive-qa/15-stage-canvas-blank-actors-regression.png`

---

## 3. Continuous Resize Session Test Matrix (One Session)

Executed sequentially without page reload (`performance.timeOrigin` validated constant across all 12 steps).

| # | Step / Viewport | Width × Height | Layout Mode | HUD Overlaps | Scrollbar | Single Canvas | Actor Pixels | Result |
|---|---|---|---|---|---|---|---|---|
| **1** | Desktop Wide | 1600 × 900 px | `desktop` | 0 | 0 px | 1 | 0 px (blank) | HUD PASS / Actor FAIL |
| **2** | Desktop Standard | 1280 × 720 px | `desktop` | 0 | 0 px | 1 | 0 px (blank) | HUD PASS / Actor FAIL |
| **3** | Desktop Boundary | 1024 × 768 px | `desktop` | 0 | 0 px | 1 | 0 px (blank) | HUD PASS / Actor FAIL |
| **4** | Tablet Upper Bound | 1023 × 600 px | `tablet` | 0 | 0 px | 1 | 0 px (blank) | HUD PASS / Actor FAIL |
| **5** | Tablet Standard | 768 × 600 px | `tablet` | 0 | 0 px | 1 | 0 px (blank) | HUD PASS / Actor FAIL |
| **6** | Tablet Lower Bound | 601 × 480 px | `tablet` | 0 | 0 px | 1 | 0 px (blank) | HUD PASS / Actor FAIL |
| **7** | Phone Upper Bound | 600 × 600 px | `phone` | 0 | 0 px | 1 | 0 px (blank) | HUD PASS / Actor FAIL |
| **8** | Phone Standard | 390 × 844 px | `phone` | 0 | 0 px | 1 | 0 px (blank) | HUD PASS / Actor FAIL |
| **9** | Phone Minimum | 320 × 568 px | `phone` | 0 | 0 px | 1 | 0 px (blank) | HUD PASS / Actor FAIL |
| **10**| Landscape Phone | 844 × 390 px | `tablet` | 0 | 0 px | 1 | 0 px (blank) | HUD PASS / Actor FAIL |
| **11**| Landscape Short | 1280 × 480 px | `desktop` | 0 | 0 px | 1 | 0 px (blank) | HUD PASS / Actor FAIL |
| **12**| Desktop Restore | 1600 × 900 px | `desktop` | 0 | 0 px | 1 | 0 px (blank) | HUD PASS / Actor FAIL |

---

## 4. Feature, Theme & Panel Verification

| Area | Scope / Condition | Status | Detailed Observations |
| :--- | :--- | :--- | :--- |
| **HUD Bar Wrapping** | 320 px to 1600 px | **PASS** | Stat items, progress chip, currencies, and power wrap cleanly; 0 clipping or bounding overflows. |
| **Extreme Values** | 99,999,999 XP/Currencies | **PASS** | Double-row wrapping accommodates large numbers without text overlap or element clipping. |
| **Theme: Dark** | Default Dusk (`#1a1220`) | **PASS** | High contrast pixel borders, readable typography, and clean contrast. |
| **Theme: Light** | Cream (`#fdfbf7`) | **PASS** | Inherits `[data-theme='light']` CSS variables cleanly across all viewports. |
| **Zoom: 100% / 200%** | 1280 × 720 px | **PASS** | At 200% zoom, text scales legibly and internal scrollable panels maintain accessibility. |
| **Reduced Motion** | `prefers-reduced-motion` | **PASS** | Animation loops disable cleanly; combat animations bypassed safely. |
| **Class Picker** | Modal at 1280 & 390 px | **PASS** | Modal displays all 7 classes; equipment previews, selection, and confirm work responsively. |
| **Boss Gate & Map** | Boss Panel | **PASS** | Refusal states, active cooldown countdowns, and world chapter map render properly. |
| **Boss Arena Fight** | Arena Replay & Chest | **PASS** | Phaser boss arena displays combat sequence, skip button, and victory chest reward. |
| **Forge Panel** | Craft, Salvage, Relic | **PASS** | Sub-tabs switch cleanly; recipe lists and salvage controls remain accessible. |
| **Help Tab** | Guide & mechanics | **PASS** | Comprehensive documentation renders cleanly across all widths without console errors. |
| **Mobile Sheet Nav** | Viewport ≤ 600 px | **PASS** | Fixed bottom navigation bar; panel slides up in bottom sheet; Escape and Close button dismiss. |
| **Session Persistence**| State retention | **PASS** | Class ID, level, equipment, bag contents, and active tab survive continuous resizing without reset. |

---

## 5. Photographic Evidence Directory

All screenshots captured during testing and committed to `reports/responsive-qa/`:

| Screenshot File | Viewport / Feature | Description |
| :--- | :--- | :--- |
| `01-desktop-1600x900-dark.png` | 1600 × 900 px (Dark) | Full desktop layout in default dark theme |
| `01-stage-art-with-actors.png` | Stage Art Crop (Before) | Baseline: cat and monster actors rendered before resize |
| `02-desktop-1600x900-light.png` | 1600 × 900 px (Light) | Full desktop layout in light theme |
| `02-stage-art-disappeared.png` | Stage Art Crop (After) | Regression: stage canvas blank after viewport resize |
| `03-desktop-1280x720-dark.png` | 1280 × 720 px (Dark) | Standard 720p desktop layout |
| `04-desktop-1280x720-light.png` | 1280 × 720 px (Light) | Standard 720p desktop in light theme |
| `05-tablet-1024x768-dark.png` | 1024 × 768 px | Desktop/tablet boundary layout |
| `06-tablet-1023x600-boundary.png`| 1023 × 600 px | Upper tablet breakpoint boundary |
| `07-tablet-768x600.png` | 768 × 600 px | Standard portrait tablet layout |
| `08-tablet-601x480-boundary.png`| 601 × 480 px | Lower tablet breakpoint boundary |
| `09-phone-600x600-boundary.png` | 600 × 600 px | Phone upper breakpoint boundary with bottom nav |
| `10-phone-390x844-dark.png` | 390 × 844 px (Dark) | Mobile viewport in dark theme |
| `11-phone-390x844-light.png` | 390 × 844 px (Light) | Mobile viewport in light theme |
| `12-phone-320x568-narrow.png` | 320 × 568 px | Minimum supported narrow phone screen |
| `13-landscape-844x390-short.png`| 844 × 390 px | Short landscape smartphone viewport |
| `14-landscape-1280x480-short.png`| 1280 × 480 px | Ultra-wide short landscape layout |
| `15-stage-canvas-blank-actors-regression.png` | Stage Art Crop | Regression evidence: blank Phaser canvas after resize |
| `16-class-picker-modal.png` | Modal (1280 × 720 px) | Responsive Class Picker dialog with 7 classes |
| `17-boss-panel-chapter-map.png` | 1280 × 720 px | Boss gate panel with World Chapter Map |
| `18-boss-arena-fight.png` | 1280 × 720 px | Phaser boss combat arena sequence |
| `19-forge-panel-craft.png` | 1280 × 720 px | The Forge: crafting recipes and materials |
| `20-help-tab.png` | 1280 × 720 px | In-game Help and rule documentation |
| `21-phone-sheet-open-390x844.png`| 390 × 844 px | Mobile bottom sheet drawer opened over stage |
| `22-long-currency-hud-1600x900.png`| 1600 × 900 px | Extreme currency/XP values wrapping cleanly |
| `23-zoom-200-desktop-1280x720.png`| 1280 × 720 px | Browser zoom at 200% scale |
| `24-reduced-motion-desktop-1280x720.png`| 1280 × 720 px | Stage and UI under `prefers-reduced-motion: reduce` |

---

## 6. Verification Commands & Self-Checks

### 6.1 Pinned pnpm install (Corepack / CI=true)
```text
$ CI=true pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 422ms using pnpm v10.28.0
EXIT 0
```

### 6.2 Deno configuration drift check
```text
$ CI=true pnpm gen:deno && git diff --exit-code -- supabase/functions
> node scripts/gen-deno-json.mjs
wrote 18 Edge Function import maps
EXIT 0
```

### 6.3 Playwright Resize Test Suite Execution
```text
$ pnpm --filter @taskbar-hero/web exec playwright test e2e/layout/resize.spec.ts
Running 2 tests using 1 worker
  ✘  1 … continuous resize preserves state and readable HUD (dark) (6.8s)
  ✘  2 … continuous resize preserves state and readable HUD (light) (5.5s)

  1) [stage-layout] › e2e/layout/resize.spec.ts:19:40 › continuous resize preserves state and readable HUD (dark)
    Error: stage actors redraw after resizing
    Expected: true
    Received: false

  2) [stage-layout] › e2e/layout/resize.spec.ts:19:40 › continuous resize preserves state and readable HUD (light)
    Error: stage actors redraw after resizing
    Expected: true
    Received: false

  2 failed (actors redraw regression reproduced)
```

---

## 7. Coordination Handoff & Boundaries

1. **Card A-R1 Completed:**
   - Independent verification of responsive window layout completed.
   - Identified and isolated the stage actor redraw bug.
   - Named eligible finding **`Finding A-R1-1`** appended to `reports/qa-v2-1.md`.
2. **Next Action (Codex C-R2):**
   - Codex is unblocked to implement the renderer lifecycle fix for `Finding A-R1-1` on branch `ai/codex-fix-stage-scene-redraw` (or equivalent).
   - Recommended fix: in `StageScene.ts`, listen for `Phaser.Scenes.Events.CREATE` so queued `state0` renders once the scene reaches `RUNNING` status.
3. **Governance & Decision Boundaries:**
   - No product fixes, merges, PRs, or deployments were performed in this card.
   - Claude rules, lockfile integrity, and author allowlist strictly preserved.
   - D4/D8/D6/D3/D5/D7/D9 decisions remain user-only.
