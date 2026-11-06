# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu1-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 595.1 | 33.3 | EvaluateScript 29.8 ms, v8.compile 18.9 ms, ProxyMain::BeginMainFrame 16.3 ms | (anonymous) (7.6 ms sampled), (anonymous) (5.0 ms sampled), (program) (4.5 ms sampled) |
| 1011.8 | 49.9 | EventDispatch 38.8 ms, FunctionCall 37.1 ms, ProxyMain::BeginMainFrame 21.5 ms | (program) (16.8 ms sampled), he (11.4 ms sampled), resizeToHost (5.3 ms sampled) |
| 2478.4 | 33.3 | TimerFire 35.4 ms, GLES2Implementation::GetProgramiv 7.0 ms, ImplementationBase::WaitForCmd 7.0 ms | C (16.1 ms sampled), Ce (10.7 ms sampled), rt (0.5 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
