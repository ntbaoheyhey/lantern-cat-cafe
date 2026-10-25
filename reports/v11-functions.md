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

Full required checks pending at the first implementation commit; results will be appended in the report commit. No other unresolved implementation issue identified.

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
