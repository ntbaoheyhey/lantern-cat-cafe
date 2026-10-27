STATUS: DONE

# T2 — numbers, continuous demo loop, and key-wall server coverage

## 1. Per-piece acceptance

### Piece 1 — complete proposal, honestly NOT READY

PASS — measured **7 classes × seeds 1–10 × both claim steps (1 and 2 minutes)** under current and proposed configurations, 280 runs. Every run uses the inherited 1,800-active-minute horizon. Every class/chapter band, every seed duration and every guardrail verdict is pasted below. All 140 proposed runs complete ch1–5; no current run completes ch5 within the horizon. Missing milestones are included as infinity, never discarded.

PASS — [numbers proposal](../docs/proposals/numbers-v2.md) lists **all 73 numeric config leaves and three unchanged material filters**, current/proposed values, player effect and joint measured band. It is marked **NOT READY FOR SIGN-OFF**. Production config/content and the signature line are unchanged. The table includes `boss.firstClearKeys = 1`, daily keys = 3 and measured key-wait band **0 / 0 / 0 minutes** in every class/chapter/cadence.

PASS — whole-band guardrails are explicit. Proposed first-boss bands are **12.367 / 13.400 / 14.150 minutes** at step 1, **12.867 / 13.450 / 14.150** at step 2. Failures are chapter growth, boss first-attempt win rate, and one step-2 class-spread tail. Median-only historical checks continue to pass 7/9 at both cadences; the whole-band overlay passes 7/9 at step 1 and 6/9 at step 2. The overlay does not change old thresholds or tests.

PASS — costed content proposal: ch2 **22 → 39 kills/round**, 220 → 390 monsters/chapter (+170 versus the bounded proposal), is the lowest tested count that fixes all measured ch2 growth observations at both cadences. At 38, step-2 ratios are **1.286 / 1.406 / 1.556**, 2/70 outside. At 39, step-1 **1.305 / 1.420 / 1.569**, step-2 **1.320 / 1.430 / 1.586**, 140/140 inside. The ceiling is currently 30, so this is an unapplied content/count-ceiling exception proposal. A four-count package **[18,39,81,150,200]** fixes all measured chapter growth, adds 3,620 monsters versus the bounded proposal, but fails walking/boss guardrails. The proposal states these consequences.

NOT VERIFIED — a globally cheapest content change satisfying **all** targets. No tested complete fix exists. “Cheapest” in the proposal refers to tested engineering/content work (reused monsters and number edits, no new assets). The nearby 38/39 boundary is measured; it is not a proof that the entire configuration space is infeasible. NOT READY is an explicitly allowed outcome of this mission.

### Piece 2 — continuous visible demo player path

PASS — two new `v2-loop` cases follow the actual UI continuously: choose Warrior → idle/automatic claim → equip best → reload → craft → salvage the newly appended visible row → chapter boss reach → no-key wall/count/source text → reload → next-day claim awards the key → Fight → arena → victory → first-clear chest/rewards/Collect → chapter 2 → Relic panel → wallet-required message with the Moon Pearl readout unchanged. Assertions use visible text, roles, enabled states and rendered row counts, never save internals. No fixture is reinstalled after actions.

PASS — one case uses reduced motion. The existing fixture builder supplies a **stocked L1/ch1/r1 profile** (catalog Legendary gear and craft materials), demo base seed 1 and counter 0. This deliberately bypasses economy/RNG acquisition, not player actions. Existing `chooseClass` equips its best owned weapon. Fixed clock/claim steps, not repeated gameplay or retries, select the deterministic trajectory. Init seeding happens only when no save exists, so reload exercises actual persistence. Current defaults still show daily 1 key, 1/150 cleared-chapter drops, and no first-clear source.

PASS — no retry, skip, timeout increase or UI/config change was added. Existing projects/baseURLs and build guard are used unchanged. Full browser counts for three final serial runs are pasted in section 5. Classic is included. No screenshots were requested (`SCREENSHOTS` unset); after browser checks only this mission report may change under reports.

### Piece 3 — async override plumbing and server wall

PASS — `withConfigV2` keeps overrides active and rejects overlapping/nested overrides until a returned promise/thenable settles; it restores on resolution, rejection, synchronous throw and a throwing `then` getter. Ordinary synchronous return identity/restoration are preserved. Four new async/edge-case tests pass. Existing `sim.test.ts` is byte-identical to main; its original synchronous override tests pass. No numeric default changed.

PASS — five additional HTTP-over-migrated-PGlite cases: no-key refusal with lever 0/1 is 409 with zero state/audit writes; first-clear grant with lever 0/1; no refund on rematches; entry is spent before credit; cap-full refund is credited after the spend. The complete boss file passes **18 tests**. API documentation gives exact response shapes, key sources, refusal ordering and 0/1/5-key examples. Local SQL only, no live service/database writes.

## 2. Problems found and fixed

- FOUND: old median reports hid seed tails; Archer seed 1, step 2 has a ch5 duration of **26.650 min** and cumulative deviation **+17.951%**, although class medians pass. FIXED in evidence/reporting by checking all seed observations, not by retuning production numbers.
- FOUND: chapter-growth and boss-pressure failures survive the wider cohort. Ch2 has 0/70 ratios inside 1.3–2 at each cadence; ch1–4 first attempts are 100% wins in every class. REPORTED, not falsely marked balanced.
- FOUND: synchronous `finally` restored simulation overrides before awaited Edge code could read them. FIXED with settlement-bound restoration and a transaction lock, tested on resolve/reject.
- FOUND: common e2e fixture initialization can overwrite saves on reload. AVOIDED in the new fixture by writing only if no save exists; two reload transitions assert persistent visible state.
- During test authoring the stock profile correctly selected its owned Legendary weapon rather than granting a starter; assertions were corrected to the actual fixture precondition. Salvage rows expose no source label, so the test identifies the new rendered row by append/count and visible Common/Weapon text. No UI was changed.
- During test authoring, `innerText` excluded an icon title while the matcher read `textContent`. FIXED by comparing the material readout with `useInnerText: true`; the unchanged value remains asserted.
- One validation run was invalidated by my concurrent production build: Vite emptied `apps/web/dist`, deleting the nested `dist/e2e-4173` assets used by the classic preview. Its blank pages caused classic failures. Builds finished; three fresh serial browser runs follow. No retry/timeout or product workaround was added.
- The standalone full-seed measurement was moved out of an exploratory Vitest batch into `measure.mjs`; the exploratory batch was stopped. This avoids putting a long measurement into the unit-test timeout. The final band unit tests remain ordinary always-running tests.
- The band renderer was added to the existing simulator report module so `gen:deno` introduces no new runtime import-map paths; the final generated maps have zero drift.

## 3. Tier 2 changes

None. Every committed file is in the mission zone. No production UI, runtime game logic, package/dependency, lock/workspace, migration, auth, contract, workflow or config-number change. Generated import maps are unchanged.

## 4. Final diff

`git diff --stat origin/main...HEAD` (updated after report commit):

```text
apps/web/e2e/support/t2-loop-fixture.ts            |  32 +
 apps/web/e2e/v2/t2-player-loop.spec.ts             | 112 +++
 docs/api-v2.md                                     |  33 +
 docs/proposals/numbers-v2.md                       | 798 +++++++++------------
 packages/game-rules/src/v2/sim/bands.test.ts       |  58 ++
 .../game-rules/src/v2/sim/config-async.test.ts     |  65 ++
 packages/game-rules/src/v2/sim/config.ts           |  19 +-
 packages/game-rules/src/v2/sim/measure.mjs         |  29 +
 packages/game-rules/src/v2/sim/report.ts           |  55 +-
 reports/t2-numbers-e2e.md                          | 725 +++++++++++++++++++
 supabase/tests/v2/functions-boss.test.ts           |  66 ++
 11 files changed, 1526 insertions(+), 466 deletions(-)
```

`git diff --name-only origin/main...HEAD`:

```text
apps/web/e2e/support/t2-loop-fixture.ts
apps/web/e2e/v2/t2-player-loop.spec.ts
docs/api-v2.md
docs/proposals/numbers-v2.md
packages/game-rules/src/v2/sim/bands.test.ts
packages/game-rules/src/v2/sim/config-async.test.ts
packages/game-rules/src/v2/sim/config.ts
packages/game-rules/src/v2/sim/measure.mjs
packages/game-rules/src/v2/sim/report.ts
reports/t2-numbers-e2e.md
supabase/tests/v2/functions-boss.test.ts
```

## 5. Real verification output

Corepack is absent. Every pnpm invocation used the authorized `npx -y pnpm@10.28.0` fallback. Node v26.11.1. Chromium was already installed. No build-script approval was requested; frozen install ignored optional scripts without modifying lock/workspace files.

### Toolchain / install

```text
10.28.0
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
Done in 295ms using pnpm v10.28.0
```

### Generated Deno drift

```text
> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/t2-numbers-e2e/taskbar hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

`git diff --exit-code -- supabase/functions`: exit 0, no output.

### Typecheck / lint

```text
> taskbar-hero@0.0.0 typecheck /Users/bao/.codex/worktrees/t2-numbers-e2e/taskbar hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/auth typecheck: Done
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done
```

```text
> taskbar-hero@0.0.0 lint /Users/bao/.codex/worktrees/t2-numbers-e2e/taskbar hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/chain lint$ tsc --noEmit
packages/auth lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
packages/chain lint: Done
packages/auth lint: Done
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done
```

### Full unit/integration suite

```text
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Duration  822ms (import 45%, transform 27%, worker 15%, tests 12%, environment 1%)
packages/chain test: Done
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Duration  1.93s (import 62%, tests 30%, transform 8%)
packages/auth test: Done
supabase/tests test:  Test Files  21 passed (21)
supabase/tests test:       Tests  442 passed (442)
supabase/tests test:    Duration  11.58s (tests 84%, import 14%, transform 1%)
supabase/tests test: Done
packages/game-rules test:  Test Files  22 passed | 3 skipped (25)
packages/game-rules test:       Tests  339 passed | 2 expected fail | 11 skipped (352)
packages/game-rules test:    Duration  31.94s (tests 95%, import 4%)
packages/game-rules test: Done
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Duration  177ms (transform 46%, import 42%, tests 7%, worker 4%)
packages/api-contract test: Done
apps/web test:  Test Files  89 passed (89)
apps/web test:       Tests  1140 passed (1140)
apps/web test:    Duration  8.27s (environment 53%, tests 33%, import 12%, transform 2%, worker 1%)
apps/web test: Done
```

The 11 opt-in measurement skips and 2 expected failures in game-rules already exist on main. T2 adds no skip, expected failure or weakened assertion. The new tests run normally.

### Focused regression checks

```text
RUN  v5.0.5 /Users/bao/.codex/worktrees/t2-numbers-e2e/taskbar hero/packages/game-rules


 Test Files  2 passed (2)
      Tests  15 passed (15)
   Start at  11:07:52
   Duration  3.66s (tests 96%, transform 3%, import 1%)
```

```text
RUN  v5.0.5 /Users/bao/.codex/worktrees/t2-numbers-e2e/taskbar hero/packages/game-rules


 Test Files  2 passed (2)
      Tests  9 passed (9)
   Start at  11:15:10
   Duration  207ms (transform 47%, import 31%, tests 17%, worker 5%)
```

```text
RUN  v5.0.5 /Users/bao/.codex/worktrees/t2-numbers-e2e/taskbar hero/supabase/tests


 Test Files  1 passed (1)
      Tests  18 passed (18)
   Start at  11:08:39
   Duration  2.04s (tests 61%, import 22%, transform 17%)
```

### Build and explicit classic build

```text
packages/chain build: Done
packages/auth build: Done
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build: Done
apps/web build: ✓ built in 335ms
apps/web build: Done
```

```text
> @taskbar-hero/web@0.0.0 build /Users/bao/.codex/worktrees/t2-numbers-e2e/taskbar hero/apps/web
> tsc --noEmit && vite build
✓ built in 523ms
```

### Full browser suite, three final consecutive serial runs

Each command is `cd apps/web && npx -y pnpm@10.28.0 test:e2e`, preceded by `pkill -f "vite preview" || true`. No production build or second browser suite runs alongside them.

Run 1:

```text
Running 158 tests using 6 workers
  ✓    5 [v2-loop] › e2e/v2/t2-player-loop.spec.ts:11:38 › continuous stocked demo loop (3.3s)
  ✓   16 [v2-loop] › e2e/v2/t2-player-loop.spec.ts:11:38 › continuous stocked demo loop with reduced motion (3.8s)
  158 passed (40.1s)
```

Project counts: {'classic': 38, 'v2-loop': 17, 'stage-layout': 103}.

Run 2:

```text
Running 158 tests using 6 workers
  ✓    5 [v2-loop] › e2e/v2/t2-player-loop.spec.ts:11:38 › continuous stocked demo loop (3.5s)
  ✓   21 [v2-loop] › e2e/v2/t2-player-loop.spec.ts:11:38 › continuous stocked demo loop with reduced motion (3.7s)
  158 passed (41.9s)
```

Project counts: {'classic': 38, 'v2-loop': 17, 'stage-layout': 103}.

Run 3:

```text
Running 158 tests using 6 workers
  ✓    6 [v2-loop] › e2e/v2/t2-player-loop.spec.ts:11:38 › continuous stocked demo loop (3.8s)
  ✓   22 [v2-loop] › e2e/v2/t2-player-loop.spec.ts:11:38 › continuous stocked demo loop with reduced motion (3.6s)
  158 passed (42.6s)
```

Project counts: {'classic': 38, 'v2-loop': 17, 'stage-layout': 103}.

Earlier full runs 1 and 2 each passed 158 tests. The invalidated concurrent-build run is retained honestly:

```text
32 failed
  126 passed (1.1m)
```

### Link baseline / final and protected files

```text
Checked 48 markdown files and 609 links/paths.

✓ All links, image paths, and backticked repo paths exist on disk.

exit 0
```

```text
Checked 48 markdown files and 610 links/paths.

✓ All links, image paths, and backticked repo paths exist on disk.
```

The named baseline warning is stale on this main: it has 0 broken links, not ~58. The final result must also be 0. The temporary missing report link during authoring is resolved by this report.

Protected-file audit: `git diff --exit-code origin/main -- packages/game-rules/src/v2/config.ts packages/game-rules/src/v2/sim/sim.test.ts apps/web/src supabase/migrations .github pnpm-lock.yaml pnpm-workspace.yaml` exits 0. Signature text remains exactly `User: ____ (approved / changes)` once. `git diff --check` exits 0.

### Simulator CLI

```text
current step 1: 70 runs, 0 completed all chapters; config restored
current step 2: 70 runs, 0 completed all chapters; config restored
proposal step 1: 70 runs, 70 completed all chapters; config restored
proposal step 2: 70 runs, 70 completed all chapters; config restored
```

```text
content step 1: 70 runs, 70 completed all chapters; config restored
content step 2: 70 runs, 70 completed all chapters; config restored
```

```text
content step 1: 70 runs, 70 completed all chapters; config restored
content step 2: 70 runs, 70 completed all chapters; config restored
```

```text
content step 1: 70 runs, 70 completed all chapters; config restored
content step 2: 70 runs, 70 completed all chapters; config restored
```

```text
content step 1: 70 runs, 70 completed all chapters; config restored
content step 2: 70 runs, 70 completed all chapters; config restored
```

## 6. NOT verified

No live Supabase HTTP service/database, external wallet signing, Relic minting, deployment or human playtest. Migrated PGlite exercises the actual server route/SQL locally with a fake auth boundary. Boss replay duration is reported separately and is not added to the simulator’s active pacing minutes. The simulator’s chest-item selection predates T2 and mirrors chest groups; full item-identity parity with the runtime chest roller is not established. The stocked browser save does not validate natural acquisition/balance pacing. A globally cheapest complete content fix and an all-target passing numeric proposal are not established. The allowed NOT READY decision is explicit.

## 7. Human decisions / suspicious findings outside the zone

- Keep production numbers unsigned/unapplied. Decide whether to permit per-chapter count-ceiling exceptions and recalibrate XP/walking/boss content together. A count-only fix is not a balanced game.
- All content-package runs hit the level cap and win every first boss attempt; adding thousands of monsters alone shifts failures instead of resolving sign-off.
- Existing preview output folders are nested beneath the normal build output; ordinary builds can invalidate active browser previews. Keep validation sequential; no config/UI change was made for this task.
- Browser tests correctly describe the current first-clear default as off. Approving a later numbers application must also update visible first-clear-source expectations then.
- No GitHub Actions run, PR, merge, deploy or public/audience change was requested or performed.

## 8. Branch, commits and reproduction

Branch: `ai/codex-t2-numbers-e2e`. Freshly fetched main base: `3f7c5ee6c668d3015c49fdf4b4a5e2c82e4331fc`. Implementation commit: `b1b54f018721b1409676fb9e01e2b984c5b46d0d`. The final report commit is the branch HEAD (`git rev-parse HEAD`); the delivery message gives its exact hash.
Git author for mission commits: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`. Work happened in an isolated managed worktree; the pre-existing dirty user checkout was preserved.

Reproduce with the frozen install and commands above. The simulator evidence commands are in the proposal’s reproduction section. For only the new browser cases: `cd apps/web && npx -y pnpm@10.28.0 test:e2e --project=v2-loop e2e/v2/t2-player-loop.spec.ts`. Do not run a normal production build concurrently with browser preview tests.

## Pasted bands — all classes/chapters, seeds 1–10

Each band is min / median / max across the ten seeds for the named class/chapter. “not reached” is infinity, not an omitted observation. Rates use all ten first attempts; fight bands include every attempted fight. Whole-band guardrails are shown separately from historical median/cohort checks.

### proposal, step 1

| class | ch | duration min (min / median / max) | cumulative min | growth per seed | duration 10–360 | growth 1.3–2 | first wins (40–90%) | fight sec band (≤180) | key wait min |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| warrior | 1 | 12.450 / 13.150 / 13.150 | 12.450 / 13.150 / 13.150 | — | PASS | — | 10/10 FAIL | 28.240 / 33.240 / 35.240 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 2 | 10.850 / 11.433 / 11.683 | 23.300 / 24.567 / 24.833 | 0.854 / 0.872 / 0.888 | PASS | FAIL | 10/10 FAIL | 33.499 / 37.236 / 40.320 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 3 | 11.167 / 11.525 / 12.467 | 35.533 / 36.000 / 37.000 | 0.956 / 1.015 / 1.127 | PASS | FAIL | 10/10 FAIL | 38.512 / 43.752 / 49.184 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 4 | 11.317 / 11.883 / 12.683 | 47.233 / 47.992 / 48.717 | 0.940 / 1.018 / 1.116 | PASS | FAIL | 10/10 FAIL | 39.298 / 49.939 / 55.792 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 5 | 11.417 / 12.317 / 14.833 | 58.983 / 60.150 / 63.500 | 0.955 / 1.047 / 1.170 | PASS | FAIL | 10/10 FAIL | 66.018 / 76.633 / 106.381 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 1 | 12.633 / 13.250 / 13.750 | 12.633 / 13.250 / 13.750 | — | PASS | — | 10/10 FAIL | 25.364 / 34.120 / 36.920 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 2 | 11.033 / 12.800 / 13.067 | 23.667 / 26.258 / 26.733 | 0.873 / 0.939 / 0.994 | PASS | FAIL | 10/10 FAIL | 32.034 / 37.864 / 42.604 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 3 | 12.217 / 12.600 / 12.817 | 36.150 / 38.825 / 39.417 | 0.953 / 0.983 / 1.131 | PASS | FAIL | 10/10 FAIL | 41.034 / 46.192 / 50.277 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 4 | 12.967 / 13.850 / 14.133 | 50.100 / 52.417 / 53.550 | 1.061 / 1.098 / 1.120 | PASS | FAIL | 10/10 FAIL | 44.751 / 54.410 / 61.669 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 5 | 12.633 / 14.067 / 15.083 | 64.117 / 66.333 / 68.633 | 0.927 / 1.024 / 1.076 | PASS | FAIL | 10/10 FAIL | 51.662 / 87.350 / 102.816 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 1 | 12.367 / 13.233 / 13.233 | 12.367 / 13.233 / 13.233 | — | PASS | — | 10/10 FAIL | 29.458 / 31.758 / 35.340 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 2 | 10.750 / 12.192 / 12.300 | 23.117 / 25.117 / 25.533 | 0.869 / 0.926 / 0.952 | PASS | FAIL | 10/10 FAIL | 29.182 / 33.876 / 38.194 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 3 | 10.850 / 11.450 / 11.750 | 34.633 / 36.700 / 37.100 | 0.923 / 0.942 / 1.071 | PASS | FAIL | 10/10 FAIL | 30.758 / 37.680 / 43.475 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 4 | 10.967 / 11.392 / 12.700 | 46.983 / 48.033 / 49.500 | 0.966 / 1.016 / 1.103 | PASS | FAIL | 10/10 FAIL | 31.604 / 46.964 / 52.493 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 5 | 10.883 / 12.017 / 13.583 | 58.283 / 59.975 / 62.267 | 0.910 / 1.035 / 1.124 | PASS | FAIL | 10/10 FAIL | 33.693 / 73.442 / 90.762 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 1 | 12.433 / 13.367 / 13.400 | 12.433 / 13.367 / 13.400 | — | PASS | — | 10/10 FAIL | 30.095 / 33.300 / 35.500 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 2 | 10.983 / 11.950 / 12.383 | 23.417 / 25.283 / 25.783 | 0.883 / 0.901 / 0.954 | PASS | FAIL | 10/10 FAIL | 30.227 / 37.687 / 40.840 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 3 | 11.550 / 12.008 / 12.067 | 35.450 / 37.125 / 37.383 | 0.933 / 1.001 / 1.096 | PASS | FAIL | 10/10 FAIL | 40.864 / 44.047 / 49.963 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 4 | 11.217 / 11.883 / 12.867 | 47.500 / 48.817 / 50.133 | 0.936 / 1.006 / 1.095 | PASS | FAIL | 10/10 FAIL | 42.570 / 50.259 / 56.991 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 5 | 11.433 / 12.708 / 14.300 | 59.617 / 61.642 / 64.183 | 0.956 / 1.080 / 1.224 | PASS | FAIL | 10/10 FAIL | 50.935 / 82.831 / 116.409 PASS | 0.000 / 0.000 / 0.000 |
| archer | 1 | 13.283 / 13.867 / 13.983 | 13.283 / 13.867 / 13.983 | — | PASS | — | 10/10 FAIL | 28.777 / 33.800 / 35.660 PASS | 0.000 / 0.000 / 0.000 |
| archer | 2 | 11.683 / 13.492 / 13.883 | 24.967 / 27.358 / 27.783 | 0.869 / 0.970 / 1.010 | PASS | FAIL | 10/10 FAIL | 33.629 / 38.363 / 40.671 PASS | 0.000 / 0.000 / 0.000 |
| archer | 3 | 12.650 / 12.800 / 13.067 | 37.617 / 40.283 / 40.567 | 0.915 / 0.967 / 1.085 | PASS | FAIL | 10/10 FAIL | 35.655 / 43.330 / 50.623 PASS | 0.000 / 0.000 / 0.000 |
| archer | 4 | 12.200 / 13.458 / 14.150 | 51.750 / 53.375 / 54.317 | 0.961 / 1.056 / 1.119 | PASS | FAIL | 10/10 FAIL | 42.020 / 50.106 / 58.560 PASS | 0.000 / 0.000 / 0.000 |
| archer | 5 | 12.817 / 13.617 / 15.867 | 66.117 / 66.775 / 69.500 | 0.929 / 1.059 / 1.158 | PASS | FAIL | 9/10 PASS | 62.666 / 81.438 / 105.330 PASS | 0.000 / 0.000 / 0.000 |
| witch | 1 | 13.700 / 14.058 / 14.150 | 13.700 / 14.058 / 14.150 | — | PASS | — | 10/10 FAIL | 29.464 / 33.850 / 36.050 PASS | 0.000 / 0.000 / 0.000 |
| witch | 2 | 13.200 / 13.458 / 13.717 | 26.900 / 27.467 / 27.867 | 0.936 / 0.964 / 0.969 | PASS | FAIL | 10/10 FAIL | 30.945 / 37.692 / 42.559 PASS | 0.000 / 0.000 / 0.000 |
| witch | 3 | 12.983 / 14.192 / 15.117 | 39.883 / 41.717 / 42.583 | 0.978 / 1.043 / 1.120 | PASS | FAIL | 10/10 FAIL | 38.723 / 44.392 / 50.110 PASS | 0.000 / 0.000 / 0.000 |
| witch | 4 | 13.567 / 14.175 / 15.917 | 53.767 / 56.025 / 58.500 | 0.975 / 1.044 / 1.136 | PASS | FAIL | 10/10 FAIL | 47.108 / 51.884 / 57.069 PASS | 0.000 / 0.000 / 0.000 |
| witch | 5 | 14.333 / 14.867 / 17.417 | 68.100 / 70.967 / 75.917 | 0.925 / 1.066 / 1.169 | PASS | FAIL | 10/10 FAIL | 74.656 / 86.917 / 114.525 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 1 | 13.783 / 14.142 / 14.150 | 13.783 / 14.142 / 14.150 | — | PASS | — | 10/10 FAIL | 28.110 / 35.160 / 37.110 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 2 | 11.767 / 13.317 / 13.667 | 25.550 / 27.408 / 27.817 | 0.837 / 0.941 / 0.968 | PASS | FAIL | 10/10 FAIL | 32.173 / 36.551 / 41.610 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 3 | 12.583 / 13.058 / 13.750 | 38.533 / 40.467 / 41.150 | 0.962 / 0.984 / 1.103 | PASS | FAIL | 10/10 FAIL | 34.812 / 43.660 / 50.177 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 4 | 12.967 / 14.350 / 15.033 | 51.983 / 54.717 / 55.733 | 0.997 / 1.095 / 1.158 | PASS | FAIL | 10/10 FAIL | 38.787 / 51.836 / 59.684 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 5 | 13.783 / 14.517 / 16.250 | 66.200 / 69.233 / 71.983 | 0.947 / 1.019 / 1.114 | PASS | FAIL | 10/10 FAIL | 46.350 / 79.952 / 102.744 PASS | 0.000 / 0.000 / 0.000 |

| guardrail | whole-band verdict | evidence |
| --- | --- | --- |
| first-boss | PASS | Historical median/cohort verdict: PASS. warrior 13.2m; guardian 13.3m; rogue 13.2m; hunter 13.4m; archer 13.9m; witch 14.1m; alchemist 14.1m |
| chapter-growth | FAIL | Historical median/cohort verdict: FAIL. warrior ch2 0.87x; warrior ch3 1.01x; warrior ch4 1.03x; warrior ch5 1.04x; guardian ch2 0.97x; guardian ch3 0.98x; guardian ch4 1.10x; guardian ch5 1.02x; rogue ch2 0.92x; rogue ch3 0.94x; rogue ch4 0.99x; rogue ch5 1.05x; hunter ch2 0.89x; hunter ch3 1.00x; hunter ch4 0.99x; hunter ch5 1.07x; archer ch2 0.97x; archer ch3 0.95x; archer ch4 1.05x; archer ch5 1.01x; witch ch2 0.96x; witch ch3 1.05x; witch ch4 1.00x; witch ch5 1.05x; alchemist ch2 0.94x; alchemist ch3 0.98x; alchemist ch4 1.10x; alchemist ch5 1.01x |
| class-spread | PASS | Historical median/cohort verdict: PASS. ch1 range 7.4%; ch2 range 11.0%; ch3 range 14.7%; ch4 range 15.3%; ch5 range 16.6%; warrior ch1 -1.6%; guardian ch1 -0.9%; rogue ch1 -1.0%; hunter ch1 0.0%; archer ch1 3.7%; witch ch1 5.2%; alchemist ch1 5.8%; warrior ch2 -6.4%; guardian ch2 0.0%; rogue ch2 -4.3%; hunter ch2 -3.7%; archer ch2 4.2%; witch ch2 4.6%; alchemist ch2 4.4%; warrior ch3 -7.3%; guardian ch3 0.0%; rogue ch3 -5.5%; hunter ch3 -4.4%; archer ch3 3.8%; witch ch3 7.4%; alchemist ch3 4.2%; warrior ch4 -8.4%; guardian ch4 0.0%; rogue ch4 -8.4%; hunter ch4 -6.9%; archer ch4 1.8%; witch ch4 6.9%; alchemist ch4 4.4%; warrior ch5 -9.3%; guardian ch5 0.0%; rogue ch5 -9.6%; hunter ch5 -7.1%; archer ch5 0.7%; witch ch5 7.0%; alchemist ch5 4.4% |
| chapter-bounds | PASS | Historical median/cohort verdict: PASS. warrior ch1 13.2m; warrior ch2 11.4m; warrior ch3 11.5m; warrior ch4 11.9m; warrior ch5 12.3m; guardian ch1 13.3m; guardian ch2 12.8m; guardian ch3 12.6m; guardian ch4 13.9m; guardian ch5 14.1m; rogue ch1 13.2m; rogue ch2 12.2m; rogue ch3 11.5m; rogue ch4 11.4m; rogue ch5 12.0m; hunter ch1 13.4m; hunter ch2 11.9m; hunter ch3 12.0m; hunter ch4 11.9m; hunter ch5 12.7m; archer ch1 13.9m; archer ch2 13.5m; archer ch3 12.8m; archer ch4 13.5m; archer ch5 13.6m; witch ch1 14.1m; witch ch2 13.5m; witch ch3 14.2m; witch ch4 14.2m; witch ch5 14.9m; alchemist ch1 14.1m; alchemist ch2 13.3m; alchemist ch3 13.1m; alchemist ch4 14.4m; alchemist ch5 14.5m |
| never-stuck | PASS | Historical median/cohort verdict: PASS. 0/70 runs stuck |
| craft-salvage-loss | PASS | Historical median/cohort verdict: PASS. rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 |
| walk-share | PASS | Historical median/cohort verdict: PASS. warrior ch1 r1 L1.0: 21.1%; warrior ch3 r5 L41.0: 36.7%; guardian ch1 r1 L1.0: 17.5%; guardian ch3 r5 L40.5: 37.1%; rogue ch1 r1 L1.0: 17.5%; rogue ch3 r5 L40.5: 37.5%; hunter ch1 r1 L1.0: 19.4%; hunter ch3 r5 L41.0: 36.9%; archer ch1 r1 L1.0: 18.0%; archer ch3 r5 L41.0: 33.4%; witch ch1 r1 L1.0: 17.1%; witch ch3 r5 L41.0: 31.5%; alchemist ch1 r1 L1.0: 17.8%; alchemist ch3 r5 L41.0: 35.8% |
| boss-check | FAIL | Historical median/cohort verdict: FAIL. warrior ch1 first win 100.0%, median 33.24s; warrior ch2 first win 100.0%, median 37.24s; warrior ch3 first win 100.0%, median 43.75s; warrior ch4 first win 100.0%, median 49.94s; warrior ch5 first win 100.0%, median 76.63s; guardian ch1 first win 100.0%, median 34.12s; guardian ch2 first win 100.0%, median 37.86s; guardian ch3 first win 100.0%, median 46.19s; guardian ch4 first win 100.0%, median 54.41s; guardian ch5 first win 100.0%, median 87.35s; rogue ch1 first win 100.0%, median 31.76s; rogue ch2 first win 100.0%, median 33.88s; rogue ch3 first win 100.0%, median 37.68s; rogue ch4 first win 100.0%, median 46.96s; rogue ch5 first win 100.0%, median 73.44s; hunter ch1 first win 100.0%, median 33.30s; hunter ch2 first win 100.0%, median 37.69s; hunter ch3 first win 100.0%, median 44.05s; hunter ch4 first win 100.0%, median 50.26s; hunter ch5 first win 100.0%, median 82.83s; archer ch1 first win 100.0%, median 33.80s; archer ch2 first win 100.0%, median 38.36s; archer ch3 first win 100.0%, median 43.33s; archer ch4 first win 100.0%, median 50.11s; archer ch5 first win 90.0%, median 81.44s; witch ch1 first win 100.0%, median 33.85s; witch ch2 first win 100.0%, median 37.69s; witch ch3 first win 100.0%, median 44.39s; witch ch4 first win 100.0%, median 51.88s; witch ch5 first win 100.0%, median 86.92s; alchemist ch1 first win 100.0%, median 35.16s; alchemist ch2 first win 100.0%, median 36.55s; alchemist ch3 first win 100.0%, median 43.66s; alchemist ch4 first win 100.0%, median 51.84s; alchemist ch5 first win 100.0%, median 79.95s |
| guardrails | PASS | Historical median/cohort verdict: PASS. All numeric leaves within 0.33–3x except firstClearKeys=0/1; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 |

### proposal, step 2

| class | ch | duration min (min / median / max) | cumulative min | growth per seed | duration 10–360 | growth 1.3–2 | first wins (40–90%) | fight sec band (≤180) | key wait min |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| warrior | 1 | 12.867 / 12.983 / 12.983 | 12.867 / 12.983 / 12.983 | — | PASS | — | 10/10 FAIL | 32.240 / 34.240 / 35.240 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 2 | 11.267 / 11.525 / 11.883 | 24.167 / 24.508 / 24.800 | 0.868 / 0.888 / 0.920 | PASS | FAIL | 10/10 FAIL | 33.499 / 36.378 / 39.409 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 3 | 11.350 / 11.942 / 12.300 | 35.633 / 36.450 / 36.783 | 0.976 / 1.036 / 1.092 | PASS | FAIL | 10/10 FAIL | 35.120 / 43.693 / 47.054 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 4 | 10.633 / 12.067 / 13.133 | 46.367 / 48.500 / 49.800 | 0.937 / 1.009 / 1.145 | PASS | FAIL | 10/10 FAIL | 39.017 / 51.170 / 54.638 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 5 | 11.267 / 12.167 / 14.733 | 57.633 / 61.075 / 64.183 | 0.893 / 1.021 / 1.177 | PASS | FAIL | 10/10 FAIL | 52.876 / 79.893 / 111.512 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 1 | 13.050 / 13.467 / 13.467 | 13.050 / 13.467 / 13.467 | — | PASS | — | 10/10 FAIL | 31.956 / 34.120 / 36.920 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 2 | 11.333 / 12.483 / 13.067 | 24.667 / 25.908 / 26.533 | 0.850 / 0.927 / 1.001 | PASS | FAIL | 10/10 FAIL | 34.498 / 39.083 / 41.329 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 3 | 12.300 / 12.567 / 12.950 | 37.050 / 38.533 / 39.333 | 0.941 / 1.013 / 1.093 | PASS | FAIL | 10/10 FAIL | 39.972 / 46.297 / 48.474 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 4 | 12.717 / 13.567 / 13.983 | 50.583 / 51.767 / 52.733 | 1.012 / 1.080 / 1.119 | PASS | FAIL | 10/10 FAIL | 38.533 / 51.375 / 56.361 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 5 | 12.367 / 13.733 / 15.517 | 63.933 / 65.367 / 68.150 | 0.902 / 1.017 / 1.110 | PASS | FAIL | 10/10 FAIL | 55.301 / 81.135 / 125.822 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 1 | 13.217 / 13.267 / 13.267 | 13.217 / 13.267 / 13.267 | — | PASS | — | 10/10 FAIL | 29.900 / 32.940 / 35.340 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 2 | 11.433 / 12.200 / 12.517 | 24.700 / 25.467 / 25.783 | 0.862 / 0.920 / 0.943 | PASS | FAIL | 10/10 FAIL | 30.177 / 34.678 / 38.923 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 3 | 11.050 / 11.442 / 11.883 | 35.967 / 37.017 / 37.450 | 0.909 / 0.946 / 0.987 | PASS | FAIL | 10/10 FAIL | 31.867 / 36.124 / 42.006 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 4 | 11.133 / 11.758 / 12.550 | 47.233 / 48.483 / 49.833 | 0.963 / 1.018 / 1.112 | PASS | FAIL | 10/10 FAIL | 34.006 / 40.205 / 54.547 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 5 | 11.050 / 11.900 / 14.300 | 59.183 / 60.308 / 64.133 | 0.907 / 1.057 / 1.158 | PASS | FAIL | 10/10 FAIL | 41.321 / 68.974 / 102.321 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 1 | 12.933 / 13.383 / 13.383 | 12.933 / 13.383 / 13.383 | — | PASS | — | 10/10 FAIL | 31.422 / 33.300 / 35.500 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 2 | 11.383 / 11.883 / 12.100 | 24.367 / 25.200 / 25.483 | 0.874 / 0.889 / 0.927 | PASS | FAIL | 10/10 FAIL | 31.941 / 38.757 / 41.382 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 3 | 11.717 / 11.958 / 12.450 | 36.267 / 37.125 / 37.733 | 0.983 / 1.006 / 1.046 | PASS | FAIL | 10/10 FAIL | 36.498 / 45.586 / 49.449 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 4 | 11.317 / 12.483 / 13.017 | 48.217 / 49.583 / 50.617 | 0.963 / 1.031 / 1.091 | PASS | FAIL | 10/10 FAIL | 40.885 / 47.395 / 57.250 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 5 | 11.733 / 12.375 / 14.100 | 59.950 / 62.067 / 64.717 | 0.951 / 1.007 / 1.134 | PASS | FAIL | 10/10 FAIL | 73.430 / 82.789 / 111.592 PASS | 0.000 / 0.000 / 0.000 |
| archer | 1 | 13.400 / 13.750 / 13.750 | 13.400 / 13.750 / 13.750 | — | PASS | — | 10/10 FAIL | 30.813 / 33.485 / 35.600 PASS | 0.000 / 0.000 / 0.000 |
| archer | 2 | 11.717 / 12.658 / 13.683 | 25.117 / 26.408 / 27.433 | 0.874 / 0.921 / 1.000 | PASS | FAIL | 10/10 FAIL | 32.478 / 36.687 / 39.923 PASS | 0.000 / 0.000 / 0.000 |
| archer | 3 | 12.283 / 12.758 / 13.133 | 37.867 / 39.058 / 40.467 | 0.941 / 0.981 / 1.088 | PASS | FAIL | 10/10 FAIL | 36.476 / 41.867 / 46.708 PASS | 0.000 / 0.000 / 0.000 |
| archer | 4 | 13.167 / 13.467 / 14.283 | 51.783 / 52.375 / 54.367 | 1.027 / 1.073 / 1.107 | PASS | FAIL | 10/10 FAIL | 44.306 / 53.311 / 63.165 PASS | 0.000 / 0.000 / 0.000 |
| archer | 5 | 13.017 / 14.167 / 26.650 | 64.800 / 66.700 / 80.383 | 0.955 / 1.064 / 1.866 | PASS | FAIL | 9/10 PASS | 53.674 / 102.750 / 118.998 PASS | 0.000 / 0.000 / 0.000 |
| witch | 1 | 13.550 / 14.142 / 14.150 | 13.550 / 14.142 / 14.150 | — | PASS | — | 10/10 FAIL | 31.250 / 32.850 / 36.050 PASS | 0.000 / 0.000 / 0.000 |
| witch | 2 | 12.450 / 13.192 / 13.417 | 26.000 / 27.325 / 27.483 | 0.903 / 0.932 / 0.958 | PASS | FAIL | 10/10 FAIL | 31.746 / 36.017 / 40.111 PASS | 0.000 / 0.000 / 0.000 |
| witch | 3 | 12.933 / 14.125 / 14.617 | 39.200 / 41.367 / 41.867 | 0.970 / 1.072 / 1.129 | PASS | FAIL | 10/10 FAIL | 39.526 / 42.990 / 48.971 PASS | 0.000 / 0.000 / 0.000 |
| witch | 4 | 13.300 / 14.133 / 16.467 | 53.233 / 55.533 / 58.183 | 0.968 / 1.024 / 1.149 | PASS | FAIL | 10/10 FAIL | 46.781 / 51.100 / 60.439 PASS | 0.000 / 0.000 / 0.000 |
| witch | 5 | 14.450 / 14.808 / 19.250 | 67.783 / 70.492 / 77.433 | 0.968 / 1.053 / 1.169 | PASS | FAIL | 9/10 PASS | 54.400 / 91.122 / 120.000 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 1 | 13.700 / 13.933 / 13.933 | 13.700 / 13.933 / 13.933 | — | PASS | — | 10/10 FAIL | 30.126 / 34.537 / 36.510 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 2 | 12.733 / 13.183 / 13.467 | 26.667 / 27.058 / 27.400 | 0.914 / 0.950 / 0.967 | PASS | FAIL | 10/10 FAIL | 32.900 / 39.179 / 42.779 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 3 | 12.817 / 13.342 / 13.633 | 39.617 / 40.583 / 40.717 | 0.974 / 1.022 / 1.040 | PASS | FAIL | 10/10 FAIL | 37.666 / 44.798 / 51.307 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 4 | 14.000 / 14.175 / 14.967 | 53.783 / 54.775 / 55.683 | 1.034 / 1.082 / 1.124 | PASS | FAIL | 10/10 FAIL | 43.961 / 54.193 / 68.071 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 5 | 12.883 / 14.725 / 17.267 | 67.733 / 69.342 / 72.950 | 0.908 / 1.037 / 1.154 | PASS | FAIL | 10/10 FAIL | 51.249 / 81.250 / 119.955 PASS | 0.000 / 0.000 / 0.000 |

| guardrail | whole-band verdict | evidence |
| --- | --- | --- |
| first-boss | PASS | Historical median/cohort verdict: PASS. warrior 13.0m; guardian 13.5m; rogue 13.3m; hunter 13.4m; archer 13.8m; witch 14.1m; alchemist 13.9m |
| chapter-growth | FAIL | Historical median/cohort verdict: FAIL. warrior ch2 0.89x; warrior ch3 1.04x; warrior ch4 1.01x; warrior ch5 1.01x; guardian ch2 0.93x; guardian ch3 1.01x; guardian ch4 1.08x; guardian ch5 1.01x; rogue ch2 0.92x; rogue ch3 0.94x; rogue ch4 1.03x; rogue ch5 1.01x; hunter ch2 0.89x; hunter ch3 1.01x; hunter ch4 1.04x; hunter ch5 0.99x; archer ch2 0.92x; archer ch3 1.01x; archer ch4 1.06x; archer ch5 1.05x; witch ch2 0.93x; witch ch3 1.07x; witch ch4 1.00x; witch ch5 1.05x; alchemist ch2 0.95x; alchemist ch3 1.01x; alchemist ch4 1.06x; alchemist ch5 1.04x |
| class-spread | FAIL | Historical median/cohort verdict: PASS. ch1 range 8.6%; ch2 range 10.9%; ch3 range 12.8%; ch4 range 13.6%; ch5 range 15.6%; warrior ch1 -3.6%; guardian ch1 0.0%; rogue ch1 -1.5%; hunter ch1 -0.6%; archer ch1 2.1%; witch ch1 5.0%; alchemist ch1 3.5%; warrior ch2 -5.4%; guardian ch2 0.0%; rogue ch2 -1.7%; hunter ch2 -2.7%; archer ch2 1.9%; witch ch2 5.5%; alchemist ch2 4.4%; warrior ch3 -5.4%; guardian ch3 0.0%; rogue ch3 -3.9%; hunter ch3 -3.7%; archer ch3 1.4%; witch ch3 7.4%; alchemist ch3 5.3%; warrior ch4 -6.3%; guardian ch4 0.0%; rogue ch4 -6.3%; hunter ch4 -4.2%; archer ch4 1.2%; witch ch4 7.3%; alchemist ch4 5.8%; warrior ch5 -6.6%; guardian ch5 0.0%; rogue ch5 -7.7%; hunter ch5 -5.0%; archer ch5 2.0%; witch ch5 7.8%; alchemist ch5 6.1% |
| chapter-bounds | PASS | Historical median/cohort verdict: PASS. warrior ch1 13.0m; warrior ch2 11.5m; warrior ch3 11.9m; warrior ch4 12.1m; warrior ch5 12.2m; guardian ch1 13.5m; guardian ch2 12.5m; guardian ch3 12.6m; guardian ch4 13.6m; guardian ch5 13.7m; rogue ch1 13.3m; rogue ch2 12.2m; rogue ch3 11.4m; rogue ch4 11.8m; rogue ch5 11.9m; hunter ch1 13.4m; hunter ch2 11.9m; hunter ch3 12.0m; hunter ch4 12.5m; hunter ch5 12.4m; archer ch1 13.8m; archer ch2 12.7m; archer ch3 12.8m; archer ch4 13.5m; archer ch5 14.2m; witch ch1 14.1m; witch ch2 13.2m; witch ch3 14.1m; witch ch4 14.1m; witch ch5 14.8m; alchemist ch1 13.9m; alchemist ch2 13.2m; alchemist ch3 13.3m; alchemist ch4 14.2m; alchemist ch5 14.7m |
| never-stuck | PASS | Historical median/cohort verdict: PASS. 0/70 runs stuck |
| craft-salvage-loss | PASS | Historical median/cohort verdict: PASS. rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 |
| walk-share | PASS | Historical median/cohort verdict: PASS. warrior ch1 r1 L1.0: 21.1%; warrior ch3 r5 L41.0: 34.7%; guardian ch1 r1 L1.0: 17.5%; guardian ch3 r5 L41.0: 36.8%; rogue ch1 r1 L1.0: 17.5%; rogue ch3 r5 L40.0: 37.3%; hunter ch1 r1 L1.0: 19.4%; hunter ch3 r5 L41.0: 36.6%; archer ch1 r1 L1.0: 18.0%; archer ch3 r5 L41.0: 33.2%; witch ch1 r1 L1.0: 17.1%; witch ch3 r5 L41.0: 31.2%; alchemist ch1 r1 L1.0: 17.8%; alchemist ch3 r5 L40.0: 35.2% |
| boss-check | FAIL | Historical median/cohort verdict: FAIL. warrior ch1 first win 100.0%, median 34.24s; warrior ch2 first win 100.0%, median 36.38s; warrior ch3 first win 100.0%, median 43.69s; warrior ch4 first win 100.0%, median 51.17s; warrior ch5 first win 100.0%, median 79.89s; guardian ch1 first win 100.0%, median 34.12s; guardian ch2 first win 100.0%, median 39.08s; guardian ch3 first win 100.0%, median 46.30s; guardian ch4 first win 100.0%, median 51.38s; guardian ch5 first win 100.0%, median 81.13s; rogue ch1 first win 100.0%, median 32.94s; rogue ch2 first win 100.0%, median 34.68s; rogue ch3 first win 100.0%, median 36.12s; rogue ch4 first win 100.0%, median 40.20s; rogue ch5 first win 100.0%, median 68.97s; hunter ch1 first win 100.0%, median 33.30s; hunter ch2 first win 100.0%, median 38.76s; hunter ch3 first win 100.0%, median 45.59s; hunter ch4 first win 100.0%, median 47.40s; hunter ch5 first win 100.0%, median 82.79s; archer ch1 first win 100.0%, median 33.49s; archer ch2 first win 100.0%, median 36.69s; archer ch3 first win 100.0%, median 41.87s; archer ch4 first win 100.0%, median 53.31s; archer ch5 first win 90.0%, median 102.75s; witch ch1 first win 100.0%, median 32.85s; witch ch2 first win 100.0%, median 36.02s; witch ch3 first win 100.0%, median 42.99s; witch ch4 first win 100.0%, median 51.10s; witch ch5 first win 90.0%, median 91.12s; alchemist ch1 first win 100.0%, median 34.54s; alchemist ch2 first win 100.0%, median 39.18s; alchemist ch3 first win 100.0%, median 44.80s; alchemist ch4 first win 100.0%, median 54.19s; alchemist ch5 first win 100.0%, median 81.25s |
| guardrails | PASS | Historical median/cohort verdict: PASS. All numeric leaves within 0.33–3x except firstClearKeys=0/1; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 |

### current, step 1

| class | ch | duration min (min / median / max) | cumulative min | growth per seed | duration 10–360 | growth 1.3–2 | first wins (40–90%) | fight sec band (≤180) | key wait min |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| warrior | 1 | 29.300 / 42.783 / 46.333 | 29.300 / 42.783 / 46.333 | — | PASS | — | 0/10 FAIL | 6.000 / 24.000 / 42.000 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 2 | 1393.683 / 1397.233 / 1410.717 | 1440.017 / 1440.017 / 1440.017 | 30.079 / 32.696 / 48.147 | FAIL | FAIL | 10/10 FAIL | 6.473 / 7.666 / 11.374 PASS | 1388.617 / 1391.875 / 1405.050 |
| warrior | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 357.367 / 357.467 / 357.567 |
| warrior | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| warrior | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| guardian | 1 | 24.300 / 27.883 / 33.867 | 24.300 / 27.883 / 33.867 | — | PASS | — | 0/10 FAIL | 10.500 / 30.000 / 54.500 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 2 | 1406.150 / 1412.133 / 1415.717 | 1440.017 / 1440.017 / 1440.017 | 41.520 / 50.644 / 58.260 | FAIL | FAIL | 10/10 FAIL | 6.766 / 9.217 / 11.567 PASS | 1400.000 / 1405.308 / 1409.083 |
| guardian | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 356.917 / 357.025 / 357.233 |
| guardian | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| guardian | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| rogue | 1 | 28.333 / 42.667 / 47.667 | 28.333 / 42.667 / 47.667 | — | PASS | — | 0/10 FAIL | 6.000 / 22.500 / 39.000 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 2 | 1392.350 / 1397.350 / 1411.683 | 1440.017 / 1440.017 / 1440.017 | 29.210 / 32.769 / 49.824 | FAIL | FAIL | 10/10 FAIL | 6.057 / 8.108 / 9.243 PASS | 1387.417 / 1392.250 / 1406.083 |
| rogue | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 357.167 / 357.308 / 357.417 |
| rogue | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| rogue | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| hunter | 1 | 35.333 / 43.500 / 48.550 | 35.333 / 43.500 / 48.550 | — | PASS | — | 0/10 FAIL | 6.000 / 24.000 / 41.829 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 2 | 1391.467 / 1396.517 / 1404.683 | 1440.017 / 1440.017 / 1440.017 | 28.660 / 32.121 / 39.755 | FAIL | FAIL | 10/10 FAIL | 5.955 / 8.342 / 11.120 PASS | 1386.367 / 1391.317 / 1399.667 |
| hunter | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 357.267 / 357.417 / 357.533 |
| hunter | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| hunter | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| archer | 1 | 39.850 / 53.333 / 61.617 | 39.850 / 53.333 / 61.617 | — | PASS | — | 0/10 FAIL | 6.000 / 23.250 / 39.224 PASS | 0.000 / 0.000 / 0.000 |
| archer | 2 | 1378.400 / 1386.683 / 1400.167 | 1440.017 / 1440.017 / 1440.017 | 22.371 / 26.003 / 35.136 | FAIL | FAIL | 10/10 FAIL | 7.357 / 9.224 / 10.481 PASS | 1373.183 / 1381.208 / 1394.367 |
| archer | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 356.717 / 356.900 / 356.933 |
| archer | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| archer | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| witch | 1 | 41.867 / 50.367 / 57.850 | 41.867 / 50.367 / 57.850 | — | PASS | — | 0/10 FAIL | 6.000 / 21.000 / 39.000 PASS | 0.000 / 0.000 / 0.000 |
| witch | 2 | 1382.167 / 1389.650 / 1398.150 | 1440.017 / 1440.017 / 1440.017 | 23.892 / 27.593 / 33.395 | FAIL | FAIL | 10/10 FAIL | 6.055 / 9.751 / 11.613 PASS | 1376.850 / 1383.892 / 1392.300 |
| witch | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 356.450 / 356.617 / 356.683 |
| witch | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| witch | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| alchemist | 1 | 37.433 / 45.342 / 53.850 | 37.433 / 45.342 / 53.850 | — | PASS | — | 0/10 FAIL | 6.000 / 24.000 / 41.610 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 2 | 1386.167 / 1394.675 / 1402.583 | 1440.017 / 1440.017 / 1440.017 | 25.741 / 30.763 / 37.469 | FAIL | FAIL | 10/10 FAIL | 6.832 / 9.522 / 13.563 PASS | 1380.300 / 1388.892 / 1396.850 |
| alchemist | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 356.467 / 356.725 / 356.833 |
| alchemist | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| alchemist | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |

| guardrail | whole-band verdict | evidence |
| --- | --- | --- |
| first-boss | FAIL | Historical median/cohort verdict: FAIL. warrior 42.8m; guardian 27.9m; rogue 42.7m; hunter 43.5m; archer 53.3m; witch 50.4m; alchemist 45.3m |
| chapter-growth | FAIL | Historical median/cohort verdict: FAIL. warrior ch2 32.66x; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch2 50.64x; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch2 32.75x; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch2 32.10x; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch2 26.00x; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch2 27.59x; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch2 30.76x; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached |
| class-spread | FAIL | Historical median/cohort verdict: FAIL. ch1 range 58.5%; ch2 range 0.0%; ch3 range not reached; ch4 range not reached; ch5 range not reached; warrior ch1 -1.6%; guardian ch1 -35.9%; rogue ch1 -1.9%; hunter ch1 0.0%; archer ch1 22.6%; witch ch1 15.8%; alchemist ch1 4.2%; warrior ch2 0.0%; guardian ch2 0.0%; rogue ch2 0.0%; hunter ch2 0.0%; archer ch2 0.0%; witch ch2 0.0%; alchemist ch2 0.0%; warrior ch3 not reached; guardian ch3 not reached; rogue ch3 not reached; hunter ch3 not reached; archer ch3 not reached; witch ch3 not reached; alchemist ch3 not reached; warrior ch4 not reached; guardian ch4 not reached; rogue ch4 not reached; hunter ch4 not reached; archer ch4 not reached; witch ch4 not reached; alchemist ch4 not reached; warrior ch5 not reached; guardian ch5 not reached; rogue ch5 not reached; hunter ch5 not reached; archer ch5 not reached; witch ch5 not reached; alchemist ch5 not reached |
| chapter-bounds | FAIL | Historical median/cohort verdict: FAIL. warrior ch1 42.8m; warrior ch2 1397.2m; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch1 27.9m; guardian ch2 1412.1m; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch1 42.7m; rogue ch2 1397.3m; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch1 43.5m; hunter ch2 1396.5m; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch1 53.3m; archer ch2 1386.7m; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch1 50.4m; witch ch2 1389.7m; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch1 45.3m; alchemist ch2 1394.7m; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached |
| never-stuck | PASS | Historical median/cohort verdict: PASS. 0/70 runs stuck |
| craft-salvage-loss | PASS | Historical median/cohort verdict: PASS. rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 |
| walk-share | FAIL | Historical median/cohort verdict: FAIL. warrior ch1 r1 L1.0: 44.6%; warrior ch3 r5 L60.0: 80.6%; guardian ch1 r1 L1.0: 34.2%; guardian ch3 r5 L60.0: 65.8%; rogue ch1 r1 L1.0: 34.5%; rogue ch3 r5 L60.0: 71.2%; hunter ch1 r1 L1.0: 41.7%; hunter ch3 r5 L60.0: 76.9%; archer ch1 r1 L1.0: 35.1%; archer ch3 r5 L60.0: 66.7%; witch ch1 r1 L1.0: 29.0%; witch ch3 r5 L60.0: 54.1%; alchemist ch1 r1 L1.0: 33.2%; alchemist ch3 r5 L60.0: 58.5% |
| boss-check | FAIL | Historical median/cohort verdict: FAIL. warrior ch1 first win 0.0%, median 24.00s; warrior ch2 first win 100.0%, median 7.67s; warrior ch3 first win 0.0%, median not reached (missing attempts); warrior ch4 first win 0.0%, median not reached (missing attempts); warrior ch5 first win 0.0%, median not reached (missing attempts); guardian ch1 first win 0.0%, median 30.00s; guardian ch2 first win 100.0%, median 9.22s; guardian ch3 first win 0.0%, median not reached (missing attempts); guardian ch4 first win 0.0%, median not reached (missing attempts); guardian ch5 first win 0.0%, median not reached (missing attempts); rogue ch1 first win 0.0%, median 22.50s; rogue ch2 first win 100.0%, median 8.11s; rogue ch3 first win 0.0%, median not reached (missing attempts); rogue ch4 first win 0.0%, median not reached (missing attempts); rogue ch5 first win 0.0%, median not reached (missing attempts); hunter ch1 first win 0.0%, median 24.00s; hunter ch2 first win 100.0%, median 8.34s; hunter ch3 first win 0.0%, median not reached (missing attempts); hunter ch4 first win 0.0%, median not reached (missing attempts); hunter ch5 first win 0.0%, median not reached (missing attempts); archer ch1 first win 0.0%, median 23.25s; archer ch2 first win 100.0%, median 9.22s; archer ch3 first win 0.0%, median not reached (missing attempts); archer ch4 first win 0.0%, median not reached (missing attempts); archer ch5 first win 0.0%, median not reached (missing attempts); witch ch1 first win 0.0%, median 21.00s; witch ch2 first win 100.0%, median 9.75s; witch ch3 first win 0.0%, median not reached (missing attempts); witch ch4 first win 0.0%, median not reached (missing attempts); witch ch5 first win 0.0%, median not reached (missing attempts); alchemist ch1 first win 0.0%, median 24.00s; alchemist ch2 first win 100.0%, median 9.52s; alchemist ch3 first win 0.0%, median not reached (missing attempts); alchemist ch4 first win 0.0%, median not reached (missing attempts); alchemist ch5 first win 0.0%, median not reached (missing attempts) |
| guardrails | PASS | Historical median/cohort verdict: PASS. All numeric leaves within 0.33–3x except firstClearKeys=0/1; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 |

### current, step 2

| class | ch | duration min (min / median / max) | cumulative min | growth per seed | duration 10–360 | growth 1.3–2 | first wins (40–90%) | fight sec band (≤180) | key wait min |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| warrior | 1 | 29.333 / 35.350 / 46.200 | 29.333 / 35.350 / 46.200 | — | PASS | — | 0/10 FAIL | 10.500 / 24.000 / 42.000 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 2 | 1393.817 / 1404.667 / 1410.683 | 1440.017 / 1440.017 / 1440.017 | 30.169 / 39.736 / 48.091 | FAIL | FAIL | 10/10 FAIL | 5.509 / 8.211 / 10.159 PASS | 1388.883 / 1399.233 / 1405.217 |
| warrior | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 357.383 / 357.500 / 357.567 |
| warrior | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| warrior | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| guardian | 1 | 21.650 / 28.667 / 33.517 | 21.650 / 28.667 / 33.517 | — | PASS | — | 0/10 FAIL | 12.000 / 31.500 / 54.000 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 2 | 1406.500 / 1411.350 / 1418.367 | 1440.017 / 1440.017 / 1440.017 | 41.964 / 49.294 / 65.513 | FAIL | FAIL | 10/10 FAIL | 7.507 / 9.884 / 10.889 PASS | 1400.450 / 1404.908 / 1412.100 |
| guardian | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 357.050 / 357.167 / 357.233 |
| guardian | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| guardian | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| rogue | 1 | 26.567 / 37.542 / 41.283 | 26.567 / 37.542 / 41.283 | — | PASS | — | 0/10 FAIL | 7.500 / 21.000 / 39.852 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 2 | 1398.733 / 1402.475 / 1413.450 | 1440.017 / 1440.017 / 1440.017 | 33.881 / 37.383 / 53.204 | FAIL | FAIL | 10/10 FAIL | 6.534 / 8.600 / 9.722 PASS | 1393.583 / 1397.350 / 1408.733 |
| rogue | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 357.183 / 357.317 / 357.450 |
| rogue | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| rogue | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| hunter | 1 | 29.467 / 39.375 / 48.450 | 29.467 / 39.375 / 48.450 | — | PASS | — | 0/10 FAIL | 10.500 / 24.000 / 42.000 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 2 | 1391.567 / 1400.642 / 1410.550 | 1440.017 / 1440.017 / 1440.017 | 28.722 / 35.572 / 47.869 | FAIL | FAIL | 10/10 FAIL | 7.055 / 8.241 / 9.611 PASS | 1386.283 / 1395.150 / 1405.300 |
| hunter | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 357.300 / 357.425 / 357.483 |
| hunter | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| hunter | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| archer | 1 | 38.617 / 49.117 / 53.533 | 38.617 / 49.117 / 53.533 | — | PASS | — | 0/10 FAIL | 7.500 / 24.000 / 40.500 PASS | 0.000 / 0.000 / 0.000 |
| archer | 2 | 1386.483 / 1390.900 / 1401.400 | 1440.017 / 1440.017 / 1440.017 | 25.899 / 28.322 / 36.290 | FAIL | FAIL | 10/10 FAIL | 7.690 / 8.622 / 10.559 PASS | 1380.833 / 1385.325 / 1396.050 |
| archer | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 356.800 / 356.967 / 357.067 |
| archer | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| archer | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| witch | 1 | 37.867 / 48.700 / 62.567 | 37.867 / 48.700 / 62.567 | — | PASS | — | 0/10 FAIL | 9.000 / 21.000 / 39.243 PASS | 0.000 / 0.000 / 0.000 |
| witch | 2 | 1377.450 / 1391.317 / 1402.150 | 1440.017 / 1440.017 / 1440.017 | 22.016 / 28.585 / 37.029 | FAIL | FAIL | 10/10 FAIL | 7.349 / 9.299 / 11.371 PASS | 1372.150 / 1385.650 / 1396.383 |
| witch | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 356.567 / 356.642 / 356.733 |
| witch | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| witch | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| alchemist | 1 | 38.850 / 45.842 / 50.833 | 38.850 / 45.842 / 50.833 | — | PASS | — | 0/10 FAIL | 9.000 / 24.000 / 44.669 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 2 | 1389.183 / 1394.175 / 1401.167 | 1440.017 / 1440.017 / 1440.017 | 27.328 / 30.413 / 36.066 | FAIL | FAIL | 10/10 FAIL | 6.973 / 8.918 / 12.165 PASS | 1383.850 / 1388.583 / 1395.783 |
| alchemist | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 356.533 / 356.792 / 356.883 |
| alchemist | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| alchemist | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |

| guardrail | whole-band verdict | evidence |
| --- | --- | --- |
| first-boss | FAIL | Historical median/cohort verdict: FAIL. warrior 35.4m; guardian 28.7m; rogue 37.5m; hunter 39.4m; archer 49.1m; witch 48.7m; alchemist 45.8m |
| chapter-growth | FAIL | Historical median/cohort verdict: FAIL. warrior ch2 39.74x; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch2 49.23x; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch2 37.36x; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch2 35.57x; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch2 28.32x; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch2 28.57x; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch2 30.41x; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached |
| class-spread | FAIL | Historical median/cohort verdict: FAIL. ch1 range 51.9%; ch2 range 0.0%; ch3 range not reached; ch4 range not reached; ch5 range not reached; warrior ch1 -10.2%; guardian ch1 -27.2%; rogue ch1 -4.7%; hunter ch1 0.0%; archer ch1 24.7%; witch ch1 23.7%; alchemist ch1 16.4%; warrior ch2 0.0%; guardian ch2 0.0%; rogue ch2 0.0%; hunter ch2 0.0%; archer ch2 0.0%; witch ch2 0.0%; alchemist ch2 0.0%; warrior ch3 not reached; guardian ch3 not reached; rogue ch3 not reached; hunter ch3 not reached; archer ch3 not reached; witch ch3 not reached; alchemist ch3 not reached; warrior ch4 not reached; guardian ch4 not reached; rogue ch4 not reached; hunter ch4 not reached; archer ch4 not reached; witch ch4 not reached; alchemist ch4 not reached; warrior ch5 not reached; guardian ch5 not reached; rogue ch5 not reached; hunter ch5 not reached; archer ch5 not reached; witch ch5 not reached; alchemist ch5 not reached |
| chapter-bounds | FAIL | Historical median/cohort verdict: FAIL. warrior ch1 35.4m; warrior ch2 1404.7m; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch1 28.7m; guardian ch2 1411.3m; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch1 37.5m; rogue ch2 1402.5m; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch1 39.4m; hunter ch2 1400.6m; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch1 49.1m; archer ch2 1390.9m; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch1 48.7m; witch ch2 1391.3m; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch1 45.8m; alchemist ch2 1394.2m; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached |
| never-stuck | PASS | Historical median/cohort verdict: PASS. 0/70 runs stuck |
| craft-salvage-loss | PASS | Historical median/cohort verdict: PASS. rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 |
| walk-share | FAIL | Historical median/cohort verdict: FAIL. warrior ch1 r1 L1.0: 44.6%; warrior ch3 r5 L60.0: 80.6%; guardian ch1 r1 L1.0: 34.2%; guardian ch3 r5 L60.0: 65.8%; rogue ch1 r1 L1.0: 34.5%; rogue ch3 r5 L60.0: 65.3%; hunter ch1 r1 L1.0: 41.7%; hunter ch3 r5 L60.0: 76.9%; archer ch1 r1 L1.0: 35.1%; archer ch3 r5 L60.0: 66.7%; witch ch1 r1 L1.0: 29.0%; witch ch3 r5 L60.0: 54.1%; alchemist ch1 r1 L1.0: 33.2%; alchemist ch3 r5 L60.0: 58.5% |
| boss-check | FAIL | Historical median/cohort verdict: FAIL. warrior ch1 first win 0.0%, median 24.00s; warrior ch2 first win 100.0%, median 8.21s; warrior ch3 first win 0.0%, median not reached (missing attempts); warrior ch4 first win 0.0%, median not reached (missing attempts); warrior ch5 first win 0.0%, median not reached (missing attempts); guardian ch1 first win 0.0%, median 31.50s; guardian ch2 first win 100.0%, median 9.88s; guardian ch3 first win 0.0%, median not reached (missing attempts); guardian ch4 first win 0.0%, median not reached (missing attempts); guardian ch5 first win 0.0%, median not reached (missing attempts); rogue ch1 first win 0.0%, median 21.00s; rogue ch2 first win 100.0%, median 8.60s; rogue ch3 first win 0.0%, median not reached (missing attempts); rogue ch4 first win 0.0%, median not reached (missing attempts); rogue ch5 first win 0.0%, median not reached (missing attempts); hunter ch1 first win 0.0%, median 24.00s; hunter ch2 first win 100.0%, median 8.24s; hunter ch3 first win 0.0%, median not reached (missing attempts); hunter ch4 first win 0.0%, median not reached (missing attempts); hunter ch5 first win 0.0%, median not reached (missing attempts); archer ch1 first win 0.0%, median 24.00s; archer ch2 first win 100.0%, median 8.62s; archer ch3 first win 0.0%, median not reached (missing attempts); archer ch4 first win 0.0%, median not reached (missing attempts); archer ch5 first win 0.0%, median not reached (missing attempts); witch ch1 first win 0.0%, median 21.00s; witch ch2 first win 100.0%, median 9.30s; witch ch3 first win 0.0%, median not reached (missing attempts); witch ch4 first win 0.0%, median not reached (missing attempts); witch ch5 first win 0.0%, median not reached (missing attempts); alchemist ch1 first win 0.0%, median 24.00s; alchemist ch2 first win 100.0%, median 8.92s; alchemist ch3 first win 0.0%, median not reached (missing attempts); alchemist ch4 first win 0.0%, median not reached (missing attempts); alchemist ch5 first win 0.0%, median not reached (missing attempts) |
| guardrails | PASS | Historical median/cohort verdict: PASS. All numeric leaves within 0.33–3x except firstClearKeys=0/1; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 |

## Pasted per-seed chapter durations (minutes)

No seed or missing chapter is filtered out. These are durations, not cumulative win times; cumulative bands appear above.

### proposal, step 1, raw seeds

| Class | Ch | Seed 1 | Seed 2 | Seed 3 | Seed 4 | Seed 5 | Seed 6 | Seed 7 | Seed 8 | Seed 9 | Seed 10 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 1 | 13.150 | 12.450 | 13.150 | 13.133 | 13.150 | 13.150 | 13.150 | 13.150 | 13.133 | 13.150 |
| warrior | 2 | 11.467 | 10.850 | 11.233 | 11.467 | 11.517 | 11.683 | 11.317 | 11.317 | 11.400 | 11.467 |
| warrior | 3 | 11.367 | 12.233 | 12.167 | 11.850 | 11.517 | 11.167 | 11.533 | 11.450 | 12.467 | 11.267 |
| warrior | 4 | 12.683 | 12.350 | 11.950 | 11.333 | 11.817 | 11.767 | 12.383 | 11.317 | 11.717 | 12.100 |
| warrior | 5 | 14.833 | 12.317 | 11.417 | 12.317 | 11.667 | 12.433 | 13.583 | 11.750 | 12.983 | 11.783 |
| guardian | 1 | 13.750 | 12.633 | 13.250 | 13.250 | 13.750 | 13.133 | 13.750 | 13.233 | 13.150 | 13.750 |
| guardian | 2 | 12.983 | 11.033 | 12.633 | 13.050 | 12.783 | 11.983 | 12.850 | 12.600 | 13.067 | 12.817 |
| guardian | 3 | 12.683 | 12.483 | 12.483 | 12.600 | 12.600 | 12.317 | 12.600 | 12.817 | 12.650 | 12.217 |
| guardian | 4 | 14.133 | 13.950 | 13.633 | 13.533 | 14.017 | 13.383 | 14.117 | 13.750 | 13.967 | 12.967 |
| guardian | 5 | 15.083 | 14.017 | 12.633 | 14.567 | 13.000 | 13.667 | 14.483 | 14.117 | 14.550 | 13.233 |
| rogue | 1 | 12.750 | 12.367 | 13.233 | 13.233 | 13.233 | 13.233 | 13.233 | 12.917 | 12.867 | 13.233 |
| rogue | 2 | 11.917 | 10.750 | 11.750 | 12.300 | 12.217 | 11.750 | 12.183 | 12.200 | 12.250 | 12.300 |
| rogue | 3 | 11.750 | 11.517 | 11.183 | 11.350 | 11.383 | 10.850 | 11.317 | 11.633 | 11.550 | 11.567 |
| rogue | 4 | 12.267 | 12.700 | 11.233 | 10.967 | 11.283 | 11.150 | 12.433 | 11.500 | 11.283 | 12.400 |
| rogue | 5 | 13.583 | 12.083 | 10.883 | 11.767 | 11.500 | 11.950 | 12.467 | 12.083 | 12.683 | 11.283 |
| hunter | 1 | 13.333 | 12.433 | 13.400 | 12.767 | 13.400 | 13.400 | 13.400 | 12.683 | 12.700 | 13.400 |
| hunter | 2 | 11.967 | 10.983 | 11.867 | 11.933 | 11.933 | 12.383 | 12.017 | 11.617 | 12.117 | 12.117 |
| hunter | 3 | 12.067 | 12.033 | 12.050 | 11.550 | 12.050 | 11.550 | 11.567 | 11.983 | 12.050 | 11.750 |
| hunter | 4 | 12.517 | 12.733 | 11.617 | 11.467 | 12.283 | 11.367 | 12.100 | 11.217 | 11.667 | 12.867 |
| hunter | 5 | 14.300 | 12.767 | 11.433 | 12.767 | 12.650 | 12.267 | 13.300 | 12.117 | 14.283 | 12.300 |
| archer | 1 | 13.983 | 13.283 | 13.750 | 13.750 | 13.983 | 13.467 | 13.983 | 13.417 | 13.983 | 13.983 |
| archer | 2 | 12.433 | 11.683 | 13.433 | 13.883 | 13.800 | 11.700 | 13.567 | 13.000 | 13.550 | 13.600 |
| archer | 3 | 13.067 | 12.650 | 13.050 | 12.700 | 12.683 | 12.700 | 12.817 | 12.917 | 13.033 | 12.783 |
| archer | 4 | 14.150 | 14.150 | 14.083 | 12.200 | 13.283 | 13.883 | 13.633 | 13.133 | 13.283 | 12.750 |
| archer | 5 | 15.867 | 15.450 | 13.083 | 13.583 | 12.883 | 14.983 | 12.817 | 13.650 | 15.383 | 13.033 |
| witch | 1 | 13.967 | 13.900 | 14.150 | 13.967 | 14.150 | 13.700 | 14.150 | 14.150 | 14.150 | 13.967 |
| witch | 2 | 13.500 | 13.217 | 13.250 | 13.500 | 13.717 | 13.200 | 13.417 | 13.250 | 13.650 | 13.500 |
| witch | 3 | 15.117 | 13.500 | 14.533 | 14.033 | 14.350 | 12.983 | 13.117 | 13.350 | 14.350 | 14.517 |
| witch | 4 | 15.917 | 15.333 | 14.167 | 13.800 | 14.100 | 13.883 | 13.567 | 14.183 | 14.750 | 15.650 |
| witch | 5 | 17.417 | 15.883 | 14.667 | 14.883 | 14.850 | 14.333 | 14.750 | 15.650 | 17.250 | 14.483 |
| alchemist | 1 | 14.150 | 13.783 | 14.150 | 13.933 | 14.150 | 14.133 | 14.150 | 14.000 | 14.150 | 13.933 |
| alchemist | 2 | 13.250 | 11.767 | 13.100 | 13.483 | 13.667 | 11.833 | 13.200 | 13.417 | 13.383 | 13.483 |
| alchemist | 3 | 13.750 | 12.983 | 13.267 | 13.000 | 13.167 | 12.583 | 12.950 | 13.233 | 13.117 | 12.967 |
| alchemist | 4 | 14.583 | 15.033 | 14.767 | 12.967 | 14.700 | 13.433 | 14.233 | 14.450 | 14.150 | 14.250 |
| alchemist | 5 | 16.250 | 14.850 | 13.983 | 13.783 | 14.233 | 14.217 | 14.467 | 14.617 | 15.333 | 14.567 |

### proposal, step 2, raw seeds

| Class | Ch | Seed 1 | Seed 2 | Seed 3 | Seed 4 | Seed 5 | Seed 6 | Seed 7 | Seed 8 | Seed 9 | Seed 10 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 1 | 12.883 | 12.983 | 12.983 | 12.917 | 12.950 | 12.867 | 12.983 | 12.983 | 12.983 | 12.983 |
| warrior | 2 | 11.650 | 11.500 | 11.267 | 11.883 | 11.633 | 11.300 | 11.317 | 11.400 | 11.550 | 11.550 |
| warrior | 3 | 12.250 | 11.933 | 12.300 | 11.967 | 11.350 | 11.467 | 11.867 | 11.350 | 11.950 | 12.150 |
| warrior | 4 | 12.667 | 12.267 | 12.167 | 11.550 | 11.967 | 13.133 | 11.417 | 10.633 | 11.783 | 13.117 |
| warrior | 5 | 14.733 | 12.683 | 11.583 | 12.467 | 11.867 | 13.233 | 11.417 | 11.267 | 13.867 | 11.717 |
| guardian | 1 | 13.467 | 13.333 | 13.467 | 13.050 | 13.433 | 13.400 | 13.467 | 13.467 | 13.467 | 13.467 |
| guardian | 2 | 12.233 | 11.333 | 12.033 | 13.067 | 11.567 | 11.983 | 12.900 | 12.733 | 12.783 | 13.067 |
| guardian | 3 | 12.950 | 12.383 | 12.617 | 12.300 | 12.483 | 12.333 | 12.567 | 12.567 | 12.750 | 12.800 |
| guardian | 4 | 13.983 | 13.533 | 13.717 | 13.283 | 13.600 | 13.800 | 13.150 | 12.717 | 13.617 | 13.400 |
| guardian | 5 | 15.517 | 13.350 | 12.367 | 14.033 | 13.867 | 13.933 | 13.200 | 13.300 | 14.950 | 13.600 |
| rogue | 1 | 13.267 | 13.267 | 13.267 | 13.267 | 13.217 | 13.267 | 13.267 | 13.267 | 13.267 | 13.267 |
| rogue | 2 | 12.300 | 11.433 | 11.717 | 12.483 | 11.500 | 12.050 | 12.350 | 12.100 | 12.467 | 12.517 |
| rogue | 3 | 11.883 | 11.283 | 11.350 | 11.350 | 11.250 | 11.050 | 11.567 | 11.567 | 11.633 | 11.533 |
| rogue | 4 | 12.383 | 12.550 | 12.017 | 11.183 | 11.267 | 12.183 | 11.250 | 11.133 | 11.583 | 11.933 |
| rogue | 5 | 14.300 | 11.383 | 11.050 | 12.050 | 11.950 | 13.083 | 11.850 | 11.583 | 13.417 | 11.083 |
| hunter | 1 | 13.383 | 12.983 | 13.383 | 12.933 | 13.350 | 13.217 | 13.383 | 13.383 | 13.383 | 13.383 |
| hunter | 2 | 12.083 | 11.383 | 11.867 | 11.983 | 11.667 | 11.750 | 11.933 | 11.767 | 12.100 | 11.900 |
| hunter | 3 | 12.133 | 11.900 | 12.083 | 11.783 | 12.000 | 11.717 | 11.917 | 11.750 | 12.200 | 12.450 |
| hunter | 4 | 13.017 | 12.983 | 12.133 | 11.800 | 12.683 | 12.700 | 12.617 | 11.317 | 12.067 | 12.350 |
| hunter | 5 | 14.100 | 12.350 | 12.000 | 12.067 | 12.233 | 12.817 | 12.533 | 11.733 | 13.683 | 12.400 |
| archer | 1 | 13.750 | 13.400 | 13.750 | 13.550 | 13.700 | 13.750 | 13.750 | 13.550 | 13.750 | 13.750 |
| archer | 2 | 12.567 | 11.717 | 12.200 | 13.550 | 12.133 | 12.467 | 12.750 | 13.200 | 13.683 | 13.183 |
| archer | 3 | 13.133 | 12.750 | 12.667 | 13.100 | 12.767 | 12.283 | 12.450 | 12.417 | 13.033 | 12.800 |
| archer | 4 | 14.283 | 14.117 | 13.167 | 13.450 | 13.483 | 13.300 | 13.450 | 13.183 | 13.900 | 13.967 |
| archer | 5 | 26.650 | 14.133 | 13.017 | 14.350 | 14.183 | 14.150 | 14.617 | 14.033 | 15.633 | 13.333 |
| witch | 1 | 14.000 | 13.550 | 14.150 | 14.000 | 14.133 | 14.150 | 13.867 | 14.150 | 14.150 | 14.150 |
| witch | 2 | 13.383 | 12.450 | 12.950 | 13.417 | 13.267 | 13.333 | 12.517 | 13.067 | 13.267 | 13.117 |
| witch | 3 | 14.333 | 13.200 | 14.617 | 14.383 | 14.467 | 12.933 | 13.850 | 13.917 | 13.650 | 14.333 |
| witch | 4 | 16.467 | 14.033 | 14.150 | 13.933 | 14.400 | 13.300 | 14.067 | 14.200 | 14.117 | 15.783 |
| witch | 5 | 19.250 | 14.550 | 14.550 | 14.833 | 14.683 | 14.450 | 15.533 | 14.783 | 16.367 | 15.283 |
| alchemist | 1 | 13.933 | 13.833 | 13.933 | 13.933 | 13.933 | 13.900 | 13.933 | 13.933 | 13.933 | 13.700 |
| alchemist | 2 | 13.467 | 13.183 | 13.167 | 13.183 | 13.467 | 13.117 | 12.733 | 12.850 | 13.467 | 13.183 |
| alchemist | 3 | 13.317 | 13.633 | 13.567 | 13.550 | 13.117 | 12.817 | 12.950 | 13.367 | 13.317 | 13.600 |
| alchemist | 4 | 14.967 | 14.117 | 14.183 | 14.017 | 14.167 | 14.000 | 14.167 | 14.633 | 14.433 | 14.483 |
| alchemist | 5 | 17.267 | 14.733 | 12.883 | 14.433 | 14.500 | 14.617 | 15.367 | 14.933 | 15.517 | 14.717 |

### current, step 1, raw seeds

| Class | Ch | Seed 1 | Seed 2 | Seed 3 | Seed 4 | Seed 5 | Seed 6 | Seed 7 | Seed 8 | Seed 9 | Seed 10 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 1 | 46.267 | 46.333 | 41.350 | 38.350 | 33.350 | 44.217 | 45.350 | 45.350 | 29.300 | 31.350 |
| warrior | 2 | 1393.750 | 1393.683 | 1398.667 | 1401.667 | 1406.667 | 1395.800 | 1394.667 | 1394.667 | 1410.717 | 1408.667 |
| warrior | 3 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| warrior | 4 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| warrior | 5 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| guardian | 1 | 26.800 | 31.767 | 29.600 | 27.883 | 28.883 | 33.867 | 27.883 | 27.883 | 24.300 | 24.883 |
| guardian | 2 | 1413.217 | 1408.250 | 1410.417 | 1412.133 | 1411.133 | 1406.150 | 1412.133 | 1412.133 | 1415.717 | 1415.133 |
| guardian | 3 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| guardian | 4 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| guardian | 5 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| rogue | 1 | 36.567 | 37.633 | 44.583 | 47.667 | 44.667 | 45.650 | 43.667 | 41.667 | 28.333 | 34.667 |
| rogue | 2 | 1403.450 | 1402.383 | 1395.433 | 1392.350 | 1395.350 | 1394.367 | 1396.350 | 1398.350 | 1411.683 | 1405.350 |
| rogue | 3 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| rogue | 4 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| rogue | 5 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| hunter | 1 | 46.350 | 42.500 | 44.500 | 47.550 | 48.550 | 47.317 | 39.550 | 39.550 | 36.150 | 35.333 |
| hunter | 2 | 1393.667 | 1397.517 | 1395.517 | 1392.467 | 1391.467 | 1392.700 | 1400.467 | 1400.467 | 1403.867 | 1404.683 |
| hunter | 3 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| hunter | 4 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| hunter | 5 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| archer | 1 | 53.850 | 47.800 | 53.817 | 43.850 | 52.850 | 56.833 | 61.617 | 54.617 | 46.450 | 39.850 |
| archer | 2 | 1386.167 | 1392.217 | 1386.200 | 1396.167 | 1387.167 | 1383.183 | 1378.400 | 1385.400 | 1393.567 | 1400.167 |
| archer | 3 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| archer | 4 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| archer | 5 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| witch | 1 | 41.867 | 44.833 | 54.867 | 47.867 | 49.867 | 57.850 | 55.600 | 56.667 | 42.433 | 50.867 |
| witch | 2 | 1398.150 | 1395.183 | 1385.150 | 1392.150 | 1390.150 | 1382.167 | 1384.417 | 1383.350 | 1397.583 | 1389.150 |
| witch | 3 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| witch | 4 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| witch | 5 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| alchemist | 1 | 48.850 | 43.833 | 43.850 | 37.850 | 48.850 | 45.833 | 44.850 | 45.850 | 37.433 | 53.850 |
| alchemist | 2 | 1391.167 | 1396.183 | 1396.167 | 1402.167 | 1391.167 | 1394.183 | 1395.167 | 1394.167 | 1402.583 | 1386.167 |
| alchemist | 3 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| alchemist | 4 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| alchemist | 5 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |

### current, step 2, raw seeds

| Class | Ch | Seed 1 | Seed 2 | Seed 3 | Seed 4 | Seed 5 | Seed 6 | Seed 7 | Seed 8 | Seed 9 | Seed 10 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 1 | 36.283 | 46.200 | 31.350 | 29.333 | 38.217 | 35.350 | 35.200 | 40.350 | 35.350 | 35.350 |
| warrior | 2 | 1403.733 | 1393.817 | 1408.667 | 1410.683 | 1401.800 | 1404.667 | 1404.817 | 1399.667 | 1404.667 | 1404.667 |
| warrior | 3 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| warrior | 4 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| warrior | 5 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| guardian | 1 | 31.450 | 27.467 | 26.533 | 21.650 | 33.517 | 27.667 | 29.667 | 30.667 | 26.667 | 29.667 |
| guardian | 2 | 1408.567 | 1412.550 | 1413.483 | 1418.367 | 1406.500 | 1412.350 | 1410.350 | 1409.350 | 1413.350 | 1410.350 |
| guardian | 3 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| guardian | 4 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| guardian | 5 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| rogue | 1 | 36.250 | 41.283 | 38.500 | 26.567 | 34.350 | 35.500 | 39.283 | 39.567 | 36.583 | 38.583 |
| rogue | 2 | 1403.767 | 1398.733 | 1401.517 | 1413.450 | 1405.667 | 1404.517 | 1400.733 | 1400.450 | 1403.433 | 1401.433 |
| rogue | 3 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| rogue | 4 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| rogue | 5 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| hunter | 1 | 39.267 | 42.267 | 48.450 | 29.467 | 44.400 | 38.383 | 41.200 | 39.483 | 34.367 | 35.483 |
| hunter | 2 | 1400.750 | 1397.750 | 1391.567 | 1410.550 | 1395.617 | 1401.633 | 1398.817 | 1400.533 | 1405.650 | 1404.533 |
| hunter | 3 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| hunter | 4 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| hunter | 5 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| archer | 1 | 52.517 | 43.517 | 52.617 | 38.617 | 53.533 | 46.633 | 49.633 | 53.517 | 48.600 | 47.633 |
| archer | 2 | 1387.500 | 1396.500 | 1387.400 | 1401.400 | 1386.483 | 1393.383 | 1390.383 | 1386.500 | 1391.417 | 1392.383 |
| archer | 3 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| archer | 4 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| archer | 5 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| witch | 1 | 47.567 | 45.550 | 62.567 | 44.867 | 49.833 | 50.850 | 53.867 | 56.600 | 44.600 | 37.867 |
| witch | 2 | 1392.450 | 1394.467 | 1377.450 | 1395.150 | 1390.183 | 1389.167 | 1386.150 | 1383.417 | 1395.417 | 1402.150 |
| witch | 3 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| witch | 4 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| witch | 5 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| alchemist | 1 | 46.517 | 41.517 | 44.850 | 38.850 | 45.833 | 50.833 | 48.850 | 45.850 | 46.850 | 39.850 |
| alchemist | 2 | 1393.500 | 1398.500 | 1395.167 | 1401.167 | 1394.183 | 1389.183 | 1391.167 | 1394.167 | 1393.167 | 1400.167 |
| alchemist | 3 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| alchemist | 4 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
| alchemist | 5 | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached | not reached |
