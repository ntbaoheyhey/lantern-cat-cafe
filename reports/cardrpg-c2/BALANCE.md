# B4 — round four

**12 Nov user override:** tuning reopened without a pass cap. Earlier cap/closure statements below record the historical decision; current work continues from pass4. Previous cohorts remain unchanged.

B3 locked baseline and exact policy parity before tuning. All passes use five real UI seeds 80001–80005 for 1,800s each plus model seeds 80001–80500. Missing losses remain censored. Ordinary HP excludes tutorials, elite encounters and earned skips. See B3.md for the controlled baseline.

| Pass | Config change | Real bot | 500-seed model | Status |
|---|---|---|---|---|
| Baseline | C2 formation, inherited A6 values | First loss >30m all; boss median/p90 56.00/63.00s; ordinary HP mean/median 97.23/100% | First loss >30m all; boss 55.88/62.56s; HP 97.24/100% | Target miss |
| 1 | Ordinary HP ×1.15, ATK ×1.8; boss HP ×2/1.5/1.2 and ATK ×1/1.05/1.3 in chapters 1/2/3 | Five completed; median >30m (3 censored); 1/5 <8m (2.571m); boss 68.95/87.38s; normal HP85.24/89.11% | First-loss median >30m (293 censored); 121/500 <8m; boss 67.33/77.73s; normal HP 85.39/88.52% mean/median | Measured miss; exact real/model parity |
| 2 | Ordinary HP ×2/2.2/1.6, ATK ×1.1/1.1/2; boss HP ×2.2/1.7/1.35, ATK ×0.75/0.85/1.8 | Five completed; loss median13.145m; no seed<8m; boss81.53/92.73s; normalHP88.43/92.59% | First-loss median 12.245m; 1/500 <8m (7.425m); boss 80.99/93.42s; normal HP 88.68/97.46% | HP/early-loss miss; real/model outcomes exact, timing≈1% |
| 3 — FINAL | Ordinary HP ×2.6/3/1.25, ATK ×1.1/0.95/2.35; boss HP ×2.2/1.7/1.35, ATK ×0.7/0.7/1.8 | Five completed; loss median11.881m;0/5<8m;boss77.01/88.41s;normalHP81.10/91.48% mean/median | First-loss median11.977m; 0/500 <8m (earliest9.009m); boss76.48/91.12s; normalHP79.45/89.93% mean/median | UI loss7.17s early,HPmean1.10pp/median11.48pp high; model loss1.386s early,HPmedian9.93pp high; no fourth pass |

Pass 1 uses authored enemy HP/ATK config only. More ordinary pressure addresses the near-full-HP wins; extra early boss endurance addresses short bosses while preserving their attack budget. Chapter 3 has more boss attack pressure. Helpers use the ordinary table. No player stats, equipment, success count or elapsed time enter these budgets. Values are applied while creating enemyStats, so committed encounters and replay snapshots do not change. Legacy A6 and non-campaign budgets retain their previous values.

No target is claimed until both cohorts finish. Stop tuning after pass 3 if any target remains missed, retain the best measured pass, and report the gap.

Final pass3 exact parity:126 common encounters and1,272 common decisions match; currency/XP errors0; per-seed median playback error0.63–0.96%. Retain pass3 as the best measured candidate: it eliminates the early-loss seeds, meets both boss targets, and reduces ordinary-win HP. It does not meet all requested balance targets. B4 enemy tuning is closed. The B4b item-stat change is separately measured and will not be reported as a fourth B4 tuning pass.

## B4b pre-link-fix item/set configuration remeasurement

Enemy budgets remain B4 pass3. Item/set runtime SHA256 `aee2911161a54d0724c74b692d5072edec1aee400a02ca5ff5d0ca653e79e262`. Fresh immutable build, five browser seeds80001–80005 for1800s and fixed model seeds80001–80500. This measures the pre-link-fix B4b item changes; it is not a fourth B4 tuning pass.

| Cohort | First-loss median | Earliest loss | Seeds below8m | Boss median/p90 | Normal-win HP mean/median |
|---|---|---|---|---|---|
| real (5 seeds) | 12.260m | 9.468m | 0 | 71.82/93.93s | 78.14/90.61% |
| sim (500 seeds) | 11.792m | 9.056m | 0 | 74.97/94.91s | 78.04/89.39% |

All cohorts completed with zero browser/driver errors. Exact parity holds for132 encounters and1355 decisions; per-seed median playback error0.75–1.10%. Boss timing, mean normal HP and the no-loss-before-eight-minutes condition pass in both cohorts. Browser first-loss median passes; model median is12.49s early. Normal-win HP medians remain10.61pp/browser and9.39pp/model above the80% ceiling. Keep these misses visible; no further enemy tuning is authorized.

Evidence: projectless session9 `work/c2/b4b-set-targets-complete.json`, `b4b-set-parity.json` and the frozen per-seed real/sim directories.

## B4b corrected source/policy remeasurement

Frozen runtime SHA256 `c7b8656e3c02f9ec14af1152a137efccd1202faa04943828aef43eafdff3f366`; enemy/item configuration unchanged. Both cohorts completed; browser errors0.

| Cohort | First-loss median | Earliest loss | Seeds below8m | Boss median/p90 | Normal-win HP mean/median |
|---|---|---|---|---|---|
| real (5 seeds) | 12.232m | 9.441m | 0 | 71.91/93.76s | 78.14/90.61% |
| sim (500 seeds) | 11.792m | 9.056m | 0 | 74.96/94.91s | 78.06/89.42% |

Exact parity:133 common encounters,1,358 decisions; currency/XP errors0; per-seed median playback error0.84–0.94%. Boss timing and mean normal-win HP meet targets; no seed loses before8min. UI loss median meets12–20min; model median is12.49s early. Normal-win HP medians exceed the80% ceiling by10.61pp/UI and9.42pp/model. No additional enemy tuning.

Evidence: session9 `work/c2/b4b-link-balance.json`, `b4b-link-parity.json` and frozen real/sim directories.


## B4b affix/Riposte candidate remeasurement

Frozen runtime `4e68bb5977dfd04657aada154793a2bc1513811b3b48ecd183af9d8dd57f69a1`; same B4pass3 enemy tables. Both cohorts completed with zero browser errors.

| Cohort | First-loss median | Earliest loss | Seeds below8m | Boss median/p90 | Normal-win HP mean/median |
|---|---|---|---|---|---|
| real (5 seeds) | 12.373m | 9.489m | 0 | 71.86/94.05s | 77.92/90.28% |
| sim (500 seeds) | 11.790m | 9.056m | 0 | 74.78/94.90s | 78.14/89.51% |

Exact parity for133 common encounters and1365 decisions; currency/XP errors0; per-seed median playback error0.75–0.92%. Boss timing, mean normal HP and no loss before8min meet targets. UI first-loss median12.373m passes; model first loss is12.593s early. Normal-win HP medians remain10.28pp/UI and9.51pp/model above the80% ceiling. No additional enemy tuning.

Evidence: session9 `work/c2/b4b-affix-balance.json`, `b4b-affix-parity.json` and the frozen real/sim directories.

## Reopened pass4 — preliminary model diagnostics

2026-11-12T13:18:20.910461+00:00. User removed the pass and return caps. Baseline trace analysis: chapter1/2 ordinary-win HP medians are100%; chapter3 ordinary medians66.66%/82.30%. Raising endurance alone prolongs heal cycles and selects only easy victories. Pass4 keeps early endurance, moderates the chapter3 HP wall and increases its strike pressure. Only BALANCE_C2 table values change. Boss tables, seeds, policy, thresholds and all prior evidence are preserved.

Each diagnostic below uses50 complete model seeds80001–80050 ×1800s from frozen baseline runtime4e68bb59 with only the listed candidate table applied in memory. These are preliminary model measurements, not five real UI runs or500-seed acceptance. Raw traces/configs: projectless session x/work/c2.

| Diagnostic | Ordinary HP / ATK by chapter | Loss median min / early seeds | Boss median/p90 s | Normal HP mean/median % |
|---|---|---|---|---|
| pass4-diagnostic | [2.6, 3, 1.25] / [1.4, 1.35, 2.25] | 12.446 / 1 | 68.57/94.38 | 79.07/90.08 |
| d5 | [3.2, 3.7, 1.35] / [1.1, 0.95, 2.5] | 12.689 / 0 | 82.90/96.72 | 77.94/91.95 |
| d6 | [3.2, 3.7, 1.5] / [1.1, 0.95, 2.35] | 13.016 / 0 | 83.40/96.57 | 81.21/94.08 |
| d7 | [2.6, 3, 1.4] / [1.2, 1.1, 2.4] | 11.742 / 0 | 79.38/95.31 | 80.29/94.06 |
| d8 | [3.2, 3.7, 1.2] / [1.2, 1.1, 2.6] | 12.734 / 0 | 82.99/96.49 | 75.53/87.64 |
| d9 | [3.2, 3.7, 0.9] / [1.2, 1.1, 3] | 12.580 / 0 | 85.84/96.87 | 70.03/80.30 |
| d10 | [3.2, 3.7, 0.7] / [1.2, 1.1, 3.5] | 12.465 / 0 | 88.85/97.30 | 65.18/60.05 |
| d11 | [3.5, 4.2, 1.0] / [1.2, 1.1, 2.8] | 13.484 / 0 | 83.40/96.87 | 72.65/85.11 |
| d12 | [3.2, 3.7, 1.0] / [1.2, 1.1, 2.65] | 12.794 / 0 | 74.95/95.76 | 71.35/77.53 |

Candidate d12 is the prospective pass4: ordinary HP3.2/3.7/1 and ATK1.2/1.1/2.65; boss values unchanged. Its first five model seeds also meet all metric ranges; this does not replace the real UI cohort. Freeze source, run existing fixed-budget/replay tests, then measure500 model seeds80001–80500 and five real UI seeds80001–80005 for1800s. No acceptance before both finish.

Pass4 complete500 model: first-loss median12.664m,earliest3.224m,3 early seeds;boss77.86/96.72s;HP71.11/77.08%. **Rejected** for early losses. The five realUI traces and partial catalog screen are stopped early once the model rejection is established; retained as partial diagnostics, never labeled completed acceptance. UI frame delivery at150s was16.67ms/frame with0%>50ms and no errors. Pass5 diagnostic reduces chapter1/2 ATK back to1.1/0.95 while retaining the new HP curve.

## Reopened pass5 — prospective candidate

2026-11-12T13:27:02.079561+00:00. Ordinary HP3.2/3.7/1;ATK1.1/0.95/2.65;boss tables unchanged. Full500 diagnostic on the frozen baseline plus this exact in-memory table meets every target: loss median12.553m,earliest10.157m,early0;boss77.84/96.94s;normalHP71.24/77.17%. Keep the known failed pass4 seeds80061/80155/80194; all survive beyond8min now. Build the production source with this table, verify the frozen runtime/cohort identity and run five fresh realUI30min sessions. Acceptance remains pending UI and production-runtime parity.

Production-runtime verification 2026-11-12T13:31:30.299753+00:00: all500 seed reports exactly equal the selected diagnostic (entire trace/final account, not just aggregates). Frozen runtime c9f7f596a2c0ab3dd3d5b08cfe47e772b1c2b1c5c87b7472403ddb2bcbad2585. All model targets pass. RealUI5×30min remains in progress; full acceptance pending.

## Completed pass5 and candidate6 model

2026-11-12T14:00:49.013733+00:00. Pass5 five actual30-minute UI runs and500 model seeds both meet every target; browser errors0. UI loss13.292m, earliest10.525m, boss72.03/96.36s, normalHP69.62/69.72% mean/median. Model loss12.553m, earliest10.157m, boss77.84/96.94s, normalHP71.24/77.17%. Parity:146 shared encounters,1,506 common decisions, no combat/policy/currency/XP differences; median per-seed playback error0.32–0.61%. Evidence: PASS5-COMPLETE-BALANCE.json.

Candidate6 model500/500 also passes: first-loss12.518m, earliest10.128m, early0, boss79.49/97.25s, normalHP71.35/78.21%. Evidence: ITEM6-MODEL.json. Candidate6 full item screen and47-cell fresh holdout run next; realUI/monthly acceptance awaits final item tables. Pass5 completed UI remains separate and is not relabeled candidate6 evidence.
