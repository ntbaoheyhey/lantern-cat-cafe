# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu4-medium-velvet-4-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 59.4 | 33.3 | ProxyMain::BeginMainFrame 19.1 ms, Layout 16.6 ms, ParseHTML 10.4 ms | (program) (32.8 ms sampled), sample (0.6 ms sampled) |
| 309.5 | 100.0 | ParseHTML 9.4 ms, ParseHTML 8.9 ms | (program) (99.9 ms sampled) |
| 1159.4 | 33.3 | ProxyMain::BeginMainFrame 1.4 ms, Paint 0.5 ms, Paint 0.5 ms | (idle) (21.2 ms sampled), (program) (12.0 ms sampled) |
| 1526.1 | 100.0 | TimerFire 117.1 ms, EvaluateScript 111.8 ms, v8.compile 74.8 ms | (anonymous) (65.6 ms sampled), (anonymous) (10.0 ms sampled), (anonymous) (2.0 ms sampled) |
| 1626.0 | 99.9 | TimerFire 117.1 ms, EvaluateScript 111.8 ms, ProxyMain::BeginMainFrame 58.3 ms | (program) (50.3 ms sampled), (anonymous) (20.7 ms sampled), Xo (1.9 ms sampled) |
| 1876.1 | 50.0 | TimerFire 53.6 ms, FunctionCall 53.5 ms, ProxyMain::BeginMainFrame 4.1 ms | pe (6.2 ms sampled), n (4.7 ms sampled), Dg.setSize (4.5 ms sampled) |
| 2009.4 | 50.0 | TimerFire 71.7 ms, MajorGC 4.2 ms, V8.GCFinalizeMC 4.2 ms | (garbage collector) (7.4 ms sampled), e (6.3 ms sampled), clone (5.6 ms sampled) |
| 2109.4 | 33.3 | ProxyMain::BeginMainFrame 28.4 ms, EventDispatch 20.0 ms, FunctionCall 17.9 ms | (program) (16.1 ms sampled), (anonymous) (10.4 ms sampled), removeChild (0.9 ms sampled) |
| 2726.0 | 33.3 | EventDispatch 44.4 ms, FunctionCall 44.3 ms, Layout 5.3 ms | resizeToHost (8.7 ms sampled), n (4.4 ms sampled), Dg.setSize (3.7 ms sampled) |
| 5892.5 | 50.0 | TimerFire 64.8 ms, MinorGC 0.7 ms, V8.GCScavenger 0.7 ms | yh (4.5 ms sampled), Bc (3.4 ms sampled), Ph (3.4 ms sampled) |
| 6025.9 | 33.3 | TimerFire 21.6 ms, TimerFire 18.8 ms, ProxyMain::BeginMainFrame 2.1 ms | g (4.6 ms sampled), g (4.3 ms sampled), g (3.0 ms sampled) |
| 6092.6 | 33.3 | TimerFire 22.2 ms, TimerFire 17.6 ms, ProxyMain::BeginMainFrame 1.1 ms | g (5.5 ms sampled), $e (3.6 ms sampled), $e (3.4 ms sampled) |
| 6209.2 | 33.4 | TimerFire 19.1 ms, TimerFire 18.6 ms, ProxyMain::BeginMainFrame 1.7 ms | C (3.4 ms sampled), g (3.2 ms sampled), $e (2.7 ms sampled) |
| 6309.2 | 33.3 | TimerFire 23.0 ms, TimerFire 16.9 ms, GLES2Implementation::GetProgramiv 1.0 ms | g (6.5 ms sampled), $e (3.4 ms sampled), C (3.4 ms sampled) |
| 7009.2 | 50.0 | TimerFire 49.2 ms, TimerFire 16.3 ms, CommandBufferHelper::Flush 0.9 ms | yh (3.8 ms sampled), g (3.4 ms sampled), g (1.8 ms sampled) |
| 9025.7 | 33.3 | ProxyMain::BeginMainFrame 18.3 ms, FireAnimationFrame 14.0 ms, ProxyMain::BeginMainFrame 9.9 ms | (program) (5.0 ms sampled), (idle) (1.5 ms sampled), ny (1.5 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
