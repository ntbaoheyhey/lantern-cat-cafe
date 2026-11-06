# Cold-page hitch attribution
REFERENCE: 1440x900-dpr1-cpu4-medium-sorrel-1-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 58.1 | 33.3 | ProxyMain::BeginMainFrame 16.8 ms, Layout 14.0 ms, ParseHTML 11.4 ms | (program) (33.5 ms sampled) |
| 241.4 | 66.7 | ParseHTML 14.0 ms | (program) (66.9 ms sampled) |
| 1608.1 | 1366.7 | ParseHTML 1365.8 ms, EvaluateScript 1359.7 ms, MinorGC 15.5 ms | (anonymous) (1187.5 ms sampled), (garbage collector) (61.0 ms sampled), (anonymous) (49.1 ms sampled) |
| 1824.7 | 216.6 | ParseHTML 1365.8 ms, EvaluateScript 1359.7 ms, DecompressionStream Inflate 48.6 ms | (program) (204.0 ms sampled), (anonymous) (12.2 ms sampled), (idle) (0.5 ms sampled) |
| 1858.0 | 33.3 | DecompressionStream Inflate 20.8 ms, EvaluateScript 13.7 ms, ProxyMain::BeginMainFrame 1.8 ms | (program) (30.1 ms sampled), (anonymous) (0.9 ms sampled), InjectedScript (0.9 ms sampled) |
| 2474.7 | 616.7 | EvaluateScript 455.0 ms, v8.compile 423.7 ms, MajorGC 6.3 ms | (anonymous) (571.7 ms sampled), (program) (13.4 ms sampled), (anonymous) (8.7 ms sampled) |
| 2574.6 | 99.9 | EvaluateScript 455.0 ms, ProxyMain::BeginMainFrame 52.7 ms, Layout 44.0 ms | (program) (47.7 ms sampled), (anonymous) (19.3 ms sampled), (idle) (4.0 ms sampled) |
| 2607.9 | 33.3 | ProxyMain::BeginMainFrame 52.7 ms, Layout 44.0 ms, PrePaint 4.2 ms | (program) (17.5 ms sampled), (idle) (2.3 ms sampled), computeAccessibleNameComposite (1.5 ms sampled) |
| 2691.3 | 33.3 | ProxyMain::BeginMainFrame 28.9 ms, EventDispatch 21.5 ms, FunctionCall 18.0 ms | (program) (17.9 ms sampled), (anonymous) (11.3 ms sampled), Oi (0.9 ms sampled) |
| 3074.6 | 250.0 | EventDispatch 255.9 ms, FunctionCall 255.1 ms, Layout 5.4 ms | Mg (67.7 ms sampled), makeStage (10.7 ms sampled), me (9.3 ms sampled) |
| 3107.9 | 33.3 | EventDispatch 255.9 ms, FunctionCall 255.1 ms, ProxyMain::BeginMainFrame 4.2 ms | (program) (14.1 ms sampled), (idle) (7.8 ms sampled), setSize (4.6 ms sampled) |
| 3324.6 | 33.4 | ProxyMain::BeginMainFrame 0.6 ms, Commit 0.5 ms, UpdateLayoutTree 0.0 ms | (idle) (14.4 ms sampled), (program) (6.2 ms sampled), load (5.3 ms sampled) |
| 3391.3 | 33.4 | ProxyMain::BeginMainFrame 0.9 ms, Commit 0.2 ms, WidgetBase::DidCommitAndDrawCompositorFrame 0.2 ms | (idle) (16.0 ms sampled), (program) (9.8 ms sampled), parse (1.4 ms sampled) |
| 4274.5 | 100.0 | MinorGC 2.6 ms, V8.GCScavenger 1.7 ms, V8.GC_SCAVENGER 1.7 ms | Qm (4.1 ms sampled), g (3.6 ms sampled), ph (3.1 ms sampled) |
| 4407.9 | 100.0 | TimerFire 123.0 ms, MinorGC 3.9 ms, V8.GCScavenger 3.9 ms | C (12.4 ms sampled), (garbage collector) (3.9 ms sampled), renderBufferDirect (3.6 ms sampled) |
| 4691.3 | 250.0 | TimerFire 263.2 ms, GLES2Implementation::GetProgramiv 2.5 ms, ImplementationBase::WaitForCmd 2.5 ms | g (25.0 ms sampled), tt (14.1 ms sampled), Qe (14.1 ms sampled) |
| 4724.5 | 33.2 | TimerFire 263.2 ms, ProxyMain::BeginMainFrame 16.7 ms, FireAnimationFrame 12.7 ms | (program) (13.8 ms sampled), render (1.6 ms sampled), (idle) (1.2 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
