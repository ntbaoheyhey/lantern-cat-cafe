# Combat animation craft

Research date: 2026-11-14. Status: research, not pilot acceptance. Citations are indexed in `sources.json`; the measured reference is `../REF-EFFECTS.json`. The prescriptions below are our design choices, constrained by F1–F13, not timings claimed by a tutorial.

## The twelve principles applied to this battle

| Principle | Application and visible test |
|---|---|
| Squash and stretch | Compress the torso over planted feet during anticipation; extend along the weapon vector at release. Keep face width and painted joints believable. Compare setup, compression and release silhouettes. |
| Anticipation | Show the hand pulling back, shoulders turning and the weapon opening away from the eventual strike. A bright dot without a pose change does not qualify. |
| Staging | Keep the whole field fixed. Dim non-casters to 45% for an ultimate; place its banner near the caster without covering a face. The eyes must find the source before the target flashes. |
| Pose-to-pose / straight ahead | Author rest, wind-up, contact, overshoot and settle poses first. Add interpolation after those poses read; use seeded procedural fragments only for dissipating debris. |
| Follow-through and overlap | The weapon leads, wrist follows, ears/tail settle later. Separate attachment curves prevent a rigid cardboard rotation. |
| Slow in / slow out | Spend time near wind-up and final settle, cross the travel interval quickly, hold contact briefly. Uniform linear oscillation cannot suggest weight. |
| Arcs | Hands, tails and curved weapons follow shallow arcs. Projectiles may travel straight; a staff bolt is not a swinging limb. |
| Secondary action | A tail counterbalances the arm; a small ear lag supports a recoil. Secondary motion must not become another competing strike. |
| Timing | Lock basics to 800 ms/contact 350 ms and ultimates to 2200 ms/contact 1100 ms. Express weight through spacing inside that envelope, never extra walk-up time. |
| Exaggeration | Enlarge the weapon silhouette and directional smear at release. Increase effect contrast at contact while preserving faces and body outlines. |
| Solid drawing | Preserve joint overlap, plausible pivots, front/back ordering and consistent opaque body height. No gaps between painted cut-outs at extreme poses. |
| Appeal | Each cat keeps a recognisable pose and weapon motif in silhouette. Removing colour must still distinguish the ultimate from the other twelve. |

Sources: S01, S02, S04, S05. These are applications to our game, not copied character poses or source artwork.

## Impact, readability and sound

Hit-stop is a presentation pose hold, not a delayed rules hit. Hold the attacker/recipient pose for 60–90 ms at contact, keep the master beat advancing, and let the recovery absorb the hold. Target flash lasts 1–2 frames at 30 fps. The cue starts at the same contact event as recoil and damage display. An impulse delayed until the end of the spell reads as a miss. S03/S06 motivate response layering; the numerical limits come from the user, not from these talks.

A smear bridges two clearly different poses. It is a tapered blade, scratch, streak or splash, attached to the strike vector. A screen-filling white rectangle is not a replacement for contact. A bright core, a differently shaped travel body and directional debris give three readable layers; three copies of the same circular glow do not. S02/S07/S08.

Use a quiet–fast–hold–falloff contrast curve: low-value anticipation, saturated body, brief pale core at contact, darker broken residue. Keep additive compositing on effect layers. Character texture and ground retain tonal structure. Use the smallest strong shape that communicates the affected targets, then satisfy the user's ultimate footprint through a directional composition rather than indiscriminate bloom.

Readability is tested at actual desktop size and in a downscaled strip. Inspect the frame before impact, the contact frame and the first reaction frame. A camera move can hide weak posing; it is forbidden here. Use no camera shake in the pilot; the later production maximum remains 4 px/120 ms on ultimate impacts only.

Weapon audio has a short anticipation whoosh and a contact transient. An ultimate has one voice line at focus, then cast/impact/tail with a maximum four simultaneous voices including music. Transient analysis establishes a timing candidate; it cannot establish whether a sound is pleasant or whether a voice was actually heard. Listening remains an explicit review row, never inferred from a filename or a spectrogram.

## What the reference does not justify

Our reference clips are viewed at 10 fps with 100 ms sampling uncertainty; v1 displays x2 and v2 x3. They cannot prove a 33 ms sync tolerance or a 60–90 ms hit-stop. Several reference actions obscure targets, use approach runs or replace the field with a cinematic. Those behaviours remain rejected by F2/F3/F5. `REFERENCE-BREAKDOWN.md` separates observations, estimates and unknowns.

## Stack facts

The checked-in renderer is Three.js with an orthographic field, the repository's `CutoutMesh`, and Canvas2D field VFX—not a PixiJS battle renderer. `spine/assets.ts` loads converted JSON through the native cut-out player; a folder or class named Spine does not mean the proprietary runtime is the active renderer. Use existing original rig/atlas assets, Canvas layers and seekable clocks. No engine migration, external art extraction or Spine purchase is needed. Sources L01–L05.
