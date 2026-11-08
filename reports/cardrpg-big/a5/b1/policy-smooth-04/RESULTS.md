# Continuous automatic-policy diagnostic 04 — rejected

Both registered candidates completed all 1,321 TRAIN cells: 384 fourth-slot comparisons, 210 tier/band/farming cells, 64 set situations and 663 team/crew cells, using the same seeds 1–50. No production rule or acceptance seed changed. The original bad variant label and corrected harness attempt remain in this directory.

| Candidate | Fourth-slot cells above 12 pp | Worst gain | Cat win-rate range | Coherent crew gain | Tier steps >=2 pp / reversals |
|---|---:|---:|---:|---:|---:|
| Smooth policy on A4 combat | 39 /384 | 90 pp | 29.99–64.63% | 50.67 pp | 22 /24; 1 reversal |
| Smooth policy on graded pressure budget | 120 /384 | 38 pp | 37.70–74.90% | 55.33 pp | 24 /24; 0 reversals |

Removing the two discontinuous utility penalties did not close the equipment cliff. The A4 variant still moves Bellsteel legendary charm/Mochi/chapter3 from 4 to 49 wins out of 50. The graded-budget variant spreads failures across more items. These observations reject both complete candidates; they do not establish that the original utility jumps are harmless in every replay.

See [summary.json](summary.json) for every gate diagnostic, existing-score rank correlations and boss diversity, and each variant's original result files for outcome strings and Wilson intervals. Fifty seeds are a training diagnostic, not the required 500-seed acceptance. No gate is moved and neither candidate is adopted. The original component ablations remain the causal evidence: main stats and survival/automatic-action changes dominate the original fourth-slot outliers; isolated set4 activation alone does not explain those large gains.
