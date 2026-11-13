# V3-A2 decisions

- 2026-11-13T01:08:45.969630+00:00: Work alone; existing worktree and branch, local-only CI, no deployment or main merge. User instructions are authoritative.
- Start tag v3a2-start saved at 0d76bed967e0865cbb9f8b40f6fff2e5332ecefc. Removed only the explicitly disposable planner audit and local build.
- macOS path collision: old reports/v3-battle/A2 is the same directory as a2. Preserve its evidence; new state uses distinct file names and per-card folders.
- Reference frames remain private under ignored ref/. Review sheets are measurement-only and never enter shipped paths.
- G0 uses fail-closed numeric gates and source-commit freshness; measured reference targets stay unset until R supplies observations. No planner estimates masquerade as measurements.

- Case-path repair: git ignored lowercase add pathspecs while legacy A2 was tracked. Moved the unchanged first-run evidence to a2-first-run/ and made a2/ canonical for this run. No legacy evidence was deleted; old A2 filenames now live in a2-first-run/.

## Resume audit: enforce the user voice gate
The prior checker used active voice >= 0.5. The request requires 100%; changed it to equality 1. No user threshold was reduced. Baseline 3×10 s captures are complete and deterministic parity passes. Encoded temporary PNGs were deleted.

## R: measured targets and method selection
- Core median .20946 viewport, numeric ink 46.22 px, luma energy 22.565, climax coverage .87437. Exact numeric bands live in targets.json; no thresholds lowered.
- Complete plate fragments joined before duration: median 2.60 s; only six confirmed plate windows, not twelve optimistic labels.
- Actor travel excludes summoned effects. Sparse confirmed travel gives a lower bound; target retains a stricter 2 events/10 s floor and every-action >6% travel.
- Pilot method 3 (small matched repaint with local fill) selected. Maximum 111 hole pixels and duplicated handle remain; M2 must fix both, not accept prototype as completed rig.
- V2 contains x3 PvP, not a verified boss. V1 early campaign and late mode thumbnails reviewed; boss sampling remains a disclosed source limitation.
- Atlas alpha replaces a contaminated warm-pixel baseline number estimator: real median ink 21.58 px, not rectangle height 33 px.
- Ranged 20px description conflicts with the stricter every-action >6% width gate; preserve the gate with 80–96px cast steps plus 20px recoil.

## F1 measured layout and F2 diagnosis
- F1 geometry passes all six desktop fixtures: median core .19689–.20946, face alpha overlap0, clipping0, floor min.51068, names0. Three calm annotated reference comparisons replace impact-frame comparisons.
- The floor metric excludes walls and edge props. The actual painting horizon moved to160/1024; no threshold changed. The crowded 1440×900 scene has only a1.1 percentage-point floor margin.
- Shared shell Night tips still blocks G0/R/F1 completion. They remain in progress, not done or approved PARTIAL. Continue authorized battle cards while B owns the fix; never merge before scheduled dates.
- F2 investigation: atlases carry encoded sRGB pixels but were treated as linear. Decode after undoing PMA and before linear tint; GPU test round-trips six samples with0/255 channel error. This is a colour-space correction, not recolouring original art.

## F2 closeout / M1 method — 2026-11-13
Measured clarity from isolated rendered actors against the same painted stage; histograms and all 900-frame timelines remain in F2/metrics.json. The material alpha audit excludes original transparent atlas pixels and effect overlays. Pixelwise contrast passes; Panko/Mochi average luminance is still close to the floor (not hidden in the review).
M1 uses analytic, seekable root transforms around each unit's foot, driven by the existing plan impact time. Six styles, independent idle phase, three pooled after-images, and damage-event reactions leave all rule events untouched. Ranged root travel uses the already documented 8.8%-viewport step to meet the stricter every-action >6% gate. No target or gate changes.

## M1 measured dependency — 2026-11-13
The 31s normal fixture has 39/39 visible hit reactions, minimum actor travel .08795 viewport widths, 18.71 displacement events/10s, and ~60 FPS. The unchanged full-frame 10Hz motion estimator is only 8.052 against 15.796. Root motion alone does not make the required scene density. Keep M1 in progress; prepare M2 assets while the other two captures finish, then build the V1/V2 visual density needed for the same unchanged metric. Do not inflate motion with arbitrary camera jitter or reduce the target.
M2 uses the R-c chosen small-paint method. Original atlas regions are decoded out of PMA for painting; annotated eye/mouth regions are our own art only. No public unit assets change until the current M1 captures finish. The old template facialPolicy forbidding new painted faces belongs to A5 and is superseded by the explicit A2 request for separate face parts and hidden-area repaint.

## M2 hidden-area repair / rejected visual result
The first inverse-pose hole fill chose head/prop substrate and expanded by distance-to-paint; Biscuit reached zero holes but acquired a visibly oversized painted patch. Rejected. Method now restricts backing to torso/sleeves/tail/feet with fixed 14-source-pixel margins. Review full silhouettes, not just the hole metric. Gates unchanged.

## M2 real overlap, hidden sleeves, and capture recovery
The inherited preview process ended mid-audit. Discard connection failures and rerun against the live 5990 process; these are not rig failures. Read all 22 face strips. Separate eyelids and mouth swaps are visible, including the small recessed enemy mouths.
The manifest's `jointOverlapRequired: 12` was intent, not evidence. Added a source-alpha measurement over original attachment intersections and hidden patch intersections. Several old patches failed. Extended them only underneath opaque existing material. Panko/Biscuit right-arm sources were fully transparent after separating their shields: painted original cloth sleeves from their own palettes, placed shields above sleeves, and retained their skeleton weights. Rain Spool received a four-master-pixel shoulder extension. Minimum measured overlap is now 12 pixels, without reducing the gate.
A visible-face gate now also requires all 22 runtime captures to show both blink and speaking swaps. This adds the requested runtime verification; no existing numeric thresholds change. Eight-pose/facial audit and all suite results will be recollected after the source commit. Small retained holes in Rain Spool/Velvet remain explicitly measured against the unchanged <=150-pixel allowance, not filled with large silhouette-changing patches.
The final focused runtime test caught a real seek bug after adding hand-parented weapon pivots: template order placed a weapon before its new parent, so the runtime reused the parent's preceding pose. Changed bone evaluation to validated parent-first order. The existing seek/history test now passes unchanged; this is a presentation repair, not a relaxed test.
M2 browser infrastructure repair: mandatory resume cache cleanup left the inherited Vite process referring to removed optimized React bundles. Direct browser probe confirmed HTTP 504 and missing `window.__depthReview`; formation timeouts were not product failures. Stopped only the documented preview PID69096 and this run's Playwright PID73609. Restarted Vite5990 and reran only the invalid browser subset; retained valid typecheck/unit/parity results.

## V1 original summons and encoded gates, 2026-11-13
- Built-in imagegen created thirteen separate transparent paintings from original descriptions only. Exact prompts and tool/date/output paths are in assets/provenance.json and V1/prompts.json. No external image was an input.
- Each plate uses its native animated rig, unique painted summon, animated environment and camera path,480 peak particles, a per-element impact composition and closing flash. Full-size video uses cover; integrated1280x720 and1440x900 capture confirms fill1.
- Initial WebM metrics: coverage min.6345 vs.6121; max pair SSIM.1909 vs.55 over78 pairs; motif min.455. Initial size21,762,391 bytes exceeds20MiB. Encoding CRF40 and poster80 reduce cost without raising the budget.
- Cinnamon/Clover/Soot edge columns did not exceed the25-luma threshold against the field despite full geometrical coverage. Added broad animated reflected side light before the summons, not a checker exemption; re-rendering.
- Vite did not invalidate import.meta.glob after adding artwork outside apps/web; restarted only this session port5990 server. The capture now waits for video metadata before seeking, and uses actor.id to check roster readiness.

## V2 visual repair — 2026-11-13
The first enlarged procedural pilot measured 20–44% coverage but looked like flat geometry, with circular and rectangular cutouts around faces and labels. That does not meet the painted-art quality bar. Replace the broad solid fill with a soft element aura and the existing approved painted core/trail regions, and feather face protection; measure coverage again without lowering its threshold. Battle rules and source art stay unchanged.

## V2 distinctness diagnostic — 2026-11-13
All 24 actives covered 18.8–40.1% of the viewport, but full-canvas RGB SSIM peaked at0.727 (limit0.6); Velvet basic covered only2.74% (limit5%). Retain these failed measurements. Increase Velvet’s painted slash reach and give each cat an environmental cast motif (doors, ember rain, leaves, shields, constellations, ink mist, stitches, steam, wind, crescents, flowers, ice). Soot/Mallow and Clover/Marigold now use different silhouettes. Measure again with the same full-canvas black-composite SSIM; no crops or thresholds changed.

## V2 live-fixture repair — 2026-11-13
All-gallery coverage and SSIM passed, but wave1 retained two real failures: healer basic4.50% (min5%) and zero visible secondary damage from Mochi’s shield ultimate. The number list only enumerated primary friendly recipients; it now includes numeric resolved-event recipients without modifying the plan. Enemy fallback effects receive a wider painted shape. The capture also lacked scene RAF cancellation, mixing two clocks and clearing number bursts; the recorder now owns the render clock. Re-record all three fixtures; preserve the failed diagnostics, keep all thresholds.

## V2 repair: bounded number timing and native clock cancellation
The secondary hit was still hidden: status offsets (280 ms) plus another target stagger (100 ms) placed its first number after the last renderable frame. Number births now reserve two frames before action completion, keeping all integer pieces and the exact resolved total. A 590-frame real-browser regression sees all 39 damage in three pieces and continuous shielding numbers.
Playwright replaces the RAF API; cancelling a native handle after clock installation did not stop the native render loop. Cancellation now happens before installation, verified as 590 fixed renders and zero native renders. The obsolete crowded/boss capture process tree started by this session was stopped and will be replaced. Thresholds unchanged.

## V3 cue ownership and B callout timing — 2026-11-13
A single battle-owned scheduler now emits charge, movement, release, per-recipient impact and tail events from the resolved SkillSequence. The legacy adapter is disabled only for the C2 battle view, and the cinematic DOM layer no longer fires a second copy. Combat data and amounts remain unchanged.
Read B branch a1353ff1069caa62e9d2abb2539c45caaaf86a2e without merging. Its 112 callout rows are retained in an A-owned timing snapshot until the scheduled merge; a live B JSON file takes precedence when available. B documents a 300 ms same-tick/microtask suppression contract rather than a per-unit flag. Explicit voice cues precede the corresponding cast SFX in the same tick, so no second fallback voice is requested. Do not emit generic skill/ultimate barks alongside them.
Append-only shared contract additions: specific skill/ultimate voice IDs; move.<role>.whoosh; kit.<element>.<phase>; battle.cut; heal.small/medium/large. Existing IDs remain intact. The bridge remains B-owned and no AudioContext is created here.
The event audit covers all three fixtures, counts only events delivered to the bridge, checks one voice per active and two ultimate phases, and caps impacts at six per 100 ms. Separate sound-file coverage is reported against B's manifest and is not substituted for audible mix review after SY1.
Resume cleanup removed Vite's cached dependencies; restarted the documented session preview on port5990 before recollecting browser evidence.

## T1 measured HUD and accurate phase markers — 2026-11-13
Removed persistent chapter/round labels and portrait names (names remain on focus/hover and accessible labels). Auto and B's Mix are the persistent words; queued/skip are visual icons. The checker counts all visible DOM words without name exemptions plus each rendered bitmap CRIT tag. Initial 90-frame preview peaks at3/8 words in every fixture, with only the bundled Baloo2 face used.
Added a real boss-HP meter and phase ticks at A6's actual66%/33% thresholds, read from the existing rule contract; legacy battles show their50% threshold. Wave progress counts one remaining route path rather than every alternative branch. Enemy intention icons retain full hover/focus descriptions. No battle statistics change.
The existing B icon set supplies clock, fight, boss seal, menu and refresh. Battle-only brushed frames/shine are CSS; the skip glyph is an original small SVG until B's new painted kit arrives at the scheduled sync. Reward fly-in and title entry are scoped to the battle result and honor reduced motion. Loading uses the animated cat without a sentence.

## P1 motion repair — 13 November
Retain bounded action-follow cameras for both teams, animated painted skill builds and complete-composition plate camera beats. Wave1 improves10.128→15.343 but remains below15.796. After four camera/shape pilots, switch to the authorized P4/P5 environmental/ensemble method; do not crank arbitrary shake. Clear stale cinema audit time after hide. Bound the actual number ink plus crit tags/tilt. Original art only; thirteen encoded plates total18,418,223bytes. P1/M1 remain unfinished.

## P3 verification repairs
The inherited phase layer used Yarn’s portrait for every boss. Later bosses now reuse their existing full painted runtime images without adding media. The four lifecycle tests bypass constructors and needed a bossPhase dispose stub. Initial full suite passed 2508 other web tests; the four repaired tests pass in loading-repair.log. The browser audit also checks stationary reduced-motion aura, reset clearing, and both later boss assets. The shared Night tips shell test still fails and is not waived.

## P10: bounded paint and Low preset (13 Nov)
Baseline: High59.84–60.00FPS; Low4x CPU33.20–42.94FPS. Pack the86 original1024×512 sheets into exact-size per-unit canvas pages, preserving all source pixels and releasing source image references after packing. Keep24 reusable ground marks and72 reusable particle trajectories per element. Low retains full-resolution bodies and numbers, reduces secondary particles, renders VFX at0.85 scale and skips postprocessing buffers. The 4x CDP profile is a proxy, not a claim of testing a physical2019 laptop. Same three deterministic fixtures and pixel comparisons are required before completion.

## P1/M1: ensemble pilot remains below the unchanged target
Adding P4 weather and P5 crowd reactions produces15.3523 full-frame energy versus15.7956 required in wave1. This is a FAIL, not a rounded pass. Keep the already-approved displacement and hit-reaction checks; next compare the recovery portion of the reference and ours to strengthen intentional strike follow-through rather than add arbitrary camera shake.

## P10 method change: exact lossless pixel packing
Three canvas readback attempts exposed CPU/GPU premultiplication differences of one channel level. Keep the zero-difference audit and use offline raw-row copying into lossless WebP pages instead. All86 browser-rendered originals match their25 atlas regions exactly (max channel difference0). Encoded pages are12.23MiB; decoded storage stays172MiB, with no claimed memory reduction. This uses12.23MiB of packed paint payload (source files remain for provenance) for fewer requests and avoids runtime atlas composition. Source hashes and exact layouts live in vfx-packed/manifest.json; no reference imagery or model generation is involved.

## P1/M1: grounded painted strike continuation
The contact strip shows a strong initial bloom followed by a nearly stationary fade. Add a487ms directional ground wake, starting33ms after actual contact, using that skill's existing painted trail. It expands and moves away from the striking hand and dissipates below the target. This changes actual skill follow-through, preserves camera settings and combat timing, and adds no reference pixels. Reduced motion and Low omit this secondary layer. Keep15.7956 as the exact energy threshold and test the same fixed seed.

## P1/V3: preserve complete speech at every battle speed
B's S5-A-VOICE-WINDOW request was reproduced against current A2 events: six required lines across the three normal-speed fixtures overlap the next required voice (1/2/3 per fixture). A2 already gives the full plate a longer charge than B's older integrated battle, but release tails still need protection.
Reserve B's durationMs plus80ms for frame-boundary tolerance. Full-mode contact stays at3200ms; recovery extends to the end of its release line. Short/off modes carry the charge through its full take before release. Voiced windows run at normal speed even at×2/×3; unvoiced portions retain the selected speed. The final-hit0.4x/500ms hold continues inside these windows. Combat event identity, recipients and amounts stay untouched.
Targeted tests cover every authored cat sequence and all13 enemy signatures in three cinematic modes at all three speeds;24 tests pass. Actual browser clock gaps, cue density and parity are checked separately before reporting closure. No sound engine or B-owned source is edited.

## P8/T1: formation controls requested by B U3
Replaced Crew/Saved/help Unicode marks with current GameIcon assets and44px icon buttons; Fight uses the existing fight/arrow art and an orange, battle-scoped frame. The B-owned shared CSS forces a yellow background with !important; an equally scoped A rule restores the intended orange action. Use the existing clock icon for saved teams until B's history artwork arrives at the scheduled sync. Native and touch swaps still preserve seed, HP and enemy statistics. No shell source was changed.

## P1/M1: recovery choreography after full speech
The complete spoken tails reduce wave1 energy from15.36964 to13.68062 against15.79559. The 30.33s capture shows several dead recovery intervals: the plate returns to a static wide camera and field paint stops after620ms while the release voice continues. Preserve every spoken millisecond and change the presentation method: track the receiving group briefly after the plate, then ease to the wide view through release; give active/ultimate paint a bounded1000/1450ms resolving motion. Ground marks retain their850ms life, impact and damage timing are unchanged, reduced motion retains a fixed camera. Basic/active pair framing is bounded by1.18/1.24 zoom and occupied-body fitting, keeping normal bodies near reference scale and reserving head-bar space. Measure the same fixtures and thresholds again; no completion from the pilot.

The four recovery/corridor pilots exposed a quality cost: unrestricted camera travel clipped57 face samples. Body fitting removes all57, but first10s energy is13.60862. Keep the readable framing and stop iterating camera strength. Next method: increase actual element debris and its directional travel after contact, with the existing face masks, original paint, and bounded particle pool. Do not hide missing motion with camera jitter or relax15.79559.

## P1/M1: compose space for the action camera; correct spin bounds
The painted-debris pilot lowered 10.33s motion energy from13.49583 to13.22885: overlapping fragments made a softer glow. Revert the debris proliferation. Two/three trailing brush strokes retain each skill's original paired-ribbon tile and follow the actual contact; their isolated gain is only13.53084, so they are not claimed as the motion repair.
The rear-to-front vertical extent left the last row at93.5% of field height, cancelling much of the intended follow camera. Compress all vertical seat offsets to82% around62% (preserving two rows, half-slot staggering, horizontal spacing and semantic body size). The same 10.33s pilot rises to14.87518, still below15.79559; full30s fixtures are required. Crowded1440x900: floor.50510, face occlusion.000765, clipping0.
The scene previously projected only opposite rectangle corners, which collapses bounds during a45-degree spin. Project all four corners for both framing and face/label masks. Twelve targeted tests pass, including a new real-Three regression with mirrored/nonuniform transforms. Captures now record actual field dimensions for clipping diagnostics. Extend checker source freshness to the visual dependencies used by M1 and the two new V2 paint helpers; thresholds stay unchanged.

## P1/M1: finish landing and resume planted idle
The full captures with the retained 82% row spacing measure wave1 15.56194 (FAIL), wave3 16.97287 and boss 16.52762 against the unchanged 15.79559 target, with zero clipped face samples. A tighter formation barely helps motion and crowds the silhouettes, so retain the reviewed spacing.
An actor remained in the `land` state after its 67 ms squash had ended, preventing idle motion during long spoken recovery. Return to the neutral state at that boundary. Add a small, seeded weight shift around the measured feet (maximum 2 degrees, 1.8% breathing), disabled for stun/freeze and reduced motion. Eleven targeted tests pass, including landing completion and deterministic planted feet. The short pilot is 14.83029 and does not establish a motion improvement; a complete normal-wave capture is running. No gate or speech duration changes.

The full planted-idle capture is15.55380/15.79559 with zero face clips, browser errors or parity differences. Keep the state repair and subtle life; do not claim it closes M1.

## P1/V2: classify enemy signatures consistently
Inspection found three different fallback classifications: audio correctly treated `enemy:<id>` as an active, field paint inferred it from a clip name (missing cast/heal signatures), and numbers/capture treated every unsequenced action as a basic. Unsequenced enemy actives also bypassed the one-frame contact flash entirely. Use one presentation-tier function across audio, field paint, numbers, camera and capture. All signatures now receive their proper active field size, stacked damage and bounded contact impulse; basics keep their basic tier. Passive status ticks do not trigger an action flash. The existing authored flash strengths/durations and shake envelope are unchanged, and reduced motion suppresses flashes.
Twenty-seven targeted tests pass, including every real enemy signature/basic pair, non-mutating contact boundaries, and clearing a previous ultimate before displaying an enemy heal flash. Recollect production fixtures with the corrected action labels; this may expose new coverage failures rather than hide them. Extend source-freshness dependencies to the shared presentation helper. Speech windows and rule events are unchanged.

## P1: real contact motion and input provenance
The corrected enemy-tier full capture remains15.47810/15.79559, with parity and zero face clips. A new review found charge particles anchored on the receiver before the spell arrived. Moving those particles with the painted projectile raises the same10.33s pilot14.69646→14.76396 and fixes the premature-hit read. Sharp directional contact fragments are now being piloted alongside the original paint; no camera, speech duration or gate threshold changes.
The M1/V2 checker now validates the source metadata of each raw capture and browser review, not only the newly generated aggregate. A fresh report over an old video must fail. Twelve checker tests include this regression. V3/T1 collectors retain their suite fields on refresh; missing runs still fail. The Night tips failure is confirmed as B-owned CSS hiding the existing accessible control, so no selector workaround or test waiver is applied.

Contact-shard pilot14.76779 versus14.76396 with particle travel alone: negligible gain and little visible difference, so the added shards are removed. Inspection also found normal basic hits had zero camera impulse, despite V2 requiring tier-scaled feedback. Add a small1.5px contact impulse for actual damaging basics only (crit3/active5/ultimate12 remain unchanged, normal flash remains0). Do not increase camera zoom or repeat the impulse. Measure before retaining it.

## P1/V1: articulate the painted summons
The normal basic contact pilot is14.77111 versus14.76396 with moving charge particles alone; keep the modest1.5px feedback for contact readability, without claiming an M1 repair. The remaining large objects in the ultimate compositor were single translating/rotating paintings. Add a48×40 continuous texture mesh with thirteen anatomy-specific motions: wingbeats, following coils/tentacles/tails, opposite loaded paws, and small lantern wisps. Heads and rigid glass stay stable. This reuses only our original paintings, adds no generated artwork or reference pixels, and changes no audio or combat timing.
The mesh checks all13×68 frames for inverted triangles and excessive stretch, checks rigid facial/glass regions, and verifies articulation independent of translation.3/3 targeted checks pass. First four rendered previews are inspected; now encode the actual plates and remeasure full battle fixtures. The unchanged motion target remains15.79559. No pass claim from screenshots or geometry alone. Render provenance now hashes the deformation source as well as the compositor.

Checker audit follow-up: fresh aggregates must also carry suite metadata at least as new as the card source. Previously a newly written metrics.json could still reuse old passing suite exit codes. The regression now rejects stale suite provenance as well as stale raw captures; thresholds remain unchanged. A collector reproduces the all-FAIL bootstrap, real checker tests and three real capture receipts.
