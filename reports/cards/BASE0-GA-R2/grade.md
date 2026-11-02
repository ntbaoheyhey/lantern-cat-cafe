STATUS: DONE — PASS, independent premerge grade only

# BASE0 grade A, round2

Candidate **280ff4bed495fd28bd489eb5f2dcfd1910f21fc0**, base **1fb25edf4c54ada0d161e3c1dd16a4c4550aafba**, branch ai/codex-mega-deno0, draft PR246. Independent grader /root/base0_grade_a_r2 built/fixed none of this item, used no other grader report/score, and made no product commit, push, merge, GitHub comment or live write. Fresh detached candidate and isolated scratch checkouts are both restored clean; all owned4420–4424listeners stopped (cleanup.json).

**Raw/final total: 97.642857/100. C1–C8:25,20,9.642857,13,10,5,10,5. Auto-fails:none.** All floors pass; no rounding up is needed. This is one independent grade, not the two-grade gate or mission merge completion.

## Scoring with evidence

| Criterion | Score | Anchor application | Evidence |
| --- | --- | --- | --- |
| C1 | 25/25 | 25 × 23/23 technical T/DONE acceptance lines; mapped below. No safety exclusions or unverified technical line. Procedural merge/live completion is separately pending. | T-line table; results.jsonl; supplemental-results.jsonl; reference-comparison.json; mutations/adjudication.json |
| C2 | 20/20 | All required gates green with permitted exact-head raw reuse; personally rerun typecheck/lint/full root units, all seven changed/new browser specs plus five shared consumers ten times at each size, original HUD/layout and direct UI gates. No repeat failure or retry. Optional all-reference-PNG diagnostic is grader instrumentation, corrected without changing product/tests or budget; fully disclosed. | logs/typecheck.log (exit0); logs/lint.log (exit0); logs/unit.log:58; logs/repeat-1280x720.log:2488; logs/repeat-1600x900.log:2488; logs/original-hud-layout.log:42; reuse-validated.json; logs/reference-required.log:1; diagnostics.md |
| C3 | 9.642857/10 | 10 × 27/28. Ten green control runs. One mis-targeted rail-colour survivor retained in denominator; actual XP rule subsequently killed. Five artifact mutants correctly have browserexit0 and independent contractexit1. No setup, syntax, port or termination failure counted as a kill. | mutations/adjudication.json (all commands/logline anchors); mutations/hud-green-xp.diff:6; mutations/hud-xp-color-exact-selector.log:45 |
| C4 | 13/15 | Start15; -1 documented extra status/context-row mismatch, -1 repeated NEXT/Next cosmetic wording. All other visible differences explicitly scoped to unchanged baseline/future user-approved cards, not misrepresented as redesign fidelity. No OPEN BASE0 row. | ui-diff.md; reference-comparison.json; local-capture-inventory.json; logs/reference-required.log:1; accessibility/keyboard.json; logs/contrast.log:6 |
| C5 | 10/10 | No new unjustified duplicated/dead code, suppression/any, untyped API, hardcoded token substitute, unclear name or lint warning. Compact API/duplicate narrow declarations removed. Gzip increases0.14424%classic and0.14055%v2 against same-day exact main. | source-review.md; source.diff; independent-review.json; bundle-links-review.json; logs/lint.log (exit0) |
| C6 | 5/5 | No unjustified test-integrity hit. Exact smoke1280→configured viewport preserves800resize; Deno expected-failure removal strengthens guard; SQL clocks preserve guards; new geometry/membership assertions supplement existing assertions. No added skip/retry/timeout/golden or assertion weakening. | independent-review.json; source-review.md; source.diff; logs/unit.log (baseline expected/skipped cases unchanged) |
| C7 | 10/10 | No false PASS or unsupported current claim found. Original failures and incomplete historic workflow statuses are retained; coordinator verification is labeled non-independent. Living REPORT was subsequently published, while raw evidence hashes remain unchanged. Own survivor and optional artifact diagnostic are disclosed. | source-review.md; publication-check.json; reuse-validated.json; diagnostics.md; mutations/adjudication.json; ../BASE0-VERIFY-R2/REPORT.md |
| C8 | 5/5 | All82files independently inventoried with tier/reason. All adjacent harness/lifecycle/fixture/docs/report changes have valid Tier2 explanations in product report/decisions. No secret, dependency/version, workflow, contract, migration, backend/auth-source or default-flag change. | independent-review.json (82file inventory); generated-map-review.json; source-review.md; source.diff; reports/base0.md scope and repair notes |

## Technical T/DONE acceptance

The supplied brief has prose acceptance rather than numbered Tcases; the following23lines map its technical obligations without dropping any. C1=25×23/23=25. Every line has personal observed execution/source evidence; only the explicitly permitted exact-head whole-suite/build/wrapper/G5 evidence is reused and labeled. Downstream procedural lines (two independent approvals, merge, post-merge main/live) remain pending by design of the premerge grading sequence and are not falsely marked complete or safety-excluded.

| ID | Acceptance | Outcome | Observed evidence |
| --- | --- | --- | --- |
| D1 | Reproduce missing explicit-index edges against real repository guard | PASS | mutations/deno-real-explicit-edges.log:3 (80edges); mutations/control-deno-real-edges.log (18clean) |
| D2 | Root/nested explicit-index keys, directory aliases and ordinary modules | PASS | logs/unit.log:6; mutations/control-deno.log; scripts/gen-deno-json.test.mjs:23 |
| D3 | Test/fixture exclusions and deterministic generation | PASS | logs/unit.log:8; mutations/test-exclusion.log, fixture-exclusion.log, stable-order.log |
| D4 | Auth distinctions preserved; generated maps additive and stable | PASS | logs/unit.log:10; generated-map-review.json (16maps,11keys each, no modified/removed entries); mutations/auth-separation.log |
| D5 | Actual Deno guard clean and no generated drift | PASS | logs/deno.log:6-9; pnpm gen:deno && git diff --exit-code -- supabase/functions && node scripts/check-deno-imports.mjs |
| D6 | At least six meaningful generator mutations rejected | PASS | mutations/unit-adjudication.json: six generator kills with green control; real-edge mutation adds integration proof |
| B1 | Preboot relayout waits for active scene and uses latest CREATE size | PASS | mutations/control-scene.log; mutations/preboot-relayout.log; StageScene.test.ts:46 |
| B2 | Original stage-redraw normal/reduced and exact resize behavior at both mission sizes | PASS | logs/repeat-1280x720.log:2488; logs/repeat-1600x900.log:2488 (original resize/redraw/burst specs included) |
| B3 | Unchanged HUD/layout limits at every existing size, including320/390/1280/1600 | PASS | logs/original-hud-layout.log:42; logs/original-hud-layout.log:1 (u2-hud/u3-layout); no assertion changes |
| B4 | Readable status, nonzero proportional XP, gated warning and complete context/action | PASS | logs/repeat-1280x720.log:2488; logs/repeat-1600x900.log:2488; baseline-hud.spec.ts:13-149; mutations/hud-shared-style.log, hud-warning-container.log, hud-xp-color-exact-selector.log |
| B5 | Fallback fonts, offline/429/503 status, accessible guidance and keyboard callback | PASS | logs/repeat-1280x720.log:2488; logs/repeat-1600x900.log:2488; baseline-hud.spec.ts:153-209; mutations/hud-guidance-action.log |
| L1 | Game-booted but SceneManager-unready teardown waits; initialized hidden-tab destruction still completes | PASS | mutations/control-canvas.log; mutations/premature-destruction.log:10; mutations/pending-destruction.log; StageCanvas.test.ts:28-72 |
| L2 | Browser clock tolerates deterministic interleaving, remains frozen and advances exactly | PASS | logs/repeat-1280x720.log:2488; logs/repeat-1600x900.log:2488; mutations/clock-interleaving.log:45; e2e/server/fixture-clock.spec.ts:3 |
| S1 | SQL fixtures track next database UTC day10:00, including leap/year boundaries | PASS | mutations/control-date.log; mutations/next-db-day.log; mutations/db-anchor-hour.log; logs/unit.log (548SQLtests) |
| S2 | Insertion clock rounds micros upward and respects snapshot+10s; early/stale claims remain rejected | PASS | mutations/control-insert.log; mutations/claim-micros-rounding.log; mutations/claim-clock-max.log; supabase/tests/v2/functions-forge.test.ts:42-74 |
| H1 | Ordinary screenshot runs preserve historical reports; F3buffer budget unchanged | PASS | mutations/control-browser.log (8pass, no requested artifacts); mutations/f3-opt-in.log and error-opt-in.log (browser0/contract1); cleanup.json |
| H2 | Explicit SCREENSHOTS/SCREENSHOT_DIR still write bounded PNGs | PASS | mutations/control-explicit-artifacts.log (5pass,3PNGs<200KiB); mutations/browser-results.json |
| H3 | F3/G1/G3 metrics default to Playwright output and honor REPORT_DIR | PASS | mutations/control-explicit-artifacts.log; mutations/browser-results.json lists bake-metrics.json/metrics.json/frame-metrics.json; three routing mutants browser0/contract1 |
| E1 | Effects reaches actual selected content for every manifest screen in both motion modes | PASS | effects-1280x720/summary.json; effects-1600x900/summary.json (10PASS each); mutations/effects-reached-screen.log (Help selection rejected) |
| U1 | All-screen guest and isolated mock signed-in audits at both sizes | PASS | logs/audit-guest.log and logs/audit-signed-in.log:18visits each,0findings; audit-*/findings.json |
| U2 | Matched app/reference, documented differences, keyboard/focus and contrast | PASS | logs/reference-required.log:1; reference-comparison.json (18pairs); ui-diff.md; accessibility/keyboard.json (7destinations eachsize); logs/contrast.log:6 |
| V1 | Complete required verification plus all changed-spec repeats and classic behavior | PASS | results.jsonl; logs/unit.log:58; logs/repeat-1280x720.log:2488; logs/repeat-1600x900.log:2488; reuse-validated.json explicitly validates exact-head full265/265eachsize and builds |
| V2 | Viewport-aware smoke/config preserve exact dimensions without raised thresholds | PASS | mutations/control-extra.log (3pass at1600); mutations/smoke-hardcoded-width.log:45; mutations/configured-viewport-ignored.log:45; both repeat logs |

## Required verification and reuse disclosure

Personal pnpm10.28.0 frozen install, typecheck, lint, complete root tests and Deno gen/drift/guard all exit0. Root includes5generator tests,548SQLtests and1308webtests; unchanged game-rules baseline has2expected-fail and11skipped cases, no new skips. The12affected specs (all7changed/new plus5shared consumers) repeat10 at each size with --workers=1:700/700 each, no retry or failure. Original u2/u3HUD/layout16/16, contrast10/10, guest18/18visits and mock-signed18/18visits with no findings, effects10/10eachsize, keyboard7destinations eachsize, and matched comparison18pairs all pass. Commands/head/exit/viewport live in results.jsonl, supplemental-results.jsonl and each raw log.

Permitted exact-head reuse: BASE0-VERIFY-R2/full/results.jsonl and raw logs were checked for280ff4bed495fd28bd489eb5f2dcfd1910f21fc0, exit0 and unchanged head; full browser265/265eachsize, default/classic/v2builds, bundle scan/inventories and links. Wrapper246 exit0 is in wrapper-result.json/checks/verify-pr-246.log; production-public-config build+preview has4guest visits with no error, blocked write or failure. Public config values are not copied. Same-day main1fb25edbundle/link measurements are independently reconciled in bundle-links-review.json. Full log hashes/metadata are in reuse-validated.json. No earlier-head dynamic result substitutes for candidate evidence.

Publication nuance:244of245manifest files still match20881542 exactly; the living REPORT was updated after that snapshot and matches its published27772c bytes. The brief's on-resume245match was temporal, not a current raw-log substitution. Existing G7 publication is confirmed. This new independent grade still needs coordinator publication.

## Mutation strength and limitations

27/28kills,10green controls. Full per-mutant command, diff, exit and failure line: mutations/adjudication.json. Six generator unit mutants plus the real-edge integration mutant reproduce80missingindexedges; scene-preboot and premature/hidden destruction, SQLnextday/hour/micros/maxclock, sharedHUDstyle/gatedcontainer/callback/XPcolour, browser clock interleaving, all five evidence writer routes, real effects reachability and viewport/smoke behavior are exercised. OldGame.isBooted guard throws “Scene manager is not ready”; old browser clock deterministically rejects pauseAt as past. Artifact mutants have browser0/contract1 and are not misrepresented as failed browser assertions.

The generic hud-green-xp mutation actually changed the unchanged rail dot; it survived and is conservatively retained in the denominator. The exact XP selector later failed the existing colour assertion. No setup, parser, port, termination or optional-capture failure is a kill. The optional extra all-reference PNG capture stopped on343249byteForge1600mockup before writing; required18pair comparison with the original8Home/Bagcapture set passed without relaxing200KiB. This grader-instrumentation correction is separate from candidate gates and fully retained in diagnostics.md/logs/reference.log; it does not erase or retry a required browser failure. No new PNG is delivered (previous item total15unique).

## G1–G7

| Gate | Outcome | Evidence / boundary |
| --- | --- | --- |
| G1 | PASS | remote-final.log: candidate and main unchanged; main is ancestor; personal results.jsonl; exact-head reuse-validated.json validates full265/265eachsize, builds and classic. Personal repeats700/700eachsize. |
| G2 | PASS | Personal audit-guest/audit-signed-in findings, effects at both sizes, keyboard,10contrast tests and18matched reference records; ui-diff.md has no OPEN BASE0 row. |
| G3 | PASS | Personal logs/deno.log; permitted exact-head bundle scan, build inventories and links. bundle-links-review.json: broken references1main→0candidate, growth<0.15%. |
| G4 | PASS — NOT APPLICABLE | No contract or migration changed in82file diff. Complete548SQLunit cases ran personally; no contract forge command required. |
| G5 | PASS — PERMITTED EXACT-HEAD REUSE | ../BASE0-VERIFY-R2/public-config/source.json and build/bundle/smoke logs plus flag-0/flag-1results: four production-preview visits, errors[],blockedWrites[],failure:null. Read-only guest, no sign-in. Values withheld. This is premerge safety proof, not proof of deployed candidate. |
| G6 | PASS | Independent full diff/source/tier/integrity review; generated-map-review.json; secret-scan.json; source-review.md; all required checks preserved. |
| G7 | PASS — EXISTING CANDIDATE REPORT/EVIDENCE PUBLISHED | publication-check.json:244raw manifest files byte-identical at20881542; living REPORT update published at27772c. Independent grade publication is coordinator-owned next action, not claimed complete here. |

## Integrity, honesty, scope and auto-fails

Independent82file tier/hash inventory, additive16map proof,12commit author/suffix audit and full source review: independent-review.json, generated-map-review.json, source-review.md, source.diff. Exact smoke expectation is viewport-derived; Deno former expected failure becomes strict; fixture clocks change no production guards; screenshot/performance assertions persist. No unjustified skip, retry, suppression, timeout increase, golden change or deleted assertion. No Tier3/backend/auth/contracts/migrations/dependencies/newflags/art change. Evidence secret scan has0hits. A1–A9 absent: no falsePASS, test weakening, safety/secret breach, newdefaultONbackend, copiedart, omittedrequiredcheck, redrepeat, badgitdelivery, linkregression or unexpected browsererror observed. Build-time vendor warnings are inherited and are not new lint/runtimeerrors.

Product reports preserve historical failures and current verification is explicitly coordinator-owned, not an independent grade. No score was imported. ui-diff.md explains every visible difference and deductions; no new defect is relabeled future work.

## Remaining workflow

No technical blocker in this grade. Coordinator must publish this grade, obtain/reconcile the other independent grade, then handle serial merge and fresh main/live checks. Those steps have not occurred and this card does not authorize or claim them. Cleanup is complete; candidate and scratch HEADs remain immutable and clean.
