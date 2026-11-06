# F3 motion timing
REFERENCE: performance/summary.json, skills/ranked.json, skills/summary.json, ../sharpness/PERFORMANCE.md

Seven cold real-click paths and the complete610-case gallery matrix use the same immutable artifact. Every case records from page open, including loading. All cases use fresh browser contexts and disabled cache. The CPU4 runs throttle CPU only. Screenshot capture stays disabled during timing.

Artifact SHA-256 `71192cc4983f43affa14eab1fb250eacabee7ce6ceee221901a1fc105ef73eee`.

## Cold real-click paths
REFERENCE: performance/summary.json, performance/HITCHES.md, performance/trace-attribution.json

| Viewport / DPR / CPU | MAX ms | >25 | >50 |
| --- | ---: | ---: | ---: |
| 1280×720 / 1 / 1 | 100.0 | 5 | 2 |
| 1280×720 / 2 / 1 | 99.9 | 5 | 2 |
| 1440×900 / 1 / 1 | 100.1 | 4 | 2 |
| 1440×900 / 2 / 1 | 100.1 | 4 | 3 |
| 1280×720 / 1 / 4 | 383.4 | 11 | 7 |
| 1280×720 / 2 / 4 | 333.3 | 9 | 7 |
| 2560×1440 / 1 / 1 | 83.4 | 6 | 2 |

All seven paths have zero page errors. The native trace records five RAF intervals over33ms. Its largest100.0ms gaps overlap92.3ms EventDispatch and121.9ms TimerFire tasks. Stage texture construction, WebGL setup, program checks and upload work remain visible in the retained main-thread stacks. The CPU4 page-open maxima383.4/333.3ms exceed the100ms target.

## Every action, first and repeated use
REFERENCE: skills/README.md, skills/ranked.json, skills/summary.json

The full610 cases contain155965 raw frames and zero page errors. Page MAX566.7ms, with4333 frames above25ms and2187 above50ms. First-use MAX33.4ms, six frames above25ms. Repeat-use MAX16.8ms, zero frames above25ms. All1220 cast windows have zero frames above50ms.

F2 first-use MAX was33.5ms with49 frames above25ms. F3 recorded33.4ms with six. Whole-page MAX rose from533.4 to566.7ms. The full-session hitch gate remains missed and this increase remains in the evidence.

## Five cold profile reruns
REFERENCE: skills/profiles/summary.json, skills/profiles/*/trace-attribution.json

All five selected offenders reran at first/repeat MAX16.8/16.8ms. The original33.3–33.4ms cast intervals did not recur, so their individual causes remain unresolved. Retained profiles show initial stage-construction EventDispatch tasks265.3–288.3ms under CPU4, later TimerFire tasks up to385.1ms, image decode, shader/program checks and texture/render work. These measured startup costs drive the F4 cooperative-loading changes.

## Acceptance and next work
REFERENCE: GATES.md, ../memory/STATE.md

The50ms cast gate passes in this dataset. Page-open and CPU4 maximum gates fail. F3 preserves earlier effects while changing the starter motion, and F4 effect compositions require a new complete measurement. F4 source files are excluded from the F3 source manifest and draft.
