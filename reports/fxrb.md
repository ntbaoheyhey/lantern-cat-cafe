STATUS: PARTIAL

# FXRB — resize startup race (living draft)

Baseline: `1fb25ed` (AGR1 and AGR2 merged). Worktree: `/Users/bao/.codex/worktrees/mega-fxrb/taskbar-hero`. The resize startup bug is fixed; the strict overall status remains PARTIAL because the complete browser suite has the two excluded mobile failures and one separate resource-loading anomaly remains unexplained.

## Changes and acceptance

- Reproduced on unchanged main: 1/3 burst cases failed in the first nine-test run (eight passed), one of five additional baseline cases failed, and two of ten diagnostic burst cases failed. The strict expected canvas array was `[[200, 96]]`; actual was `[]`.
- Root cause: crossing the layout breakpoint creates a queued Phaser scene; a subsequent resize invokes `StageScene.relayout()` before Phaser injects `scale`, throws on `scale.height`, and React unmounts the app.
- Added a scene-readiness guard to the sizing method. Existing `show()` applies the latest scale when CREATE starts the scene; no timer or retry is introduced.
- Added a regression that resizes while the scale plugin is absent, then starts the scene and verifies the cat uses the latest width.
- Both resize specs now start at each requested desktop viewport. The burst retains its 100 resize calls without waits, mobile endpoint, exact dimensions/cardinality, actor-half checks, and insertion budget of ten. Pixel polling reads cardinality, dimensions, and pixels atomically rather than holding a canvas across a possible remount. Browser errors are now asserted empty.
- No existing test was skipped, removed, weakened or given retries. Existing responsive coverage remains intact; no mobile design work was added.

## Problems found and fixed

The browser diagnostic reports `Cannot read properties of undefined (reading 'height')` in StageScene.relayout. Its resulting unmount also reports a Phaser cleanup error reading `sys` before scene-manager READY. Fixing the premature layout call removes that failure path. Evidence: [baseline](fxrb/checks/baseline.log), [browser errors](fxrb/checks/browser-errors.log).

## Tier 2 changes

`apps/web/src/game/stage/StageScene.ts` and its existing unit test: adjacent stage-sizing code is the actual source of the resize crash, so the minimal readiness guard and targeted regression belong here rather than changing layout formulas or relaxing the e2e assertion.

## Verification

pnpm: `10.28.0`; Node `v24.22.2`. The new regression plus the existing StageScene suite: 12 passed. Round 1: install, Deno drift, typecheck, lint, all 2,283 unit tests, production build and classic build pass. Resize repetition: 119 passed, one failed only on a resource-loading console error. Full browser suite: 253 passed, two pre-existing mobile HUD-height failures (138/214px versus 88px), explicitly outside this desktop mission. A diagnostic run with resource URL reporting then passed all 40 burst cases (20 consecutive repeats per viewport, one worker). This is not proof the earlier resource failure is fixed: its origin is NOT VERIFIED and the failure is retained in the report. No resource request was mocked, retried or ignored.

Link baseline: one broken path in docs/proposals/rune-skill-system/README.md points to the unmerged tbh-index-research proposal. No link debt is being accepted as a pass.

## NOT verified

Live services, wallets, and production state are not exercised. No visual redesign is introduced: the change only prevents sizing before scene readiness. UI redesign comparisons belong to the CXR1/CXR2 pass.

## Delivery

Branch: `ai/codex-fxrb`; draft PR pending; no merge or deploy. All changes use the requested author and [skip ci] suffix.

## Scope review

No art or media source, dependency, economy, authentication, contract, workflow, migration, server function, or live state changes. Installer lock/workspace side effects were checked and restored. Expected failures/skips already present in the unit baseline remain unchanged: game-rules has two expected failures and eleven skips; Supabase tests has one expected failure.

The stage insertion count is two because the existing desktop/phone layout switch remounts the scene once. This is within the unchanged limit of ten and is not a test retry. Both desktop starts retain the existing narrow endpoint solely to exercise the reported resize race.

## Acceptance details

| Requirement | Result | Evidence |
| --- | --- | --- |
| Find and fix original resize flake | PASS | Reproduced scale.height startup error; scene-readiness guard and preboot regression |
| 20 burst repeats at 1280×720 and 20 at 1600×900 | PASS in diagnostic run | [40 passing cases](fxrb/checks/burst-20-each.log), one worker, zero retries |
| Continuous resize, both themes and desktop starts, repeat-each=20 | PASS | All 80 continuous cases pass in the [120-case run](fxrb/checks/round1-resize-20.log) |
| Complete 120-case run green | FAIL | 119 pass; one burst case reports ERR_SOCKET_NOT_CONNECTED; source unknown |
| Complete existing browser suite | FAIL — excluded mobile cases | [253 pass, 2 mobile HUD failures](fxrb/checks/round1-e2e.log); no skipped browser tests |
| Link debt unchanged | PASS comparison, checker itself FAIL | Main and branch both have exactly one broken path |
| Visual changes | Not applicable | No layout, tokens or art changed; only premature sizing is prevented |

One corrective full round was used. The two narrow HUD failures are explicitly outside this mission, so repeating the same failures six times would not establish a fix. The isolated resource error was not reproducible in the 40-case diagnostic run; its cause remains NOT VERIFIED. No false full-suite PASS is claimed.

<!-- MEGA verification evidence -->

## Executed checks

| Check | Exit | Result |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | 0 | PASS |
| `pnpm gen:deno` | 0 | PASS |
| `git diff --exit-code -- supabase/functions` | 0 | PASS |
| `pnpm typecheck` | 0 | PASS |
| `pnpm lint` | 0 | PASS |
| `pnpm test` | 0 | PASS |
| `pnpm build` | 0 | PASS |
| `pnpm exec playwright test e2e/layout/resize-burst.spec.ts e2e/layout/resize.spec.ts --project=stage-layout --workers=1 --repeat-each=20` | 1 | FAIL |
| `pnpm test:e2e` | 1 | FAIL |
| `pnpm --filter @taskbar-hero/web build` | 0 | PASS |
| `node scripts/check-links.mjs --json` | 1 | BASELINE DEBT — compare count below |

```text
$ pnpm install --frozen-lockfile
# exit 0; 0.4 seconds
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
Done in 340ms using pnpm v10.28.0
```

```text
$ pnpm gen:deno
# exit 0; 0.2 seconds

> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/mega-fxrb/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

```text
$ git diff --exit-code -- supabase/functions
# exit 0; 0.0 seconds
```

```text
$ pnpm typecheck
# exit 0; 6.9 seconds

> taskbar-hero@0.0.0 typecheck /Users/bao/.codex/worktrees/mega-fxrb/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
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
# exit 0; 6.2 seconds

> taskbar-hero@0.0.0 lint /Users/bao/.codex/worktrees/mega-fxrb/taskbar-hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
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
# exit 0; 61.3 seconds
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/chain test:  Test Files  3 passed (3)
packages/chain test:       Tests  32 passed (32)
supabase/tests test:  Test Files  31 passed (31)
supabase/tests test:       Tests  541 passed | 1 expected fail (542)
packages/game-rules test:  Test Files  24 passed | 3 skipped (27)
packages/game-rules test:       Tests  366 passed | 2 expected fail | 11 skipped (379)
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
apps/web test:  Test Files  111 passed (111)
apps/web test:       Tests  1304 passed (1304)
apps/web test:    Duration  20.95s (environment 47%, tests 40%, import 9%, transform 4%)
apps/web test: Environment  jsdom was created 111 times · 82.10s total, 47% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done
```

```text
$ pnpm build
# exit 0; 9.6 seconds
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/.codex/worktrees/mega-fxrb/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1817 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.13 kB │ gzip:   0.76 kB
apps/web build: dist/assets/index-BmB6Vb4r.css              142.10 kB │ gzip:  22.27 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/assets-CpytQ_XT.js                2.39 kB │ gzip:   1.17 kB
apps/web build: dist/assets/ArenaScene-LfTBtbQn.js            7.04 kB │ gzip:   2.71 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/StageScene-WxgaLKFa.js           15.76 kB │ gzip:   5.79 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/index-onsKbPaa.js               239.71 kB │ gzip:  67.18 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/combat-BSGSpOB2.js              900.61 kB │ gzip:  77.42 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 431ms
apps/web build: Done
```

```text
$ pnpm exec playwright test e2e/layout/resize-burst.spec.ts e2e/layout/resize.spec.ts --project=stage-layout --workers=1 --repeat-each=20
# exit 1; 328.7 seconds
    + Array [
    +   "Failed to load resource: net::ERR_SOCKET_NOT_CONNECTED",
    + ]

      56 |   console.log(`Phaser canvas instances inserted during 100-step drag: ${inserted}`);
      57 |   expect(inserted).toBeLessThanOrEqual(10);
    > 58 |   expect(errors).toEqual([]);
         |                  ^
      59 | });
      60 | }
      61 |
        at /Users/bao/.codex/worktrees/mega-fxrb/taskbar-hero/apps/web/e2e/layout/resize-burst.spec.ts:58:18

    Error Context: test-results/4173-4174/layout-resize-burst-viewpo-0a304-keeps-both-actors-1280x720--stage-layout-repeat5/error-context.md

  1 failed
    [stage-layout] › e2e/layout/resize-burst.spec.ts:10:1 › viewport drag limits Phaser recreation and keeps both actors (1280x720)
  119 passed (5.5m)
```

```text
$ pnpm test:e2e
# exit 1; 81.6 seconds
    Received:    214

      62 |     expect(measures.intersections).toBe(0);
      63 |     expect(measures.luminance).toBeLessThan(.2);
    > 64 |     if (size.width <= 390) expect(measures.height).toBeLessThanOrEqual(88);
         |                                                    ^
      65 |     if (size.width === 1600) expect(measures.height).toBeLessThanOrEqual(64);
      66 |   });
      67 | }
        at /Users/bao/.codex/worktrees/mega-fxrb/taskbar-hero/apps/web/e2e/ui/u2-hud.spec.ts:64:52

    Error Context: test-results/4173-4174/ui-u2-hud-HUD-readable-at-320x568-stage-layout/error-context.md

  2 failed
    [stage-layout] › e2e/ui/u2-hud.spec.ts:37:3 › HUD readable at 390x844 ──────────────────────────
    [stage-layout] › e2e/ui/u2-hud.spec.ts:37:3 › HUD readable at 320x568 ──────────────────────────
  253 passed (1.3m)
 ELIFECYCLE  Command failed with exit code 1.
```

```text
$ pnpm --filter @taskbar-hero/web build
# exit 0; 7.4 seconds
[plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/.codex/worktrees/mega-fxrb/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
✓ 1817 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                               2.13 kB │ gzip:   0.76 kB
dist/assets/index-BmB6Vb4r.css              142.10 kB │ gzip:  22.27 kB
dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
dist/assets/assets-CpytQ_XT.js                2.39 kB │ gzip:   1.17 kB
dist/assets/ArenaScene-LfTBtbQn.js            7.04 kB │ gzip:   2.71 kB
dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
dist/assets/StageScene-WxgaLKFa.js           15.76 kB │ gzip:   5.79 kB
dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
dist/assets/index-onsKbPaa.js               239.71 kB │ gzip:  67.18 kB
dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
dist/assets/combat-BSGSpOB2.js              900.61 kB │ gzip:  77.42 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB

✓ built in 475ms
```

```text
$ node scripts/check-links.mjs --json
# exit 1; 0.1 seconds
Checked 67 files, 807 paths; broken count 1.
```

## Diff snapshot

Recorded from the complete worktree before the report-only commit.

```text
$ git diff --stat origin/main
 apps/web/e2e/layout/resize-burst.spec.ts   |  26 +-
 apps/web/e2e/layout/resize.spec.ts         |   5 +-
 apps/web/src/game/stage/StageScene.test.ts |  11 +
 apps/web/src/game/stage/StageScene.ts      |   3 +
 reports/fxrb.md                            |  56 +++++
 reports/fxrb/checks/baseline.log           |  85 +++++++
 reports/fxrb/checks/browser-errors.log     | 182 ++++++++++++++
 reports/fxrb/checks/burst-20-each.log      | 150 ++++++++++++
 reports/fxrb/checks/round1-e2e.log         | 370 +++++++++++++++++++++++++++++
 reports/fxrb/checks/round1-resize-20.log   | 138 +++++++++++
 10 files changed, 1018 insertions(+), 8 deletions(-)
$ git diff --name-only origin/main
apps/web/e2e/layout/resize-burst.spec.ts
apps/web/e2e/layout/resize.spec.ts
apps/web/src/game/stage/StageScene.test.ts
apps/web/src/game/stage/StageScene.ts
reports/fxrb.md
reports/fxrb/checks/baseline.log
reports/fxrb/checks/browser-errors.log
reports/fxrb/checks/burst-20-each.log
reports/fxrb/checks/round1-e2e.log
reports/fxrb/checks/round1-resize-20.log
```
