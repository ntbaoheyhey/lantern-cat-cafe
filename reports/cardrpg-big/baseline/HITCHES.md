# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu1-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 416.7 | 366.7 | ParseHTML 358.1 ms, EvaluateScript 355.4 ms, MinorGC 4.6 ms | (anonymous) (295.5 ms sampled), (program) (35.2 ms sampled), (garbage collector) (17.9 ms sampled) |
| 483.3 | 49.9 | DecompressionStream Inflate 13.9 ms, DecompressionStream Inflate 12.6 ms, DecompressionStream Inflate 12.1 ms | (program) (49.7 ms sampled), (garbage collector) (0.1 ms sampled) |
| 650.0 | 150.0 | EvaluateScript 114.8 ms, v8.compile 106.2 ms, MajorGC 1.5 ms | (anonymous) (144.7 ms sampled), (program) (2.2 ms sampled), (garbage collector) (1.6 ms sampled) |
| 683.3 | 33.3 | EvaluateScript 114.8 ms, ProxyMain::BeginMainFrame 14.9 ms, FunctionCall 14.2 ms | (program) (10.6 ms sampled), (anonymous) (8.9 ms sampled), (anonymous) (0.9 ms sampled) |
| 1033.3 | 66.7 | EventDispatch 78.6 ms, FunctionCall 76.2 ms, Layout 7.3 ms | Cg (19.1 ms sampled), resizeToHost (8.6 ms sampled), Zh.setSize (3.6 ms sampled) |
| 1633.3 | 33.4 | TimerFire 42.1 ms, GLES2Implementation::GetProgramiv 7.4 ms, ImplementationBase::WaitForCmd 7.4 ms | C (16.0 ms sampled), n (1.0 ms sampled), n (1.0 ms sampled) |
| 1733.3 | 83.4 | TimerFire 90.5 ms, GLES2Implementation::GetProgramiv 15.8 ms, ImplementationBase::WaitForCmd 15.8 ms | C (19.0 ms sampled), C (6.0 ms sampled), g (3.7 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
