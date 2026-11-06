# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu4-medium-enemy-rain-spool-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 61.8 | 33.3 | ProxyMain::BeginMainFrame 19.2 ms, Layout 16.8 ms, ParseHTML 10.7 ms | (program) (33.2 ms sampled) |
| 361.8 | 116.7 | ParseHTML 9.6 ms | (program) (116.7 ms sampled) |
| 1261.8 | 33.3 | TimerFire 22.4 ms, FunctionCall 0.0 ms | fetch (21.8 ms sampled), (idle) (9.5 ms sampled), (program) (1.5 ms sampled) |
| 1295.1 | 33.3 | ProxyMain::BeginMainFrame 1.2 ms, Commit 0.9 ms, Layout 0.1 ms | (idle) (20.0 ms sampled), (program) (11.5 ms sampled), unpack (1.2 ms sampled) |
| 1328.4 | 33.3 | DecompressionStream Inflate 18.3 ms, ProxyMain::BeginMainFrame 0.4 ms, FireAnimationFrame 0.4 ms | (program) (26.2 ms sampled), (idle) (7.6 ms sampled) |
| 1628.4 | 133.3 | EvaluateScript 119.1 ms, v8.compile 80.2 ms, MinorGC 1.6 ms | (anonymous) (93.1 ms sampled), (anonymous) (9.1 ms sampled), (garbage collector) (2.6 ms sampled) |
| 1728.4 | 100.0 | EvaluateScript 119.1 ms, ProxyMain::BeginMainFrame 62.3 ms, Layout 50.5 ms | (program) (57.1 ms sampled), (anonymous) (20.9 ms sampled), JW (1.7 ms sampled) |
| 1761.7 | 33.3 | ProxyMain::BeginMainFrame 62.3 ms, Layout 50.5 ms, PrePaint 5.1 ms | (program) (15.0 ms sampled), (idle) (2.8 ms sampled), computeAccessibleNameComposite (1.8 ms sampled) |
| 1861.7 | 49.9 | ProxyMain::BeginMainFrame 26.9 ms, EventDispatch 25.9 ms, FunctionCall 21.7 ms | (program) (24.9 ms sampled), (anonymous) (12.7 ms sampled), removeChild (1.6 ms sampled) |
| 2261.8 | 283.4 | EventDispatch 288.2 ms, FunctionCall 287.3 ms, Layout 6.1 ms | Mg (74.7 ms sampled), (garbage collector) (20.0 ms sampled), me (9.9 ms sampled) |
| 3095.1 | 116.7 | TimerFire 123.0 ms, TimerFire 2.2 ms, MinorGC 1.2 ms | ph (4.3 ms sampled), Qm (4.0 ms sampled), Qe (3.4 ms sampled) |
| 3245.1 | 133.5 | TimerFire 140.4 ms, MinorGC 1.7 ms, V8.GCScavenger 1.7 ms | C (13.8 ms sampled), Qm (4.7 ms sampled), renderBufferDirect (4.4 ms sampled) |
| 3661.7 | 383.4 | TimerFire 385.1 ms, Decode Image 28.7 ms, ProxyMain::BeginMainFrame 14.4 ms | xe (46.5 ms sampled), g (23.3 ms sampled), tt (14.3 ms sampled) |
| 3695.0 | 33.3 | ProxyMain::BeginMainFrame 17.6 ms, ProxyMain::BeginMainFrame 14.4 ms, FireAnimationFrame 14.3 ms | (program) (11.2 ms sampled), g (1.3 ms sampled), ml (1.2 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
