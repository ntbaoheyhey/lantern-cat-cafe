# I automatic-battle equipment balance
REFERENCE: PLAN.md, ../sim/gear-complete-before.json, ../sim/gear-after-train.json, ../sim/gear-after-heldout.json

Main-stat values use 75% of their previous values. Affix ranges use 25%, rounded to integers with a floor of one. Existing saved rolls are read within the current range in combat and the equipment panel. The original roll remains in the save.

Selection used training seeds only. Main-only probes and seven combined probes remain under ../sim/gear-pilot-*.json. The selected candidate keeps the starter weapon’s first enhancement positive under the existing 6% formula and meets the proposed single-piece display-power ceiling. Heldout seeds were opened after selecting these values.

## Full campaign outcomes
REFERENCE: ../sim/gear-complete-before.json, ../sim/gear-after-train.json, ../sim/gear-after-heldout.json

Each cell contains wins out of 50 complete routes. Training uses seeds 1–50. Heldout uses 10001–10050. Level, stars, equipment and route policy are recorded in each receipt.

| Sample | Level | Chapter | Bare | Common | Rare | Epic | Legendary |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Before | 1 | 1 | 3/50 | 44/50 | 50/50 | 50/50 | 50/50 |
| Before | 1 | 2 | 28/50 | 49/50 | 50/50 | 50/50 | 50/50 |
| Before | 1 | 3 | 33/50 | 46/50 | 50/50 | 50/50 | 50/50 |
| Before | 6 | 1 | 49/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| Before | 6 | 2 | 49/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| Before | 6 | 3 | 50/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| After training | 1 | 1 | 3/50 | 32/50 | 46/50 | 50/50 | 50/50 |
| After training | 1 | 2 | 28/50 | 49/50 | 49/50 | 50/50 | 50/50 |
| After training | 1 | 3 | 33/50 | 41/50 | 48/50 | 50/50 | 50/50 |
| After training | 6 | 1 | 49/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| After training | 6 | 2 | 49/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| After training | 6 | 3 | 50/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| After heldout | 1 | 1 | 0/50 | 30/50 | 42/50 | 50/50 | 50/50 |
| After heldout | 1 | 2 | 29/50 | 47/50 | 49/50 | 50/50 | 50/50 |
| After heldout | 1 | 3 | 25/50 | 47/50 | 49/50 | 50/50 | 50/50 |
| After heldout | 6 | 1 | 49/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| After heldout | 6 | 2 | 49/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| After heldout | 6 | 3 | 50/50 | 50/50 | 50/50 | 50/50 | 50/50 |

21/48 adjacent tier steps increase sampled wins. 27 tie and 0 decline. The all-tier meaningful-increase gate remains open wherever the table ties, declines or reaches its ceiling.

## Single-piece power and actual boss outcomes
REFERENCE: ../sim/gear-complete-before.json, ../sim/gear-after-train.json, ../sim/gear-after-heldout.json

| Sample | Maximum contribution | Template | Enhancement |
| --- | ---: | --- | ---: |
| before | 15.22% | hearthloom-weapon-legendary | +12 |
| train | 9.63% | hearthloom-weapon-legendary | +12 |
| held | 9.63% | hearthloom-weapon-legendary | +12 |

The 10% criterion applies to the added share of displayed power on a bare level-1 starter team, at +0 and +12 with the strongest compatible affix rolls. The score is HP/5 + 2×ATK + 1.5×DEF, rounded per cat. Paired boss fights separately measure utility.

| Sample | Largest single-piece win increase | Item / wearer | Level / chapter | Boss wins before → after |
| --- | ---: | --- | --- | --- |
| before | 52.00 pp | moonwick-weapon-legendary / soot | 1 / 1 | 0/50 → 26/50 |
| train | 22.00 pp | crumbweave-charm-legendary / soot | 1 / 3 | 32/50 → 43/50 |
| held | 34.00 pp | moonwick-weapon-legendary / soot | 1 / 2 | 21/50 → 38/50 |

## Set and companion spreads
REFERENCE: ../sim/gear-after-train.json, ../sim/gear-after-heldout.json

| Sample | Level | Chapter | Lowest set win rate | Highest set win rate | Sets at 100% |
| --- | ---: | ---: | ---: | ---: | ---: |
| before | 1 | 1 | 100.00% | 100.00% | 8/8 |
| before | 1 | 2 | 100.00% | 100.00% | 8/8 |
| before | 1 | 3 | 100.00% | 100.00% | 8/8 |
| before | 6 | 1 | 100.00% | 100.00% | 8/8 |
| before | 6 | 2 | 100.00% | 100.00% | 8/8 |
| before | 6 | 3 | 100.00% | 100.00% | 8/8 |
| train | 1 | 1 | 98.00% | 100.00% | 7/8 |
| train | 1 | 2 | 100.00% | 100.00% | 8/8 |
| train | 1 | 3 | 96.00% | 100.00% | 7/8 |
| train | 6 | 1 | 100.00% | 100.00% | 8/8 |
| train | 6 | 2 | 100.00% | 100.00% | 8/8 |
| train | 6 | 3 | 100.00% | 100.00% | 8/8 |
| held | 1 | 1 | 94.00% | 100.00% | 6/8 |
| held | 1 | 2 | 100.00% | 100.00% | 8/8 |
| held | 1 | 3 | 98.00% | 100.00% | 6/8 |
| held | 6 | 1 | 100.00% | 100.00% | 8/8 |
| held | 6 | 2 | 100.00% | 100.00% | 8/8 |
| held | 6 | 3 | 100.00% | 100.00% | 8/8 |

Companion participation covers all 220 distinct teams, three bosses and 20 seeds per team. These bare level-6 fixtures describe team context. The item adjustment leaves their inputs equal between before and training.

| Companion | Training wins / fights | Heldout wins / fights |
| --- | ---: | ---: |
| mochi | 3081/3300 (93.36%) | 3090/3300 (93.64%) |
| soot | 3175/3300 (96.21%) | 3168/3300 (96.00%) |
| clover | 2810/3300 (85.15%) | 2794/3300 (84.67%) |
| panko | 3118/3300 (94.48%) | 3126/3300 (94.73%) |
| mallow | 3183/3300 (96.45%) | 3213/3300 (97.36%) |
| sorrel | 2792/3300 (84.61%) | 2797/3300 (84.76%) |
| biscuit | 3220/3300 (97.58%) | 3241/3300 (98.21%) |
| inkcap | 3164/3300 (95.88%) | 3180/3300 (96.36%) |
| cinnamon | 2848/3300 (86.30%) | 2867/3300 (86.88%) |
| brioche | 2962/3300 (89.76%) | 2949/3300 (89.36%) |
| velvet | 3228/3300 (97.82%) | 3223/3300 (97.67%) |
| marigold | 3076/3300 (93.21%) | 3042/3300 (92.18%) |

## 45-day earned economy
REFERENCE: ../sim/economy-before.json, ../sim/economy-after.json

| Earned measure | Before heavy/casual | After heavy/casual | ≤3× |
| --- | ---: | ---: | --- |
| pulls | 1.0000× | 1.0000× | PASS |
| fish | 1.7713× | 1.7773× | PASS |
| threads | 1.8820× | 1.8880× | PASS |
| stamps | 1.0000× | 1.0000× | PASS |
| essence | 2.1658× | 2.1776× | PASS |

| Cohort | All 12 cards by day 45 | Card collection | Gear-template collection | Awakening ranks |
| --- | ---: | ---: | ---: | ---: |
| casual | 0/30 accounts | 83.06% | 59.24% | 2.97 |
| regular | 0/30 accounts | 83.06% | 75.81% | 5.53 |
| heavy | 0/30 accounts | 83.06% | 76.17% | 5.67 |
