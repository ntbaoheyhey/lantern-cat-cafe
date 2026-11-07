# Lossless comparison screenshots
REFERENCE: pixels.json, ../../../../tools/cardrpg-big/pack-comparisons.py, ../../../../apps/web/src/game/cardrpg/depth/LabEvidence.tsx

Two comparison screenshots are embedded as lossless WebP images. The original PNG captures remain available at their recorded source paths. Pillow checks decoded RGBA equality and dimensions for each output before writing the receipt.

| Image | PNG bytes | WebP bytes | Decoded pixels |
| --- | ---: | ---: | --- |
| F0 baseline | 617,011 | 429,958 | Equal, 1280×720 |
| F5 automatic battle | 762,343 | 531,956 | Equal, 1280×720 |

Their combined gzip payload decreases by 414,435 bytes. The E2 integrated HTML measures 23,376,689 bytes, including the new enemy source. Its SHA-256 is `5622ee6a865fafcf4c766b4068522a1fb3d60fb8ef547fdbb086c91d0cc96fc4`.

The builder now hashes all 189 embedded input assets, including report images, and checks their Git status when recording runtimeDirty. Browser decoding and the complete E2 candidate gates are queued separately. This encoding comparison establishes pixel equality and byte size.
