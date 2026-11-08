# Current-source cliff ablation24

All 68 current Hush22 TRAIN1–50 residuals are retained. Six isolated component arms total 20,400 battles; all 3,400 before/full pairs exactly match the original Hush22 outcome strings. Each first-seed component replay and six read-only HP-observer traces passed whole-battle parity in the original runner. This audit consumes those completed receipts; it does not resample them.

|Chapter|Cells|Main alone, mean pp|Affixes alone|Unique alone|Set4 alone|Full piece|
|---|---:|---:|---:|---:|---:|---:|
|1|30|10.20|6.47|0.07|0.00|20.87|
|2|22|45.27|7.91|0.18|0.00|58.91|
|3|16|20.75|7.75|0.50|1.00|23.50|

These are selected residuals, not an unbiased estimate of all equipment. Component gains are not additive: the same heal, defense and HP margins can interact. The isolated set4 effect is zero in every chapter2 case. No evidence supports trimming all set identities to fix this pattern.

|Item / chapter / seed|First losing death|HP before / request|Survival shortfall|Winning arm HP before same enemy action|
|---|---|---:|---:|---:|
|bellsteel-outfit-legendary / 2 / 1|mochi, round 6|249 / 282|34|354|
|crumbweave-weapon-legendary / 1 / 2|mochi, round 6|260 / 338|79|245|
|emberfelt-weapon-epic / 1 / 8|mochi, round 6|261 / 355|95|261|
|hearthloom-charm-legendary / 2 / 1|mochi, round 6|234 / 301|68|318|
|moonwick-weapon-legendary / 3 / 1|mochi, round 10|91 / 161|71|91|
|velvetrim-weapon-legendary / 3 / 4|mochi, round 10|129 / 154|26|61|

Hearthloom Legendary charm in chapter2 rises 1→45/50 wins: main alone24, affixes7, unique1, set4 1. In seed1 the original Mochi has234HP before a301HP request and falls in round6. The equipped Mochi survives and uses Last light shelter at round7. Its first changed party choice follows the death, so this is not evidence that the AI initially chose the wrong skill. Defense reduces repeated hits; that accumulated survival margin unlocks another entire support turn.

Bellsteel Legendary outfit in chapter2 rises5→47/50; main alone40, affixes19, unique7, set4 5. Chapter1 offensive examples can still lose Mochi in both arms but finish the boss sooner. Current chapter3 examples first lose Mochi in round10, not the old A4 round6. The current source therefore needs its own diagnosis.

Code review confirms that wide boss signatures can spend175% attack separately on all three cats, with live phase expansion after the intent was created. Storm additionally discards every affected shield. These are candidate mechanisms, not proof that capping damage will close balance. A new isolated trial will test a maximum-HP damage envelope before absorption; every template and seed stays fixed, and both easy-win and all-loss saturation will be reported. No source adoption, numeric gate change, or fresh acceptance follows from this ablation.

[Audited component table and receipt hashes](audit.json) · [original component outcomes](results.json). Matching-round snapshots after choices diverge are descriptive, not controlled causal estimates. Bots are not a human playtest.
