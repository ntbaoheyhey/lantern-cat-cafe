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

## 2026-11-10 native export production budget
Smoke512 completed geometry/texture decode in330.8s after model load, producing2.88Mtri. KDTree xatlas on the200K pre-bake surface then exceeded3minutes. Future roster calls use an explicit100K pre-UV source budget, matching the original accepted Mochi/Soot conversion class; final22K-class meshopt remains a separate reviewed operation. The ongoing200K smoke is preserved unchanged. Receipt records sourceFaces and exact exporter hash; actual first roster source must pass comparison before further units. No automatic runtime acceptance.

## Native smoke repair and bounded opponent trial
- Inspected repaired source views: UV-v alignment and nearest-texel gutter fill resolve misplaced colours and black webbing without another inference. Native512 remains visibly coarser (agent appeal6.9) than preserved Mochi8.2. Never replace existing Mochi/Soot.
- Continue one Button Guard source trial at512geometry/1024texture/100Kpre-UV, fixedseed20261111. Review source, packed motion and identical battle shots before authorizing broader local conversion. The existing run14738/14759 is resumed, not duplicated.
- Draft enemy role mappings use the existing original rigs; config files are preparation only, not runtime approval.

## 2026-11-10T12:35Z Q3 bounded production decision
See R1-DECISION.md: cats use original-image3D with rigid semantic modules; foes prefer the same native3D route but retain reviewed articulated fallback per failed unit until source/motion/battle passes. Four-unit appeal/menace7.75 exceeds7.0 minimum; pilotweighted7.71 is not full-roster acceptance. Close Q3 timebox with PARTIAL quality and continue Q5; the new Yarn trial does not reopen completed conversions. Button damaged mesh remains rejected.

## 11/11 research completion and bounded refinements
Filled the missing RESEARCH-PUPPET.md from existing direction plus primary technical docs, using only textual technique research. Keep the current lightweight three.js atlas/rig pipeline: a runtime migration or full mesh-deformation rewrite would repeat accepted work. P1–P5 remain ticked. Refine P7/P8/P10 acceptance around actual stage timing, reuse of source pixels and fast-speed readability. Add P12 individual follow-through and P13 Rain Spool crowding after core films/report because motion is the lowest recorded score and the broad boss already has a visible proximity limitation. These are improvements within the fixed deadline, not reasons to reopen the roster.

## 2026-11-10T18:09:14.154961+00:00 P8 while P7 waits
The P7 GPU/E2E lease is queued behind A6. Per NON-STOP rule4, accept and publish the already exported/reviewed P8 derivatives independently. No P7 acceptance is inferred. P9 budget and P10 films still depend on the final stage artifact.

## 2026-11-10T18:37:13.050170+00:00 Useful work while the film lease waits
P10 corrected setup remains the active item. Prepare P11 report and one P12 Soot motion pilot while A6 owns GPU timing; the P10 artifact is immutable so film validation does not silently include unaccepted motion. Soot adds bounded prop lift and3–5frame head/tail follow-through without recutting its atlas. No P12 completion claim before naturalx1 visual/overlap/reduced-motion review.

2026-11-10T18:54:16.068996+00:00 P12/P13 now precede final P10/P11 closure: saved Soot pilot can ship immediately; boss film exposed a hidden Binding Thread that label-overlap tests missed. Preserve both85.5sfilms, retain normal acceptance, fix composition then add a complete boss-result film. This extends the missing acceptance evidence rather than repeating completed work.

2026-11-10T19:04:38.287212+00:00 Research recheck after P12/P13: the shared rigid-part gestures remain the weakest category. Add P14 for Spool Ram, the lowest remaining overall row7.6 after Soot pilot. Use its existing head/leg/tail joints, no new image or atlas. Prepared while P10film runs; execute after P11 publication.

2026-11-10T19:06:37.950652+00:00 Full boss film reached victory134.32s/13catultimates but phase3 revealed two extra summoned Binding Threads sharing the initial lanes. P13 accepted initial two adds only; keep its completed scope and add P15 before film acceptance. Use actual phase3 rules state and four distinct placements, no new art.

2026-11-10T19:21:37.791752+00:00 P15 accepted attempt2: stable live actor lanes, not rule-slot modulo; four helpers separated across foreground, all boss/cat scales unchanged. Actual3/4states and two sizes required; bounds and label audit alone do not prove visibility. Selected compact evidence preserves120MB Git cap.

2026-11-10T19:37:20.315913+00:00 While P10 is lease-blocked, prepare P14 source and combine its checks after the immutable P15 film capture in one lease. This does not change the film artifact or prematurely accept P14; publish P10/P11 before accepting/publishing P14. Only the waiting B wrapper92330 was restarted with250ms lock polling after two A6 segments bypassed it; cap19min and post-lease6.5s gap remain.

2026-11-10T19:46:39.979853+00:00 P16 prepared while P10/P14 waits for shared timing: Inkcap is one of the remaining7.7overall/7.5motion rows. Existing tail mesh and lantern joint support a small original-motion improvement without another atlas or generation. Research remains applicable; add bounded lantern/tail review after P14, keeping its running-source snapshot unchanged.

2026-11-10T20:07:29.667353+00:00 P14 accepted saved grounded horn-dip/secondary tail motion; do not rerun passed19tests/parity/budget. Keep whole-roster motion7.5 because one pilot does not establish roster quality. Compact derived evidence preserves originals locally and120MBcap. P16next.

2026-11-10T20:15:17.001198+00:00 P16repair2 accepted from actual upward lantern silhouette; do not infer gesture direction from scalar angles alone. P17 adds original Sock Skipper anticipation/hop/mitten reach, matching its knit thief/Pocket skip cue and7.7overall/7.5motion gap. Existing art only; no runtimechange until new validation.
