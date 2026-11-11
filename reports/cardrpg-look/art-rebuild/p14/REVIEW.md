# Spool Ram motion refinement

The saved before/after views show a clearer forward horn dip and planted feet at impact. The body leans while each hoof contact is counter-transformed; the tail recovers after the body. The original atlas, rig, scales, gameplay and HUD remain unchanged. No new draw call or texture is added.

Manual review covered the saved 16 paired poses at 1440×900 and 1280×720, including full-size impact frames. The horns, front-leg joints and tail remain coherent, with no exposed overlap seams. The change is deliberately restrained; there is still no hand-drawn expression set or independent hoof roll.

The existing run passed typecheck/lint and 19 focused tests. Eight natural x1 basic/signature casts include before/after and reduced motion; p95 is at most 16.8 ms, face/HP overlap is zero. Foot drift relative to the actor is below 5e-16 world units, main-hand socket error is zero, and reduced-motion rotations are zero. Five seeds/six modes/102 plans retain exact parity. Combined A6+B HTML is 38,176,310 bytes with 1,823,690 bytes headroom.

Motion self-score: 7.5 → 7.7; battle appearance/overall: 7.6 → 7.7. These are local visual judgments, not user approval or a roster-wide score increase. The rigid shared-motion limitation remains in the overall report.

The compact contact sheet and numerical summary derive from saved evidence; full stills and samples remain locally in attempt1. No completed gate was rerun for this review. Research check: planted contact and delayed recovery address the recorded secondary-motion gap without adding atlas cost; other shared profiles still need individually reviewed improvements.
