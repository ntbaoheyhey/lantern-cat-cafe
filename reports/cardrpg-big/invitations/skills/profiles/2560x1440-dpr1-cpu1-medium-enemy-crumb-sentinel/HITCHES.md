# Cold-page hitch attribution
REFERENCE: 2560x1440-dpr1-cpu1-medium-enemy-crumb-sentinel-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 558.0 | 33.3 | EvaluateScript 28.5 ms, v8.compile 19.2 ms, ProxyMain::BeginMainFrame 13.2 ms | (program) (7.6 ms sampled), (anonymous) (5.8 ms sampled), (anonymous) (5.1 ms sampled) |
| 591.3 | 33.3 | ProxyMain::BeginMainFrame 13.2 ms, Layout 10.8 ms, FunctionCall 1.0 ms | (idle) (25.2 ms sampled), (program) (7.1 ms sampled), (anonymous) (0.3 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
