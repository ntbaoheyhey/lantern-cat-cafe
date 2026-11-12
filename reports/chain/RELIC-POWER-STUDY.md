# Paired legacy Relic diagnostic — 2026-11-12

Existing A6 optional relic bonus; starter trio/equipment, fixed authored late-street/boss snapshots, full starting HP, automatic policy. Not a route, population win rate, PvP or manual-skill model.

Paired seeds within each scenario; six sensitive exploration cases chosen before disjoint holdout. Observed deltas are diagnostics, not confidence-certified population bounds. No fees, battle stats or C2 source changed. CHAIN Treasure/styles/ornaments remain cosmetic and do not select legacy relics.

26880 battles: 36 exploration cells ×64 seeds ×5 variants, then six selected cells ×512 different seeds ×5 variants. Holdings quantities never stack. The baseline and four rarities share each battle seed, enemy snapshot, progression and equipment. Threshold is 3 **percentage points**, not 3% relative win rate or 3% stats.

|Chapter/encounter|Level/band|Relic|Baseline wins|With relic|Delta pp|Paired gain/loss|
|---|---|---|---|---|---|---|
|2/battle|1/6|1|296/512|400/512|20.31|107/3|
|2/battle|1/6|2|296/512|474/512|34.77|179/1|
|2/battle|1/6|3|296/512|512/512|42.19|216/0|
|2/battle|1/6|4|296/512|512/512|42.19|216/0|
|3/boss|4/1|1|225/512|248/512|4.49|99/76|
|3/boss|4/1|2|225/512|343/512|23.05|175/57|
|3/boss|4/1|3|225/512|395/512|33.20|218/48|
|3/boss|4/1|4|225/512|453/512|44.53|248/20|
|3/boss|4/6|1|25/512|33/512|1.56|23/15|
|3/boss|4/6|2|25/512|64/512|7.62|59/20|
|3/boss|4/6|3|25/512|67/512|8.20|61/19|
|3/boss|4/6|4|25/512|121/512|18.75|114/18|
|3/battle|1/6|1|374/512|401/512|5.27|33/6|
|3/battle|1/6|2|374/512|427/512|10.35|63/10|
|3/battle|1/6|3|374/512|437/512|12.30|77/14|
|3/battle|1/6|4|374/512|437/512|12.30|81/18|
|3/boss|1/1|1|7/512|12/512|0.98|11/6|
|3/boss|1/1|2|7/512|24/512|3.32|23/6|
|3/boss|1/1|3|7/512|47/512|7.81|46/6|
|3/boss|1/1|4|7/512|48/512|8.01|48/7|
|3/battle|1/1|1|451/512|458/512|1.37|12/5|
|3/battle|1/1|2|451/512|471/512|3.91|25/5|
|3/battle|1/1|3|451/512|483/512|6.25|36/4|
|3/battle|1/1|4|451/512|492/512|8.01|44/3|

Largest observed holdout increase: **44.53 pp**. This is not evidence to wire tradable ownership into the old stat bonus. The current CHAIN features add zero combat stats. C2 owns any combat rework; retain cosmetic-only ownership until a reviewed replacement meets the rule across relevant builds and progression.

Reproduce: `node tools/chain/relic-power-study.mjs`. Data: `docs/chain/relic-power-study.json`; source fingerprint: 21724ca2d603aef63e57221cd9ce2224f63c543958b83aaa473d26cad9951cde. No token transactions, network RPC, source changes or deployment.
