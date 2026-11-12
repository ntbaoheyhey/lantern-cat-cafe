# Decisions

- 2026-11-13: User final decisions govern: free audio only (Session B); no Spine runtime, cut-out contract for all units; designer hand-authors mochi/soot/clover only.
- A3 and A5 pilot reviews are auto-approved by the user; self-score, gates and review copies remain required.
- Local CI only. No deploys, main merges, migrations or contract deployments. Work alone.
- No stopped-lane worktree is flagged prunable, so none meets the user cleanup predicate.

- R2: independent cut-out adapter supports the existing original region and weighted-mesh art with one draw per atlas; this preserves Mochi/Clover painted layers without re-splitting them or shipping the licensed runtime. Shared template authored in A5.

- A1 tuning: start positions produced 49–65% bounding-box overlap for large hats/wings and crowded the wave-3 rear bodies. Increase same-column foot step to .36 and move rear x to .16/.19, retaining .42 core height and a <=15% centre gap. Validate actual alpha occlusion as well as clipping; silhouette rectangles overestimate empty areas.

- A1 core review: teapot/helmet lids belong to the enemy head; only finials and crowns are excluded. Corrected initially over-tight enemy ROIs that enlarged their bodies. The manual semantic regions are committed and the alpha/scale check catches subsequent drift.

## A1 completion
- Dense formation tuned to front x=.36/.39, rear x=.16/.19; vertical step .37. Wide enemy silhouettes need more stagger than the starting sketch. Alpha-mask maximum occlusion 20.8%, no clipping in wave 1/3/boss. Bounding boxes overestimate wing occlusion.
- Updated obsolete 15% empty-box overlap assertion to the V3 dense contract. Actual alpha occlusion is captured separately; 387 battle tests and 10 browser tests pass.
- Full-body exclusion could suppress numbers; lower-body fallback lanes retain contact feedback below faces.
- Postprocessing 6.39.6 / quarks 0.16.0 installed for next cards.
