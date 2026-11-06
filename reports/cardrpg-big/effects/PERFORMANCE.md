# F4 starter performance
REFERENCE: ../memory/PROMPT.md lines71–72 and142–144, performance/summary.json, performance-cpu4/summary.json, ../motion/PERFORMANCE.md

## Cold opening and real battle clicks
REFERENCE: performance/*.json, performance-cpu4/HITCHES.md, performance-cpu4/trace-attribution.json

All seven runs open the offline file with a fresh browser context and cache disabled. RAF collection starts before navigation. Real mouse clicks open the first automatic battle. Loading, input, first battle and the following observation window are included. Screenshot capture is disabled for timing. CPU 4× affects CPU execution only.

| Viewport | DPR | CPU | MAX ms | p95 ms | Frames >25 ms | Frames >50 ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1280×720 | 1 | Native | 49.9 | 16.7 | 3 | 0 |
| 1280×720 | 2 | Native | 33.3 | 16.7 | 3 | 0 |
| 1440×900 | 1 | Native | 50.0 | 16.7 | 3 | 0 |
| 1440×900 | 2 | Native | 50.0 | 16.8 | 3 | 0 |
| 1280×720 | 1 | 4× | 216.7 | 16.7 | 12 | 5 |
| 1280×720 | 2 | 4× | 233.4 | 16.8 | 12 | 5 |
| 2560×1440 | 1 | Native | 50.0 | 16.7 | 4 | 0 |

The native opening maximum improves from the F3 cold range of83.4–100.1 ms to33.3–50.0 ms. The CPU 4× maximum improves from333.3–383.4 ms to216.7–233.4 ms, while still exceeding the100 ms gate. Every run has zero page errors.

A separate CPU 4× DPR2 profiling run records MAX116.6 ms and14 intervals above33 ms. The changed timing in the profiling run is retained separately. Its112.0 ms EvaluateScript task includes75.5 ms of compilation. A subsequent click dispatch takes92.2 ms, with scene resizing among the sampled leaves. A later89.9 ms timer includes27.0 ms of image decoding. Exact inclusive tasks, statistical sample stacks and source offsets are in the trace report. These observations support splitting the remaining script compilation and scene setup work in F6.

## First-use and repeat-use matrix
REFERENCE: skills/summary.json, ../../../tools/cardrpg-big/skill-measure.mjs

The complete matrix covers720 cases,72 gallery actions across ten viewport, DPR, CPU and quality configurations, with1,440 casts and249,394 raw frames. All cases have zero page errors and complete action coverage. Whole-pageMAX is266.7 ms, with4,727 frames above25 ms and1,374 above50 ms. First-useMAX is33.4 ms with7 frames above25 ms. Repeat-useMAX is16.8 ms with zero frames above25 ms. Every cast remains below50 ms.

All primary native-DPR cast frames are at most20 ms. The lowest per-configuration first-use fraction within20 ms is99.94% in1440×900 DPR2 CPU4. Peak scene complexity during casts is207 draw calls and93,802 triangles, below250 and150,000. The largest first-use geometry-count delta is5 and repeat-use is0. Heap snapshots are transient allocation measurements. Twenty-battle retained-heap stability remains a separate F6 gate.

The five profile reruns record first-useMAX16.8,16.8,33.3,16.8,16.8 ms and repeat-useMAX16.8 ms throughout. The reproduced33.3 ms Crumb Sentinel interval ends1.1 ms after the cast snapshot and begins32.2 ms before it. Its trace overlaps compositor/main-frame work and renderer samples from fixture setup. It cannot be attributed solely to the skill. The other original33 ms spikes do not recur under profiling. Original raw data and reruns are both retained.

CPU4 profiling again shows110.9 ms script evaluation including74.7 ms compilation,74.1 ms click dispatch, and89.4 ms image/upload work. The phase lowers the complete matrix whole-page maximum from F3's566.7 ms to266.7 ms, while still missing the100 ms CPU4 opening gate. The two matrices contain61 and72 actions respectively. CastMAX remains33.4/16.8 ms.

## Artifact identity
REFERENCE: ../validation/f4-final.json, verified/captures.json, runtime/checks.json, layout/measurements.json, screens/checks.json

The measured HTML has SHA-256 `061fe9251a7eb546682a4aac6fba9bfa723ccf5a0f1506c0dc7ff1f8ff52bf03` and18,562,134 bytes. The effect captures, runtime controls, layout and screenshots all reference this hash. Final typecheck, lint, build,1661 web units,903 rules units and421 E2E checks pass. Rules also report2 expected failures and11 skipped tests.

The builder receipt is refreshed after measurement-only changes to gzip trace storage and neutral report wording. The rebuilt HTML is checked against the measured hash before publication.
