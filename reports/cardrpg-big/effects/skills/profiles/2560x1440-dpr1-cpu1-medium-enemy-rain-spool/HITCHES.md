# Cold-page hitch attribution
REFERENCE: 2560x1440-dpr1-cpu1-medium-enemy-rain-spool-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 576.6 | 33.4 | EvaluateScript 28.0 ms, v8.compile 18.6 ms, ProxyMain::BeginMainFrame 14.0 ms | (program) (13.2 ms sampled), (anonymous) (5.0 ms sampled), (anonymous) (2.3 ms sampled) |
| 2576.4 | 33.3 | TimerFire 33.2 ms, GLES2Implementation::GetProgramiv 6.4 ms, ImplementationBase::WaitForCmd 6.4 ms | (idle) (12.6 ms sampled), C (10.2 ms sampled), (program) (2.2 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
