# L5 batch 1 — Panko / Mallow / Cinnamon

Local review checkpoint; L5 phase gates and publication are still pending.

Three original Blender models are selected: Panko R3, Mallow R4 and Cinnamon R3. Each has at least two viewed authoring rounds. Portraits were rerendered from these raw models and delivered locally at256x320/512x640. The three completed48-frame turntables retain hashes of the exact raw sources; six evenly spaced angles per model were personally reviewed.

Runtime hand clearance was corrected per Look model. Panko pilot2 (`a596905d`) and Mallow/Cinnamon pilots3/4 (`b8bbfca2`) each provide24 viewed actual clip samples. Original failures remain in pilot1. The plate, whisk and flask no longer cross the respective cheeks in the reviewed samples. This does not prove continuous collision freedom. Classic tracks, duration and root motion are preserved by12 focused tests. Nine-cat trajectory probe:36clips/198required comparisons/0offenders, a transform check only.

The selected512px colour/256px detail WebPq80 meshopt packing saves1,256,540HTML bytes in a matched three-model comparison. Six runtime crop pairs have SSIM>=0.978488 and0CSSpx bounds delta; nine studio pairs have SSIM>=0.989905. Personally reviewed all15 pairs. Fine fur/cloth grain is softer; raw1024px models remain the portrait source. This selection does not change the three L1 hero resolutions.

| Unit | Triangles | Named rig nodes | Tier |
|---|---:|---:|---|
|panko|11769|26|improved|
|mallow|11758|26|improved|
|cinnamon|11751|28|improved|

Evidence: rounds/roster/<unit>/round-*/REVIEW.md; validation/l5/batch1/pilot-{1,2,3,4}/poses; turntables/l5/<unit>; validation/l5/compression/512-256-q80/comparison. Paths are relative to reports/cardrpg-look.

Self-grades: silhouette7, material6.5, face7, palette7, motion clearance6.5, sharpness6.5. Remaining facets, rigid clothing edges and broad prop highlights prevent a look-slice claim. No fresh phase timing/size/E2E acceptance yet; the latest broader candidate still requires review.

Committed-phase follow-up: artifact1171b9ec now provides72 fresh poses for this batch (four actual runtime clips ×six samples ×three cats), all personally viewed. Machine checks report matching clips/Look models, no browser errors and all projected mesh bounds inside the one-percent margin. See validation/l5/phase-cat-poses/REVIEW.md and each unit sheet. This supersedes the earlier pending framing notes above; phase source gates and timings are still running in the original coordinator.

## Completed L5 phase validation

The earlier pending notes above describe the retained pilot stage. Source `c5048bee` / artifact `1171b9ec` now passed the independent L5 evidence audit. Typecheck/lint/unit/build passed; E2E: 420 passed initially;1 unchanged-source focused retry passed. Not one clean421-case run. All 22 units have fresh phase poses, stills, exact rig audits and reviewed turntables. The 24 slice cast windows peaked at 16.8 ms; cold-open maximum was 133.3 ms. Startup parity delta is +93 bytes, and HTML is 31,367,423 bytes (24 MB miss, documented 32 MB allowance). See [L5 checkpoint](L5-CHECKPOINT.md) and [report](CARDRPG-LOOK-REPORT.md) for measured misses and remaining L7 work.
