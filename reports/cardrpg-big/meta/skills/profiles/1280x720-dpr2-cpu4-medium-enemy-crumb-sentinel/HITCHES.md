# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu4-medium-enemy-crumb-sentinel-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 354.2 | 133.4 | ParseHTML 8.5 ms | (program) (133.5 ms sampled) |
| 1220.7 | 33.3 | ProxyMain::BeginMainFrame 2.0 ms, Commit 0.6 ms, FireAnimationFrame 0.3 ms | (idle) (20.8 ms sampled), (program) (12.8 ms sampled), unpack (0.2 ms sampled) |
| 1254.0 | 33.3 | DecompressionStream Inflate 18.2 ms, ProxyMain::BeginMainFrame 0.3 ms, FireAnimationFrame 0.2 ms | (program) (23.7 ms sampled), (idle) (9.1 ms sampled), evaluate (0.2 ms sampled) |
| 1587.3 | 133.2 | EvaluateScript 113.4 ms, v8.compile 76.7 ms, MinorGC 1.8 ms | (anonymous) (90.6 ms sampled), (anonymous) (9.9 ms sampled), (program) (5.4 ms sampled) |
| 1687.4 | 100.1 | EvaluateScript 113.4 ms, ProxyMain::BeginMainFrame 56.0 ms, Layout 45.2 ms | (program) (58.8 ms sampled), (anonymous) (20.4 ms sampled), hl (1.9 ms sampled) |
| 1920.7 | 50.0 | TimerFire 51.9 ms, FunctionCall 51.4 ms, GpuChannelHost::CreateViewCommandBuffer 1.9 ms | pe (9.6 ms sampled), xy (5.3 ms sampled), e (4.2 ms sampled) |
| 2104.0 | 33.3 | ProxyMain::BeginMainFrame 28.7 ms, EventDispatch 19.7 ms, FunctionCall 18.0 ms | (program) (13.9 ms sampled), (anonymous) (11.1 ms sampled), vK (1.0 ms sampled) |
| 2704.0 | 33.4 | EventDispatch 46.6 ms, FunctionCall 45.4 ms, Layout 5.6 ms | resizeToHost (8.6 ms sampled), n (4.9 ms sampled), pe (4.0 ms sampled) |
| 3004.0 | 50.0 | TimerFire 59.6 ms, MinorGC 1.2 ms, V8.GCScavenger 1.0 ms | e (5.0 ms sampled), e (3.0 ms sampled), (garbage collector) (2.3 ms sampled) |
| 3637.3 | 33.3 | TimerFire 67.1 ms, TimerFire 41.7 ms, ProxyMain::BeginMainFrame 1.5 ms | (program) (4.0 ms sampled), zg (2.0 ms sampled), computeBoundingSphere (1.6 ms sampled) |
| 3687.3 | 50.0 | TimerFire 67.1 ms, MinorGC 1.3 ms, V8.GCScavenger 1.3 ms | g (5.4 ms sampled), yh (4.6 ms sampled), Ph (3.9 ms sampled) |
| 3737.3 | 33.4 | TimerFire 47.1 ms, GLES2Implementation::GetProgramiv 1.8 ms, ImplementationBase::WaitForCmd 1.8 ms | C (5.8 ms sampled), Dg.renderBufferDirect (2.8 ms sampled), Dg.render (1.9 ms sampled) |
| 3987.3 | 50.0 | TimerFire 52.4 ms, GLES2Implementation::GetIntegerv 0.8 ms, CommandBufferHelper::Flush 0.5 ms | yh (5.1 ms sampled), Ph (2.9 ms sampled), b (2.5 ms sampled) |
| 5137.3 | 83.4 | TimerFire 85.3 ms, Decode Image 26.1 ms, ProxyMain::BeginMainFrame 12.5 ms | xe (41.7 ms sampled), C (11.6 ms sampled), render (6.0 ms sampled) |
| 5170.6 | 33.3 | ProxyMain::BeginMainFrame 17.5 ms, FireAnimationFrame 12.8 ms, ProxyMain::BeginMainFrame 12.5 ms | (program) (7.9 ms sampled), g (2.4 ms sampled), render (1.6 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
