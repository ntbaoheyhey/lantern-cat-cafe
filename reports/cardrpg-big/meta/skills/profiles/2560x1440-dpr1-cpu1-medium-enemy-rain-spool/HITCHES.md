# Cold-page hitch attribution
REFERENCE: 2560x1440-dpr1-cpu1-medium-enemy-rain-spool-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 91.0 | 33.3 | ParseHTML 2.1 ms | (program) (33.3 ms sampled) |
| 574.4 | 33.4 | EvaluateScript 28.5 ms, v8.compile 19.1 ms, ProxyMain::BeginMainFrame 12.9 ms | (program) (10.6 ms sampled), (anonymous) (4.9 ms sampled), (anonymous) (3.1 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
