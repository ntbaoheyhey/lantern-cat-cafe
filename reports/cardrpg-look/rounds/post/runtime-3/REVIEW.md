# L3 runtime round3 — visual continuation

Viewed actual1440x900-stage-1-wide from cee6234f at3.2s, same camera as round2. Broader foot contact is visible, Soot body/face separate from the teal mat, hero cheek planes retain form, no AO stipple on curtains, and foreground tea has restrained focus falloff. Review is a self-assessment, not full phase/performance acceptance.

Five remaining observations, CSS-pixel regions:
1. Soot feet x408–457/y679–707 now have a broad grounded shadow; the floor-wide directional gradient is still mild. Soft contact improvement is acceptable for this pass; no full shadow-map claim.
2. Soot eye/face x410–455/y623–659 remains clear without bloom/blur, but dark torso cloth x416–450/y660–686 still has less surface detail than the pale cats. Carry the material-detail limitation forward.
3. Foreground tea x1290–1425/y712–797 now softens subtly; not a cinematic large bokeh blur. This is intentional so the small desktop canvas stays legible.
4. Pendant paper x483–560/y311–347 remains close to uniform cream despite halo; it reads as light but lacks paper fibre at this size. Stage material issue persists; no clipped hero faces observed.
5. Shelf jars x357–567/y374–408 andx1080–1235/y375–411 repeat mirrored forms. L2 geometry repetition remains, cannot be solved by grading or vignette.

Round2 fixes1–3 are implemented: original atelier contact texture, stronger three-band form, nearer foreground focus transition. No new visible post artifact would block a pitch of this slice. The underlying remaining roster and skill effects are explicitly outside L3 and remain visibly weaker.

Provisional self-grades: lighting6.5, depth6.5, post7, focal hierarchy7, face clarity7.5, stage richness6.8. Fresh-eyes: first-time player can locate all three heroes; art director still sees jar symmetry and flat paper; VFX director needs L4 light/effect contact; skeptical three-minute judge should see a coherent slice, not be told the full game is finished.

Next: finish component ablations/metrics, incorporate accepted A shell, then actual three-size battle controls/cameras and five source gates. Keep rejected round1 AO and false-positive Sprite-geometry diagnostics intact.

Viewed the complete nine-view sheet after all captures finished. Chapter2 remains greener and chapter3 cooler without hiding faces. Component checks:36face samples/0bloom-or-focus offenders; High/Balanced/Low warmed GPU allocations remain123textures/552geometries/52programs. Whole-frame SSIM against same-name L2stage image .986779 /meanRGBdifference2.99665; this quantifies a restrained change, not a beauty score. Wide-frame projected-box separation: Mochi.14547/Soot.05061/Clover.19120. Soot still misses the.18proxy target; broad boxes include mat/background and are not semantic body masks.
