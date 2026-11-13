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
