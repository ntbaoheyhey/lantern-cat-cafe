# Cold-page hitch attribution
REFERENCE: 1440x900-dpr2-cpu1-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 1410.4 | 83.4 | EventDispatch 82.7 ms, FunctionCall 81.1 ms, ProxyMain::BeginMainFrame 23.6 ms | Mg (18.0 ms sampled), (program) (13.4 ms sampled), resizeToHost (5.9 ms sampled) |
| 1643.7 | 33.3 | TimerFire 49.1 ms, GLES2Implementation::GetProgramiv 7.7 ms, ImplementationBase::WaitForCmd 7.7 ms | C (16.7 ms sampled), Se (1.4 ms sampled), n (1.2 ms sampled) |
| 1777.1 | 100.0 | TimerFire 108.4 ms, GLES2Implementation::GetProgramiv 9.1 ms, ImplementationBase::WaitForCmd 9.1 ms | C (14.8 ms sampled), C (11.1 ms sampled), Se (10.6 ms sampled) |
| 2343.7 | 466.6 | TimerFire 2.7 ms, FunctionCall 2.0 ms, ProxyMain::BeginMainFrame 1.2 ms | (idle) (461.9 ms sampled), (program) (1.1 ms sampled), Pn (0.3 ms sampled) |
| 4110.3 | 466.6 | TimerFire 1.1 ms, ProxyMain::BeginMainFrame 0.8 ms, FireAnimationFrame 0.7 ms | (idle) (464.0 ms sampled), (program) (1.1 ms sampled), g (0.1 ms sampled) |
| 5876.9 | 466.6 | TimerFire 1.1 ms, ProxyMain::BeginMainFrame 1.0 ms, FireAnimationFrame 0.8 ms | (idle) (464.3 ms sampled), (program) (1.0 ms sampled), cn (0.1 ms sampled) |
| 7660.2 | 483.4 | TimerFire 1.0 ms, ProxyMain::BeginMainFrame 0.9 ms, FireAnimationFrame 0.8 ms | (idle) (481.0 ms sampled), (program) (1.3 ms sampled), act (0.1 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
