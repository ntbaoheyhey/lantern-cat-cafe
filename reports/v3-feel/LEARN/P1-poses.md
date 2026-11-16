# P1: drawn keys and pose-to-pose action
Question: Can a small set of separately drawn Soot poses retain identity and read as attacks at field scale?
Study started2026-11-16T01:09:57Z. Study complete; production pose acceptance remains pending.

## Professional method learned before experiments
- Stage a readable silhouette; anticipation, contact and follow-through have different jobs (P1-lasseter).
- Solve strong keys and their timing first; interpolate only where needed (P1-deadcells).
- Attachment visibility selects one drawing per slot; use a point attachment as effect origin (P1-attachments).
- Mesh deformation bends existing pixels; hidden limb surfaces and new occlusion order need drawn alternatives (P1-mesh).
- Sequences can embed frame drawings in a skeleton (P1-sequence).
- Slot attachment keys change the visible drawing, while continuous deformation can settle ears/cloak (P1-keys).
- Pin feet independently of body motion (P1-chibi).
- CIEDE2000 needs validated formula/test data, not RGB distance (P1-ciede).
- GDC Xrd talk is identified; handout timed out, so no claim of having read it yet (P1-xrd).
- Current D8 sheets show the same standing face, bent body and held lantern throughout; low IoU from deformation alone is not proof of new action art (P1-local).

## Soot identity checklist from approved K0
Gray fluffy kitten; two triangular pink-inner ears; two golden eyes; short pink nose; purple hood draped behind ears and to viewer-left; layered purple cloak with gold embroidery and pentagonal gold clasp; teal woven tunic/sash with fringed hanging ends; brown belt and brass buckle; cream dangling charm/pouch; one curled gray tail; four limbs with bare paws; one short hooked bronze staff carrying a hexagonal golden lantern. No hat replacing the hood, no long wizard staff, no added spell props.
Existing runtime.webp is640x640 with margins; retain its painterly soft texture, upper-left highlights and subdued lavender/teal palette.
Method A experiment: full-body K2 with extended staff arm, body rotated/leaning right, open gap under arm, lantern ahead of muzzle. Two variants.
Method B experiment: redraw staff arm/shoulder and cloak edge on own-art crops; retain K0 body/face, assemble and measure reach and silhouette. Two variants.
Only approved own art is a generator input. Reference frames are private measurement material.

## Experiments and choice
Completed below:2A/2B candidates, preliminary identity/silhouette measurements,three swap methods at10fps,six reference basics and one cast comparison. Method selection authorizes the Soot pilot only.
Gates: section4B.6 unchanged; this study does not pass P.soot. Pipeline minutes will use actual elapsed work, not estimates presented as measurements.

## Sources actually inspected
- P1-lasseter [paper]: https://users.cs.northwestern.edu/~animation/Lasseter_1987.pdf — Stage silhouettes clearly; anticipate, contact, follow through.
- P1-ciede [paper]: https://hajim.rochester.edu/ece/sites/gsharma/ciede2000/ciede2000noteCRNA.pdf — Validate perceptual color difference against published test pairs.
- P1-xrd [breakdown]: https://gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The — Arc System Works art talk identified; handout retrieval failed, no content claim from unavailable PDF.
- P1-deadcells [breakdown]: https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i- — Convincing keys first; VFX convey transition speed and impact.
- P1-attachments [doc]: https://esotericsoftware.com/spine-attachments — One attachment per slot; point attachments provide effects sockets.
- P1-mesh [doc]: https://esotericsoftware.com/spine-meshes — Deformation bends an image; it does not draw new hidden surfaces.
- P1-sequence [doc]: https://esotericsoftware.com/blog/Spine-4-1-released — Sequence keys embed frame-by-frame playback in a skeleton.
- P1-keys [doc]: https://esotericsoftware.com/spine-keys — Slot attachment keys select one drawing at a time.
- P1-chibi [doc]: https://esotericsoftware.com/spine-examples-chibi-stickers — Pin feet while limbs/body deform and apply independent overlap.
- P1-angles [doc]: https://esotericsoftware.com/forum/d/29726-how-to-animate-multi-angle-characters-and-swap-body-parts-correctly-in-spine-2d — Staff Misaki demonstrates shoulder-weighted torso transitions and attachment continuity.
- P1-skimage [doc]: https://scikit-image.org/docs/stable/api/skimage.color.html — Use Lab conversion and CIEDE2000 on opaque pixels.
- P1-kmeans [doc]: https://docs.scipy.org/doc/scipy/reference/generated/scipy.cluster.vq.kmeans2.html — Use six clusters with seeded kmeans++ for reproducible palette extraction.
- P1-assignment [doc]: https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.linear_sum_assignment.html — Match six palette centroids one-to-one by minimum total color difference.
- P1-local [local]: reports/v3-feel/REVIEW/Q3.A/D8.jpg — Three revisions retain the same standing silhouette.
- P1-experiment [experiment]: tools/v3craft-lab/poses/results.json — A2 meets measured preliminary numerical bounds; arm-only swaps fail silhouette; no production pose accepted.
- P1-runtime [local]: apps/web/src/game/rig/cutout.ts — Existing visibility track selects existing parts; no full pose artwork set currently loaded.

Tooling: installed scikit-image0.24.0 into existing tools/.venv (<2GB, no account/admin). Three published Sharma test pairs agree within0.0001. Seed42 six-cluster Lab palettes are matched one-to-one.

## Completed experiment and private reference review (2026-11-16)
The six basic windows and one ultimate are recorded in tools/v3craft-lab/poses/reference-observations.json. Their private sheets were inspected at approximately196px body height. B01's first crop was initially empty and was corrected to the actual attacker; B05 was replaced and corrected after inspecting exact-seek full frames. Two heavily obscured V2 windows were rejected. Counts mean visibly distinct keyed configurations, not a claim that video exposes the source rig/drawing files.

| Reference action | Visible configurations, minimum | Observed holds at source x2 | Main lesson |
|---|---:|---|---|
| B01 sword,41.4–42.9s |5|100–300ms|Low guard, stretched arm, overhead, torso turn, follow-through are distinct.|
| B02 enemy,42.5–43.6s |4|100–200ms|Saber goes behind head then forward; lowered body supports contact.|
| B03 sword,44.1–45.6s |5|100–300ms|Back-facing torso and open arm need different artwork.|
| B04 enemy,45.6–46.6s |4|100–200ms|Overhead/extended/vertical weapon silhouettes remain different through the slash.|
| B05 sword,77.1–77.6s |3|100–200ms|Overhead sword becomes a low forward cut; simultaneous attacks reduce visibility.|
| B06 brush caster,76.7–77.1s |3|100–200ms|Torso pitches forward and brush rotates; arm/body change together.|
| U01 brush ultimate,78.2–78.9s |4|100–300ms|Gather, forearm across face, open-arm release, horizontal recovery.|

Timing uncertainty is at least one100ms sample; some existing survey labels lead direct-seek crops by roughly one cell. Do not use these approximate master times to certify our ±33ms timing gate. Background/effects prevent credible alpha-mask IoU on references: silhouette change is described using visible torso/limb/weapon configuration instead. Targets flash, tilt away and return; simultaneous attacks prevent attributing every recoil. Our fixed800/2200ms envelopes and displacement limits remain authoritative.

| Own K2 candidate | Aligned IoU | Reach/body | Mean ΔE00 | Head ratio relative | Disposition |
|---|---:|---:|---:|---:|---|
| A1 full redraw |.55187|.35204|2.99343|1.14105|Reject: head too large.|
| A2 full redraw |.48894|.41327|6.79753|1.07920|Provisional study winner; no production acceptance.|
| B1 arm swap |.89645|.26020|2.74288|1.00000|Reject: silhouette unchanged too much; hook remnant and lighting seam.|
| B2 arm swap |.87068|.29592|3.39178|1.00000|Reject: same defects.|

A and B use their corresponding approved baseline (runtime painting versus assembled rig); their raw IoUs are not a controlled estimate of method superiority. B changes only one arm, which is the specific tested limitation. Foot drift0 is imposed image alignment, not runtime proof. A2's head ratio is close to1.08 and must be rechecked with landmarks after production normalization. The2x inspection shows matching two ears, two eyes, two arms, two legs, one tail, cloak/sash/belt/charm and hooked lantern. Light and soft outline are consistent; no text/background/cropped part is visible in the generated raw image. The final640px canvas and sockets are not yet validated.

The field-size swap sheet visibly doubles the face, ears, arms and lantern at0.3/0.6s under cross-fade. Hard swap keeps one coherent drawing. The experimental stretched-lantern smear at0.3s bridges direction, but is too literal/wide and is not a production effect. The sheet tests only K0/K2, not the required K1/K4/K5 kit, and has not been filmed in the game. Choose full-body Method A plus hard swaps; pilot a brief directional smear with K1 before accepting its timing. Reject cross-fade. Keep Method B as a fallback after two failed full-body rounds, with torso/head/cloak alternatives rather than another isolated arm tweak. 3D rebuild and a full turnaround add unproven work; designer deliveries retain priority.

The observed P1 elapsed interval starts01:10:42Z and continues through this review; it includes research, generation, analysis and tool work. It is NOT credited as25min pose authorship. No per-unit production timing exists yet. Provisional plan: four new mandatory poses ×four candidates,30–45min active drawing selection/cleanup,15–25min runtime anchoring,20–30min review/revision, plus the separate30min basic/60min ultimate floors. P2 will replace these estimates with measured active intervals.

## Checker routing study before the correction
Reuse P0-test/P0-clock/P0-local for the checker method; this subtask shares the P1 source record. tools/v3craft-lab/poses/policy-comparison.json uses the real registry and gate definitions: current selection for P.soot returns0 pose gates, whereas exact gate selection plus P.learn returns2. A real six-source subset passes generic learning but fails the stricter pose receipt; the full16-source set passes. Select the named unit plus P.learn, retaining completed-item/GLOBAL checks. Make P1.learn use the same strict pose receipt. Test exact unit selection and six-source rejection through checkFeel, not just helper functions. No threshold changes.
