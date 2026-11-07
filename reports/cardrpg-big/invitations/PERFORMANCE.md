# G page-open and skill performance
REFERENCE: ../memory/PROMPT.md lines136–145, cold/summary.json, skills/summary.json, performance-summary.json

## Cold opening and real clicks
REFERENCE: cold/summary.json, cold/*.json, build.json

Seven fresh browser contexts open the offline artifact with cache disabled. Recording starts before navigation and includes loading, real clicks and battle entry. Screenshots are disabled during timing. The renderer is ANGLE Metal on Apple M3 Pro. CPU4 throttles CPU execution.

| Viewport | DPR | CPU | MAX ms | p95 ms | >25 / >50 ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1280×720 | 1 | 1 | 16.8 | 16.7 | 0 / 0 |
| 1280×720 | 2 | 1 | 50.0 | 16.8 | 2 / 0 |
| 1440×900 | 1 | 1 | 50.0 | 16.8 | 4 / 0 |
| 1440×900 | 2 | 1 | 50.0 | 16.8 | 2 / 1 |
| 1280×720 | 1 | 4 | 216.7 | 16.8 | 11 / 5 |
| 1280×720 | 2 | 4 | 266.6 | 16.8 | 11 / 5 |
| 2560×1440 | 1 | 1 | 50.0 | 16.7 | 3 / 1 |

Cold CPU4 MAX reaches 266.6 ms, exceeding the 100 ms gate. Hub interaction begins at 920.0–1770.3 ms and the battle scene becomes ready at 2392.5–4493.9 ms.

## Complete skill matrix
REFERENCE: skills/summary.json, skills/ranked.json, skills/*.json, performance-summary.json

All 720 cases cover 72 actions across ten viewport, DPR, CPU and quality configurations. There are 1,440 casts, 263,056 raw frames and zero page errors. Whole-page MAX is 316.6 ms with 4,640 intervals above 25 ms and 1,330 above 50 ms.

| Configuration | Page MAX ms | First / repeat MAX ms | First frames ≤20 ms |
| --- | ---: | ---: | ---: |
| 1280×720 DPR1 CPU1 medium | 50.1 | 33.3 / 16.8 | 99.9815% |
| 1280×720 DPR2 CPU1 medium | 66.6 | 16.8 / 16.8 | 100.0000% |
| 1440×900 DPR1 CPU1 medium | 50.1 | 16.8 / 16.8 | 100.0000% |
| 1440×900 DPR2 CPU1 medium | 100.0 | 16.8 / 16.8 | 100.0000% |
| 1280×720 DPR1 CPU4 medium | 316.6 | 16.8 / 16.8 | 100.0000% |
| 1280×720 DPR2 CPU4 medium | 250.1 | 33.4 / 16.8 | 99.9629% |
| 1440×900 DPR1 CPU4 medium | 233.4 | 33.3 / 16.8 | 99.9814% |
| 1440×900 DPR2 CPU4 medium | 250.1 | 16.8 / 16.8 | 100.0000% |
| 1280×720 DPR1 CPU1 low | 50.1 | 16.8 / 16.8 | 100.0000% |
| 2560×1440 DPR1 CPU1 medium | 50.1 | 33.4 / 16.8 | 99.9814% |

First-use MAX is 33.4 ms with 5 intervals above 25 ms. Repeat-use MAX is 16.8 ms. Both have zero intervals above 50 ms. Peak complexity is 207 draw calls and 93,802 triangles. First-use geometry delta reaches 5 and repeat-use delta 0.

The 100 ms opening gate remains missed. The earlier M matrix reached 250.1 ms, compared with 316.6 ms here. The artifacts differ, and this measurement alone cannot attribute that increase. This G sibling contains the M340 rules and its original ceremony. Integrated entrances, later B assets and the I balance changes require their own measurements.

## Five profiled reruns
REFERENCE: skills/profiles/summary.json, skills/profiles/*/trace-attribution.json

| Case | Page MAX ms | First / repeat MAX ms |
| --- | ---: | ---: |
| 1280x720-dpr2-cpu4-medium-enemy-kettle-knight | 116.7 | 16.8 / 16.8 |
| 2560x1440-dpr1-cpu1-medium-enemy-crumb-sentinel | 33.3 | 16.8 / 16.8 |
| 1280x720-dpr2-cpu4-medium-enemy-sock-skipper-basic | 116.7 | 16.8 / 16.8 |
| 1440x900-dpr1-cpu4-medium-enemy-pantry-crown | 116.7 | 16.8 / 16.8 |
| 1280x720-dpr1-cpu1-medium-enemy-pantry-crown | 16.8 | 16.8 / 16.8 |

The three CPU4 profiled pages reach 116.7 ms. Their worst intervals overlap script evaluation lasting 112.063–114.070 ms, including V8 compilation at 75.352–77.572 ms. These inclusive tasks overlap each other. The original transient cast spikes are retained alongside the separate profiling runs. Profiling changes timing.

Lane B owns the engine and opening work. Its published loader improvements and subsequent integrated measurements will determine the remaining opening work. Twenty-battle retained-memory stability remains part of that integrated gate.

## Artifact and validation
REFERENCE: build.json, CHECKPOINT.md, ../validation/g-final.json

Measured HTML SHA-256 `284976a9db6da0cbca0f1e5272959281bf87f9263a20e18c17fd79e9d176598d`. The source checkpoint already passed typecheck, lint, build, 1,692 web tests, 903 rules tests and 421 E2E tests. The resumed publication run passes typecheck, lint and build. Its full web suite reached 1,691/1,692 with one 5-second StageLayout timeout; the unchanged-source focused file passes all11tests and E2E passes421tests. The timeout and focused recovery are retained separately in validation/g-evidence-resolution.json. This is not labelled a clean full-suite run. All raw frame arrays, trace archives and coverage receipts are retained.

## Recovery verification
REFERENCE: recovery-verification.json

After resuming, all 720 saved raw arrays were read again. Their row data matches the catalogue summary exactly. Recomputing frame count, MAX, >25 ms and >50 ms reproduces the table above; the saved offline HTML matches the measured SHA. Five profile receipts share that artifact hash. This checks retained evidence and is not a new timing measurement.
