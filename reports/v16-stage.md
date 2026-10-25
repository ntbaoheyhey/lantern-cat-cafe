STATUS: DONE
STACKED ON ai/codex-v19-arena @ 16911ac0932a4fdcdaaf811672e2dc3cc9e7a61e: merge that first

Q5: replaced sample state with ApiSwitchV2/GameLoopV2, persistent demo and guarded server adapter; mounted a Phaser stage using the existing cat rig, equipped visuals, chapter monsters, backdrop and V15 finite claim-driven cues. Wired A20 HUD, class picker only when null, bag equip/lock, forge craft/salvage and blocked/ready Relic view, map/boss selection, boss request/replay/chest/loss flow, recent loot and WelcomeBack, visibility pause/cleanup, and server-offset cooldown clock. Relic mint remains Q10b.

PASS: factory demo without env and session guard on server mode; fixture-driven HUD and gated hint; class-picker lifetime; demo boss request opens replay and chest; Help still contains Mochi the cat naps. PASS: full install/gen:deno drift/typecheck/lint/test/build; 53 Playwright tests including classic unchanged, 390/1280 class pick and ten-minute clock advance, no console/page errors or horizontal scroll. Screenshots in reports/v16-stage/.

Gate output below. STACKED ON ai/codex-v19-arena @ 16911ac0932a4fdcdaaf811672e2dc3cc9e7a61e: merge that first. The main-relative diff includes the already verified Q4 baseline; Q5 own diff is against that branch.

Validation fixes: typed the injected server spy after a preliminary TypeScript error. Browser round 1 fixed Node importing browser wallet JSON through the storage-key import; read the exported key from source instead. Round 2 seeded the original sample account in character-bag.spec.ts and scoped selected-tab assertions to the outer tablist; no assertion, timeout or scenario was removed or weakened. The fixture called fresh already selects Warrior, so the new class-picker scenario correctly starts without a save. Final browser suite passes.

Files/reasons: game/v2/storeV2.ts connects existing adapters, guard and React snapshots (only new game/v2 file); game/stage/{StageScene,StageCanvas,progress,storeV2.test} own rendering, lifecycle and progress tests; StageLayout connects existing components; StageLayout.test verifies state wiring; layout.css fits the stage/HUD. e2e/layout/stage-layout.spec.ts exercises new behavior. e2e/layout/character-bag.spec.ts is a necessary additional test setup edit under section C broad permission: its assertions remain unchanged and its prior sample account now enters through a valid demo save. Read-only UI components, art, API/auth contracts, existing game/v2 modules, packages and Supabase have no diff.

NOT VERIFIED: live JWT/gateway/server play and real Fuji mint. No deployment, transaction, migration application, economy change or decision made. User reviews screenshots; merge Q4 before this branch.

### q5-gate.txt

```text
$ git show origin/main:apps/web/src/layout/StageLayout.tsx | grep -n sampleState
23:import { useSampleStateV2 } from './sampleState';
EXIT 0

$ git ls-tree origin/main apps/web/src/game/stage/
EXIT 0

$ git ls-tree --name-only origin/main apps/web/src/layout/hud/ apps/web/src/layout/boss/
apps/web/src/layout/boss/BossGatePanel.test.tsx
apps/web/src/layout/boss/BossGatePanel.tsx
apps/web/src/layout/boss/BossPortrait.test.tsx
apps/web/src/layout/boss/BossPortrait.tsx
apps/web/src/layout/boss/boss.css
apps/web/src/layout/boss/bossGate.test.ts
apps/web/src/layout/boss/bossGate.ts
apps/web/src/layout/boss/index.ts
apps/web/src/layout/hud/HudBar.test.tsx
apps/web/src/layout/hud/HudBar.tsx
apps/web/src/layout/hud/LevelXpBar.test.tsx
apps/web/src/layout/hud/LevelXpBar.tsx
apps/web/src/layout/hud/PowerChip.test.tsx
apps/web/src/layout/hud/PowerChip.tsx
apps/web/src/layout/hud/ProgressChip.test.tsx
apps/web/src/layout/hud/ProgressChip.tsx
apps/web/src/layout/hud/StacksBar.test.tsx
apps/web/src/layout/hud/StacksBar.tsx
apps/web/src/layout/hud/hud.a11y.test.tsx
apps/web/src/layout/hud/hud.css
apps/web/src/layout/hud/index.ts
EXIT 0

$ git ls-remote origin 'refs/heads/task/V16*' 'refs/heads/*v16-stage*'
EXIT 0

$ git rev-parse ai/codex-v19-arena
16911ac0932a4fdcdaaf811672e2dc3cc9e7a61e
EXIT 0

```

### q5-focused.txt

```text

 RUN  v5.0.5 /workspace/taskbar-hero/apps/web


 Test Files  2 passed (2)
      Tests  11 passed (11)
   Start at  11:38:16
   Duration  4.36s (tests 54%, environment 24%, import 15%, transform 7%)

    Isolate  2 workers spawned · ~589ms startup each (spawn + environment, per file)
             at least ~589ms faster with isolate: false — reuses workers across files instead of one per file


```

### q5-install.txt

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
Done in 825ms using pnpm v10.28.0

EXIT 0; runtime 0.88s

```

### q5-deno.txt

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps

EXIT 0; runtime 0.30s

```

### q5-typecheck.txt

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

EXIT 0; runtime 14.02s

```

### q5-lint.txt

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

EXIT 0; runtime 14.23s

```

### q5-test.txt

```text
$ pnpm test

> taskbar-hero@0.0.0 test /workspace/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/chain test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/chain
packages/auth test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/auth
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  11:39:50
packages/chain test:    Duration  414ms (import 42%, transform 29%, worker 15%, tests 14%, environment 1%)
packages/chain test: Done
packages/game-rules test$ vitest run
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  11:39:51
packages/auth test:    Duration  621ms (import 63%, tests 31%, transform 5%, worker 1%)
packages/auth test: Done
supabase/tests test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
supabase/tests test:  Test Files  18 passed (18)
supabase/tests test:       Tests  385 passed (385)
supabase/tests test:    Start at  11:39:51
supabase/tests test:    Duration  40.75s (tests 89%, import 10%, transform 1%)
supabase/tests test:     Isolate  18 workers spawned · ~127ms startup each (spawn + environment, per file)
supabase/tests test:              at least ~2.16s faster with isolate: false — reuses workers across files instead of one per file
supabase/tests test: Done
packages/game-rules test:  Test Files  19 passed | 2 skipped (21)
packages/game-rules test:       Tests  326 passed | 2 expected fail | 4 skipped (332)
packages/game-rules test:    Start at  11:39:51
packages/game-rules test:    Duration  80.66s (tests 99%, import 1%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  11:41:12
packages/api-contract test:    Duration  215ms (transform 48%, import 39%, tests 10%, worker 3%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /workspace/taskbar-hero/apps/web
apps/web test:  Test Files  79 passed (79)
apps/web test:       Tests  1060 passed (1060)
apps/web test:    Start at  11:41:13
apps/web test:    Duration  75.04s (environment 56%, tests 32%, import 11%, transform 1%, worker 1%)
apps/web test: Environment  jsdom was created 79 times · 37.89s total, 56% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done

EXIT 0; runtime 158.42s

```

### q5-build.txt

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
apps/web build: ✓ 1793 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-D1FmkVkG.css               80.45 kB │ gzip:  14.30 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/assets-BQ9-mP6h.js                0.97 kB │ gzip:   0.58 kB
apps/web build: dist/assets/StageScene-BSix-8V5.js            1.99 kB │ gzip:   1.00 kB
apps/web build: dist/assets/ArenaScene-Dj9lbPsu.js            5.91 kB │ gzip:   2.32 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/index-wYeebBY6.js               710.67 kB │ gzip: 110.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 1.75s
apps/web build: Done

EXIT 0; runtime 15.59s

```

### q5-e2e-final.txt

```text

> @taskbar-hero/web@0.0.0 test:e2e /workspace/taskbar-hero/apps/web
> playwright test

[WebServer] (node:11313) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:11325) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:11350) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:11362) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/workspace/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
[WebServer] (node:11389) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:11401) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 53 tests using 1 worker
(node:11425) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
··························(node:11825) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
···························
  53 passed (1.0m)

```

## Files touched and reasons

```text
apps/web/e2e/layout/arena.spec.ts          |  22 +++
 apps/web/e2e/layout/character-bag.spec.ts  |  17 +-
 apps/web/e2e/layout/stage-layout.spec.ts   |  45 ++++-
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
 apps/web/src/game/stage/StageCanvas.tsx    |  33 ++++
 apps/web/src/game/stage/StageScene.ts      |  53 +++++
 apps/web/src/game/stage/progress.ts        |   8 +
 apps/web/src/game/stage/storeV2.test.ts    |  33 ++++
 apps/web/src/game/v2/storeV2.ts            |  24 +++
 apps/web/src/layout/StageLayout.test.tsx   |  49 ++++-
 apps/web/src/layout/StageLayout.tsx        | 106 ++++++++--
 apps/web/src/layout/layout.css             |  11 ++
 apps/web/src/main.tsx                      |   2 +
 reports/v19-arena.md                       | 300 +++++++++++++++++++++++++++++
 reports/v19-arena/1280.png                 | Bin 0 -> 31112 bytes
 reports/v19-arena/390-reduced.png          | Bin 0 -> 21169 bytes
 26 files changed, 1031 insertions(+), 27 deletions(-)
```

Report file records evidence and review gates.
