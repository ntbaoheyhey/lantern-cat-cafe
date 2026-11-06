# Cold-page hitch attribution
REFERENCE: 1440x900-dpr1-cpu4-medium-clover-1-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 75.8 | 33.3 | ProxyMain::BeginMainFrame 17.7 ms, Layout 14.8 ms, ParseHTML 11.0 ms | (program) (33.5 ms sampled), (idle) (0.1 ms sampled) |
| 292.5 | 100.0 | ParseHTML 8.7 ms | (program) (100.2 ms sampled) |
| 1775.7 | 1466.6 | ParseHTML 1465.6 ms, EvaluateScript 1464.9 ms, MinorGC 21.0 ms | (anonymous) (1269.6 ms sampled), (garbage collector) (72.1 ms sampled), (anonymous) (61.2 ms sampled) |
| 1992.4 | 216.7 | ParseHTML 1465.6 ms, EvaluateScript 1464.9 ms, DecompressionStream Inflate 53.7 ms | (program) (213.0 ms sampled), (anonymous) (2.6 ms sampled), sample (0.4 ms sampled) |
| 2042.4 | 50.0 | DecompressionStream Inflate 22.2 ms, EvaluateScript 16.8 ms, ProxyMain::BeginMainFrame 1.6 ms | (program) (44.4 ms sampled), InjectedScript (1.8 ms sampled), (anonymous) (0.8 ms sampled) |
| 2675.7 | 633.3 | EvaluateScript 467.1 ms, v8.compile 432.0 ms, MajorGC 6.3 ms | (anonymous) (589.5 ms sampled), (program) (12.1 ms sampled), (anonymous) (6.8 ms sampled) |
| 2792.4 | 116.7 | EvaluateScript 467.1 ms, ProxyMain::BeginMainFrame 58.6 ms, Layout 46.9 ms | (program) (60.6 ms sampled), (anonymous) (20.4 ms sampled), (idle) (3.9 ms sampled) |
| 2925.7 | 50.0 | ProxyMain::BeginMainFrame 30.9 ms, EventDispatch 25.9 ms, FunctionCall 22.4 ms | (program) (28.2 ms sampled), (anonymous) (13.9 ms sampled), removeChild (1.8 ms sampled) |
| 3259.0 | 283.3 | EventDispatch 280.6 ms, FunctionCall 270.7 ms, Layout 24.1 ms | Tg (73.8 ms sampled), resizeToHost (30.0 ms sampled), (program) (13.4 ms sampled) |
| 3292.3 | 33.3 | ProxyMain::BeginMainFrame 10.4 ms, Paint 5.6 ms, Paint 5.6 ms | (program) (20.9 ms sampled), (idle) (4.9 ms sampled), parse (1.9 ms sampled) |
| 4558.9 | 116.6 | MinorGC 2.7 ms, V8.GCScavenger 2.7 ms, V8.GC_SCAVENGER 2.2 ms | ug (5.8 ms sampled), Gm (4.6 ms sampled), g (4.5 ms sampled) |
| 4675.7 | 100.1 | TimerFire 118.6 ms, GLES2Implementation::GetProgramiv 1.0 ms, ImplementationBase::WaitForCmd 1.0 ms | C (11.1 ms sampled), Gm (5.1 ms sampled), n (4.9 ms sampled) |
| 4709.0 | 33.3 | TimerFire 278.5 ms, TimerFire 118.6 ms, MinorGC 2.1 ms | (idle) (5.9 ms sampled), g (3.5 ms sampled), g (2.8 ms sampled) |
| 4992.3 | 283.3 | TimerFire 278.5 ms, ProxyMain::BeginMainFrame 13.2 ms, GLES2Implementation::GetProgramiv 11.0 ms | g (18.2 ms sampled), tt (15.7 ms sampled), Qe (14.7 ms sampled) |
| 5025.6 | 33.3 | ProxyMain::BeginMainFrame 21.2 ms, ProxyMain::BeginMainFrame 13.2 ms, FireAnimationFrame 10.3 ms | (program) (17.0 ms sampled), _removeInactiveBindingsForAction (1.2 ms sampled), Dr (0.9 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
