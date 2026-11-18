# Pending CXV integration against m1.12

Generated 2026-11-18T03:31:26.468856+00:00 from 025b39546e8be8cc40cf3e0d5a7c94cd2ea57cda. These six local READY changes still differ from green v5-m1.12. Independent CXI acceptance remains pending. The paused-battle recovery is a separate two-file READY172c317d4; do not merge the lane wholesale.

| Change | Source commit | Evidence | Dependency/scope |
|---|---|---|---|
| Pose readback | e1b1f58f5 | V7-F-pose-crop-summary.json | 130 GPU pairs/80 assets;96 tests/TSC0. Apply before stationary rows. |
| Pending labels | 2fd7665b4 | V7-F-pending-label-ready.json | 48 geometry groups/8 exact PNG pairs;13 tests/TSC0. Apply before same-paint focus reads. |
| HUD text | 79d408c71 | V7-F-hud-text-ready.json | Retains unchanged damage text;native correctness/lifecycle plus production addendum. |
| Stationary rows | 4c5f0fa55 | V7-F-static-native-production.json | 910 geometry/380 GPU checks;42 tests/TSC0;native production evidence. |
| Original Panko crumb | addba7446 | V7-D-panko-crumb.md | 9048B original1x1 asset;36 tests/TSC0/32 native pairs. Needs CXI loader entry;AGV manifest untouched. |
| Same-paint focus reads | 3050ee5ae | V7-F-focus-read-native-production.json | 80 geometry/8 RGB checks;13 tests/TSC0;native production26actions/6ults. |

V7-pending-integration-m112.patch contains exactly the eleven remaining application paths above, including original crumb bytes, against the announced green tag. V7-pending-integration-m112.json records exact base/source commits, paths and hashes. These paths plus the separate recovery scene/test exhaust the thirteen-path application delta. Read-only audit only; no application edits.

All claims remain scoped to their existing evidence. The latest combined native source9efabfa86 also passed two32s DPR2 ordinary boss runs with26actions/6ultimates and zero errors, but that is configuration coverage, not a paired speedup measurement or independent judge acceptance.
