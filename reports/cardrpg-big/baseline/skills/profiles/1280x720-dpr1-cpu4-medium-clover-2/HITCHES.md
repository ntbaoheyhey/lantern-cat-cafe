# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu4-medium-clover-2-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 324.1 | 99.9 |  | (program) (100.0 ms sampled) |
| 1824.1 | 1483.3 | ParseHTML 1476.8 ms, EvaluateScript 1475.5 ms, MinorGC 20.1 ms | (anonymous) (1283.8 ms sampled), (garbage collector) (71.3 ms sampled), (anonymous) (60.4 ms sampled) |
| 2057.4 | 233.3 | DecompressionStream Inflate 57.5 ms, DecompressionStream Inflate 53.4 ms, DecompressionStream Inflate 51.0 ms | (program) (232.5 ms sampled), PerformanceObserver.observe.type.type (0.8 ms sampled) |
| 2090.7 | 33.3 | DecompressionStream Inflate 24.3 ms, EvaluateScript 17.1 ms, ProxyMain::BeginMainFrame 2.1 ms | (program) (29.5 ms sampled), InjectedScript (2.1 ms sampled), (anonymous) (1.3 ms sampled) |
| 2774.0 | 683.3 | EvaluateScript 491.8 ms, v8.compile 454.7 ms, MajorGC 6.8 ms | (anonymous) (620.8 ms sampled), (program) (25.0 ms sampled), (garbage collector) (7.6 ms sampled) |
| 2890.7 | 116.7 | EvaluateScript 491.8 ms, ProxyMain::BeginMainFrame 59.1 ms, Layout 46.5 ms | (program) (60.9 ms sampled), (anonymous) (21.1 ms sampled), (idle) (3.6 ms sampled) |
| 3007.3 | 33.3 | ProxyMain::BeginMainFrame 28.8 ms, EventDispatch 22.6 ms, FunctionCall 19.4 ms | (program) (16.9 ms sampled), (anonymous) (12.3 ms sampled), bu (0.9 ms sampled) |
| 3374.0 | 300.0 | EventDispatch 290.3 ms, FunctionCall 278.7 ms, Layout 31.2 ms | Tg (74.8 ms sampled), resizeToHost (37.0 ms sampled), (program) (19.4 ms sampled) |
| 4740.6 | 116.6 | MinorGC 2.8 ms, V8.GCScavenger 2.4 ms, V8.GC_SCAVENGER 2.4 ms | Gm (5.3 ms sampled), oh (4.0 ms sampled), g (3.1 ms sampled) |
| 5240.6 | 483.3 | TimerFire 470.3 ms, ProxyMain::BeginMainFrame 15.9 ms, GLES2Implementation::GetProgramiv 11.5 ms | C (23.3 ms sampled), tt (19.4 ms sampled), g (17.1 ms sampled) |
| 5290.6 | 50.0 | ProxyMain::BeginMainFrame 28.8 ms, ProxyMain::BeginMainFrame 15.9 ms, FireAnimationFrame 14.9 ms | (program) (24.7 ms sampled), c (2.0 ms sampled), Dr (1.3 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
