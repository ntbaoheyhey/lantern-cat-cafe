# Local model handoff

User asks whether downloading models can remove browser automation from the workflow.

There are two different downloads:
- Character GLB with embedded textures: fully supported by the existing local tools. No generation website is needed after export. Source inspection, geometry/material cleanup, authored rig, packing and game verification run locally. A successful automatic pack does not imply rig or motion acceptance.
- TRELLIS.2 AI weights: the official implementation is tested on Linux and requires an NVIDIA GPU with at least24GBVRAM plus CUDA (recommended12.4). This computer is an Apple M3 Pro with36GB unified memory; the official CUDA implementation does not run directly on it. No weights downloaded, no alternative model silently substituted.

Official requirements inspected2026-11-10: https://github.com/microsoft/TRELLIS.2#-installation

## File workflow

Place an original image-derived character model with embedded textures in `/Users/bao/art/look-v3/inbox`, named after the unit, e.g. `clover.glb` or `yarn-giant.glb`. Keep the source PNG and provider settings with the export when available. Existing Mochi/Soot conversions remain preserved.

`node tools/cardrpg-look/art-rebuild/intake-models.mjs --watch` detects completed copies, validates GLB headers/embedded assets, archives by SHA256 and writes receipts under `~/art/look-v3/local-intake`. No browser, model/API request, credential access, automatic runtime replacement or original-file deletion. `STOP-B`, SIGINT or SIGTERM stops intake. The watcher is optional; the same command without `--watch` scans once.

After inspection, use the existing `prepare-unit.mjs` with that source and an authored unit config. Geometry-specific rig config and real-battle motion review remain necessary, especially for fused paws/props. The agent handles these steps locally from the supplied GLB.
