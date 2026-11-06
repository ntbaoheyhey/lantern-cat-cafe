# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu1-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 474.7 | 33.3 | TimerFire 0.3 ms, ProxyMain::BeginMainFrame 0.3 ms | (anonymous) (16.4 ms sampled), (program) (11.8 ms sampled), (idle) (2.8 ms sampled) |
| 591.4 | 33.4 | EvaluateScript 29.3 ms, ProxyMain::BeginMainFrame 18.2 ms, Layout 14.1 ms | (program) (14.5 ms sampled), (anonymous) (7.7 ms sampled), Hn (0.6 ms sampled) |
| 1024.7 | 33.3 | ProxyMain::BeginMainFrame 22.6 ms, EventDispatch 18.4 ms, FunctionCall 17.4 ms | (program) (15.5 ms sampled), resizeToHost (4.9 ms sampled), pe (2.6 ms sampled) |
| 1441.3 | 33.3 | TimerFire 17.8 ms, TimerFire 1.5 ms, GLES2Implementation::GetProgramiv 1.3 ms | (idle) (12.7 ms sampled), C (7.0 ms sampled), xe (1.1 ms sampled) |
| 2458.0 | 33.4 | TimerFire 34.3 ms, GLES2Implementation::GetProgramiv 6.4 ms, ImplementationBase::WaitForCmd 6.4 ms | C (15.7 ms sampled), xe (10.1 ms sampled), render (1.0 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
