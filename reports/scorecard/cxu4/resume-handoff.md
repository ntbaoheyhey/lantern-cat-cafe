# CXU4 resume milestone

2026-11-01; base HEAD 1fb25edf4c54ada0d161e3c1dd16a4c4550aafba, branch ai/codex-cxu4.

Shared primitive paths established: apps/web/src/ui/index.ts exports Modal, ConfirmModal, Toast/ToastHost, Banner, EmptyState, Tabs and types. HeroScreen.additionalTabs and HelpTab.additionalTabs remain typed future hosts.

Resume milestone: 60 component/contrast tests pass; repository typecheck passes after replacing readonly test writes with existing withConfigV2 helper. Target browser smoke: 18/18 pass, including both desktop sizes and preserved mobile checks. Three initial failures corrected: nested panel locator narrowed to exact Hero, equip performed before switching to an incompatible class, lossless IDAT recompression keeps screenshots under unchanged 200KiB limit. Modal colours now match dark reference tokens.

Active: browser repeat10 on owned ports4360-4363; seven scratch mutations; typecheck/lint/build. Full logs under logs/. No baseline fixes absorbed; full gate and independent grading remain pending BASE0. Next: screenshots/reference view, port-isolated audits/effects, evidence report and reviewable commit/draft PR.

Milestone 2: all 180 repeat cases pass (three changed/new specs, repeat10, both mission sizes plus preserved mobile sizes); screenshot rerun 4/4. Seven of seven scratch mutants killed, controls/restoration green. Repository typecheck/lint and v2/classic builds pass. Full unit run hit three unchanged 5-second timeouts under concurrent load; lower-concurrency rerun underway with unchanged timeout/assertions. Deno guard remains red for baseline explicit index aliases. Twelve screenshot artifacts captured; reference capture corrected to preserve stylesheet and SVG definitions. Audits/effects now use port-only temporary copies on4362/4363. No code or assets from other worktrees copied.

Milestone 3: full workspace unit rerun passed (web114 files/1321 tests; expected legacy skips remain in game-rules). Classic browser suite38/38. Demo and signed-in local audits18/18 each, zero findings. Effects1280 nine checks passed. Added direct network-abort class test at both sizes; repeat10 running. Completing effects1600. Syntax-checked three evidence runners and scratch mutation runner with node --check. Original Help strings independently verified against base HEAD by rendering in scratch. Full release gate still pending BASE0, complete all-project browser run, fresh independent verification/grades and merge gate. Never treat this builder report as a score.
