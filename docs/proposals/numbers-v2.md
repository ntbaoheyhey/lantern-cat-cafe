# T2 numbers proposal — NOT READY FOR SIGN-OFF

Proposal only. V2_CONFIG unchanged. The signature line below is preserved. This replaces the earlier proposal presentation; the underlying bounded candidate is unchanged.

## Measurement and decision

Seven classes × seeds 1–10 × chapters 1–5 × claim steps 1 and 2 minutes. Current and proposed configurations each receive 140 runs (280 total), with the existing 1,800-active-minute horizon. Both cadences are measured independently. Missing milestones remain infinity, displayed as “not reached”; they never disappear from a median. Min / median / max are seed bands, not confidence intervals. First-attempt win rates use the ten seeds per class/chapter; rates are cohort statistics, not a band of binary observations.

**NOT READY.** Proposed first-boss bands fit 10–15 minutes and every proposed run finishes all five chapters with zero key wait. Chapter growth fails: all chapter-2 seed ratios are below 1.3, and most later ratios are also below 1.3. Boss first-attempt rates fail the 40–90% requirement: chapters 1–4 are 10/10 wins for every class at both cadences. Chapter 5 is 10/10 for most cells; Archer is 9/10 and Witch 10/10 at step 1, and both are 9/10 at step 2. The step-2 Archer seed-1 cumulative chapter-5 time is +17.951% from the cross-class center, beyond ±15%. Historical class medians pass; the full seed band does not.

No finite search proves that the entire continuous configuration domain is infeasible. The inherited V6h search already tried 24 pacing and 12 boss-pressure families plus earlier directed/fine searches. T2 does not repeat those failed searches or relax a threshold. The exact measured failures below govern this decision.

## Complete tunable table

All 73 numeric config leaves and three unchanged elite-only filters are listed, including unchanged values. All proposed values are one **joint configuration**; a row does not claim an isolated causal experiment. The last column gives the joint metric at step 1; step 2, each min / median / max. F = first boss across classes/seeds, Cn = chapter-n duration, Bn = actual chapter-n fight duration, K = time waiting for keys. Individual class bands and every seed duration follow. Unchanged diagnostic, rendering and capacity leaves receive the same joint F band; this is not evidence that changing them would preserve it. Material identities and elite-only flags stay unchanged.

| Tunable | Current | Proposed | Player effect | Joint band produced: step 1; step 2 |
| --- | ---: | ---: | --- | --- |
| cat.baseHp | 100 | 300 | Starting health and survival margin | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| cat.baseAtk | 10 | 14 | Starting damage and clear speed | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| cat.baseDef | 5 | 5 | Starting incoming-damage reduction (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| cat.levelGrowth | 0.06 | 0.06 | Stat growth from levels (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| cat.maxLevel | 60 | 60 | Maximum character level (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| cat.itemLevelGrowth | 0.07 | 0.07 | Gear power gained per item level (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| cat.xpBase | 60 | 60 | XP needed at level 1 (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| cat.xpGrowth | 1.12 | 1.12 | XP cost growth per level (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.walkTimeMs | 1000 | 1000 | Time walking between monsters (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.maxRoundsPerClaim | 4096 | 4096 | Work limit of one idle claim (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.yarnBase | 0.1 | 0.1 | Yarn earned per kill (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.yarnGrowth | 1.1 | 1.1 | Yarn reward growth per stage (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.dailyKeys | 1 | 3 | Keys granted on first claim each day | K: 0.000 / 0.000 / 0.000; 0.000 / 0.000 / 0.000 minutes |
| idle.clearedChapterKeyChance | 0.00666666666667 | 0.00666666666667 | Key drops only in already cleared chapters (unchanged) | K: 0.000 / 0.000 / 0.000; 0.000 / 0.000 / 0.000 minutes |
| idle.materialDrops.0.fromChapter | 1 | 1 | fluffTuft: first chapter where it drops (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.materialDrops.0.eliteOnly | false | false | fluffTuft: whether only elite kills are eligible (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.materialDrops.0.chance | 0.15 | 0.15 | fluffTuft: drop chance per eligible kill (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.materialDrops.1.fromChapter | 2 | 2 | shinyButton: first chapter where it drops (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.materialDrops.1.eliteOnly | false | false | shinyButton: whether only elite kills are eligible (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.materialDrops.1.chance | 0.04 | 0.04 | shinyButton: drop chance per eligible kill (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.materialDrops.2.fromChapter | 1 | 1 | catnipCrystal: first chapter where it drops (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.materialDrops.2.eliteOnly | true | true | catnipCrystal: whether only elite kills are eligible (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.materialDrops.2.chance | 0.005 | 0.005 | catnipCrystal: drop chance per eligible kill (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.gearDropChance | 0.02 | 0.0067 | Chance of an idle gear drop per kill | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.gearRarityWeights.common | 70 | 70 | Relative weight of common idle gear (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.gearRarityWeights.uncommon | 20 | 20 | Relative weight of uncommon idle gear (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.gearRarityWeights.rare | 8 | 8 | Relative weight of rare idle gear (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.gearRarityWeights.epic | 1.8 | 1.8 | Relative weight of epic idle gear (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.gearRarityWeights.legendary | 0.2 | 0.2 | Relative weight of legendary idle gear (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.powerSearchSteps | 20 | 20 | Precision of the displayed power estimate (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| idle.powerSearchMaxScale | 1024 | 1024 | Upper range of displayed power estimate (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| caps.critChance | 0.75 | 0.75 | Upper stat limit: critChance (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| caps.dodge | 0.6 | 0.6 | Upper stat limit: dodge (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| caps.attackSpeed | 1 | 1 | Upper stat limit: attackSpeed (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| caps.hpRegen | 0.05 | 0.05 | Upper stat limit: hpRegen (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| caps.minAttackIntervalMs | 200 | 200 | Upper stat limit: minAttackIntervalMs (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| damage.defScale | 100 | 100 | Strength of defense mitigation (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| damage.minDamage | 1 | 1 | Minimum damage for a landed hit (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| monster.hpBase | 30 | 90 | Starting monster health | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| monster.hpGrowth | 1.13 | 1.06 | Monster health growth per stage | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| monster.atkBase | 4 | 8 | Starting monster damage | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| monster.atkGrowth | 1.12 | 1.06 | Monster damage growth per stage | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| monster.xpBase | 6 | 18 | Starting XP reward per kill | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| monster.xpGrowth | 1.11 | 1.11 | XP reward growth per stage (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| monster.fishBase | 2 | 2 | Starting Fish reward per kill (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| monster.fishGrowth | 1.1 | 1.1 | Fish reward growth per stage (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| monster.defBase | 2 | 2 | Starting monster defense (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| monster.defStep | 0.5 | 0.5 | Monster defense added per stage (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| monster.attackIntervalMs | 1500 | 1500 | Regular-monster attack frequency (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| chapters.killsPerRound.0 | 6 | 18 | Monsters per round in chapter 1 | C1: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| chapters.killsPerRound.1 | 10 | 22 | Monsters per round in chapter 2 | C2: 10.750 / 12.342 / 13.883; 11.267 / 12.400 / 13.683 minutes |
| chapters.killsPerRound.2 | 10 | 26 | Monsters per round in chapter 3 | C3: 10.850 / 12.592 / 15.117; 11.050 / 12.450 / 14.617 minutes |
| chapters.killsPerRound.3 | 10 | 30 | Monsters per round in chapter 4 | C4: 10.967 / 13.208 / 15.917; 10.633 / 13.292 / 16.467 minutes |
| chapters.killsPerRound.4 | 10 | 30 | Monsters per round in chapter 5 | C5: 10.883 / 13.617 / 17.417; 11.050 / 13.867 / 26.650 minutes |
| boss.attackIntervalMs | 1500 | 4500 | Normal boss attack frequency | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| boss.windupMs | 400 | 400 | Normal attack warning duration (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| boss.bigEveryMs | 6000 | 6000 | Big boss attack frequency (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| boss.bigWindupMs | 1000 | 1000 | Big attack warning duration (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| boss.bigMultiplier | 2.5 | 1.5 | Big attack damage relative to normal | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| boss.maxMs | 60000 | 180000 | Maximum boss attempt duration | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| boss.keyCost | 1 | 1 | Keys required at entry and spent on a win (unchanged) | K: 0.000 / 0.000 / 0.000; 0.000 / 0.000 / 0.000 minutes |
| boss.lossCooldownSeconds | 60 | 60 | Wait after a failed boss attempt (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| boss.chapterHpMul.0 | 40 | 14 | Health of chapter 1 boss | B1: 25.364 / 33.275 / 37.110; 29.900 / 33.550 / 36.920 seconds |
| boss.chapterHpMul.1 | 40 | 20 | Health of chapter 2 boss | B2: 29.182 / 37.049 / 42.604; 30.177 / 37.072 / 42.779 seconds |
| boss.chapterHpMul.2 | 40 | 30 | Health of chapter 3 boss | B3: 30.758 / 43.711 / 50.623; 31.867 / 42.955 / 51.307 seconds |
| boss.chapterHpMul.3 | 40 | 40 | Health of chapter 4 boss (unchanged) | B4: 31.604 / 50.434 / 61.669; 34.006 / 50.040 / 68.071 seconds |
| boss.chapterHpMul.4 | 40 | 50 | Health of chapter 5 boss | B5: 33.693 / 82.168 / 116.409; 41.321 / 86.767 / 125.822 seconds |
| boss.chapterAtkMul.0 | 2.5 | 0.85 | Damage of chapter 1 boss | B1: 25.364 / 33.275 / 37.110; 29.900 / 33.550 / 36.920 seconds |
| boss.chapterAtkMul.1 | 2.5 | 1.5 | Damage of chapter 2 boss | B2: 29.182 / 37.049 / 42.604; 30.177 / 37.072 / 42.779 seconds |
| boss.chapterAtkMul.2 | 2.5 | 2.5 | Damage of chapter 3 boss (unchanged) | B3: 30.758 / 43.711 / 50.623; 31.867 / 42.955 / 51.307 seconds |
| boss.chapterAtkMul.3 | 2.5 | 3 | Damage of chapter 4 boss | B4: 31.604 / 50.434 / 61.669; 34.006 / 50.040 / 68.071 seconds |
| boss.chapterAtkMul.4 | 2.5 | 3.5 | Damage of chapter 5 boss | B5: 33.693 / 82.168 / 116.409; 41.321 / 86.767 / 125.822 seconds |
| boss.firstClearKeys | 0 | 1 | Keys returned after each first-clear win; never rematches | K: 0.000 / 0.000 / 0.000; 0.000 / 0.000 / 0.000 minutes |
| bag.limit | 200 | 200 | Maximum carried inventory (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| bag.nearFullRatio | 0.9 | 0.9 | When the almost-full warning appears (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |
| volleyStaggerMs | 60 | 60 | Spacing between extra Archer arrows (unchanged) | F: 12.367 / 13.400 / 14.150; 12.867 / 13.450 / 14.150 minutes |

## Cheapest content work to address the measured failure

“Cheapest” here means engineering/content work: reuse existing monsters and edit counts, with no new assets, mechanics, dependency or schema. It does not claim a globally minimal play-time or configuration solution.

The smallest tested one-leaf repair to the **first failing growth transition** is chapter 2 at **39 monsters per round**, compared with the bounded proposal’s 22 (production 10). Across ten rounds this is 390 monsters, **+170 per chapter versus the proposal**. At 38, step-2 growth still ranges **1.286 / 1.406 / 1.556**, with 2/70 seed/class observations below 1.3. At 39, step-1 growth is **1.305 / 1.420 / 1.569**, step 2 **1.320 / 1.430 / 1.586**, all 140 observations inside 1.3–2.0. This requires explicitly lifting the current 3× count ceiling (30); it is not an eligible bounded candidate.

A concrete count-only content package **[18,39,81,150,200]** fixes every measured growth band at both cadences. It reuses existing chapter rosters. Versus the bounded proposal [18,22,26,30,30], it adds **0/170/550/1,200/1,700 monsters per chapter**, 3,620 total. It also makes all 70 runs reach the level cap and all first boss attempts win, and fails the walk-share requirement. It therefore remains **NOT READY**, not a recommended unqualified sign-off. Count changes alone do not repair the boss-check or the class-spread tail.

| Content package | Step | Ch2 growth | Ch3 growth | Ch4 growth | Ch5 growth |
| --- | ---: | --- | --- | --- | --- |
| [18,39,81,150,200] | 1 | 1.305 / 1.420 / 1.569 | 1.308 / 1.500 / 1.612 | 1.458 / 1.631 / 1.724 | 1.468 / 1.663 / 1.913 |
| [18,39,81,150,200] | 2 | 1.320 / 1.430 / 1.586 | 1.315 / 1.491 / 1.628 | 1.422 / 1.611 / 1.753 | 1.454 / 1.668 / 1.915 |

Owner decision needed: permit count-ceiling exceptions and a joint XP/walking/boss-content calibration, or retain the current guardrails and commission a different content design. A lower gear drop rate is not presented as a fix: V6h showed that early boss pressure is not a uniform solution across classes, and reducing gear can worsen the chapter-5 Archer loss/tail. No tested content-only change meets every requirement, so there is no evidence-backed “cheapest complete fix” to sign. The table states that limitation rather than inventing one.

## Pacing policy and practical limits

The simulator uses production idle/state/combat helpers, greedy best equipment, improving crafts, salvage at 90% capacity, and event-split boss/day/cooldown boundaries. Each winning first clear grants boss.firstClearKeys = 1, after entry cost; dailyKeys = 3. First-clear refunds make frontier key wait exactly 0 / 0 / 0 at both cadences. Boss replay time is **excluded** from active pacing time (actual fight-duration bands are reported separately). This is simulated policy pacing, not an empirical human-session forecast. The custom simulator chest item selection predates T2; it mirrors production groups but is not a full identity-equivalence proof against the server chest roller.

Current defaults keep firstClearKeys=0 and dailyKeys=1. None of the current 140 runs clears chapter 5 within the 1,800-minute horizon. T2 changes neither production config/content nor the unsigned first-clear default. Browser e2e therefore asserts the current one-key daily source and no first-clear source line; server tests prove both first-clear lever values.

## Proposed class/chapter seed bands and every guardrail

Band verdicts require every observed seed to fit the interval. Growth uses each seed’s paired durations. Class spread uses cumulative times per seed: range ≥3% of the class median and each class within ±15%. Boss rates remain 40–90% per class/chapter and all actual attempts ≤180 s. Walking requires ≤50% at ch1/r1 and ch3/r5 for every seed. Historical median/cohort verdicts are retained beside the stronger whole-band verdict, without altering the old target checker.

### Proposed, step 1, seeds 1–10

| class | ch | duration min (min / median / max) | cumulative min | growth per seed | duration 10–360 | growth 1.3–2 | first wins (40–90%) | fight sec band (≤180) | key wait min |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| warrior | 1 | 12.450 / 13.150 / 13.150 | 12.450 / 13.150 / 13.150 | — | PASS | — | 10/10 FAIL | 28.240 / 33.240 / 35.240 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 2 | 10.850 / 11.433 / 11.683 | 23.300 / 24.567 / 24.833 | 0.854 / 0.872 / 0.888 | PASS | FAIL | 10/10 FAIL | 33.499 / 37.236 / 40.320 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 3 | 11.167 / 11.525 / 12.467 | 35.533 / 36.000 / 37.000 | 0.956 / 1.015 / 1.127 | PASS | FAIL | 10/10 FAIL | 38.512 / 43.752 / 49.184 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 4 | 11.317 / 11.883 / 12.683 | 47.233 / 47.992 / 48.717 | 0.940 / 1.018 / 1.116 | PASS | FAIL | 10/10 FAIL | 39.298 / 49.939 / 55.792 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 5 | 11.417 / 12.317 / 14.833 | 58.983 / 60.150 / 63.500 | 0.955 / 1.047 / 1.170 | PASS | FAIL | 10/10 FAIL | 66.018 / 76.633 / 106.381 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 1 | 12.633 / 13.250 / 13.750 | 12.633 / 13.250 / 13.750 | — | PASS | — | 10/10 FAIL | 25.364 / 34.120 / 36.920 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 2 | 11.033 / 12.800 / 13.067 | 23.667 / 26.258 / 26.733 | 0.873 / 0.939 / 0.994 | PASS | FAIL | 10/10 FAIL | 32.034 / 37.864 / 42.604 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 3 | 12.217 / 12.600 / 12.817 | 36.150 / 38.825 / 39.417 | 0.953 / 0.983 / 1.131 | PASS | FAIL | 10/10 FAIL | 41.034 / 46.192 / 50.277 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 4 | 12.967 / 13.850 / 14.133 | 50.100 / 52.417 / 53.550 | 1.061 / 1.098 / 1.120 | PASS | FAIL | 10/10 FAIL | 44.751 / 54.410 / 61.669 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 5 | 12.633 / 14.067 / 15.083 | 64.117 / 66.333 / 68.633 | 0.927 / 1.024 / 1.076 | PASS | FAIL | 10/10 FAIL | 51.662 / 87.350 / 102.816 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 1 | 12.367 / 13.233 / 13.233 | 12.367 / 13.233 / 13.233 | — | PASS | — | 10/10 FAIL | 29.458 / 31.758 / 35.340 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 2 | 10.750 / 12.192 / 12.300 | 23.117 / 25.117 / 25.533 | 0.869 / 0.926 / 0.952 | PASS | FAIL | 10/10 FAIL | 29.182 / 33.876 / 38.194 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 3 | 10.850 / 11.450 / 11.750 | 34.633 / 36.700 / 37.100 | 0.923 / 0.942 / 1.071 | PASS | FAIL | 10/10 FAIL | 30.758 / 37.680 / 43.475 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 4 | 10.967 / 11.392 / 12.700 | 46.983 / 48.033 / 49.500 | 0.966 / 1.016 / 1.103 | PASS | FAIL | 10/10 FAIL | 31.604 / 46.964 / 52.493 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 5 | 10.883 / 12.017 / 13.583 | 58.283 / 59.975 / 62.267 | 0.910 / 1.035 / 1.124 | PASS | FAIL | 10/10 FAIL | 33.693 / 73.442 / 90.762 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 1 | 12.433 / 13.367 / 13.400 | 12.433 / 13.367 / 13.400 | — | PASS | — | 10/10 FAIL | 30.095 / 33.300 / 35.500 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 2 | 10.983 / 11.950 / 12.383 | 23.417 / 25.283 / 25.783 | 0.883 / 0.901 / 0.954 | PASS | FAIL | 10/10 FAIL | 30.227 / 37.687 / 40.840 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 3 | 11.550 / 12.008 / 12.067 | 35.450 / 37.125 / 37.383 | 0.933 / 1.001 / 1.096 | PASS | FAIL | 10/10 FAIL | 40.864 / 44.047 / 49.963 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 4 | 11.217 / 11.883 / 12.867 | 47.500 / 48.817 / 50.133 | 0.936 / 1.006 / 1.095 | PASS | FAIL | 10/10 FAIL | 42.570 / 50.259 / 56.991 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 5 | 11.433 / 12.708 / 14.300 | 59.617 / 61.642 / 64.183 | 0.956 / 1.080 / 1.224 | PASS | FAIL | 10/10 FAIL | 50.935 / 82.831 / 116.409 PASS | 0.000 / 0.000 / 0.000 |
| archer | 1 | 13.283 / 13.867 / 13.983 | 13.283 / 13.867 / 13.983 | — | PASS | — | 10/10 FAIL | 28.777 / 33.800 / 35.660 PASS | 0.000 / 0.000 / 0.000 |
| archer | 2 | 11.683 / 13.492 / 13.883 | 24.967 / 27.358 / 27.783 | 0.869 / 0.970 / 1.010 | PASS | FAIL | 10/10 FAIL | 33.629 / 38.363 / 40.671 PASS | 0.000 / 0.000 / 0.000 |
| archer | 3 | 12.650 / 12.800 / 13.067 | 37.617 / 40.283 / 40.567 | 0.915 / 0.967 / 1.085 | PASS | FAIL | 10/10 FAIL | 35.655 / 43.330 / 50.623 PASS | 0.000 / 0.000 / 0.000 |
| archer | 4 | 12.200 / 13.458 / 14.150 | 51.750 / 53.375 / 54.317 | 0.961 / 1.056 / 1.119 | PASS | FAIL | 10/10 FAIL | 42.020 / 50.106 / 58.560 PASS | 0.000 / 0.000 / 0.000 |
| archer | 5 | 12.817 / 13.617 / 15.867 | 66.117 / 66.775 / 69.500 | 0.929 / 1.059 / 1.158 | PASS | FAIL | 9/10 PASS | 62.666 / 81.438 / 105.330 PASS | 0.000 / 0.000 / 0.000 |
| witch | 1 | 13.700 / 14.058 / 14.150 | 13.700 / 14.058 / 14.150 | — | PASS | — | 10/10 FAIL | 29.464 / 33.850 / 36.050 PASS | 0.000 / 0.000 / 0.000 |
| witch | 2 | 13.200 / 13.458 / 13.717 | 26.900 / 27.467 / 27.867 | 0.936 / 0.964 / 0.969 | PASS | FAIL | 10/10 FAIL | 30.945 / 37.692 / 42.559 PASS | 0.000 / 0.000 / 0.000 |
| witch | 3 | 12.983 / 14.192 / 15.117 | 39.883 / 41.717 / 42.583 | 0.978 / 1.043 / 1.120 | PASS | FAIL | 10/10 FAIL | 38.723 / 44.392 / 50.110 PASS | 0.000 / 0.000 / 0.000 |
| witch | 4 | 13.567 / 14.175 / 15.917 | 53.767 / 56.025 / 58.500 | 0.975 / 1.044 / 1.136 | PASS | FAIL | 10/10 FAIL | 47.108 / 51.884 / 57.069 PASS | 0.000 / 0.000 / 0.000 |
| witch | 5 | 14.333 / 14.867 / 17.417 | 68.100 / 70.967 / 75.917 | 0.925 / 1.066 / 1.169 | PASS | FAIL | 10/10 FAIL | 74.656 / 86.917 / 114.525 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 1 | 13.783 / 14.142 / 14.150 | 13.783 / 14.142 / 14.150 | — | PASS | — | 10/10 FAIL | 28.110 / 35.160 / 37.110 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 2 | 11.767 / 13.317 / 13.667 | 25.550 / 27.408 / 27.817 | 0.837 / 0.941 / 0.968 | PASS | FAIL | 10/10 FAIL | 32.173 / 36.551 / 41.610 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 3 | 12.583 / 13.058 / 13.750 | 38.533 / 40.467 / 41.150 | 0.962 / 0.984 / 1.103 | PASS | FAIL | 10/10 FAIL | 34.812 / 43.660 / 50.177 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 4 | 12.967 / 14.350 / 15.033 | 51.983 / 54.717 / 55.733 | 0.997 / 1.095 / 1.158 | PASS | FAIL | 10/10 FAIL | 38.787 / 51.836 / 59.684 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 5 | 13.783 / 14.517 / 16.250 | 66.200 / 69.233 / 71.983 | 0.947 / 1.019 / 1.114 | PASS | FAIL | 10/10 FAIL | 46.350 / 79.952 / 102.744 PASS | 0.000 / 0.000 / 0.000 |

| guardrail | whole-band verdict | evidence |
| --- | --- | --- |
| first-boss | PASS | Historical median/cohort verdict: PASS. warrior 13.2m; guardian 13.3m; rogue 13.2m; hunter 13.4m; archer 13.9m; witch 14.1m; alchemist 14.1m |
| chapter-growth | FAIL | Historical median/cohort verdict: FAIL. warrior ch2 0.87x; warrior ch3 1.01x; warrior ch4 1.03x; warrior ch5 1.04x; guardian ch2 0.97x; guardian ch3 0.98x; guardian ch4 1.10x; guardian ch5 1.02x; rogue ch2 0.92x; rogue ch3 0.94x; rogue ch4 0.99x; rogue ch5 1.05x; hunter ch2 0.89x; hunter ch3 1.00x; hunter ch4 0.99x; hunter ch5 1.07x; archer ch2 0.97x; archer ch3 0.95x; archer ch4 1.05x; archer ch5 1.01x; witch ch2 0.96x; witch ch3 1.05x; witch ch4 1.00x; witch ch5 1.05x; alchemist ch2 0.94x; alchemist ch3 0.98x; alchemist ch4 1.10x; alchemist ch5 1.01x |
| class-spread | PASS | Historical median/cohort verdict: PASS. ch1 range 7.4%; ch2 range 11.0%; ch3 range 14.7%; ch4 range 15.3%; ch5 range 16.6%; warrior ch1 -1.6%; guardian ch1 -0.9%; rogue ch1 -1.0%; hunter ch1 0.0%; archer ch1 3.7%; witch ch1 5.2%; alchemist ch1 5.8%; warrior ch2 -6.4%; guardian ch2 0.0%; rogue ch2 -4.3%; hunter ch2 -3.7%; archer ch2 4.2%; witch ch2 4.6%; alchemist ch2 4.4%; warrior ch3 -7.3%; guardian ch3 0.0%; rogue ch3 -5.5%; hunter ch3 -4.4%; archer ch3 3.8%; witch ch3 7.4%; alchemist ch3 4.2%; warrior ch4 -8.4%; guardian ch4 0.0%; rogue ch4 -8.4%; hunter ch4 -6.9%; archer ch4 1.8%; witch ch4 6.9%; alchemist ch4 4.4%; warrior ch5 -9.3%; guardian ch5 0.0%; rogue ch5 -9.6%; hunter ch5 -7.1%; archer ch5 0.7%; witch ch5 7.0%; alchemist ch5 4.4% |
| chapter-bounds | PASS | Historical median/cohort verdict: PASS. warrior ch1 13.2m; warrior ch2 11.4m; warrior ch3 11.5m; warrior ch4 11.9m; warrior ch5 12.3m; guardian ch1 13.3m; guardian ch2 12.8m; guardian ch3 12.6m; guardian ch4 13.9m; guardian ch5 14.1m; rogue ch1 13.2m; rogue ch2 12.2m; rogue ch3 11.5m; rogue ch4 11.4m; rogue ch5 12.0m; hunter ch1 13.4m; hunter ch2 11.9m; hunter ch3 12.0m; hunter ch4 11.9m; hunter ch5 12.7m; archer ch1 13.9m; archer ch2 13.5m; archer ch3 12.8m; archer ch4 13.5m; archer ch5 13.6m; witch ch1 14.1m; witch ch2 13.5m; witch ch3 14.2m; witch ch4 14.2m; witch ch5 14.9m; alchemist ch1 14.1m; alchemist ch2 13.3m; alchemist ch3 13.1m; alchemist ch4 14.4m; alchemist ch5 14.5m |
| never-stuck | PASS | Historical median/cohort verdict: PASS. 0/70 runs stuck |
| craft-salvage-loss | PASS | Historical median/cohort verdict: PASS. rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 |
| walk-share | PASS | Historical median/cohort verdict: PASS. warrior ch1 r1 L1.0: 21.1%; warrior ch3 r5 L41.0: 36.7%; guardian ch1 r1 L1.0: 17.5%; guardian ch3 r5 L40.5: 37.1%; rogue ch1 r1 L1.0: 17.5%; rogue ch3 r5 L40.5: 37.5%; hunter ch1 r1 L1.0: 19.4%; hunter ch3 r5 L41.0: 36.9%; archer ch1 r1 L1.0: 18.0%; archer ch3 r5 L41.0: 33.4%; witch ch1 r1 L1.0: 17.1%; witch ch3 r5 L41.0: 31.5%; alchemist ch1 r1 L1.0: 17.8%; alchemist ch3 r5 L41.0: 35.8% |
| boss-check | FAIL | Historical median/cohort verdict: FAIL. warrior ch1 first win 100.0%, median 33.24s; warrior ch2 first win 100.0%, median 37.24s; warrior ch3 first win 100.0%, median 43.75s; warrior ch4 first win 100.0%, median 49.94s; warrior ch5 first win 100.0%, median 76.63s; guardian ch1 first win 100.0%, median 34.12s; guardian ch2 first win 100.0%, median 37.86s; guardian ch3 first win 100.0%, median 46.19s; guardian ch4 first win 100.0%, median 54.41s; guardian ch5 first win 100.0%, median 87.35s; rogue ch1 first win 100.0%, median 31.76s; rogue ch2 first win 100.0%, median 33.88s; rogue ch3 first win 100.0%, median 37.68s; rogue ch4 first win 100.0%, median 46.96s; rogue ch5 first win 100.0%, median 73.44s; hunter ch1 first win 100.0%, median 33.30s; hunter ch2 first win 100.0%, median 37.69s; hunter ch3 first win 100.0%, median 44.05s; hunter ch4 first win 100.0%, median 50.26s; hunter ch5 first win 100.0%, median 82.83s; archer ch1 first win 100.0%, median 33.80s; archer ch2 first win 100.0%, median 38.36s; archer ch3 first win 100.0%, median 43.33s; archer ch4 first win 100.0%, median 50.11s; archer ch5 first win 90.0%, median 81.44s; witch ch1 first win 100.0%, median 33.85s; witch ch2 first win 100.0%, median 37.69s; witch ch3 first win 100.0%, median 44.39s; witch ch4 first win 100.0%, median 51.88s; witch ch5 first win 100.0%, median 86.92s; alchemist ch1 first win 100.0%, median 35.16s; alchemist ch2 first win 100.0%, median 36.55s; alchemist ch3 first win 100.0%, median 43.66s; alchemist ch4 first win 100.0%, median 51.84s; alchemist ch5 first win 100.0%, median 79.95s |
| guardrails | PASS | Historical median/cohort verdict: PASS. All numeric leaves within 0.33–3x except firstClearKeys=0/1; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 |

### Proposed, step 2, seeds 1–10

| class | ch | duration min (min / median / max) | cumulative min | growth per seed | duration 10–360 | growth 1.3–2 | first wins (40–90%) | fight sec band (≤180) | key wait min |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| warrior | 1 | 12.867 / 12.983 / 12.983 | 12.867 / 12.983 / 12.983 | — | PASS | — | 10/10 FAIL | 32.240 / 34.240 / 35.240 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 2 | 11.267 / 11.525 / 11.883 | 24.167 / 24.508 / 24.800 | 0.868 / 0.888 / 0.920 | PASS | FAIL | 10/10 FAIL | 33.499 / 36.378 / 39.409 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 3 | 11.350 / 11.942 / 12.300 | 35.633 / 36.450 / 36.783 | 0.976 / 1.036 / 1.092 | PASS | FAIL | 10/10 FAIL | 35.120 / 43.693 / 47.054 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 4 | 10.633 / 12.067 / 13.133 | 46.367 / 48.500 / 49.800 | 0.937 / 1.009 / 1.145 | PASS | FAIL | 10/10 FAIL | 39.017 / 51.170 / 54.638 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 5 | 11.267 / 12.167 / 14.733 | 57.633 / 61.075 / 64.183 | 0.893 / 1.021 / 1.177 | PASS | FAIL | 10/10 FAIL | 52.876 / 79.893 / 111.512 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 1 | 13.050 / 13.467 / 13.467 | 13.050 / 13.467 / 13.467 | — | PASS | — | 10/10 FAIL | 31.956 / 34.120 / 36.920 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 2 | 11.333 / 12.483 / 13.067 | 24.667 / 25.908 / 26.533 | 0.850 / 0.927 / 1.001 | PASS | FAIL | 10/10 FAIL | 34.498 / 39.083 / 41.329 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 3 | 12.300 / 12.567 / 12.950 | 37.050 / 38.533 / 39.333 | 0.941 / 1.013 / 1.093 | PASS | FAIL | 10/10 FAIL | 39.972 / 46.297 / 48.474 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 4 | 12.717 / 13.567 / 13.983 | 50.583 / 51.767 / 52.733 | 1.012 / 1.080 / 1.119 | PASS | FAIL | 10/10 FAIL | 38.533 / 51.375 / 56.361 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 5 | 12.367 / 13.733 / 15.517 | 63.933 / 65.367 / 68.150 | 0.902 / 1.017 / 1.110 | PASS | FAIL | 10/10 FAIL | 55.301 / 81.135 / 125.822 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 1 | 13.217 / 13.267 / 13.267 | 13.217 / 13.267 / 13.267 | — | PASS | — | 10/10 FAIL | 29.900 / 32.940 / 35.340 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 2 | 11.433 / 12.200 / 12.517 | 24.700 / 25.467 / 25.783 | 0.862 / 0.920 / 0.943 | PASS | FAIL | 10/10 FAIL | 30.177 / 34.678 / 38.923 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 3 | 11.050 / 11.442 / 11.883 | 35.967 / 37.017 / 37.450 | 0.909 / 0.946 / 0.987 | PASS | FAIL | 10/10 FAIL | 31.867 / 36.124 / 42.006 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 4 | 11.133 / 11.758 / 12.550 | 47.233 / 48.483 / 49.833 | 0.963 / 1.018 / 1.112 | PASS | FAIL | 10/10 FAIL | 34.006 / 40.205 / 54.547 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 5 | 11.050 / 11.900 / 14.300 | 59.183 / 60.308 / 64.133 | 0.907 / 1.057 / 1.158 | PASS | FAIL | 10/10 FAIL | 41.321 / 68.974 / 102.321 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 1 | 12.933 / 13.383 / 13.383 | 12.933 / 13.383 / 13.383 | — | PASS | — | 10/10 FAIL | 31.422 / 33.300 / 35.500 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 2 | 11.383 / 11.883 / 12.100 | 24.367 / 25.200 / 25.483 | 0.874 / 0.889 / 0.927 | PASS | FAIL | 10/10 FAIL | 31.941 / 38.757 / 41.382 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 3 | 11.717 / 11.958 / 12.450 | 36.267 / 37.125 / 37.733 | 0.983 / 1.006 / 1.046 | PASS | FAIL | 10/10 FAIL | 36.498 / 45.586 / 49.449 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 4 | 11.317 / 12.483 / 13.017 | 48.217 / 49.583 / 50.617 | 0.963 / 1.031 / 1.091 | PASS | FAIL | 10/10 FAIL | 40.885 / 47.395 / 57.250 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 5 | 11.733 / 12.375 / 14.100 | 59.950 / 62.067 / 64.717 | 0.951 / 1.007 / 1.134 | PASS | FAIL | 10/10 FAIL | 73.430 / 82.789 / 111.592 PASS | 0.000 / 0.000 / 0.000 |
| archer | 1 | 13.400 / 13.750 / 13.750 | 13.400 / 13.750 / 13.750 | — | PASS | — | 10/10 FAIL | 30.813 / 33.485 / 35.600 PASS | 0.000 / 0.000 / 0.000 |
| archer | 2 | 11.717 / 12.658 / 13.683 | 25.117 / 26.408 / 27.433 | 0.874 / 0.921 / 1.000 | PASS | FAIL | 10/10 FAIL | 32.478 / 36.687 / 39.923 PASS | 0.000 / 0.000 / 0.000 |
| archer | 3 | 12.283 / 12.758 / 13.133 | 37.867 / 39.058 / 40.467 | 0.941 / 0.981 / 1.088 | PASS | FAIL | 10/10 FAIL | 36.476 / 41.867 / 46.708 PASS | 0.000 / 0.000 / 0.000 |
| archer | 4 | 13.167 / 13.467 / 14.283 | 51.783 / 52.375 / 54.367 | 1.027 / 1.073 / 1.107 | PASS | FAIL | 10/10 FAIL | 44.306 / 53.311 / 63.165 PASS | 0.000 / 0.000 / 0.000 |
| archer | 5 | 13.017 / 14.167 / 26.650 | 64.800 / 66.700 / 80.383 | 0.955 / 1.064 / 1.866 | PASS | FAIL | 9/10 PASS | 53.674 / 102.750 / 118.998 PASS | 0.000 / 0.000 / 0.000 |
| witch | 1 | 13.550 / 14.142 / 14.150 | 13.550 / 14.142 / 14.150 | — | PASS | — | 10/10 FAIL | 31.250 / 32.850 / 36.050 PASS | 0.000 / 0.000 / 0.000 |
| witch | 2 | 12.450 / 13.192 / 13.417 | 26.000 / 27.325 / 27.483 | 0.903 / 0.932 / 0.958 | PASS | FAIL | 10/10 FAIL | 31.746 / 36.017 / 40.111 PASS | 0.000 / 0.000 / 0.000 |
| witch | 3 | 12.933 / 14.125 / 14.617 | 39.200 / 41.367 / 41.867 | 0.970 / 1.072 / 1.129 | PASS | FAIL | 10/10 FAIL | 39.526 / 42.990 / 48.971 PASS | 0.000 / 0.000 / 0.000 |
| witch | 4 | 13.300 / 14.133 / 16.467 | 53.233 / 55.533 / 58.183 | 0.968 / 1.024 / 1.149 | PASS | FAIL | 10/10 FAIL | 46.781 / 51.100 / 60.439 PASS | 0.000 / 0.000 / 0.000 |
| witch | 5 | 14.450 / 14.808 / 19.250 | 67.783 / 70.492 / 77.433 | 0.968 / 1.053 / 1.169 | PASS | FAIL | 9/10 PASS | 54.400 / 91.122 / 120.000 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 1 | 13.700 / 13.933 / 13.933 | 13.700 / 13.933 / 13.933 | — | PASS | — | 10/10 FAIL | 30.126 / 34.537 / 36.510 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 2 | 12.733 / 13.183 / 13.467 | 26.667 / 27.058 / 27.400 | 0.914 / 0.950 / 0.967 | PASS | FAIL | 10/10 FAIL | 32.900 / 39.179 / 42.779 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 3 | 12.817 / 13.342 / 13.633 | 39.617 / 40.583 / 40.717 | 0.974 / 1.022 / 1.040 | PASS | FAIL | 10/10 FAIL | 37.666 / 44.798 / 51.307 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 4 | 14.000 / 14.175 / 14.967 | 53.783 / 54.775 / 55.683 | 1.034 / 1.082 / 1.124 | PASS | FAIL | 10/10 FAIL | 43.961 / 54.193 / 68.071 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 5 | 12.883 / 14.725 / 17.267 | 67.733 / 69.342 / 72.950 | 0.908 / 1.037 / 1.154 | PASS | FAIL | 10/10 FAIL | 51.249 / 81.250 / 119.955 PASS | 0.000 / 0.000 / 0.000 |

| guardrail | whole-band verdict | evidence |
| --- | --- | --- |
| first-boss | PASS | Historical median/cohort verdict: PASS. warrior 13.0m; guardian 13.5m; rogue 13.3m; hunter 13.4m; archer 13.8m; witch 14.1m; alchemist 13.9m |
| chapter-growth | FAIL | Historical median/cohort verdict: FAIL. warrior ch2 0.89x; warrior ch3 1.04x; warrior ch4 1.01x; warrior ch5 1.01x; guardian ch2 0.93x; guardian ch3 1.01x; guardian ch4 1.08x; guardian ch5 1.01x; rogue ch2 0.92x; rogue ch3 0.94x; rogue ch4 1.03x; rogue ch5 1.01x; hunter ch2 0.89x; hunter ch3 1.01x; hunter ch4 1.04x; hunter ch5 0.99x; archer ch2 0.92x; archer ch3 1.01x; archer ch4 1.06x; archer ch5 1.05x; witch ch2 0.93x; witch ch3 1.07x; witch ch4 1.00x; witch ch5 1.05x; alchemist ch2 0.95x; alchemist ch3 1.01x; alchemist ch4 1.06x; alchemist ch5 1.04x |
| class-spread | FAIL | Historical median/cohort verdict: PASS. ch1 range 8.6%; ch2 range 10.9%; ch3 range 12.8%; ch4 range 13.6%; ch5 range 15.6%; warrior ch1 -3.6%; guardian ch1 0.0%; rogue ch1 -1.5%; hunter ch1 -0.6%; archer ch1 2.1%; witch ch1 5.0%; alchemist ch1 3.5%; warrior ch2 -5.4%; guardian ch2 0.0%; rogue ch2 -1.7%; hunter ch2 -2.7%; archer ch2 1.9%; witch ch2 5.5%; alchemist ch2 4.4%; warrior ch3 -5.4%; guardian ch3 0.0%; rogue ch3 -3.9%; hunter ch3 -3.7%; archer ch3 1.4%; witch ch3 7.4%; alchemist ch3 5.3%; warrior ch4 -6.3%; guardian ch4 0.0%; rogue ch4 -6.3%; hunter ch4 -4.2%; archer ch4 1.2%; witch ch4 7.3%; alchemist ch4 5.8%; warrior ch5 -6.6%; guardian ch5 0.0%; rogue ch5 -7.7%; hunter ch5 -5.0%; archer ch5 2.0%; witch ch5 7.8%; alchemist ch5 6.1% |
| chapter-bounds | PASS | Historical median/cohort verdict: PASS. warrior ch1 13.0m; warrior ch2 11.5m; warrior ch3 11.9m; warrior ch4 12.1m; warrior ch5 12.2m; guardian ch1 13.5m; guardian ch2 12.5m; guardian ch3 12.6m; guardian ch4 13.6m; guardian ch5 13.7m; rogue ch1 13.3m; rogue ch2 12.2m; rogue ch3 11.4m; rogue ch4 11.8m; rogue ch5 11.9m; hunter ch1 13.4m; hunter ch2 11.9m; hunter ch3 12.0m; hunter ch4 12.5m; hunter ch5 12.4m; archer ch1 13.8m; archer ch2 12.7m; archer ch3 12.8m; archer ch4 13.5m; archer ch5 14.2m; witch ch1 14.1m; witch ch2 13.2m; witch ch3 14.1m; witch ch4 14.1m; witch ch5 14.8m; alchemist ch1 13.9m; alchemist ch2 13.2m; alchemist ch3 13.3m; alchemist ch4 14.2m; alchemist ch5 14.7m |
| never-stuck | PASS | Historical median/cohort verdict: PASS. 0/70 runs stuck |
| craft-salvage-loss | PASS | Historical median/cohort verdict: PASS. rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 |
| walk-share | PASS | Historical median/cohort verdict: PASS. warrior ch1 r1 L1.0: 21.1%; warrior ch3 r5 L41.0: 34.7%; guardian ch1 r1 L1.0: 17.5%; guardian ch3 r5 L41.0: 36.8%; rogue ch1 r1 L1.0: 17.5%; rogue ch3 r5 L40.0: 37.3%; hunter ch1 r1 L1.0: 19.4%; hunter ch3 r5 L41.0: 36.6%; archer ch1 r1 L1.0: 18.0%; archer ch3 r5 L41.0: 33.2%; witch ch1 r1 L1.0: 17.1%; witch ch3 r5 L41.0: 31.2%; alchemist ch1 r1 L1.0: 17.8%; alchemist ch3 r5 L40.0: 35.2% |
| boss-check | FAIL | Historical median/cohort verdict: FAIL. warrior ch1 first win 100.0%, median 34.24s; warrior ch2 first win 100.0%, median 36.38s; warrior ch3 first win 100.0%, median 43.69s; warrior ch4 first win 100.0%, median 51.17s; warrior ch5 first win 100.0%, median 79.89s; guardian ch1 first win 100.0%, median 34.12s; guardian ch2 first win 100.0%, median 39.08s; guardian ch3 first win 100.0%, median 46.30s; guardian ch4 first win 100.0%, median 51.38s; guardian ch5 first win 100.0%, median 81.13s; rogue ch1 first win 100.0%, median 32.94s; rogue ch2 first win 100.0%, median 34.68s; rogue ch3 first win 100.0%, median 36.12s; rogue ch4 first win 100.0%, median 40.20s; rogue ch5 first win 100.0%, median 68.97s; hunter ch1 first win 100.0%, median 33.30s; hunter ch2 first win 100.0%, median 38.76s; hunter ch3 first win 100.0%, median 45.59s; hunter ch4 first win 100.0%, median 47.40s; hunter ch5 first win 100.0%, median 82.79s; archer ch1 first win 100.0%, median 33.49s; archer ch2 first win 100.0%, median 36.69s; archer ch3 first win 100.0%, median 41.87s; archer ch4 first win 100.0%, median 53.31s; archer ch5 first win 90.0%, median 102.75s; witch ch1 first win 100.0%, median 32.85s; witch ch2 first win 100.0%, median 36.02s; witch ch3 first win 100.0%, median 42.99s; witch ch4 first win 100.0%, median 51.10s; witch ch5 first win 90.0%, median 91.12s; alchemist ch1 first win 100.0%, median 34.54s; alchemist ch2 first win 100.0%, median 39.18s; alchemist ch3 first win 100.0%, median 44.80s; alchemist ch4 first win 100.0%, median 54.19s; alchemist ch5 first win 100.0%, median 81.25s |
| guardrails | PASS | Historical median/cohort verdict: PASS. All numeric leaves within 0.33–3x except firstClearKeys=0/1; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 |

## Current class/chapter bands

### Current, step 1, seeds 1–10

| class | ch | duration min (min / median / max) | cumulative min | growth per seed | duration 10–360 | growth 1.3–2 | first wins (40–90%) | fight sec band (≤180) | key wait min |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| warrior | 1 | 29.300 / 42.783 / 46.333 | 29.300 / 42.783 / 46.333 | — | PASS | — | 0/10 FAIL | 6.000 / 24.000 / 42.000 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 2 | 1393.683 / 1397.233 / 1410.717 | 1440.017 / 1440.017 / 1440.017 | 30.079 / 32.696 / 48.147 | FAIL | FAIL | 10/10 FAIL | 6.473 / 7.666 / 11.374 PASS | 1388.617 / 1391.875 / 1405.050 |
| warrior | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 357.367 / 357.467 / 357.567 |
| warrior | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| warrior | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| guardian | 1 | 24.300 / 27.883 / 33.867 | 24.300 / 27.883 / 33.867 | — | PASS | — | 0/10 FAIL | 10.500 / 30.000 / 54.500 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 2 | 1406.150 / 1412.133 / 1415.717 | 1440.017 / 1440.017 / 1440.017 | 41.520 / 50.644 / 58.260 | FAIL | FAIL | 10/10 FAIL | 6.766 / 9.217 / 11.567 PASS | 1400.000 / 1405.308 / 1409.083 |
| guardian | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 356.917 / 357.025 / 357.233 |
| guardian | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| guardian | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| rogue | 1 | 28.333 / 42.667 / 47.667 | 28.333 / 42.667 / 47.667 | — | PASS | — | 0/10 FAIL | 6.000 / 22.500 / 39.000 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 2 | 1392.350 / 1397.350 / 1411.683 | 1440.017 / 1440.017 / 1440.017 | 29.210 / 32.769 / 49.824 | FAIL | FAIL | 10/10 FAIL | 6.057 / 8.108 / 9.243 PASS | 1387.417 / 1392.250 / 1406.083 |
| rogue | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 357.167 / 357.308 / 357.417 |
| rogue | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| rogue | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| hunter | 1 | 35.333 / 43.500 / 48.550 | 35.333 / 43.500 / 48.550 | — | PASS | — | 0/10 FAIL | 6.000 / 24.000 / 41.829 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 2 | 1391.467 / 1396.517 / 1404.683 | 1440.017 / 1440.017 / 1440.017 | 28.660 / 32.121 / 39.755 | FAIL | FAIL | 10/10 FAIL | 5.955 / 8.342 / 11.120 PASS | 1386.367 / 1391.317 / 1399.667 |
| hunter | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 357.267 / 357.417 / 357.533 |
| hunter | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| hunter | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| archer | 1 | 39.850 / 53.333 / 61.617 | 39.850 / 53.333 / 61.617 | — | PASS | — | 0/10 FAIL | 6.000 / 23.250 / 39.224 PASS | 0.000 / 0.000 / 0.000 |
| archer | 2 | 1378.400 / 1386.683 / 1400.167 | 1440.017 / 1440.017 / 1440.017 | 22.371 / 26.003 / 35.136 | FAIL | FAIL | 10/10 FAIL | 7.357 / 9.224 / 10.481 PASS | 1373.183 / 1381.208 / 1394.367 |
| archer | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 356.717 / 356.900 / 356.933 |
| archer | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| archer | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| witch | 1 | 41.867 / 50.367 / 57.850 | 41.867 / 50.367 / 57.850 | — | PASS | — | 0/10 FAIL | 6.000 / 21.000 / 39.000 PASS | 0.000 / 0.000 / 0.000 |
| witch | 2 | 1382.167 / 1389.650 / 1398.150 | 1440.017 / 1440.017 / 1440.017 | 23.892 / 27.593 / 33.395 | FAIL | FAIL | 10/10 FAIL | 6.055 / 9.751 / 11.613 PASS | 1376.850 / 1383.892 / 1392.300 |
| witch | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 356.450 / 356.617 / 356.683 |
| witch | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| witch | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| alchemist | 1 | 37.433 / 45.342 / 53.850 | 37.433 / 45.342 / 53.850 | — | PASS | — | 0/10 FAIL | 6.000 / 24.000 / 41.610 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 2 | 1386.167 / 1394.675 / 1402.583 | 1440.017 / 1440.017 / 1440.017 | 25.741 / 30.763 / 37.469 | FAIL | FAIL | 10/10 FAIL | 6.832 / 9.522 / 13.563 PASS | 1380.300 / 1388.892 / 1396.850 |
| alchemist | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 356.467 / 356.725 / 356.833 |
| alchemist | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| alchemist | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |

| guardrail | whole-band verdict | evidence |
| --- | --- | --- |
| first-boss | FAIL | Historical median/cohort verdict: FAIL. warrior 42.8m; guardian 27.9m; rogue 42.7m; hunter 43.5m; archer 53.3m; witch 50.4m; alchemist 45.3m |
| chapter-growth | FAIL | Historical median/cohort verdict: FAIL. warrior ch2 32.66x; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch2 50.64x; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch2 32.75x; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch2 32.10x; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch2 26.00x; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch2 27.59x; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch2 30.76x; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached |
| class-spread | FAIL | Historical median/cohort verdict: FAIL. ch1 range 58.5%; ch2 range 0.0%; ch3 range not reached; ch4 range not reached; ch5 range not reached; warrior ch1 -1.6%; guardian ch1 -35.9%; rogue ch1 -1.9%; hunter ch1 0.0%; archer ch1 22.6%; witch ch1 15.8%; alchemist ch1 4.2%; warrior ch2 0.0%; guardian ch2 0.0%; rogue ch2 0.0%; hunter ch2 0.0%; archer ch2 0.0%; witch ch2 0.0%; alchemist ch2 0.0%; warrior ch3 not reached; guardian ch3 not reached; rogue ch3 not reached; hunter ch3 not reached; archer ch3 not reached; witch ch3 not reached; alchemist ch3 not reached; warrior ch4 not reached; guardian ch4 not reached; rogue ch4 not reached; hunter ch4 not reached; archer ch4 not reached; witch ch4 not reached; alchemist ch4 not reached; warrior ch5 not reached; guardian ch5 not reached; rogue ch5 not reached; hunter ch5 not reached; archer ch5 not reached; witch ch5 not reached; alchemist ch5 not reached |
| chapter-bounds | FAIL | Historical median/cohort verdict: FAIL. warrior ch1 42.8m; warrior ch2 1397.2m; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch1 27.9m; guardian ch2 1412.1m; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch1 42.7m; rogue ch2 1397.3m; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch1 43.5m; hunter ch2 1396.5m; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch1 53.3m; archer ch2 1386.7m; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch1 50.4m; witch ch2 1389.7m; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch1 45.3m; alchemist ch2 1394.7m; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached |
| never-stuck | PASS | Historical median/cohort verdict: PASS. 0/70 runs stuck |
| craft-salvage-loss | PASS | Historical median/cohort verdict: PASS. rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 |
| walk-share | FAIL | Historical median/cohort verdict: FAIL. warrior ch1 r1 L1.0: 44.6%; warrior ch3 r5 L60.0: 80.6%; guardian ch1 r1 L1.0: 34.2%; guardian ch3 r5 L60.0: 65.8%; rogue ch1 r1 L1.0: 34.5%; rogue ch3 r5 L60.0: 71.2%; hunter ch1 r1 L1.0: 41.7%; hunter ch3 r5 L60.0: 76.9%; archer ch1 r1 L1.0: 35.1%; archer ch3 r5 L60.0: 66.7%; witch ch1 r1 L1.0: 29.0%; witch ch3 r5 L60.0: 54.1%; alchemist ch1 r1 L1.0: 33.2%; alchemist ch3 r5 L60.0: 58.5% |
| boss-check | FAIL | Historical median/cohort verdict: FAIL. warrior ch1 first win 0.0%, median 24.00s; warrior ch2 first win 100.0%, median 7.67s; warrior ch3 first win 0.0%, median not reached (missing attempts); warrior ch4 first win 0.0%, median not reached (missing attempts); warrior ch5 first win 0.0%, median not reached (missing attempts); guardian ch1 first win 0.0%, median 30.00s; guardian ch2 first win 100.0%, median 9.22s; guardian ch3 first win 0.0%, median not reached (missing attempts); guardian ch4 first win 0.0%, median not reached (missing attempts); guardian ch5 first win 0.0%, median not reached (missing attempts); rogue ch1 first win 0.0%, median 22.50s; rogue ch2 first win 100.0%, median 8.11s; rogue ch3 first win 0.0%, median not reached (missing attempts); rogue ch4 first win 0.0%, median not reached (missing attempts); rogue ch5 first win 0.0%, median not reached (missing attempts); hunter ch1 first win 0.0%, median 24.00s; hunter ch2 first win 100.0%, median 8.34s; hunter ch3 first win 0.0%, median not reached (missing attempts); hunter ch4 first win 0.0%, median not reached (missing attempts); hunter ch5 first win 0.0%, median not reached (missing attempts); archer ch1 first win 0.0%, median 23.25s; archer ch2 first win 100.0%, median 9.22s; archer ch3 first win 0.0%, median not reached (missing attempts); archer ch4 first win 0.0%, median not reached (missing attempts); archer ch5 first win 0.0%, median not reached (missing attempts); witch ch1 first win 0.0%, median 21.00s; witch ch2 first win 100.0%, median 9.75s; witch ch3 first win 0.0%, median not reached (missing attempts); witch ch4 first win 0.0%, median not reached (missing attempts); witch ch5 first win 0.0%, median not reached (missing attempts); alchemist ch1 first win 0.0%, median 24.00s; alchemist ch2 first win 100.0%, median 9.52s; alchemist ch3 first win 0.0%, median not reached (missing attempts); alchemist ch4 first win 0.0%, median not reached (missing attempts); alchemist ch5 first win 0.0%, median not reached (missing attempts) |
| guardrails | PASS | Historical median/cohort verdict: PASS. All numeric leaves within 0.33–3x except firstClearKeys=0/1; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 |

### Current, step 2, seeds 1–10

| class | ch | duration min (min / median / max) | cumulative min | growth per seed | duration 10–360 | growth 1.3–2 | first wins (40–90%) | fight sec band (≤180) | key wait min |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| warrior | 1 | 29.333 / 35.350 / 46.200 | 29.333 / 35.350 / 46.200 | — | PASS | — | 0/10 FAIL | 10.500 / 24.000 / 42.000 PASS | 0.000 / 0.000 / 0.000 |
| warrior | 2 | 1393.817 / 1404.667 / 1410.683 | 1440.017 / 1440.017 / 1440.017 | 30.169 / 39.736 / 48.091 | FAIL | FAIL | 10/10 FAIL | 5.509 / 8.211 / 10.159 PASS | 1388.883 / 1399.233 / 1405.217 |
| warrior | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 357.383 / 357.500 / 357.567 |
| warrior | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| warrior | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| guardian | 1 | 21.650 / 28.667 / 33.517 | 21.650 / 28.667 / 33.517 | — | PASS | — | 0/10 FAIL | 12.000 / 31.500 / 54.000 PASS | 0.000 / 0.000 / 0.000 |
| guardian | 2 | 1406.500 / 1411.350 / 1418.367 | 1440.017 / 1440.017 / 1440.017 | 41.964 / 49.294 / 65.513 | FAIL | FAIL | 10/10 FAIL | 7.507 / 9.884 / 10.889 PASS | 1400.450 / 1404.908 / 1412.100 |
| guardian | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 357.050 / 357.167 / 357.233 |
| guardian | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| guardian | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| rogue | 1 | 26.567 / 37.542 / 41.283 | 26.567 / 37.542 / 41.283 | — | PASS | — | 0/10 FAIL | 7.500 / 21.000 / 39.852 PASS | 0.000 / 0.000 / 0.000 |
| rogue | 2 | 1398.733 / 1402.475 / 1413.450 | 1440.017 / 1440.017 / 1440.017 | 33.881 / 37.383 / 53.204 | FAIL | FAIL | 10/10 FAIL | 6.534 / 8.600 / 9.722 PASS | 1393.583 / 1397.350 / 1408.733 |
| rogue | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 357.183 / 357.317 / 357.450 |
| rogue | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| rogue | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| hunter | 1 | 29.467 / 39.375 / 48.450 | 29.467 / 39.375 / 48.450 | — | PASS | — | 0/10 FAIL | 10.500 / 24.000 / 42.000 PASS | 0.000 / 0.000 / 0.000 |
| hunter | 2 | 1391.567 / 1400.642 / 1410.550 | 1440.017 / 1440.017 / 1440.017 | 28.722 / 35.572 / 47.869 | FAIL | FAIL | 10/10 FAIL | 7.055 / 8.241 / 9.611 PASS | 1386.283 / 1395.150 / 1405.300 |
| hunter | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 357.300 / 357.425 / 357.483 |
| hunter | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| hunter | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| archer | 1 | 38.617 / 49.117 / 53.533 | 38.617 / 49.117 / 53.533 | — | PASS | — | 0/10 FAIL | 7.500 / 24.000 / 40.500 PASS | 0.000 / 0.000 / 0.000 |
| archer | 2 | 1386.483 / 1390.900 / 1401.400 | 1440.017 / 1440.017 / 1440.017 | 25.899 / 28.322 / 36.290 | FAIL | FAIL | 10/10 FAIL | 7.690 / 8.622 / 10.559 PASS | 1380.833 / 1385.325 / 1396.050 |
| archer | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 356.800 / 356.967 / 357.067 |
| archer | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| archer | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| witch | 1 | 37.867 / 48.700 / 62.567 | 37.867 / 48.700 / 62.567 | — | PASS | — | 0/10 FAIL | 9.000 / 21.000 / 39.243 PASS | 0.000 / 0.000 / 0.000 |
| witch | 2 | 1377.450 / 1391.317 / 1402.150 | 1440.017 / 1440.017 / 1440.017 | 22.016 / 28.585 / 37.029 | FAIL | FAIL | 10/10 FAIL | 7.349 / 9.299 / 11.371 PASS | 1372.150 / 1385.650 / 1396.383 |
| witch | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 356.567 / 356.642 / 356.733 |
| witch | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| witch | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| alchemist | 1 | 38.850 / 45.842 / 50.833 | 38.850 / 45.842 / 50.833 | — | PASS | — | 0/10 FAIL | 9.000 / 24.000 / 44.669 PASS | 0.000 / 0.000 / 0.000 |
| alchemist | 2 | 1389.183 / 1394.175 / 1401.167 | 1440.017 / 1440.017 / 1440.017 | 27.328 / 30.413 / 36.066 | FAIL | FAIL | 10/10 FAIL | 6.973 / 8.918 / 12.165 PASS | 1383.850 / 1388.583 / 1395.783 |
| alchemist | 3 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 356.533 / 356.792 / 356.883 |
| alchemist | 4 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |
| alchemist | 5 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | FAIL | FAIL | 0/10 FAIL | not reached / not reached / not reached FAIL | 0.000 / 0.000 / 0.000 |

| guardrail | whole-band verdict | evidence |
| --- | --- | --- |
| first-boss | FAIL | Historical median/cohort verdict: FAIL. warrior 35.4m; guardian 28.7m; rogue 37.5m; hunter 39.4m; archer 49.1m; witch 48.7m; alchemist 45.8m |
| chapter-growth | FAIL | Historical median/cohort verdict: FAIL. warrior ch2 39.74x; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch2 49.23x; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch2 37.36x; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch2 35.57x; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch2 28.32x; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch2 28.57x; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch2 30.41x; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached |
| class-spread | FAIL | Historical median/cohort verdict: FAIL. ch1 range 51.9%; ch2 range 0.0%; ch3 range not reached; ch4 range not reached; ch5 range not reached; warrior ch1 -10.2%; guardian ch1 -27.2%; rogue ch1 -4.7%; hunter ch1 0.0%; archer ch1 24.7%; witch ch1 23.7%; alchemist ch1 16.4%; warrior ch2 0.0%; guardian ch2 0.0%; rogue ch2 0.0%; hunter ch2 0.0%; archer ch2 0.0%; witch ch2 0.0%; alchemist ch2 0.0%; warrior ch3 not reached; guardian ch3 not reached; rogue ch3 not reached; hunter ch3 not reached; archer ch3 not reached; witch ch3 not reached; alchemist ch3 not reached; warrior ch4 not reached; guardian ch4 not reached; rogue ch4 not reached; hunter ch4 not reached; archer ch4 not reached; witch ch4 not reached; alchemist ch4 not reached; warrior ch5 not reached; guardian ch5 not reached; rogue ch5 not reached; hunter ch5 not reached; archer ch5 not reached; witch ch5 not reached; alchemist ch5 not reached |
| chapter-bounds | FAIL | Historical median/cohort verdict: FAIL. warrior ch1 35.4m; warrior ch2 1404.7m; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch1 28.7m; guardian ch2 1411.3m; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch1 37.5m; rogue ch2 1402.5m; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch1 39.4m; hunter ch2 1400.6m; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch1 49.1m; archer ch2 1390.9m; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch1 48.7m; witch ch2 1391.3m; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch1 45.8m; alchemist ch2 1394.2m; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached |
| never-stuck | PASS | Historical median/cohort verdict: PASS. 0/70 runs stuck |
| craft-salvage-loss | PASS | Historical median/cohort verdict: PASS. rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 |
| walk-share | FAIL | Historical median/cohort verdict: FAIL. warrior ch1 r1 L1.0: 44.6%; warrior ch3 r5 L60.0: 80.6%; guardian ch1 r1 L1.0: 34.2%; guardian ch3 r5 L60.0: 65.8%; rogue ch1 r1 L1.0: 34.5%; rogue ch3 r5 L60.0: 65.3%; hunter ch1 r1 L1.0: 41.7%; hunter ch3 r5 L60.0: 76.9%; archer ch1 r1 L1.0: 35.1%; archer ch3 r5 L60.0: 66.7%; witch ch1 r1 L1.0: 29.0%; witch ch3 r5 L60.0: 54.1%; alchemist ch1 r1 L1.0: 33.2%; alchemist ch3 r5 L60.0: 58.5% |
| boss-check | FAIL | Historical median/cohort verdict: FAIL. warrior ch1 first win 0.0%, median 24.00s; warrior ch2 first win 100.0%, median 8.21s; warrior ch3 first win 0.0%, median not reached (missing attempts); warrior ch4 first win 0.0%, median not reached (missing attempts); warrior ch5 first win 0.0%, median not reached (missing attempts); guardian ch1 first win 0.0%, median 31.50s; guardian ch2 first win 100.0%, median 9.88s; guardian ch3 first win 0.0%, median not reached (missing attempts); guardian ch4 first win 0.0%, median not reached (missing attempts); guardian ch5 first win 0.0%, median not reached (missing attempts); rogue ch1 first win 0.0%, median 21.00s; rogue ch2 first win 100.0%, median 8.60s; rogue ch3 first win 0.0%, median not reached (missing attempts); rogue ch4 first win 0.0%, median not reached (missing attempts); rogue ch5 first win 0.0%, median not reached (missing attempts); hunter ch1 first win 0.0%, median 24.00s; hunter ch2 first win 100.0%, median 8.24s; hunter ch3 first win 0.0%, median not reached (missing attempts); hunter ch4 first win 0.0%, median not reached (missing attempts); hunter ch5 first win 0.0%, median not reached (missing attempts); archer ch1 first win 0.0%, median 24.00s; archer ch2 first win 100.0%, median 8.62s; archer ch3 first win 0.0%, median not reached (missing attempts); archer ch4 first win 0.0%, median not reached (missing attempts); archer ch5 first win 0.0%, median not reached (missing attempts); witch ch1 first win 0.0%, median 21.00s; witch ch2 first win 100.0%, median 9.30s; witch ch3 first win 0.0%, median not reached (missing attempts); witch ch4 first win 0.0%, median not reached (missing attempts); witch ch5 first win 0.0%, median not reached (missing attempts); alchemist ch1 first win 0.0%, median 24.00s; alchemist ch2 first win 100.0%, median 8.92s; alchemist ch3 first win 0.0%, median not reached (missing attempts); alchemist ch4 first win 0.0%, median not reached (missing attempts); alchemist ch5 first win 0.0%, median not reached (missing attempts) |
| guardrails | PASS | Historical median/cohort verdict: PASS. All numeric leaves within 0.33–3x except firstClearKeys=0/1; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 |

## Reproduction

From the repository root after the frozen install:

```sh
T2_BANDS_OUT=/tmp/t2-bands node packages/game-rules/src/v2/sim/measure.mjs
T2_SCENARIO=content T2_KILLS='[18,38,26,30,30]' T2_BANDS_OUT=/tmp/t2-38 node packages/game-rules/src/v2/sim/measure.mjs
T2_SCENARIO=content T2_KILLS='[18,39,81,150,200]' T2_BANDS_OUT=/tmp/t2-content node packages/game-rules/src/v2/sim/measure.mjs
```

The CLI writes JSON observations and Markdown band tables to the supplied temporary prefix, verifies exact config restoration, and writes nothing into production files. It uses the web package’s existing Vite dependency to load TypeScript. No test retry, timeout or skip is involved. Raw per-seed chapter durations are pasted in [the T2 mission report](../../reports/t2-numbers-e2e.md).

## Signature

NOT READY FOR SIGN-OFF — the owner has not approved or applied this proposal.

User: ____ (approved / changes)
