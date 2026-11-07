# Cold-page hitch attribution
REFERENCE: 1440x900-dpr2-cpu4-medium-enemy-teacup-healer-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 76.9 | 33.4 | ProxyMain::BeginMainFrame 19.1 ms, Layout 16.1 ms, ParseHTML 10.2 ms | (program) (33.7 ms sampled), sample (0.1 ms sampled) |
| 360.1 | 116.6 | ParseHTML 10.6 ms | (program) (117.1 ms sampled) |
| 1293.4 | 33.2 | TimerFire 23.0 ms | fetch (18.5 ms sampled), (idle) (14.3 ms sampled), (program) (0.4 ms sampled) |
| 1326.8 | 33.4 | ProxyMain::BeginMainFrame 1.3 ms, FireAnimationFrame 0.7 ms, Layout 0.4 ms | (idle) (19.9 ms sampled), (program) (12.6 ms sampled), unpack (0.8 ms sampled) |
| 1743.4 | 133.3 | EvaluateScript 121.8 ms, v8.compile 80.6 ms, MinorGC 2.5 ms | (anonymous) (96.0 ms sampled), (anonymous) (9.3 ms sampled), (program) (3.8 ms sampled) |
| 1843.4 | 100.0 | EvaluateScript 121.8 ms, ProxyMain::BeginMainFrame 57.8 ms, Layout 45.8 ms | (program) (51.5 ms sampled), (anonymous) (20.2 ms sampled), un (1.2 ms sampled) |
| 2376.7 | 50.0 | ProxyMain::BeginMainFrame 30.9 ms, EventDispatch 21.9 ms, FunctionCall 18.4 ms | (program) (32.9 ms sampled), (anonymous) (12.0 ms sampled), of (0.9 ms sampled) |
| 3026.7 | 83.3 | EventDispatch 85.6 ms, FunctionCall 84.5 ms, Layout 6.8 ms | resizeToHost (10.9 ms sampled), he (9.6 ms sampled), (program) (5.9 ms sampled) |
| 3376.7 | 66.7 | TimerFire 80.9 ms, MinorGC 1.0 ms, MinorGC 0.9 ms | clone (6.2 ms sampled), makeStage (5.9 ms sampled), e (4.7 ms sampled) |
| 4193.3 | 50.0 | TimerFire 58.0 ms, V8.DeoptimizeCode 0.0 ms, V8.DeoptimizeCode 0.0 ms | computeBoundingSphere (2.8 ms sampled), kg (2.6 ms sampled), fromBufferAttribute (1.9 ms sampled) |
| 4276.7 | 66.7 | TimerFire 84.4 ms, MinorGC 1.4 ms, V8.GCScavenger 1.4 ms | g (4.9 ms sampled), uh (4.6 ms sampled), Th (4.2 ms sampled) |
| 4343.3 | 50.0 | TimerFire 60.5 ms, GLES2Implementation::GetProgramiv 1.3 ms, ImplementationBase::WaitForCmd 1.3 ms | C (8.5 ms sampled), rt (3.2 ms sampled), n (2.3 ms sampled) |
| 4660.0 | 50.0 | TimerFire 66.0 ms, MinorGC 1.7 ms, V8.GCScavenger 1.7 ms | uh (3.3 ms sampled), Ac (3.3 ms sampled), Ac (3.1 ms sampled) |
| 6026.6 | 83.4 | TimerFire 99.3 ms, Decode Image 30.5 ms, Decode Image 8.1 ms | Ce (48.4 ms sampled), C (12.6 ms sampled), et (2.2 ms sampled) |
| 6060.0 | 33.4 | TimerFire 99.3 ms, ProxyMain::BeginMainFrame 14.7 ms, ProxyMain::BeginMainFrame 13.6 ms | (program) (9.2 ms sampled), renderBufferDirect (1.6 ms sampled), render (1.3 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
