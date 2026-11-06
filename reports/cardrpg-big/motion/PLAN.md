# Starter motion authoring
REFERENCE: ../memory/PROMPT.md lines95–99, ../memory/STATE.md, apps/web/src/game/squad/turn3d/scene.ts

F2 source d1425018 and state98745e74 are pushed on draft336. Its610-case matrix and five profiles run in session44157 from /tmp/cardrpg-big-f2-index.html. Avoid build/test/bake/git work until timing ends. Source authoring alone can proceed.

## Implementation
REFERENCE: tools/art3d/animation.mjs, assets/provenance/cardrpg-depth-models.json

Create new AnimationClips on the existing named rigid-node rigs. Authored keyframes carry body-language differences for the12 actual starter skills, including3 ultimates. Motion and secondary follow-through are sampled into eased tracks once per loaded actor. Preserve GLB assets and the16 MB budget.

Mochi knocks, welcomes with an open arm, crosses an apron and raises a broad shelter. Soot flicks a spark, cradles a cup, tugs a lantern wick and conducts an overhead service. Clover taps with a leaf, patiently offers tea, sweeps a rinse and opens a rising greenhouse gesture. Each needs different weight shifts, arm paths and recovery.

Chapter1 includes Button Guard, Sock Skipper, Spool Ram, Needle Moth, Teacup Healer, Yarn Giant, Binding Thread and Practice Cushion. Their intention poses and strikes should read as brace, skip, ram, volley, pour, loomfall, knot and soft bump.

Add three idle variants with deterministic4–8s fidgets, light/heavy directional reactions and distinct guard/heal/KO/victory/defeat. Reuse the scene mixer and facing constraints. Target-directed travel observes a stop distance and returns to formation.

## Verification after F2 timing
REFERENCE: tools/cardrpg-big/layout-measure.mjs, tools/cardrpg-big/skill-measure.mjs

Focused tests cover finite tracks, authored clip coverage, rest endpoints, reaction direction, deterministic fidgets and stop distance. Compute actual sampled joint trajectories and pairwise distances with declared thresholds. Capture eight frames per skill/enemy action and inspect the resulting strips. Recheck all-pose facing, margins and overlaps before publishing. Full shared validation and hitch harness follow.


## Source review before measurement
REFERENCE: apps/web/src/game/squad/turn3d/scene.ts, apps/web/src/game/cardrpg/depth/feel-lab.ts, tools/cardrpg-big/motion-measure.mjs

Self-support skills keep their caster gesture through the impact and reaction beats. The scene restores its last authored head pose before applying gaze, which preserves mixer output on repeated fixed frames. The probe checks that the caster keeps the planned skill clip at all eight captured moments and that repeated head orientation differs by at most 0.0001 degrees.

The gallery now represents Button Guard shielding its own side and Teacup Healer healing its own side. F2 timing uses the earlier frozen gallery. Report this fixture change when comparing later measurements.

Variety thresholds are declared before running the probe. Each same-cat pair and each same-slot pair across starter cats must have angular RMS at least 0.10 radians and position RMS at least 0.012 model heights. Sample 41 equally spaced times from the actual mixer on each loaded GLB. Subtract each rig's rest pose and divide positions by its model height. Save the full 20-by-20 matrix, raw joint trajectories, 30 required pair results and eight-frame game-render strips. Every threshold miss remains in evidence until corrected.

The Before / after page embeds the captured WebP sheets after the second offline build. Clip coverage for remaining cats/enemies and result-beat integration remain open for the later phases.
