STATUS: DONE

# CXR0 conflict resolution after AGR0

31 October 2026. Living draft. PR: [#230](https://github.com/ntbaoheyhey/taskbar-hero/pull/230). Branch: `ai/codex-redesign-cxr0`.

Conflict resolution and requested desktop verification are complete. The supplemental all-viewport suite remains red on exactly two narrow HUD cases already documented by AGR0; 250 tests pass.

Merged `origin/main` at `0fc753b14efa911aa1948807c847e43cfc27ea1c` (AGR0 #233) into the existing PR head `a5e5cf63ea6ea63b252a1df632bc990b48bfc2a4`, preserving history. This is a branch merge; PR #230 remains a draft and is not merged into main.

## What was combined

- **effects-test.mjs:** retained AGR0's Home, Bag, Map, Forge, Market, Hero and Help navigation, legacy Character/Boss aliases, and explicit return to Home before reduced-motion canvas sampling. Retained CXR0's portable Chromium discovery, single owned browser/server with cleanup, opt-in screenshot/frame output, and all nine existing checks/thresholds. Resolved the conflicting browser declarations using the outer browser reference so cleanup closes the actual instance.
- **ui-audit.mjs:** retained CXR0's manifest-driven 1280×720 and 1600×900 runs, optional/off-by-default mobile measurement, per-screen JSON/console findings, `--strict`, screenshot opt-in and owned-server cleanup. The primary path uses AGR0's `rail`, `nav-*`, `hud` and `screen` test IDs. The role-based fallback now tries AGR0's screen names first, then the existing legacy aliases.
- The screen manifest, same-assertion independent stub, overlap regression probes, comparison generator and smoke checks are retained. **No smoke assertion was weakened or removed.** The original conditional gate is unchanged, but both live cases now run and pass because AGR0 supplies the rail.
- All AGR0 landmarks, source changes and adapted existing tests came directly from main. There are **no additional product-source changes relative to origin/main**. No changes to contracts, auth, Supabase, `.github/`, config.ts, dependencies, lockfile or existing art.
- The older CXR0 report/evidence remains historical. This report records verification against the merged AGR0 shell.

## Verification

Node `v24.22.2`; pnpm `10.28.0`; Playwright `1.64.1`. Git user set in repository config to `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`.

| Check | Result | Evidence |
| --- | --- | --- |
| `CI=true pnpm install --frozen-lockfile` | PASS — lockfile current, already up to date, exit 0. Optional native build scripts remained unapproved; no dependency/config files changed. | [log](CXR0-rebase/checks/install.log) |
| `pnpm typecheck` | PASS — exit 0. | [log](CXR0-rebase/checks/typecheck.log) |
| `pnpm lint` | PASS — exit 0. | [log](CXR0-rebase/checks/lint.log) |
| `pnpm test` | PASS — all workspace suites green; web **110 files / 1,285 tests passed**. Existing game-rules expected failures/skips unchanged. | [log](CXR0-rebase/checks/unit.log) |
| `pnpm build` | PASS — all workspace builds green, exit 0. | [log](CXR0-rebase/checks/build.log) |
| Desktop Playwright shell smoke, **1280×720 and 1600×900** | PASS — **6 passed (13.6s), 0 skipped**: live AGR0 navigation, independent stub and intentional geometry defects at each size. Both live tests assert all seven destinations, three Forge states, active `aria-current`, all six HUD chips, visible key elements, no console/page errors, no document scroll, no horizontal overflow and no detected overlap. | [output](CXR0-rebase/checks/shell-smoke.log), [results](CXR0-rebase/checks/shell-smoke-results.json) |
| Strict audit at **1280×720 and 1600×900** | PASS — **18 screens audited; 0 with findings**, exit 0. All entries use `navigation: rail`; no legacy fallback in this run. | [output](CXR0-rebase/checks/ui-audit.log), [findings](CXR0-rebase/audit/findings.json) |
| Merged effects tool | PASS — **9 checks, 0 FAIL**: 60.0 fps, 7 impact cues, 29 halted idle pixel changes, 0 reduced-motion transforms, 3 reduced-motion impacts. | [output](CXR0-rebase/checks/effects.log), [summary](CXR0-rebase/effects/summary.json) |
| Comparison generator regression tests | PASS — 2 tests, 0 failures. | [output](CXR0-rebase/checks/compare.log) |
| Complete Playwright suite (all existing viewports) | **FAIL: 250 passed (2.5m), 2 known narrow failures, 0 skipped; exit 1.** Both failures exactly match AGR0’s documented deferred HUD-height cases; no new desktop failure. | [output](CXR0-rebase/checks/e2e.log) |

The full suite regenerated 21 tracked report artifacts despite screenshot opt-out. Restored them to the merge index (preserving main’s imported content), with no existing report/art modifications included. [Inventory](CXR0-rebase/checks/restored-artifacts.json).

All Playwright commands use free, isolated ports 4273–4276, empty demo Supabase environment and `SCREENSHOTS=0`; no unrelated test servers were killed. The targeted desktop run and the full suite run sequentially. The audit uses port 5199; effects uses 5198.

```sh
# From apps/web:
E2E_PORT_CLASSIC=4273 E2E_PORT_V2=4274 E2E_PORT_SERVER=4275 E2E_PORT_API=4276 \
VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' SCREENSHOTS=0 \
pnpm test:e2e e2e/ui/redesign-shell.spec.ts --workers=1 --reporter=list,json

E2E_PORT_CLASSIC=4273 E2E_PORT_V2=4274 E2E_PORT_SERVER=4275 E2E_PORT_API=4276 \
VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' SCREENSHOTS=0 \
pnpm test:e2e --workers=2 --reporter=list

node tools/ui-audit.mjs ../../reports/CXR0-rebase/audit bossReadyStrong --strict
node tools/effects-test.mjs ../../reports/CXR0-rebase/effects
```

## Known failures and NOT verified

- No live account, real wallet, SIWE signing, live database, transaction or deployment was exercised. All tests use demo data or the existing loopback/in-memory test harness.
- Optional mobile audit and extra screenshot/frame export were not run. The desktop contract gate is now verified against real AGR0 rather than only a stub.
- The overlap detector remains a visible-box geometry heuristic, not a pixel/text clipping guarantee. No thresholds changed.
- AGR0's existing report documents two deferred narrow HUD-height failures in `u2-hud.spec.ts` (390×844 and 320×568). The full run reproduces exactly those two failures: height **138px** and **214px**, respectively, versus the unchanged **88px** limit. These are failures, not skips or passes. This resolution does not fix mobile UI or change assertions. See [AGR0’s existing deferral](AGR0-fix.md).
- Effects videos were generated and retained outside the patch at `/tmp/cxr0-rebase-effects-videos`; JSON summaries are committed. No new PNGs or existing art edits are included in this follow-up.

## Command output tails

```text
$ CI=true pnpm install --frozen-lockfile
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 410ms using pnpm v10.28.0
```

```text
$ pnpm typecheck
packages/chain typecheck: Done
packages/auth typecheck: Done
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done
```

```text
$ pnpm lint
packages/chain lint: Done
packages/auth lint: Done
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done
```

```text
$ pnpm test
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/redesign-cxr0/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  23:31:51
packages/api-contract test:    Duration  126ms (transform 53%, import 38%, tests 6%, worker 3%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/redesign-cxr0/taskbar-hero/apps/web
apps/web test:  Test Files  110 passed (110)
apps/web test:       Tests  1285 passed (1285)
apps/web test:    Start at  23:31:52
apps/web test:    Duration  14.83s (environment 47%, tests 41%, import 10%, transform 2%)
apps/web test: Environment  jsdom was created 110 times · 68.01s total, 47% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done
```

```text
$ pnpm build
apps/web build: dist/assets/StageScene-Cf7PTqKV.js           15.73 kB │ gzip:   5.79 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/index-CezWAaSh.js               223.44 kB │ gzip:  63.39 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/combat-BSGSpOB2.js              900.61 kB │ gzip:  77.42 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 337ms
apps/web build: Done
```

```text
$ pnpm test:e2e e2e/ui/redesign-shell.spec.ts --workers=1 --reporter=list,json
(node:45053) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓  1 [stage-layout] › e2e/ui/redesign-shell.spec.ts:26:5 › redesign shell 1280x720 › live rail route smoke (auto-gated until AGR0) (2.4s)
  ✓  2 [stage-layout] › e2e/ui/redesign-shell.spec.ts:41:5 › redesign shell 1280x720 › the same route smoke passes an independent local contract stub (771ms)
  ✓  3 [stage-layout] › e2e/ui/redesign-shell.spec.ts:47:5 › redesign shell 1280x720 › geometry detects page scroll, overflow and sibling overlap without flagging containers (72ms)
  ✓  4 [stage-layout] › e2e/ui/redesign-shell.spec.ts:26:5 › redesign shell 1600x900 › live rail route smoke (auto-gated until AGR0) (1.5s)
  ✓  5 [stage-layout] › e2e/ui/redesign-shell.spec.ts:41:5 › redesign shell 1600x900 › the same route smoke passes an independent local contract stub (781ms)
  ✓  6 [stage-layout] › e2e/ui/redesign-shell.spec.ts:47:5 › redesign shell 1600x900 › geometry detects page scroll, overflow and sibling overlap without flagging containers (78ms)

  6 passed (13.6s)
```

```text
$ node tools/ui-audit.mjs ../../reports/CXR0-rebase/audit bossReadyStrong --strict
1600x900 forge-relic (rail): document-scroll=[]; horizontal-overflow=[]; element-overlap=[]; missing=[]; console-errors=[]
1600x900 market (rail): document-scroll=[]; horizontal-overflow=[]; element-overlap=[]; missing=[]; console-errors=[]
1600x900 hero (rail): document-scroll=[]; horizontal-overflow=[]; element-overlap=[]; missing=[]; console-errors=[]
1600x900 help (rail): document-scroll=[]; horizontal-overflow=[]; element-overlap=[]; missing=[]; console-errors=[]
18 screens audited; 0 with findings. JSON: /Users/bao/.codex/worktrees/redesign-cxr0/taskbar-hero/reports/CXR0-rebase/audit/findings.json
```

```text
$ node tools/effects-test.mjs ../../reports/CXR0-rebase/effects
PASS  [combat] hits land on the monster repeatedly (hero swing reaches contact) - 7 impact cues in 8 s
PASS  [combat] canvas is animating (not frozen) - 59 of 59 frame pairs differ
PASS  [combat] hit flash/damage number changes pixels at each impact - 7/7 impacts changed the frame
PASS  [combat] frame rate (headless software GL, relative) - avg 60.0 fps, p95 frame 17 ms
PASS  [combat] no long-frame stalls over 250 ms - 0 frames over 250 ms
PASS  [boss-ready] no attack swings while halted (by design) - 0 impacts
PASS  [boss-ready] hero idle loop keeps animating while halted - 29 frame changes in 4 s
PASS  [reduced-motion] no transform/slide animations when reduced - 0 transform animations (normal had 6)
PASS  [reduced-motion] stage still updates (impacts) when reduced - 3 impacts

9 checks, 0 FAIL. Videos + frames in /Users/bao/.codex/worktrees/redesign-cxr0/taskbar-hero/reports/CXR0-rebase/effects
```

```text
$ pnpm test:e2e --workers=2 --reporter=list
[basement 390x844] outer: 22.46, center: 61.00
  ✓  250 [stage-layout] › e2e/ui/u8-backdrops.spec.ts:26:5 › basement (chapter 4) at 390x844 renders with vignette and no errors (812ms)
[rooftops 1600x900] outer: 20.71, center: 39.08
  ✓  251 [stage-layout] › e2e/ui/u8-backdrops.spec.ts:26:5 › rooftops (chapter 5) at 1600x900 renders with vignette and no errors (747ms)
[rooftops 390x844] outer: 16.62, center: 53.51
  ✓  252 [stage-layout] › e2e/ui/u8-backdrops.spec.ts:26:5 › rooftops (chapter 5) at 390x844 renders with vignette and no errors (837ms)


  1) [stage-layout] › e2e/ui/u2-hud.spec.ts:37:3 › HUD readable at 390x844 ─────────────────────────

    Error: expect(received).toBeLessThanOrEqual(expected)

    Expected: <= 88
    Received:    138

      62 |     expect(measures.intersections).toBe(0);
      63 |     expect(measures.luminance).toBeLessThan(.2);
    > 64 |     if (size.width <= 390) expect(measures.height).toBeLessThanOrEqual(88);
         |                                                    ^
      65 |     if (size.width === 1600) expect(measures.height).toBeLessThanOrEqual(64);
      66 |   });
      67 | }
        at /Users/bao/.codex/worktrees/redesign-cxr0/taskbar-hero/apps/web/e2e/ui/u2-hud.spec.ts:64:52

    Error Context: test-results/4273-4274/ui-u2-hud-HUD-readable-at-390x844-stage-layout/error-context.md

  2) [stage-layout] › e2e/ui/u2-hud.spec.ts:37:3 › HUD readable at 320x568 ─────────────────────────

    Error: expect(received).toBeLessThanOrEqual(expected)

    Expected: <= 88
    Received:    214

      62 |     expect(measures.intersections).toBe(0);
      63 |     expect(measures.luminance).toBeLessThan(.2);
    > 64 |     if (size.width <= 390) expect(measures.height).toBeLessThanOrEqual(88);
         |                                                    ^
      65 |     if (size.width === 1600) expect(measures.height).toBeLessThanOrEqual(64);
      66 |   });
      67 | }
        at /Users/bao/.codex/worktrees/redesign-cxr0/taskbar-hero/apps/web/e2e/ui/u2-hud.spec.ts:64:52

    Error Context: test-results/4273-4274/ui-u2-hud-HUD-readable-at-320x568-stage-layout/error-context.md

  2 failed
    [stage-layout] › e2e/ui/u2-hud.spec.ts:37:3 › HUD readable at 390x844 ──────────────────────────
    [stage-layout] › e2e/ui/u2-hud.spec.ts:37:3 › HUD readable at 320x568 ──────────────────────────
  250 passed (2.5m)
 ELIFECYCLE  Command failed with exit code 1.
```

```text
$ node --test apps/web/tools/compare.test.mjs
✔ comparison matches nested names, keeps missing files and escapes labels/URLs (8.943708ms)
✔ comparison rejects empty or missing input folders (0.996708ms)
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 65.694333
```

## Scope, commit and push

No unresolved conflict entries remain. Conflict resolutions are limited to the two tools; this follow-up also adds this report and its logs/JSON evidence. Main's source/test/docs additions are adopted unchanged. Protected areas are unchanged both relative to the old PR head and relative to main.

Merge commit message: `Merge origin/main into CXR0 preserving AGR0 shell and desktop harness [skip ci]`. Push target: `origin ai/codex-redesign-cxr0`, without force. Author: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`. No GitHub merge or deploy is performed. The full browser suite has the two known failures above; required desktop contract checks pass.
