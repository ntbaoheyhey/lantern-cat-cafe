# Cold-page hitch attribution
REFERENCE: 1440x900-dpr1-cpu4-medium-enemy-pollen-scout-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 90.3 | 33.3 | ProxyMain::BeginMainFrame 20.2 ms, Layout 15.9 ms, ParseHTML 11.6 ms | (program) (33.4 ms sampled) |
| 407.0 | 150.1 |  | (program) (149.6 ms sampled) |
| 1373.6 | 33.3 | TimerFire 24.7 ms | fetch (20.5 ms sampled), (idle) (12.0 ms sampled), unpack (0.8 ms sampled) |
| 1406.9 | 33.3 | ProxyMain::BeginMainFrame 1.6 ms, Commit 0.6 ms, LayerTreeHost::DoUpdateLayers 0.6 ms | (idle) (19.0 ms sampled), (program) (14.0 ms sampled), requestAnimationFrame (0.0 ms sampled) |
| 1440.3 | 33.4 | DecompressionStream Inflate 19.2 ms, ProxyMain::BeginMainFrame 0.7 ms, FireAnimationFrame 0.6 ms | (program) (21.9 ms sampled), (idle) (10.3 ms sampled), requestAnimationFrame (0.6 ms sampled) |
| 1840.3 | 133.4 | EvaluateScript 130.0 ms, v8.compile 89.8 ms, MinorGC 1.6 ms | (anonymous) (106.3 ms sampled), (anonymous) (10.2 ms sampled), (anonymous) (2.3 ms sampled) |
| 1956.9 | 116.6 | EvaluateScript 130.0 ms, ProxyMain::BeginMainFrame 61.4 ms, Layout 49.1 ms | (program) (62.9 ms sampled), (anonymous) (21.8 ms sampled), ml (1.5 ms sampled) |
| 2473.6 | 50.1 | ProxyMain::BeginMainFrame 32.2 ms, EventDispatch 25.1 ms, FunctionCall 21.2 ms | (program) (28.9 ms sampled), (anonymous) (13.7 ms sampled), removeChild (1.3 ms sampled) |
| 3090.2 | 66.6 | EventDispatch 75.4 ms, FunctionCall 74.5 ms, Layout 6.6 ms | he (11.1 ms sampled), resizeToHost (9.2 ms sampled), e (4.8 ms sampled) |
| 3423.5 | 50.0 | TimerFire 68.6 ms, MinorGC 1.2 ms, V8.GCScavenger 1.2 ms | clone (3.8 ms sampled), dx (3.5 ms sampled), makeStage (3.2 ms sampled) |
| 4123.5 | 33.4 | TimerFire 49.0 ms, V8.DeoptimizeCode 0.0 ms, V8.DeoptimizeCode 0.0 ms | kg (2.7 ms sampled), t (2.4 ms sampled), e (2.3 ms sampled) |
| 4206.8 | 66.7 | TimerFire 77.9 ms, CommandBufferHelper::Flush 0.0 ms, CommandBufferHelper::Flush 0.0 ms | uh (5.7 ms sampled), Th (4.2 ms sampled), et (3.1 ms sampled) |
| 4273.5 | 33.4 | TimerFire 51.8 ms, GLES2Implementation::GetProgramiv 0.8 ms, ImplementationBase::WaitForCmd 0.8 ms | C (10.5 ms sampled), renderBufferDirect (3.5 ms sampled), rt (1.7 ms sampled) |
| 4556.8 | 50.0 | TimerFire 79.6 ms, MinorGC 4.1 ms, V8.GCScavenger 4.1 ms | (garbage collector) (4.4 ms sampled), g (3.7 ms sampled), uh (3.5 ms sampled) |
| 5790.1 | 100.0 | TimerFire 94.0 ms, Decode Image 29.1 ms, ProxyMain::BeginMainFrame 14.1 ms | Ce (47.8 ms sampled), C (7.9 ms sampled), render (4.9 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
