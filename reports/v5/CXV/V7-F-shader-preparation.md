# Shader preparation study — rejected

No native change. Six alternating32s trials on one unchanged native3050ee5ae artifact passed exact initial/final state and action-order checks, with shader diagnostics enabled and zero errors/blocked requests. All3764 artifact files and four trial-tool snapshots were verified. Twelve fresh1280x720 captures were measured; four1024x576 views reviewed once. Frozen probe previously passed two exact full-page RGB pairs.

Three-trial group medians:

| Measure | 1x baseline | 1x preparation | 4x baseline | 4x preparation |
|---|---:|---:|---:|---:|
| Preparation + play TaskDuration ms | 9220.024 | 9514.761 | 31834.392 | 31849.722 |
| Preparation wall ms | 0 | 16.3 | 0 | 26.7 |
| Whole-run frame p95 ms | 16.8 | 16.8 | 33.4 | 33.4 |
| Whole-run intervals >50.5ms | 0 | 0 | 17 | 15 |
| Startup intervals >50.5ms | 0 | 0 | 4 | 5 |
| Program log queries total ms | 34.1 | 13.6 | 28.4 | 16.1 |
| Programs after play | 17 | 21 | 17 | 21 |

Preparation creates14additional programs before play. Lower log-query time moves a small cost without a stable ordinary-play benefit; normal total task time grows about3.2%,stress total is effectively flat, and startup tails are mixed. Keep runtime unchanged. The source-based disposal/timer concern remains a hypothesis; no lifecycle adoption testing is warranted after this failed performance gate. No diagnostics were disabled.

Evidence: V7-F-shader-preparation-production.json, V7-F-shader-preparation-probe.json and V7-F-shader-first-use-attribution.json. URL http://127.0.0.1:6312/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3;index45f38b9326b12abeb837ca2bcd74a7c998de21c32c30c6064be4508366b34cf0;empty runtime patch. Trials01:28:38–01:35:37UTC18Nov2026 on Apple M3 Pro;4xCPU is a stress proxy. TaskDuration is elapsed main-thread task time, not exclusive CPU/GPU completion. This is local evidence,not independent6301 acceptance.
