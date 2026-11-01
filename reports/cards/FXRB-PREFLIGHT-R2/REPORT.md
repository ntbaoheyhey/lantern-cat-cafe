STATUS: PRELIMINARY CHECKS PASSED — not a full gate or grade.

# FXRB integration preflight

Observed 2026-11-01T22:31:47+07:00. Detached integration7023a2dbe2a03ea1302c3e2cbce24d444a511f41 combines BASE0280ff4b and FXRBb5fd48e, with treee5e881b8108bbfdff79824914130a8c18e5d3ecf. Existing product branches and PR heads did not move. This focused probe detects interaction regressions while BASE0 independent grades and deployment capacity remain pending.

- Frozen installation PASS, exit0, pnpm10.28.0.
- StageScene, StageCanvas and layout-metrics units PASS:24tests across3files, exit0.
- Both resize specs with --repeat-each=20, one worker and no retries PASS:120tests in3.9minutes, exit0. Six internal cases comprise burst plus dark/light continuous cases at each1280×720 and1600×900. This is one invocation with that internal matrix, not two separately configured full-suite invocations.
- Preserved exactly-one-canvas/logical-size assertions, actor checks, state/identity preservation, insertion budget, responsive endpoints and console/page-error checks. No assertions, waits or source files were changed for this run.
- Cleanup PASS: source worktree clean, head unchanged, owned runner stopped, ports4440–4444 free, scoped secret-pattern scan zero findings. Raw commands/head/environment/ports/exits are in checks/results.jsonl and checks/*.log; setup and runner output remain in logs/.

Not verified here: complete root build/type/lint/browser/UI/production-preview/wrapper gates, three fresh mutants, independent scores, actual current-main integration, merge and live deployment. The earlier complete FXRB gate remains pending. Once BASE0 merges and its postmerge gate passes, integrate actual origin/main into the existing FXRB branch, reconcile its living report and run the entire prescribed gate on that exact new head.
