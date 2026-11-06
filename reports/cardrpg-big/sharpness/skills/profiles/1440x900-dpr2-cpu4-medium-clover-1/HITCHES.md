# Cold-page hitch attribution
REFERENCE: 1440x900-dpr2-cpu4-medium-clover-1-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 84.2 | 33.4 | ProxyMain::BeginMainFrame 16.5 ms, Layout 13.9 ms, ParseHTML 9.6 ms | (program) (33.4 ms sampled) |
| 317.5 | 116.7 | ParseHTML 9.6 ms | (program) (116.0 ms sampled) |
| 1134.1 | 33.4 | TimerFire 21.1 ms, FunctionCall 0.0 ms | fetch (19.4 ms sampled), (idle) (12.0 ms sampled), unpack (1.7 ms sampled) |
| 1167.4 | 33.3 | ProxyMain::BeginMainFrame 1.8 ms, Paint 0.9 ms, Paint 0.9 ms | (idle) (19.9 ms sampled), (program) (13.2 ms sampled), unpack (0.1 ms sampled) |
| 1350.7 | 116.6 | EvaluateScript 103.4 ms, v8.compile 70.0 ms, v8.newInstance 0.0 ms | (anonymous) (82.8 ms sampled), (anonymous) (7.2 ms sampled), (program) (4.7 ms sampled) |
| 1450.7 | 100.0 | EvaluateScript 103.4 ms, ProxyMain::BeginMainFrame 53.1 ms, Layout 43.8 ms | (program) (55.5 ms sampled), (anonymous) (19.8 ms sampled), (garbage collector) (1.5 ms sampled) |
| 1784.0 | 33.2 | ProxyMain::BeginMainFrame 29.0 ms, EventDispatch 21.9 ms, FunctionCall 18.4 ms | (program) (19.2 ms sampled), (anonymous) (11.7 ms sampled), removeChild (1.2 ms sampled) |
| 2184.0 | 266.6 | EventDispatch 271.5 ms, FunctionCall 269.7 ms, Layout 5.5 ms | Mg (70.1 ms sampled), makeStage (10.1 ms sampled), (garbage collector) (9.7 ms sampled) |
| 2817.3 | 116.6 | MinorGC 1.8 ms, V8.GCScavenger 1.8 ms, V8.GC_SCAVENGER 1.8 ms | (garbage collector) (4.8 ms sampled), _g (4.2 ms sampled), ph (3.7 ms sampled) |
| 3983.9 | 116.6 | TimerFire 134.8 ms, MinorGC 2.0 ms, V8.GCScavenger 2.0 ms | C (13.9 ms sampled), Se (5.5 ms sampled), ph (4.7 ms sampled) |
| 4317.3 | 316.6 | TimerFire 322.2 ms, Decode Image 26.1 ms, Decode Image 6.9 ms | Se (41.9 ms sampled), g (27.5 ms sampled), renderBufferDirect (14.0 ms sampled) |
| 4350.6 | 33.3 | TimerFire 322.2 ms, ProxyMain::BeginMainFrame 19.9 ms, FireAnimationFrame 14.3 ms | (program) (10.7 ms sampled), render (1.8 ms sampled), render (1.5 ms sampled) |
| 4384.0 | 33.4 | ProxyMain::BeginMainFrame 19.9 ms, FireAnimationFrame 14.3 ms, ProxyMain::BeginMainFrame 13.1 ms | (program) (7.2 ms sampled), (idle) (2.7 ms sampled), nt (1.4 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
