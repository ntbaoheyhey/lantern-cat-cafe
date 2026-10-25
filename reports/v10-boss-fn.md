STATUS: BLOCKED

# V10 boss function (C12) report

Branch: `ai/codex-v10-boss-fn`

Base: latest fetched `origin/main`, `a42765ccd523fc4ceb9632d54b053778be798527`.

The new `v2-boss-fight` handler validates chapter, loads the existing snapshot, applies the shared rule precheck, derives the HMAC boss seed and equipped stats, simulates once, and rolls both chests with separate derived seeds. A single existing `v2_boss_fight` compare-and-set SQL call chooses the chest under the lock and commits the fight, key spend and chest together. Response loot contains actual SQL additions plus overflow salvage, actual inserted item UUIDs and SQL auto-salvage summaries. A loss omits chest and keeps the key. Stale fights are never retried. Costs, cooldown, limits, caps and boss round come from config/content; chest stack entries, including future catKey entries, pass through unchanged.

No deployment, migration, PR or GitHub Actions run was requested or performed. Only the allowed files changed; the FUNCTIONS append is the only workflow edit. CI is workflow_dispatch-only and the deployment push trigger is main-only, so pushing this feature branch does not trigger Actions. No dependency or lockfile changes.

## Validation blocker — stopped under the user’s allowlist rule

The implementation is committed locally. The full web suite failed in `apps/web/src/map/ChapterMap.test.tsx:26`, test `ChapterMap Component > renders five chapters` (5072 ms). This file is outside the allowed list and remains unchanged. The test’s first value assertion is line 30: `expect(buttons).toHaveLength(5)`; lines 33–44 check the five chapter and boss names. Final runner diagnostics are reproduced in the full validation transcript below.

Required follow-up: investigate the ChapterMap render/accessibility-query runtime and make the existing test finish within its timeout. The observed failure alone does not establish which implementation change is needed; changing an assertion’s expected value is not justified. Any change to that test, ChapterMap implementation or web test configuration is outside this card’s allowlist. No outside fix, retry, skip, timeout change or assertion weakening was attempted.

The required full test command failed, so its chained build did not run. The follow-up self-check explicitly requires pushing the task branch and report even when blocked; this report is being published under that instruction with BLOCKED status. No PR was opened. Implementation work stopped after recording the outside failure; only this required report was finalized.

## Self-check acceptance audit

Re-read the uploaded card’s goal, gate, allowlist, forbidden files, behavior, tests and acceptance commands. Read `scripts/verify-pr.sh` directly. This is a code diff, so its complete check set includes install, import-map drift, typecheck, lint, unit tests, build and Playwright e2e; no contract/chain ABI checks are selected by these changed paths. The real commands and outputs already recorded below remain the validation evidence: no implementation changes have occurred since them. Per the explicit STOP rule for an outside-allowlist blocker, the failed full suite was not retried, and the remaining build/e2e checks were not run. This is not a docs-only exemption. No test was skipped or weakened by this card.

| Acceptance item | Result | Evidence |
| --- | --- | --- |
| Gate 1: C7 forge folder and routesForgeV2 present | PASS | Initial gate output: count 1 and forge.ts:96 |
| Gate 2: no existing V10 folder or remote branch before starting | PASS | Both initial gate commands printed nothing; this is historical gate evidence before creating this task branch |
| Gate 3: SQL boss function exists | PASS | Migration:434 in initial gate output |
| Gate 4: v2BossSeed exists | PASS | seeds.ts:11 in initial gate output |
| New branch from latest fetched main | PASS | Base a42765ccd523fc4ceb9632d54b053778be798527; final fetch unchanged |
| Behavior 1: validate integer chapter range | PASS | Invalid chapter integration test; includes current out-of-range 6 |
| Behavior 2: snapshot/day/state/refusal pattern and after-state | PASS | boss.ts and explicit handler/test TypeScript check; missing-player test |
| Behavior 3: no_class → cooldown → not_reached → no_key precheck without fight writes | PASS | Precheck/order tests over migrated SQL; unchanged fight counters/audit rows |
| Behavior 4: HMAC boss seed, equipped stats and simulation | PASS | Exact seeded response timeline and determinism tests |
| Behavior 5: both independently derived chests, claim-style items, unchanged stack deltas | PASS | First-clear and rematch chest comparisons; boss.ts review |
| Behavior 6: one bossFight CAS call with content/config arguments | PASS | Parallel test and SQL-call argument assertions; server/PGlite RPC wiring review |
| Behavior 7: SQL refusal mapping and no stale retry | PASS | SQL-refusal test, unknown error → server_error, cooldown extras, exactly one call |
| Behavior 8: win-only actual SQL chest, keySpent and fresh state | PASS | First-clear, loss, rematch and bag-overflow integration tests |
| Test 1: parallel first clear gives exactly one win and one stale | PASS | Barrier holds both initial snapshots; one clear/audit win and chapter advance |
| Test 2: weak loss retains key and sets configured cooldown | PASS | Level-1 starter fixture; independent losing simulation and ±5 s assertion |
| Test 3: second request returns HTTP 409 and exact stored cooldown | PASS | Handler test immediately after weak loss |
| Test 4: not_reached without writes | PASS | Both earlier round and insufficient-kills fixtures |
| Test 5: no_key without writes | PASS | Reached-boss zero-key fixture |
| Test 6: invalid chapter cases | PASS | 0, chapter count + 1, string, fraction and missing |
| Test 7: exact deterministic timeline, end event, nonnegative HP and flags | PASS | Timeline integration test |
| Test 8: same-state different-player seeds differ; same player/fights repeats | PASS | Determinism integration test |
| Test 9: rematch seed/chest, unchanged progress and wins 2 | PASS | Persisted SQL chest compared to derived rematch roll |
| Test 10: full bag auto-salvages all chest items | PASS | manyItems fixture at configured bag limit; credited loot verified |
| Test 11: GET 405 and no Bearer 401; malformed bodies | PASS | Handler integration test |
| Test 12: per-fight timing logged without timing assertion | PASS | Complete verbose run below includes console timing lines |
| D2 optional fields + doc comments in both allowed interfaces | PASS | Exact added type lines below |
| D2 view flags, no undefined, one impact test, one mock test, one API-doc sentence | PASS | View 9/9 and API 315/315; narrow diffs reviewed |
| Route-key assertion and FUNCTIONS/folder consistency | PASS | Supabase 385/385 includes functions-state, forge and consistency |
| pnpm install --frozen-lockfile | PASS | CI=true noninteractive retry, pinned pnpm 10.28.0; full output below |
| pnpm gen:deno and committed-function drift check | PASS | 18 maps generated; git diff --exit-code printed nothing and exited 0 |
| pnpm typecheck | PASS | Full workspace output below |
| pnpm lint | PASS | Full workspace output below |
| pnpm test | FAIL | Full suite: ChapterMap.test.tsx:26 test timeout; 965 web tests passed, 1 failed |
| pnpm build | NOT VERIFIED | Chained command stopped at pnpm test; STOP rule applies |
| cd apps/web && pnpm test:e2e | NOT VERIFIED | Required by web/packages diff, but not run after outside-allowlist STOP; browser fallback not exercised |
| Card scoped Supabase command | PASS | 18 files, 385 tests passed |
| Card scoped view command | PASS | 1 file, 9 tests passed |
| Card scoped API command | PASS | 7 files, 315 tests passed |
| Conditional deno check | NOT VERIFIED | Deno is not installed |
| Extra explicit new-test/handler TypeScript check | PASS | Initial in-allowlist test typing error fixed; corrected check exited 0 |
| Allowlist / narrow file allowances | PASS | Final fetched-main path audit below; only required interface/RPC/routes/test edits and the two explicit allowances |
| Forbidden files, SQL, v1, content/combat/sim and dependency manifests | PASS | Unchanged; forbidden diff printed nothing; no dependencies added |
| No test weakening, skips added, timeout changes or golden edits | PASS | Diff review; existing game-rules skips/expected failures preserved |
| Required Git identity / 1–3 commits | PASS | Author audit below; implementation and report commits use required identity; publication receipt may be a third report-only commit |
| No PR, Actions, merge, deployment or migration | PASS | None performed; feature branch has no push-triggered workflow |
| Report includes gate output, real logs, clock/seed/refusal notes, D2 and C5d merge note | PASS | This report |

## NOT verified and what is needed to continue

- Full suite is failing, so acceptance as DONE is not established.
- `pnpm build` did not execute in the chained card command after `pnpm test` failed.
- `cd apps/web && pnpm test:e2e` was not run. The self-check makes it required for this diff; it remains NOT VERIFIED under the outside-allowlist STOP rule. `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` was not needed or tested.
- `deno check supabase/functions/v2-boss-fight/index.ts` was not run because Deno is absent.
- The exact full-suite failure is `pnpm typecheck && pnpm lint && pnpm test && pnpm build` (executed with corepack pnpm), within `pnpm test`: `ChapterMap Component > renders five chapters`, `apps/web/src/map/ChapterMap.test.tsx:26:3`, `Error: Test timed out in 5000ms.` The first value assertion is `expect(buttons).toHaveLength(5)` at line 30; the runner reported a timeout rather than an incorrect expected value.
- To continue, investigate render/query performance in `apps/web/src/map/ChapterMap.tsx` and the reproduction in `apps/web/src/map/ChapterMap.test.tsx`. Both files are outside this card’s allowlist and would need explicit allowance if a fix is required there. The timeout alone does not establish a precise code fix. No assertion-value, timeout, snapshot or configuration change is justified from this evidence. After an authorized fix, run the complete check set including build and Playwright e2e. No outside fix round was attempted.

## Final source and author audit

`git fetch origin +main:refs/remotes/origin/main` exited 0 with no output; main remains `a42765ccd523fc4ceb9632d54b053778be798527`.

### `git fetch origin +main:refs/remotes/origin/main && git diff --name-only origin/main...HEAD`

```text
.github/workflows/deploy-functions.yml
apps/web/src/api/GameApiV2.ts
apps/web/src/api/MockGameApiV2.test.ts
docs/api-v2.md
packages/game-rules/src/v2/view/timeline.ts
packages/game-rules/src/v2/view/types.ts
packages/game-rules/src/v2/view/view.test.ts
reports/v10-boss-fn.md
supabase/functions/_shared/v2/boss.ts
supabase/functions/_shared/v2/game.ts
supabase/functions/_shared/v2/server.ts
supabase/functions/v2-boss-fight/deno.json
supabase/functions/v2-boss-fight/index.ts
supabase/tests/v2/functions-boss.test.ts
supabase/tests/v2/functions-state.test.ts
supabase/tests/v2/v2-store.ts
```

Every line is in the card allowlist. No reverts were needed. The forbidden ChapterMap test is unchanged.

### `git log --format='%an <%ae>' origin/main..HEAD`

```text
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

All authors match. This audit precedes the report refresh; the refreshed report commit keeps that same author.

### `git diff --stat origin/main...HEAD`

Captured at the pre-refresh report commit `71344e6`; the self-check refresh changes only this same report file.

```text
 .github/workflows/deploy-functions.yml       |   2 +-
 apps/web/src/api/GameApiV2.ts                |   4 +
 apps/web/src/api/MockGameApiV2.test.ts       |  12 +
 docs/api-v2.md                               |   1 +
 packages/game-rules/src/v2/view/timeline.ts  |   3 +-
 packages/game-rules/src/v2/view/types.ts     |   9 +-
 packages/game-rules/src/v2/view/view.test.ts |  11 +-
 reports/v10-boss-fn.md                       | 559 +++++++++++++++++++++++++++
 supabase/functions/_shared/v2/boss.ts        |  61 +++
 supabase/functions/_shared/v2/game.ts        |   8 +-
 supabase/functions/_shared/v2/server.ts      |   3 +
 supabase/functions/v2-boss-fight/deno.json   |  76 ++++
 supabase/functions/v2-boss-fight/index.ts    |   4 +
 supabase/tests/v2/functions-boss.test.ts     | 266 +++++++++++++
 supabase/tests/v2/functions-state.test.ts    |   2 +-
 supabase/tests/v2/v2-store.ts                |   2 +
 16 files changed, 1016 insertions(+), 7 deletions(-)
```

## Gate (before branch creation)

### `git fetch origin +main:refs/remotes/origin/main`

```text
From https://github.com/ntbaoheyhey/taskbar-hero
 * [new branch]      main       -> origin/main
```

### `git ls-tree --name-only origin/main supabase/functions/ | grep -c '^supabase/functions/v2-craft$'`

```text
1
```

### `git show origin/main:supabase/functions/_shared/v2/forge.ts | grep -n "export function routesForgeV2"`

```text
96:export function routesForgeV2(deps: ForgeDepsV2) {
```

### `git ls-tree origin/main supabase/functions/v2-boss-fight`

```text

```

### `git ls-remote origin 'refs/heads/ai/*v10*'`

```text

```

### `git show origin/main:supabase/migrations/20261101000000_v2_cat_rpg.sql | grep -n "create function public.v2_boss_fight"`

```text
434:create function public.v2_boss_fight(
```

### `git show origin/main:supabase/functions/_shared/v2/seeds.ts | grep -n "v2BossSeed"`

```text
11:export const v2BossSeed = (secret: string, playerId: string, fightNo: number): Promise<number> =>
```

All four gates passed. Empty output is intentional for the two nobody-started-V10 checks. Git email and name were read first, then set locally to the required identity because the inherited identity differed.

### `git config user.email && git config user.name`

```text
108352255+ntbaoheyhey@users.noreply.github.com
ntbaoheyhey
```

## Files changed

- `.github/workflows/deploy-functions.yml`
- `apps/web/src/api/GameApiV2.ts`
- `apps/web/src/api/MockGameApiV2.test.ts`
- `docs/api-v2.md`
- `packages/game-rules/src/v2/view/timeline.ts`
- `packages/game-rules/src/v2/view/types.ts`
- `packages/game-rules/src/v2/view/view.test.ts`
- `reports/v10-boss-fn.md`
- `supabase/functions/_shared/v2/boss.ts`
- `supabase/functions/_shared/v2/game.ts`
- `supabase/functions/_shared/v2/server.ts`
- `supabase/functions/v2-boss-fight/deno.json`
- `supabase/functions/v2-boss-fight/index.ts`
- `supabase/tests/v2/functions-boss.test.ts`
- `supabase/tests/v2/functions-state.test.ts`
- `supabase/tests/v2/v2-store.ts`

## Refusal order and coverage

Body validation precedes snapshot loading; missing player is not_found. The precheck order is no_class → cooldown → not_reached → no_key, through the existing applyBossResult reach/key/cooldown rules. SQL rechecks under the lock in its existing order stale → cooldown → not_reached → no_key (after player existence). Unknown SQL refusals become server_error. No retry occurs on stale.

All tests below are in `supabase/tests/v2/functions-boss.test.ts`:

| Refusal / behavior | Test |
| --- | --- |
| invalid_request before loading | rejects invalid chapters before loading state; covers 0, chapter count + 1 (currently 6), string, fraction, missing |
| not_found and no_class priority | refuses missing players and no_class before cooldown, reach and keys |
| cooldown before reach/key | checks cooldown before not_reached and no_key without invoking the write |
| HTTP 409 cooldown and exact stored timestamp | keeps the key on a weak-cat loss and returns the stored cooldown through HTTP |
| not_reached before no_key | refuses unreached rounds and insufficient kills before missing keys, without writing |
| no_key, no writes | refuses no_key at a reached boss without writing |
| stale CAS and exactly one committed first chest | commits exactly one parallel first clear and refuses the other as stale |
| SQL refusals and no stale retry | maps SQL refusals, includes SQL cooldown extras and never retries stale |
| seeded replay, HP and flags | returns the exact seeded timeline, nonnegative HP and D2 boss flags |
| seed isolation and determinism | derives distinct player seeds and repeats the same player/fights timeline |
| rematch roll / unchanged progress / two wins | uses the rematch chest under the SQL lock and preserves progress |
| full bag and actual SQL credits | auto-salvages every chest item at the configured bag limit and returns actual credits |
| malformed request, GET 405 and missing Bearer 401 | enforces GET/auth and validates malformed HTTP bodies |

The parallel test explicitly waits until both initial snapshots have loaded before releasing either caller. Both therefore simulate with the same fights/revision values. The winner fixture uses `V2_CONFIG.cat.maxLevel` (currently 60) and the warrior registry starter sword, equipped by chooseClassV2. No extra gear or seed search is needed: the seed is v2BossSeed with the same fake test-seed-secret fixture as C6/C7, the player's id and fightsBefore=0; fightsBefore=0 is checked, and the independently simulated seed must win before the race begins. The test verifies the first chest roll, exactly one clear/won audit row, key accounting, one fight increment, and chapter 2 round 1. Weak fixtures use level 1 and the starter weapon; their fightsBefore=0 simulation is independently checked to lose.

`readyForBoss` leaves kills unset; this test file fills kills from `CHAPTERS[0].killsPerRound` and also derives the boss round from content. No helper or migration edits.

Clock: SQL uses DB now() for cooldown, while the function uses deps.now. The tests inject a clock set to real Date.now() before each test, compare the returned cooldown to the stored SQL value, allow ±5 seconds against wall time + configured cooldown, and check the exact stored value through handlerV2. No timers or timeouts were weakened.

## D2 timeline contract

Exact additions in `apps/web/src/api/GameApiV2.ts:154` and `packages/game-rules/src/v2/view/types.ts:11`:

```ts
  /** boss_windup and boss_impact: the telegraphed big attack. */
  big?: boolean;
  /** boss_impact: the cat dodged, taking zero damage. */
  dodged?: boolean;
```

The view copies big for boss_windup/boss_impact and dodged for boss_impact directly from the discriminated combat log, preserving both false and true without adding undefined fields. Combat code is unchanged. The allowed existing windup expectation changed, one view impact test covers true/false flags and dodge damage 0, and one mock API test verifies the flags pass through fightBoss.

Actual timeline excerpt from the verbose SQL test:

```json
[{"t":1100,"type":"boss_windup","big":false},{"t":1500,"type":"boss_impact","damage":26,"catHp":74,"big":false,"dodged":false}]
```

The view test also checks `{ t: 1, type: 'boss_impact', big: true, dodged: true, damage: 0, catHp: 100 }`.

## Validation transcripts

Commands ran from the repository root using `corepack pnpm`, which selected the repository's pinned pnpm 10.28.0. Full stdout/stderr follows, including the initial noninteractive-install failure and its successful CI=true retry. No dependency scripts were approved or dependencies added. The user-provided Supabase `test -- ...` command ran all 18 Supabase test files with this pnpm/Vitest combination; a separate verbose boss-only run supplies the timing lines.

### `corepack pnpm --version && corepack pnpm install --frozen-lockfile`

```text
10.28.0
Scope: all 7 workspace projects
 ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY  Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true".
```

### `CI=true corepack pnpm install --frozen-lockfile`

```text
Scope: all 7 workspace projects
Recreating /workspace/taskbar-hero/node_modules
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +506
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 506, reused 0, downloaded 0, added 0
Progress: resolved 506, reused 0, downloaded 6, added 5
Progress: resolved 506, reused 0, downloaded 13, added 6
Progress: resolved 506, reused 0, downloaded 21, added 6
Progress: resolved 506, reused 0, downloaded 22, added 6
Progress: resolved 506, reused 0, downloaded 31, added 10
Progress: resolved 506, reused 0, downloaded 55, added 63
Progress: resolved 506, reused 0, downloaded 81, added 89
Progress: resolved 506, reused 0, downloaded 107, added 115
Progress: resolved 506, reused 0, downloaded 124, added 127
Progress: resolved 506, reused 0, downloaded 152, added 160
Progress: resolved 506, reused 0, downloaded 173, added 181
Progress: resolved 506, reused 0, downloaded 176, added 181
Progress: resolved 506, reused 0, downloaded 214, added 222
Progress: resolved 506, reused 0, downloaded 236, added 245
Progress: resolved 506, reused 0, downloaded 266, added 275
Progress: resolved 506, reused 0, downloaded 289, added 298
Progress: resolved 506, reused 0, downloaded 305, added 308
Progress: resolved 506, reused 0, downloaded 340, added 349
Progress: resolved 506, reused 0, downloaded 368, added 377
Progress: resolved 506, reused 0, downloaded 386, added 395
Progress: resolved 506, reused 0, downloaded 403, added 412
Progress: resolved 506, reused 0, downloaded 418, added 425
Progress: resolved 506, reused 0, downloaded 449, added 450
Progress: resolved 506, reused 0, downloaded 468, added 476
Progress: resolved 506, reused 0, downloaded 472, added 477
Progress: resolved 506, reused 0, downloaded 492, added 485
Progress: resolved 506, reused 0, downloaded 497, added 506, done

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 36.9s using pnpm v10.28.0
```

### `corepack pnpm gen:deno && git status --short supabase/functions`

```text

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
 M supabase/functions/_shared/v2/game.ts
 M supabase/functions/_shared/v2/server.ts
?? supabase/functions/_shared/v2/boss.ts
?? supabase/functions/v2-boss-fight/
```

### `corepack pnpm gen:deno && git diff --exit-code -- supabase/functions (after committing generated deno.json)`

```text

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

The latter exited 0; the git diff portion printed nothing. Existing import maps did not change.

### `corepack pnpm --filter @taskbar-hero/supabase-tests test -- v2/functions-boss v2/functions-state v2/functions-forge src/consistency`

```text

> @taskbar-hero/supabase-tests@0.0.0 test /workspace/taskbar-hero/supabase/tests
> vitest run -- v2/functions-boss v2/functions-state v2/functions-forge src/consistency


 RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests


 Test Files  18 passed (18)
      Tests  385 passed (385)
   Start at  06:34:51
   Duration  178.99s (tests 92%, import 7%, transform 1%)
```

### `corepack pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/view`

```text

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules


 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  06:34:49
   Duration  1.38s (transform 59%, tests 28%, import 13%, worker 1%)
```

### `corepack pnpm --filter @taskbar-hero/web exec vitest run src/api`

```text

 RUN  v5.0.5 /workspace/taskbar-hero/apps/web


 Test Files  7 passed (7)
      Tests  315 passed (315)
   Start at  06:34:51
   Duration  29.60s (environment 79%, tests 14%, transform 3%, import 3%)

Environment  jsdom was created 7 times · 20.29s total, 79% of tracked time
             create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
             learn more: https://vitest.dev/guide/improving-performance#test-environments
```

### `git diff --stat origin/main -- supabase/migrations packages/game-rules/src/v2/config.ts packages/game-rules/src/v2/content packages/game-rules/src/v2/combat packages/game-rules/src/v2/view/chest.ts packages/game-rules/src/v2/view/loot.ts pnpm-lock.yaml`

```text

```

### `git diff origin/main -- .github/workflows/deploy-functions.yml`

```text
diff --git a/.github/workflows/deploy-functions.yml b/.github/workflows/deploy-functions.yml
index ba436a7..3b35f41 100644
--- a/.github/workflows/deploy-functions.yml
+++ b/.github/workflows/deploy-functions.yml
@@ -23,7 +23,7 @@ permissions:
 
 env:
   PROJECT_REF: qoalewtxflagoprrxrgh
-  FUNCTIONS: auth-nonce auth-verify game-state idle-claim equip boss-fight upgrade relic-forge relic-mint-report v2-choose-class v2-claim v2-equip v2-state v2-craft v2-salvage v2-lock v2-relic-forge
+  FUNCTIONS: auth-nonce auth-verify game-state idle-claim equip boss-fight upgrade relic-forge relic-mint-report v2-choose-class v2-claim v2-equip v2-state v2-craft v2-salvage v2-lock v2-relic-forge v2-boss-fight
 
 jobs:
   deploy:
```

### `corepack pnpm typecheck (initial check)`

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
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
supabase/tests typecheck: Done
apps/web typecheck: Done
```

### `corepack pnpm --filter @taskbar-hero/supabase-tests exec vitest run v2/functions-boss --reporter=verbose`

```text

 RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests

stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > commits exactly one parallel first clear and refuses the other as stale
V10 PGlite fight 00000000-0000-4000-8000-000013631489: 286.35 ms

stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > commits exactly one parallel first clear and refuses the other as stale
V10 PGlite fight 00000000-0000-4000-8000-000013631489: 318.52 ms

 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > commits exactly one parallel first clear and refuses the other as stale 1878ms
stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > keeps the key on a weak-cat loss and returns the stored cooldown through HTTP
V10 PGlite fight 00000000-0000-4000-8000-000013631490: 104.82 ms

 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > keeps the key on a weak-cat loss and returns the stored cooldown through HTTP 602ms
stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > refuses unreached rounds and insufficient kills before missing keys, without writing
V10 PGlite fight 00000000-0000-4000-8000-000013631491: 51.84 ms

stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > refuses unreached rounds and insufficient kills before missing keys, without writing
V10 PGlite fight 00000000-0000-4000-8000-000013631492: 17.72 ms

 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > refuses unreached rounds and insufficient kills before missing keys, without writing 495ms
stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > refuses no_key at a reached boss without writing
V10 PGlite fight 00000000-0000-4000-8000-000013631493: 16.84 ms

 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > refuses no_key at a reached boss without writing 303ms
stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > refuses missing players and no_class before cooldown, reach and keys
V10 PGlite fight 00000000-0000-4000-8000-0000000000ff: 12.08 ms

stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > refuses missing players and no_class before cooldown, reach and keys
V10 PGlite fight 00000000-0000-4000-8000-000013631494: 52.19 ms

 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > refuses missing players and no_class before cooldown, reach and keys 150ms
stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > checks cooldown before not_reached and no_key without invoking the write
V10 PGlite fight 00000000-0000-4000-8000-000013631495: 5.42 ms

 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > checks cooldown before not_reached and no_key without invoking the write 176ms
 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > rejects invalid chapters before loading state 3ms
stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > returns the exact seeded timeline, nonnegative HP and D2 boss flags
V10 PGlite fight 00000000-0000-4000-8000-000013631496: 95.64 ms

stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > returns the exact seeded timeline, nonnegative HP and D2 boss flags
V10 D2 sample: [{"t":1100,"type":"boss_windup","big":false},{"t":1500,"type":"boss_impact","damage":26,"catHp":74,"big":false,"dodged":false}]

 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > returns the exact seeded timeline, nonnegative HP and D2 boss flags 193ms
 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > derives distinct player seeds and repeats the same player/fights timeline 188ms
stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > uses the rematch chest under the SQL lock and preserves progress
V10 PGlite fight 00000000-0000-4000-8000-000013631499: 44.95 ms

stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > uses the rematch chest under the SQL lock and preserves progress
V10 PGlite fight 00000000-0000-4000-8000-000013631499: 58.02 ms

 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > uses the rematch chest under the SQL lock and preserves progress 218ms
stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > auto-salvages every chest item at the configured bag limit and returns actual credits
V10 PGlite fight 00000000-0000-4000-8000-000013631500: 145.29 ms

 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > auto-salvages every chest item at the configured bag limit and returns actual credits 475ms
stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > maps SQL refusals, includes SQL cooldown extras and never retries stale
V10 PGlite fight 00000000-0000-4000-8000-000013631501: 8.38 ms

stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > maps SQL refusals, includes SQL cooldown extras and never retries stale
V10 PGlite fight 00000000-0000-4000-8000-000013631501: 7.77 ms

stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > maps SQL refusals, includes SQL cooldown extras and never retries stale
V10 PGlite fight 00000000-0000-4000-8000-000013631501: 7.21 ms

stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > maps SQL refusals, includes SQL cooldown extras and never retries stale
V10 PGlite fight 00000000-0000-4000-8000-000013631501: 7.50 ms

stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > maps SQL refusals, includes SQL cooldown extras and never retries stale
V10 PGlite fight 00000000-0000-4000-8000-000013631501: 127.97 ms

stdout | v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > maps SQL refusals, includes SQL cooldown extras and never retries stale
V10 PGlite fight 00000000-0000-4000-8000-000013631501: 5.13 ms

 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > maps SQL refusals, includes SQL cooldown extras and never retries stale 212ms
 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > enforces GET/auth and validates malformed HTTP bodies 43ms

 Test Files  1 passed (1)
      Tests  13 passed (13)
   Start at  06:38:25
   Duration  45.23s (tests 76%, import 15%, transform 9%)
```

### Explicit boss/test TypeScript check

The repository's standard Supabase tsconfig includes src but not v2 tests. An extra temporary config outside the repo extends that config and includes only the new boss test, which transitively checks the boss handler, shared routes and store. Its contents:

```json
{
  "extends": "/workspace/taskbar-hero/supabase/tests/tsconfig.json",
  "compilerOptions": {
    "typeRoots": ["/workspace/taskbar-hero/supabase/tests/node_modules/@types"]
  },
  "include": ["/workspace/taskbar-hero/supabase/tests/v2/functions-boss.test.ts"]
}
```

The first run found a string-key indexing error in the new test's loot-credit assertion. It was corrected with the same typed StateStackIdV2 key used in the handler; no runtime behavior or assertion was weakened.

### `corepack pnpm --filter @taskbar-hero/supabase-tests exec tsc --project /tmp/v10-tsconfig.json (initial)`

```text
v2/functions-boss.test.ts(228,61): error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'Partial<Record<StackId, number>>'.
  No index signature with a parameter of type 'string' was found on type 'Partial<Record<StackId, number>>'.
v2/functions-boss.test.ts(228,77): error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'Partial<Record<StackId, number>>'.
  No index signature with a parameter of type 'string' was found on type 'Partial<Record<StackId, number>>'.
undefined
/workspace/taskbar-hero/supabase/tests:
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 2: tsc --project /tmp/v10-tsconfig.json
```

### `corepack pnpm --filter @taskbar-hero/supabase-tests exec tsc --project /tmp/v10-tsconfig.json (after fix)`

```text

```

The corrected check exited 0 with no output.

### `corepack pnpm typecheck && corepack pnpm lint && corepack pnpm test && corepack pnpm build`

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
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
supabase/tests typecheck: Done
apps/web typecheck: Done

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
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
supabase/tests lint: Done
apps/web lint: Done

> taskbar-hero@0.0.0 test /workspace/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/auth test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/auth
packages/chain test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/chain
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  06:40:03
packages/chain test:    Duration  1.04s (import 43%, transform 34%, tests 12%, worker 10%)
packages/chain test:     Isolate  2 workers spawned · ~412ms startup each (spawn + environment, per file)
packages/chain test:              at least ~412ms faster with isolate: false — reuses workers across files instead of one per file
packages/chain test: Done
packages/game-rules test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  06:40:03
packages/auth test:    Duration  2.04s (import 72%, tests 20%, transform 7%, worker 1%)
packages/auth test: Done
supabase/tests test$ vitest run
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
supabase/tests test:  Test Files  18 passed (18)
supabase/tests test:       Tests  385 passed (385)
supabase/tests test:    Start at  06:40:06
supabase/tests test:    Duration  127.59s (tests 90%, import 9%, transform 1%)
supabase/tests test: Done
packages/game-rules test:  Test Files  18 passed | 2 skipped (20)
packages/game-rules test:       Tests  298 passed | 2 expected fail | 4 skipped (304)
packages/game-rules test:    Start at  06:40:05
packages/game-rules test:    Duration  212.86s (tests 98%, import 1%, transform 1%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  06:43:39
packages/api-contract test:    Duration  698ms (transform 63%, import 31%, tests 4%, worker 3%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /workspace/taskbar-hero/apps/web
apps/web test:  ❯ src/map/ChapterMap.test.tsx (10 tests | 1 failed) 15389ms
apps/web test:    ❯ ChapterMap Component (10)
apps/web test:      × renders five chapters 5072ms
apps/web test: ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
apps/web test:  FAIL  src/map/ChapterMap.test.tsx > ChapterMap Component > renders five chapters
apps/web test: Error: Test timed out in 5000ms.
apps/web test: If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
apps/web test:  ❯ src/map/ChapterMap.test.tsx:26:3
apps/web test:      24|   });
apps/web test:      25|
apps/web test:      26|   it('renders five chapters', () => {
apps/web test:        |   ^
apps/web test:      27|     render(<ChapterMap currentChapter={1} clearedChapters={[]} />);
apps/web test:      28|
apps/web test: ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
apps/web test:  Test Files  1 failed | 65 passed (66)
apps/web test:       Tests  1 failed | 965 passed (966)
apps/web test:    Start at  06:43:41
apps/web test:    Duration  214.66s (environment 54%, tests 30%, import 15%, transform 1%)
apps/web test: Environment  jsdom was created 66 times · 104.68s total, 54% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Failed
/workspace/taskbar-hero/apps/web:
[ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL] @taskbar-hero/web@0.0.0 test: `vitest run`
Exit status 1
 ELIFECYCLE  Test failed. See above for more details.
```

## Notes for integration

C5d (ai/codex-v6e-levers) edits v2/view/chest.ts and adds boss.firstClearKeys; this card does not touch those files; if C5d merges first, rebase, run pnpm gen:deno and the suite again

Deno is not installed in this environment (`command -v deno` returned no path), so the conditional deno check was not run. The extra TypeScript check above validates the handler and new test; the Deno-only server RPC addition follows the existing wiring pattern. The game-rules suite retains its existing skipped/expected-failure tests; this card adds no skips or expected failures and changes no timeouts. The out-of-scope ChapterMap test failure remains unresolved, and the build is unverified because the required command stopped at pnpm test. No other unresolved implementation questions.
