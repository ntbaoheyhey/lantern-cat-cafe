STATUS: DONE
TESTED COMMIT: ai/codex-responsive-window @ 282843de2790f0b2e1f3dfecaeae8c44a5cdd3b6

# A-R2 Independent Responsive Retest Report

- **Date:** 2026-10-26 (Asia/Saigon)
- **Reviewer:** Antigravity (Independent QA Assistant)
- **Source Under Test:** `ai/codex-responsive-window` @ `282843de2790f0b2e1f3dfecaeae8c44a5cdd3b6` (detached checkout)
- **Parent Fix Branch:** `ai/codex-fix-stage-redraw` @ `7760775cd2beae2f87efbcbeef6b849c5ae28a5c`
- **Report Branch:** `ai/antigravity-responsive-retest` (branched from `origin/main` @ `337977751204b5ea59d8f0cabfb91fb4cd4a391f`)
- **Historical Reference:** `reports/qa-v2-1.md` / `reports/responsive-qa.md` on `ai/antigravity-responsive-qa` @ `9980b46c01f60dc41975975f6166e99cff16b918` (Finding A-R1-1)

---

## 1. Executive Summary & Gate Verification

| Check / Gate | Target | Result | Details |
| :--- | :--- | :--- | :--- |
| **Gate 1: Coordination Plan** | `docs/responsive-coordination.md` | **PASS** | Reviewed and adhered to bounded read-only QA protocol. |
| **Gate 2: Implementation Reports** | `reports/responsive-window.md`<br>`reports/fix-stage-redraw.md` | **PASS** | Both reports start with `STATUS: DONE`. |
| **Gate 3: Exact Detached SHA** | `282843de2790f0b2e1f3dfecaeae8c44a5cdd3b6` | **PASS** | Tested exact source in detached checkout without merging or copying. |
| **Finding A-R1-1 Resolution** | StageScene recreate actor drop | **RESOLVED** | Verified both cat and monster non-transparent pixels after canvas settles across all 12 viewports and lifecycle events. |
| **Continuous Resize Matrix** | 12 viewports (Dark & Light) | **PASS** | 0 page reloads, 0 horizontal overflow, 0 HUD overlap/clipping, 1 canvas throughout. |
| **Lifecycle & Edge Scenarios** | 4 priority scenarios + long values + zoom | **PASS** | Class selection, rapid thrash, Mini mode toggle, page reload, 100%/200% zoom all pass. |
| **Focused Browser Suite** | `resize.spec.ts stage-redraw.spec.ts` | **PASS** | 4 passed (15.1s) under `@taskbar-hero/web` stage-layout project. |
| **Full Browser Suite** | `pnpm --filter @taskbar-hero/web test:e2e` | **PASS** | 72 passed (23.5s) across all projects. |
| **Root Deno Drift & Install** | Frozen install + drift check | **PASS** | Pinned pnpm 10.28.0, CI=true, 0 diff in `supabase/functions`. |
| **Browser Engines** | Chromium / WebKit | **Chromium: PASS**<br>**WebKit: NOT VERIFIED** | Chromium 156.0 verified; WebKit binary absent from local environment cache. |
| **Physical Devices** | Real iOS / Android | **NOT VERIFIED** | Simulation only; physical hardware not connected. |

---

## 2. Independent Determination of Finding A-R1-1

### 2.1 Background & Root Cause
In A-R1 (`reports/qa-v2-1.md` Finding A-R1-1 @ `9980b46c01f60dc41975975f6166e99cff16b918`), viewport resizing changed `logicalWidth`, triggering a React unmount/remount of `StageCanvas` and recreating `Phaser.Game` and `StageScene`. The initial synchronous `StageScene.show()` call was rejected by `!this.sys.isActive()`. During `StageScene.create()`, Phaser's scene status was `Phaser.Scenes.CREATING` (2), whereas `sys.isActive()` strictly required `Phaser.Scenes.RUNNING` (3). Because no listener was attached to `Phaser.Scenes.Events.CREATE`, the canvas remained completely blank (0 non-transparent pixels).

### 2.2 Fix Implementation under C-R2 / Q13
Codex resolved this bug in `apps/web/src/game/stage/StageScene.ts`:
1. `create()` registers a one-shot listener: `this.events.once(Phaser.Scenes.Events.CREATE, showQueuedState)`.
2. When Phaser completes `create()` and transitions to `RUNNING`, it emits `CREATE`, at which point `sys.isActive()` returns `true` and `show()` renders the queued state and motion preference.
3. On `SHUTDOWN`, the listener is deregistered if still pending and `this.director?.destroy()` is invoked.

### 2.3 Retest Verdict: RESOLVED
This finding was independently evaluated not merely from code inspection or test outputs, but through direct canvas pixel extraction (`getImageData`) across both actor halves:
- Left half ($x < \text{width} / 2$): Cat sprite.
- Right half ($x \ge \text{width} / 2$): Monster sprite.
Across every tested viewport, both halves contained hundreds of non-transparent pixels (Cat: 305–328 px; Monster: 187–197 px). The canvas count was strictly 1 at all times with 0 lingering or orphan canvases. Finding A-R1-1 is **RESOLVED**. A-R1's historical FAIL record remains preserved in git history.

---

## 3. Continuous Session Matrix Results

Session performed continuously without page reload (`performance.timeOrigin` strictly invariant).

### 3.1 Dark Theme (Normal Motion)

| # | Viewport | Layout Mode | Logical W×H | Horizontal Overflow | HUD Geometry | Actor Pixels (Cat / Monster) | Status | Screenshot |
|---|---|---|---|---|---|---|---|---|
| 1 | 1600 × 900 | `desktop` | 266 × 96 | None (0px) | 0 issues | 311 px / 187 px | **PASS** | [matrix-1600x900-dark.png](responsive-retest/matrix-1600x900-dark.png) |
| 2 | 1280 × 720 | `desktop` | 256 × 96 | None (0px) | 0 issues | 311 px / 187 px | **PASS** | [matrix-1280x720-dark.png](responsive-retest/matrix-1280x720-dark.png) |
| 3 | 1024 × 768 | `desktop` | 204 × 96 | None (0px) | 0 issues | 305 px / 187 px | **PASS** | [matrix-1024x768-dark.png](responsive-retest/matrix-1024x768-dark.png) |
| 4 | 1023 × 600 | `tablet` | 255 × 96 | None (0px) | 0 issues | 311 px / 187 px | **PASS** | [matrix-1023x600-dark.png](responsive-retest/matrix-1023x600-dark.png) |
| 5 | 768 × 600 | `tablet` | 192 × 96 | None (0px) | 0 issues | 311 px / 187 px | **PASS** | [matrix-768x600-dark.png](responsive-retest/matrix-768x600-dark.png) |
| 6 | 601 × 480 | `tablet` | 200 × 96 | None (0px) | 0 issues | 305 px / 187 px | **PASS** | [matrix-601x480-dark.png](responsive-retest/matrix-601x480-dark.png) |
| 7 | 600 × 600 | `phone` | 200 × 96 | None (0px) | 0 issues | 305 px / 194 px | **PASS** | [matrix-600x600-dark.png](responsive-retest/matrix-600x600-dark.png) |
| 8 | 390 × 844 | `phone` | 195 × 96 | None (0px) | 0 issues | 305 px / 187 px | **PASS** | [matrix-390x844-dark.png](responsive-retest/matrix-390x844-dark.png) |
| 9 | 320 × 568 | `phone` | 160 × 96 | None (0px) | 0 issues | 311 px / 187 px | **PASS** | [matrix-320x568-dark.png](responsive-retest/matrix-320x568-dark.png) |
| 10 | 844 × 390 | `tablet` | 281 × 96 | None (0px) | 0 issues | 311 px / 187 px | **PASS** | [matrix-844x390-dark.png](responsive-retest/matrix-844x390-dark.png) |
| 11 | 1280 × 480 | `desktop` | 426 × 96 | None (0px) | 0 issues | 311 px / 187 px | **PASS** | [matrix-1280x480-dark.png](responsive-retest/matrix-1280x480-dark.png) |
| 12 | 1600 × 900 | `desktop` | 266 × 96 | None (0px) | 0 issues | 311 px / 187 px | **PASS** | [matrix-1600x900-dark-return.png](responsive-retest/matrix-1600x900-dark-return.png) |

- **State Identity Verification:** `classId: "witch"`, `level: 15`, item IDs `["starter:0"]`, and active Forge tab remained identical through all 12 transitions.
- **Console Errors:** 0 page errors, 0 console errors throughout.

### 3.2 Light Theme (Reduced Motion)

- Emulated `prefers-reduced-motion: reduce` and `data-theme="light"`.
- Tested across all 12 viewports in the same sequence.
- **Results:**
  - `1600×900`: PASS | Canvas: 266×96 | Cat: 320 px, Monster: 187 px
  - `1280×720`: PASS | Canvas: 256×96 | Cat: 320 px, Monster: 187 px
  - `1024×768`: PASS | Canvas: 204×96 | Cat: 320 px, Monster: 187 px
  - `1023×600`: PASS | Canvas: 255×96 | Cat: 320 px, Monster: 187 px
  - `768×600`: PASS | Canvas: 192×96 | Cat: 320 px, Monster: 187 px
  - `601×480`: PASS | Canvas: 200×96 | Cat: 320 px, Monster: 187 px
  - `600×600`: PASS | Canvas: 200×96 | Cat: 320 px, Monster: 187 px
  - `390×844`: PASS | Canvas: 195×96 | Cat: 320 px, Monster: 187 px
  - `320×568`: PASS | Canvas: 160×96 | Cat: 320 px, Monster: 187 px
  - `844×390`: PASS | Canvas: 281×96 | Cat: 320 px, Monster: 187 px
  - `1280×480`: PASS | Canvas: 426×96 | Cat: 320 px, Monster: 187 px
  - `1600×900`: PASS | Canvas: 266×96 | Cat: 320 px, Monster: 187 px
- Evidence: [matrix-1280x720-light-reduced.png](responsive-retest/matrix-1280x720-light-reduced.png), [actors-reduced-motion-light.png](responsive-retest/actors-reduced-motion-light.png).

---

## 4. Priority Scenarios & Lifecycle Edge Cases

### Scenario 1: First Load & Class Selection
- **Procedure:** Cleared `localStorage` completely, refreshed page. `ClassPicker` modal rendered. Selected Warrior (`wpn.sword.twig`), confirmed selection.
- **Verification:** Initial `show()` queued before Phaser boot; Phaser `create()` registered `CREATE` callback; once in `RUNNING`, actors rendered immediately.
- **Metrics:** Exactly 1 canvas; Cat: 328 px; Monster: 197 px; 0 errors.
- **Evidence:** [scenario-1-classpicker.png](responsive-retest/scenario-1-classpicker.png), [scenario-1-selected-rendered.png](responsive-retest/scenario-1-selected-rendered.png), [canvas-scenario-1-warrior.png](responsive-retest/canvas-scenario-1-warrior.png).
- **Verdict:** **PASS**.

### Scenario 2: Rapid Repeated Shrink / Stretch
- **Procedure:** Executed 8 rapid viewport resizes (`320×568` $\leftrightarrow$ `1600×900` $\leftrightarrow$ `390×844` $\leftrightarrow$ `1280×720` $\leftrightarrow$ `600×600` $\leftrightarrow$ `1024×768` $\leftrightarrow$ `320×568` $\leftrightarrow$ `1280×720`) with 40ms delays, intentionally thrashing Phaser before scene recreation could complete.
- **Verification:** Once viewport settled at `1280×720`, verified canvas count = 1, dimensions = $256 \times 96$, and both actors rendered cleanly without race conditions or leaks.
- **Metrics:** Exactly 1 canvas; Cat: 311 px; Monster: 187 px; 0 console errors.
- **Evidence:** [scenario-2-rapid-resize-final.png](responsive-retest/scenario-2-rapid-resize-final.png).
- **Verdict:** **PASS**.

### Scenario 3: Mini Mode $\leftrightarrow$ Stage Layout Toggle
- **Procedure:** Clicked "Mini mode" to switch to the classic 96px ambient strip layout. Verified strip layout, then clicked "Stage" to return to stage-first layout.
- **Verification:** Verified shutdown cleanup (director destroyed, previous scene cleaned up), exactly 1 canvas recreated, and actors rendered immediately.
- **Metrics:** Exactly 1 canvas; Cat: 311 px; Monster: 187 px; 0 errors.
- **Evidence:** [scenario-3-mini-mode.png](responsive-retest/scenario-3-mini-mode.png), [scenario-3-return-stage.png](responsive-retest/scenario-3-return-stage.png).
- **Verdict:** **PASS**.

### Scenario 4: Page Reload & State Restoration
- **Procedure:** Replaced page with hard `page.reload()`.
- **Verification:** State restored from `localStorage`, canvas mounted, and queued state rendered on `CREATE`.
- **Metrics:** Exactly 1 canvas; Cat: 311 px; Monster: 187 px; 0 errors.
- **Evidence:** [scenario-4-page-reload.png](responsive-retest/scenario-4-page-reload.png).
- **Verdict:** **PASS**.

---

## 5. Layout & Functional Feature Checks

### 5.1 Long Currency & XP Values
- **Test Save:** Level 50, XP 999,999, Fish: 999,999,999, Yarn: 88,888,888, Moon Pearls: 999,999, Cat Keys: 5.
- **Desktop (1280×720):** 0 HUD issues, 0 horizontal overflow. Numbers wrap cleanly within `.hud-bar`.
- **Narrow Phone (320×568):** 0 HUD issues, 0 horizontal overflow. HUD elements wrap into multi-line pill layout without overlapping or clipping leaves.
- **Evidence:** [edge-long-values-1280x720.png](responsive-retest/edge-long-values-1280x720.png), [edge-long-values-320x568.png](responsive-retest/edge-long-values-320x568.png).
- **Verdict:** **PASS**.

### 5.2 Actual Browser Zoom (100% and 200%)
- **Zoom Method Recorded:** Chrome DevTools Protocol (CDP) session invoking `Emulation.setPageScaleFactor` with `pageScaleFactor: 2.0` (direct browser viewport magnification).
- **100% Zoom:** 0 HUD geometry issues, actors present and crisp.
- **200% Zoom:** 0 HUD geometry issues, HUD bar retains layout hierarchy, canvas remains sharp and actors render properly.
- **Evidence:** [zoom-100-percent.png](responsive-retest/zoom-100-percent.png), [zoom-200-percent.png](responsive-retest/zoom-200-percent.png).
- **Verdict:** **PASS**.

### 5.3 Feature Panels & Phone Sheet
- **Character & Bag Panel:** Displayed equipment slots, power chip, and inventory grid. [panel-character-bag.png](responsive-retest/panel-character-bag.png).
- **Forge Panel:** Verified tabs (Craft, Salvage, Relic Forge). [panel-forge-tabs.png](responsive-retest/panel-forge-tabs.png).
- **Boss Arena & Chest:** Boss gate ready, arena playback cleanly executed, victory chest rendered. [panel-boss-ready.png](responsive-retest/panel-boss-ready.png), [panel-boss-fight-arena.png](responsive-retest/panel-boss-fight-arena.png).
- **Phone Sheet Scroll & Reachability (390×844):** Bottom sheet opened over stage, verified smooth scroll down to action buttons, focus active, and clean close. [phone-sheet-top-390.png](responsive-retest/phone-sheet-top-390.png), [phone-sheet-scrolled-390.png](responsive-retest/phone-sheet-scrolled-390.png).
- **Verdict:** **PASS**.

---

## 6. Test Suite Execution & Output Evidence

### 6.1 Focused Browser Command
```text
$ pnpm --filter @taskbar-hero/web exec playwright test resize.spec.ts stage-redraw.spec.ts --project=stage-layout

Running 4 tests using 2 workers
····
  4 passed (15.1s)
```

### 6.2 Full Playwright Test Suite
```text
$ pnpm --filter @taskbar-hero/web test:e2e
> playwright test

Running 72 tests using 6 workers
········································································
  72 passed (23.5s)
```

### 6.3 Vitest Lifecycle Regression
```text
$ pnpm --filter @taskbar-hero/web exec vitest run src/game/stage/StageScene.test.ts

 ✓ src/game/stage/StageScene.test.ts (3 tests) 3ms
   ✓ renders the latest queued state after Phaser enters RUNNING, without another state update 2ms
   ✓ draws a newly created replacement scene even when its state object is unchanged 1ms
   ✓ cancels a queued startup render when the scene shuts down before CREATE 0ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Duration  613ms
```

### 6.4 Deno Drift Check
```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions
wrote 18 Edge Function import maps
EXIT 0
```

---

## 7. Actionable Bug Summary & Status

- **Previous Finding A-R1-1:** **RESOLVED** by C-R2 (`ai/codex-fix-stage-redraw` @ `7760775cd2beae2f87efbcbeef6b849c5ae28a5c`) and inherited by `ai/codex-responsive-window` @ `282843de2790f0b2e1f3dfecaeae8c44a5cdd3b6`.
- **New Findings:** None. No new QA1 cards or regressions were uncovered during this retest.
- **Overall Re-test Verdict:** **PASS**.

---

## 8. Hard Stops & Gated Boundaries

- D4 remains **NOT READY**; D8 (Founder approval/application), D6 (cutover/flag merge), D3/D5 (art), and D7/D9 remain user gates.
- No PR, merge, main push, live backend/SQL write, transactions, auth/contract changes, economy modifications, or final class art were performed.
- QA completion is an independent verification report; it does not constitute release sign-off or production milestone sign-off.
