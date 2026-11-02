# CXC2 — active frontend builder

Built independently on main2847e9a after CXU3 reached PARTIAL. The Help proof tab uses explicit lazy mounting and screen-active query gating, public Fuji client only, RPC chain validation, a fixed500-block/10-event window and a30-second cache that coalesces in-flight and failed reads. Facts remain separate when individual RPC reads fail; no minted total or backend proof is claimed.

Builder typecheck/lint and26 unit/component cases pass. First browser attempt did not collect tests: Node24 rejected the chain package index's JSON deployment import without an import attribute. The harness now reads the committed deployment JSON with fs and imports the generated ABI directly; no product/package runtime changes or assertion changes. Original failure retained. Browser rerun is active; no formal grade/PR/merge yet.

The separate public read-ahead at block60421787 verified Fuji/code/linkage, not a wallet journey. No secrets, wallet, write transaction, migrations/deployments, flags, dependencies or art changes.

Builder complete:26 focused cases and4 browser cases pass. The wire expectation now includes viem topics=[], and the virtual clock is installed before app initialization so the reader and query cache use the same clock. Screenshots reviewed at both sizes are explicitly mocked-RPC evidence. Formal A is frozen ate54f0750644322dbdc40dffe389130a1f6fc736f, PID62738, sequential core→mutants→UI→repeats→full317×2. No passing score/PR/merge.

## Fresh grader A complete
Self-graded (fresh pass)95/100 on e54f075, zero auto-fails.2423 unit/script cases pass (2 inherited expected failures/11 skips unchanged),317 browser cases per size,120 changed-spec repeats,12 mutants,36 strict UI and20 effects checks pass. Both screenshots inspected and under200KiB; they are mocked RPC fixtures. The release-only read RPC guard separately passed15 controls. B runs tests first on clean /private/tmp/tbh-cxc2-fresh-b, PID67091, different ports; no merge yet.
