# Relic cap counterfactual — 2026-11-12

43008 battles; six cases selected in the previous diagnostic,1024 different paired seeds,7 candidates. The200/400/800bps transformations exactly match C2's existing stat rounding before crew synergy. Candidate0 exactly reproduces baseline combat inputs. No source changes.

|Bonus bps|Worst observed delta pp|Worst simultaneous upper pp|Identical stats in tested cases|
|---|---:|---:|---:|
|0|0.00|0.00|6/6|
|25|0.68|12.02|0/6|
|50|4.69|16.02|0/6|
|100|11.13|22.47|0/6|
|200|23.24|34.58|0/6|
|400|38.09|49.42|0/6|
|800|45.02|56.36|0/6|

One-sided95% simultaneous Hoeffding/Bonferroni upper bounds across36 nonzero cells; assumptions: independent seed draws as an engine-randomness model. Fixed pseudo-random seeds are reproducible; they do not validate player behavior or all possible scenarios. Zero is structurally identical at combat input, not statistically inferred.

Six previously selected sensitive starter-party snapshots,1024 fresh paired seeds, automatic policy. Not population-weighted, not PvP, not all builds or progressive routes.

**Decision:0 paid combat bonus.** Small observed deltas are not a guarantee across progression or builds. Positive percentages can cross integer damage, survival and turn thresholds. Zero stat change preserves combat exactly. Keep visuals, collection display and original permanent ornaments; no YARN payout, XP, odds or reward multiplier for ownership. C2 owns any ordinary achievement progression changes.

Reproduce: `node tools/chain/relic-cap-study.mjs`. Data:`docs/chain/relic-cap-study.json`; fingerprint:b9d8ed042322ec7704d2c007d34ec8a0dd843b19a077e8e86c31510490af83e3.
