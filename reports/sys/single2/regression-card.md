# Final regression card — 1eefc3e

- Resize burst: two cases × five repeats × two viewport settings × two reviewers = 40 executions; **0 failures (0%)**. No fresh resize flake reproduced. No retry or timeout change.
- Historical 22e4c4b StageLayout boss-sensitive unit: one 5-second timeout while two heavy gates overlapped; clean B passed. Original isolated follow-up, five additional repeats and verbose profile passed (last case 1,032 ms). CPU contention is suspected, not proven. Final A/B serialize unit phases; both 1,467-unit runs pass. Original failure remains in rejected-font-22e4c4b.
- d31cb2a Salvage contrast and 68ab4c1 cold-font CLS were deterministic product defects, not flaky tests. #271 has RED/GREEN evidence; final thresholds remain strict.
- B supplementary performance first invocation rejected an out-of-worktree artifact directory before executing browser checks. Corrected output destination passes; first log retained at final-polish-b.log. This was a harness error, not measured frame performance.
- Final full browser suite399/size ran once per exact head; complete changed specs246/size/reviewer pass at repeat-each3. Two expected game-rule failures and eleven inherited skips remain explicitly reported, unchanged.
