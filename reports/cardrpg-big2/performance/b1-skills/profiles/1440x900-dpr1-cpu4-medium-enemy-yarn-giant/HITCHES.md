# Cold-page hitch attribution
REFERENCE: 1440x900-dpr1-cpu4-medium-enemy-yarn-giant-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 319.2 | 99.9 | ParseHTML 8.7 ms | (program) (100.5 ms sampled) |
| 1135.9 | 33.4 | TimerFire 19.6 ms, ProxyMain::BeginMainFrame 2.2 ms, PrePaint 0.9 ms | (idle) (16.3 ms sampled), fetch (16.0 ms sampled), (program) (0.3 ms sampled) |
| 1185.9 | 33.3 | DecompressionStream Inflate 17.6 ms, ProxyMain::BeginMainFrame 0.1 ms, FireAnimationFrame 0.0 ms | (program) (21.0 ms sampled), (idle) (12.3 ms sampled) |
| 1519.2 | 100.0 | TimerFire 117.9 ms, EvaluateScript 112.9 ms, v8.compile 75.7 ms | (anonymous) (72.4 ms sampled), (anonymous) (8.7 ms sampled), (anonymous) (1.8 ms sampled) |
| 1619.3 | 100.1 | TimerFire 117.9 ms, EvaluateScript 112.9 ms, ProxyMain::BeginMainFrame 50.5 ms | (program) (48.7 ms sampled), (anonymous) (19.7 ms sampled), hl (1.9 ms sampled) |
| 1852.5 | 49.9 | TimerFire 49.3 ms, FunctionCall 48.2 ms, GpuChannelHost::CreateViewCommandBuffer 1.9 ms | pe (9.3 ms sampled), Ey (6.0 ms sampled), n (4.3 ms sampled) |
| 1952.5 | 33.3 | ProxyMain::BeginMainFrame 29.0 ms, EventDispatch 20.5 ms, FunctionCall 19.0 ms | (program) (19.0 ms sampled), (anonymous) (11.1 ms sampled), removeChild (1.2 ms sampled) |
| 2552.5 | 33.3 | EventDispatch 38.0 ms, FunctionCall 37.6 ms, Layout 5.7 ms | resizeToHost (8.2 ms sampled), n (5.1 ms sampled), pe (4.5 ms sampled) |
| 2685.8 | 49.9 | TimerFire 72.2 ms, MajorGC 3.6 ms, V8.GCFinalizeMC 3.6 ms | (garbage collector) (6.5 ms sampled), clone (4.9 ms sampled), Ex (3.9 ms sampled) |
| 5802.4 | 50.0 | TimerFire 65.0 ms, MinorGC 1.0 ms, V8.GCScavenger 0.9 ms | yh (4.3 ms sampled), Ph (2.9 ms sampled), $e (2.9 ms sampled) |
| 5952.3 | 33.3 | TimerFire 19.8 ms, TimerFire 16.2 ms, ProxyMain::BeginMainFrame 1.2 ms | $e (5.3 ms sampled), g (2.8 ms sampled), $e (2.6 ms sampled) |
| 6085.7 | 33.3 | TimerFire 21.0 ms, TimerFire 16.7 ms, MinorGC 1.3 ms | g (2.9 ms sampled), g (2.6 ms sampled), $e (2.4 ms sampled) |
| 6202.4 | 33.4 | TimerFire 22.1 ms, TimerFire 17.2 ms, MinorGC 1.2 ms | g (4.4 ms sampled), g (3.7 ms sampled), v (2.5 ms sampled) |
| 6902.4 | 50.1 | TimerFire 48.7 ms, TimerFire 16.3 ms, CommandBufferHelper::Flush 0.7 ms | yh (4.7 ms sampled), Ph (4.2 ms sampled), g (3.8 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
