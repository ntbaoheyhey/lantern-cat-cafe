# V11 functions

Implemented on `ai/codex-v11-functions` from `origin/main` at `4dd8e681ab91081765ec22bd82306629c608b056`. The prerequisite gate passed. The user authorized the route-key test assertion and the workflow FUNCTIONS line in the follow-up.

orchestrator: merging deploys the four new functions via deploy-functions.yml; V8 is already applied.

## Changes

- Added craft, salvage, lock, and Relic forge handlers, route registration, SQL adapters, and four Edge Function entrypoints with generated Deno import maps.
- Craft validates inputs, runs applyCraft, passes only positive costs to SQL, returns the real item UUID, and reloads state. SQL refusals preserve error and stack.
- Salvage validates and deduplicates UUIDs, preserves ownership/equipped/locked refusal order, sums content salvage, and returns actual capped SQL credits. Lock validates UUID and boolean and reloads state.
- Relic forge reuses v1 seeds/odds, signing, nonce reads, reissue SQL, and minted SQL. No dependency, package, migration, or v1 function was changed. No workflow was run, PR opened, migration applied to a live database, or deployment performed. Tests use local PGlite and a generated throwaway key.

## Craft seed schema mismatch

Used `v2CraftSeed(secret, player, `${raw.progressRev}:${raw.inventory.length}:${nowS}`)` as requested. The schema proposal specifies a crafted-item count, but v2_snapshot does not return that count and SQL changes are forbidden. Orchestrator: a later SQL change can expose the count. This fallback is not a monotonic craft counter and can repeat after an inventory change within one second.

## Relic flow and covering tests

Tests live in `supabase/tests/v2/functions-forge.test.ts`:

1. Live pending voucher, including the expiry-plus-grace boundary: “spends the content costs, signs verifiable typed data, and returns pending without spending”.
2. Expired unused nonce: “reissues an expired unused nonce with the same Relic and no extra spend”. Uses the existing game_voucher_reissue and signedVoucherV2 helpers.
3. Parallel reissue returns null: “reloads the pending voucher when a parallel caller reissued it first”. Reloads and signs the winning pending row.
4. Expired used nonce: “records an expired used voucher minted before applying the daily limit”. Uses game_voucher_minted with null transaction hash, then applies today's forge limit.
5. New forge costs and v1-identical rarity: typed-data/signature test; shortages: “refuses pearl and yarn shortages in the SQL check order”.
6. Shared v1 pending/daily limit: “returns a live v1 pending voucher, then blocks once that v1 forge is minted”.
7. Missing signer: “refuses missing configuration before spending or creating a voucher”.

Craft/salvage/lock coverage includes recipe shortages (including a Fish-only shortage), exact spending, bag-full refusal, all-or-nothing salvage, duplicate/uppercase UUIDs, value loss, foreign ownership, toggling, malformed input, SQL refusals after precheck, capped credits, and parallel craft plus claim.

## Validation context

The environment's default pnpm was 11.25.0, while package.json pins 10.28.0. The initial noninteractive install failed; CI=true with version 11 then failed on its build policy and inserted placeholder allowBuilds entries. Those generated entries were restored immediately to the original file. Subsequent commands use a temporary PATH shim invoking `corepack pnpm` (10.28.0), without repository configuration changes. Installation succeeded with the pinned version; its existing ignored optional native build scripts warning was preserved.

The requested targeted command ran all 17 Supabase test files (372 tests), all passing. An additional temporary TypeScript configuration includes the v2 tests, since the package's normal tsconfig include only lists src. It passed. Deno is not installed, so its conditional check is unavailable.

All required local checks passed in the prescribed order: frozen installation, Deno map regeneration with a clean functions diff after the implementation commit, typecheck, lint, full tests, and build. The full suite passed 1,668 ordinary tests plus 2 expected-failure cases; the game-rules suite also reports 2 existing skipped cases. No tests were skipped, weakened, or deleted by this change. The production build emitted a browser externalization warning for an existing dependency and exited successfully. No unresolved implementation issue identified beyond the documented craft-seed schema mismatch.

## Files changed

- `.github/workflows/deploy-functions.yml`
- `reports/v11-functions.md`
- `supabase/functions/_shared/v2/forge.ts`
- `supabase/functions/_shared/v2/game.ts`
- `supabase/functions/_shared/v2/server.ts`
- `supabase/functions/v2-craft/deno.json`
- `supabase/functions/v2-craft/index.ts`
- `supabase/functions/v2-lock/deno.json`
- `supabase/functions/v2-lock/index.ts`
- `supabase/functions/v2-relic-forge/deno.json`
- `supabase/functions/v2-relic-forge/index.ts`
- `supabase/functions/v2-salvage/deno.json`
- `supabase/functions/v2-salvage/index.ts`
- `supabase/tests/v2/functions-forge.test.ts`
- `supabase/tests/v2/functions-state.test.ts`
- `supabase/tests/v2/v2-store.ts`

## Commands and full verification output

Inspection commands read the requested documentation, rule engine, v1 lifecycle, SQL, helpers, and existing tests; no AGENTS.md was found. Below are complete gate, setup-verification, and validation logs, including failed installation attempts.

### `git fetch origin +main:refs/remotes/origin/main; git rev-parse origin/main; git cat-file -e origin/main:<each prerequisite>`

```text
4dd8e681ab91081765ec22bd82306629c608b056
PASS supabase/functions/_shared/v2/game.ts
PASS supabase/functions/_shared/v2/http.ts
PASS supabase/functions/_shared/v2/voucher.ts
PASS supabase/functions/v2-claim/index.ts
PASS supabase/migrations/20261101000000_v2_cat_rpg.sql
```

### `pnpm install --frozen-lockfile (environment default 11.25.0)`

```text
Scope: all 7 workspace projects
[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY] Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true", or set "confirmModulesPurge" to "false".
```

### `CI=true pnpm install --frozen-lockfile (environment default 11.25.0)`

```text
Scope: all 7 workspace projects
Recreating /workspace/taskbar-hero/node_modules
? Verifying lockfile against supply-chain policies (520 entries)...
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +504
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 504, reused 0, downloaded 0, added 0
Progress: resolved 504, reused 0, downloaded 14, added 7
Progress: resolved 504, reused 0, downloaded 38, added 11
Progress: resolved 504, reused 0, downloaded 63, added 11
Progress: resolved 504, reused 0, downloaded 121, added 15
Progress: resolved 504, reused 0, downloaded 187, added 61
Progress: resolved 504, reused 0, downloaded 241, added 222
Progress: resolved 504, reused 0, downloaded 330, added 306
✓ Lockfile passes supply-chain policies (520 entries in 8.6s)
Progress: resolved 504, reused 0, downloaded 495, added 504, done

[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

### `CI=true pnpm install --frozen-lockfile (Corepack pnpm 10.28.0)`

```text
Scope: all 7 workspace projects
Recreating /workspace/taskbar-hero/node_modules
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +506
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 506, reused 0, downloaded 21, added 9
Progress: resolved 506, reused 0, downloaded 29, added 11
Progress: resolved 506, reused 0, downloaded 49, added 24
Progress: resolved 506, reused 0, downloaded 121, added 129
Progress: resolved 506, reused 0, downloaded 186, added 193
Progress: resolved 506, reused 0, downloaded 248, added 257
Progress: resolved 506, reused 0, downloaded 312, added 306
Progress: resolved 506, reused 0, downloaded 400, added 409
Progress: resolved 506, reused 0, downloaded 462, added 470
Progress: resolved 506, reused 0, downloaded 497, added 506, done

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 11.7s using pnpm v10.28.0
```

### `pnpm gen:deno`

```text

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 17 Edge Function import maps
```

### `pnpm --filter @taskbar-hero/supabase-tests test -- v2/functions-forge v2/functions-state`

```text

> @taskbar-hero/supabase-tests@0.0.0 test /workspace/taskbar-hero/supabase/tests
> vitest run -- v2/functions-forge v2/functions-state


 RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests


 Test Files  17 passed (17)
      Tests  372 passed (372)
   Start at  05:06:27
   Duration  28.15s (tests 87%, import 12%, transform 1%)

    Isolate  17 workers spawned · ~102ms startup each (spawn + environment, per file)
             at least ~1.64s faster with isolate: false — reuses workers across files instead of one per file

```

### `pnpm --filter @taskbar-hero/supabase-tests exec tsc --noEmit -p /tmp/v11-tsconfig.json`

```text
(no output)
```

### `git config user.email; git config user.name; git diff --check; git status --short`

```text
108352255+ntbaoheyhey@users.noreply.github.com
ntbaoheyhey
 M .github/workflows/deploy-functions.yml
 M supabase/functions/_shared/v2/game.ts
 M supabase/functions/_shared/v2/server.ts
 M supabase/tests/v2/functions-state.test.ts
 M supabase/tests/v2/v2-store.ts
?? reports/v11-functions.md
?? supabase/functions/_shared/v2/forge.ts
?? supabase/functions/v2-craft/
?? supabase/functions/v2-lock/
?? supabase/functions/v2-relic-forge/
?? supabase/functions/v2-salvage/
?? supabase/tests/v2/functions-forge.test.ts
```

### `git commit -m 'feat: add v2 crafting salvage lock and relic forge functions'`

```text
[ai/codex-v11-functions 02f497b] feat: add v2 crafting salvage lock and relic forge functions
 16 files changed, 870 insertions(+), 6 deletions(-)
 create mode 100644 reports/v11-functions.md
 create mode 100644 supabase/functions/_shared/v2/forge.ts
 create mode 100644 supabase/functions/v2-craft/deno.json
 create mode 100644 supabase/functions/v2-craft/index.ts
 create mode 100644 supabase/functions/v2-lock/deno.json
 create mode 100644 supabase/functions/v2-lock/index.ts
 create mode 100644 supabase/functions/v2-relic-forge/deno.json
 create mode 100644 supabase/functions/v2-relic-forge/index.ts
 create mode 100644 supabase/functions/v2-salvage/deno.json
 create mode 100644 supabase/functions/v2-salvage/index.ts
 create mode 100644 supabase/tests/v2/functions-forge.test.ts
```

### `pnpm gen:deno && git diff --exit-code -- supabase/functions`

```text

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 17 Edge Function import maps
```

### `pnpm typecheck`

```text

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
```

### `pnpm lint`

```text

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
```

### `pnpm test`

```text

> taskbar-hero@0.0.0 test /workspace/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/auth test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/auth
packages/chain test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/chain
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  05:08:20
packages/chain test:    Duration  294ms (import 36%, worker 33%, transform 19%, tests 12%)
packages/chain test: Done
packages/game-rules test$ vitest run
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  05:08:20
packages/auth test:    Duration  533ms (import 63%, tests 29%, transform 7%, worker 1%)
packages/auth test: Done
supabase/tests test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
supabase/tests test:  Test Files  17 passed (17)
supabase/tests test:       Tests  372 passed (372)
supabase/tests test:    Start at  05:08:21
supabase/tests test:    Duration  37.30s (tests 89%, import 10%, transform 1%)
supabase/tests test:     Isolate  17 workers spawned · ~122ms startup each (spawn + environment, per file)
supabase/tests test:              at least ~1.96s faster with isolate: false — reuses workers across files instead of one per file
supabase/tests test: Done
packages/game-rules test:  Test Files  17 passed | 2 skipped (19)
packages/game-rules test:       Tests  292 passed | 2 expected fail | 2 skipped (296)
packages/game-rules test:    Start at  05:08:20
packages/game-rules test:    Duration  72.07s (tests 98%, import 1%, transform 1%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  05:09:33
packages/api-contract test:    Duration  229ms (transform 66%, import 27%, tests 5%, worker 2%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /workspace/taskbar-hero/apps/web
apps/web test:  Test Files  66 passed (66)
apps/web test:       Tests  957 passed (957)
apps/web test:    Start at  05:09:34
apps/web test:    Duration  60.69s (environment 57%, tests 31%, import 11%, transform 1%)
apps/web test: Environment  jsdom was created 66 times · 31.21s total, 57% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done
```

### `pnpm build`

```text

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
apps/web build: ✓ 1724 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-unBFXH2h.js               132.03 kB │ gzip:  38.56 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 713ms
apps/web build: Done
```

### `Scope audit: allowed files, exactly one authorized line in each extra file, four-line entrypoints`

```text
PASS exactly one authorized line changed: .github/workflows/deploy-functions.yml
PASS exactly one authorized line changed: supabase/tests/v2/functions-state.test.ts
PASS all four entrypoints have exactly four lines
PASS all 16 changed files are allowed

Files changed:
.github/workflows/deploy-functions.yml
reports/v11-functions.md
supabase/functions/_shared/v2/forge.ts
supabase/functions/_shared/v2/game.ts
supabase/functions/_shared/v2/server.ts
supabase/functions/v2-craft/deno.json
supabase/functions/v2-craft/index.ts
supabase/functions/v2-lock/deno.json
supabase/functions/v2-lock/index.ts
supabase/functions/v2-relic-forge/deno.json
supabase/functions/v2-relic-forge/index.ts
supabase/functions/v2-salvage/deno.json
supabase/functions/v2-salvage/index.ts
supabase/tests/v2/functions-forge.test.ts
supabase/tests/v2/functions-state.test.ts
supabase/tests/v2/v2-store.ts
```

### `git log --format='%an <%ae>' origin/main..HEAD; git diff --check; git status --short`

```text
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

## Git and delivery

Git identity is `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`. No author correction was needed for the implementation commit. This validation report is the second commit, using the same local identity. The author list will be checked again immediately before `git push -u origin ai/codex-v11-functions`.

The installed pnpm version was confirmed with `corepack pnpm --version`, output `10.28.0`; the default `pnpm --version` output was `11.25.0`. The temporary shim executes `corepack pnpm "$@"`; `CI=true` was set only for the noninteractive install. No tracked package or workspace configuration change remains.

Workflow inspection (`rg -n -A 14 '^on:' .github/workflows/*.yml`) confirmed CI has only workflow_dispatch and function deployment accepts pushes only on main (or manual dispatch). Pushing this feature branch does not trigger either workflow. No PR will be opened.

The optional check `deno check supabase/functions/v2-*/index.ts` was not run because `command -v deno` returned no path. The additional v2 TypeScript check used a temporary config extending supabase/tests/tsconfig.json and explicitly including functions-forge.test.ts, functions-state.test.ts, and v2-store.ts; this changed no repository file.
