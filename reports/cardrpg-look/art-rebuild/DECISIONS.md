# Art decisions

## 2026-11-09 R0
- Latest Art Rebuild prompt supersedes idle waiting: art proceeds while a local no-model script watches S6.
- Built-in image generation is available and expressly allowed; use original concepts/painted layers only, no external imagery/API calls.
- R0 reuses immutable #421 delivered runtime for honest baseline, records artifact hash and shot pins before art changes.
- Preserve existing Full Run samples; reference them when production trees are unchanged, never resample to erase misses.
- Stack R0 on #421 through existing reporting descendants. Preserve dirty waiting state in the requested wip branch.
- New lookArt switch is B-owned; no runtime/default flags changed during R0.

## Resume 2026-11-10 local
- User resume overrides paused handoff. R1 capped to 10 working hours from 22:01 UTC 9 Nov; compare the same four units in actual battle and choose one pipeline.
- 3D+ must be within 1.0 point of concept appeal/menace or layered paint wins; source concepts alone are not runtime evidence.
- User ownership correction: U owns shell and HUD frame, B only battle canvas plus image assets. R6 shell changes become B-OUTBOX requests.
- Specific housekeeping merge allowed despite general no-merges rule: reporting-only M5 merged preserving R1; no PR merge/deployment. R7 will prepare a reviewable integration candidate without merging other branches unless expressly authorized later.
- Concept production uses built-in imagegen only, no references, original prompts; deterministic cutout/packing exporters are local no-model tooling explicitly required by the art direction.

## User visual correction during R1
- User finds the 2.5D candidate stiff and pasted into battle, and asks why we are not building 3D from those images. This supersedes any assumption that source-image fidelity alone wins. No pipeline decision accepted.
- Continue the bounded R1 with a concept-guided 3D Mochi: actual head/body/limb volumes, painted materials from our own master, full existing motion rig. Inspect a turntable and battle motion before expanding. Keep the rejected cutout and initial procedural results as honest comparison evidence, not the selected runtime.

## User clarification: direct image-to-3D
- User clarifies “không tại sao bạn không dựa trên ảnh vừa gen rồi đem nó lên 3d”: use the actual generated image as the input to a textured 3D reconstruction. Further primitive approximation is not the requested next step.
- Prepared r1/image-to-3d-job.json using the existing Mochi master, SHA678241f7. No image regenerated, no asset uploaded.
- Built-in imagegen outputs raster images; Blender is available locally but no automatic image-to-3D model is installed. Discovery found the fal plugin advertises 3D assets; it is not installed/connected and its exact image-to-3D route remains unverified.
- External generation is explicitly prohibited by original PROMPT section4, so do not submit without a user override. No pipeline accepted. Prior rejected candidates/evidence remain preserved.
