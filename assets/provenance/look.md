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
