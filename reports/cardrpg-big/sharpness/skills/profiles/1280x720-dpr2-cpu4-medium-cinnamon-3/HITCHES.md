# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu4-medium-cinnamon-3-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 55.9 | 33.3 | ProxyMain::BeginMainFrame 17.1 ms, Layout 14.1 ms, ParseHTML 10.4 ms | (program) (32.0 ms sampled), sample (1.1 ms sampled) |
| 306.0 | 100.0 |  | (program) (99.5 ms sampled) |
| 1139.2 | 33.3 | TimerFire 21.5 ms | fetch (19.2 ms sampled), (idle) (14.6 ms sampled), unpack (0.0 ms sampled) |
| 1172.6 | 33.4 | ProxyMain::BeginMainFrame 1.5 ms, FireAnimationFrame 0.3 ms, FunctionCall 0.3 ms | (idle) (18.9 ms sampled), (program) (14.3 ms sampled), requestAnimationFrame (0.4 ms sampled) |
| 1355.9 | 116.7 | EvaluateScript 103.0 ms, v8.compile 70.2 ms, FunctionCall 1.0 ms | (anonymous) (82.4 ms sampled), (anonymous) (11.4 ms sampled), (anonymous) (1.8 ms sampled) |
| 1439.3 | 83.4 | ProxyMain::BeginMainFrame 54.5 ms, Layout 44.5 ms, FunctionCall 38.5 ms | (program) (43.9 ms sampled), (anonymous) (19.6 ms sampled), ml (2.7 ms sampled) |
| 1789.2 | 33.3 | ProxyMain::BeginMainFrame 27.3 ms, EventDispatch 21.0 ms, FunctionCall 17.6 ms | (program) (17.7 ms sampled), (anonymous) (11.4 ms sampled), removeChild (1.1 ms sampled) |
| 2189.2 | 266.6 | EventDispatch 271.3 ms, FunctionCall 271.1 ms, Layout 5.5 ms | Mg (76.0 ms sampled), (garbage collector) (12.2 ms sampled), me (10.0 ms sampled) |
| 2822.5 | 116.7 | MinorGC 2.2 ms, V8.GCScavenger 2.2 ms, V8.GC_SCAVENGER 2.2 ms | (garbage collector) (4.3 ms sampled), Qm (4.1 ms sampled), $e (3.7 ms sampled) |
| 3989.2 | 116.7 | TimerFire 135.9 ms, MinorGC 1.8 ms, GLES2Implementation::GetProgramiv 1.7 ms | C (14.2 ms sampled), Se (8.0 ms sampled), n (5.3 ms sampled) |
| 4339.1 | 316.6 | TimerFire 330.2 ms, Decode Image 27.2 ms, ProxyMain::BeginMainFrame 14.4 ms | Se (42.3 ms sampled), g (24.7 ms sampled), $e (13.5 ms sampled) |
| 4372.5 | 33.4 | ProxyMain::BeginMainFrame 18.3 ms, ProxyMain::BeginMainFrame 14.4 ms, FireAnimationFrame 13.7 ms | (program) (9.6 ms sampled), nt (1.6 ms sampled), render (1.3 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
