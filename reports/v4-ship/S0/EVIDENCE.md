# S0 adoption evidence

Integration branch starts at ART commit 88fa5bdfd820609f054d174fce24248f35aa9575, which contains all shell commits. Shell-first would omit 190 ART commits (own experiment). Old shell worktree was clean: no stash/salvage. Direction sections1-11 read. Request copied verbatim; byte/hash recorded in STATE. Disk119GiB available; no deletion needed. Old fixture supervisor46445 absent, reserved ports free; replacement started from this worktree.

| Check | Result | Evidence |
|---|---|---|
| Frozen install | PASS | install.log |
| Typecheck | PASS, all workspace packages | typecheck.log |
| Node tests | PASS77/77 | tests.log |
| Workspace tests | PASS4846; 2 existing expected failures;11 skips | workspace-tests.log |
| Web / server | PASS2640 /733 | workspace-tests.log |
| Forge | PASS128/128,14 suites | forge.log |
| Build | PASS | build.log |
| F6 parity | PASS3/3 exact hashes and wins | parity.json |
| G-LEARN | PASS8 sources; formal manual1; internet docs4; two-base experiment | ../LEARN/S0.md |

The initial parallel workspace invocation hit ENOTEMPTY in Vitest5's shared module cache. Root node tests had already passed77/77. Rerunning only workspace suites sequentially passed4846 tests. The root test command now uses that verified sequence; package test contents/worker limits are unchanged. Baseline coverage is the combined two invocations, not an invented single-run result.

Parity playback at1x: wave1=213.233s, wave3=573.700s, boss=211.133s. These are scheduler durations for level6 fixtures, not measured first-session funnel values. The V4 boss target is not yet met. No G-FUNNEL/G-PROOF/G-AUDIO/G-UI/G-CLASS claim.

All mutations are SHIP-owned. Local adapter imports ART's fixture helper read-only and explicitly selects5994; outputs stay in SHIP. Local Anvil transactions are disposable; no public transaction or deployment. Source contract files untouched.

Self-score9/10: adoption and baseline complete; product gates deliberately unclaimed and the old boss duration gap remains visible. Item line-by-line check: branch, memory files, direction read, ports, install, tests/typecheck/parity all done; commit/push are the next atomic step.
