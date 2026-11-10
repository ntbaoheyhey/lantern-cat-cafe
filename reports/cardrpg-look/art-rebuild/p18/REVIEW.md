# Cinnamon serving-tray refinement

Accepted attempt 1 after reviewing 16 paired poses and full-size 1440×900/1280×720 battle frames. Cinnamon lifts the left serving tray and raises the right cup slightly, with a delayed head/tail response. The tray/hand joins and robe remain continuous; the cup does not hide the face. The gesture is small and appropriate to the painted props; it is not a new pouring animation or a large spectacle gain.

The actual tray socket lifts 0.0380645 local world units at the casting hold. Typecheck/lint and 24 focused tests pass. Twelve natural x1 before/after basic/signature/ultimate casts cover reduced motion; no page/shader, face/HP, bounds or socket failures. Warmed p95 stays at most16.8ms. Reduced motion removes the added transforms; tail motion returns to the current idle value at action end. Five rules seeds/six modes/102plans preserve exact parity.

The preview uses pinned A6 e94713b8be307350ab6035e7f9fec445992a86c6. Its initial build missed new guide/settings imports because A6 advanced beyond the journal-only snapshot; refreshing all changed A6-owned cardrpg files fixed the disposable preview. Passed24tests were reused, and neither A6's worktree nor A6-owned files in the published B branch changed. Paired before/after artifacts share the same refreshed shell.

Combined after artifact38,185,046B, headroom1,814,954B. All atlas/rig/geometry assets and draw calls are unchanged. The evidence budget gained430,268B by removing whitespace only from three old JSON receipts; every parsed value and every image is retained, with original formatting archived outside Git. See evidence-budget.json.

Motion self-score7.5→7.7; battle appearance/overall stay7.7. Whole-roster motion remains7.5. Research recheck: individual prop handedness and countergesture are useful, but a long floor-touching staff needs a different contact constraint; Sorrel is the next remaining7.7/7.5row.
