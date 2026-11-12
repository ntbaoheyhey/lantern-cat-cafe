# B4 — round four, at most three config passes

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
