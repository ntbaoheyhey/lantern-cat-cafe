# Art repair log (append-only)

Inherited Full Run issues remain in ../skills-v5/full/FIXLOG.md. Art-specific issues follow reproduce / measure / hypotheses / smallest fix / verification / result, max three attempts per issue per milestone. No art fix attempted yet.

## B-R1-001 2026-11-09T22:11Z R1 painted attachment sockets S3
Repro: bakeoff1/painted-1440-mochi.webp; equipment medallions at feet. Attribute: GearAttachments falls back to model when named sockets are absent.
Hypotheses: missing sockets (confirmed), body pivot mismatch, geometry offsets. Attempt1: supply arm/body/neck/back/tail sockets at the existing painted layer anchors; preserve equipment data. Verify queued same bakeoff/parity/faces.
## B-R1-002 2026-11-09T22:11Z R1 boss size S2
Repro: bakeoff1/painted-1440-yarn-giant.webp. Yarn source height1.55 made boss ~216px vs Button177px across presets, below2x.
Attempt1: restore source world height2.35 (old 3D boss conventions), retain formation/camera. Verify head/foot bounds + P15 safe regions; no HUD edits.
## B-R1-003 2026-11-09T22:11Z R1 paint expression S3
Repro: six-layer candidate has breathing/arm/tail motion but no eye closure. Attempt1: actor-owned shader eyelids sampled from the same painted fur; hit/happy/KO eye poses and reduced-motion static expressions. Verify shader compilation, blink still, motion film, faces and perf.
## B-R1-004 R1 procedural candidate limitations S3
3D+ candidate rebuilt four units with voxel-fused cat heads, expressive glossy eyes and procedural costume/object shapes. Unbaked material detail remains visibly toy-like; source procedural prototype does not meet all aspirational Blender bake/armature requirements. Compare honestly against painted candidate; no false completion claim and no broad procedural polish detour.

## B-R1-005 User review: stiff 2.5D motion S3
User explicitly reports the 2.5D characters have no convincing movement and are stiff. Initial amplitudes .006–.045rad plus breathing do not sell a rigged character. Still-image appeal cannot accept the pipeline. Reproduce with continuous idle/attack/hit/cast clip; rebuild pose amplitudes, anticipation/impact/recovery, articulated limb bending and ear/tail follow-through, then review the actual clip before decision. Attempt1 underway; max3 remains.

## B-R1-006 Direct conversion export blocked S2
Repro: image-to-3d.py --submit --id mochi --out ~/art/look-v3/image-to3d/mochi/attempt2. Receipt retained in r1/image-to-3d/receipt.json.
Measured: image_to_3d returned provider preview; extract_glb failed on ZeroGPU quota at2026-11-09T22:26:12Z. No model file downloaded.
Hypotheses: service quota (confirmed explicit error), geometry failure (not evidenced), client serialization failure (not evidenced).
Action: preserve six preview images and receipt, mark PREVIEW_ONLY_EXPORT_BLOCKED, prepare structural/import checks, use already authorized fal route after connection. No repeated inference/quota workaround.
Verification: preview hashes match source; fal installed:false. Rig, motion, performance, topology and real-battle image quality NOT VERIFIED. Status PARTIAL, external dependency; no runtime regression introduced by this checkpoint.

### B-R1-006 follow-up 2026-11-09T22:53:33.409814+00:00
User explicitly requested automation of the already signed-in browser workflow. One new Generate and Extract succeeded. Downloaded raw GLB via exact visible link; structure96900tri/2textures/0skins/0clips. Prior quota failure unchanged. Export blocker RESOLVED for Mochi; rig/runtime still NOT VERIFIED. Browser download timeout retained in browser-automation.json.

## B-R1-007 2026-11-09T23:04Z generated source simplification S2
Repro: rig1-motion/contact-sheet.webp and rig1-battle/generated-1440-mochi.webp. Actual browser renderer has no errors but the face/shield become broken triangles with distorted texture even at rest.
Measured: Blender collapse ratio16000/96900 produced23622tri and removed most head vertices (head weight>0.05 only1307 of35655 exported vertices). Original six-angle source is intact. Type/lint/1815unit PASS cannot detect this appearance failure.
Hypotheses: aggressive simplification/UV collapse (first test), skin bind error, incorrect accessor layout. Attempt1: use untouched generated source geometry with the same rig and exact comparison shots, separating geometry loss from skin binding. Preserve rig1 failures. Next optimization must use bounded geometric/attribute error and pass the same visual comparison.

Follow-up: untouched source rig2-motion restores the face/texture, isolating simplification as the cause. Attempt2: meshoptimizer1.3.0 simplifyWithAttributes, target.23/error.006, normals weights.1/UVweights1, Permissive;21938tri (measured combined error.0047997). rig4-motion retains readable face/silhouette but fine fur has small angular losses. Conservative unaccepted review copy retained. Default CLI simplify with locked borders retained91026tri and was not selected. No claimed numeric error bound on perceived beauty.

## B-R1-008 2026-11-09T23:05Z fused source arm and shield deformation S2
Repro: rig2-motion cast/victory poses (22 real runtime clips,14bones). Original source mesh is fused; broad arm masks drag apron, soft shield weights bend the door.
Attempt1: original spatial masks on untouched geometry. Body/head/tail move, but high arm poses tear cloth/door.
Attempt2: exclude dark cloth by sampled source texture; move shoulders outside torso scaling, rigid shield mask. rig3-motion: texture variations cause uneven forearm weights; shield mask also picks up foot. Failure preserved.
Attempt3: smooth forearm capsule, measured shield rear/lower planes excluding foot. rig4-motion: neutral/side/back/hurt remain readable, high cast/victory still stretch connecting surface triangles. PARTIAL at3attempt cap; no further mask tweaks this milestone. Need actual separated surface/retopology and reweighting at next milestone, not generic automatic-skin acceptance. Do not expand this rig to the roster or call the pipeline accepted.
Probe extension: generated-motion.mjs captures rest/anticipation/impact/guard/cast/hurt/victory/tail/blink/side/back using actual game renderer and mixer. Distinguishes no-console-error from deformation acceptance.

### Automation validation — 2026-11-09T23:18:08.774376+00:00
No fourth B-R1-008 geometry/weight fix. The exact packed model SHA c035cd84 was reproduced by the new runner; existing packed-motion/film/parity evidence applies to these same bytes.
Added guards after observing that --install and REVIEW_REQUIRED could be mistaken for production acceptance: renamed --install-preview, always qualityPARTIAL/runtimeAcceptedfalse, hash all stage outputs/sidecars, lock output, atomic manifest, persist spawn failures.
Verification automation-validation.json:5stages reused with byte-exact outputs; recipe change, output mismatch, concurrent writer and unqualified production install all rejected. No new model request or visual/performance PASS inferred.
