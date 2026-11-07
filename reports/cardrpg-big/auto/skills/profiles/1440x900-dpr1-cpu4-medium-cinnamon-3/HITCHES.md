# Cold-page hitch attribution
REFERENCE: 1440x900-dpr1-cpu4-medium-cinnamon-3-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 286.6 | 99.9 | ParseHTML 17.3 ms | (program) (99.8 ms sampled) |
| 1720.0 | 1433.4 | ParseHTML 1431.7 ms, EvaluateScript 1421.3 ms, MinorGC 18.1 ms | (anonymous) (1246.6 ms sampled), (garbage collector) (66.9 ms sampled), (program) (49.5 ms sampled) |
| 1936.6 | 216.6 | ParseHTML 1431.7 ms, EvaluateScript 1421.3 ms, DecompressionStream Inflate 58.1 ms | (program) (211.4 ms sampled), (anonymous) (4.7 ms sampled), PerformanceObserver.observe.type.type (0.3 ms sampled) |
| 1969.9 | 33.3 | DecompressionStream Inflate 22.0 ms, ProxyMain::BeginMainFrame 1.1 ms, FireAnimationFrame 0.0 ms | (program) (33.0 ms sampled) |
| 2603.3 | 633.4 | EvaluateScript 451.4 ms, v8.compile 418.8 ms, EvaluateScript 14.6 ms | (anonymous) (573.5 ms sampled), (program) (25.6 ms sampled), (anonymous) (6.8 ms sampled) |
| 2703.3 | 100.0 | EvaluateScript 451.4 ms, ProxyMain::BeginMainFrame 56.5 ms, Layout 46.4 ms | (program) (46.6 ms sampled), (anonymous) (20.4 ms sampled), (idle) (3.8 ms sampled) |
| 2736.6 | 33.3 | ProxyMain::BeginMainFrame 56.5 ms, Layout 46.4 ms, PrePaint 4.3 ms | (program) (18.8 ms sampled), computeAccessibleNameComposite (1.7 ms sampled), (anonymous) (1.4 ms sampled) |
| 2836.5 | 33.3 | ProxyMain::BeginMainFrame 27.3 ms, EventDispatch 22.2 ms, FunctionCall 18.6 ms | (program) (17.7 ms sampled), (anonymous) (12.0 ms sampled), removeChild (1.4 ms sampled) |
| 3203.2 | 233.3 | EventDispatch 232.7 ms, FunctionCall 232.6 ms, Layout 6.0 ms | jg (73.7 ms sampled), resizeToHost (8.9 ms sampled), me (8.7 ms sampled) |
| 3469.9 | 33.4 | ProxyMain::BeginMainFrame 0.9 ms, FireAnimationFrame 0.4 ms, FunctionCall 0.4 ms | (idle) (18.5 ms sampled), (program) (11.1 ms sampled), A_ (0.8 ms sampled) |
| 4436.5 | 100.0 | MinorGC 2.0 ms, V8.GCScavenger 1.9 ms, V8.GC_SCAVENGER 1.4 ms | Zm (4.9 ms sampled), sg (3.0 ms sampled), g (2.9 ms sampled) |
| 4586.5 | 116.7 | TimerFire 125.1 ms, MinorGC 3.8 ms, V8.GCScavenger 3.5 ms | C (12.9 ms sampled), (garbage collector) (4.4 ms sampled), n (4.1 ms sampled) |
| 4853.2 | 250.0 | TimerFire 258.3 ms, GLES2Implementation::GetProgramiv 12.4 ms, ImplementationBase::WaitForCmd 12.4 ms | g (19.2 ms sampled), C (15.2 ms sampled), nt (10.8 ms sampled) |
| 4886.5 | 33.3 | TimerFire 258.3 ms, ProxyMain::BeginMainFrame 16.9 ms, FireAnimationFrame 12.6 ms | (program) (9.8 ms sampled), render (1.1 ms sampled), Nr (1.0 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
