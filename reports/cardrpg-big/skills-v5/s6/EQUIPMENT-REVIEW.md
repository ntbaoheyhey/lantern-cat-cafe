# Paired fourth-slot equipment review

Both modes completed all 384 cases, with 500 paired seeds per case on the registered 20001–20500 block. This review reads the saved outcomes; it does not run more battles or change the candidate. [Source hashes and case details](equipment-attribution.json).

|Chapter|Fallback misses|V5 misses|Fallback worst gain|V5 worst gain|
|---|---:|---:|---:|---:|
|1|22/128|27/128|46.0 pp|48.4 pp|
|2|25/128|4/128|87.4 pp|19.8 pp|
|3|11/128|7/128|25.4 pp|23.0 pp|

Across all cases: 49 fallback misses meet the cap with V5; 29 fallback passes miss with V5; 9 fail in both modes. The unchanged gate is a maximum 12 percentage-point gain in every case, so both configurations remain **MISS**.

The V5 maximum is Hearthloom legendary charm on Mochi in chapter 1: 232/500 before adding the fourth piece versus 474/500 afterward, a 48.4-point gain. The fallback maximum is a different case: Bellsteel legendary charm on Mochi in chapter 2, 44/500 versus 481/500, a gain of 87.4 points. The different maximum cases are named to avoid implying a same-case reduction.

This comparison measures the complete V5 package, including helpers and the selected kits/policy. It does not isolate the causal contribution of any one mechanic. The previous TRAIN first-divergence and survival-threshold evidence remains the basis for future design work. No held-out fitting or retuning is performed.

The separate 2,304-case bare-item scope and static display correlation still need their own complete receipts; this completed fourth-slot matrix does not stand in for either. Full Wilson intervals and paired outcome digests remain in each mode’s `equipped/results.json`.
