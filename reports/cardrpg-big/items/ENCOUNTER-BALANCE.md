# I encounter balance with equipment
REFERENCE: PLAN.md, ../sim/gear-after-train.json, ../sim/gear-encounter-train.json, ../sim/gear-encounter-heldout.json

Main-stat values use 75% of their previous values. Affix ranges use 25%, rounded to integers with a floor of one. Existing saved rolls are read within the current range in combat and the equipment panel. The original roll remains in the save.

Selection used training seeds only. Main-only probes and seven combined probes remain under ../sim/gear-pilot-*.json. The selected candidate keeps the starter weapon’s first enhancement positive under the existing 6% formula and meets the proposed single-piece display-power ceiling. Enemy values come from the frozen pilot-five-b candidate. See ENCOUNTERS.md for the separate duration holdout and existing-knob table.

## Full campaign outcomes
REFERENCE: ../sim/gear-after-train.json, ../sim/gear-encounter-train.json, ../sim/gear-encounter-heldout.json

Each cell contains wins out of 50 complete routes. Training uses seeds 1–50. Heldout uses 10001–10050. Level, stars, equipment and route policy are recorded in each receipt.

| Sample | Level | Chapter | Bare | Common | Rare | Epic | Legendary |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Before | 1 | 1 | 3/50 | 32/50 | 46/50 | 50/50 | 50/50 |
| Before | 1 | 2 | 28/50 | 49/50 | 49/50 | 50/50 | 50/50 |
| Before | 1 | 3 | 33/50 | 41/50 | 48/50 | 50/50 | 50/50 |
| Before | 6 | 1 | 49/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| Before | 6 | 2 | 49/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| Before | 6 | 3 | 50/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| After training | 1 | 1 | 4/50 | 38/50 | 45/50 | 47/50 | 50/50 |
| After training | 1 | 2 | 2/50 | 17/50 | 32/50 | 36/50 | 50/50 |
| After training | 1 | 3 | 1/50 | 10/50 | 15/50 | 37/50 | 50/50 |
| After training | 6 | 1 | 50/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| After training | 6 | 2 | 29/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| After training | 6 | 3 | 50/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| After heldout | 1 | 1 | 0/50 | 33/50 | 40/50 | 48/50 | 50/50 |
| After heldout | 1 | 2 | 0/50 | 16/50 | 29/50 | 41/50 | 50/50 |
| After heldout | 1 | 3 | 0/50 | 4/50 | 11/50 | 33/50 | 49/50 |
| After heldout | 6 | 1 | 50/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| After heldout | 6 | 2 | 29/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| After heldout | 6 | 3 | 50/50 | 50/50 | 50/50 | 50/50 | 50/50 |

26/48 adjacent tier steps increase sampled wins. 22 tie and 0 decline. The all-tier meaningful-increase gate remains open wherever the table ties, declines or reaches its ceiling.

## Single-piece power and actual boss outcomes
REFERENCE: ../sim/gear-after-train.json, ../sim/gear-encounter-train.json, ../sim/gear-encounter-heldout.json

| Sample | Maximum contribution | Template | Enhancement |
| --- | ---: | --- | ---: |
| before | 9.63% | hearthloom-weapon-legendary | +12 |
| train | 9.63% | hearthloom-weapon-legendary | +12 |
| held | 9.63% | hearthloom-weapon-legendary | +12 |

The 10% criterion applies to the added share of displayed power on a bare level-1 starter team, at +0 and +12 with the strongest compatible affix rolls. The score is HP/5 + 2×ATK + 1.5×DEF, rounded per cat. Paired boss fights separately measure utility.

| Sample | Largest single-piece win increase | Item / wearer | Level / chapter | Boss wins before → after |
| --- | ---: | --- | --- | --- |
| before | 22.00 pp | crumbweave-charm-legendary / soot | 1 / 3 | 32/50 → 43/50 |
| train | 42.00 pp | moonwick-weapon-legendary / mochi | 6 / 2 | 27/50 → 48/50 |
| held | 34.00 pp | emberfelt-weapon-legendary / soot | 6 / 2 | 26/50 → 43/50 |

## Set and companion spreads
REFERENCE: ../sim/gear-encounter-train.json, ../sim/gear-encounter-heldout.json

| Sample | Level | Chapter | Lowest set win rate | Highest set win rate | Sets at 100% |
| --- | ---: | ---: | ---: | ---: | ---: |
| before | 1 | 1 | 98.00% | 100.00% | 7/8 |
| before | 1 | 2 | 100.00% | 100.00% | 8/8 |
| before | 1 | 3 | 96.00% | 100.00% | 7/8 |
| before | 6 | 1 | 100.00% | 100.00% | 8/8 |
| before | 6 | 2 | 100.00% | 100.00% | 8/8 |
| before | 6 | 3 | 100.00% | 100.00% | 8/8 |
| train | 1 | 1 | 64.00% | 98.00% | 0/8 |
| train | 1 | 2 | 22.00% | 90.00% | 0/8 |
| train | 1 | 3 | 18.00% | 90.00% | 0/8 |
| train | 6 | 1 | 100.00% | 100.00% | 8/8 |
| train | 6 | 2 | 100.00% | 100.00% | 8/8 |
| train | 6 | 3 | 100.00% | 100.00% | 8/8 |
| held | 1 | 1 | 56.00% | 98.00% | 0/8 |
| held | 1 | 2 | 18.00% | 88.00% | 0/8 |
| held | 1 | 3 | 8.00% | 92.00% | 0/8 |
| held | 6 | 1 | 100.00% | 100.00% | 8/8 |
| held | 6 | 2 | 100.00% | 100.00% | 8/8 |
| held | 6 | 3 | 100.00% | 100.00% | 8/8 |

Companion participation covers all 220 distinct teams, three bosses and 20 seeds per team. These bare level-6 fixtures describe team context. The enemy adjustment changes the boss inputs. Enemy-stat snapshots preserve earlier saves and replays.

| Companion | Training wins / fights | Heldout wins / fights |
| --- | ---: | ---: |
| mochi | 2174/3300 (65.88%) | 2198/3300 (66.61%) |
| soot | 2103/3300 (63.73%) | 2077/3300 (62.94%) |
| clover | 2062/3300 (62.48%) | 2043/3300 (61.91%) |
| panko | 2307/3300 (69.91%) | 2283/3300 (69.18%) |
| mallow | 2240/3300 (67.88%) | 2234/3300 (67.70%) |
| sorrel | 1617/3300 (49.00%) | 1622/3300 (49.15%) |
| biscuit | 2215/3300 (67.12%) | 2216/3300 (67.15%) |
| inkcap | 2786/3300 (84.42%) | 2764/3300 (83.76%) |
| cinnamon | 1908/3300 (57.82%) | 1918/3300 (58.12%) |
| brioche | 2149/3300 (65.12%) | 2118/3300 (64.18%) |
| velvet | 2452/3300 (74.30%) | 2443/3300 (74.03%) |
| marigold | 2585/3300 (78.33%) | 2595/3300 (78.64%) |

## 45-day earned economy
REFERENCE: ../sim/economy-after.json, ../sim/economy-encounter.json

| Earned measure | Before heavy/casual | After heavy/casual | ≤3× |
| --- | ---: | ---: | --- |
| pulls | 1.0000× | 1.0000× | PASS |
| fish | 1.7773× | 1.8083× | PASS |
| threads | 1.8880× | 1.9178× | PASS |
| stamps | 1.0000× | 1.0000× | PASS |
| essence | 2.1776× | 2.1948× | PASS |

| Cohort | All 12 cards by day 45 | Card collection | Gear-template collection | Awakening ranks |
| --- | ---: | ---: | ---: | ---: |
| casual | 0/30 accounts | 83.06% | 58.02% | 3.00 |
| regular | 0/30 accounts | 83.06% | 75.16% | 5.63 |
| heavy | 0/30 accounts | 83.06% | 75.44% | 5.67 |
