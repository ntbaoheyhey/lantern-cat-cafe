# Cold-page hitch attribution
REFERENCE: 1440x900-dpr1-cpu4-medium-enemy-sock-skipper-basic-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 76.9 | 33.4 | ProxyMain::BeginMainFrame 19.0 ms, Layout 16.3 ms, ParseHTML 9.9 ms | (program) (32.3 ms sampled), (idle) (0.8 ms sampled) |
| 410.2 | 150.0 |  | (program) (150.1 ms sampled) |
| 443.5 | 33.3 | ParseHTML 12.3 ms, ProxyMain::BeginMainFrame 3.5 ms, FireAnimationFrame 3.1 ms | (program) (29.5 ms sampled), fetch (2.6 ms sampled), (anonymous) (1.1 ms sampled) |
| 1693.4 | 33.3 | TimerFire 23.9 ms | (idle) (18.7 ms sampled), fetch (14.5 ms sampled), unpack (0.4 ms sampled) |
| 1726.7 | 33.3 | ProxyMain::BeginMainFrame 1.9 ms, WidgetBase::WillBeginMainFrame 0.7 ms, Paint 0.6 ms | (idle) (19.1 ms sampled), (program) (13.6 ms sampled), unpack (0.1 ms sampled) |
| 2160.1 | 150.0 | EvaluateScript 135.4 ms, v8.compile 91.5 ms, MinorGC 1.7 ms | (anonymous) (108.6 ms sampled), (anonymous) (8.5 ms sampled), (garbage collector) (2.1 ms sampled) |
| 2276.7 | 116.6 | EvaluateScript 135.4 ms, ProxyMain::BeginMainFrame 68.9 ms, Layout 54.0 ms | (program) (70.7 ms sampled), (anonymous) (21.9 ms sampled), ml (2.2 ms sampled) |
| 2643.4 | 50.0 | ProxyMain::BeginMainFrame 33.6 ms, EventDispatch 26.2 ms, FunctionCall 21.6 ms | (program) (24.6 ms sampled), (anonymous) (13.8 ms sampled), removeChild (2.0 ms sampled) |
| 3293.4 | 66.7 | EventDispatch 76.1 ms, FunctionCall 75.2 ms, Layout 6.8 ms | he (10.6 ms sampled), resizeToHost (9.7 ms sampled), e (5.1 ms sampled) |
| 3643.3 | 50.0 | TimerFire 73.1 ms, MinorGC 1.5 ms, MinorGC 1.1 ms | e (4.8 ms sampled), clone (4.5 ms sampled), (garbage collector) (3.7 ms sampled) |
| 3676.6 | 33.3 | TimerFire 73.1 ms, ProxyMain::BeginMainFrame 2.4 ms, TimerFire 2.3 ms | (program) (8.5 ms sampled), e (1.8 ms sampled), dx (1.8 ms sampled) |
| 4509.9 | 33.2 | TimerFire 49.6 ms, V8.DeoptimizeCode 0.0 ms, V8.DeoptimizeCode 0.0 ms | kg (4.3 ms sampled), e (1.9 ms sampled), e (1.8 ms sampled) |
| 4593.4 | 66.7 | TimerFire 76.2 ms, MinorGC 2.8 ms, V8.GCScavenger 2.8 ms | Th (5.5 ms sampled), uh (4.4 ms sampled), Ac (3.3 ms sampled) |
| 4659.9 | 49.9 | TimerFire 55.0 ms, GLES2Implementation::GetProgramiv 1.1 ms, ImplementationBase::WaitForCmd 1.1 ms | C (10.8 ms sampled), et (2.4 ms sampled), render (2.1 ms sampled) |
| 4943.3 | 50.0 | TimerFire 59.0 ms, MinorGC 3.7 ms, V8.GCScavenger 3.7 ms | Th (5.2 ms sampled), uh (3.8 ms sampled), (garbage collector) (3.7 ms sampled) |
| 6243.3 | 100.0 | TimerFire 96.9 ms, Decode Image 29.6 ms, ProxyMain::BeginMainFrame 14.3 ms | Ce (46.0 ms sampled), C (14.1 ms sampled), render (5.2 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
