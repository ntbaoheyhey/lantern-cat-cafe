# QR pilot 1 — REJECTED

Isolated Soot basic and ultimate using production CutoutMesh and original art. This is not wave1/wave3/boss fixture coverage. No production battle route was changed. All nine recorded-frame sheets were viewed, not sampled. See viewed.json. Score: 4/10; no acceptance claim.

| Time | Actor / action | Anticipation, contact, shape, recoil observed | Heard at impact |
|---|---|---|---|
| 2.000–2.800 s | Soot / basic | Lantern rises f63–66; tapered comet f69–70; guard flash/recoil f71–72; settles f78–84. | UNVERIFIED |
| 4.500–6.700 s | Soot / ultimate | Local banner f138–153; lantern arch and ribbons f159–168; contact fan/recoil f169–174; fragments f186–195. Near-side contact occurs too early. | UNVERIFIED |
| 8.500 s | Soot / isolated hit | Recoil/settle f258–267; labelled study reaction without another attacking actor. | UNVERIFIED |
| 10.800 s | Guard / death | Fade f330–351; fragment detail too faint. | UNVERIFIED |

| Defect question | Verdict / frame evidence |
|---|---|
| Camera moved or zoomed? | No; window posts/floor stable throughout basic f51–99 and ultimate f135–201. |
| Any unit facing away? | No in final recording; guard mirrored toward Soot, idle f0 and contact f71. Earlier preview was wrong and was corrected. |
| Units same scale? | Close, not an all-unit certification: seek opaque heights 240–248 and 234–248 px; idle f0–54. |
| Shaped strike or glow blob? | Shaped; comet, lantern arch, ribbons and directed splinters f70/174. Ultimate is still too thin/flat. |
| Pasted PNG impression? | Reduced but still present at small scale: torso/arm/tail articulate f66/78; death fragments fail f342. |
| Text overflow? | None at 1280, banner f141; 1440/390 unverified. |
| Number clutter? | None; pilot has no damage numbers, so this does not certify battle numbers. |
| Sound without matching action? | Listening unverified; all scheduled pilot cues have named visual causes. Standalone hit is a study event. |
| Faces obscured? | Yes; target flash f71/72 and f169 washes out detail. FAIL. |

60 s unmodified WebAudio output is mix.wav: -24.53 integrated LUFS, -10.52 dBTP, maximum 2 simultaneous voices in 100 ms samples. Waveform contact offsets are 19.23 ms basic and 2.54 ms ultimate against the displayed flash; this does not certify listening or earlier geometric contact. No normalization applied. The loudnorm output_* fields are hypothetical filter output, not measured delivered audio.

Capture limitation: concat-JPEG default input timebase quantizes frame durations. Pilot 2 will directly resample actual compositor timestamps to an explicit 30 fps image sequence. Retain this recording unchanged; do not silently correct its evidence.

## Quality bar, every row

| ID | State | Frame / evidence | Observation |
|---|---|---|---|
| B01 | PASS | basic-01.jpg f60–84 | Basic envelope spans 800 ms; no approach. Codec sampling can shift an edge by a frame. |
| B02 | PASS | basic-contact-01.jpg f71 | First visible target flash/contact at 2.367 s, 367 ms after start; within 33 ms. |
| B03 | OPEN | basic-01.jpg f60/63/66 | Wind-up changes silhouette, but this 10 fps strip alone cannot prove four distinct 30 fps preparation frames. |
| B04 | PASS | basic-01.jpg f60/66/69 | Lantern arm rises separately from torso; head counters torso lean. |
| B05 | PASS | basic-01.jpg f63/69/72/75; measurements.json | Glint, comet, directed contact star and ground flecks have separate masks and visible roles. |
| B06 | PASS | basic-contact-01.jpg f70/71; basic-01.jpg f66 | Four-point glint, tapered comet and asymmetric contact splinters are different contours. |
| B07 | PASS | basic-peak-mask.png; mask-measurements.json | Peak rotational IoU 0.353; long directional tail, not a circle. |
| B08 | PASS | basic-contact-01.jpg f70/71 | Recipient recoil/flash begins on the contact frame. |
| B09 | PASS | basic-contact-01.jpg f71/72; measurements.json f71/72 | Both poses held for the 66.667 ms contact interval; seek samples confirm the pose times stop. |
| B10 | PASS | basic-contact-01.jpg f71/72/73 | Two bright target frames; viewport never whites out. |
| B11 | OPEN | basic-contact-01.jpg f71; audio-measurements.json | Waveform transient measured separately; codec timestamp precision needs correction before certifying sync. |
| B12 | OPEN | pilot.webm 2.000–2.600 s; mix.wav | No listening capability established. No heard-sound verdict claimed. |
| B13 | PASS | basic-01.jpg f60–84; measurements.json | Ranged caster root x remains 245; no lunge or approach. |
| B14 | PASS | basic-01.jpg f60/84/87 | Feet return to the same floor anchor after the 800 ms envelope. |
| B15 | FAIL | basic-contact-01.jpg f71/72 | Whole-body flash washes out the guard face; face protection must apply to hit tint too. |
| B16 | PASS | basic-01.jpg f63–84; basic-contact-01.jpg f69–75 | Preparation/travel/residue ease; only the labelled contact accent is abrupt. |
| B17 | PASS | basic-contact-01.jpg f69/70/71 | Comet travels from lantern to shield, readable at strip scale. |
| B18 | PASS | basic-01.jpg f51–99 | Window posts/floor anchors stay registered; no shake. |
| U01 | OPEN | ultimate-02.jpg f198/201/204 | 2200 ms recipe confirmed; recorded edge needs a corrected timestamp quantizer to certify +/-33 ms. |
| U02 | FAIL | ultimate-01.jpg f153/156/159 | Focus/banner fades through 900 ms instead of ending by 600 ms. |
| U03 | FAIL | ultimate-contact-01.jpg f165–169 | Ribbon tip reaches the near side of the target before the scheduled center contact. Geometry must target the contact surface. |
| U04 | FAIL | ultimate-01.jpg f138/141 | Non-caster uses opacity, which shows background through the body; this is not a 45% brightness grade. |
| U05 | PASS | ultimate-01.jpg f138/141/144 | Dim field, gold caster rim and nearby name banner visible. |
| U06 | PASS | ultimate-01.jpg f150/156/171 | Raised lantern wind-up and forward release differ; feet stay in place. |
| U07 | PASS | ultimate-01.jpg f141/159/168/174; ultimate-02.jpg f186 | Focus lantern, arch, ribbons, directed fan and falling residue all visible with separate masks. |
| U08 | PASS | ultimate-01.jpg f165/174 | Hanging lantern shapes, long ribbons and pointed contact fan are distinct contour families. |
| U09 | FAIL | ultimate-peak-mask.png; mask-measurements.json | Full-resolution peak area 0.178615, below 0.25. Threshold sensitivity 0.174659–0.180164 does not rescue it. |
| U10 | PASS | ultimate-peak-mask.png | Rotational IoU 0.241, well below 0.8; clearly directional. |
| U11 | FAIL | ultimate-01.jpg f168/174 | Theme is identifiable as lantern procession, but thin flat ribbons do not yet read as a strong ultimate. |
| U12 | PASS | ultimate-01.jpg f156–174 | Arch/ribbons visibly originate at the caster lantern and extend to the recipient. |
| U13 | FAIL | ultimate-contact-01.jpg f165/169 | Reaction follows the center marker, later than the first near-edge contact. |
| U14 | FAIL | ultimate-contact-01.jpg f165–170 | Pose hold is 66.667 ms at the scheduled marker, not at the early geometric contact. |
| U15 | PASS | ultimate-contact-01.jpg f169/170 | Local target flash is brief; no full-frame whiteout. |
| U16 | FAIL | ultimate-contact-01.jpg f169 | Hit flash removes facial detail even though effect geometry draws behind actors. |
| U17 | OPEN | ultimate-contact-01.jpg f169; audio-measurements.json | Waveform and visual-frame clocks recorded; capture quantization and early geometric contact need correction. |
| U18 | OPEN | pilot.webm 4.500–6.700 s; mix.wav | Callout/cast/contact/tail exist in output, but they have not been heard. |
| U19 | PASS | ultimate-peak-mask.png; mask-measurements.json | Mean saturation 0.3873 exceeds 0.3099, 80% of the approximate reference median. |
| U20 | PASS | ultimate-peak-mask.png; mask-measurements.json | p95 linear luminance 0.8362 exceeds 0.7932, 80% of the approximate reference median. |
| U21 | PASS | ultimate-01.jpg f156–183; ultimate-02.jpg f186–201 | Shapes grow and fade; intentional contact accent aside, no one-frame disappearance seen. |
| U22 | PASS | ultimate-01.jpg f135–183 | Same floor/window registration; no plate, cut, zoom, pan or approach. |
| U23 | OPEN | ultimate-01.jpg f141 | 1280 banner fits and avoids faces; 1440 and 390 still need explicit inspection. |
| U24 | PASS | ultimate-02.jpg f201; hit-01.jpg f255 | Ultimate completes before next standalone reaction; no overlap. |
| C01 | PASS | idle-01.jpg f0/24/48 | Soft ground shadows stay beneath both units. |
| C02 | PASS | idle-01.jpg f0–54; measurements.json | Opaque height spans 240–248 px for caster and 234–248 for target, exceeding 1.5% motion amplitude. |
| C03 | PASS | idle-01.jpg f0/24/48 | Guard and Soot rise/settle at different phases. |
| C04 | PASS | idle-01.jpg f0/24/48; basic-01.jpg f66/78 | Tail tip and lantern arm lag torso; motion is not a single image translation. |
| C05 | PASS | basic-01.jpg f60–84 | Feet stay at floor while torso compresses and lantern lifts. |
| C06 | PASS | basic-contact-01.jpg f71–75; hit-01.jpg f258/261/267 | Recoil, squash and return visible; standalone hit is a labelled study event. |
| C07 | FAIL | death-01.jpg f330–351 | Fade is continuous but separated fragments are too small/faint to read at the review scale. |
| C08 | PASS | idle-01.jpg f0 | Warm original highlights belong to cafe lighting; coat/armour retain hue and painted shading. |
| C09 | PASS | ultimate-01.jpg f141/174 | Gold rim follows local contours; no large unit glow disk. |
| C10 | PASS | idle-01.jpg f0; basic-contact-01.jpg f71; death-01.jpg f333 | Soot lantern/face point right; mirrored guard shield/face point left in sampled states. |
| C11 | PASS | basic-01.jpg f66/72/78; ultimate-01.jpg f150/171 | No detached joints, inverted limb or duplicate facial feature observed in these key poses. |
| C12 | FAIL | basic-contact-01.jpg f71; ultimate-contact-01.jpg f169 | No external overlap, but the local hit tint itself washes out target facial detail. |

## Honest comparison with the reference

1. B01 reference n4–7 separates wind-up/contact/reaction more forcefully than our basic f66–72.
2. Our planted caster meets the user decision; reference walk-up is not copied.
3. The comet is directional but almost disappears in 320px strips; the reference contact star remains obvious.
4. Reference U01 n12–19 has crisp shape changes and pressure on the recipient; our ribbons change too little once extended.
5. The lantern theme is original and legible, but the arch presently looks decorative rather than forceful.
6. Our ultimate mask covers 17.86% of the frame, below the 25% minimum; no measurement can call it strong yet.
7. Original painted motifs help integration; flat procedural ribbon edges still need brush texture and contour variation.
8. Static camera and local banner make the battle readable; the focus fade currently lasts too long.
9. Our target flash erases the face, and the death particles are too faint. Both are defects even when timing metrics pass.
10. Reference and pilot audio have not been heard. Waveform alignment is useful evidence, never a listening verdict.

Next method: block a broad lantern canopy as a grayscale silhouette first, target the near-side contact surface, protect faces from hit tint, and use opaque brightness grading. Build larger visible fragments from actual original body pixels. Keep every threshold.
