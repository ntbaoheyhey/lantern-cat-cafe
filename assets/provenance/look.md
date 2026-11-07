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
