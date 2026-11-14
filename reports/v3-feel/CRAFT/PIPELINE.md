# Repeatable character and skill pipeline

Status: proposed method; pilot step times are not yet measured. Source inputs: F1–F13, `PRINCIPLES.md`, `REFERENCE-BREAKDOWN.md`, `QUALITY-BAR.md`, S04/S05/S07/S08 and local sources L01–L05 in `sources.json`.

## Inputs and clock

Use only approved original art from `/Users/bao/art/vfx-2026-11-12/`, accepted character rigs/atlases in this repository, and newly authored code/geometry. Reference frames stay in gitignored `reports/v3-feel/ref/` and are never generator inputs. Record source paths, hashes, tool, date and authored description in provenance for every new asset.

The action clock is seekable milliseconds. Basics: anticipation 0–250, travel 250–350, contact 350, recovery through 800. Ultimates: focus 0–600, cast/travel 600–1100, contact 1100, aftermath through 2200. Hold poses for 66.667 ms at contact inside these totals. The same clock drives rig, effects and WebAudio event offsets; x2/x3 scale the whole clock. Rules RNG and results never depend on rendering.

## Production steps

These are initial planning estimates, saved numerically in `pipeline-plan.json`. Replace estimates with the pilot's recorded elapsed time; never relabel estimates as measurements.

| Step | Input and operation | Tool / output | Budget | Initial estimate |
|---|---|---|---|---|
| 1. Inspect and register | Original character, weapon and VFX layers; inspect opaque bounds, pivots, facing and joint overlaps | Existing asset loaders + sharp/Pillow; JSON body/face/socket/facing table | Reuse existing atlas; no reference pixels | 10 min |
| 2. Block key poses | Rest → wind-up → contact → overshoot → recovery; separate arm, torso, weapon and tail | Native cut-out tracks; JSON or TypeScript pose keys, silhouette strip | No new character atlas unless a missing attachment is proven | 20 min |
| 3. Write timing/layers | Fixed beat, source socket, targets, shape identity, colour ramp, layer envelopes | Declarative recipe + event markers | Basic >=3 layers; ultimate >=5; one clock | 10 min |
| 4. Author effect | Crop approved painted motifs; create shaped travel and directed debris; review grayscale before glow | Canvas paths + existing PNG layers; optional original RGBA flipbook | At most two 2048² RGBA sheets/ultimate (32 MiB decoded); target <=2 MB compressed/ultimate | 30 min |
| 5. Integrate | Socket alignment, contact shadow, scene grade, face masks, seeded fragments; no field transform | Three.js cut-out + Canvas overlay; independent layer-mask render | Pool objects; dispose sheets after battle; no per-frame image allocation | 20 min |
| 6. Sound | Weapon anticipation/contact; ultimate focus/cast/contact/tail mapped to visual causes | Existing free audio + own synthesis; WebAudio cues, source licence manifest | <=4 simultaneous voices; 60 s unmodified mix | 15 min |
| 7. Capture/measure | Production fixture + isolated actor/effect masks at 30 fps; action sheets at 10 fps; audio timestamp map | Playwright, ffmpeg, sharp/Pillow, checker; JSON + film strips | 1280x720, 30 s fixture WebM <=8 MB; private ref sheets <=1280 px | 20 min |
| 8. Review/revise | Every quality-bar row with actual frame evidence; view all sheets | REVIEW.md and JSON verdicts; reject defects | Max 3 pilot methods, then explicit blocker; no threshold changes | 25 min |

## Shape recipes, then reuse the method

Basic families: sword = thin-to-wide crescent; claw = three staggered scratches; staff = tapered bolt; thrown item = tumbling object plus curved ribbon; shield = angled wedge and impact fan; needle = narrow thrust with split contact lines; yarn = S-shaped whip and thread fragments; tea = forward splash with separated droplets. All share timing, not geometry. Each includes a wind-up glint, travelling body and target contact burst/ground mark. Damage events emit one number each, not one per visual layer.

Ultimate composition: caster focus/rim → distinct cast shape → connected travelling or area body → directional impact → broken residual shape. These layers must have independent visible contours and lifetimes. Draw face protection last. A heal uses recipient lift/response instead of a damage recoil; it still has contact, layered shape and direction to the healed group.

Design the thirteen primary masks before detailed colour: arch, spear fan, branch fork, shield wall, falling star trail, ink claw, crossed thread lattice, kettle pour, curled wind blade, crescent, petal fan, crystal comb, boss hammer. Assign by the actual roster and theme before Q3; these are candidate geometries, not claims that all are implemented. Pairwise IoU is measured on raw peak masks in a fixed viewport, with 78 comparisons; do not move, crop or threshold each pair differently to manufacture distinctness. Inspect contact-frame silhouettes as well as peak masks so a staggered peak cannot conceal a repeated shape.

## Mask and capture contract

Render an isolated effect-alpha buffer using identical transforms/time as the displayed frame. Count visible pixels at fixed alpha >=0.08 and exclude focus dim, names, HUD and full-field grade. Retain per-layer masks to prove each required layer has nonzero visible contribution, and use the union for footprint. Report threshold sensitivity at 0.04 and 0.12. Rotation symmetry is maximum IoU with 90/180/270-degree rotations about the effect centroid; require <0.8. A circle with a microscopic spike cannot substitute for the manual shaped-strike verdict.

Saturation uses HSV over the visible effect mask; luminance uses the 95th percentile of linear Rec.709 RGB. Current reference medians are approximate positive-difference estimates (see REF-EFFECTS.json); retain that limitation in every comparison. No reference metric excuses a failed frame review.

Write actual compositor timestamps, scheduled contact and observed contact separately. Capture at 30 fps, then extract all action windows at 10 fps. Add 30 fps contact strips for flash, hold and +/-33 ms sound checks. Never infer sync from 10 fps. Whole-viewport camera registration and opaque-body masks validate framing/scale independently of configuration values. The idle mask excludes shadow/weapon/effect protrusions when measuring body height.

## Pilot boundary and rollout

Only after the five QR documents and automated quality checks exist, implement one cat's basic and ultimate in a local pilot using the production cut-out renderer and accepted original assets. Keep it outside ordinary battle routing until reviewed. Include idle/hit/death in the same scene to exercise character rows. No broad production animation/VFX edits before QR acceptance. Record start/end UTC for each step in `pilot-times.json`; preserve failed attempts with their reasons. A failed pilot changes the method, never the bar.

After acceptance, reuse its recipe format and render functions for Q1–Q3. Q1 removes actives and switches camera/timing only; Q2 sets scale/facing/layout; Q3 rolls out the eight basic families and thirteen ultimate silhouettes. Re-run parity and full regression for each item. Pilot elapsed step times become the remaining-twelve plan; a study estimate is insufficient.
