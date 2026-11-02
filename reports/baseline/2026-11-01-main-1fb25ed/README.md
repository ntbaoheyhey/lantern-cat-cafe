# Main baseline — 2026-11-01

Commit: 1fb25ed. Fresh detached worktree, Node v24.22.2, pnpm 10.28.0. Backend env empty.

| Check | Exit | Evidence |
| --- | --- | --- |
| install | 0 | [install.log](install.log) |
| deno-drift | 0 | [deno-drift.log](deno-drift.log) |
| typecheck | 0 | [typecheck.log](typecheck.log) |
| lint | 0 | [lint.log](lint.log) |
| test | 0 | [test.log](test.log) |
| build | 0 | [build.log](build.log) |
| bundle | 0 | [bundle.log](bundle.log) |
| classic-build | 0 | [classic-build.log](classic-build.log) |
| links | 1 | [links.log](links.log) |
| deno-imports | 1 | [deno-imports.log](deno-imports.log) |
| e2e | 1 | [e2e.log](e2e.log) |

Observed full e2e: 249 passed, 3 failed (stage-redraw reduce, legacy HUD height at 390 and 320). Existing tests remain enabled. Link baseline: 1 broken path (the missing structural research folder). Deno guard: 80 unresolved explicit index edges; dependency generator drift itself is zero. Unit suite succeeds with existing opt-in skips/expected failures, recorded in the raw log. Production/classic builds and bundle secret scan succeed. Main has NOT passed the mission gate.
