# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu4-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 63.3 | 33.4 | ProxyMain::BeginMainFrame 19.4 ms, Layout 16.6 ms, ParseHTML 11.1 ms | (program) (32.7 ms sampled) |
| 1079.9 | 33.4 | ProxyMain::BeginMainFrame 1.7 ms, PrePaint 0.8 ms, Layout 0.1 ms | (idle) (19.4 ms sampled), (program) (13.6 ms sampled), unpack (0.9 ms sampled) |
| 1113.2 | 33.3 | DecompressionStream Inflate 17.4 ms, ProxyMain::BeginMainFrame 0.5 ms, Commit 0.4 ms | (program) (20.6 ms sampled), (idle) (12.8 ms sampled) |
| 1579.8 | 116.7 | TimerFire 125.9 ms, EvaluateScript 121.5 ms, v8.compile 81.9 ms | (anonymous) (80.1 ms sampled), (anonymous) (12.2 ms sampled), (garbage collector) (1.8 ms sampled) |
| 1663.1 | 83.3 | TimerFire 125.9 ms, EvaluateScript 121.5 ms, ProxyMain::BeginMainFrame 51.8 ms | (program) (40.0 ms sampled), (anonymous) (19.5 ms sampled), Qo (2.2 ms sampled) |
| 1696.5 | 33.4 | ProxyMain::BeginMainFrame 51.8 ms, Layout 42.1 ms, FunctionCall 4.6 ms | (program) (18.0 ms sampled), (idle) (2.7 ms sampled), query (1.5 ms sampled) |
| 1929.8 | 50.0 | TimerFire 71.8 ms, FunctionCall 71.2 ms, MinorGC 2.1 ms | D_.setSize (4.6 ms sampled), n (4.0 ms sampled), Jb (3.7 ms sampled) |
| 1996.5 | 33.3 | EventDispatch 24.6 ms, Decode Image 16.7 ms, TimerFire 5.8 ms | we (22.1 ms sampled), (garbage collector) (3.7 ms sampled), (program) (1.3 ms sampled) |
| 2129.8 | 100.0 | EventDispatch 65.6 ms, FunctionCall 62.0 ms, ProxyMain::BeginMainFrame 28.5 ms | (program) (30.2 ms sampled), resizeToHost (18.1 ms sampled), D_.setSize (4.9 ms sampled) |
| 2329.8 | 83.4 | TimerFire 74.1 ms, EventDispatch 14.0 ms, Decode Image 7.5 ms | we (9.9 ms sampled), clone (5.4 ms sampled), makeStage (4.6 ms sampled) |
| 5463.0 | 50.0 | TimerFire 70.9 ms, MinorGC 1.6 ms, V8.GCScavenger 1.6 ms | g (5.5 ms sampled), Pg (3.2 ms sampled), yg (2.3 ms sampled) |
| 5563.0 | 33.3 | TimerFire 20.2 ms, TimerFire 18.9 ms, ProxyMain::BeginMainFrame 1.8 ms | g (4.9 ms sampled), tt (3.6 ms sampled), tt (2.3 ms sampled) |
| 5663.0 | 33.3 | TimerFire 18.7 ms, TimerFire 16.7 ms, ProxyMain::BeginMainFrame 0.9 ms | g (3.3 ms sampled), g (2.6 ms sampled), tt (2.4 ms sampled) |
| 5746.4 | 33.4 | TimerFire 20.4 ms, TimerFire 18.7 ms, MinorGC 1.9 ms | g (3.6 ms sampled), tt (3.3 ms sampled), g (2.8 ms sampled) |
| 5846.3 | 33.3 | TimerFire 20.9 ms, TimerFire 19.9 ms, ProxyMain::BeginMainFrame 1.1 ms | g (3.8 ms sampled), g (3.7 ms sampled), g (3.0 ms sampled) |
| 5929.7 | 33.3 | TimerFire 18.9 ms, TimerFire 18.8 ms, MinorGC 1.9 ms | g (5.7 ms sampled), tt (3.8 ms sampled), g (3.5 ms sampled) |
| 6013.0 | 33.4 | TimerFire 18.9 ms, TimerFire 17.9 ms, GLES2Implementation::GetProgramiv 0.8 ms | g (6.4 ms sampled), tt (4.1 ms sampled), g (2.9 ms sampled) |
| 6362.9 | 33.3 | TimerFire 16.6 ms, TimerFire 15.9 ms, ProxyMain::BeginMainFrame 1.3 ms | g (4.8 ms sampled), tt (3.4 ms sampled), g (3.4 ms sampled) |
| 6713.0 | 66.7 | TimerFire 55.2 ms, TimerFire 16.2 ms, MinorGC 2.1 ms | yg (6.5 ms sampled), tt (5.8 ms sampled), Bl (3.8 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
