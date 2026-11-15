# Realtime VFX toolkit — Q3 apprenticeship

2026-11-15. This replaces the failed Canvas main-shape recommendation in the QR study. Rung 2 shaders/meshes and Rung 3 offline flipbooks are methods under test. No drill or production effect is accepted by this document. Source IDs resolve in CRAFT/sources.json and LEARN/sources.json; local experiments are in LEARN/Q3.md.

## A. Flipbooks and one-shot texture animation

Professional method (Q3-T04, T05, T07):
- Author the shape's evolution before packing its frames.
- Use an atlas index to address a tile with a consistent pivot.
- Distinguish a looping ambience from a finite burst.
- Blend adjacent frames when interpolation helps, while preserving sharp contacts.
- Keep frame order, UV orientation and transparent padding explicit.

In our renderer:
- Render 24–32 original RGBA frames offline from the same seekable shader scene.
- Pack a regular grid with two-pixel extruded borders using existing sharp/Pillow.
- Select floor(age * fps), clamped to the last frame, and end visibility explicitly.
- Test 24 and 30 fps; suppress sub-frame blending across the labelled contact accent.
- D4 compares direct renders and atlas playback, including first/last tile and seams.

## B. Alpha erosion and dissolve

Professional method (Q3-T01, T06, T10):
- Keep the source alpha responsible for the painted silhouette.
- Sample a bounded noise field separately from colour.
- Animate a threshold through the noise to remove spatial regions.
- Use a narrow smooth transition at the advancing boundary.
- Bias breakup along the energy direction, then let smaller fragments outlive the body.

In our renderer:
- Precompute seeded value-noise data once; upload as a NoColorSpace texture.
- Multiply painted alpha by a smooth threshold mask in ShaderMaterial.
- D1 compares threshold breakup with a uniformly fading original lantern layer.
- Shape the threshold curve to avoid an unchanged early contour; do not make global alpha the main animation.
- Retain warm edge colour only in the narrow surviving boundary, with no full-quad glow.

## C. UV panning on a shaped trail

Professional method (Q3-T01, T09):
- Geometry defines the outer silhouette and travel direction.
- UV coordinates describe distance along the trail and width across it.
- Texture flow can move independently of the object transform.
- A stable leading edge and a broken trailing edge communicate velocity.
- Lifetime masks control entry and exit rather than leaving an endless scrolling strip.

In our renderer:
- Build a tapered, open arc from paired vertices along an authored curve.
- Use u for path distance and v for signed cross-section; never close it into a ring.
- Pan seeded striations with explicit action age, not wall time or accumulated deltas.
- Combine a narrow pale leading edge with a coloured alpha body and eroding tail.
- D2 tests static texture translation against panned detail on that same mesh.

## D. Mesh shapes and ground decals

Professional method (Q3-T01, T09, T12, T13):
- Start from the dominant silhouette, then add internal detail.
- Use different topology for a fan, ribbon, cone, wall or ground mark.
- Taper endpoints and vary thickness to establish a clear lead.
- Place enough vertices where a curve bends; inspect triangle folding.
- Ground marks belong to the floor plane and should not follow a jumping torso.

In our renderer:
- Use BufferGeometry position/UV/index buffers with deterministic coordinates.
- Keep arc/ribbon constructors separate from fan and wedge recipes.
- Store the floor anchor independently from the actor's posed opacity box.
- Use alpha-blended flattened decals with depthWrite disabled and explicit draw order.
- Reject symmetric main shapes even when the numerical mask narrowly passes.

## E. Colour ramps, blending and readable bodies

Professional method (Q3-T02, T04, T10):
- Establish colour hierarchy with a small bright core and a broader coloured body.
- Fade value and opacity over life independently of silhouette breakup.
- Broad additive layers accumulate and can clip painted detail.
- Alpha blending also hides a background when its opacity is high.
- Deliberate layering and occlusion are necessary in addition to choosing a blend mode.

In our renderer:
- Decode colour textures to linear light; noise and masks remain uncoloured data.
- Convert ShaderMaterial output to sRGB once through the supported shader chunk.
- Put broad effect bodies behind actors; keep foreground accents directional and bounded.
- Protect faces and cap any front-body illumination, with no rectangle visibly punched out.
- D5 measures original edge retention as well as RMS contrast, then reviews the face itself.

## F. Velocity-stretched particles

Professional method (Q3-T03, T05, T08):
- Give each spark a birth time, lifetime, launch direction and initial speed.
- Align the long axis to the instantaneous velocity.
- Reduce speed with drag and curve the path with gravity.
- Let length and brightness diminish as energy is lost.
- Reserve dense short-lived particles for the impact; separate slower debris.

In our renderer:
- Use a fixed seed and closed-form damped motion so arbitrary seeks agree.
- Disable camera-driven stretch; the camera remains static.
- Draw tapered quads with length proportional to velocity and a small base width.
- Share geometry/materials and update uniforms/instance data without per-frame allocation.
- D3 compares undamped linear flight with dragged, stretched sparks at equal launch energy.

## G. Anticipation, contact and timing curves

Professional method (Q3-T11; inherited S01/S03 and private B01/B02):
- Block the preparation, contact and recovery poses before interpolation.
- Make preparation reveal the intended direction and source of force.
- Spend more time near readable poses and less time crossing between them.
- Use an explicit local contact accent with an identifiable duration.
- Let overshoot and settle follow the impulse; equal speed throughout reads weightless.

In our renderer:
- Basic phases remain 0–250 ms preparation, 350 ms contact, 800 ms end.
- Ultimate focus/cast/contact/end remain 600/1100/2200 ms boundaries.
- Hold attacker and recipient pose for 66.667 ms inside the envelope, not by delaying its end.
- Keep the smear and white accent at one or two 30 fps frames; all other layers ease for at least two frames.
- D6 shows four preparation frames and an uncluttered pose strip before any effect acceptance.

## H. Weighted poses, overlap, shadow and local light

Professional method (Q3-T11, T12, T13; local T14):
- Place joints and internal vertices around actual bends in the painting.
- Preserve recognisable volume and stable eyes while the torso changes shape.
- Let the weapon lead, with separate tail/ear follow-through and later settle.
- Keep the ground contact stable through idle and wind-up.
- Use contact shadow and local light to relate the character to the scene.

In our renderer:
- Inspect the actual accepted Soot mesh and clone its data before lab edits.
- Compare root tilt with distinct torso/weapon keys and weighted baked-part deformation.
- Keep floor vertices pinned and limit deformation around eyes/muzzle.
- Give actors phase offsets and measure >=1.5% idle movement without synchronized bobbing.
- D7 checks seams and silhouette change; D8 checks a ground-attached shadow and restrained rim.

## First original-art experiment

`tools/v3craft-lab/q3/texture-study.json` records 60 lifetime samples. At frame 30, uniform fading changes the alpha-support silhouette by 2.42%, while spatial erosion changes it by 27.08%. The last-frame support loss is 83.59% vs 5.78% maximum for erosion; this is a fixed-alpha support measurement, not a claim that a low-opacity fade visually pops. The erosion example still changes too little in its first quarter, so the drill needs a better threshold distribution.

The blend experiment contradicts a simple “use alpha instead” fix. At the tested opacity, retained original face gradients are 67.46% with broad additive, 23.87% with normal alpha, and 99.97% with the effect body behind the cat plus a restrained front core. The split composition preserves body gradients at 99.88%. The sheets visibly confirm the alpha fog hides the face most. This is a static CPU experiment, not a production washout PASS. D5 must test real shader pixels and moving poses.

## Drill acceptance and time

D1–D8 each require 2-second/30 fps footage, 10 fps sheets, a private same-scale reference comparison and two logged revision rounds. The unchanged row mapping is in LEARN/Q3.md. Production effects stay blocked until D1–D6 pass; D7/D8 must also pass before their moves are used. Actual non-overlapping intervals go in craft-times.json; a study, capture or review is never relabelled authoring. There is no failed-pilot rollout exception.
