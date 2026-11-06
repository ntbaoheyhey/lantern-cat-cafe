# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu1-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 540.0 | 33.4 | EvaluateScript 28.3 ms, ProxyMain::BeginMainFrame 16.3 ms, FunctionCall 13.2 ms | (program) (15.0 ms sampled), (anonymous) (7.9 ms sampled), Vn (0.6 ms sampled) |
| 923.3 | 33.4 | EvaluateScript 0.2 ms, ProxyMain::BeginMainFrame 0.0 ms | (idle) (27.7 ms sampled), (program) (1.5 ms sampled), closestCrossShadow (1.1 ms sampled) |
| 1140.0 | 100.1 | EventDispatch 97.0 ms, FunctionCall 95.2 ms, ProxyMain::BeginMainFrame 25.0 ms | Mg (19.5 ms sampled), me (11.8 ms sampled), (program) (9.5 ms sampled) |
| 1389.9 | 33.4 | TimerFire 49.9 ms, GLES2Implementation::GetProgramiv 7.4 ms, ImplementationBase::WaitForCmd 7.4 ms | C (14.8 ms sampled), Se (1.5 ms sampled), ph (1.2 ms sampled) |
| 1523.2 | 116.6 | TimerFire 114.1 ms, GLES2Implementation::GetProgramiv 12.1 ms, ImplementationBase::WaitForCmd 12.1 ms | C (15.5 ms sampled), C (14.2 ms sampled), Se (10.8 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
