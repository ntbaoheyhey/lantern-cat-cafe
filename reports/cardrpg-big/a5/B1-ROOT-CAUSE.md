# A5 B1 root-cause ablation

TRAIN seeds1–500 only. The 31 case keys were selected from the already-contaminated A4 residual map. The new acceptance block remains unused.
Each before/full result matches the original A4 training receipt for that exact seed. Main-stat plus marginal-affix reconstruction matches the full production stats; set/unique reconstruction matches production effects.

|Piece / carrier / chapter|Before wins /500|Main only pp|Affixes only pp|Unique only pp|Set4 only pp|All pp|
|---|---:|---:|---:|---:|---:|---:|
|bellsteel-charm-common / mochi / 3|35|45.40|0.00|0.00|0.00|45.40|
|bellsteel-charm-epic / mochi / 3|35|72.00|24.20|0.00|0.00|90.20|
|bellsteel-charm-legendary / mochi / 3|35|80.60|24.20|0.20|0.00|91.60|
|bellsteel-charm-rare / mochi / 3|35|59.80|3.00|0.00|0.00|68.40|
|bellsteel-outfit-common / mochi / 3|81|39.40|0.00|0.00|0.00|39.40|
|bellsteel-outfit-epic / mochi / 3|81|62.00|38.80|0.00|0.00|80.00|
|bellsteel-outfit-legendary / mochi / 3|81|69.00|38.20|12.40|0.00|82.80|
|bellsteel-outfit-rare / mochi / 3|81|49.60|5.20|0.00|0.00|59.40|
|bellsteel-relic-common / mochi / 3|202|44.80|0.00|0.00|0.00|44.80|
|bellsteel-relic-epic / mochi / 3|202|53.80|15.40|0.00|0.00|56.80|
|bellsteel-relic-legendary / mochi / 3|202|56.40|14.60|0.00|0.00|58.20|
|bellsteel-relic-rare / mochi / 3|202|50.00|10.00|0.00|0.00|52.80|
|crumbweave-charm-legendary / soot / 1|152|5.00|13.40|0.00|4.00|18.20|
|crumbweave-relic-epic / soot / 1|90|1.80|12.40|0.00|1.80|17.00|
|crumbweave-relic-legendary / soot / 1|90|1.80|12.40|0.80|1.80|16.40|
|crumbweave-weapon-epic / soot / 1|64|22.20|0.00|0.00|0.00|22.60|
|crumbweave-weapon-legendary / soot / 1|64|25.00|8.80|0.00|0.00|41.80|
|crumbweave-weapon-rare / soot / 1|64|17.00|0.00|0.00|0.00|17.20|
|emberfelt-weapon-legendary / soot / 1|7|6.00|2.80|0.00|0.00|13.40|
|hearthloom-charm-common / mochi / 3|16|23.60|0.00|0.00|0.00|23.60|
|hearthloom-charm-epic / mochi / 3|16|49.20|4.60|0.00|0.00|77.20|
|hearthloom-charm-legendary / mochi / 3|16|65.40|12.00|0.00|0.00|91.40|
|hearthloom-charm-rare / mochi / 3|16|36.40|0.60|0.00|0.00|40.40|
|hearthloom-outfit-common / mochi / 3|30|24.60|0.00|0.00|0.00|24.60|
|hearthloom-outfit-epic / mochi / 3|30|48.00|11.80|0.00|0.00|74.40|
|hearthloom-outfit-legendary / mochi / 3|30|56.60|21.60|0.00|0.00|87.20|
|hearthloom-outfit-rare / mochi / 3|30|36.60|0.80|0.00|0.00|39.80|
|hearthloom-relic-common / mochi / 3|65|35.80|0.00|0.00|0.00|35.80|
|hearthloom-relic-epic / mochi / 3|65|60.00|3.60|0.00|0.00|67.20|
|hearthloom-relic-legendary / mochi / 3|65|68.80|7.00|0.00|0.00|76.40|
|hearthloom-relic-rare / mochi / 3|65|48.20|2.20|0.00|0.00|52.80|

Pure component gains are not additive: automatic decisions, RNG consumption and survival interact. The table isolates components at BattleSetup; it does not claim which one caused every observed victory.
Marginal win-rate Wilson95 intervals and all outcome strings are in ablation/results.json. Paired improved/worsened counts and explicitly labelled paired normal intervals are in root-cause.json.

## Paired replay observations

### bellsteel-charm-legendary, mochi, chapter 3, train seed 1
First divergent automatic party choice #7: mochi round 3, {'actorId': 'mochi', 'skillId': 'mochi-4', 'targetId': 'clover'} → {'actorId': 'mochi', 'skillId': 'mochi-4', 'targetId': 'mochi'}. Actor/round aligned: True.
First losing party death: mochi round 6; 278 HP before 321 raw HP loss, residual shield 0. HP margin -43; 44 extra HP would survive that particular request.
Read-only observer parity passed for the complete battle JSON, including logs and choices. Matching-round snapshots after divergence are descriptive, not a controlled causal estimate.
Evidence: [bellsteel-charm-legendary-ch3-seed1-trace.json](b1/ablation/bellsteel-charm-legendary-ch3-seed1-trace.json).

### bellsteel-charm-rare, mochi, chapter 3, train seed 1
First divergent automatic party choice #19: soot round 7, {'actorId': 'soot', 'skillId': 'soot-4', 'targetId': 'foe-0-pantry-crown'} → {'actorId': 'mochi', 'skillId': 'mochi-4', 'targetId': 'mochi'}. Actor/round aligned: False.
First losing party death: mochi round 6; 278 HP before 321 raw HP loss, residual shield 0. HP margin -43; 44 extra HP would survive that particular request.
Read-only observer parity passed for the complete battle JSON, including logs and choices. Matching-round snapshots after divergence are descriptive, not a controlled causal estimate.
Evidence: [bellsteel-charm-rare-ch3-seed1-trace.json](b1/ablation/bellsteel-charm-rare-ch3-seed1-trace.json).

### crumbweave-weapon-legendary, soot, chapter 1, train seed 3
First divergent automatic party choice #24: clover round 9, {'actorId': 'clover', 'skillId': 'clover-3', 'targetId': 'soot'} → {'actorId': 'clover', 'skillId': 'clover-1', 'targetId': 'foe-0-yarn-giant'}. Actor/round aligned: True.
First losing party death: mochi round 6; 155 HP before 382 raw HP loss, residual shield 0. HP margin -227; 228 extra HP would survive that particular request.
Read-only observer parity passed for the complete battle JSON, including logs and choices. Matching-round snapshots after divergence are descriptive, not a controlled causal estimate.
Evidence: [crumbweave-weapon-legendary-ch1-seed3-trace.json](b1/ablation/crumbweave-weapon-legendary-ch1-seed3-trace.json).

### emberfelt-weapon-legendary, soot, chapter 1, train seed 14
First divergent automatic party choice #24: clover round 9, {'actorId': 'clover', 'skillId': 'clover-3', 'targetId': 'soot'} → no aligned next party action. Actor/round aligned: False.
First losing party death: mochi round 6; 202 HP before 404 raw HP loss, residual shield 0. HP margin -202; 203 extra HP would survive that particular request.
Read-only observer parity passed for the complete battle JSON, including logs and choices. Matching-round snapshots after divergence are descriptive, not a controlled causal estimate.
Evidence: [emberfelt-weapon-legendary-ch1-seed14-trace.json](b1/ablation/emberfelt-weapon-legendary-ch1-seed14-trace.json).

### hearthloom-charm-common, mochi, chapter 3, train seed 6
First divergent automatic party choice #18: clover round 6, {'actorId': 'clover', 'skillId': 'clover-3', 'targetId': 'mochi'} → {'actorId': 'clover', 'skillId': 'clover-3', 'targetId': 'clover'}. Actor/round aligned: True.
First losing party death: mochi round 6; 348 HP before 348 raw HP loss, residual shield 0. HP margin 0; 1 extra HP would survive that particular request.
Read-only observer parity passed for the complete battle JSON, including logs and choices. Matching-round snapshots after divergence are descriptive, not a controlled causal estimate.
Evidence: [hearthloom-charm-common-ch3-seed6-trace.json](b1/ablation/hearthloom-charm-common-ch3-seed6-trace.json).

### hearthloom-charm-legendary, mochi, chapter 3, train seed 1
First divergent automatic party choice #19: soot round 7, {'actorId': 'soot', 'skillId': 'soot-4', 'targetId': 'foe-0-pantry-crown'} → {'actorId': 'mochi', 'skillId': 'mochi-4', 'targetId': 'mochi'}. Actor/round aligned: False.
First losing party death: mochi round 6; 260 HP before 324 raw HP loss, residual shield 0. HP margin -64; 65 extra HP would survive that particular request.
Read-only observer parity passed for the complete battle JSON, including logs and choices. Matching-round snapshots after divergence are descriptive, not a controlled causal estimate.
Evidence: [hearthloom-charm-legendary-ch3-seed1-trace.json](b1/ablation/hearthloom-charm-legendary-ch3-seed1-trace.json).

## Interpretation and next experiment

Do not choose a gameplay patch from this generator alone. Review the six paired traces and component table, then append the specific causal hypothesis and training-only candidate registration before editing production rules.
The repeated fourth-slot correlation is not by itself proof of an unbounded set4 loop. Null unique components and failed candidates must remain visible.

No human playtest claim. No production rule or acceptance seed was changed by this diagnostic.

## Current A5 source follow-up

[Current24](b1/current-cliffs-24/INTERPRETATION.md) audits68current residuals and20,400component battles: chapter2 now dominates, with set4 alone null in every chapter2 cell. [Hit envelopes25](b1/hit-envelope-25/RESULTS.md) are all rejected; reducing bursts can simply saturate wins. The original A4 table above remains historical, not the current source diagnosis. Fresh acceptance remains unused.
