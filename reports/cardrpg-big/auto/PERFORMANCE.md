# Phase A performance
REFERENCE: skills/ranked.json, skills/summary.json, performance/summary.json, ../baseline/skills/ranked.json

The complete 610-case matrix contains 1,220 cast windows and 131,670 raw frames. All ten configurations contain all 61 actions and zero page errors. Page-open recording starts before navigation and keeps real campaign/Fight/Pause clicks and fixture transitions.

| Window | F0 MAX ms | A MAX ms | A frames >25 ms | A frames >50 ms |
| --- | ---: | ---: | ---: | ---: |
| Complete page session | 1616.5 | 1616.6 | 5549 | 3116 |
| First cast | 33.4 | 33.4 | 32 | 0 |
| Repeat cast | 16.8 | 16.8 | 0 | 0 |

Normal-CPU primary-size casts have a 16.8 ms MAX. CPU4 first casts reach 33.4 ms. The separate Low pass reaches 33.3 ms once on first use. First-use hitch count fell from 58 to 32. The opening hitch remains a failed gate.

## Isolated cold real-click scenarios
REFERENCE: performance/summary.json, performance/1280x720-dpr1-cpu1-trace.json.gz, performance-pilot/summary.json

| Viewport / DPR / CPU | MAX ms | >25 | >50 |
| --- | ---: | ---: | ---: |
| 1280×720 / 1 / 1 | 366.6 | 6 | 4 |
| 1280×720 / 2 / 1 | 333.2 | 10 | 8 |
| 1440×900 / 1 / 1 | 350.0 | 5 | 3 |
| 1440×900 / 2 / 1 | 383.4 | 11 | 7 |
| 1280×720 / 1 / 4 | 1316.6 | 13 | 9 |
| 1280×720 / 2 / 4 | 1399.8 | 13 | 12 |
| 2560×1440 / 1 / 1 | 333.3 | 6 | 4 |

These runs were isolated from builds, tests and git packing. The earlier overlapping pilot is retained separately. Stage height at 1280×720 is 78.648% after the automatic control row removal.

## Top-five profiles
REFERENCE: skills/profiles/summary.json, skills/profiles/*/trace-attribution.json

Two of five profiled reruns reproduce a 33 ms first-window interval. Mallow-1 reaches 33.4 ms and Velvet-4 reaches 33.3 ms. Their intervals end about 2–3 ms after the measured trigger, overlapping fixture replacement and the preceding rendering frame. Main-thread RAF tasks take 12.58 and 12.72 ms under CPU4. Sampled stacks include renderBufferDirect, model cloning, ensure, disposePuppet and matrix/bounds updates. This supports fixture/render preparation as a contributor. The remaining unsampled work still needs attribution.

Three profiled reruns reach 16.8 ms. Opening profiles retain the synchronous base64 decoder, script compilation and GC spikes identified in F0. The later loader fix must address those intervals. All first and repeated cast windows pass the 50 ms limit. Full-session performance remains below the requested gate.

## Measurement limits
REFERENCE: ../memory/PROMPT.md, ../baseline/README.md

The 48 skill entries include 12 ultimates. Each has a measured first and repeat window. The current card skill mappings still await the F4 effect-direction implementation, so these numbers establish the automatic-battle baseline. Future full effects require fresh timing. Twenty-battle heap/GPU stability remains a later gate. Raw cold traces use gzip compression to preserve full events within Git file-size limits.
