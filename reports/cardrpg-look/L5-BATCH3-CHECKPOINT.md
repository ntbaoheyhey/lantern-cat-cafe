# L5 batch 3 — Brioche / Velvet / Marigold

Local checkpoint in progress; runtime review and phase gates are not complete.

Each of these original Blender models has two viewed authoring rounds, exact named-pivot compatibility and a refreshed portrait from the raw model. The selected 512px colour/256px detail WebPq80 packing was viewed at three matched studio angles per model; six-model minimum crop SSIM 0.989321. Fine cloth grain is softer.

| Unit | Triangles | Named rig nodes | Tier |
|---|---:|---:|---|
|brioche|11744|26|improved|
|velvet|11766|26|improved|
|marigold|11750|28|improved|

Evidence lives under rounds/roster/<unit>/round-*/REVIEW.md, validation/l5/compression/remaining-six-512-256-q80/studio, remaining-six/pilot-{1,2,3}, and turntables/l5/<unit> (relative to reports/cardrpg-look).

Brioche: six completed turntable angles reviewed; all24 corrected pilot2 poses for both arms reviewed; hand/face crossings corrected in these samples, but jumping/lowered poses are cropped by the old gallery framing. A Look-only wider frame is pending verification. Velvet: 24 pilot 1 poses plus full-resolution bell/jaw check and six turntable angles reviewed; no extra arm fit selected. Marigold: 24 pilot 3 poses plus two full-resolution views reviewed; right flask now clears the cheek at the prior 4@18% failure. Its completed48-frame turntable has now been verified and six angles personally reviewed; see turntables/l5/marigold/REVIEW.md.

Self-grades remain provisional: silhouette 7, face 7, palette 6.5–7, material 6.5, sharpness 6.5. Raised eye rims, faceted feet, angular tails and plain backs prevent a look-slice claim. This checkpoint does not establish continuous collision freedom, complete phase gates or publication.

Framing follow-up: boss-frame-pilot artifact3ec3a5f6 provides48 newly viewed Brioche/Marigold samples, all within the one-percent mesh margin. Plate/flask remain outside the cheeks at prior failure points. See validation/l5/opponents/boss-frame-pilot/cat-poses/REVIEW.md. Full phase validation is still separate.

Committed-phase follow-up: artifact1171b9ec now provides72 fresh poses for this batch (four actual runtime clips ×six samples ×three cats), all personally viewed. Machine checks report matching clips/Look models, no browser errors and all projected mesh bounds inside the one-percent margin. See validation/l5/phase-cat-poses/REVIEW.md and each unit sheet. This supersedes the earlier pending framing notes above; phase source gates and timings are still running in the original coordinator.

## Completed L5 phase validation

The earlier pending notes above describe the retained pilot stage. Source `c5048bee` / artifact `1171b9ec` now passed the independent L5 evidence audit. Typecheck/lint/unit/build passed; E2E: 420 passed initially;1 unchanged-source focused retry passed. Not one clean421-case run. All 22 units have fresh phase poses, stills, exact rig audits and reviewed turntables. The 24 slice cast windows peaked at 16.8 ms; cold-open maximum was 133.3 ms. Startup parity delta is +93 bytes, and HTML is 31,367,423 bytes (24 MB miss, documented 32 MB allowance). See [L5 checkpoint](L5-CHECKPOINT.md) and [report](CARDRPG-LOOK-REPORT.md) for measured misses and remaining L7 work.
