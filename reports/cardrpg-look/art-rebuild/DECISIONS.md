# Art decisions

## 2026-11-10 user-approved generation-led art and VFX
- User prefers prompt -> original character image or skill-effect image/video -> cleanup -> real runtime model/effect, including ultimates. Use the existing generated Mochi source and VFX master; do not restart either.
- User identified both the right hand/shield area and the enemy side as incongruous. Replace duplicate physical prop cutouts with light emitted from the existing prop, moving to the actual target on the existing action clock.
- The current pilot uses a built-in-generated RGBA component atlas animated by game code. It is not generated video or a temporal flipbook; a strong source image alone does not establish motion quality.
- The later VFX corrections resume this bounded pilot after the earlier “khoan” clarification. R0/S6/M5 and source conversion remain completed; no external job is pending or needed for this pilot. No rejected model/rig is accepted by this preference.

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

## External image-to-3D authorized
- User answered “Cho phép image-to-3D bên ngoài” to the prepared Mochi conversion request. This overrides the original section4 service restriction for this workflow. Do not ask permission again for the same scope.
- Use our original generated image as the actual model input, retain provenance and verify mesh/texture/rig. Connection/model capability remains to be verified; no external submission yet.

## Direct conversion started — official TRELLIS.2
- Verified public official demo RUNNING; submitted original Mochi master to microsoft/TRELLIS.2-4B with seed20261109, resolution1024 and default12 sampling steps per stage. Original alpha is retained for provider preprocessing.
- Extraction requested at100k faces/2048texture as a source master, not the final runtime budget; local cleanup/packing will follow quality inspection.
- fal TripoP2 official docs confirm single-image textured/PBR mesh output, but plugin remains unconnected. Public TRELLIS.2 enables the authorized trial immediately without credentials.
- First submission-script attempt failed locally before upload because gradio_client2.7.2 renamed hf_token to token. Fixed from inspected signature; attempt2 preserves attempt1 receipt. No repeated inference completed.

## Direct image-to-3D export block — 2026-11-09 UTC
- Attempt2 produced a provider preview but GLB extraction failed on ZeroGPU quota. No exported mesh, no rig, no runtime acceptance. Keep the original failure and preview bytes; do not resubmit inference to hide it or bypass quota.
- fal remains unconnected; its suggestion is already visible. User needs to connect the service, not re-authorize the same image conversion. No duplicate plugin suggestion or external purchase.
- Continue the direct-image route once an exportable mesh is available. Do not promote the rejected painted or primitive candidate in the meantime. Current checkpoint is PARTIAL; R1 is not complete.

## Browser automation succeeded — 2026-11-09T22:53:33.409814+00:00
- The user asked to automate the existing signed-in TRELLIS workflow. Resumed its already-uploaded original PNG; one Generate and one Extract, no duplicate request. This later user direction supersedes the previous no-retry checkpoint.
- Exact seed20261109/resolution1024/decimation100000/texture2048 retained. Export succeeded; source5369360B,96900tri,2embeddedtextures,0skins,0animations, SHAeb84d0f8ca114736806432a18c0abd7249f3fb451c642c53fb28a1a85c0912a6.
- Browser file-download helpers timed out; fetched the exact observed generated-file URL using urllib, without accessing browser cookies or credentials. No plugin connection or purchase needed. Original failure receipts retained.
- Conversion is complete; rig, geometry repair, animation and runtime quality remain separate unverified work. Raw model retained outside demo/git.

## Automated local stages — 2026-11-09T23:18:08.774376+00:00
- Reuse completed source conversion; no further external inference. Package inspect/simplify/authored-rig/pack/inspect as one resumable local command, hashes and exclusive output lock.
- Known deformation does not become an accepted asset merely because scripts succeed: always qualityPARTIAL/runtimeAcceptedfalse; explicit preview-only install.
- B-R1-008 is at3attempt cap. Preserve failed diagnostics and current viable source/neutral poses; no fourth weight-mask adjustment or roster expansion. Real surface separation remains next repair approach.
- Publish source prototype, tools/evidence/reports; preserve dirty candidate renderer and local preview unchanged, without accepting or discarding it. No claim that22game clips are embedded in GLB.

## 2026-11-10 continuous-run override
NON-STOP-RUN.txt supersedes historical pause/deadlock notes. Q2 has one geometry-separation attempt then rigid-segment fallback. Known issues do not prevent Q3/roster. Free conversion applies to all units; quota failure gets three spaced attempts then animated layered fallback. Q10 explicitly authorizes integration branch merge commits, never PR merges. Existing sources and previous measurements are preserved.

## 2026-11-10T05:16:59.510589+00:00 resume and browser preference
User explicitly resumed. Use internal chat browser only for provider workflow; do not operate native personal browsers. The approved original-asset conversion remains in scope; no payment/new account/credential access.

## 2026-11-10 local model intake
User asks for downloaded models to be processed locally without browser automation. Added a GLB inbox/intake, preserving successful Mochi/Soot sources. All post-export stages are local. Official TRELLIS.2 requirements verified:Linux+NVIDIA24GBVRAM+CUDA; current M3Pro36GB cannot run that official CUDA implementation directly. No AI weights downloaded or paid backend started. See LOCAL-MODELS.md. This is an additional input route; source quality/rig review remains mandatory.

## 2026-11-10T07:30:26.787573+00:00 user-authorized native TRELLIS port
- INBOX supersedes the historical browser route. Clone/install outside git; model generation headless on MPS. Official CUDA-only limitation does not apply to this third-party Apple Silicon port.
- HF standard auth whoami succeeds; DINOv3 model.safetensors metadata access succeeds. Do not read/copy/print credentials.
- All25 original concepts are RGBA with transparent backgrounds. Upstream still eagerly constructs RMBG: local wrapper removes precisely that constructor and validates alpha before any inference. Record the patch/source hashes; never download/use RMBG.
- Setup first selected system Python3.9; terminate only own setup/pip and preserve its incomplete venv, recreate using installed3.11, rerun setup. MetalToolchain unavailable with current CommandLineTools; allow upstream Python fallback.
- Smoke Mochi only into a scratch output; never publish it into inbox or replace existing source. Future local roster output goes atomically into inbox, retains receipts and must pass runtime review.
