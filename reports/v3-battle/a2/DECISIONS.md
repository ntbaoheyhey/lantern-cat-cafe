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
