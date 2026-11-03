# CXR1 refreshed desktop verification — ACTIVE

Main2bc98cd merged normally into PR245 branch atd71899a. Source worktree /private/tmp/tbh-cxr1-active. Prior screenshots/reports remain historical.

Builder1: typecheck PASS;86 focused PASS;1 old landing-contract assertion FAIL. Corrected documented false expectations: ERC721→ERC1155, verified-source→view-contract, server guest→local guest, open-source→public market contract. Synthetic Bag minted1042 also becomes unavailable proof. No thresholds/actions/values reduced.

Builder2: typecheck87focused24browser PASS. Eight app screenshots at both sizes inspected against the original four-screen reference. Landing/class layout matches structure using existing art/data. Visual review found Home metrics omitted the context row, empty Bag tile CSS overrode fluid sizing, and global bulk-button100% width expanded toolbar. All corrected; new independent rendered geometry assertions added. No passing grade yet.

Builder3: running focused/browser plus strict guest and signed-local UI audits and effects at both sizes. Formal exact-head full gate/fresh A/B pending. No new PR push/merge; CXU3 remains parked and #244 remains owner-blocked.


Fresh A ed11f01 FAILED:2490core/build/8mutants/153repeat1280 pass; full1280 has314pass/9fail. Four phone16:9 failures are real from global Home padding. Two token tests lose the shared pixel-btn selector (initial quick triage incorrectly called these background goldens; corrected after reading full logs). Three u4 tests still require primary bulk equip. Final repair scopes gutters to desktop, restores shared base button + secondary modifier, changes only u4's exact requested secondary-color oracle, retaining4.5 contrast and all geometry/actions. No retry/skip; final-head gate required. CXR2 dirty migration draft is isolated in /private/tmp/tbh-cxr2-active and untested.
