# Cold-page hitch attribution
REFERENCE: 1440x900-dpr2-cpu4-medium-sorrel-3-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 283.5 | 83.4 |  | (program) (83.5 ms sampled) |
| 1766.7 | 1483.2 | ParseHTML 1480.1 ms, EvaluateScript 1473.0 ms, MinorGC 18.1 ms | (anonymous) (1282.5 ms sampled), (garbage collector) (69.8 ms sampled), (program) (58.4 ms sampled) |
| 2000.0 | 216.6 | DecompressionStream Inflate 56.8 ms, DecompressionStream Inflate 54.0 ms, DecompressionStream Inflate 45.0 ms | (program) (214.7 ms sampled) |
| 2033.4 | 33.4 | DecompressionStream Inflate 20.0 ms, EvaluateScript 10.5 ms, ProxyMain::BeginMainFrame 0.8 ms | (program) (34.8 ms sampled) |
| 2733.4 | 700.0 | EvaluateScript 497.7 ms, v8.compile 461.4 ms, MajorGC 7.6 ms | (anonymous) (643.7 ms sampled), (program) (23.0 ms sampled), (anonymous) (9.5 ms sampled) |
| 2866.7 | 133.3 | EvaluateScript 497.7 ms, ProxyMain::BeginMainFrame 72.4 ms, Layout 60.1 ms | (program) (67.4 ms sampled), (anonymous) (22.3 ms sampled), (idle) (3.6 ms sampled) |
| 2900.0 | 33.3 | ProxyMain::BeginMainFrame 72.4 ms, Layout 60.1 ms, PrePaint 5.1 ms | (program) (16.5 ms sampled), query (2.2 ms sampled), (idle) (1.9 ms sampled) |
| 3016.7 | 50.0 | ProxyMain::BeginMainFrame 29.5 ms, EventDispatch 26.6 ms, FunctionCall 21.8 ms | (program) (28.0 ms sampled), (anonymous) (13.5 ms sampled), removeChild (0.9 ms sampled) |
| 3400.0 | 250.0 | EventDispatch 262.7 ms, FunctionCall 262.2 ms, Layout 6.5 ms | jg (77.3 ms sampled), me (10.4 ms sampled), resizeToHost (9.6 ms sampled) |
| 3433.3 | 33.3 | EventDispatch 262.7 ms, FunctionCall 262.2 ms, ProxyMain::BeginMainFrame 5.7 ms | (program) (17.1 ms sampled), (idle) (8.8 ms sampled), setSize (2.2 ms sampled) |
| 3683.4 | 33.4 | ProxyMain::BeginMainFrame 0.8 ms, UpdateLayoutTree 0.1 ms, FireAnimationFrame 0.0 ms | (idle) (12.2 ms sampled), load (6.8 ms sampled), (program) (6.7 ms sampled) |
| 4766.6 | 116.6 | MinorGC 3.2 ms, V8.GCScavenger 3.0 ms, V8.GC_SCAVENGER 3.0 ms | Zm (4.3 ms sampled), (garbage collector) (3.5 ms sampled), fh (3.4 ms sampled) |
| 4900.0 | 116.7 | TimerFire 120.3 ms, GLES2Implementation::GetProgramiv 0.9 ms, ImplementationBase::WaitForCmd 0.9 ms | C (11.3 ms sampled), Se (6.8 ms sampled), n (3.7 ms sampled) |
| 5216.6 | 300.0 | TimerFire 306.1 ms, GLES2Implementation::GetProgramiv 12.0 ms, ImplementationBase::WaitForCmd 12.0 ms | g (20.2 ms sampled), C (14.6 ms sampled), $e (12.5 ms sampled) |
| 5250.0 | 33.4 | TimerFire 306.1 ms, ProxyMain::BeginMainFrame 17.8 ms, FireAnimationFrame 13.3 ms | (program) (8.8 ms sampled), Ng (1.6 ms sampled), (idle) (1.5 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
