# What is wrong, measured
REFERENCE: docs/cardrpg2/index.html; tools/cardrpg-big/measure.mjs; tools/cardrpg-big/inspect.mjs; tools/cardrpg-big/skill-measure.mjs

Cold timing starts before navigation to the static file, in a fresh browser context with cache disabled. Real mouse clicks open the route and battle and enable the baseline Auto checkbox. Chromium uses ANGLE Metal on Apple M3 Pro. CPU4 is CPU throttling only. No timing window discards loading.

| Measurement | Baseline | Evidence |
| --- | --- | --- |
| 1280×720 DPR1 max / >25 / >50 ms | 366.7 ms / 7 / 4 | 1280x720-dpr1-cpu1.json |
| 1280×720 DPR2 max / >25 / >50 ms | 333.3 ms / 11 / 7 | 1280x720-dpr2-cpu1.json |
| 1440×900 DPR1 / DPR2 max | 333.3 / 383.4 ms | matrix/summary.json |
| CPU4 1280×720 DPR1 / DPR2 max | 1383.3 / 1333.3 ms | matrix/summary.json |
| 2560×1440 DPR1 max | 333.3 ms | matrix/summary.json |
| 1280×720 stage height | 411.27 CSS px, 57.12% of viewport | sharpness/diagnostics.json |
| Hero full-body height / stage | Mochi 31.86%, Soot 34.40%, Clover 29.37% | sharpness/diagnostics.json |
| Idle camera-to-face angles | Mochi 28.90°, Soot 35.77°, Clover 38.38° | sharpness/diagnostics.json |
| DPR1 / DPR2 backing buffer | 1280×411 / 2560×822 | summary.json |
| Medium scene target antialiasing | 0 MSAA samples | sharpness/diagnostics.json |
| Hero material maps | 128×128, anisotropy 8, mipmaps enabled | sharpness/diagnostics.json |
| Sampled end of first fight rendering | 158 draws, 54,270 triangles | summary.json |
| Screen reachability | 45 captures, 3 sizes, 0 console errors/remote requests/storage writes | screens/check.json |
| Skill VFX mapping | 48 skills, 5 shared templates, 0 matching EFFECT_DIRECTION entries | depth/assets.ts and turn3d/vfx.ts |

## Sharpness
REFERENCE: reports/cardrpg-big/sharpness.json; tools/cardrpg-big/sharpness.py

Native-pixel four-neighbour Laplacian variance. Aliasing and detail can both raise this statistic. Visual side-by-side inspection remains necessary. Compare each crop only against the same DPR and label.

| Crop | DPR1 | DPR2 |
| --- | ---: | ---: |
| Hero face | 8762.42 | 4517.40 |
| Enemy | 8952.59 | 4200.52 |
| HUD text | 14168.02 | 5188.71 |
| Card portrait | 1081.70 | 564.15 |
| Skill icon | 1138.03 | 453.13 |

## Root causes
REFERENCE: 1280x720-dpr1-cpu1-trace.json.gz; 1280x720-dpr1-cpu1.json; apps/web/src/game/cardrpg/depth/assets.ts; apps/web/src/game/squad/turn3d/vfx.ts

The first 366.7 ms frame overlaps a 358.1 ms main-thread ParseHTML task and 355.4 ms EvaluateScript. The embedded base64 decoder and large synchronous script execute during loading. A later 150 ms frame overlaps 114.8 ms EvaluateScript. Trace intervals and inclusive durations appear in each attributed hitch record. The main-thread CPU profile ties the 66.7 ms interval to scene construction and resize. The 33.4 and 83.4 ms intervals contain program-uniform initialization and GPU command waits. The 49.9 ms interval contains decompression chunks. Every >33 ms interval, its inclusive task durations and statistical CPU stacks is listed in HITCHES.md and trace-attribution.json. The profile establishes these overlapping contributors, while exact time attribution across nested work remains inclusive.

The skill IDs registered by the depth adapter never enter EFFECT_DIRECTION. SpellVfx.render skips its main effect body when that entry is absent. The actor can move and the camera can react while the intended spell geometry remains absent. That directly explains the weak skill identity in the captured casts.

The native DPR buffers are correctly sized. Medium post-processing discards antialiasing, and material maps are only 128×128. Hero motion rotates toward the target without a camera-facing clamp. HUD panels occupy the lower scene and the right backdrop. The 60-frame DOM-over-model audit found overlaps in 40 frames, including all 20 sampled frames at 1280×720 and at 1024×600. The 1440×900 samples had zero HUD-body intersections. Maximum camera-to-face angle across the sampled poses was 96.60°. Full boxes and angles are in layout/measurements.json.

## Coverage and instrumentation
REFERENCE: COVERAGE.md; skills/summary.json; docs/cardrpg3/build.json

The old file remains the cold-page baseline. The new cardrpg3 file adds only an isolated gallery fixture hook and paused-view invalidation for exhaustive skill sampling. Every first use gets a fresh page. Each raw JSON retains page-open RAF deltas, long tasks, long animation frames, heap/GPU snapshots, duration and first/repeat boundaries. Preview fixtures bypass progression eligibility to expose ultimates and all enemies, with zero account mutation. This fixture coverage complements actual battle clicks.

The capture script uses max-level equipment fixtures for later meta destinations. Actual cold-load runs use the untouched starter account. The exhaustive matrix completed 610 cases and 1,220 casts across ten configurations. Its 129,685 raw RAF intervals pass the integrity check. Whole-session MAX is 1,616.5 ms, with 5,490 frames above 25 ms and 3,326 above 50 ms across all 610 cold sessions. First-cast MAX is 33.4 ms with 58 frames above 25 ms. Repeat-cast MAX is 16.8 ms with zero frames above 25 ms. All cast windows have zero frames above 50 ms. Each session window starts at page open and includes navigation, fixture setup and both casts.

REFERENCE: skills/integrity.json; skills/ranked.json; skills/profiles/README.md

Five profiled reruns identify synchronous decoding and GC in the largest opening frames. Their original first-cast 33.4 ms intervals were absent on rerun, leaving those transient causes unresolved. No page errors occurred. The catalogue has 48 total skills including 12 ultimates, and 13 enemies including three bosses.
