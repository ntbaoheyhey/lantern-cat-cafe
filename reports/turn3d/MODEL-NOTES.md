# T5 · original model pipeline
1. Preserve the stopped helper's twelve original definitions; complete animation and export in the primary session.
2. Merge geometry per articulated part using opaque vertex color, with no downloaded texture or model.
3. Export ten named clips per character, eye-scale expressions and boss launcher/arm telegraphs.
4. Enforce per-character triangle budgets at export and record byte counts, hashes, parameters and provenance.
5. Inspect actual GLB loads in Chromium at four angles per model; keep evidence separate from source claims.

`pnpm art:turn3d`: 12 GLBs, 2,073,028 bytes raw, 539,750 gzip. All triangle budgets pass.
`node tools/turn3d/models-capture.mjs`: 48 actual rendered turnarounds, no page errors.
`reports/turn3d/model-runtime.json` records measured renderer stats per model.
The model viewer exposes all ten clips. Soft matte vertex colors replace a texture atlas
because these models use zero image textures. This reduces asset weight and avoids an
unnecessary bake step. See machine manifest and assets/provenance/turn3d.md.
