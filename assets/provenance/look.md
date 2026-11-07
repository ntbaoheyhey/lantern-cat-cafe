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

## L3 analytic light and post pipeline (in verification)

Three.js0.180.0 (existing dependency), own analytic16-cube grading LUTs from `tools/cardrpg-look/author-lut.mjs`:256x16 RGBA strips, three chapter shadow/highlight/saturation parameter sets recorded in look-luts.json. Own128x64 floating-point reflection generated in look-environment.ts from Gaussian pendant/window lobes; PMREM filtering from Three. No HDRI or artwork input.

High:12-sample depth AO/contact, soft-knee1.25HDR bloom at quarter resolution, face-protected depth focus and screen-depth outline, analytic grade, subtle stationary grain/vignette,2-sample HDR plus SMAA. Balanced: same preallocated targets, no AO/DOF/SMAA. Low: direct sampled canvas with baked materials/rim/light. No claim of temporal AA, GTAO, full shadow maps, or a separate matcap shader. Canvas-only; DOM HUD is outside post.

SMAA implementation and mathematical area/search lookup textures are bundled with the existing Three.js0.180.0 addon. These are algorithm lookup data, not art references. Exact licence copied to assets/provenance/licenses/three-smaa-MIT.txt (MIT, Copyright2010–2025 three.js authors). No external models/textures/brushes or generative calls. Loading prewarms targets, LUTs, lookup samplers, shaders and output variants; browser/profile acceptance remains pending.
