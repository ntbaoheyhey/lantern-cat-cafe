STATUS: IN-PROGRESS

# FXRB sprite-oracle repair — verified prospective integration

Source26e7de846e82c58523eaa8c45984c635accb5357 is published to the existing ai/codex-fxrb / PR243. Four repaired files are byte-identical to their counterparts in prospective integrationabd64faab1ef256943232a12cb1b6457feed02da (BASE0280ff4b + priorFXRBb5fd48e + this repair). Main remains1fb25ed. These are two different heads: full/repeat outcomes below belong toabd64fa, while source26e7de8 has its own passing typecheck. Actual-main integration after BASE0 is still required.

## Finding and repair

The original alpha oracle counted ground shadows and HP bars as actors. With BOTH sprite objects deliberately hidden, the original six resize cases still passed6/6. That surviving mutant is retained in hidden-actors-original-tests.log and hidden-actors.patch; it is not a production PASS or evidence that real sprites were invisible.

The test repair preserves all six active-combat resize cases and every cardinality/size/insertion/state/error assertion. Four additional cases use a natural boss-ready scene at each desktop start with normal and reduced motion. Combat and HP bars are halted, and the sampled region excludes the ground ellipse. Canvas count, dimensions and body pixels are sampled together. Existing messages now accurately name nonempty painted content. No fixed waits, retries, timeout changes, skips or relaxed assertions.

New working-tree assertions rejected combined-hidden, cat-only and monster-only variants,4failures each, with the expected [false,false], [false,true] and [true,false] bodies. A restored10-case control passed. The test bytes match the later commit, but these runs are expressly precommit evidence. All deliberate application mutations were restored before commit. Exact hashes/results: mutation-results.json, repair-scope.json. Error-context artifacts remain local-only; no deliveredPNG added.

## Final direct checks

| Check | Head | Result | Evidence |
| --- | --- | --- | --- |
| Expanded resize repeat20 | abd64fa |200/200PASS,6.3m; each of10internal cases ran20times, no retries |resize-repeat20-abd64fa.log |
| Complete browser suite, configured1280×720 | abd64fa |272/272PASS,3.0m, after repeat20 |full-1280-abd64fa.log;full-1280-result.json |
| Complete browser suite, configured1600×900 | abd64fa |272/272PASS,2.9m, after repeat20 |full-1600-abd64fa.log |
| Web typecheck, includes e2e | abd64fa |PASS exit0 |typecheck.log |
| Web typecheck on product source |26e7de8 |PASS exit0 |source-typecheck-26e7de8.log |
| Links |abd64fa |71Markdown files/811paths,0missing |links-abd64fa.log |
| Diff/secret/cleanup |scoped repair |PASS;4test/doc files only, no new application delta;0secret-pattern hits; checkout clean;4310–4313free |repair-scope.json;secret-scan.json;final-validation.json |

The two complete suites use the required configured desktop matrix; existing individual tests also retain their own explicit viewport cases, including mobile coverage. The repeat run is one invocation with internal two-size/theme/motion cases, not two separately configured invocations. No historical failure is retried away or relabeled.

Commands from the integrated checkout root, with CI=true SCREENSHOTS=0 VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' and E2E_PORT_CLASSIC/V2/SERVER/API=4310/4311/4312/4313:
- `pnpm --filter @taskbar-hero/web test:e2e e2e/layout/resize-burst.spec.ts e2e/layout/resize.spec.ts --project=stage-layout --workers=1 --repeat-each=20`
- `E2E_VIEWPORT=1280x720 pnpm --filter @taskbar-hero/web test:e2e --workers=2`
- `E2E_VIEWPORT=1600x900 pnpm --filter @taskbar-hero/web test:e2e --workers=2`
- `CI=true pnpm --filter @taskbar-hero/web typecheck` (also executed directly in product-source checkout)
- `node scripts/check-links.mjs`
Mutation/control commands use the same empty backend/port environment: original and restored two-spec commands with workers1; new-body mutation commands select resize.spec.ts with workers1 and `--grep 'both sprite bodies'`. No helper runner or subagent was invoked. Raw logs retain real output tails and failures; final-validation.json records head, exit and SHA256 for completed checks.

## Delivery and remaining gates

The source diff adds the decision note and implementation-snapshot report alongside the two browser specs. No new rendering/gameplay/art/backend/dependency/flag change was made by this repair. The earlier readiness guard remains part of the historical FXRB source branch and is already included in prospective BASE0. The source report's older builder record is historical; this card and PRbody carry current verification status.

This closes the identified actor-oracle gap and demonstrates T1/T3 on the prospective integration. It does not certify the entire mission G1–G7, actual-main state, deployment or independent review. After BASE0's permitted merge/main/live checks, integrate actual main, complete all current gates and obtain required independent reviews. The no-helper/subagent instruction does not waive those gates. PR243 remains draft and no score or merge is claimed.

Adjacent limitation: the older stage-redraw spec also uses alpha-only actor wording. Its existing checks were not modified or upgraded by this patch; the stronger FXRB stationary case now covers both bodies through breakpoint recreation. Record that oracle wording for the later whole-screen QA pass rather than overstating its old assertions.

Verified recovery bundles are retained under /Users/bao/.codex/handoffs/taskbar-hero/reliability/: fxrb-sprite-oracle-abd64fa.bundle (requires280ff4b) and fxrb-sprite-oracle-source-26e7de8.bundle (requires1fb25ed). No running test/preview process remains; other worktrees and historical dirty media are preserved.
