STATUS: IN-PROGRESS

# FXRB actor-oracle finding

The coordinator reviewed FXRB against T1–T3 and found that its canvas alpha checks also count shadows and HP bars. This is a test-oracle gap, not evidence that production sprites are currently hidden.

Fresh owned scratch: /Users/bao/.codex/worktrees/mega-fxrb-actor-oracle/taskbar-hero, detached7023a2d (prospective BASE0+FXRB). A deliberate two-line StageScene mutant sets both created sprites invisible while retaining their shadows, HP bars and scene behavior. The ORIGINAL unchanged two resize specs still passed6/6, exit0. hidden-actors.patch and hidden-actors-original-tests.log preserve the exact mutation and result. This mutant survived the old oracle; do not call that result a product PASS. Source b5fd48e and main1fb25ed are untouched.

A scoped test repair adds natural boss-ready scenes in normal/reduced motion at both desktop starts. Combat/HP bars are halted; the pixel region excludes the ground ellipses. All existing active-combat resize assertions stay intact. Existing messages now describe painted content honestly. New checks retain exactly-one-canvas and exact logical dimensions in the same read. New oracle validation completed: both-hidden, cat-only and monster-only mutants each fail all4cases with the correct missing sides. Restored control passes10/10. All working-tree test bytes match the later committed repair; these mutation runs are identified as precommit evidence, not relabeled exact-head runs. Deliberate production edits were restored before committing. See mutation-results.json and raw logs. No helper/subagent, source push, score or merge.

The original full-suite-after-resize acceptance T3 still needs proof on a current final integration. Historical120-case resize/24unit preflight remains intact, scoped to7023a2d, and does not close this new gap.

Integrated repair commitabd64fa adds only two browser specs, the decision note and implementation-snapshot report on top of7023a2d. Web typecheck onabd64fa passed. Expanded repeat20 completed200/200, exit0 in6.3minutes on exactabd64fa. Ten internal cases (six original plus four sprite-body cases) each ran20times with no retries. This is one invocation whose tests declare both desktop starts, dark/light active scenarios and normal/reduced stationary scenarios. Source26e7de8 also passed its own webtypecheck. Complete browser suites at both configured desktop sizes are next; no final source/main gate is inferred from the prospective run. No source branch/head moved yet.
