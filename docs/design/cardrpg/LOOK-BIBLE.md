# The Lantern — Lantern atelier

Original art direction, 2026-11-07. Source of numeric truth: `apps/web/src/game/cardrpg/look-tokens.json`. This document states targets, not achieved scores. No external game imagery, imported models, textures, HDRIs or generative models.

## Palette and value

An intimate night café made by a ceramicist and a tailor: round porcelain eyes, plush fur, visibly sewn cloth, oiled timber, little pools of honey light. Warm heroes sit against a quiet cool room. Ink `#172D36` / night `#102129` anchor the image; panel `#233E46` / raised `#304C53` bridge scene and UI. Cream `#FFF0D2` is the focal light, paper `#E8D7B8` the secondary light, muted `#B3C0BA` the supporting text. Honey `#F3BB61` / amber `#CF8742` mark lanterns and selection; coral `#E78570` marks hostile accents, mint `#9CCBB1` friendly support, iris `#B9A5DC` arcane, sky `#8ABFCB` moonlight. Wood `#805A46` / `#A27655` stays subordinate. Outline `#28333B` is coloured charcoal.

Three-value squint target (display luminance): background .12–.32, body/cloth .38–.68, face/eye rim .76–.94. Face/background separation ≥.18; avoid white bodies merging into cream VFX. Saturation concentrates on one accessory and the eyes; scenery median saturation ≤75% of the subject crop. HUD text is ordinary DOM, outside all post passes; cream on panel must exceed WCAG 4.5:1.

## Sculpt and materials

Friendly silhouette: rounded pear torso, large cheek mass, tapered ears with soft rims, expressive almond eyes, visible paws and curved tail. Three distinct hero silhouettes: Mochi broad shield/tunic; Soot tall folded hat and curved cloak; Clover low apron and asymmetrical leaf satchel. No uniform recoloured body-only roster. Head occupies 42–48% of height, eyes remain readable at 120px total height. Cat budget ≤12k triangles; boss ≤20k. Keep named body-part transforms for existing clips; geometry belongs to those pivots, never rename a clip target.

Bake procedural colour, curvature/AO and high-to-low tangent normals into UV atlases; retain seed/settings. Fur uses roughness .86, shallow combed noise normals .22, 3-step diffuse ramp .38/.68/1 with wide smooth transitions, warm wrap .30 and cool rim .18. Tufts are actual tapered silhouettes, sparse at cheek/ear/elbow. Cloth .94 roughness, weave normals .30, thickness .012–.025 model units, curved hems/stitches; never glitter. Ceramic .24 roughness with small glaze variation; wood .65 with restrained broad grain, no busy stripes; glass .10 with low-alpha reflected highlights; brass .72 metal/.32 roughness; paper .92 roughness with soft curled edge; yarn .96 with directional micro-normal .36. Eye sclera is cream, pupil near-ink, highlights two asymmetric rounded beads. Matcap fallback is authored from the same studio rig.

## Light, outline and camera

Key at (-4,7,5), warm `#FFE2AE`, intensity3.4; approximate azimuth -39°, elevation48°. Cool rim (3,5,-4), `#9BCBDA`, intensity2.2; fill (4,3,5), `#BBCDD2`, .65; hemisphere cream/wood bounce .55. Final values are tuned by rendered images. Soft key/contact shadow, 2048 map/radius4 High; 1024 Balanced; baked contact Low. Lantern point lights use inverse-square falloff, bounded range and pooled VFX light. Procedural reflected café environment only. Thin warm shafts and cool depth fog preserve faces; background fixtures never become equal focal points.

Outline target1.15px at DPR1, distance-aware clamp.7–1.6px, charcoal; face weight.45. No dark crosshatch on fur microtexture or double outlines at seams. Prefer silhouette hull for characters and depth discontinuities for props. Camera near60mm equivalent, modest24° downward angle; actors 24–30% of stage height, 8% head safety. A/B/C framing keeps every formation slot readable. Foreground objects frame corners; no giant empty rug or tall prop covering a face. Hero portrait camera and light use the actual game mesh, rendered at4× then delivered at2×/1×, never upscaled.

## Finish, effects and variations

High: linear HDR → scene AO/contact → threshold1.25/knee.35 bloom(.18) → authored16³ chapter LUT → very gentle background DOF(≤2.5px) → vignette.10 / grain.006 → antialias/output. Protect face masks from bloom and DOF. Balanced removes screen AO/DOF, reduces samples; Low uses baked/material lighting and matcap fallback. Auto tier uses measured frame history with hysteresis; explicit tier remains selectable. Prewarm all render targets/programs before Ready. No postprocessing on text.

Effects are craft materials: Mochi folded paper/sunlit brass, Soot ink/velvet smoke, Clover tea steam/leaf light, roster accents extend this language. Use tapered continuous ribbons, premultiplied soft-edge flipbooks, depth-faded particles, brief contact light, small ground impact decal and restrained screen shockwave. Anticipation identifies the caster, impact identifies the target, settle clears the face. Reuse existing pacing/hit-stop/shake budgets; no gameplay timing changes. Unique recipe motion/shape/timing must survive palette changes. Bloom is a halo, never the body of a shape.

Chapter1: amber supper against teal shadows/coral ceramic. Chapter2: rainy conservatory, moss/mint with pale cream light. Chapter3: moon observatory, blue-grey/iris with warm brass. Keep hero colours stable. Rarity lighting: common paper/silver(.05 foil), rare sky(.12), epic iris(.20), legendary honey(.28); foil stays behind the portrait. No rarity changes to combat or economics. UI plates and48 skill icons are rendered from these same materials; meta screen adoption belongs to Lane A.

B2 camera revision (presentation opt-in): preset B world-width10.6/min-height3.8; low view(0,4.7,12) toward(0,1,0); A9.6/C12.0. Tighter woven mats center±2.6 with plum enemy cloth; preserve night window and hanging lamps. Faces/side identity lead, floor recedes. Drift≤.045world units and ultimate zoom≤6%, disabled for reduced motion and speed≥4x.
