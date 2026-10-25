# V9 functions — blocked by deployment workflow allowlist

Branch: `ai/codex-v9-functions`, based on fetched `origin/main`.

The four endpoints and their migrated-PGlite tests are implemented. No PR, push,
GitHub Actions invocation, migration application to a remote database, or function
deployment was performed. No dependency was added; lockfile unchanged.

## Scope blocker

`supabase/tests/src/consistency.test.ts:295` requires the `FUNCTIONS` list in
`.github/workflows/deploy-functions.yml:26` to equal all function folders. The
workflow currently lists only the nine v1 functions. These four new folders make
the existing test fail. Updating `.github/workflows/deploy-functions.yml` is
necessary, but that file is outside the explicit edit allowlist. Work stops at
this boundary; the test and workflow remain unchanged. The branch is held locally
because the requested all-checks-pass condition for pushing cannot be met.

Required scope extension: permit adding `v2-state`, `v2-claim`, `v2-equip` and
`v2-choose-class` to the workflow's `FUNCTIONS` list. No such edit has been made.

Orchestrator note requested by the task:
"merge only after V8 is applied to Supabase; this merge deploys v2-* functions via deploy-functions.yml"
This deployment expectation is currently blocked by the workflow list above.

## Implementation

Pure function logic uses the v2 rule and view helpers, SQL CAS for last-claim
microseconds and progress revision, one recomputation, actual SQL capped stack
credits plus overflow salvage, registry starters, UUID/slot validation, and v2
HTTP refusals. Deno wiring reuses `verifySessionToken` exactly as v1 and uses the
same environment fallbacks; environment access stays in `server.ts`.

`toPlayerStateV2` copies stacks and bonuses, supplies combat item keys and drop
source, and converts boss clears/cooldown and the shared forge day. `viewOf` uses
`stateViewV2` and `gateOfV2`. Pending vouchers are signed and persisted when a
signer exists, or omitted when unsigned and no signer is configured, as in v1.
Voucher expiry/reissue remains outside these four endpoints, as in v1 state load.

## Derived snapshot type

The type in `_shared/v2/game.ts` comes directly from `v2_snapshot`,
`v2_item_json`, and `game_voucher_json`:

```ts
export interface RawSnapshotV2 {
  classId: string | null;
  level: number;
  xp: number;
  chapter: number;
  round: number;
  kills: number;
  bestStage: number;
  fights: number;
  progressRev: number;
  lastClaimMicros: number;
  lastDailyKeyDay: string | null;
  cooldownUntil: number | null;
  serverTime: number;
  stacks: Record<string, number>;
  inventory: ItemV2Raw[];
  equipped: Record<string, string>;
  bossClears: { chapter: number; wins: number }[];
  founder: boolean;
  forgedToday: boolean;
  pending: VoucherRowV2 | null;
  today: TodayRelic | null;
}
```

`ItemV2Raw = v2.ItemViewV2`: `id`, `itemKey`, `slot`, optional `weaponType`, `rarity`, `level`, `bonus`, `locked`, `equipped`.

`VoucherRowV2 = VoucherRow`: `player: string`, `relicId: string`, `rarityName: Rarity`, `nonce: string`, `expiry: number`, `signature: string | null`, `status: "issued" | "minted" | "expired"`. `today: TodayRelic | null` has `relicId`, `rarityName`, `minted`, `txHash`, exactly as SQL emits.

## ForgeStatusV2 fields

| Field | Source |
| --- | --- |
| `blockedBy` | `relicForgeBlockV2` on v2 stacks and game day; null whenever a raw pending voucher exists. |
| `forgedToday` | SQL snapshot, shared `relic_forges` day. |
| `pending` | Shared voucher JSON converted by `signedVoucherV2`; signatures persisted with `game_voucher_sign`. |
| `today` | Copy of SQL snapshot shared relic/mint status. |

These are all the fields in v1 `ForgeStatus` / `buildServerState`; there are no additional legacy forge fields.

## Validation notes

The installed global pnpm was 11.25.0, while this repository pins 10.28.0. Initial attempts required noninteractive CI mode, then v11 refused ignored native builds and automatically added `allowBuilds` to `pnpm-workspace.yaml`. That generated change was restored. Final validation uses `corepack pnpm` 10.28.0 via a temporary external PATH shim and `CI=true`, without changing repository configuration. Native optional build warnings are retained below.

The supplied `pnpm ... test -- v2/functions-state` command runs the entire Supabase suite in this Vitest version; its only remaining failure is the forbidden workflow list. An additional direct Vitest invocation runs all 15 new tests and passes.

The existing supabase/tests tsconfig includes only `src`, so an additional temporary tsconfig outside the repository explicitly includes the new v2 test file and verifies `const s: ServerStateV2 = await getStateV2(...)`. This check passes. Deno is not installed, so `deno check` was unavailable.

Eight-hour claim wall time, including SQL and snapshot reloads: **56.53 ms**, below 500 ms.

Validation result: typecheck, lint, build, the extra v2 typecheck, and all 15 new tests pass. The requested suite command and full test command fail solely on the existing workflow consistency test. Existing skipped/expected-failure rule tests are unchanged.

## Gate and Git setup output

```text
$ git fetch origin +main:refs/remotes/origin/main
From https://github.com/ntbaoheyhey/taskbar-hero
 * [new branch]      main       -> origin/main

Fetched origin/main: 31689de289b578290a63a613b43f4b6ab19ba736

$ git config user.email
anthony.robinson.125292048@ms.namdinh.edu.vn
$ git config user.name
Hazel

$ git config user.email 108352255+ntbaoheyhey@users.noreply.github.com
$ git config user.name ntbaoheyhey
$ git config user.email
108352255+ntbaoheyhey@users.noreply.github.com
$ git config user.name
ntbaoheyhey

PASS supabase/migrations/20261101000000_v2_cat_rpg.sql
PASS packages/game-rules/src/v2/state/index.ts
PASS packages/game-rules/src/v2/view/index.ts
PASS apps/web/src/api/MockGameApiV2.ts

$ git switch -c ai/codex-v9-functions origin/main
Switched to a new branch 'ai/codex-v9-functions'
branch 'ai/codex-v9-functions' set up to track 'origin/main'.
```

Gate used `git cat-file -e "origin/main:$path"` for each listed file after fetch. No AGENTS.md was found outside dependency trees.

## Files changed

```text
reports/v9-functions.md
supabase/functions/_shared/v2/game.ts
supabase/functions/_shared/v2/http.ts
supabase/functions/_shared/v2/seeds.ts
supabase/functions/_shared/v2/server.ts
supabase/functions/_shared/v2/snapshot.ts
supabase/functions/_shared/v2/voucher.ts
supabase/functions/v2-choose-class/deno.json
supabase/functions/v2-choose-class/index.ts
supabase/functions/v2-claim/deno.json
supabase/functions/v2-claim/index.ts
supabase/functions/v2-equip/deno.json
supabase/functions/v2-equip/index.ts
supabase/functions/v2-state/deno.json
supabase/functions/v2-state/index.ts
supabase/tests/v2/functions-state.test.ts
supabase/tests/v2/v2-store.ts
```

## Command transcripts

Final commands use `CI=true` and the pinned pnpm PATH shim (`#!/bin/sh` followed by `exec corepack pnpm "$@"`, stored outside the repository). Full captured stdout/stderr follows; exit status is recorded after each command.

### Initial pnpm install --frozen-lockfile (global pnpm 11, no CI)

```text
Scope: all 7 workspace projects
[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY] Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true", or set "confirmModulesPurge" to "false".

Exit status: 1
```

### CI=true pnpm install --frozen-lockfile (global pnpm 11)

```text
Scope: all 7 workspace projects
Recreating /workspace/taskbar-hero/node_modules
? Verifying lockfile against supply-chain policies (520 entries)...
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +504
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 504, reused 0, downloaded 0, added 0
Progress: resolved 504, reused 0, downloaded 26, added 12
Progress: resolved 504, reused 0, downloaded 50, added 16
Progress: resolved 504, reused 0, downloaded 63, added 20
Progress: resolved 504, reused 0, downloaded 64, added 20
Progress: resolved 504, reused 0, downloaded 100, added 20
Progress: resolved 504, reused 0, downloaded 126, added 24
✓ Lockfile passes supply-chain policies (520 entries in 8.3s)
Progress: resolved 504, reused 0, downloaded 195, added 28
Progress: resolved 504, reused 0, downloaded 266, added 36
Progress: resolved 504, reused 0, downloaded 362, added 40
Progress: resolved 504, reused 0, downloaded 495, added 58
Progress: resolved 504, reused 0, downloaded 495, added 504, done

[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.

Exit status: 1
```

### CI=true pnpm install --frozen-lockfile --config.strict-dep-builds=false (global pnpm 11; temporary diagnostic)

```text
Scope: all 7 workspace projects
✓ Lockfile passes supply-chain policies (verified 26s ago)
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
Done in 959ms using pnpm v11.25.0

Exit status: 0
```

### Initial pnpm gen:deno (global pnpm 11 automatic install failure)

```text
Scope: all 7 workspace projects
[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY] Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true", or set "confirmModulesPurge" to "false".
[ERROR] Command failed with exit code 1: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install

pnpm: Command failed with exit code 1: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install
    at getFinalError (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:89986:14)
    at makeError (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:92293:21)
    at getSyncResult (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94137:10)
    at spawnSubprocessSync (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94097:14)
    at execaCoreSync (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94027:23)
    at callBoundExeca (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96555:23)
    at boundExeca (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96532:49)
    at sync2 (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96691:10)
    at runPnpmCli (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:276904:5)
    at runDepsStatusCheck (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:278122:7)

Exit status: 1
```

### Initial pnpm --filter @taskbar-hero/supabase-tests test -- v2/functions-state (global pnpm 11 automatic install failure)

```text
Scope: all 7 workspace projects
[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY] Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true", or set "confirmModulesPurge" to "false".
[ERROR] Command failed with exit code 1: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install

pnpm: Command failed with exit code 1: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install
    at getFinalError (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:89986:14)
    at makeError (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:92293:21)
    at getSyncResult (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94137:10)
    at spawnSubprocessSync (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94097:14)
    at execaCoreSync (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94027:23)
    at callBoundExeca (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96555:23)
    at boundExeca (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96532:49)
    at sync2 (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96691:10)
    at runPnpmCli (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:276904:5)
    at runDepsStatusCheck (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:278122:7)

Exit status: 1
```

### pnpm --filter @taskbar-hero/supabase-tests test -- v2/functions-state (first runtime run; short fake signature subsequently fixed)

```text
$ vitest run -- v2/functions-state

 RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests

 ❯ v2/functions-state.test.ts (15 tests | 1 failed) 2105ms
   ❯ v2 Edge Function logic over migrated SQL (9)
     × builds forge reasons and signs only unsigned pending vouchers 31ms
 ❯ src/consistency.test.ts (14 tests | 1 failed) 486ms
   ❯ R1 consistency: 4. deploy-functions.yml FUNCTIONS == function folders (1)
     × deploy-functions.yml FUNCTIONS matches existing supabase/functions folders 7ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/consistency.test.ts > R1 consistency: 4. deploy-functions.yml FUNCTIONS == function folders > deploy-functions.yml FUNCTIONS matches existing supabase/functions folders
AssertionError: expected [ 'auth-nonce', 'auth-verify', …(7) ] to deeply equal [ 'auth-nonce', 'auth-verify', …(11) ]

- Expected
+ Received

@@ -6,10 +6,6 @@
    "game-state",
    "idle-claim",
    "relic-forge",
    "relic-mint-report",
    "upgrade",
-   "v2-choose-class",
-   "v2-claim",
-   "v2-equip",
-   "v2-state",
  ]

 ❯ src/consistency.test.ts:295:26
    293|       .sort();
    294|
    295|     expect(ymlFunctions).toEqual(folderFunctions);
       |                          ^
    296|     expect(ymlFunctions.length).toBeGreaterThan(0);
    297|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯

 FAIL  v2/functions-state.test.ts > v2 Edge Function logic over migrated SQL > builds forge reasons and signs only unsigned pending vouchers
error: new row for relation "relic_vouchers" violates check constraint "relic_vouchers_signature_check"
 ❯ pe.Oe ../../node_modules/.pnpm/@electric-sql+pglite@0.5.11/node_modules/@electric-sql/pg-protocol/src/parser.ts:442:11
 ❯ pe.tt ../../node_modules/.pnpm/@electric-sql+pglite@0.5.11/node_modules/@electric-sql/pg-protocol/src/parser.ts:220:16
 ❯ pe.parse ../../node_modules/.pnpm/@electric-sql+pglite@0.5.11/node_modules/@electric-sql/pg-protocol/src/parser.ts:104:21
 ❯ D.Ne ../../node_modules/.pnpm/@electric-sql+pglite@0.5.11/node_modules/@electric-sql/pglite/src/pglite.ts:763:26
 ❯ ../../node_modules/.pnpm/@electric-sql+pglite@0.5.11/node_modules/@electric-sql/pglite/src/pglite.ts:716:14

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/2]⎯


 Test Files  2 failed | 14 passed (16)
      Tests  2 failed | 353 passed (355)
   Start at  03:24:37
   Duration  30.93s (tests 88%, import 11%, transform 1%)

/workspace/taskbar-hero/supabase/tests:
[ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL] @taskbar-hero/supabase-tests@0.0.0 test: `vitest run -- v2/functions-state`
Exit status 1

Exit status: 1
```

### pnpm --filter @taskbar-hero/supabase-tests exec tsc -p /tmp/v9-tsconfig.json (initial attempt, global pnpm 11)

```text
Scope: all 7 workspace projects
✓ Lockfile passes supply-chain policies (verified 1m ago)
Lockfile is up to date, resolution step is skipped
Already up to date

[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
[ERROR] Command failed with exit code 1: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install

pnpm: Command failed with exit code 1: /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install
    at getFinalError (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:89986:14)
    at makeError (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:92293:21)
    at getSyncResult (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94137:10)
    at spawnSubprocessSync (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94097:14)
    at execaCoreSync (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:94027:23)
    at callBoundExeca (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96555:23)
    at boundExeca (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96532:49)
    at sync2 (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:96691:10)
    at runPnpmCli (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:276904:5)
    at runDepsStatusCheck (file:///opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/dist/pnpm.mjs:278122:7)

Exit status: 1
```

### pnpm --filter @taskbar-hero/supabase-tests exec tsc -p /tmp/v9-tsconfig.json (first pinned run; signer fixture subsequently fixed)

```text
v2/functions-state.test.ts(150,32): error TS2345: Argument of type '{ relic: { signer: { sign: Mock<Procedure>; }; }; store: V2Store; seedSecret: string; now?: () => number; }' is not assignable to parameter of type 'V2Deps'.
  The types of 'relic.signer' are incompatible between these types.
    Property 'verifyingContract' is missing in type '{ sign: Mock<Procedure>; }' but required in type 'VoucherSigner'.
v2/functions-state.test.ts(154,22): error TS2345: Argument of type '{ relic: { signer: { sign: Mock<Procedure>; }; }; store: V2Store; seedSecret: string; now?: () => number; }' is not assignable to parameter of type 'V2Deps'.
  The types of 'relic.signer' are incompatible between these types.
    Property 'verifyingContract' is missing in type '{ sign: Mock<Procedure>; }' but required in type 'VoucherSigner'.
undefined
/workspace/taskbar-hero/supabase/tests:
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 2: tsc -p /tmp/v9-tsconfig.json

Exit status: 1
```

### pnpm install --frozen-lockfile (final, CI=true, pinned pnpm 10.28.0)

```text
Scope: all 7 workspace projects
Recreating /workspace/taskbar-hero/node_modules
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +506
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 506, reused 0, downloaded 20, added 20
Progress: resolved 506, reused 0, downloaded 29, added 22
Progress: resolved 506, reused 0, downloaded 36, added 22
Progress: resolved 506, reused 0, downloaded 78, added 85
Progress: resolved 506, reused 0, downloaded 133, added 140
Progress: resolved 506, reused 0, downloaded 188, added 182
Progress: resolved 506, reused 0, downloaded 253, added 262
Progress: resolved 506, reused 0, downloaded 304, added 311
Progress: resolved 506, reused 0, downloaded 375, added 384
Progress: resolved 506, reused 0, downloaded 427, added 430
Progress: resolved 506, reused 0, downloaded 478, added 479
Progress: resolved 506, reused 0, downloaded 497, added 506, done

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 13.7s using pnpm v10.28.0

Exit status: 0
```

### pnpm gen:deno (final pinned run)

```text

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 13 Edge Function import maps

Exit status: 0
```

### pnpm --filter @taskbar-hero/supabase-tests test -- v2/functions-state (signature fixed; workflow scope blocker only)

```text

> @taskbar-hero/supabase-tests@0.0.0 test /workspace/taskbar-hero/supabase/tests
> vitest run -- v2/functions-state


 RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests

 ❯ src/consistency.test.ts (14 tests | 1 failed) 510ms
   ❯ R1 consistency: 4. deploy-functions.yml FUNCTIONS == function folders (1)
     × deploy-functions.yml FUNCTIONS matches existing supabase/functions folders 7ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/consistency.test.ts > R1 consistency: 4. deploy-functions.yml FUNCTIONS == function folders > deploy-functions.yml FUNCTIONS matches existing supabase/functions folders
AssertionError: expected [ 'auth-nonce', 'auth-verify', …(7) ] to deeply equal [ 'auth-nonce', 'auth-verify', …(11) ]

- Expected
+ Received

@@ -6,10 +6,6 @@
    "game-state",
    "idle-claim",
    "relic-forge",
    "relic-mint-report",
    "upgrade",
-   "v2-choose-class",
-   "v2-claim",
-   "v2-equip",
-   "v2-state",
  ]

 ❯ src/consistency.test.ts:295:26
    293|       .sort();
    294|
    295|     expect(ymlFunctions).toEqual(folderFunctions);
       |                          ^
    296|     expect(ymlFunctions.length).toBeGreaterThan(0);
    297|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed | 15 passed (16)
      Tests  1 failed | 354 passed (355)
   Start at  03:25:35
   Duration  40.47s (tests 87%, import 12%, transform 1%)

    Isolate  16 workers spawned · ~159ms startup each (spawn + environment, per file)
             at least ~2.38s faster with isolate: false — reuses workers across files instead of one per file

/workspace/taskbar-hero/supabase/tests:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @taskbar-hero/supabase-tests@0.0.0 test: `vitest run -- v2/functions-state`
Exit status 1

Exit status: 1
```

### pnpm --filter @taskbar-hero/supabase-tests exec tsc -p /tmp/v9-tsconfig.json (final)

```text
(no output)
Exit status: 0
```

### pnpm --filter @taskbar-hero/supabase-tests exec vitest run v2/functions-state.test.ts

```text

 RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  03:25:51
   Duration  11.71s (tests 62%, import 20%, transform 17%)


Exit status: 0
```

### pnpm --filter @taskbar-hero/supabase-tests exec vitest run v2/functions-state.test.ts --disableConsoleIntercept

```text

 RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests

V9 eight-hour claim: 56.53 ms

 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  03:26:53
   Duration  6.31s (tests 66%, import 23%, transform 11%)


Exit status: 0
```

### pnpm typecheck

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

Exit status: 0
```

### pnpm lint

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

Exit status: 0
```

### pnpm test

```text

> taskbar-hero@0.0.0 test /workspace/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/chain test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/chain
packages/auth test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/auth
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  03:26:29
packages/chain test:    Duration  249ms (import 54%, transform 19%, worker 14%, tests 13%)
packages/chain test: Done
packages/game-rules test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  03:26:29
packages/auth test:    Duration  568ms (import 63%, tests 29%, transform 7%, worker 1%)
packages/auth test: Done
supabase/tests test$ vitest run
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
supabase/tests test:  ❯ src/consistency.test.ts (14 tests | 1 failed) 612ms
supabase/tests test:    ❯ R1 consistency: 4. deploy-functions.yml FUNCTIONS == function folders (1)
supabase/tests test:      × deploy-functions.yml FUNCTIONS matches existing supabase/functions folders 6ms
packages/game-rules test:  Test Files  16 passed | 1 skipped (17)
packages/game-rules test:       Tests  285 passed | 2 expected fail | 1 skipped (288)
packages/game-rules test:    Start at  03:26:29
packages/game-rules test:    Duration  19.37s (tests 93%, import 5%, transform 2%)
packages/game-rules test:     Isolate  17 workers spawned · ~127ms startup each (spawn + environment, per file)
packages/game-rules test:              at least ~2.03s faster with isolate: false — reuses workers across files instead of one per file
packages/game-rules test: Done
supabase/tests test: ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
supabase/tests test:  FAIL  src/consistency.test.ts > R1 consistency: 4. deploy-functions.yml FUNCTIONS == function folders > deploy-functions.yml FUNCTIONS matches existing supabase/functions folders
supabase/tests test: AssertionError: expected [ 'auth-nonce', 'auth-verify', …(7) ] to deeply equal [ 'auth-nonce', 'auth-verify', …(11) ]
supabase/tests test: - Expected
supabase/tests test: + Received
supabase/tests test: @@ -6,10 +6,6 @@
supabase/tests test:     "game-state",
supabase/tests test:     "idle-claim",
supabase/tests test:     "relic-forge",
supabase/tests test:     "relic-mint-report",
supabase/tests test:     "upgrade",
supabase/tests test: -   "v2-choose-class",
supabase/tests test: -   "v2-claim",
supabase/tests test: -   "v2-equip",
supabase/tests test: -   "v2-state",
supabase/tests test:   ]
supabase/tests test:  ❯ src/consistency.test.ts:295:26
supabase/tests test:     293|       .sort();
supabase/tests test:     294|
supabase/tests test:     295|     expect(ymlFunctions).toEqual(folderFunctions);
supabase/tests test:        |                          ^
supabase/tests test:     296|     expect(ymlFunctions.length).toBeGreaterThan(0);
supabase/tests test:     297|   });
supabase/tests test: ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
supabase/tests test:  Test Files  1 failed | 15 passed (16)
supabase/tests test:       Tests  1 failed | 354 passed (355)
supabase/tests test:    Start at  03:26:30
supabase/tests test:    Duration  33.07s (tests 88%, import 11%)
supabase/tests test:     Isolate  16 workers spawned · ~120ms startup each (spawn + environment, per file)
supabase/tests test:              at least ~1.81s faster with isolate: false — reuses workers across files instead of one per file
supabase/tests test: Failed
/workspace/taskbar-hero/supabase/tests:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @taskbar-hero/supabase-tests@0.0.0 test: `vitest run`
Exit status 1
 ELIFECYCLE  Test failed. See above for more details.

Exit status: 1
```

### pnpm build

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
apps/web build: ✓ 1722 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-Rjyucpee.js               126.75 kB │ gzip:  36.88 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 744ms
apps/web build: Done

Exit status: 0
```

### Post-commit generated-map and author checks

```text
$ pnpm gen:deno && git status --short supabase/functions

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 13 Edge Function import maps

$ git diff --exit-code -- supabase/functions
(no output; exit 0)

$ git diff --exit-code -- pnpm-lock.yaml pnpm-workspace.yaml
(no output; exit 0)

$ git log --format='%an <%ae>' origin/main..HEAD
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>

$ command -v deno
(not installed; exit 1)
```

The final typecheck uses `/tmp/v9-tsconfig.json`, extending the existing tests tsconfig with only the absolute path to `supabase/tests/v2/functions-state.test.ts` in `include`, and the tests package `node_modules/@types` as `typeRoots`. Repository config is untouched.

## Outstanding / unsure

The workflow allowlist is the only observed remaining failure. Deno server wiring could not be checked with Deno because it is unavailable; it is not included in the Node tests, matching the existing v1 architecture. No remote database or deployment was exercised. No push was attempted because all checks must pass before pushing.
