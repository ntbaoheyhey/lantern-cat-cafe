# Separate review rounds and honest self-grading

Candidate build, not live. One author, no independent judges. Four fresh-profile, UI-first scripted walks were captured before fixes and repeated after them. Their source is the offline actual-component demo. Scores below were assigned on resumption by inspecting both retained rounds; they were not recorded during the walks and are not a blind experiment.

Rubric, each 0–10: **fun** (interesting actions and rhythm), **clarity** (honest next action and consequences), **depth** (viable trade-offs and return goals), **polish** (readability, stable geometry, coherent feedback). Fun is an author judgment, not measured enjoyment. Initial/final columns compare two iterations of this new Sample, not PR #282. The prior report's 8.0→8.7 used nine visual axes and is not numerically comparable.

| Role | Initial fun / clarity / depth / polish | Final fun / clarity / depth / polish | Mean | Evidence and remaining concern |
|---|---|---|---|---|
| First-time | 8.3 / 8.4 / 8.5 / 8.4 | 8.4 / 8.8 / 8.5 / 8.7 | 8.40 → 8.60 | `fresh-eyes-regrade/first-time/receipt.json`: first find at 9.815s, Workshop at 25.182s, boss at 120.952s, result at 134.607s. Counter labels teach the loop; some route decisions still reduce to resource preference. |
| Returning | 8.2 / 8.8 / 8.3 / 8.5 | 8.2 / 8.8 / 8.3 / 8.7 | 8.45 → 8.50 | `fresh-eyes-regrade/returning/3-keep-reset-preview.png`, `5-undo.png`: kept/reset contents and immediate undo are explicit. The 2.393s fixture sequence checks UI states, not a second real visit or multi-session motivation. |
| Min-maxer | 8.6 / 7.8 / 8.7 / 8.3 | 8.6 / 8.8 / 8.7 / 8.7 | 8.35 → 8.70 | `fresh-eyes-regrade/minmax/1-near-stitch-cap.png`, `build-lab.png`: corrected +1 near cap, affix explanation and tier comparison. Fast 2.118s fixture sequence; numerical builds are stronger evidence than a human strategy claim. |
| Skeptical three-minute judge | 8.0 / 8.1 / 8.3 / 8.3 | 8.2 / 8.6 / 8.3 / 8.7 | 8.18 → 8.45 | `fresh-eyes-regrade/judge/receipt.json` spans 180.305s; boss, forge, sets, journal and away views captured in the first 18s, then observed. Clear scope and complete controls; the last wait is not 180s of active play. |

Mean across 16 equally weighted axes: **8.34 → 8.56**, rounded **8.3 → 8.6**. The 9+ target is **not reached**. Individual final view judgments: Home/Patrol 8.6; boss 8.7; Workshop 8.6; Wardrobe 8.7; journal/mastery/return 8.5. These are self-scores with no statistical confidence claim.

## Corrections between rounds

- Spark at stitch level two promised +2 but could only deliver +1. Display now uses remaining capacity; red and passing browser receipts retained.
- A room-clear action fell below the 720px viewport. Result/advance actions now precede the longer kit sidebar; keyboard and visibility regression tests pass.
- Recovery promised bonus damage after a missed counter. Copy now distinguishes an exposed opening from ordinary Pounce.
- Gear now explains the selected affix and room scaling instead of only its name.
- Auto-Gather changed route-card height, visibly moving the arena (~0.0205 initial global CLS). Reserved geometry now has an exact-bound regression; final measured global CLS is ≤0.000154. All 413 browser tests pass.

## Why scores remain below nine

Bosses share the same three response verbs and phase framework, despite distinct patterns and pressure. Star changes gathering more than combat. Journal content is mostly collection cells, not bespoke stories. Sidebars still scroll on short desktops, though actions remain reachable. Local Sample progression has no cloud continuity and the default main game keeps its old boss wall. Fixing these responsibly needs focused human playtests and a separate server/replay design pass; hiding the limitations behind a higher score would not improve the game.

No previous instruction is treated as permission to deploy. These review results support a playable candidate, not release approval.
