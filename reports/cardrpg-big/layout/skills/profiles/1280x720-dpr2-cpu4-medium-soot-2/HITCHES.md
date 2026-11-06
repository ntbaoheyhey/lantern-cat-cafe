# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu4-medium-soot-2-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 59.3 | 33.3 | ProxyMain::BeginMainFrame 17.0 ms, Layout 14.4 ms, ParseHTML 10.8 ms | (program) (33.4 ms sampled), sample (0.2 ms sampled), (idle) (0.0 ms sampled) |
| 242.7 | 66.7 | ParseHTML 13.9 ms | (program) (66.7 ms sampled) |
| 1592.6 | 1349.9 | ParseHTML 1341.9 ms, EvaluateScript 1336.5 ms, MinorGC 15.2 ms | (anonymous) (1161.4 ms sampled), (program) (60.3 ms sampled), (garbage collector) (57.3 ms sampled) |
| 1792.6 | 200.0 | ParseHTML 1341.9 ms, EvaluateScript 1336.5 ms, DecompressionStream Inflate 48.7 ms | (program) (196.7 ms sampled), (anonymous) (3.5 ms sampled), PerformanceObserver.observe.type.type (0.2 ms sampled) |
| 1825.9 | 33.3 | DecompressionStream Inflate 20.8 ms, EvaluateScript 14.0 ms, ProxyMain::BeginMainFrame 1.7 ms | (program) (30.0 ms sampled), (anonymous) (1.2 ms sampled), get Temporal (0.9 ms sampled) |
| 2425.9 | 600.0 | EvaluateScript 437.7 ms, v8.compile 406.2 ms, MajorGC 6.1 ms | (anonymous) (555.0 ms sampled), (program) (19.5 ms sampled), (garbage collector) (7.1 ms sampled) |
| 2525.9 | 100.0 | EvaluateScript 437.7 ms, ProxyMain::BeginMainFrame 51.5 ms, Layout 42.7 ms | (program) (40.8 ms sampled), (anonymous) (20.2 ms sampled), (idle) (3.8 ms sampled) |
| 2559.2 | 33.3 | ProxyMain::BeginMainFrame 51.5 ms, Layout 42.7 ms, PrePaint 4.3 ms | (program) (20.6 ms sampled), getCSSContent (1.2 ms sampled), (idle) (1.1 ms sampled) |
| 2642.6 | 33.4 | ProxyMain::BeginMainFrame 27.9 ms, EventDispatch 21.0 ms, FunctionCall 17.9 ms | (program) (21.4 ms sampled), (anonymous) (11.3 ms sampled), removeChild (0.8 ms sampled) |
| 3042.5 | 266.6 | EventDispatch 257.7 ms, FunctionCall 256.8 ms, Layout 5.4 ms | Mg (66.4 ms sampled), me (9.5 ms sampled), makeStage (7.9 ms sampled) |
| 3309.3 | 33.4 | ProxyMain::BeginMainFrame 0.9 ms, FireAnimationFrame 0.0 ms, Commit 0.0 ms | (idle) (15.2 ms sampled), (program) (11.0 ms sampled), (anonymous) (1.5 ms sampled) |
| 4242.5 | 100.0 | MinorGC 2.6 ms, V8.GCScavenger 2.6 ms, V8.GC_SCAVENGER 2.6 ms | Qm (4.4 ms sampled), ph (4.2 ms sampled), (garbage collector) (3.4 ms sampled) |
| 4375.8 | 99.9 | TimerFire 120.4 ms, GLES2Implementation::GetProgramiv 1.1 ms, ImplementationBase::WaitForCmd 1.1 ms | C (12.5 ms sampled), xe (5.7 ms sampled), Qm (4.6 ms sampled) |
| 4675.8 | 283.3 | TimerFire 274.2 ms, ProxyMain::BeginMainFrame 11.3 ms, FireAnimationFrame 4.9 ms | g (23.5 ms sampled), Qe (17.0 ms sampled), C (11.3 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
