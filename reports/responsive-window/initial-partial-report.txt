STATUS: PARTIAL
STACKED ON ai/codex-v26-e2e @ 33481ce01933834876037127e2753773a9a204cc: merge that first

# Responsive window fix and temporary coordination handoff

The user requested temporary coordination for Codex/Antigravity under Claude's existing rules, automatic layout adaptation as the browser/in-app window shrinks or stretches, and a Claude review report. Later the user authorized automatic new Codex chats and said Antigravity prompts would be pasted manually.

## Outcome

The existing window resize listener already switches between desktop, tablet and phone and resizes the pixel-art scene. The defect was inside the HUD: at >=600 px shared styles force nowrap and hide horizontal overflow. Consequently XP text crossed the chapter chip and currency items crossed the power chip, despite no document scrollbar. The added geometry regression reproduced this in both themes at 1600×900 before the fix.

The stage shell now gives the HUD its own full-width row and allows groups, XP elements, currency items and chapter text to wrap according to available space. Lower panel children can shrink within their grid cells, and phone sheet content can shrink/scroll. Existing viewport metrics, game rendering/lifecycle, UI components and classic layout code are unchanged. The new styles are scoped to v2 layout classes; no stat is removed and overflow is not hidden to pass the check.

The continuous-resize test checks 1600×900 → 1280×720 → 1024×768 → 1023×600 → 768×600 → 601×480 → 600×600 → 390×844 → 320×568 → 844×390 → 1280×480 → 1600×900, in dark and light themes. It checks leaf rectangles stay inside the HUD and do not overlap, no page horizontal overflow, class/level/inventory IDs and active Forge tab survive, no page reload (timeOrigin unchanged), exactly one stage canvas, and actual nontransparent actor pixels after each redraw. Screenshots wait for actors rather than capturing a newly created empty canvas.

## Coordination and rules

- [Plan](../docs/responsive-coordination.md): C-R1 Codex implementation; A-R1 independent Antigravity visual/phone QA; C-R2 WAITING on named eligible QA findings.
- [Antigravity prompt](../docs/prompts/antigravity-responsive-qa.md): ready for the user to paste. Not dispatched. Report-only branch and dated QA1 findings; no product fixes or merging another tool's source.
- [Codex independent-review prompt](../docs/prompts/codex-responsive-review.md): prepared, not dispatched. Tool discovery searched create_thread and new-chat capabilities; no callable create_thread is exposed in this session. No new user chat or substitute agent was created. User permission is recorded and need not be requested again if the tool becomes available.
- Claude's original approved-plan copy is not edited. No PR, main push/merge, Antigravity branch merge, workflow, deployment, live SQL, real transaction, auth/contract, dependency/lock/workspace, signed number or final art change. D4 remains NOT READY; D8/D6/D3/D5/D7/D9 stay user-only. This plan does not elevate temporary coordination into production authority.

## Acceptance

- PASS: both focused resize tests reproduce the old overlap and pass after the CSS fix; assertions were retained. FAIL: final full Playwright run checks actor pixels and finds 2 redraw failures; 68 other browser tests pass.
- PASS in initial geometry-only focused run: resize boundaries and state/tab persistence. NOT VERIFIED after a successful pixel guard: full sequence stops at the missing-actors failure.
- PASS: full pinned install, gen:deno drift, typecheck, lint, unit suite and build. FAIL: whole browser suite (68 passed / 2 failed); output below.
- PASS: new plan, two complete handoff prompts and this report; source/report branch only.
- NOT VERIFIED: physical phone Safari/Android, WebKit, 200% browser zoom and exhaustive long-number/overlay QA. These are explicit A-R1 cases, not claimed as completed by desktop Chromium simulation.
- BLOCKER: StageScene.ts skips initial rendering while Phaser create() is running; fixing it is outside this card's CSS-only source scope. S5 requires stopping without weakening the pixel check.
- WAITING: independent Codex review (new-chat tool unavailable), Antigravity manual dispatch/QA and Claude review/merge. Nothing deployed; existing demo audience was last observed public, so no private-preview claim is made for new work.

## Gate and scope

Parent Q9 report STATUS: DONE; parent commit 33481ce01933834876037127e2753773a9a204cc. Own changes: layout/layout.css; new e2e/layout/resize.spec.ts; coordination plan and two prompt documents; report and representative screenshots. Shared hud/**, metrics.ts, StageLayout.tsx, API, wallet/auth, art, game rules and applied migrations are read-only and unchanged relative to parent. Incidental screenshots generated into older cards' report folders were restored; new evidence is exclusively reports/responsive-window/.

Preliminary checkout/CLI invocation errors produced no test verdict and are not counted. Correct focused command: `pnpm --filter @taskbar-hero/web exec playwright test resize.spec.ts --project=stage-layout`. Before-fix assertions failed; one CSS fix round produced focused passes. The test was then strengthened to await actor pixels and exposed an existing renderer lifecycle failure in the final full browser suite. No timeout, skip, golden or existing assertion was altered.

## Renderer blocker for Claude review

StageCanvas remounts the Phaser scene when logicalWidth changes and queues the current state through show(). StageScene.create() tries show() while Phaser is in CREATING; show() returns because sys.isActive() is false. Phaser 3.90 SceneManager.js sets RUNNING only after scene.create.call() returns, then emits CREATE. The cat/monster can therefore remain absent until a later state update. This is consistent with the pixel regression and initial phone screenshots; merely finding a canvas misses it.

Needed separate scope: apps/web/src/game/stage/StageScene.ts and a focused lifecycle regression test (StageCanvas.tsx only if investigation proves necessary). A candidate minimal repair is to render the queued state on the Phaser CREATE event after RUNNING, preserving shutdown cleanup and authoritative state. No such renderer edit has been made. Continue only via explicit user scope or a named eligible Antigravity QA1 finding and a separate fix card. Initial geometry screenshots in reports/responsive-window/ are evidence of the limited CSS result and can show the existing blank actors; they are not a completed renderer PASS.

## Actual checks

### resize-before

```text
    Error: HUD at 1600×900
    HUD at 1600×900
    +   "hud-stack-item outside HUD",
    +   "hud-xp-text overlaps hud-chip hud-progress-chip",
    +   "hud-stack-item overlaps hud-chip hud-power-chip",
    Error: HUD at 1600×900
    HUD at 1600×900
    +   "hud-stack-item outside HUD",
    +   "hud-xp-text overlaps hud-chip hud-progress-chip",
    +   "hud-stack-item overlaps hud-chip hud-power-chip",
  2 failed
```

### resize-after

```text
  2 passed (10.4s)
```

### responsive-install

```text
$ pnpm install --frozen-lockfile
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 930ms using pnpm v10.28.0
EXIT 0; runtime 1.00s
```

### responsive-deno

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions
> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-responsive
> node scripts/gen-deno-json.mjs
EXIT 0; runtime 0.44s
```

### responsive-typecheck

```text
$ pnpm typecheck
> taskbar-hero@0.0.0 typecheck /workspace/taskbar-responsive
> pnpm -r typecheck
EXIT 0; runtime 14.83s
```

### responsive-lint

```text
$ pnpm lint
> taskbar-hero@0.0.0 lint /workspace/taskbar-responsive
> pnpm -r lint
EXIT 0; runtime 14.18s
```

### responsive-test

```text
$ pnpm test
> taskbar-hero@0.0.0 test /workspace/taskbar-responsive
> pnpm -r test
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Duration  406ms (transform 52%, import 33%, tests 8%, worker 7%)
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Duration  682ms (import 60%, tests 27%, transform 11%, worker 1%)
supabase/tests test:  Test Files  18 passed (18)
supabase/tests test:       Tests  385 passed (385)
supabase/tests test:    Duration  45.18s (tests 87%, import 10%, transform 2%)
packages/game-rules test:  Test Files  19 passed | 2 skipped (21)
packages/game-rules test:       Tests  326 passed | 2 expected fail | 4 skipped (332)
packages/game-rules test:    Duration  85.13s (tests 97%, import 1%, transform 1%)
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Duration  423ms (transform 81%, import 15%, tests 3%, worker 1%)
apps/web test:  Test Files  80 passed (80)
apps/web test:       Tests  1063 passed (1063)
apps/web test:    Duration  83.21s (environment 55%, tests 31%, import 11%, transform 3%)
EXIT 0; runtime 171.41s
```

### responsive-build

```text
$ pnpm build
> taskbar-hero@0.0.0 build /workspace/taskbar-responsive
> pnpm -r build
packages/chain build: Done
packages/auth build: Done
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build: Done
apps/web build: Done
EXIT 0; runtime 16.56s
```

### responsive-e2e

```text
$ cd apps/web && PLAYWRIGHT_BROWSERS_PATH=/home/agent/.cache/ms-playwright pnpm test:e2e
> @taskbar-hero/web@0.0.0 test:e2e /workspace/taskbar-responsive/apps/web
> playwright test
  2 failed
  68 passed (1.8m)
EXIT 1; runtime 106.55s
```

## Own diff from the completed Q9 parent

```text
 apps/web/e2e/layout/resize.spec.ts           |  58 +++++++++++++++++++++++++++
 apps/web/src/layout/layout.css               |  29 +++++++++++++-
 docs/prompts/antigravity-responsive-qa.md    |  19 +++++++++
 docs/prompts/codex-responsive-review.md      |  15 +++++++
 docs/responsive-coordination.md              |  41 +++++++++++++++++++
 reports/responsive-window/dark-1280-720.png  | Bin 0 -> 32904 bytes
 reports/responsive-window/dark-1600-900.png  | Bin 0 -> 39528 bytes
 reports/responsive-window/dark-320-568.png   | Bin 0 -> 22854 bytes
 reports/responsive-window/dark-390-844.png   | Bin 0 -> 32459 bytes
 reports/responsive-window/light-1280-720.png | Bin 0 -> 32883 bytes
 reports/responsive-window/light-1600-900.png | Bin 0 -> 39492 bytes
 reports/responsive-window/light-320-568.png  | Bin 0 -> 22999 bytes
 reports/responsive-window/light-390-844.png  | Bin 0 -> 32600 bytes
 13 files changed, 161 insertions(+), 1 deletion(-)
```

## User decision after the blocker

The user answered: “Keep scope; let Antigravity document it first.” C-R1 remains PARTIAL. Do not edit StageScene/StageCanvas or broaden this card. A-R1 is the next action: independent read-only reproduction and a named dated QA1 finding. A renderer fix remains WAITING on that eligible evidence under the original Q13 rules. No new renderer approval is pending, and no generic continuation should be treated as permission to bypass this decision.
