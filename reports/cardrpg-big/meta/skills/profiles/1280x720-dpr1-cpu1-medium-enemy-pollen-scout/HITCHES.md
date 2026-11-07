# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu1-medium-enemy-pollen-scout-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 92.3 | 33.3 | ParseHTML 2.1 ms | (program) (33.3 ms sampled) |
| 575.6 | 33.3 | EvaluateScript 28.2 ms, v8.compile 19.0 ms, ProxyMain::BeginMainFrame 13.1 ms | (anonymous) (7.0 ms sampled), (program) (6.9 ms sampled), (anonymous) (5.0 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
