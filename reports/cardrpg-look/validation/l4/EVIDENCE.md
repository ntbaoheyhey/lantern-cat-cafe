# L4 evidence publication policy

This is a selected evidence publication, not a complete archive of every raw screenshot. Original files remain unchanged locally.

Published: all phase and pilot contact sheets, reviews, original JSON measurements/signatures/pair comparisons, source-gate logs, compressed timing traces, metrics arrays, Blender flipbook source rounds and receipts. The phase artifact is `docs/cardrpg-look/index.html`; its exact source inputs and hash are in `build.json` and `checkpoint-audit.json`.

Local only: full per-effect `frames/` PNG sets (real scene, ablations and masks) and two experimental screenshot pixel packs. `evidence-inventory.json` lists every included/omitted file, bytes and SHA256, with a reason. An omitted file's hash identifies it but does not supply its pixels or make the raw set independently available from Git.

To inspect the portable visual results, use `captures/*-runtime-*.png` (19 phase sheets), `captures/sheets/*.webp` (67 effect sheets), `functional/*.png` and `effects/*.png`. The earlier pilot sheets/reviews live in `rounds/effects/`; original atlas rounds are in `rounds/flipbooks/`.

To collect a new full capture set, run the checked-in `effect-series.mjs` with the 67 IDs in `captures/captures.json` against the exact artifact, then `metrics/effect-review.py`. Use a new output directory. Browser/GPU pixel differences are possible across environments; a new capture is new evidence, not byte-for-byte recovery of the omitted originals. The existing signatures, pair deltas and misses must not be overwritten.

The screenshot codec `tools/cardrpg-look/pack-evidence.py` is optional archival tooling. Its tests prove exact decoded RGBA preservation, including hidden RGB; restored PNG container bytes may differ. It is not described as a published full raw archive.
