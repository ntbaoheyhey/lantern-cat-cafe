# Browser pilot 2 — matched camera, old pilot artifact

REFERENCE: captures.json; comparisons/*.png; source artifact db1e66a8

Viewed all three matched-camera comparison PNGs directly. This artifact predates the latest author corrections and is a diagnostic pilot, not L1 acceptance.

1. Generic runtime equipment covers the new cloth and props: Mochi x675–790/y336–455 on the comparison; Soot x689–787/y351–473. The large flat tabards still dominate the body. Fix the atelier equipment representation in the owned gear renderer while retaining equipment identity.
2. Clover has two extra leaf horns (x710–780/y93–119) and the older flask silhouette in this stale packed export. Repack the current models after Clover4 finishes; compare hashes.
3. Clover is caught in a compressed expression (eyes y171–190); fixed-time portrait sampling needs a neutral expression, while skill-pose captures must retain real expression. Do not call a blink/idle sample a missing-eye defect.
4. Classic and atelier backgrounds differ by intended palette, but full projected bounding boxes include HUD/range-slider rows. Restrict visual comparison crops to the canvas for the checkpoint; existing pixel metrics retain their stated box-proxy limitations.
5. Atelier silhouette is rounder and eyes have an iris/sclera read; overall fur still looks flat in the game shader compared with Cycles. Inspect after clearing equipment occlusion, then tune ramp/light ratio. No visual clearance claim from these three idle stills.

Worst three actions: preserve sculpted body by replacing oversized atelier gear overlays with small fitted accents, repack current author exports, clamp comparison crops to the actual canvas.
