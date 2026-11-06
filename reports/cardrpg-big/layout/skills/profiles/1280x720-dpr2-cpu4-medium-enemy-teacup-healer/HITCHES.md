# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu4-medium-enemy-teacup-healer-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 60.3 | 33.4 | ProxyMain::BeginMainFrame 16.2 ms, Layout 13.9 ms, ParseHTML 11.0 ms | (program) (33.5 ms sampled) |
| 1576.8 | 1399.9 | ParseHTML 1345.2 ms, EvaluateScript 1337.1 ms, MinorGC 15.3 ms | (anonymous) (1165.3 ms sampled), (program) (112.5 ms sampled), (garbage collector) (61.9 ms sampled) |
| 1793.5 | 216.7 | ParseHTML 1345.2 ms, EvaluateScript 1337.1 ms, DecompressionStream Inflate 47.9 ms | (program) (205.6 ms sampled), (anonymous) (10.5 ms sampled), (anonymous) (0.6 ms sampled) |
| 1826.8 | 33.3 | DecompressionStream Inflate 20.8 ms, EvaluateScript 14.2 ms, ProxyMain::BeginMainFrame 1.9 ms | (program) (28.7 ms sampled), (anonymous) (1.3 ms sampled), InjectedScript (1.1 ms sampled) |
| 2426.8 | 600.0 | EvaluateScript 444.6 ms, v8.compile 412.6 ms, MajorGC 5.9 ms | (anonymous) (562.8 ms sampled), (program) (10.7 ms sampled), (anonymous) (8.6 ms sampled) |
| 2526.8 | 100.0 | EvaluateScript 444.6 ms, ProxyMain::BeginMainFrame 54.3 ms, Layout 45.2 ms | (program) (44.7 ms sampled), (anonymous) (18.9 ms sampled), (idle) (3.9 ms sampled) |
| 2560.1 | 33.3 | ProxyMain::BeginMainFrame 54.3 ms, Layout 45.2 ms, PrePaint 3.6 ms | (program) (20.1 ms sampled), (idle) (1.7 ms sampled), (anonymous) (1.4 ms sampled) |
| 2643.4 | 33.2 | ProxyMain::BeginMainFrame 28.2 ms, EventDispatch 21.7 ms, FunctionCall 18.2 ms | (program) (17.9 ms sampled), (anonymous) (10.9 ms sampled), Jo (1.0 ms sampled) |
| 3043.5 | 266.7 | EventDispatch 259.4 ms, FunctionCall 259.3 ms, Layout 6.0 ms | Mg (70.0 ms sampled), makeStage (9.1 ms sampled), me (9.1 ms sampled) |
| 3310.1 | 33.4 | ProxyMain::BeginMainFrame 0.9 ms, FireAnimationFrame 0.6 ms, FunctionCall 0.6 ms | (idle) (15.9 ms sampled), (program) (10.8 ms sampled), (anonymous) (1.4 ms sampled) |
| 4243.4 | 116.7 | MinorGC 2.3 ms, V8.GCScavenger 2.3 ms, V8.GC_SCAVENGER 2.3 ms | Qm (4.6 ms sampled), Qe (3.2 ms sampled), yc (3.1 ms sampled) |
| 4360.1 | 100.0 | TimerFire 115.2 ms, GLES2Implementation::GetProgramiv 1.0 ms, ImplementationBase::WaitForCmd 1.0 ms | C (13.2 ms sampled), Qm (5.0 ms sampled), ph (3.5 ms sampled) |
| 4643.4 | 250.0 | TimerFire 270.0 ms, MinorGC 1.9 ms, V8.GCScavenger 1.8 ms | g (20.5 ms sampled), Qe (14.5 ms sampled), tt (13.8 ms sampled) |
| 4676.7 | 33.3 | TimerFire 270.0 ms, ProxyMain::BeginMainFrame 11.3 ms, ProxyMain::BeginMainFrame 10.4 ms | (program) (8.2 ms sampled), renderBufferDirect (2.0 ms sampled), render (1.4 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
