# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu4-medium-enemy-kettle-knight-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 58.7 | 33.3 | ProxyMain::BeginMainFrame 17.3 ms, Layout 14.2 ms, ParseHTML 11.3 ms | (program) (32.6 ms sampled), sample (0.9 ms sampled), requestAnimationFrame (0.0 ms sampled) |
| 1575.3 | 1399.9 | ParseHTML 1339.7 ms, EvaluateScript 1332.6 ms, MinorGC 15.5 ms | (anonymous) (1160.2 ms sampled), (program) (109.4 ms sampled), (garbage collector) (58.7 ms sampled) |
| 1775.3 | 200.0 | ParseHTML 1339.7 ms, EvaluateScript 1332.6 ms, DecompressionStream Inflate 47.7 ms | (program) (188.5 ms sampled), (anonymous) (11.1 ms sampled), requestAnimationFrame (0.4 ms sampled) |
| 1808.7 | 33.4 | DecompressionStream Inflate 20.7 ms, LayerTreeHost::~LayerTreeHost 1.1 ms, ProxyMain::Stop 1.1 ms | (program) (33.0 ms sampled), sample (0.1 ms sampled) |
| 2441.9 | 633.2 | EvaluateScript 449.5 ms, v8.compile 418.0 ms, EvaluateScript 15.8 ms | (anonymous) (569.8 ms sampled), (program) (22.7 ms sampled), (anonymous) (8.8 ms sampled) |
| 2525.3 | 83.4 | EvaluateScript 449.5 ms, ProxyMain::BeginMainFrame 50.9 ms, Layout 41.5 ms | (program) (40.9 ms sampled), (anonymous) (19.2 ms sampled), (idle) (3.7 ms sampled) |
| 2558.6 | 33.3 | ProxyMain::BeginMainFrame 50.9 ms, Layout 41.5 ms, PrePaint 3.9 ms | (program) (19.2 ms sampled), queryAll (1.9 ms sampled), (anonymous) (1.6 ms sampled) |
| 2641.9 | 33.3 | ProxyMain::BeginMainFrame 27.1 ms, EventDispatch 21.3 ms, FunctionCall 18.1 ms | (program) (16.9 ms sampled), (anonymous) (11.5 ms sampled), cp (1.0 ms sampled) |
| 3041.9 | 266.7 | EventDispatch 261.8 ms, FunctionCall 261.6 ms, Layout 5.0 ms | Mg (68.7 ms sampled), makeStage (10.0 ms sampled), me (9.6 ms sampled) |
| 3291.9 | 33.3 | ProxyMain::BeginMainFrame 0.9 ms, Commit 0.8 ms, MainFrameAborted 0.7 ms | (idle) (13.1 ms sampled), (program) (7.4 ms sampled), fetch (5.6 ms sampled) |
| 3358.6 | 33.4 | ProxyMain::BeginMainFrame 2.2 ms, EventDispatch 0.9 ms, Commit 0.6 ms | (idle) (17.5 ms sampled), (program) (10.7 ms sampled), parse (1.0 ms sampled) |
| 4225.2 | 100.0 | MinorGC 2.7 ms, V8.GCScavenger 2.5 ms, V8.GC_SCAVENGER 2.5 ms | Qm (5.8 ms sampled), (garbage collector) (3.3 ms sampled), _g (3.1 ms sampled) |
| 4358.5 | 100.0 | TimerFire 122.0 ms, GLES2Implementation::GetProgramiv 1.0 ms, ImplementationBase::WaitForCmd 1.0 ms | C (13.9 ms sampled), xe (5.3 ms sampled), n (5.3 ms sampled) |
| 4658.5 | 266.7 | TimerFire 270.8 ms, ProxyMain::BeginMainFrame 11.4 ms, FireAnimationFrame 5.0 ms | g (19.7 ms sampled), Qe (18.5 ms sampled), renderBufferDirect (10.8 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
