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
