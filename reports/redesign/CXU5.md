STATUS: IN-PROGRESS

# CXU5 — Map and boss screen

Branch ai/codex-cxu5, base1fb25edf4c54ada0d161e3c1dd16a4c4550aafba. Builder implementation only; no formal grade, merge or deployment. BASE0 remains an unmerged prerequisite.

The full Map now shows five real chapter/backdrop nodes on a stepped path, reachable selection, current/cleared/locked states, and a right fight/rewards/history column. The fight card keeps the existing key, class, frontier and cooldown gate and existing request/replay pipeline. It displays an explicitly advisory boss-power estimate rather than mislabelling idle gate power. Rewards come from the selected real first/repeat chest. Past runs contain at most30 completed acknowledged session results, show the latest3 for the selected chapter, and clear on account/mode changes. Outcome concealment is preserved. The fought chapter stays selected after a first-clear win. No backend changes, flags, new assets, fonts or dependencies.

References: reports/ui-redesign/index.html (Map), BRIEF.md, PLAN.md, README.md; nav/screens.ts, theme.css, screen-manifest.json; #226/f4dec9c compact panel. Decision: [real map data](../../docs/decisions/cxu5-map-data.md). [UI difference table](../scorecard/cxu5/ui-diff.md). [Resume handoff](../scorecard/cxu5/resume-handoff.md).

## Acceptance evidence

| Case | Builder result | Evidence |
| --- | --- | --- |
| T1 selection updates fight card | PASS targeted units and browser at both sizes; repeat10 PASS80/80 | logs/units-current-r2.log, logs/browser-r5.log |
| T2 locked nodes cannot fight | PASS node pointer/Enter/Space refusal and direct locked gate tests | BossMapScreen.test.tsx; cxu5-map.spec.ts |
| T3 existing limits shown/enforced | PASS source-backed key quota, daily claim, win cost; no-key disabled; gate implementation unchanged | mapDetails tests, BossGatePanel/bossGate tests, browser no-key case |
| T4 replay and result | PASS existing five concealment scenarios and new history/replay path at both sizes | logs/browser-r2.log (existing13 cases passed; new2 fixture cases failed), logs/browser-r5.log |
| T5 no nested scroll | PASS targeted ready/no-key/chapter5 r5 at both sizes; initial repeat exposed font-sensitive short-screen clipping, corrected; repeat10 PASS80/80 after correction | logs/browser-r4.log, browser-r5.log, browser-repeat10.log; updated CSS/font-ready measurement |
| T6 effects/design | PASS existing effects9 checks at each size; guest and local signed-in audits18 screen/size checks each have0 findings. Full all-screen effects/G2 pending BASE0, whose tooling strengthens reached-screen proof | logs/audit.log, audit-signed.log, effects-1280.log, effects-1600.log; ui-diff.md |
| T7 unchanged art | PASS no diff in existing art/public paths; real backdrops and BossPortrait reused | git diff; browser five thumbnails and portrait check |

## Verification and rounds

Raw outputs are under [logs](../scorecard/cxu5/logs/). Commands are stamped in run-checks.mjs/logs/checks.json. Root typecheck, lint, unit suites, build, classic build, gen:deno drift and bundle secret scan passed on the recorded working version. The root unit run retains existing expected-fail/skipped tests; none were added or changed. A later focused run timed out once under concurrent load; the unchanged test passed61/61 with one worker (no timeout increase). Current whole checks and full browser runs remain to be stamped. All three new/changed unit specs pass14/14 in each of10 consecutive one-worker runs (140 tests), logs/unit-repeat-summary.log and unit-repeat-1..10.log.

Deno imports FAIL: inherited explicit-index import edges. Links FAIL: inherited docs/proposals/tbh-index-research path. No unrelated fix copied from BASE0. scripts/check-bundle.mjs is a secret scan, not a byte-budget checker; byte comparison is still pending.

Mutation evidence: scratch copies with a green control, seven behavior mutants detected in the second run (locked click, first/repeat reward inversion, wrong boss estimate, premature history, account reset leak, unbounded history, wrong-chapter history). The first run detected6/7; a rounded duration fixture let the wrong-chapter mutant survive. Strengthened exact row assertions, then detected it. Logs/mutations-r1 preserves the failed experiment; logs/mutations holds the green detection run. No mutants remain in source.

Round1: initial typecheck typo timeoutMs corrected to actual config maxMs. Browser selection exposed current-chapter auto-advance; preserve the fought selection. A rematch test needed2 legitimate keys because one is spent on victory; gate unchanged. Round2: chapter5/no-key sidebar exceeded720; condensed Map-only spacing. First repeat still exceeded720 after font load; retain bounds assertion, wait font readiness and add short-desktop Map spacing. Current repeat10:80/80 pass (4 cases ×2 sizes ×10), logs/browser-repeat10-r2.log. No retries, timeout raises, deleted assertions or skipped tests.

## Scope / integrity

Tier1: apps/web/src/map/ChapterMap.tsx; layout/boss/BossGatePanel.tsx; new layout/boss/BossMapScreen.tsx/.css/.test.tsx and mapDetails.ts/.test.ts; layout/bossPresentation.ts/.test.ts. Tier2: StageLayout.tsx only Map mount, selected chapter and account/mode session reset; e2e/ui/cxu5-map.spec.ts for real browser proof; docs/decisions and docs/design index; CXU5 report/evidence helpers. No shared ui primitives required from CXU4. Global shell, theme, HUD, art, rules, auth, backend, dependencies, contracts and .github untouched.

The prior compact selected-card API and desktopCSS remain intact; new path is opt-in. No existing assertion changed. No new strings required old-test changes. Temporary owned-port audit/effects copies only substitute ports4370–4373 and effects viewport; tracked tooling is unchanged. Screenshots from the existing key-hint test were restored after copying the relevant evidence into CXU5. UI differences outside Map remain OPEN for BASE0/CXU4; no claim of full G1–G7.

Pending: final current checks/full suites, independent fresh-worktree gate including verify-pr (it creates another worktree, outside this builder's write allocation), baseline integration, byte budgets, all-screen strengthened effects, formal independent grading, production-config proof, merge/live checks. No user action needed for this builder.

Branch ai/codex-cxu5 · merge none · PR pending · report reports/redesign/CXU5.md · IN-PROGRESS.
