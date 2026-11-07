# F1 cold-open performance
REFERENCE: performance/summary.json, performance/1280x720-dpr1-cpu1-trace.json.gz, ../auto/PERFORMANCE.md

Seven isolated fresh-page runs use real clicks and record RAF from navigation. Zero page errors. The source artifact SHA-256 is 1cf691494a45227c1dbcbe6a1c1bde9552416e248fb046f25022a54663ab963d.

| Viewport / DPR / CPU | MAX ms | >25 | >50 |
| --- | ---: | ---: | ---: |
| 1280×720 / 1 / 1 | 366.7 | 9 | 5 |
| 1280×720 / 2 / 1 | 333.3 | 10 | 8 |
| 1440×900 / 1 / 1 | 333.3 | 8 | 4 |
| 1440×900 / 2 / 1 | 433.4 | 12 | 7 |
| 1280×720 / 1 / 4 | 1316.5 | 10 | 9 |
| 1280×720 / 2 / 4 | 1466.5 | 14 | 12 |
| 2560×1440 / 1 / 1 | 333.2 | 6 | 4 |

The full-page hitch gate fails. The 1440 DPR2 maximum rose from 383.4 to 433.4 ms and CPU4 DPR2 rose from 1399.8 to 1466.5 ms versus A. Those increases remain recorded until profile evidence separates loader variation from scene work. The complete 610-case matrix is recorded below.

Build receipt runtime-source hashes match. The layout measurement script changed after the HTML build to add post-summon fixture coverage, which does not enter the runtime bundle.

## Complete skill matrix
REFERENCE: skills/summary.json, skills/ranked.json, skills/README.md, skills/profiles/summary.json

All 610 cases completed with zero page errors, 1,220 cast windows and 131,781 raw RAF intervals. Each of ten configurations covers 61 distinct actions. First-use MAX is 33.4 ms, repeat-use MAX 16.8 ms. First/repeat counts above 25 ms are 45/0, and above 50 ms are 0/0. The previous A matrix counted 32 first-use frames above 25 ms. Whole-page MAX is 1583.3 ms with 5529 frames above 25 ms and 3100 above 50 ms.

| Configuration | Page MAX ms | First MAX ms | First >25 | Repeat MAX ms |
| --- | ---: | ---: | ---: | ---: |
| 1280×720 DPR1 CPU1 medium | 333.4 | 16.8 | 0 | 16.8 |
| 1280×720 DPR2 CPU1 medium | 350.1 | 16.8 | 0 | 16.8 |
| 1440×900 DPR1 CPU1 medium | 350.0 | 33.3 | 1 | 16.8 |
| 1440×900 DPR2 CPU1 medium | 350.0 | 16.8 | 0 | 16.8 |
| 1280×720 DPR1 CPU4 medium | 1500.0 | 33.4 | 10 | 16.8 |
| 1280×720 DPR2 CPU4 medium | 1566.6 | 33.4 | 11 | 16.8 |
| 1440×900 DPR1 CPU4 medium | 1466.6 | 33.4 | 17 | 16.8 |
| 1440×900 DPR2 CPU4 medium | 1583.3 | 33.4 | 6 | 16.8 |
| 1280×720 DPR1 CPU1 low | 333.4 | 16.8 | 0 | 16.8 |
| 2560×1440 DPR1 CPU1 medium | 350.0 | 16.8 | 0 | 16.8 |

## Top-offender profiles
REFERENCE: skills/profiles/summary.json, skills/profiles/*/trace-attribution.json, tools/cardrpg-big/trace-report.mjs

Five cold reruns of the highest-ranked 33.4 ms first casts measured 16.8 ms first casts. The original cast spikes remain unattributed because they did not recur under profiling. Every raw interval and original result remains retained.

| Action / configuration | Profile page MAX ms | Decoder sampled ms |
| --- | ---: | ---: |
| 1280x720-dpr2-cpu4-medium-cinnamon-2 | 1349.9 | 1171.1 |
| 1440x900-dpr1-cpu4-medium-sorrel-1 | 1366.7 | 1187.5 |
| 1280x720-dpr2-cpu4-medium-enemy-teacup-healer | 1399.9 | 1165.3 |
| 1280x720-dpr2-cpu4-medium-soot-2 | 1349.9 | 1161.4 |
| 1280x720-dpr2-cpu4-medium-enemy-kettle-knight | 1399.9 | 1160.2 |

The dominant opening samples point to zero-based HTML line 2, column 12891464 in the frozen artifact. That location identifies the enclosing async loader. Its first synchronous statement is `Uint8Array.from(atob(...), c => c.charCodeAt(0))`, at columns 12891486 and 12891555. The wrapper accounts for 1160.2–1187.5 ms of samples, plus separate garbage-collection samples. The trace does not isolate the callback alone. The F2 loader replaces this synchronous conversion. Profile reruns do not establish a cause for the seven cold-run increases relative to A.

The cast MAX gate passes. The whole-page/CPU4 maximum gate fails. The increase from 32 to 45 first-use intervals above 25 ms remains disclosed.
