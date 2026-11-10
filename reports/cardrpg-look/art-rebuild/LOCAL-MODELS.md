# Native Apple Silicon generation and local model intake

Latest INBOX authorizes `shivampkumar/trellis-mac` on this Mac; it replaces the browser/Space route. Official upstream CUDA requirements do not apply to this MPS port.

- External install: `/Users/bao/art/trellis-mac`, commit `d58628f4f5b9c3de8274cb110074154f4b31cef2`.
- Setup completed using Python3.11.17 / Torch2.15.0. MPS availability and pipeline import pass. The initial setup chose system Python3.9; its incomplete venv is preserved separately.
- MetalToolchain download cannot run with only CommandLineTools selected. Optional native backends failed to compile; upstream selected `conv_none` + KDTree texture baker. Actual speed/quality still require the smoke run.
- HF login and access to DINOv3 `model.safetensors` verified. No credential was read, printed or copied. Weights are downloading to the standard external HF cache; `~/art/look-v3/local-setup/weights.json` tracks files. No RMBG download.
- All25 concept inputs are RGBA. `image-to-3d.py` validates meaningful alpha and patches the eager RMBG constructor to `None`; only the existing alpha preprocessing path is allowed. Patch/source hashes are recorded.

## Explicit generation

```sh
node tools/cardrpg-look/skills-v5/full/run-lock.mjs LOCAL-MPS-smoke nice -n 10 /Users/bao/tools/cardrpg-look/venv/bin/python tools/cardrpg-look/art-rebuild/image-to-3d.py --backend local-mps --submit --id mochi --seed 20261109 --pipeline-type 1024 --texture-size 1024 --smoke --out /tmp/trellis-smoke/mochi-attempt1
```

Mochi smoke is isolated and never published to inbox; existing Mochi/Soot sources remain unchanged. After comparing the smoke output, the same command for each unfinished unit omits `--smoke`, uses its fixed recorded seed and a new output directory. One generation at a time under the shared timing lease; no concurrent B rendering/bakes. Maximum three local attempts per unit (two retries with new seeds), receipts retained. The18-minute timeout fits the19-minute lease; after a run above15minutes, leave a120second cooldown before the next model.

Successful standalone textured GLB files are atomically published to `/Users/bao/art/look-v3/inbox/<unit>.glb`. Existing different files are never overwritten. Local receipts: `~/art/look-v3/local-generation/{smoke,roster}/<unit>/attempt-N.json`. Automatic conversion does not accept the rig or runtime motion.

## Existing intake and preparation

`node tools/cardrpg-look/art-rebuild/intake-models.mjs --watch` checks completed inbox files, validates embedded assets and archives by hash under `~/art/look-v3/local-intake`. Watcher owner is in that directory's `.running/owner.json`; stop on pause. No automatic runtime replacement.

Inspect a supplied GLB, author its unit geometry/rig config, then run `prepare-unit.mjs` for simplify/rig/pack/preview. Review motion in real battle, especially fused paws/props. No browser needed for any of these steps.

Current status: SETUP PASS, WEIGHTS DOWNLOADING, SMOKE/ROSTER NOT YET VERIFIED. Four local guard tests pass (transparent input, no-RMBG patch, complete embedded export, explicit submission/preserved sources).
