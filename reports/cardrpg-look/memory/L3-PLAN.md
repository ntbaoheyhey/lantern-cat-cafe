# L3 preparation after L2 source freeze

L2 after dac82f01 preserves all 18 PNG bytes from runtime round3/440d3cb7. No recapture or re-review duplication needed for the decode-only change. Full phase gate/cold coordinator23426 is still running; do not edit source inputs before its audit/publication.

Actual viewed image: rounds/stage/runtime-3/1440x900-stage-1-wide.png. Five next defects (CSS pixels): Soot lower body x397–452/y638–703 has weak separation; wall/shelf x345–1260/y315–500 is uniformly lit; feet x390–665/y570–700 lack directional contact; foreground table lower-right equally sharp as faces; top lamps pale silhouettes without a surrounding halo.

L3 owned scope: scene.ts/loading.ts/chapter-stage.ts construction batches (A request5e2cd90f); optional look-post.ts and original LUT author; card-lighting.ts/card-surfaces.ts material/rim/fill; owned reports/metrics. Keep old look rendering branch unchanged. Shared shell requestfad581cf remains A's.

Prepare renderer as first construction slice, then resources/post, lights, rings, VFX, stage; await loadingFrame between slices and check disposed after every boundary. Register ownership incrementally so partial cancellation does not leak. Classic stage/decorator must yield between prop groups/chapters while keeping sync caller API where required. Never move asynchronous failures out of warmModels catch.

New opt-in post: depth-aware SAO/contact, threshold/knee selective bloom, generated16-cube per-chapter LUT, gentle background DOF with face protection, distance-aware depth outline, subtle grain/vignette, SMAA High / sampled Balanced / baked Low. Prewarm all allocations/programs before ready and record tier transitions. Preserve canvas-only effect, DOM HUD crispness and classic toggle. Keep draw≤250 and triangles≤150k including post/shadow work; no doubling full-resolution geometry for shadows.

Three actual before/after review rounds with exact camera/time, face-mask bloom/DOF checks and low/medium/high comparison before fresh phase gates. Four lens rubric honest. Seven cold opens and24hero first/repeat casts only at accepted L3 source. CPU4 Balanced/Low targeted checks now useful; final fullmatrix and20battle test reserved for L7.

Latest L2 CPU4 trace:166.6ms frame at2310.4, click97.549ms inclusive,38.164ms statistical leaf in resizeToHost. Defer first resize and ResizeObserver handling through loadingFrame as well as constructor allocations. Source evidence validation/l2/cold-batch-1/trace-attribution.json.
