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

The full-page hitch gate fails. The 1440 DPR2 maximum rose from 383.4 to 433.4 ms and CPU4 DPR2 rose from 1399.8 to 1466.5 ms versus A. Those increases remain recorded until profile evidence separates loader variation from scene work. The complete 610-case matrix follows this source checkpoint.

Build receipt runtime-source hashes match. The layout measurement script changed after the HTML build to add post-summon fixture coverage, which does not enter the runtime bundle.
