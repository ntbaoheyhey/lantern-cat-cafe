# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu4-medium-enemy-pollen-scout-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 56.4 | 33.3 | ProxyMain::BeginMainFrame 16.8 ms, Layout 13.8 ms, ParseHTML 10.6 ms | (program) (33.2 ms sampled) |
| 323.0 | 100.0 | ParseHTML 8.5 ms | (program) (100.0 ms sampled) |
| 1156.4 | 33.3 | TimerFire 20.7 ms, FunctionCall 0.0 ms | fetch (19.7 ms sampled), (idle) (12.5 ms sampled), unpack (0.9 ms sampled) |
| 1189.7 | 33.3 | ProxyMain::BeginMainFrame 1.8 ms, Layout 0.1 ms, Commit 0.0 ms | (idle) (19.2 ms sampled), (program) (13.5 ms sampled), unpack (0.1 ms sampled) |
| 1473.0 | 99.9 | EvaluateScript 102.2 ms, v8.compile 68.6 ms, v8.newInstance 0.0 ms | (anonymous) (76.7 ms sampled), (anonymous) (7.3 ms sampled), (anonymous) (1.5 ms sampled) |
| 1573.0 | 100.0 | EvaluateScript 102.2 ms, ProxyMain::BeginMainFrame 54.3 ms, Layout 44.7 ms | (program) (54.4 ms sampled), (anonymous) (19.9 ms sampled), Jo (1.7 ms sampled) |
| 1806.3 | 33.3 | ProxyMain::BeginMainFrame 25.6 ms, EventDispatch 21.0 ms, FunctionCall 18.3 ms | (program) (19.3 ms sampled), (anonymous) (11.4 ms sampled), bu (0.9 ms sampled) |
| 2189.7 | 266.7 | EventDispatch 265.3 ms, FunctionCall 264.7 ms, Layout 5.0 ms | Mg (71.9 ms sampled), (garbage collector) (11.1 ms sampled), makeStage (9.9 ms sampled) |
| 2923.0 | 100.1 | TimerFire 114.6 ms, MinorGC 1.2 ms, V8.GCScavenger 1.2 ms | Qm (5.9 ms sampled), ph (5.3 ms sampled), g (3.9 ms sampled) |
| 3056.3 | 116.6 | TimerFire 126.4 ms, MinorGC 2.6 ms, V8.GCScavenger 2.6 ms | C (13.3 ms sampled), ph (4.6 ms sampled), Qe (3.7 ms sampled) |
| 3422.9 | 333.3 | TimerFire 336.7 ms, Decode Image 26.4 ms, ProxyMain::BeginMainFrame 12.5 ms | xe (41.2 ms sampled), Qe (18.6 ms sampled), g (18.3 ms sampled) |
| 3472.9 | 33.3 | ProxyMain::BeginMainFrame 15.1 ms, ProxyMain::BeginMainFrame 13.2 ms, FireAnimationFrame 12.1 ms | (program) (7.4 ms sampled), (idle) (1.6 ms sampled), PerformanceObserver.observe.type.type (1.2 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
