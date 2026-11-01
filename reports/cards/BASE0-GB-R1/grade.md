# BASE0 independent grade B — PASS,97/100, unmerged

Frozen head `5db4949096e93eedeb98dff94ef1ec7019485f96`; remote-main base `1fb25edf4c54ada0d161e3c1dd16a4c4550aafba`; branch ai/codex-mega-deno0; PR246. I did not build/fix this candidate, read another grader's score, commit, push, comment on the PR or change the delivery worktree. Native requested model/effort/priority recorded honestly in runtime.json; no provider429 observed.

| Criterion | Score | Evidence and reason |
|---|---:|---|
| C1 Correctness |25/25|26/26premerge acceptance lines PASS: t-cases.json. Generator5cases,18clean import maps/no drift, original stage both motions, inherited HUD/resize cases, clock/early/replay regressions, artifact and UI obligations. Commands/exits in results.jsonl, build-results.jsonl, follow-results.jsonl; explicit permitted full-suite reuse in reused-evidence.json.|
| C2 Stability |20/20|Own typecheck/lint/rootunits/default+classic/v2builds green;470/470repeat10eachsize with workers1, no retry/timeout change. logs/repeat-1280.log:2465; logs/repeat-1600.log:2465. Fullbrowser264/264eachsize explicitly reused from identicalHEAD after personal prerequisites passed. Original stage2/2eachsize and inherited34/34eachsize.|
| C3 Test strength |10/10|10×19kills/19tried,16valid greencontrols. Each actual failure, command and logline in mutation-assertion-review.json. Five artifact mutations have browserexit0 plus independent file-write contractexit1; these are not falsely reported as browser failures. Setup failures excluded, see below.|
| C4 Design/documentation |14/15|Minus1 for explained retained extra context/status layout vs reference (docs/decisions/baseline-hud-layout.md:16–20; R2Home screenshots bothsizes). Own matched screenshots,36audit visits,20effects assertions,14rail+6Forge keyboard visits and10contrast assertions pass. ui-review.md records every scoped difference. Inherited untouched Home/Bag/Map/Hero/Help differences belong to user-designated CXR1/future cards; no complete redesign match is claimed.|
| C5 Quality |8/10|Minus2 for new unused compact API/call: apps/web/src/shell/Hud.tsx:21,24–31; ScreenFrame.tsx:54. One coherent dead-code issue. No new lint warning or unexplained bundle growth; own main→candidate gzip+0.1441%classic,+0.1400%v2 (bundle-comparison.json).|
| C6 Integrity |5/5|All79files/fullsource diff reviewed. Ten textualhits justified; only2changed inherited assertlines are documented strengthening/context correction. No new skip/retry/timeout/golden/suppression, Tier3 or matching credential leak. source-review.md, integrity-hits.json, removed-assertions.json, generated-map-review.json, secret scans.|
| C7 Honesty |10/10|Current verifier claims agree with raw exactHEAD evidence and personal runs; historical failures remain historical, no fullredesign/merge/deployedPASS. Published evidence bytes matchc388d579. Our own harness/capture failures are explicitly preserved and corrected, never counted as kills/PASS. historical-report-review.json, publication-review.json, reused-evidence.json, setup notes.|
| C8 Scope |5/5|All79files classified:53Tier1,26Tier2,0Tier3; each adjacent file has a valid reason tied to source report/decisions/brief. scope.json; unchanged-scope.json proves game/auth/contracts/migrations/dependencies/workflows unchanged.|

Total97; all criterion floors and C1≥23/C2=20/C6=5/C7≥8 met. Auto-fails:none. This is one independent premerge grade, not permission to bypass the other grade or merge/postmerge gates.

Own root suite:5script tests+2292ordinary workspace passes;2expected-fail and11skipped game-rules cases are inherited unchanged, not newly quarantined. Exact commanded evidence: run-checks.mjs/results.jsonl; logs/test.log:38 (SQL548), logs/test.log:57 (web1306); logs/deno.log:6. Full verifier logs reused only at head5db4949: ../BASE0-COORDINATOR/full/e2e-1280x720.log and e2e-1600x900.log, each264passed/exit0. Hashes and publication check in reused-evidence.json/publication-review.json.

G1PASS: remote main is ancestor and unchanged; personal required gates/repeats pass and full original suite reuse authorized. G2PASS for BASE0: guest18+signed18audit visits,10effects assertions eachsize, all9manifest screens reached in both motion modes; no document scroll/overlap/errors. G3PASS:18clean maps/stable generation; same-day links1→0; tiny bundle growth; bundle scan green. G4notapplicable:no contract/migration changes; SQL548pass. G5PASS by explicit exactHEAD raw reuse: production public-config classic+v2 guest previews at bothsizes, no sign-in/backendwrites/errors; keys withheld. G6PASS: full review, integrity,79file tiers,11correctauthor/[skip ci]commits. G7PASS: verifier evidence published atc388d579 and byte-verified; parent owns publication of this grade. Required verify-pr246 exit0 explicitly reused; contract skip is appropriate. Detailed gate interpretation is in gate-review.md.

The26Tlines and their specific evidence:

| ID | Requirement | Result/evidence |
|---|---|---|
|D1|Exact root and nested index keys|PASS — mutations/gen-control-before.log|
|D2|Directory aliases coexist with ordinary module and explicit index|PASS — mutations/gen-control-before.log|
|D3|Exclude test, fixture, non-TypeScript files|PASS — mutations/gen-control-before.log|
|D4|Deterministic generation; preserve auth and eligible function scope|PASS — mutations/gen-control-before.log|
|D5|All Deno imports resolve and regeneration has no drift|PASS — logs/deno.log|
|D6|At least six Deno mutants killed with green controls|PASS — mutations/results.jsonl|
|S1|Preboot resize defers until CREATE then latest scale used|PASS — mutations/stage-control-before.log|
|S2|Original stage-redraw passes both motion modes at both mission defaults|PASS — logs/stage-1280.log;logs/stage-1600.log|
|S3|Exact original resize and burst dimensions preserved|PASS — logs/inherited-1280x720.log;logs/inherited-1600x900.log|
|H1|All existing HUD/topbar/narrow geometry cases preserved|PASS — logs/inherited-1280x720.log;logs/inherited-1600x900.log|
|H2|Real XP fill changes and complete keyboard-action guidance, normal/gated|PASS — logs/repeat-1280.log;logs/repeat-1600.log|
|H3|Fallback font and normal/offline/429/503 readability|PASS — logs/repeat-1280.log;logs/repeat-1600.log|
|H4|Desktop compatibility and accepted context decision recorded with matched reference|PASS — ui-review.md;keyboard.json|
|A1|Default F3/error screenshots do not overwrite reports; byte limits preserved|PASS — artifact-control-recovered.json; logs/artifact-control-before-contract.json|
|A2|F3/G1/G3 diagnostic output defaults isolated; assertions unchanged|PASS — artifact-control-recovered.json; logs/artifact-control-before-contract.json|
|A3|SCREENSHOTS and output overrides work when explicitly enabled|PASS — logs/artifact-opt-in.log|
|C1|UTC leap/year and before/after old expiry calendar cases|PASS — mutations/clock-control-before.log|
|C2|Seeded2020/2040 inventory insertion retains early/replay claim guards|PASS — mutations/clock-control-before.log|
|C3|All inherited SQL fixture lifecycle assertions pass|PASS — logs/test.log|
|V1|Complete unchanged root typecheck/lint/units/default+classic builds|PASS — results.jsonl;build-results.jsonl|
|V2|Complete original browser suite both projects and desktop defaults|PASS — reused-evidence.json|
|V3|All six changed specs repeated10 at both sizes with zero failures|PASS — logs/repeat-1280.log;logs/repeat-1600.log|
|V4|Guest/signed-in all-manifest UI audit and effects at both sizes|PASS — follow-results.jsonl|
|V5|Keyboard, contrast and matched desktop screenshots|PASS — keyboard.json;logs/test.log;ui-review.md|
|V6|Meaningful independent mutations including clockfix and browser behavior|PASS — mutation-assertion-review.json;follow-results.jsonl;extra-results.jsonl|
|V7|Same-day main links and bundle; production-safe G5; PR wrapper|PASS — build-results.jsonl;reused-evidence.json|

Grader execution discrepancies, preserved rather than hidden:

1. The first claim-rounding mutation selector matched twice and was rejected before editing. No kill credited. Statement-specific recovery failed the seeded2040claim test for the intended too-early timestamp and its clean control passed (mutations/claim-rounding-recovered.log:10; claim-rounding-control-after.log).
2. Artifact cleanup used trim() on porcelain output, dropping the first path character. The later unmutated artifact control therefore began dirty; no file timestamp changed during it. This invalid-precondition check is NOT VERIFIED, not a candidate red/flake. artifact-cleanup-issue.json explains it; exact scratch file restored; artifact-control-recovered.json proves clean before/after, no touchedfiles/shots, testexit0/contractexit0. G1/G3 artifact mutants independently touched their intended metrics files, so their kills do not rely on the leftoverF3file.
3. Initial UI captures preceded actor rendering. A retry incorrectly applied a ranged two-half assertion to a melee warrior, whose enemy intentionally stands beside the cat (StageScene.ts:333–339). These invalid capture proofs remain raw only. The final capture uses the original stage-redraw ranged-witch fixture and unchanged half assertion, passes, and was visually inspected. capture-readiness-note.md, keyboard-ready-result.json, logs/keyboard-witch-ready.log. No original test assertion/limit changed.

The final delivered figure set is15PNGs, all<200KiB (delivered-figures.json). Extra opt-in/mutant/failed-capture images and videos are raw diagnostics, not delivered figures. All helper syntax checks passed node--check. Candidate worktree clean, tracked scratch source/artifacts restored, ports4430–4434free, no recorded process running; cleanup.json/runtime.json. No commit or remote mutation by grader.

Remaining coordinator delivery steps: publish this grade, obtain/compare the other independent grade, serial gated merge if eligible, then full postmerge-main/deployed-live proof. None is claimed completed here. No candidate premerge blocker found; compact remains a scored quality issue and the accepted context layout remains a scored visible difference.
