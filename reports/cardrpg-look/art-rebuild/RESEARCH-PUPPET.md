# Illustrated puppet technique review

2026-11-11 local / 2026-11-10 UTC. Existing ART-DIRECTION, VFX-WORKFLOW and R1-DECISION read first. Their palette, original concepts, sockets and event ownership are retained; the user's all-puppet decision supersedes the older native-3D recommendation. This fills the previously missing research file, not a new roster build. No game artwork, rigs or animations were downloaded or copied. Named commercial games are aesthetic goals, not evidence of their proprietary implementation.

## Cut, fill and articulate

- Preserve the concept silhouette and face. Our minimum parts are body, head, front arm/prop, rear arm and tail; add wings, cape or hat only where the source supports a useful independent gesture. Retain 6–10 parts per unit rather than splitting every painted detail.
- Put pivots inside shoulder/neck/tail roots. Keep 12–24 source pixels of hidden overlap at 1024px; fill only pixels concealed by a foreground part. Our existing OpenCV Telea fill and authored masks already implement this. Inspect the widest pose for seams, not only the rest reconstruction.
- Rigid textured pieces protect faces and ornate props. A small mesh can bend long cloth or tails; sparse vertices and joint-local weights control deformation. Do not skin painted eyes, embroidery or solid shields merely to gain movement. [Spine mesh documentation](https://esotericsoftware.com/spine-meshes) and [weights documentation](https://esotericsoftware.com/spine-weights) explain these mechanisms; no Spine dependency or license purchase is needed for our authored renderer.
- Keep one WebP atlas per unit: cats <=1024px, bosses <=1536px; 4px colour/alpha padding around packed regions. Existing atlas/JSON/source provenance stays authoritative. A deformed tail is an optional later improvement, not grounds to rebuild accepted units.

## Timing and secondary motion

The following are authored targets for this game, not timings claimed from another game. At 60fps, a basic 36-frame gesture has 8 frames anticipation, 6 travel, 3 impact hold and 19 recovery; scale to the existing action beats without altering game outcomes. Ultimate prop lift holds for about18frames/300ms before release. A 2–3frame/33–50ms visual hold may emphasize a crit, but never pause the rule clock or double-count an event.

Use smooth cubic ramps and 10–15% recovery overshoot. Root squash at impact is at most4%; head rotation3–6degrees, props10–18degrees, tails4–8degrees. Tails/cloth lag the main motion by3–5frames, with deterministic per-unit phase. Idle breathing stays below1.4% scale; blinks last6–9frames every3–5seconds. Hurt tint must decay within60–100ms and leave concept colours visible. Defeat holds a lowered pose; victory opens the prop silhouette. Reduced motion keeps all gameplay information and removes shake, flash, drifting particles and pose oscillation. Current shared gestures are coherent but restrained: individual follow-through is the most valuable later quality work.

## Sprites inside the cafe

- Face the camera as one unit group, then apply local part depth0.002–0.008world units to avoid fighting. Stable layer order and depth testing are required; transparent triangles are not automatically sorted within each mesh. Keep alpha-tested opaque silhouette cores and explicit ordering for translucent overlays. [three.js transparency](https://threejs.org/manual/pages/transparency.html).
- Camera-facing planes preserve readability while the stage supplies perspective. Contact shadows anchor feet; already-painted lighting should receive a subtle warm/cool tint, not a second strong shading pattern. [three.js billboards](https://threejs.org/manual/pages/billboards.html).
- Existing P3 composition is accepted: cats40–50% of canvas height and bosses1.7–1.9times cats. Maintain A6 top82px/bottom148px safe envelopes. Review broad Rain Spool at actual impact as well as idle; normal bounds alone do not prove uncrowded staging.
- P7 uses the existing warm cafe and original night window. Add subdued moon/cool window light and enemy-side thread/crumb accents outside feet. Keep foreground faces brighter than the window; cap sprite tint at roughly5–8%. Do not generate normal maps that invent facial volume from painted shadows.

## VFX and numbers

Four readable beats: charge150–250ms, travel100–200ms, impact50–100ms, afterglow250–450ms, fitted to existing action durations. Start at the authored moving prop socket, finish at resolved targets, reserve face and HUD lanes, and use a bright compact core with a larger low-opacity envelope. Preserve each cat's existing original VFX master/motif and colour. The same timing contract atx2/x3 must not lose the impact cue; audit representative fast playback during P10.

Ultimate push-in stays at the existing5.4%, crit shake about2–4screen pixels and ultimate shake4–6pixels, suppressed with reduced motion. One canvas text layer owns visible totals; the existing DOM labels remain accessible. Numeric aggregation must preserve crit/heal/shield/KO semantics. Prefer25–28px high-contrast text at1440x900, bounded pop/floating in the reserved lane, no labels over faces. P6's restored brief hit tint fixes the overlong white silhouette; the saved49+6cast evidence should be reused.

## Tools, rendering and acceptance

Use current local Python/Pillow/OpenCV scripts for masks, overlap fill and deterministic packing; Krita is a free manual option for difficult source painting and transform-mask curve previews. [Krita curve documentation](https://docs.krita.org/en/reference_manual/dockers/animation_curves.html). DragonBonesJS has an [MIT runtime](https://github.com/DragonBones/DragonBonesJS/blob/master/LICENSE), but changing runtimes now would add migration and verification without improving our already delivered art. Keep the small three.js puppet implementation.

Cache geometry, materials, atlas textures and VFX pools; update transforms/uniforms in place. Atlas sharing does not itself batch independently drawn layers. Target<=120draws in a representative cast, no per-cast texture allocation, and actual x1 frame p95<=33ms on this Mac. The P6 recorded warmed casts are16.8ms; do not mislabel this as cold startup or all-game performance. WebP is already supported by the lean builder. Add KTX2 only if measured GPU/size pressure justifies decoder bytes and the new asset pipeline. Combined A6 delivery must remain<=40MB; include offline base64 overhead, not just raw assets.

## Research-to-queue gaps

P1–P5 stay accepted and ticked. P6 closes from saved visuals plus one missing parity pass. P7 adds restrained stage accents with paired captures and current cast timing. P8 reuses existing pixels and exports only missing portrait formats. P10 addsx2/x3/reduced-motion representative checks while producing the requested x1films. After P11, improve the lowest motion row with one authored follow-through pilot, then review Rain Spool crowding. Each issue gets at most3repair attempts; retain the simplest clear result.
