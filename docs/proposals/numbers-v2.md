# Cat RPG v2 numbers proposal (V6d)

Proposal only. V2_CONFIG unchanged. Main proposal: seven classes, seeds 1–20, stepMinutes 2, 1,800 active minute horizon. Current, scenarios, C5b and player-day diagnostics: seeds 1–5. StepMinutes 1 diagnostic: seeds 1–5. Missing milestones remain Infinity. All boss times below are active minutes, rounded to 0.1 minute in timing tables.

**Status:** NOT READY FOR SIGN-OFF. Failing targets: first-boss, chapter-growth, class-spread, chapter-bounds, boss-check.

## Targets

| id | target in words | current result (5 seeds) | proposed result (20 seeds) | ok? |
| --- | --- | --- | --- | --- |
| first-boss | Every class median first win 10–15 minutes | warrior 36.3m; guardian 27.5m; rogue 36.3m; hunter 42.3m; archer 52.5m; witch 47.6m; alchemist 44.9m | warrior 8.0m; guardian 6.1m; rogue 8.1m; hunter 8.1m; archer 9.3m; witch 9.4m; alchemist 8.4m | NO |
| chapter-growth | Every class chapter duration grows 1.3–2.0x | warrior ch2 38.69x; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch2 51.43x; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch2 38.72x; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch2 33.07x; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch2 26.42x; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch2 29.27x; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch2 31.11x; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached | warrior ch2 0.66x; warrior ch3 0.89x; warrior ch4 301.52x; warrior ch5 0.00x; guardian ch2 1.01x; guardian ch3 0.85x; guardian ch4 269.64x; guardian ch5 0.00x; rogue ch2 0.66x; rogue ch3 0.87x; rogue ch4 304.15x; rogue ch5 0.00x; hunter ch2 0.65x; hunter ch3 0.93x; hunter ch4 290.15x; hunter ch5 0.00x; archer ch2 0.61x; archer ch3 0.93x; archer ch4 270.89x; archer ch5 0.00x; witch ch2 0.62x; witch ch3 0.92x; witch ch4 264.07x; witch ch5 0.00x; alchemist ch2 0.69x; alchemist ch3 0.93x; alchemist ch4 263.45x; alchemist ch5 0.00x | NO |
| class-spread | Every cumulative class median within ±15% of center AND chapter range / center ≥3% | ch1 range 59.3%; ch2 range 0.0%; ch3 range not reached; ch4 range not reached; ch5 range not reached; warrior ch1 -14.2%; guardian ch1 -35.0%; rogue ch1 -14.2%; hunter ch1 0.0%; archer ch1 24.3%; witch ch1 12.5%; alchemist ch1 6.1%; warrior ch2 0.0%; guardian ch2 0.0%; rogue ch2 0.0%; hunter ch2 0.0%; archer ch2 0.0%; witch ch2 0.0%; alchemist ch2 0.0%; warrior ch3 not reached; guardian ch3 not reached; rogue ch3 not reached; hunter ch3 not reached; archer ch3 not reached; witch ch3 not reached; alchemist ch3 not reached; warrior ch4 not reached; guardian ch4 not reached; rogue ch4 not reached; hunter ch4 not reached; archer ch4 not reached; witch ch4 not reached; alchemist ch4 not reached; warrior ch5 not reached; guardian ch5 not reached; rogue ch5 not reached; hunter ch5 not reached; archer ch5 not reached; witch ch5 not reached; alchemist ch5 not reached | ch1 range 40.6%; ch2 range 21.3%; ch3 range 16.5%; ch4 range 0.0%; ch5 range 0.1%; warrior ch1 -1.8%; guardian ch1 -24.6%; rogue ch1 0.0%; hunter ch1 0.0%; archer ch1 13.7%; witch ch1 16.0%; alchemist ch1 2.9%; warrior ch2 -2.2%; guardian ch2 -8.5%; rogue ch2 0.0%; hunter ch2 -0.6%; archer ch2 10.3%; witch ch2 12.8%; alchemist ch2 5.1%; warrior ch3 -2.4%; guardian ch3 -3.6%; rogue ch3 -0.9%; hunter ch3 0.0%; archer ch3 10.0%; witch ch3 13.0%; alchemist ch3 7.1%; warrior ch4 0.0%; guardian ch4 0.0%; rogue ch4 0.0%; hunter ch4 0.0%; archer ch4 0.0%; witch ch4 0.0%; alchemist ch4 0.0%; warrior ch5 -0.0%; guardian ch5 -0.0%; rogue ch5 0.0%; hunter ch5 -0.0%; archer ch5 0.0%; witch ch5 0.0%; alchemist ch5 0.0% | NO |
| chapter-bounds | Every chapter duration median 10–360 minutes | warrior ch1 36.3m; warrior ch2 1403.7m; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch1 27.5m; guardian ch2 1412.5m; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch1 36.3m; rogue ch2 1403.8m; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch1 42.3m; hunter ch2 1397.8m; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch1 52.5m; archer ch2 1387.5m; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch1 47.6m; witch ch2 1392.5m; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch1 44.9m; alchemist ch2 1395.2m; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached | warrior ch1 8.0m; warrior ch2 5.3m; warrior ch3 4.7m; warrior ch4 1422.2m; warrior ch5 2.4m; guardian ch1 6.1m; guardian ch2 6.2m; guardian ch3 5.3m; guardian ch4 1422.4m; guardian ch5 2.7m; rogue ch1 8.1m; rogue ch2 5.4m; rogue ch3 4.7m; rogue ch4 1421.9m; rogue ch5 2.7m; hunter ch1 8.1m; hunter ch2 5.3m; hunter ch3 4.9m; hunter ch4 1421.7m; hunter ch5 2.5m; archer ch1 9.3m; archer ch2 5.6m; archer ch3 5.2m; archer ch4 1419.9m; archer ch5 2.9m; witch ch1 9.4m; witch ch2 5.8m; witch ch3 5.4m; witch ch4 1419.3m; witch ch5 3.3m; alchemist ch1 8.4m; alchemist ch2 5.8m; alchemist ch3 5.4m; alchemist ch4 1420.4m; alchemist ch5 3.1m | NO |
| never-stuck | No six-hour period without level, round, boss win or power gain | 0/35 runs stuck | 0/140 runs stuck | yes |
| craft-salvage-loss | Every recipe returns less weighted salvage value than cost | rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 | rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 | yes |
| walk-share | Every class at ch1 r1 and ch3 r5: walking ≤50% at median observed entry level | warrior ch1 r1 L1.0: 44.6%; warrior ch3 r5 L60.0: 80.6%; guardian ch1 r1 L1.0: 34.2%; guardian ch3 r5 L60.0: 65.8%; rogue ch1 r1 L1.0: 34.5%; rogue ch3 r5 L60.0: 65.1%; hunter ch1 r1 L1.0: 41.7%; hunter ch3 r5 L60.0: 76.9%; archer ch1 r1 L1.0: 35.1%; archer ch3 r5 L60.0: 66.7%; witch ch1 r1 L1.0: 29.0%; witch ch3 r5 L60.0: 54.1%; alchemist ch1 r1 L1.0: 33.2%; alchemist ch3 r5 L60.0: 58.5% | warrior ch1 r1 L1.0: 21.1%; warrior ch3 r5 L40.0: 38.7%; guardian ch1 r1 L1.0: 19.9%; guardian ch3 r5 L39.0: 36.2%; rogue ch1 r1 L1.0: 22.2%; rogue ch3 r5 L40.0: 36.9%; hunter ch1 r1 L1.0: 21.7%; hunter ch3 r5 L40.0: 36.8%; archer ch1 r1 L1.0: 21.5%; archer ch3 r5 L40.0: 32.7%; witch ch1 r1 L1.0: 19.8%; witch ch3 r5 L40.0: 30.7%; alchemist ch1 r1 L1.0: 20.2%; alchemist ch3 r5 L40.0: 35.2% | yes |
| boss-check | Every chapter/class first-attempt wins 40–90%; median boss duration ≤180s | warrior ch1 first win 0.0%, median 24.00s; warrior ch2 first win 100.0%, median 8.20s; warrior ch3 first win 0.0%, median not reached (missing attempts); warrior ch4 first win 0.0%, median not reached (missing attempts); warrior ch5 first win 0.0%, median not reached (missing attempts); guardian ch1 first win 0.0%, median 30.00s; guardian ch2 first win 100.0%, median 9.77s; guardian ch3 first win 0.0%, median not reached (missing attempts); guardian ch4 first win 0.0%, median not reached (missing attempts); guardian ch5 first win 0.0%, median not reached (missing attempts); rogue ch1 first win 0.0%, median 21.00s; rogue ch2 first win 100.0%, median 8.61s; rogue ch3 first win 0.0%, median not reached (missing attempts); rogue ch4 first win 0.0%, median not reached (missing attempts); rogue ch5 first win 0.0%, median not reached (missing attempts); hunter ch1 first win 0.0%, median 24.00s; hunter ch2 first win 100.0%, median 7.83s; hunter ch3 first win 0.0%, median not reached (missing attempts); hunter ch4 first win 0.0%, median not reached (missing attempts); hunter ch5 first win 0.0%, median not reached (missing attempts); archer ch1 first win 0.0%, median 24.00s; archer ch2 first win 100.0%, median 8.62s; archer ch3 first win 0.0%, median not reached (missing attempts); archer ch4 first win 0.0%, median not reached (missing attempts); archer ch5 first win 0.0%, median not reached (missing attempts); witch ch1 first win 0.0%, median 21.00s; witch ch2 first win 100.0%, median 9.27s; witch ch3 first win 0.0%, median not reached (missing attempts); witch ch4 first win 0.0%, median not reached (missing attempts); witch ch5 first win 0.0%, median not reached (missing attempts); alchemist ch1 first win 0.0%, median 24.00s; alchemist ch2 first win 100.0%, median 9.16s; alchemist ch3 first win 0.0%, median not reached (missing attempts); alchemist ch4 first win 0.0%, median not reached (missing attempts); alchemist ch5 first win 0.0%, median not reached (missing attempts) | warrior ch1 first win 0.0%, median 78.00s; warrior ch2 first win 100.0%, median 67.34s; warrior ch3 first win 100.0%, median 53.16s; warrior ch4 first win 100.0%, median 11.48s; warrior ch5 first win 100.0%, median 21.27s; guardian ch1 first win 0.0%, median 98.66s; guardian ch2 first win 100.0%, median 71.91s; guardian ch3 first win 100.0%, median 53.95s; guardian ch4 first win 100.0%, median 12.14s; guardian ch5 first win 100.0%, median 22.71s; rogue ch1 first win 0.0%, median 72.00s; rogue ch2 first win 100.0%, median 63.70s; rogue ch3 first win 100.0%, median 47.21s; rogue ch4 first win 100.0%, median 11.67s; rogue ch5 first win 100.0%, median 21.46s; hunter ch1 first win 0.0%, median 73.31s; hunter ch2 first win 100.0%, median 66.39s; hunter ch3 first win 100.0%, median 53.36s; hunter ch4 first win 100.0%, median 11.26s; hunter ch5 first win 100.0%, median 22.36s; archer ch1 first win 0.0%, median 72.00s; archer ch2 first win 100.0%, median 66.87s; archer ch3 first win 100.0%, median 52.18s; archer ch4 first win 100.0%, median 12.68s; archer ch5 first win 100.0%, median 23.16s; witch ch1 first win 0.0%, median 66.00s; witch ch2 first win 100.0%, median 68.95s; witch ch3 first win 100.0%, median 53.82s; witch ch4 first win 100.0%, median 14.07s; witch ch5 first win 100.0%, median 25.85s; alchemist ch1 first win 0.0%, median 73.51s; alchemist ch2 first win 100.0%, median 68.01s; alchemist ch3 first win 100.0%, median 57.06s; alchemist ch4 first win 100.0%, median 12.62s; alchemist ch5 first win 100.0%, median 23.24s | NO |
| guardrails | Each proposed numeric leaf 0.33–3x current; walk ≤2000ms; boss ≤180s; daily keys ≤3 | All numeric leaves within 0.33–3x; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 | All numeric leaves within 0.33–3x; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 | yes |

## Scenario table — scenario, needs a user decision

S-A gives five daily keys (the material cap); it deliberately FAILS the unchanged dailyKeys ≤3 guardrail. S-B adds one key to each first-clear chest, none on repeats; it requires a content change in chests.ts, or a coordinated applyBossResult + SQL v2_boss_fight rule change. Neither is part of PROPOSED_V2_OVERRIDES. Each scenario uses its separately searched config below.

| target | proposal (20 seeds) | S-A (5 seeds) | S-B (5 seeds) |
| --- | --- | --- | --- |
| first-boss | NO | yes | yes |
| chapter-growth | NO | NO | NO |
| class-spread | NO | NO | NO |
| chapter-bounds | NO | NO | NO |
| never-stuck | yes | yes | yes |
| craft-salvage-loss | yes | yes | yes |
| walk-share | yes | yes | yes |
| boss-check | NO | NO | NO |
| guardrails | yes | NO | yes |

### S-A: scenario, needs a user decision

Config overrides (S-A additionally sets dailyKeys=5):

```json
{
  "cat": {
    "baseAtk": 14,
    "baseHp": 300,
    "baseDef": 5,
    "levelGrowth": 0.06,
    "xpGrowth": 1.12
  },
  "monster": {
    "hpBase": 90,
    "hpGrowth": 1.06,
    "atkBase": 8,
    "atkGrowth": 1.06,
    "xpBase": 18,
    "xpGrowth": 1.11
  },
  "idle": {
    "dailyKeys": 5,
    "walkTimeMs": 1000,
    "gearDropChance": 0.0067
  },
  "boss": {
    "maxMs": 180000,
    "attackIntervalMs": 4500,
    "bigEveryMs": 6000,
    "bigMultiplier": 1.5
  }
}
```

| target | result | ok? |
| --- | --- | --- |
| first-boss | warrior 12.2m; guardian 10.4m; rogue 12.3m; hunter 13.2m; archer 14.4m; witch 14.7m; alchemist 12.7m | yes |
| chapter-growth | warrior ch2 0.54x; warrior ch3 0.99x; warrior ch4 1.00x; warrior ch5 0.97x; guardian ch2 0.70x; guardian ch3 0.97x; guardian ch4 0.96x; guardian ch5 0.99x; rogue ch2 0.54x; rogue ch3 0.96x; rogue ch4 0.96x; rogue ch5 0.99x; hunter ch2 0.47x; hunter ch3 1.09x; hunter ch4 1.03x; hunter ch5 0.93x; archer ch2 0.54x; archer ch3 0.86x; archer ch4 1.04x; archer ch5 1.09x; witch ch2 0.60x; witch ch3 0.79x; witch ch4 1.04x; witch ch5 1.03x; alchemist ch2 0.55x; alchemist ch3 1.03x; alchemist ch4 0.96x; alchemist ch5 0.99x | NO |
| class-spread | ch1 range 34.0%; ch2 range 35.0%; ch3 range 25.0%; ch4 range 21.2%; ch5 range 21.6%; warrior ch1 -3.4%; guardian ch1 -18.1%; rogue ch1 -2.8%; hunter ch1 4.5%; archer ch1 13.7%; witch ch1 15.9%; alchemist ch1 0.0%; warrior ch2 -2.1%; guardian ch2 -9.8%; rogue ch2 -1.8%; hunter ch2 0.0%; archer ch2 14.7%; witch ch2 25.3%; alchemist ch2 4.6%; warrior ch3 -1.9%; guardian ch3 -6.0%; rogue ch3 -2.2%; hunter ch3 0.0%; archer ch3 11.2%; witch ch3 19.0%; alchemist ch3 4.8%; warrior ch4 -2.3%; guardian ch4 -5.3%; rogue ch4 -4.6%; hunter ch4 0.0%; archer ch4 9.4%; witch ch4 16.0%; alchemist ch4 3.8%; warrior ch5 -2.0%; guardian ch5 -3.4%; rogue ch5 -4.9%; hunter ch5 0.0%; archer ch5 10.0%; witch ch5 16.7%; alchemist ch5 4.1% | NO |
| chapter-bounds | warrior ch1 12.2m; warrior ch2 6.7m; warrior ch3 6.6m; warrior ch4 6.6m; warrior ch5 6.4m; guardian ch1 10.4m; guardian ch2 7.3m; guardian ch3 7.0m; guardian ch4 6.8m; guardian ch5 6.7m; rogue ch1 12.3m; rogue ch2 6.6m; rogue ch3 6.3m; rogue ch4 6.1m; rogue ch5 6.0m; hunter ch1 13.2m; hunter ch2 6.2m; hunter ch3 6.7m; hunter ch4 6.9m; hunter ch5 6.4m; archer ch1 14.4m; archer ch2 7.7m; archer ch3 6.6m; archer ch4 6.9m; archer ch5 7.5m; witch ch1 14.7m; witch ch2 8.8m; witch ch3 7.0m; witch ch4 7.3m; witch ch5 7.5m; alchemist ch1 12.7m; alchemist ch2 7.0m; alchemist ch3 7.2m; alchemist ch4 6.9m; alchemist ch5 6.8m | NO |
| never-stuck | 0/35 runs stuck | yes |
| craft-salvage-loss | rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 | yes |
| walk-share | warrior ch1 r1 L1.0: 21.1%; warrior ch3 r5 L35.0: 27.6%; guardian ch1 r1 L1.0: 17.5%; guardian ch3 r5 L35.0: 25.0%; rogue ch1 r1 L1.0: 17.5%; rogue ch3 r5 L35.0: 26.6%; hunter ch1 r1 L1.0: 19.4%; hunter ch3 r5 L36.0: 26.7%; archer ch1 r1 L1.0: 18.0%; archer ch3 r5 L36.0: 26.1%; witch ch1 r1 L1.0: 17.1%; witch ch3 r5 L37.0: 25.3%; alchemist ch1 r1 L1.0: 17.8%; alchemist ch3 r5 L35.0: 24.5% | yes |
| boss-check | warrior ch1 first win 0.0%, median 81.00s; warrior ch2 first win 100.0%, median 94.48s; warrior ch3 first win 100.0%, median 91.15s; warrior ch4 first win 100.0%, median 86.61s; warrior ch5 first win 100.0%, median 81.81s; guardian ch1 first win 0.0%, median 108.16s; guardian ch2 first win 100.0%, median 101.87s; guardian ch3 first win 100.0%, median 97.78s; guardian ch4 first win 100.0%, median 89.23s; guardian ch5 first win 100.0%, median 88.71s; rogue ch1 first win 0.0%, median 66.00s; rogue ch2 first win 60.0%, median 85.50s; rogue ch3 first win 100.0%, median 81.89s; rogue ch4 first win 100.0%, median 75.28s; rogue ch5 first win 100.0%, median 61.76s; hunter ch1 first win 0.0%, median 76.50s; hunter ch2 first win 80.0%, median 93.35s; hunter ch3 first win 100.0%, median 92.46s; hunter ch4 first win 100.0%, median 89.15s; hunter ch5 first win 100.0%, median 79.94s; archer ch1 first win 0.0%, median 66.00s; archer ch2 first win 20.0%, median 85.50s; archer ch3 first win 80.0%, median 91.96s; archer ch4 first win 80.0%, median 94.38s; archer ch5 first win 100.0%, median 95.61s; witch ch1 first win 0.0%, median 67.50s; witch ch2 first win 20.0%, median 85.50s; witch ch3 first win 80.0%, median 90.76s; witch ch4 first win 80.0%, median 100.53s; witch ch5 first win 100.0%, median 100.11s; alchemist ch1 first win 0.0%, median 72.00s; alchemist ch2 first win 80.0%, median 95.56s; alchemist ch3 first win 80.0%, median 98.06s; alchemist ch4 first win 100.0%, median 90.29s; alchemist ch5 first win 100.0%, median 86.52s | NO |
| guardrails | idle.dailyKeys: 5 outside 0.33–3x current 1; idle.dailyKeys: 5 > 3 | NO |

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 12.2 / 12.2 / 12.2 | 18.6 / 18.9 / 18.9 | 25.4 / 25.5 / 25.5 | 31.8 / 32.1 / 32.3 | 38.2 / 38.5 / 38.8 | 9.22 | 25.47 |
| guardian | 10.4 / 10.4 / 10.4 | 16.9 / 17.4 / 17.6 | 23.9 / 24.4 / 24.6 | 30.5 / 31.2 / 31.6 | 37.0 / 38.0 / 38.3 | 9.37 | 24 |
| rogue | 12.3 / 12.3 / 12.3 | 18.8 / 18.9 / 19.5 | 25.3 / 25.4 / 25.6 | 31.3 / 31.4 / 31.6 | 36.4 / 37.4 / 37.8 | 9.3 | 25.38 |
| hunter | 13.2 / 13.2 / 13.2 | 19.0 / 19.3 / 19.6 | 25.6 / 26.0 / 26.6 | 32.4 / 32.9 / 33.4 | 39.3 / 39.3 / 39.7 | 9.22 | 25.97 |
| archer | 14.4 / 14.4 / 14.4 | 21.9 / 22.1 / 22.2 | 28.6 / 28.9 / 29.0 | 35.0 / 36.0 / 36.9 | 42.3 / 43.3 / 43.5 | 9.38 | 28 |
| witch | 14.7 / 14.7 / 14.7 | 23.5 / 24.1 / 24.4 | 30.4 / 30.9 / 30.9 | 37.5 / 38.1 / 39.3 | 45.2 / 45.9 / 46.8 | 9.67 | 30 |
| alchemist | 12.7 / 12.7 / 12.7 | 19.6 / 20.1 / 20.1 | 27.1 / 27.2 / 27.5 | 34.1 / 34.1 / 34.4 | 40.7 / 41.0 / 41.2 | 9.65 | 27.12 |

Key waits and levels (wait; first attempt level / all-attempt median level):

| class | ch1 | ch2 | ch3 | ch4 | ch5 | reached max level before ch5 win |
| --- | --- | --- | --- | --- | --- | --- |
| warrior | 0m; L16 / L21 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| guardian | 0m; L16 / L19 | 0m; L31 / L31 | 0m; L40 / L40 | 0m; L50 / L50 | 0m; L59 / L59 | 1/5 |
| rogue | 0m; L16 / L21 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| hunter | 0m; L16 / L20 | 0m; L32 / L32.5 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| archer | 0m; L16 / L21 | 0m; L33 / L33 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L60 / L60 | 3/5 |
| witch | 0m; L16 / L22 | 0m; L33 / L34 | 0m; L42 / L42 | 0m; L50 / L50 | 0m; L60 / L60 | 3/5 |
| alchemist | 0m; L16 / L20 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 1/5 |

| class | chapter | fights | losses | first-attempt wins / seeds | median fight seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
| warrior | 1 | 35 | 30 | 0 / 5 | 81 |
| warrior | 2 | 5 | 0 | 5 / 5 | 94.48 |
| warrior | 3 | 5 | 0 | 5 / 5 | 91.15 |
| warrior | 4 | 5 | 0 | 5 / 5 | 86.61 |
| warrior | 5 | 5 | 0 | 5 / 5 | 81.81 |
| guardian | 1 | 24 | 19 | 0 / 5 | 108.16 |
| guardian | 2 | 5 | 0 | 5 / 5 | 101.87 |
| guardian | 3 | 5 | 0 | 5 / 5 | 97.78 |
| guardian | 4 | 5 | 0 | 5 / 5 | 89.23 |
| guardian | 5 | 5 | 0 | 5 / 5 | 88.71 |
| rogue | 1 | 35 | 30 | 0 / 5 | 66 |
| rogue | 2 | 7 | 2 | 3 / 5 | 85.5 |
| rogue | 3 | 5 | 0 | 5 / 5 | 81.89 |
| rogue | 4 | 5 | 0 | 5 / 5 | 75.28 |
| rogue | 5 | 5 | 0 | 5 / 5 | 61.76 |
| hunter | 1 | 39 | 34 | 0 / 5 | 76.5 |
| hunter | 2 | 6 | 1 | 4 / 5 | 93.35 |
| hunter | 3 | 5 | 0 | 5 / 5 | 92.46 |
| hunter | 4 | 5 | 0 | 5 / 5 | 89.15 |
| hunter | 5 | 5 | 0 | 5 / 5 | 79.94 |
| archer | 1 | 44 | 39 | 0 / 5 | 66 |
| archer | 2 | 10 | 5 | 1 / 5 | 85.5 |
| archer | 3 | 6 | 1 | 4 / 5 | 91.96 |
| archer | 4 | 6 | 1 | 4 / 5 | 94.38 |
| archer | 5 | 5 | 0 | 5 / 5 | 95.61 |
| witch | 1 | 46 | 41 | 0 / 5 | 67.5 |
| witch | 2 | 15 | 10 | 1 / 5 | 85.5 |
| witch | 3 | 6 | 1 | 4 / 5 | 90.76 |
| witch | 4 | 6 | 1 | 4 / 5 | 100.53 |
| witch | 5 | 5 | 0 | 5 / 5 | 100.11 |
| alchemist | 1 | 36 | 31 | 0 / 5 | 72 |
| alchemist | 2 | 6 | 1 | 4 / 5 | 95.56 |
| alchemist | 3 | 6 | 1 | 4 / 5 | 98.06 |
| alchemist | 4 | 5 | 0 | 5 / 5 | 90.29 |
| alchemist | 5 | 5 | 0 | 5 / 5 | 86.52 |

Entry-level monster time-to-kill:

| class | ch1 r1 | ch3 r1 | ch3 r5 | ch5 r1 |
| --- | ---: | ---: | ---: | ---: |
| warrior | 3740 ms (L1) | 2462.67 ms (L32) | 2623.45 ms (L35) | 2577.29 ms (L50) |
| guardian | 4720 ms (L1) | 3007.03 ms (L31) | 3001.91 ms (L35) | 2737.86 ms (L50) |
| rogue | 4700 ms (L1) | 2410.74 ms (L32) | 2410.74 ms (L35) | 2659.13 ms (L50) |
| hunter | 4150 ms (L1) | 2722.21 ms (L33) | 2745.66 ms (L36) | 2456.63 ms (L50) |
| archer | 4550 ms (L1) | 2549.55 ms (L34) | 2512.65 ms (L36) | 3101.63 ms (L50) |
| witch | 4850 ms (L1) | 2307.46 ms (L35) | 2955.69 ms (L37) | 3360.91 ms (L50) |
| alchemist | 4610 ms (L1) | 3078.37 ms (L32) | 3078.37 ms (L35) | 2907.73 ms (L50) |

| class | chapter | entry level | entry monster TTK, seconds | median boss duration, seconds | median boss losses/run |
| --- | --- | --- | --- | --- | --- |
| warrior | 1 | 1 | 3.74 | 81 | 6 |
| warrior | 3 | 32 | 2.46 | 91.15 | 0 |
| warrior | 5 | 50 | 2.58 | 81.81 | 0 |
| guardian | 1 | 1 | 4.72 | 108.16 | 4 |
| guardian | 3 | 31 | 3.01 | 97.78 | 0 |
| guardian | 5 | 50 | 2.74 | 88.71 | 0 |
| rogue | 1 | 1 | 4.7 | 66 | 6 |
| rogue | 3 | 32 | 2.41 | 81.89 | 0 |
| rogue | 5 | 50 | 2.66 | 61.76 | 0 |
| hunter | 1 | 1 | 4.15 | 76.5 | 7 |
| hunter | 3 | 33 | 2.72 | 92.46 | 0 |
| hunter | 5 | 50 | 2.46 | 79.94 | 0 |
| archer | 1 | 1 | 4.55 | 66 | 8 |
| archer | 3 | 34 | 2.55 | 91.96 | 0 |
| archer | 5 | 50 | 3.1 | 95.61 | 0 |
| witch | 1 | 1 | 4.85 | 67.5 | 8 |
| witch | 3 | 35 | 2.31 | 90.76 | 0 |
| witch | 5 | 50 | 3.36 | 100.11 | 0 |
| alchemist | 1 | 1 | 4.61 | 72 | 6 |
| alchemist | 3 | 32 | 3.08 | 98.06 | 0 |
| alchemist | 5 | 50 | 2.91 | 86.52 | 0 |

How classes differ: Warrior attacks every 1s with cleave; Guardian every 1.4s with 1.3× HP/DEF and a 500ms bonk delay; Rogue has 0.8s twin strikes, 25% crit and 10% dodge; Hunter has a 1.1s mark (+20% damage taken and material find); Archer has a 0.9s volley cycle; Witch has 1.6s bolts, splash and burn; Alchemist has 1.3s poison flasks and heal-on-kill. Ch1: fastest guardian (10.37m), slowest witch (14.67m); Ch2: fastest guardian (17.38m), slowest witch (24.13m); Ch3: fastest guardian (24.4m), slowest witch (30.9m); Ch4: fastest guardian (31.17m), slowest witch (38.15m); Ch5: fastest rogue (37.42m), slowest witch (45.92m). Boss losses, most first: witch 53, archer 46, hunter 35, alchemist 33, rogue 32, warrior 30, guardian 19. These observations retain the content-defined attack intervals, passives, HP, DEF and dodge differences; timing spread alone does not validate combat feel.

### S-B: scenario, needs a user decision

Config overrides (S-A additionally sets dailyKeys=5):

```json
{
  "cat": {
    "baseAtk": 14,
    "baseHp": 300,
    "baseDef": 5,
    "levelGrowth": 0.06,
    "xpGrowth": 1.12
  },
  "monster": {
    "hpBase": 90,
    "hpGrowth": 1.06,
    "atkBase": 8,
    "atkGrowth": 1.06,
    "xpBase": 18,
    "xpGrowth": 1.11
  },
  "idle": {
    "dailyKeys": 3,
    "walkTimeMs": 1000,
    "gearDropChance": 0.0067
  },
  "boss": {
    "maxMs": 180000,
    "attackIntervalMs": 4500,
    "bigEveryMs": 6000,
    "bigMultiplier": 1.5
  }
}
```

| target | result | ok? |
| --- | --- | --- |
| first-boss | warrior 12.2m; guardian 10.4m; rogue 12.3m; hunter 13.2m; archer 14.4m; witch 14.7m; alchemist 12.7m | yes |
| chapter-growth | warrior ch2 0.54x; warrior ch3 0.99x; warrior ch4 1.00x; warrior ch5 0.97x; guardian ch2 0.70x; guardian ch3 0.97x; guardian ch4 0.96x; guardian ch5 0.99x; rogue ch2 0.54x; rogue ch3 0.96x; rogue ch4 0.96x; rogue ch5 0.99x; hunter ch2 0.47x; hunter ch3 1.09x; hunter ch4 1.03x; hunter ch5 0.93x; archer ch2 0.54x; archer ch3 0.86x; archer ch4 1.04x; archer ch5 1.09x; witch ch2 0.60x; witch ch3 0.79x; witch ch4 1.04x; witch ch5 1.03x; alchemist ch2 0.55x; alchemist ch3 1.03x; alchemist ch4 0.96x; alchemist ch5 0.99x | NO |
| class-spread | ch1 range 34.0%; ch2 range 35.0%; ch3 range 25.0%; ch4 range 21.2%; ch5 range 21.6%; warrior ch1 -3.4%; guardian ch1 -18.1%; rogue ch1 -2.8%; hunter ch1 4.5%; archer ch1 13.7%; witch ch1 15.9%; alchemist ch1 0.0%; warrior ch2 -2.1%; guardian ch2 -9.8%; rogue ch2 -1.8%; hunter ch2 0.0%; archer ch2 14.7%; witch ch2 25.3%; alchemist ch2 4.6%; warrior ch3 -1.9%; guardian ch3 -6.0%; rogue ch3 -2.2%; hunter ch3 0.0%; archer ch3 11.2%; witch ch3 19.0%; alchemist ch3 4.8%; warrior ch4 -2.3%; guardian ch4 -5.3%; rogue ch4 -4.6%; hunter ch4 0.0%; archer ch4 9.4%; witch ch4 16.0%; alchemist ch4 3.8%; warrior ch5 -2.0%; guardian ch5 -3.4%; rogue ch5 -4.9%; hunter ch5 0.0%; archer ch5 10.0%; witch ch5 16.7%; alchemist ch5 4.1% | NO |
| chapter-bounds | warrior ch1 12.2m; warrior ch2 6.7m; warrior ch3 6.6m; warrior ch4 6.6m; warrior ch5 6.4m; guardian ch1 10.4m; guardian ch2 7.3m; guardian ch3 7.0m; guardian ch4 6.8m; guardian ch5 6.7m; rogue ch1 12.3m; rogue ch2 6.6m; rogue ch3 6.3m; rogue ch4 6.1m; rogue ch5 6.0m; hunter ch1 13.2m; hunter ch2 6.2m; hunter ch3 6.7m; hunter ch4 6.9m; hunter ch5 6.4m; archer ch1 14.4m; archer ch2 7.7m; archer ch3 6.6m; archer ch4 6.9m; archer ch5 7.5m; witch ch1 14.7m; witch ch2 8.8m; witch ch3 7.0m; witch ch4 7.3m; witch ch5 7.5m; alchemist ch1 12.7m; alchemist ch2 7.0m; alchemist ch3 7.2m; alchemist ch4 6.9m; alchemist ch5 6.8m | NO |
| never-stuck | 0/35 runs stuck | yes |
| craft-salvage-loss | rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 | yes |
| walk-share | warrior ch1 r1 L1.0: 21.1%; warrior ch3 r5 L35.0: 27.6%; guardian ch1 r1 L1.0: 17.5%; guardian ch3 r5 L35.0: 25.0%; rogue ch1 r1 L1.0: 17.5%; rogue ch3 r5 L35.0: 26.6%; hunter ch1 r1 L1.0: 19.4%; hunter ch3 r5 L36.0: 26.7%; archer ch1 r1 L1.0: 18.0%; archer ch3 r5 L36.0: 26.1%; witch ch1 r1 L1.0: 17.1%; witch ch3 r5 L37.0: 25.3%; alchemist ch1 r1 L1.0: 17.8%; alchemist ch3 r5 L35.0: 24.5% | yes |
| boss-check | warrior ch1 first win 0.0%, median 81.00s; warrior ch2 first win 100.0%, median 94.48s; warrior ch3 first win 100.0%, median 91.15s; warrior ch4 first win 100.0%, median 86.61s; warrior ch5 first win 100.0%, median 81.81s; guardian ch1 first win 0.0%, median 108.16s; guardian ch2 first win 100.0%, median 101.87s; guardian ch3 first win 100.0%, median 97.78s; guardian ch4 first win 100.0%, median 89.23s; guardian ch5 first win 100.0%, median 88.71s; rogue ch1 first win 0.0%, median 66.00s; rogue ch2 first win 60.0%, median 85.50s; rogue ch3 first win 100.0%, median 81.89s; rogue ch4 first win 100.0%, median 75.28s; rogue ch5 first win 100.0%, median 61.76s; hunter ch1 first win 0.0%, median 76.50s; hunter ch2 first win 80.0%, median 93.35s; hunter ch3 first win 100.0%, median 92.46s; hunter ch4 first win 100.0%, median 89.15s; hunter ch5 first win 100.0%, median 79.94s; archer ch1 first win 0.0%, median 66.00s; archer ch2 first win 20.0%, median 85.50s; archer ch3 first win 80.0%, median 91.96s; archer ch4 first win 80.0%, median 94.38s; archer ch5 first win 100.0%, median 95.61s; witch ch1 first win 0.0%, median 67.50s; witch ch2 first win 20.0%, median 85.50s; witch ch3 first win 80.0%, median 90.76s; witch ch4 first win 80.0%, median 100.53s; witch ch5 first win 100.0%, median 100.11s; alchemist ch1 first win 0.0%, median 72.00s; alchemist ch2 first win 80.0%, median 95.56s; alchemist ch3 first win 80.0%, median 98.06s; alchemist ch4 first win 100.0%, median 90.29s; alchemist ch5 first win 100.0%, median 86.52s | NO |
| guardrails | All numeric leaves within 0.33–3x; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 | yes |

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 12.2 / 12.2 / 12.2 | 18.6 / 18.9 / 18.9 | 25.4 / 25.5 / 25.5 | 31.8 / 32.1 / 32.3 | 38.2 / 38.5 / 38.8 | 9.22 | 25.47 |
| guardian | 10.4 / 10.4 / 10.4 | 16.9 / 17.4 / 17.6 | 23.9 / 24.4 / 24.6 | 30.5 / 31.2 / 31.6 | 37.0 / 38.0 / 38.3 | 9.37 | 24 |
| rogue | 12.3 / 12.3 / 12.3 | 18.8 / 18.9 / 19.5 | 25.3 / 25.4 / 25.6 | 31.3 / 31.4 / 31.6 | 36.4 / 37.4 / 37.8 | 9.3 | 25.38 |
| hunter | 13.2 / 13.2 / 13.2 | 19.0 / 19.3 / 19.6 | 25.6 / 26.0 / 26.6 | 32.4 / 32.9 / 33.4 | 39.3 / 39.3 / 39.7 | 9.22 | 25.97 |
| archer | 14.4 / 14.4 / 14.4 | 21.9 / 22.1 / 22.2 | 28.6 / 28.9 / 29.0 | 35.0 / 36.0 / 36.9 | 42.3 / 43.3 / 43.5 | 9.38 | 28 |
| witch | 14.7 / 14.7 / 14.7 | 23.5 / 24.1 / 24.4 | 30.4 / 30.9 / 30.9 | 37.5 / 38.1 / 39.3 | 45.2 / 45.9 / 46.8 | 9.67 | 30 |
| alchemist | 12.7 / 12.7 / 12.7 | 19.6 / 20.1 / 20.1 | 27.1 / 27.2 / 27.5 | 34.1 / 34.1 / 34.4 | 40.7 / 41.0 / 41.2 | 9.65 | 27.12 |

Key waits and levels (wait; first attempt level / all-attempt median level):

| class | ch1 | ch2 | ch3 | ch4 | ch5 | reached max level before ch5 win |
| --- | --- | --- | --- | --- | --- | --- |
| warrior | 0m; L16 / L21 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| guardian | 0m; L16 / L19 | 0m; L31 / L31 | 0m; L40 / L40 | 0m; L50 / L50 | 0m; L59 / L59 | 1/5 |
| rogue | 0m; L16 / L21 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| hunter | 0m; L16 / L20 | 0m; L32 / L32.5 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| archer | 0m; L16 / L21 | 0m; L33 / L33 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L60 / L60 | 3/5 |
| witch | 0m; L16 / L22 | 0m; L33 / L34 | 0m; L42 / L42 | 0m; L50 / L50 | 0m; L60 / L60 | 3/5 |
| alchemist | 0m; L16 / L20 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 1/5 |

| class | chapter | fights | losses | first-attempt wins / seeds | median fight seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
| warrior | 1 | 35 | 30 | 0 / 5 | 81 |
| warrior | 2 | 5 | 0 | 5 / 5 | 94.48 |
| warrior | 3 | 5 | 0 | 5 / 5 | 91.15 |
| warrior | 4 | 5 | 0 | 5 / 5 | 86.61 |
| warrior | 5 | 5 | 0 | 5 / 5 | 81.81 |
| guardian | 1 | 24 | 19 | 0 / 5 | 108.16 |
| guardian | 2 | 5 | 0 | 5 / 5 | 101.87 |
| guardian | 3 | 5 | 0 | 5 / 5 | 97.78 |
| guardian | 4 | 5 | 0 | 5 / 5 | 89.23 |
| guardian | 5 | 5 | 0 | 5 / 5 | 88.71 |
| rogue | 1 | 35 | 30 | 0 / 5 | 66 |
| rogue | 2 | 7 | 2 | 3 / 5 | 85.5 |
| rogue | 3 | 5 | 0 | 5 / 5 | 81.89 |
| rogue | 4 | 5 | 0 | 5 / 5 | 75.28 |
| rogue | 5 | 5 | 0 | 5 / 5 | 61.76 |
| hunter | 1 | 39 | 34 | 0 / 5 | 76.5 |
| hunter | 2 | 6 | 1 | 4 / 5 | 93.35 |
| hunter | 3 | 5 | 0 | 5 / 5 | 92.46 |
| hunter | 4 | 5 | 0 | 5 / 5 | 89.15 |
| hunter | 5 | 5 | 0 | 5 / 5 | 79.94 |
| archer | 1 | 44 | 39 | 0 / 5 | 66 |
| archer | 2 | 10 | 5 | 1 / 5 | 85.5 |
| archer | 3 | 6 | 1 | 4 / 5 | 91.96 |
| archer | 4 | 6 | 1 | 4 / 5 | 94.38 |
| archer | 5 | 5 | 0 | 5 / 5 | 95.61 |
| witch | 1 | 46 | 41 | 0 / 5 | 67.5 |
| witch | 2 | 15 | 10 | 1 / 5 | 85.5 |
| witch | 3 | 6 | 1 | 4 / 5 | 90.76 |
| witch | 4 | 6 | 1 | 4 / 5 | 100.53 |
| witch | 5 | 5 | 0 | 5 / 5 | 100.11 |
| alchemist | 1 | 36 | 31 | 0 / 5 | 72 |
| alchemist | 2 | 6 | 1 | 4 / 5 | 95.56 |
| alchemist | 3 | 6 | 1 | 4 / 5 | 98.06 |
| alchemist | 4 | 5 | 0 | 5 / 5 | 90.29 |
| alchemist | 5 | 5 | 0 | 5 / 5 | 86.52 |

Entry-level monster time-to-kill:

| class | ch1 r1 | ch3 r1 | ch3 r5 | ch5 r1 |
| --- | ---: | ---: | ---: | ---: |
| warrior | 3740 ms (L1) | 2462.67 ms (L32) | 2623.45 ms (L35) | 2577.29 ms (L50) |
| guardian | 4720 ms (L1) | 3007.03 ms (L31) | 3001.91 ms (L35) | 2737.86 ms (L50) |
| rogue | 4700 ms (L1) | 2410.74 ms (L32) | 2410.74 ms (L35) | 2659.13 ms (L50) |
| hunter | 4150 ms (L1) | 2722.21 ms (L33) | 2745.66 ms (L36) | 2456.63 ms (L50) |
| archer | 4550 ms (L1) | 2549.55 ms (L34) | 2512.65 ms (L36) | 3101.63 ms (L50) |
| witch | 4850 ms (L1) | 2307.46 ms (L35) | 2955.69 ms (L37) | 3360.91 ms (L50) |
| alchemist | 4610 ms (L1) | 3078.37 ms (L32) | 3078.37 ms (L35) | 2907.73 ms (L50) |

| class | chapter | entry level | entry monster TTK, seconds | median boss duration, seconds | median boss losses/run |
| --- | --- | --- | --- | --- | --- |
| warrior | 1 | 1 | 3.74 | 81 | 6 |
| warrior | 3 | 32 | 2.46 | 91.15 | 0 |
| warrior | 5 | 50 | 2.58 | 81.81 | 0 |
| guardian | 1 | 1 | 4.72 | 108.16 | 4 |
| guardian | 3 | 31 | 3.01 | 97.78 | 0 |
| guardian | 5 | 50 | 2.74 | 88.71 | 0 |
| rogue | 1 | 1 | 4.7 | 66 | 6 |
| rogue | 3 | 32 | 2.41 | 81.89 | 0 |
| rogue | 5 | 50 | 2.66 | 61.76 | 0 |
| hunter | 1 | 1 | 4.15 | 76.5 | 7 |
| hunter | 3 | 33 | 2.72 | 92.46 | 0 |
| hunter | 5 | 50 | 2.46 | 79.94 | 0 |
| archer | 1 | 1 | 4.55 | 66 | 8 |
| archer | 3 | 34 | 2.55 | 91.96 | 0 |
| archer | 5 | 50 | 3.1 | 95.61 | 0 |
| witch | 1 | 1 | 4.85 | 67.5 | 8 |
| witch | 3 | 35 | 2.31 | 90.76 | 0 |
| witch | 5 | 50 | 3.36 | 100.11 | 0 |
| alchemist | 1 | 1 | 4.61 | 72 | 6 |
| alchemist | 3 | 32 | 3.08 | 98.06 | 0 |
| alchemist | 5 | 50 | 2.91 | 86.52 | 0 |

How classes differ: Warrior attacks every 1s with cleave; Guardian every 1.4s with 1.3× HP/DEF and a 500ms bonk delay; Rogue has 0.8s twin strikes, 25% crit and 10% dodge; Hunter has a 1.1s mark (+20% damage taken and material find); Archer has a 0.9s volley cycle; Witch has 1.6s bolts, splash and burn; Alchemist has 1.3s poison flasks and heal-on-kill. Ch1: fastest guardian (10.37m), slowest witch (14.67m); Ch2: fastest guardian (17.38m), slowest witch (24.13m); Ch3: fastest guardian (24.4m), slowest witch (30.9m); Ch4: fastest guardian (31.17m), slowest witch (38.15m); Ch5: fastest rogue (37.42m), slowest witch (45.92m). Boss losses, most first: witch 53, archer 46, hunter 35, alchemist 33, rogue 32, warrior 30, guardian 19. These observations retain the content-defined attack intervals, passives, HP, DEF and dodge differences; timing spread alone does not validate combat feel.

## Three-seed regression (same seeds as the normal proposal test)

| target | passes on seeds 1–3 |
| --- | --- |
| first-boss | NO |
| chapter-growth | NO |
| class-spread | NO |
| chapter-bounds | NO |
| never-stuck | yes |
| craft-salvage-loss | yes |
| walk-share | yes |
| boss-check | NO |
| guardrails | yes |

## Proposed changes

| path | current | proposed | why |
| --- | --- | --- | --- |
| cat.baseAtk | 10 | 18 | The best candidate meeting the mandatory claim-size stability check in the searched family. Its first-boss target still fails; do not sign off. |
| cat.baseHp | 100 | 300 | Cap starting HP at three times current health, retaining meaningful early boss losses and class HP/DEF differences. |
| cat.baseDef | 5 | 5 | Keep the current base DEF of 5; class defensive multipliers remain content-defined. |
| cat.levelGrowth | 0.06 | 0.06 | Retain current 6% stat growth rather than the old 0.8% proposal so levels materially improve combat strength. |
| cat.xpGrowth | 1.12 | 1.12 | Search XP-to-next-level growth to reduce late over-leveling. |
| monster.hpBase | 30 | 90 | Use three times starting monster HP so attacking matters more than walking at the measured probes. |
| monster.hpGrowth | 1.13 | 1.06 | Use 6% stage HP growth to keep later monsters manageable within the three-minute boss cap; chapter growth still fails. |
| monster.atkBase | 4 | 8 | Double initial monster damage to retain survival pressure alongside the bounded HP increase. |
| monster.atkGrowth | 1.12 | 1.06 | Use 6% stage damage growth to avoid late survival walls; first-attempt success still needs content tuning. |
| monster.xpBase | 6 | 18 | Triple initial XP per monster to make level progression meaningful before the first boss and reduce early farming waits. |
| monster.xpGrowth | 1.11 | 1.15 | Search stage XP growth independently of monster HP. |
| idle.dailyKeys | 1 | 3 | Grant three daily keys, the allowed maximum; the remaining key budget gap is explicitly reported. |
| idle.walkTimeMs | 1000 | 1000 | Keep current one-second walking instead of six seconds; measured combat retains the larger share of each probe. |
| idle.gearDropChance | 0.02 | 0.0067 | Reduce gear drops to 0.67% (33.5% of current); the finite search uses this lower loot rate to change early equipment progression. This is a real balance cost, not a measurement-only adjustment. |
| boss.maxMs | 60000 | 180000 | Bound every boss attempt to three minutes instead of the old twenty-minute proposal. |
| boss.attackIntervalMs | 1500 | 4500 | Allow 4.5 seconds between normal boss attacks to keep bounded player HP viable; first-attempt rate failures remain visible. |
| boss.bigEveryMs | 6000 | 6000 | Keep the current six-second big-attack cadence so telegraphed attacks remain part of combat. |
| boss.bigMultiplier | 2.5 | 1.5 | Reduce big-hit damage to 1.5 times normal damage while retaining early survival losses. |

## Per-class times (proposed, stepMinutes 2)

Cumulative active minutes: p25 / median / p75. Level columns: median.

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 8.0 / 8.0 / 8.0 | 12.9 / 13.2 / 13.4 | 17.6 / 17.9 / 18.1 | 1440.0 / 1440.0 / 1440.0 | 1442.4 / 1442.4 / 1442.5 | 5.98 | 16 |
| guardian | 6.1 / 6.1 / 6.1 | 12.3 / 12.3 / 12.5 | 17.6 / 17.6 / 17.7 | 1440.0 / 1440.0 / 1440.0 | 1442.7 / 1442.8 / 1442.8 | 6.13 | 16 |
| rogue | 8.1 / 8.1 / 8.1 | 13.3 / 13.5 / 13.6 | 17.9 / 18.1 / 18.3 | 1440.0 / 1440.0 / 1440.0 | 1442.7 / 1442.8 / 1442.8 | 6.13 | 16 |
| hunter | 8.1 / 8.1 / 8.1 | 13.3 / 13.4 / 13.4 | 18.2 / 18.3 / 18.4 | 1440.0 / 1440.0 / 1440.0 | 1442.4 / 1442.5 / 1442.5 | 6.13 | 16 |
| archer | 9.0 / 9.3 / 9.3 | 14.2 / 14.9 / 14.9 | 19.3 / 20.1 / 20.2 | 1440.0 / 1440.0 / 1440.0 | 1442.9 / 1442.9 / 1443.0 | 6.25 | 18 |
| witch | 9.4 / 9.4 / 9.4 | 15.1 / 15.2 / 15.3 | 20.4 / 20.7 / 20.8 | 1440.0 / 1440.0 / 1440.0 | 1443.3 / 1443.3 / 1443.3 | 7.43 | 18 |
| alchemist | 8.4 / 8.4 / 8.4 | 14.1 / 14.2 / 14.3 | 19.5 / 19.6 / 19.7 | 1440.0 / 1440.0 / 1440.0 | 1443.1 / 1443.1 / 1443.1 | 6.37 | 18 |

## StepMinutes 1 diagnostic (proposed, seeds 1–5)

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 8.2 / 8.2 / 8.2 | 13.3 / 13.3 / 13.4 | 18.0 / 18.1 / 18.1 | 1440.0 / 1440.0 / 1440.0 | 1442.3 / 1442.4 / 1442.4 | 6.17 | 16 |
| guardian | 6.3 / 6.3 / 6.3 | 12.2 / 12.5 / 12.7 | 17.4 / 17.5 / 17.6 | 1440.0 / 1440.0 / 1440.0 | 1442.7 / 1442.7 / 1442.8 | 6.3 | 15 |
| rogue | 8.3 / 8.3 / 8.3 | 13.4 / 13.4 / 13.7 | 18.1 / 18.2 / 18.4 | 1440.0 / 1440.0 / 1440.0 | 1442.8 / 1442.8 / 1442.8 | 6.28 | 16 |
| hunter | 8.3 / 8.3 / 8.3 | 13.5 / 13.6 / 13.6 | 18.2 / 18.4 / 18.5 | 1440.0 / 1440.0 / 1440.0 | 1442.4 / 1442.5 / 1442.6 | 6.3 | 16 |
| archer | 9.4 / 9.4 / 9.4 | 14.9 / 15.1 / 15.3 | 20.3 / 20.4 / 20.4 | 1440.0 / 1440.0 / 1440.0 | 1443.0 / 1443.0 / 1443.0 | 6.45 | 18 |
| witch | 9.7 / 9.7 / 9.7 | 15.5 / 15.6 / 15.8 | 20.9 / 21.1 / 21.2 | 1440.0 / 1440.0 / 1440.0 | 1443.3 / 1443.3 / 1443.3 | 6.7 | 18 |
| alchemist | 8.5 / 8.5 / 9.5 | 14.3 / 14.6 / 15.1 | 19.8 / 19.9 / 20.6 | 1440.0 / 1440.0 / 1440.0 | 1443.1 / 1443.1 / 1443.1 | 6.5 | 17 |

Matched stepMinutes 2, seeds 1–5:

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 7.9 / 8.0 / 8.0 | 12.8 / 13.0 / 13.3 | 17.4 / 17.8 / 17.9 | 1440.0 / 1440.0 / 1440.0 | 1442.4 / 1442.5 / 1442.5 | 5.98 | 16 |
| guardian | 6.1 / 6.1 / 6.1 | 12.3 / 12.3 / 12.3 | 17.6 / 17.6 / 17.7 | 1440.0 / 1440.0 / 1440.0 | 1442.7 / 1442.8 / 1442.8 | 6.13 | 16 |
| rogue | 8.1 / 8.1 / 8.1 | 13.3 / 13.4 / 13.5 | 17.9 / 18.1 / 18.1 | 1440.0 / 1440.0 / 1440.0 | 1442.7 / 1442.8 / 1442.8 | 6.13 | 16 |
| hunter | 8.1 / 8.1 / 8.1 | 13.3 / 13.3 / 13.4 | 17.9 / 18.2 / 18.3 | 1440.0 / 1440.0 / 1440.0 | 1442.5 / 1442.5 / 1442.5 | 6.13 | 16 |
| archer | 9.3 / 9.3 / 9.3 | 14.7 / 14.9 / 14.9 | 19.8 / 20.1 / 20.1 | 1440.0 / 1440.0 / 1440.0 | 1442.9 / 1442.9 / 1443.0 | 6.25 | 18 |
| witch | 9.4 / 9.4 / 9.4 | 14.9 / 15.1 / 15.3 | 20.3 / 20.4 / 20.7 | 1440.0 / 1440.0 / 1440.0 | 1443.3 / 1443.3 / 1443.3 | 7.43 | 18 |
| alchemist | 8.4 / 8.4 / 8.4 | 14.1 / 14.2 / 14.2 | 19.5 / 19.6 / 19.6 | 1440.0 / 1440.0 / 1440.0 | 1443.1 / 1443.1 / 1443.1 | 6.37 | 18 |

| class | ch1 median absolute difference, minutes | within 1 minute? |
| --- | --- | --- |
| warrior | 0.18 | yes |
| guardian | 0.17 | yes |
| rogue | 0.15 | yes |
| hunter | 0.17 | yes |
| archer | 0.2 | yes |
| witch | 0.27 | yes |
| alchemist | 0.13 | yes |

## Key wait and boss-attempt level (proposed)

Each chapter: median key wait minutes; median first-attempt level / median level over all attempts. Missing attempts remain Infinity. Last column is runs reaching maxLevel before the ch5 win, including incomplete runs that reached the cap.

| class | ch1 | ch2 | ch3 | ch4 | ch5 | reached max level before ch5 win |
| --- | --- | --- | --- | --- | --- | --- |
| warrior | 0m; L17 / L20 | 0m; L35 / L35 | 0m; L47 / L47 | 1417.83m; L60 / L60 | 0m; L60 / L60 | 20/20 |
| guardian | 0m; L17 / L18.5 | 0m; L34 / L34 | 0m; L47 / L47 | 1417.82m; L60 / L60 | 0m; L60 / L60 | 20/20 |
| rogue | 0m; L17 / L20 | 0m; L35 / L35 | 0m; L47 / L47 | 1417.78m; L60 / L60 | 0m; L60 / L60 | 20/20 |
| hunter | 0m; L17 / L21 | 0m; L35 / L35 | 0m; L47 / L47 | 1417.51m; L60 / L60 | 0m; L60 / L60 | 20/20 |
| archer | 0m; L17 / L22 | 0m; L35 / L35 | 0m; L47 / L47 | 1415.32m; L60 / L60 | 0m; L60 / L60 | 20/20 |
| witch | 0m; L17 / L21 | 0m; L35 / L35 | 0m; L47 / L47 | 1414.59m; L60 / L60 | 0m; L60 / L60 | 20/20 |
| alchemist | 0m; L17 / L20 | 0m; L35 / L35 | 0m; L47 / L47 | 1415.61m; L60 / L60 | 0m; L60 / L60 | 20/20 |

## Player-day profiles — diagnostic only, never used by targets

Seeds 1–5; cell = median elapsed calendar days / active minutes. Each player starts at the beginning of their daily activity window. Day advances after the stated active-minute budget; no away-time gains are simulated. Fractions use active minutes / 1440 within the current calendar day. Thus 1.01d means just into the second daily session, not two full days.

| active minutes/day | class | ch1 | ch2 | ch3 | ch4 | ch5 |
| --- | --- | --- | --- | --- | --- | --- |
| 1440 | warrior | 0.01d / 7.98m | 0.01d / 13.02m | 0.01d / 17.82m | 1d / 1440.02m | 1d / 1442.47m |
| 1440 | guardian | 0d / 6.13m | 0.01d / 12.32m | 0.01d / 17.6m | 1d / 1440.02m | 1d / 1442.75m |
| 1440 | rogue | 0.01d / 8.13m | 0.01d / 13.42m | 0.01d / 18.08m | 1d / 1440.02m | 1d / 1442.83m |
| 1440 | hunter | 0.01d / 8.13m | 0.01d / 13.35m | 0.01d / 18.2m | 1d / 1440.02m | 1d / 1442.52m |
| 1440 | archer | 0.01d / 9.25m | 0.01d / 14.9m | 0.01d / 20.1m | 1d / 1440.02m | 1d / 1442.93m |
| 1440 | witch | 0.01d / 9.43m | 0.01d / 15.07m | 0.01d / 20.43m | 1d / 1440.02m | 1d / 1443.3m |
| 1440 | alchemist | 0.01d / 8.37m | 0.01d / 14.17m | 0.01d / 19.57m | 1d / 1440.02m | 1d / 1443.1m |
| 480 | warrior | 0.01d / 7.98m | 0.01d / 13.02m | 0.01d / 17.82m | 1d / 480.02m | 1d / 482.72m |
| 480 | guardian | 0d / 6.13m | 0.01d / 12.32m | 0.01d / 17.6m | 1d / 480.02m | 1d / 482.88m |
| 480 | rogue | 0.01d / 8.13m | 0.01d / 13.42m | 0.01d / 18.08m | 1d / 480.02m | 1d / 482.93m |
| 480 | hunter | 0.01d / 8.13m | 0.01d / 13.35m | 0.01d / 18.2m | 1d / 480.02m | 1d / 482.92m |
| 480 | archer | 0.01d / 9.25m | 0.01d / 14.9m | 0.01d / 20.1m | 1d / 480.02m | 1d / 483.2m |
| 480 | witch | 0.01d / 9.43m | 0.01d / 15.07m | 0.01d / 20.43m | 1d / 480.02m | 1d / 483.45m |
| 480 | alchemist | 0.01d / 8.37m | 0.01d / 14.17m | 0.01d / 19.57m | 1d / 480.02m | 1d / 483.3m |
| 120 | warrior | 0.01d / 7.98m | 0.01d / 13.02m | 0.01d / 17.82m | 1d / 120.02m | 1d / 123.45m |
| 120 | guardian | 0d / 6.13m | 0.01d / 12.32m | 0.01d / 17.6m | 1d / 120.02m | 1d / 123.43m |
| 120 | rogue | 0.01d / 8.13m | 0.01d / 13.42m | 0.01d / 18.08m | 1d / 120.02m | 1d / 123.1m |
| 120 | hunter | 0.01d / 8.13m | 0.01d / 13.35m | 0.01d / 18.2m | 1d / 120.02m | 1d / 123.1m |
| 120 | archer | 0.01d / 9.25m | 0.01d / 14.9m | 0.01d / 20.1m | 1d / 120.02m | 1d / 123.78m |
| 120 | witch | 0.01d / 9.43m | 0.01d / 15.07m | 0.01d / 20.43m | 1d / 120.02m | 1d / 123.77m |
| 120 | alchemist | 0.01d / 8.37m | 0.01d / 14.17m | 0.01d / 19.57m | 1d / 120.02m | 1d / 123.6m |

## C5b remeasured with sub-step timing (5 seeds)

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 9.5 / 10.9 / 11.2 | 17.0 / 17.1 / 17.6 | 23.0 / 23.4 / 23.6 | 1440.0 / 1440.0 / 1440.0 | 1442.6 / 1442.7 / 1442.8 | 9.2 | 23.35 |
| guardian | 6.3 / 9.2 / 9.4 | 14.3 / 16.4 / 16.5 | 21.7 / 23.3 / 23.5 | 1440.0 / 1440.0 / 1440.0 | 1442.8 / 1442.9 / 1442.9 | 9.37 | 23.25 |
| rogue | 9.2 / 12.2 / 12.3 | 16.0 / 17.4 / 18.8 | 22.2 / 22.9 / 25.0 | 1440.0 / 1440.0 / 1440.0 | 1442.8 / 1443.1 / 1443.1 | 9.2 | 22.85 |
| hunter | 12.0 / 12.2 / 12.2 | 18.3 / 18.4 / 18.8 | 24.1 / 25.3 / 25.4 | 1440.0 / 1440.0 / 1440.0 | 1442.7 / 1442.7 / 1442.7 | 9.2 | 25.32 |
| archer | 10.4 / 12.4 / 12.4 | 18.8 / 19.3 / 20.1 | 26.0 / 26.6 / 27.0 | 1440.0 / 1440.0 / 1440.0 | 1443.2 / 1443.2 / 1443.3 | 9.38 | 26 |
| witch | 10.7 / 13.7 / 13.7 | 18.9 / 20.1 / 21.4 | 26.9 / 27.3 / 27.6 | 1440.0 / 1440.0 / 1440.0 | 1443.3 / 1443.4 / 1443.4 | 9.67 | 26 |
| alchemist | 10.6 / 11.7 / 12.7 | 16.9 / 18.9 / 19.4 | 23.9 / 25.9 / 26.2 | 1440.0 / 1440.0 / 1440.0 | 1443.2 / 1443.4 / 1443.4 | 9.65 | 25.92 |

| class | ch1 | ch2 | ch3 | ch4 | ch5 | reached max level before ch5 win |
| --- | --- | --- | --- | --- | --- | --- |
| warrior | 0m; L16 / L19.5 | 0m; L31 / L31.5 | 0m; L40 / L40 | 1409.87m; L60 / L60 | 0m; L60 / L60 | 5/5 |
| guardian | 0m; L16 / L18 | 0m; L31 / L31 | 0m; L40 / L40 | 1410.12m; L60 / L60 | 0m; L60 / L60 | 5/5 |
| rogue | 0m; L16 / L20 | 0m; L32 / L32 | 0m; L41 / L41 | 1411.77m; L60 / L60 | 0m; L60 / L60 | 5/5 |
| hunter | 0m; L16 / L21 | 0m; L32 / L32 | 0m; L41 / L41 | 1408.02m; L60 / L60 | 0m; L60 / L60 | 5/5 |
| archer | 0m; L16 / L21 | 0m; L32 / L32 | 0m; L41 / L41 | 1406.38m; L60 / L60 | 0m; L60 / L60 | 5/5 |
| witch | 0m; L16 / L21 | 0m; L32 / L33 | 0m; L42 / L42 | 1405.72m; L60 / L60 | 0m; L60 / L60 | 5/5 |
| alchemist | 0m; L16 / L19 | 0m; L32 / L32 | 0m; L40 / L40 | 1407.48m; L60 / L60 | 0m; L60 / L60 | 5/5 |

| class | chapter | fights | losses | first-attempt wins / seeds | median fight seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
| warrior | 1 | 28 | 23 | 0 / 5 | 79.5 |
| warrior | 2 | 6 | 1 | 4 / 5 | 86.18 |
| warrior | 3 | 5 | 0 | 5 / 5 | 86.27 |
| warrior | 4 | 5 | 0 | 5 / 5 | 13.33 |
| warrior | 5 | 5 | 0 | 5 / 5 | 22.93 |
| guardian | 1 | 15 | 10 | 2 / 5 | 114 |
| guardian | 2 | 5 | 0 | 5 / 5 | 97.86 |
| guardian | 3 | 5 | 0 | 5 / 5 | 96.33 |
| guardian | 4 | 5 | 0 | 5 / 5 | 15.82 |
| guardian | 5 | 5 | 0 | 5 / 5 | 27.89 |
| rogue | 1 | 29 | 24 | 0 / 5 | 78 |
| rogue | 2 | 5 | 0 | 5 / 5 | 87.6 |
| rogue | 3 | 5 | 0 | 5 / 5 | 63.88 |
| rogue | 4 | 5 | 0 | 5 / 5 | 14.23 |
| rogue | 5 | 5 | 0 | 5 / 5 | 26.94 |
| hunter | 1 | 35 | 30 | 0 / 5 | 72 |
| hunter | 2 | 6 | 1 | 4 / 5 | 91.7 |
| hunter | 3 | 5 | 0 | 5 / 5 | 89.53 |
| hunter | 4 | 5 | 0 | 5 / 5 | 11.87 |
| hunter | 5 | 5 | 0 | 5 / 5 | 24.93 |
| archer | 1 | 33 | 28 | 0 / 5 | 72 |
| archer | 2 | 8 | 3 | 3 / 5 | 87.3 |
| archer | 3 | 7 | 2 | 4 / 5 | 85.5 |
| archer | 4 | 5 | 0 | 5 / 5 | 13.15 |
| archer | 5 | 5 | 0 | 5 / 5 | 25.27 |
| witch | 1 | 34 | 29 | 0 / 5 | 69.75 |
| witch | 2 | 9 | 4 | 2 / 5 | 84 |
| witch | 3 | 6 | 1 | 4 / 5 | 87.42 |
| witch | 4 | 5 | 0 | 5 / 5 | 14 |
| witch | 5 | 5 | 0 | 5 / 5 | 25.68 |
| alchemist | 1 | 29 | 24 | 0 / 5 | 80.67 |
| alchemist | 2 | 5 | 0 | 5 / 5 | 91.41 |
| alchemist | 3 | 5 | 0 | 5 / 5 | 85.25 |
| alchemist | 4 | 5 | 0 | 5 / 5 | 14.79 |
| alchemist | 5 | 5 | 0 | 5 / 5 | 27.91 |

## C5b with only S-A removing the key wall (5 seeds; causal diagnostic)

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 9.5 / 10.9 / 11.2 | 17.0 / 17.1 / 17.6 | 23.0 / 23.4 / 23.6 | 28.4 / 30.1 / 30.3 | 34.1 / 36.8 / 36.8 | 9.2 | 23.35 |
| guardian | 6.3 / 9.2 / 9.4 | 14.3 / 16.4 / 16.5 | 21.7 / 23.3 / 23.5 | 28.3 / 29.9 / 29.9 | 35.2 / 37.0 / 37.2 | 9.37 | 23.25 |
| rogue | 9.2 / 12.2 / 12.3 | 16.0 / 17.4 / 18.8 | 22.2 / 22.9 / 25.0 | 27.9 / 28.2 / 30.7 | 33.0 / 34.4 / 36.6 | 9.2 | 22.85 |
| hunter | 12.0 / 12.2 / 12.2 | 18.3 / 18.4 / 18.8 | 24.1 / 25.3 / 25.4 | 30.4 / 32.0 / 32.0 | 37.0 / 38.3 / 38.6 | 9.2 | 25.32 |
| archer | 10.4 / 12.4 / 12.4 | 18.8 / 19.3 / 20.1 | 26.0 / 26.6 / 27.0 | 32.8 / 33.6 / 34.1 | 39.7 / 40.3 / 41.2 | 9.38 | 26 |
| witch | 10.7 / 13.7 / 13.7 | 18.9 / 20.1 / 21.4 | 26.9 / 27.3 / 27.6 | 34.0 / 34.3 / 34.4 | 41.4 / 41.5 / 41.7 | 9.67 | 26 |
| alchemist | 10.6 / 11.7 / 12.7 | 16.9 / 18.9 / 19.4 | 23.9 / 25.9 / 26.2 | 30.7 / 32.5 / 33.0 | 38.2 / 39.3 / 39.8 | 9.65 | 25.92 |

| class | ch1 | ch2 | ch3 | ch4 | ch5 | reached max level before ch5 win |
| --- | --- | --- | --- | --- | --- | --- |
| warrior | 0m; L16 / L19.5 | 0m; L31 / L31.5 | 0m; L40 / L40 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| guardian | 0m; L16 / L18 | 0m; L31 / L31 | 0m; L40 / L40 | 0m; L50 / L50 | 0m; L59 / L59 | 1/5 |
| rogue | 0m; L16 / L20 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| hunter | 0m; L16 / L21 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| archer | 0m; L16 / L21 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| witch | 0m; L16 / L21 | 0m; L32 / L33 | 0m; L42 / L42 | 0m; L51 / L51 | 0m; L60 / L60 | 4/5 |
| alchemist | 0m; L16 / L19 | 0m; L32 / L32 | 0m; L40 / L40 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |

| class | chapter | fights | losses | first-attempt wins / seeds | median fight seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
| warrior | 1 | 28 | 23 | 0 / 5 | 79.5 |
| warrior | 2 | 6 | 1 | 4 / 5 | 86.18 |
| warrior | 3 | 5 | 0 | 5 / 5 | 86.27 |
| warrior | 4 | 5 | 0 | 5 / 5 | 82.16 |
| warrior | 5 | 5 | 0 | 5 / 5 | 80.38 |
| guardian | 1 | 15 | 10 | 2 / 5 | 114 |
| guardian | 2 | 5 | 0 | 5 / 5 | 97.86 |
| guardian | 3 | 5 | 0 | 5 / 5 | 96.33 |
| guardian | 4 | 5 | 0 | 5 / 5 | 84.83 |
| guardian | 5 | 5 | 0 | 5 / 5 | 97.2 |
| rogue | 1 | 29 | 24 | 0 / 5 | 78 |
| rogue | 2 | 5 | 0 | 5 / 5 | 87.6 |
| rogue | 3 | 5 | 0 | 5 / 5 | 63.88 |
| rogue | 4 | 5 | 0 | 5 / 5 | 60.79 |
| rogue | 5 | 5 | 0 | 5 / 5 | 62.59 |
| hunter | 1 | 35 | 30 | 0 / 5 | 72 |
| hunter | 2 | 6 | 1 | 4 / 5 | 91.7 |
| hunter | 3 | 5 | 0 | 5 / 5 | 89.53 |
| hunter | 4 | 5 | 0 | 5 / 5 | 85.8 |
| hunter | 5 | 5 | 0 | 5 / 5 | 86.28 |
| archer | 1 | 33 | 28 | 0 / 5 | 72 |
| archer | 2 | 8 | 3 | 3 / 5 | 87.3 |
| archer | 3 | 7 | 2 | 4 / 5 | 85.5 |
| archer | 4 | 5 | 0 | 5 / 5 | 86.36 |
| archer | 5 | 5 | 0 | 5 / 5 | 84.24 |
| witch | 1 | 34 | 29 | 0 / 5 | 69.75 |
| witch | 2 | 9 | 4 | 2 / 5 | 84 |
| witch | 3 | 6 | 1 | 4 / 5 | 87.42 |
| witch | 4 | 5 | 0 | 5 / 5 | 81.46 |
| witch | 5 | 5 | 0 | 5 / 5 | 80.86 |
| alchemist | 1 | 29 | 24 | 0 / 5 | 80.67 |
| alchemist | 2 | 5 | 0 | 5 / 5 | 91.41 |
| alchemist | 3 | 5 | 0 | 5 / 5 | 85.25 |
| alchemist | 4 | 5 | 0 | 5 / 5 | 82.71 |
| alchemist | 5 | 5 | 0 | 5 / 5 | 79.36 |

## Per-class times (current, 5 seeds)

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 31.4 / 36.3 / 38.2 | 1440.0 / 1440.0 / 1440.0 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16 | 66 |
| guardian | 26.5 / 27.5 / 31.4 | 1440.0 / 1440.0 / 1440.0 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16.52 | 72 |
| rogue | 34.4 / 36.3 / 38.5 | 1440.0 / 1440.0 / 1440.0 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 15.35 | 66 |
| hunter | 39.3 / 42.3 / 44.4 | 1440.0 / 1440.0 / 1440.0 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 15.47 | 70 |
| archer | 43.5 / 52.5 / 52.6 | 1440.0 / 1440.0 / 1440.0 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16.53 | 74 |
| witch | 45.5 / 47.6 / 49.8 | 1440.0 / 1440.0 / 1440.0 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 17.57 | 76 |
| alchemist | 41.5 / 44.9 / 45.8 | 1440.0 / 1440.0 / 1440.0 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16.83 | 74 |

## Boss fights and losses (proposed)

Totals across seeds; median duration includes wins and losses. First attempt is the first actual fight, never the first winning attempt. Level for every attempt is retained in the run data.

| class | chapter | fights | losses | first-attempt wins / seeds | median fight seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
| warrior | 1 | 77 | 57 | 0 / 20 | 78 |
| warrior | 2 | 20 | 0 | 20 / 20 | 67.34 |
| warrior | 3 | 20 | 0 | 20 / 20 | 53.16 |
| warrior | 4 | 20 | 0 | 20 / 20 | 11.48 |
| warrior | 5 | 20 | 0 | 20 / 20 | 21.27 |
| guardian | 1 | 40 | 20 | 0 / 20 | 98.66 |
| guardian | 2 | 20 | 0 | 20 / 20 | 71.91 |
| guardian | 3 | 20 | 0 | 20 / 20 | 53.95 |
| guardian | 4 | 20 | 0 | 20 / 20 | 12.14 |
| guardian | 5 | 20 | 0 | 20 / 20 | 22.71 |
| rogue | 1 | 78 | 58 | 0 / 20 | 72 |
| rogue | 2 | 20 | 0 | 20 / 20 | 63.7 |
| rogue | 3 | 20 | 0 | 20 / 20 | 47.21 |
| rogue | 4 | 20 | 0 | 20 / 20 | 11.67 |
| rogue | 5 | 20 | 0 | 20 / 20 | 21.46 |
| hunter | 1 | 80 | 60 | 0 / 20 | 73.31 |
| hunter | 2 | 20 | 0 | 20 / 20 | 66.39 |
| hunter | 3 | 20 | 0 | 20 / 20 | 53.36 |
| hunter | 4 | 20 | 0 | 20 / 20 | 11.26 |
| hunter | 5 | 20 | 0 | 20 / 20 | 22.36 |
| archer | 1 | 95 | 75 | 0 / 20 | 72 |
| archer | 2 | 20 | 0 | 20 / 20 | 66.87 |
| archer | 3 | 20 | 0 | 20 / 20 | 52.18 |
| archer | 4 | 20 | 0 | 20 / 20 | 12.68 |
| archer | 5 | 20 | 0 | 20 / 20 | 23.16 |
| witch | 1 | 99 | 79 | 0 / 20 | 66 |
| witch | 2 | 20 | 0 | 20 / 20 | 68.95 |
| witch | 3 | 20 | 0 | 20 / 20 | 53.82 |
| witch | 4 | 20 | 0 | 20 / 20 | 14.07 |
| witch | 5 | 20 | 0 | 20 / 20 | 25.85 |
| alchemist | 1 | 79 | 59 | 0 / 20 | 73.51 |
| alchemist | 2 | 20 | 0 | 20 / 20 | 68.01 |
| alchemist | 3 | 20 | 0 | 20 / 20 | 57.06 |
| alchemist | 4 | 20 | 0 | 20 / 20 | 12.62 |
| alchemist | 5 | 20 | 0 | 20 / 20 | 23.24 |

## Median monster time-to-kill (proposed)

Probe = equal-weight median of three regular archetypes and elite, at observed entry level and equipment. Binary-search replay recovers entries within claims. Walk-share re-evaluates all entry equipment at the exact floored class median level; missing probes fail.

| class | ch1 r1 | ch3 r1 | ch3 r5 | ch5 r1 |
| --- | ---: | ---: | ---: | ---: |
| warrior | 3740 ms (L1) | 1986.29 ms (L35) | 1588.35 ms (L40) | 240 ms (L60) |
| guardian | 4020 ms (L1) | 1812.61 ms (L34) | 1763.29 ms (L39) | 520 ms (L60) |
| rogue | 3500 ms (L1) | 1774.45 ms (L35) | 1718.51 ms (L40) | 300 ms (L60) |
| hunter | 3600 ms (L1) | 1781.69 ms (L35) | 1719.4 ms (L40) | 300 ms (L60) |
| archer | 3650 ms (L1) | 2139.64 ms (L35) | 2054.03 ms (L40) | 500 ms (L60) |
| witch | 4050 ms (L1) | 2265.99 ms (L35) | 2261.77 ms (L40) | 850 ms (L60) |
| alchemist | 3960 ms (L1) | 1879.85 ms (L35) | 1841.02 ms (L40) | 710 ms (L60) |

## How classes differ

| class | chapter | entry level | entry monster TTK, seconds | median boss duration, seconds | median boss losses/run |
| --- | --- | --- | --- | --- | --- |
| warrior | 1 | 1 | 3.74 | 78 | 3 |
| warrior | 3 | 35 | 1.99 | 53.16 | 0 |
| warrior | 5 | 60 | 0.24 | 21.27 | 0 |
| guardian | 1 | 1 | 4.02 | 98.66 | 1 |
| guardian | 3 | 34 | 1.81 | 53.95 | 0 |
| guardian | 5 | 60 | 0.52 | 22.71 | 0 |
| rogue | 1 | 1 | 3.5 | 72 | 3 |
| rogue | 3 | 35 | 1.77 | 47.21 | 0 |
| rogue | 5 | 60 | 0.3 | 21.46 | 0 |
| hunter | 1 | 1 | 3.6 | 73.31 | 3 |
| hunter | 3 | 35 | 1.78 | 53.36 | 0 |
| hunter | 5 | 60 | 0.3 | 22.36 | 0 |
| archer | 1 | 1 | 3.65 | 72 | 4 |
| archer | 3 | 35 | 2.14 | 52.18 | 0 |
| archer | 5 | 60 | 0.5 | 23.16 | 0 |
| witch | 1 | 1 | 4.05 | 66 | 4 |
| witch | 3 | 35 | 2.27 | 53.82 | 0 |
| witch | 5 | 60 | 0.85 | 25.85 | 0 |
| alchemist | 1 | 1 | 3.96 | 73.51 | 3 |
| alchemist | 3 | 35 | 1.88 | 57.06 | 0 |
| alchemist | 5 | 60 | 0.71 | 23.24 | 0 |

Entry probes use chapter round 1; boss duration and losses are from actual later attempts at the recorded levels, including retries.

Warrior attacks every 1s with cleave; Guardian every 1.4s with 1.3× HP/DEF and a 500ms bonk delay; Rogue has 0.8s twin strikes, 25% crit and 10% dodge; Hunter has a 1.1s mark (+20% damage taken and material find); Archer has a 0.9s volley cycle; Witch has 1.6s bolts, splash and burn; Alchemist has 1.3s poison flasks and heal-on-kill. Ch1: fastest guardian (6.13m), slowest witch (9.43m); Ch2: fastest guardian (12.34m), slowest witch (15.21m); Ch3: fastest guardian (17.64m), slowest witch (20.67m); Ch4: fastest warrior, guardian, rogue, hunter, archer, witch, alchemist (1440.02m), slowest warrior, guardian, rogue, hunter, archer, witch, alchemist (1440.02m); Ch5: fastest warrior (1442.43m), slowest witch (1443.3m). Boss losses, most first: witch 79, archer 75, hunter 60, alchemist 59, rogue 58, warrior 57, guardian 20. These observations retain the content-defined attack intervals, passives, HP, DEF and dodge differences; timing spread alone does not validate combat feel.

## First-boss config witness (five seeds, 60-minute diagnostic horizon)

warrior 12.2m; guardian 10.4m; rogue 12.3m; hunter 13.2m; archer 14.4m; witch 14.7m; alchemist 12.7m. This is a target-specific witness; it is excluded from main selection because its one- versus two-minute timing diagnostic exceeds one minute for at least one class/cohort. It does not pass all targets.

```json
{
  "cat": {
    "baseAtk": 14,
    "baseHp": 300,
    "baseDef": 5,
    "levelGrowth": 0.06,
    "xpGrowth": 1.12
  },
  "monster": {
    "hpBase": 90,
    "hpGrowth": 1.06,
    "atkBase": 8,
    "atkGrowth": 1.06,
    "xpBase": 18,
    "xpGrowth": 1.11
  },
  "idle": {
    "dailyKeys": 3,
    "walkTimeMs": 1000,
    "gearDropChance": 0.0067
  },
  "boss": {
    "maxMs": 180000,
    "attackIntervalMs": 4500,
    "bigEveryMs": 6000,
    "bigMultiplier": 1.5
  }
}
```

## Unreachable targets in the searched family

- first-boss: reachable with config (set found: CONFIG_FIRST_BOSS_WITNESS_V2 above); that set still fails measurement acceptance and is not the main proposal. Proposal evidence: warrior 8.0m; guardian 6.1m; rogue 8.1m; hunter 8.1m; archer 9.3m; witch 9.4m; alchemist 8.4m.
- chapter-growth: not reachable by config or these scenarios in this bounded search; needs content change: killsPerRound per chapter in chapters.ts, and per-chapter boss HP in monsters.ts. Proposal evidence: warrior ch2 0.66x; warrior ch3 0.89x; warrior ch4 301.52x; warrior ch5 0.00x; guardian ch2 1.01x; guardian ch3 0.85x; guardian ch4 269.64x; guardian ch5 0.00x; rogue ch2 0.66x; rogue ch3 0.87x; rogue ch4 304.15x; rogue ch5 0.00x; hunter ch2 0.65x; hunter ch3 0.93x; hunter ch4 290.15x; hunter ch5 0.00x; archer ch2 0.61x; archer ch3 0.93x; archer ch4 270.89x; archer ch5 0.00x; witch ch2 0.62x; witch ch3 0.92x; witch ch4 264.07x; witch ch5 0.00x; alchemist ch2 0.69x; alchemist ch3 0.93x; alchemist ch4 263.45x; alchemist ch5 0.00x.
- class-spread: not reachable by config or these scenarios in this bounded search; needs content change: classes.ts guardian HP/DEF/bonk and per-class ATK/attack intervals/passive damage. Proposal evidence: ch1 range 40.6%; ch2 range 21.3%; ch3 range 16.5%; ch4 range 0.0%; ch5 range 0.1%; warrior ch1 -1.8%; guardian ch1 -24.6%; rogue ch1 0.0%; hunter ch1 0.0%; archer ch1 13.7%; witch ch1 16.0%; alchemist ch1 2.9%; warrior ch2 -2.2%; guardian ch2 -8.5%; rogue ch2 0.0%; hunter ch2 -0.6%; archer ch2 10.3%; witch ch2 12.8%; alchemist ch2 5.1%; warrior ch3 -2.4%; guardian ch3 -3.6%; rogue ch3 -0.9%; hunter ch3 0.0%; archer ch3 10.0%; witch ch3 13.0%; alchemist ch3 7.1%; warrior ch4 0.0%; guardian ch4 0.0%; rogue ch4 0.0%; hunter ch4 0.0%; archer ch4 0.0%; witch ch4 0.0%; alchemist ch4 0.0%; warrior ch5 -0.0%; guardian ch5 -0.0%; rogue ch5 0.0%; hunter ch5 -0.0%; archer ch5 0.0%; witch ch5 0.0%; alchemist ch5 0.0%.
- chapter-bounds: not reachable by config or these scenarios in this bounded search; needs content change: chapters.ts killsPerRound and chests.ts first-clear catKey rewards to remove the key-clock wall. Proposal evidence: warrior ch1 8.0m; warrior ch2 5.3m; warrior ch3 4.7m; warrior ch4 1422.2m; warrior ch5 2.4m; guardian ch1 6.1m; guardian ch2 6.2m; guardian ch3 5.3m; guardian ch4 1422.4m; guardian ch5 2.7m; rogue ch1 8.1m; rogue ch2 5.4m; rogue ch3 4.7m; rogue ch4 1421.9m; rogue ch5 2.7m; hunter ch1 8.1m; hunter ch2 5.3m; hunter ch3 4.9m; hunter ch4 1421.7m; hunter ch5 2.5m; archer ch1 9.3m; archer ch2 5.6m; archer ch3 5.2m; archer ch4 1419.9m; archer ch5 2.9m; witch ch1 9.4m; witch ch2 5.8m; witch ch3 5.4m; witch ch4 1419.3m; witch ch5 3.3m; alchemist ch1 8.4m; alchemist ch2 5.8m; alchemist ch3 5.4m; alchemist ch4 1420.4m; alchemist ch5 3.1m.
- boss-check: not reachable by config or these scenarios in this bounded search; needs content change: per-chapter boss hpMul/atkMul in monsters.ts instead of the single 40 / 2.5 archetype, plus guardian HP/DEF/bonk in classes.ts. Proposal evidence: warrior ch1 first win 0.0%, median 78.00s; warrior ch2 first win 100.0%, median 67.34s; warrior ch3 first win 100.0%, median 53.16s; warrior ch4 first win 100.0%, median 11.48s; warrior ch5 first win 100.0%, median 21.27s; guardian ch1 first win 0.0%, median 98.66s; guardian ch2 first win 100.0%, median 71.91s; guardian ch3 first win 100.0%, median 53.95s; guardian ch4 first win 100.0%, median 12.14s; guardian ch5 first win 100.0%, median 22.71s; rogue ch1 first win 0.0%, median 72.00s; rogue ch2 first win 100.0%, median 63.70s; rogue ch3 first win 100.0%, median 47.21s; rogue ch4 first win 100.0%, median 11.67s; rogue ch5 first win 100.0%, median 21.46s; hunter ch1 first win 0.0%, median 73.31s; hunter ch2 first win 100.0%, median 66.39s; hunter ch3 first win 100.0%, median 53.36s; hunter ch4 first win 100.0%, median 11.26s; hunter ch5 first win 100.0%, median 22.36s; archer ch1 first win 0.0%, median 72.00s; archer ch2 first win 100.0%, median 66.87s; archer ch3 first win 100.0%, median 52.18s; archer ch4 first win 100.0%, median 12.68s; archer ch5 first win 100.0%, median 23.16s; witch ch1 first win 0.0%, median 66.00s; witch ch2 first win 100.0%, median 68.95s; witch ch3 first win 100.0%, median 53.82s; witch ch4 first win 100.0%, median 14.07s; witch ch5 first win 100.0%, median 25.85s; alchemist ch1 first win 0.0%, median 73.51s; alchemist ch2 first win 100.0%, median 68.01s; alchemist ch3 first win 100.0%, median 57.06s; alchemist ch4 first win 100.0%, median 12.62s; alchemist ch5 first win 100.0%, median 23.24s.

This is a finite searched family, not a proof of mathematical impossibility. Chapter-growth and boss-check need revalidation after key/content decisions. If a scenario still fails class-spread after removing the key wall, tune classes.ts attackIntervalMs and stats.atk alongside markPrey, volley, burn and poison damage; guardian stats.hp/def and bonk.delayMs control survival. Keep ≥3% spread and ±15% bounds together; no multiplier values are approved here.

## Not overridable

- MATERIALS.*.maxStack (STACK_CAPS_V2 and CAT_KEY_CAP)
- CHEST_SCALING.* (CHESTS)
- content registries (combat/bag/idle lookup maps)

## Method and limits

Claims use computeClaimV2, offline=false. A claim crossing the boss gate is replayed to its earliest whole second, only that prefix is applied, and the rest of the original step continues after the attempt. Cooldown and daily boundaries split claims too. Loot and crafting remain claim-dependent, so event timing removes timestamp quantization but does not make different claim sizes identical. Equipment is selected greedily, up to three improving crafts per applied claim, salvage at 90% bag usage. Boss replay seconds are recorded separately and excluded from active minutes. Keys drop only when computeClaimV2 actually farms cleared content; no old-chapter action is invented. Cleared-chapter key chance stays at production's value in all searched configs.

## Sign-off

User: ____ (approved / changes)
