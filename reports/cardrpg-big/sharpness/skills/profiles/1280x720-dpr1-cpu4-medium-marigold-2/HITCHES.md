# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu4-medium-marigold-2-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 82.6 | 33.3 | ProxyMain::BeginMainFrame 15.9 ms, Layout 13.7 ms, ParseHTML 9.6 ms | (program) (32.4 ms sampled), (idle) (0.9 ms sampled), requestAnimationFrame (0.2 ms sampled) |
| 315.9 | 116.6 | ParseHTML 9.6 ms | (program) (116.3 ms sampled) |
| 1166.0 | 33.4 | ProxyMain::BeginMainFrame 2.5 ms, Commit 0.7 ms, Layout 0.1 ms | (idle) (20.4 ms sampled), (program) (13.1 ms sampled), unpack (0.1 ms sampled) |
| 1199.3 | 33.3 | DecompressionStream Inflate 16.9 ms, ProxyMain::BeginMainFrame 0.5 ms, FireAnimationFrame 0.1 ms | (program) (19.4 ms sampled), (idle) (13.1 ms sampled), querySelectorAll (0.7 ms sampled) |
| 1349.2 | 100.0 | EvaluateScript 100.8 ms, v8.compile 68.7 ms, v8.newInstance 0.0 ms | (anonymous) (75.2 ms sampled), (anonymous) (6.4 ms sampled), (anonymous) (1.5 ms sampled) |
| 1449.2 | 100.0 | EvaluateScript 100.8 ms, ProxyMain::BeginMainFrame 52.7 ms, Layout 42.8 ms | (program) (53.8 ms sampled), (anonymous) (20.2 ms sampled), requestAnimationFrame (1.4 ms sampled) |
| 1799.3 | 33.4 | ProxyMain::BeginMainFrame 27.5 ms, EventDispatch 22.2 ms, FunctionCall 18.1 ms | (program) (20.7 ms sampled), (anonymous) (11.6 ms sampled), Ju (0.9 ms sampled) |
| 2199.3 | 266.7 | EventDispatch 264.5 ms, FunctionCall 262.8 ms, Layout 5.4 ms | Mg (66.8 ms sampled), (garbage collector) (12.7 ms sampled), me (9.8 ms sampled) |
| 2832.5 | 116.7 | MinorGC 2.1 ms, V8.GCScavenger 2.1 ms, MinorGC 1.6 ms | (garbage collector) (6.6 ms sampled), ph (4.8 ms sampled), g (3.5 ms sampled) |
| 2965.9 | 116.7 | TimerFire 129.9 ms, MinorGC 2.5 ms, V8.GCScavenger 2.5 ms | C (13.0 ms sampled), n (3.8 ms sampled), n (3.7 ms sampled) |
| 3315.9 | 316.7 | TimerFire 332.9 ms, Decode Image 26.0 ms, Decode Image 6.7 ms | Se (42.8 ms sampled), g (22.6 ms sampled), $e (15.3 ms sampled) |
| 3349.2 | 33.3 | TimerFire 332.9 ms, ProxyMain::BeginMainFrame 17.4 ms, FireAnimationFrame 14.2 ms | (program) (9.8 ms sampled), render (2.1 ms sampled), nt (1.4 ms sampled) |
| 3382.6 | 33.4 | ProxyMain::BeginMainFrame 17.4 ms, FireAnimationFrame 14.2 ms, ProxyMain::BeginMainFrame 13.4 ms | (program) (6.9 ms sampled), (garbage collector) (4.1 ms sampled), renderBufferDirect (2.2 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
