# Cold-page hitch attribution
REFERENCE: 1280x720-dpr2-cpu4-medium-enemy-sock-skipper-basic-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs

RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.

| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |
| ---: | ---: | --- | --- |
| 60.5 | 33.3 | ProxyMain::BeginMainFrame 16.6 ms, Layout 13.2 ms, ParseHTML 10.3 ms | (program) (32.6 ms sampled) |
| 310.5 | 99.9 | ParseHTML 8.9 ms | (program) (99.8 ms sampled) |
| 1177.2 | 33.4 | ProxyMain::BeginMainFrame 0.9 ms, Layout 0.7 ms, Commit 0.0 ms | (idle) (20.7 ms sampled), (program) (12.4 ms sampled), unpack (0.3 ms sampled) |
| 1527.2 | 116.7 | EvaluateScript 114.1 ms, v8.compile 77.6 ms, MinorGC 1.3 ms | (anonymous) (91.0 ms sampled), (anonymous) (9.2 ms sampled), (program) (3.0 ms sampled) |
| 1627.1 | 99.9 | EvaluateScript 114.1 ms, ProxyMain::BeginMainFrame 55.3 ms, Layout 45.8 ms | (program) (45.5 ms sampled), (anonymous) (20.4 ms sampled), hl (3.0 ms sampled) |
| 1877.2 | 50.1 | TimerFire 51.9 ms, FunctionCall 50.9 ms, GpuChannelHost::CreateViewCommandBuffer 1.8 ms | fe (7.1 ms sampled), n (4.9 ms sampled), Dg.setSize (4.0 ms sampled) |
| 1977.1 | 50.0 | ProxyMain::BeginMainFrame 54.3 ms, EventDispatch 19.7 ms, FunctionCall 17.9 ms | (program) (25.2 ms sampled), (anonymous) (10.8 ms sampled), elementsFromPoint (1.1 ms sampled) |
| 2577.1 | 33.3 | EventDispatch 45.6 ms, FunctionCall 45.5 ms, Layout 5.8 ms | resizeToHost (9.1 ms sampled), fe (5.9 ms sampled), n (4.2 ms sampled) |
| 2877.1 | 50.0 | TimerFire 61.3 ms, MinorGC 0.9 ms, V8.GCScavenger 0.9 ms | clone (4.7 ms sampled), e (4.3 ms sampled), xx (2.8 ms sampled) |
| 3493.7 | 33.3 | TimerFire 42.0 ms, V8.DeoptimizeCode 0.0 ms, V8.DeoptimizeCode 0.0 ms | zg (2.3 ms sampled), copy (1.6 ms sampled), angleTo (1.4 ms sampled) |
| 3560.4 | 50.1 | TimerFire 65.4 ms, MinorGC 1.3 ms, V8.GCScavenger 1.3 ms | g (4.8 ms sampled), Ph (3.7 ms sampled), Yh (3.6 ms sampled) |
| 3627.1 | 33.4 | TimerFire 47.3 ms, GLES2Implementation::GetProgramiv 1.2 ms, ImplementationBase::WaitForCmd 1.2 ms | C (13.8 ms sampled), ce (2.3 ms sampled), d (1.6 ms sampled) |
| 3860.3 | 33.3 | TimerFire 52.8 ms, CommandBufferHelper::Flush 0.0 ms, CommandBufferHelper::Flush 0.0 ms | yh (3.9 ms sampled), Ph (2.2 ms sampled), Ph (2.2 ms sampled) |
| 5010.3 | 100.0 | TimerFire 87.4 ms, Decode Image 25.9 ms, ProxyMain::BeginMainFrame 12.3 ms | xe (41.2 ms sampled), C (12.6 ms sampled), render (6.2 ms sampled) |

Each frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.
