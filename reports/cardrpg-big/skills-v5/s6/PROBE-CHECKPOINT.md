# S6 paired probe checkpoint

Read-only checkpoint at 2026-11-09T10:16:29.676862+00:00. The original acceptance runner remains active. These two completed metric scopes do not establish completion of the balance/economy acceptance. Source and registered tool hashes still match registration `3061b085a`. No candidate changes or sample replacements.

|Metric, original full 4,500 battles|Fallback|V5|Unchanged target|
|---|---:|---:|---|
|Damage actions hitting multiple foes|9.1024|32.6603|≥30%|
|Support actions touching multiple allies|19.3548|29.7929|≥35%|
|Mean normal rounds|13.2053|13.2423|8–12|
|Battles with every cat using an ultimate|66.6667|77.6667|100%|
|Announced reactions per battle|0.0000|6.7004|≥2|

The paired 180-battle prefixes are retained separately in each mode’s `metrics/results.json`. The full 4,500-battle pool above keeps the original three crews, encounters and equal seed weights. Counts include the boss encounters with their production helpers.

D3: 30/32 named-crew keyword conditions pass. Thread Burn occurs in 497/1,500 battles; Night lamp Bitter in 483/1,500. Both miss the unchanged one-third floor. Mark is observed. All four intended-crew reaction coverage conditions pass. D4: 10/12 cats pass; D5 passes.

|Cat|Basic share|Skill 2 share|Skill 3 share|Ultimate share|D4|
|---|---:|---:|---:|---:|---|
|mochi|72.152%|0.442%|8.823%|18.460%|MISS|
|soot|29.265%|26.725%|23.409%|20.485%|PASS|
|clover|25.260%|41.835%|10.558%|22.306%|PASS|
|panko|69.742%|0.353%|9.196%|19.811%|MISS|
|mallow|46.766%|12.284%|21.929%|19.011%|PASS|
|sorrel|34.729%|31.247%|17.923%|15.041%|PASS|
|biscuit|39.298%|6.519%|34.821%|15.874%|PASS|
|inkcap|37.073%|17.155%|26.463%|18.202%|PASS|
|cinnamon|22.673%|28.253%|37.086%|11.970%|PASS|
|brioche|41.660%|9.507%|32.496%|14.667%|PASS|
|velvet|47.057%|6.180%|26.149%|20.062%|PASS|
|marigold|15.509%|43.194%|23.311%|17.673%|PASS|

Shares use every action by that cat, including Defend; skill shares need not sum to 100%. Cinnamon’s amended team-heal ultimate is included without a revive exemption. Full per-crew keyword/reaction/shape counts and fixed first-three examples: [shipping](on/DESIGN-REPORT.md), [fallback](off/DESIGN-REPORT.md).

Lane B must keep using the already-published [TRAIN examples](../s5/selected/DESIGN-REPORT.md) for presentation work. Acceptance examples are retained for audit, not visual or rule tuning.

The existing pre-S6 repair review remains applicable to the same candidate. Support, pacing, ultimate frequency and guardian usage remain PARTIAL. Any subsequent rule retune needs TRAIN work and a new registered block; 30001–30500 and 40001–40500 remain unused.
