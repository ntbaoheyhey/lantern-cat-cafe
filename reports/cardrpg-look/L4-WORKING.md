Historical development log. Current phase evidence: validation/l4/REVIEW.md; phase gates are separate. Descriptions of pending jobs below apply to their dated entries, not to the latest checkout.

# L4 development evidence — not phase acceptance

The current material3 HTML is a development pilot. It uses round2 Blender atlases.
The newer paper, ribbon, glass, ceramic/metal and flame shading changes have not
yet been captured in the browser. The first-Low material warmup correction is
also awaiting a new build. Earlier L3 phase receipts remain historical evidence.

67 recipes were captured at six fixed times, using the unchanged identity,
inner-face and overdraw thresholds. Minimum identity distance is 0.681068193;
there are no threshold, inner-face, overdraw, empty-effect or browser-error
offenders. The stricter requirement that no pair's numeric distance decrease
still fails for 1,015 of 2,211 pairs (worst −0.065656477). This is reported as a
miss, even though every pair stays above the existing 0.16 threshold.

Three heroes have three actual material review rounds; the remaining nine cats
have two. Marigold4, sixteen enemy variants and the three passive rows have now
been viewed in the completed material3 set. Reviews identify flat paper panels,
weak glass rims and flame resembling pale smoke as the main issues to correct.
See rounds/effects/round-3-material/REVIEW.md and comparison.json.

Six GPU checks kept counts stable within each quality tier and demonstrated
183–506 changed non-face pixels from the pooled impact lights. Inner-face
changes stayed under 1%. All 82 observed effect resources were released exactly
once after awaiting asynchronous cleanup. The initial early-read disposal
failure is preserved separately; it is not described as a runtime leak.

Switching to Low exposed two programs missing from loading: guard felt and
button-guard utensil materials. The source now prepares the actual cloned
material finishes and utensils for all warm models, retaining their resources
until teardown. The next GPU check requires zero new programs on switching.
Typecheck, lint and fourteen focused tests passed before this warmup correction;
one follow-up focused run is queued under the shared machine lock.

Original round3 smoke/steam are rendered, flame is in progress, followed by
sparkle, yarn dust and ribbon. The existing coordinator uses six-frame windows.
All six packed atlases must be inspected before material4 is built. No duplicate
renderer or performance run has been launched, and no new timing claim is made.

The raw screenshot set remains local and unchanged. A portable RGBA archive
codec has a three-image roundtrip check; its first real six-effect pack is
queued. It preserves decoded pixels exactly and records original PNG hashes;
restored PNG container bytes may differ. No raw screenshot has been deleted.

Next: inspect round3 art, capture material4, verify warmup/cancellation, correct
actual visual failures, reconcile the accepted Lane A checkpoint, and run the
L4 source/cold/cast gates before publishing a draft. L6, L5 and L7 remain open.

## 2026-11-07T15:13Z continuation

Confirmed native Mac tool processes; no Docker process was observed. R3 renderer65141, pack71847, focused78078 and evidence-probe80450 remain the existing coordinators, waiting for A G0 browser lock. No duplicate jobs were started.

Source review corrected inverse-scale instance normals and added the standard Three tone-map/output-colour chunks before premultiplication: High/HDR stays linear, direct Low now uses ACES/sRGB. These changes need material4 browser review. The effects disposal harness now observes scene-owned warmup materials/geometries too; cancellation checks require exactly one disposal and zero duplicates. Syntax and diff whitespace checks pass; queued focused/browser results are still pending.

Viewed the source-hash-checked R3 smoke/steam sample sheet (memory/l4-prep/round3-smoke-steam.png). Smoke is neutral and more readable than R2; steam is still sparse. This is a partial source review, not the six-atlas or runtime acceptance. Also viewed the actual material3 Soot sheet: the cup remains an outline because a glaze shader cannot fill missing surfaces. Added original lathed cup, rounded teapot and bevelled glass greenhouse surfaces to the existing instance pools, retaining the original structural vertices and timings. These additions are unvalidated until material4.

Resource ownership correction claimed through sync2a999fa4: scene traversal now skips module-owned effect subtrees; SpellVfx disposes unused emblem placeholders and is idempotent. Two focused regression cases cover cancellation before/after preparation. GPU/cancellation harnesses now observe legacy spell pools as well as L4 resources and require exactly-once disposal. The same queued focused coordinator will check the latest source; no additional test job was launched.

Focused verification completed: web typecheck/lint and17tests PASS on current runtime source (memory/l4-focused-material4.json). R3 smoke/steam/flame now complete108/216 source frames. V2 evidence codec preserves decoded pixels, reducing144 real screenshots73,368,602→27,957,247bytes; its V1/V2 restore smoke test includes nonzero hidden RGB at zero alpha. Raw originals retained. No material4/browser/performance acceptance yet.

## 2026-11-07T15:35Z continuation

Verified the existing coordinators: renderer65141, pack71847 and shader preflight87615. The preflight was already started before this continuation; it is waiting for the shared lock and must not be duplicated. It builds an immutable pilot with the current packed atlases, checks GPU prewarming and exactly-once disposal, then tests six cancellation boundaries. Its result cannot accept the new R3 artwork. All108 completed R3 frames match their original Blender receipts and source1577ff08; the remaining three families still contain R2 receipts.

Lane A's15:30 scheduling answer says its current heldout shard will finish before allowing several B windows. Actual lock owner86483 and child86503 are alive; no process was interrupted. Node/pnpm, Blender and Playwright run natively on this Mac; no Docker process was observed.

The worst measured identity regression in material3 is Mallow3 versus Sorrel3:0.911424452→0.845767975. Soot3/Mallow3 and Mallow3/Inkcap3 follow. These are candidates for visual comparison after material4, not a reason to change the established measurement masks or thresholds. The strict no-pair-regression requirement remains a reported miss.
