# Cold-page hitch attribution
REFERENCE: 1440x900-dpr1-cpu4-medium-sorrel-3-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 60.5 | 33.2 | ProxyMain::BeginMainFrame 17.0 ms, Layout 13.9 ms, ParseHTML 10.7 ms | (program) (31.9 ms sampled), requestAnimationFrame (0.9 ms sampled), sample (0.2 ms sampled) |
| 310.6 | 116.7 | ParseHTML 10.8 ms | (program) (116.5 ms sampled) |
| 1160.5 | 33.3 | TimerFire 21.2 ms | fetch (17.5 ms sampled), (idle) (14.9 ms sampled), (program) (0.6 ms sampled) |
| 1193.9 | 33.4 | ProxyMain::BeginMainFrame 1.3 ms, Layout 1.1 ms, Commit 0.0 ms | (idle) (20.8 ms sampled), (program) (12.7 ms sampled) |
| 1360.5 | 100.0 | EvaluateScript 100.0 ms, v8.compile 67.6 ms, v8.newInstance 0.0 ms | (anonymous) (79.8 ms sampled), (anonymous) (6.7 ms sampled), (anonymous) (2.9 ms sampled) |
| 1460.5 | 100.0 | EvaluateScript 100.0 ms, ProxyMain::BeginMainFrame 53.0 ms, Layout 43.3 ms | (program) (48.8 ms sampled), (anonymous) (20.3 ms sampled), ml (3.2 ms sampled) |
| 1810.5 | 33.4 | ProxyMain::BeginMainFrame 28.7 ms, EventDispatch 21.4 ms, FunctionCall 17.5 ms | (program) (18.0 ms sampled), (anonymous) (10.7 ms sampled), Jt (0.9 ms sampled) |
| 2210.4 | 266.6 | EventDispatch 264.1 ms, FunctionCall 263.4 ms, Layout 5.9 ms | Mg (67.7 ms sampled), (garbage collector) (11.8 ms sampled), me (9.5 ms sampled) |
| 2843.7 | 116.6 | MinorGC 3.0 ms, V8.GCScavenger 3.0 ms, MinorGC 2.1 ms | (garbage collector) (6.9 ms sampled), ph (6.2 ms sampled), _g (5.7 ms sampled) |
| 2977.1 | 116.7 | TimerFire 128.2 ms, MajorGC 6.3 ms, V8.GCFinalizeMC 6.3 ms | C (13.1 ms sampled), n (5.6 ms sampled), Qm (4.5 ms sampled) |
| 3343.7 | 333.3 | TimerFire 342.6 ms, Decode Image 26.1 ms, ProxyMain::BeginMainFrame 12.9 ms | Se (42.3 ms sampled), g (26.3 ms sampled), $e (14.3 ms sampled) |
| 3377.1 | 33.4 | ProxyMain::BeginMainFrame 18.6 ms, FireAnimationFrame 14.8 ms, ProxyMain::BeginMainFrame 12.9 ms | (program) (7.7 ms sampled), nt (1.4 ms sampled), ensure (1.2 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
