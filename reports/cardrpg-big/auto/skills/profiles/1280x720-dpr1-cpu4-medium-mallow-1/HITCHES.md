# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu4-medium-mallow-1-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 64.0 | 33.4 | ProxyMain::BeginMainFrame 17.8 ms, Layout 14.1 ms, ParseHTML 11.6 ms | (program) (32.9 ms sampled), (idle) (0.5 ms sampled), sample (0.1 ms sampled) |
| 280.6 | 99.9 | ParseHTML 16.7 ms | (program) (99.9 ms sampled) |
| 1714.0 | 1433.4 | ParseHTML 1441.0 ms, EvaluateScript 1431.1 ms, MinorGC 17.9 ms | (anonymous) (1227.8 ms sampled), (garbage collector) (73.0 ms sampled), (anonymous) (56.7 ms sampled) |
| 1930.6 | 216.6 | ParseHTML 1441.0 ms, EvaluateScript 1431.1 ms, DecompressionStream Inflate 49.4 ms | (program) (204.0 ms sampled), (anonymous) (10.6 ms sampled), (anonymous) (0.5 ms sampled) |
| 1980.5 | 49.9 | DecompressionStream Inflate 21.2 ms, EvaluateScript 15.5 ms, ProxyMain::BeginMainFrame 1.6 ms | (program) (47.1 ms sampled), get Temporal (1.0 ms sampled), (anonymous) (1.0 ms sampled) |
| 2597.2 | 616.7 | EvaluateScript 451.4 ms, v8.compile 419.2 ms, MajorGC 5.2 ms | (anonymous) (573.7 ms sampled), (program) (13.5 ms sampled), (garbage collector) (6.0 ms sampled) |
| 2713.9 | 116.7 | EvaluateScript 451.4 ms, ProxyMain::BeginMainFrame 54.8 ms, Layout 45.6 ms | (program) (59.6 ms sampled), (anonymous) (20.4 ms sampled), (idle) (4.1 ms sampled) |
| 2830.5 | 33.2 | ProxyMain::BeginMainFrame 27.9 ms, EventDispatch 22.4 ms, FunctionCall 18.9 ms | (program) (18.7 ms sampled), (anonymous) (11.6 ms sampled), removeChild (1.8 ms sampled) |
| 3197.2 | 233.3 | EventDispatch 235.2 ms, FunctionCall 235.1 ms, Layout 6.2 ms | jg (73.2 ms sampled), resizeToHost (9.3 ms sampled), me (9.2 ms sampled) |
| 3497.1 | 33.2 | ProxyMain::BeginMainFrame 0.8 ms, FireAnimationFrame 0.0 ms, Commit 0.0 ms | (idle) (14.5 ms sampled), (program) (6.4 ms sampled), load (5.5 ms sampled) |
| 3713.8 | 33.3 | MajorGC 8.3 ms, V8.GCFinalizeMC 7.9 ms, V8.GC_MARK_COMPACTOR 7.9 ms | load (12.3 ms sampled), (idle) (8.7 ms sampled), (garbage collector) (6.4 ms sampled) |
| 4430.5 | 116.7 | MinorGC 2.5 ms, V8.GCScavenger 2.5 ms, V8.GC_SCAVENGER 2.4 ms | Zm (5.1 ms sampled), g (3.6 ms sampled), fh (2.5 ms sampled) |
| 4563.8 | 116.6 | TimerFire 116.7 ms, GLES2Implementation::GetProgramiv 1.0 ms, ImplementationBase::WaitForCmd 1.0 ms | C (10.1 ms sampled), Zm (4.4 ms sampled), n (4.0 ms sampled) |
| 4863.8 | 283.3 | TimerFire 284.6 ms, GLES2Implementation::GetProgramiv 11.6 ms, ImplementationBase::WaitForCmd 11.5 ms | g (16.5 ms sampled), C (14.4 ms sampled), nt (13.5 ms sampled) |
| 4913.8 | 33.4 | ProxyMain::BeginMainFrame 16.9 ms, FireAnimationFrame 12.6 ms, ProxyMain::BeginMainFrame 10.1 ms | (program) (7.2 ms sampled), (idle) (2.7 ms sampled), renderBufferDirect (1.5 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
