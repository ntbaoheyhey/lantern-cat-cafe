# Stat families, units and observed bounds

Evidence: archived `pages/wiki__stats.json`,
`pages/wiki__stat-caps.json`, hero-detail pages, and a subset of gear-detail
pages. Live checks: [stat explanations](https://tbhindex.com/wiki/stats)
and [ceilings](https://tbhindex.com/wiki/stat-caps), 2026-11-02.

## Categories and stacking

The useful families are hit strength and action rate; critical-hit
probability and payoff; element and delivery modifiers; skill timing,
reach and coverage; physical mitigation and avoidance; recovery;
and travel or resource rewards. Extra hits and extra projectiles change
hit count rather than the size of each hit.

Keep flat increments, additions to a shared percentage pool, independent
multipliers, and modifiers of a character's base value distinct. The source
generally applies flat changes before percentage scaling. A percentage
bonus to a base chance is not automatically an equal number of percentage
points. Multiplicative exceptions depend on the source of the bonus.

Distance, covered area, and area-hit damage are different quantities.
Likewise, attacks per second, a speed percentage, animation seconds,
and cooldown seconds must never share an unlabeled numeric column.

## Observed ranges

Across the captured starting-character examples, unmodified hit strength
spans 1–2, health 50–130, and armor rating 5–45. Basic attack rates span
0.5–1.0 per second. Critical-hit probability spans 2–5%, while critical-hit
damage is about 1.4–1.8 times a normal hit. These cross-character envelopes
do not describe later progression, item rolls, or our character balance.

Within 110 captured gear-detail pages, explicitly identified base weapon
damage spans approximately 1–3,400 and base weapon rate about 1–2.3 per
second. Parsed base armor values fall around 350–7,300. These are a
weapon-heavy sample over different levels and qualities, not complete
catalogue limits or a distribution from which to generate items.

In that same sample, readable intrinsic bonus lines span roughly 100–450
flat health, 0.5–6% critical chance, and 30–190% critical damage.
Flat armor bonuses form a different range from base armor. Lines with
additional formatting or unclear units were not folded into these bounds.
Combining all numeric strings would incorrectly mix speed percentages with
attacks per second.

## Caps and unresolved claims

The live source describes ordinary avoidance/block ceilings near 75%,
with specific maximum-increasing modifiers able to raise some ceilings.
Cooldown reduction is separately described as a hard ceiling near 75%.
Physical mitigation limits span roughly 75–85%, depending on combat role;
these percentages are not armor-rating limits. Critical-hit probability
has the usual probability boundary, while the source describes no fixed
ceiling for attack, cast, or travel speed.

The archived cap page places elemental resistance in the capped group.
The live pages instead say it has no fixed cap and discuss observations
past 90–100%. This disagreement is unresolved here: neither claim should
be imported as a verified combat rule. The archive also marks generic
damage reduction as uncertain.

No uncapped stat guarantees unlimited useful throughput: target availability,
movement, recovery, and scheduling can become the limiting factor.
Our implementation should explain its own units, stacking order, and caps
from its actual rule definitions.
