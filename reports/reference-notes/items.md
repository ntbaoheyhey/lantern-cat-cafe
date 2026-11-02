# Items, rarity and reward shapes

Evidence: archived `pages/wiki__grades.json`, gear-detail pages,
`pages/wiki__materials.json`, `pages/wiki__common-equipment.json`,
`pages/wiki__chest-cooldown-explained.json`, `chest-groups.json`,
`chest-grade-odds.csv`, and the earlier systems proposal.
Live checks: [gear](https://tbhindex.com/wiki/gear),
[rarity](https://tbhindex.com/wiki/grades), and
[containers](https://tbhindex.com/wiki/chests), 2026-11-02.

## Item categories

Equipment separates attack implements, guarding implements, body protection,
and accessories. Body pieces cover head, torso, hands, and feet; accessories
occupy neck, ear, finger, and wrist positions. Class eligibility is distinct
from slot eligibility. A material or transaction token is not equippable
merely because it appears in the same catalogue.

Further families include consumable crafting ingredients, reward containers,
party-wide socketed objects, and the holders into which those objects fit.
For equipment, distinguish its base type, required level, quality rank,
fixed stats, variable bonuses, and allowed upgrade sockets. Acquisition source,
sale eligibility, and conversion value are separate properties.

## Rarity structure and ranges

The source has roughly a ten-step quality ladder. Lower ranks introduce
bonus capacity; middle ranks open successive upgrade layers; upper ranks
combine more layers with a thinner supply. Across ranks, intrinsic bonus
capacity runs from 0–3 lines, while each socket layer spans 0–2 positions.
These are capacities, not independent random chances.

The grade overview spans approximately 10–360,000 currency units and
2–72,000 workshop-progress units for conversion. Adjacent-rank growth is
roughly 3–3.5 times, making the ladder increasingly expensive. Individual
item pages also depend on item level and workshop matching, so this is
not a universal salvage quote. Keep level and quality as different axes.

Combining equal-quality objects concentrates many inputs into fewer outputs.
Early steps favor an increase with a small chance of skipping a step.
Late steps increasingly return the input quality: the sampled same-rank
outcome rises through roughly 20–91%, while the exceptional jump shrinks
from low-single-digit percentages to well below 1%. This is a distribution
shape, not a recipe or a proposed cost for our economy.

## Drop-rate shape and interpretation

Reward-container families correspond to ordinary encounters, local bosses,
and chapter-scale bosses. Their available quality bands change with
progression; class ownership can also change the eligible item pool.
An item's conditional weight is meaningful only relative to the eligible
weights in that same pool.

The ordinary-container sample moves from a bottom-heavy distribution
(roughly 75–80% in the starting band) toward intermediate bands that can
hold roughly 60–75%. Exceptional outcomes form a long tail, often below
1%. There is no single universal quality distribution. In particular,
the same broad rank may dominate one container and be uncommon in another.

The analysis separates 120 ordinary selections from nine synthetic
simulator selections. Across ordinary selections, displayed totals fall
around 99.8–100.2% because of rounding. A displayed zero at high ranks
cannot distinguish an impossible result from a probability below display
precision. Do not turn these rounded observations into exact drop weights.

Separate the chance to obtain a container from the conditional chance of
its contents. The archived site reports a shared lockout of about 2–4 minutes
for ordinary/local-boss containers, with chapter-scale bosses exempt.
That is a site-reported measurement, not a fresh timing experiment here.
Faster clearing therefore need not increase container throughput linearly.

A counter showing elapsed rolls since a good result is only a display
feature unless an independently verified rule changes future odds.
Nothing in this review establishes a guaranteed-drop or pity rule.
