# V6e config levers (C5d)

**STOPPED — not pushed.** Required workspace tests hit the out-of-scope timing assertion at `supabase/tests/v2/functions-state.test.ts:171`: `expect(elapsed).toBeLessThan(500)`, measured 539.06 ms. The user explicitly requires stopping on a blocking test outside the allowlist. The test is untouched; no timeout/threshold/snapshot was changed or retried. The already-running standalone game-rules suite subsequently also failed two existing 90-second simulator timeouts at `packages/game-rules/src/v2/sim/diagnosis.test.ts:38` and `:46`.

Branch: `ai/codex-v6e-levers`, based on freshly fetched `origin/main` at `a42765ccd523fc4ceb9632d54b053778be798527`.

The new levers preserve production defaults. D1 S-B is supported but not applied: `boss.firstClearKeys` remains 0; `idle.dailyKeys` remains 1 and `idle.walkTimeMs` remains 1000. The numbers proposal remains unsigned. No dependencies, snapshots, content data, simulator files, apps, SQL, or generated import maps changed. No PR or GitHub Actions run was requested or started.

## Gate and Git setup

All four gates passed before branching and implementation. Gate 4's grep exit 1 means the required absence of both new leaves. Git identity was corrected locally before commits.

```text
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
$ git fetch origin +main:refs/remotes/origin/main
From https://github.com/ntbaoheyhey/taskbar-hero
 * [new branch]      main       -> origin/main
$ git show origin/main:packages/game-rules/src/v2/config.ts | grep -nE 'dailyKeys: 1,|walkTimeMs: 1000,'
24:    walkTimeMs: 1000,
29:    dailyKeys: 1,
[exit 0]

$ git show origin/main:docs/proposals/numbers-v2.md | grep -n 'User: ____'
729:User: ____ (approved / changes)
[exit 0]

$ git show origin/main:packages/game-rules/src/v2/content/chapters.ts | grep -n 'killsPerRound: index === 1 ? 6 : 10'
39:    killsPerRound: index === 1 ? 6 : 10,
[exit 0]

$ git show origin/main:packages/game-rules/src/v2/content/monsters.ts | grep -n 'boss: { hpMul: 40, atkMul: 2.5'
25:  boss: { hpMul: 40, atkMul: 2.5, xpMul: 25, lootMul: 0 },
[exit 0]

$ git grep -n 'firstClearKeys\|chapterHpMul' origin/main -- packages/game-rules/src/v2/config.ts
[exit 1]

```

## Implementation and files changed

- `packages/game-rules/src/v2/config.ts`: adds only the four documented leaves below; no prior values changed.
- `packages/game-rules/src/v2/content/chapters.ts`: enumerable getter reads chapter pacing at call time; the interface remains `killsPerRound: number`.
- `packages/game-rules/src/v2/combat/stage.ts`: only boss construction overlays that chapter's HP/ATK multipliers before `monsterAt`. Regular/elite formulas stay unchanged.
- `packages/game-rules/src/v2/view/chest.ts`: credits positive first-clear keys after rolling all rewards, without drawing RNG; rematches receive none.
- `packages/game-rules/src/v2/content/monsters.ts`: exports the existing ARCHETYPE solely for the drift test; MONSTERS data is identical.
- `packages/game-rules/src/v2/config.test.ts`: adds array length/default and archetype drift checks; the prior test is unchanged.
- `packages/game-rules/src/v2/levers.test.ts`: golden fixtures in commit 1; appended override/integration tests in commit 2.
- `reports/v6e-levers.md`: this report and full required validation output.

| Path | Default | Replaces |
| --- | --- | --- |
| chapters.killsPerRound | [6, 10, 10, 10, 10] | chapters.ts chapter-1 conditional (6 versus 10) |
| boss.chapterHpMul | [40, 40, 40, 40, 40] | ARCHETYPE.boss.hpMul in bossOfChapter runtime stats |
| boss.chapterAtkMul | [2.5, 2.5, 2.5, 2.5, 2.5] | ARCHETYPE.boss.atkMul in bossOfChapter runtime stats |
| boss.firstClearKeys | 0 | No extra key in the first-clear chest |

All leaves are read at call time. Tests use the existing read-only `withConfigV2` helper and verify restored values. The three arrays each match CHAPTERS.length. The chapter-three claim test observes eleven regular kills, the twelfth elite kill, and then the next round. Key tests cover every class, chapters 1–5 and seeds 1–3, unchanged other rewards, rematches, loot-view keys, spend-before-credit, refusal with zero entry keys and the five-key cap.

## Golden digests before and after

Commit 1 contains only the baseline golden test, run against otherwise unmodified main. The exact fixtures, hash function, fixed state and golden assertions remain unchanged in commit 2. Test development console diagnostics were removed from commit 1 before its final baseline run because game-rules excludes the console type; new override tests use typed tuple arrays.

Digest algorithm: FNV-1a over JSON.stringify. Fixed claim state: level 5, XP 0, chapter 2 round 3, kills 0, bestStage 12, no items/stacks/clears, lastDailyKeyDay null; today 2026-10-25, offline false, 3600 seconds. Boss logs use level 10 and chapters 1/3/5. Chests use level 5, chapters 1/5 and first-clear/repeat in that order. Content includes bossOfChapter(1..5) and the chapter kill counts.

Content before = `cb3a4b19`; after = `cb3a4b19`.

| Class:seed | Boss before = after | Claim before = after | Chests before = after |
| --- | --- | --- | --- |
| warrior:1 | f77a0f36 | 984e03ce | 330bc17f |
| warrior:2 | 43f8ce01 | 99c69e8c | fab4080b |
| warrior:3 | f77a0f36 | 71f7df94 | 1e201172 |
| guardian:1 | 308af879 | d8698d24 | deea11e3 |
| guardian:2 | c1339390 | fba8ab15 | fab4080b |
| guardian:3 | 308af879 | 8a769b19 | 1e201172 |
| rogue:1 | 0a37d06e | 669b68a9 | e8c9ce6d |
| rogue:2 | f65372e8 | c28b4334 | fab4080b |
| rogue:3 | fe594cc4 | 643244fc | 1e201172 |
| hunter:1 | 52475c8e | 8757686d | 16bdef8b |
| hunter:2 | 05061dac | a7ac2a23 | fab4080b |
| hunter:3 | 52475c8e | a66b143b | 1e201172 |
| archer:1 | bb5d2984 | bdc975c4 | 8a57c12f |
| archer:2 | 58cd4121 | 0a3658e7 | fab4080b |
| archer:3 | bb5d2984 | 94bf5ec2 | 1e201172 |
| witch:1 | eef3f935 | 8cdd77c7 | 60b7956d |
| witch:2 | eef3f935 | ad498dd1 | fab4080b |
| witch:3 | eef3f935 | d4760313 | 1e201172 |
| alchemist:1 | 2d8e74b5 | fa242f38 | 89fd6881 |
| alchemist:2 | 2d8e74b5 | 66f132d5 | fab4080b |
| alchemist:3 | 2d8e74b5 | c1f3e415 | 1e201172 |

## Handoff to C5e

- `withConfigV2` already traverses array leaves and restores them; use five-entry tuple overrides for chapter pacing and boss HP/ATK. Keep daily keys ≤3. `CHAPTERS` getters and `bossOfChapter` now see overrides dynamically.
- `sim/player.ts:57–92` has an independent `rollSimChestV2` implementation and the S-B `firstClearKeyRefund` option, which currently adds a hard-coded 1. C5e must read `V2_CONFIG.boss.firstClearKeys` there at call time, first-clear only, without RNG use. Reconcile the scenario flag with config so the key is never credited twice. This card deliberately does not change simulator behavior or its separate chest roller.
- Review/update `NOT_OVERRIDABLE_V2` text to explain that chapter pacing and boss HP/ATK are now tunable while content registries, CHEST_SCALING and material stack caps remain outside config. The current list is unchanged here.
- `sim/targets.ts:68–87` recursively applies 0.33–3x current to numeric leaves. A zero default makes every positive firstClearKeys override fail that ratio. C5e must explicitly treat the approved D1 key policy separately (e.g. discrete 0/1 domain) rather than weakening numeric guardrails globally. Preserve the ≤3 daily-key cap and all target thresholds.
- Remeasure the unchanged targets with the new pacing and boss-strength search dimensions. No searched or signed numbers are applied here; this does not resolve C5c's target failures by itself.

## Handoff to CL8 and merge

To apply S-B set `boss.firstClearKeys: 1`; the server needs no SQL change because `v2_boss_fight` credits the first-clear chest stacks after spending the key. Read-only verification: `supabase/migrations/20261101000000_v2_cat_rpg.sql:489–491` selects first/rematch, debits catKey, then applies chest stacks with caps. Apply only separately signed chapter and boss values in CL8.

Merge note: touches packages/game-rules only (v2/view/chest.ts among them); disjoint from C12's view files; merge in the same functions batch as C12, C5d first. The only file outside game-rules is this requested report.

Uncertainties: the timing failure cause has not been established. The standalone game-rules suite overlapped the recursive workspace checks on this shared worker, so CPU contention may have contributed. There is no baseline timing comparison proving that explanation. The two simulator failures are the 90000 ms timeouts for “measures the C5b ch4 key wall and zero wait with five daily keys” (96108 ms) and “cleared-chapter key chance is inert on the C5b frontier before ch5 wins” (104852 ms). Full game-rules runtime: 302.85 s. No behavioral expectation changed; the threshold is unchanged. No out-of-scope edits or reruns were attempted after the stop. C5e search/guardrail decisions and CL8 signed values remain future work. The present defaults and content/docs equality are covered by unchanged tests and protected-file diff checks.

## Command output

Commands run from the repository root. Corepack resolves the pinned pnpm 10.28.0. The system shim directory was not writable, so `corepack enable --install-directory /tmp/v6e-bin` supplied shims and `/tmp/v6e-bin` was prepended to PATH. The first noninteractive install aborted before dependency removal; the retry uses `CI=true` and succeeds with the frozen lockfile. No dependencies or lock/workspace files changed.

```text
$ pnpm install --frozen-lockfile (initial noninteractive attempt)
Scope: all 7 workspace projects
 ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY  Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true".
```

```text
$ CI=true pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Recreating /workspace/taskbar-hero/node_modules
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +506
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 506, reused 0, downloaded 0, added 0
Progress: resolved 506, reused 0, downloaded 3, added 3
Progress: resolved 506, reused 0, downloaded 4, added 3
Progress: resolved 506, reused 0, downloaded 18, added 3
Progress: resolved 506, reused 0, downloaded 19, added 3
Progress: resolved 506, reused 0, downloaded 29, added 7
Progress: resolved 506, reused 0, downloaded 47, added 55
Progress: resolved 506, reused 0, downloaded 64, added 72
Progress: resolved 506, reused 0, downloaded 77, added 85
Progress: resolved 506, reused 0, downloaded 90, added 98
Progress: resolved 506, reused 0, downloaded 107, added 115
Progress: resolved 506, reused 0, downloaded 120, added 127
Progress: resolved 506, reused 0, downloaded 135, added 142
Progress: resolved 506, reused 0, downloaded 148, added 156
Progress: resolved 506, reused 0, downloaded 163, added 171
Progress: resolved 506, reused 0, downloaded 180, added 185
Progress: resolved 506, reused 0, downloaded 203, added 211
Progress: resolved 506, reused 0, downloaded 213, added 221
Progress: resolved 506, reused 0, downloaded 225, added 234
Progress: resolved 506, reused 0, downloaded 248, added 257
Progress: resolved 506, reused 0, downloaded 265, added 274
Progress: resolved 506, reused 0, downloaded 280, added 289
Progress: resolved 506, reused 0, downloaded 299, added 308
Progress: resolved 506, reused 0, downloaded 309, added 308
Progress: resolved 506, reused 0, downloaded 335, added 344
Progress: resolved 506, reused 0, downloaded 353, added 362
Progress: resolved 506, reused 0, downloaded 373, added 381
Progress: resolved 506, reused 0, downloaded 385, added 394
Progress: resolved 506, reused 0, downloaded 400, added 409
Progress: resolved 506, reused 0, downloaded 410, added 419
Progress: resolved 506, reused 0, downloaded 430, added 439
Progress: resolved 506, reused 0, downloaded 445, added 454
Progress: resolved 506, reused 0, downloaded 463, added 472
Progress: resolved 506, reused 0, downloaded 467, added 474
Progress: resolved 506, reused 0, downloaded 481, added 476
Progress: resolved 506, reused 0, downloaded 497, added 506, done

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 46.7s using pnpm v10.28.0
```

```text
$ pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/levers.test.ts (commit 1; original production code)

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules


 Test Files  1 passed (1)
      Tests  22 passed (22)
   Start at  06:35:18
   Duration  744ms (tests 46%, transform 32%, import 19%, worker 2%)

```

```text
$ pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/levers.test.ts src/v2/config.test.ts src/v2/content src/v2/view src/v2/combat src/v2/idle src/v2/state

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules


 Test Files  8 passed (8)
      Tests  140 passed (140)
   Start at  06:35:25
   Duration  4.66s (tests 73%, import 17%, transform 8%, worker 2%)

    Isolate  8 workers spawned · ~206ms startup each (spawn + environment, per file)
             at least ~1.44s faster with isolate: false — reuses workers across files instead of one per file

```


```text
$ pnpm --filter @taskbar-hero/game-rules test

> @taskbar-hero/game-rules@0.0.0 test /workspace/taskbar-hero/packages/game-rules
> vitest run


 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

 ❯ src/v2/sim/diagnosis.test.ts (5 tests | 2 failed) 207161ms
   × measures the C5b ch4 key wall and zero wait with five daily keys 96108ms
   × cleared-chapter key chance is inert on the C5b frontier before ch5 wins 104852ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/v2/sim/diagnosis.test.ts > measures the C5b ch4 key wall and zero wait with five daily keys
Error: Test timed out in 90000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ src/v2/sim/diagnosis.test.ts:38:1
     36|   }
     37| }, 60000);
     38| it('measures the C5b ch4 key wall and zero wait with five daily keys',…
       | ^
     39|   for (const classId of CLASS_IDS) for (const seed of [1, 2, 3]) {
     40|     const baseline = c5b(classId, seed);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯

 FAIL  src/v2/sim/diagnosis.test.ts > cleared-chapter key chance is inert on the C5b frontier before ch5 wins
Error: Test timed out in 90000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ src/v2/sim/diagnosis.test.ts:46:1
     44|   }
     45| }, 90000);
     46| it('cleared-chapter key chance is inert on the C5b frontier before ch5…
       | ^
     47|   for (const classId of CLASS_IDS) for (const seed of [1, 2, 3]) {
     48|     const run = (chance: number) => simulateV2({ classId, seed, overri…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/2]⎯


 Test Files  1 failed | 18 passed | 2 skipped (21)
      Tests  2 failed | 323 passed | 2 expected fail | 4 skipped (331)
   Start at  06:35:31
   Duration  302.85s (tests 99%, import 1%)

/workspace/taskbar-hero/packages/game-rules:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @taskbar-hero/game-rules@0.0.0 test: `vitest run`
Exit status 1
```

Full game-rules suite exit 1: 18 files passed, 1 failed, 2 skipped; 323 tests passed, 2 timed out, 2 expected fail, 4 skipped. Runtime 302.85 seconds. Existing tests and timeouts were untouched.

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 17 Edge Function import maps
```

Exit 0; generated files have no diff.

```text
$ git diff --exit-code origin/main -- docs/content-v2.md packages/game-rules/src/v2/content/__snapshots__ packages/game-rules/src/v2/sim pnpm-lock.yaml
```

Exit 0; no output. `pnpm-workspace.yaml` is also unchanged.

```text
$ pnpm typecheck && pnpm lint && pnpm test && pnpm build

> taskbar-hero@0.0.0 typecheck /workspace/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/game-rules typecheck$ tsc --noEmit
packages/game-rules typecheck: Done
supabase/tests typecheck$ tsc --noEmit
packages/auth typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done

> taskbar-hero@0.0.0 lint /workspace/taskbar-hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/chain lint$ tsc --noEmit
packages/auth lint$ tsc --noEmit
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

> taskbar-hero@0.0.0 test /workspace/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/auth test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/auth
packages/chain test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/chain
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  06:37:22
packages/chain test:    Duration  980ms (import 73%, transform 12%, tests 8%, worker 7%)
packages/chain test:     Isolate  2 workers spawned · ~335ms startup each (spawn + environment, per file)
packages/chain test:              at least ~335ms faster with isolate: false — reuses workers across files instead of one per file
packages/chain test: Done
packages/game-rules test$ vitest run
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  06:37:22
packages/auth test:    Duration  1.95s (import 68%, tests 27%, transform 5%)
packages/auth test: Done
supabase/tests test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
supabase/tests test: stdout | v2/functions-state.test.ts > v2 Edge Function logic over migrated SQL > completes an eight-hour claim in under 500 ms
supabase/tests test: V9 eight-hour claim: 539.06 ms
supabase/tests test:  ❯ v2/functions-state.test.ts (15 tests | 1 failed) 7831ms
supabase/tests test:    ❯ v2 Edge Function logic over migrated SQL (9)
supabase/tests test:      × completes an eight-hour claim in under 500 ms 711ms
supabase/tests test: ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
supabase/tests test:  FAIL  v2/functions-state.test.ts > v2 Edge Function logic over migrated SQL > completes an eight-hour claim in under 500 ms
supabase/tests test: AssertionError: expected 539.0647439999993 to be less than 500
supabase/tests test:  ❯ v2/functions-state.test.ts:171:21
supabase/tests test:     169|     const elapsed = performance.now() - start;
supabase/tests test:     170|     console.log(`V9 eight-hour claim: ${elapsed.toFixed(2)} ms`);
supabase/tests test:     171|     expect(elapsed).toBeLessThan(500);
supabase/tests test:        |                     ^
supabase/tests test:     172|   });
supabase/tests test:     173| });
supabase/tests test: ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
supabase/tests test:  Test Files  1 failed | 16 passed (17)
supabase/tests test:       Tests  1 failed | 371 passed (372)
supabase/tests test:    Start at  06:37:25
supabase/tests test:    Duration  177.92s (tests 88%, import 11%, transform 1%)
supabase/tests test: Failed
/workspace/taskbar-hero/supabase/tests:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @taskbar-hero/supabase-tests@0.0.0 test: `vitest run`
Exit status 1
 ELIFECYCLE  Test failed. See above for more details.
```

Exit 1: typecheck and lint passed. Recursive tests failed the protected Supabase timing assertion; the remaining package work was stopped by pnpm's recursive failure. The `&&` chain did not reach build. No separate build or retry was started after the mandatory stop. The complete emitted output is above, including the failing local suite.

## Delivery status

The golden-only commit is `4d919ff` (its final baseline run is logged above). The second local commit contains the levers, appended tests and this report. All edits are within the eight-file allowlist. No push, PR, or Actions run: the mandatory all-checks-pass precondition for pushing is unmet. Work stops for the user to review the out-of-scope test blockers; no test changes are proposed here.
