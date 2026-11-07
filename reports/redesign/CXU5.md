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

Raw outputs are under [logs](../scorecard/cxu5/logs/). Commands are stamped in run-checks.mjs/logs/checks.json. The initial root typecheck, lint, unit suites, build, classic build, gen:deno drift and bundle secret scan passed before17:00 local. Current root test is FAIL as detailed below; it must not be described as green. The root unit run retains existing expected-fail/skipped tests; none were added or changed. A later focused run timed out once under concurrent load; the unchanged test passed61/61 with one worker (no timeout increase). Full1280 run completed257 passed/3 failed: inherited resize-burst and390/320 HUD heights (logs/full-e2e-1280.log). Full1600 completed257 passed/3 failed: classic smoke hardcodes1280 and the same390/320 HUD heights (logs/full-e2e-1600.log). All CXU5 browser cases pass in both full runs. These are known BASE0 failures; no baseline assertions changed. Refreshed typecheck/lint/build/classic-build/gen:deno/bundle all exit0. Refreshed root test exits1: five existing supabase/tests/v2/functions-forge.test.ts cases get null from the fixture claim helper before reading items. No backend file changed; isolated recheck reproduces5 failures/12 passes. Diagnostic clock proof passes: fixed fixture10:00UTC is before database default NOW(); unchanged SQL requires p_now at least10s after last_claim_at. Advancing only the diagnostic input11s beyond the snapshot succeeds. See baseline-clock-finding.md. This fresh failure is not labelled PASS. Current complete web suite passes1312/1312 across113 files (logs/web-test-current.log). All three new/changed unit specs pass14/14 in each of10 consecutive one-worker runs (140 tests), logs/unit-repeat-summary.log and unit-repeat-1..10.log.

Deno imports FAIL: inherited explicit-index import edges. Links FAIL: inherited docs/proposals/tbh-index-research path. No unrelated fix copied from BASE0. scripts/check-bundle.mjs is a secret scan, not a byte-budget checker; byte comparison is still pending.

Mutation evidence: scratch copies with a green control, seven behavior mutants detected in the second run (locked click, first/repeat reward inversion, wrong boss estimate, premature history, account reset leak, unbounded history, wrong-chapter history). The first run detected6/7; a rounded duration fixture let the wrong-chapter mutant survive. Strengthened exact row assertions, then detected it. Logs/mutations-r1 preserves the failed experiment; logs/mutations holds the green detection run. No mutants remain in source.

Round1: initial typecheck typo timeoutMs corrected to actual config maxMs. Browser selection exposed current-chapter auto-advance; preserve the fought selection. A rematch test needed2 legitimate keys because one is spent on victory; gate unchanged. Round2: chapter5/no-key sidebar exceeded720; condensed Map-only spacing. First repeat still exceeded720 after font load; retain bounds assertion, wait font readiness and add short-desktop Map spacing. Current repeat10:80/80 pass (4 cases ×2 sizes ×10), logs/browser-repeat10-r2.log. No retries, timeout raises, deleted assertions or skipped tests.

## Scope / integrity

Tier1: apps/web/src/map/ChapterMap.tsx; layout/boss/BossGatePanel.tsx; new layout/boss/BossMapScreen.tsx/.css/.test.tsx and mapDetails.ts/.test.ts; layout/bossPresentation.ts/.test.ts. Tier2: StageLayout.tsx only Map mount, selected chapter and account/mode session reset; e2e/ui/cxu5-map.spec.ts for real browser proof; docs/decisions and docs/design index; CXU5 report/evidence helpers. No shared ui primitives required from CXU4. Global shell, theme, HUD, art, rules, auth, backend, dependencies, contracts and .github untouched.

The prior compact selected-card API and desktopCSS remain intact; new path is opt-in. No existing assertion changed. No new strings required old-test changes. Temporary owned-port audit/effects copies only substitute ports4370–4373 and effects viewport; tracked tooling is unchanged. Screenshots from the existing key-hint test were restored after copying the relevant evidence into CXU5. UI differences outside Map remain OPEN for BASE0/CXU4; no claim of full G1–G7.

Pending: root SQL-fixture clock repair in the prerequisite, independent fresh-worktree gate including verify-pr (it creates another worktree, outside this builder's write allocation), baseline integration, byte budgets, all-screen strengthened effects, formal independent grading, production-config proof, merge/live checks. No user action needed for this builder.

Branch ai/codex-cxu5 · merge none · PR https://github.com/ntbaoheyhey/taskbar-hero/pull/249 · report reports/redesign/CXU5.md · IN-PROGRESS.

## Current command results (same implementation source a49906e)

| Command | Exit / observed tail |
| --- | --- |
| npx -y pnpm@10.28.0 typecheck | 0; apps/web typecheck: Done |
| npx -y pnpm@10.28.0 lint | 0; apps/web lint: Done |
| npx -y pnpm@10.28.0 test | 1; existing SQL forge fixture5 failed /536 passed /1 expected fail; stopped recursive run |
| npx -y pnpm@10.28.0 --filter @taskbar-hero/web test | 0;113 files,1312 tests passed |
| npx -y pnpm@10.28.0 build (empty backend env) | 0 |
| VITE_GAME_V2=0 npx -y pnpm@10.28.0 --filter @taskbar-hero/web build (empty backend env) | 0 |
| npx -y pnpm@10.28.0 gen:deno + git diff --exit-code -- supabase/functions | 0; no drift |
| node scripts/check-deno-imports.mjs | 1; inherited explicit-index edges |
| node scripts/check-links.mjs | 1; inherited missing tbh-index-research path |
| node scripts/check-bundle.mjs | 0; no secret-looking strings found (not a byte-budget check) |
| full Playwright, all projects, native1280/1600 | 257 passed/3 baseline failures each; no retries or assertion changes |
| cxu5-map.spec.ts --repeat-each=10 | 80/80 pass, bothsizes |
| changed unit specs repeated10 | 140/140 pass |
| owned-port ui-audit guest + local signed-in |18/18 each without findings after currentCSS |
| owned-port effects at1280 and1600 |9/9 each, limited original-tool coverage |
| keyboard-capture (Tab/arrows/Enter/Space only) |6/6 visits pass; ready/no-key/chapter5 at bothsizes |
| node --check evidence .mjs helpers | PASS |
| bash scripts/verify-pr.sh249 without comment | NOT VERIFIED: creates another worktree outside builder write allocation; coordinator gate |

Current screenshots: map-{1280,1600}.png and map-no-key-ch{1,5}-{1280,1600}.png. The earlier map-no-key-1280.png is retained as intermediate evidence. Existing reference-map-{1280,1600}.png were preserved from the pre-pause work. Nine PNGs total, each below200KB. Art bytes unchanged; no new art provenance required.

Branch ai/codex-cxu5 · merge none · draft PR https://github.com/ntbaoheyhey/taskbar-hero/pull/249 · report reports/redesign/CXU5.md · IN-PROGRESS.
