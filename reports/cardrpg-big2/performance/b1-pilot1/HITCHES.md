# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu4-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 61.4 | 33.3 | ProxyMain::BeginMainFrame 21.4 ms, Layout 18.2 ms, ParseHTML 11.3 ms | (program) (32.7 ms sampled) |
| 361.4 | 133.3 | ParseHTML 9.0 ms | (program) (133.2 ms sampled) |
| 1194.7 | 33.3 | TimerFire 23.0 ms | fetch (20.3 ms sampled), (idle) (12.1 ms sampled), unpack (1.1 ms sampled) |
| 1228.0 | 33.3 | ProxyMain::BeginMainFrame 1.0 ms, PrePaint 0.7 ms, Layout 0.1 ms | (idle) (21.3 ms sampled), (program) (12.3 ms sampled) |
| 1594.7 | 100.0 | TimerFire 117.4 ms, EvaluateScript 111.6 ms, v8.compile 75.0 ms | (anonymous) (70.6 ms sampled), (anonymous) (6.9 ms sampled), (garbage collector) (2.0 ms sampled) |
| 1678.0 | 83.3 | TimerFire 117.4 ms, EvaluateScript 111.6 ms, ProxyMain::BeginMainFrame 51.9 ms | (program) (35.8 ms sampled), (anonymous) (19.3 ms sampled), Xo (2.2 ms sampled) |
| 1928.0 | 33.3 | TimerFire 47.9 ms, FunctionCall 47.3 ms, GLES2::GetGLError 1.0 ms | Dg.setSize (3.7 ms sampled), n (2.8 ms sampled), e (2.6 ms sampled) |
| 2061.3 | 83.3 | EventDispatch 54.5 ms, FunctionCall 51.0 ms, ProxyMain::BeginMainFrame 30.3 ms | (program) (28.0 ms sampled), resizeToHost (18.0 ms sampled), Dg.setSize (4.4 ms sampled) |
| 2211.4 | 50.1 | TimerFire 60.4 ms, MinorGC 1.1 ms, MinorGC 0.6 ms | e (4.5 ms sampled), e (4.1 ms sampled), Ex (3.7 ms sampled) |
| 5311.2 | 50.0 | TimerFire 68.7 ms, MinorGC 1.2 ms, V8.GCScavenger 1.2 ms | Bc (3.6 ms sampled), Ph (3.6 ms sampled), yh (3.3 ms sampled) |
| 5427.9 | 33.3 | TimerFire 20.4 ms, TimerFire 17.2 ms, MinorGC 1.0 ms | g (5.4 ms sampled), g (5.2 ms sampled), $e (2.9 ms sampled) |
| 5511.2 | 33.4 | TimerFire 21.8 ms, TimerFire 18.0 ms, ProxyMain::BeginMainFrame 0.9 ms | g (4.6 ms sampled), g (3.4 ms sampled), $e (2.4 ms sampled) |
| 5627.8 | 33.2 | TimerFire 20.8 ms, TimerFire 19.1 ms, ProxyMain::BeginMainFrame 1.0 ms | $e (4.4 ms sampled), g (3.6 ms sampled), g (3.3 ms sampled) |
| 5727.8 | 33.3 | TimerFire 22.7 ms, TimerFire 16.1 ms, ProxyMain::BeginMainFrame 1.1 ms | g (4.5 ms sampled), g (4.2 ms sampled), g (3.8 ms sampled) |
| 5844.5 | 33.3 | TimerFire 17.4 ms, TimerFire 16.5 ms, ProxyMain::BeginMainFrame 0.9 ms | $e (3.9 ms sampled), g (3.6 ms sampled), g (2.9 ms sampled) |
| 6444.5 | 50.0 | TimerFire 47.1 ms, TimerFire 14.9 ms, ProxyMain::BeginMainFrame 0.9 ms | yh (5.0 ms sampled), g (3.3 ms sampled), g (3.0 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
