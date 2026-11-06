# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu4-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 317.1 | 100.1 | ParseHTML 8.6 ms | (program) (100.2 ms sampled) |
| 1133.7 | 33.3 | TimerFire 20.4 ms | fetch (19.1 ms sampled), (idle) (13.6 ms sampled), unpack (1.2 ms sampled) |
| 1167.0 | 33.3 | ProxyMain::BeginMainFrame 2.0 ms, ProxyMain::BeginMainFrame 0.8 ms, FireAnimationFrame 0.6 ms | (idle) (21.1 ms sampled), (program) (12.0 ms sampled), unpack (0.2 ms sampled) |
| 1516.9 | 116.6 | EvaluateScript 112.0 ms, v8.compile 75.5 ms, MinorGC 2.0 ms | (anonymous) (82.3 ms sampled), (anonymous) (7.1 ms sampled), (garbage collector) (2.9 ms sampled) |
| 1617.0 | 100.1 | EvaluateScript 112.0 ms, ProxyMain::BeginMainFrame 56.7 ms, Layout 47.3 ms | (program) (60.6 ms sampled), (anonymous) (19.4 ms sampled), nf (1.9 ms sampled) |
| 1850.3 | 100.0 | EventDispatch 92.2 ms, FunctionCall 85.5 ms, ProxyMain::BeginMainFrame 30.0 ms | resizeToHost (18.7 ms sampled), (program) (14.4 ms sampled), he (10.2 ms sampled) |
| 1883.6 | 33.3 | ProxyMain::BeginMainFrame 30.0 ms, TimerFire 14.3 ms, MajorGC 3.1 ms | (program) (24.3 ms sampled), (garbage collector) (1.4 ms sampled), (anonymous) (1.1 ms sampled) |
| 1917.0 | 33.4 | TimerFire 14.3 ms, TimerFire 5.8 ms, TimerFire 4.4 ms | (program) (6.4 ms sampled), (garbage collector) (3.1 ms sampled), n (2.3 ms sampled) |
| 2150.3 | 50.1 | TimerFire 62.3 ms, MinorGC 1.1 ms, V8.GCScavenger 1.0 ms | e (4.2 ms sampled), clone (3.7 ms sampled), (garbage collector) (2.8 ms sampled) |
| 2783.6 | 33.4 | TimerFire 42.3 ms, V8.DeoptimizeCode 0.0 ms, V8.DeoptimizeCode 0.0 ms | mg (2.8 ms sampled), Cg (2.3 ms sampled), applyMatrix4 (2.0 ms sampled) |
| 2850.3 | 50.0 | TimerFire 66.2 ms, CommandBufferHelper::Flush 0.0 ms, CommandBufferProxyImpl::Flush 0.0 ms | ih (5.8 ms sampled), g (3.9 ms sampled), yh (2.7 ms sampled) |
| 2916.9 | 33.3 | TimerFire 45.2 ms, GLES2Implementation::GetProgramiv 1.0 ms, ImplementationBase::WaitForCmd 1.0 ms | C (11.8 ms sampled), rt (2.5 ms sampled), renderBufferDirect (2.4 ms sampled) |
| 3150.3 | 33.3 | TimerFire 53.1 ms, MinorGC 3.5 ms, V8.GCScavenger 3.5 ms | ih (3.7 ms sampled), yh (3.6 ms sampled), (garbage collector) (3.5 ms sampled) |
| 4316.9 | 83.3 | TimerFire 89.9 ms, Decode Image 27.0 ms, ProxyMain::BeginMainFrame 13.8 ms | Ce (42.6 ms sampled), C (14.4 ms sampled), g (2.2 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
