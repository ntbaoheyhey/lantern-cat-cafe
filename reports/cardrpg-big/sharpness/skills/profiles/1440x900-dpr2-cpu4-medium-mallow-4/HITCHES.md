# Cold-page hitch attribution
REFERENCE: 1440x900-dpr2-cpu4-medium-mallow-4-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 57.7 | 33.4 | ProxyMain::BeginMainFrame 16.8 ms, Layout 13.8 ms, ParseHTML 10.5 ms | (program) (33.6 ms sampled), (idle) (0.0 ms sampled), (garbage collector) (-0.0 ms sampled) |
| 307.7 | 100.1 |  | (program) (99.7 ms sampled) |
| 1141.0 | 33.4 | TimerFire 21.1 ms | fetch (16.9 ms sampled), (idle) (16.6 ms sampled) |
| 1191.0 | 33.3 | DecompressionStream Inflate 17.5 ms, ProxyMain::BeginMainFrame 0.5 ms, FireAnimationFrame 0.0 ms | (program) (16.6 ms sampled), (idle) (16.1 ms sampled), querySelectorAll (0.8 ms sampled) |
| 1341.0 | 100.1 | EvaluateScript 99.0 ms, v8.compile 66.7 ms, v8.newInstance 0.0 ms | (anonymous) (76.5 ms sampled), (anonymous) (7.1 ms sampled), $z (1.1 ms sampled) |
| 1440.9 | 99.9 | EvaluateScript 99.0 ms, ProxyMain::BeginMainFrame 54.3 ms, Layout 44.3 ms | (program) (52.1 ms sampled), (anonymous) (20.7 ms sampled), ml (2.5 ms sampled) |
| 1791.0 | 33.4 | ProxyMain::BeginMainFrame 28.2 ms, EventDispatch 22.0 ms, FunctionCall 17.5 ms | (program) (17.9 ms sampled), (anonymous) (11.3 ms sampled), removeChild (1.8 ms sampled) |
| 2190.9 | 266.6 | EventDispatch 272.3 ms, FunctionCall 270.9 ms, Layout 6.2 ms | Mg (71.7 ms sampled), (garbage collector) (12.3 ms sampled), resizeToHost (8.8 ms sampled) |
| 2840.9 | 116.7 | MinorGC 2.1 ms, V8.GCScavenger 2.1 ms, MinorGC 1.9 ms | (garbage collector) (5.3 ms sampled), g (4.9 ms sampled), ph (4.6 ms sampled) |
| 4007.6 | 133.4 | TimerFire 141.3 ms, MinorGC 2.0 ms, V8.GCScavenger 1.9 ms | C (13.3 ms sampled), n (6.7 ms sampled), Se (4.6 ms sampled) |
| 4357.5 | 333.3 | TimerFire 333.7 ms, Decode Image 26.6 ms, ProxyMain::BeginMainFrame 15.6 ms | Se (41.7 ms sampled), g (24.5 ms sampled), renderBufferDirect (16.5 ms sampled) |
| 4390.9 | 33.4 | ProxyMain::BeginMainFrame 18.3 ms, ProxyMain::BeginMainFrame 15.6 ms, FireAnimationFrame 14.2 ms | (program) (12.4 ms sampled), nf (1.0 ms sampled), inspect (0.9 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
