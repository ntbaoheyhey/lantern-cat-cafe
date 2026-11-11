# Inkcap lantern and tail refinement

Accepted attempt 2 after viewing the paired 16-pose sheet and full-size windup at both viewports. Inkcap now raises the lantern and opens the offhand during casting, with delayed head/tail response and a small curve along the existing tail mesh. The face, mushroom hat, coat and wrist joints remain clean. Tail movement is subtle and partly behind the party in this formation; it is not credited as a large spectacle improvement.

Attempt 1 passed numeric gates but lowered the right-hand lantern during windup. It remains a rejected local diagnostic. Reversing only Inkcap's prop/offhand signs fixes the actual art direction. The repaired main-hand socket lifts 0.06946 local world units at 38% in both sizes. Saved before frames and casts were reused for attempt 2 rather than rerendered.

Typecheck/lint and 22 focused tests pass, including cloned-material independence and the authored lantern socket's upward windup. Six before and six after natural x1 basic/signature/ultimate casts include reduced motion. There are no shader/page errors, face/HP collisions or out-of-bounds units; socket alignment error is zero. Reduced motion returns added rotations/bending to zero, and action-end tail bending returns to contemporaneous idle. Warmed p95 is at most 16.8 ms. Five rules seeds/six modes/102 plans retain exact parity.

Each actor has independent shader uniforms; cached shared geometry is never modified. The root has zero bend weight. No new atlas, rig, texture, draw call, game event or HUD change is introduced. Actual combined A6+B HTML is 38,176,938 bytes with 1,823,062 bytes headroom. Compact evidence derives from retained full local stills/samples.

Motion self-score 7.5 → 7.7; battle appearance/overall 7.7 → 7.8. These are agent visual judgments and do not raise the overall roster-motion category. Research check: authored direction must follow each painted prop's handedness; numeric socket alignment alone cannot prove a useful gesture. The next unrefined low-scoring unit is Sock Skipper.
