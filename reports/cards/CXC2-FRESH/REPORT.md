# CXC2 — active frontend builder

Built independently on main2847e9a after CXU3 reached PARTIAL. The Help proof tab uses explicit lazy mounting and screen-active query gating, public Fuji client only, RPC chain validation, a fixed500-block/10-event window and a30-second cache that coalesces in-flight and failed reads. Facts remain separate when individual RPC reads fail; no minted total or backend proof is claimed.

Builder typecheck/lint and26 unit/component cases pass. First browser attempt did not collect tests: Node24 rejected the chain package index's JSON deployment import without an import attribute. The harness now reads the committed deployment JSON with fs and imports the generated ABI directly; no product/package runtime changes or assertion changes. Original failure retained. Browser rerun is active; no formal grade/PR/merge yet.

The separate public read-ahead at block60421787 verified Fuji/code/linkage, not a wallet journey. No secrets, wallet, write transaction, migrations/deployments, flags, dependencies or art changes.
