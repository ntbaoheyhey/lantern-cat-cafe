# Cold-page hitch attribution
REFERENCE: 1440x900-dpr1-cpu4-medium-enemy-pantry-crown-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 61.4 | 33.3 | ProxyMain::BeginMainFrame 20.0 ms, Layout 17.3 ms, ParseHTML 10.6 ms | (program) (33.7 ms sampled) |
| 361.4 | 116.7 |  | (program) (116.4 ms sampled) |
| 1278.0 | 33.3 | TimerFire 22.5 ms | (idle) (17.1 ms sampled), fetch (15.7 ms sampled) |
| 1328.0 | 33.3 | DecompressionStream Inflate 18.7 ms, ProxyMain::BeginMainFrame 0.1 ms, FireAnimationFrame 0.0 ms | (program) (18.1 ms sampled), (idle) (15.1 ms sampled) |
| 1628.0 | 116.7 | EvaluateScript 116.6 ms, v8.compile 75.4 ms, v8.newInstance 0.0 ms | (anonymous) (85.3 ms sampled), (anonymous) (5.8 ms sampled), IT (2.1 ms sampled) |
| 1744.7 | 116.7 | EvaluateScript 116.6 ms, ProxyMain::BeginMainFrame 61.9 ms, Layout 51.5 ms | (program) (64.0 ms sampled), (anonymous) (22.1 ms sampled), ml (3.7 ms sampled) |
| 1878.0 | 49.9 | ProxyMain::BeginMainFrame 27.2 ms, EventDispatch 23.9 ms, FunctionCall 19.8 ms | (program) (26.0 ms sampled), (anonymous) (11.9 ms sampled), Jo (1.2 ms sampled) |
| 2278.0 | 266.6 | EventDispatch 288.3 ms, FunctionCall 286.7 ms, Layout 6.1 ms | Mg (78.0 ms sampled), (garbage collector) (14.7 ms sampled), makeStage (10.7 ms sampled) |
| 2311.4 | 33.4 | EventDispatch 288.3 ms, FunctionCall 286.7 ms, EventDispatch 7.4 ms | (program) (15.7 ms sampled), n (6.6 ms sampled), setSize (4.9 ms sampled) |
| 3128.0 | 116.7 | TimerFire 124.5 ms, MinorGC 1.2 ms, V8.GCScavenger 1.2 ms | g (6.0 ms sampled), _g (4.7 ms sampled), Qe (3.5 ms sampled) |
| 3277.9 | 133.2 | TimerFire 143.7 ms, MinorGC 2.1 ms, V8.GCScavenger 2.1 ms | C (12.6 ms sampled), n (5.3 ms sampled), (garbage collector) (3.9 ms sampled) |
| 3678.0 | 383.4 | TimerFire 376.2 ms, Decode Image 28.9 ms, ProxyMain::BeginMainFrame 15.8 ms | xe (47.0 ms sampled), g (21.8 ms sampled), C (14.5 ms sampled) |
| 3711.3 | 33.3 | ProxyMain::BeginMainFrame 16.1 ms, ProxyMain::BeginMainFrame 15.8 ms, FireAnimationFrame 13.0 ms | (program) (12.0 ms sampled), Qe (1.7 ms sampled), renderBufferDirect (1.4 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
