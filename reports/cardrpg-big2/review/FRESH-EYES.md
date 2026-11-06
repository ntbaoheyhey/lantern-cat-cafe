# Sequential visual review · Lane B
REFERENCE: ../cats/batch3/filmstrips; ../mechanics/browser-early; tools/cardrpg-big2/{MechanicsLab.tsx,lab.css}

This is the same agent reviewing in sequence, not an independent panel. These initial observations use actual captured artifacts. Final-build screenshots, x1 recordings and rescores are still required. Passing pixel/trajectory tests do not establish art quality.

## First-time player · preliminary
REFERENCE: ../mechanics/browser-early/1280-720-cpu1-prep.png; ../mechanics/browser-early/1280-720-cpu1-result.png

1. The master checkbox is isolated above its text because inherited column-label CSS wins. Fixed in the review source; final browser proof pending.
2. The completed result begins below the 720px viewport. Moved before preparation in the review source; final browser proof pending.
3. Disabled extra descriptions are too dim to explain the available choices. Preserve readable text while dimming only disabled controls.
4. The preparation footer exposes simulation jargon instead of explaining the experiment. Replaced with a short player-facing note; detailed numbers stay in the report.
5. Team names are a compact text selector rather than recognizable cat cards. Kept for this lab; it is a comparison tool, while the full team screen belongs to Lane A.

## Skeptical three-minute viewer · preliminary
REFERENCE: ../cats/batch3/filmstrips/{velvet-4,marigold-4}.webp; ../performance/async-opening/CHECKPOINT.md

1. Velvet is too small and dark in the rear row to read her expression at a glance.
2. Marigold’s bright group composition crowds the team at impact.
3. Cat silhouettes still share the inherited toy-like rig; props/eyes do not make nine wholly new sculpts.
4. Caster-cropped strips miss distant target impacts. Full-stage x1 recordings are queued; do not call crops complete fight evidence.
5. The promising 100ms opening sample has no margin and is not the exhaustive matrix. Keep that limitation visible.

## Art director · preliminary
REFERENCE: ../cats/batch3/filmstrips/{velvet-4,marigold-4}.webp; ../cats/batch3/effects/sheets/velvet-4.webp

1. Dark fur and rear-row scale reduce facial contrast.
2. Several glowing effects read as flat paper symbols; geometry uniqueness is not material richness.
3. Marigold’s bright watering motif loses internal shading at peak emission.
4. The caster crop visually stacks three heroes, limiting silhouette separation even where audited faces remain unoccluded.
5. Full-stage prop scale, ground contacts and chapter grades cannot be assessed from these crops. Inspect the B3 before/after frames before scoring.

## Motion and VFX director · preliminary
REFERENCE: ../cats/batch3/filmstrips; ../cats/batch3/motion/variety.json; ../cats/batch3/effects/uniqueness.json

1. Eight normalized samples prove pose changes but do not show real-time pacing; inspect x1 video.
2. A distinct joint trajectory can still share familiar pose language with another cat. Do not equate the threshold with character acting.
3. Velvet’s curtain theme reads in the isolated sheet but less clearly in the small rear-row crop.
4. Group effects need visual breathing room despite passing the face-mask budget.
5. Hit-stop and audio synchronization need final-build natural playback, not only fixture statistics.

## Corrections and remaining judgement
REFERENCE: tools/cardrpg-big2/mechanics-check.mjs; ../memory/STATE.md

The four concrete lab readability defects above are corrected in source and receive real viewport/alignment assertions on the accepted review artifact. No rules or defaults changed. Current nonstarter tier stays “improved”; no numerical art grade is assigned before the final images/videos are reviewed. Remaining art concerns must either be visibly corrected and remeasured or appear in the delivered limitations and self-grades.

## B3 image follow-up
REFERENCE: ../stage/life/{before,after}-1280-home.png; ../stage/life/after-chapter-2.png; ../stage/SHARPNESS-REVIEW.md

The stage is visibly populated with shelves, plants and tabletop props, but remains one broad flat tabletop with similar composition across chapters. Colours and ambient leaves distinguish chapters more than architecture. Contact shadows are now above the rug (0.044 world height versus rug top0.0425); the still frame remains subtle and the bright selection rings dominate. No high-quality contact-shadow claim is made from the geometry assertion alone.

Native face crops are readable at128px DPR2, but dark rear companions remain much smaller in the full stage. The 800×960 card render has enough pixels for362×290 DPR2 display; the card crop itself is short and compositionally different from F0. The rendering fixes do not deliver the requested eight remaining+40% metric gains. B and C preserve>8% stage margin; A misses it, and none satisfy the24–30% full-body band across poses.

## Lab polish browser result
REFERENCE: lab-polish/checks.json; lab-polish/1280-720-cpu1-prep.png; lab-polish/1024-600-cpu1-result.png

Four cases now verify the master checkbox at17×17px,10px text gap and zero vertical center offset. The result stays entirely visible at all three desktop sizes, including1024×600. The main account remains unchanged; natural playback and Skip end at the same hash45c71470. All extras start off. Sample playback MAX16.8ms, peak225draws/101,858triangles; no runtime errors. Viewed the1280prep and1024result: descriptions are readable and the outcome appears above preparation. Compact text team selectors remain an acknowledged lab limitation. This is the pinned polish artifact, not the later evidence-complete delivery bytes.

## Enemy batch 1 review
REFERENCE: ../enemies/e1/filmstrips/{enemy-button-guard,enemy-sock-skipper,enemy-spool-ram}.webp; ../enemies/e1/before/enemy-spool-ram.webp

Viewed all three signature strips and Spool Ram’s earlier strip. Button Guard’s bracing/button accessory and Spool Ram’s crouch/crank read more clearly; Sock Skipper has a legible hop/pocket motif but remains very small in the rear. Cream/white VFX still look like flat cutouts, and some target effects leave the caster crop. Keep all three at improved tier. Six rig clips/15required pairs and76effects/2850pairs pass their stated tests; neither establishes slice-quality acting or materials. Whole-page CPU4MAX116.7ms remains a miss even though postinteractiveMAX100ms in cold7 passes.
