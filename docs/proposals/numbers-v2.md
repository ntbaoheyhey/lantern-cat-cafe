# Cat RPG v2 numbers proposal (V6)

Proposal only. V2_CONFIG unchanged. Needs the user's sign-off. Simulated seven classes with seeds 1–20, ten-minute active claim steps, greedy equipment and up to three improving crafts, salvage at 90% bag usage, and boss attempts at the frontier. Stop after chapter five's first clear or 1,800 active minutes. Nothing changes until the user signs. Chapter columns below are cumulative boss-win times; growth/bounds use time spent in each chapter. Level milestones after stopping are not reached. Null milestones count as Infinity for targets.

## Targets

| id | target in words | current result | proposed result | ok? |
| --- | --- | --- | --- | --- |
| first-boss | Every class median first win 10–15 minutes | warrior 60m; guardian 40m; rogue 60m; hunter 60m; archer 70m; witch 70m; alchemist 70m | warrior 10m; guardian 10m; rogue 10m; hunter 10m; archer 10m; witch 10m; alchemist 10m | yes |
| chapter-growth | Every class chapter duration grows 1.3–2.0x | warrior ch2 23.17x; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch2 35.25x; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch2 23.17x; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch2 23.17x; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch2 19.71x; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch2 19.71x; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch2 19.71x; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached | warrior ch2 2.00x; warrior ch3 1.50x; warrior ch4 1.33x; warrior ch5 1.75x; guardian ch2 2.00x; guardian ch3 1.50x; guardian ch4 1.33x; guardian ch5 1.75x; rogue ch2 2.00x; rogue ch3 1.50x; rogue ch4 1.33x; rogue ch5 1.50x; hunter ch2 2.00x; hunter ch3 1.50x; hunter ch4 1.33x; hunter ch5 1.75x; archer ch2 2.00x; archer ch3 1.50x; archer ch4 1.33x; archer ch5 1.75x; witch ch2 2.00x; witch ch3 1.50x; witch ch4 1.33x; witch ch5 1.75x; alchemist ch2 2.00x; alchemist ch3 1.50x; alchemist ch4 1.33x; alchemist ch5 1.75x | yes |
| class-spread | Every cumulative chapter median within ±15% of class median | warrior ch1 0.0%; guardian ch1 -33.3%; rogue ch1 0.0%; hunter ch1 0.0%; archer ch1 16.7%; witch ch1 16.7%; alchemist ch1 16.7%; warrior ch2 0.0%; guardian ch2 0.0%; rogue ch2 0.0%; hunter ch2 0.0%; archer ch2 0.0%; witch ch2 0.0%; alchemist ch2 0.0%; warrior ch3 not reached; guardian ch3 not reached; rogue ch3 not reached; hunter ch3 not reached; archer ch3 not reached; witch ch3 not reached; alchemist ch3 not reached; warrior ch4 not reached; guardian ch4 not reached; rogue ch4 not reached; hunter ch4 not reached; archer ch4 not reached; witch ch4 not reached; alchemist ch4 not reached; warrior ch5 not reached; guardian ch5 not reached; rogue ch5 not reached; hunter ch5 not reached; archer ch5 not reached; witch ch5 not reached; alchemist ch5 not reached | warrior ch1 0.0%; guardian ch1 0.0%; rogue ch1 0.0%; hunter ch1 0.0%; archer ch1 0.0%; witch ch1 0.0%; alchemist ch1 0.0%; warrior ch2 0.0%; guardian ch2 0.0%; rogue ch2 0.0%; hunter ch2 0.0%; archer ch2 0.0%; witch ch2 0.0%; alchemist ch2 0.0%; warrior ch3 0.0%; guardian ch3 0.0%; rogue ch3 0.0%; hunter ch3 0.0%; archer ch3 0.0%; witch ch3 0.0%; alchemist ch3 0.0%; warrior ch4 0.0%; guardian ch4 0.0%; rogue ch4 0.0%; hunter ch4 0.0%; archer ch4 0.0%; witch ch4 0.0%; alchemist ch4 0.0%; warrior ch5 0.0%; guardian ch5 0.0%; rogue ch5 -5.9%; hunter ch5 0.0%; archer ch5 0.0%; witch ch5 0.0%; alchemist ch5 0.0% | yes |
| chapter-bounds | Every chapter duration median 10–360 minutes | warrior ch1 60m; warrior ch2 1390m; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch1 40m; guardian ch2 1410m; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch1 60m; rogue ch2 1390m; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch1 60m; hunter ch2 1390m; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch1 70m; archer ch2 1380m; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch1 70m; witch ch2 1380m; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch1 70m; alchemist ch2 1380m; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached | warrior ch1 10m; warrior ch2 20m; warrior ch3 30m; warrior ch4 40m; warrior ch5 70m; guardian ch1 10m; guardian ch2 20m; guardian ch3 30m; guardian ch4 40m; guardian ch5 70m; rogue ch1 10m; rogue ch2 20m; rogue ch3 30m; rogue ch4 40m; rogue ch5 60m; hunter ch1 10m; hunter ch2 20m; hunter ch3 30m; hunter ch4 40m; hunter ch5 70m; archer ch1 10m; archer ch2 20m; archer ch3 30m; archer ch4 40m; archer ch5 70m; witch ch1 10m; witch ch2 20m; witch ch3 30m; witch ch4 40m; witch ch5 70m; alchemist ch1 10m; alchemist ch2 20m; alchemist ch3 30m; alchemist ch4 40m; alchemist ch5 70m | yes |
| never-stuck | No six-hour period without level, round, boss win or power gain | 0/140 runs stuck | 0/140 runs stuck | yes |
| craft-salvage-loss | Every recipe returns less weighted salvage value than cost | rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 | rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 | yes |

## Proposed changes

| path | current | proposed | why |
| --- | --- | --- | --- |
| cat.baseAtk | 10 | 52 | Raise starting damage so every class can clear the first frontier and boss at ten minutes. |
| cat.baseHp | 100 | 6000 | Give enough health for the longer late boss fights without widening class clear times. |
| cat.levelGrowth | 0.06 | 0.008 | Grow base stats by 0.8% per level instead of 6% so later chapters keep getting longer. |
| monster.hpGrowth | 1.13 | 1.111 | Grow monster health by 11.1% per stage instead of 13% to keep the last chapter under six hours. |
| monster.atkGrowth | 1.12 | 1.01 | Grow monster damage by 1% per stage instead of 12% so long fights remain survivable. |
| idle.dailyKeys | 1 | 5 | Grant enough daily keys for all five first clears without waiting for another day. |
| idle.walkTimeMs | 1000 | 6000 | Spend six seconds walking between monsters so class attack speed has less effect on chapter times. |
| boss.maxMs | 60000 | 1200000 | Allow up to twenty minutes per boss fight so later clears are not blocked by the one-minute timeout. |

## Per-class times (proposed)

Median minutes, cumulative since start.

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 10 | 30 | 60 | 100 | 170 | 30 | 90 |
| guardian | 10 | 30 | 60 | 100 | 170 | 30 | 100 |
| rogue | 10 | 30 | 60 | 100 | 160 | 30 | 90 |
| hunter | 10 | 30 | 60 | 100 | 170 | 30 | 95 |
| archer | 10 | 30 | 60 | 100 | 170 | 30 | 100 |
| witch | 10 | 30 | 60 | 100 | 170 | 30 | 100 |
| alchemist | 10 | 30 | 60 | 100 | 170 | 30 | 100 |

## Per-class times (current)

Median minutes, cumulative since start.

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 60 | 1450 | not reached | not reached | not reached | 30 | 100 |
| guardian | 40 | 1450 | not reached | not reached | not reached | 30 | 100 |
| rogue | 60 | 1450 | not reached | not reached | not reached | 30 | 100 |
| hunter | 60 | 1450 | not reached | not reached | not reached | 30 | 100 |
| archer | 70 | 1450 | not reached | not reached | not reached | 30 | 110 |
| witch | 70 | 1450 | not reached | not reached | not reached | 30 | 110 |
| alchemist | 70 | 1450 | not reached | not reached | not reached | 30 | 110 |

## Not overridable

No V2_CONFIG paths are copied at module load. All its leaves are read at call time. Content-derived captures cannot be supplied as config overrides (unknown paths are refused before mutation):

- MATERIALS.*.maxStack (STACK_CAPS_V2 and CAT_KEY_CAP)
- CHEST_SCALING.* (CHESTS)
- content registries (combat/bag/idle lookup maps)

## Content changes suggested (words only, if any)

No content changes are required to pass the stated targets. For a different gameplay feel, consider increasing later chapters' killsPerRound and reducing the boss HP archetype multiplier in a separately approved content task, then re-run the simulation. This could preserve increasing chapter times while shortening boss fights; exact values are not proposed or validated here.

The eight edits below are the smallest successful set found in this search: removing any one fails at least one target in the three-seed matrix. This establishes local necessity, not a proof of the global minimum across every possible configuration. The successful set was also verified on twenty seeds per class.

**Sign-off tradeoff:** starting HP rises from 100 to 6,000, level stat growth falls from 6% to 0.8%, walking grows from one to six seconds, and the boss timeout rises from one to twenty minutes. These are substantial gameplay changes. Passing timing targets does not validate combat feel. The requested active-minute metric counts claim steps and excludes boss animation duration, so actual wall-clock completion can take longer than the tables.

## How to apply

After sign-off, copy PROPOSED_V2_OVERRIDES into v2/config.ts by editing these exact leaves (do not replace the whole config):

- cat.baseAtk: 10 → 52
- cat.baseHp: 100 → 6000
- cat.levelGrowth: 0.06 → 0.008
- monster.hpGrowth: 1.13 → 1.111
- monster.atkGrowth: 1.12 → 1.01
- idle.dailyKeys: 1 → 5
- idle.walkTimeMs: 1000 → 6000
- boss.maxMs: 60000 → 1200000

## Method and limits

Claims use computeClaimV2 with offline=false. Its inherited v1 five-minute online window still discounts the second half of a ten-minute claim to 50%; thus a ten-minute step credits 7.5 minutes of combat. No v1 setting is changed. Loss cooldown runs on simulated seconds, with retries on the next eligible claim boundary. Craft previews use the deterministic next roll for each slot; newly crafted gear equips on the next step. Boss fights occur at step boundaries and their animation duration is not added to active time. Chest fallback uses rollLoot(CHESTS, table), then idle gearDrop's slot, smart weapon, chapter catalog, stage level and bonus-line rules, restricted to the chest's main/accessory group.

Craft/salvage weights: Fish 1, Yarn 10, Fluff Tuft 100, Shiny Button 200, Catnip Crystal 300, Starlight Scale 400 (100 times tier number). Moon Pearl and Cat Key have no recipe/salvage cost. Check crafts every recipe with the production craft helper before salvaging.

## Sign-off

User: ____ (approved / changes)
