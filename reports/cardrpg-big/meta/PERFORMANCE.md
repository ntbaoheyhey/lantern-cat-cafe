# M card-game presentation performance
REFERENCE: ../memory/PROMPT.md lines119–127 and142–144, skills/ranked.json, performance/summary.json

## Cold opening and real clicks
REFERENCE: performance/*.json, ../validation/m-cold.log

Seven fresh contexts open the static file with disabled cache. Frame recording starts before navigation. Screenshots are disabled during timing. CPU4 throttles CPU execution.

| Viewport | DPR | CPU | MAX ms | p95 ms | >25 ms | >50 ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1280×720 | 1 | 1 | 33.4 | 16.7 | 4 | 0 |
| 1280×720 | 2 | 1 | 50.0 | 16.7 | 4 | 1 |
| 1440×900 | 1 | 1 | 50.0 | 16.7 | 4 | 0 |
| 1440×900 | 2 | 1 | 50.0 | 16.7 | 5 | 0 |
| 1280×720 | 1 | 4 | 233.3 | 16.8 | 12 | 5 |
| 1280×720 | 2 | 4 | 233.3 | 16.8 | 13 | 5 |
| 2560×1440 | 1 | 1 | 50.0 | 16.8 | 2 | 0 |

Cold CPU4 MAX233.3ms misses100ms. Hub-interactive marks range918.9–1686.2ms from page open. Battle-ready marks range2560.7–4359.0ms. Both loading and transitions remain inside the measurement window.

## Complete skill matrix
REFERENCE: skills/summary.json, skills/ranked.json, ../validation/m-skills.log

All720 cases cover72 actions across10 viewport/DPR/CPU/quality configurations. There are1,440 casts,265,761 raw frames and0 page errors. Whole-pageMAX250.1ms has4,989 frames above25ms and1,367 above50ms. F5 measured300ms on the same matrix. The100ms opening gate still misses.

| Configuration | Page MAX ms | First MAX ms | Repeat MAX ms | First frames ≤20ms |
| --- | ---: | ---: | ---: | ---: |
| 1280×720 DPR1 CPU1 medium | 66.7 | 33.4 | 16.8 | 99.9815% |
| 1280×720 DPR2 CPU1 medium | 66.6 | 16.8 | 16.8 | 100.0000% |
| 1440×900 DPR1 CPU1 medium | 50.1 | 33.4 | 16.8 | 99.9814% |
| 1440×900 DPR2 CPU1 medium | 50.1 | 33.4 | 16.8 | 99.9629% |
| 1280×720 DPR1 CPU4 medium | 250.1 | 16.8 | 16.8 | 100.0000% |
| 1280×720 DPR2 CPU4 medium | 250.0 | 33.4 | 16.8 | 99.9815% |
| 1440×900 DPR1 CPU4 medium | 250.1 | 16.8 | 16.8 | 100.0000% |
| 1440×900 DPR2 CPU4 medium | 250.1 | 16.8 | 16.8 | 100.0000% |
| 1280×720 DPR1 CPU1 low | 50.1 | 33.3 | 16.8 | 99.9629% |
| 2560×1440 DPR1 CPU1 medium | 50.1 | 33.4 | 16.8 | 99.9814% |

First-useMAX33.4ms has8 intervals above25ms and0 above50ms. Repeat-useMAX16.8ms has0 above25ms. Peak complexity is207 draw calls and93,802 triangles. First-use geometry delta remains at most5 and repeat-use0. Twenty-battle retained-memory stability remains an F6 gate.

## Five profiled reruns
REFERENCE: skills/profiles/summary.json, skills/profiles/*/trace-attribution.json

| Case | First MAX ms | Repeat MAX ms | Page MAX ms |
| --- | ---: | ---: | ---: |
| 1280x720-dpr2-cpu4-medium-enemy-crumb-sentinel | 16.7 | 16.8 | 133.4 |
| 1280x720-dpr1-cpu1-medium-enemy-pollen-scout | 16.8 | 16.8 | 33.3 |
| 1440x900-dpr1-cpu1-medium-enemy-pantry-crown | 16.8 | 16.8 | 33.4 |
| 1440x900-dpr2-cpu1-medium-enemy-teacup-healer | 16.8 | 16.8 | 33.3 |
| 2560x1440-dpr1-cpu1-medium-enemy-rain-spool | 16.8 | 16.8 | 33.4 |

The selected transient cast spikes do not reproduce in these five reruns. Retain their original raw intervals and the separate traces. Profiling changes timing. The CPU4 profiled page still reaches133.4ms.

## Artifact and validation
REFERENCE: build.json, GATES.md, ../validation/m-final.json, lifecycle/checks.json

Measured HTML SHA-256 `9ed1953f02adcede5af9ee3483d29a8c42f7d95a9804fbccadfbe43c29f87ade`. Source8790c9a1 passed typecheck, lint, build,1,679 web tests,903 rules tests and421 E2E before publication. The inherited rules retain2 expected failures and11 skips. UI33, gear384 and early-navigation20 cases also pass. The current performance evidence uses the frozen M artifact. Later I/G preparation is excluded from that artifact.

The fresh pre-push workspace check also passes typecheck, lint, build, 1,692 web tests, 928 rules tests and 421 E2E. These larger counts include prepared I/G tests outside the M source commit. The first rerun caught a TypeScript-library mismatch in a new I test. Replacing its clone call with the existing helper corrected it. Both receipts remain under ../validation/m-evidence*.json.
