STATUS: DONE

Fixed the two named defects on `ai/codex-fix-resize-hygiene`, based on `577faaeef7868bb5c013d54f17f8ea761c53d4b2`. No blocker remains.

## Changes

- All four screenshot writers require `SCREENSHOTS=1` and honor `SCREENSHOT_DIR`, retaining their existing fallback paths and filenames. Every existing assertion is unchanged.
- StageCanvas mounts Phaser immediately, then debounces the logical width driving game recreation by 150 ms. Pending timers are cleared on changes/unmount; StageScene is unchanged.
- Added a 100-step viewport drag (1600 to 400 px, height 900) without waits in its loop. A MutationObserver counts every canvas insertion, including reinsertion of pooled Phaser canvas nodes. The regression limits insertions to ten and checks one settled 200 × 96 canvas with nontransparent pixels in both actor halves.
- Measured baseline: 22 Phaser canvas insertions; fixed: 2 (initial mount plus settled replacement). These are browser-observed insertion counts, the regression's instance proxy. The card's separate 296-step measurement was not repeated.

The original checkout had unrelated changes and was left intact. Work used a separate worktree. No contracts, auth/SIWE, secrets, content/config numbers, proposal signature, lock/workspace files, dependencies, migration application, live database write, publication, contest submission, PR, merge, GitHub Actions, deploy, or Site sharing change was performed. Unit tests use the repo's local test environment.

## Gate and tooling — PASS

```text
$ git fetch origin ai/codex-integrate-v2-stage
From https://github.com/ntbaoheyhey/taskbar-hero
 * branch            ai/codex-integrate-v2-stage -> FETCH_HEAD
 * [new branch]      ai/codex-integrate-v2-stage -> origin/ai/codex-integrate-v2-stage
$ git rev-parse origin/ai/codex-integrate-v2-stage
577faaeef7868bb5c013d54f17f8ea761c53d4b2
$ git worktree add -b ai/codex-fix-resize-hygiene /Users/bao/Documents/ChatGPT/taskbar-hero-resize-hygiene 577faae
Preparing worktree (new branch 'ai/codex-fix-resize-hygiene')
HEAD is now at 577faae docs: record final clean-tree audit and branch delivery
$ corepack enable && corepack prepare pnpm@10.28.0 --activate && pnpm --version
zsh:1: command not found: corepack
$ npx -y pnpm@10.28.0 --version
10.28.0
```

Corepack bootstrap was unavailable; the explicitly authorized fallback was used for every pnpm invocation. Commands below show the exact fallback used.

## Baseline regression — expected FAIL, then PASS after the fix

Before changing StageCanvas:

```text
$ npx -y pnpm@10.28.0 --dir apps/web exec playwright test --project=stage-layout resize-burst
Phaser canvas instances inserted during 100-step drag: 22
  ✘  1 [stage-layout] › e2e/layout/resize-burst.spec.ts:9:1 › viewport drag limits Phaser recreation and keeps both actors (1.1s)


  1) [stage-layout] › e2e/layout/resize-burst.spec.ts:9:1 › viewport drag limits Phaser recreation and keeps both actors

    Error: expect(received).toBeLessThanOrEqual(expected)

    Expected: <= 10
    Received:    22

      47 |   const inserted = await page.evaluate(() => Number(document.documentElement.dataset.insertedCanvases));
      48 |   console.log(`Phaser canvas instances inserted during 100-step drag: ${inserted}`);
    > 49 |   expect(inserted).toBeLessThanOrEqual(10);
         |                    ^
      50 | });
      51 |
        at /Users/bao/Documents/ChatGPT/taskbar-hero-resize-hygiene/apps/web/e2e/layout/resize-burst.spec.ts:49:20

    Error Context: test-results/layout-resize-burst-viewpo-e3479-ation-and-keeps-both-actors-stage-layout/error-context.md

  1 failed
    [stage-layout] › e2e/layout/resize-burst.spec.ts:9:1 › viewport drag limits Phaser recreation and keeps both actors
```

Initial regression development incorrectly counted unique canvas nodes; Phaser pools and reuses them, so that approach passed the baseline (2–4 nodes). It was corrected to count all insertion events before collecting the red output above. The final regression uses only sequential setViewportSize calls during the drag, with no sleeps or per-step assertions. Two attempted browser launches encountered another checkout's occupied ports (4173/4174); those processes were left alone and the commands were rerun once ports became free. No configuration or timeouts were changed.

After the fix:

```text
$ npx -y pnpm@10.28.0 --dir apps/web exec playwright test --project=stage-layout resize stage-redraw
Phaser canvas instances inserted during 100-step drag: 2
  32 passed (16.2s)
```

The filename filter matches the worktree's `resize` path, so this ran all 32 stage-layout tests, including both original resize tests, both redraw tests, and the new regression.

## Required repository checks

PASS — install:

```text
$ npx -y pnpm@10.28.0 install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +505
Done in 8.2s using pnpm v10.28.0
```

Install reported ignored dependency build scripts for bufferutil, keccak and utf-8-validate; no approval or dependency changes were made.

PASS — generated import map drift:

```text
$ npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions
> node scripts/gen-deno-json.mjs
wrote 18 Edge Function import maps
```

Exit 0; the diff command emitted no output. No generated file changed.

PASS — typecheck:

```text
$ npx -y pnpm@10.28.0 typecheck
packages/chain typecheck: Done
packages/auth typecheck: Done
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck: Done
apps/web typecheck: Done
```

PASS — lint:

```text
$ npx -y pnpm@10.28.0 lint
packages/chain lint: Done
packages/auth lint: Done
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint: Done
apps/web lint: Done
```

PASS — unit tests (1,840 passed, 2 expected failures, 4 pre-existing skipped tests in 2 skipped files):

```text
$ npx -y pnpm@10.28.0 test
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
supabase/tests test:  Test Files  18 passed (18)
supabase/tests test:       Tests  385 passed (385)
packages/game-rules test:  Test Files  19 passed | 2 skipped (21)
packages/game-rules test:       Tests  326 passed | 2 expected fail | 4 skipped (332)
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
apps/web test:  Test Files  83 passed (83)
apps/web test:       Tests  1082 passed (1082)
```

No assertion was changed, skipped, disabled, deleted, or weakened; no timeout or golden/snapshot number was changed. Existing expected-failure/skipped tests are inherited unchanged from the base.

PASS — build:

```text
$ npx -y pnpm@10.28.0 build
packages/chain build: Done
packages/auth build: Done
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build: Done
apps/web build: ✓ built in 416ms
apps/web build: Done
```

Build emitted the existing node:worker_threads browser externalization warning and completed successfully.

PASS — full browser suite with screenshots disabled:

```text
$ cd apps/web && npx -y pnpm@10.28.0 test:e2e
Running 73 tests using 6 workers
Phaser canvas instances inserted during 100-step drag: 2
  73 passed (26.9s)
$ git status --short  # from repo root, after the full suite, before writing this report
 M apps/web/e2e/layout/resize.spec.ts
 M apps/web/e2e/layout/stage-layout.spec.ts
 M apps/web/e2e/layout/stage-redraw.spec.ts
 M apps/web/e2e/v2/loop.spec.ts
 M apps/web/src/game/stage/StageCanvas.tsx
?? apps/web/e2e/layout/resize-burst.spec.ts
$ git status --short -- reports/
$ git diff --exit-code 577faae -- reports/
```

Both reports checks emitted no output, exit 0. No evidence PNG changed.

PASS — screenshot opt-in and directory override:

```text
$ cd apps/web && SCREENSHOTS=1 SCREENSHOT_DIR=/tmp/taskbar-hero-resize-hygiene-evidence npx -y pnpm@10.28.0 exec playwright test --project=stage-layout --project=v2-loop
Running 47 tests using 6 workers
Phaser canvas instances inserted during 100-step drag: 2
  47 passed (21.0s)
$ find /tmp/taskbar-hero-resize-hygiene-evidence -type f -name '*.png' | wc -l
      44
```

Outputs include dark/light responsive captures, actors-1600/390/320 captures, stage/sheet/tab captures and fresh/idle/equip/win/loss/forge/reload captures. All four writers produced screenshots in the requested directory. The two stage-layout screenshot groups retain existing shared basenames when a single override directory is used.

## Acceptance and self-check

- PASS — default full browser run leaves committed reports/evidence untouched; root status pasted above.
- PASS — SCREENSHOTS=1 still produces images and SCREENSHOT_DIR is respected.
- PASS — final regression fails on baseline StageCanvas (22 > 10), passes after fix (2 <= 10).
- PASS — one settled canvas, width max(160, floor(width / zoom)), height 96; both actors present.
- PASS — original resize.spec.ts and stage-redraw.spec.ts pass with only screenshot writer changes.
- PASS — all 73 browser tests and 1,840 unit tests pass; inherited expected failures/skips disclosed above.
- PASS — measured instance proxy before/after: 22 / 2 for the same 100-step drag.
- PASS — required install, gen:deno drift, typecheck, lint, test, build, full e2e commands executed.
- PASS — no existing assertion changes; no test weakening, added skips, timeout increases or golden/snapshot edits.
- PASS — work is restricted to the seven allowed paths versus the specified base. The card explicitly replaces self-check step 3's main allowlist comparison with `577faae...HEAD`; the main diff includes the inherited stack as expected. Those inherited files were not reverted.
- PASS — Git author configured as ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>; final author and scope output follows.

No corrective product code round was needed after the implementation; all executed product checks passed. One report-formatting correction removed trailing whitespace copied from Playwright output and an extra final blank line after git diff --check flagged them. The intentional baseline red run and occupied-port attempts are disclosed above.

## NOT VERIFIED

- NOT VERIFIED — the card's original 296-step/4px benchmark was not rerun; the required 100-step regression was measured before and after.
- NOT VERIFIED — screenshot opt-in with the default output directories was not executed, to retain committed evidence; all four writers were exercised with an external SCREENSHOT_DIR.
- NOT VERIFIED — no live service, deployment, or production database behavior was exercised; none was needed for these two local fixes.

What is needed to continue: nothing for the named defects.

## Final scope and authorship audit

PASS — final audit commands (run after the first local commit; diff whitespace checked again after the report-formatting correction):

```text
$ git fetch origin +main:refs/remotes/origin/main
# exit 0, no output
$ git diff --name-only 577faae...HEAD
apps/web/e2e/layout/resize-burst.spec.ts
apps/web/e2e/layout/resize.spec.ts
apps/web/e2e/layout/stage-layout.spec.ts
apps/web/e2e/layout/stage-redraw.spec.ts
apps/web/e2e/v2/loop.spec.ts
apps/web/src/game/stage/StageCanvas.tsx
reports/fix-resize-hygiene.md
$ git diff --check 577faae...HEAD
# exit 0, no output
$ git log --format='%an <%ae>' origin/main..HEAD | sort | uniq -c
  27 ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

The unfiltered author command was also run and validated: every line has the required identity. There are 87 paths in `git diff --name-only origin/main...HEAD`, including inherited stack files; exactly seven task paths differ from 577faae. This follows the card's explicit base-comparison override.

Files touched, requested main comparison (includes inherited stack; audit snapshot before report-only amendment):

```text
$ git diff --stat origin/main...HEAD
 apps/web/e2e/layout/arena.spec.ts                  |  22 +
 apps/web/e2e/layout/character-bag.spec.ts          |  17 +-
 apps/web/e2e/layout/resize-burst.spec.ts           |  50 ++
 apps/web/e2e/layout/resize.spec.ts                 |  64 +++
 apps/web/e2e/layout/stage-layout.spec.ts           |  45 +-
 apps/web/e2e/layout/stage-redraw.spec.ts           |  50 ++
 apps/web/e2e/v2/loop.spec.ts                       | 148 ++++++
 apps/web/playwright.config.ts                      |   7 +-
 apps/web/src/dev/ArenaPreview.tsx                  |  13 +
 apps/web/src/game/arena/ArenaScene.test.ts         |  39 ++
 apps/web/src/game/arena/ArenaScene.ts              |  96 ++++
 apps/web/src/game/arena/BossArena.test.tsx         |  32 ++
 apps/web/src/game/arena/BossArena.tsx              |  38 ++
 apps/web/src/game/arena/arena.css                  |   8 +
 apps/web/src/game/arena/assets.ts                  |  39 ++
 apps/web/src/game/arena/index.ts                   |   2 +
 apps/web/src/game/arena/playBossFight.ts           |  21 +
 apps/web/src/game/arena/playback.test.ts           |  39 ++
 apps/web/src/game/arena/playback.ts                |  28 +
 apps/web/src/game/stage/StageCanvas.tsx            |  39 ++
 apps/web/src/game/stage/StageScene.test.ts         |  59 +++
 apps/web/src/game/stage/StageScene.ts              |  58 +++
 apps/web/src/game/stage/bulkEquip.test.ts          |  57 ++
 apps/web/src/game/stage/progress.ts                |   8 +
 apps/web/src/game/stage/relicWiring.test.ts        |  41 ++
 apps/web/src/game/stage/relicWiring.ui.test.tsx    |  79 +++
 apps/web/src/game/stage/storeV2.test.ts            |  33 ++
 apps/web/src/game/v2/storeV2.ts                    |  81 +++
 apps/web/src/layout/StageLayout.test.tsx           |  67 ++-
 apps/web/src/layout/StageLayout.tsx                | 146 +++++-
 .../src/layout/a11y/v2-components.a11y.test.tsx    |   7 +-
 apps/web/src/layout/boss/BossGatePanel.test.tsx    |   2 +
 apps/web/src/layout/boss/BossGatePanel.tsx         |   2 +-
 apps/web/src/layout/layout.css                     |  38 ++
 apps/web/src/main.tsx                              |   2 +
 docs/prompts/antigravity-responsive-qa.md          |  23 +
 docs/prompts/antigravity-responsive-retest.md      |  17 +
 docs/prompts/codex-responsive-review.md            |  15 +
 docs/responsive-coordination.md                    |  38 ++
 reports/fix-bulk-equip.md                          | 136 +++++
 reports/fix-decorative-key.md                      | 150 ++++++
 reports/fix-resize-hygiene.md                      | 219 ++++++++
 reports/fix-sheet-focus.md                         | 120 +++++
 reports/fix-stage-redraw.md                        | 306 +++++++++++
 reports/fix-stage-redraw/actors-1600-900.png       | Bin 0 -> 10438 bytes
 reports/fix-stage-redraw/actors-320-568.png        | Bin 0 -> 3332 bytes
 reports/fix-stage-redraw/actors-390-844.png        | Bin 0 -> 2826 bytes
 reports/integrate-v2-stage.md                      | 573 +++++++++++++++++++++
 reports/responsive-window.md                       | 249 +++++++++
 reports/responsive-window/dark-1280-720.png        | Bin 0 -> 34104 bytes
 reports/responsive-window/dark-1600-900.png        | Bin 0 -> 40945 bytes
 reports/responsive-window/dark-320-568.png         | Bin 0 -> 23818 bytes
 reports/responsive-window/dark-390-844.png         | Bin 0 -> 33483 bytes
 .../responsive-window/initial-partial-report.txt   | 180 +++++++
 reports/responsive-window/light-1280-720.png       | Bin 0 -> 34164 bytes
 reports/responsive-window/light-1600-900.png       | Bin 0 -> 40898 bytes
 reports/responsive-window/light-320-568.png        | Bin 0 -> 23955 bytes
 reports/responsive-window/light-390-844.png        | Bin 0 -> 33624 bytes
 reports/v16-stage.md                               | 333 ++++++++++++
 reports/v16-stage/stage-1280.png                   | Bin 0 -> 36093 bytes
 reports/v16-stage/stage-390.png                    | Bin 0 -> 31824 bytes
 reports/v19-arena.md                               | 300 +++++++++++
 reports/v19-arena/1280.png                         | Bin 0 -> 31112 bytes
 reports/v19-arena/390-reduced.png                  | Bin 0 -> 21169 bytes
 reports/v20b-relic-wiring.md                       | 319 ++++++++++++
 reports/v26-e2e.md                                 | 192 +++++++
 reports/v26-e2e/equip-1280.png                     | Bin 0 -> 36171 bytes
 reports/v26-e2e/equip-390-reduced.png              | Bin 0 -> 33580 bytes
 reports/v26-e2e/equip-390.png                      | Bin 0 -> 33575 bytes
 reports/v26-e2e/forge-1280.png                     | Bin 0 -> 34251 bytes
 reports/v26-e2e/forge-390-reduced.png              | Bin 0 -> 40646 bytes
 reports/v26-e2e/forge-390.png                      | Bin 0 -> 40646 bytes
 reports/v26-e2e/fresh-1280.png                     | Bin 0 -> 34894 bytes
 reports/v26-e2e/fresh-390-reduced.png              | Bin 0 -> 29483 bytes
 reports/v26-e2e/fresh-390.png                      | Bin 0 -> 29483 bytes
 reports/v26-e2e/idle-1280.png                      | Bin 0 -> 36127 bytes
 reports/v26-e2e/idle-390-reduced.png               | Bin 0 -> 31828 bytes
 reports/v26-e2e/idle-390.png                       | Bin 0 -> 31824 bytes
 reports/v26-e2e/loss-1280.png                      | Bin 0 -> 35852 bytes
 reports/v26-e2e/loss-390-reduced.png               | Bin 0 -> 30999 bytes
 reports/v26-e2e/loss-390.png                       | Bin 0 -> 42368 bytes
 reports/v26-e2e/reload-1280.png                    | Bin 0 -> 35600 bytes
 reports/v26-e2e/reload-390-reduced.png             | Bin 0 -> 32900 bytes
 reports/v26-e2e/reload-390.png                     | Bin 0 -> 32900 bytes
 reports/v26-e2e/win-1280.png                       | Bin 0 -> 36716 bytes
 reports/v26-e2e/win-390-reduced.png                | Bin 0 -> 34531 bytes
 reports/v26-e2e/win-390.png                        | Bin 0 -> 34471 bytes
 87 files changed, 4614 insertions(+), 33 deletions(-)
```

Task-only stat at the same audit point:

```text
$ git diff --stat 577faae...HEAD
 apps/web/e2e/layout/resize-burst.spec.ts |  50 +++++++
 apps/web/e2e/layout/resize.spec.ts       |   6 +-
 apps/web/e2e/layout/stage-layout.spec.ts |   2 +-
 apps/web/e2e/layout/stage-redraw.spec.ts |   6 +-
 apps/web/e2e/v2/loop.spec.ts             |   4 +-
 apps/web/src/game/stage/StageCanvas.tsx  |  10 +-
 reports/fix-resize-hygiene.md            | 219 +++++++++++++++++++++++++++++++
 7 files changed, 289 insertions(+), 8 deletions(-)
```

The final amendment only adds this audit output to this allowlisted report. Code and check results are unchanged. Delivery is the task branch only, without a PR or merge.
