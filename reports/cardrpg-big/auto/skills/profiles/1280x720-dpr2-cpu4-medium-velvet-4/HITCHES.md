# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu4-medium-velvet-4-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 59.8 | 33.3 | ProxyMain::BeginMainFrame 17.0 ms, Layout 14.8 ms, ParseHTML 12.0 ms | (program) (33.2 ms sampled), (idle) (0.7 ms sampled) |
| 276.5 | 100.1 | ParseHTML 16.2 ms | (program) (99.0 ms sampled) |
| 1726.4 | 1449.9 | ParseHTML 1442.9 ms, EvaluateScript 1433.2 ms, MinorGC 18.5 ms | (anonymous) (1242.3 ms sampled), (garbage collector) (75.3 ms sampled), (program) (61.5 ms sampled) |
| 1943.1 | 216.7 | ParseHTML 1442.9 ms, EvaluateScript 1433.2 ms, DecompressionStream Inflate 50.9 ms | (program) (210.7 ms sampled), (anonymous) (5.3 ms sampled), (anonymous) (0.8 ms sampled) |
| 1976.4 | 33.3 | DecompressionStream Inflate 22.1 ms, EvaluateScript 15.3 ms, ProxyMain::BeginMainFrame 1.8 ms | (program) (29.6 ms sampled), (anonymous) (1.0 ms sampled), _setupGlobalListenersRemovalDetection (0.8 ms sampled) |
| 2626.3 | 649.9 | EvaluateScript 467.1 ms, v8.compile 434.9 ms, MajorGC 7.6 ms | (anonymous) (600.9 ms sampled), (program) (24.7 ms sampled), (garbage collector) (7.9 ms sampled) |
| 2743.0 | 116.7 | EvaluateScript 467.1 ms, ProxyMain::BeginMainFrame 56.3 ms, Layout 46.4 ms | (program) (54.0 ms sampled), (anonymous) (20.7 ms sampled), (idle) (4.1 ms sampled) |
| 2776.3 | 33.3 | ProxyMain::BeginMainFrame 56.3 ms, Layout 46.4 ms, PrePaint 4.3 ms | (program) (13.1 ms sampled), (idle) (4.7 ms sampled), computeAccessibleNameComposite (1.7 ms sampled) |
| 2859.7 | 33.4 | ProxyMain::BeginMainFrame 30.7 ms, EventDispatch 22.1 ms, FunctionCall 18.8 ms | (program) (19.7 ms sampled), (anonymous) (11.5 ms sampled), removeChild (1.6 ms sampled) |
| 3259.6 | 250.0 | EventDispatch 249.0 ms, FunctionCall 248.9 ms, Layout 7.4 ms | jg (77.0 ms sampled), resizeToHost (10.5 ms sampled), me (10.4 ms sampled) |
| 3309.7 | 33.4 | MajorGC 6.7 ms, V8.GCFinalizeMC 6.7 ms, V8.GC_MARK_COMPACTOR 6.7 ms | (garbage collector) (7.7 ms sampled), (program) (3.7 ms sampled), (anonymous) (2.8 ms sampled) |
| 3543.0 | 33.4 | ProxyMain::BeginMainFrame 0.8 ms, UpdateLayoutTree 0.3 ms, FireAnimationFrame 0.2 ms | (idle) (18.2 ms sampled), (program) (9.4 ms sampled), fetch (0.9 ms sampled) |
| 3593.0 | 33.3 | ProxyMain::BeginMainFrame 0.7 ms, FireAnimationFrame 0.0 ms, Commit 0.0 ms | (idle) (17.8 ms sampled), (program) (6.8 ms sampled), fetch (5.9 ms sampled) |
| 4576.3 | 100.0 | V8.DeoptimizeCode 0.6 ms, CommandBufferHelper::Flush 0.0 ms, CommandBufferProxyImpl::Flush 0.0 ms | Zm (6.1 ms sampled), gg (5.1 ms sampled), $e (3.6 ms sampled) |
| 4709.7 | 100.1 | TimerFire 116.9 ms, GLES2Implementation::GetProgramiv 1.3 ms, ImplementationBase::WaitForCmd 1.3 ms | C (10.9 ms sampled), n (5.3 ms sampled), Se (5.3 ms sampled) |
| 5009.6 | 266.7 | TimerFire 283.7 ms, GLES2Implementation::GetProgramiv 10.7 ms, ImplementationBase::WaitForCmd 10.7 ms | g (19.9 ms sampled), C (12.8 ms sampled), $e (12.6 ms sampled) |
| 5076.3 | 33.3 | ProxyMain::BeginMainFrame 16.9 ms, FireAnimationFrame 12.7 ms, ProxyMain::BeginMainFrame 10.3 ms | (program) (7.4 ms sampled), (idle) (2.0 ms sampled), rt (1.2 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
