# F1 layout, camera and facing
REFERENCE: memory/PROMPT.md, layout/measurements.json, layout/all-actions/measurements.json, tools/cardrpg-big/layout-measure.mjs

The battlefield uses a reserved top control bar, order strip and bottom party/status strip. Enemy plates track their models and avoid every actor silhouette. Plate placement runs at 20 Hz and updates DOM transforms directly. The small-height layout keeps 78.333% of a 1024×600 window for the stage.

## Measured layout
REFERENCE: measurements.json, all-actions/measurements.json, 1280-bounds.webp, 1024-bounds.webp

| Metric | F0 | F1 |
| --- | ---: | ---: |
| Stage at 1280×720 | 57.120% | 78.889% |
| Stage at 1440×900 | recorded baseline | 83.111% |
| Stage at 1024×600 | recorded baseline | 78.333% |
| HUD/body intersection samples | 40/60 | 0/2745 |
| Missing enemy plates | baseline | 0/2745 |
| Cropped figures / prop-face occlusions | baseline | 0 / 0 |
| Face angle MAX | 96.600° | 55.000° |
| Draw calls / triangles peak | 158 / 54,270 sampled | 220 / 84,570 sampled |

The full audit covers 61 actions, five authored poses, three viewports and three cameras. It includes all three bosses and six-unit stress formations. Defeated enemies precede replacements to verify that living units occupy separate formation slots. Model bounds include visible equipment. The face check casts rays against opaque stage geometry. These are sampled bounds and rays, with the raw rectangles retained for review.

## Camera comparison
REFERENCE: 1280-camera-comparison.webp, 1440-camera-comparison.webp, 1024-camera-comparison.webp, all-actions/measurements.json

| Preset | Minimum horizontal margin | Maximum boss height | Starter bodies at 1280 idle |
| --- | ---: | ---: | --- |
| A closer | 8.681% | 47.141% | 146–165 px |
| B medium | 12.873% | 42.358% | 131–148 px |
| C wider | 16.731% | 37.958% | 117–133 px |

B is the default because its starter figures stay closest to the measured F0 screen scale of 111–144 px while giving each side a 12.873% minimum margin.
A gives larger faces and C gives more surrounding scenery. Both remain selectable in battle and the gallery.

The starter idle bodies in B occupy 23.0–26.1% of stage height at 1280×720. Across every cat, action and viewport, the sampled B bounds span 13.189–32.975%. The proposed 24–30% body band is missed by crouches and taller accessories. This variation remains visible in the comparison and is recorded as a partial scale gate.

## Facing and scenery
REFERENCE: apps/web/src/game/squad/turn3d/card-staging.ts, card-staging.test.ts, apps/web/src/game/cardrpg/depth/chapter-stage.ts, assets/provenance/cardrpg-big-stage.json

Body yaw stays within ±32°. Head gaze uses exponential damping with a ±35° target-yaw clamp, followed by a camera-facing cone capped at 55°. Eyes inherit the head transform. Median sampled angle is 54.806°, p95 55.000°. Numerical tolerance is 0.000001°. Six focused tests include damping, paused gaze, facing and obstacle-aware plate placement. KO geometry retains its last live position. Living enemy slot assignment ignores defeated predecessors.

Each chapter has original window arches, hanging lanterns, shelf jars and a tabletop craft. The cafe uses bread, the orchard herbs and the pantry thread spools. Candle flicker, steam, dust and two small background critters use deterministic animation. Reduced motion freezes that ambience. Warm key light, cool rim light, contact shadows and distance fog remain integrated with the scene. Static decoration merges by material and shelf jars/lids use instancing. The initial 254-call peak fell to 220 after merging.

Optical depth-of-field blur remains pending. Background separation currently uses the layered geometry, lighting and distance fog. Independent pupil tracking also remains pending. F2/F3 carry the expression and eye-detail work.

## Validation and remaining performance work
REFERENCE: ../validation/f1-focused.log, ../validation/f1-pilot.json, ../validation/f1-final.json, ../auto/PERFORMANCE.md

The first five-gate pass reports 1,641 web unit tests, 903 rules tests, 421 E2E, typecheck, lint and build passing. Rules retain two expected failures and eleven skips. The second full validation also passed all five gates with the same counts. Seven isolated cold runs are complete with zero page errors. Whole-page MAX ranges from 333.2 to 1466.5 ms and fails the loading gate. The full skill matrix follows against the frozen artifact. See PERFORMANCE.md for the increases relative to A. The A baseline already has a failed opening-load gate, recorded separately from cast timing. F1 introduces no rules edits.
