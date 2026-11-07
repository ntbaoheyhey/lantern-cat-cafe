# L4 implementation notes — scratch, not integrated

Keep `CardEffectRecipe`/durations/motion and rule ownership unchanged. `CardEffects`
receives the existing lookV2 flag from TurnScene, allocates an optional `LookVfx`
during its async prepare, then awaits its atlas decode and warm before Ready.
Classic `CardEffects` follows the same existing code path. All added files and
assets belong to B. Never alter A's effect tools: copy the necessary harness into
owned tools and retain the original mask/distance rules.

The original recipes retain their structural primitives, motion and anchors.
Additional material treatment is selected per primitive (steam, flame, smoke,
glint, yarn dust, woven ribbon); no random per-frame decisions. Profiles are
computed once for each recipe and layer. A shader uses shared face-mask and
overdraw Uniform objects, so the existing `.material.uniforms.overdraw` toggle
continues to count the entire composition. At most96 total instances; additions
consume that budget instead of claiming a separate hidden pool.

Use a pool of instanced billboards with frame/opacity attributes, 6 textures,
preallocated 32-segment tapered ribbons, ground impact disks and two point lights.
The alpha textures are explicit premultiplied channel bytes; upload ImageBitmap
with `premultiplyAlpha:none`, `colorSpaceConversion:none`, then ONE blending.
Do not let Three multiply alpha a second time. Decode off the main thread before
warming every texture/material/target. Keep sampler cells inset half a texel and
disable mipmaps to avoid grid bleeding. Alpha/face protection applies to both
normal and additive output. Low fallback keeps ordinary depth testing.

Depth fade must avoid framebuffer feedback: post first renders the opaque stage
with the effect root hidden, then renders only that root into its own transparent
target while sampling resolved scene depth. Composite premultiplied RGB over
scene before bloom/grading. No second full-stage geometry pass; effect-only
gallery supplies a clear depth background and one effect pass. Always restore
root parents/visibility in finally and dispose/resize/prewarm the extra target.
Provide a duck-typed `setEffects` hook on LookPost so Classic CafePost is untouched.

Lights belong to the actual stage (not the isolated effect scene), remain present
at zero intensity during warming, and illuminate fur/ceramic near an impact. Face
ablations compare effects on/off with lights explicitly disabled in the off pass;
do not accidentally hide a lighting delta by retaining active lights in baseline.
Projected impact coordinates feed shockwave distortion; reduced motion disables
distortion/light strobe and reduces ribbon travel while preserving skill identity.

Validation after actual integration: six-frame windows under shared lock, save
baseline02ffd9cb before replacing HTML; hero12skills three reviewed rounds and
remaining recipes two; pairwise silhouette/edge/motion distances against the old
verified31 and new matched baseline, keep any regressed pair visible. Face masks,
overdraw<=24,96instances,250draws/150ktri, zero truncation and source-bound first/
repeat<=50ms. New loading cancellation/quality switch checks need atlas bitmap
close and pooled object cleanup; only final L7 gets exhaustive matrix/lifecycle.

`flipbooks.py` and `pack-flipbooks.py` are syntax-checked drafts only. No Blender
image, runtime VFX, performance or visual quality has been accepted at this point.
