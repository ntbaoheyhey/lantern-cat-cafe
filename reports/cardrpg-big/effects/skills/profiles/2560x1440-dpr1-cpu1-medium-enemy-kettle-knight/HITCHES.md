# Cold-page hitch attribution
REFERENCE: 2560x1440-dpr1-cpu1-medium-enemy-kettle-knight-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 2549.2 | 33.4 | TimerFire 32.5 ms, GLES2Implementation::GetProgramiv 6.4 ms, ImplementationBase::WaitForCmd 6.4 ms | C (14.0 ms sampled), Ce (10.1 ms sampled), render (1.3 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
