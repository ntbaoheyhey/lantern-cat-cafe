# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu4-medium-cinnamon-2-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 57.4 | 33.3 | ProxyMain::BeginMainFrame 17.1 ms, Layout 14.2 ms, ParseHTML 10.7 ms | (program) (33.5 ms sampled) |
| 240.8 | 66.7 | ParseHTML 13.1 ms | (program) (66.5 ms sampled) |
| 1590.7 | 1349.9 | ParseHTML 1343.2 ms, EvaluateScript 1337.1 ms, MinorGC 15.8 ms | (anonymous) (1171.1 ms sampled), (garbage collector) (59.9 ms sampled), (program) (50.5 ms sampled) |
| 1790.7 | 200.0 | ParseHTML 1343.2 ms, EvaluateScript 1337.1 ms, DecompressionStream Inflate 48.1 ms | (program) (195.6 ms sampled), (anonymous) (4.2 ms sampled), (idle) (-0.0 ms sampled) |
| 2440.7 | 633.3 | EvaluateScript 443.5 ms, v8.compile 411.5 ms, EvaluateScript 14.0 ms | (anonymous) (561.1 ms sampled), (program) (34.3 ms sampled), (garbage collector) (7.2 ms sampled) |
| 2540.7 | 100.0 | EvaluateScript 443.5 ms, ProxyMain::BeginMainFrame 53.2 ms, Layout 43.5 ms | (program) (51.3 ms sampled), (anonymous) (20.6 ms sampled), (idle) (4.0 ms sampled) |
| 2574.0 | 33.3 | ProxyMain::BeginMainFrame 53.2 ms, PrePaint 3.9 ms, Paint 3.2 ms | (program) (12.2 ms sampled), (idle) (3.8 ms sampled), query (1.7 ms sampled) |
| 2657.4 | 33.4 | ProxyMain::BeginMainFrame 27.1 ms, EventDispatch 21.2 ms, FunctionCall 17.7 ms | (program) (19.6 ms sampled), (anonymous) (11.3 ms sampled), removeChild (1.2 ms sampled) |
| 3057.4 | 266.7 | EventDispatch 262.1 ms, FunctionCall 261.9 ms, Layout 6.3 ms | Mg (68.9 ms sampled), me (11.0 ms sampled), makeStage (9.1 ms sampled) |
| 3324.0 | 33.3 | ProxyMain::BeginMainFrame 0.2 ms, FireAnimationFrame 0.0 ms, UpdateLayoutTree 0.0 ms | (idle) (17.2 ms sampled), (program) (9.3 ms sampled), fetch (1.5 ms sampled) |
| 4257.3 | 116.6 | MinorGC 3.7 ms, V8.GCScavenger 3.7 ms, V8.GC_SCAVENGER 3.7 ms | _g (5.1 ms sampled), Qm (4.4 ms sampled), Qe (4.1 ms sampled) |
| 4374.0 | 100.1 | TimerFire 117.6 ms, GLES2Implementation::GetProgramiv 1.0 ms, ImplementationBase::WaitForCmd 1.0 ms | C (11.2 ms sampled), Qm (5.4 ms sampled), xe (4.8 ms sampled) |
| 4674.0 | 266.7 | TimerFire 276.8 ms, ProxyMain::BeginMainFrame 11.9 ms, FireAnimationFrame 5.6 ms | g (26.4 ms sampled), renderBufferDirect (13.4 ms sampled), Qe (11.7 ms sampled) |
| 4707.3 | 33.3 | ProxyMain::BeginMainFrame 15.7 ms, FireAnimationFrame 13.0 ms, ProxyMain::BeginMainFrame 11.9 ms | (program) (10.1 ms sampled), nf (1.5 ms sampled), (idle) (1.2 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
