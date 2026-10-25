# Cat RPG v2 numbers proposal (V6c)

Proposal only. V2_CONFIG unchanged. Needs the user's sign-off. Main run: seven classes, seeds 1–20, stepMinutes 2, maximum 1,800 active minutes. Diagnostic: stepMinutes 1, seeds 1–5, same horizon. Greedy equipment, up to three improving crafts per claim, salvage at 90% bag usage, boss attempts at the frontier. Stop after chapter five's first clear. Null milestones remain Infinity in every timing target and percentile.

**Status:** NOT READY FOR SIGN-OFF. Failing targets: chapter-growth, class-spread, chapter-bounds, never-stuck, boss-check. The bounded config search found no all-targets solution; this is a fallback candidate, not an approved balance.

## Targets

| id | target in words | current result | proposed result | ok? |
| --- | --- | --- | --- | --- |
| first-boss | Every class median first win 10–15 minutes | warrior 38m; guardian 28m; rogue 38m; hunter 40m; archer 47m; witch 49m; alchemist 47m | warrior 12m; guardian 10m; rogue 12m; hunter 12m; archer 14m; witch 14m; alchemist 12m | yes |
| chapter-growth | Every class chapter duration grows 1.3–2.0x | warrior ch2 36.95x; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch2 50.50x; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch2 36.95x; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch2 35.05x; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch2 29.68x; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch2 28.43x; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch2 29.68x; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached | warrior ch2 0.67x; warrior ch3 1.00x; warrior ch4 177.00x; warrior ch5 0.00x; guardian ch2 0.80x; guardian ch3 1.00x; guardian ch4 177.00x; guardian ch5 0.00x; rogue ch2 0.67x; rogue ch3 0.75x; rogue ch4 236.00x; rogue ch5 0.00x; hunter ch2 0.67x; hunter ch3 0.88x; hunter ch4 202.29x; hunter ch5 0.00x; archer ch2 0.57x; archer ch3 1.00x; archer ch4 176.50x; archer ch5 0.00x; witch ch2 0.57x; witch ch3 1.00x; witch ch4 176.50x; witch ch5 0.00x; alchemist ch2 0.67x; alchemist ch3 1.00x; alchemist ch4 176.75x; alchemist ch5 0.00x | NO |
| class-spread | Every cumulative class median within ±15% of center AND chapter range / center ≥3% | ch1 range 52.5%; ch2 range 0.0%; ch3 range not reached; ch4 range not reached; ch5 range not reached; warrior ch1 -5.0%; guardian ch1 -30.0%; rogue ch1 -5.0%; hunter ch1 0.0%; archer ch1 17.5%; witch ch1 22.5%; alchemist ch1 17.5%; warrior ch2 0.0%; guardian ch2 0.0%; rogue ch2 0.0%; hunter ch2 0.0%; archer ch2 0.0%; witch ch2 0.0%; alchemist ch2 0.0%; warrior ch3 not reached; guardian ch3 not reached; rogue ch3 not reached; hunter ch3 not reached; archer ch3 not reached; witch ch3 not reached; alchemist ch3 not reached; warrior ch4 not reached; guardian ch4 not reached; rogue ch4 not reached; hunter ch4 not reached; archer ch4 not reached; witch ch4 not reached; alchemist ch4 not reached; warrior ch5 not reached; guardian ch5 not reached; rogue ch5 not reached; hunter ch5 not reached; archer ch5 not reached; witch ch5 not reached; alchemist ch5 not reached | ch1 range 33.3%; ch2 range 20.0%; ch3 range 15.4%; ch4 range 0.0%; ch5 range 0.0%; warrior ch1 0.0%; guardian ch1 -16.7%; rogue ch1 0.0%; hunter ch1 0.0%; archer ch1 16.7%; witch ch1 16.7%; alchemist ch1 0.0%; warrior ch2 0.0%; guardian ch2 -10.0%; rogue ch2 -10.0%; hunter ch2 0.0%; archer ch2 10.0%; witch ch2 10.0%; alchemist ch2 0.0%; warrior ch3 0.0%; guardian ch3 0.0%; rogue ch3 0.0%; hunter ch3 0.0%; archer ch3 15.4%; witch ch3 15.4%; alchemist ch3 7.7%; warrior ch4 0.0%; guardian ch4 0.0%; rogue ch4 0.0%; hunter ch4 0.0%; archer ch4 0.0%; witch ch4 0.0%; alchemist ch4 0.0%; warrior ch5 0.0%; guardian ch5 0.0%; rogue ch5 0.0%; hunter ch5 0.0%; archer ch5 0.0%; witch ch5 0.0%; alchemist ch5 0.0% | NO |
| chapter-bounds | Every chapter duration median 10–360 minutes | warrior ch1 38m; warrior ch2 1404m; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch1 28m; guardian ch2 1414m; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch1 38m; rogue ch2 1404m; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch1 40m; hunter ch2 1402m; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch1 47m; archer ch2 1395m; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch1 49m; witch ch2 1393m; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch1 47m; alchemist ch2 1395m; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached | warrior ch1 12m; warrior ch2 8m; warrior ch3 8m; warrior ch4 1416m; warrior ch5 4m; guardian ch1 10m; guardian ch2 8m; guardian ch3 8m; guardian ch4 1416m; guardian ch5 4m; rogue ch1 12m; rogue ch2 8m; rogue ch3 6m; rogue ch4 1416m; rogue ch5 4m; hunter ch1 12m; hunter ch2 8m; hunter ch3 7m; hunter ch4 1416m; hunter ch5 4m; archer ch1 14m; archer ch2 8m; archer ch3 8m; archer ch4 1412m; archer ch5 4m; witch ch1 14m; witch ch2 8m; witch ch3 8m; witch ch4 1412m; witch ch5 4m; alchemist ch1 12m; alchemist ch2 8m; alchemist ch3 8m; alchemist ch4 1414m; alchemist ch5 4m | NO |
| never-stuck | No six-hour period without level, round, boss win or power gain | 0/140 runs stuck | 1/140 runs stuck | NO |
| craft-salvage-loss | Every recipe returns less weighted salvage value than cost | rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 | rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 | yes |
| walk-share | Every class at ch1 r1 and ch3 r5: walking ≤50% at median observed entry level | warrior ch1 r1 L1.0: 44.6%; warrior ch3 r5 L60.0: 80.6%; guardian ch1 r1 L1.0: 34.2%; guardian ch3 r5 L60.0: 65.8%; rogue ch1 r1 L1.0: 34.5%; rogue ch3 r5 L60.0: 65.3%; hunter ch1 r1 L1.0: 41.7%; hunter ch3 r5 L60.0: 76.9%; archer ch1 r1 L1.0: 35.1%; archer ch3 r5 L60.0: 66.7%; witch ch1 r1 L1.0: 29.0%; witch ch3 r5 L60.0: 54.1%; alchemist ch1 r1 L1.0: 33.2%; alchemist ch3 r5 L60.0: 58.5% | warrior ch1 r1 L1.0: 21.1%; warrior ch3 r5 L37.0: 29.8%; guardian ch1 r1 L1.0: 17.5%; guardian ch3 r5 L35.0: 25.5%; rogue ch1 r1 L1.0: 17.5%; rogue ch3 r5 L36.0: 30.0%; hunter ch1 r1 L1.0: 19.4%; hunter ch3 r5 L37.0: 30.7%; archer ch1 r1 L1.0: 18.0%; archer ch3 r5 L37.0: 28.8%; witch ch1 r1 L1.0: 17.1%; witch ch3 r5 L37.0: 30.2%; alchemist ch1 r1 L1.0: 17.8%; alchemist ch3 r5 L36.0: 25.4% | yes |
| boss-check | Every chapter/class first-attempt wins 40–90%; median boss duration ≤180s | warrior ch1 first win 0.0%, median 25.50s; warrior ch2 first win 100.0%, median 7.84s; warrior ch3 first win 0.0%, median not reached (missing attempts); warrior ch4 first win 0.0%, median not reached (missing attempts); warrior ch5 first win 0.0%, median not reached (missing attempts); guardian ch1 first win 0.0%, median 36.00s; guardian ch2 first win 100.0%, median 8.49s; guardian ch3 first win 0.0%, median not reached (missing attempts); guardian ch4 first win 0.0%, median not reached (missing attempts); guardian ch5 first win 0.0%, median not reached (missing attempts); rogue ch1 first win 0.0%, median 22.50s; rogue ch2 first win 100.0%, median 7.93s; rogue ch3 first win 0.0%, median not reached (missing attempts); rogue ch4 first win 0.0%, median not reached (missing attempts); rogue ch5 first win 0.0%, median not reached (missing attempts); hunter ch1 first win 0.0%, median 24.00s; hunter ch2 first win 100.0%, median 8.49s; hunter ch3 first win 0.0%, median not reached (missing attempts); hunter ch4 first win 0.0%, median not reached (missing attempts); hunter ch5 first win 0.0%, median not reached (missing attempts); archer ch1 first win 0.0%, median 22.50s; archer ch2 first win 100.0%, median 8.51s; archer ch3 first win 0.0%, median not reached (missing attempts); archer ch4 first win 0.0%, median not reached (missing attempts); archer ch5 first win 0.0%, median not reached (missing attempts); witch ch1 first win 0.0%, median 22.50s; witch ch2 first win 100.0%, median 9.85s; witch ch3 first win 0.0%, median not reached (missing attempts); witch ch4 first win 0.0%, median not reached (missing attempts); witch ch5 first win 0.0%, median not reached (missing attempts); alchemist ch1 first win 0.0%, median 24.00s; alchemist ch2 first win 100.0%, median 9.93s; alchemist ch3 first win 0.0%, median not reached (missing attempts); alchemist ch4 first win 0.0%, median not reached (missing attempts); alchemist ch5 first win 0.0%, median not reached (missing attempts) | warrior ch1 first win 0.0%, median 83.24s; warrior ch2 first win 100.0%, median 81.18s; warrior ch3 first win 100.0%, median 74.72s; warrior ch4 first win 100.0%, median 14.00s; warrior ch5 first win 100.0%, median 25.56s; guardian ch1 first win 25.0%, median 117.98s; guardian ch2 first win 100.0%, median 94.19s; guardian ch3 first win 100.0%, median 83.03s; guardian ch4 first win 100.0%, median 14.96s; guardian ch5 first win 100.0%, median 27.64s; rogue ch1 first win 0.0%, median 76.71s; rogue ch2 first win 100.0%, median 76.74s; rogue ch3 first win 100.0%, median 71.39s; rogue ch4 first win 100.0%, median 13.67s; rogue ch5 first win 100.0%, median 25.38s; hunter ch1 first win 0.0%, median 79.50s; hunter ch2 first win 100.0%, median 85.49s; hunter ch3 first win 100.0%, median 82.20s; hunter ch4 first win 100.0%, median 14.19s; hunter ch5 first win 100.0%, median 26.68s; archer ch1 first win 0.0%, median 73.43s; archer ch2 first win 95.0%, median 79.45s; archer ch3 first win 100.0%, median 72.14s; archer ch4 first win 100.0%, median 15.01s; archer ch5 first win 100.0%, median 27.51s; witch ch1 first win 0.0%, median 72.00s; witch ch2 first win 90.0%, median 80.19s; witch ch3 first win 100.0%, median 76.93s; witch ch4 first win 100.0%, median 14.01s; witch ch5 first win 100.0%, median 24.84s; alchemist ch1 first win 0.0%, median 82.82s; alchemist ch2 first win 100.0%, median 84.43s; alchemist ch3 first win 100.0%, median 78.61s; alchemist ch4 first win 100.0%, median 15.25s; alchemist ch5 first win 100.0%, median 27.40s | NO |
| guardrails | Each proposed numeric leaf 0.33–3x current; walk ≤2000ms; boss ≤180s; daily keys ≤3 | All numeric leaves within 0.33–3x; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 | All numeric leaves within 0.33–3x; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 | yes |

## Proposed changes

| path | current | proposed | why |
| --- | --- | --- | --- |
| cat.baseAtk | 10 | 14 | Use 14 starting ATK to move first-boss medians toward 10–15 minutes without making normal kills instantaneous. |
| cat.baseHp | 100 | 300 | Cap starting HP at three times current health, retaining meaningful early boss losses and class HP/DEF differences. |
| cat.baseDef | 5 | 5 | Keep the current base DEF of 5; class defensive multipliers remain content-defined. |
| cat.levelGrowth | 0.06 | 0.06 | Retain current 6% stat growth rather than the old 0.8% proposal so levels materially improve combat strength. |
| monster.hpBase | 30 | 90 | Use three times starting monster HP so attacking matters more than walking at the measured probes. |
| monster.hpGrowth | 1.13 | 1.06 | Use 6% stage HP growth to keep later monsters manageable within the three-minute boss cap; chapter growth still fails. |
| monster.atkBase | 4 | 8 | Double initial monster damage to retain survival pressure alongside the bounded HP increase. |
| monster.atkGrowth | 1.12 | 1.06 | Use 6% stage damage growth to avoid late survival walls; first-attempt success still needs content tuning. |
| monster.xpBase | 6 | 18 | Triple initial XP per monster to make level progression meaningful before the first boss and reduce early farming waits. |
| idle.dailyKeys | 1 | 3 | Grant three daily keys, the allowed maximum; the remaining key budget gap is explicitly reported. |
| idle.walkTimeMs | 1000 | 1000 | Keep current one-second walking instead of six seconds; measured combat retains the larger share of each probe. |
| idle.clearedChapterKeyChance | 0.006666666666666667 | 0.02 | Triple key-drop chance when farming cleared content; the frontier policy cannot rely on these drops while waiting at a boss. |
| boss.maxMs | 60000 | 180000 | Bound every boss attempt to three minutes instead of the old twenty-minute proposal. |
| boss.attackIntervalMs | 1500 | 4500 | Allow 4.5 seconds between normal boss attacks to keep bounded player HP viable; first-attempt rate failures remain visible. |
| boss.bigEveryMs | 6000 | 6000 | Keep the current six-second big-attack cadence so telegraphed attacks remain part of combat. |
| boss.bigMultiplier | 2.5 | 1.5 | Reduce big-hit damage to 1.5 times normal damage while retaining early survival losses. |

## Per-class times (proposed, stepMinutes 2)

Cumulative active minutes. Chapter cells: p25 / median / p75. Level columns: median.

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 11.5 / 12 / 12 | 18 / 20 / 20 | 26 / 26 / 28 | 1442 / 1442 / 1442 | 1446 / 1446 / 1446 | 10 | 26 |
| guardian | 9.5 / 10 / 10 | 17.5 / 18 / 18 | 24 / 26 / 26 | 1442 / 1442 / 1442 | 1446 / 1446 / 1446 | 10 | 24 |
| rogue | 11.5 / 12 / 12 | 18 / 18 / 20 | 24 / 26 / 26 | 1442 / 1442 / 1442 | 1446 / 1446 / 1446 | 10 | 24 |
| hunter | 12 / 12 / 12 | 18 / 20 / 20 | 26 / 26 / 26 | 1442 / 1442 / 1442 | 1446 / 1446 / 1446 | 10 | 26 |
| archer | 12 / 14 / 14 | 20 / 22 / 22 | 28 / 30 / 30 | 1442 / 1442 / 1442 | 1446 / 1446 / 1446 | 10 | 27 |
| witch | 13.5 / 14 / 14.5 | 22 / 22 / 22.5 | 30 / 30 / 30 | 1442 / 1442 / 1442 | 1446 / 1446 / 1446 | 10 | 28 |
| alchemist | 12 / 12 / 14 | 20 / 20 / 22 | 28 / 28 / 30 | 1442 / 1442 / 1442 | 1446 / 1446 / 1446 | 10 | 26 |

## StepMinutes 1 diagnostic (proposed, seeds 1–5)

Cumulative boss-win medians in active minutes; no seed is omitted for a missing win.

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 11 | 18 | 25 | 1441 | 1444 | 9 | 24 |
| guardian | 8 | 16 | 23 | 1441 | 1444 | 9 | 23 |
| rogue | 11 | 18 | 24 | 1441 | 1444 | 9 | 23 |
| hunter | 11 | 18 | 25 | 1441 | 1444 | 9 | 24 |
| archer | 12 | 19 | 26 | 1441 | 1445 | 9 | 25 |
| witch | 13 | 21 | 28 | 1441 | 1445 | 10 | 26 |
| alchemist | 12 | 19 | 26 | 1441 | 1445 | 9 | 25 |

Matched two-minute run restricted to seeds 1–5, so seed cohort changes can be separated from step-size effects:

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 12 | 18 | 26 | 1442 | 1446 | 10 | 24 |
| guardian | 10 | 18 | 26 | 1442 | 1446 | 10 | 24 |
| rogue | 12 | 18 | 26 | 1442 | 1446 | 10 | 24 |
| hunter | 12 | 18 | 26 | 1442 | 1446 | 10 | 26 |
| archer | 12 | 20 | 28 | 1442 | 1446 | 10 | 26 |
| witch | 12 | 20 | 28 | 1442 | 1446 | 10 | 28 |
| alchemist | 12 | 20 | 28 | 1442 | 1446 | 10 | 26 |

## Per-class times (current, stepMinutes 2)

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 35.5 / 38 / 44 | 1442 / 1442 / 1442 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16 | 68 |
| guardian | 26 / 28 / 30 | 1442 / 1442 / 1442 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16 | 70 |
| rogue | 32 / 38 / 40 | 1442 / 1442 / 1442 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16 | 66 |
| hunter | 38 / 40 / 44.5 | 1442 / 1442 / 1442 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16 | 70 |
| archer | 43.5 / 47 / 52 | 1442 / 1442 / 1442 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16 | 76 |
| witch | 42 / 49 / 54 | 1442 / 1442 / 1442 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 18 | 78 |
| alchemist | 44 / 47 / 50.5 | 1442 / 1442 / 1442 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 18 | 78 |

## Boss fights and losses (proposed)

Totals across seeds; median duration includes wins and losses. First attempt means the first actual boss fight in each run, never the first winning attempt. Missing attempts fail boss-check.

| class | chapter | fights | losses | first-attempt wins / seeds | median fight seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
| warrior | 1 | 59 | 39 | 0 / 20 | 83.24 |
| warrior | 2 | 20 | 0 | 20 / 20 | 81.18 |
| warrior | 3 | 20 | 0 | 20 / 20 | 74.72 |
| warrior | 4 | 20 | 0 | 20 / 20 | 14 |
| warrior | 5 | 20 | 0 | 20 / 20 | 25.56 |
| guardian | 1 | 35 | 15 | 5 / 20 | 117.98 |
| guardian | 2 | 20 | 0 | 20 / 20 | 94.19 |
| guardian | 3 | 20 | 0 | 20 / 20 | 83.03 |
| guardian | 4 | 20 | 0 | 20 / 20 | 14.96 |
| guardian | 5 | 20 | 0 | 20 / 20 | 27.64 |
| rogue | 1 | 56 | 36 | 0 / 20 | 76.71 |
| rogue | 2 | 20 | 0 | 20 / 20 | 76.74 |
| rogue | 3 | 20 | 0 | 20 / 20 | 71.39 |
| rogue | 4 | 20 | 0 | 20 / 20 | 13.67 |
| rogue | 5 | 20 | 0 | 20 / 20 | 25.38 |
| hunter | 1 | 65 | 45 | 0 / 20 | 79.5 |
| hunter | 2 | 20 | 0 | 20 / 20 | 85.49 |
| hunter | 3 | 20 | 0 | 20 / 20 | 82.2 |
| hunter | 4 | 20 | 0 | 20 / 20 | 14.19 |
| hunter | 5 | 20 | 0 | 20 / 20 | 26.68 |
| archer | 1 | 71 | 51 | 0 / 20 | 73.43 |
| archer | 2 | 21 | 1 | 19 / 20 | 79.45 |
| archer | 3 | 20 | 0 | 20 / 20 | 72.14 |
| archer | 4 | 20 | 0 | 20 / 20 | 15.01 |
| archer | 5 | 20 | 0 | 20 / 20 | 27.51 |
| witch | 1 | 80 | 60 | 0 / 20 | 72 |
| witch | 2 | 22 | 2 | 18 / 20 | 80.19 |
| witch | 3 | 20 | 0 | 20 / 20 | 76.93 |
| witch | 4 | 20 | 0 | 20 / 20 | 14.01 |
| witch | 5 | 20 | 0 | 20 / 20 | 24.84 |
| alchemist | 1 | 66 | 46 | 0 / 20 | 82.82 |
| alchemist | 2 | 20 | 0 | 20 / 20 | 84.43 |
| alchemist | 3 | 20 | 0 | 20 / 20 | 78.61 |
| alchemist | 4 | 20 | 0 | 20 / 20 | 15.25 |
| alchemist | 5 | 20 | 0 | 20 / 20 | 27.4 |

## Median monster time-to-kill (proposed)

Each probe uses the equal-weight median of that round's three regular archetypes and elite. Levels are medians of observed entry levels. Entry within a claim is recovered by replaying the pure claim with a binary search (16 iterations), using that claim's existing equipment; no extra rewards are applied. Walk-share evaluates every seed's entry equipment at the class's median entry level (floored as in deriveStats), then computes walkTimeMs / (walkTimeMs + median time-to-kill). Level profiles are captured under the run's active overrides, so aggregation cannot accidentally use production numbers. Missing probes fail.

| class | ch1 r1 | ch3 r1 | ch3 r5 | ch5 r1 |
| --- | ---: | ---: | ---: | ---: |
| warrior | 3740 ms (L1) | 2350.52 ms (L34) | 2386.95 ms (L37) | 240 ms (L60) |
| guardian | 4720 ms (L1) | 3061.21 ms (L32) | 2917.3 ms (L35) | 520 ms (L60) |
| rogue | 4700 ms (L1) | 2137.93 ms (L33) | 2226.04 ms (L36) | 515.34 ms (L60) |
| hunter | 4150 ms (L1) | 2290.79 ms (L34) | 2270.36 ms (L37) | 300 ms (L60) |
| archer | 4550 ms (L1) | 2526.4 ms (L34) | 2515.09 ms (L37) | 745.27 ms (L60) |
| witch | 4850 ms (L1) | 2291.83 ms (L34) | 2280.63 ms (L37) | 850 ms (L60) |
| alchemist | 4610 ms (L1) | 2976.4 ms (L33) | 2938.95 ms (L36) | 710 ms (L60) |

## How classes differ

Ch1: fastest guardian (10m), slowest archer, witch (14m); Ch2: fastest guardian, rogue (18m), slowest archer, witch (22m); Ch3: fastest warrior, guardian, rogue, hunter (26m), slowest archer, witch (30m); Ch4: fastest warrior, guardian, rogue, hunter, archer, witch, alchemist (1442m), slowest warrior, guardian, rogue, hunter, archer, witch, alchemist (1442m); Ch5: fastest warrior, guardian, rogue, hunter, archer, witch, alchemist (1446m), slowest warrior, guardian, rogue, hunter, archer, witch, alchemist (1446m). Boss losses, most first: witch 62, archer 52, alchemist 46, hunter 45, warrior 39, rogue 36, guardian 15. These observations retain the content-defined attack intervals, passives, HP, DEF and dodge differences; timing spread alone does not validate combat feel.

## Content changes suggested

Investigate chapter-specific boss HP/ATK archetypes instead of one 40x HP / 2.5x ATK multiplier for all chapters: lower late boss HP where fights time out, and tune early boss ATK per chapter to put first-attempt success inside 40–90%. Guardian bonk and 1.3x HP/DEF need a separate balance pass against fragile classes; adjust its HP/DEF multipliers only if measured first-attempt rates stay above 90% while other classes fail. Increase killsPerRound in chapters that clear too quickly instead of adding walking time; tune each chapter separately to recover 1.3–2x growth. Add one CatKey to each chapter 2 and chapter 3 first-clear chest in a separately approved content task: three daily keys plus those two rewards cover five first wins without raising dailyKeys above three. That closes the key budget gap, while timing, class spread and boss success still require revalidation. The current policy only earns cleared-chapter key drops when a gate sends it backward; it does not proactively farm earlier chapters or repeat bosses. These are unvalidated directions, not a claim that any specific content edit closes every gap. Re-run both step sizes and all seeds after a separately authorized content change.

## Not overridable

- MATERIALS.*.maxStack (STACK_CAPS_V2 and CAT_KEY_CAP)
- CHEST_SCALING.* (CHESTS)
- content registries (combat/bag/idle lookup maps)

## How to apply

Only after a passing review and explicit sign-off, copy these exact leaves into v2/config.ts:

- cat.baseAtk: 10 → 14
- cat.baseHp: 100 → 300
- cat.baseDef: 5 → 5
- cat.levelGrowth: 0.06 → 0.06
- monster.hpBase: 30 → 90
- monster.hpGrowth: 1.13 → 1.06
- monster.atkBase: 4 → 8
- monster.atkGrowth: 1.12 → 1.06
- monster.xpBase: 6 → 18
- idle.dailyKeys: 1 → 3
- idle.walkTimeMs: 1000 → 1000
- idle.clearedChapterKeyChance: 0.006666666666666667 → 0.02
- boss.maxMs: 60000 → 180000
- boss.attackIntervalMs: 1500 → 4500
- boss.bigEveryMs: 6000 → 6000
- boss.bigMultiplier: 2.5 → 1.5

## Method and limits

Claims use computeClaimV2 with offline=false. Both one- and two-minute steps fit within the inherited five-minute online window, so combat time is fully credited. Boss replay duration is recorded but is not added to active claim minutes. Retries happen at the next eligible step after the loss cooldown. Dates advance every 1,440 simulated minutes; keys are granted on the next claim. Equipment and crafting decisions still happen at claim boundaries, so step-size sensitivity includes different loot and craft decisions as well as timestamp rounding. A finite search cannot prove no config-only solution exists.

Chest rolls use rollLoot(CHESTS, first-clear/repeat table), with the idle gear rules for unlocked slot, smart weapon, chapter catalog, stage level, bonus lines and chest group. Craft/salvage weights: Fish 1, Yarn 10, Fluff Tuft 100, Shiny Button 200, Catnip Crystal 300, Starlight Scale 400. Every recipe must return less weighted salvage than it costs.

## Sign-off

User: ____ (approved / changes)
