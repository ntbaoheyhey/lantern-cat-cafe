# Lantern atelier authoring provenance

Original procedural art only; seed20261107. No generative model calls, reference-game art, external model, texture, brush or HDRI. Parameters and per-asset hashes will be recorded alongside each export. Targets in LOOK-BIBLE are not proof of execution.

## L0 inventory

- Host macOS arm64; initial disk377GiB available. System Python3.9 venv at `~/tools/cardrpg-look/venv`.
- Existing: Node24 / pnpm10.28.0, ffmpeg, cwebp, pngquant (exact version receipt follows).
- Installed outside repo: numpy2.0.2, Pillow11.3.0, OpenCV5.0.0.93, scikit-image0.24.0; glTF-Transform CLI, sharp, meshoptimizer, Playwright under `~/tools/cardrpg-look/npm`.
- Blender Homebrew cask5.2.3 download failed HTTP403 from official host. Blender4.5.3 LTS official distribution mirror at ftp.nluug.nl is downloading; SHA256 must be verified before use. No fallback-art claim.
- No repository dependency/lockfile edits. Missing optional compression tools are recorded, not silently claimed as used.

## Palette

`look-tokens.json` and scoped CSS: manually authored hex/material/light/camera values, seed20261107. No image input. Intended renderer colour-space sRGB tokens decoded to linear by Three.js.
