# Cold-page hitch attribution
REFERENCE: 1280x720-dpr1-cpu4-medium-marigold-4-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 58.1 | 33.4 | ProxyMain::BeginMainFrame 20.6 ms, Layout 17.5 ms, ParseHTML 10.9 ms | (program) (33.4 ms sampled), (idle) (0.2 ms sampled), sample (0.1 ms sampled) |
| 324.8 | 100.0 |  | (program) (99.4 ms sampled) |
| 1141.4 | 33.3 | TimerFire 19.5 ms | fetch (18.5 ms sampled), (idle) (14.3 ms sampled), (program) (0.1 ms sampled) |
| 1191.4 | 33.4 | DecompressionStream Inflate 17.8 ms, ProxyMain::BeginMainFrame 0.1 ms, FireAnimationFrame 0.0 ms | (program) (19.3 ms sampled), (idle) (14.2 ms sampled), sample (0.1 ms sampled) |
| 1541.4 | 116.6 | TimerFire 116.7 ms, EvaluateScript 111.3 ms, v8.compile 75.4 ms | (anonymous) (79.6 ms sampled), (anonymous) (8.8 ms sampled), (garbage collector) (1.7 ms sampled) |
| 1624.7 | 83.3 | TimerFire 116.7 ms, ProxyMain::BeginMainFrame 54.1 ms, Layout 43.9 ms | (program) (41.7 ms sampled), (anonymous) (20.2 ms sampled), cp (1.4 ms sampled) |
| 1874.7 | 50.0 | TimerFire 49.5 ms, FunctionCall 49.3 ms, ProxyMain::BeginMainFrame 4.6 ms | pe (8.6 ms sampled), Ey (4.9 ms sampled), n (4.8 ms sampled) |
| 1991.4 | 33.4 | TimerFire 61.2 ms, MinorGC 0.8 ms, V8.GCScavenger 0.8 ms | clone (5.3 ms sampled), (garbage collector) (2.3 ms sampled), e (2.0 ms sampled) |
| 2091.4 | 33.4 | ProxyMain::BeginMainFrame 27.8 ms, EventDispatch 19.9 ms, FunctionCall 18.4 ms | (program) (13.6 ms sampled), (anonymous) (11.2 ms sampled), removeEventListener (1.0 ms sampled) |
| 2708.0 | 33.3 | EventDispatch 41.5 ms, FunctionCall 40.6 ms, Layout 5.6 ms | resizeToHost (8.4 ms sampled), pe (4.9 ms sampled), Dg.setSize (3.9 ms sampled) |
| 2824.7 | 33.3 | TimerFire 58.9 ms, V8.GCIncrementalMarking 0.8 ms, V8.GC_MC_INCREMENTAL 0.8 ms | (garbage collector) (13.3 ms sampled), e (2.2 ms sampled), e (1.6 ms sampled) |
| 2858.1 | 33.4 | TimerFire 58.9 ms, MajorGC 5.1 ms, V8.GCFinalizeMC 5.1 ms | (program) (12.0 ms sampled), (garbage collector) (5.1 ms sampled), (idle) (1.3 ms sampled) |
| 5924.6 | 33.3 | TimerFire 65.1 ms, CommandBufferHelper::Flush 0.0 ms, CommandBufferHelper::Flush 0.0 ms | yh (5.6 ms sampled), yh (2.8 ms sampled), _ (2.1 ms sampled) |
| 6074.5 | 33.2 | TimerFire 21.3 ms, TimerFire 16.4 ms, ProxyMain::BeginMainFrame 2.0 ms | g (5.1 ms sampled), $e (4.3 ms sampled), (program) (3.6 ms sampled) |
| 6224.5 | 33.3 | TimerFire 19.0 ms, TimerFire 16.1 ms, ProxyMain::BeginMainFrame 1.2 ms | g (4.7 ms sampled), $e (4.4 ms sampled), g (3.4 ms sampled) |
| 6341.2 | 33.4 | TimerFire 24.7 ms, TimerFire 18.0 ms, ProxyMain::BeginMainFrame 1.6 ms | $e (3.9 ms sampled), g (3.6 ms sampled), g (3.3 ms sampled) |
| 7041.2 | 50.0 | TimerFire 48.1 ms, TimerFire 16.2 ms, ProxyMain::BeginMainFrame 0.9 ms | yh (4.6 ms sampled), g (2.7 ms sampled), yh (2.7 ms sampled) |
| 9057.8 | 33.4 | ProxyMain::BeginMainFrame 17.6 ms, FireAnimationFrame 14.0 ms, ProxyMain::BeginMainFrame 9.5 ms | (program) (6.9 ms sampled), (idle) (5.1 ms sampled), ry (2.7 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
