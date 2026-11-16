# S2b: fixed-25% boundary diagnosis

2026-11-16. Production attack/Power remains 1.15, retention 2500 bp; all prices, rewards, thresholds and action clocks remain frozen. This item diagnoses the rejected 1.20 experiment. It does not establish E3/E4/E5 or create a parity baseline.

## Sources and application

1. Hyndman & Fan, *Sample Quantiles in Statistical Packages* (1996), [author paper](https://robjhyndman.com/papers/sample_quantiles.pdf). Quantile definitions differ; preserve the existing linear estimator when replaying recorded gates. Formal paper.
2. [NIST randomized block designs](https://www.itl.nist.gov/div898/handbook/pri/section3/pri332.htm). Match native account/profile seeds and token scenario seeds so nuisance variation is explicit.
3. [SciPy bootstrap](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.bootstrap.html). Paired resampling uses the same row indices for both samples. Report uncertainty separately from the fixed pass/fail gates.
4. [SciPy permutation tests](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.permutation_test.html). Pair assignment and independent resampling answer different questions. A shared starting seed does not guarantee synchronized random events after conditional branches.
5. [NumPy quantile](https://numpy.org/doc/stable/reference/generated/numpy.quantile.html). The existing interpolation is the documented linear/type-7 estimator. A median of ratios is not a ratio of medians.
6. [NumPy parallel RNG](https://numpy.org/doc/stable/reference/random/parallel.html). Record seed ranges and stable job identity. Preserve the historical simulator RNG for exact replay; do not silently replace it.
7. [R quantile documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/quantile.html). Cross-check the type-7 definition and make missing/censored native milestones explicit.

Sargent paper links at informs-sim returned 404 and Syracuse returned 403; they are not counted as read sources.

## Initial comparison, before building diagnostic tooling

Method A: compare existing 200-seed aggregate token reports. At required 25% retention, 1.15 -> 1.20 changes low-bot burn/claims 0.9968275226 -> 0.9938142595 and high-bot Stars 1.1015423773 -> 1.1012631046. Both remain 16/18. This does not identify the cause.

Method B: compare native account records paired by profile/seed. Both banks have the same 1,000 ordered keys. Median first Legendary stays 14/10/9/9/9 days and median level 15 stays 33/28/25/24/24 for casual/regular/heavy/whale-free/bot. Median completed routes changes 150/205.5/235/242/246 -> 151/206/237/245/247. The attack increase has weak influence on the milestones used by the token model; another scalar increase is not justified by these aggregates.

## Preregistered diagnostic method

- Restore and hash-check both recorded frozen models and their native banks. Reproduce all recorded quantiles for the two failed scenarios over original seeds 53113..53312 before trusting instrumentation.
- Add observation-only terminal profile balances and failed-spend counts in isolated model copies. Compare every original output field against the unmodified model for every replayed run. No simulator policy or RNG changes.
- Use exact YARN conservation: burn - claims = external volume - treasury - remaining wallet balances. Retained Spool is not burned YARN. Use exact Star conservation: source = sink + remaining active/inactive balances. Do not divide independently aggregated medians to explain a median ratio.
- Compare paired 1.15/1.20 outputs, including mean additive ledger differences and per-seed ratios. Preserve the archived 15% comparison as a diagnostic counterfactual only; it cannot be adopted.
- Preselect holdout token seeds 73113..73312, 200 runs per candidate and failed scenario. Same fixed native banks: this checks token sampling, not new combat-cohort generalization. Do not replace the official failing gate with a favorable holdout.
- Use 5,000 deterministic paired bootstrap resamples for 95% percentile intervals. Report ratios, ledger slack, spend failures, profile balances, and early/late accumulation. Any later class candidate must have a specific measured causal hypothesis and fresh native cohorts/full gates.

Results and the method decision will be appended after exact replay and the holdout complete.

## Additional channel experiment

The channel masks and seed range were specified in the tool invocation before execution; the first documentation-append command had a Python newline error, corrected here while the experiment ran. Use the existing 73113..73312 diagnostic block to compare two hybrids: 1.15 records with only 1.20 gear/gearItems, versus only 1.20 hours/wins/completedRoutes/level/cleared. Preserve ordered account keys, first-Legendary records and all policy. First reproduce 400 full 1.20 runs using the 1.15 token runtime to verify that runtime combat differences do not directly affect token bookkeeping. These hybrids are pathway probes, not realizable native cohorts, new holdout evidence, or candidate gates. Compare both methods against 1.15 on the same seeds.

## Measured result and decision

Exact replay passed 2,000 original-output comparisons, 2,000 conservation checks and all 306 saved quantiles. A bookkeeping assertion incorrectly expected 288 checks on the first attempt; the retained log records that failure. Deriving the expected count from the immutable reports fixed it; the full rerun reproduced the identical raw run file. The channel probe separately reproduced 400 1.20 runs using the 1.15 token runtime, then measured 800 hybrid runs.

Independent token seeds: 1.15/1.20 low-bot median burn/claims 0.9922455524/0.9889858946; high-bot Stars 1.1017422013/1.1018494265. Both failures persist. The original paired 1.20-minus-1.15 burn median difference is -0.0030133, 95% percentile interval [-0.0093247, 0.0034056]; high-bot Star difference -0.0002793, interval [-0.0013873, 0.0011226]. All relevant replay/holdout intervals include zero. They do not replace the fixed gate.

At 1.15, low-bot **mean** YARN bridge is 3823.5 external inflow - 114.93 treasury - 3787.281341 wallets = -78.711341. At 1.20 it is -114.367742. High-bot **mean** Star balances are 414.185, including 142.515 on inactive accounts; 10% of mean sinks is 407.448. Exact per-run identities, not ratios of independently aggregated medians, identify the missing spending. Remaining Epic inventories and unpolished slots are plentiful while casual accounts repeatedly fail purchase affordability; counts include repeated attempts.

Gear-only versus progression-only hybrids produce low-bot burn medians 0.9947185671 versus 0.9907852586; high-bot Star medians 1.1014655147 versus 1.1016305618. Neither repairs its boundary. Compared with 1.15 on that block, the gear channel gains 0.0024730 burn ratio but remains below 1.0.

**Decision:** end blind scalar-attack search. Keep 1.15/2500 bp and the original 16/18 failures. A third class-only candidate needs a measured acquisition/eligibility mechanism and independently preselected native cohorts, not a small noisy ratio movement. No sensitivity/E4/E5 or parity baseline is authorized by these results. Carry this unresolved boundary into S11 while independent audio/repository work proceeds; this is not a proof that all class-only remedies are impossible. See `S2b/boundary-decision.json`, `boundary-diagnosis.json`, `boundary-channels.json`, and `boundary-check.json`.

## Eligibility observation, preregistered16November13:03UTC

Compare two attribution methods on the same immutable1.15/1.20banks: the existing coarse failed-spend counters and new observation-only predicate counts at actual attempted purchases. The prior gear-only/progression-only methods measured burn ratios0.9947185671/0.9907852586 and Stars1.1014655147/1.1016305618; neither is a remedy. The seven research sources above remain applicable.

The next diagnostic uses original token seeds53113..53212 and new token seeds83113..83212, both failed scenarios, both immutable models:800instrumented runs, each compared field-for-field to its untouched runtime. New token seeds are not fresh native-cohort evidence. Count actual studio attempt failures by no qualifying item, completed finite purchase, quote rejection, missing Stars or missing YARN; count potential withdrawal/seal access by the unchanged level/age/deed predicates without consuming RNG or changing decisions. Record native weekly acquisition, level15 and reward-win incidence. No intervention, policy, threshold, class stat or baseline changes. A class-only candidate still needs an actual causal mechanism and fresh native cohorts; counts of repeated opportunities are not distinct players or incremental purchases.

Eligibility observation completed800/800exact unchanged-output comparisons. In the new low-bot block, casual polish attempts fail for missing qualifying items2.73times versus missing YARN1403.50times on average;1261.44succeed and28.51lack Stars. These are repeated attempts per simulation. Of6000native account-weeks, only1in the1.15bank and2in1.20lack reward wins. All five level15/first-Legendary medians remain identical. New-token1.15medians are burn0.9943698414 and high-bot Stars1.1018463559, preserving both failures. The first100original burn subset passes1.0001865073, but cannot replace the official200seedfailure. No third candidate is supported; see eligibility-decision-1.json.
