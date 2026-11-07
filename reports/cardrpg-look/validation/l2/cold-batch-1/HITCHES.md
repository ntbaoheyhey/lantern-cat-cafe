# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu4-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 93.9 | 33.3 | ProxyMain::BeginMainFrame 20.3 ms, Layout 16.5 ms, ParseHTML 10.6 ms | (program) (34.0 ms sampled), sample (0.0 ms sampled), (idle) (-0.1 ms sampled) |
| 1593.8 | 33.3 | MinorGC 1.6 ms, V8.GCScavenger 1.6 ms, V8.GC_SCAVENGER 1.6 ms | (anonymous) (26.7 ms sampled), (program) (5.4 ms sampled), (garbage collector) (1.6 ms sampled) |
| 1677.1 | 50.0 | EvaluateScript 55.2 ms, v8.compile 8.3 ms, V8.DeoptimizeCode 0.0 ms | (anonymous) (9.8 ms sampled), (program) (6.9 ms sampled), keccak (1.5 ms sampled) |
| 1793.8 | 116.7 | ProxyMain::BeginMainFrame 73.7 ms, EvaluateScript 55.2 ms, Layout 51.5 ms | (program) (64.5 ms sampled), (anonymous) (20.8 ms sampled), Zo (2.8 ms sampled) |
| 1827.1 | 33.3 | ProxyMain::BeginMainFrame 73.7 ms, Layout 51.5 ms, FunctionCall 5.8 ms | (program) (17.0 ms sampled), (idle) (2.6 ms sampled), (anonymous) (1.0 ms sampled) |
| 2077.2 | 66.8 | TimerFire 79.5 ms, FunctionCall 78.7 ms, MinorGC 3.3 ms | Ax (5.5 ms sampled), he (4.8 ms sampled), n (4.6 ms sampled) |
| 2310.4 | 166.6 | ProxyMain::BeginMainFrame 151.8 ms, EventDispatch 97.5 ms, FunctionCall 90.3 ms | resizeToHost (38.2 ms sampled), (program) (37.1 ms sampled), n (5.8 ms sampled) |
| 2343.8 | 33.4 | ProxyMain::BeginMainFrame 151.8 ms, TimerFire 4.4 ms, Paint 2.3 ms | (program) (18.9 ms sampled), W_ (3.9 ms sampled), (idle) (1.3 ms sampled) |
| 2393.8 | 33.3 | TimerFire 8.5 ms, MajorGC 5.1 ms, V8.GCFinalizeMC 5.1 ms | (program) (14.3 ms sampled), (garbage collector) (6.1 ms sampled), (anonymous) (1.7 ms sampled) |
| 2427.2 | 33.4 | EvaluateScript 15.7 ms, TimerFire 8.5 ms, TimerFire 4.5 ms | (program) (10.3 ms sampled), (anonymous) (4.1 ms sampled), initNonuniformCatmullRom (1.9 ms sampled) |
| 3927.0 | 33.3 | TimerFire 48.6 ms, CommandBufferProxyImpl::WaitForToken 24.2 ms, TransferBuffer::Free 0.0 ms | Se (30.0 ms sampled), j (1.0 ms sampled), y (0.6 ms sampled) |
| 3960.4 | 33.4 | TimerFire 48.6 ms, TimerFire 34.3 ms, CommandBufferProxyImpl::WaitForToken 24.2 ms | Se (22.6 ms sampled), Se (8.8 ms sampled), (program) (1.7 ms sampled) |
| 4293.7 | 66.7 | TimerFire 62.8 ms, Decode Image 58.0 ms, TimerFire 40.3 ms | Se (65.7 ms sampled), requestAnimationFrame (0.7 ms sampled), (program) (0.7 ms sampled) |
| 5843.7 | 50.0 | TimerFire 71.2 ms, MinorGC 0.8 ms, V8.GCScavenger 0.8 ms | Jh (5.1 ms sampled), Jh (3.7 ms sampled), ag (3.6 ms sampled) |
| 5926.9 | 33.2 | TimerFire 23.4 ms, TimerFire 21.3 ms, ProxyMain::BeginMainFrame 1.6 ms | g (3.5 ms sampled), g (3.4 ms sampled), (program) (3.4 ms sampled) |
| 5993.7 | 33.4 | TimerFire 19.5 ms, TimerFire 17.6 ms, ProxyMain::BeginMainFrame 1.6 ms | g (4.4 ms sampled), g (3.9 ms sampled), C (2.7 ms sampled) |
| 6127.0 | 33.4 | TimerFire 20.3 ms, TimerFire 15.8 ms, ProxyMain::BeginMainFrame 2.0 ms | g (4.3 ms sampled), $e (3.9 ms sampled), g (3.2 ms sampled) |
| 6260.3 | 33.4 | TimerFire 18.7 ms, TimerFire 17.3 ms, ProxyMain::BeginMainFrame 1.8 ms | g (4.0 ms sampled), $e (3.2 ms sampled), g (3.2 ms sampled) |
| 6527.0 | 33.3 | TimerFire 16.6 ms, TimerFire 15.2 ms, ProxyMain::BeginMainFrame 2.0 ms | g (5.8 ms sampled), g (4.1 ms sampled), $e (4.0 ms sampled) |
| 6810.2 | 33.2 | TimerFire 51.2 ms, MinorGC 1.7 ms, V8.GCScavenger 1.6 ms | Jh (4.7 ms sampled), ag (3.8 ms sampled), ag (2.9 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
