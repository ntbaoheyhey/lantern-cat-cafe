# Cold-page hitch attribution
REFERENCE: 1440x900-dpr1-cpu4-medium-enemy-pantry-crown-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 56.1 | 33.3 | ProxyMain::BeginMainFrame 16.3 ms, Layout 13.8 ms, ParseHTML 10.9 ms | (program) (33.2 ms sampled) |
| 322.8 | 100.0 |  | (program) (99.8 ms sampled) |
| 1156.1 | 33.3 | ProxyMain::BeginMainFrame 1.4 ms, Layout 0.4 ms, Commit 0.0 ms | (idle) (21.0 ms sampled), (program) (12.3 ms sampled), unpack (0.4 ms sampled) |
| 1189.4 | 33.3 | DecompressionStream Inflate 17.5 ms, ProxyMain::BeginMainFrame 0.1 ms, FireAnimationFrame 0.0 ms | (program) (23.6 ms sampled), (idle) (9.6 ms sampled) |
| 1506.1 | 116.7 | EvaluateScript 113.2 ms, v8.compile 76.9 ms, MinorGC 1.3 ms | (anonymous) (90.6 ms sampled), (anonymous) (9.6 ms sampled), (program) (3.3 ms sampled) |
| 1606.1 | 100.0 | EvaluateScript 113.2 ms, ProxyMain::BeginMainFrame 55.0 ms, Layout 44.5 ms | (program) (43.5 ms sampled), (anonymous) (20.0 ms sampled), hl (1.7 ms sampled) |
| 1856.1 | 50.1 | TimerFire 48.3 ms, FunctionCall 48.1 ms, ProxyMain::BeginMainFrame 3.7 ms | fe (7.4 ms sampled), (program) (5.6 ms sampled), n (5.4 ms sampled) |
| 1956.0 | 50.0 | ProxyMain::BeginMainFrame 27.5 ms, EventDispatch 19.9 ms, FunctionCall 18.1 ms | (program) (29.7 ms sampled), (anonymous) (11.1 ms sampled), Ku (1.0 ms sampled) |
| 2556.0 | 33.3 | EventDispatch 37.4 ms, FunctionCall 37.2 ms, Layout 6.3 ms | resizeToHost (8.9 ms sampled), n (4.6 ms sampled), Dg.setSize (4.1 ms sampled) |
| 2822.7 | 50.0 | TimerFire 64.3 ms, MinorGC 1.4 ms, V8.GCScavenger 1.3 ms | e (4.5 ms sampled), (garbage collector) (4.0 ms sampled), e (2.7 ms sampled) |
| 2856.0 | 33.3 | TimerFire 64.3 ms, ProxyMain::BeginMainFrame 2.5 ms, TimerFire 1.8 ms | (program) (6.0 ms sampled), parse (2.1 ms sampled), load (1.3 ms sampled) |
| 3522.7 | 66.7 | TimerFire 81.7 ms, MajorGC 6.8 ms, V8.GCFinalizeMC 6.7 ms | (garbage collector) (10.6 ms sampled), yh (5.1 ms sampled), g (4.1 ms sampled) |
| 3589.4 | 33.4 | TimerFire 44.2 ms, GLES2Implementation::GetProgramiv 1.7 ms, GLES2Implementation::GetProgramiv 1.0 ms | C (12.1 ms sampled), tt (1.8 ms sampled), xe (1.6 ms sampled) |
| 3822.6 | 33.2 | TimerFire 52.5 ms, CommandBufferHelper::Flush 0.0 ms, CommandBufferProxyImpl::Flush 0.0 ms | yh (5.6 ms sampled), b (2.4 ms sampled), Ph (2.3 ms sampled) |
| 4989.3 | 100.0 | TimerFire 86.7 ms, Decode Image 26.1 ms, ProxyMain::BeginMainFrame 12.4 ms | xe (40.3 ms sampled), C (13.9 ms sampled), render (4.7 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
