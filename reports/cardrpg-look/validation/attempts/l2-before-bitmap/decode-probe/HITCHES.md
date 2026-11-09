# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu4-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 61.9 | 33.3 | ProxyMain::BeginMainFrame 17.6 ms, Layout 14.2 ms, ParseHTML 12.6 ms | (program) (33.3 ms sampled) |
| 1061.9 | 33.3 | ProxyMain::BeginMainFrame 1.2 ms, PrePaint 0.5 ms, Paint 0.2 ms | (idle) (23.4 ms sampled), (program) (8.9 ms sampled), unpack (0.9 ms sampled) |
| 1478.5 | 33.2 | MinorGC 1.2 ms, V8.GCScavenger 1.2 ms, V8.GC_SCAVENGER 1.2 ms | (anonymous) (27.9 ms sampled), (program) (4.3 ms sampled), (garbage collector) (1.2 ms sampled) |
| 1545.2 | 33.3 | EvaluateScript 51.4 ms, v8.compile 7.1 ms, V8.DeoptimizeCode 0.0 ms | (anonymous) (8.0 ms sampled), (program) (2.8 ms sampled), (anonymous) (2.5 ms sampled) |
| 1661.9 | 116.7 | ProxyMain::BeginMainFrame 70.0 ms, EvaluateScript 51.4 ms, Layout 49.3 ms | (program) (57.1 ms sampled), (anonymous) (20.6 ms sampled), gl (2.7 ms sampled) |
| 1695.3 | 33.4 | ProxyMain::BeginMainFrame 70.0 ms, Layout 49.3 ms, FunctionCall 6.4 ms | (program) (17.7 ms sampled), (idle) (2.2 ms sampled), getTextAlternativeInternal (1.1 ms sampled) |
| 1945.3 | 83.4 | TimerFire 75.8 ms, FunctionCall 75.3 ms, ProxyMain::BeginMainFrame 4.8 ms | he (10.0 ms sampled), (program) (8.1 ms sampled), n (5.4 ms sampled) |
| 2128.5 | 99.9 | EventDispatch 74.1 ms, FunctionCall 70.6 ms, ProxyMain::BeginMainFrame 31.8 ms | resizeToHost (27.2 ms sampled), (program) (25.0 ms sampled), he (6.2 ms sampled) |
| 2178.6 | 33.4 | TimerFire 3.9 ms, TimerFire 3.7 ms, TimerFire 3.5 ms | (program) (12.6 ms sampled), (garbage collector) (2.2 ms sampled), e (1.6 ms sampled) |
| 2228.5 | 33.3 | EvaluateScript 13.7 ms, TimerFire 9.4 ms, MajorGC 5.2 ms | (program) (11.9 ms sampled), (garbage collector) (5.2 ms sampled), (anonymous) (3.3 ms sampled) |
| 3461.9 | 33.4 | TimerFire 43.2 ms, CommandBufferProxyImpl::WaitForToken 24.7 ms, TransferBuffer::Free 0.0 ms | Se (24.9 ms sampled), le (1.1 ms sampled), (anonymous) (1.0 ms sampled) |
| 3661.8 | 199.9 | TimerFire 203.6 ms, Decode Image 166.1 ms, TimerFire 43.2 ms | Se (189.3 ms sampled), Se (9.1 ms sampled), (program) (1.5 ms sampled) |
| 3995.2 | 66.7 | TimerFire 60.8 ms, Decode Image 57.5 ms, TimerFire 39.0 ms | Se (66.0 ms sampled), (program) (1.0 ms sampled) |
| 5545.0 | 49.9 | TimerFire 68.2 ms, MinorGC 1.1 ms, V8.GCScavenger 1.0 ms | ag (4.9 ms sampled), Jh (3.7 ms sampled), g (3.5 ms sampled) |
| 5645.1 | 33.4 | TimerFire 19.6 ms, TimerFire 16.1 ms, ProxyMain::BeginMainFrame 2.0 ms | g (6.0 ms sampled), g (4.9 ms sampled), $e (2.8 ms sampled) |
| 5778.4 | 33.3 | TimerFire 22.2 ms, TimerFire 15.5 ms, ProxyMain::BeginMainFrame 1.8 ms | g (8.4 ms sampled), g (3.6 ms sampled), (program) (2.5 ms sampled) |
| 5861.7 | 33.3 | TimerFire 17.4 ms, TimerFire 16.6 ms, ProxyMain::BeginMainFrame 2.3 ms | g (4.9 ms sampled), (program) (3.1 ms sampled), g (2.6 ms sampled) |
| 5995.1 | 33.4 | TimerFire 16.9 ms, TimerFire 16.7 ms, ProxyMain::BeginMainFrame 1.9 ms | g (4.7 ms sampled), g (3.8 ms sampled), $e (3.8 ms sampled) |
| 6495.0 | 33.3 | TimerFire 49.0 ms, MinorGC 0.9 ms, V8.GCScavenger 0.6 ms | Jh (4.4 ms sampled), Jh (3.9 ms sampled), ag (2.6 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
