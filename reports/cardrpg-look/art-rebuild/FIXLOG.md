# Art repair log (append-only)

Inherited Full Run issues remain in ../skills-v5/full/FIXLOG.md. Art-specific issues follow reproduce / measure / hypotheses / smallest fix / verification / result, max three attempts per issue per milestone. No art fix attempted yet.

## B-R1-009 2026-11-10 generated VFX pilot: duplicate props S3
User identified both Mochi's right-hand/shield area and the enemy side. Existing door/roof/cup/sock/bow/button primitives conjure extra objects detached from the model. Built-in-generated four-component light atlas retained; replace these pilot recipes only under lookArt v3, attach charge/release to existing shield socket. Preserve attack/status clocks and recipe targets.
Prior local iterations retained in r1/vfx-pilot/{before,before-beats,attempt1,after,after3}; code/type fixes are not separate visual issue resets. Source tests1817PASS, fiveBseeds exact,85plan immutability, sixcue/24face diagnostic at impact has0offenders. Source/film still require publication; full-roster VFX not complete.

## B-R1-010 2026-11-10 impact light delayed by held pose S2
Repro: after3/mochi-4-impact.webp has9pooled light instances but no visible arch; recovery shows the large arch. sampleActionPlan holds impact pose progress at0, so new layers starting at.52 remain alpha0 through the hit hold. Hypotheses: pose clock reused for light (confirmed), atlas addressing, depth occlusion.
Attempt1: v3 light progress samples elapsed time inside the unchanged impact beat; pose, plan, rules and v2 remain unchanged. Reuse same master, do not regenerate. Extend regression test to require visible arch before pose release; rerun beat captures, faces through impact/reaction, parity and changed-cue perf. Verification pending.

## B-R1-001 2026-11-09T22:11Z R1 painted attachment sockets S3
Repro: bakeoff1/painted-1440-mochi.webp; equipment medallions at feet. Attribute: GearAttachments falls back to model when named sockets are absent.
Hypotheses: missing sockets (confirmed), body pivot mismatch, geometry offsets. Attempt1: supply arm/body/neck/back/tail sockets at the existing painted layer anchors; preserve equipment data. Verify queued same bakeoff/parity/faces.
## B-R1-002 2026-11-09T22:11Z R1 boss size S2
Repro: bakeoff1/painted-1440-yarn-giant.webp. Yarn source height1.55 made boss ~216px vs Button177px across presets, below2x.
Attempt1: restore source world height2.35 (old 3D boss conventions), retain formation/camera. Verify head/foot bounds + P15 safe regions; no HUD edits.
## B-R1-003 2026-11-09T22:11Z R1 paint expression S3
Repro: six-layer candidate has breathing/arm/tail motion but no eye closure. Attempt1: actor-owned shader eyelids sampled from the same painted fur; hit/happy/KO eye poses and reduced-motion static expressions. Verify shader compilation, blink still, motion film, faces and perf.
## B-R1-004 R1 procedural candidate limitations S3
3D+ candidate rebuilt four units with voxel-fused cat heads, expressive glossy eyes and procedural costume/object shapes. Unbaked material detail remains visibly toy-like; source procedural prototype does not meet all aspirational Blender bake/armature requirements. Compare honestly against painted candidate; no false completion claim and no broad procedural polish detour.

## B-R1-005 User review: stiff 2.5D motion S3
User explicitly reports the 2.5D characters have no convincing movement and are stiff. Initial amplitudes .006–.045rad plus breathing do not sell a rigged character. Still-image appeal cannot accept the pipeline. Reproduce with continuous idle/attack/hit/cast clip; rebuild pose amplitudes, anticipation/impact/recovery, articulated limb bending and ear/tail follow-through, then review the actual clip before decision. Attempt1 underway; max3 remains.

## B-R1-006 Direct conversion export blocked S2
Repro: image-to-3d.py --submit --id mochi --out ~/art/look-v3/image-to3d/mochi/attempt2. Receipt retained in r1/image-to-3d/receipt.json.
Measured: image_to_3d returned provider preview; extract_glb failed on ZeroGPU quota at2026-11-09T22:26:12Z. No model file downloaded.
Hypotheses: service quota (confirmed explicit error), geometry failure (not evidenced), client serialization failure (not evidenced).
Action: preserve six preview images and receipt, mark PREVIEW_ONLY_EXPORT_BLOCKED, prepare structural/import checks, use already authorized fal route after connection. No repeated inference/quota workaround.
Verification: preview hashes match source; fal installed:false. Rig, motion, performance, topology and real-battle image quality NOT VERIFIED. Status PARTIAL, external dependency; no runtime regression introduced by this checkpoint.

### B-R1-006 follow-up 2026-11-09T22:53:33.409814+00:00
User explicitly requested automation of the already signed-in browser workflow. One new Generate and Extract succeeded. Downloaded raw GLB via exact visible link; structure96900tri/2textures/0skins/0clips. Prior quota failure unchanged. Export blocker RESOLVED for Mochi; rig/runtime still NOT VERIFIED. Browser download timeout retained in browser-automation.json.

## B-R1-007 2026-11-09T23:04Z generated source simplification S2
Repro: rig1-motion/contact-sheet.webp and rig1-battle/generated-1440-mochi.webp. Actual browser renderer has no errors but the face/shield become broken triangles with distorted texture even at rest.
Measured: Blender collapse ratio16000/96900 produced23622tri and removed most head vertices (head weight>0.05 only1307 of35655 exported vertices). Original six-angle source is intact. Type/lint/1815unit PASS cannot detect this appearance failure.
Hypotheses: aggressive simplification/UV collapse (first test), skin bind error, incorrect accessor layout. Attempt1: use untouched generated source geometry with the same rig and exact comparison shots, separating geometry loss from skin binding. Preserve rig1 failures. Next optimization must use bounded geometric/attribute error and pass the same visual comparison.

Follow-up: untouched source rig2-motion restores the face/texture, isolating simplification as the cause. Attempt2: meshoptimizer1.3.0 simplifyWithAttributes, target.23/error.006, normals weights.1/UVweights1, Permissive;21938tri (measured combined error.0047997). rig4-motion retains readable face/silhouette but fine fur has small angular losses. Conservative unaccepted review copy retained. Default CLI simplify with locked borders retained91026tri and was not selected. No claimed numeric error bound on perceived beauty.

## B-R1-008 2026-11-09T23:05Z fused source arm and shield deformation S2
Repro: rig2-motion cast/victory poses (22 real runtime clips,14bones). Original source mesh is fused; broad arm masks drag apron, soft shield weights bend the door.
Attempt1: original spatial masks on untouched geometry. Body/head/tail move, but high arm poses tear cloth/door.
Attempt2: exclude dark cloth by sampled source texture; move shoulders outside torso scaling, rigid shield mask. rig3-motion: texture variations cause uneven forearm weights; shield mask also picks up foot. Failure preserved.
Attempt3: smooth forearm capsule, measured shield rear/lower planes excluding foot. rig4-motion: neutral/side/back/hurt remain readable, high cast/victory still stretch connecting surface triangles. PARTIAL at3attempt cap; no further mask tweaks this milestone. Need actual separated surface/retopology and reweighting at next milestone, not generic automatic-skin acceptance. Do not expand this rig to the roster or call the pipeline accepted.
Probe extension: generated-motion.mjs captures rest/anticipation/impact/guard/cast/hurt/victory/tail/blink/side/back using actual game renderer and mixer. Distinguishes no-console-error from deformation acceptance.

### Automation validation — 2026-11-09T23:18:08.774376+00:00
No fourth B-R1-008 geometry/weight fix. The exact packed model SHA c035cd84 was reproduced by the new runner; existing packed-motion/film/parity evidence applies to these same bytes.
Added guards after observing that --install and REVIEW_REQUIRED could be mistaken for production acceptance: renamed --install-preview, always qualityPARTIAL/runtimeAcceptedfalse, hash all stage outputs/sidecars, lock output, atomic manifest, persist spawn failures.
Verification automation-validation.json:5stages reused with byte-exact outputs; recipe change, output mismatch, concurrent writer and unqualified production install all rejected. No new model request or visual/performance PASS inferred.

B-R1-010 attempt1 verification: matching after-impact1440/1024 shows arch during impact;72face samples0offenders,48fixedshot UI overlaps0,36casts max16.8ms/native+CPU4,85draws/121362tri,1818webtests/type/lint/buildPASS,5seed+85plan parity exact. Film-impact recorded199frames,0pageerrors; reviewed contact sheet. RESOLVED for pilot; full-roster/cold/startup/E2E not inferred.

### B-R1-008 Q2 topology attempt and bounded fallback — 2026-11-10
Latest NON-STOP-RUN explicitly permits one surface-separation attempt after the three historical weight attempts. Blender separated existing rig regions into body/apron/arms/shield, capped available borders and rigid-parented pieces. Real game cast/victory shows gaps/detached shell strips; retained separation1/poses and topology receipt, rejected runtime. No further weight attempt.
Fallback: original unmodified UV/triangles partitioned into rigid torso (including fused paws/apron/door), head, two ears and tail. No skinning; smaller local angles with unchanged root/action timing. Shield light socket follows physical torso. rigid1/poses cast/victory removes stretching and preserves identity. Known issue: hands no longer reach independently, expressive action relies on head/tail/body and VFX. This is accepted bounded fallback, not full rig quality. Battle/face checks recorded in r1/rigid1; Q3 proceeds regardless of the remaining articulation limitation.

## B-R1-011 Soot reconstructed fur reads metallic S3 — 2026-11-10
Repro: r1/roster/soot-battle/generated-1440-soot.webp, forehead x625–667,y476–515 has a brass specular patch; violet cloak shifts toward red. Source PBR metallicFactor1 with inferred metal/rough map. Hypotheses: inferred PBR classification (primary), warm stage light, texture hue. Attempt1: preserve all source albedo/UV/geometry, use matte nonmetal reconstruction surface and existing atelier ramp only for Soot via authored config. Compare same real battle; no new source conversion. Eyes lack an authored blink target in this first generic rigid rig; record separately for later expression pass.

B-R1-011 attempt1 reduced specular but did not remove baked warm highlight/red cloak. Inspection of raw base-colour atlas confirmed red cloth and warm face baked in source. Attempt2 selective burgundy hue-38deg/saturation.70, with original UV/geometry retained, restores plum in soot-palette battle.24face samples0offenders, no UI overlaps. PARTIAL: warm forehead patch and coarser reconstructed detail remain; no further source conversion.

## B-R1-013 fallback gesture resets during action S3 — 2026-11-10
Repro: Button/Yarn travel or recovery switches clip to step/idle, bypassing attack-only layer rotation; soles also float over a deep shadow. Attempt1: keep gesture ownership for the whole source action, restore layer rest transforms before animation, align soles/contact shadow and parent the protected-face anchor to the moving head. Four regression cases and the 12-second internal-browser film verify anticipation/impact/recovery and reduced-motion reset. Existing 1822 tests/type/lint/build pass; five seeds exact; 48 face samples at each of 1440/1024 have no offenders or UI overlaps. Resolved for the fallback; camera-depth and old VFX limitations remain in foes-fallback/REVIEW.md.

## B-R1-012 Button Guard export failure — 2026-11-10
Attempt1 daily quota at02:05UTC. Attempt2 in internal browser after user preference change: original concept/seed20261111,1024,100k/2048 preserved; Generate produced preview; Extract displayed Error/Empty value with no download. No specific quota cause exposed for attempt2. Keep preview for one final extract attempt, then use authorized animated fallback and continue. No paid route or credential access.

## B-R1-014 Q3 full E2E idle clock flake — 2026-11-10
Full suite420PASS/1FAIL: s3-walkthrough idle XP remains0 after fastForward60s. Known inherited clock timing case; unchanged isolated run repeated twice gives2PASS. Original and isolated logs retained in r1/phase-checks. No test/code modification or skip; handled by explicit flake rule. Other phase checks remain attached to unchanged runtime78c02c3db.

## B-R4-001 first roster light review S3
Repro: r4/roster-attempt1/sheet.webp at impact/recovery. Mallow/Cinnamon flame/spiral sits below torso; Velvet/Inkcap signature is short; shader collapses source two-tone hue; old non-pilot enemies still conjure duplicate physical props.
Measure: 48 fixed real-renderer shots, 12 ultimates, no console errors; effects pool one call for most skills. Minimum 25% frame height is not established. Hypotheses: rise starts at35% scale, low authored center, uniform tint removes source hue (confirmed in shader).
Attempt1: raise/scale four weak signature layers, retain38% source chroma in light shader, replace remaining enemy prop layers with original generated thread/steam/crack components and hostile palette. Targets/durations/clock unchanged. Same shots/face gates and x1 review pending. Keep all failed/source captures.

B-R4-001 follow-up: roster-after shows retained violet/mint/fire source hues and removes enemy prop duplicates. Attempt2 replaces the slowly growing Mallow/Cinnamon rise motion with a stable upright impact shape at the same action time. fire-after shows the fire surrounding the target during impact; Cinnamon spiral surrounds its correct friendly target. 24 fire face samples and the full roster face diagnostic have zero offenders. Five retained seeds and85plans remain exact;1823web tests/type/lint/build pass. Full artifact35,742,905B. Cast and x1 film processes are under the shared lease; full phase acceptance still pending. Remaining flaws: late afterglow is stronger than the first hit, some basic/passive cues resemble each other, and protected-face clipping can split a large motif. No8.0 audit claim yet.

B-R4-001 attempt3: 60tile sheet shows airborne expand hits only ~half-size during impact; the same curve as ground afterglow caused recovery to dominate. Make painted airborne expansion start at.9scale, retain old ground/legacy curves, distinguish attack skill2fall/skill3cross/passivepairedhalo. No new source/motion clocks. Bounded third repair: verify same sheets, touched faces/perf; retain PARTIAL if still not8.0.

## B-LOCAL-001 shared timing wait starvation S3
Repro: five B render jobs waited from08:24 while A segmented work reacquired immediately at08:43:35. B polls2s; A wrapper has no post-release delay. No active lease was interrupted. Requested6.5s handoff via B-OUTBOX. B-side attempt1: allow bounded100–2000ms polling, keep default2s, reschedule only the untouched first smoke at250ms. Paused/verified/killed own waiting processes80150/98355 before inference; no conversion retry consumed. Atomic ownership,19min lease and6.5s B handoff unchanged. Verify acquisition on next free lease.

## B-LOCAL-002 reconstructed foes hidden by fallback S2
Repro: assets.ts returned the painted Button/Yarn model before checking generatedSources. Installing a reviewed native GLB could never display it under the generated pipeline.
Attempt1: resolve the available generated asset first; use the articulated fallback only when no generated source is installed. Explicit painted/v2/OFF choices retain their existing routes. Typecheck/lint and1824webtests pass; actual local-foe screenshot awaits smoke/conversion. No runtime acceptance inferred yet.

B-LOCAL-001 verification: unchanged first smoke acquired atomically at08:58:36.912UTC after A released, no owner interrupted and no duplicate inference. RESOLVED for this acquisition; other queued B probes retain normal2s polling.

## B-LOCAL-003 native 1024 exceeds bounded lease S2
First isolated smoke finished sparse/shape/texture sampling but produced no GLB by1082.6s; wrapper stopped its own inference and released the lease. No watchdog error or export error was observed. Hypotheses: slow pure-PyTorch decoder (primary), memory pressure, texture export. Attempt2:512 geometry/1024texture, new seed20262109, exact same original input, decoder-stage logging only. Existing Mochi/Soot untouched. Do not infer visual acceptance before actual export/comparison.


B-LOCAL-003 follow-up: second isolated512 smoke exported in656.715s,1mesh/2embeddedtextures,11,096,572B. Export timeout resolved at512; visual quality is separate. Existing Mochi/Soot unchanged.

## B-LOCAL-004 native texture orientation and gutters S2
Repro: native-smoke/raw-front.webp has random surface colour; neutral clay retains recognizable geometry. Native KDTree rasterizer writes v directly to image rows, while trimesh GLB export flips v. Attempt1: undo that UV-v flip and Z-up basis on the same raw GLB; face/outfit colours align, with dark seam cracks remaining. No new inference.
Attempt2: source baker averages unfilled pixels against black. Reconstruct occupied UV coverage45.17%, extend nearest occupied texels into empty gutters; occupied texels and geometry/UV/index bytes remain unchanged. Future native runs patch gutter fill before export. Padded source render is waiting for shared lease. No roster approval yet. Seven prior source guards plus one new gutter patch guard PASS; no runtime inference accepted.

## B-LOCAL-005 generated models receive duplicate legacy props S2
Repro: rigid-unit root is named after asset; CardUtensil only checks a role-named root for lookProps. Two new regression cases fail by adding extra props to reconstructed Panko/Button; Mallow case guards a third route. Attempt1: honor the existing model-root lookProps flag inside lookV2 as well as legacy role-root flags. All7touched tests/type/lint PASS. Real battle validation follows first native foe install; defaults and v2 routes unchanged.

B-LOCAL-004 attempt2 verified: padded front/side/back restores coherent surface colour and removes dark webbing; occupied texels/geometry/UV/index bytes unchanged. UV/gutter bugs RESOLVED; small pale speckles and noisy512geometry remain separate quality limits. One Button trial approved; existing Mochi retained.

## B-LOCAL-006 reconstructed foe atlas multiplied by legacy red S2
Repro: native-colour-before test passes a generated v3 Button material; styleReadableEnemy changes white albedo multiplier to782b42, suppressing authored brass/eye colours and changing roughness. One of three focused cases fails; v2/OFF pass. Attempt1: preserve generated-v3 atlas multiplier and authored roughness, retain existing enemy rim/key relief. Real Button battle check follows source export; no runtime approval from a material test alone.

## B-LOCAL-007 Button native export exceeds lease S2
Attempt1: seed20261111/512/1024texture/100Kpre-UV. Decode completed454.7s after model load,3,876,382tri; xatlas ComputeCharts remained active until1081.178s wrapper timeout. No GLB exported. CPU sample retained; automatic same-parameter retry stopped after terminal receipt, no inference interrupted early.
Hypotheses: complex UV chart construction (confirmed sampled stack), excessive pre-UV surface count, thermal throttling (not established). Attempt2: newseed20262111/50Kpre-UV, same512/1024; preserve decoded source before UV so an export failure can be repaired without further inference. Source quality remains unverified.

B-LOCAL-007 attempt2 diagnosis 2026-11-10T10:31:27.029665+00:00: decoded checkpoint preserved at280,621tri despite requested50K; fast_simplification target is not a hard limit. Existing xatlas remains running within its original bounded timeout. Prepared Blender Smart UV export-only recovery with immutable geometry/index verification and terminal-receipt guard; no third inference request. Recovery result remains pending.
Native checkpoint diagnostic:37,319exact duplicate triangles,0zero-area/repeated-vertex triangles. Planned export-only repair removes exact duplicate faces while preserving every unique face, winding and vertex position; audit rejects any other surface change. This is local geometry cleanup, not another inference.
Button attempt2 reached its original1080second bound without GLB; decoded geometry/voxel colours are retained. Export-only Blender recovery queued after6.5second handoff; A owns the next lease. No third generation requested.

## B-LOCAL-008 Blender UV margin wastes atlas S2
Repro: export-recovery1 succeeds in10.488s with original positions/unique triangle coverage unchanged, but UV area0.0016557 and only1514rasterized texels;243289/243302triangles are subpixel. This source is rejected for texture quality before runtime. Hypotheses: per-island margin consumes packing space (primary), invalid UVs (bounds valid0..1), lost geometry (guards pass). Attempt1: fractional margin0.0001 instead of scaled0.003; new UV-area guard rejects area<.15 before baking. Reuse the same decoded checkpoint, no inference.
