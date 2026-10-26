STATUS: BLOCKED

KW1 wave R2 — Cat Key wall

## What was done

Fetched origin/main and created ai/codex-kw1-key-wall from c87012d (the refreshed base; the card's 68b6715 is older). Used an isolated managed worktree because the original checkout contains unrelated forge work. No unrelated work was modified.

Added a self-contained PGlite B1 gate reproduction in supabase/tests/v2/functions-boss-keys.test.ts. It creates its own player, class, reached-boss state and key stack, calls fightBossV2 inside withConfigV2({ boss: { firstClearKeys: 1 } }), and observes the value at the SQL store boundary. This test intentionally remains failing evidence of the mandated gate; it was not skipped, weakened, or deleted. No production code, config numbers, SQL, helpers or existing tests were changed. No PR, Actions, merge, deploy, or live DB operation occurred; the database used was local in-memory PGlite via the existing test harness.

Requested Sonnet was unavailable in this session; execution used the current Codex model.

## Exact blocker and config path

The card says: "if the Edge handler does not see the override in-process, STOP and report how the config reaches the handler". This gate triggered. No conditional production fix was attempted.

Vitest aliases @taskbar-hero/game-rules to packages/game-rules/src/index.ts. Its v2 export and the directly imported sim/config.ts share V2_CONFIG. The assertion inside the withConfigV2 callback sees firstClearKeys = 1, proving module identity is correct. However, withConfigV2 synchronously returns fn() and restores its mutations in finally. fightBossV2 first awaits deps.store.snapshot, then awaits v2BossSeed; its later v2.rollChestV2 call reads V2_CONFIG.boss.firstClearKeys in view/chest.ts after the override has been restored. Therefore the first chest has no catKey. The real win and keySpent assertions pass, but the config-at-write assertion fails (0 instead of 1).

Needed to continue: authorization to change packages/game-rules/src/v2/sim/config.ts so withConfigV2 keeps overrides active until an async callback settles and restores on either resolution or rejection, together with permission for appropriate helper regression tests. Neither moving a config capture in boss.ts nor changing chest.ts solves the required override lifetime. No number change is needed.

An independent acceptance blocker: node scripts/check-links.mjs reports 58 pre-existing broken paths. docs/api-v2.md was not edited. Fixing repository-wide missing screenshots, placeholder paths, and missing artifacts requires scope beyond this card; affected files include README.md, docs/dry-run-report.md, docs/database.md, docs/cutover-v2.md, docs/deploy.md, docs/demo-script.md, docs/extending.md, docs/licenses-v2.md, docs/proposals/schema-v2.md, docs/runbook.md, docs/submission.md, and docs/verify-pr.md. A separate approved task must resolve these checks; no workaround was made.

## Tooling and checks actually run

Corepack is missing (command -v corepack returned no path), so every pnpm command used npx -y pnpm@10.28.0.

```
$ npx -y pnpm@10.28.0 --version
10.28.0
$ CI=true npx -y pnpm@10.28.0 install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +505
Progress: resolved 505, reused 496, downloaded 0, added 505, done
Done in 8.7s using pnpm v10.28.0
```

Install passed; pnpm warned that existing dependency build scripts were ignored. No dependency or lockfile changes.

```
$ npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions
> node scripts/gen-deno-json.mjs
wrote 18 Edge Function import maps
```

PASS: exit 0, no generated diff.

Typecheck PASS (exit 0):

```
> taskbar-hero@0.0.0 typecheck /Users/bao/.codex/worktrees/kw1-key-wall/taskbar hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
packages/auth typecheck: Done
packages/chain typecheck: Done
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done
```

Gate command FAIL (Vitest exit 1; no fix applied):

```
$ npx -y pnpm@10.28.0 --filter @taskbar-hero/supabase-tests test v2/functions-boss-keys.test.ts --reporter=verbose
> @taskbar-hero/supabase-tests@0.0.0 test /Users/bao/.codex/worktrees/kw1-key-wall/taskbar hero/supabase/tests
> vitest run v2/functions-boss-keys.test.ts --reporter=verbose


 RUN  v5.0.5 /Users/bao/.codex/worktrees/kw1-key-wall/taskbar hero/supabase/tests

stdout | v2/functions-boss-keys.test.ts > B1 first clear with one key spends keyCost and grants one first-clear key
KW1 config at SQL write: firstClearKeys=0; first chest catKey=undefined

 × v2/functions-boss-keys.test.ts > B1 first clear with one key spends keyCost and grants one first-clear key 76ms
   → expected +0 to be 1 // Object.is equality

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  v2/functions-boss-keys.test.ts > B1 first clear with one key spends keyCost and grants one first-clear key
AssertionError: expected +0 to be 1 // Object.is equality

- Expected
+ Received

- 1
+ 0

 ❯ v2/functions-boss-keys.test.ts:37:27
     35|   expect(result.won).toBe(true);
     36|   expect(result.keySpent).toBe(true);
     37|   expect(observedAtWrite).toBe(1);
       |                           ^
     38|   const keys = await db.query<{ qty: number }>("select qty from player…
     39|   expect(Number(keys.rows[0]?.qty ?? 0)).toBe(1 - v2.V2_CONFIG.boss.ke…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  20:17:31
   Duration  1.58s (tests 44%, import 34%, transform 22%)

/Users/bao/.codex/worktrees/kw1-key-wall/taskbar hero/supabase/tests:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @taskbar-hero/supabase-tests@0.0.0 test: `vitest run v2/functions-boss-keys.test.ts --reporter=verbose`
Exit status 1
```

Untouched default-config regression command PASS:

```
$ npx -y pnpm@10.28.0 --filter @taskbar-hero/supabase-tests test v2/functions-boss.test.ts --reporter=verbose
 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > commits exactly one parallel first clear and refuses the other as stale 70ms
 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > keeps the key on a weak-cat loss and returns the stored cooldown through HTTP 37ms
 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > refuses unreached rounds and insufficient kills before missing keys, without writing 25ms
 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > refuses no_key at a reached boss without writing 13ms
 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > refuses missing players and no_class before cooldown, reach and keys 4ms
 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > checks cooldown before not_reached and no_key without invoking the write 7ms
 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > rejects invalid chapters before loading state 0ms
 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > returns the exact seeded timeline, nonnegative HP and D2 boss flags 9ms
 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > derives distinct player seeds and repeats the same player/fights timeline 12ms
 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > uses the rematch chest under the SQL lock and preserves progress 15ms
 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > auto-salvages every chest item at the configured bag limit and returns actual credits 36ms
 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > maps SQL refusals, includes SQL cooldown extras and never retries stale 13ms
 ✓ v2/functions-boss.test.ts > v2 boss Edge Function over migrated SQL > enforces GET/auth and validates malformed HTTP bodies 6ms
 Test Files  1 passed (1)
      Tests  13 passed (13)
   Duration  1.44s (tests 73%, import 21%, transform 6%)
```

Docs link check FAIL (exit 1):

```
$ node scripts/check-links.mjs
Checked 44 markdown files and 589 links/paths.
Found 58 broken link(s) or path(s) on disk:
  README.md:114 [backticked image path]
    Target: `og.png`
    Not found: og.png
  docs/cutover-v2.md:102 [backticked repo path]
    Target: `supabase/migrations/20261110000000_v2_founder_batch.sql`
    Not found: supabase/migrations/20261110000000_v2_founder_batch.sql
  docs/database.md:3 [backticked repo path]
    Target: `supabase/migrations/*.sql`
    Not found: supabase/migrations/*.sql
```

## Acceptance audit

- NOT VERIFIED: A chestKeys.test.ts; not created after the explicit gate stop.
- FAIL: B1 first clear with one key spends keyCost and grants one first-clear key (test name pasted above). Override is lost before chest generation.
- NOT VERIFIED: B2 rematch key sink and chest absence.
- NOT VERIFIED: B3 maxStack cap under the enabled lever.
- NOT VERIFIED: B4 loss under the enabled lever.
- NOT VERIFIED: B5 zero keys / reached boss / first clear pending / HTTP 409 no_key / no writes under the enabled lever.
- NOT VERIFIED: C Cat Key wall API documentation section; not added after gate stop.
- PASS: default config behaviour regression — existing functions-boss.test.ts untouched, all 13 tests passed.
- PASS: config.ts and content numbers unchanged; helpers.ts and existing tests unchanged; no production fixes.
- FAIL: full SELF-CHECK suite green — gate test fails; remaining checks not claimed.
- FAIL: docs link check — 58 existing broken paths.

## NOT verified

pnpm lint, pnpm test (full suite), pnpm build, and apps/web pnpm test:e2e were not run after the mandatory config gate stop. Only the two explicitly listed targeted test commands ran. This is a code-test diff, so the docs-only exemption does not apply. No screenshots or e2e reports were generated. A, B2–B5 and the API section remain outstanding. Do not merge this blocked diagnostic branch as a completed KW1 implementation.

## Final scope / author audit

Recorded below after commit and refreshed origin/main fetch. Branch push is the only remote mutation authorized and performed.

```
$ git fetch origin +main:refs/remotes/origin/main
(exit 0; origin/main remains c87012d)
$ git diff --name-only origin/main...HEAD
reports/kw1-key-wall.md
supabase/tests/v2/functions-boss-keys.test.ts
$ git diff --stat origin/main...HEAD
 reports/kw1-key-wall.md                       | 176 ++++++++++++++++++++++++++
 supabase/tests/v2/functions-boss-keys.test.ts |  40 ++++++
 2 files changed, 216 insertions(+)
$ git log --format='%an <%ae>' origin/main..HEAD
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

Scope PASS: both paths are on the card's allowlist. Stat above precedes this audit append. Author PASS. No fixes attempted outside scope. The B1 reproduction counts as work already performed; this is the task branch, not a report-only fallback for a stop before any work.
