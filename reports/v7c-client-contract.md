STATUS: DONE

C19: the real SupabaseGameApiV2 browser client now talks through handlerV2 and routesV2 to the migrated PGlite SQL. Product code unchanged. Mismatches: none. Gate: v2-boss-fight exists on main and is registered by game.ts through routesBossV2 (the literal endpoint lives in boss.ts); runtime route/client/folder coverage proves the registration both ways. Client fetch injection exists; test absent on main; no competing client-contract branch.

PASS: all nine endpoints statically and dynamically covered; classless getState -> warrior -> ten-minute claim (gains/revision) -> equip/unequip -> craft/lock/unlock/salvage -> first-clear boss timeline ending end, reloaded state and exact keys. PASS: GameApiErrorV2 for null/bad-token unauthenticated, no_class, not_reached, no_key, finite stored cooldownUntil, not_enough stackId, equipped/locked, invalid_request; all forge blocked reasons preserved. PASS: parallel first clear yields exactly one success and one stale. PASS: documented state shape (SQL stacks are represented by currencies and materials on the wire), single migrated DB, file runtime 3.65s <60s.

Signer is a throwing test stub with a dummy verifying-contract address; only forge blocked paths are tested and sign is never called. No real signature, private key, gateway or transaction involved.

Endpoint coverage (client -> endpoint -> real route -> test):

| client | endpoint | route | test |
|---|---|---|---|
| getState | v2-state | getStateV2 | 1/2/3/6 |
| chooseClass | v2-choose-class | chooseClassV2 | 1/2/3/6 |
| claim | v2-claim | claimV2 | 1/2/3/6 |
| equip | v2-equip | equipV2 | 1/2/6 |
| craft | v2-craft | craftV2 | 1/2/3/6 |
| salvage | v2-salvage | salvageV2 | 1/2/3/6 |
| setLocked | v2-lock | lockV2 | 1/2/3/6 |
| fightBoss | v2-boss-fight | fightBossV2 | 1/2/3/5/6 |
| forgeRelic | v2-relic-forge | forgeRelicV2 | 1/4/6 |

PASS: full 391-test Supabase suite, install, generated-map drift, typecheck, lint, full root suite and build. Playwright not applicable: test-only diff outside web/packages. Files: supabase/tests/v2/client-contract.test.ts provides integration/transport assertions; this report records proof and limits. NOT VERIFIED/manual server-mode check: real JWT/session expiry, Supabase gateway and CORS, deployed routes, and a real Fuji voucher mint (CL10/user). No blocker; no contract fix requested.

### q6-gate.txt

```text
$ git ls-tree origin/main supabase/functions/v2-boss-fight/index.ts supabase/tests/v2/client-contract.test.ts
100644 blob bddbae472a8655dd14ed133ba483e111553bb35c	supabase/functions/v2-boss-fight/index.ts
EXIT 0

$ git show origin/main:supabase/functions/_shared/v2/game.ts | grep -n 'routesBossV2'
1:import { routesBossV2 } from "./boss.ts";
144:export function routesV2(deps: V2Deps): Record<"v2-state" | "v2-claim" | "v2-equip" | "v2-choose-class" | keyof ReturnType<typeof routesForgeV2> | keyof ReturnType<typeof routesBossV2>, (playerId: string, body: Record<string, unknown>) => Promise<unknown>> {
146:    "v2-equip": (player, body) => equipV2(deps, player, body), "v2-choose-class": (player, body) => chooseClassV2(deps, player, body), ...routesForgeV2(deps), ...routesBossV2(deps) };
EXIT 0

$ git show origin/main:apps/web/src/api/SupabaseGameApiV2.ts | grep -n 'fetch?: typeof fetch'
16:  fetch?: typeof fetch;
EXIT 0

$ git ls-remote origin 'refs/heads/*client-contract*'
EXIT 0

```

### q6-focused.txt

```text

 RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests


 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  12:14:11
   Duration  3.65s (tests 74%, import 17%, transform 8%)


```

### q6-supabase.txt

```text

> @taskbar-hero/supabase-tests@0.0.0 test /workspace/taskbar-hero/supabase/tests
> vitest run


 RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests


 Test Files  19 passed (19)
      Tests  391 passed (391)
   Start at  12:15:05
   Duration  34.23s (tests 87%, import 13%)

    Isolate  19 workers spawned · ~111ms startup each (spawn + environment, per file)
             at least ~2.00s faster with isolate: false — reuses workers across files instead of one per file


```

### q6-install.txt

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
Done in 894ms using pnpm v10.28.0

EXIT 0; runtime 0.96s

```

### q6-deno.txt

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps

EXIT 0; runtime 0.41s

```

### q6-typecheck.txt

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

EXIT 0; runtime 15.57s

```

### q6-lint.txt

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

EXIT 0; runtime 15.05s

```

### q6-test.txt

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
packages/chain test:    Start at  12:16:12
packages/chain test:    Duration  342ms (import 38%, transform 36%, tests 15%, worker 11%)
packages/chain test: Done
packages/game-rules test$ vitest run
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  12:16:12
packages/auth test:    Duration  671ms (import 66%, tests 28%, transform 6%, worker 1%)
packages/auth test: Done
supabase/tests test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
supabase/tests test:  Test Files  19 passed (19)
supabase/tests test:       Tests  391 passed (391)
supabase/tests test:    Start at  12:16:13
supabase/tests test:    Duration  46.78s (tests 89%, import 10%)
supabase/tests test:     Isolate  19 workers spawned · ~136ms startup each (spawn + environment, per file)
supabase/tests test:              at least ~2.44s faster with isolate: false — reuses workers across files instead of one per file
supabase/tests test: Done
packages/game-rules test:  Test Files  19 passed | 2 skipped (21)
packages/game-rules test:       Tests  326 passed | 2 expected fail | 4 skipped (332)
packages/game-rules test:    Start at  12:16:13
packages/game-rules test:    Duration  86.32s (tests 99%, import 1%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  12:17:40
packages/api-contract test:    Duration  203ms (transform 52%, import 37%, tests 8%, worker 3%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /workspace/taskbar-hero/apps/web
apps/web test:  Test Files  75 passed (75)
apps/web test:       Tests  1037 passed (1037)
apps/web test:    Start at  12:17:40
apps/web test:    Duration  76.17s (environment 58%, tests 30%, import 11%, transform 1%)
apps/web test: Environment  jsdom was created 75 times · 39.42s total, 58% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done

EXIT 0; runtime 165.16s

```

### q6-build.txt

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
apps/web build: ✓ built in 729ms
apps/web build: Done

EXIT 0; runtime 15.12s

```

## Files touched and reasons

```text
supabase/tests/v2/client-contract.test.ts | 148 ++++++++++++++++++++++++++++++
 1 file changed, 148 insertions(+)
```

Report file records evidence and review gates.
