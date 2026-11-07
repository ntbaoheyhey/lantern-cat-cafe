# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu4-medium-inkcap-4-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 56.6 | 33.3 | ProxyMain::BeginMainFrame 20.3 ms, Layout 16.7 ms, ParseHTML 10.2 ms | (program) (32.9 ms sampled), (idle) (0.8 ms sampled) |
| 323.3 | 100.1 |  | (program) (100.4 ms sampled) |
| 1173.3 | 33.4 | ProxyMain::BeginMainFrame 1.0 ms, Layout 0.1 ms, Commit 0.0 ms | (idle) (21.1 ms sampled), (program) (12.4 ms sampled), unpack (0.2 ms sampled) |
| 1539.8 | 99.9 | TimerFire 117.9 ms, EvaluateScript 112.0 ms, v8.compile 74.9 ms | (anonymous) (70.5 ms sampled), (anonymous) (8.2 ms sampled), (garbage collector) (2.4 ms sampled) |
| 1639.8 | 100.0 | TimerFire 117.9 ms, EvaluateScript 112.0 ms, ProxyMain::BeginMainFrame 53.7 ms | (program) (52.1 ms sampled), (anonymous) (18.9 ms sampled), (anonymous) (1.1 ms sampled) |
| 1873.2 | 33.3 | TimerFire 50.9 ms, FunctionCall 49.7 ms, GLES2::GetString 1.1 ms | n (5.3 ms sampled), e (2.9 ms sampled), makeGlow (1.7 ms sampled) |
| 1906.5 | 33.3 | TimerFire 50.9 ms, FunctionCall 49.7 ms, TimerFire 12.1 ms | (program) (7.2 ms sampled), Dg.setSize (4.6 ms sampled), (garbage collector) (3.0 ms sampled) |
| 1973.2 | 50.1 | ProxyMain::BeginMainFrame 54.9 ms, EventDispatch 20.0 ms, FunctionCall 18.8 ms | (program) (22.9 ms sampled), (anonymous) (11.0 ms sampled), e (1.2 ms sampled) |
| 2573.1 | 33.3 | EventDispatch 39.0 ms, FunctionCall 38.9 ms, Layout 6.6 ms | resizeToHost (8.4 ms sampled), n (4.0 ms sampled), Dg.setSize (3.8 ms sampled) |
| 2706.5 | 50.1 | TimerFire 72.2 ms, MajorGC 3.8 ms, V8.GCFinalizeMC 3.8 ms | (garbage collector) (6.1 ms sampled), e (3.9 ms sampled), clone (3.3 ms sampled) |
| 5856.4 | 50.0 | TimerFire 67.0 ms, MinorGC 0.8 ms, V8.GCScavenger 0.8 ms | yh (4.5 ms sampled), Ph (3.3 ms sampled), Ph (2.9 ms sampled) |
| 5989.7 | 33.3 | TimerFire 19.9 ms, TimerFire 19.8 ms, MinorGC 1.7 ms | g (4.8 ms sampled), $e (3.3 ms sampled), $e (3.1 ms sampled) |
| 6073.1 | 33.4 | TimerFire 21.8 ms, TimerFire 18.4 ms, ProxyMain::BeginMainFrame 1.1 ms | C (4.2 ms sampled), $e (3.7 ms sampled), g (3.0 ms sampled) |
| 6173.0 | 33.4 | TimerFire 21.3 ms, TimerFire 19.3 ms, MinorGC 1.3 ms | g (4.5 ms sampled), C (3.5 ms sampled), $e (3.2 ms sampled) |
| 6289.7 | 33.3 | TimerFire 22.5 ms, TimerFire 18.9 ms, ProxyMain::BeginMainFrame 1.3 ms | g (4.2 ms sampled), C (4.1 ms sampled), $e (2.4 ms sampled) |
| 6973.0 | 50.0 | TimerFire 50.6 ms, TimerFire 15.0 ms, MinorGC 1.4 ms | g (4.9 ms sampled), Ph (4.5 ms sampled), yh (4.4 ms sampled) |
| 10022.8 | 33.3 | ProxyMain::BeginMainFrame 18.0 ms, FireAnimationFrame 14.4 ms, ProxyMain::BeginMainFrame 10.0 ms | (program) (6.7 ms sampled), (idle) (3.7 ms sampled), ensure (1.6 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
