8. 3D TOOLS ALREADY INSTALLED ON THIS MAC (new Codex account, same Mac) — do this check inside D0/D1
=====================================================================
CONTEXT: You run on a new Codex account, but the Mac (MacBook M3 Pro, 36 GB) is the same one earlier lane B sessions used. Earlier sessions already installed and verified the tools below. Their record is reports/cardrpg-look/art-rebuild/LOCAL-MODELS.md and STATE.md, written by lane B on 10 Nov. Do NOT reinstall or re-download anything. First verify each tool with one quick command (about 5 minutes total) and record PASS or MISSING in TOOLS-3D.md. Only if a tool is MISSING, repair it by following LOCAL-MODELS.md.

ALREADY ON THIS MAC (recorded 10 Nov):
1. Blender 4.5.3 LTS: /Users/bao/tools/cardrpg-look/Blender.app/Contents/MacOS/Blender. Runs headless with `-b --python <script>`. Use it for modeling, retopology/shrinkwrap, UV, texture projection and bake, rigging, animation clips and glTF export.
   Verify: `<that path> --version | head -1`
2. Python tool venv (Pillow, OpenCV, NumPy, scikit-image 0.26): /Users/bao/tools/cardrpg-look/venv/bin/python.
3. glTF-Transform (core/functions/extensions), meshoptimizer and sharp: /Users/bao/tools/cardrpg-look/npm. CLI: /Users/bao/tools/cardrpg-look/npm/node_modules/.bin/gltf-transform. Use it for GLB inspection, bounding boxes for the size tests, meshopt/Draco and WebP/KTX2 compression.
4. TRELLIS.2 image-to-3D, LOCAL (Apple Silicon MPS port shivampkumar/trellis-mac, commit d58628f4): /Users/bao/art/trellis-mac, with Python 3.11 and Torch on MPS.
   - Hugging Face login has been done by the user, gated DINOv3 access has been verified, and all 19 weight files (about 16 GB) are cached in the standard HF cache. No new download is needed. Never read, print or copy the HF token.
   - RMBG-2.0 was NOT downloaded on purpose (non-commercial license). Always feed pre-cut transparent PNGs; image-to-3d.py already patches RMBG out.
   - Our wrapper: tools/cardrpg-look/art-rebuild/image-to-3d.py --backend local-mps (see LOCAL-MODELS.md for the exact command, seeds and receipts). Known behavior: 512 pipeline about 11 minutes; 1024 pipeline timed out at about 18 minutes; xatlas UV can time out, so use the `--uv-backend blender` route; the KDTree export needed the orient-local-glb.py fix. Run one generation at a time and pause other heavy jobs while it runs.
   - Exact command already used on this Mac (from LOCAL-MODELS.md; run from the worktree root; replace <unit>, seed and output folder):
     node tools/cardrpg-look/skills-v5/full/run-lock.mjs LOCAL-MPS-<unit> nice -n 10 /Users/bao/tools/cardrpg-look/venv/bin/python tools/cardrpg-look/art-rebuild/image-to-3d.py --backend local-mps --submit --id <unit> --seed <fixed seed> --pipeline-type 512 --texture-size 1024 --uv-backend blender --out /tmp/trellis-ref/<unit>-attemptN
     The wrapper calls trellis-mac's own venv (/Users/bao/art/trellis-mac/.venv) through a subprocess; you do not activate it yourself. Input = a transparent PNG (turnaround front view). Successful GLBs are published to /Users/bao/art/look-v3/inbox/<unit>.glb; receipts go to ~/art/look-v3/local-generation/. Max 3 attempts per unit.
   - Repair helpers already in the repo: orient-local-glb.py, pad-native-texture.py, export-decoded.py, repair-voxel-shell.py, finish-voxel-shell.py, fix-inward-glb.py, inspect-glb.py, prepare-unit.mjs, intake-models.mjs.
   - USE UNDER THE 3D SWITCH: TRELLIS output is only a shape/proportion reference or a shrinkwrap target for our clean Blender base. Never ship its raw mesh or UVs.
5. Earlier native outputs to reuse as references (do not regenerate): Mochi and Soot GLBs; local runs for Clover, Yarn Giant, Panko, Mallow, Cinnamon, Velvet and Biscuit in ~/art/look-v3 (inbox/, local-generation/, image-to3d/). Uncommitted clover.glb and yarn-giant.glb are in assets/cardrpg-look/v3-generated/. Concept masters (12 cats + 13 enemies) are in r2/concepts/ and ~/art/look-v3.
6. Image generation: the Codex built-in image tool is allowed (GEN_IMAGES=ALLOWED, user 9 Nov). Use it for clean turnaround sheets from OUR concepts, with your own prompts. Never use other games' art as input. Record provenance in assets/provenance/look.md. If the new account lacks the image tool, write it in NEEDS-USER.md and continue with Blender projection from the existing concepts.
7. NOT available, do not use: fal.ai or any paid API (no FAL_KEY; no paid services), the Hugging Face TRELLIS Space in a browser (retired), Hunyuan3D, TripoSR, SF3D and other new model downloads, unless your research finds a free local tool that clearly beats the route above. In that case, install it OUTSIDE the repo under /Users/bao/art or /Users/bao/tools, record it in TOOLS-3D.md and DECISIONS.md, and go ahead (pre-approved).

Large files stay outside git (/Users/bao/art, /Users/bao/tools). Never commit weights, venvs or node_modules.

## Verification on 11Nov2026 (no installation/download)
- PASS Blender4.5.3LTS at the exact installed path (`--version`).
- PASS `/Users/bao/tools/cardrpg-look/venv/bin/python`: Pillow11.3.0,OpenCV5.0.0,NumPy2.0.2,scikit-image0.24.0. Actual skimage differs from the recorded0.26; no required feature missing.
- PASS glTF-Transform core/functions/extensions,meshoptimizer,sharp resolve from the recorded npm root; CLI exists.
- PASS TRELLIS venv Python3.11.17,Torch2.15.0,MPS available. Prior D1 bootstrap verification retained; no inference/download. No token accessed.
- PASS original concepts and preserved native references present; rejected native GLBs remain uncommitted.
- PASS built-in image generation tool available for our own turnarounds with provenance.
- No MISSING tools; no paid service/account required.
