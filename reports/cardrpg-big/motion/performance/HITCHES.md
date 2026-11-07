# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu1-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 599.0 | 33.4 | EvaluateScript 28.5 ms, ProxyMain::BeginMainFrame 14.4 ms, Layout 11.8 ms | (program) (14.4 ms sampled), (anonymous) (5.0 ms sampled), (anonymous) (2.1 ms sampled) |
| 1048.9 | 100.0 | EventDispatch 92.3 ms, FunctionCall 90.6 ms, ProxyMain::BeginMainFrame 32.2 ms | (program) (20.6 ms sampled), Mg (19.2 ms sampled), resizeToHost (5.2 ms sampled) |
| 1082.3 | 33.4 | ProxyMain::BeginMainFrame 32.2 ms, EventDispatch 11.4 ms, GLES2::GetString 10.8 ms | (program) (18.2 ms sampled), n (10.9 ms sampled), load (0.8 ms sampled) |
| 1382.3 | 33.3 | TimerFire 51.6 ms, GLES2Implementation::GetProgramiv 7.8 ms, ImplementationBase::WaitForCmd 7.8 ms | C (15.1 ms sampled), renderBufferDirect (0.8 ms sampled), xe (0.8 ms sampled) |
| 1515.6 | 100.0 | TimerFire 121.9 ms, GLES2Implementation::GetProgramiv 10.0 ms, ImplementationBase::WaitForCmd 10.0 ms | C (12.2 ms sampled), C (11.8 ms sampled), xe (11.4 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
