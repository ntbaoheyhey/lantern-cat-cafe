STATUS: DONE

## 1. Pieces and acceptance

S2-FIX1 closes the four S2 regression gaps in the repository. The owner-approved migration is **not applied live**, and no function/web deployment, PR, merge, GitHub Actions run or live database access occurred. Branch `ai/codex-s2-fix1-integrity` starts directly from fetched `origin/main` `a0ac8df`. Existing migration files are unchanged.

| Acceptance | Result / evidence |
| --- | --- |
| A1–A2: starter loop and every class, mixed batches, identical catalog keys, repeated selection | PASS: original starter test is ordinary `it`; migrated SQL refuses any selected starter with `invalid_request` after the existing ownership/equipped/locked checks, before deletion or credit. All seven class cases in security-proposals test now use the actual migration, retain every assertion and add exact unchanged-inventory/catalog-key checks. Crafted common weapons with the same catalog key still salvage. |
| A3–A4: mock and UI parity | PASS: mock source is persisted/returned; missing source on old saves defaults to drop. SQL remains the authority. Starter checkboxes are disabled, hint “Starter gear can't be salvaged” is visible, default/select-all IDs are filtered, ordinary items still salvage. Seven mock class cases, UI unit coverage and six headless viewport/theme cases. |
| B1–B3: stale equipment snapshot, no-op equip, reversed interleavings | PASS: trigger increments revision per actual flag transition. Same-item equip and empty-slot unequip do not increment it. Class selection covers sword-off/bow-on updates as well. Stale claim returns null with zero credit; a fresh claim pays normally. Stale boss refuses with unchanged keys. Mock revision parity and silent stale-boss reload are tested. |
| B4: production locking limit | NOT VERIFIED: PGlite serializes SQL on one connection; controlled handler barriers prove stale-snapshot CAS and transaction results, not real PostgreSQL lock scheduling/deadlock freedom. |
| C1–C2: original replay regressions plus parallel same-ID requests | PASS: both former replay tests use a stable UUID and ordinary `it`. Craft returns the same item ID, boss returns the committed timeline/chest, one spend/one fight/one ledger row. Shared initial snapshots force the parallel race for both routes. |
| C3–C5: intent binding, new intentional action, player isolation | PASS: changed slot/chapter with same ID rejects before preview and changes nothing; new IDs pay for a second craft/rematch; different players can reuse an ID independently for both routes. |
| C6: failed mutation and rollback | PASS: failures leave no ledger row. After resources are topped up the same ID is a fresh action. A SQL exception forced after cost deduction rolls back both spend and ledger; later success with that ID works. No errors are cached. |
| C7: replay before preview | PASS: replay of a successful last-material craft works with no materials left and attaches a fresh state. Boss win/loss replays bypass current keys/cooldown and preserve the original timeline. A second lookup covers a miss followed by a concurrent commit before preview. |
| C8: browser transport/legacy | PASS: only fetch rejection triggers one retry, with the same ID and exact serialized body/headers. HTTP 4xx/5xx, invalid successful JSON and ordinary non-idempotent routes are not retried. Existing no-ID server tests keep legacy behavior; IDs are optional until a later card makes them required. |
| Piece 4: migration, privileges, proposal-test adjustment, rollback, docs | PASS: exactly one new migration; table RLS/default deny, all client table privileges denied, new RPCs service-only and helper trigger denied to API roles. Manual rollback restores original bodies/grants, drops only the new objects and permits reapplying the migration in a disposable clone. Rate/nonce proposal tests are retained; integrity doc blocks are no longer reapplied. |
| Shared verification / secret and scope checks | PASS: actual output below; no added test skip/expected-fail, timeout/threshold change, dependency/lockfile change, auth/contract/config-number change or credential value. Existing game-rules expected failures/skips remain; the full browser run has no skips. |

## 2. Problems found and fixed

1. **Free starter salvage:** SQL granted a replacement whenever no weapon of that type remained, and salvage ignored `items.source`. The new locked source check closes the resource loop. `v2_item_json` now emits optional source metadata; snapshots preserve it instead of hardcoding drop. Mock, item contracts and salvage selection use that source, never a catalog-ID heuristic.
2. **Equipment versus combat snapshots:** equip did not advance progress_rev. The new AFTER UPDATE OF equipped trigger advances it only on real transitions. All application inserts go through `v2_insert_items`, which omits equipped and uses its false default; starter/class equip is a subsequent UPDATE, so the trigger covers every application insertion path without an INSERT trigger. Administrative direct writes are not a supported gameplay path and must preserve the same player-lock-first discipline.
3. **Craft/boss lost-response replay:** no persistent action ID existed. New wrapper RPCs keep the original mutation signatures and privileges intact, avoiding overload resolution hazards. Under `players FOR UPDATE`, they look up the result, compare stable intent, run the original mutation and save **successful** results atomically. Craft stores the SQL-produced item; boss stores the SQL-selected chest/outcome plus the original server timeline. No ID expiration/cleanup was added: deleting history could turn a late retry into a second action. Budgeting/retention remains a future card.
4. **Retry checks before mutation:** Edge reads the owned result before cost/key/cooldown checks, and repeats that read when a concurrent commit makes preview fail. SQL repeats the lookup under the lock, so two earlier misses cannot both pay. Replays attach a new snapshot; they do not reroll or simulate another boss timeline. Body fields cannot supply player, cost, seed, outcome or timeline.
5. **Mock full-bag starter issue:** the mock previously auto-salvaged a free starter if the bag was full, another way to regenerate salvage rewards. It now mirrors SQL's grant insertion beyond the bag limit, retaining one owned starter rather than converting the grant to materials. A regression checks repeated class selection at a full bag.
6. **Stale boss toast:** generic action handling reloaded stale state but still emitted a refused event. Boss stale now reloads silently, releases busy and never emits a boss error/refusal toast. Other refusal behavior is preserved.

All four original markers were removed without deleting their assertions. Their required request-ID adaptation adds cost/timeline checks rather than asserting old broken behavior. Early runs exposed legacy expected revision values, missing source metadata in fixture equality, a table-inventory assertion, and the bootstrap's inherited service-role permission on the trigger helper. Those were corrected; final runs are green. No assertions were skipped or removed.

## 3. Tier 2 changes

- `supabase/tests/src/schema.test.ts`: include v2_action_results in the exact public-table inventory; still assert every table has RLS and no client-write policies.
- `apps/web/src/api/mockV2Fixtures.ts`: label artificial spare/bag-filler items as drop rather than starter, retaining the real initial starter. These fixtures represent salvageable loot; tests retain locked/equipped refusal coverage.
- `apps/web/src/api/mockV2Fixtures.test.ts`: exact inventory equality now includes the intentionally exposed source field (all existing assertions remain).
- `apps/web/src/game/arena/arenaFixtures.ts`: regenerate only item-source metadata in existing generated fixture payloads. A structural before/after comparison removed only source keys and proved every number, item field, outcome and timeline unchanged; content outside the generated block is byte-identical. This is not a balance/snapshot-number change.

Within Tier 1, older SQL tests now expect the deliberate revision increments: initial class selection `1 → 2` (class + starter equip); a class swap contributes `+3` rather than `+1` (class, old weapon off, new weapon on). Boss SQL/API chest item equality now includes source=chest. The existing proposal test retains starter/equipment assertions while executing only rate-limit and nonce doc SQL on top of the real migration.

## 4. Diff inventory

<!-- FIX1_DIFF_START -->
```text
$ git diff --stat origin/main...HEAD
 apps/web/e2e/ui/s2-integrity.spec.ts               |  39 +++
 apps/web/src/api/GameApiV2.ts                      |  20 +-
 apps/web/src/api/MockGameApiV2.test.ts             |  69 +++++
 apps/web/src/api/MockGameApiV2.ts                  |  57 +++-
 apps/web/src/api/SupabaseGameApiV2.test.ts         |  31 +-
 apps/web/src/api/SupabaseGameApiV2.ts              |  13 +-
 apps/web/src/api/mockV2Fixtures.test.ts            |   2 +-
 apps/web/src/api/mockV2Fixtures.ts                 |   4 +-
 apps/web/src/game/arena/arenaFixtures.ts           |  12 +-
 apps/web/src/game/v2/loopV2.test.ts                |  11 +
 apps/web/src/game/v2/loopV2.ts                     |   2 +-
 apps/web/src/layout/forge/ForgePanel.test.tsx      |  14 +
 apps/web/src/layout/forge/ForgePanel.tsx           |  33 +-
 docs/proposals/sql/v2-integrity-rollback.sql       |  53 ++++
 docs/proposals/v2-state-integrity.md               |   2 +
 docs/security-review-2026-10.md                    |   8 +-
 packages/api-contract/src/endpoints.ts             |   4 +
 packages/api-contract/src/index.ts                 |   2 +
 packages/api-contract/src/v2.ts                    |  17 +
 reports/s2-fix1-integrity.md                       | 342 +++++++++++++++++++++
 reports/s2-fix1-integrity/salvage-1280-dark.png    | Bin 0 -> 69767 bytes
 reports/s2-fix1-integrity/salvage-1280-light.png   | Bin 0 -> 69767 bytes
 reports/s2-fix1-integrity/salvage-1600-light.png   | Bin 0 -> 75353 bytes
 reports/s2-fix1-integrity/salvage-320-light.png    | Bin 0 -> 30442 bytes
 reports/s2-fix1-integrity/salvage-390-dark.png     | Bin 0 -> 47286 bytes
 reports/s2-fix1-integrity/salvage-390-light.png    | Bin 0 -> 46083 bytes
 supabase/functions/_shared/v2/actions.ts           |  15 +
 supabase/functions/_shared/v2/boss.ts              |  47 ++-
 supabase/functions/_shared/v2/forge.ts             |  19 +-
 supabase/functions/_shared/v2/game.ts              |   9 +-
 supabase/functions/_shared/v2/server.ts            |  15 +-
 supabase/functions/_shared/v2/snapshot.ts          |  11 +-
 .../migrations/20261102000000_v2_integrity.sql     | 139 +++++++++
 supabase/tests/src/schema.test.ts                  |   2 +-
 supabase/tests/v2/concurrency.test.ts              |   2 +-
 supabase/tests/v2/functions-boss.test.ts           |   4 +-
 supabase/tests/v2/functions.test.ts                |   2 +-
 supabase/tests/v2/helpers.ts                       |   4 +-
 supabase/tests/v2/schema.test.ts                   |  44 ++-
 supabase/tests/v2/security-proposals.test.ts       |   8 +-
 supabase/tests/v2/security-races.test.ts           | 135 +++++++-
 supabase/tests/v2/v2-store.ts                      |   9 +-
 42 files changed, 1080 insertions(+), 120 deletions(-)

$ git diff --name-only origin/main...HEAD
apps/web/e2e/ui/s2-integrity.spec.ts
apps/web/src/api/GameApiV2.ts
apps/web/src/api/MockGameApiV2.test.ts
apps/web/src/api/MockGameApiV2.ts
apps/web/src/api/SupabaseGameApiV2.test.ts
apps/web/src/api/SupabaseGameApiV2.ts
apps/web/src/api/mockV2Fixtures.test.ts
apps/web/src/api/mockV2Fixtures.ts
apps/web/src/game/arena/arenaFixtures.ts
apps/web/src/game/v2/loopV2.test.ts
apps/web/src/game/v2/loopV2.ts
apps/web/src/layout/forge/ForgePanel.test.tsx
apps/web/src/layout/forge/ForgePanel.tsx
docs/proposals/sql/v2-integrity-rollback.sql
docs/proposals/v2-state-integrity.md
docs/security-review-2026-10.md
packages/api-contract/src/endpoints.ts
packages/api-contract/src/index.ts
packages/api-contract/src/v2.ts
reports/s2-fix1-integrity.md
reports/s2-fix1-integrity/salvage-1280-dark.png
reports/s2-fix1-integrity/salvage-1280-light.png
reports/s2-fix1-integrity/salvage-1600-light.png
reports/s2-fix1-integrity/salvage-320-light.png
reports/s2-fix1-integrity/salvage-390-dark.png
reports/s2-fix1-integrity/salvage-390-light.png
supabase/functions/_shared/v2/actions.ts
supabase/functions/_shared/v2/boss.ts
supabase/functions/_shared/v2/forge.ts
supabase/functions/_shared/v2/game.ts
supabase/functions/_shared/v2/server.ts
supabase/functions/_shared/v2/snapshot.ts
supabase/migrations/20261102000000_v2_integrity.sql
supabase/tests/src/schema.test.ts
supabase/tests/v2/concurrency.test.ts
supabase/tests/v2/functions-boss.test.ts
supabase/tests/v2/functions.test.ts
supabase/tests/v2/helpers.ts
supabase/tests/v2/schema.test.ts
supabase/tests/v2/security-proposals.test.ts
supabase/tests/v2/security-races.test.ts
supabase/tests/v2/v2-store.ts
```
<!-- FIX1_DIFF_END -->

## 5. Verification and evidence

Corepack is unavailable; every direct pnpm command used `npx -y pnpm@10.28.0`. Node and pnpm version lines, real check summaries and exit behavior are pasted below. No `.env`, credentials or dependency configuration was edited. Optional native build scripts were ignored by the frozen installer; no approval or lock/workspace reset was needed.

```text
$ node --version
v26.11.1
(exit 0)

$ npx -y pnpm@10.28.0 --version
10.28.0
(exit 0)

$ CI=true npx -y pnpm@10.28.0 install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
Done in 291ms using pnpm v10.28.0
(exit 0)

$ npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions
wrote 18 Edge Function import maps
(exit 0)

$ npx -y pnpm@10.28.0 typecheck
Scope: 6 of 7 workspace projects
packages/chain typecheck: Done
packages/auth typecheck: Done
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck: Done
apps/web typecheck: Done
(exit 0)

$ npx -y pnpm@10.28.0 lint
Scope: 6 of 7 workspace projects
packages/chain lint: Done
packages/auth lint: Done
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint: Done
apps/web lint: Done
(exit 0)

$ npx -y pnpm@10.28.0 test
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
supabase/tests test:  Test Files  21 passed (21)
supabase/tests test:       Tests  437 passed (437)
packages/game-rules test:  Test Files  20 passed | 3 skipped (23)
packages/game-rules test:       Tests  330 passed | 2 expected fail | 11 skipped (343)
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
apps/web test:  Test Files  89 passed (89)
apps/web test:       Tests  1140 passed (1140)
(exit 0)

$ npx -y pnpm@10.28.0 build
packages/chain build: Done
packages/auth build: Done
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build: Done
apps/web build: ✓ built in 316ms
apps/web build: Done
(exit 0)

$ VITE_GAME_V2=0 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 --filter @taskbar-hero/web build
✓ built in 310ms
(exit 0)

$ npx -y pnpm@10.28.0 --filter @taskbar-hero/supabase-tests test -- v2
Test Files  21 passed (21)
      Tests  437 passed (437)
(exit 0)

$ npx -y pnpm@10.28.0 --filter @taskbar-hero/supabase-tests exec vitest run v2
Test Files  9 passed (9)
      Tests  136 passed (136)
(exit 0)

$ node scripts/check-bundle.mjs
check-bundle: scanned 48 text files in apps/web/dist
check-bundle: no secret-looking strings found.
(exit 0)

$ grep -n 'it.fails' supabase/tests/v2/security-races.test.ts
(no output; grep exit 1 means no matches, as required)

$ git diff --name-only origin/main...HEAD -- supabase/migrations
supabase/migrations/20261102000000_v2_integrity.sql

$ git diff --check
(no output; exit 0)

$ node scripts/check-links.mjs --json
origin/main brokenCount: 0
S2-FIX1 brokenCount: 0
(exit 0; no new broken links)
```

The required `pnpm ... test -- v2` form is passed through as `vitest run -- v2` by the package script and runs the full Supabase suite in this environment. The explicit `pnpm ... exec vitest run v2` also ran the v2 directory alone; both summaries are recorded. Supabase now has **zero expected failures**; the game-rules package's two expected failures and eleven skipped cases/three skipped files predate this branch.

The new browser cases use the same v2 build guard/preview setup as current main, verify disabled starter selection + visible hint + successful ordinary salvage at all six requested viewport/theme pairs, and collect console/page errors. Evidence PNGs are only written when SCREENSHOTS=1, under [S2-FIX1 evidence](s2-fix1-integrity/), six files under 200 KB. Screenshot capture explicitly scrolls the starter hint into the viewport rather than assuming CSS visibility means it is onscreen. No UI styles/layout or pixel assets changed. Classic remains covered by its build and the full browser project.

```text
$ cd apps/web
$ VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 test:e2e
  ✓   94 [stage-layout] › e2e/ui/s2-integrity.spec.ts:11:3 › starter salvage protection at 1600x900 light (741ms)
  ✓   98 [stage-layout] › e2e/ui/s2-integrity.spec.ts:11:3 › starter salvage protection at 1280x720 light (877ms)
  ✓  102 [stage-layout] › e2e/ui/s2-integrity.spec.ts:11:3 › starter salvage protection at 390x844 light (892ms)
  ✓  108 [stage-layout] › e2e/ui/s2-integrity.spec.ts:11:3 › starter salvage protection at 320x568 light (887ms)
  ✓  116 [stage-layout] › e2e/ui/s2-integrity.spec.ts:11:3 › starter salvage protection at 1280x720 dark (745ms)
  ✓  123 [stage-layout] › e2e/ui/s2-integrity.spec.ts:11:3 › starter salvage protection at 390x844 dark (826ms)
  156 passed (39.5s)
(exit 0)

$ cd apps/web
$ SCREENSHOTS=1 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 exec playwright test e2e/ui/s2-integrity.spec.ts --project=stage-layout
  ✓  1 [stage-layout] › e2e/ui/s2-integrity.spec.ts:11:3 › starter salvage protection at 1600x900 light (7.3s)
  ✓  2 [stage-layout] › e2e/ui/s2-integrity.spec.ts:11:3 › starter salvage protection at 1280x720 light (1.0s)
  ✓  3 [stage-layout] › e2e/ui/s2-integrity.spec.ts:11:3 › starter salvage protection at 390x844 light (880ms)
  ✓  4 [stage-layout] › e2e/ui/s2-integrity.spec.ts:11:3 › starter salvage protection at 320x568 light (868ms)
  ✓  5 [stage-layout] › e2e/ui/s2-integrity.spec.ts:11:3 › starter salvage protection at 1280x720 dark (948ms)
  ✓  6 [stage-layout] › e2e/ui/s2-integrity.spec.ts:11:3 › starter salvage protection at 390x844 dark (817ms)
  6 passed (19.1s)
(exit 0)
```

Examples: [320×568 light](s2-fix1-integrity/salvage-320-light.png), [1280×720 dark](s2-fix1-integrity/salvage-1280-dark.png). Existing e2e tests may rewrite unrelated report PNGs; all such changes are restored before push. Current main has zero broken links (the older mission's 58-link baseline was fixed upstream); this branch adds none.

## 6. NOT verified

No live database was queried or written. Migration history, deployed schema/grants/functions, real PostgreSQL independent-connection locking/deadlocks, deployed Edge/web versions, wallet behavior, on-chain state, signer custody, chain finality and production secrets remain NOT VERIFIED. All SQL applies/rollback tests were isolated in PGlite. The new migration is approved source for the owner, not a claim of a production fix. Auth/SIWE, contracts, numbers, rate limiting, used-vs-minted nonce recovery and contract Mediums remain outside this fix.

## 7. Owner rollout and remaining decisions — manual only

**Apply order: migration → deploy all v2 Edge Functions → ship web build. None of these deployment steps was executed by this mission.**

1. Review/back up the intended Supabase project; pause gameplay writes for maintenance. Confirm the existing v2 schema matches the original v2 migration and record the migration-history state. The mission says the live schema already exists; that does not prove its migration version was recorded.
2. In that project's Supabase SQL Editor, paste **the entire** [new migration](../supabase/migrations/20261102000000_v2_integrity.sql) and run it once. It contains its own BEGIN/COMMIT. Do not paste any historical proposal blocks. If using `supabase db push` instead, first review the linked migration list and dry-run output: it must propose only this approved file, not replay the already-existing v2 schema or unrelated migrations. Stop and reconcile history if it lists anything else. SQL Editor does not itself update CLI migration history; have the owner record/reconcile the applied version afterward, without rerunning the DDL.
3. After successful apply, verify the objects/permissions with the read-only SQL below. Deploy the v2 functions with the updated shared modules, preserving the existing in-function session authentication/secrets. The checked-in config lists gateway settings only for classic/auth functions, not v2; the actual live v2 gateway setting is NOT VERIFIED. The owner must explicitly select gateway verify_jwt=false for these custom-JWT handlers (the CLI flag below does that). This observation is reported without editing auth/deployment configuration. Deploy the entire v2 set (`v2-state`, `v2-claim`, `v2-equip`, `v2-choose-class`, `v2-boss-fight`, `v2-craft`, `v2-salvage`, `v2-lock`, `v2-relic-forge`), because source mapping is shared. Do not deploy auth endpoints as part of this card.
4. Ship the reviewed web build after Edge deployment, then check starter protection and a single crafted action retry in an approved smoke-test account. No such live smoke test was performed here. Retain/back up action-result history; do not clear it for routine maintenance.

Owner-only deploy commands after step 2, with the intended project reference explicitly selected (not run by this mission). The [Supabase CLI reference](https://supabase.com/docs/reference/cli/global-flags) documents the gateway flag; in-function JWT verification remains mandatory:

```sh
: "${TASKBAR_PROJECT_REF:?Set the reviewed Supabase project reference first}"
for function_name in v2-state v2-claim v2-equip v2-choose-class v2-boss-fight v2-craft v2-salvage v2-lock v2-relic-forge; do
  supabase functions deploy "$function_name" --project-ref "$TASKBAR_PROJECT_REF" --no-verify-jwt
done
```

Read-only owner verification queries (not executed live here):

```sql
select relrowsecurity from pg_class where oid='public.v2_action_results'::regclass;
select * from pg_policies where schemaname='public' and tablename='v2_action_results'; -- zero policies
select role, has_table_privilege(role, 'public.v2_action_results', 'SELECT') can_read,
  has_table_privilege(role, 'public.v2_action_results', 'INSERT') can_insert
from (values ('anon'), ('authenticated'), ('service_role')) roles(role);
select p.oid::regprocedure, has_function_privilege('anon',p.oid,'EXECUTE') anon_exec,
  has_function_privilege('authenticated',p.oid,'EXECUTE') authenticated_exec
from pg_proc p where p.pronamespace='public'::regnamespace
  and p.proname in ('v2_action_result','v2_craft_once','v2_boss_fight_once','v2_equipment_revision');
select tgname from pg_trigger where tgrelid='public.items'::regclass and not tgisinternal;
```

Old clients can call the new server without requestId: they retain legacy behavior and no dedupe. New clients can syntactically call the old server: source at base a0ac8df destructures recipeId/slot/chapter and the HTTP wrapper accepts extra fields, so requestId is ignored rather than rejected. **That old server cannot deduplicate the new client's automatic retry.** Follow the rollout order even though wire shapes are backward compatible. A later approved card should make IDs required after old clients have aged out. Missing source remains optional for old servers/saves; SQL's source check is authoritative even if an older UI still allows selection.

Rollback: use [v2-integrity-rollback.sql](../docs/proposals/sql/v2-integrity-rollback.sql), marked PROPOSAL/MANUAL and never applied live by this mission. Stop writes and back up the ledger first, restore the previous Edge/client builds while writes remain paused, then execute the entire rollback SQL once. It drops the new trigger/functions/table and restores the exact original salvage/item-JSON bodies, retaining their grants; the local schema test compares original bodies/grants and re-applies the new migration successfully. Rollback deliberately reopens the original gaps and discards dedupe history; it is emergency recovery, not a safe routine toggle. Restoring SQL alone while new Edge functions still call once wrappers would break actions. Coordinate migration-history records manually with the chosen apply method.

Remaining: confirm the missing checked-in v2 gateway settings during manual rollout; approve when to require IDs; monitor ledger growth and design bounded retention with tombstones rather than deleting keys; ship the separate request-budget proposal; preserve the original used-nonce/contract warnings. PGlite cannot replace a production lock-scheduling test. No other economy rule or number was changed.

## 8. Branch, commits and reproduction

Branch: `ai/codex-s2-fix1-integrity`; base `a0ac8df`. Author: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`. Only this branch is pushed. No PR, merge, Actions run, deploy or live database access.

```text
f91b782 fix(v2): protect starters and atomically deduplicate economy actions
a33b208 fix(web): preserve action ids on retries and protect starter salvage
961f539 test(v2): update fixture metadata and schema inventory for integrity
5a07216 test(v2): assert complete salvage refusal and capture visible starter hint
```

From the branch checkout:

```sh
npx -y pnpm@10.28.0 --version
CI=true npx -y pnpm@10.28.0 install --frozen-lockfile
npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions
npx -y pnpm@10.28.0 typecheck
npx -y pnpm@10.28.0 lint
npx -y pnpm@10.28.0 test
npx -y pnpm@10.28.0 build
npx -y pnpm@10.28.0 --filter @taskbar-hero/supabase-tests exec vitest run v2
VITE_GAME_V2=0 npx -y pnpm@10.28.0 --filter @taskbar-hero/web build
cd apps/web
# Ensure no other suite/unknown preview owns the default ports; see docs/test-stability.md.
npx -y pnpm@10.28.0 test:e2e
SCREENSHOTS=1 npx -y pnpm@10.28.0 exec playwright test e2e/ui/s2-integrity.spec.ts --project=stage-layout
```

The report cannot embed its own final commit hash without changing that hash; find the report/evidence commit with `git log -1 -- reports/s2-fix1-integrity.md`. All migration and rollback execution in the test suite is in disposable local PGlite, never a shared/live database.
