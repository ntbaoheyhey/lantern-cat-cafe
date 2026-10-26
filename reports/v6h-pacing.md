STATUS: BLOCKED

# V6h pacing — proposal NOT READY

Validation blocker: the final `cd apps/web && npx -y pnpm@10.28.0 test:e2e` exited 1: 45 passed, 2 failed with `page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4174/`. The two permitted fix rounds were already consumed, so no further fix or retry was attempted. An earlier e2e run passed all 47; that does not override this final failure. The exact cause of the preview-server disappearance is NOT VERIFIED. To investigate outside simulator scope, the file that would need allowance is `apps/web/playwright.config.ts` (the Vite preview webServer lifecycle); no change to it is asserted necessary until diagnosis. The failing test locations are `apps/web/e2e/layout/stage-layout.spec.ts:225` and `:252`; neither test was changed.

Completed the bounded proposal/simulator investigation from origin/ai/codex-v6f-rebalance at 9d820a0. No candidate passed all strict targets on seeds 1–3. The closest eligible candidate remains the inherited proposal, with 7/9 strict and 7/9 relaxed targets. The numerical blockers are chapter-growth and boss-check. No production numbers were applied.

Numbers sign-off belongs to the user (D4, planning date 30 Oct). D1 remains S-B: boss.firstClearKeys = 1, dailyKeys = 3. The signature remains exactly `User: ____ (approved / changes)`.

## Tooling and isolation

Corepack was unavailable. The explicitly authorized fallback was used for **every** pnpm command: `npx -y pnpm@10.28.0`. Installation used `CI=true` from the outset. No third installation method was attempted.

```text
zsh:1: command not found: corepack
10.28.0
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +505
Progress: resolved 505, reused 496, downloaded 0, added 505, done
Done in 12.1s using pnpm v10.28.0
```

PASS — isolated worktree; unrelated dirty checkout left untouched. Branch ai/codex-v6h-pacing starts at 9d820a0. Git author: ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>.

## Diagnosis at the frozen baseline

Each cohort contains all seven classes × seeds 1, 2, 3, with the unchanged 1,800-active-minute horizon. Missing milestones remain failures. Tables below give **each seed**, every class and chapter, at both claim cadences. Boss median includes all attempted fights; first-win flags are ordered seeds 1/2/3. Growth is the ratio of chapter-duration medians, as in the unchanged target checker.

The inherited kill counts are 18/22/26/30/30. They rise only 22.2%, 18.2%, 15.4%, then 0%, while XP, levels, equipment and class passives accelerate kills. Monster HP grows by 1.06^10 = 1.791 per chapter; monster XP grows by 1.11^10 = 2.839. The resulting durations stay nearly flat rather than growing 30–100% per chapter. The final two kill-count leaves are already at the 3× guardrail (30).

Boss pressure is too low in the early chapters: HP multipliers 14/20/30/40/50 and ATK multipliers 0.85/1.5/2.5/3/3.5 accompany 300 starting HP and 4.5-second normal attacks. With three seeds, the strict 40–90% first-win target requires exactly 2/3 wins in **each of 35 class/chapter cells**. Most measured cells are 3/3. Late pressure can instead produce 0/3 or 1/3 for fragile classes; raising pressure is not a uniform solution.

| target | step 1 strict | step 1 relaxed | step 2 strict | step 2 relaxed |
| --- | --- | --- | --- | --- |
| first-boss | PASS | PASS | PASS | PASS |
| chapter-growth | FAIL | FAIL | FAIL | FAIL |
| class-spread | PASS | PASS | PASS | PASS |
| chapter-bounds | PASS | PASS | PASS | PASS |
| never-stuck | PASS | PASS | PASS | PASS |
| craft-salvage-loss | PASS | PASS | PASS | PASS |
| walk-share | PASS | PASS | PASS | PASS |
| boss-check | FAIL | FAIL | FAIL | FAIL |
| guardrails | PASS | PASS | PASS | PASS |

### Step 1 minutes — seeds 1/2/3

| class | chapter | seed 1 min | seed 2 min | seed 3 min | median min | growth | first wins 1/2/3 | boss median sec |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| warrior | 1 | 13.150 | 12.450 | 13.150 | 13.150 | — | W/W/W | 33.240 |
| warrior | 2 | 11.467 | 10.850 | 11.233 | 11.233 | 0.854x | W/W/W | 34.872 |
| warrior | 3 | 11.367 | 12.233 | 12.167 | 12.167 | 1.083x | W/W/W | 47.359 |
| warrior | 4 | 12.683 | 12.350 | 11.950 | 12.350 | 1.015x | W/W/W | 49.567 |
| warrior | 5 | 14.833 | 12.317 | 11.417 | 12.317 | 0.997x | W/W/W | 90.677 |
| guardian | 1 | 13.750 | 12.633 | 13.250 | 13.250 | — | W/W/W | 32.720 |
| guardian | 2 | 12.983 | 11.033 | 12.633 | 12.633 | 0.953x | W/W/W | 37.047 |
| guardian | 3 | 12.683 | 12.483 | 12.483 | 12.483 | 0.988x | W/W/W | 50.030 |
| guardian | 4 | 14.133 | 13.950 | 13.633 | 13.950 | 1.117x | W/W/W | 50.557 |
| guardian | 5 | 15.083 | 14.017 | 12.633 | 14.017 | 1.005x | W/W/W | 98.847 |
| rogue | 1 | 12.750 | 12.367 | 13.233 | 12.750 | — | W/W/W | 30.775 |
| rogue | 2 | 11.917 | 10.750 | 11.750 | 11.750 | 0.922x | W/W/W | 33.653 |
| rogue | 3 | 11.750 | 11.517 | 11.183 | 11.517 | 0.980x | W/W/W | 37.995 |
| rogue | 4 | 12.267 | 12.700 | 11.233 | 12.267 | 1.065x | W/W/W | 47.439 |
| rogue | 5 | 13.583 | 12.083 | 10.883 | 12.083 | 0.985x | W/W/W | 75.202 |
| hunter | 1 | 13.333 | 12.433 | 13.400 | 13.333 | — | W/W/W | 31.145 |
| hunter | 2 | 11.967 | 10.983 | 11.867 | 11.867 | 0.890x | W/W/W | 38.395 |
| hunter | 3 | 12.067 | 12.033 | 12.050 | 12.050 | 1.015x | W/W/W | 44.692 |
| hunter | 4 | 12.517 | 12.733 | 11.617 | 12.517 | 1.039x | W/W/W | 49.853 |
| hunter | 5 | 14.300 | 12.767 | 11.433 | 12.767 | 1.020x | W/W/W | 83.071 |
| archer | 1 | 13.983 | 13.283 | 13.750 | 13.750 | — | W/W/W | 32.000 |
| archer | 2 | 12.433 | 11.683 | 13.433 | 12.433 | 0.904x | W/W/W | 38.202 |
| archer | 3 | 13.067 | 12.650 | 13.050 | 13.050 | 1.050x | W/W/W | 44.593 |
| archer | 4 | 14.150 | 14.150 | 14.083 | 14.150 | 1.084x | W/W/W | 49.207 |
| archer | 5 | 15.867 | 15.450 | 13.083 | 15.450 | 1.092x | W/L/W | 91.256 |
| witch | 1 | 13.967 | 13.900 | 14.150 | 13.967 | — | W/W/W | 32.850 |
| witch | 2 | 13.500 | 13.217 | 13.250 | 13.250 | 0.949x | W/W/W | 39.637 |
| witch | 3 | 15.117 | 13.500 | 14.533 | 14.533 | 1.097x | W/W/W | 47.176 |
| witch | 4 | 15.917 | 15.333 | 14.167 | 15.333 | 1.055x | W/W/W | 52.408 |
| witch | 5 | 17.417 | 15.883 | 14.667 | 15.883 | 1.036x | W/W/W | 92.075 |
| alchemist | 1 | 14.150 | 13.783 | 14.150 | 14.150 | — | W/W/W | 35.810 |
| alchemist | 2 | 13.250 | 11.767 | 13.100 | 13.100 | 0.926x | W/W/W | 33.866 |
| alchemist | 3 | 13.750 | 12.983 | 13.267 | 13.267 | 1.013x | W/W/W | 40.734 |
| alchemist | 4 | 14.583 | 15.033 | 14.767 | 14.767 | 1.113x | W/W/W | 47.917 |
| alchemist | 5 | 16.250 | 14.850 | 13.983 | 14.850 | 1.006x | W/W/W | 97.465 |

### Step 2 minutes — seeds 1/2/3

| class | chapter | seed 1 min | seed 2 min | seed 3 min | median min | growth | first wins 1/2/3 | boss median sec |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| warrior | 1 | 12.883 | 12.983 | 12.983 | 12.983 | — | W/W/W | 34.240 |
| warrior | 2 | 11.650 | 11.500 | 11.267 | 11.500 | 0.886x | W/W/W | 34.872 |
| warrior | 3 | 12.250 | 11.933 | 12.300 | 12.250 | 1.065x | W/W/W | 45.262 |
| warrior | 4 | 12.667 | 12.267 | 12.167 | 12.267 | 1.001x | W/W/W | 54.362 |
| warrior | 5 | 14.733 | 12.683 | 11.583 | 12.683 | 1.034x | W/W/W | 99.806 |
| guardian | 1 | 13.467 | 13.333 | 13.467 | 13.467 | — | W/W/W | 34.120 |
| guardian | 2 | 12.233 | 11.333 | 12.033 | 12.033 | 0.894x | W/W/W | 39.307 |
| guardian | 3 | 12.950 | 12.383 | 12.617 | 12.617 | 1.048x | W/W/W | 47.132 |
| guardian | 4 | 13.983 | 13.533 | 13.717 | 13.717 | 1.087x | W/W/W | 55.503 |
| guardian | 5 | 15.517 | 13.350 | 12.367 | 13.350 | 0.973x | W/W/W | 83.333 |
| rogue | 1 | 13.267 | 13.267 | 13.267 | 13.267 | — | W/W/W | 32.940 |
| rogue | 2 | 12.300 | 11.433 | 11.717 | 11.717 | 0.883x | W/W/W | 32.445 |
| rogue | 3 | 11.883 | 11.283 | 11.350 | 11.350 | 0.969x | W/W/W | 36.762 |
| rogue | 4 | 12.383 | 12.550 | 12.017 | 12.383 | 1.091x | W/W/W | 37.988 |
| rogue | 5 | 14.300 | 11.383 | 11.050 | 11.383 | 0.919x | W/W/W | 66.852 |
| hunter | 1 | 13.383 | 12.983 | 13.383 | 13.383 | — | W/W/W | 33.300 |
| hunter | 2 | 12.083 | 11.383 | 11.867 | 11.867 | 0.887x | W/W/W | 38.395 |
| hunter | 3 | 12.133 | 11.900 | 12.083 | 12.083 | 1.018x | W/W/W | 47.168 |
| hunter | 4 | 13.017 | 12.983 | 12.133 | 12.983 | 1.074x | W/W/W | 54.688 |
| hunter | 5 | 14.100 | 12.350 | 12.000 | 12.350 | 0.951x | W/W/W | 90.853 |
| archer | 1 | 13.750 | 13.400 | 13.750 | 13.750 | — | W/W/W | 33.800 |
| archer | 2 | 12.567 | 11.717 | 12.200 | 12.200 | 0.887x | W/W/W | 36.734 |
| archer | 3 | 13.133 | 12.750 | 12.667 | 12.750 | 1.045x | W/W/W | 46.457 |
| archer | 4 | 14.283 | 14.117 | 13.167 | 14.117 | 1.107x | W/W/W | 57.098 |
| archer | 5 | 26.650 | 14.133 | 13.017 | 14.133 | 1.001x | L/W/W | 108.000 |
| witch | 1 | 14.000 | 13.550 | 14.150 | 14.000 | — | W/W/W | 32.789 |
| witch | 2 | 13.383 | 12.450 | 12.950 | 12.950 | 0.925x | W/W/W | 38.153 |
| witch | 3 | 14.333 | 13.200 | 14.617 | 14.333 | 1.107x | W/W/W | 48.224 |
| witch | 4 | 16.467 | 14.033 | 14.150 | 14.150 | 0.987x | W/W/W | 54.918 |
| witch | 5 | 19.250 | 14.550 | 14.550 | 14.550 | 1.028x | L/W/W | 115.489 |
| alchemist | 1 | 13.933 | 13.833 | 13.933 | 13.933 | — | W/W/W | 35.810 |
| alchemist | 2 | 13.467 | 13.183 | 13.167 | 13.183 | 0.946x | W/W/W | 40.972 |
| alchemist | 3 | 13.317 | 13.633 | 13.567 | 13.567 | 1.029x | W/W/W | 44.547 |
| alchemist | 4 | 14.967 | 14.117 | 14.183 | 14.183 | 1.045x | W/W/W | 57.492 |
| alchemist | 5 | 17.267 | 14.733 | 12.883 | 14.733 | 1.039x | W/W/W | 95.670 |

### Claim-size stability

PASS uses the existing diagnostic: class median first-boss time differs by at most one minute between step 1 and step 2. It does not imply identical random trajectories or identical later chapter times.

| class | step 1 median first boss | step 2 median first boss | absolute difference | result |
| --- | ---: | ---: | ---: | --- |
| warrior | 13.150 | 12.983 | 0.167 | PASS |
| guardian | 13.250 | 13.467 | 0.217 | PASS |
| rogue | 12.750 | 13.267 | 0.517 | PASS |
| hunter | 13.333 | 13.383 | 0.050 | PASS |
| archer | 13.750 | 13.750 | 0.000 | PASS |
| witch | 13.967 | 14.000 | 0.033 | PASS |
| alchemist | 14.150 | 13.933 | 0.217 | PASS |

Later active-duration medians are not uniformly invariant within one minute: archer ch5 differs by 1.317 minutes, witch ch4 by 1.183, and witch ch5 by 1.333. The existing first-boss diagnostic passes; a claim that every later chapter is stable within one minute would be FALSE. Both cadences still fail the same two strict targets. This limitation is another reason to retain NOT READY.

| class | ch1 median delta | ch2 | ch3 | ch4 | ch5 |
| --- | ---: | ---: | ---: | ---: | ---: |
| warrior | 0.167 | 0.267 | 0.083 | 0.083 | 0.367 |
| guardian | 0.217 | 0.600 | 0.133 | 0.233 | 0.667 |
| rogue | 0.517 | 0.033 | 0.167 | 0.117 | 0.700 |
| hunter | 0.050 | 0.000 | 0.033 | 0.467 | 0.417 |
| archer | 0.000 | 0.233 | 0.300 | 0.033 | 1.317 |
| witch | 0.033 | 0.300 | 0.200 | 1.183 | 1.333 |
| alchemist | 0.217 | 0.083 | 0.300 | 0.583 | 0.117 |

## Bounded search and unchanged thresholds

PASS — 24 new pacing measurements on seeds 1–3, all classes, step 2, horizon 1,800 minutes; 12 subsequent chapter-ATK pressure measurements on the top three pacing families. Every candidate calls the existing guardrails check. Candidate ranking uses strict target count only; relaxed checks never select a candidate.

Chapter arrays were tried first. Global monster HP and XP growth were varied only because the inherited late kill counts saturate. Class multipliers live in content, outside the guarded config override interface; no class multiplier or content number was edited. This is a finite search, not proof that no admissible configuration exists.

Existing opt-in search was also run: 29 directed controls/families, 36 fine-search combinations with all historical fine/local/calibrate/timing flags enabled, and the selection path. These remain unchanged.

| pacing candidate (rank) | kills ch1–5 | monster.hpGrowth | monster.xpGrowth | strict passes | failed targets |
| ---: | --- | ---: | ---: | ---: | --- |
| 1 | [18, 22, 26, 30, 30] | 1.06 | 1.11 | 7/9 | chapter-growth, boss-check |
| 2 | [12, 18, 24, 30, 30] | 1.06 | 1.06 | 6/9 | chapter-growth, class-spread, boss-check |
| 3 | [12, 18, 24, 30, 30] | 1.08 | 1.11 | 6/9 | chapter-growth, class-spread, boss-check |
| 4 | [18, 22, 26, 30, 30] | 1.06 | 1.06 | 6/9 | chapter-growth, class-spread, boss-check |
| 5 | [10, 15, 21, 28, 30] | 1.06 | 1.11 | 5/9 | first-boss, chapter-growth, chapter-bounds, boss-check |
| 6 | [10, 15, 21, 28, 30] | 1.1 | 1.11 | 5/9 | chapter-growth, class-spread, chapter-bounds, boss-check |
| 7 | [10, 15, 21, 28, 30] | 1.12 | 1.06 | 5/9 | chapter-growth, class-spread, chapter-bounds, boss-check |
| 8 | [12, 18, 24, 30, 30] | 1.06 | 1.11 | 5/9 | first-boss, chapter-growth, chapter-bounds, boss-check |
| 9 | [12, 18, 24, 30, 30] | 1.08 | 1.06 | 5/9 | chapter-growth, class-spread, chapter-bounds, boss-check |
| 10 | [12, 18, 24, 30, 30] | 1.1 | 1.06 | 5/9 | chapter-growth, class-spread, chapter-bounds, boss-check |
| 11 | [12, 18, 24, 30, 30] | 1.1 | 1.11 | 5/9 | chapter-growth, class-spread, chapter-bounds, boss-check |
| 12 | [12, 18, 24, 30, 30] | 1.12 | 1.06 | 5/9 | chapter-growth, class-spread, chapter-bounds, boss-check |
| 13 | [12, 18, 24, 30, 30] | 1.12 | 1.11 | 5/9 | chapter-growth, class-spread, chapter-bounds, boss-check |
| 14 | [18, 22, 26, 30, 30] | 1.08 | 1.06 | 5/9 | first-boss, chapter-growth, class-spread, boss-check |
| 15 | [10, 15, 21, 28, 30] | 1.06 | 1.06 | 4/9 | first-boss, chapter-growth, class-spread, chapter-bounds, boss-check |
| 16 | [10, 15, 21, 28, 30] | 1.08 | 1.06 | 4/9 | first-boss, chapter-growth, class-spread, chapter-bounds, boss-check |
| 17 | [10, 15, 21, 28, 30] | 1.08 | 1.11 | 4/9 | first-boss, chapter-growth, class-spread, chapter-bounds, boss-check |
| 18 | [10, 15, 21, 28, 30] | 1.1 | 1.06 | 4/9 | chapter-growth, class-spread, chapter-bounds, never-stuck, boss-check |
| 19 | [10, 15, 21, 28, 30] | 1.12 | 1.11 | 4/9 | chapter-growth, class-spread, chapter-bounds, never-stuck, boss-check |
| 20 | [18, 22, 26, 30, 30] | 1.08 | 1.11 | 4/9 | first-boss, chapter-growth, class-spread, chapter-bounds, boss-check |
| 21 | [18, 22, 26, 30, 30] | 1.1 | 1.06 | 4/9 | first-boss, chapter-growth, class-spread, chapter-bounds, boss-check |
| 22 | [18, 22, 26, 30, 30] | 1.12 | 1.06 | 4/9 | first-boss, chapter-growth, class-spread, chapter-bounds, boss-check |
| 23 | [18, 22, 26, 30, 30] | 1.12 | 1.11 | 4/9 | first-boss, chapter-growth, class-spread, chapter-bounds, boss-check |
| 24 | [18, 22, 26, 30, 30] | 1.1 | 1.11 | 3/9 | first-boss, chapter-growth, class-spread, chapter-bounds, never-stuck, boss-check |

| pressure candidate (rank) | kills ch1–5 | HP growth | XP growth | boss ATK ch1–5 | strict passes | failed targets |
| ---: | --- | ---: | ---: | --- | ---: | --- |
| 1 | [18, 22, 26, 30, 30] | 1.06 | 1.11 | [1.275, 2.25, 3.75, 4.5, 5.25] | 7/9 | chapter-growth, boss-check |
| 2 | [18, 22, 26, 30, 30] | 1.06 | 1.11 | [1.7, 3, 5, 6, 7] | 7/9 | chapter-growth, boss-check |
| 3 | [18, 22, 26, 30, 30] | 1.06 | 1.11 | [2.125, 3.75, 6.25, 7.5, 7.5] | 7/9 | chapter-growth, boss-check |
| 4 | [18, 22, 26, 30, 30] | 1.06 | 1.11 | [2.55, 4.5, 7.5, 7.5, 7.5] | 7/9 | chapter-growth, boss-check |
| 5 | [12, 18, 24, 30, 30] | 1.06 | 1.06 | [1.275, 2.25, 3.75, 4.5, 5.25] | 6/9 | chapter-growth, class-spread, boss-check |
| 6 | [12, 18, 24, 30, 30] | 1.06 | 1.06 | [1.7, 3, 5, 6, 7] | 6/9 | chapter-growth, class-spread, boss-check |
| 7 | [12, 18, 24, 30, 30] | 1.06 | 1.06 | [2.125, 3.75, 6.25, 7.5, 7.5] | 6/9 | chapter-growth, class-spread, boss-check |
| 8 | [12, 18, 24, 30, 30] | 1.06 | 1.06 | [2.55, 4.5, 7.5, 7.5, 7.5] | 6/9 | chapter-growth, class-spread, boss-check |
| 9 | [12, 18, 24, 30, 30] | 1.08 | 1.11 | [1.275, 2.25, 3.75, 4.5, 5.25] | 5/9 | chapter-growth, class-spread, chapter-bounds, boss-check |
| 10 | [12, 18, 24, 30, 30] | 1.08 | 1.11 | [1.7, 3, 5, 6, 7] | 5/9 | chapter-growth, class-spread, chapter-bounds, boss-check |
| 11 | [12, 18, 24, 30, 30] | 1.08 | 1.11 | [2.55, 4.5, 7.5, 7.5, 7.5] | 5/9 | chapter-growth, class-spread, chapter-bounds, boss-check |
| 12 | [12, 18, 24, 30, 30] | 1.08 | 1.11 | [2.125, 3.75, 6.25, 7.5, 7.5] | 4/9 | chapter-growth, class-spread, chapter-bounds, never-stuck, boss-check |

### Residual boss and growth failures, with cell counts

| family | rank | chapter ratios in strict window / 28 | first-win cells in strict window / 35 | first-win cells too easy | first-win cells too hard/missing |
| --- | ---: | ---: | ---: | ---: | ---: |
| pacing | 1 | 0/28 | 2/35 | 33 | 0 |
| pacing | 2 | 7/28 | 3/35 | 21 | 11 |
| pacing | 3 | 1/28 | 0/35 | 28 | 7 |
| pressure | 1 | 0/28 | 4/35 | 31 | 0 |
| pressure | 2 | 0/28 | 3/35 | 30 | 2 |
| pressure | 3 | 0/28 | 3/35 | 29 | 3 |
| pressure | 4 | 0/28 | 5/35 | 27 | 3 |
| pressure | 5 | 10/28 | 2/35 | 15 | 18 |
| pressure | 6 | 12/28 | 2/35 | 14 | 19 |
| pressure | 7 | 14/28 | 0/35 | 11 | 24 |
| pressure | 8 | 19/28 | 0/35 | 9 | 26 |
| pressure | 9 | 1/28 | 1/35 | 26 | 8 |
| pressure | 10 | 4/28 | 4/35 | 20 | 11 |
| pressure | 11 | 8/28 | 2/35 | 14 | 19 |
| pressure | 12 | 7/28 | 3/35 | 16 | 16 |

PASS — rechecked 3 top candidates at step 1 and step 2. 0 candidates qualified for the conditional seeds 4–8 check.

NOT VERIFIED — holdout failure rate on seeds 4–8: not applicable because no candidate passed all strict targets on seeds 1–3. No rate is inferred or reported as zero. The inherited proposal writer independently retains its seeds 1–20 measurement.

### Closest candidate 1

```json
{
  "cat": {
    "baseAtk": 14,
    "baseHp": 300,
    "baseDef": 5,
    "levelGrowth": 0.06,
    "xpGrowth": 1.12
  },
  "monster": {
    "hpBase": 90,
    "hpGrowth": 1.06,
    "atkBase": 8,
    "atkGrowth": 1.06,
    "xpBase": 18,
    "xpGrowth": 1.11
  },
  "idle": {
    "dailyKeys": 3,
    "walkTimeMs": 1000,
    "gearDropChance": 0.0067
  },
  "boss": {
    "maxMs": 180000,
    "attackIntervalMs": 4500,
    "bigEveryMs": 6000,
    "bigMultiplier": 1.5,
    "firstClearKeys": 1,
    "chapterHpMul": [
      14,
      20,
      30,
      40,
      50
    ],
    "chapterAtkMul": [
      0.85,
      1.5,
      2.5,
      3,
      3.5
    ]
  },
  "chapters": {
    "killsPerRound": [
      18,
      22,
      26,
      30,
      30
    ]
  }
}
```

| target | step 2 strict | step 2 relaxed | step 1 strict |
| --- | --- | --- | --- |
| first-boss | PASS | PASS | PASS |
| chapter-growth | FAIL | FAIL | FAIL |
| class-spread | PASS | PASS | PASS |
| chapter-bounds | PASS | PASS | PASS |
| never-stuck | PASS | PASS | PASS |
| craft-salvage-loss | PASS | PASS | PASS |
| walk-share | PASS | PASS | PASS |
| boss-check | FAIL | FAIL | FAIL |
| guardrails | PASS | PASS | PASS |
### Closest candidate 2

```json
{
  "cat": {
    "baseAtk": 14,
    "baseHp": 300,
    "baseDef": 5,
    "levelGrowth": 0.06,
    "xpGrowth": 1.12
  },
  "monster": {
    "hpBase": 90,
    "hpGrowth": 1.06,
    "atkBase": 8,
    "atkGrowth": 1.06,
    "xpBase": 18,
    "xpGrowth": 1.11
  },
  "idle": {
    "dailyKeys": 3,
    "walkTimeMs": 1000,
    "gearDropChance": 0.0067
  },
  "boss": {
    "maxMs": 180000,
    "attackIntervalMs": 4500,
    "bigEveryMs": 6000,
    "bigMultiplier": 1.5,
    "firstClearKeys": 1,
    "chapterHpMul": [
      14,
      20,
      30,
      40,
      50
    ],
    "chapterAtkMul": [
      1.275,
      2.25,
      3.75,
      4.5,
      5.25
    ]
  },
  "chapters": {
    "killsPerRound": [
      18,
      22,
      26,
      30,
      30
    ]
  }
}
```

| target | step 2 strict | step 2 relaxed | step 1 strict |
| --- | --- | --- | --- |
| first-boss | PASS | PASS | PASS |
| chapter-growth | FAIL | FAIL | FAIL |
| class-spread | PASS | PASS | FAIL |
| chapter-bounds | PASS | PASS | PASS |
| never-stuck | PASS | PASS | PASS |
| craft-salvage-loss | PASS | PASS | PASS |
| walk-share | PASS | PASS | PASS |
| boss-check | FAIL | FAIL | FAIL |
| guardrails | PASS | PASS | PASS |
### Closest candidate 3

```json
{
  "cat": {
    "baseAtk": 14,
    "baseHp": 300,
    "baseDef": 5,
    "levelGrowth": 0.06,
    "xpGrowth": 1.12
  },
  "monster": {
    "hpBase": 90,
    "hpGrowth": 1.06,
    "atkBase": 8,
    "atkGrowth": 1.06,
    "xpBase": 18,
    "xpGrowth": 1.11
  },
  "idle": {
    "dailyKeys": 3,
    "walkTimeMs": 1000,
    "gearDropChance": 0.0067
  },
  "boss": {
    "maxMs": 180000,
    "attackIntervalMs": 4500,
    "bigEveryMs": 6000,
    "bigMultiplier": 1.5,
    "firstClearKeys": 1,
    "chapterHpMul": [
      14,
      20,
      30,
      40,
      50
    ],
    "chapterAtkMul": [
      1.7,
      3,
      5,
      6,
      7
    ]
  },
  "chapters": {
    "killsPerRound": [
      18,
      22,
      26,
      30,
      30
    ]
  }
}
```

| target | step 2 strict | step 2 relaxed | step 1 strict |
| --- | --- | --- | --- |
| first-boss | PASS | PASS | PASS |
| chapter-growth | FAIL | FAIL | FAIL |
| class-spread | PASS | PASS | FAIL |
| chapter-bounds | PASS | PASS | PASS |
| never-stuck | PASS | PASS | PASS |
| craft-salvage-loss | PASS | PASS | PASS |
| walk-share | PASS | PASS | PASS |
| boss-check | FAIL | FAIL | FAIL |
| guardrails | PASS | PASS | PASS |

## Every changed proposal leaf versus 9d820a0

No proposal value changed: the closest eligible proposal is retained because no new candidate improved its strict target count. The full current-production / C5c / proposed leaf table remains regenerated in docs/proposals/numbers-v2.md. Search-only differences are fully disclosed above: each element in the kills and ATK arrays is a leaf; all unspecified leaves equal the frozen proposal.

| leaf | old at 9d820a0 | new |
| --- | --- | --- |
| all PROPOSED_V2_OVERRIDES leaves | unchanged | unchanged |

Only the new opt-in pacing measurement harness and proposal-report wording were added in simulator scope. Existing thresholds, equivalence digests, combat flags (big/dodged), tests and timeouts remain unchanged versus 9d820a0. The V6f report inherited from the base was removed as explicitly required by the origin/main allowlist self-check; it is absent from origin/main and therefore absent from the final main-relative diff.

## Check output and fix rounds

Fix round 1: initial build failed in the newly added harness because general number arrays were not assignable to the guarded five-element tuples. Fixed the tuple types inside the allowed simulator file; the build then passed.

```text
> taskbar-hero@0.0.0 build /Users/bao/.codex/worktrees/v6h-pacing/taskbar hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/chain build$ tsc --noEmit
packages/auth build$ tsc --noEmit
supabase/tests build$ tsc --noEmit
packages/game-rules build$ tsc --noEmit
packages/chain build: Done
packages/auth build: Done
packages/game-rules build: src/v2/sim/pacing.test.ts(33,23): error TS2322: Type 'number[]' is not assignable to type '[(number | undefined)?, (number | undefined)?, (number | undefined)?, (number | undefined)?, (number | undefined)?]'.
packages/game-rules build:   Target allows only 5 element(s) but source may have more.
packages/game-rules build: src/v2/sim/pacing.test.ts(54,7): error TS2322: Type 'number[]' is not assignable to type '[(number | undefined)?, (number | undefined)?, (number | undefined)?, (number | undefined)?, (number | undefined)?]'.
packages/game-rules build:   Target allows only 5 element(s) but source may have more.
packages/game-rules build: Failed
/Users/bao/.codex/worktrees/v6h-pacing/taskbar hero/packages/game-rules:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @taskbar-hero/game-rules@0.0.0 build: `tsc --noEmit`
Exit status 2
 ELIFECYCLE  Command failed with exit code 2.
```

Fix round 2: initial 24-candidate search completed its calculations but exceeded its 180000ms test timeout. The same 24 candidates, three seeds, seven classes, full horizon and guardrail assertions were repartitioned into four tests of six candidates. The accumulated candidate-count assertions were retained and strengthened at each batch. No timeout was raised, candidate removed, assertion weakened, snapshot changed or existing test edited.

```text
RUN  v5.0.5 /Users/bao/.codex/worktrees/v6h-pacing/taskbar hero/packages/game-rules

stdout | src/v2/sim/pacing.test.ts > measures bounded pacing and pressure without changing targets
pacing 1/24: 4/9
pacing 2/24: 5/9
pacing 3/24: 4/9
pacing 4/24: 4/9
pacing 5/24: 4/9
pacing 6/24: 5/9
pacing 7/24: 5/9
pacing 8/24: 4/9
pacing 9/24: 6/9
pacing 10/24: 5/9
pacing 11/24: 5/9
pacing 12/24: 6/9
pacing 13/24: 5/9
pacing 14/24: 5/9
pacing 15/24: 5/9
pacing 16/24: 5/9
pacing 17/24: 6/9
pacing 18/24: 7/9
pacing 19/24: 5/9
pacing 20/24: 4/9
pacing 21/24: 4/9
pacing 22/24: 3/9
pacing 23/24: 4/9
pacing 24/24: 4/9

 ❯ src/v2/sim/pacing.test.ts (3 tests | 1 failed | 1 skipped) 233466ms
   × measures bounded pacing and pressure without changing targets 232683ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/v2/sim/pacing.test.ts > measures bounded pacing and pressure without changing targets
Error: Test timed out in 180000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ src/v2/sim/pacing.test.ts:25:41
     23| }, 180000);
     24|
     25| it.runIf(process.env.V6H_SEARCH === '1')('measures bounded pacing and …
       |                                         ^
     26|   const ranked = [];
     27|   // Prefer chapter leaves, then independently test global growth only…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 1 passed | 1 skipped (3)
   Start at  16:21:06
   Duration  233.65s (tests 100%)

undefined
/Users/bao/.codex/worktrees/v6h-pacing/taskbar hero/packages/game-rules:
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: vitest run src/v2/sim/pacing.test.ts
```

PASS — gen:deno + drift

```text

> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/v6h-pacing/taskbar hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

PASS — typecheck

```text
packages/chain typecheck: Done
packages/auth typecheck: Done
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck: Done
apps/web typecheck: Done
```

PASS — lint

```text
packages/chain lint: Done
packages/auth lint: Done
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint: Done
apps/web lint: Done
```

PASS — root unit tests

```text
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Duration  311ms (transform 43%, import 33%, worker 13%, tests 11%)
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Duration  827ms (import 66%, tests 30%, transform 4%, worker 1%)
supabase/tests test:  Test Files  18 passed (18)
supabase/tests test:       Tests  385 passed (385)
supabase/tests test:    Duration  9.09s (tests 86%, import 12%, transform 1%)
packages/game-rules test:  Test Files  20 passed | 3 skipped (23)
packages/game-rules test:       Tests  330 passed | 2 expected fail | 11 skipped (343)
packages/game-rules test:    Duration  32.84s (tests 98%, import 2%, transform 1%)
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Duration  175ms (transform 49%, import 39%, tests 8%, worker 4%)
apps/web test:  Test Files  75 passed (75)
apps/web test:       Tests  1037 passed (1037)
apps/web test:    Duration  8.70s (environment 54%, tests 32%, import 11%, transform 2%)
```

PASS — build

```text
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
apps/web build: ✓ built in 333ms
apps/web build: Done
```

FAIL — Playwright e2e

```text


  1) [stage-layout] › e2e/layout/stage-layout.spec.ts:224:3 › Mini mode › switches to the classic 96 px strip, is remembered, and switches back

    Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4174/
    Call log:
      - navigating to "http://localhost:4174/", waiting until "load"


      223 |
      224 |   test('switches to the classic 96 px strip, is remembered, and switches back', async ({ page }) => {
    > 225 |     await page.goto('/');
          |                ^
      226 |     await expect(page.getByRole('region', { name: 'Game stage' })).toBeVisible();
      227 |     await page.getByRole('button', { name: 'Mini mode' }).click();
      228 |
        at /Users/bao/.codex/worktrees/v6h-pacing/taskbar hero/apps/web/e2e/layout/stage-layout.spec.ts:225:16

    Error Context: test-results/layout-stage-layout-Mini-m-e8c50-emembered-and-switches-back-stage-layout/error-context.md

  2) [stage-layout] › e2e/layout/stage-layout.spec.ts:244:3 › Mini mode › works when localStorage throws

    Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4174/
    Call log:
      - navigating to "http://localhost:4174/", waiting until "load"


      250 |       Storage.prototype.setItem = fail;
      251 |     });
    > 252 |     await page.goto('/');
          |                ^
      253 |     // The How to play dialog opens when its "seen" flag cannot be read.
      254 |     await page.getByRole('button', { name: 'Start playing' }).click();
      255 |     await expect(page.getByRole('region', { name: 'Game stage' })).toBeVisible();
        at /Users/bao/.codex/worktrees/v6h-pacing/taskbar hero/apps/web/e2e/layout/stage-layout.spec.ts:252:16

    Error Context: test-results/layout-stage-layout-Mini-mode-works-when-localStorage-throws-stage-layout/error-context.md

  2 failed
    [stage-layout] › e2e/layout/stage-layout.spec.ts:224:3 › Mini mode › switches to the classic 96 px strip, is remembered, and switches back
    [stage-layout] › e2e/layout/stage-layout.spec.ts:244:3 › Mini mode › works when localStorage throws
  45 passed (23.7s)
 ELIFECYCLE  Command failed with exit code 1.
```

PASS — existing directed opt-in search

```text
 Test Files  1 passed (1)
      Tests  1 passed | 2 skipped (3)
   Duration  18.13s (tests 100%)
```

PASS — existing fine/local/calibrate/timing + selection

```text
 Test Files  1 passed (1)
      Tests  2 passed | 1 skipped (3)
   Duration  12.54s (tests 99%)
```

PASS — new pacing/boss-pressure/both-cadence search

```text
 Test Files  1 passed (1)
      Tests  7 passed (7)
   Duration  226.94s (tests 100%)
```

PASS — proposal writer seeds 1–20

```text

 RUN  v5.0.5 /Users/bao/.codex/worktrees/v6h-pacing/taskbar hero/packages/game-rules


 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  16:31:01
   Duration  18.33s (tests 100%)

```

PASS — unchanged equivalence digests

```text
 Test Files  1 passed (1)
      Tests  1 passed (1)
   Duration  358ms (tests 85%, import 7%, transform 7%, worker 1%)
```

Exact commands: every occurrence of `pnpm` below was invoked via `npx -y pnpm@10.28.0` from the repository root, except e2e from apps/web.

```sh
CI=true npx -y pnpm@10.28.0 install --frozen-lockfile
npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions
npx -y pnpm@10.28.0 typecheck
npx -y pnpm@10.28.0 lint
npx -y pnpm@10.28.0 test
npx -y pnpm@10.28.0 build
cd apps/web && npx -y pnpm@10.28.0 test:e2e
V2_SIM_SEARCH=1 V2_SIM_SEARCH_OUTPUT=/tmp/v6h-logs/legacy-search.json npx -y pnpm@10.28.0 --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/search.test.ts
V2_SIM_FINE=1 V2_SIM_LOCAL=1 V2_SIM_CALIBRATE=1 V2_SIM_TIMING=1 V2_SIM_SELECT=1 V2_SIM_SELECT_INPUTS=/tmp/v6h-logs/legacy-search.json V2_SIM_SEARCH_OUTPUT=/tmp/v6h-logs/legacy-selection.json npx -y pnpm@10.28.0 --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/search.test.ts
V6H_BASELINE=1 V6H_SEARCH=1 V6H_PRESSURE=1 V6H_REVIEW=1 npx -y pnpm@10.28.0 --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/pacing.test.ts
V2_SIM_WRITE=1 V2_SIM_DATA=/tmp/v6h-logs/writer-data.json npx -y pnpm@10.28.0 --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/report.write.test.ts
npx -y pnpm@10.28.0 --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/equivalence.test.ts
```

## Gate and acceptance self-check

PASS — diagnosis contains every class/chapter/seed and both claim cadences, with existing first-boss stability evidence.
PASS — search stays inside existing guardrails; D1 S-B and big/dodged semantics retained.
PASS — strict and relaxed pass/fail tables disclosed; selected proposal remains NOT READY.
PASS — conditional holdout gate handled honestly; no strict winner, no fabricated failure rate.
PASS — every changed proposal leaf disclosed (none); candidate leaf differences shown.
PASS — docs/proposals/numbers-v2.md regenerated; signature unsigned.
PASS — equivalence test and digest values unchanged and passing.
PASS — no existing test assertion changed; no tests disabled/deleted, no .only/.skip added, no timeout raised. Default opt-in skips in the root suite are pre-existing behavior; each existing opt-in path and each new harness test was also run explicitly.
PASS — user retains D4 numbers sign-off, planning date 30 Oct.
PASS — no production config, content, contracts, auth/SIWE, secrets, dependency/lock/workspace edits, migration application, database writes, deployment, PR, merge, sharing change or Actions dispatch.
PASS — exactly two fix rounds, both confined to the new harness.
FAIL — final e2e acceptance: 45 passed / 2 connection-refused failures; overall validation blocked. Earlier e2e result: 47 passed (19.2s).
NOT VERIFIED — preview-server failure root cause or exact repair; no test/assertion change is justified by the navigation failure.

NOT VERIFIED — the exact final source snapshot was not re-run through typecheck/lint/build/unit tests after the last report-heading text adjustment in report.ts. The passing check logs above precede that wording-only edit; the e2e stop prevented further validation. No executable logic changed in that adjustment.

NOT VERIFIED — exhaustive config-space impossibility; real production gameplay feel; conditional holdout failure rate. No production change or user sign-off was attempted.

Needed to continue: authorization for another validation attempt and, if needed after diagnosis, apps/web/playwright.config.ts for preview-server lifecycle work. No more fixes were attempted after the two permitted rounds. A further authorized search of guarded config values, or a separately scoped content/class-multiplier investigation if desired. The present evidence does not justify READY.

### Final main-relative scope and author checks

```text
PASS — git fetch origin +main:refs/remotes/origin/main
PASS — git diff --name-only origin/main...HEAD: every path allowed
docs/proposals/numbers-v2.md
packages/game-rules/src/v2/sim/equivalence.test.ts
packages/game-rules/src/v2/sim/pacing.test.ts
packages/game-rules/src/v2/sim/player.ts
packages/game-rules/src/v2/sim/proposal.ts
packages/game-rules/src/v2/sim/report.ts
packages/game-rules/src/v2/sim/report.write.test.ts
packages/game-rules/src/v2/sim/search.test.ts
packages/game-rules/src/v2/sim/sim.test.ts
packages/game-rules/src/v2/sim/simulate.ts
packages/game-rules/src/v2/sim/targets.test.ts
packages/game-rules/src/v2/sim/targets.ts
reports/v6h-pacing.md
```

```text
docs/proposals/numbers-v2.md                       | 980 ++++++++-------------
 packages/game-rules/src/v2/sim/equivalence.test.ts |  12 +
 packages/game-rules/src/v2/sim/pacing.test.ts      |  91 ++
 packages/game-rules/src/v2/sim/player.ts           |   4 +-
 packages/game-rules/src/v2/sim/proposal.ts         | 343 +++++---
 packages/game-rules/src/v2/sim/report.ts           | 241 +++--
 .../game-rules/src/v2/sim/report.write.test.ts     |  59 +-
 packages/game-rules/src/v2/sim/search.test.ts      | 188 ++--
 packages/game-rules/src/v2/sim/sim.test.ts         |  13 +-
 packages/game-rules/src/v2/sim/simulate.ts         |   4 +-
 packages/game-rules/src/v2/sim/targets.test.ts     |  10 +
 packages/game-rules/src/v2/sim/targets.ts          |   7 +-
 reports/v6h-pacing.md                              | 740 ++++++++++++++++
 13 files changed, 1654 insertions(+), 1038 deletions(-)
```

```text
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

```text
(no diff; exit 0)
```
