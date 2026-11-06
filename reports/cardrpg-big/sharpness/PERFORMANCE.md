# F2 cold-page timing
REFERENCE: performance/summary.json, performance-no-capture/summary.json, ../layout/PERFORMANCE.md

Seven configurations completed twice from a fresh file URL with a new browser context, disabled cache and real mouse clicks. Both datasets retain all raw RAF intervals from page open through the battle. CPU 4× changes CPU speed only. The first set captures screenshots. The second set switches off capture and keeps the interaction path and measurement window. Each set has zero page errors.

## Including screenshot capture
REFERENCE: performance/summary.json, performance/*-cpu*.json

Artifact SHA-256 `0394611aca99d6999cf4e1dc4bdaa0113703670052e9ae76aa8ffd795ef51879`.

| Viewport / DPR / CPU | MAX ms | >25 | >50 |
| --- | ---: | ---: | ---: |
| 1280×720 / 1 / 1 | 116.6 | 5 | 2 |
| 1280×720 / 2 / 1 | 300.0 | 8 | 6 |
| 1440×900 / 1 / 1 | 66.7 | 4 | 2 |
| 1440×900 / 2 / 1 | 450.0 | 10 | 6 |
| 1280×720 / 1 / 4 | 283.3 | 10 | 7 |
| 1280×720 / 2 / 4 | 283.4 | 13 | 11 |
| 2560×1440 / 1 / 1 | 83.4 | 4 | 2 |

## Capture disabled
REFERENCE: performance-no-capture/summary.json, performance-no-capture/*-cpu*.json

Artifact SHA-256 `0394611aca99d6999cf4e1dc4bdaa0113703670052e9ae76aa8ffd795ef51879`.

| Viewport / DPR / CPU | MAX ms | >25 | >50 |
| --- | ---: | ---: | ---: |
| 1280×720 / 1 / 1 | 99.9 | 3 | 2 |
| 1280×720 / 2 / 1 | 100.0 | 3 | 2 |
| 1440×900 / 1 / 1 | 83.3 | 5 | 2 |
| 1440×900 / 2 / 1 | 83.4 | 5 | 2 |
| 1280×720 / 1 / 4 | 333.4 | 13 | 7 |
| 1280×720 / 2 / 4 | 416.7 | 11 | 7 |
| 2560×1440 / 1 / 1 | 100.0 | 4 | 2 |

The captured CPU4 maxima fell from F1 1316.5/1466.5 ms to 283.3/283.4 ms at DPR1/DPR2. The captured 1440 DPR2 maximum rose from 433.4 to 450.0 ms. With capture disabled the same F2 configuration measured 83.4 ms. A separately marked capture profile follows below.

The capture-disabled CPU4 runs still reach 333.4/416.7 ms. Cold initialization therefore misses the full-session hitch gate. The streamed loader removes the previous synchronous whole-payload byte conversion, but scene creation, shader setup and texture uploads still require work.

## Main-thread profile
REFERENCE: performance/HITCHES.md, performance/trace-attribution.json, performance-no-capture/HITCHES.md

The captured DPR1 profile has five intervals above 33 ms. The 100.1 ms interval overlaps 97.0 ms EventDispatch. Samples identify stageTexture canvas generation inside makeStage, WebGL getContext, resize and garbage collection. The 116.6 ms interval overlaps first program-uniform setup and texture upload. Largest leaves include getUniforms shader-program checks and texSubImage2D. Source offsets are retained in trace-attribution.json and map to the embedded application JavaScript.

These are specific measured startup costs. The complete610-case cast matrix and top-five profiles are recorded below.

## Marked screenshot profile
REFERENCE: capture-profile/summary.json, capture-profile/trace-attribution.json, capture-profile/HITCHES.md

A fresh 1440×900 DPR2 rerun adds start/end marks around each capture. Four RAF gaps of 466.6, 466.6, 466.6 and 483.4 ms overlap the battle/cast screenshot windows. Their largest main-thread work items last 1.0–2.7 ms, with 461.9–481.0 ms sampled in idle. The rerun ties these long RAF gaps to screenshot capture. It leaves the original unmarked 450.0 ms sample intact. The capture-disabled run gives the interaction-only measurement while preserving page-open frames.

The captured profile MAX483.4 ms is also retained. It cannot be substituted for an application-only frame budget. Scene creation and shader/texture startup remain the measured application costs discussed above.

## All-skill matrix and profiles
REFERENCE: skills/ranked.json, skills/summary.json, skills/profiles/summary.json

All610 cases across ten configurations completed with zero page errors and156241 raw frames. Page-open MAX is533.4ms, with4679 frames above25ms and2231 above50ms. First-use MAX is33.5ms with49 frames above25ms. Repeat-use MAX is16.8ms. Both cast windows have zero frames above50ms. The full-session startup gate remains missed.

F1 measured first-use MAX33.4ms with45 frames above25ms. F2 measured33.5ms with49. The complete matrix is retained, including this small increase. Every configuration, action, raw interval and heap/GPU snapshot is linked from skills/README.md.

Five cold profile reruns measured first-use MAX16.8,16.8,16.8,33.4 and33.4ms. All repeat windows measured16.8ms. The largest original33.5ms Sorrel spike did not recur. Clover and Marigold33.4ms windows overlap14.2–14.3ms animation callbacks and13.1–19.9ms BeginMainFrame work following the fixture's first rendering. Their preceding316.6/316.7ms startup gaps overlap322.2/332.9ms TimerFire tasks, image decode and renderer/shader work. Main-thread stacks and source offsets remain in each trace-attribution.json. A single source cause for the transient cast intervals remains unresolved.
