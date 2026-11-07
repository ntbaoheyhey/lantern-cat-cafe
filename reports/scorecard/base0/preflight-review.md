# BASE0 independent preflight review — PR #246

Reviewed candidate `a40f7ff7a5b35411ab002eb778652cf9550975b7` against local `origin/main` `1fb25edf4c54ada0d161e3c1dd16a4c4550aafba`. This is a preflight review, not a formal grade. No numeric score is assigned.

**There are concrete issues to resolve before scoring:** the new 1600 viewport mode breaks classic smoke; the desktop gated HUD clips; the next-action control loses readable space; the restored XP track remains effectively a dot; and effects coverage can report Help visited when the app never leaves Hero.

Source paths below are relative to the reviewed worktree. `REVIEW` means `/tmp/tbh-mega-workers/base0-review`. `RAW` means `/Users/bao/.codex/worktrees/mega-deno0/taskbar-hero/reports/scorecard/base0/logs`.

I did not read builder reports, decisions/self-assessments or PR narrative. I used implementation/test diffs, surrounding source, the original reference HTML and permitted raw command logs. No source edits, commits, pushes, deployments, agents or CUA were used. Temporary scripts and evidence are outside the repo. The worktree remained clean.

## Actionable findings

### 1. P1 — Native 1600 mode deterministically fails the classic project

**Observed failure.** `apps/web/playwright.config.ts:69` now applies the selected viewport to classic, but `apps/web/e2e/smoke.spec.ts:20` still requires `box.width === 1280`. At `E2E_VIEWPORT=1600x900`, the actual width is correctly 1600 and the assertion fails before the rest of the classic smoke flow executes.

Reproduction from `apps/web`:

```sh
VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' SCREENSHOTS=0 \
E2E_PORT_CLASSIC=4470 E2E_PORT_V2=4471 E2E_PORT_SERVER=4472 E2E_PORT_API=4473 \
E2E_VIEWPORT=1600x900 pnpm test:e2e e2e/smoke.spec.ts --workers=1
```

My focused run included this spec, the new HUD spec and error-notice: **1 failed, 7 passed**. See `REVIEW/focused-native-1600.log:74`. The permitted full-suite log independently shows the same exact failure: `RAW/full-e2e-1600-r3.log:302`, followed by 253 passed and exit 1. Classic at 1280 passed on my run (`REVIEW/focused-native-1280.log`).

**Fix:** retain an exact width assertion against the requested initial viewport. Document the old fixed-1280 assumption → selected desktop viewport change. Do not loosen the matcher or exclude classic from 1600 verification. This is a test-harness integration defect; these observations do not show a broken classic renderer.

### 2. P2 — Gated desktop HUD is taller than its clipping header

**Observed new clipping at both required sizes.** `apps/web/src/shell/Hud.tsx:54` introduces the `.hud-bar__layout` wrapper and line 12 imports the primitive stylesheet. That activates `apps/web/src/layout/hud/hud.css:108`, which adds 24px bottom padding when the power hint exists. Desktop chips remain 34px high, making the status region 58px tall inside the fixed 52px `.v2-topbar` (`apps/web/src/layout/layout.css:34`, overflow hidden at line 50).

At both 1280×720 and 1600×900:

- Header: y=0, height=52.
- Cat status region: y=-3.5, height=58, bottom=54.5.
- Progress/currency/power chips start at y=-3.5, clipping their tops.
- “Needs about 96 power: upgrade your weapon” ends at y=54.5, clipping the text below the header.

Reproduce using the existing gated fixture construction in `apps/web/e2e/ui/u2-hud.spec.ts:14`: seed `bossReadyWeak` for chapter 2, then copy `round`, `kills` and `bestStage` from `midGame` into it. Open any rail screen at either desktop size. My `REVIEW/probe.mjs` does this and visits all nine manifest destinations. See `REVIEW/hud-evidence.json`, `REVIEW/gated-1280.png`, `REVIEW/gated-1600.png` and `REVIEW/compare-main.json`. A read-only Vite overlay of the four original UI source files confirmed main's hint was inline at y=16.5–34.5; this particular vertical clipping is introduced by the new wrapper/style combination.

**Fix:** explicitly fit the gated status inside the desktop header, or allocate a real separate status row with matching shell sizing. Add gated coverage that checks the header/viewport and every clipping ancestor, including the hint text.

**Why current tests miss it:** `apps/web/e2e/ui/baseline-hud.spec.ts:24` checks only the inner Cat status region. Lines 29–35 compare chips against that same overflowing region, omit `.hud-power-hint`, and check horizontal scroll width only. A chip can be inside that region and still be clipped by the header. The existing layout audit also reports zero findings for this reproduction because it intentionally intersects boxes with clipping ancestors (`apps/web/tools/layout-findings.mjs:15`); it is not a text-clipping test.

### 3. P2 — Next-action text shrinks to two letters at 1280; error states can collapse it entirely

**Observed readability regression.** The new single-row primitive layout at `apps/web/src/shell/Hud.tsx:54` activates the desktop rules in `apps/web/src/layout/layout.css:61`, keeping the status group intrinsically sized and non-shrinking. Guidance at `Hud.tsx:117` takes the remaining width.

With the existing `midGame`, chapter 2 fixture and loaded fonts at 1280×720, the next-action button's text area shrinks from **83.22px on main to 18.63px on BASE0**, against 267px of text. Visually only “Ne” remains after the separate NEXT label. This is the same button that should say “Next: Explore the chapter and challenge its boss.” At 1600 it is 203px and still truncates, but that truncation already existed on main.

Reproduction: run `REVIEW/server.mjs`, then `REVIEW/probe.mjs`; inspect `REVIEW/midGame-1280.png`. `REVIEW/compare-main.mjs` and `compare-main.json` preserve the main/candidate measurements. The main comparison uses `git show origin/main:<file>` through a temporary Vite load hook, without changing disk source.

The production preview with the existing loopback `stocked` fixture also collapses the button to zero width at 1280 in 429/503/offline states when external fonts are blocked, as they are in the existing server fixture. The NEXT label remains, but the action text disappears. See `REVIEW/error-503-1280.png` and `errors-keyboard.mjs` (zero-width nodes are omitted from that script's geometry list). The extra `Sync error` width aggravates the available-space problem. This error/fallback-font observation is **not claimed as independently proven new versus main**; the normal loaded-font 83px→19px regression is proven.

**Fix:** budget usable width for actionable guidance at 1280 with normal, offline and error status labels; allow noninteractive status content to reflow or compact. Test the action's own visible text/geometry, not merely the Cat status chips. Preserve its accessible name and keyboard action.

### 4. P2 — XP styling is restored, but the track is only 8×8px on desktop

**Observed unresolved design/readability gap, not a claim that main's missing bar was better.** With the stylesheet imported at `apps/web/src/shell/Hud.tsx:12`, `LevelXpBar` is now visible, but its track is **8px wide at both 1280 and 1600**. Its two 2px borders leave only four pixels of interior horizontal range. The approved reference has a **158.55px-wide, 10px-high green track** at both sizes (`reports/ui-redesign/index.html:50`, shell markup at line 261).

Cause: the existing desktop `flex: 0 0 auto; min-width: max-content` rule (`apps/web/src/layout/layout.css:80`) combines with the newly activated `auto minmax(8px, 1fr) auto` grid (`apps/web/src/layout/hud/hud.css:39`). The new browser test at `apps/web/e2e/ui/baseline-hud.spec.ts:27` accepts precisely this minimum. A visible 8px dot proves the old zero-height defect was improved; it does not establish a readable progress bar or a reference match.

Reproduction/evidence: `REVIEW/midGame-1280.png`, `midGame-1600.png`, `reference-1280.png`, `reference-1600.png`, and `hud-evidence.json`. All nine manifest screens share this result. Main's track had zero height in the same comparison.

**Fix:** allocate meaningful track width in the desktop HUD and check a nonzero XP fraction so a visible changing fill is demonstrated. Resolve the green-reference versus accent-fill difference explicitly in the UI comparison rather than counting the 8px minimum as design acceptance.

### 5. P2 — The new all-manifest effects check records attempted clicks, not reached screens

**Observed surviving mutation, not speculation.** At `apps/web/tools/effects-test.mjs:123`, the runner immediately pushes `screen.id` after clicking. Lines 136–138 compare that self-generated list to the same manifest. There is no assertion that the active screen changed, the destination is selected, or the manifest's required content is visible.

I copied the runner to `/tmp`, changing only import resolution/output plumbing and its port. In a second copy I installed a browser capture listener that stops clicks on `nav-help`. The application remained on Hero in both motion modes:

```text
MUTANT EVIDENCE: {"expected":"help","actual":"hero","helpSelected":"false"}
MUTANT EVIDENCE: {"expected":"help","actual":"hero","helpSelected":"false"}
PASS [coverage] every manifest screen visited in both motion modes ... hero,help
10 checks, 0 FAIL at 1600x900
```

Evidence: `REVIEW/effects-inert-help.log:8`, `effects-inert-help.mjs`; corresponding unmodified control: `REVIEW/effects-control.log`, also 10 checks, zero failures. No application source was mutated. The real Help navigation worked during my keyboard walk.

**Fix:** before recording a visit, assert active screen/selected tab and visible `manifest.required` content, including Forge subnavigation. The blocked-Help mutation must fail the tool. Keep the existing timing and animation assertions intact.

## Reference and accessibility review

I opened the original reference through Playwright at its native 1280×720 and 1600×900 app dimensions and switched Stage, Bag, Map, Forge, Market, Character, Help, States, Landing and Class. I visited every implemented manifest destination with normal and gated fixtures at both sizes. The shared HUD results above apply throughout.

| Aspect | Observed comparison | Attribution |
| --- | --- | --- |
| Rail | Seven destinations in the approved order | Preserved; keyboard arrows reached all seven with visible 2px focus outlines |
| HUD order | Reference: currencies → XP → right-side power/wallet. Candidate: title → XP → chapter progress → currencies → power → guidance → status/wallet | Inherited arrangement, still a visible reference difference; not a new BASE0 redesign regression |
| Header height | Reference 56px; candidate 52px | Inherited sizing; newly activated gated content no longer fits it |
| XP | Reference about 159×10px, green; candidate 8×8px, accent fill | Incomplete repair/reference mismatch; finding 4 |
| Guidance | Candidate's additional action loses most readable text at 1280 | New normal-state regression; finding 3 |
| Gated state | Top chip frames and hint descenders clipped | New regression; finding 2 |
| Main content | Current Home uses hero/goal left and loot right; reference puts hero/goal/loot right | Existing out-of-zone difference, not attributed to BASE0; real art is not counted as a mismatch |

Normal/gated scripted navigation produced no page or console errors. The layout heuristic returned no document scroll, horizontal overflow or overlap, including cases visibly clipped as documented above. This distinction matters when interpreting green audit logs.

I separately exercised loopback production 429, 503 and offline states at both desktop sizes, with keyboard navigation across all seven rail destinations before each error. Correct notices and sync labels appeared; error screenshots at both sizes were inspected. Existing native error-notice tests passed all five cases, including wrong-wallet prevention and case-insensitive wallet equality. Expected injected 429/503 resource errors and the deliberately blocked Google-font request are retained in `REVIEW/errors-keyboard.json`; they are not represented as new unexpected application errors. See `apps/web/e2e/support/server-fixture.ts:22` for the existing localhost-only request policy.

The eight existing theme contrast tests passed. No token pair was added by this diff. These tests are limited to their listed pairs; this review does not claim an exhaustive axe audit or full keyboard walkthrough of every screen's unrelated controls. HUD progress semantics, currency labels and sync live regions remain in source. Reduced-motion XP transitions were zero in the new native HUD tests. The control effects run reported no transform animations in reduced motion.

## Integrity, correctness and default safety

- **No existing assertion, retry count, timeout or golden was weakened in the reviewed source/test diff.** No test was deleted, skipped, quarantined or made exclusive. The added integrity-pattern hits are logging in a screenshot test/tool/generator, not source debug logging or suppressions. See `REVIEW/integrity.json`.
- `supabase/tests/src/deno-imports.test.ts:13` changes `it.fails` to normal `it`, retaining the original stderr/status/output assertions. Line 38 removes the formerly tolerated explicit-index errors. This intentionally strengthens the regression and is justified by the alias repair.
- All 16 game-function `deno.json` changes add the same 11 explicit-index aliases. Auth mappings/dependency versions are unchanged. My five generator tests passed; the static import guard reports all 18 functions clean. Scratch regeneration of all 18 maps was byte-identical, without writing repository files.
- The StageScene guard at `apps/web/src/game/stage/StageScene.ts:324` prevents accessing the scale plugin before activation. Its new test checks that preboot relayout does not throw and CREATE lays out the queued state using width 453. The focused StageScene/Hud/HudBar run passed 17 tests. I found no further concrete defect in this small guard; this is not a substitute for the pending formal resize/repeat gate.
- The F3 screenshot-size assertion is still `< 200 * 1024`; it now measures the returned PNG bytes instead of a written file. Perf metrics default to `test.info().outputPath`; screenshots require `SCREENSHOTS=1`. Assertions and timing limits are retained. My native runs with screenshots disabled left `git status --short reports/` empty.
- No migration, API contract, auth/SIWE logic, wallet call, gameplay number, dependency version, production flag default or `.github` file changes. `apps/web/src/layout/flag.ts:3` still requires literal `VITE_GAME_V2 === '1'`; default remains classic. The classic 1280 guest smoke passed. No new backend-dependent behavior was identified. Live-backend equivalence was not exercised in this isolated preflight.
- All four candidate commits have the requested author/email and `[skip ci]` suffix. This checks local history, not remote merge/push actions.
- Targeted secret-pattern scans of implementation diff, permitted raw logs and reviewer artifacts found no credential-like payload. A match in the reviewer transcript was the scanner's literal private-key regex, not a key. Builder report bodies/full history were intentionally outside this review's evidence access, so this is not a whole-repository secret certification.

## Report-evidence risks for the scoring round

These are evidence limitations, not accusations about unread builder claims.

1. **Full 1600 is red:** `RAW/full-e2e-1600-r3.log:320` reports 1 failed/253 passed. My focused reproduction matches it. Do not roll this into “both desktop suites green.”
2. **Changed-spec repeats are now complete:** both `RAW/changed-specs-repeat10.log:2325` and `RAW/changed-specs-repeat10-1600.log:2325` report 360 passed, exit 0. The latter finished during this review. Earlier failing runs are historical evidence, not automatically current flakes.
3. **Viewport labels are not proof every check ran at that size:** `errors-notice.spec.ts:20` still resizes to its explicitly requested screenshot sizes even when screenshots are disabled, and lines 73/149 reset to 1280. F3 and G3 also have explicit viewport matrices; G1 deliberately resizes. Native selection changes the starting viewport, not these later sizes. State which assertions/screens actually cover 1600 before claiming full affected-state coverage. My separate error probe keeps each desktop size fixed.
4. **The permitted 1600 effects log is from the older nine-check form:** `RAW/effects-1600.log:14` lacks the coverage check. `RAW/effects-control-1280.log:11` has it. My current-source temporary-port control independently passed all ten at 1600, but finding 5 shows the coverage assertion itself is insufficient.
5. **Green layout audits do not establish unclipped content:** both supplied audit logs say 18 screens, zero findings (`RAW/ui-audit.log:23`, `RAW/ui-audit-signed-in.log:48`), while my gated reproduction is visibly clipped and the same heuristic still returns zero. Include gated/ancestor-clipping evidence.
6. **Links command is not literally green:** `RAW/full-r3/links.log:5` reports one missing pre-existing research path and exits 1. The file is not touched by this diff. The rubric permits no regression against the same-day main count; that baseline comparison is needed, not a claim of exit 0.
7. **Bundle log proves only scanning:** `RAW/full-r3/bundle.log:3` reports 25 text files scanned/no secret-looking strings, without size totals or comparison to main. Build logs contain chunk sizes; preserve a concrete baseline comparison for budget/growth claims.
8. **Exact-commit and environment provenance:** logs give command/CWD but generally do not print HEAD or the E2E environment. Preserve candidate hash, starting viewport and unique ports with each formal result, particularly after another fix. No `verify-pr` raw output was present in the permitted log inventory I reviewed; its gate remains outside this preflight.

I did not perform report/ledger/PR-body claim reconciliation because doing so would violate the explicit narrative restriction. No report-honesty grade or false-PASS allegation is made.

## Focused reviewer checks

| Check | Result / evidence |
| --- | --- |
| `CI=true pnpm install --frozen-lockfile` | Completed with pnpm 10.28.0, Node 24.22.2; tracked files unchanged |
| `node --test scripts/gen-deno-json.test.mjs` | 5 passed; `REVIEW/deno-generator.log` |
| `node scripts/check-deno-imports.mjs` | 18 functions clean; `REVIEW/deno-imports.log` |
| Full map regeneration in a temporary tree | All 18 byte-identical; CLI output preserved in reviewer transcript |
| Focused StageScene, shell Hud, primitive HudBar Vitest | 17 passed; `REVIEW/focused-units.log` |
| Existing theme contrast Vitest | 8 passed; `REVIEW/contrast.log` |
| Native 1600: classic smoke + new HUD + error-notice | 1 failed / 7 passed; `REVIEW/focused-native-1600.log` |
| Native 1280: classic smoke + existing u3 layout | 6 passed, including existing 1600/1280/390/320 layout cases; `REVIEW/focused-native-1280.log` |
| Normal/gated HUD, all manifest destinations, both desktops | Observations in `REVIEW/probe.json`; findings 2–4 |
| Original-reference/native-size and main-overlay comparison | `REVIEW/reference-*.png`, `REVIEW/compare-main.json` |
| Loopback production error states and rail keyboard navigation | Six state/viewport cases; `REVIEW/errors-keyboard.json` |
| Effects control / inert-Help mutation at 1600 | Both exit 0; mutation survives; `REVIEW/effects-control.log`, `REVIEW/effects-inert-help.log` |

No full suite or full repeat suite was rerun by this reviewer. The first custom error probe started before its temporary API listener was ready and got ECONNREFUSED; after listener readiness it completed all six cases. This was reviewer setup, not a candidate failure. An initial focused Vitest command included an incorrect contrast-test path and ran the other three files; the actual `src/theme.contrast.test.ts` was then run separately and passed.

All reviewer PNGs are below 200KB (12 images). Temporary servers on 4470/4471/4472/4473 were stopped after checks. The final working tree is clean.

## Changed-file scope inventory

Tier 1 below means directly within the BASE0 blockers/harness scope described in this request. Tier 2 means adjacent verification/documentation/evidence support. No Tier 3 source change was identified. Narrative files are listed from Git metadata only; their contents/justifications were intentionally not read. This inventory is therefore not a certification that builder Tier 2 notes are complete.

| Changed file | Tier / reason |
| --- | --- |
| `apps/web/e2e/ui/baseline-hud.spec.ts` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `apps/web/e2e/ui/f3-art.spec.ts` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `apps/web/e2e/ui/g1-perf.spec.ts` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `apps/web/e2e/ui/g3-combat.spec.ts` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `apps/web/e2e/v2/errors-notice.spec.ts` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `apps/web/playwright.config.ts` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `apps/web/src/game/stage/StageScene.test.ts` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `apps/web/src/game/stage/StageScene.ts` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `apps/web/src/shell/Hud.tsx` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `apps/web/src/shell/ScreenFrame.tsx` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `apps/web/src/shell/shell.css` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `apps/web/tools/effects-test.mjs` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `docs/decisions/mission-baseline-compatibility.md` | Tier 2 — decision/test documentation; content not read |
| `docs/design/decisions.md` | Tier 2 — decision/test documentation; content not read |
| `docs/test-stability.md` | Tier 2 — decision/test documentation; content not read |
| `package.json` | Tier 2 — wires generator tests into ordinary test command; no dependency change |
| `reports/base0.md` | Tier 2 — evidence/report artifact; only permitted external BASE0 raw logs read |
| `reports/scorecard/base0/logs-before-geometry.json` | Tier 2 — evidence/report artifact; only permitted external BASE0 raw logs read |
| `reports/scorecard/base0/logs/focused-browser-r2.log` | Tier 2 — evidence/report artifact; only permitted external BASE0 raw logs read |
| `reports/scorecard/base0/logs/focused-browser-r3.log` | Tier 2 — evidence/report artifact; only permitted external BASE0 raw logs read |
| `reports/scorecard/base0/logs/focused-browser-r4.log` | Tier 2 — evidence/report artifact; only permitted external BASE0 raw logs read |
| `reports/scorecard/base0/logs/focused-browser.log` | Tier 2 — evidence/report artifact; only permitted external BASE0 raw logs read |
| `reports/scorecard/base0/logs/results.jsonl` | Tier 2 — evidence/report artifact; only permitted external BASE0 raw logs read |
| `reports/scorecard/base0/screens/after-1280.png` | Tier 2 — evidence/report artifact; only permitted external BASE0 raw logs read |
| `reports/scorecard/base0/screens/before-1280.png` | Tier 2 — evidence/report artifact; only permitted external BASE0 raw logs read |
| `reports/scorecard/base0/screens/before-1600.png` | Tier 2 — evidence/report artifact; only permitted external BASE0 raw logs read |
| `reports/scorecard/deno0/logs/generator-tests.log` | Tier 2 — evidence/report artifact; only permitted external BASE0 raw logs read |
| `reports/scorecard/deno0/logs/import-guard.log` | Tier 2 — evidence/report artifact; only permitted external BASE0 raw logs read |
| `reports/scorecard/deno0/logs/mutations.json` | Tier 2 — evidence/report artifact; only permitted external BASE0 raw logs read |
| `reports/scorecard/deno0/logs/mutations.log` | Tier 2 — evidence/report artifact; only permitted external BASE0 raw logs read |
| `reports/scorecard/deno0/logs/results.jsonl` | Tier 2 — evidence/report artifact; only permitted external BASE0 raw logs read |
| `scripts/gen-deno-json.mjs` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `scripts/gen-deno-json.test.mjs` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `supabase/functions/boss-fight/deno.json` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `supabase/functions/equip/deno.json` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `supabase/functions/game-state/deno.json` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `supabase/functions/idle-claim/deno.json` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `supabase/functions/relic-forge/deno.json` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `supabase/functions/relic-mint-report/deno.json` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `supabase/functions/upgrade/deno.json` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `supabase/functions/v2-boss-fight/deno.json` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `supabase/functions/v2-choose-class/deno.json` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `supabase/functions/v2-claim/deno.json` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `supabase/functions/v2-craft/deno.json` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `supabase/functions/v2-equip/deno.json` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `supabase/functions/v2-lock/deno.json` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `supabase/functions/v2-relic-forge/deno.json` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `supabase/functions/v2-salvage/deno.json` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `supabase/functions/v2-state/deno.json` | Tier 1 — stated BASE0 implementation or focused regression/verification harness |
| `supabase/tests/src/deno-imports.test.ts` | Tier 2 — activates and strengthens import regression guard |
