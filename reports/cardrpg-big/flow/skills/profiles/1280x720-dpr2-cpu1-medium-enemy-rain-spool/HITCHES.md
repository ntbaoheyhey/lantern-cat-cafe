# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu1-medium-enemy-rain-spool-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 99.1 | 33.2 | ParseHTML 2.2 ms | (program) (33.2 ms sampled) |
| 2815.8 | 33.4 | TimerFire 39.5 ms, Decode Image 6.9 ms, GLES2Implementation::GetProgramiv 6.7 ms | C (11.3 ms sampled), Ce (9.8 ms sampled), P (2.8 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
