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

## B-LOCAL-009 Button decoded surface is nonmanifold S2 — 2026-11-10
Repro: export2/front,three-quarter,geometry show shattered triangular patches and obscured eyes. Export2 fractional UV margin fixes atlas coverage (.34896 area/.292 raster occupancy); geometry/index guards pass through UV. Existing decoded source has75355vertices/243302unique triangles,19960boundary edges and89796nonmanifold edges; winding inconsistent. This is not solely a texture orientation issue. Hypotheses: fast_simplification damage (primary), native decoded topology, invalid normal field. Raw pre-simplification geometry was not checkpointed, so source of damage remains unproven.
Attempt1: local Blender voxel remesh.003, preserve volume, two.25smooth steps,100Ksource target; retain original colour voxel data. Record two-direction sampled vertex distances, compare the same six source views before any runtime install. Queued under shared lease; no third inference.

B-LOCAL-009 continuation: corrected stale local queue that listed only attempt1/INTERRUPTED while attempt2 had an active decoded-source repair. sourceReviewPending now excludes Button from automated inference; plan confirms held Button, Yarn first, Mochi/Soot preserved. Both original terminal receipts retained. No model request or runtime change.

B-LOCAL-009 attempt1 result12:27UTC: source-scale drift guard rejected voxel.003/smooth.25x2 after21.7s; no GLB/runtime install. Blender returned0 despite Python exception, obscuring the cause as missing output. Attempt2 uses finer voxel.0015/smooth.12x1 with the same .015p95 bound, saves distances/geometry before rejection, and explicit --python-exit-code1. Export refuses a failed surfaceDriftPass record. One replacement wrapper/session5874, no duplicate inference.

B-LOCAL-009 attempt2 rejected:98.78s,p95.024344/.017910>.015,754242tri despite100Ktarget. PARTIAL; stop destructive repair, retain reviewed animated Button fallback. Preserve original decoded data and both failed receipts; no third Button inference. New Yarn native trial uses raw checkpoint and Blender UV/area guard, not a repeated Button model.

## B-LOCAL-010 Yarn raw topology is already fragmented S2 — 2026-11-10
Native attempt1 exported847.754s,108834832B; front/side/clay show triangular shards and hidden eyes. Raw checkpoint has921309nonmanifold edges before simplification; reduced surface adds80276duplicates. No runtime install. Hypotheses: native decoder/topology(primary), export simplification(compounding), UV-only cause(rejected by clay). Attempt1 local voxel.002/smooth.1x1 repair from immutable raw checkpoint; source colours retained, no inference. Source/battle acceptance pending; reviewed fallback stays.

## B-LOCAL-011 repair diagnostic confuses vertex spacing with surface drift S2
Repro: an interior point on an unchanged coarse triangle is distant from its vertices, so nearest-vertex p95 can falsely fail a surface-preservation bound after decimation. Attempt1: closest triangle surface with BVHTree, both directions, unchanged.015p95 threshold. Four fixtures cover unchanged geometry with different density, actual displacement, winding and outside-surface distance. Run under the pending Yarn repair lease. Preserve prior failures without rewriting their reported measurements.

B-LOCAL-011 verified: all four closest-triangle fixtures PASS before the pending Blender repair; original .015p95 bound unchanged. Prior Button measurements remain preserved.

B-LOCAL-010 attempt1 result: raw voxel-remesh export passes distance (.004402/.000629p95) but inspected front/side/clay still show shredded triangles and hidden eyes. REJECTED visually; no runtime install. Raw edge sample has max .00534 at grid512, without distant-index triangles; mesh extraction index corruption is not established.
Attempt2 reconstructs an oriented surface from the immutable native voxel cells: closing1/fill/sigma.65 -> marching cubes -> Blender100K -> same colour bake. Source drift .006801/.002699p95 <=.015, actual100K source, UVarea.28594. Inspected front/side/clay removes the fragmented shards and restores crown/eye/yarn masses. Source approved for packed motion review only; small holes, rough thread details and muted eye glow remain. No new model request. Two no-model shell guards preserve disconnected parts, watertight/winding and reject malformed/oversized cell grids. Native source and both prior failures retained. Packed1.298MB/61068tri requires battle/perf review before acceptance.

## B-LOCAL-012 reconstructed Yarn loses dark value structure in battle S3
Repro: native-yarn/after2 versus shell2/front: additive pale contours cover every thread crease (x810–1220,y330–705); crown/eyes lose contrast. Eight poses show rigid motion without stretching, but material treatment is visibly below the source. 24protected-face samples and UI checks pass; they do not establish beauty. Hypotheses: legacy additive enemy relief(primary), toon ramp, packed geometry/normal damage. Packed Blender source remains visibly coherent, so isolate the runtime relief first.
Attempt1: reconstructed v3 foes retain source material plus the shared atelier/stage treatment; skip the old primitive-foe additive rim, emissive wash and named-prop enlargement. v2/OFF and authored primitive foes unchanged. Type/lint/5touchedtestsPASS. Matching real battle and eight-pose verification queued under shared lease; no source regeneration or runtime acceptance yet.

## B-LOCAL-013 export failure can trigger unnecessary inference S2
Repro: local-roster treated any failed terminal receipt as retryable, even when raw/decoded geometry had been saved before export. Button/Yarn required manual holds to preserve completed model work. Hypothesis: runner only classified the receipt status, not the retained checkpoint.
Attempt1: after a failed conversion, prefer a nonempty raw checkpoint (then decoded fallback), mark DECODED_REPAIR_REQUIRED/sourceReviewPending, and skip further inference until reviewed. A sampler failure with no usable checkpoint still gets its bounded retry. Two filesystem fixtures PASS; runner syntax/read-only plan PASS. No new model requested by this change.

B-LOCAL-001 recurrence13:34UTC: A reacquired its next lease at13:32:55 while the sole B material waiter60368 remained idle since13:18:50. Verified it had no child and did not own the lock; stopped only own three idle wrappers and resumed the same unstarted job at100ms polling. No render/inference repeated, no A PID touched. Replacement Yarn session50443/owner64400 retains the same command and6.5s release gap. Successor Clover and source review are resequenced after it.

B-LOCAL-013 resume coverage: the same retained-decode hold is reconstructed from earlier receipts before the next trial loop, covering process interruption between receipt and queue writes. Twofilesystem fixtures/syntax/planPASS; existing source ownership unchanged.

## B-LOCAL-014 native voxel shells face inward S2 — 2026-11-10T14:28:19.830994+00:00
Repro: Clover source/simplified/rig/decoded-packed Blender views are smooth, while real battle has shredded collars/apron and Yarn exposes internal thread faces. Hypotheses: atlas minification, packing damage, backface culling. Same-artifact no-mipmap diagnostic does not fix it; DoubleSide restores surfaces. Saved Clover/Yarn shells have signed volumes -.0092167/-.0317162, proving inward winding. Existing shell tests checked consistent/watertight topology but omitted outward orientation. New disconnected-shell regression fails on the original helper.
Attempt1: reverse indices and vertex normals on the preserved uncompressed source only; positions/UVs/images remain byte-exact. Two tetrahedron regression cases pass, including refusal to change an outward source or overwrite/repeat correction. Source->pack->same-battle/motion/faces/casts queued in /tmp/cardrpg-v5full-winding-verify.mjs under the shared lease. No source generation repeated.
Do not edit the shell helper during the active five-cat inference batch: its recorded helper hashes must describe the executed code. After that batch ends, change marching-cubes orientation and pass the new regression. Existing batch exports receive the same explicit no-model winding correction before review. Runtime acceptance pending actual corrected views.

B-LOCAL-014 continuation: Panko exported466.642s; safe successor changed shell orientation after terminal receipt and before Mallow. All3shellfixturesPASS. Existing Clover/Yarn winding correction+pack completed; verification build wrote HTML then failed because the new receipt directory was absent. Preserve original log; builder now creates both output/receipt parents. Resume from build only, no correction/packing/inference repeated. Panko existing source also corrected; signed volume-.01004084 to+.01004084, source/UV/images preserved; source views queued.

B-LOCAL-014 VERIFIED: identical FrontSide battle shows continuous Clover face/collar/apron and Yarn outer crown/thread/arm surfaces.16poses0errors,48faces0offenders,0UIoverlap,4casts16.8ms/78draws/189046tri. Fix accepted; r2/outward1/REVIEW.md records five flaws/limits. B-LOCAL-012 pale relief resolved by generated material/toonfalse; coarse Yarn source remainsPARTIAL. Panko corrected from saved source only; Mallow exported476.830s with fixed helper. No repeat inference.

## B-PUPPET-001 — hidden overlap visible over original pixels
2026-11-10 P1 first reconstruction showed smeared seams: every part extended over both foreground and background neighbors. Restrict filled extension to pixels owned by foreground parts only. Rebuilt Mochi and visually verified exact clean rest reconstruction plus real8poses; one repair, resolved. P2 eyelid-expression issue remains open.

## B-PUPPET-002 — P2 pilot review
Lid coverage previously crossed open eyes and sampled the dark lash. Increased open-eye threshold, moved fur sample upward and added closed-eye crease; reviewed three motion sheets. Closed-eye texture remains approximate (PUPPET-SCORES), accepted as the simple x1 version. A6 boss replay correctly includes Binding Thread adds: harness now requires the three pilot identities without imposing an actor-count limit. Replay75s/0errors/0labeloverlaps; no rule change.

## B-PUPPET-003 — compact framing and rear-row occlusion
P3 gallery override masked real formation and rear-row lateral offsets hid Clover behind Soot. After three bounded layout rounds, use the simplest row-independent lateral fan plus row depth, normalize puppet heights, and keep minimum frame height4.25. Final four A6 captures show all party faces/0outside/0labeloverlaps. Wrong-shell baseline excluded and harness now asserts A6/v3/puppet. Existing camera push/shake/reduced behavior reverified.

## B-PUPPET-004 — cheek-sampled closed eyelids
P4 first-batch motion review exposed Panko hat and Cinnamon forehead stripes inside closed eyes. Sample a fixed cheek point below each eye; defeat now closes fully. Re-captured six units and inspected final sheets,0page/faceHPerrors. One correction; no source art regenerated.

## B-PUPPET-005 — Sorrel eye ROI and A6 badge audit
P4 batch2 first sheet left part of Sorrel left iris visible at defeat. Corrected both ellipse coordinates from source overlay; final two-unit recapture closes cleanly. Inkcap audit crashed because its status badge lives in A6 .uv-battle-cat, not legacy [data-hp-plate]. Harness now accepts and checks both parent types, still fails unknown card markup. No game DOM changes. Six final units0errors/faceHP;18testsPASS. One fix each.

P5 review attempt1: solo Kettle retained elite-sized puppet despite existing boss showcase. Set illustrated rig boss flag; add authored eye-emission metadata for boss idle. Rules tier remains unchanged. Recheck affected battle/motions.

## B-PUPPET-007 — P6 impact flash obscured concept
Pilot image review showed white silhouettes during impact AND recovery. Cause: held mixer progress fed sin(t*pi) flash across the whole reaction. Use elapsed local hit age and a45% tint decaying over the first24% of reaction; reduced motion stays0. One visual repair, saved final49+6cast audit verified restored colours and zero overlaps; resolved. Number fixture expected obsolete Cozy text; existing status vocabulary correctly maps it to Warm, corrected test expectation.

## B-PUPPET-008 — current A6 shell in the disposable preview
P7 source audit found that prior preview retained an earlier A6 UI: current art-a6 adapter/new HUD files and800/400/267ms cut-in were missing. Copy fetched A6-owned UI files and their published assets into the authorized disposable preview; preserve old preview files in work/preview-before-current-a6-shell. No B-published HUD/rules edits and no writes to A6 worktree. Earlier accepted art evidence stays historical; P7 controlled before/after pairs and P10films now use the current shell. This is a necessary integration correction, not a repeated roster review.

## B-PUPPET-009 — P10 fixture counted enemy ultimates as cat showcase coverage
Saved75s films had no cat ultimate because the setup used level1 starters (only skills1–3). Candidate selection counted all ultimate.cast events, including enemy rage casts; film logger intentionally counted cat skill4 only. Rules/replay resolution is not the cause. Attempt1: use explicit level6 showcase progression, derive unlocked kits through battleCats/availableSkills, require at least3cat ultimates in candidate selection and in captured film acceptance. Preserve both original films and fixtures under their original names; new attempts get distinct paths. No published gameplay rule or A6 model change.

P13 capture harness repair: ready flag could refer to prior gallery before new asset arrived. Wait for Rain Spool and current actor IDs before reading its transform; reuse completed repair1 build. Runtime formation attempt1 remains unchanged.

P13 wrapper repair: delivery-budget needs ART_ARTIFACT as well as receipt. Move export ahead of budget and resume there; reuse completed type/lint25tests, build and parity. No runtime change or repeated gate.

2026-11-10T19:06:37.950652+00:00 P15 reproduction: full boss film90s shows four Binding Thread HPcards but only two silhouettes, due to P13slot parity reusing positions. Phase3 was outside earlier initial-state capture coverage. Smallest fix: explicit four-slot fan and actual phase3 capture; keep priorfilm as diagnostic.

2026-11-10T19:17:28.571347+00:00 P15 attempt1: four unique bases still leave summons feet15px below canvas and two right faces57px apart. Three/four helpers reproduced for3bosses×2sizes. Repair2 moves only summoned lanes to(.40,1.15)/(1.60,1.35); initial pair/scales unchanged.

2026-11-10T19:55:51.102382+00:00 P10 terminal-view gate: corrected P15 film reached party result135.2838s/13catultimates with0page/HPerrors and distinct4/3helpers, but final frame remained lazy-loading "Lighting the lanterns". Keep it diagnostic; do not accept from model.result alone. Small capture-only fix waits for actual .uv-result-title, loaded result images and1.8s readable hold while the SAME screencast continues. No game/A6 source change. Retry goes to distinct p10/result-boss, accepted normal remains unchanged.

2026-11-10T20:12:29.387312+00:00 P16attempt1 passed22tests/16views/12casts, but visualreview shows the right-hand lantern lowers at windup; shared rotation sign did not match this art. Repair2 reverses Inkcap prop/offhand signs only and asserts authoredsocket lift>.04worldunits. Reuse saved before frames/casts; other units unchanged.

P18 preview build repair1: latest fetched A6 snapshot included GuideA6/SettingsA6/style imports; four journal-only files were insufficient. Refreshed all changed A6-owned cardrpg files from pinnede94713b8e into disposable preview. Reuse passed type/lint24tests; rebuild only. No A6-owned B source changed.

P20 A6 disposal report resolved: reproduced expected3/received5, added idempotent lifetimeguard to CardBossAtmosphere. Test counts actual geometry/material/InstancedMesh once after each of two calls, verifies rootdetach. Type/lint4focusedtestsPASS; live drawing unchanged.

2026-11-10T20:45:14.662243+00:00 P21 attempt1 rejected despite26tests/16views/8casts/parityPASS: larger knot reach exposes old arm fragments in body. Master layer inspection shows overlap dilation includes transparent mask area, extending the body behind entire thin limbs; authored polygon also misses inner knot edge. Repair2 uses opaque-owned overlap for BindingThread only and tighter original-part partition; preserve all original/attempt1 masters. No other unit rebuilt.

2026-11-10T20:48:21.705636+00:00 P21 repair2 removed the floating hands but a thin old upper-right arm remains at the52%pose. Pixel-component analysis isolates2292ownedbody pixels atUV(.5854,.3417)-(.6888,.48), belonging to that arm. Repair3 expands only that inner arm partition to include this measured strip; opaque-overlap logic and accepted gesture retained. Reuse before/parity and passing pipeline tests.

## B-PUPPET-P25 — whole rolling pin and detached chin fringe
2026-11-10T21:20:31.576953+00:00 Source attempt1 moves both pin ends/barrel/mitten to armL. Opaque ownership audit reveals two disconnected body strips (about2422+123pixels) under the old chin boundary. Repair2 assigns these cheek/upper-shoulder pixels to head behind armL, keeping source pixels and all other parts. Original and attempt1 masters/config/atlas/rig archived in ~/art/look-v3/p25. First validation caught an old shared-motion sentinel using Panko; change sentinel to still-shared Mallow, preserving its assertion. No visual-motion acceptance yet.

2026-11-10T21:26:40.137682+00:00 P25 resolved: source2 body is one connected component, coherent full pin/chin in16pairedframes; all30web+3pipeline tests and12casts pass. Accepted/pushedfd11fd15f1fd42aba4b518f93935f94511a395bd; original/source1 preserved.

2026-11-10T21:33:18.585713+00:00 P26 source1 complete whisk/free mitten retained, but owned-alpha audit found detached cuff fragments in body (1293pixels right,543pixels left) and a186pixel mitten fringe. Repair2 expands only those sleeve/mitten borders; source1 and original masters/rig/atlas/config preserved in ~/art/look-v3/p26. No motion accepted yet.

2026-11-10T21:35:58.736528+00:00 P26 source2 cuff repairs are correct and body is connected, but a magnified original-art crop proves the isolated armL fringe is tail fur, not mitten. Repair3 restores it to tail by following the actual transparent gap; original/source1/source2 preserved. Keep the already bounded whisk gesture; reuse saved before captures and passing type/lint/motion tests.

2026-11-10T21:43:05.344906+00:00 P27 source1 complete-rim polygon left993shield-top pixels in the frontmost head. Repair2 changes only source ownership order so armR takes its full shield before head; its polygon does not intersect the actual face. Both source1 arms/body are connected; original/source1 preserved.

2026-11-10T21:46:00.495842+00:00 P27 source2 has full shield except a128pixel top-left metal fringe still in head. Magnified original/ownership crop identifies the straight chord cutting across the curved rim. Repair3 adds only two outer-rim points in the transparent gap; source2 preserved. Keep first bounded motion and reuse before/type/lint/parity.

2026-11-10T21:50:12.119875+00:00 P27 source3 retained unchanged: failed new sentinel UV(.674,.393)=(698,472) has RGBA(0,0,0,0), so it cannot prove shield ownership. Replace sentinel with measured golden fringe pixel(707,480), alpha252, formerly in source2 detached128pixel head component; assert opaque source. Current source3 armR/head/body are each connected (>80pixel audit). Resume at pipeline test then final capture; no fourth art repair.

2026-11-10T21:57:31.462053+00:00 P28 source1 restores scarf/tail and whole puff sleeve, but144cuff pixels remain on body and basket loop still carries visible red skirt. Source2 expands exact cuff edge and adds opt-in authored interior hole for armL; all old configs have no holes and keep their masks. Offset offHand to the actual open palm (same armR). Preserve source1/config/atlas/rig/build.py.

2026-11-10T22:09:35.688584+00:00 P29 source1: cheek/chin/collar and skirt are coherent, but new narrow armR boundary split handle/knob and sleeve; free palm kept tail-edge fringe and lost cuff pixels; tail retained99px skirt island. Source2 broadens intact pot/arm mask, traces actual palm/cuff and tail/hem seam. Source1 masters/config/rig/atlas preserved; no original source changed.

2026-11-10T22:11:16.504319+00:00 P29 source2 has one connected component per part and preserves complete pot/palm, but visual source overlay shows an apron-edge strip following armL. Source3 moves that inner contour into the visible sleeve/apron gap and trims two tail/cloth corners. Source2 assets/masters retained; this is the final source repair for this item.

2026-11-10T22:12:52.009515+00:00 P29 final source3 keeps255source-pixel lower-sleeve fringe on body after apron-strip removal. Per max3 source repairs, use the restrained<=.08rad offhand fallback and judge in realx1; pot motion remains independent. Pipeline test initially sampled transparent tail pixel(280,913); replaced with measured opaque tail-fringe pixel(280,909) without source/config change.

2026-11-10T22:24:59.258600+00:00 P30 source1 has one connected component per part, but head still carries leather shoulder/red-collar wedges and needle arm retains a thin chest-rim strip. Source2 follows the helmet/dark-face contour and begins needle-arm cloth below its rigid shoulder cap; preserve full original needle. Source1 configs/rig/atlas/masters retained.

P30 socket audit corrects the preparation note: old needle source(.94,.08) has alpha0. First opaque tip is(1093,83), alpha>180 in1141x1200. Synchronize config/rig socket only; source2 raster unchanged and pipeline input receipt refreshed. OffHand is the opaque shield centre(192,686).

P30 evidence compression: the six actual native-Yarn PNGs pass lossless pixel/metadata equality, saving121772B. Extra old .png paths include JPEG-encoded images despite their extension; both PNG refilter and IDAT-only attempts rejected them before writing. Preserve those files unchanged; use value-preserving JSON whitespace compaction for the small remaining budget gap.

2026-11-10T22:45:58.308705+00:00 P31 source ownership rounds1–3 remove split needle/ribbon and cape/boot/tail fragments. Round3 retains57pixel source fringe on body; bounded staff tilt0.042rad is visually clean at both battle sizes. Simplest accepted fallback; no fourth repair. A newly authored source test initially picked transparent ribbon point(935,770); measured opaque(900,700) replaces it.

2026-11-10T23:01:19.948566+00:00 P32 source1–3 repair full needle/wing/abdomen/boot ownership and move pivots onto painted joints. Tiny edge/antialias fringe retained after third pass; bounded wings0.026draw/−0.018release and0.14needle motion are coherent in both-size x1 review. No fourth repair.

2026-11-10T23:13:12.274298+00:00 P33 source1–3 repair whole spoon/finial, brass shoulders, cup handle and saucer/feet. One opaque component per part at audit threshold; retained restrained rigid arms/head after paired x1 review. Source test transparent sentinel corrected to verified brass; no art change or extra source round. Missing wrapper label failed before any job; corrected bounded lease completed.

2026-11-10T23:23:45.125294+00:00 P34 first runtime gate: type/lint39web tests PASS; source ownership test catches actual golden handle edge at(758,595) incorrectly assigned to wingR by the loop hole. Magnified original confirms the test is correct. First repair of this handle issue shrinks only the hole along three inner-braid points by7–8source pixels; no test weakening. Prior source3 atlas/config/rig/masters preserved. Reuse passed web gates, rerun source test and new artifact acceptance.

2026-11-10T23:34:59.629397+00:00 P35 source1–3 retain complete shield/gauntlet, separate rigid chest/tabard and remove disconnected ownership components above25pixels. Source test initially chose transparent(840,540); original pixel inspection establishes opaque brass(845,540),alpha253. Sentinel corrected, no art weakening; type/lint40web tests already passed and are reused.
P35 second new sentinel(791,790) was also transparent; verify every remaining selected source point and move this one3pixels to opaque boot rim(791,793). No source/motion changes; resume source gate then captures.

2026-11-10T23:46:36.187385+00:00 P36 resumes saved source3 after three source rounds. A399pixel inner spout-shoulder fringe remains on body; keep bounded spout lift0.14rad/release0.055rad and quiet lid/torso, then judge real x1. No fourth source repair; complete original handle/spout/fingers and boots retained.

2026-11-10T23:47:53.181015+00:00 P36 type/lint41web tests PASS; first source gate selected transparent handle sentinel(500,150). Inspect all selected source pixels, use opaque handle(500,180); no art/rig/runtime changes. Source test and capture continue; completed web gates retained. Initial wrapper path error occurred before work and was corrected to existing run-lock.mjs.

2026-11-10T23:53:33.769311+00:00 P37 three source repairs reconnect armR lower yarn and foot fringes. A123pixel collar-thread sliver remains on armL after moving its complete hand rim out of body; keep opposing arm bounded0.105rad and judge realx1. No fourth source pass. All test sentinels checked against opaque source before tests.
