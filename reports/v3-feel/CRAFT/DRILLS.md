# Apprenticeship drills

No production effect work has started. Only completed, reviewed revision rounds may count toward a drill. Raw films and private reference comparisons remain local.

| Drill | State | Before / after | Rows / next decision |
|---|---|---|---|
| D1 erosion | PASS on B16/U21; production C07 OPEN | [D1 r0/r1/r2 strip](../REVIEW/Q3.A/D1.jpg) | B16/U21: r1 + refined r2 reviewed; C07 actual death remains OPEN |
| D2 arc/UV flow | PASS, isolated technique after r1/r2 | [D2 r0/r1/r2 strip](../REVIEW/Q3.A/D2.jpg) | B06/B07/B17/U08/U12; production timing/composition not claimed |
| D3 stretched sparks | Not started | Pending | B05/B06 |
| D4 flipbook | Not started | Pending | B16/U21 |
| D5 blend/readability | CPU method compared; drill not started | raw/blend-comparison.jpg / pending | B15/U16/C08; no moving-pixel PASS |
| D6 anticipation/contact | Not started | Pending | B03/B04/B08/B09/B10 |
| D7 deformation/overlap | Not started | Pending | C02–C06/C11 |
| D8 grounding/light | Not started | Pending | C01/C08/C09 |

## D1 baseline r0

The live shader ran without page errors and used the same Soot source as Q2. Direct canvas recording reports 1280×720 at 30 fps; a two-second recording interval produces a 1.966452-second container (one-frame boundary qualification retained). All 20 10-fps samples in sheet.jpg were inspected, row-major at 0.0–1.9 s. The lantern is already almost fully present by 0.1 s, remains a static hanging illustration through about 0.6 s, then separates into several chunks at 0.8–1.3 s. The last quarter is empty. This demonstrates erosion, but the temporal progression is not yet authored well enough.

What the reference U06 does that this baseline does not (private U06-overview.jpg, n0–19; observed pixels only, no claim about its shader implementation):
1. The summon opens its wing silhouette during n11–16, so it visibly develops instead of simply appearing as a complete illustration.
2. The small preceding highlights, large contact flare and coloured body have different lifetimes; our reveal brings every painted feature in together.
3. Narrow coloured trails remain after the contact flare; our last separated lantern fragments disappear with little directional follow-through.

Reject the reference's whiteout and obscured face. For this erosion-only drill, revise the reveal and threshold spacing first: a painted-region percentile mapping should distribute spatial change through the entire lifetime. The later D4/D7 drills own the full summon/character shape animation. Do not claim the whole ultimate method passes from D1 alone.

## D1 revision 1

Percentile-spaced thresholds, a 430 ms masked reveal and 1540 ms erosion replace the baseline plateau. The 498,544-byte film has zero page errors, 121 draw samples and 30 fps at 1280×720; container duration 1.964008 s is retained exactly, from the unchanged two-second recording interval. All 20 full and cropped 10-fps cells were inspected. Entry/exit adjacent frames were also inspected in raw/D1-r1/boundaries.jpg (first 10 and last 10 captured frames).

At 0.1 s only the right/bottom paint fragments are present; the larger crown and centre lantern assemble across 0.2–0.4 s. After 0.5 s the left edge breaks apart progressively. The right lantern persists until about 1.9 s. This removes the baseline's blank last quarter. The lamp still looks like paper being cut away: tiny detached islands do not drift and the largest surviving piece has little directional follow-through. B16/U21 entry/exit mechanism is improved; no complete D1 PASS yet. C07 remains unproven on an actual death.

Private reports/v3-feel/ref/Q3.A/D1-r1-matched.jpg uses fixed crops with the main painted shape height matched to approximately 140 px; source timestamps are labelled. This is phase comparison, not timing equivalence to x3 footage.

What the reference does that r1 does not:
1. U06 58.3–58.4 s raises and opens the silhouette; r1 only reveals stationary regions.
2. U06 58.5–58.7 s separates a brief core from the surviving blue body; r1 has one contour lifetime.
3. U06 58.9 s extends narrow wing/tail shapes beyond the central mass; r1's remaining tiny fragments are motionless.

Keep the progressive threshold method. For r2, release small original-paint bands from the eroding edge, offset them along an upward/outward direction and let their value fall before alpha ends. Reject the reference whiteout, which hides faces. D1 only establishes erosion mechanics; the summon pose/shape problem belongs to D4/D7 and the pilot.

R1 direct GPU check: peak 34,805 alpha-support pixels at 433.33 ms, maximum change 12.69% of peak per 30-fps sample (entry), nonzero support 33.33–1966.67 ms, exactly zero at 2000 ms. This is deterministic pixel sampling, not a measured video onset.

## D1 revision 2 initial trial — REJECTED

All 20 filmed samples and the rigid/released four-phase comparison were inspected. Released bands move: isolated alpha centroids travel 19.51–36.34 px between 100 and 300 ms age, whereas rigid translation keeps the whole remainder together. But the narrow noise band is a contour, so its pixels form thin wire loops, especially 0.8–1.4 s. Motion alone is not a quality pass. Reject these particle shapes. Preserve the film/receipt locally until the refined r2 result is reviewed.

The initial r2 authoring interval was 51.28 seconds. It is preserved under rejectedSteps, receives no authoring/revision credit, and must be redone. The interrupted 58.37-second baseline review is likewise retained there; the resumed baseline review replaces it. No elapsed pause is credited as authoring.

Next method: small filled chips cut from our own paint around opaque interior pixels, with triangular geometry, independently staggered release and finite drag/colour decay. Avoid outlining an entire noise contour. B16/U21 remain the direct D1 rows. C07 is a production death requirement: the earlier D1 mapping was a mechanism reference, not evidence that a lantern dissolve proves unit death. C07 remains OPEN for the actual unit death review.

Ledger correction: the baseline matched-comparison preparation also lasted only 59.26 seconds. It is preserved as a third rejected interval; the later full r1/r2 comparison/measurement blocks redo that work and meet the one-minute floor. The accepted step list excludes these rejected intervals without deleting their history.

## D1 refined revision 2 — erosion mechanics accepted

The final r2 film is 499,514 bytes, 60 frames at 1280×720/30 fps, 1.965738 s container duration from the unchanged two-second recording interval. Zero page errors; 121 draw samples. Source SHA-256: bd90b7f7eba29e06daf821c52db1e3c972e6f60cfac3531bdf0a146d15848243.

Reviewed all 20 10-fps cells in raw/D1-r2/detail.jpg, all first/last ten adjacent frames in boundaries.jpg, the four-phase rigid/chip comparison, and the five-phase fixed-scale private reference. The right/bottom paint starts in fragments across 0.03–0.2 s, the canopy assembles through 0.4 s, and left/centre breakup advances through 0.5–1.6 s. Small filled chips separate upward from the canopy/lamps around 0.6–1.7 s; they replace the rejected wire contours. The last right-hand fragment shrinks over multiple late frames. There is no whole-picture switch or opaque-rectangle edge.

| Direct D1 row | Verdict | Frame evidence |
|---|---|---|
| B16 | PASS, isolated erosion layer | boundaries.jpg first 10/last 10 cells: gradual spatial entry/exit across multiple 30-fps frames, no unlabelled one-frame switch |
| U21 | PASS, same layer mechanism | detail.jpg cells 0–4 build, 5–19 break up; endpoint GPU sample is transparent |
| C07 | OPEN, production requirement | No actual unit death is shown by this lantern exercise; no death PASS is claimed |

Q3-X04 (chip-motion-study.json): seven chips retain measurable alpha at both 100 and 300 ms age, with centroid displacement 20.68–34.71 px; chip 5 has already eroded at 300 ms, so its displacement is null, not a fabricated zero or pass. Pixel lifetime sample: peak 34,805 pixels at 433.33 ms, max 30-fps support step 12.69% (entry), support through 1966.67 ms, zero at 2000 ms. These are exact-time GPU samples, not independent movie-clock confirmation. The source-over filled-chip method is selected; rigid whole-picture drift and contour wires are rejected.

What the master still does that this drill does not:
1. U06 58.3–58.4 s changes the summon pose; D1 only establishes spatial reveal/erosion. D4/D7 and the pilot must supply pose/shape development.
2. U06 58.5–58.7 s has separate body, contact core and trails. A single-layer drill does not prove the five-layer ultimate composition.
3. U06 58.9 s has longer directed follow-through. D1 uses sparse paint chips; D2/D3 must establish directional energy and richer fallout.

D1 is accepted only as an isolated erosion move with two valid reviewed authoring revisions. Q3.A remains OPEN until D2–D8 and the item-wide craft-time gates pass. This is not approval to change production effects. Mechanism self-score: 7/10; no battle-quality score is raised.

## D2 baseline r0

All 20 filmed phase cells reviewed (0.0–1.9 s), plus the five-phase private B06 comparison. Film: 483,896 bytes, 60 frames, 1280×720/30 fps, 1.966222 s container from the unchanged two-second recording interval; zero page errors, 121 draw samples. The blade grows from the caster side at .2–.4 s, bends across the field at .5–.9 s, then hangs near the sentinel at 1.0–1.4 s. A thin lower ribbon is visible by .6 s; the small cream lance appears at .7–1.0 s but is weak. The thick shape has a soft airbrushed edge and little weight contrast with its trailing ribbon. B17 source-to-target direction is visible, but the exercise is not accepted yet; B06/B07/U08/U12 need stronger contour hierarchy and explicit mask evidence.

What the reference does that r0 does not:
1. B06 around 29.15 s uses a broad outer blade and two thin inner strands with distinct edge/value widths. Our main blade is thin and nearly uniform in weight.
2. Around 29.25 s a lance briefly dominates; our cream lance is faint and disconnected from the curved energy's leading point.
3. By 29.45 s the crescent has cleared and a narrow horizontal residue remains. Our arc stalls at the target for several samples before fading.

Reject the reference's walk-up and whiteout. Its x3 recording does not set the x1 clock. The first private matching crop overestimated the body match: the central performer's painted helmet-to-boot landmark is approximately 260px at source width 1280, not the 150px estimate. Correct the fixed reference scale using that landmark against the sandbox's approximately 194px body; retain the first receipt as rejected. Approximate reference landmark uncertainty is 15px because attachments overlap. No reference pixels enter assets.

Revision decision: use the X05 arc-length parameterization; author a wider, uneven violet blade with a narrow warm leading lip, a clearly thinner ribbon, and a tapered lance with its own silhouette. Couple the final trail clearing to head travel. Source: LEARN/Q3.md D2, Q3-T17/T18/T20 and X05. Two-second technique timing remains separate from the production 800ms basic envelope.

## D2 revision 1 review

Reviewed all20 phase cells, four isolated peak-layer panels and corrected private B06 matched-scale sheet. Film496,075bytes,60frames,1280x720/30fps,1.965322s container;122draw samples,zero page errors. The source has moved from a point above the hat to the real hand socket(380.80,253.07); the destination is the sentinel chest(980.00,228.30). The wider violet blade is visible at.3–1.1s, separate narrow violet ribbon at.5–1.3s, and cream lance at.7–1.0s. The locked arc at1.1–1.4s is gone. The lance still reads like a separate small dart; the main blade moves at an even pace and its smooth outer contour looks too much like a broad leaf. The last half-second is largely empty.

Peak exact-time GPU union is33,620pixels at866.67ms,3.648%viewport. Existing QR90/180/270-degree centroid rotation scores are0.18700/0.13618/0.18700; maximum0.18700<0.8. Isolated support:blade25,667,ribbon3,781,lance5,573pixels. This is a technique drill, not an ultimate-footprint pass. All support ends before2000ms. Initial mask-export previews from the opaque default canvas were discarded; these figures and final transparent layer sheets use render-targetRGBA. Movie timing is not inferred from those exact-time samples.

What the reference does that r1 does not:
1. Its blade snaps from a short preparation into a broad sweep; r1 travels evenly through most of the scene.
2. Its broad blade resolves into a much thinner leading stroke; r1's lance sits separately below the arc and has nearly constant weight.
3. Its narrow residue carries direction after the bright body clears; r1's final quarter is nearly blank.

For r2, preserve the source/target sockets and the passing non-radial geometry. Author explicit unequal spacing along arc distance, a narrow leading stroke that arrives with the blade, and a longer thin ribbon with moving erosion. Make the trailing contour break into directional brush gaps, keeping the leading lip sharp. B06/B07/B17/U08/U12 have promising evidence but remain pending the second reviewed revision.

## D2 revision 2 — isolated arc/flow move accepted

Reviewed all 20 phase cells of the final viewing copy, the first/last ten raw captured frames, all four isolated layer panels, both static/panned UV comparisons, the corrected private B06 comparison and the selected r0/r1/r2 strip. The blade starts at the lantern hand in cells .2–.3, accelerates through .4–.7 and clears the sentinel by about .9. The lower cream lance arrives with the broad blade, then clears. The narrow violet ribbon retreats toward the target across 1.0–1.7; no broad held arc remains at 1.2–1.5. Faces remain visually distinct because the body layers sit behind the actors. Full washout/face-mask acceptance belongs to D5 and production.

The first raw recording had 61 frames in 1.995425 s; a retry using the same unchanged recorder has 60 frames in 1.981990 s with variable cadence. The final film.webm is a labelled fps=30 viewing derivative: 593,465 bytes, 60 frames, 1280×720, exactly 2.000 s. The raw capture-vfr.webm and trace remain local. The viewing copy cannot prove independent ±33 ms timing. The initial 121-frame boundary extraction duplicated VFR frames; it was replaced using passthrough decoding of the actual 60 raw frames. No recorder feature, product timing or acceptance tolerance changed.

Exact-time GPU peak: 40,616 pixels at 666.67 ms, 4.407% of the viewport. At that peak the broad blade has 28,909 pixels, thin ribbon 3,930 and lance 8,949 before overlap/actor occlusion. Centroid rotation IoUs at 90/180/270 degrees are 0.24560/0.07729/0.24560. Support remains through 1833.33 ms (12 pixels) and is zero at 2000 ms. These are shader seek measurements, not movie-clock claims.

With geometry/lifetime frozen at 600 ms, the static-UV pair differs by zero RGB values; the panned-UV pair changes 86.70% of common-support pixels by more than 4/255, mean absolute RGB difference 16.868/255. The viewed striations move through the blade while its outer mesh stays fixed. This checks the UV mechanism; it is not a quality score by itself.

| Direct D2 row | Verdict | Evidence |
|---|---|---|
| B06 | PASS | .6–.7 s film cells and isolated layers: broad open blade, thin curved ribbon, tapered straight lance |
| B07 | PASS | Peak union maximum centroid-rotation IoU 0.24560 < 0.8; the full frame reads left-to-right |
| B17 | PASS | .2–.9 s cells and scaled strip show hand-to-sentinel travel at both full and contact-strip scale |
| U08 | PASS, isolated contours | Three different non-radial families in the peak composition; not a five-layer ultimate claim |
| U12 | PASS, single-recipient drill | Real hand socket (380.80,253.07) to sentinel chest (980.00,228.30), no unrelated field flash |

What the reference still does that this drill does not:
1. B06 changes the performer's weapon/torso pose; this drill deliberately isolates effect motion. D6/D7 must establish pose work.
2. Its contact includes a separate burst and response; D2 has a travelling lance but no complete impact/decal composition. D3 and the pilot must supply those roles.
3. Its brief high-value core dominates more strongly; reproduce that hierarchy only with D5 contrast protection, never the reference's face-obscuring whiteout.

D2 is accepted as a shader/mesh move with two reviewed revisions. Mechanism score 7/10. Q3.A remains open for D3–D8 and craft time; no production effect code has changed. Private scale uses the approximately 260±15 px reference body landmark against our ~194 px body, both displayed around 52 px. No reference pixels are in the durable strips or assets.
