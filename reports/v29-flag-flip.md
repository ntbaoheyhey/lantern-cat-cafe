STATUS: DONE
STACKED ON ai/codex-v16-stage @ fd318c4910e50152fdb0522593762288e76efbda: merge that first

C17 PREPARED ONLY. NEVER MERGE before the D6-approved V29 cut-over day. No PR opened, no main push, deployment or live check run. Known prerequisite: Q9 is BLOCKED by the bulk Equip best defect; do not treat this flag branch as release approval.

PASS: isGameV2 true unless VITE_GAME_V2 is exactly 0; absent/empty default v2 and explicit 0 rollback tested. StageLayout default integration and explicit classic cases pass. Existing App/Help classic assertions now explicitly select 0 rather than relying on an absent flag. Playwright classic builds with VITE_GAME_V2=0; stage-layout remains 1. Preview guards in main.tsx follow the same default so C16’s validated SpritePreview- marker remains valid after cut-over. Both actual local bundles were checked with the C16 helper: explicit classic -> pre PASS; default v2 -> post PASS.

Exact one-commit source revert: git revert 28a5469f4d5d6d23d2bf1d0178b089fb75e5a835. That commit contains every flag/test/config/marker-guard change; this report is separate. If the orchestrator squash-merges later, use the resulting main squash SHA for that same one-commit revert. Rebuild with VITE_GAME_V2=0 for the classic rollback and verify classic checks. These are user/orchestrator instructions only; no revert or main action was executed.

Cut-over runbook: section 4 step 4 merges C17 as its own approved batch, step 5 waits for deployment, step 6 runs CHECK_LIVE_V2=post node scripts/check-live.mjs after C16 is merged. C16 is currently on its own DONE branch, so merge it before using that command; this stacked branch does not carry C16. After rollback use CHECK_LIVE_V2=pre. Marker evidence here is local only, not production health. D6 must choose the actual day/go-no-go and account for C8’s unresolved defect, D4/CL8, D8 and all other release gates.

Files/reasons: flag.ts changes default; new flag.test.ts and StageLayout.test.tsx cover default/rollback; App.test.tsx and HelpTab.test.tsx retain classic assertions under explicit 0; playwright.config.ts builds classic explicitly off; main.tsx aligns existing dev preview guards and C16’s marker with the default. The additional App test and entrypoint edits are necessary under section C broad permission. No auth, wallet, contract, economy or migration edit. Own diff against V16; origin/main also contains the verified Q4/Q5 stack.

PASS: pinned install, gen:deno drift, final typecheck/lint/full unit suite, root build, 53 Playwright tests and local marker verdicts. Initial root unit run found the three classic App assumptions; one fix round updated setup only, preserving assertions; final root unit rerun passes. NOT VERIFIED: actual deployment/production health, live rollback, D6 approval, or resolution of the Q9 product bug. STACKED ON ai/codex-v16-stage @ fd318c4910e50152fdb0522593762288e76efbda: merge that first; this branch remains guarded until cut-over.

### q10-gate.txt

```text
$ git show ai/codex-v16-stage:reports/v16-stage.md | head -2
STATUS: DONE
STACKED ON ai/codex-v19-arena @ 16911ac0932a4fdcdaaf811672e2dc3cc9e7a61e: merge that first

V16 is absent on main; revised A5 permits this own DONE stack.

```

### q10-focused.txt

```text

 RUN  v5.0.5 /workspace/taskbar-hero/apps/web


 Test Files  3 passed (3)
      Tests  16 passed (16)
   Start at  12:43:33
   Duration  7.02s (tests 48%, environment 31%, import 15%, transform 6%)

Environment  jsdom was created 3 times · 2.06s total, 31% of tracked time
             create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
             learn more: https://vitest.dev/guide/improving-performance#test-environments


```

### q10-fix1-focused.txt

```text

 RUN  v5.0.5 /workspace/taskbar-hero/apps/web


 Test Files  4 passed (4)
      Tests  19 passed (19)
   Start at  12:47:39
   Duration  8.59s (tests 40%, environment 33%, import 21%, transform 6%)

Environment  jsdom was created 4 times · 2.67s total, 33% of tracked time
             create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
             learn more: https://vitest.dev/guide/improving-performance#test-environments


```

### q10-install.txt

```text
$ pnpm install --frozen-lockfile
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
Done in 868ms using pnpm v10.28.0

EXIT 0; runtime 0.96s

```

### q10-deno.txt

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps

EXIT 0; runtime 0.37s

```

### q10-final-typecheck.txt

```text
$ pnpm typecheck

> taskbar-hero@0.0.0 typecheck /workspace/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/game-rules typecheck$ tsc --noEmit
packages/auth typecheck: Done
supabase/tests typecheck$ tsc --noEmit
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done

EXIT 0; runtime 14.23s

```

### q10-final-lint.txt

```text
$ pnpm lint

> taskbar-hero@0.0.0 lint /workspace/taskbar-hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/chain lint: Done
packages/game-rules lint$ tsc --noEmit
packages/auth lint: Done
supabase/tests lint$ tsc --noEmit
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done

EXIT 0; runtime 15.45s

```

### q10-final-test.txt

```text
$ pnpm test

> taskbar-hero@0.0.0 test /workspace/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/auth test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/auth
packages/chain test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/chain
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  12:49:50
packages/chain test:    Duration  339ms (transform 42%, import 34%, tests 12%, worker 11%, environment 1%)
packages/chain test: Done
packages/game-rules test$ vitest run
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  12:49:50
packages/auth test:    Duration  697ms (import 65%, tests 30%, transform 4%, worker 1%)
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
packages/auth test: Done
supabase/tests test$ vitest run
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
supabase/tests test:  Test Files  18 passed (18)
supabase/tests test:       Tests  385 passed (385)
supabase/tests test:    Start at  12:49:51
supabase/tests test:    Duration  45.30s (tests 89%, import 10%)
supabase/tests test:     Isolate  18 workers spawned · ~140ms startup each (spawn + environment, per file)
supabase/tests test:              at least ~2.37s faster with isolate: false — reuses workers across files instead of one per file
supabase/tests test: Done
packages/game-rules test:  Test Files  19 passed | 2 skipped (21)
packages/game-rules test:       Tests  326 passed | 2 expected fail | 4 skipped (332)
packages/game-rules test:    Start at  12:49:50
packages/game-rules test:    Duration  87.03s (tests 99%, import 1%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  12:51:18
packages/api-contract test:    Duration  232ms (transform 50%, import 38%, tests 9%, worker 3%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /workspace/taskbar-hero/apps/web
apps/web test:  Test Files  80 passed (80)
apps/web test:       Tests  1063 passed (1063)
apps/web test:    Start at  12:51:19
apps/web test:    Duration  81.93s (environment 56%, tests 33%, import 10%, transform 1%)
apps/web test: Environment  jsdom was created 80 times · 40.99s total, 56% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done

EXIT 0; runtime 171.82s

```

### q10-build.txt

```text
$ pnpm build

> taskbar-hero@0.0.0 build /workspace/taskbar-hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/chain build: Done
packages/game-rules build$ tsc --noEmit
packages/auth build: Done
supabase/tests build$ tsc --noEmit
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build$ tsc --noEmit
packages/api-contract build: Done
apps/web build$ tsc --noEmit && vite build
apps/web build: vite v8.3.5 building client environment for production...
apps/web build: transforming...
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/workspace/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1799 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.13 kB │ gzip:   0.77 kB
apps/web build: dist/assets/SpritePreview-DrGwRUam.css        0.69 kB │ gzip:   0.34 kB
apps/web build: dist/assets/index-D1FmkVkG.css               80.45 kB │ gzip:  14.30 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/assets-Ci-cK0a_.js                0.97 kB │ gzip:   0.58 kB
apps/web build: dist/assets/StageScene-BbqZsljQ.js            2.02 kB │ gzip:   1.01 kB
apps/web build: dist/assets/ArenaScene-DzpoD3Vl.js            5.95 kB │ gzip:   2.33 kB
apps/web build: dist/assets/SpritePreview-6C5XerkK.js         6.61 kB │ gzip:   2.77 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/ArenaPreview-Dxi-p8bF.js         22.34 kB │ gzip:   2.99 kB
apps/web build: dist/assets/combat-CcOsWorK.js              192.82 kB │ gzip:  25.47 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/index-BdEVFC8n.js               519.32 kB │ gzip:  84.20 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 856ms
apps/web build: Done

EXIT 0; runtime 15.61s

```

### q10-e2e.txt

```text
$ cd apps/web && PLAYWRIGHT_BROWSERS_PATH=/home/agent/.cache/ms-playwright pnpm test:e2e

> @taskbar-hero/web@0.0.0 test:e2e /workspace/taskbar-hero/apps/web
> playwright test

[WebServer] (node:24623) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:24635) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/workspace/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
[WebServer] (node:24662) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:24674) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:24699) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:24711) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/workspace/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
[WebServer] (node:24738) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:24750) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 53 tests using 1 worker
(node:24774) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
··························(node:25255) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
···························
  53 passed (1.1m)

EXIT 0; runtime 68.52s

```

### q10-markers.txt

```text
/tmp/taskbar-flag-off: pre -> pass
/tmp/taskbar-flag-default: post -> pass

```

## Files touched and reasons

```text
apps/web/e2e/layout/arena.spec.ts          |  22 ++
 apps/web/e2e/layout/character-bag.spec.ts  |  17 +-
 apps/web/e2e/layout/stage-layout.spec.ts   |  45 +++-
 apps/web/playwright.config.ts              |   6 +-
 apps/web/src/App.test.tsx                  |   2 +
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
 apps/web/src/game/stage/StageScene.ts      |  53 +++++
 apps/web/src/game/stage/progress.ts        |   8 +
 apps/web/src/game/stage/storeV2.test.ts    |  33 +++
 apps/web/src/game/v2/storeV2.ts            |  24 +++
 apps/web/src/layout/HelpTab.test.tsx       |   2 +-
 apps/web/src/layout/StageLayout.test.tsx   |  60 +++++-
 apps/web/src/layout/StageLayout.tsx        | 106 +++++++--
 apps/web/src/layout/flag.test.ts           |  11 +
 apps/web/src/layout/flag.ts                |   4 +-
 apps/web/src/layout/layout.css             |  11 +
 apps/web/src/main.tsx                      |   6 +-
 reports/v16-stage.md                       | 333 +++++++++++++++++++++++++++++
 reports/v16-stage/stage-1280.png           | Bin 0 -> 36093 bytes
 reports/v16-stage/stage-390.png            | Bin 0 -> 31824 bytes
 reports/v19-arena.md                       | 300 ++++++++++++++++++++++++++
 reports/v19-arena/1280.png                 | Bin 0 -> 31112 bytes
 reports/v19-arena/390-reduced.png          | Bin 0 -> 21169 bytes
 34 files changed, 1394 insertions(+), 37 deletions(-)
```

Report file records evidence and review gates.
