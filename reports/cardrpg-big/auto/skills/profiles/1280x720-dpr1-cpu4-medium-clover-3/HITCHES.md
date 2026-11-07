# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu4-medium-clover-3-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 64.3 | 33.4 | ProxyMain::BeginMainFrame 17.7 ms, Layout 14.0 ms, ParseHTML 11.6 ms | (program) (33.4 ms sampled) |
| 297.6 | 100.0 | ParseHTML 9.3 ms | (program) (99.9 ms sampled) |
| 1730.9 | 1433.3 | ParseHTML 1429.8 ms, EvaluateScript 1420.8 ms, MinorGC 12.4 ms | (anonymous) (1245.6 ms sampled), (garbage collector) (61.9 ms sampled), (anonymous) (54.2 ms sampled) |
| 1964.1 | 233.2 | ParseHTML 1429.8 ms, EvaluateScript 1420.8 ms, DecompressionStream Inflate 53.2 ms | (program) (232.2 ms sampled), (anonymous) (1.3 ms sampled) |
| 1997.5 | 33.4 | EvaluateScript 15.4 ms, ProxyMain::BeginMainFrame 2.1 ms, FireAnimationFrame 0.6 ms | (program) (29.0 ms sampled), InjectedScript (1.4 ms sampled), (anonymous) (1.0 ms sampled) |
| 2647.5 | 650.0 | EvaluateScript 471.1 ms, v8.compile 433.5 ms, MajorGC 6.0 ms | (anonymous) (598.2 ms sampled), (program) (13.8 ms sampled), (anonymous) (9.5 ms sampled) |
| 2780.9 | 133.4 | EvaluateScript 471.1 ms, ProxyMain::BeginMainFrame 71.9 ms, Layout 58.1 ms | (program) (74.9 ms sampled), (anonymous) (22.5 ms sampled), J (3.0 ms sampled) |
| 2814.2 | 33.3 | ProxyMain::BeginMainFrame 71.9 ms, PrePaint 5.0 ms, Paint 4.0 ms | (program) (14.8 ms sampled), (idle) (3.0 ms sampled), getTextAlternativeInternal (0.9 ms sampled) |
| 2914.2 | 50.0 | ProxyMain::BeginMainFrame 28.5 ms, EventDispatch 24.1 ms, FunctionCall 20.8 ms | (program) (28.3 ms sampled), (anonymous) (12.4 ms sampled), removeChild (1.4 ms sampled) |
| 3347.4 | 299.9 | EventDispatch 300.6 ms, FunctionCall 299.3 ms, Layout 10.6 ms | jg (81.3 ms sampled), resizeToHost (13.9 ms sampled), me (10.7 ms sampled) |
| 3664.2 | 33.4 | ProxyMain::BeginMainFrame 1.8 ms, ProxyMain::BeginMainFrame 0.8 ms, Paint 0.7 ms | (program) (12.5 ms sampled), (idle) (10.9 ms sampled), (anonymous) (2.3 ms sampled) |
| 3980.8 | 33.4 | V8.GCPhantomHandleProcessingCallback 2.6 ms, V8.GC_HEAP_EXTERNAL_SECOND_PASS_CALLBACKS 2.6 ms, ProxyMain::BeginMainFrame 0.8 ms | (idle) (20.6 ms sampled), (program) (11.2 ms sampled), fetch (1.7 ms sampled) |
| 4797.4 | 133.3 | MinorGC 2.9 ms, V8.GCScavenger 2.5 ms, V8.GC_SCAVENGER 2.0 ms | Zm (5.0 ms sampled), gg (4.7 ms sampled), g (4.4 ms sampled) |
| 4947.4 | 133.3 | TimerFire 141.2 ms, GLES2Implementation::GetProgramiv 1.1 ms, GLES2Implementation::GetProgramiv 1.0 ms | C (12.0 ms sampled), Se (7.1 ms sampled), n (5.4 ms sampled) |
| 5230.7 | 250.0 | TimerFire 270.9 ms, GLES2Implementation::GetProgramiv 10.5 ms, ImplementationBase::WaitForCmd 10.5 ms | g (19.4 ms sampled), C (13.7 ms sampled), s (9.3 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
