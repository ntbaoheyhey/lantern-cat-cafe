# F1 measurement and implementation notes
REFERENCE: reports/cardrpg-big/memory/PROMPT.md, baseline/layout/measurements.json, apps/web/src/game/squad/turn3d/card-staging.ts

The baseline measured hero body heights of 111.1–144.0 CSS pixels at 1280×720 and a 411.27-pixel stage. Faces reached 96.60 degrees from the camera. Forty of sixty sampled frames had HUD/body overlap.

F1 gives the battle a 48-pixel top bar, 28-pixel order strip, 52-pixel party strip and 24-pixel action caption. Enemy plates use silhouette-aware collision placement. Front/rear choices affect render positions. Three camera widths are 12.4, 13.8 and 15.4 world units, with a 4.8-unit vertical minimum. The medium preset is selected after screenshot and margin comparison in README.md.

Body yaw stays within ±32 degrees. Authored head poses receive damped gaze limited to ±35 degrees, followed by a 55-degree camera-facing cone. Actual generated GLB poses still need the layout harness check. The shared scene receives an explicit automatic-card-battle flag.

Scenery uses instanced shelf jars, three layers of rear props, chapter-specific bread/herbs/thread trays, steam, 44 dust points, two small geometric background critters and candle flicker. Assets and parameters are recorded in assets/provenance/cardrpg-big-stage.json.

A timing is complete. F1 has 405 camera-comparison samples and 2,745 all-skill samples with zero HUD/body overlap, missing plates, clipping or prop-face occlusion. Peak calls dropped from 254 to 220 after merging static decorations. Final five-gate validation and isolated timing follow. The full results and remaining scale/optical-focus limitations are in README.md.
