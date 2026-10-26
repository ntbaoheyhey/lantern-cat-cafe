STATUS: DONE

Q4: C14 cue-driven boss replay implemented. PASS: exact cue order including ties, every cue maps to scene actions, authoritative nonnegative HP, Skip finalState, win/loss endings, reduced-motion effects, onDone once and abort cleanup under StrictMode. PASS: arena fixture preview at 390/1280 in both motion modes, no console/page errors, no horizontal scroll; full 51-test Playwright suite including unchanged classic project. Screenshots inspected and saved in reports/v19-arena/. No simulation or C14 behavior changed.

Gate: C14 and combat present on main; remote arena branch search empty. Blocker: none. Two fix rounds: first corrected getByLabel to Testing Library getByLabelText; second separated Phaser startup into a runtime module so lifecycle tests control the async boundary. Initial full suite and build failed on that new test typo; initial browser run could not find Chromium at /opt/pw-browsers. Installed browser in user cache (no dependency or manifest change); final checks below pass.

Files: playback owns ordered consumption and Skip; ArenaScene draws cues; assets bakes existing art and resolves equipped visuals; BossArena and playBossFight own React/Phaser lifecycle; CSS sizes the stage; tests cover lifecycle/replay/scene; ArenaPreview provides fixtures; index.ts only gains exports. apps/web/src/main.tsx is included under section C broad permission because registering ?dev=arena requires the existing entrypoint; preview remains guarded exactly like sprites. Read-only art, rig, combat, layout and C14 files are byte-identical. PASS: allowlist, protected files, author and generated-map drift. NOT VERIFIED: live deployment/server JWT/Fuji, outside this card. User may review look; no decision required to continue.

### q4-gate.txt

```text
$ git ls-tree --name-only origin/main apps/web/src/game/arena/
apps/web/src/game/arena/arenaFixtures.test.ts
apps/web/src/game/arena/arenaFixtures.ts
apps/web/src/game/arena/cues.test.ts
apps/web/src/game/arena/cues.ts
apps/web/src/game/arena/index.ts
EXIT 0

$ git ls-tree --name-only origin/main apps/web/src/game/combat/
apps/web/src/game/combat/CombatDirector.test.ts
apps/web/src/game/combat/CombatDirector.ts
apps/web/src/game/combat/effects.ts
apps/web/src/game/combat/index.ts
apps/web/src/game/combat/pool.ts
apps/web/src/game/combat/stage.ts
apps/web/src/game/combat/timeline.test.ts
apps/web/src/game/combat/timeline.ts
EXIT 0

$ git ls-remote origin 'refs/heads/*arena*' 'refs/heads/task/V19*'
EXIT 0

$ git diff --exit-code origin/main -- apps/web/src/game/arena/cues.ts apps/web/src/game/arena/arenaFixtures.ts apps/web/src/game/combat apps/web/src/game/rig apps/web/src/art apps/web/src/layout
EXIT 0

```

### q4-fix2-focused.txt

```text

 RUN  v5.0.5 /workspace/taskbar-hero/apps/web


 Test Files  3 passed (3)
      Tests  17 passed (17)
   Start at  11:30:47
   Duration  2.70s (environment 63%, tests 21%, import 9%, transform 6%, worker 1%)

    Isolate  3 workers spawned · ~592ms startup each (spawn + environment, per file)
             at least ~1.18s faster with isolate: false — reuses workers across files instead of one per file


```

### q4-final-install.txt

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
Done in 768ms using pnpm v10.28.0

EXIT 0; runtime 0.83s

```

### q4-final-deno.txt

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps

EXIT 0; runtime 0.34s

```

### q4-final-typecheck.txt

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

EXIT 0; runtime 13.48s

```

### q4-final-lint.txt

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

EXIT 0; runtime 13.94s

```

### q4-final-test.txt

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
packages/chain test:    Start at  11:31:31
packages/chain test:    Duration  308ms (import 49%, transform 29%, worker 11%, tests 10%)
packages/chain test: Done
packages/game-rules test$ vitest run
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  11:31:31
packages/auth test:    Duration  600ms (import 64%, tests 30%, transform 6%, worker 1%)
packages/auth test: Done
supabase/tests test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
supabase/tests test:  Test Files  18 passed (18)
supabase/tests test:       Tests  385 passed (385)
supabase/tests test:    Start at  11:31:32
supabase/tests test:    Duration  39.58s (tests 89%, import 10%)
supabase/tests test:     Isolate  18 workers spawned · ~121ms startup each (spawn + environment, per file)
supabase/tests test:              at least ~2.06s faster with isolate: false — reuses workers across files instead of one per file
supabase/tests test: Done
packages/game-rules test:  Test Files  19 passed | 2 skipped (21)
packages/game-rules test:       Tests  326 passed | 2 expected fail | 4 skipped (332)
packages/game-rules test:    Start at  11:31:31
packages/game-rules test:    Duration  78.54s (tests 99%, import 1%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  11:32:50
packages/api-contract test:    Duration  211ms (transform 53%, import 36%, tests 7%, worker 3%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /workspace/taskbar-hero/apps/web
apps/web test:  Test Files  78 passed (78)
apps/web test:       Tests  1054 passed (1054)
apps/web test:    Start at  11:32:51
apps/web test:    Duration  71.54s (environment 58%, tests 30%, import 11%, transform 1%, worker 1%)
apps/web test: Environment  jsdom was created 78 times · 36.94s total, 58% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done

EXIT 0; runtime 152.73s

```

### q4-final-build.txt

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
apps/web build: ✓ 1725 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-DMK2UL2Q.css               39.42 kB │ gzip:   8.06 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-CR0-bjaD.js               135.95 kB │ gzip:  39.92 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 787ms
apps/web build: Done

EXIT 0; runtime 14.29s

```

### q4-final-e2e.txt

```text
$ cd apps/web && PLAYWRIGHT_BROWSERS_PATH=/home/agent/.cache/ms-playwright pnpm test:e2e

> @taskbar-hero/web@0.0.0 test:e2e /workspace/taskbar-hero/apps/web
> playwright test

[WebServer] (node:7198) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:7210) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:7235) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:7247) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/workspace/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
[WebServer] (node:7274) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:7286) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 51 tests using 1 worker
(node:7310) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
··························(node:7699) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
·························
  51 passed (56.6s)

EXIT 0; runtime 57.33s

```

## Files touched and reasons

```text
apps/web/e2e/layout/arena.spec.ts          | 22 +++++++
 apps/web/src/dev/ArenaPreview.tsx          | 13 ++++
 apps/web/src/game/arena/ArenaScene.test.ts | 39 ++++++++++++
 apps/web/src/game/arena/ArenaScene.ts      | 96 ++++++++++++++++++++++++++++++
 apps/web/src/game/arena/BossArena.test.tsx | 32 ++++++++++
 apps/web/src/game/arena/BossArena.tsx      | 38 ++++++++++++
 apps/web/src/game/arena/arena.css          |  8 +++
 apps/web/src/game/arena/assets.ts          | 39 ++++++++++++
 apps/web/src/game/arena/index.ts           |  2 +
 apps/web/src/game/arena/playBossFight.ts   | 21 +++++++
 apps/web/src/game/arena/playback.test.ts   | 39 ++++++++++++
 apps/web/src/game/arena/playback.ts        | 28 +++++++++
 apps/web/src/main.tsx                      |  2 +
 13 files changed, 379 insertions(+)
```

Report file records evidence and review gates.
