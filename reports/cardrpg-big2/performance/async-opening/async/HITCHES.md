# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu4-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 58.3 | 33.4 | ProxyMain::BeginMainFrame 20.3 ms, Layout 17.6 ms, ParseHTML 10.6 ms | (program) (32.7 ms sampled), requestAnimationFrame (0.7 ms sampled), (idle) (0.0 ms sampled) |
| 1074.9 | 33.3 | TimerFire 19.8 ms, FunctionCall 0.0 ms | fetch (18.0 ms sampled), (idle) (13.4 ms sampled), unpack (1.8 ms sampled) |
| 1108.2 | 33.3 | ProxyMain::BeginMainFrame 2.0 ms, Layout 0.8 ms, FireAnimationFrame 0.0 ms | (idle) (20.3 ms sampled), (program) (13.0 ms sampled) |
| 1541.5 | 33.2 | EvaluateScript 47.8 ms, v8.compile 6.5 ms, MinorGC 1.8 ms | (anonymous) (13.7 ms sampled), (program) (4.3 ms sampled), (garbage collector) (1.8 ms sampled) |
| 1641.5 | 100.0 | ProxyMain::BeginMainFrame 49.6 ms, EvaluateScript 47.8 ms, FunctionCall 40.4 ms | (program) (48.3 ms sampled), (anonymous) (19.5 ms sampled), sp (1.6 ms sampled) |
| 1891.6 | 50.0 | TimerFire 73.0 ms, FunctionCall 72.9 ms, MinorGC 2.4 ms | n (4.8 ms sampled), e (4.2 ms sampled), D_.setSize (3.7 ms sampled) |
| 1924.9 | 33.3 | TimerFire 73.0 ms, FunctionCall 72.9 ms, TimerFire 6.6 ms | (program) (10.9 ms sampled), D_.setSize (4.4 ms sampled), (garbage collector) (1.4 ms sampled) |
| 1958.2 | 33.3 | EventDispatch 23.8 ms, Decode Image 17.1 ms, TimerFire 7.0 ms | we (21.3 ms sampled), (garbage collector) (4.1 ms sampled), ue (1.2 ms sampled) |
| 2091.6 | 100.0 | EventDispatch 68.1 ms, FunctionCall 63.8 ms, ProxyMain::BeginMainFrame 27.8 ms | (program) (25.1 ms sampled), resizeToHost (18.3 ms sampled), D_.setSize (6.4 ms sampled) |
| 2158.2 | 49.9 | EventDispatch 23.2 ms, Decode Image 16.8 ms, EventDispatch 10.6 ms | we (18.5 ms sampled), (program) (8.9 ms sampled), D_.forceContextLoss (8.2 ms sampled) |
| 2208.2 | 33.3 | EventDispatch 20.4 ms, Decode Image 15.8 ms, EvaluateScript 13.4 ms | we (17.8 ms sampled), (program) (12.1 ms sampled), a (1.0 ms sampled) |
| 2308.3 | 66.8 | TimerFire 78.7 ms, MinorGC 1.1 ms, V8.GCScavenger 1.1 ms | clone (4.5 ms sampled), e (3.9 ms sampled), ZS (3.8 ms sampled) |
| 5441.5 | 50.1 | TimerFire 72.1 ms, MinorGC 0.9 ms, V8.GCScavenger 0.9 ms | yg (3.6 ms sampled), (garbage collector) (3.1 ms sampled), Bl (3.1 ms sampled) |
| 5591.4 | 33.3 | TimerFire 21.5 ms, TimerFire 18.3 ms, ProxyMain::BeginMainFrame 1.3 ms | (program) (4.3 ms sampled), g (4.2 ms sampled), g (3.3 ms sampled) |
| 5691.5 | 33.4 | TimerFire 21.1 ms, TimerFire 19.1 ms, MinorGC 1.6 ms | g (7.2 ms sampled), g (5.6 ms sampled), (program) (2.4 ms sampled) |
| 5808.1 | 33.4 | TimerFire 20.8 ms, TimerFire 18.7 ms, ProxyMain::BeginMainFrame 1.0 ms | g (5.0 ms sampled), g (3.4 ms sampled), g (3.2 ms sampled) |
| 5874.8 | 33.4 | TimerFire 21.9 ms, TimerFire 20.1 ms, MinorGC 1.6 ms | g (5.8 ms sampled), tt (4.5 ms sampled), g (3.4 ms sampled) |
| 5958.1 | 33.4 | TimerFire 23.3 ms, TimerFire 17.7 ms, ProxyMain::BeginMainFrame 1.8 ms | g (5.9 ms sampled), C (4.1 ms sampled), g (3.1 ms sampled) |
| 6208.1 | 33.4 | TimerFire 16.8 ms, TimerFire 16.1 ms, ProxyMain::BeginMainFrame 2.2 ms | g (5.1 ms sampled), tt (5.0 ms sampled), g (3.2 ms sampled) |
| 6691.4 | 66.7 | TimerFire 53.9 ms, TimerFire 15.5 ms, MinorGC 1.0 ms | g (5.6 ms sampled), yg (5.2 ms sampled), g (3.9 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
