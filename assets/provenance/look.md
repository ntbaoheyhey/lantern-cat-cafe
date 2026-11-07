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
