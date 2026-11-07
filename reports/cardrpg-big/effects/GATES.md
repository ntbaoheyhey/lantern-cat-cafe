# F4 slice self-check
REFERENCE: ../memory/PROMPT.md lines101–108, PLAN.md, README.md

| Brief requirement | Status and evidence |
| --- | --- |
| Effect grammar and at least30 reusable primitives | PASS implementation,40 primitives with original procedural provenance in assets/provenance/cardrpg-big-effects.json |
| Unique effects for every skill, ultimate, passive and enemy | PASS starter31 compositions, remaining roster pending checkpoint. Three ultimates are included in the12 existing starter slots |
| Shape, palette, rhythm and camera identify each skill | PASS numerical identity465/465 pairs, minimum0.542308. Artistic quality is a separate self-grade |
| Distinct element hits and face-safe status ambient effects | PARTIAL starter element compositions and six existing statuses. Wider elements and roster pending |
| Damped camera beats,60–110ms heavy-hit stop, kill/ultimate slow motion, crit flare, edge tint, legible numbers | PARTIAL inherited post/camera and authored timing. Kill slow motion, crit flare and number aggregation need F5 verification |
| Bespoke skippable ultimate moment1.2–1.8s per cat | Starter duration unit checks PASS, three distinct portraits. Runtime controls PASS, remaining cats pending |
| Bloom, chromatic impact, vignette, distortion, grade and High/Medium/Low | Implementation retained. Runtime124/124 tier cases PASS, including SwiftShader Low and synthetic degradation |
| Faces and HP readable, capped particles and overdraw | PASS six-frame face-delta gate after15 pilot failures. Peak36/96 instances and16/24 overdraw. HP plates are DOM overlays. Initial1/16 panel overlaps retained in pilot receipts. Final3240 poses have zero overlap/crop/occlusion/missing plates |
| Six rendered frames, grayscale/edge/motion matrix, structural signature, every pair over threshold | PASS186 frames/465 pairs. All signatures differ, zero empty effects. Raw masks, edges and NPZ retained |
| Gallery embedded in offline demo |31 six-frame sheets and controls wired. Built-artifact preview,0.25×, effect-only, return and skip clicks PASS |
| Synthesized layered sound | PARKED until after F5, existing local synthesized audio retained |
| Rerun F0 harness and avoid new hitches | PASS measurement720/720 and five profiles, castMAX33.4/16.8ms. FAIL CPU4 openingMAX266.7ms>100ms. Whole-page maximum improves from F3's566.7ms. PERFORMANCE.md |
| Typecheck, lint, unit, build, E2E before push | PASS final narrow-panel run1661 web/903 rules/421 E2E. ../validation/f4-final.json |
