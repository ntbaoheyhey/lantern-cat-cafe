# Seven fresh-page measurements
REFERENCE: summary.json; raw-audit.json; *.json; *-trace.json.gz

Exact HTML SHA256 `9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3`. Seven fresh browser contexts with cache disabled, real clicks, raw RAF arrays and separate traces. Independently recomputed 13125 frames and all page/interactive/ready windows. No page errors. This sample does not replace the exhaustive skill matrix.

| Gate | Observed | Result |
|---|---:|---|
| Whole-page MAX ≤100 ms | Native 33.3 / CPU4 116.7 ms | MISS |
| After interaction MAX ≤100 ms | 116.7 ms | MISS |
| CPU4 p95 ≤33 ms | 16.8 ms | PASS |
| After scene ready MAX | 16.8 ms | Observation |

Load to hub interaction: native 878.2–914.3 ms, CPU4 2294.7–2305.1 ms. Battle ready: native 7055.9–7162.4 ms, CPU4 10304.0–10321.5 ms. CPU throttling affects CPU only. Trace attribution entries overlap and cannot be summed as exclusive work.
