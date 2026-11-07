# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu4-medium-enemy-kettle-knight-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 60.4 | 33.4 | ProxyMain::BeginMainFrame 16.5 ms, Layout 14.1 ms, ParseHTML 10.3 ms | (program) (33.5 ms sampled), (garbage collector) (0.0 ms sampled) |
| 310.3 | 99.9 | ParseHTML 9.0 ms | (program) (99.9 ms sampled) |
| 1177.0 | 33.3 | ProxyMain::BeginMainFrame 1.2 ms, Layout 0.1 ms, Commit 0.0 ms | (idle) (21.0 ms sampled), (program) (11.4 ms sampled), unpack (1.1 ms sampled) |
| 1210.3 | 33.3 | DecompressionStream Inflate 17.5 ms, ProxyMain::BeginMainFrame 0.1 ms, FireAnimationFrame 0.0 ms | (program) (21.0 ms sampled), (idle) (11.7 ms sampled), getImplicitAriaRole (0.1 ms sampled) |
| 1543.7 | 116.7 | EvaluateScript 112.1 ms, v8.compile 75.4 ms, MinorGC 2.3 ms | (anonymous) (85.6 ms sampled), (anonymous) (7.5 ms sampled), (garbage collector) (2.4 ms sampled) |
| 1643.6 | 99.9 | EvaluateScript 112.1 ms, ProxyMain::BeginMainFrame 54.8 ms, Layout 44.9 ms | (program) (53.9 ms sampled), (anonymous) (20.0 ms sampled), hl (1.9 ms sampled) |
| 1877.0 | 33.4 | TimerFire 52.6 ms, FunctionCall 51.8 ms, GLES2Implementation::GetRequestableExtensionsCHROMIUM() 0.8 ms | xy (5.4 ms sampled), e (4.7 ms sampled), n (2.9 ms sampled) |
| 1910.3 | 33.3 | TimerFire 52.6 ms, FunctionCall 51.8 ms, TimerFire 12.0 ms | (program) (6.8 ms sampled), Dg.setSize (3.7 ms sampled), (garbage collector) (2.7 ms sampled) |
| 1976.9 | 49.9 | ProxyMain::BeginMainFrame 53.9 ms, EventDispatch 20.6 ms, FunctionCall 18.4 ms | (program) (26.9 ms sampled), (anonymous) (11.1 ms sampled), e_ (1.2 ms sampled) |
| 2593.6 | 33.3 | EventDispatch 43.8 ms, FunctionCall 43.4 ms, Layout 5.5 ms | resizeToHost (8.4 ms sampled), n (4.6 ms sampled), Dg.setSize (3.8 ms sampled) |
| 2893.6 | 50.0 | TimerFire 61.3 ms, MinorGC 1.0 ms, V8.GCScavenger 1.0 ms | e (4.7 ms sampled), xx (3.1 ms sampled), (garbage collector) (2.7 ms sampled) |
| 3526.9 | 33.3 | TimerFire 41.4 ms, V8.DeoptimizeCode 0.0 ms, V8.DeoptimizeCode 0.0 ms | e (3.0 ms sampled), d (2.6 ms sampled), angleTo (1.8 ms sampled) |
| 3593.5 | 50.0 | TimerFire 67.2 ms, CommandBufferHelper::Flush 0.6 ms, CommandBufferProxyImpl::Flush 0.6 ms | yh (4.5 ms sampled), Qe (3.3 ms sampled), Ph (3.0 ms sampled) |
| 3660.3 | 33.4 | TimerFire 44.5 ms, GLES2Implementation::GetProgramiv 1.1 ms, ImplementationBase::WaitForCmd 1.1 ms | C (11.6 ms sampled), n (2.3 ms sampled), ce (2.0 ms sampled) |
| 3893.5 | 33.3 | TimerFire 51.9 ms, CommandBufferHelper::Flush 0.0 ms, CommandBufferProxyImpl::Flush 0.0 ms | g (3.8 ms sampled), yh (2.9 ms sampled), Ph (2.4 ms sampled) |
| 5026.9 | 66.7 | TimerFire 84.6 ms, Decode Image 26.3 ms, Decode Image 6.4 ms | xe (40.6 ms sampled), C (11.3 ms sampled), Qe (2.9 ms sampled) |
| 5060.2 | 33.3 | TimerFire 84.6 ms, ProxyMain::BeginMainFrame 16.6 ms, FireAnimationFrame 13.1 ms | (program) (8.7 ms sampled), render (3.2 ms sampled), Xx (2.0 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
