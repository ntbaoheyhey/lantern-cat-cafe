# R2 roster packaging budget — 2026-11-10

Planning from the existing Yarn-preview receipt; no new build or acceptance measurement. The full artifact is 37,295,111 bytes with only three reconstructed units. The earlier lean result (25,223,285 bytes) predates Yarn and is not a full-roster size PASS.

| Class | Embedded bytes |
|---|---:|
|flipbooks|176,216|
|atelier-models|6,642,384|
|icons|422,620|
|portraits|6,672,036|
|atelier-stage|1,998,112|
|reconstructed-models|3,219,520|
|painted-fallbacks|1,015,676|
|bakeoff-models|817,984|
|painted-vfx|4,304,112|
|classic-models|2,867,752|
|textures-and-other|8,042,804|

Only 2,704,889 bytes remain below the full 40 MB cap; adding the remaining models unchanged cannot fit. Preserve source quality and current accepted Mochi/Soot while measuring each packed candidate. Do not install a lower-detail result solely because its byte count passes.

Before the next full-roster delivery: reuse the existing offline-only lean image treatment where visual comparisons pass, omit obsolete bake-off payloads only in an explicitly labelled delivery pack, then compare bounded per-unit mesh/texture packing at actual battle size. Preserve v2/OFF behavior and the development comparison artifact. No shell edits or dependency changes.

Full <=40 MB and lean <=26 MB remain delivery gates. Early candidate files are review-only; scores and previous build receipts do not waive either limit.
