# F5 self-check
REFERENCE: ../memory/PROMPT.md lines110–118, PLAN.md

| Brief requirement | Status and evidence |
| --- | --- |
| Spotlight, dim uninvolved actors, target line before action | Implemented by the existing scene focus path. Natural starter screenshots show the acting ring and connecting line. Human role recognition remains a qualitative review item |
| Skill banner0.5–0.7s, icon/name and result chips | PASS corrected583.3–600ms. Corrected banner occupies the reserved caption row. Multi-hit totals use impactLabels and tick marks |
| One complete action before another, grouped round status | PASS focused model tests. Five corrected real-click runs show zero premature HP samples, gapMAX83.4ms and roundMAX383.4ms. runtime/summary.json |
| Calm camera, short skill push, larger ultimate/kill, chosen preset and reduced motion | Continuous sine envelope returns to zero. Three presets3240 sampled poses have0 overlap/crop/occlusion/missing plates after moving banner. Six saved/OS reduced-motion probes pass. controls/checks.json |
| Basic1200/skill1800/ultimate2800/enemy1400ms including hit stop | PASS all gallery plan unit checks and five natural pilot replays with zero measured misses. Corrected x1/x2/x4 runs pass, seed11 total9.306/4.664/2.346s |
| Inter-action250ms and round400ms maximum | PASS five corrected runs83.4/383.4ms |
| Skip immediately resolves to identical result | PASS seven corrected replay comparisons, SkipMAX14.7ms includingCPU4 |
| Typical chapter1 fight45–90s | MISS corrected first-encounter samples9.306–16.195s across7–12 actions. Broader campaign and balance remain phaseI work |
| Low HP, clutch heal, last hit, boss phase, victory/defeat and reward beats | Implemented tint, bounded90ms saving-heal extension, death settle and result/reward entrance. Boss announcements are grouped with round transitions. Clutch and boss visual evidence pending |
| Alive hub/team/map and short page transitions | CSS breathing, map pulse,180ms page entrance,100ms button transitions. Richer 3D home/team presentation belongs to phaseM |
| Fight/Pause/Skip first visible reaction<=100ms | PASS corrected x1 Fight66.9/Pause10.9/Skip14.7ms maxima includingCPU4. x2/x4 max17.2ms after Fight19.9ms |
| Reduced-motion respected | CSS animations disabled by saved preference and media query. Scene suppresses director motion. Six complete-pose runtime comparisons pass with saved and operating-system preference |
| Rerun F0 harness, avoid a new hitch | Cold7 complete, nativeMAX33.3–50.1ms andCPU4 MAX216.7/250.1ms. CPU4 opening gate100ms MISSED.720 matrix and five profiles complete. PageMAX300ms is33.3ms above F4. CastMAX33.4/16.8ms passes50ms. PERFORMANCE.md records the missed gate. Pilot banner capture and partial timing retained under pilot-banner |
| Typecheck, lint, unit, build, E2E before push | PASS corrected source1669 web/903 rules/421 E2E, typecheck/lint/build. ../validation/f5-corrected.json |

## Correction record
REFERENCE: pilot-banner/layout/measurements.json, layout/measurements.json, action-screens/checks.json

The first banner placement overlaps faces in22 of3240 poses, primarily Brioche and Biscuit. Moving it below the stage yields0 of3240 overlaps.18 natural anticipation/impact captures assert the same action identity, DOM HP equal to the visible snapshot and no horizontal overflow. The timing pipeline was stopped before the correction and its available raw files are retained.
