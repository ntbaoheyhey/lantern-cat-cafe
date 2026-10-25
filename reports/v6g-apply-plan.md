STATUS: DONE

# CL8 apply-numbers preparation only

Gate PASS: Q3 branch ai/codex-v6f-rebalance @ 9d820a0 is DONE. Its proposal is NOT READY: 7 strict targets pass, chapter-growth and boss-check fail; relaxed criteria fail the same two. D4 is unsigned. Recommend waiting for a pacing/classes follow-up rather than approving these numbers. Nothing here authorizes application.

## Exact proposed config leaves

Target: packages/game-rules/src/v2/config.ts. Arrays are zero-indexed, corresponding to chapters 1–5. Omitted leaves remain unchanged. 34 leaves: 26 changes and 8 no-ops.

| V2_CONFIG path | current | proposed |
|---|---:|---:|
| `cat.baseAtk` | 10 | 14 |
| `cat.baseHp` | 100 | 300 |
| `cat.baseDef` | 5 | 5 |
| `cat.levelGrowth` | 0.06 | 0.06 |
| `cat.xpGrowth` | 1.12 | 1.12 |
| `monster.hpBase` | 30 | 90 |
| `monster.hpGrowth` | 1.13 | 1.06 |
| `monster.atkBase` | 4 | 8 |
| `monster.atkGrowth` | 1.12 | 1.06 |
| `monster.xpBase` | 6 | 18 |
| `monster.xpGrowth` | 1.11 | 1.11 |
| `idle.dailyKeys` | 1 | 3 |
| `idle.walkTimeMs` | 1000 | 1000 |
| `idle.gearDropChance` | 0.02 | 0.0067 |
| `boss.maxMs` | 60000 | 180000 |
| `boss.attackIntervalMs` | 1500 | 4500 |
| `boss.bigEveryMs` | 6000 | 6000 |
| `boss.bigMultiplier` | 2.5 | 1.5 |
| `boss.firstClearKeys` | 0 | 1 |
| `boss.chapterHpMul[0]` | 40 | 14 |
| `boss.chapterHpMul[1]` | 40 | 20 |
| `boss.chapterHpMul[2]` | 40 | 30 |
| `boss.chapterHpMul[3]` | 40 | 40 |
| `boss.chapterHpMul[4]` | 40 | 50 |
| `boss.chapterAtkMul[0]` | 2.5 | 0.85 |
| `boss.chapterAtkMul[1]` | 2.5 | 1.5 |
| `boss.chapterAtkMul[2]` | 2.5 | 2.5 |
| `boss.chapterAtkMul[3]` | 2.5 | 3 |
| `boss.chapterAtkMul[4]` | 2.5 | 3.5 |
| `chapters.killsPerRound[0]` | 6 | 18 |
| `chapters.killsPerRound[1]` | 10 | 22 |
| `chapters.killsPerRound[2]` | 10 | 26 |
| `chapters.killsPerRound[3]` | 10 | 30 |
| `chapters.killsPerRound[4]` | 10 | 30 |

## Throwaway probe method and results

Detached worktree at Q3, without editing config.ts or any test. An untracked Vitest setup recursively injected PROPOSED_V2_OVERRIDES into V2_CONFIG at runtime. The game/web configs retained the original config settings. The database config needed an .mts extension because import.meta.resolve is unsupported in a CJS-bundled config; the initial startup failure is not a database test result. Offline installation failed on an uncached tarball; normal pinned pnpm 10.28.0 frozen install succeeded (12.3s). No dependency or lockfile edits.

Commands/results below are actual probe output summaries. Failures are expected application-impact findings, not silently updated assertions. Probe is based on Q3/main; unmerged Q4/Q5/Q9/Q10b tests have NOT been run with the proposal.

### game-rules

```text
$ pnpm --filter @taskbar-hero/game-rules exec vitest run --config ../../probe-game.config.ts
 ❯ src/v2/content/docs.gen.test.ts (4 tests | 1 failed) 37ms
 ❯ src/v2/combat/combat.test.ts (23 tests | 8 failed) 105ms
 ❯ src/v2/idle/idle.test.ts (19 tests | 5 failed) 183ms
 ❯ src/v2/levers.test.ts (26 tests | 25 failed) 138ms
 ❯ src/v2/sim/targets.test.ts (8 tests | 1 failed) 71ms
 ❯ src/v2/content/content.test.ts (21 tests | 1 failed) 32ms
 ❯ src/v2/sim/diagnosis.test.ts (5 tests | 2 failed) 1862ms
 ❯ src/v2/config.test.ts (3 tests | 2 failed) 11ms
Error: Property failed after 3 tests
 Test Files  9 failed | 11 passed | 2 skipped (22)
      Tests  46 failed | 284 passed | 2 expected fail | 4 skipped (336)
   Duration  14.48s (tests 88%, import 5%, transform 5%, setup 1%, worker 1%)
EXIT 1; runtime 15.07s
```

### web

```text
$ pnpm --filter @taskbar-hero/web exec vitest run --config ../../probe-web.config.ts
 ❯ src/layout/boss/BossGatePanel.test.tsx (16 tests | 8 failed) 315ms
 ❯ src/api/MockGameApiV2.test.ts (20 tests | 2 failed) 42ms
 ❯ src/layout/a11y/v2-components.a11y.test.tsx (20 tests | 1 failed) 432ms
 ❯ src/game/arena/arenaFixtures.test.ts (3 tests | 1 failed) 90ms
 Test Files  4 failed | 71 passed (75)
      Tests  12 failed | 1025 passed (1037)
   Duration  75.50s (environment 55%, tests 30%, import 11%, transform 4%, setup 1%)
EXIT 1; runtime 76.14s
```

### supabase

```text
$ pnpm --filter @taskbar-hero/supabase-tests exec vitest run --config ../../probe-supabase.config.ts
Error: import.meta.resolve is not supported in CJS config files
EXIT 1; runtime 0.60s
```

### supabase-retry

```text
 ❯ v2/functions-state.test.ts (15 tests | 1 failed) 1327ms
 Test Files  1 failed | 17 passed (18)
      Tests  1 failed | 384 passed (385)
   Duration  32.09s (tests 85%, import 12%, transform 3%)
```

### arena-update

```text
$ UPDATE_ARENA_FIXTURES=1 pnpm --filter @taskbar-hero/web exec vitest run src/game/arena/arenaFixtures.test.ts --config ../../probe-web.config.ts
 Test Files  1 passed (1)
      Tests  3 passed (3)
   Duration  263ms (transform 45%, import 26%, tests 23%, setup 4%, worker 2%)
EXIT 0; runtime 0.87s
```

### docs-update

```text
$ UPDATE_DOCS=1 pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/content/docs.gen.test.ts --config ../../probe-game.config.ts
 Test Files  1 passed (1)
      Tests  4 passed (4)
   Duration  175ms (tests 40%, transform 24%, import 21%, setup 10%, worker 5%)
EXIT 0; runtime 0.75s
```

## Files CL8 would need to edit after D4

- `packages/game-rules/src/v2/config.ts`: apply the exact approved leaf table. No class/content changes are implicitly approved.
- `packages/game-rules/src/v2/config.test.ts`, `combat/combat.test.ts`, `idle/idle.test.ts`, `content/content.test.ts`: review explicit default stats, pacing, combat and reward expectations.
- `packages/game-rules/src/v2/levers.test.ts`: deliberately regenerate/review all 21 class/seed default digests, plus config restoration/refund assertions. There is no golden writer switch. Preserve key spend-before-refund and cap invariants.
- `packages/game-rules/src/v2/sim/{proposal.ts,equivalence.test.ts,diagnosis.test.ts,targets.test.ts}`: historical C5c partial overrides inherit new pacing and boss defaults. Freeze original baseline leaves (kills [6,10,10,10,10], HP [40,40,40,40,40], ATK [2.5,2.5,2.5,2.5,2.5], refund 0) so historical equivalence remains meaningful. Do not blindly regenerate the old proof digests. The historical C5b key-wall diagnostic must explicitly retain refund 0. Guardrail examples 40 kills/121 HP become valid under a new baseline: use relative >3x boundary examples while preserving integer, cap and range assertions.
- `docs/content-v2.md`: UPDATE_DOCS=1 regeneration changes 10 lines (5 replacements).
- `apps/web/src/api/MockGameApiV2.test.ts`: daily key/reward/pacing assertions.
- `apps/web/src/layout/boss/BossGatePanel.test.tsx` and `layout/a11y/v2-components.a11y.test.tsx`: update reached/not-reached setup for new kill goals and exact key/refund copy. Preserve accessibility assertions.
- `apps/web/src/game/arena/arenaFixtures.ts`: UPDATE_ARENA_FIXTURES=1 passed and changed 12 lines (6 replacements). All three arena audit tests pass. The existing hand-built chapter-5 win remains present; the optional real-chapter-5-win audit did not skip, so this probe does NOT establish that the hand-built fixture can be replaced. Keep it until a real winning log is demonstrated.
- Database retry: 1 failed / 384 passed in 32.09s; `supabase/tests/v2/functions-state.test.ts` daily-key credit expectation must be reviewed after approval. Retain state, idempotency and rollback invariants.
- `docs/numbers-v2.md`: rerun the writer only with an explicit plan to preserve the signed approval. The existing writer writes a blank User signature; do not erase a user's sign-off. It is currently unsigned and untouched.
- Static review of Q9: its first-clear expectation 1→0 would become 1→1 because the entry spend precedes refund 1. This is NOT a probe execution result. Rebase and recheck all future merged integration tests.

Only generated arena/content artifacts changed in the disposable worktree; production config and every tracked test remained byte-identical. These probe artifacts are not committed.

## Commands for the later authorized CL8

First obtain signed D4 on a READY proposal and rebase the application card onto the actual integration base. Apply the reviewed leaf table and explicit test/fixture updates above, without weakening checks. Use the repository-pinned pnpm 10.28.0.

```sh
pnpm install --frozen-lockfile
pnpm gen:deno
git diff --exit-code -- supabase/functions
UPDATE_DOCS=1 pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/content/docs.gen.test.ts
UPDATE_ARENA_FIXTURES=1 pnpm --filter @taskbar-hero/web exec vitest run src/game/arena/arenaFixtures.test.ts
pnpm typecheck
pnpm lint
pnpm test
pnpm build
cd apps/web && pnpm test:e2e
```

Also run the full deterministic 20-seed proposal writer and game-rules suite under their card budgets, preserving approval text; review the target table rather than treating generation as approval. Repeat Q9's v2 loop three times after an authorized bulk-equip fix. Preserve historical C5c hashes. User-only Fuji mint, D8/live migration and D6 cutover gates remain separate.

## Acceptance

- PASS: exact current/proposed leaves; application file list; injected suites and generated artifacts examined; commands recorded.
- PASS: only this report committed; no config/test edits or number application.
- NOT VERIFIED: production/live database, real Fuji mint, future combined branch behavior, signed-number acceptance.
- Full suite skipped for committed diff: docs only. Install and gen:deno drift checks follow below.

## Probe tracked diff

```text
 apps/web/src/game/arena/arenaFixtures.ts | 12 ++++++------
 docs/content-v2.md                       | 10 +++++-----
 2 files changed, 11 insertions(+), 11 deletions(-)
```

## Committed docs-only check: install

```text
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
Done in 746ms using pnpm v10.28.0

```

## Committed docs-only check: deno

```text

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps

```

Files touched: reports/v6g-apply-plan.md only. Probe removed after retaining evidence; no temporary artifacts included.
