# ORIG1: the lamplit patrol economy

Status: local balance preview, default **OFF**, 2026-11-02. The authoritative
tables are `CONFIG.originalEconomy` in `packages/game-rules/src/config.ts`.
`CONFIG.features.originalEconomy` is false. The exported
`createOriginalEconomyPreview({ enabled: true })` provides pure calculations for
review and tests. It has no inventory, persistence, random roll, purchase, HTTP,
or production combat entry point. Calling it cannot activate a server feature.

## Why these choices

The inputs are the original paraphrases in
[stats](../../reports/reference-notes/stats.md),
[items](../../reports/reference-notes/items.md), and
[skills](../../reports/reference-notes/skills-runes.md). We used their separation
of units, conditional loot probabilities, and skill trigger types. We did not
transfer their entity records or reconstruct their large progression tree.

Our existing game uses fish, nine gear slots, seven weapon families and five
gear qualities. This draft fits those categories. The cloth, attic and evening
patrol vocabulary below was written for Taskbar Hero. Stable stat, slot,
weapon and rarity keys remain technical identifiers; none are renamed in
saved data. Draft item and skill keys are local catalogue keys, not entitlements.

The comparison baseline is our current v2: 100 HP, 10 attack, 5 defense;
7% linear item growth; quality multipliers from 1 to 3.2; 2% gear chance;
and a 70/20/8/1.8/0.2 conditional quality split. This draft raises early survival
and hit strength, compresses gear growth to six levels and 1–2.45 quality
scaling, and offers slightly more frequent gear with a broader middle.
These are independent choices for a short demo economy. Existing live values
remain authoritative until an independently reviewed rollout.

## Stat table

Fraction values use 0.01 = 1%. Add equipped bonuses to the base, then clamp
each capped stat. Flat stats have no artificial cap in this draft. Item scaling
does not round fractional bonuses. Attack interval is `1250 / (1 + attackSpeed)`
milliseconds. A critical hit multiplies by `1 + critDamage`; ordinary expected
hit strength is `atk * (1 + critChance * critDamage)` before defense.
Incoming damage is `max(1, attack * 90 / (90 + defense))`. Defense is a rating,
so 90 halves incoming damage and 180 reduces it to one third. No elemental,
area, projectile, or cooldown-reduction stats are introduced.

| Key | Original label | Base | Cap | Unit | Description |
| --- | --- | ---: | ---: | --- | --- |
| hp | Ninefold Stamina | 116 | none | points | How much punishment a cat can carry before resting. |
| atk | Pawprint Force | 12 | none | points | The starting strength of one landed hit. |
| def | Quiltguard | 7 | none | rating | Padding that softens each incoming hit. |
| attackSpeed | Quickstep Rhythm | 0 | 0.65 | fraction | Shortens the pause between ordinary attacks. |
| critChance | Glint Focus | 0.035 | 0.42 | probability | The share of hits that find a bright opening. |
| critDamage | Flare Payoff | 0.55 | 1.1 | fraction | Extra damage above a normal hit when an opening is found. |
| dodge | Threadstep | 0.02 | 0.28 | probability | The chance to slip entirely past an incoming hit. |
| hpRegen | Purr Reserve | 0 | 0.012 | fraction/second | The fraction of full stamina restored each second. |
| fishBonus | Pantry Yield | 0 | 0.24 | fraction | Adds a share to fish earned from encounters. |
| xpBonus | Trail Memory | 0 | 0.2 | fraction | Adds a share to experience earned from encounters. |
| materialFind | Pocket Scouting | 0 | 0.18 | fraction | Raises material roll chances without changing gear quality. |
| bossDamage | Gate Pressure | 0 | 0.22 | fraction | Adds a share of damage against the chapter guardian. |

The 42% crit and 28% dodge ceilings reserve uncertainty in both directions.
The speed ceiling leaves at least 757.58 ms per basic attack. Passive healing
tops out at 1.2% HP per second. Reward bonuses cap below 25% to keep reward
gear from overwhelming combat gear. These caps apply even to stacked inputs.
XP, material and boss modifiers are declared for future integration; the
preview does not award XP/materials or simulate boss combat.

## Item and quality tables

All item rows are level-one bases before quality scaling. One equipped item
per slot; choose one of the seven weapon variants. Preview weapon attack is a
per-hit budget, not a claim of equal class DPS: existing class animations and
passives still require simulation before any activation. No random bonus
lines or sockets are included in this bounded first draft.

| Key | Original name | Slot | Weapon | Base stats | Description |
| --- | --- | --- | --- | --- | --- |
| seamblade | Seamlight Saber | weapon | sword | atk=7 | A curved edge with a stitched grip for steady patrols. |
| kettlemaul | Kettlebelly Maul | weapon | hammer | atk=9 | A hollow workshop head gives every swing a low note. |
| hemknives | Hemskip Twins | weapon | daggers | atk=5 | Two small blades nest neatly in a folded apron. |
| windowpike | Windowline Pike | weapon | spear | atk=7 | A long reach fashioned for narrow rooftop crossings. |
| rafterbow | Rafterstring Bow | weapon | bow | atk=6 | Its woven cord hums beneath the attic beams. |
| lanternrod | Lanternwake Rod | weapon | staff | atk=8 | A shaded lamp at the tip guides wandering sparks. |
| mossflasks | Mossfoam Bottles | weapon | flasks | atk=6 | Soft glass sleeves keep the bubbling cargo snug. |
| quiltcap | Quiltfold Cap | helmet | — | hp=10, def=2 | A padded brim catches dust from the rafters. |
| porchcoat | Porchlight Coat | armor | — | hp=22, def=4 | Broad patches keep the evening chill outside. |
| spoolmitts | Spoolgrip Mitts | gloves | — | hp=6, def=1 | Reinforced palms hold fast on wet window ledges. |
| eaveboots | Eaveskip Boots | boots | — | hp=8, def=1 | Quiet soles leave only a faint trail on the tiles. |
| chimecollar | Firstchime Collar | collar | — | critChance=0.014 | A tiny chime marks the start of each watch. |
| pantrystud | Pantrygleam Stud | earring | — | fishBonus=0.025 | A polished clasp recalls the promise of supper. |
| hemring | Hemturn Band | ring | — | attackSpeed=0.018 | A smooth loop keeps loose threads from catching. |
| purrcharm | Purrwell Token | charm | — | hpRegen=0.0015 | A warm keepsake settles against a tired heartbeat. |

| Stable gear quality | Original label | Stat multiplier | Fish cost multiplier | Conditional weight (bp) |
| --- | --- | ---: | ---: | ---: |
| common | Hearthmade | 1 | 1 | 6250 |
| uncommon | Trailstitched | 1.22 | 1.18 | 2520 |
| rare | Lamplit | 1.52 | 1.45 | 940 |
| epic | Aurorawoven | 1.95 | 1.85 | 250 |
| legendary | Daybreakbound | 2.45 | 2.3 | 40 |

The five weights total 10,000 basis points. They describe quality **after** a
gear result. They do not affect on-chain Relic names, token IDs or forge odds.
The level multiplier is `1 + 0.055 * (level - 1)`, for levels 1–6. Thus the
largest item has 3.12375 times its level-one common stats, below a 3.2x budget.

| Upgrade | Base fish cost |
| --- | ---: |
| 1 → 2 | 18 |
| 2 → 3 | 29 |
| 3 → 4 | 47 |
| 4 → 5 | 76 |
| 5 → 6 | 123 |

Multiply the base cost by the quality cost multiplier and round up once.
Level six has no next purchase (`null`, never a free upgrade). The increasing
steps give players an early choice and a longer saving goal without borrowing
the reference's account-tree price curve.

## Skill table

One skill belongs to each weapon family; three ranks each. Damage values are
attack multiples **per hit**. Healing values are shares of the user's max HP.
Every action targets one entity. Healing targets the user and is clipped to
missing HP by a future combat integration. All numbers below describe raw
output before mitigation; skill hits do not crit in this preview. These are
additional actions, not replacements for the attack that advances a counter.

| Key | Original name | Weapon | Trigger | Every | Effect | Hits | Rank 1 / 2 / 3 | Description |
| --- | --- | --- | --- | ---: | --- | ---: | --- | --- |
| seamsweep | Seamlight Sweep | sword | cooldown | 9000 | damage | 1 | 1.2 / 1.5 / 1.8 | Draw a bright seam across one nearby foe. |
| kettlepulse | Kettlefall Pulse | hammer | attacks | 7 | damage | 1 | 1.4 / 1.7 / 2 | Release the stored ring of seven deliberate swings. |
| hempair | Hemskip Pair | daggers | attacks | 9 | damage | 2 | 0.55 / 0.68 / 0.82 | Slip two quick cuts through the same opening. |
| windowthrust | Windowline Thrust | spear | cooldown | 11000 | damage | 1 | 1.65 / 1.95 / 2.3 | Place a measured jab beyond the nearest pawhold. |
| rafterecho | Rafter Echo | bow | attacks | 8 | damage | 2 | 0.6 / 0.75 / 0.9 | Send a second note along the path of the first arrow. |
| lanternarc | Lanternwake Arc | staff | cooldown | 12000 | damage | 1 | 1.9 / 2.2 / 2.6 | Gather a patient glow and spill it onto one foe. |
| mossparcel | Mossfoam Parcel | flasks | cooldown | 15000 | heal | 1 | 0.06 / 0.085 / 0.11 | Unwrap a cool poultice to mend your own scrapes. |

`Every` means elapsed milliseconds for `cooldown`, completed basic attack
actions for `attacks` (not individual hits of a multi-hit action). A new fight
starts with an empty counter and full cooldown; there is no free opening cast.
Attack speed advances attack counters faster but cannot shorten elapsed
cooldowns. The preview reports steady-state output, not an event simulation.
Each damage skill adds less than 30% of the neutral basic DPS at every rank;
the heal adds less than 1% HP per second. Weapon animation, overkill and fight
length will reduce or change actual value, so this is a tuning bound only.

| Rank purchased | Minimum character level | Incremental fish cost |
| --- | ---: | ---: |
| 1 | 2 | 24 |
| 2 | 5 | 58 |
| 3 | 9 | 126 |

The total three-rank price is 208 fish. Ranks must be bought in order by any
future authoritative purchase handler. The local `skillCost` helper checks
the level gate only; it neither checks ownership nor spends currency. A skill
effect can be inspected before purchase. No account-wide runes are activated.

## Economy benchmark and verification

| Lever | Value | Unit |
| --- | ---: | --- |
| fishPerSecond | 0.42 | fish/second |
| killIntervalSeconds | 6 | seconds/kill |
| gearDropChance | 0.028 | probability/kill |
| offlineEfficiency | 0.55 | reward fraction |
| offlineCapSeconds | 21600 | seconds |

This fixed early-loop income fixture is for comparisons, not measured live
income and not a replacement for stage-specific loot. Ten active minutes yield
252 fish and 2.8 expected gear items. The first upgrade plus first skill rank
costs 42 fish, or 100 seconds once level two is reached. One common item needs
293 fish to reach level six, about 11.63 minutes. All three skill ranks cost
about 8.25 minutes of income, excluding level-gate time. These are alternative
spending choices; acquiring both takes their combined budget.

Top-quality gear is 0.4% of gear results: `0.028 * 0.004 = 0.000112` per kill
(0.0112%), not a guaranteed drop. The six-hour offline cap is applied before
55% efficiency: 4,989.6 fish and 55.44 expected gear results before capacity or
integer roll handling. Expectations may be fractional and do not grant items.
Fish bonuses scale fish only; material scouting cannot change gear weights.
The shorter cap and partial yield keep offline play useful without replacing
the active demo loop. No pity system is implied.

Run `pnpm --filter @taskbar-hero/game-rules test` for the cap, coverage, upgrade,
trigger, probability conservation, affordability, invalid-input and docs-sync
tests. These are analytical unit checks, not a claim of live balance or a
complete class simulator. Full activation needs class/animation simulation,
server/client parity, sequential purchase validation, inventory capacity and
integer reward rules. It is outside ORIG1. Rollback today is leaving the local
flag false; there are no migrations, deployments or saved-data changes to undo.

Originality validation compares the authored labels and prose against the
reference notes and the supplied archive in memory, plus the inherited
source-name and normalized prose scan. Generic mechanic identifiers are kept.
No images, audio or generated art were created; no asset provenance entry is
needed for these code and prose tables.
