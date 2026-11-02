STATUS: IN-PROGRESS

# FXRB — resize verification, living draft

## Coordinator oracle repair, 2026-11-02 — implementation snapshot

This section records implementation-time evidence; the evolving exact-head verification record is on the ledger at reports/cards/FXRB-ACTOR-ORACLE-R1/REPORT.md and linked from PR243.

The previous six resize cases still passed when both sprite objects were deliberately hidden: shadows and HP bars supplied their alpha pixels. A new test-only repair keeps all active-combat resize assertions and adds four stationary boss-ready cases (two desktop starts × normal/reduced motion). The pixel region excludes ground shadows and the fixture naturally halts combat/HP bars, so the two sprite bodies must render. Canvas count/dimensions and pixel evidence are read together. Existing assertions/timeouts/retries remain unchanged; old messages now describe painted content rather than claiming sprite identity.

The changed tests passed a10-case restored control on a prospective BASE0+FXRB checkout; the same new assertions rejected the both-hidden mutant4/4, cat-only mutant4/4 and monster-only mutant4/4 with the expected missing sides. Expanded repeats and full-suite-after-resize are still pending. These are working-tree results on the prospective integration rooted at7023a2d, not exact source-head or actual-main gate certification. The product branch has not been changed or regraded yet. Raw evidence lives on the ledger under reports/cards/FXRB-ACTOR-ORACLE-R1; the [decision](../docs/decisions/fxrb-sprite-oracle.md) explains the oracle and its scope.

No production rendering, gameplay, art, dependencies, flags, backend or other screen was changed. Independent review and all actual-main/release/live gates remain required. Historical results below remain attached to their original heads and are not overwritten by this new finding.

## Historical builder record

Builder recheck: 2026-11-01. Reused branch `ai/codex-fxrb`, [draft PR #243](https://github.com/ntbaoheyhey/taskbar-hero/pull/243). Base `1fb25edf4c54ada0d161e3c1dd16a4c4550aafba`; reviewed source/evidence HEAD `3d4e556ce9be2de1fbd8178bb5a4c49714a6ec7f`. Fetch and `git merge --no-edit origin/main` reported **Already up to date**. Node `v24.22.2`, pnpm `10.28.0`. No push or merge to main, no grading, no additional agents.

The existing implementation needs no further resize change on this evidence. This card adds evidence and corrects the report; it does not change production code or test assertions. The complete mission gate remains open. The coordinator explicitly reserved fresh-worktree complete verification and asked this builder not to run the full suite yet.

Root cause, one sentence: **A breakpoint remount queues a Phaser scene, and a subsequent resize calls `StageScene.relayout()` before Phaser has injected `scale`, throwing on `scale.height` and leaving no stage canvas.**

The existing fix at `apps/web/src/game/stage/StageScene.ts:324` returns until the scene is active; the existing CREATE handler shows queued state and applies the latest dimensions. Its regression checks both no preboot exception and the cat's exact position after CREATE. No delay, timeout increase or retry was introduced. Both resize specs already use condition polling, so there is no fixed sleep to remove. The burst's cardinality, dimensions and actor pixels are read together across possible remounts.

## Current acceptance evidence

Every row below refers to a command run during this builder card, unless labelled historical. Full commands, cwd, timestamps, raw output (trailing whitespace normalized) and exits are in [the current logs](scorecard/fxrb/logs/). This is a builder report, not a score.

| Acceptance line | Observed result | Evidence |
| --- | --- | --- |
| T1 / DONE: resize specs, repeat-each=20 at 1280×720 and 1600×900 | PASS: **120 passed (3.9m)**, exit 0, one worker, no retries | [repeat output](scorecard/fxrb/logs/04-resize-repeat20.log), [six-case list](scorecard/fxrb/logs/12-resize-case-list.log) |
| Each size has burst + dark continuous + light continuous coverage | PASS: each of the six cases ran 20 times; 40 burst and 80 continuous cases total | Same logs; viewport loops in both specs |
| T2: root cause reproduced and explained | PASS: removing the guard throws `Cannot read properties of undefined (reading 'height')`; browser reproduction fails with `[]` instead of `[[200, 96]]` at both starts | [unit reproduction](scorecard/fxrb/logs/06-m1-before-ready-unit.log), [browser reproduction](scorecard/fxrb/logs/16-m1-before-ready-browser.log) |
| Exactly one correctly sized canvas; actors, insertion budget, state and error checks preserved | PASS in the 120-case run; wrong-width mutation is rejected | [integrity review](scorecard/fxrb/logs/09-integrity-scope.log), [wrong-width output](scorecard/fxrb/logs/18-m3-wrong-width-browser.log) |
| T3: full e2e suite green afterwards | **NOT VERIFIED this card; not green in historical evidence.** No full suite was run, per coordinator instruction | Current focused control remains red on the two HUD cases below; historical [full-suite log](fxrb/checks/round1-e2e.log) is retained |
| Three real source mutations in isolated copies | All three detected; no assertion edits for mutation runs; mutations reverted | Mutation table below, [test hashes](scorecard/fxrb/logs/11-mutation-test-integrity.log), [restoration hashes](scorecard/fxrb/logs/21-mutation-restoration.log) |
| Historical `ERR_SOCKET_NOT_CONNECTED` cause | NOT VERIFIED; did not recur in the current 120-case run, not claimed fixed | Historical [red repeat run](fxrb/checks/round1-resize-20.log) retained |

All browser commands use `E2E_PORT_CLASSIC=4310 E2E_PORT_V2=4311 E2E_PORT_SERVER=4312 E2E_PORT_API=4313`, `CI=true SCREENSHOTS=0 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY=`. The unchanged Playwright config builds v2 with `VITE_GAME_V2=1` and empty backend configuration, and classic with `VITE_GAME_V2=0`; its separate local-server project uses only the local test harness. No live service, sign-in or transaction was used. Runs were serial on these ports. Port checks found no leftover listeners; report-status checks showed only this item's files.

## Commands and mutation results

Commands run from the root unless marked `apps/web`. Browser prefixes are the exact environment above. Scratch tests use a source copy inside this worktree, with existing dependencies linked and no env files copied. Patch files record each intentional source change. A failed mutant is evidence of detection, not a product pass.

| Command | Exit | Observed output / log |
| --- | --- | --- |
| `CI=true pnpm install --frozen-lockfile` | 0 | [Up to date, pnpm 10.28.0](scorecard/fxrb/logs/02-install.log); lock/workspace files unchanged |
| `CI=true pnpm --filter @taskbar-hero/web test src/game/stage/StageScene.test.ts src/game/stage/StageCanvas.test.tsx src/layout/metrics.test.ts` | 0 | [22 passed](scorecard/fxrb/logs/03-focused-unit.log) |
| `CI=true pnpm --filter @taskbar-hero/web typecheck` | 0 | [No diagnostics](scorecard/fxrb/logs/08-web-typecheck.log) |
| `pnpm test:e2e e2e/layout/resize-burst.spec.ts e2e/layout/resize.spec.ts --project=stage-layout --workers=1 --repeat-each=20` (`apps/web`) | 0 | [120 passed](scorecard/fxrb/logs/04-resize-repeat20.log) |
| M1: remove the readiness guard; `CI=true pnpm exec vitest run src/game/stage/StageScene.test.ts` (scratch `apps/web`) | 1 | [1 failed / 11 passed; preboot height exception](scorecard/fxrb/logs/06-m1-before-ready-unit.log); [patch](scorecard/fxrb/logs/m1-before-ready.patch) |
| M1: `pnpm test:e2e e2e/layout/resize-burst.spec.ts --project=stage-layout --workers=1 --repeat-each=10 --reporter=list` (scratch `apps/web`) | 1 | [2 failed / 18 passed; missing canvas at both starts](scorecard/fxrb/logs/16-m1-before-ready-browser.log) |
| M2: omit `show()`'s `relayout()` call; `CI=true pnpm exec vitest run src/game/stage/StageScene.test.ts` (scratch `apps/web`) | 1 | [2 failed / 10 passed; queued cat x=0 instead of 136](scorecard/fxrb/logs/07-m2-missing-create-layout-unit.log); [patch](scorecard/fxrb/logs/m2-missing-create-layout.patch) |
| M3: resize to `logicalWidth + 1`; `pnpm test:e2e e2e/layout/resize-burst.spec.ts e2e/layout/resize.spec.ts --project=stage-layout --workers=1 --reporter=list` (scratch `apps/web`) | 1 | [All 6 failed; burst width 201 instead of 200, continuous size predicate false](scorecard/fxrb/logs/18-m3-wrong-width-browser.log); [patch](scorecard/fxrb/logs/m3-wrong-logical-width.patch) |
| Restored control: `CI=true pnpm exec vitest run src/game/stage/StageScene.test.ts src/game/stage/StageCanvas.test.tsx src/layout/metrics.test.ts` (scratch `apps/web`) | 0 | [22 passed](scorecard/fxrb/logs/20-m1-restored-unit-control.log) |
| Restored control: `pnpm test:e2e e2e/layout/resize-burst.spec.ts e2e/layout/resize.spec.ts e2e/layout/stage-redraw.spec.ts e2e/ui/u2-hud.spec.ts e2e/smoke.spec.ts --project=stage-layout --project=classic --workers=1 --reporter=list` (scratch `apps/web`) | 1 | [18 passed / 2 HUD failures](scorecard/fxrb/logs/22-restored-focused-browser.log); all resize, reduced-motion redraw and classic smoke cases pass |
| `node scripts/check-links.mjs --json` | 1 | [67 files, 807 paths, 1 broken path](scorecard/fxrb/logs/10-links.log) |

The restored browser control adds only computed-geometry logging to the scratch HUD test; every assertion remains intact ([diagnostic patch](scorecard/fxrb/logs/hud-diagnostic.patch)). No diagnostic change remains in the branch. The first scratch browser launch failed before tests because the local database harness was missing; [that failure](scorecard/fxrb/logs/14-m1-browser-setup-failure.log) is retained and **does not count as a detected mutant**. The copied local harness fixed the setup ([record](scorecard/fxrb/logs/15-scratch-harness-prerequisite.log)). Other exploratory command corrections are recorded in [launch notes](scorecard/fxrb/logs/23-command-launch-notes.log).

## Red gates outside FXRB

**Mobile HUD:** the original 88px checks still fail at 390×844 (138px) and 320×568 (214px). The restored control measured `.shell-hud.v2-topbar` at 70px with `overflow:hidden`, while its `.hud-left.hud-bar` child wraps to 138/214px with no maximum height. The actual shell emits `.hud-left` in `apps/web/src/shell/Hud.tsx:36`; it contains zero `.hud-bar__layout` nodes, so the older mobile grid rules in `apps/web/src/layout/layout.css:646` do not lay it out. The narrow two-column header and wrapping rules (`layout.css:624`, `shell/shell.css:270`) leave the child roughly 279px/209px wide and clip its excess height. The necessary prerequisite is a separate responsive shell/HUD fix for the actual markup that satisfies the unchanged height, no-clipping and no-overlap assertions, followed by the complete suite. No HUD code was changed in FXRB. These failures are **not excluded, skipped or accepted as a green gate**.

**Links:** `docs/proposals/rune-skill-system/README.md:4` references absent `docs/proposals/tbh-index-research/`. Restore the intended target or correct that reference in its owning documentation work. The checked README/docs/checker have no FXRB diff. The current branch count is 1; a same-day independently measured main comparison is reserved to the coordinator, so this card does not claim that comparison passed.

**Historical resource error:** the old repeat log has `ERR_SOCKET_NOT_CONNECTED`. No current browser failure of that kind occurred. Its cause remains unverified; no network request was ignored, retried or mocked to make the resize run green.

## Integrity, scope and report corrections

The full reused source diff was read. No deleted assertions or tests, skips, `.only`, `.fixme`, retries, increased timeouts, loosened matchers, edited golden numbers, type/lint suppression, `as any`, or added source `console.log` were found. Both desktop loops retain responsive endpoints and all original checks. The exact count/size and actor-half conditions are at least as strong as main. [Audit](scorecard/fxrb/logs/09-integrity-scope.log).

The scoped secret-pattern scan of the diff and FXRB reports/logs found zero hits ([output](scorecard/fxrb/logs/24-secret-scan.log)). All scratch mutations and the temporary HUD logger were restored before removing the scratch copies; ports 4310–4313 have no listeners, and the current source/tests/lockfiles have no uncommitted delta ([cleanup](scorecard/fxrb/logs/25-cleanup.log)).

Tier 1: `apps/web/e2e/layout/resize-burst.spec.ts`, `apps/web/e2e/layout/resize.spec.ts`, `reports/fxrb.md`, all `reports/fxrb/checks/*`, and the explicitly requested `reports/scorecard/fxrb/*` evidence. Tier 2: `apps/web/src/game/stage/StageScene.ts` and `StageScene.test.ts` are the actual adjacent stage-sizing implementation and regression; the crash originates there rather than in layout metrics. No Tier 3 files or actions, dependencies, art, flags, backend behavior, secrets, env files, workflows or other worktrees were changed. Full changed-file inventory and diff statistics: [scope snapshot](scorecard/fxrb/logs/26-scope-diff-stat.log).

CORRECTED (builder recheck 2026-11-01): the earlier report's phrase “FAIL — excluded mobile cases” is withdrawn. The failures remain gate failures. Its earlier unit/build/wrapper passes and 40-case diagnostic pass are historical observations only, not reruns by this card. The prior 119/120 run remains red and is preserved. The old link comparison is not carried forward as a current measurement. No earlier evidence was deleted. Old report history remains available in git at `3d4e556`; old raw logs remain under `reports/fxrb/checks/`.

## Unverified acceptance and handoff

- T3 and G1: a fresh-worktree full verify on the exact candidate, complete classic/v2 browser coverage at both desktop sizes, and a green full suite after the HUD prerequisite. This card runs focused checks only.
- Remaining section 2c / G3 commands: workspace `gen:deno` + drift, typecheck, lint, full tests, full build, explicit classic build, bundle budget/comparison, Deno-import check, same-day main link comparison, and `verify-pr.sh` without comments.
- UI-wide screenshots, reference comparison, all-screen ui-audit/effects, keyboard and contrast gates, plus G5 production-config read-only smoke. No UI match or whole-app accessibility pass is asserted here.
- Independent graders, permission to push from the coordinator, PR readiness, G7 pushed report, merge and all post-merge main/live checks. No score is assigned by this builder.

Branch `ai/codex-fxrb`; merge commit none; PR https://github.com/ntbaoheyhey/taskbar-hero/pull/243; report `reports/fxrb.md`; status IN-PROGRESS, unpushed evidence awaiting coordinator review.
