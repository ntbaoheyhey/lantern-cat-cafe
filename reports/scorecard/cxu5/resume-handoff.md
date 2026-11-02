# CXU5 resumed builder handoff

Historical builder log only. The T008 continuation on 2026-11-02 integrates main 9c457a3; BASE0 is merged. Current exact-head self-reviews and merge/live evidence are published on ai/codex-mega-ledger at reports/cards/CXU5-FRESH/REPORT.md. No v2/backend flag change is authorized by this UI-only task.

2026-11-01, milestone: initial implementation. HEAD 1fb25edf4c54ada0d161e3c1dd16a4c4550aafba; branch ai/codex-cxu5.

Owned files: map/ChapterMap.tsx; layout/boss/{BossGatePanel.tsx,BossMapScreen.tsx,BossMapScreen.css,mapDetails.ts}; layout/{bossPresentation.ts,StageLayout.tsx}; CXU5 docs/evidence. Preserved saved6 WIP. No shared ui primitives, global shell/HUD/theme, art, rules, API, auth or dependency edits. Parent allocation 4370–4373 overrides stale plan card allocation.

Implemented chapter path, real names/art, source-backed power advice/chest preview, key-limited daily facts, session-only completed history released atomically with outcome; account/mode reset. Existing compact ChapterMap still supported. No backend additions or flags.

Validation: initial web typecheck found maxMs property typo, corrected; rerun pending. All browser, repeat, mutation, full gates, formal grading NOT VERIFIED. BASE0 remains unmerged; no baseline fix copied.

Next: tests, targeted units/typecheck, free-port check, browser proof and ten repeats at each size, five mutants, audit and evidence review. No merge/deploy.

2026-11-01 16:46 +07 milestone: 61 focused unit tests pass (8 files); initial whole web suite 1303 pass (111 files; run before new tests). Browser spec covers both sizes; first run in progress on confirmed-free 4370–4373. New/changed tests: mapDetails.test.ts, BossMapScreen.test.tsx, bossPresentation.test.ts, e2e/ui/cxu5-map.spec.ts. No scores/merge claims. Next: inspect browser failures and screenshots, repeat10, mutants.

2026-11-01 16:52 +07 milestone: root typecheck/lint/test/build/classic-build/gen:deno drift/bundle passed on working implementation. Deno import check fails inherited explicit-index edges; links fails one inherited missing tbh-index-research path. Full gate remains pending BASE0. Browser r3: 6/6; expanded r4 caught chapter5 no-key 1280 sidebar bottom758>720. Layout fix underway with assertion retained. Existing replay concealment/key-hint regressions passed13 in r2; two new fixture assertions failed then corrected (keep fought chapter selected; use2 keys to verify a post-win rematch). Scratch-copy mutations r1:6/7 detected; history-filter mutant exposed rounded-duration test gap. Strengthened exact three duration rows; rerun underway. Next: stable browser repeats, audits/effects, current checks, commit/draft PR. No code outside declared map/boss/StageLayout zone or unrelated repairs.

2026-11-01 16:57 +07 milestone: current browser repeat10 passes80/80 (4 cases ×2 sizes ×10); log browser-repeat10-r2.log. Earlier repeat74/80 remains preserved; condensed short-desktop spacing and explicit font readiness fixed it. Seven scratch mutants detected with green control; one-worker focused units61/61. Both original effects tools9/9 and guest/local-signed audits18/18 ran, with explicitly limited original-tool coverage. Full browser suites1280/1600 now running on owned free4370–4373. Unit repeat10 underway. HEAD still1fb25ed; implementation files unchanged since short-height CSS/font-ready e2e additions. Next: full results, current screenshots/audits, current command checks, source manifest and draft PR. BASE0 import/link/full-gate limitations remain; no merge/deploy.

2026-11-01 16:58 +07 milestone: committed implementation a49906e70befa6409127ca3832a3e714fc8a5858 (requested author/suffix),13 files. source-manifest.json stamps exact code/test hashes. Browser repeat80/80 source matches this commit. Full browser suites still running. Unit repeat runner was externally terminated143 after3 passing runs; not claimed complete; rerun planned. No other implementation changes. Next: finish evidence, push own branch/draft PR.

2026-11-01 16:59 +07 milestone: new/changed unit specs repeat10 complete140/140; runner log unit-repeat-summary.log. Source manifest still a49906e; full browser1280 currently running,1600 queued. Reports/evidence checkpoint prepared.
