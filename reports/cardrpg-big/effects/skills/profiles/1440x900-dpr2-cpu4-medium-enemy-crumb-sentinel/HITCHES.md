# Cold-page hitch attribution
REFERENCE: 1440x900-dpr2-cpu4-medium-enemy-crumb-sentinel-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 351.1 | 133.3 | ParseHTML 9.1 ms | (program) (133.7 ms sampled) |
| 1167.8 | 33.4 | TimerFire 21.2 ms | fetch (17.2 ms sampled), (idle) (16.4 ms sampled), unpack (0.1 ms sampled) |
| 1217.8 | 33.3 | DecompressionStream Inflate 17.8 ms, ProxyMain::BeginMainFrame 0.7 ms, Commit 0.6 ms | (program) (17.2 ms sampled), (idle) (16.0 ms sampled) |
| 1551.1 | 116.7 | EvaluateScript 111.5 ms, v8.compile 75.6 ms, MinorGC 1.1 ms | (anonymous) (84.4 ms sampled), (anonymous) (7.0 ms sampled), (anonymous) (1.1 ms sampled) |
| 1634.4 | 83.3 | EvaluateScript 111.5 ms, ProxyMain::BeginMainFrame 55.1 ms, Layout 45.2 ms | (program) (40.1 ms sampled), (anonymous) (20.1 ms sampled), ap (1.7 ms sampled) |
| 1834.4 | 33.4 | ProxyMain::BeginMainFrame 27.5 ms, EventDispatch 22.3 ms, FunctionCall 19.4 ms | (program) (18.8 ms sampled), (anonymous) (12.9 ms sampled), removeChild (0.9 ms sampled) |
| 2017.7 | 66.7 | EventDispatch 76.2 ms, FunctionCall 76.0 ms, Layout 6.5 ms | he (10.4 ms sampled), resizeToHost (7.3 ms sampled), ay (5.9 ms sampled) |
| 2334.4 | 50.0 | TimerFire 61.1 ms, MinorGC 0.6 ms, MinorGC 0.6 ms | e (5.2 ms sampled), clone (4.0 ms sampled), e (3.0 ms sampled) |
| 2951.0 | 33.3 | TimerFire 42.4 ms, V8.DeoptimizeCode 0.0 ms, V8.DeoptimizeCode 0.0 ms | Cg (3.5 ms sampled), mg (2.3 ms sampled), e (2.2 ms sampled) |
| 3017.7 | 50.1 | TimerFire 66.5 ms, MinorGC 0.6 ms, V8.GCScavenger 0.6 ms | ih (5.4 ms sampled), yh (4.2 ms sampled), _ (2.3 ms sampled) |
| 3067.7 | 33.3 | TimerFire 45.3 ms, GLES2Implementation::GetProgramiv 1.1 ms, ImplementationBase::WaitForCmd 1.1 ms | C (7.1 ms sampled), renderBufferDirect (2.4 ms sampled), render (1.7 ms sampled) |
| 3317.7 | 50.1 | TimerFire 53.0 ms, MinorGC 2.5 ms, V8.GCScavenger 2.5 ms | ih (3.6 ms sampled), et (3.4 ms sampled), yh (3.3 ms sampled) |
| 4467.7 | 100.1 | TimerFire 89.2 ms, Decode Image 25.9 ms, ProxyMain::BeginMainFrame 12.5 ms | Ce (43.4 ms sampled), C (13.3 ms sampled), render (4.8 ms sampled) |
| 4517.6 | 33.3 | ProxyMain::BeginMainFrame 17.9 ms, ProxyMain::BeginMainFrame 14.2 ms, FireAnimationFrame 13.8 ms | (program) (7.1 ms sampled), Ye (1.9 ms sampled), (idle) (1.6 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
