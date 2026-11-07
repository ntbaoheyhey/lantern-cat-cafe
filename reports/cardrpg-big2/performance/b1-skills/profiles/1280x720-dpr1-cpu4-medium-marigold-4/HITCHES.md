# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu4-medium-marigold-4-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 56.6 | 33.3 | ProxyMain::BeginMainFrame 19.4 ms, Layout 17.0 ms, ParseHTML 10.9 ms | (program) (31.9 ms sampled), sample (0.4 ms sampled), (idle) (0.3 ms sampled) |
| 323.2 | 100.0 |  | (program) (100.0 ms sampled) |
| 1173.2 | 33.3 | ProxyMain::BeginMainFrame 1.6 ms, Layout 0.9 ms, Paint 0.3 ms | (idle) (21.1 ms sampled), (program) (12.6 ms sampled), unpack (0.1 ms sampled) |
| 1206.6 | 33.4 | DecompressionStream Inflate 18.3 ms, ProxyMain::BeginMainFrame 0.7 ms, Commit 0.7 ms | (program) (20.5 ms sampled), (idle) (12.5 ms sampled) |
| 1539.9 | 100.0 | TimerFire 116.1 ms, EvaluateScript 111.4 ms, v8.compile 74.0 ms | (anonymous) (75.8 ms sampled), (anonymous) (9.4 ms sampled), (anonymous) (2.4 ms sampled) |
| 1639.9 | 100.0 | TimerFire 116.1 ms, EvaluateScript 111.4 ms, ProxyMain::BeginMainFrame 53.0 ms | (program) (46.0 ms sampled), (anonymous) (19.9 ms sampled), hl (2.2 ms sampled) |
| 1873.2 | 33.3 | TimerFire 50.7 ms, FunctionCall 50.6 ms, GLES2Implementation::GetRequestableExtensionsCHROMIUM() 1.0 ms | n (5.4 ms sampled), Ey (4.1 ms sampled), pe (4.0 ms sampled) |
| 1906.5 | 33.3 | TimerFire 50.7 ms, FunctionCall 50.6 ms, TimerFire 11.6 ms | (program) (7.3 ms sampled), Dg.setSize (3.4 ms sampled), (garbage collector) (2.1 ms sampled) |
| 1989.9 | 50.0 | ProxyMain::BeginMainFrame 29.3 ms, EventDispatch 19.9 ms, FunctionCall 18.8 ms | (program) (30.1 ms sampled), (anonymous) (11.0 ms sampled), Xo (1.2 ms sampled) |
| 2706.5 | 49.9 | TimerFire 64.9 ms, MinorGC 1.0 ms, V8.GCScavenger 1.0 ms | e (4.7 ms sampled), (garbage collector) (4.0 ms sampled), clone (2.8 ms sampled) |
| 5839.8 | 50.1 | TimerFire 67.7 ms, MinorGC 2.0 ms, V8.GCScavenger 1.9 ms | yh (4.6 ms sampled), Ph (4.1 ms sampled), $e (4.1 ms sampled) |
| 5956.3 | 33.2 | TimerFire 18.5 ms, TimerFire 17.9 ms, ProxyMain::BeginMainFrame 1.9 ms | g (4.7 ms sampled), g (3.3 ms sampled), $e (2.7 ms sampled) |
| 6056.4 | 33.4 | TimerFire 21.3 ms, TimerFire 19.5 ms, ProxyMain::BeginMainFrame 1.3 ms | g (7.0 ms sampled), C (2.4 ms sampled), g (2.1 ms sampled) |
| 6189.7 | 33.3 | TimerFire 19.2 ms, TimerFire 17.1 ms, ProxyMain::BeginMainFrame 1.2 ms | g (6.6 ms sampled), g (3.7 ms sampled), g (2.3 ms sampled) |
| 6323.1 | 33.4 | TimerFire 17.1 ms, TimerFire 17.0 ms, MinorGC 1.0 ms | $e (3.8 ms sampled), g (3.6 ms sampled), g (3.3 ms sampled) |
| 6939.7 | 33.3 | TimerFire 49.5 ms, MinorGC 1.2 ms, V8.GCScavenger 1.2 ms | yh (4.5 ms sampled), Ph (3.0 ms sampled), yh (2.1 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
