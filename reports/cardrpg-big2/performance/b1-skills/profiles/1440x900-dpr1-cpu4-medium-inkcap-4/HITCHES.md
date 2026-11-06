# Cold-page hitch attribution
REFERENCE: 1440x900-dpr1-cpu4-medium-inkcap-4-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 52.8 | 33.3 | ProxyMain::BeginMainFrame 20.2 ms, Layout 17.3 ms, ParseHTML 10.3 ms | (program) (33.0 ms sampled), (idle) (0.0 ms sampled) |
| 319.5 | 100.0 | ParseHTML 8.0 ms | (program) (99.8 ms sampled) |
| 1152.7 | 33.2 | ProxyMain::BeginMainFrame 1.3 ms, Layout 0.5 ms, Commit 0.0 ms | (idle) (20.6 ms sampled), (program) (12.3 ms sampled) |
| 1186.1 | 33.4 | DecompressionStream Inflate 18.0 ms, ProxyMain::BeginMainFrame 0.1 ms, FireAnimationFrame 0.0 ms | (program) (22.9 ms sampled), (idle) (10.9 ms sampled) |
| 1519.5 | 100.1 | TimerFire 117.0 ms, EvaluateScript 111.3 ms, v8.compile 75.2 ms | (anonymous) (74.4 ms sampled), (anonymous) (6.1 ms sampled), (garbage collector) (2.2 ms sampled) |
| 1619.4 | 99.9 | TimerFire 117.0 ms, EvaluateScript 111.3 ms, ProxyMain::BeginMainFrame 50.9 ms | (program) (48.0 ms sampled), (anonymous) (18.9 ms sampled), ei (1.4 ms sampled) |
| 1852.8 | 33.4 | TimerFire 47.8 ms, FunctionCall 47.7 ms, GLES2::GetGLError 1.1 ms | n (4.4 ms sampled), e (2.9 ms sampled), Ey (2.2 ms sampled) |
| 1952.7 | 49.9 | ProxyMain::BeginMainFrame 28.8 ms, EventDispatch 20.4 ms, FunctionCall 18.9 ms | (program) (25.9 ms sampled), (anonymous) (11.8 ms sampled), removeChild (1.7 ms sampled) |
| 2552.8 | 33.4 | EventDispatch 41.4 ms, FunctionCall 41.3 ms, Layout 5.6 ms | resizeToHost (8.6 ms sampled), pe (4.9 ms sampled), n (4.8 ms sampled) |
| 2686.1 | 50.0 | TimerFire 61.9 ms, MinorGC 1.1 ms, V8.GCScavenger 1.0 ms | clone (6.4 ms sampled), e (5.4 ms sampled), (garbage collector) (3.5 ms sampled) |
| 5819.2 | 50.0 | TimerFire 67.2 ms, MinorGC 1.1 ms, V8.GCScavenger 1.0 ms | g (3.5 ms sampled), Bc (3.2 ms sampled), yh (3.2 ms sampled) |
| 5952.6 | 33.3 | TimerFire 20.3 ms, TimerFire 19.1 ms, ProxyMain::BeginMainFrame 2.2 ms | g (4.4 ms sampled), $e (4.0 ms sampled), g (3.7 ms sampled) |
| 6102.6 | 33.4 | TimerFire 19.7 ms, TimerFire 16.5 ms, GLES2Implementation::GetProgramiv 1.0 ms | g (4.4 ms sampled), g (4.3 ms sampled), g (2.5 ms sampled) |
| 6219.2 | 33.3 | TimerFire 22.6 ms, TimerFire 16.0 ms, ProxyMain::BeginMainFrame 1.0 ms | g (4.2 ms sampled), g (3.5 ms sampled), $e (2.8 ms sampled) |
| 6552.5 | 33.2 | TimerFire 19.4 ms, TimerFire 17.2 ms, ProxyMain::BeginMainFrame 2.3 ms | g (6.5 ms sampled), g (5.2 ms sampled), g (3.6 ms sampled) |
| 6935.9 | 50.0 | TimerFire 50.2 ms, TimerFire 15.9 ms, ProxyMain::BeginMainFrame 1.5 ms | Ph (3.7 ms sampled), yh (3.6 ms sampled), Ph (3.1 ms sampled) |
| 8969.2 | 33.4 | ProxyMain::BeginMainFrame 17.6 ms, FireAnimationFrame 13.9 ms, ProxyMain::BeginMainFrame 9.2 ms | (program) (6.2 ms sampled), (idle) (4.0 ms sampled), ry (1.7 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
