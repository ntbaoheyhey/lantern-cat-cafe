# Clover teapot lift and pour

Accepted the first candidate from 16 paired poses at 1440×900 and 1280×720 plus the full battle frame. Clover lifts the original glass teapot during charge, tips its spout at the release beat, then settles with a free-arm brace and delayed head/tail response. The glass silhouette, collar, sleeve and feet remain coherent. Motion self-score rises from 7.5 to 7.7; overall stays 7.8. The tea painted inside the pot is not a fluid simulation.

The held pot angle is +0.15 radians at 28% of the action; the actual mainHand socket rises 0.035995 local units. The pot tips to -0.22 radians at 52%, when the original effect leaves its socket. Before and after use the same refreshed A6 shell (5badf4428c41c694d2ff0ac936b7ba27b33c22d9), camera and fixed time. Nine A6-owned files were copied only into the authorized disposable preview, with their previous versions preserved; the B branch contains no A6 merge. Source receipt: preview-source.json.

29 focused tests, typecheck/lint and five-seed/six-mode/102-plan parity pass. The 16 paired poses and 12 natural x1 basic/signature/ultimate casts include reduced motion, with zero page/shader, socket, face/HP or bounds failures. Reduced motion remains still and the tail settles to its current idle curve. Warmed p95 is at most 16.8 ms. The original rig/atlas, portraits, geometry and draw count remain unchanged.

The actual current A6+B artifact is 38,193,062 bytes, with 1,806,938 bytes headroom under 40 MB. B embedded assets remain 23,549,548 bytes. Full captures/samples are retained locally and in ~/art/look-v3/p24/attempt1; compact evidence enters Git. The original P4 source comparison remains valid.

Research recheck: a prop-specific two-beat curve provides a clearer action than simply increasing the shared rotation. Preparing Panko exposed an existing rolling-pin partition across head/body/arm, so the next refinement must make that original prop coherent before any larger gesture. No Panko asset/runtime changes are included here.
