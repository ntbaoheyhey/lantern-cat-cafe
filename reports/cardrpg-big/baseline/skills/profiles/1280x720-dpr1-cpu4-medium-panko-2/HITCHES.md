# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu4-medium-panko-2-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 64.4 | 33.3 | ProxyMain::BeginMainFrame 17.1 ms, Layout 13.2 ms, ParseHTML 12.0 ms | (program) (33.0 ms sampled) |
| 297.8 | 116.7 | ParseHTML 17.8 ms | (program) (116.7 ms sampled) |
| 1781.1 | 1483.3 | ParseHTML 1490.4 ms, EvaluateScript 1481.5 ms, MinorGC 18.1 ms | (anonymous) (1276.2 ms sampled), (garbage collector) (76.5 ms sampled), (program) (54.9 ms sampled) |
| 2014.4 | 233.3 | ParseHTML 1490.4 ms, EvaluateScript 1481.5 ms, DecompressionStream Inflate 52.6 ms | (program) (224.5 ms sampled), (anonymous) (8.6 ms sampled), PerformanceObserver.observe.type.type (0.5 ms sampled) |
| 2047.7 | 33.3 | EvaluateScript 16.9 ms, ProxyMain::BeginMainFrame 1.6 ms, FunctionCall 0.0 ms | (program) (28.9 ms sampled), (anonymous) (1.5 ms sampled), InjectedScript (1.3 ms sampled) |
| 2697.6 | 649.9 | EvaluateScript 471.9 ms, v8.compile 436.8 ms, MajorGC 6.4 ms | (anonymous) (594.7 ms sampled), (program) (12.5 ms sampled), (anonymous) (9.1 ms sampled) |
| 2797.7 | 100.1 | ProxyMain::BeginMainFrame 58.3 ms, Layout 49.0 ms, FunctionCall 41.7 ms | (program) (49.6 ms sampled), (anonymous) (21.6 ms sampled), (idle) (4.1 ms sampled) |
| 2831.0 | 33.3 | ProxyMain::BeginMainFrame 58.3 ms, Layout 49.0 ms, PrePaint 4.4 ms | (program) (17.8 ms sampled), (anonymous) (1.4 ms sampled), computeAccessibleNameComposite (1.2 ms sampled) |
| 2931.0 | 33.3 | ProxyMain::BeginMainFrame 29.5 ms, EventDispatch 22.4 ms, FunctionCall 19.1 ms | (program) (17.1 ms sampled), (anonymous) (11.6 ms sampled), removeChild (1.3 ms sampled) |
| 3281.0 | 283.3 | EventDispatch 274.1 ms, FunctionCall 264.4 ms, Layout 24.3 ms | Tg (77.3 ms sampled), resizeToHost (29.6 ms sampled), (program) (20.7 ms sampled) |
| 4564.3 | 116.7 | MinorGC 2.4 ms, V8.GCScavenger 1.7 ms, V8.GC_SCAVENGER 1.7 ms | Gm (6.4 ms sampled), g (5.9 ms sampled), ug (5.1 ms sampled) |
| 4697.6 | 100.0 | TimerFire 125.1 ms, GLES2Implementation::GetProgramiv 1.2 ms, ImplementationBase::WaitForCmd 1.2 ms | C (11.6 ms sampled), xe (6.5 ms sampled), n (5.0 ms sampled) |
| 5014.2 | 283.3 | TimerFire 288.1 ms, ProxyMain::BeginMainFrame 14.5 ms, GLES2Implementation::GetProgramiv 11.8 ms | g (18.6 ms sampled), C (14.8 ms sampled), Qe (14.3 ms sampled) |
| 5064.3 | 50.1 | ProxyMain::BeginMainFrame 23.2 ms, ProxyMain::BeginMainFrame 14.5 ms, FireAnimationFrame 13.1 ms | (program) (18.9 ms sampled), (idle) (1.4 ms sampled), ip (1.0 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
