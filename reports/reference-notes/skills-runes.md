# Skills and persistent account upgrades

Evidence: archived `skill-trees-all-heroes.json`, `cast-cases.json`,
`cast-skill-timing.csv`, `cast-speed-tests.json`,
`pages/wiki__runes.json`, `pages/runes-expanded.json`,
`pages/wiki__rune-planner.json`, and rune rows in `wiki-table-rows.csv`.
Live checks: [skills](https://tbhindex.com/wiki/skills) and
[account tree](https://tbhindex.com/wiki/runes), 2026-11-02.

## Skill structure and timing ranges

Character-specific trees mix passive stat purchases with triggered actions.
Progression gates use level or points already spent; purchasing a node's
rank is a different decision from unlocking its tier. Captured node rank
limits span 3–10. Actions commonly stop around the middle of that range.

Triggers include elapsed cooldowns, repeated basic attacks, and exceptional
stage-limited effects. The readable repeated-attack examples span 4–13
attacks between triggers; cooldown examples span 4–50 seconds.
Damaging actions use an attack-related multiplier and may strike repeatedly,
cover an area, launch projectiles, or create a persistent attacker.
Healing, shielding, temporary buffs, and recovery from defeat need their
own event conditions rather than a damage-only schema.

Explicit element-tagged damage mentions in the tree sample span roughly
0.5–6.2 times attack per stated hit or event. Hit count, target count,
duration, and damage type differ, so this band is not a ranking of total
skill strength. Other percentages describe healing or buffs and were
excluded from this damage band.

The captured timing export spans about 0.48–1.9 seconds of baseline
animation. It distinguishes attack-driven from cast-driven actions.
Descriptions do not establish whether cooldown and animation overlap in
every case. Wind-up, active frames, recovery, trigger progress, and scheduler
priority must remain separate when interpreting throughput.

The earlier proposal inferred that only part of an animation scales with
speed. This task did not execute the simulator or measure the native game,
so that inference is not promoted to a verified engine rule. A displayed
cycle time is not enough to recreate an action scheduler.

## Account-tree structure and costs

This tree belongs to the account and persists across character choices.
Its branches broadly improve combat capability, exploration capacity, and
resource return. A node has prerequisites, a maximum rank, a price for each
purchase, and an incremental effect; similarly named nodes may still be
different nodes. Use identity and dependency relationships, not display text.

The archive contains conflicting headline totals in the roughly 190–260-node
band. The expanded capture and live page agree on the larger inventory.
Count distinct node identifiers rather than repeated labels.

Captured rank limits span 1–10. In the 29 detail-node sample, per-rank prices
span approximately 100–180,000,000 currency units; percentage increments
span 1–5%, with sampled accumulated bonuses spanning 1–25%.
These are selected detail nodes, not global maxima. Deep account investments
can therefore be many orders of magnitude more expensive than entry nodes.

The planner distinguishes an editable hypothetical plan from ownership.
It offers prerequisite completion, a budget, a goal, a purchase-order
explanation, and a way to compare the next purchase with the accumulated
result. A local saved plan is not a purchase or a server entitlement.
The source's planning heuristic does not establish a globally optimal build.

These are reference patterns for the default-off P2 rune work. They do not
authorize copying the source tree, adopting its costs, or enabling a feature.
