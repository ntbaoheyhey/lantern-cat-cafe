# TBH systems, summarised in our own words

Source: third-party site snapshot (see `overview.md`). Numbers below are observations from that site, not verified against the game. Labels: **S** = site states it, **M** = site measured it, **I** = inferred/derived by us. No wording, art or names are meant to be reused; entity names are kept here only so a reader can find them in the source.

## 1. Heroes and progression

- 6 classes, each with 6 active skills and about 16 passives. Active skills unlock at staggered hero levels (the Knight page shows unlock labels at levels 1, 10, 20, 30 and 40).
- Hero level cap 90 with a skill point per level. The skill tree is gated by points spent: columns unlock at 0, 10, 20, ... 70 points spent. Each node has a max rank (3 to 10; actives max Lv5). (S)
- Base stat spread (level 1, no gear), showing each class has a distinct identity:

| Class | Atk Dmg | Atk Speed | Crit % | Crit Dmg | HP | Armor | Move |
|---|---|---|---|---|---|---|---|
| Knight (tank melee) | 2 | 0.80 | 2.5 | 140% | 130 | 45 | 950 |
| Ranger (fast bow) | 1 | 1.00 | 4.0 | 150% | 60 | 8 | 850 |
| Sorcerer (glass cannon) | 2 | 0.50 | 5.0 | 165% | 50 | 5 | 770 |
| Priest (support) | 1 | 0.80 | 2.0 | 140% | 95 | 30 | 770 |
| Hunter (burst) | 2 | 0.55 | 4.5 | 155% | 70 | 15 | 850 |
| Slayer (bruiser) | 2 | 0.55 | 2.5 | 180% | 115 | 40 | 900 |

Cast speed baseline 1.00 and cooldown reduction 0% for all.

## 2. Damage and stat model (S, "verified")

- DPS = AttackDamage x AttackSpeed x (1 + Crit% x (CritDmg - 1)) x (1 + Dmg%).
- Stat stacking: result = (base + flat) x (1 + sum of ADDITIVE %) x product of each MULTIPLICATIVE %. Additive bonuses of the same kind share one pool; a different "layer" (element, delivery type) multiplies on top. Multiplicative rolls exist only on some gear lines (attack/cast speed).
- Cooldowns: effective CD = base x (1 - CDR); cast time = animation / cast speed; casts per minute = 60 / (CD + cast time).
- Caps: cooldown reduction, dodge, block (+ elemental versions), elemental resist: 75%. Armor 85% melee / 75% ranged. Crit chance 100%. Attack/cast/move speed, AoE: uncapped. Several caps can be raised by a separate "Max ..." stat.
- Skill triggers differ: timer (cooldown) skills benefit from cast speed; "every N attacks" skills benefit from attack speed. Wind-up and recovery are fixed; only the action phase scales (I from simulator).

## 3. Skills

36 active skills (6 per hero). Typical shape: trigger (cooldown s or every-N-attacks), damage as a percent of attack (e.g. 150% to 300%), delivery tags (MELEE / AREA / RANGED), max rank 5, a few buffs/shields/revive ("once per stage, revive at 30% HP"). Some skills deliberately reuse animation assets. Clips are 8 s each with no audio.

## 4. Stages, monsters, scaling

- Acts of about 9 stages each (the 120 main stage states are 30 stages x 4 difficulties), 4 difficulties (Normal, Nightmare, Hell, Torment), plus a late "Plaguelands" area with its own gauge. 180 unique stage states captured. 77 monsters with element tag (physical, fire...), HP, gold, exp.
- Reward/scale formulas (S): monster gold = base gold x stage-level multiplier / 100. Boss HP/damage/gold = base x per-stage boss multiplier / 1000 x global stage-level multiplier / 100. So there are two multiplier tables: per-stage and per-stage-level.
- Offline rewards: a per-stage-level table of gold/exp per clear and a kill/clear target pace, e.g. level 1: 1 gold, 1 exp, 180 kills in 20 s; level 50: 148 gold, 2,640 exp, 3,080 kills in 10 s. Rewards grow roughly 150x in gold across 50 levels, with plateaus then jumps (levels 21-27 flat at 28 gold, level 28 jumps to 56).
- Plaguelands gauge: drains 1 per 60 s inside, refills 1 per 360 s outside, ceiling 500, minimum 30 to enter; wall-clock even offline. (M)

## 5. Loot and chests

- Drop key per stage; each item group has a weight; chance = weight / sum of weights in its hero-condition bucket (hero-locked items only compete with their own class).
- Three chest families: Monster Box, Stage Boss Box, Act Boss Box. Grades: Common, Uncommon, Rare, Legendary, Immortal, Arcana, Beyond, Celestial, Divine, Cosmic (10).
- Example expected grade split for the lowest monster box: 78.0% Common, 20.6% Uncommon, 1.4% Rare.
- A single global chest cooldown: while any chest is on cooldown you can obtain no chest (2 to 4 minutes by chest level, measured from 3,064 cycles). Act Boss chests have no cooldown. (M)
- The simulator tracks "rolls since last Rare+" and "best drop this session"; a drop feed. These are presentation ideas.

## 6. Grades and the Cube (crafting hub)

Grade table (S):

| Grade | Inherent stat slots | Alchemy gold | Cube EXP |
|---|---|---|---|
| Common | 0 | 10 | 2 |
| Uncommon | 1 | 30 | 6 |
| Rare | 1 | 90 | 18 |
| Legendary | 2 | 270 | 54 |
| Immortal | 2 | 810 | 162 |
| Arcana | 3 | 2,592 | 518 |
| Beyond | 3 | 8,294 | 1,658 |
| Celestial | 3 | 29,029 | 5,803 |
| Divine | 3 | 101,602 | 20,311 |
| Cosmic | 3 | 355,607 | 71,089 |

Observation (I): values triple per grade early (x3), then the ratio rises to about x3.2 then x3.5. Decoration, engraving, inscription sockets unlock progressively with grade (0 up to 2/2/2).

The Cube has its own level track fed by everything melted, fused or offered. It unlocks operations by Cube level, each with a one-time gold fee:

| Operation | Unlock | Fee | What it does |
|---|---|---|---|
| Synthesis | default | free | 9 same-grade, same-category items become one |
| Alchemy | Lv1 | 10 | melt for gold |
| Crafting | Lv5 | 100 | pick a slot, spend materials, get a random item at that tier |
| Decoration | Lv8 | 300 | adds a first socket layer (not examined in detail) |
| Extraction | Lv10 | 1,000 | not examined in detail |
| Offering | Lv10 | 3,000 | spend an anniversary coin + gold for one random item |
| Attunement | Lv10 | free | reroll relic socket colours / relic stat range for gold, cost rising per try |
| Engraving | Lv15 | 1,000 | second socket layer (not examined in detail) |
| Inscription | Lv25 | 10,000 | third socket layer (not examined in detail) |
| Corrosion | Lv30 | 10,000 | not examined in detail (also pushes the Plaguelands gauge above 500) |

Synthesis odds (S): below Immortal always grades up. 9 Common gives 95.24% Uncommon and 4.76% Rare ("great success"); 9 Uncommon 96.15% / 3.85%; 9 Rare 97.56% / 2.44%; 9 Legendary 99.01% / 0.99%. From Immortal a "same grade" result appears: Immortal 19.75% same, 80% up, 0.25% double; Arcana 49.83% same; Beyond 76.86% same; Celestial 83.32%; Divine 90.91%. Note our own Forge already has a "great success" idea (see `forge-great-success.md`), so the concept matches.

## 7. Relics, reliquaries, resonance (patch 1.3.0)

- Reliquaries (382) are party-wide containers with coloured sockets; Relics (360) fit into sockets. Everything applies to the whole party. 5 relic colours (red, blue, gold, purple, white).
- Resonance (63 effects): equip enough relics of listed colours and a party-wide effect turns on (e.g. cooldown reduction +5 to 9%, "first attack skill of each party member is guaranteed to crit", trap-duplication chance). Some relics count as two for the condition.
- Obtained only by offering "contaminated" versions at the Cube; offering returns the same grade or higher with a steep ladder (Common+ offer: 64% Common, 25% Uncommon, 7.5% Rare, 2.1% Legendary, 0.7% Immortal, 0.14% Arcana, then fractions of a percent). Reliquary items from offering are untradable.

## 8. Meta layers

- Rune tree: account-wide, 197 nodes in three branches (Battle, Exploration, Reward), each level with a gold cost (millions to hundreds of millions at the Plague nodes) and a stat bonus.
- Pets: 10 passive-bonus companions unlocked by kill counts (e.g. defeat 5,000 of one monster type), bonuses like +10% common chest drop, +15% exp, +15% gold per kill.
- Achievements with global unlock rates; mailbox; a "trade ship"; a seasonal event; roadmap; patch notes.
- Tools on the site: damage calculator, drop finder, farming/chest optimizer, BiS finder, compare, rune planner, cube-exp calculator.
