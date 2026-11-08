# Contextual equipment forecast40

All384 original fourth-slot cases and50 gear rolls per case are retained. Each full build uses the existing20-seed forecast against its chapter boss. 24,000 unique forecasts were sampled once; the auditor repeats zero battles.

|Chapter|Spearman|Mean absolute error pp|Opposite signs|Negative predicted / observed|Screen ≥0.6|
|---|---:|---:|---:|---:|---|
|1|0.738|4.63|16|19 / 1|PASS|
|2|0.754|2.71|15|12 / 17|PASS|
|3|0.729|1.89|8|26 / 17|PASS|

Registered diagnostic screen: **PASS**. The forecast samples overlap the outcome samples: this supports only TRAIN exploration, never acceptance or a calibrated probability claim. The existing static display gate remains open. Every negative prediction and outcome, including zero ties, is retained in audit.json and the lossless results.json.gz archive.

No production score, budget, fixture, combat or acceptance seed is changed. A contextual UI still needs worker cancellation, transfer, cache, CSP and latency verification. FullTRAIN500 and fresh registered acceptance remain required for a calibrated score claim.
