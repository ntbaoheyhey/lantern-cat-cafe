# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu4-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 62.0 | 33.4 | ProxyMain::BeginMainFrame 24.1 ms, Layout 21.0 ms, ParseHTML 11.1 ms | (program) (33.6 ms sampled), (idle) (-0.1 ms sampled) |
| 1611.9 | 33.3 | EvaluateScript 48.9 ms, v8.compile 7.4 ms, V8.DeoptimizeCode 0.0 ms | (anonymous) (10.3 ms sampled), (program) (2.0 ms sampled), Bl (0.9 ms sampled) |
| 1711.9 | 100.0 | ProxyMain::BeginMainFrame 56.8 ms, EvaluateScript 48.9 ms, Layout 45.3 ms | (program) (44.7 ms sampled), (anonymous) (21.0 ms sampled), hl (1.9 ms sampled) |
| 1745.2 | 33.3 | ProxyMain::BeginMainFrame 56.8 ms, Layout 45.3 ms, FunctionCall 4.0 ms | (program) (18.2 ms sampled), (idle) (2.3 ms sampled), (anonymous) (1.4 ms sampled) |
| 1995.2 | 66.6 | TimerFire 82.3 ms, FunctionCall 82.1 ms, MinorGC 2.3 ms | n (4.3 ms sampled), D_.setSize (3.7 ms sampled), e (3.4 ms sampled) |
| 2061.9 | 33.3 | EventDispatch 38.8 ms, Decode Image 29.3 ms | Te (30.2 ms sampled), de (1.3 ms sampled), ce (0.8 ms sampled) |
| 2095.3 | 33.4 | EventDispatch 38.8 ms, EventDispatch 37.1 ms, Decode Image 31.8 ms | Te (8.7 ms sampled), (program) (5.1 ms sampled), (garbage collector) (5.0 ms sampled) |
| 2245.3 | 150.0 | EventDispatch 78.6 ms, FunctionCall 74.0 ms, EventDispatch 37.1 ms | (program) (34.7 ms sampled), Te (33.1 ms sampled), resizeToHost (19.7 ms sampled) |
| 2311.9 | 50.0 | EventDispatch 36.9 ms, Decode Image 30.8 ms, EventDispatch 10.7 ms | Te (26.1 ms sampled), D_.forceContextLoss (8.6 ms sampled), (program) (4.8 ms sampled) |
| 2361.9 | 33.3 | EventDispatch 40.5 ms, Decode Image 33.8 ms, TimerFire 2.1 ms | Te (27.5 ms sampled), (program) (2.4 ms sampled), (garbage collector) (0.8 ms sampled) |
| 2395.2 | 33.3 | EventDispatch 40.5 ms, Decode Image 33.8 ms, EvaluateScript 13.7 ms | (program) (14.4 ms sampled), Te (11.5 ms sampled), multiplyScalar (1.6 ms sampled) |
| 2495.2 | 83.3 | TimerFire 80.7 ms, EventDispatch 16.8 ms, Decode Image 12.2 ms | e (6.8 ms sampled), Te (4.5 ms sampled), ZS (4.2 ms sampled) |
| 3861.8 | 66.6 | TimerFire 64.9 ms, Decode Image 60.4 ms, TimerFire 41.9 ms | Te (65.4 ms sampled), (program) (1.0 ms sampled), f (-0.1 ms sampled) |
| 5745.1 | 50.0 | TimerFire 75.2 ms, MinorGC 2.0 ms, V8.GCScavenger 1.6 ms | yg (4.7 ms sampled), Pg (4.5 ms sampled), Bl (3.2 ms sampled) |
| 5878.5 | 33.4 | TimerFire 21.1 ms, TimerFire 18.6 ms, MinorGC 1.2 ms | g (4.6 ms sampled), g (3.7 ms sampled), nt (3.2 ms sampled) |
| 5961.8 | 33.4 | TimerFire 18.8 ms, TimerFire 18.3 ms, ProxyMain::BeginMainFrame 1.2 ms | g (6.0 ms sampled), g (3.9 ms sampled), _ (2.9 ms sampled) |
| 6028.4 | 33.3 | TimerFire 23.5 ms, TimerFire 21.9 ms, ProxyMain::BeginMainFrame 1.5 ms | g (4.5 ms sampled), g (3.2 ms sampled), C (2.6 ms sampled) |
| 6128.4 | 33.3 | TimerFire 21.4 ms, TimerFire 18.4 ms, ProxyMain::BeginMainFrame 1.5 ms | g (3.8 ms sampled), g (3.6 ms sampled), g (3.4 ms sampled) |
| 6178.5 | 33.5 | TimerFire 23.4 ms, TimerFire 20.1 ms, ProxyMain::BeginMainFrame 1.1 ms | g (3.6 ms sampled), nt (3.1 ms sampled), C (3.0 ms sampled) |
| 6261.8 | 33.4 | TimerFire 24.8 ms, TimerFire 19.3 ms, ProxyMain::BeginMainFrame 1.5 ms | g (3.3 ms sampled), nt (3.1 ms sampled), nt (2.8 ms sampled) |
| 6311.7 | 33.3 | TimerFire 19.6 ms, TimerFire 19.4 ms, ProxyMain::BeginMainFrame 1.8 ms | g (4.3 ms sampled), g (3.5 ms sampled), g (3.5 ms sampled) |
| 6428.4 | 33.4 | TimerFire 19.2 ms, TimerFire 18.1 ms, ProxyMain::BeginMainFrame 1.5 ms | g (6.3 ms sampled), g (6.0 ms sampled), g (3.5 ms sampled) |
| 6561.8 | 33.4 | TimerFire 17.3 ms, TimerFire 16.7 ms, ProxyMain::BeginMainFrame 0.8 ms | g (4.2 ms sampled), g (3.7 ms sampled), g (3.7 ms sampled) |
| 6678.4 | 33.4 | TimerFire 18.1 ms, TimerFire 17.1 ms, ProxyMain::BeginMainFrame 1.1 ms | g (5.6 ms sampled), g (3.8 ms sampled), nt (3.7 ms sampled) |
| 6795.1 | 33.4 | TimerFire 18.7 ms, TimerFire 17.3 ms, MinorGC 0.9 ms | g (6.3 ms sampled), nt (5.9 ms sampled), g (3.1 ms sampled) |
| 7011.7 | 33.3 | TimerFire 18.0 ms, TimerFire 16.9 ms, ProxyMain::BeginMainFrame 1.0 ms | g (4.8 ms sampled), g (4.5 ms sampled), g (3.2 ms sampled) |
| 7078.4 | 50.0 | TimerFire 55.2 ms, TimerFire 16.5 ms, ProxyMain::BeginMainFrame 1.1 ms | yg (6.3 ms sampled), Pg (2.6 ms sampled), yg (2.6 ms sampled) |
| 7445.1 | 33.4 | TimerFire 17.0 ms, TimerFire 16.7 ms, ProxyMain::BeginMainFrame 1.1 ms | g (5.7 ms sampled), g (4.0 ms sampled), nt (3.3 ms sampled) |
| 7811.7 | 33.4 | TimerFire 16.9 ms, TimerFire 15.6 ms, MinorGC 1.4 ms | g (5.4 ms sampled), g (5.3 ms sampled), g (3.1 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
