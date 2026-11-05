# Guardian first · 2026-11-05

Generated only Guardian with `python3 -B tools/art/squad.py --guardian` before producing
the remaining roster. Native 80×80 frames contain a roughly 56px cat body, padded weapons,
and nine distinct pose rows. `guardian-real-size.png` shows contact and anticipation
at exactly 1×. `guardian-crowd-study-1280.png` is the running Phaser scene at 1280×720,
eight enemy actors, after 2.2 simulated seconds. Missing roster art uses the Guardian rig
as a temporary crowd silhouette; this is a density study, not a claim of finished enemy art.

Observations: face, shield, feet and body read at native scale. The broad shield silhouette
and upper-left highlights are useful. The contact sword ran off its frame at maximum
extension; clamp the hand anchor to x=56 so the blade remains inside the padded frame.
The portrait is derived from the same rig. Strike and hit poses are more explicit than idle.
Rally and Hearthwall share an arm raise and rely on distinct effects; this remains an art limitation.

The first live layout placed ultimate controls below 720px. Reduce the arena's logical
height from 360 to 330 (all actor feet/labels fit below 320), shorten header/caption spacing,
and recheck all controls. No fractional character scaling is used. Proceed to consistent
Witch/Alchemist and role-specific enemy art, then re-judge the complete crowded scene.
