STATUS: IN-PROGRESS

# FXRB actor-oracle finding

The coordinator reviewed FXRB against T1–T3 and found that its canvas alpha checks also count shadows and HP bars. This is a test-oracle gap, not evidence that production sprites are currently hidden.

Fresh owned scratch: /Users/bao/.codex/worktrees/mega-fxrb-actor-oracle/taskbar-hero, detached7023a2d (prospective BASE0+FXRB). A deliberate two-line StageScene mutant sets both created sprites invisible while retaining their shadows, HP bars and scene behavior. The ORIGINAL unchanged two resize specs still passed6/6, exit0. hidden-actors.patch and hidden-actors-original-tests.log preserve the exact mutation and result. This mutant survived the old oracle; do not call that result a product PASS. Source b5fd48e and main1fb25ed are untouched.

A scoped test repair adds natural boss-ready scenes in normal/reduced motion at both desktop starts. Combat/HP bars are halted; the pixel region excludes the ground ellipses. All existing active-combat resize assertions stay intact. Existing messages now describe painted content honestly. New checks retain exactly-one-canvas and exact logical dimensions in the same read. Direct mutant validation is running in session6283 on4310–4313; no final repair result yet. No helper/subagent, source push, score or merge.

The original full-suite-after-resize acceptance T3 still needs proof on a current final integration. Historical120-case resize/24unit preflight remains intact, scoped to7023a2d, and does not close this new gap.
