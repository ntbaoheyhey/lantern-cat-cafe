STATUS: PASS — independent local technical grade98/100; premerge, not mission DONE.

Exact head: 280ff4bed495fd28bd489eb5f2dcfd1910f21fc0. Base/main: 1fb25edf4c54ada0d161e3c1dd16a4c4550aafba. Existing draft PR246, ai/codex-mega-deno0. Grader: /root/base0_grade_b_r2_recovery. The builder/coordinator and prior graders did not determine this score.

## Score and evidence

| Criterion | Points | Basis and cited evidence |
|---|---:|---|
| C1 | 25/25 | 25 ×18/18 technical acceptance lines. Every line has own observed evidence; T16 uses the specifically permitted exact-head raw full/build reuse. External workflow DONE lines remain separately pending, not certified. Evidence: T1–T18 table below. |
| C2 | 20/20 | All required checks green,1400 independent repeats with zero failures, classic/full build/browser evidence verified at the identical head; no omitted required check. Evidence: results.jsonl; logs/repeat-1280x720.log:2488; logs/repeat-1600x900.log:2488; logs/optin-existing-hud-1280x720.log:280; logs/optin-existing-hud-1600x900.log:280; reuse.json; reuse-extra.json; ui-results.jsonl. |
| C3 | 10/10 | 10 ×22/22 meaningful mutants killed,20 unique green controls. Five artifact mutants have browserexit0/contractexit1; these are explicitly not browser-test failures. Evidence: mutation-summary.json; unit-mutants.json; browser-mutants.json; viewport-mutant.json. |
| C4 | 13/15 | 15−1 documented extra guidance/context row−1 explained retained NEXT/Next wording. Home/Bag structural redesign debt is unchanged, explicitly assigned to CXR1 by the user; no full-redesign fidelity claim. Evidence: ui-diff.md; reference-observations.json; local-capture-inventory.json; keyboard.json; apps/web/src/shell/Hud.tsx:38; apps/web/src/shell/shell.css:225. |
| C5 | 10/10 | No new duplicated logic, dead API, unjustified suppression/config, missing export type, lint warning or unjustified>5%growth found. Classic gzip+0.14424%,v2+0.14055%. Evidence: source-review.md; scope.json; baseline-comparison.json; logs/lint.log:20; scripts/gen-deno-json.mjs:15; supabase/tests/src/fixture-clock.ts:4. |
| C6 | 5/5 | No unjustified test-integrity change; seven textual hits explained. Existing game-rules skips/expected failures unchanged and disclosed. Evidence: integrity-hits.json; source-review.md; full.diff; logs/unit.log:43. |
| C7 | 10/10 | No current technical claim mismatch or false PASS found. Publication correction independently verified against git objects and remote ancestry; raw files and report revisions are distinguished. Historical failures and baseline exclusions are preserved. Evidence: publication-validation.json; remote-final-observation.json; source-review.md; reuse.json; final-secret-scan.json. |
| C8 | 5/5 | All82 changed paths inventoried; every Tier2 prerequisite has a concrete report/decision justification; zero Tier3 changes. Evidence: scope.json; source-review.md; full.diff; reports/base0.md. |

Raw98; final98. Auto-fails: none. C1≥23,C2=20,C6=5,C7≥8 and every local criterion≥60%. This one independent grade does not establish the two-grader gate.

## Technical T/DONE acceptance

The denominator covers the18 concrete technical requirements of this premerge BASE0 assignment. Deno clean/stable outputs and the complete original suite are included in T3/T16. The explicitly external two-grade/merge/post-merge/publication obligations are all listed below as pending; this technical score does not mark them complete or waive them. The latest user rule explicitly permits identical-head raw full-suite/build reuse; every such use is labeled.

| Line | Acceptance | Result | Observed evidence / command log |
|---|---|---|---|
| T1 | Exact root/nested index and ordinary-module aliases; directory aliases retained | PASS | logs/unit.log:6; mutations/deno-root-index-control.log:1; mutations/deno-nested-index-control.log:1; mutation-summary.json |
| T2 | Test/fixture exclusions, deterministic generation, auth/game distinction | PASS | logs/unit.log:8; mutations/deno-test-exclusion-control.log:1; mutations/deno-stable-order-control.log:1; mutations/deno-auth-distinction-control.log:1 |
| T3 | Actual Deno import guard and stable generation without drift | PASS | logs/deno.log:9; scripts/gen-deno-json.mjs:76 |
| T4 | Preboot StageScene relayout defers and applies latest size | PASS | mutations/scene-preboot-control.log:1; mutations/scene-preboot.log; apps/web/src/game/stage/StageScene.ts:322 |
| T5 | Lifecycle teardown waits for SceneManager readiness | PASS | mutations/lifecycle-old-game-guard-control.log:1; mutations/lifecycle-old-game-guard.log; apps/web/src/game/stage/StageCanvas.tsx:69 |
| T6 | Original redraw both motion modes and exact-size resize cases | PASS | logs/repeat-1280x720.log:2488; logs/repeat-1600x900.log:2488; runner.mjs:9 |
| T7 | Unchanged HUD/topbar/wallet limits at all existing narrow/desktop sizes | PASS | logs/optin-existing-hud-1280x720.log:280; logs/optin-existing-hud-1600x900.log:280; apps/web/e2e/ui/u2-hud.spec.ts:64; apps/web/e2e/ui/u3-layout.spec.ts:46 |
| T8 | Desktop status containment,160×10XP track, nonzero proportional fill and semantic color | PASS | logs/repeat-1280x720.log:2488; logs/repeat-1600x900.log:2488; mutations/hud-control.log:1; apps/web/e2e/ui/baseline-hud.spec.ts:23 |
| T9 | Readable actionable guidance with fallback fonts and normal/offline/mock429/mock503 states; keyboard callback | PASS | logs/repeat-1280x720.log:2488; logs/repeat-1600x900.log:2488; apps/web/e2e/ui/baseline-hud.spec.ts:158 |
| T10 | Browser clock interleaving plus shared consumers, classic viewport-aware smoke | PASS | logs/repeat-1280x720.log:2488; logs/repeat-1600x900.log:2488; mutations/clock-control.log:1; mutations/viewport-smoke-control.log:1; viewport-mutant.json |
| T11 | Database-relative day boundaries and microsecond-safe unchanged claim guards | PASS | logs/unit.log:38; mutations/sql-next-day-control.log:1; mutations/sql-claim-rounding-control.log:1 |
| T12 | PNG writers opt-in and honor requested destination; byte budgets preserved | PASS | browser-mutants.json; optin-results.json; logs/optin-existing-hud-1280x720.log:280; logs/optin-existing-hud-1600x900.log:280 |
| T13 | F3/G1/G3 metrics default to Playwright output and honor explicit report requests | PASS | mutations/f3-metrics-control.log:1; mutations/g1-metrics-control.log:1; mutations/g3-metrics-control.log:1; browser-mutants.json; optin-results.json |
| T14 | Actual reached-screen effects coverage and all-manifest guest/local-signed audits | PASS | effects-1280x720/summary.json; effects-1600x900/summary.json; audit-guest/findings.json; audit-signed-in/findings.json; mutations/effects-inert-help.log |
| T15 | Matching reference sizes/screens, keyboard, focus, reduced motion and contrast | PASS | reference-observations.json; keyboard.json; ui-diff.md; logs/contrast.log:12 |
| T16 | Full original suite, default/classic builds, links and bundle baseline | PASS | reuse.json (explicit exact-head full/build reuse); baseline-comparison.json; logs/unit.log:66; logs/repeat-1280x720.log:2488; logs/repeat-1600x900.log:2488 |
| T17 | At least5 meaningful independent mutations, including6 Deno behaviors, lifecycle and clock | PASS | mutation-summary.json: 22/22 kills with20 unique green controls; unit-mutants.json; browser-mutants.json; viewport-mutant.json |
| T18 | Decisions, scope/integrity, default-off safety and source preservation | PASS | source-review.md; scope.json; integrity-hits.json; final-secret-scan.json; reuse-extra.json (explicit G5 reuse); cleanup.json |

## Execution and reuse disclosures

Own frozen pnpm10.28.0 install, typecheck, lint, complete root pnpm test and Deno generation/drift/import guard all exited0. Root units:5 Node tests and2294 Vitest passes; main’s3 skipped game-rules files,11 skipped cases and2 expected failures are retained unchanged, not concealed. logs/unit.log:6–17,28–58,66 record the counts. No packages/game-rules source/test differs from main.

Twelve affected browser specs (the7 added/changed spec files plus all shared-clock/resize/redraw consumers) ran repeat10 with one worker: logs/repeat-1280x720.log:2488 and logs/repeat-1600x900.log:2488,700/700 each. No retry, skip, timeout or assertion change. Positive SCREENSHOTS=1/REPORT_DIR checks plus original u2/u3 HUD limits passed62/62 at each size (logs/optin-existing-hud-1280x720.log:280; logs/optin-existing-hud-1600x900.log:280). Logs retain the real command, cwd, exact head and viewport.

Own22/22 mutation kills with20 distinct green controls cover7 Deno mapping/generation properties, preboot scene layout, lifecycle readiness, SQL day/claim rounding, deterministic browser-clock interleaving,3 HUD failures,5 artifact side effects, inert Help navigation, and reverting viewport-aware smoke to fixed1280. The clock mutant produces the intended “Cannot fast-forward to the past” regression; it is not a missing server/browser/setup failure. Artifact mutants have browserexit0 plus independent contractexit1; calling these browser-test failures would be wrong. Each source mutation was restored. See mutation-summary.json and per-case diffs/logs.

REUSED, not my execution: coordinator exact-head full browser265/265 at each size; default/classic/v2 build artifacts, bundle scan/links; verify-pr246 wrapper; public-config guest previews. reuse.json and reuse-extra.json identify commands, exits, heads, raw logs and hashes. Same-day main raw baseline is reports/baseline/2026-11-01-resume-main-1fb25ed; main links1, candidate0. Classic gzip663477→664434(+0.14424%); v2678033→678986(+0.14055%). No predecessor test execution or coordinator/other-grader score is substituted for my mandatory reruns.

Own UI evidence:18 matched app/reference screen-size visits;14 keyboard destinations; guest18/local-signed18 audit visits with zero findings; effects10/10 at each size and all9 actual screens in both motion modes; contrast10/10. Home/Bag8 local PNGs personally inspected. All captures stay local; no new PNG is delivered. The visible context row and repeated NEXT/Next wording cost one C4 point each. Full Home/Bag redesign fidelity is expressly not claimed.

## Integrity, scope and report honesty

Complete82-file inventory and manual review: source-review.md,scope.json,full.diff. Seven added textual integrity hits are explained, with no unjustified suppression, assertion deletion, retry or skip. All12 candidate commits have the required author and skip-CI suffix (git-hygiene.json). No dependency version, auth/backend source, contract, migration, workflow, secret or flag default changed. final-secret-scan.json found zero credential-pattern hits; public configuration values were not logged.

The publication reconciliation was checked independently:244 raw/evidence files match20881542; all245 manifest files match the separate37d4b03c correction snapshot,489 byte comparisons with zero mismatches. The correction snapshot is an ancestor of the observed remote ledger head (remote-final-observation.json). REPORT.md revisions are separate from immutable raw evidence; the original245-current-bytes-at20881542 wording is not repeated. Historical failures and corrections remain visible. Snapshot workflow status must be updated by the coordinator when this new grade is published.

## G1–G7 and external DONE lines

| Gate | Result | Evidence |
|---|---|---|
| G1 | PASS_TECHNICAL | results.jsonl; reuse.json; remote-final-observation.json; base remains ancestor; exact head unchanged |
| G2 | PASS_BASE0_SCOPE | audit-guest/findings.json; audit-signed-in/findings.json; effects-*/summary.json; keyboard.json; ui-diff.md (zero OPEN BASE0 rows) |
| G3 | PASS | logs/deno.log; reuse.json; baseline-comparison.json: links0 versus main1; budgets below5%growth |
| G4 | NOT_APPLICABLE_CONTRACTS_MIGRATIONS | full.diff; scope.json: neither changed; SQL suite548 passed in logs/unit.log:39 |
| G5 | PASS_REUSED_EXACT_HEAD | reuse-extra.json; ../BASE0-VERIFY-R2/checks/public-config.log; four guest-only previews at both flags/sizes, no writes/sign-in/errors |
| G6 | PASS | source-review.md; full.diff; scope.json; integrity-hits.json; final-secret-scan.json; cleanup.json |
| G7 | EXISTING_REPORT_PUBLICATION_VERIFIED_RECOVERY_GRADE_PENDING_PUBLICATION | publication-validation.json; remote-final-observation.json; coordinator must publish this new grade and reconcile independent results before merge |

| External acceptance | Current state | Reason |
|---|---|---|
| Two independent repaired-head grades≥92 and all floors; third grader if discrepancy requires | NOT VERIFIED BY THIS INDEPENDENT GRADER | Other grader scores deliberately not consulted. Coordinator aggregation remains mandatory. |
| Serial gated PR merge after current-main/eligibility checks | NOT DONE | PR246 is OPEN/DRAFT on the exact candidate; no merge authorized/performed in this assignment. |
| Post-merge clean-main verification/repeats and live deployment proof | NOT DONE | Candidate is unmerged. Local score is not live deployment certification. Preview deployment quota was reported in the brief; not independently retried or treated as a technical pass. |
| Recovery grade/report publication and current workflow-status reconciliation | PENDING COORDINATOR | This worker may not commit/push. Prior report snapshot is published, but this newly authored independent grade must still be published. |

No current local technical blocker remains. The coordinator must publish this evidence, independently aggregate grades without influencing them, complete the serial merge gate, then obtain fresh post-merge main/live proofs. This grader did not merge, deploy, sign in to a real account or perform live writes.

Cleanup: cleanup.json records both owned checkouts clean at the exact head and ports4450–4454 free. No foreign process was killed. Local-only artifacts were moved out of the scratch checkout and excluded from publication; local-evidence-relocation.json resolves their original capture paths. DONE means this bounded independent grading assignment ended, not that BASE0 is merged.
