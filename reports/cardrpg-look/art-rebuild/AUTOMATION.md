# General local unit runner — Q4 complete

`node tools/cardrpg-look/art-rebuild/prepare-unit.mjs --id soot --source /Users/bao/art/look-v3/image-to3d/soot/browser-20261110/soot-source.glb --out /Users/bao/art/look-v3/image-to3d/soot/NEW_DIR [--install-preview]`

Any unit id uses its original concept and authored configs/ID.json (or explicit --concept/--config). Upstream image-to-3D export is an explicit source input, never resubmitted by this local runner. It inspects, simplifies with UV bounds, applies optional palette/material cleanup, rigs semantic modules/sockets, packs meshopt/WebP, and inventories the result. Original source is untouched.

Resume verifies hashes for source/concept/config/scripts and all stage outputs. Atomic manifest, one exclusive output lock, STOP-B checks before stages, no unqualified production install. Preview install retains a previous differing model. Structural success never sets runtimeAccepted=true: battle poses, faces/HP and visual review remain mandatory. Limits: rigid seams, per-unit authored proportions, expressions and inferred PBR need review.

Validated on existing Soot source: first generic export exactly reproduced698912B earlier preview;5stages reused; concurrent lock, changed recipe/output and --install rejected. Final material recipe is automated3 (same source/geometry); resume also reuses5stages. See r1/roster/runner-validation.json and soot-pipeline.json.

## Historical Mochi-specific runner

# Mochi direct-image automation

Status: local workflow complete; character quality PARTIAL. Existing source conversion already succeeded. Do not submit the same image again.

From any working directory:

```sh
node /Users/bao/taskbar-hero-cardrpg-b2/tools/cardrpg-look/art-rebuild/prepare-mochi.mjs /Users/bao/art/look-v3/image-to3d/mochi/NEW_OUTPUT
```

Use a new directory for a changed recipe. Repeat the exact command to reuse completed stages after verifying every output/receipt hash. The runner checks STOP-B before each stage and uses an exclusive output lock; failures remain recorded and are not silently overwritten. An interrupted/failed stage needs a fresh directory; a stale lock is never removed automatically.

The exact input is `assets/source/look-v3/image-to3d/mochi-source.glb`, SHA256eb84d0f8ca114736806432a18c0abd7249f3fb451c642c53fb28a1a85c0912a6. Other sources are rejected because weights are specific to this measured surface.

| Stage | Tool and operation |
|---|---|
| Inspect | Python stdlib GLB v2/UV/texture/resource/rig inventory |
| Simplify | meshoptimizer1.3.0 attributes: ratio.23,error.006,normals.1/UV1,Permissive;21,938tri |
| Rig | NumPy/Pillow local authored14joint skin,1blink morph,height1.55; revision3unchanged |
| Pack | glTF-Transform optimize; meshopt/WebP1024; no join/flatten/instance/palette/simplify/prune |
| Inspect | Recheck packed structure;626,020B,14joints,2textures,no external resources |

Local tooling is already installed under `/Users/bao/tools/cardrpg-look/`; package manifests/locks were not changed. Full recipe hashes, commands and receipts: [automated-pipeline.json](r1/image-to-3d/automated-pipeline.json).

Output `mochi.glb` contains a skin and blink target, **not embedded animation clips**. The local game controller supplies22clips. The same packed hash was already captured in [11poses](r1/image-to-3d/packed-motion/contact-sheet.webp) and [20second battle](r1/image-to-3d/film/mochi-generated-20s.mp4).

Optional `--install-preview` copies only into the local opt-in candidate directory, retaining a different previous model in the output folder. It is for diagnostic use. No production-install command is supported while B-R1-008 is open. Runtime defaults remain unchanged; the candidate renderer edits are local WIP and are not part of this report-only publication.

Quality limitation: original geometry fuses paw, apron and shield. Three weight-mask attempts still stretch connecting triangles during high cast/victory poses. Five successful command exits do not mean a production-ready character. Runner reports runtimeAccepted=false and qualityStatus=PARTIAL. Actual surface separation/retopology is the next repair approach, with new milestone accounting; do not rerun mask tuning past the cap.

External conversion was automated through the existing signed-in TRELLIS session; that service can still require login/quota for future characters. There is no continuous background job or new request now. Mochi needs no additional user action, fal connection, API key or payment.

Validation: [automation-validation.json](r1/image-to-3d/automation-validation.json) verifies all5stages reused byte-exactly, changed recipe/output refused, concurrent-output lock and unsupported production-install flag. No geometry regeneration or runtime visual acceptance is implied by these runner checks.
