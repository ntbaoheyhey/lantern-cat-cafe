# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu4-medium-brioche-2-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 64.0 | 33.4 | ProxyMain::BeginMainFrame 17.7 ms, Layout 15.1 ms, ParseHTML 12.3 ms | (program) (32.9 ms sampled), requestAnimationFrame (0.7 ms sampled), (idle) (0.0 ms sampled) |
| 297.3 | 116.6 | ParseHTML 17.3 ms | (program) (116.3 ms sampled) |
| 1747.3 | 1450.0 | ParseHTML 1462.0 ms, EvaluateScript 1452.4 ms, MinorGC 19.4 ms | (anonymous) (1243.7 ms sampled), (garbage collector) (73.0 ms sampled), (anonymous) (55.5 ms sampled) |
| 1980.6 | 233.3 | ParseHTML 1462.0 ms, EvaluateScript 1452.4 ms, DecompressionStream Inflate 53.8 ms | (program) (220.2 ms sampled), (anonymous) (11.8 ms sampled), (anonymous) (0.9 ms sampled) |
| 2030.6 | 50.0 | DecompressionStream Inflate 22.8 ms, EvaluateScript 16.0 ms, ProxyMain::BeginMainFrame 2.5 ms | (program) (45.4 ms sampled), (anonymous) (1.3 ms sampled), InjectedScript (1.0 ms sampled) |
| 2680.6 | 650.0 | EvaluateScript 471.4 ms, v8.compile 437.4 ms, MajorGC 6.6 ms | (anonymous) (600.5 ms sampled), (program) (13.3 ms sampled), (anonymous) (8.3 ms sampled) |
| 2797.2 | 116.6 | EvaluateScript 471.4 ms, ProxyMain::BeginMainFrame 61.4 ms, Layout 50.9 ms | (program) (61.1 ms sampled), (anonymous) (22.0 ms sampled), (idle) (3.4 ms sampled) |
| 2830.6 | 33.4 | ProxyMain::BeginMainFrame 61.4 ms, PrePaint 4.3 ms, Paint 3.6 ms | (program) (13.6 ms sampled), (idle) (3.6 ms sampled), (anonymous) (1.5 ms sampled) |
| 2930.5 | 49.9 | ProxyMain::BeginMainFrame 37.2 ms, EventDispatch 24.9 ms, FunctionCall 21.4 ms | (program) (31.0 ms sampled), (anonymous) (13.4 ms sampled), removeChild (1.0 ms sampled) |
| 3280.5 | 300.0 | EventDispatch 293.8 ms, FunctionCall 284.0 ms, Layout 27.4 ms | Tg (74.0 ms sampled), resizeToHost (32.9 ms sampled), (program) (16.2 ms sampled) |
| 4697.1 | 149.9 | MinorGC 3.4 ms, V8.GCScavenger 3.4 ms, V8.GC_SCAVENGER 3.4 ms | Qe (5.0 ms sampled), Gm (4.7 ms sampled), xh (4.4 ms sampled) |
| 4847.2 | 133.4 | TimerFire 145.5 ms, GLES2Implementation::GetProgramiv 1.4 ms, ImplementationBase::WaitForCmd 1.4 ms | C (13.2 ms sampled), xe (7.9 ms sampled), n (5.2 ms sampled) |
| 5280.4 | 399.9 | TimerFire 407.9 ms, ProxyMain::BeginMainFrame 16.1 ms, GLES2Implementation::GetProgramiv 8.3 ms | g (25.3 ms sampled), tt (22.2 ms sampled), renderBufferDirect (15.6 ms sampled) |
| 5330.4 | 50.0 | ProxyMain::BeginMainFrame 28.5 ms, FireAnimationFrame 16.3 ms, ProxyMain::BeginMainFrame 16.1 ms | (program) (22.2 ms sampled), Ze (1.6 ms sampled), (idle) (1.3 ms sampled) |
| 5363.7 | 33.3 | ProxyMain::BeginMainFrame 28.5 ms, FireAnimationFrame 16.3 ms, ProxyMain::BeginMainFrame 9.7 ms | (program) (10.0 ms sampled), g (1.9 ms sampled), clipAction (1.1 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
