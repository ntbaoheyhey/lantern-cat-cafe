# Cold-page hitch attribution
REFERENCE: 1440x900-dpr1-cpu1-medium-enemy-teacup-healer-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 1082.4 | 50.0 | EventDispatch 70.8 ms, FunctionCall 70.5 ms, MinorGC 0.7 ms | Mg (17.7 ms sampled), makeStage (2.2 ms sampled), e (2.1 ms sampled) |
| 1382.4 | 33.4 | TimerFire 44.9 ms, GLES2Implementation::GetProgramiv 8.2 ms, ImplementationBase::WaitForCmd 8.2 ms | C (15.8 ms sampled), Qm (0.9 ms sampled), xe (0.9 ms sampled) |
| 1499.1 | 83.4 | TimerFire 102.4 ms, GLES2Implementation::GetProgramiv 9.8 ms, ImplementationBase::WaitForCmd 9.8 ms | C (11.3 ms sampled), C (10.8 ms sampled), xe (10.0 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
