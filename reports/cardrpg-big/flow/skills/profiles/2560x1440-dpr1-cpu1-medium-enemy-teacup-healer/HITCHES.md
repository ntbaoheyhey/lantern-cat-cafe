# Cold-page hitch attribution
REFERENCE: 2560x1440-dpr1-cpu1-medium-enemy-teacup-healer-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 94.1 | 33.3 | ParseHTML 2.3 ms | (program) (33.3 ms sampled) |
| 727.3 | 33.3 | EvaluateScript 31.8 ms, ProxyMain::BeginMainFrame 15.4 ms, Layout 12.7 ms | (program) (12.9 ms sampled), (anonymous) (5.2 ms sampled), (anonymous) (2.7 ms sampled) |
| 2910.7 | 33.4 | TimerFire 37.9 ms, GLES2Implementation::GetProgramiv 7.1 ms, ImplementationBase::WaitForCmd 7.1 ms | (idle) (11.6 ms sampled), C (8.9 ms sampled), (program) (3.2 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
