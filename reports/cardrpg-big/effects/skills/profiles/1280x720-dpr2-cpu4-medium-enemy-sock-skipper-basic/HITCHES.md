# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu4-medium-enemy-sock-skipper-basic-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 80.5 | 33.3 | ProxyMain::BeginMainFrame 16.0 ms, Layout 13.9 ms, ParseHTML 9.0 ms | (program) (31.5 ms sampled), sample (0.9 ms sampled), (idle) (0.1 ms sampled) |
| 347.2 | 133.4 | ParseHTML 8.8 ms | (program) (133.6 ms sampled) |
| 1180.5 | 33.4 | TimerFire 21.6 ms | fetch (16.6 ms sampled), (idle) (16.5 ms sampled) |
| 1230.5 | 33.4 | DecompressionStream Inflate 16.8 ms, ProxyMain::BeginMainFrame 0.9 ms, FireAnimationFrame 0.0 ms | (program) (17.9 ms sampled), (idle) (15.5 ms sampled) |
| 1563.8 | 116.7 | EvaluateScript 110.9 ms, v8.compile 74.7 ms, MinorGC 1.5 ms | (anonymous) (85.6 ms sampled), (anonymous) (7.7 ms sampled), (anonymous) (2.2 ms sampled) |
| 1647.1 | 83.3 | EvaluateScript 110.9 ms, ProxyMain::BeginMainFrame 54.8 ms, Layout 45.5 ms | (program) (41.1 ms sampled), (anonymous) (19.6 ms sampled), nf (1.5 ms sampled) |
| 1847.1 | 33.3 | ProxyMain::BeginMainFrame 28.9 ms, EventDispatch 21.7 ms, FunctionCall 18.0 ms | (program) (20.5 ms sampled), (anonymous) (10.9 ms sampled), removeChild (1.8 ms sampled) |
| 2063.7 | 83.3 | EventDispatch 74.1 ms, FunctionCall 73.4 ms, Layout 4.9 ms | he (8.4 ms sampled), resizeToHost (7.8 ms sampled), (program) (7.8 ms sampled) |
| 2363.8 | 50.1 | TimerFire 60.6 ms, MinorGC 1.1 ms, V8.GCScavenger 1.1 ms | makeStage (6.2 ms sampled), clone (3.2 ms sampled), e (2.8 ms sampled) |
| 2397.1 | 33.3 | TimerFire 60.6 ms, TimerFire 3.1 ms, TimerFire 2.3 ms | (program) (6.7 ms sampled), e (2.4 ms sampled), clone (1.6 ms sampled) |
| 2997.1 | 33.4 | TimerFire 42.1 ms, V8.DeoptimizeCode 0.3 ms, V8.DeoptimizeCode 0.2 ms | mg (2.7 ms sampled), setFromBufferAttribute (2.4 ms sampled), p (2.3 ms sampled) |
| 3063.7 | 50.0 | TimerFire 65.7 ms, MinorGC 1.0 ms, V8.GCScavenger 1.0 ms | ih (3.6 ms sampled), et (2.8 ms sampled), g (2.6 ms sampled) |
| 3113.8 | 33.5 | TimerFire 48.0 ms, GLES2Implementation::GetProgramiv 1.5 ms, GLES2Implementation::GetProgramiv 1.2 ms | C (6.3 ms sampled), renderBufferDirect (2.6 ms sampled), intersectsObject (1.9 ms sampled) |
| 3363.8 | 33.4 | TimerFire 51.3 ms, MinorGC 1.2 ms, V8.GCScavenger 1.2 ms | g (2.7 ms sampled), et (2.2 ms sampled), wc (2.1 ms sampled) |
| 4513.7 | 83.4 | TimerFire 89.4 ms, Decode Image 25.6 ms, Decode Image 6.7 ms | Ce (42.4 ms sampled), C (13.5 ms sampled), render (5.1 ms sampled) |
| 4547.0 | 33.3 | TimerFire 89.4 ms, ProxyMain::BeginMainFrame 16.7 ms, FireAnimationFrame 12.8 ms | (program) (7.4 ms sampled), render (1.6 ms sampled), renderBufferDirect (1.4 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
