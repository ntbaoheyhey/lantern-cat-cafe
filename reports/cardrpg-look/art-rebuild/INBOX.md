# Lane B inbox

User corrections can be written here. Checked between queue items.


> 2026-11-10 07:15 UTC: HF login done by user; DINOv3 access may still be pending approval

## 2026-11-10 USER: run TRELLIS.2 LOCALLY on this Mac (no browser, no quota, no paid API)

Stop driving the Hugging Face TRELLIS.2 Space in the browser. Use the MIT Apple Silicon port of TRELLIS.2 (same model as Mochi/Soot), headless from the terminal. This Mac is M3 Pro 36 GB (port needs 24 GB+, peak about 18 GB, about 15 GB disk).

SETUP (once; do it yourself, no browser):
1. Check: `hf auth whoami` works (user has logged in and accepted the gated repos facebook/dinov3-vitl16-pretrain-lvd1689m and briaai/RMBG-2.0). If not, write NEEDS-USER and keep doing other queue items. Never read, print or copy the HF token.
2. `git clone https://github.com/shivampkumar/trellis-mac.git /Users/bao/art/trellis-mac` (OUTSIDE the repo; never commit weights or deps).
3. `xcodebuild -downloadComponent MetalToolchain` (if it fails, continue; setup falls back to a slower Python texture baker).
4. `cd /Users/bao/art/trellis-mac && bash setup.sh && source .venv/bin/activate`. If the clone state looks broken: `rm -rf deps` and rerun setup once.
5. Smoke test on Mochi's source PNG: `python generate.py <mochi.png> --output /tmp/trellis-smoke/mochi --pipeline-type 1024 --texture-size 1024`. First run downloads about 15 GB of weights. Compare against the existing Mochi GLB before running the roster.

RUN (roster):
- Add a `--backend local-mps` mode to tools/cardrpg-look/art-rebuild/image-to-3d.py (keep HF Space mode for history, default off). It calls generate.py in the trellis-mac venv via subprocess and writes /Users/bao/art/look-v3/inbox/<unit>.glb so intake-models.mjs picks it up.
- Input: the concept PNG with background already removed (transparent), so the result does not depend on RMBG-2.0 (its license is non-commercial).
- Sequential, ONE model at a time, fixed seed per unit (record it). Pause other heavy jobs (Blender bakes, big Playwright runs) while a model generates. Expect about 4 to 8 min per model; it can run overnight. If a run is much slower than 15 min, suspect thermal throttling: wait 2 min between units.
- Per unit: max 2 retries (new seed), then mark failed and move on. Record provider=trellis-mac (local), commit hash of trellis-mac, pipeline type, texture size, seed, time taken, source PNG hash in the existing receipt/provenance files.
- Known limits: small holes possible (hole filling disabled), mesh is reduced to about 200K faces before baking; fix with the existing cleanup in prepare-unit.mjs.

If local setup fails twice: write NEEDS-USER with the exact error and propose the paid fallback fal.ai `fal-ai/trellis-2` (about $0.30 per model, needs FAL_KEY from the user). Do not use any browser site for 3D generation.

