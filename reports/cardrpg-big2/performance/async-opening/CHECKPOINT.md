# Asynchronous opening comparison
REFERENCE: tools/cardrpg-big2/{opening-compare,offline-loader}.mjs; tools/cardrpg-big2/offline-loader.js; comparison.json

Retain the asynchronous local script loader for the review build. This is a seven-scenario paired sample, not an exhaustive opening pass. Application JavaScript and CSS were independently decoded and compared byte for byte; only loading strategy differs. Both artifacts and their build receipts are preserved. All 14 real-click runs held the shared machine lock and retained page-open RAF arrays and traces.

| Measurement | Inline | Asynchronous |
|---|---:|---:|
| Native whole-page MAX | 33.5 ms | 33.4 ms |
| CPU4 whole-page MAX | 116.7 ms | 100.0 ms |
| CPU4 post-interactive MAX | 100.1 ms | 100.0 ms |
| CPU4 p95 | 16.8 ms | 16.8 ms |
| All runs post-ready MAX | 16.8 ms | 16.8 ms |
| Hub interaction, CPU4 range | 1696–1716 ms | 1653–1671 ms |
| Battle ready, CPU4 range | 9104–9120 ms | 9115–10121 ms |
| Runtime errors | 0 | 0 |

The lower maximum does not establish lower load-to-ready time: one asynchronous case takes about one second longer. The 100 ms result has no margin. B1's earlier exhaustive 300 ms maximum remains part of the record and cannot be replaced by this smaller sample. The delivered artifact must still complete the full skill/opening matrix and lifecycle checks.

## Profile evidence and next fix
REFERENCE: inline/HITCHES.md; async/HITCHES.md; inline/trace-attribution.json; async/trace-attribution.json

At DPR2/CPU4 the inline trace contains 121.5 ms EvaluateScript and 81.9 ms main-thread compilation. The asynchronous trace contains 47.8 ms EvaluateScript and 6.5 ms main-thread compilation. These are inclusive task durations, not independent additions or CPU sample totals. The local blob URL lets the browser perform preparatory compilation separately; no external resource is requested.

The remaining asynchronous 100 ms intervals align with initial app evaluation plus layout, and a later 68.1 ms event/63.8 ms function with resizeToHost/setSize samples plus 27.8 ms frame work. Renderer/context initialization and initial layout are the next concrete targets if the full matrix still misses. Split initial scene sizing from construction and defer the home preview's first GPU allocation across loading frames; measure any candidate independently before accepting it. Do not lower DPR or hide startup frames to improve the number.

## Raw evidence
REFERENCE: comparison.json; inline/summary.json; async/summary.json

Each summary links seven per-frame JSON arrays and their gzip Chrome traces. The trace attribution files above select the same DPR2/CPU4 scenario on both builds. The source receipts retain the original pre-commit hashes; later phase evidence insertion reparents unpublished commits without changing these pinned bytes. No whole-page or after-interaction frames were discarded.
