# L2 — original lantern café (source-bound verification complete)

Source cea0a9df4f24479b965ad926d09f9e0cd5d1740f, stacked on published L1 eb568fda. Candidate docs/cardrpg-look/index.html SHA256 dac82f01dfefe213fd24c23a1cab04fe785713060fcac70bc03e16264766abf2, 22,290,293 bytes. No gameplay or shared-screen changes.

The old plane/oval is replaced by a Blender-authored room: arched original night sky/bokeh, curtains, pendant paper lights, ceramics, books, cat tree, plants, stitched formation mats, foreground tea tables, steam/dust/shafts. Four Blender rounds and three actual runtime rounds were reviewed. Source tools and seeds are in tools/cardrpg-look/blender/stage.py and assets/provenance/look.md. Chapter palettes keep the hero colors stable. Battle HUD/order strip now use scoped teal/honey tokens.

| Evidence | Result |
|---|---|
| Stage model | 50,272 triangles, 4 meshes; 2048px color/AO/roughness/normal/irradiance |
| Three cameras × three desktop battle sizes | 9 frames; no head/foot clipping, overflow or browser errors |
| Sampled complete scene | 106 draw calls, 101,148 triangles; not a final peak matrix |
| Leave-table cleanup | 20/20 stage resources disposed in each of 3 cases |
| Decode-only pixel comparison | 18/18 captured PNGs byte-identical to visually reviewed runtime round3 |
| Five source gates | Typecheck/lint/unit/build/421 E2E passed on cea0a9df |
| A/B and cold/casts | 6A/B pass; cold7 nativeMAX33.4/CPU4MAX166.6ms;24castsMAX16.8ms/100%≤20ms/errors0 |

Three actual camera samples: [A](validation/l2/functional/1440x900-close.png), [B](validation/l2/functional/1440x900-wide.png), [C](validation/l2/functional/1440x900-far.png). [Before](validation/attempts/l2-before-bitmap/before/1440x900-stage-1-wide.png), [after](validation/l2/after/stage-1440-sheet.png). Review logs: rounds/stage/runtime-{1,2,3}/REVIEW.md. Metrics are in validation/l2/after/metrics.json; the camera angle changed between early rounds, so these are change diagnostics, not isolated quality scores.

The first candidate cold CPU4 maximum was 233.4ms, rejected. A source-bound trace isolated 175.762ms WebP decode inside GPU upload. HTMLImageElement.decode() alone still produced 199.9ms. ImageBitmap decoding before upload restored the two-case probe to native33.3/CPU4 133.3ms without reducing texture resolution. All rejected candidates/traces remain under validation/attempts/l2-before-bitmap. The complete seven-case retry measures nativeMAX33.4ms/CPU4MAX166.6ms. Its worst frame overlaps the real battle click:97.549ms event handling with38.164ms statistical samples in resizeToHost; this is the remaining constructor/resize work for L3, not the removed decode. See cold-batch-1/trace-attribution.json.

Self-grades: stage richness6.8, lighting/depth5.5, color/UI harmony7, cat quality7.5, effects5, sharpness7, post5. First-time player6.8 / art director6.5 / VFX director5 / skeptical judge6.5. Uniform lighting, repeated shelf spacing, weak Soot body separation and subtle contact remain; L3 is required. L2 is not whole-game look acceptance.

Open gates: exact startup byte parity (L1 +4 dormant preload bytes), CPU4 cold budget, final CPU4 Balanced/Low casts, final20-battle lifetime and one final25×86×10matrix. Shared App shell hides nav/top HUD during actual battle; A requestfad581cf remains open. Engine construction allocation request5e2cd90f is accepted for L3. Full portraits/icons/rarity plates await L6;9cats/10enemies/3bosses and skill VFX remain inherited.

Audit: validation/l2/checkpoint-audit.json verifies1,280source inputs, exactHTML/art/packing hashes and all phase receipts. Nativehub.908–.948s/battle6.497–6.623s;CPU4hub1.733–1.843s/battle8.631–9.125s. ColdMAX166.6ms remains a declared miss; no performance acceptance is inferred from passing casts.
