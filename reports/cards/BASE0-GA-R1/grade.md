# BASE0 independent formal grade A — round 1

STATUS: FAIL. **Final score 0/100 (A7)**; raw criterion sum 72.91666667/100. This is an independent pre-merge grade, not a merge or deployment certification.

Candidate `5db4949096e93eedeb98dff94ef1ec7019485f96`; base `1fb25edf4c54ada0d161e3c1dd16a4c4550aafba`; PR 246; detached worktree `/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/taskbar-hero`. Remote refs were independently read without moving either branch ([remote-heads.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/remote-heads.log:1)). Frozen pnpm install and every required fresh check ran locally. No source fixes, commits, pushes, merges, releases or subagents.

## Decisive blocker

The required 1280×720 repeat run finished **469 passed, 1 failed**, exit 1. On repeat index 5 (sixth execution), the original T1–T5 429 test reached line 81 after the phone-to-desktop resize and countdown, then could not find Forge's craft button within its unchanged 5000ms assertion timeout. [repeat-1280x720.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/repeat-1280x720.log:2469) and [errors-notice.spec.ts](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/taskbar-hero/apps/web/e2e/v2/errors-notice.spec.ts:81). This is a real failed required assertion, not a provider 429 or runner setup error. No retry was used to erase it. Root cause beyond the absent locator is NOT established. The required second viewport run remains independently counted below.

## Scores

| Criterion | Score | Evidence and deduction |
|---|---:|---|
| C1 correctness | 22.91666667/25 | 11/12 requirement rows below; no rounding up. T11 fails. |
| C2 green/stable checks | 0/20 | Any red required repeat makes C2 zero. [results.jsonl](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/results.jsonl:1); targeted originals [followup-results.jsonl](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/followup-results.jsonl:1). |
| C3 mutation strength | 10/10 | 14/14 independently selected mutants killed; 14 green controls. [review.json](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/review.json:1). |
| C4 design/docs match | 14/15 | −1 for the documented but still visible extra title/guidance context row relative to the reference. [baseline-hud-layout.md](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/taskbar-hero/docs/decisions/baseline-hud-layout.md:15); [comparison.json](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/reference/comparison.json:1). Other inherited screen layouts belong to explicitly separate UI cards; this is not a full redesign match claim. |
| C5 quality | 6/10 | −2 unused compact prop ([Hud.tsx](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/taskbar-hero/apps/web/src/shell/Hud.tsx:21) and [ScreenFrame.tsx](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/taskbar-hero/apps/web/src/shell/ScreenFrame.tsx:54)); −2 duplicated context declarations ([shell.css](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/taskbar-hero/apps/web/src/shell/shell.css:225) and [shell.css](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/taskbar-hero/apps/web/src/shell/shell.css:330)). No additional quality deduction: lint clean, helper exports typed, gzip growth below 5%. |
| C6 test integrity | 5/5 | No unjustified weakening: [integrity.json](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/integrity.json:1) and the integrity analysis below. |
| C7 report honesty | 10/10 | All 79 source hashes match reported files; authoritative report hash equals published ledger 5f85bbd. The verifier's actual 470/470 historical runs are not falsely relabeled; our new flake is an A7, not evidence their recorded run was invented. [report-provenance.json](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/report-provenance.json:1); [reuse-review.json](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/reuse-review.json:1). |
| C8 scope | 5/5 | All 79 files independently classified; every adjacent test/helper/document change has a valid prerequisite note. [integrity.json](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/integrity.json:1); [base0.md](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/taskbar-hero/reports/base0.md:29). No dependency, workflow, auth/backend source, contract, migration or flag-default change. |

A7 forces total to 0. C2 also misses its mandatory 20-point floor; C1 is below 23. No A1/A2/A3/A4/A5/A6/A8/A9 found. The complete raw verifier suite/build/G5/wrapper evidence is explicitly reused only for this identical HEAD, as allowed in the assignment.

## Requirement accounting

These 12 rows group the explicit prerequisite clauses, inherited test requirements, and added clock/artifact requirements; all clauses inside a row must pass. Merge/post-merge/live DONE is pending outside this pre-merge grading assignment and is not represented as achieved.

| ID | Requirement | Result | Evidence |
|---|---|---|---|
| T1 | Reproduce missing explicit-index baseline edges | PASS | [baseline-deno.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/baseline-deno.log:1) |
| T2 | Root/nested index, directory aliases and ordinary modules | PASS | [control-before-deno.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/control-before-deno.log:2) |
| T3 | Exclude test/fixture modules and preserve auth maps | PASS | [control-before-deno.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/control-before-deno.log:14) |
| T4 | Deterministic generation, repository imports and no generation drift | PASS | [deno.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/deno.log:5) |
| T5 | Six Deno kills and at least five meaningful overall mutants | PASS | [review.json](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/review.json:1) |
| T6 | Preboot scene regression; original redraw in both motion modes; exact resize dimensions | PASS | [control-after-scene.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/control-after-scene.log:6); [required-T-1280x720.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/required-T-1280x720.log:42); [required-T-1600x900.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/required-T-1600x900.log:42) |
| T7 | Unchanged original HUD cases at all existing sizes | PASS | [required-T-1280x720.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/required-T-1280x720.log:42); [required-T-1600x900.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/required-T-1600x900.log:42) |
| T8 | Complete original suite/default/classic builds and classic behavior | PASS | [unit.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/unit.log:57); REUSED [e2e-1280x720.log](/Users/bao/.codex/worktrees/mega-ledger/taskbar-hero/reports/cards/BASE0-COORDINATOR/full/e2e-1280x720.log:319); [e2e-1600x900.log](/Users/bao/.codex/worktrees/mega-ledger/taskbar-hero/reports/cards/BASE0-COORDINATOR/full/e2e-1600x900.log:319); [reuse-gates.json](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/reuse-gates.json:1) |
| T9 | All-screen UI audits/effects, matched reference screenshots, keyboard and contrast at mission sizes | PASS | [audit-guest.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/audit-guest.log:19); [audit-signed.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/audit-signed.log:45); [reference.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/reference.log:1); [keyboard.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/keyboard.log:1); [contrast.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/contrast.log:46) |
| T10 | Artifact writers retain assertions, default opt-out and report overrides | PASS | [control-after-artifact.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/control-after-artifact.log:1); [artifact-optin-bypassed.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/artifact-optin-bypassed.log:5); [source-final.json](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/source-final.json:1) |
| T11 | Every changed browser spec repeated ten times at both exact viewports with zero failures | FAIL | [repeat-1280x720.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/repeat-1280x720.log:2469); [results.jsonl](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/results.jsonl:1) |
| T12 | Seven inherited SQL suites, leap/year rollover and 2020/2040 early/replay guard regressions | PASS | [unit.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/unit.log:38); [control-after-clock.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/control-after-clock.log:6); [control-after-forge.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/control-after-forge.log:6) |

## Fresh commands and results

- `pnpm install --frozen-lockfile` — exit 0; 1280x720; [install.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/install.log:1).
- `pnpm typecheck` — exit 0; 1280x720; [typecheck.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/typecheck.log:1).
- `pnpm lint` — exit 0; 1280x720; [lint.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/lint.log:1).
- `pnpm test` — exit 0; 1280x720; [unit.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/unit.log:1).
- `pnpm gen:deno && git diff --exit-code -- supabase/functions && node scripts/check-deno-imports.mjs` — exit 0; 1280x720; [deno.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/deno.log:1).
- `pnpm test:e2e e2e/smoke.spec.ts e2e/ui/baseline-hud.spec.ts e2e/ui/f3-art.spec.ts e2e/ui/g1-perf.spec.ts e2e/ui/g3-combat.spec.ts e2e/v2/errors-notice.spec.ts --repeat-each=10 --workers=1` — exit 1; 1280x720; [repeat-1280x720.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/repeat-1280x720.log:1).
- `pnpm test:e2e e2e/smoke.spec.ts e2e/ui/baseline-hud.spec.ts e2e/ui/f3-art.spec.ts e2e/ui/g1-perf.spec.ts e2e/ui/g3-combat.spec.ts e2e/v2/errors-notice.spec.ts --repeat-each=10 --workers=1` — exit 0; 1600x900; [repeat-1600x900.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/repeat-1600x900.log:1).
- `pnpm test:e2e e2e/layout/stage-redraw.spec.ts e2e/layout/resize.spec.ts e2e/layout/resize-burst.spec.ts e2e/ui/u2-hud.spec.ts e2e/ui/u3-layout.spec.ts --workers=1` — exit 0; 1280x720; [required-T-1280x720.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/required-T-1280x720.log:1).
- `pnpm test:e2e e2e/layout/stage-redraw.spec.ts e2e/layout/resize.spec.ts e2e/layout/resize-burst.spec.ts e2e/ui/u2-hud.spec.ts e2e/ui/u3-layout.spec.ts --workers=1` — exit 0; 1600x900; [required-T-1600x900.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/required-T-1600x900.log:1).
- `node tools/.grade-a-audit.mjs /Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/audit-signed stocked --signed-in --strict` — exit 0; 1280x720; [audit-signed.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/audit-signed.log:1).
- `node tools/.grade-a-audit.mjs /Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/audit-guest bossReadyStrong --strict` — exit 0; both mission sizes / explicit tool viewport; [audit-guest.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/audit-guest.log:1).
- `node tools/.grade-a-effects.mjs /Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/effects-1280x720 --viewport=1280x720` — exit 0; both mission sizes / explicit tool viewport; [effects-1280x720.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/effects-1280x720.log:1).
- `node tools/.grade-a-effects.mjs /Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/effects-1600x900 --viewport=1600x900` — exit 0; both mission sizes / explicit tool viewport; [effects-1600x900.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/effects-1600x900.log:1).

Root units: 5 script tests; chain 32; auth 24; SQL 548; game-rules 366 plus 2 inherited expected failures and 11 inherited skips; api-contract 16; web 1306. The unchanged pre-existing skip/expected-failure inventory is not introduced by this candidate. [unit.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/unit.log:1). Standalone contrast: 10/10, [contrast.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/contrast.log:46).

## Reused exact-head gates

Explicitly REUSED after personally checking the metadata, raw result footers and source identity: default/classic/v2 builds, complete browser suites 264/264 at each size, bundle scan and same-day gzip comparison, PR wrapper 246, and production guest proof against observed live public config. [reuse-gates.json](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/reuse-gates.json:1); [reuse-review.json](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/reuse-review.json:1). Main links were personally reproduced at 1 broken path; candidate 0 ([main-links.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/main-links.log:3); [candidate-links.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/candidate-links.log:3)). Classic gzip 663477 → 664453 (+0.1471%); v2 678033 → 679002 (+0.1429%), [bundle-comparison.json](/Users/bao/.codex/worktrees/mega-ledger/taskbar-hero/reports/cards/BASE0-COORDINATOR/review/bundle-comparison.json:1). Reuse does not override the new failing repeat.

## Mutation review

No builder mutation scores were imported. Six generator mutants cover explicit targets, directory targets, test exclusion, order, fixture exclusion and auth separation. Remaining mutants break active-scene handling, next-day/hour clocks, microsecond rounding, HUD track width, guidance callback, screenshot opt-in and effects manifest coverage. All scratch mutations were restored.

| Mutant | Result | Assertion evidence |
|---|---|---|
| explicit-index-wrong-target | KILLED, exit 1 | [explicit-index-wrong-target.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/explicit-index-wrong-target.log:3) |
| directory-alias-wrong-target | KILLED, exit 1 | [directory-alias-wrong-target.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/directory-alias-wrong-target.log:9) |
| test-module-leak | KILLED, exit 1 | [test-module-leak.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/test-module-leak.log:15) |
| reverse-order | KILLED, exit 1 | [reverse-order.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/reverse-order.log:21) |
| fixture-directory-leak | KILLED, exit 1 | [fixture-directory-leak.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/fixture-directory-leak.log:15) |
| auth-map-contamination | KILLED, exit 1 | [auth-map-contamination.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/auth-map-contamination.log:27) |
| ready-scene-never-relayout | KILLED, exit 1 | [ready-scene-never-relayout.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/ready-scene-never-relayout.log:4) |
| clock-two-days | KILLED, exit 1 | [clock-two-days.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/clock-two-days.log:4) |
| clock-local-hour | KILLED, exit 1 | [clock-local-hour.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/clock-local-hour.log:4) |
| claim-rounds-down | KILLED, exit 1 | [claim-rounds-down.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/claim-rounds-down.log:4) |
| hud-xp-short-track | KILLED, exit 1 | [hud-xp-short-track.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/hud-xp-short-track.log:27) |
| hud-guidance-no-handler | KILLED, exit 1 | [hud-guidance-no-handler.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/hud-guidance-no-handler.log:25) |
| artifact-optin-bypassed | KILLED, exit 1 | [artifact-optin-bypassed.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/artifact-optin-bypassed.log:5) |
| effects-skips-first-screen | KILLED, exit 1 | [effects-skips-first-screen.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/effects-skips-first-screen.log:8) |

The rounding mutant's automatic assertion-text detector initially recorded false because the failing executed 2040 test raised a TypeError after SQL correctly rejected a too-early claim and returned null. Manual log review establishes a genuine behavioral test failure (18 other tests passed), not setup failure: [claim-rounds-down.log](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/mutations/claim-rounds-down.log:11). The artifact mutant uses an independent VM contract around the actual captureShot helper, testing mode 0 and mode 1; it is an assertion failure, not a browser failure. All 14 controls passed.

## Integrity, UI and provenance

The full diff was reviewed and saved at `/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/full.diff`. Every one of 79 changed-file hashes matches the reported source list. Exact initial smoke width 1280 changes to exact configured viewport width, retaining exact 800px resize; the known Deno expected failure becomes a mandatory normal assertion and its known-edge filter is removed. SQL fixtures advance injected time only; early, replay, expiry and daily guards stay unchanged. Screenshot/metric destination changes preserve assertions and thresholds. New geometry bounds are added assertions, not replacements. No new skips, retries, timeout increases, suppressions, any casts, golden changes or application debug logs were found. Historical diagnostic logs are distinguished from product changes. [integrity.json](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/integrity.json:1). Secret-pattern scan across changed tracked text and 327 evidence/report text files found no matches; no values were printed ([secret-scan.json](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/secret-scan.json:1)).

Guest and local signed-in audits each inspect 9 manifest screens at both sizes. Both effects runs cover every manifest screen in normal/reduced motion; keyboard walk checks all seven destinations with real Tab/Arrow/Enter/Escape, no programmatic focus fallback. Contrast covers all ten token pairs. Reference captures rerun corrected R2 framing and assert app bounds exactly 0,0,width,height for all 18 matched pairs. Eight local diagnostic PNGs are under 200KiB each; these are raw grader evidence, not an additional delivered product figure set. I personally viewed Home and Bag captures at both sizes; differences match the scoped recorded dispositions. The Home/Bag/etc redesign remains unapproved by this grade. [comparison.json](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/reference/comparison.json:1); [keyboard.json](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/keyboard/keyboard.json:1).

The first failed run's error-context.md was overwritten when the next required viewport reused the original Playwright output directory. Its full assertion stack, locator, timeout, repetition identity and exit remain in the preserved log. A watcher saves any subsequent contexts. Port-isolated UI and scratch mutation checks overlapped portions of the first repeat; each browser test runner used one worker, and candidate tests/source remained unmodified. No provider 429 occurred.

## G1–G7

- **G1:** FAIL: mandatory repeat flake; exact remote main and candidate unchanged.
- **G2:** PASS: personally rerun guest/signed audits, effects, reference comparisons, keyboard and contrast; scoped prerequisite, not full redesign.
- **G3:** PASS: own Deno/drift and same-day links; exact-head bundle evidence reused.
- **G4:** NOT_APPLICABLE: no migration or contract changes; SQL tests passed.
- **G5:** PASS_REUSED: identical-head public-config production guest proof for classic/v2 and both sizes.
- **G6:** REVIEW_COMPLETED_WITH_MINOR_FINDINGS: full source review, integrity and secrets checked; C5 deductions remain.
- **G7:** PUBLICATION_VERIFIED: authoritative verifier report at ledger 5f85bbd; this independent failing grade awaits parent publication.

## Required next action

Coordinator should diagnose and repair the Forge/control disappearance in the 429 countdown/resize path without weakening the test. Keep this failed round. Any new candidate requires its mandated fresh verification and independent grading. Resolve the two quality findings if revising source. Parent owns publication and merge decisions. Cleanup and unchanged source are recorded in [source-final.json](/Users/bao/.codex/worktrees/mega-base0-grade-a-5db4949/evidence/source-final.json:1); DONE is written only after owned processes exit.
