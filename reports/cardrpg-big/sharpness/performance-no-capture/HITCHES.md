# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu1-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 1079.4 | 83.3 | EventDispatch 76.6 ms, FunctionCall 75.1 ms, ProxyMain::BeginMainFrame 22.3 ms | (program) (18.8 ms sampled), Mg (17.9 ms sampled), resizeToHost (4.9 ms sampled) |
| 1296.1 | 33.4 | TimerFire 45.3 ms, GLES2Implementation::GetProgramiv 7.7 ms, ImplementationBase::WaitForCmd 7.7 ms | C (14.4 ms sampled), n (1.1 ms sampled), (garbage collector) (1.0 ms sampled) |
| 1412.7 | 99.9 | TimerFire 101.5 ms, GLES2Implementation::GetProgramiv 9.6 ms, ImplementationBase::WaitForCmd 9.6 ms | C (13.8 ms sampled), C (11.3 ms sampled), Se (9.7 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
