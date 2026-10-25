STATUS: DONE

C20: locked the nine-v2-function deployment state with four tests. PASS: workflow FUNCTIONS contains every v2 folder and no extra v2 name, no duplicates, exact original nine-name v1 list; real routesV2 keys equal folders; every index.ts and deno.json exists and maps match the actual generator byte for byte; API docs name every endpoint. Generator runs only in a temporary tree, cleaned in finally. Workflow unchanged.

PASS: focused tests 4/4, full install/gen:deno drift/typecheck/lint/root tests/build. Playwright not applicable to test-only changes. NOT VERIFIED: deno check, because Deno is absent (not installed as a dependency); deployed function health/live gateway is outside scope. Gate: boss function present, deployment-list test absent on main. Files: supabase/tests/v2/deploy-list.test.ts contains drift checks; this report records evidence. No product, workflow, contract, auth, migration, dependency or lock/workspace edit. No blocker or user decision.

### q7-gate.txt

```text
$ git ls-tree origin/main supabase/functions/v2-boss-fight/index.ts supabase/tests/v2/deploy-list.test.ts
100644 blob bddbae472a8655dd14ed133ba483e111553bb35c	supabase/functions/v2-boss-fight/index.ts
EXIT 0

```

### q7-focused.txt

```text

 RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests


 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  12:20:06
   Duration  2.64s (import 65%, transform 22%, tests 13%, worker 1%)


```

### q7-deno-check.txt

```text
NOT VERIFIED: deno is not installed.

```

### q7-install.txt

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
Done in 771ms using pnpm v10.28.0

EXIT 0; runtime 0.84s

```

### q7-deno.txt

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps

EXIT 0; runtime 0.31s

```

### q7-typecheck.txt

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

EXIT 0; runtime 14.71s

```

### q7-lint.txt

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

EXIT 0; runtime 14.82s

```

### q7-test.txt

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
packages/chain test:    Start at  12:20:41
packages/chain test:    Duration  322ms (import 43%, transform 33%, tests 13%, worker 12%)
packages/chain test: Done
packages/game-rules test$ vitest run
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  12:20:41
packages/auth test:    Duration  613ms (import 65%, tests 29%, transform 6%, worker 1%)
packages/auth test: Done
supabase/tests test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
supabase/tests test:  Test Files  19 passed (19)
supabase/tests test:       Tests  389 passed (389)
supabase/tests test:    Start at  12:20:42
supabase/tests test:    Duration  45.23s (tests 88%, import 11%)
supabase/tests test:     Isolate  19 workers spawned · ~141ms startup each (spawn + environment, per file)
supabase/tests test:              at least ~2.53s faster with isolate: false — reuses workers across files instead of one per file
supabase/tests test: Done
packages/game-rules test:  Test Files  19 passed | 2 skipped (21)
packages/game-rules test:       Tests  326 passed | 2 expected fail | 4 skipped (332)
packages/game-rules test:    Start at  12:20:41
packages/game-rules test:    Duration  86.47s (tests 99%, import 1%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  12:22:08
packages/api-contract test:    Duration  217ms (transform 52%, import 37%, tests 7%, worker 4%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /workspace/taskbar-hero/apps/web
apps/web test:  Test Files  75 passed (75)
apps/web test:       Tests  1037 passed (1037)
apps/web test:    Start at  12:22:09
apps/web test:    Duration  76.66s (environment 58%, tests 30%, import 11%, transform 1%)
apps/web test: Environment  jsdom was created 75 times · 39.85s total, 58% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done

EXIT 0; runtime 165.86s

```

### q7-build.txt

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
apps/web build: ✓ built in 1.03s
apps/web build: Done

EXIT 0; runtime 18.19s

```

## Files touched and reasons

```text
supabase/tests/v2/deploy-list.test.ts | 48 +++++++++++++++++++++++++++++++++++
 1 file changed, 48 insertions(+)
```

Report file records evidence and review gates.
