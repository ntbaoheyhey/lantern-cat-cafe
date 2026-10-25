STATUS: DONE

C15 DRAFT ONLY. MERGE GATE: D8 user OK + apply_migration before merge. Nothing was applied to Supabase, deployed, or merged.

Signature: public.v2_grant_founder_batch(p_cutoff timestamptz, p_contents jsonb, p_caps jsonb default {}, p_limit integer default 500) returns jsonb {granted, already, remaining}. Eligible players have created_at < p_cutoff and no founder_grants row. Batches lock by created_at/id, skip already locked rows, clamp limit 1..5000, and delegate to the existing idempotent per-player grant. already counts qualifying players who had grants before this call. Contents and cutoff are never selected in product code. No table changes.

PASS: caps clamp catKey to existing cap 5 when supplied; rerun is no-op; pregranted counted; five players/limit 2 leave 3,1,0; deterministic order; invalid unknown/negative/fraction/string/array/null contents or null cutoff make no changes; exact-cutoff exclusion; lower-limit clamp; one SQL material list equals STACK_CAPS_V2. Fish is separately accepted as the uncapped currency, matching the requested EXAMPLE; material caps do not contain Fish. Whole numeric spellings such as 1.0 are normalized to bigint before calling the old helper; out-of-bigint-range values are refused. PASS: anon/authenticated denied, service_role allowed; every v2 function remains security definer with empty search_path; V8 plus the new migration and rollback restore v1 listing/data; snapshot founder true.

EXAMPLE ONLY — contents are not approved. Parameterized runbook call:

```sql
SELECT public.v2_grant_founder_batch(
  $1::timestamptz,
  '{"fish":100,"catKey":2,"moonPearl":1}'::jsonb,
  $2::jsonb,
  500
);
```

Bind $1 to the D8-approved cutoff and $2 to the approved cap object (existing STACK_CAPS_V2, including catKey cap 5). Repeat until remaining = 0; reruns do not duplicate credit. D8 must approve the actual contents; the example is fish 100, catKey 2, moonPearl 1. No live SQL call was made.

Rollback: the existing test rollback dynamically drops every public.v2_% function including the new batch and restores v1 objects/data in PGlite. Actual runbook rollback removes v2 data and requires the user/orchestrator backup and approval process.

D8 questions: actual stack contents; exact qualifying cutoff (cut-over timestamp?); confirm strict before cutoff (runbook currently uses <=); whether Founder items are wanted (this function grants stacks only; items need another function/card).

Files/reasons: new additive migration and founder.test.ts implement/verify batching; helpers.ts skips every migration >= V2_MIGRATION for v1-only DB and loads all additive v2 SQL for rollback/reapply; schema.test.ts adds the new API function to the existing privilege/count assertions so the same security checks cover it. That necessary schema test extension uses section C broad permission; no existing assertion or timeout is weakened. Applied migrations and product/auth/contract/config files unchanged.

PASS: initial focused 17 tests and full 393-test database suite; root install/gen:deno drift/typecheck/lint/test/build. Final SQL normalization was reviewed after that root run; final focused 18 tests and complete 394-test database suite revalidate the latest SQL. Web/package sources are unchanged, so Playwright does not apply. NOT VERIFIED: live apply_migration/grant, D8 approval, real project backup/rollback, or any chosen Founder economy contents. Ready for review and PGlite rehearsal only.

### q8-gate.txt

```text
$ git ls-tree origin/main docs/cutover-v2.md
100644 blob f79374b07daf133fb44dc487f617f0c64ea242a5	docs/cutover-v2.md
EXIT 0

$ git show origin/main:supabase/migrations/20261101000000_v2_cat_rpg.sql | grep -n 'create function public.v2_grant_founder'
654:create function public.v2_grant_founder(p_player uuid, p_contents jsonb, p_caps jsonb default '{}'::jsonb)
EXIT 0

$ git ls-tree --name-only origin/main supabase/migrations/ | grep founder
EXIT 1

$ git ls-remote origin 'refs/heads/*founder*'
EXIT 0

```

### q8-final-focused.txt

```text

 RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests


 Test Files  2 passed (2)
      Tests  18 passed (18)
   Start at  12:32:51
   Duration  8.55s (tests 97%, import 1%, transform 1%)


```

### q8-final-supabase.txt

```text

> @taskbar-hero/supabase-tests@0.0.0 test /workspace/taskbar-hero/supabase/tests
> vitest run


 RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests


 Test Files  19 passed (19)
      Tests  394 passed (394)
   Start at  12:33:01
   Duration  32.96s (tests 88%, import 11%, transform 1%)

    Isolate  19 workers spawned · ~99ms startup each (spawn + environment, per file)
             at least ~1.77s faster with isolate: false — reuses workers across files instead of one per file


```

### q8-install.txt

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
Done in 932ms using pnpm v10.28.0

EXIT 0; runtime 1.00s

```

### q8-deno.txt

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps

EXIT 0; runtime 0.54s

```

### q8-typecheck.txt

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

EXIT 0; runtime 16.32s

```

### q8-lint.txt

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

EXIT 0; runtime 16.31s

```

### q8-test.txt

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
packages/chain test:    Start at  12:28:24
packages/chain test:    Duration  350ms (import 49%, transform 21%, tests 21%, worker 8%)
packages/chain test: Done
packages/game-rules test$ vitest run
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  12:28:24
packages/auth test:    Duration  606ms (import 65%, tests 29%, transform 5%, worker 1%)
packages/auth test: Done
supabase/tests test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
supabase/tests test:  Test Files  19 passed (19)
supabase/tests test:       Tests  393 passed (393)
supabase/tests test:    Start at  12:28:25
supabase/tests test:    Duration  48.83s (tests 90%, import 9%)
supabase/tests test:     Isolate  19 workers spawned · ~141ms startup each (spawn + environment, per file)
supabase/tests test:              at least ~2.54s faster with isolate: false — reuses workers across files instead of one per file
supabase/tests test: Done
packages/game-rules test:  Test Files  19 passed | 2 skipped (21)
packages/game-rules test:       Tests  326 passed | 2 expected fail | 4 skipped (332)
packages/game-rules test:    Start at  12:28:25
packages/game-rules test:    Duration  88.34s (tests 99%, import 1%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  12:29:54
packages/api-contract test:    Duration  194ms (transform 51%, import 38%, tests 7%, worker 3%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /workspace/taskbar-hero/apps/web
apps/web test:  Test Files  75 passed (75)
apps/web test:       Tests  1037 passed (1037)
apps/web test:    Start at  12:29:54
apps/web test:    Duration  73.63s (environment 57%, tests 31%, import 11%, transform 1%)
apps/web test: Environment  jsdom was created 75 times · 37.33s total, 57% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done

EXIT 0; runtime 164.64s

```

### q8-build.txt

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
apps/web build: ✓ built in 874ms
apps/web build: Done

EXIT 0; runtime 15.81s

```

## Files touched and reasons

```text
.../migrations/20261110000000_v2_founder_batch.sql | 58 +++++++++++++
 supabase/tests/v2/founder.test.ts                  | 95 ++++++++++++++++++++++
 supabase/tests/v2/helpers.ts                       |  7 +-
 supabase/tests/v2/schema.test.ts                   |  2 +-
 4 files changed, 158 insertions(+), 4 deletions(-)
```

Report file records evidence and review gates.
