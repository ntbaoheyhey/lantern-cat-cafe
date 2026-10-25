STATUS: DONE
STACKED ON ai/codex-v26-e2e @ 33481ce01933834876037127e2753773a9a204cc: merge that first

# C-R2 / Q13: actors survive stage recreation (Finding A-R1-1)

Review date: 2026-10-26, Asia/Saigon. Branch: ai/codex-fix-stage-redraw. This is one named QA bug on its own branch, based on completed Q9, never on the PARTIAL responsive branch. No Antigravity code/report branch was merged or used as an implementation parent.

## Gate and scope

The user chose “Keep scope; let Antigravity document it first.” Antigravity then published the independent finding. Q13 explicitly permits a separate regression fix when reports/qa-v2-1.md on an ai/antigravity-* branch names the bug. Gate is now PASS; C-R1's CSS-only allowlist was not expanded.

Read-only gate evidence:

```text
$ git rev-parse origin/ai/antigravity-responsive-qa
9980b46c01f60dc41975975f6166e99cff16b918
$ git show origin/ai/antigravity-responsive-qa:reports/qa-v2-1.md
5.2 Addendum Findings: Finding A-R1-1 (MAJOR)
StageScene create-time isActive guard drops actor redraw after viewport resize.
$ git show 33481ce01933834876037127e2753773a9a204cc:reports/v26-e2e.md
STATUS: DONE
$ git rev-parse origin/main
337977751204b5ea59d8f0cabfb91fb4cd4a391f
```

Finding source: [Antigravity QA1 at the audited commit](https://github.com/ntbaoheyhey/taskbar-hero/blob/9980b46c01f60dc41975975f6166e99cff16b918/reports/qa-v2-1.md), with [independent QA details](https://github.com/ntbaoheyhey/taskbar-hero/blob/9980b46c01f60dc41975975f6166e99cff16b918/reports/responsive-qa.md). Its PARTIAL status is the QA verdict on the old source; it is not an implementation dependency or a claim that this fix has independent sign-off.

Own allowlist and reasons:

- apps/web/src/game/stage/StageScene.ts: defer queued initial display until Phaser's CREATE event, then remove the callback on shutdown and retain director cleanup.
- apps/web/src/game/stage/StageScene.test.ts: lifecycle regression with the real show() implementation and mocked rendering dependencies.
- apps/web/e2e/layout/stage-redraw.spec.ts: real Chromium canvas regression after repeated logical-width changes, for normal/reduced motion.
- reports/fix-stage-redraw.md and reports/fix-stage-redraw/*.png: review report and unretouched canvas evidence.

StageCanvas.tsx, CSS, shared HUD, metrics, authoritative state, contracts/auth, economy, art, dependencies, locks/workspace and applied migrations are unchanged relative to Q9. Older test-generated screenshots were restored. Inherited Q9/Q5/Q4 changes are separate completed cards; see their reports for their scope. No source from C-R1 was copied into this fix.

## Behavior and regression

Before: StageCanvas queues state before Phaser boot; create() calls show() while Phaser is CREATING. isActive() returns false until RUNNING, so both sprites can remain absent until a later state update. Every viewport change that recreates the scene can repeat the failure.

After: create() registers a one-shot CREATE callback. Phaser emits it after entering RUNNING, and show() draws the latest queued state and motion preference. The active guard remains intact. Shutdown removes a pending callback and destroys the combat director. No timer, forced game-state update or weakened guard is used.

The unit regression verifies actual sprite creation after startup, latest queued class/reduced-motion selection, three scene replacements using the identical state object, director shutdown, and cancellation before CREATE. On unchanged production code it reported 2 failed / 1 passed; after one source fix round all 3 pass.

The browser regression runs one continuous session through 1600×900 → 1280×720 → 1024×768 → 1023×600 → 768×600 → 601×480 → 600×600 → 390×844 → 320×568 → 844×390 → 1280×480 → 1600×900. It waits for the target canvas dimensions, then verifies nontransparent pixels in BOTH the cat and monster halves of the canvas. The backdrop is HTML outside the canvas and cannot satisfy this check. It also checks exactly one canvas, unchanged class, unchanged performance.timeOrigin and zero browser errors. Normal and reduced motion both failed before the fix (both actor halves false at 1600×900); both pass after it. Final full-suite execution includes the dimension wait. Three reduced-motion canvas PNGs show current art at 1600, 390 and 320 widths; these are rendered output, not snapshots used to hide a test failure.

## Final-round harness correction

The first full browser run reported 69 passed / 1 failed in the new no-preference test: a strict-mode locator resolved to both old width 256 and new width 204 canvases between the separate count and dimension assertions. Phaser Game.destroy() sets pendingDestroy and removes its canvas on a subsequent frame. This was a transient handoff race in the new harness, not an actor-pixel failure. Second/final fix round: atomically poll the complete canvas dimension list for EXACTLY [[targetWidth, 96]], then inspect both actor halves. No first()/last() selection, count allowance, timeout increase or assertion relaxation was used. All required root checks and the full browser suite were rerun afterward. The failure excerpt is retained below.

## Acceptance and limits

- PASS: eligible named QA1 finding verified on the remote; separate branch and one-bug scope.
- PASS: failing regression reproduced before editing StageScene; actor/lifecycle assertions preserved.
- PASS: first source fix round resolves startup and resize behavior, including latest state and shutdown.
- PASS: frozen install, generated-map drift, typecheck, lint, root unit suites, build and whole browser suite. Actual output follows.
- PASS: own diff allowlist and all authors checked; main unchanged; source branch/report only.
- NOT VERIFIED: physical iOS/Android, WebKit, deployed behavior, assistive technology, real backend or Fuji mint. Browser evidence is Chromium viewport simulation with a labelled prepared demo save.
- WAITING: Claude review/integration and independent Antigravity retest of the fixed commit. A-R1's old FAIL verdict remains historical evidence, not silently rewritten.

No PR/merge/main push, workflow, deployment, Site access change, live SQL/backend write, transaction/signing, auth/contract change, economy application/sign-off, final class art or D-decision. D4 remains NOT READY; D8/D6/D3/D5/D7/D9 gates remain open. Deno is unavailable; gen:deno drift was checked, a Deno executable check was not run.

## Actual commands and results

Focused before/after commands used pinned pnpm 10.28.0 with CI=true; Playwright used PLAYWRIGHT_BROWSERS_PATH=/home/agent/.cache/ms-playwright. A classic vite build supplied the unchanged baseline preview before the initial browser reproduction. Focused commands:

```text
pnpm --filter @taskbar-hero/web test src/game/stage/StageScene.test.ts
pnpm --filter @taskbar-hero/web typecheck
pnpm --filter @taskbar-hero/web exec playwright test stage-redraw.spec.ts --project=stage-layout
```

### stage-redraw-before-unit

```text
> @taskbar-hero/web@0.0.0 test /workspace/taskbar-stage-redraw/apps/web
> vitest run src/game/stage/StageScene.test.ts
AssertionError: expected "vi.fn()" to be called 2 times, but got 0 times
AssertionError: expected "vi.fn()" to be called 2 times, but got 0 times
 Test Files  1 failed (1)
      Tests  2 failed | 1 passed (3)
   Duration  1.15s (environment 55%, transform 36%, import 8%, tests 1%)
```

### stage-redraw-before-browser

```text
    Error: cat and monster redraw at 1600×900
    cat and monster redraw at 1600×900
    -   true,
    -   true,
    +   false,
    +   false,
    > 33 |     }), { message: `cat and monster redraw at ${width}×${height}` }).toEqual([true, true]);
    Error: cat and monster redraw at 1600×900
    cat and monster redraw at 1600×900
    -   true,
    -   true,
    +   false,
    +   false,
    > 33 |     }), { message: `cat and monster redraw at ${width}×${height}` }).toEqual([true, true]);
  2 failed
```

### stage-redraw-after-unit

```text
> @taskbar-hero/web@0.0.0 test /workspace/taskbar-stage-redraw/apps/web
> vitest run src/game/stage/StageScene.test.ts
 Test Files  1 passed (1)
      Tests  3 passed (3)
   Duration  782ms (environment 75%, transform 14%, import 9%, tests 1%, worker 1%)
```

### stage-redraw-after-browser

```text
  2 passed (7.5s)
```

### stage-redraw-round1-e2e

```text
$ cd apps/web && PLAYWRIGHT_BROWSERS_PATH=/home/agent/.cache/ms-playwright pnpm test:e2e
> @taskbar-hero/web@0.0.0 test:e2e /workspace/taskbar-stage-redraw/apps/web
> playwright test
    Error: expect(locator).toHaveAttribute(expected) failed
    Expected: "204"
    Error: strict mode violation: getByRole('region', { name: 'Game stage' }).locator('canvas') resolved to 2 elements:
        1) <canvas width="256" height="96"></canvas> aka locator('canvas').first()
        2) <canvas width="204" height="96"></canvas> aka locator('canvas').nth(1)
  1 failed
  69 passed (1.6m)
EXIT 1; runtime 98.40s
```

### stage-redraw-install

```text
$ pnpm install --frozen-lockfile
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 753ms using pnpm v10.28.0
EXIT 0; runtime 0.82s
```

### stage-redraw-deno

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions
> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-stage-redraw
> node scripts/gen-deno-json.mjs
EXIT 0; runtime 0.32s
```

### stage-redraw-typecheck

```text
$ pnpm typecheck
> taskbar-hero@0.0.0 typecheck /workspace/taskbar-stage-redraw
> pnpm -r typecheck
EXIT 0; runtime 15.69s
```

### stage-redraw-lint

```text
$ pnpm lint
> taskbar-hero@0.0.0 lint /workspace/taskbar-stage-redraw
> pnpm -r lint
EXIT 0; runtime 14.69s
```

### stage-redraw-test

```text
$ pnpm test
> taskbar-hero@0.0.0 test /workspace/taskbar-stage-redraw
> pnpm -r test
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Duration  313ms (import 41%, transform 40%, tests 10%, worker 9%)
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Duration  571ms (import 60%, tests 31%, transform 8%, worker 1%)
supabase/tests test:  Test Files  18 passed (18)
supabase/tests test:       Tests  385 passed (385)
supabase/tests test:    Duration  46.64s (tests 90%, import 10%)
packages/game-rules test:  Test Files  19 passed | 2 skipped (21)
packages/game-rules test:       Tests  326 passed | 2 expected fail | 4 skipped (332)
packages/game-rules test:    Duration  86.01s (tests 99%, import 1%)
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Duration  215ms (transform 48%, import 39%, tests 8%, worker 4%)
apps/web test:  Test Files  81 passed (81)
apps/web test:       Tests  1066 passed (1066)
apps/web test:    Duration  78.74s (environment 57%, tests 31%, import 10%, transform 1%)
EXIT 0; runtime 167.42s
```

### stage-redraw-build

```text
$ pnpm build
> taskbar-hero@0.0.0 build /workspace/taskbar-stage-redraw
> pnpm -r build
packages/chain build: Done
packages/auth build: Done
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build: Done
apps/web build: Done
EXIT 0; runtime 15.16s
```

### stage-redraw-e2e

```text
$ cd apps/web && PLAYWRIGHT_BROWSERS_PATH=/home/agent/.cache/ms-playwright pnpm test:e2e
> @taskbar-hero/web@0.0.0 test:e2e /workspace/taskbar-stage-redraw/apps/web
> playwright test
  70 passed (1.6m)
EXIT 0; runtime 97.17s
```

## Diff and author verification

Own implementation diff from completed parent (report/images added separately):

```text
apps/web/e2e/layout/stage-redraw.spec.ts     |  48 ++++++++++++++++++++++
 apps/web/src/game/stage/StageScene.test.ts   |  59 +++++++++++++++++++++++++++
 apps/web/src/game/stage/StageScene.ts        |   9 +++-
 reports/fix-stage-redraw/actors-1600-900.png | Bin 0 -> 10438 bytes
 reports/fix-stage-redraw/actors-320-568.png  | Bin 0 -> 3332 bytes
 reports/fix-stage-redraw/actors-390-844.png  | Bin 0 -> 2826 bytes
 6 files changed, 114 insertions(+), 2 deletions(-)
```

```text
$ git log --format='%an <%ae>' origin/main..HEAD | sort -u
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

Full inherited stack diff requested by S3 (includes completed parent cards):

```text
apps/web/e2e/layout/arena.spec.ts          |  22 ++
 apps/web/e2e/layout/character-bag.spec.ts  |  17 +-
 apps/web/e2e/layout/stage-layout.spec.ts   |  45 +++-
 apps/web/e2e/layout/stage-redraw.spec.ts   |  48 +++++
 apps/web/e2e/v2/loop.spec.ts               | 146 +++++++++++++
 apps/web/playwright.config.ts              |   7 +-
 apps/web/src/dev/ArenaPreview.tsx          |  13 ++
 apps/web/src/game/arena/ArenaScene.test.ts |  39 ++++
 apps/web/src/game/arena/ArenaScene.ts      |  96 +++++++++
 apps/web/src/game/arena/BossArena.test.tsx |  32 +++
 apps/web/src/game/arena/BossArena.tsx      |  38 ++++
 apps/web/src/game/arena/arena.css          |   8 +
 apps/web/src/game/arena/assets.ts          |  39 ++++
 apps/web/src/game/arena/index.ts           |   2 +
 apps/web/src/game/arena/playBossFight.ts   |  21 ++
 apps/web/src/game/arena/playback.test.ts   |  39 ++++
 apps/web/src/game/arena/playback.ts        |  28 +++
 apps/web/src/game/stage/StageCanvas.tsx    |  33 +++
 apps/web/src/game/stage/StageScene.test.ts |  59 +++++
 apps/web/src/game/stage/StageScene.ts      |  58 +++++
 apps/web/src/game/stage/bulkEquip.test.ts  |  57 +++++
 apps/web/src/game/stage/progress.ts        |   8 +
 apps/web/src/game/stage/storeV2.test.ts    |  33 +++
 apps/web/src/game/v2/storeV2.ts            |  46 ++++
 apps/web/src/layout/StageLayout.test.tsx   |  49 ++++-
 apps/web/src/layout/StageLayout.tsx        | 109 ++++++++--
 apps/web/src/layout/layout.css             |  11 +
 apps/web/src/main.tsx                      |   2 +
 reports/fix-bulk-equip.md                  | 136 ++++++++++++
 reports/v16-stage.md                       | 333 +++++++++++++++++++++++++++++
 reports/v16-stage/stage-1280.png           | Bin 0 -> 36093 bytes
 reports/v16-stage/stage-390.png            | Bin 0 -> 31824 bytes
 reports/v19-arena.md                       | 300 ++++++++++++++++++++++++++
 reports/v19-arena/1280.png                 | Bin 0 -> 31112 bytes
 reports/v19-arena/390-reduced.png          | Bin 0 -> 21169 bytes
 reports/v26-e2e.md                         | 192 +++++++++++++++++
 reports/v26-e2e/equip-1280.png             | Bin 0 -> 36171 bytes
 reports/v26-e2e/equip-390-reduced.png      | Bin 0 -> 33580 bytes
 reports/v26-e2e/equip-390.png              | Bin 0 -> 33575 bytes
 reports/v26-e2e/forge-1280.png             | Bin 0 -> 34251 bytes
 reports/v26-e2e/forge-390-reduced.png      | Bin 0 -> 40646 bytes
 reports/v26-e2e/forge-390.png              | Bin 0 -> 40646 bytes
 reports/v26-e2e/fresh-1280.png             | Bin 0 -> 34894 bytes
 reports/v26-e2e/fresh-390-reduced.png      | Bin 0 -> 29483 bytes
 reports/v26-e2e/fresh-390.png              | Bin 0 -> 29483 bytes
 reports/v26-e2e/idle-1280.png              | Bin 0 -> 36127 bytes
 reports/v26-e2e/idle-390-reduced.png       | Bin 0 -> 31828 bytes
 reports/v26-e2e/idle-390.png               | Bin 0 -> 31824 bytes
 reports/v26-e2e/loss-1280.png              | Bin 0 -> 35852 bytes
 reports/v26-e2e/loss-390-reduced.png       | Bin 0 -> 30999 bytes
 reports/v26-e2e/loss-390.png               | Bin 0 -> 42368 bytes
 reports/v26-e2e/reload-1280.png            | Bin 0 -> 35600 bytes
 reports/v26-e2e/reload-390-reduced.png     | Bin 0 -> 32900 bytes
 reports/v26-e2e/reload-390.png             | Bin 0 -> 32900 bytes
 reports/v26-e2e/win-1280.png               | Bin 0 -> 36716 bytes
 reports/v26-e2e/win-390-reduced.png        | Bin 0 -> 34531 bytes
 reports/v26-e2e/win-390.png                | Bin 0 -> 34471 bytes
 57 files changed, 2038 insertions(+), 28 deletions(-)
```
