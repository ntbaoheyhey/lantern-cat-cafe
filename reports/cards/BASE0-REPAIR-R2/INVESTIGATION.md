# BASE0 round1 repair investigation — living draft

The product branch remains `5db4949096e93eedeb98dff94ef1ec7019485f96` while mandatory grader C independently assesses it. A failed the required repeat gate (final0, A7); B passed97. No merge. Repair code is now committed locally as280ff4bed495fd28bd489eb5f2dcfd1910f21fc0 on a detached checkout in `/Users/bao/.codex/worktrees/mega-base0-repair-r2/taskbar-hero`.

## Two separate timing defects

1. Browser fixture clock: `clock.install()` followed by reading the moving browser clock and `pauseAt(reading)` races protocol latency. With retained traces, the unchanged original case produced53passes/47`Cannot fast-forward to the past` failures. The fixture now installs at epoch origin before navigation and pauses at current host wall time. This changes only setup; application clocks, claim cadence, TTL, SQL guards, retries and timeouts remain unchanged. A new fixture regression deliberately advances the clock one tick before the pause command and verifies frozen time, authoritative state and later explicit advancement.
2. Original missingCraft failure: after the clock fix, the unchanged 429 test still produced96passes/4failures. Failure-only DOM instrumentation showed the entire React shell disappeared. A second diagnostic captured the actual page error: `TypeError: Cannot read properties of undefined (reading 'sys')` in Phaser SceneManager.destroy, reached via Game.runDestroy/step during StageCanvas cleanup. Three observed failures have the same empty-shell/error evidence in `crash-root-cause-observations.json` and per-repeat `failure-dom.json` files.

Phaser Game.boot sets `Game.isBooted=true` before its asynchronous texture readiness. SceneManager.bootQueue creates systemScene only on Game READY; SceneManager.destroy dereferences systemScene.sys. StageCanvas incorrectly called step to consume pendingDestroy as soon as Game.isBooted was true. The repair uses SceneManager.isBooted; otherwise the existing READY listener/microtask completes cleanup after initialization. Hidden-game destruction still completes, and no error is caught or suppressed to conceal the failure.

New unit regressions cover both Game.isBooted=false and the problematic Game.isBooted=true/SceneManager.isBooted=false interval. Before the guard fix,1failed/5passed with the expected premature-destruction error; after the fix, StageCanvas and StageScene suites pass. Existing resize/cardinality/actor assertions are retained. `logs/queued-destroy-regression-before-fix.log` and `-after-fix.log` preserve both outcomes.

The temporary beforeEach/afterEach diagnostic observers were removed; `errors-notice.spec.ts` is restored byte-for-byte to the assigned candidate version. Instrumented source remains `errors-notice-observer-as-run.ts` for reproducibility. Trace-enabled diagnostic100pass does not erase no-trace failures. Production fix and fixture change require new exact-head full verification and fresh grades.

## Other grader deductions

Removed the unused HudProps.compact field and ScreenFrame forwarding argument. Narrow shell-context now retains only actual gap/padding overrides; shared display/alignment/background/flex declarations remain in the common rule. The user-approved readable title/guidance row remains an explicit documented design tradeoff, including its one-point deduction.

Current targeted pipeline: `targeted-repair-checks.py` records typecheck/lint, the new clock regression against the old clock setup (negative control, restored in finally),100unchanged429-case repetitions without trace, then the fixed clock regression. Read `targeted-repair-results.json` and `TARGETED-REPAIR-DONE`; completion and full-gate PASS are not assumed. Current PID/worktree/ports are in runtime.json. No candidate commit, push, merge or release has occurred.

Targeted r2 complete: typecheck/lint exit0; old-clock negative regression exit1 with expected past-target error; repaired original429case100/100 withouttrace and fixedclock regression exit0. The earlier25ms host-delay negative control unexpectedly passed; retained as an inadequate diagnostic, not a kill. Replaced with deterministic one-tick protocol interleaving. Eight-file repair commit280ff4b is locally detached, while PR246 remains5db4949 for C. Fresh full verification runs separately in BASE0-VERIFY-R2; no full PASS yet.
