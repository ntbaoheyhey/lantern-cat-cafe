# F5 automatic-battle performance
REFERENCE: ../memory/PROMPT.md lines110–118 and142–144, skills/ranked.json, performance/summary.json

## Cold opening and real clicks
REFERENCE: performance/*.json, runtime/summary.json, controls/checks.json

Seven fresh contexts open the offline file. Frame recording begins before navigation and includes loading and real clicks. Screenshots are disabled during timing. CPU 4× throttles CPU execution.

| Viewport | DPR | CPU | MAX ms | p95 ms | >25 ms | >50 ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1280×720 | 1 | 1 | 33.3 | 16.7 | 2 | 0 |
| 1280×720 | 2 | 1 | 50.0 | 16.8 | 2 | 0 |
| 1440×900 | 1 | 1 | 50.0 | 16.7 | 3 | 0 |
| 1440×900 | 2 | 1 | 50.1 | 16.8 | 4 | 1 |
| 1280×720 | 1 | 4 | 216.7 | 16.7 | 14 | 5 |
| 1280×720 | 2 | 4 | 250.1 | 16.8 | 13 | 7 |
| 2560×1440 | 1 | 1 | 50.0 | 16.8 | 5 | 0 |

CPU4 cold MAX250.1 ms misses the100 ms gate. Corrected real-click Fight/Pause/Skip maxima are66.9/10.9/14.7 ms. Five x1 opening encounters take9.306–16.195 s, below the requested45–90 s. The gap and round maxima are83.4/383.4 ms. See GATES.md for the full requirement comparison.

## Complete skill matrix
REFERENCE: skills/summary.json, skills/ranked.json, skills/profiles/summary.json

All720 cases cover72 actions in10 viewport/DPR/CPU/quality configurations. There are1,440 casts,268,286 raw frames and zero page errors. Whole-pageMAX300 ms with5,165 frames above25 ms and1,425 above50 ms misses the opening gate. F4 recorded266.7 ms across the same720-case matrix. This33.3 ms increase remains a phase regression for F6.

First-useMAX33.4 ms has9 frames above25 ms and0 above50 ms. Repeat-useMAX16.8 ms has0 above25 ms. The lowest per-configuration first-use fraction within20 ms is99.963%. Peak cast complexity is207 draw calls and93,802 triangles. First-use geometry delta is at most5 and repeat-use0. Twenty-battle retained-memory stability remains pending.

## Five profile reruns
REFERENCE: skills/profiles/summary.json, skills/profiles/*/trace-attribution.json

First-useMAX values are16.8,33.4,16.8,16.8,16.8 ms. Repeat-useMAX is16.8 ms throughout. The reproduced2560px Teacup Healer interval ends11.2 ms after the cast snapshot and starts22.2 ms before it. Samples include warmModels rendering, uniform initialization and GPU command waits. Keep this boundary-crossing interval in the cast evidence. The four other original cast spikes do not recur under profiling.

## Artifact and validation
REFERENCE: build.json, ../validation/f5-corrected.json, layout/measurements.json, action-screens/checks.json

Measured HTML SHA-256 `4536494f37c372d9f623c01b7a8eddbc10d512933ad13418b32253707e95cdc8`. Corrected F5 source7e054608 passes typecheck, lint, build,1669 web tests,903 rules tests and421 E2E. Rules retain2 expected failures and11 skips. Layout3240 poses has0 overlaps/crops/face occlusions/missing plates. Eighteen natural action screenshots pass snapshot-HP checks. M source is being validated separately.
