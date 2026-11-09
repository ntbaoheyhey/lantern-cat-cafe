# Lantern atelier authoring provenance

Original procedural art only; seed20261107. No generative model calls, reference-game art, external model, texture, brush or HDRI. Parameters and per-asset hashes will be recorded alongside each export. Targets in LOOK-BIBLE are not proof of execution.

## L0 inventory

- Host macOS arm64; initial disk377GiB available. System Python3.9 venv at `~/tools/cardrpg-look/venv`.
- Existing: Node24 / pnpm10.28.0, ffmpeg, cwebp, pngquant (exact version receipt follows).
- Installed outside repo: numpy2.0.2, Pillow11.3.0, OpenCV5.0.0.93, scikit-image0.24.0; glTF-Transform CLI, sharp, meshoptimizer, Playwright under `~/tools/cardrpg-look/npm`.
- Blender Homebrew cask5.2.3 download failed HTTP403 from official host. Installed Blender4.5.3 LTS from official distribution mirror ftp.nluug.nl. DMG SHA256 `73ea841053b55404bb3a71a9a22366f1f8821787fe5c899f8b55a7fff929d01b` verified against official checksum. Local path `~/tools/cardrpg-look/Blender.app`; no fallback required.
- No repository dependency/lockfile edits. Missing optional compression tools are recorded, not silently claimed as used.

## Palette

`look-tokens.json` and scoped CSS: manually authored hex/material/light/camera values, seed20261107. No image input. Intended renderer colour-space sRGB tokens decoded to linear by Three.js.

## Verified versions (resumed L0)

Blender4.5.3LTS (2025-09-09), glTF-Transform4.5.1, ffmpeg9.0.2, cwebp1.6.0 (sharpyuv0.4.2), pngquant3.0.3, Node24.22.2, pnpm10.28.0, Python3.9.6. Python imports verified: numpy2.0.2, Pillow11.3.0, OpenCV5.0.0, scikit-image0.24.0. Optional toktx/magick/avifenc/oxipng absent; do not claim KTX2/AVIF usage. WebP and meshopt pipeline available. Baseline uses Playwright Chromium Metal, DPR2, two desktop sizes, paused at3.5s/action progress.46, six stills per lock.

## L1 hero sculpture and exports

- `tools/cardrpg-look/blender/author.py`, Blender4.5.3LTS, seed20261107, `--background --threads 4 --cat <id> --round <n> --bake --render`. Game-axis to Blender-axis conversion preserves28/29/28 original Mochi/Soot/Clover named pivots exactly; rest transforms independently audited. Original geometry: pear torso, cheek ellipsoids, quad-loft ears, Bezier tail, thick subdivided cloth, eyelids/glints, ceramic shield, folded hat, herb satchel. No original mesh artwork imported; old GLB JSON supplies transform hierarchy only.
- Bakes: single combined deterministic UV atlas1024²; Cycles16samples; color,roughness,AO,metallic,curvature, selected-to-active tangent normal. High sculpture subdivision2 + Clouds displacement.004, noise scale.038; cage.035/ray.08. AO multiply .78+.22*AO; game normal strength.22. Joined only by existing animated pivot. Exact author script snapshot/hash and GLB hash per round.
- Current author receipts: Mochi round7 11750tri, Soot round5 11764tri, Clover round6 11744tri; each17draw meshes. Earlier rejected UV/cloth rounds remain in reports.
- glTF-Transform4.5.1 optimize: meshopt, WebP1024, no flatten/join/instance/palette/simplify/prune; preserves named nodes. `packing.json` records actual before/after/gzip bytes and outputSHA. Original classic GLBs untouched; dedicated offline builder can use compressed classic copies. No toktx/KTX2 claim.
- `render.py` imports the exported game GLB. Portrait Cycles64samples at1024×1280 (4×256×320 display), downsamples with sharp/Lanczos3 to512×640 and256×320, WebP92/alpha100/effort6. Original procedural area key(-3.5,-4,5)/650W/3.2m, rim(3,3,3.5)/800W/3m, fill(3,-4,2)/120W/4m, AgX. No external studio environment.
- Turntables: same GLB,48rendered384×480frames/12fps, Cycles16samples, H.264 CRF19; these are preview-resolution videos, not4×portrait renders. Per-asset receipt binds sourceSHA.
- In-game atelier material adds a smooth three-band diffuse ramp and view rim to the baked PBR material. Fitted gear brooches/tokens replace oversized legacy visual overlays only for atelier models; item state/combat rules unchanged.
- Runtime motion follow-up: atelier-only Mochi shield-arm retarget scales pitch.65/clamps-.90rad and sends the shield roll outward.65, preserving original clip timing. Equipped weapons become original enamel wrist seals on armR (52×61×18mm ellipsoid +44mm brass ring and visual-index glyph); no duplicate utensil beside the paw. Classic rig/equipment code path unchanged. Reviewed against72 actual runtime samples; see motion-pilot-1 for the rejected candidate.

## L2 original café continuation

Original source `tools/cardrpg-look/blender/stage.py`, Blender4.5.3/Cycles24, seed20261107; preserved round3 has49,600tri/3draw meshes. All geometry, stitched fabrics, lathed ceramics, cat tree, foliage and512px night/bokeh painting authored by code; no imported art. Color/AO/roughness/tangent-normal/irradiance atlases baked2048px. Studio rounds1–3 and review notes under reports/cardrpg-look/rounds/stage.

Game packing: glTF-Transform4.5.1 `optimize --compress meshopt --flatten false --join false --instance false --palette false --simplify false --prune false --texture-compress webp --texture-size 2048`; geometry/UV preserved. Separate irradiance `cwebp -q 90`. Stage5,958,428→995,984bytes; irradiance3,981,654→748,354bytes. Source/output SHA256 and gzip sizes in assets/cardrpg-look/stage/game/packing.json.

`turn3d/look-stage.ts` adds deterministic steam/dust, bounded lantern shafts, chapter tint and two inverse-square point lights. Stage is imported only for atelier automatic battles; load failures and disposed previews release their owned geometry/materials/textures. Actual game camera and performance acceptance remain pending.

Round4 (source9e22199f) lowers fabric top below the existing .044m contact plane, uses neutral walnut #60534C and token teal walls, retains separate emissive paper lamps and adds their inner glow rims.50,272tri/4mesh draws; GLB6,027,476→1,015,272bytes, irradiance3,942,787→753,106bytes. Reproducible packing command is now `node tools/cardrpg-look/pack-stage.mjs`. Runtime camera24° pitch/target1.1m, with distinct preset ratios even at short desktop canvas heights. No other game's references used.

## L3 analytic light and post pipeline (audited02ffd9cb)

Three.js0.180.0 (existing dependency), own analytic16-cube grading LUTs from `tools/cardrpg-look/author-lut.mjs`:256x16 RGBA strips, three chapter shadow/highlight/saturation parameter sets recorded in look-luts.json. Own128x64 floating-point reflection generated in look-environment.ts from Gaussian pendant/window lobes; PMREM filtering from Three. No HDRI or artwork input.

High:12-sample depth AO/contact, soft-knee1.25HDR bloom at quarter resolution, face-protected depth focus and screen-depth outline, analytic grade, subtle stationary grain/vignette,2-sample HDR plus SMAA. Balanced: same preallocated targets, no AO/DOF/SMAA. Low: direct sampled canvas with baked materials/rim/light. No claim of temporal AA, GTAO, full shadow maps, or a separate matcap shader. Canvas-only; DOM HUD is outside post.

SMAA implementation and mathematical area/search lookup textures are bundled with the existing Three.js0.180.0 addon. These are algorithm lookup data, not art references. Exact licence copied to assets/provenance/licenses/three-smaa-MIT.txt (MIT, Copyright2010–2025 three.js authors). No external models/textures/brushes or generative calls. Loading prewarms targets, LUTs, lookup samplers, shaders and output variants; browser/profile acceptance remains pending.


## L4 original volume / particle / ribbon pipeline (in development)

Source `tools/cardrpg-look/blender/flipbooks.py`, Blender4.5.3 LTS Cycles, deterministic seed71107+familyIndex×131. Six families: smoke/steam/flame/sparkle/yarn-dust/ribbon. Thirty-six256×256 original rendered frames each,6×6atlases, explicit premultiplied encodedRGB and lossless WebP. Analytic volume density nodes, bevelled four-point particle meshes, curled fibre curves and thickened ribbon strips; no imported images/models, no generative tools. Exact source/seed/range/image hashes stored per6-frame receipt. Firstpass is24samples and not visually accepted; reviews underrounds/flipbooks.

Runtime originalshader replaces flat shading while retaining originalrecipe geometry/timing. Existinginstancedpools remain96instances/8primitivecalls. Texturedquad/ribbon additions share thatgeometry; allface/overdraw controls are shared. Two impactlights allocatedbeforewarming; stage renderedonce, depth sampledonlyduringisolatedeffectpass. Newpipeline is being checked, no performance/visualacceptance claimed yet.

Rounds2–3 use64Cycles samples with the same family seeds, not an upscaled or interpolated24-sample render. R3 source1577ff08 uses neutral smoke/steam lighting,2px Gaussian source filtering, radial volume falloff from0.20to0.50, density factors smoke2.3/steam3.8/flame4.0, flame emission4.2 with weak50W/30W key/rim. Sparkles use22bevelled four-point glints, yarn dust22curled nine-point filaments, ribbon3thickened48-segment strips. Per-frame timing and full parameters are in the preserved round scripts; R3 completed216frames and all six contact sheets were personally inspected;1,064,346bytes of lossless atlases, no border alpha. Source review remains provisional until the combined runtime compositions are checked.

The runtime fills the original cup/teapot/greenhouse outlines with authored lathed, spherical and bevelled extruded surfaces within their existing pools. View-dependent ceramic/metal highlights, derivative-filtered paper fibres and glass Fresnel edges are analytic GLSL, with correct instance-scale normals and target-specific tone/colour conversion before premultiplication. Face-core rejection remains unchanged; the outer edge tapers over squared radius1.0–1.6. Glass body alpha0.16 plus rim0.30. Native preflight763ef7bd proves GPU warmup and exactly-once resource cleanup before the last glass/face-edge adjustment; those last changes await fresh browser captures.

## L6 original card art

Sources: `tools/cardrpg-look/blender/art-portraits.py`, `art-icons.py`, `icon_solids.py`, `art-frames.py` and `icon-compositions.json`. Blender 4.5.3 LTS / Cycles 64 samples / AgX Medium High Contrast. Historical renderer snapshots, exact input/output SHA256 receipts and two-background contact sheets are preserved under `reports/cardrpg-look/rounds/art`. No external artwork, image generation, model service or new runtime dependency.

Portraits use the actual exported game geometry: the three L1 sculpted hero models and nine inherited roster models, explicitly labelled until L5. Seed 20261107, transparent 1024×1280 renders for 256×320 display. R2 moves the studio camera toward the front and tightens the minimum orthographic field to 1.85 with 5.5% bounds protection. R3 hero head tilts only affect the imported studio scene; game GLBs remain byte-identical. Original warm/cool disk area lights and soft world fill provide all illumination.

All 48 skill icons are original rounded, bevelled miniature objects assembled from the existing authored effect vocabulary plus new ceramic, paper, leaf, cloth and metal bodies. Seed 71107 + composition index, 256×256 source for 64×64 display, original warm key/cool rim/fill. R2 adds solid objects and material detail; R3 tightens minimum orthographic field to 2.15, enlarges secondary motifs, separates the pan/tray forms and fills the crescent. Camera expands when necessary to protect the complete silhouette. Per-image receipts retain exact field, seed and composition parameters.

Four static rarity plates use seed 711070 + rarity index, 1024×1280 source, original enamel/brass rails and pearl/leaf/flower/sunburst ornaments. The center is transparent; these are baked lighting plates, not animated foil. Token colors and exact author hashes are recorded with each render.

`pack-art.py` downsamples premultiplied color with Lanczos and writes lossless exact-RGBA WebP at 1x/2x. Both decoded sizes/pixels, transparent source borders and frame centers are checked. `deliver-art.py` verifies source, archived author, model and packed-image hashes before writing the version-2 repository-root manifest and two padded skill atlases. Browser/runtime/size acceptance is recorded separately in L6 validation; availability and source provenance alone do not establish those results.

## L5 first roster batch — runtime candidates, 2026-11-07

Panko R3, Cinnamon R3 and Mallow R4 are original procedural Blender4.5.3 sculptures. Seed20261107; source recipes `tools/cardrpg-look/blender/roster-author.py` and `roster_sculpt.py`, archived per-round snapshots and source-map receipts under `reports/cardrpg-look/rounds/roster`. Named transforms alone are retained from the inherited game GLBs; no external mesh, texture, brush, HDRI or generative model.1024px color/AO/roughness/metallic/curvature/tangent-normal maps,16 bake samples, subdivision2/displacement.004 normal source. Geometry≤12k; packed with glTF-Transform4.5.1 meshopt/WebP1024, no simplify/flatten/join/prune. Exact model hashes and bytes in `assets/cardrpg-look/game-models/l5-batch1-packing.json`. R1 unbaked white exports rejected; R2/R3/R4 visuals retained. Static review is not browser animation or performance acceptance. Existing portraits remain labelled inherited until L5 renders are approved.

## L5 roster / opponents continuation and packing study

All nine roster raw sources now use the same original procedural rig-preserving sculpture/bake pipeline; rounds/roster contains archived author/sculpt snapshots, per-object triangle allocation, maps and fixed-camera reviews. The refreshed nine portraits are actual1024x1280 Cycles renders before downsampling; manifest tiers are improved-roster-model, not inherited.

Runtime candidates use glTF-Transform4.5.1 resize colour512px/detail256px, WebPq80 effort100, meshopt high, without geometry simplification. The raw1024px source GLBs remain available for studio portraits. Exact input/preview/output hashes and all commands are in validation/l5/compression/*/packing.json. Rejectedq92 attempts and original failures are preserved. Firstthree compression selected after15 viewed image pairs; remaining candidates require their own studio/runtime review. The current game-model selection is inventoried by validation/l5/runtime-candidates-15.json.

Opponent authoring uses opponent-author.py/opponent_sculpt.py, seed20261107, original household silhouettes, cloth seams/wound curves/glazed bodies. Exact inherited named rig pivots are copied, but no inherited mesh is used. Same1024px six-channel source bake,16samples/subdivision2/displacement.004; budget7800regular/19800boss. R2 Pollen gets a woven basket rim/handle and pale pollen; Rain Spool gets blue glaze/hood/end inlays; Binding Thread returns to an open three-strand twisted loop. Pending candidates are not declared accepted. No external artwork, generative calls or runtime dependencies.

L5 source selection now contains all nine cats, ten ordinary opponents and three bosses. Corrected exports include Sock R5 fitted heel patch/stitches, Rain R4 seated face/cap, Crumb R3 visible eyes, Yarn R4 winding/tail, Pantry R3 attached tie, and Cushion/Kettle R2. Exact raw and packed hashes, historical authoring reviews and completed turntables are recorded by `tools/cardrpg-look/l5-selection.mjs` after personal review; phase runtime/performance acceptance is separate. Raw22-model total59,609,460bytes; texture-reduced meshopt runtime candidates total about4.55MB. No geometry simplification is applied during packing.

Look-only motion fits move plates, spoons, flasks and Pollen's basket outside their broader sculpted cheeks. Sock ankle-pivot rotation gains a translation track that keeps the upper leg attached; original quaternion angles and clip durations remain. Fourteen focused tests cover the classic track values, timing and interpolated Sock hip location. Studio turntables use48frames/384x480/Cycles24/12fps; runtime samples use the actual AnimationMixer. The Look-only model gallery uses a3.3m field (4.6m for Yarn), after retained Pollen/Rain/Yarn foot-crop failures; this does not change battle camera fields or classic gallery framing.

## B2 V1 readable framing — 2026-11-08
Original code-only changes; no imported artwork, model service or generative call. Three0.180.0 camera B width10.6/min-height3.8, position(0,4.7,12), target(0,1,0); A9.6/C12.0. Formation authored in card-staging.ts; player scale×1.25, regular×1.38, boss×1.5. Deterministic, no random seed.
The accepted cafe.glb/atlas stay byte-identical. `tools/cardrpg-look/b2/mat-indices.mjs` uses glTF-Transform4.5.1/MeshoptDecoder to identify4158 vertices of original disjoint woven mats/fringes by connected components and world bounds. Runtime retains UVs, narrows mats×.9, shortens depth×.8, centers±2.6; hostile cloth vertex tint(.61,.27,.39). Seed none; original stage seed20261107 retained. All changes gated by lookV2 and B2 comparison. Parameter review continues in b2/v1 rounds.

## B2 V2 readable opponents — native Three.js parameters, seed1808
Existing original Blender meshes/atlases retained. Body tint #80506c, roughness.84; eye rims #ffe0b2, emissive #ff9d48/.22; plum Fresnel contribution(.27,.025,.065), power2.5. Eye sockets scale1.14/1.2/1.04; handles/cuffs/spindles/needles/wings/crowns/helms/steam scale1.16/1.12/1.08. No imported art. Boss contact pool #49293e/.78. Three sphere yarn spills + original cylinder/torus toppled cup, constructed once during loading. Opponent shader variant also warmed before scene-ready.

B2 V2 visual round2 correction after actual1280/1024 capture: body tint #96667e; opposing baked mat vertex multiplier(.85,.48,.58); fallen cup #b88870. Original seed1808 retained.

Kettle Knight remains a rules elite; presentation-only boss emphasis requested by B2:2.1 scale factor (existing elite base.72), .12-unit intro lift, five pooled teapot floor glyphs. No tier/data change.

## B2 V4 HUD
Existing L1/L5 portrait1x and L6 icon1x WebP reused byte-for-byte. CSS conic cooldown rings, no new bitmap. Display-name receipt card and sequence/discovery.id v2 deduplication use textContent; original v1 semantics retained.
## B2 V5 procedural effects
Tool: Three.js existing instanced primitive pools + GLSL; deterministic seed1808, no bitmap/model import.
All twelve ultimates and basic skills retain authored motifs/palette/timing. A200ms gathered floor ring immediately precedes travel; impact expands into a<=650ms keyed afterglow, within the existing plan duration. Two existing foot lights peak1.15/0.65 rather than0.85/0.55; no added lights/per-cast material allocation.
Clover greenhouse uses original profile glass with honey frame ribs, surfaceKind6, panes at0.46+0.18rim opacity, procedural22x light shafts and ground-up growth. Existing leaf/petal recipe and protected face ellipses remain.
Shake: camera distance/FOV/viewport-derived2.5pxX +1.79pxY maximum, combined<4px; previous rendering retained whenB2OFF. Number backing#142932, warm/green/blue text; CSS only.

## B2 V6 embedded lean variant
Tool: tools/cardrpg-look/build.mjs with LOOK_LEAN=1; native Node/sharp(libvips), no generative or external art. Deterministic, no random seed. Existing atelier portrait2x keys use their own1x siblings; legacy B portrait/texture images are resized inside256/1024px respectively, without enlargement, and encoded WebP quality82/alphaQuality100. Select only smaller gzip payloads. Original source files remain byte-identical. Every selected key, original/result bytes and method is retained in the lean build receipt. Six fixed full-frame SSIM samples compare the full and lean offline artifacts. Gallery thumbnails use sharp640px/WebP82 and a1200px/WebP84 ultimate sheet derived only from our headless captures.

## Skills V5 V0 status marks (2026-11-09)
16 original vector icons: assets/cardrpg-look/statuses/{scald,scent,brittle,tangle,drowsy,hush,rattled,steep,cozy,crumb,riposte,link,sprout,decoy,glaze,shelter}.svg. Tool: hand-authored SVG paths in card-status-data.ts, exported by node tools/cardrpg-look/skills-v5/icons.mjs. Params: 24-unit grid, 64px SVG archive, 2.2-unit rounded strokes; HUD draws the same paths at 16px inside a 20px duration ring. Seed: 0 (deterministic; no randomness, external art or generative tool). Colors from approved visual table, signature accents derived from that palette.
Persistent marks and transient apply/tick/expiry/crumb-burst compositions reuse the original B2 pooled cafe primitives and flipbooks; no new textures, meshes, lights, models or runtime dependencies. Params recorded in card-status-looks.ts; opacity .65–.80, body anchor .42×model height, crown .85×root scale above the live protected-face center (fallback height+.18); Burn count equals 1–5 stacks. Seed: 0 (deterministic index spacing).

### Skills V5 V0.1 readability · 2026-11-09
Tool: authored TypeScript/Three geometry and GLSL (no image/model generation); deterministic, seed not applicable. Reuse original flame/cup/steam/bubble primitives and existing atlases. Crown backing: 1.8×1.35 XY plane at z=-.08, radial edge .65–1, ink linear RGB(.012,.026,.033), .72 backing multiplier, same instanced draw. Burn: .30-height-scaled solid flames, alternating camera-facing sides at .33+.07×row height, vertical .16−.20×row, existing glow at .32 multiplier. Warm/Glaze: .76 alpha thin rings, no glass-opacity attenuation on persistent halos. No new texture, model, runtime dependency or light.
