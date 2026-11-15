# Apprenticeship drills

No production effect work has started. Only completed, reviewed revision rounds may count toward a drill. Raw films and private reference comparisons remain local.

| Drill | State | Before / after | Rows / next decision |
|---|---|---|---|
| D1 erosion | PASS on B16/U21; production C07 OPEN | [D1 r0/r1/r2 strip](../REVIEW/Q3.A/D1.jpg) | B16/U21: r1 + refined r2 reviewed; C07 actual death remains OPEN |
| D2 arc/UV flow | PASS, isolated technique after r1/r2 | [D2 r0/r1/r2 strip](../REVIEW/Q3.A/D2.jpg) | B06/B07/B17/U08/U12; production timing/composition not claimed |
| D3 stretched sparks | PASS, isolated particle move after r1/r2 | [D3 r0/r1/r2 strip](../REVIEW/Q3.A/D3.jpg) | B06 contour families and drag/stretch; B05 full action OPEN |
| D4 flipbook | PASS, isolated one-shot after r1/r2 | [D4 r0/r1/r2 strip](../REVIEW/Q3.A/D4.jpg) | B16/U21; production composition/timing OPEN |
| D5 blend/readability | PASS, isolated fixed-pose colour/blend after r1/r2 | [D5 r0/r1/r2 strip](../REVIEW/Q3.A/D5.jpg) | B15/U16 face and C08 contour preservation only; moving masks/scene lighting OPEN |
| D6 anticipation/contact | r0/r1 reviewed; r2 pending | [r0/r1](../REVIEW/Q3.A/D6.jpg) | B03/B04/B08/B09/B10 OPEN |
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

## D3 baseline r0 — revision needed

Reviewed all 20 10fps cells in sheet.jpg and detail.jpg, four body-matched private B01 phases, and the two-anchor exact-time comparison. Film: 445,546 bytes, 60 frames, 1280x720/30fps, 1.966801s from a two-second recording interval; zero page errors. Needles move right/down across .4–.7s, but their contours are barely legible at battle scale; the broader splinters blend into them, and chips become tiny brown dots rather than a readable slower mass. No effect is visible after about1.3s; the exact endpoint remains to be measured.

What the master does that r0 does not:
1. B01 41.9–42.0 has a few strongly weighted long needles around a compact core. R0 has similarly thin weak marks with no clear primary direction.
2. B01 42.1–42.2 keeps larger filled fragments visible after its needles. R0 chips are too small and too close in colour to the floor.
3. B01 contact originates in the target torso. The template chest socket in our accepted sentinel art projects to (980,491.705), near the lower body; moving the same burst up55px projects to (980,436.705), visibly on the breastplate.

The private body match uses reference helmet-to-foot96±8px versus our194px, scaled to roughly98px each. Reject the reference whiteout and walk-up. Choose the painted torso contact from the two-anchor trial, then author a deliberately weighted upward/rightward fan, fewer longer needles, short wide splinters with an independent earlier lifetime, and larger violet/amber chips. Direct B06 is not yet accepted. B05 is a full-action requirement and stays OPEN for the pilot; this isolated impact cannot prove preparation/travel/decal.

## D3 revision 1 review

All20 full/detail phase cells, raw frames8–17 and36–45, four isolated peak masks and four private B01 phases reviewed. Baseline full/detail/matched preparation and review were repeated here after the earlier below-minute blocks; those rejected intervals retain zero credit. R1 film478,111bytes,60frames,1280x720/30fps,1.975907s from2s recording; zero page errors.

The torso fan now reads at .4–.6s. Three longer needles lead shorter ones; their spacing grows quickly then slows. Violet solid chips outlast them across .7–1.5s. The eye strip stays visibly distinct. The baseline's near-invisibility was partly group-order occlusion, not merely low colour value; the local renderer A/B comparison corrected that diagnosis. The isolated splinter panel at the union peak is dark because that role is already cooling: alpha support alone is not a visible-layer verdict. Its earlier white wedge is visible in raw11–13 and the .4s contact cell.

Exact GPU union peak2,156pixels at466.667ms; isolated support at that time: needles1,074, splinters1,059, chips415 before overlap. Last support1,566.667ms(60pixels), endpoint0. Five arbitrary intermediate seeks return the identical peak RGBA buffer (zero changed channels). These are mechanism measurements, not independent filmed timing.

What the master does that r1 does not:
1. B01's needle fan separates decisively from a much shorter white contact. R1's five splinters remain bright and crowded for several frames.
2. B01's trailing filled pieces have separate silhouettes. R1 births ten broad chips at one point, producing a small violet flower at .4–.5s.
3. B01's narrow strokes extend after the central flash. R1 has that direction, but its needle entry still reaches full width too quickly in raw11–12.

Revise2: label the compact contact splinters as a two-frame accent(66.667ms), give the needles a45ms entry ramp, and emit smaller varied chips along a short torso contact region with separated launch directions. Keep analytic drag, three leading needles and the smooth eye guard. The before/after does not prove a full basic or ultimate; B05 remains OPEN for the pilot.

## D3 revision 2 — isolated particle move accepted

Reviewed all20 full/detail cells of the final viewing copy, all20 original raw phase cells, raw adjacent8–17/36–45, the union and three role-specific isolated masks, four fixed-body-scale private B01 phases, and the selected r0/r1/r2 strip. The raw capture has60frames in1.964589s,441,556bytes, zero page errors. Its average-frame-rate field is0/0, so cadence is not assumed constant. The labelled30fps viewing derivative has60frames, exactly2s,251,759bytes; the final empty frame is explicitly padded. Raw VFR and trace remain local. Neither derivative nor exact GPU seeks prove Q1 video timing. A first sheet command ran before encoding completed and failed; after waiting for completion, the same command passed.

Raw11–12 show the compact two-frame contact splinters; by13 the narrow fan carries the motion. Film .4–.6s shows the three longer needles leading the shorter ones. They align with motion, shorten and turn slightly downward as they lose speed. Smaller asymmetrical violet chips separate across .5–.9s and fall/fade through1.4s. The r1 flower-like birth cluster is reduced to separately readable fragments; the eye strip stays visible. The intentional empty opening/ending belongs to this finite isolated burst, not a claimed full basic schedule.

Exact-time GPU union peak1,576pixels at500ms. Role-specific peaks: needles1,104pixels at500ms, splinters916 at366.667ms, chips603 at766.667ms. These peaks occur at different phases; no simultaneous-three-layer claim. Last support1,433.333ms(26pixels), zero at2000ms. Five arbitrary intermediate seeks return the identical peak RGBA pixels. Example needle0 speed falls487.535→362.144→272.222px/s at0/100/200ms age, and length52.853→41.317→33.044px. Needle2 length falls74.354→55.110→41.199px over the same ages.

| Direct D3 evidence | Verdict | Frames/receipt |
|---|---|---|
| B06 distinct contour families | PASS, isolated impact only | Broad short splinter wedges, long tapered needles, filled asymmetrical chips; role-specific peak masks and .4/.5/.8s film cells |
| Velocity stretch and drag | PASS, drill mechanism | .4–.7s visible outward spacing/shortening; GPU trajectory receipt, analytic versus Euler study |
| Finite independently seekable fallout | PASS, drill mechanism | .7–1.4s chips; final0 support; five seek comparisons identical |
| B05 full preparation/travel/impact-decal | OPEN, production | This impact-only exercise cannot show the complete basic composition |

What the master still does that this drill does not:
1. B01 links the fan to a clear weapon swing; the static actor here proves no anticipation pose. D6/D7 own that.
2. B01 has visible target recoil and a larger principal strike; the pilot must combine those with this secondary burst.
3. B01's organic trailing shapes vary more than these small chips; the drill establishes controlled particle motion, not a complete distinctive ultimate. Do not copy its whiteout, walk-up or reference pixels.

D3 is accepted as an isolated particle move after two reviewed revisions, mechanism score7/10. Full Q3.A and craft-time remain OPEN, with D4–D8 still required. No battle effect, pose, timing, camera or rules code was changed.


## D4 baseline r0 — revision needed

Reviewed every20 phase cell in full/detail sheets,20 raw adjacent frames5–14/29–38, and five private matched U06 phases. The raw movie has58frames,1.977598s,455843bytes, zero page errors; frame-rate field0/0, so it is not labelled30CFR. The atlas itself contains31frames at30Hz over1000ms, all with the same540px crop and fixed(800,355)pivot. First and final source cells are transparent. The player begins at200ms and explicitly ends at1200ms; no repeat is seen through1.9s.

What the master does that r0 does not:
1. U06 n11–12 and16–17 changes its outer wing contour; D4 .4–.8s has the same rigid lantern arrangement beneath changing holes.
2. U06 has crisp separated blue shapes at matched scale; D4's256px bake softens the painted rim and hanging attachments when enlarged to540px.
3. U06 retains a strong coloured residue after its contact flash; D4 .9–1.1s reduces to disconnected brown scraps. Its isolated source is not a complete ultimate and does not claim that gate.

The fixed-pivot ordering/one-shot mechanism works visibly, but r0 is not accepted. Revise with a sharper atlas and separately weighted pendulum motion of the original hanging lamps, preserving the upper bar and original paint. First compare that motion against rigid translation on actual paint landmarks and check for mesh folding; reference pixels remain private. Reject U06's plate, radial ring and whiteout. The55.39s baseline authoring interval remains rejected; the complete source/player authoring must be repeated in a valid block.


D4 r1 authoring preview: at source166.7/266.7/466.7ms, the three lamp centres shift beneath a fixed upper hook; narrow connectors remain continuous in the six original-art key-shape cells. The512px bake preserves small warm edge detail better than r0. The maximum swing is modest, not a large gesture. Chip birth positions are derived from the surface at release; the fixed-pivot atlas does not follow the particles. Full motion review is still pending, so this preview grants no acceptance.


## D4 revision1 — onset still needs correction

Viewed all20 full/detail cells,20 raw adjacent frames and five matched U06 phases. R1 has59frames,1.966072s,390720bytes and0page errors. The512px source is sharper, and the left/centre/right lamps visibly swing beneath the pinned crown in .3–.6s. Connectors remain continuous; no folded mesh or mirrored tile is visible. Final .9–1.2s shrinks to small source chips and clears, then stays empty.

Frame timestamps reveal a defect hidden by the10fps strip: raw5 is166ms, raw6 is274ms (108ms gap), then282/299/332ms. This skips part of the source reveal. The existing recorder is unchanged; the D4 material and large atlas first become visible after200ms. First-use program/texture preparation is a hypothesis to test, not a confirmed diagnosis yet. B16/U21 cannot be accepted from this onset recording.

What the master does that r1 does not:
1. U06 n11–12 visibly builds into its readable shape; r1's capture loses part of its entry to the108ms gap.
2. U06 n16–17 retains a broad coloured contour; our residue is still a small secondary paint breakup, not a complete ultimate aftermath.
3. U06 has a stronger pose-to-pose change; our modest7.74–10.41px lamp swings are a technique exercise only, with character poses and production silhouette gates still open.

R2 will prepare the material/texture before playback if the cold/prepared experiment supports that cause, preserve the source shape work, and make the entry visibly reviewable with the same recorder. A second measured defect, if present, must be fixed from actual evidence rather than retiming the recorder. The55.35s r1 capture/preparation interval remains rejected for craft-time credit and will be repeated during final verification.


D4 r2 authored keys before recording: viewed r1/r2 side-by-side at source ages133.3/266.7/433.3/666.7ms, plus33.3/66.7/933.3/966.7ms endpoints. R2 keeps all three lit lamp bodies and their connecting bar readable at266.7ms; at433.3ms holes have started, while the independently swinging lamps still form the composition. Early33.3ms support is faint and66.7ms has several small pieces; final933.3ms is one tiny paint fragment and966.7ms is empty. This fixes the short full-shape read without extending its1000ms duration. These are source key previews, not recorded onset/tail acceptance.


## D4 revision 2 — isolated flipbook accepted

Repeated final review after the interruption; no inactive time was credited. Viewed all 20 full and 20 detail cells, raw adjacent frames 5–14 and 29–38, the peak alpha mask, the original-art r0/r1/r2 strip and five fixed-main-shape-scale U06 phases. At .2 s the field is empty; .3 s shows separated partial paint; .4–.6 s clearly reads as three lamps suspended from one curved crown. Independent lamp offsets remain small but visible; the upper hook stays pinned. Between .7 and 1.1 s the paint separates into holes and small moving remnants; 1.2–1.9 s stays empty. Raw adjacent entry and clearing frames show graded changes, without a repeated atlas, neighbour tile, rectangular border or one-frame whole-layer appearance. The peak mask has a clean asymmetric silhouette, with no rectangular support outside the source.

The final GPU peak is 35,198 pixels at 466.667 ms, bounds (661,249)–(950,503). The last nonzero 30 Hz sample is 405 pixels at 1133.333 ms; the finer 60 Hz tail probe still has 354 at 1150 ms, then exactly zero at 1166.667 ms. Five arbitrary seek round trips change zero channels. Atlas: 31 frames at 30 Hz, 512 px cells, 2 px extruded borders, fixed 540 px crop/pivot, 4128×2064 PNG (2,279,070 bytes). These are isolated exact-time samples, not Q1 movie timing evidence.

Raw capture: 60 frames, 1.981468 s, 441,199 bytes; maximum observed frame gap 51 ms. The labelled viewing derivative is 30 fps, 60 frames, 2 s, 212,074 bytes and includes final empty-frame padding. R1's 108 ms reveal gap is retained in its original movie. X14's cold/prepared comparison supports explicit texture upload/program preparation before playback; the final raw sequence permits entry review but does not prove global timing. X15's longer readable-shape interval trades against a larger support-loss step (final GPU maximum 9.18%); the observed tail still clears progressively.

What the master still does that this drill does not:
1. U06 58.3–58.4 s changes the large outer pose; these lamps have modest secondary swings. D6/D7 and production shape authoring remain necessary.
2. U06 58.7–58.9 s retains a broad saturated body; this source ends in small secondary paint chips. A full ultimate still needs a deliberately authored aftermath.
3. U06 relates a brief contact core to the surviving coloured body; this isolated one-shot has no caster anticipation, target recoil or complete impact composition. Its whiteout and plates remain rejected.

Accept B16/U21 entry/exit and the finite 30 Hz flipbook mechanism after two reviewed revisions. Mechanism score 7/10. This grants no full-action, ultimate footprint, contrast, character-pose or production approval. Source selection and numeric comparisons: LEARN/Q3.md, Q3-X11–X15 and Q3-T26. D5–D8, the pilot and the unchanged craft-time threshold remain OPEN.


## D5 baseline r0 — colour lifetime needs revision

Viewed all20 full/detail phase cells, raw adjacent frames4–13 and32–41, and all five B06 private comparison phases at fixed body scale (reference~260px in746px crop, own194px in560px crop, both~89px displayed; approximate reference body estimate inherited from D2). The raw film has60 frames,1.967532s,413,267bytes and no page errors. It is variable cadence, not labelled30CFR. The static camera and actual Soot paint are unchanged.

The pale tip appears progressively at.2–.3s, becomes violet at.4–.6s, and clears past the hat across.8–1.2s. At1.3–1.9s it is gone. Eyes, muzzle and the dark costume remain readable, and no visible rectangular face hole appears. However, the upper sweep resembles a blade held over the hat; it barely challenges foreground torso lighting. Its darkest colour key occurs after the geometry has already departed. This fails the intended complete colour-over-lifetime demonstration despite good contrast numbers.

All61 fixed-time samples retain at least95.97% face/98.46% body normalized contrast and99.93%/100.00% original gradients. Peak changed support is10,000 pixels at733.333ms. Last changed support is253 pixels at1233.333ms, when the colour is still violet (linearRGB .302,.052,.636); five seek round trips change zero channels. These measurements explain the colour lifetime mismatch, not a drill PASS.

What the master does that r0 does not:
1. B06 29.2s has a narrow near-white crest inside saturated violet; our earliest whole shape is pale, then the core stays similarly bright throughout.
2. B06 29.3–29.4s leaves a narrow purple trail after the broad arc; our entire blade travels out before a dark residue can read.
3. B06 links the contour to a weapon and preserves differently timed roles; our isolated upper sweep has no contact relationship and insufficient light crossing the torso. Do not copy the obscuring immunity text, walk-up or whiteout.

Revise the body path downward across the silhouette while preserving the face guard; keep the broad colour behind paint and attenuate the foreground core. Separate body and core colour keys, reserve warm-white for the early narrow crest, and let the tail retain a small dark-violet residue before clearing. B15/U16/C08 remain provisional until both reviewed revisions and all moving contrast samples pass.

D5 r1 source-key preview: inspected250/500/800/1100/1400/1600ms. The broad arc now passes behind the muzzle/neck, and its violet tip remains through1400ms before clearing. The white crest is narrow rather than a pale whole blade. Cool the core and body earlier so the remaining1400ms tip reaches the dark key while still visibly supported; retain the gradual spatial tail and face feather. Full recorded review follows; these authoring keys grant no acceptance.


## D5 revision 1 — protected colour works; residue still too solid

Viewed all20 full/detail cells,20 raw adjacent cells, five matched B06 phases and the two-row original-art revision strip. R1 reaches a saturated violet body by.5s, keeps a narrow pale crest around.5–.8s and cools into a dark violet tip by1.4s. It clears by1.6s, with no repeat or face-sized punched rectangle. The lower curve now crosses the painted silhouette while the face remains dark and readable.

Across61 GPU samples, minimum normalized face/body contrast is98.58%/99.31%; signed gradient retention99.98%/99.96%. Five seeks are pixel-identical. At500/800ms the isolated broad layer geometrically intersects5,504 opaque body pixels and2,659 face pixels, but draws behind them. The foreground core covers121 body pixels and zero face pixels at alpha>5/255. This confirms the pass is using the intended separated layers. It is limited to this fixed Soot pose, not moving production masks.

Raw film60frames,1.967832s,446,819bytes; maximum observed gap36ms. The stream reports30000/1001 but no claim of exact30CFR is made. Peak scene-changed support10,731px at633.333ms; last65px at1566.667ms. The dark key is now visible before clearing. These are exact-time/film facts, not Q1 timing acceptance.

What the master does that r1 does not:
1. B06 29.4s narrows its aftermath to a luminous line; r1 1.2–1.4s retains a dark filled wedge, which resembles a floating piece of paper.
2. The reference's bright crest and broad body have different termination phases; ours still share almost the same width mask.
3. Its short directional stroke resolves away from the caster; our isolated sweep still spends too long at full width behind the neck. Its whiteout, text occlusion and walk-up remain rejected.

For r2, narrow the surviving cross-section and break its tail into flowing striations before the darkest phase. Retain enough violet edge to read against the warm wall, but let opacity fall as it cools so no opaque dark wedge remains. Keep the actual face/body masks, group ordering and contrast limits. R1 is a reviewed revision, not final D5 acceptance.

D5 r2 authoring preview: six keys300/500/800/1100/1300/1500ms inspected. Warm crest stays narrow, violet body remains legible through1100ms, then the1300ms remainder is a broken thin violet trace instead of r1's filled dark wedge. The1500ms field is clear. Preserve this hierarchy for recorded verification; no acceptance from source keys alone.


## D5 revision 2 — scoped fixed-pose blend acceptance

Final review repeated after the handoff; the interrupted interval receives zero credit. Viewed all 20 full-field and detail cells, raw entry frames 4–13 and tail frames 38–47, the five private matched B06 phases and all 15 durable revision cells. Source and durable-sheet SHA256 match the final GPU receipt. The reference and own actor heights are approximately 89 displayed pixels, using the inherited explicit crop estimates; the reference plays faster and is not timing proof.

At 0.2–0.4 s a narrow pale crest builds upward beside the body. At 0.5–0.8 s the saturated violet sweep passes behind Soot's muzzle and shoulder while the eyes, cheek and costume edges retain their painted values. At 1.1 s the body still reads; at 1.3–1.4 s it contracts to broken violet streaks, then clears. Adjacent frames 38–47 show progressive thinning, without a final solid dark wedge. The dark phase is intentionally small; this drill does not establish a large ultimate aftermath. No rectangular protection cutout is visible.

The 61 fixed-time WebGL samples retain at least 98.9098% face and 99.4334% body local-mean-normalized contrast; original signed gradients retain 99.9896%/99.9583%. Peak scene-changed support is 10,482 pixels at 633.333 ms. R1/r2 support at 1400 ms is 2450/366 pixels and at 1500 ms 661/2; subsequent final samples are empty. At 500/800 ms the broad layer geometrically overlaps 5,475 body and 2,651 face pixels but draws behind paint. The bounded foreground core covers 119 body pixels and zero face pixels above alpha 5/255. Five seek round trips are pixel-identical. These fixed-mask contrast proxies are documented in X16/T28; they are not the full Peli bandpass method.

The final raw film contains 60 frames over 1.967659 s, 428,255 bytes, maximum observed gap 36 ms. The labelled viewing derivative is 30 fps, 60 frames, 2 s, 218,290 bytes with empty-end padding. Raw cadence is preserved and no Q1 timing gate is inferred from the derivative.

What the master still does that this drill does not:
1. B06 29.2 s has a stronger near-white crest bounded by a larger violet body; this drill deliberately limits emission near the face. A production composition must recover strength in unoccluded space.
2. B06 29.3–29.4 s separates the contact flash from the remaining thin trail. Our test is a single sweep with no contact event; D6 and the pilot must connect its phases to a pose and target.
3. The reference links its directional contour to a weapon stroke. Our fixed actor proves colour preservation only; it does not prove animation, refreshed actor masks or multi-actor ordering. The reference's whiteout, walk-up and obscuring text remain rejected.

Accept the isolated B15/U16 face-preservation and C08 painted-contour-preservation move after two reviewed revisions, score 7/10. This is not full C08 scene-lighting acceptance, which belongs to D8, or production approval. Cached actor coverage is valid only for this fixed pose; moving production meshes require updated/reprojected coverage. D6–D8, pilot, craft-time and inherited Q1/Q2 gates remain OPEN.

D6 r0 author preview: all ten source/recipient keys0/100/200/250/300/350/400/500/650/800ms inspected. Raised lantern and planted feet read; restrained head counter-rotation keeps gaze toward target. A first broad target flash was rejected and confined to the breastplate before the baseline film. Source remains original six-piece Soot; native sentinel retains its source colours. Preparation/hold/frame claims require film and alpha verification.

## D6 baseline r0 — readable preparation, detached smear

Viewed every20 full-field, caster and target phase cell, raw release frames5–14 and settle frames15–24, all five fixed-scale purple-staff comparisons and the durable five-cell strip. Source/recipient remain in their slots. The lantern rises through0.1–0.2s, lowers on release, then settles by0.8s. The feet do not travel. The head looks at the recipient while the torso leans. From0.8–1.9s the action is finished; this is the required800ms basic contained in a2s drill, not a2s action.

Raw frame9/10 show the curved smear, frame11 the breastplate contact, and frame12 the held pose after the flash clears. Eyes remain visible and the broad white target wash from the author preview is absent. The source smear is visibly detached from the lantern path: it reads as a small purple blade above the hand. The target recoil is slight and moves the whole armour as one card. The lantern hold is readable, but the lower robe and tail soften the difference between contact and rest.

GPU alpha comparison confirms five anticipation samples100–233.333ms with centroid-aligned IoU0.89978 down to0.72635; the>=8% silhouette difference is not the only criterion. Exact poses and recipient transforms are unchanged at350/360/375/400/424.9ms; five seek round trips have zero vertex difference; rest800ms alpha IoU is1. These support the mechanics, not a movie timing pass. Raw film60frames/1.978326s/464,807bytes, maximum gap44ms. Release timestamps are0.310/0.344/0.377/0.410s for frames9–12. No claim of exact30CFR is made.

What the master does that r0 does not:
1. The purple caster at76.8–76.9s moves the torso and weapon into visibly different orientations; Soot's right-hand motion is still narrow and its lower coat contributes little to the stance.
2. The reference brush follows the weapon action. Our smear is a separate curved blade whose path does not match the lantern's movement.
3. The caster's torso returns before the brush fully settles. Ours has delayed tail/arm keys, but the contact and recovery silhouettes remain too similar at field scale. The neighboring white flash and walking sword actors are excluded from this comparison.

R1 will preserve planted feet and the75ms hold, strengthen the lantern preparation through controlled arm weights, and derive the short smear from authored hand key positions. The target must compress/recoil through its rig rather than rotating its whole root. B03/B04/B08/B09/B10 remain provisional until two revised recordings are reviewed.

D6 r1 author preview: all ten source/target keys inspected. The lantern lifts farther, its weighted coat edge stays attached, and its short violet smear now follows the downward hand arc. Sentinel body/head/arm recoil leaves the feet fixed. Source keys alone grant no acceptance; recorded r1 review follows.

## D6 revision 1 — attached sweep, preparation still restrained

Reviewed all20 full-field, caster and target phase cells; raw release frames5–14 and settlement15–24; all five same-body-scale private staff-caster pairs; both rows of D6.jpg. At0.1–0.2s the hand raises the lantern and the torso compresses against fixed feet. At0.3s the short violet smear now lies on that downward hand path. Raw9–10 show it for two frames; raw11 shows a local breastplate contact and the first articulated target response, with eyes readable. Raw11–12 retain the contact shape; the exact-time probe confirms the75ms hold rather than inferring duration from two movie frames. At0.5s the target has a small additional recoil;0.6–0.8s settles without root travel. All remaining0.8–1.9s cells are rest.

The face and robe remain coherent at field scale. The seam improvement is real, but the main preparation is still a modest wrist/lantern lift; stronger numeric silhouette difference alone does not make it forceful. The reference76.8s weapon stands high above its head before the76.9s release; our lantern remains beside the chest. We will not copy that pose or its walking action: the comparison exposes inadequate spacing of our own keys.

What the master does that r1 does not:
1. It separates preparation from rest over a much larger weapon arc; our lantern position changes little relative to the head.
2. It uses a clearly compressed/released torso line; ours counter-rotates the head so strongly that the upper silhouette stays nearly unchanged.
3. Its weapon finishes a distinct directional gesture. Our lowest lantern pose at0.4s reads as lowering the hand, with only a slight forward intent.

R2 will enlarge the original raised-lantern preparation, retain more head response, and reshape the forward contact instead of merely increasing the r1 tilt. Preserve planted feet, weighted attachment continuity,350ms contact and75ms hold. Broader scene integration/idle/ear overlap remain D7/D8 work. No D6 acceptance yet.

R1 raw film:60frames,1.967189s,454,084bytes; maximum frame gap35ms. No CFR derivative. Exact-time centroid-aligned wind-up IoU0.867909 at100ms to0.664264 at200ms; five hold and five seek checks have zero difference;800ms return alpha IoU1. The camera matrix is identical throughout121 draw samples. These do not close Q1 video timing.
