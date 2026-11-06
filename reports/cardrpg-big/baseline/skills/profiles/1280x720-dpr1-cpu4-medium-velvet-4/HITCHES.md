# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu4-medium-velvet-4-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 317.1 | 99.9 |  | (program) (100.1 ms sampled) |
| 1833.8 | 1516.7 | ParseHTML 1504.9 ms, EvaluateScript 1490.2 ms, MinorGC 22.6 ms | (anonymous) (1295.2 ms sampled), (garbage collector) (77.8 ms sampled), (program) (59.7 ms sampled) |
| 2067.1 | 233.3 | ParseHTML 1504.9 ms, EvaluateScript 1490.2 ms, DecompressionStream Inflate 57.5 ms | (program) (232.2 ms sampled), (anonymous) (0.7 ms sampled), PerformanceObserver.observe.type.type (0.6 ms sampled) |
| 2117.1 | 50.0 | DecompressionStream Inflate 23.7 ms, EvaluateScript 17.0 ms, ProxyMain::BeginMainFrame 2.0 ms | (program) (45.6 ms sampled), InjectedScript (2.2 ms sampled), addEventListener (0.8 ms sampled) |
| 2817.0 | 699.9 | EvaluateScript 494.2 ms, v8.compile 456.6 ms, MajorGC 7.6 ms | (anonymous) (632.4 ms sampled), (program) (24.2 ms sampled), (anonymous) (8.8 ms sampled) |
| 2933.7 | 116.7 | EvaluateScript 494.2 ms, ProxyMain::BeginMainFrame 65.0 ms, Layout 53.9 ms | (program) (58.8 ms sampled), (anonymous) (22.6 ms sampled), (idle) (4.5 ms sampled) |
| 2967.0 | 33.3 | ProxyMain::BeginMainFrame 65.0 ms, Layout 53.9 ms, PrePaint 4.4 ms | (program) (17.0 ms sampled), (anonymous) (1.5 ms sampled), (idle) (1.4 ms sampled) |
| 3067.0 | 33.3 | ProxyMain::BeginMainFrame 27.4 ms, EventDispatch 24.8 ms, FunctionCall 20.7 ms | (program) (14.4 ms sampled), (anonymous) (12.0 ms sampled), removeChild (1.1 ms sampled) |
| 3417.0 | 283.3 | EventDispatch 279.1 ms, FunctionCall 269.4 ms, Layout 25.4 ms | Tg (74.8 ms sampled), resizeToHost (30.1 ms sampled), (program) (13.6 ms sampled) |
| 4767.0 | 116.8 | MinorGC 1.7 ms, V8.GCScavenger 1.7 ms, V8.GC_SCAVENGER 1.5 ms | Gm (6.7 ms sampled), ug (5.4 ms sampled), oh (4.0 ms sampled) |
| 4950.3 | 150.0 | TimerFire 175.3 ms, GLES2Implementation::GetProgramiv 4.0 ms, ImplementationBase::WaitForCmd 4.0 ms | C (31.0 ms sampled), n (6.6 ms sampled), xe (6.2 ms sampled) |
| 5333.6 | 350.0 | TimerFire 358.3 ms, ProxyMain::BeginMainFrame 15.1 ms, GLES2Implementation::GetProgramiv 12.5 ms | g (21.6 ms sampled), tt (16.4 ms sampled), C (15.8 ms sampled) |
| 5383.6 | 50.0 | ProxyMain::BeginMainFrame 23.4 ms, ProxyMain::BeginMainFrame 15.1 ms, FireAnimationFrame 13.9 ms | (program) (20.4 ms sampled), ip (1.6 ms sampled), renderBufferDirect (1.4 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
