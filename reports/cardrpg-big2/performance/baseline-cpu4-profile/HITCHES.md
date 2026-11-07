# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu4-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 55.2 | 33.3 | ProxyMain::BeginMainFrame 16.9 ms, Layout 14.3 ms, ParseHTML 11.3 ms | (program) (34.0 ms sampled) |
| 321.9 | 100.0 | ParseHTML 8.8 ms | (program) (100.1 ms sampled) |
| 1188.6 | 33.4 | ProxyMain::BeginMainFrame 2.2 ms, Layout 1.0 ms, Commit 0.9 ms | (idle) (19.8 ms sampled), (program) (13.6 ms sampled), unpack (0.1 ms sampled) |
| 1538.5 | 116.7 | EvaluateScript 110.5 ms, v8.compile 74.5 ms, MinorGC 1.6 ms | (anonymous) (88.1 ms sampled), (anonymous) (8.9 ms sampled), (garbage collector) (2.2 ms sampled) |
| 1638.5 | 100.0 | EvaluateScript 110.5 ms, ProxyMain::BeginMainFrame 56.7 ms, Layout 46.3 ms | (program) (46.6 ms sampled), (anonymous) (20.7 ms sampled), Yo (1.7 ms sampled) |
| 1871.8 | 33.4 | TimerFire 46.3 ms, FunctionCall 46.2 ms, GLES2::GetString 0.8 ms | pe (5.9 ms sampled), n (4.1 ms sampled), e (3.0 ms sampled) |
| 1905.2 | 33.4 | TimerFire 46.3 ms, FunctionCall 46.2 ms, TimerFire 12.6 ms | (program) (7.3 ms sampled), Dg.setSize (4.4 ms sampled), (garbage collector) (3.3 ms sampled) |
| 2105.1 | 83.3 | EventDispatch 60.0 ms, FunctionCall 56.2 ms, ProxyMain::BeginMainFrame 30.7 ms | (program) (24.7 ms sampled), resizeToHost (18.7 ms sampled), pe (8.1 ms sampled) |
| 2405.1 | 50.0 | TimerFire 60.8 ms, MinorGC 1.2 ms, V8.GCScavenger 1.2 ms | clone (3.8 ms sampled), makeStage (2.9 ms sampled), e (2.7 ms sampled) |
| 3021.8 | 33.4 | TimerFire 43.4 ms, V8.DeoptimizeCode 0.4 ms, V8.DeoptimizeCode 0.0 ms | kg (2.0 ms sampled), p (1.9 ms sampled), e (1.7 ms sampled) |
| 3088.5 | 50.0 | TimerFire 68.1 ms, CommandBufferHelper::Flush 0.0 ms, CommandBufferProxyImpl::Flush 0.0 ms | yh (4.1 ms sampled), Ph (3.7 ms sampled), Bc (3.0 ms sampled) |
| 3138.4 | 33.3 | TimerFire 45.0 ms, GLES2Implementation::GetProgramiv 1.0 ms, ImplementationBase::WaitForCmd 1.0 ms | C (7.8 ms sampled), s (1.8 ms sampled), tt (1.4 ms sampled) |
| 3371.7 | 33.3 | TimerFire 51.0 ms, MinorGC 1.5 ms, V8.GCScavenger 1.5 ms | yh (4.7 ms sampled), Ph (3.2 ms sampled), Bc (2.5 ms sampled) |
| 4538.4 | 83.4 | TimerFire 84.6 ms, Decode Image 26.0 ms, ProxyMain::BeginMainFrame 13.7 ms | xe (41.1 ms sampled), C (13.2 ms sampled), render (3.4 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
