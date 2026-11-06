# Starter motion verification
REFERENCE: ../memory/PROMPT.md lines 95–99, PLAN.md, trajectories.json, variety.json

Mochi, Soot and Clover receive 22 authored clips each. Eight chapter-one models receive 19 each. The mixer also retains the earlier compatible clips, giving 36 hero and 33 enemy actions. The catalogue has four skills per cat including its ultimate. This slice therefore covers 12 hero skills and eight enemy actions.

The authored gestures include a double knock, open-arm welcome, crossed apron, broad shelter, spark flick, cup cradle, lantern tug, overhead service, leaf tap, offered tea, sweeping rinse and rising greenhouse. Body weight, paired-arm timing and recovery differ between gestures. Three idle variants use deterministic 4–8 second intervals. Tracks include smoothstep interpolation, squash/stretch and delayed ear, tail and accessory follow-through. Root travel stops 1.2 world units before its target and returns to formation.

## Actual-rig evidence
REFERENCE: trajectories.json, variety.json, ../filmstrips/, tools/cardrpg-big/motion-measure.mjs

The probe samples 41 normalized times from each actual AnimationMixer clip on its loaded GLB. Seven shared joints are expressed relative to their unanimated model. Positions are normalized by model height. The thresholds were declared before measurement, angular RMS≥0.10 rad and position RMS≥0.012 model heights. All 30 required same-cat and same-slot pairs pass. Minimum angular distance is 0.227023 rad and minimum position distance is 0.031135 model heights. The 20×20 matrix includes optional cross-enemy comparisons.

Twenty sheets contain 160 game-render frames. Each uses a fixed union crop around the caster's complete action envelope. This keeps its travel visible and enlarges its gesture. The capture asserts the caster clip and exact clip time before and after the screenshot. Repeated fixed head poses differ by at most 0.000003415 degrees. Every sheet has a SHA-256 receipt.

The first probe inherited effective action weight 0 from the scene's earlier animation selection. It incorrectly reported 25 zero-distance required pairs. Its raw JSON remains in pilot-zero-weight/. The corrected probe explicitly restores weight 1 and asserts that weight at every sampled time.

## Layout regression check
REFERENCE: layout/measurements.json, ../layout/README.md

The medium camera was checked at 915 poses across 61 actions and three viewport sizes. There are zero HUD/body overlaps, missing plates, clipped figures or prop-face occlusions. Face angleMAX is 55.000000021 degrees. Minimum horizontal/vertical margins are 11.23/9.32%. Boss heightMAX is 42.24% of stage. Full hero action bounds range 18.86–47.50%, missing the 24–30% target during broad motions/accessories. Peak draw calls 226 and triangles 94074.

## Remaining work
REFERENCE: ../memory/STATE.md, ../sharpness/PERFORMANCE.md

The remaining nine cats and five later-chapter enemy models await the post-checkpoint pass. Victory/defeat clips are authored and their result-screen integration belongs to F5. Motion also needs the F4 effect shapes to communicate each skill clearly. Seven capture-disabled cold-page runs have completed after validation. Native MAX ranges83.4–100.1ms and CPU4 MAX is383.4/333.3ms. The full610-case cast matrix and five profiles are complete. First/repeat MAX33.4/16.8ms with zero cast>50ms. PageMAX566.7ms misses the startup hitch gate. Raw arrays and attribution are linked from PERFORMANCE.md.
