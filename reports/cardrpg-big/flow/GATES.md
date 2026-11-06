# F5 self-check
REFERENCE: ../memory/PROMPT.md lines110–118, PLAN.md

| Brief requirement | Status and evidence |
| --- | --- |
| Spotlight, dim uninvolved actors, target line before action | Implemented by the existing scene focus path. Natural starter screenshots show the acting ring and connecting line. Human role recognition remains a qualitative review item |
| Skill banner0.5–0.7s, icon/name and result chips | PASS pilot583.3–600ms. Corrected banner occupies the reserved caption row. Multi-hit totals use impactLabels and tick marks |
| One complete action before another, grouped round status | PASS focused model tests. Five pilot real-click runs show zero premature HP samples, gapMAX83.4ms and roundMAX400ms. Corrected runtime rerun pending |
| Calm camera, short skill push, larger ultimate/kill, chosen preset and reduced motion | Continuous sine envelope returns to zero. Three presets3240 sampled poses have0 overlap/crop/occlusion/missing plates after moving banner. Reduced-motion runtime probe pending |
| Basic1200/skill1800/ultimate2800/enemy1400ms including hit stop | PASS all gallery plan unit checks and five natural pilot replays with zero measured misses. Corrected x1/x2/x4 reruns pending |
| Inter-action250ms and round400ms maximum | PASS five pilot runs83.4/400ms. Corrected rerun pending |
| Skip immediately resolves to identical result | PASS five pilot replay comparisons, SkipMAX17.6ms. Corrected rerun pending |
| Typical chapter1 fight45–90s | MISS first-encounter samples9.307–16.226s across7–12 actions. Broader campaign and balance remain phaseI work |
| Low HP, clutch heal, last hit, boss phase, victory/defeat and reward beats | Implemented tint, bounded90ms saving-heal extension, death settle and result/reward entrance. Boss announcements are grouped with round transitions. Clutch and boss visual evidence pending |
| Alive hub/team/map and short page transitions | CSS breathing, map pulse,180ms page entrance,100ms button transitions. Richer 3D home/team presentation belongs to phaseM |
| Fight/Pause/Skip first visible reaction<=100ms | PASS pilot Fight67.8/Pause11.2/Skip17.6ms maxima includingCPU4. Corrected rerun pending |
| Reduced-motion respected | CSS animations disabled by saved preference and media query. Scene suppresses director motion. Runtime preference probe pending |
| Rerun F0 harness, avoid a new hitch | Pending corrected cold7,720 matrix and five profiles. Pilot banner capture and partial timing retained under pilot-banner |
| Typecheck, lint, unit, build, E2E before push | PASS corrected source1669 web/903 rules/421 E2E, typecheck/lint/build. ../validation/f5-corrected.json |

## Correction record
REFERENCE: pilot-banner/layout/measurements.json, layout/measurements.json, action-screens/checks.json

The first banner placement overlaps faces in22 of3240 poses, primarily Brioche and Biscuit. Moving it below the stage yields0 of3240 overlaps.18 natural anticipation/impact captures assert the same action identity, DOM HP equal to the visible snapshot and no horizontal overflow. The timing pipeline was stopped before the correction and its available raw files are retained.
