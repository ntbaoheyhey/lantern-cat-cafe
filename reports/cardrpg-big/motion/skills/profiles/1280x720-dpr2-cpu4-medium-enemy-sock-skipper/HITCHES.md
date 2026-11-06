# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu4-medium-enemy-sock-skipper-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 60.9 | 33.3 | ProxyMain::BeginMainFrame 17.2 ms, Layout 13.9 ms, ParseHTML 10.3 ms | (program) (33.5 ms sampled), sample (0.2 ms sampled), (idle) (0.2 ms sampled) |
| 327.6 | 100.0 |  | (program) (99.5 ms sampled) |
| 1194.2 | 33.3 | ProxyMain::BeginMainFrame 1.6 ms, Layout 0.6 ms, Commit 0.0 ms | (idle) (20.3 ms sampled), (program) (13.1 ms sampled), unpack (0.2 ms sampled) |
| 1227.5 | 33.3 | DecompressionStream Inflate 18.1 ms, ProxyMain::BeginMainFrame 0.9 ms, Commit 0.0 ms | (program) (22.1 ms sampled), (idle) (10.6 ms sampled), evaluate (0.8 ms sampled) |
| 1494.3 | 100.1 | EvaluateScript 104.1 ms, v8.compile 69.8 ms, v8.newInstance 0.0 ms | (anonymous) (73.5 ms sampled), (anonymous) (9.0 ms sampled), (anonymous) (1.4 ms sampled) |
| 1594.2 | 99.9 | EvaluateScript 104.1 ms, ProxyMain::BeginMainFrame 55.6 ms, Layout 45.7 ms | (program) (53.8 ms sampled), (anonymous) (21.1 ms sampled), ml (2.1 ms sampled) |
| 1810.8 | 33.3 | ProxyMain::BeginMainFrame 25.9 ms, EventDispatch 21.8 ms, FunctionCall 17.5 ms | (program) (18.5 ms sampled), (anonymous) (10.8 ms sampled), removeChild (1.2 ms sampled) |
| 2227.5 | 283.3 | EventDispatch 278.3 ms, FunctionCall 277.3 ms, Layout 5.5 ms | Mg (73.6 ms sampled), (garbage collector) (18.0 ms sampled), me (9.6 ms sampled) |
| 2960.8 | 100.0 | TimerFire 116.5 ms, MinorGC 1.5 ms, V8.GCScavenger 1.5 ms | g (4.4 ms sampled), Qm (4.2 ms sampled), ph (3.6 ms sampled) |
| 3277.5 | 116.7 | TimerFire 131.2 ms, MinorGC 1.6 ms, V8.GCScavenger 1.6 ms | C (13.9 ms sampled), n (4.2 ms sampled), Qm (3.4 ms sampled) |
| 3660.8 | 366.7 | TimerFire 361.6 ms, Decode Image 27.1 ms, ProxyMain::BeginMainFrame 13.2 ms | xe (42.7 ms sampled), g (22.1 ms sampled), Qe (18.6 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
