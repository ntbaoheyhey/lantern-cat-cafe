# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu4-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 73.4 | 33.3 | ProxyMain::BeginMainFrame 19.0 ms, Layout 15.2 ms, ParseHTML 11.6 ms | (program) (33.3 ms sampled), (idle) (0.2 ms sampled) |
| 1306.7 | 33.3 | ProxyMain::BeginMainFrame 1.4 ms, Layout 0.8 ms, FireAnimationFrame 0.0 ms | (idle) (23.4 ms sampled), (program) (10.2 ms sampled), unpack (0.1 ms sampled) |
| 1823.4 | 33.4 | EvaluateScript 56.6 ms, V8.DeoptimizeCode 0.0 ms, v8.newInstance 0.0 ms | (anonymous) (13.8 ms sampled), (anonymous) (2.1 ms sampled), Ul (1.4 ms sampled) |
| 1940.0 | 116.6 | ProxyMain::BeginMainFrame 65.2 ms, EvaluateScript 56.6 ms, Layout 53.6 ms | (program) (52.3 ms sampled), (anonymous) (22.6 ms sampled), Qo (3.1 ms sampled) |
| 2223.3 | 83.3 | TimerFire 80.2 ms, FunctionCall 79.5 ms, ProxyMain::BeginMainFrame 4.2 ms | he (9.6 ms sampled), Xb (5.2 ms sampled), n (4.8 ms sampled) |
| 2290.0 | 50.0 | EventDispatch 42.3 ms, Decode Image 33.8 ms, TimerFire 5.2 ms | Ce (35.8 ms sampled), (program) (4.4 ms sampled), le (0.9 ms sampled) |
| 2356.7 | 50.0 | EventDispatch 42.3 ms, Decode Image 36.6 ms, TimerFire 3.0 ms | Ce (41.6 ms sampled), (program) (1.2 ms sampled), (anonymous) (0.8 ms sampled) |
| 2473.3 | 83.3 | TimerFire 84.7 ms, TimerFire 1.9 ms, MinorGC 1.2 ms | e (7.9 ms sampled), (garbage collector) (4.3 ms sampled), $S (4.1 ms sampled) |
| 2623.3 | 116.7 | ProxyMain::BeginMainFrame 110.3 ms, EventDispatch 69.8 ms, FunctionCall 65.7 ms | (program) (34.3 ms sampled), resizeToHost (19.7 ms sampled), he (10.4 ms sampled) |
| 2690.0 | 50.1 | EventDispatch 41.0 ms, Decode Image 34.6 ms, TimerFire 4.9 ms | Ce (25.3 ms sampled), (program) (10.6 ms sampled), (garbage collector) (2.7 ms sampled) |
| 2773.3 | 66.6 | EventDispatch 39.8 ms, Decode Image 34.0 ms, EvaluateScript 13.7 ms | Ce (39.3 ms sampled), (program) (17.4 ms sampled), (garbage collector) (3.6 ms sampled) |
| 2823.3 | 33.4 | EventDispatch 19.0 ms, ImplementationBase::WaitForCmd 18.0 ms, CommandBufferHelper::Finish 18.0 ms | forceContextLoss (19.7 ms sampled), Ce (3.6 ms sampled), releaseResources (1.0 ms sampled) |
| 2889.9 | 66.6 | TimerFire 51.6 ms, EventDispatch 19.0 ms, Decode Image 13.4 ms | Ce (14.5 ms sampled), (garbage collector) (4.5 ms sampled), clone (3.6 ms sampled) |
| 4273.2 | 66.6 | TimerFire 68.2 ms, Decode Image 62.6 ms, TimerFire 44.5 ms | Ce (64.4 ms sampled), (program) (0.9 ms sampled), x (0.5 ms sampled) |
| 6156.5 | 50.0 | TimerFire 79.9 ms, MinorGC 1.7 ms, V8.GCScavenger 1.6 ms | xg (5.5 ms sampled), Ig (4.4 ms sampled), g (3.4 ms sampled) |
| 6256.5 | 33.3 | TimerFire 28.7 ms, TimerFire 22.2 ms, ProxyMain::BeginMainFrame 2.1 ms | g (3.1 ms sampled), g (3.1 ms sampled), et (2.2 ms sampled) |
| 6323.2 | 33.3 | TimerFire 24.4 ms, TimerFire 21.4 ms, ProxyMain::BeginMainFrame 1.6 ms | et (3.5 ms sampled), g (2.6 ms sampled), g (2.4 ms sampled) |
| 6373.1 | 33.3 | TimerFire 21.6 ms, TimerFire 21.1 ms, ProxyMain::BeginMainFrame 1.5 ms | g (5.8 ms sampled), g (3.8 ms sampled), et (3.6 ms sampled) |
| 6439.8 | 33.3 | TimerFire 27.8 ms, TimerFire 21.2 ms, MinorGC 1.5 ms | g (3.2 ms sampled), g (3.1 ms sampled), et (2.9 ms sampled) |
| 6473.2 | 33.4 | TimerFire 27.8 ms, TimerFire 22.3 ms, ProxyMain::BeginMainFrame 2.0 ms | g (2.6 ms sampled), C (2.4 ms sampled), g (2.4 ms sampled) |
| 6556.5 | 33.4 | TimerFire 21.9 ms, TimerFire 18.1 ms, ProxyMain::BeginMainFrame 2.5 ms | g (6.5 ms sampled), g (5.4 ms sampled), g (3.6 ms sampled) |
| 6606.5 | 33.4 | TimerFire 24.5 ms, TimerFire 23.4 ms, ProxyMain::BeginMainFrame 1.6 ms | g (6.0 ms sampled), g (5.8 ms sampled), g (3.3 ms sampled) |
| 6656.4 | 33.2 | TimerFire 24.7 ms, TimerFire 23.3 ms, ProxyMain::BeginMainFrame 2.1 ms | g (5.7 ms sampled), g (4.6 ms sampled), et (2.5 ms sampled) |
| 6723.1 | 33.3 | TimerFire 24.9 ms, TimerFire 18.6 ms, ProxyMain::BeginMainFrame 1.5 ms | g (7.6 ms sampled), g (3.4 ms sampled), g (3.1 ms sampled) |
| 6773.2 | 33.4 | TimerFire 20.9 ms, TimerFire 20.6 ms, ProxyMain::BeginMainFrame 1.8 ms | g (6.2 ms sampled), g (4.1 ms sampled), g (3.9 ms sampled) |
| 6839.8 | 33.3 | TimerFire 20.3 ms, TimerFire 18.5 ms, ProxyMain::BeginMainFrame 1.5 ms | g (7.5 ms sampled), g (4.0 ms sampled), et (3.6 ms sampled) |
| 6906.4 | 33.2 | TimerFire 19.8 ms, TimerFire 19.3 ms, ProxyMain::BeginMainFrame 1.7 ms | et (4.8 ms sampled), g (3.9 ms sampled), et (3.4 ms sampled) |
| 7006.4 | 33.3 | TimerFire 18.5 ms, TimerFire 17.7 ms, ProxyMain::BeginMainFrame 1.5 ms | g (4.8 ms sampled), g (3.9 ms sampled), et (3.1 ms sampled) |
| 7089.8 | 33.4 | TimerFire 19.2 ms, TimerFire 19.0 ms, ProxyMain::BeginMainFrame 2.0 ms | g (5.0 ms sampled), et (4.2 ms sampled), g (2.4 ms sampled) |
| 7173.1 | 33.3 | TimerFire 19.0 ms, TimerFire 18.5 ms, ProxyMain::BeginMainFrame 1.7 ms | g (5.3 ms sampled), g (4.4 ms sampled), g (3.8 ms sampled) |
| 7273.1 | 33.3 | TimerFire 20.5 ms, TimerFire 18.6 ms, ProxyMain::BeginMainFrame 1.8 ms | g (4.5 ms sampled), g (4.1 ms sampled), g (3.8 ms sampled) |
| 7356.4 | 33.3 | TimerFire 18.7 ms, TimerFire 18.2 ms, ProxyMain::BeginMainFrame 1.3 ms | g (7.5 ms sampled), et (4.2 ms sampled), g (3.8 ms sampled) |
| 7439.8 | 33.4 | TimerFire 20.4 ms, TimerFire 17.4 ms, ProxyMain::BeginMainFrame 2.1 ms | g (3.6 ms sampled), g (3.5 ms sampled), et (2.9 ms sampled) |
| 7523.1 | 33.4 | TimerFire 20.3 ms, TimerFire 19.2 ms, ProxyMain::BeginMainFrame 1.4 ms | g (6.4 ms sampled), g (4.7 ms sampled), (program) (2.8 ms sampled) |
| 7623.1 | 66.6 | TimerFire 59.2 ms, TimerFire 18.1 ms, ProxyMain::BeginMainFrame 1.9 ms | xg (4.9 ms sampled), Ig (4.6 ms sampled), g (3.3 ms sampled) |
| 7789.8 | 33.4 | TimerFire 20.8 ms, TimerFire 18.6 ms, ProxyMain::BeginMainFrame 1.5 ms | g (6.0 ms sampled), et (3.3 ms sampled), g (3.3 ms sampled) |
| 7873.1 | 33.4 | TimerFire 24.7 ms, TimerFire 19.1 ms, ProxyMain::BeginMainFrame 2.4 ms | g (4.0 ms sampled), g (3.7 ms sampled), (program) (3.4 ms sampled) |
| 7923.1 | 33.3 | TimerFire 20.3 ms, TimerFire 19.1 ms, ProxyMain::BeginMainFrame 1.4 ms | g (4.3 ms sampled), g (3.5 ms sampled), et (3.1 ms sampled) |
| 8006.4 | 33.4 | TimerFire 20.6 ms, TimerFire 19.1 ms, ProxyMain::BeginMainFrame 2.1 ms | g (5.0 ms sampled), g (3.8 ms sampled), et (2.7 ms sampled) |
| 8073.1 | 33.4 | TimerFire 21.8 ms, TimerFire 21.3 ms, ProxyMain::BeginMainFrame 2.3 ms | (program) (3.4 ms sampled), g (3.1 ms sampled), et (2.5 ms sampled) |
| 8139.8 | 33.4 | TimerFire 23.4 ms, TimerFire 19.5 ms, ProxyMain::BeginMainFrame 1.7 ms | g (5.9 ms sampled), et (3.5 ms sampled), g (2.9 ms sampled) |
| 8206.4 | 33.3 | TimerFire 18.4 ms, TimerFire 17.3 ms, ProxyMain::BeginMainFrame 1.3 ms | g (6.0 ms sampled), g (3.5 ms sampled), g (3.2 ms sampled) |
| 8323.1 | 33.3 | TimerFire 18.0 ms, TimerFire 17.1 ms, ProxyMain::BeginMainFrame 1.3 ms | g (5.8 ms sampled), g (4.3 ms sampled), et (3.0 ms sampled) |
| 8423.1 | 33.3 | TimerFire 18.6 ms, TimerFire 17.5 ms, ProxyMain::BeginMainFrame 2.2 ms | g (6.2 ms sampled), g (4.2 ms sampled), et (3.0 ms sampled) |
| 8556.4 | 33.3 | TimerFire 17.2 ms, TimerFire 16.8 ms, ProxyMain::BeginMainFrame 2.0 ms | g (7.3 ms sampled), g (6.0 ms sampled), (program) (3.8 ms sampled) |
| 8656.3 | 33.2 | TimerFire 19.3 ms, TimerFire 19.0 ms, ProxyMain::BeginMainFrame 1.9 ms | g (4.1 ms sampled), g (3.8 ms sampled), et (3.2 ms sampled) |
| 8756.4 | 33.3 | TimerFire 17.2 ms, TimerFire 16.9 ms, ProxyMain::BeginMainFrame 1.6 ms | g (5.1 ms sampled), g (3.9 ms sampled), g (3.2 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
