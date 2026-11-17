# V7 V-F: one baked damage-number atlas — rejected

Reject runtime adoption: steady frame pacing unchanged, startup stalls retained, no useful balanced-trial improvement despite 54987 extra bytes and separate preparation. Full cold-load/failure/font/disposal integration is not warranted without a useful benefit. No application asset or source changed; no READY.

Study gate23:13:12Z elapsed before this decision. Six alternating baseline/baked trials completed23:13:31Z. Each ran32s natural speed1 at1x and4x CPU, same preserved production artifact. 4x is a stress proxy. All12 runs had26 actions,6 ultimates,171 log events, identical ordered plans/final actor state and zero browser errors/blocked requests.

| CPU | Variant | Steady render median | Steady frame p95 | Startup render max | Whole frame p95 |
|---|---|---:|---:|---:|---:|
| 1x | baseline | 2.8ms | 16.7ms | 39.8ms | 16.7ms |
| 1x | baked | 2.9ms | 16.7ms | 40.8ms | 16.7ms |
| 4x | baseline | 13.3ms | 33.4ms | 136.3ms | 33.5ms |
| 4x | baked | 13.2ms | 33.4ms | 134.6ms | 49.9ms |

Values are medians of three trial summaries, not pooled frame percentiles. All individual distributions/ranges are retained in V7-F-offline-number-production.json. These results do not establish a speedup or the cause of the remaining stall.

The baked path adds54987B. Median request+decode elapsed4.8/5.1ms at1x/4x; canvas restoration0.5/1.8ms. CDP preparation task elapsed2.245/10.191ms includes other renderer work; it is neither exclusive CPU nor a cold-network benchmark. Baseline preparation instrumentation itself costs0.917/4.347ms. Preparation precedes timed gameplay at matching CPU throttle.

Correctness: exact eightPNG fullRGBA/152glyph metrics/320scaled comparisons, then160 full-scene number/state/GPU comparisons. All12 gameplay captures measured; four newly prepared1024x576 views inspected once at2026-11-17T23:14:42.217522+00:00. Heroes, HP/status marks, HUD and telegraphs remain readable. Different natural animation phases are not claimed pixel-identical.

Source/build provenance: tool source740ef87feffe4b2edfbd41febfe19485055b11b5; runtime build53f8c4a17419ab9c7f4f8126bc74b05dea778871; index033a28d5e00451bcda3e6fc2d18eceda02ff6f2ecb74c838ff07ddd1723f448e; build manifestacd12636b8163f9ff9d4bb34e3fad60579c6075e3876f613fe8c49c765a50c9b. Local URLhttp://127.0.0.1:6311/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3; not independent judge acceptance. Archived tool hashes and UTC intervals are in JSON; raw trials/assets/images remain ignored under work/v5/CXV/films/V7-F-offline-number-production.

Do not repeat direct-image/WebP/whole-palette exports or this unchanged baked candidate. PNG canvas restoration is useful parity knowledge, not a shipping improvement.
