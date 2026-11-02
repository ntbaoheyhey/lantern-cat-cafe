# CXC2 — active frontend builder

Built independently on main2847e9a after CXU3 reached PARTIAL. The Help proof tab uses explicit lazy mounting and screen-active query gating, public Fuji client only, RPC chain validation, a fixed500-block/10-event window and a30-second cache that coalesces in-flight and failed reads. Facts remain separate when individual RPC reads fail; no minted total or backend proof is claimed.

Builder typecheck/lint and26 unit/component cases pass. First browser attempt did not collect tests: Node24 rejected the chain package index's JSON deployment import without an import attribute. The harness now reads the committed deployment JSON with fs and imports the generated ABI directly; no product/package runtime changes or assertion changes. Original failure retained. Browser rerun is active; no formal grade/PR/merge yet.

The separate public read-ahead at block60421787 verified Fuji/code/linkage, not a wallet journey. No secrets, wallet, write transaction, migrations/deployments, flags, dependencies or art changes.

Builder complete:26 focused cases and4 browser cases pass. The wire expectation now includes viem topics=[], and the virtual clock is installed before app initialization so the reader and query cache use the same clock. Screenshots reviewed at both sizes are explicitly mocked-RPC evidence. Formal A is frozen ate54f0750644322dbdc40dffe389130a1f6fc736f, PID62738, sequential core→mutants→UI→repeats→full317×2. No passing score/PR/merge.

## Fresh grader A complete
Self-graded (fresh pass)95/100 on e54f075, zero auto-fails.2423 unit/script cases pass (2 inherited expected failures/11 skips unchanged),317 browser cases per size,140 changed-spec repeats,12 mutants,36 strict UI and20 effects checks pass. Both screenshots inspected and under200KiB; they are mocked RPC fixtures. The release-only read RPC guard separately passed15 controls. B runs tests first on clean /private/tmp/tbh-cxc2-fresh-b, PID67091, different ports; no merge yet.

Repeat-count correction: redesign-shell contributes6 cases, so the14-case changed set repeated5 times produced70 passes per size,140 total (the earlier prose said120). Original command logs were correct and unchanged.

## Fresh grader B complete
Self-graded (fresh pass)96/100 on the same e54f075, tests first then full diff review. Fresh core2423,140 repeats,38 classic cases,10 distinct mutants and UI36/effects20 pass. A317×2 is explicitly shared; no duplicate full B matrix claimed. A95/B96, lowest95, zero auto-fails and all floors pass. Ready for match-head squash, then actual-main/live validation.

## Merged; release acceptance pending
PR253 merged as39e74d834aa246b8182b72bac1b610e4c985f574. Tree85267f5fb3c7c6808a50331743a6746ddb1ed2dc equals the exact reviewed feature tree; author/email and skip-ci suffix verified. Local main fast-forwarded while preserving untracked.worktrees/. Actual-main and then live asset/health/11-stage public-proof validation run sequentially in /private/tmp/tbh-main-after-cxc2, PID70921,4980–4983. No subsequent merge before acceptance.

## Release harness finding; further merges stopped
Actual main core and317/317 browsers at both sizes passed.32/32 live assets match and22 legacy health checks pass. The first11-stage live run reached the proof panel at both sizes but failed because its strict request guard blocked viem’s Multicall3 eth_call batch, leaving linkage unavailable. This was not an application write attempt. The diagnostic kept eth_call blocked and recorded only public request shapes: canonical aggregate3 at Fuji Multicall3, two calls.

The corrected guard decodes/re-encodes aggregate3 and accepts only exactly the two expected Market getters at the expected target/block, with no value/extra fields/trailing bytes.22 positive/negative guard controls pass, including transaction/signing rejection. Original failed paths are retained. Live-r2 repeats unchanged product/UI assertions with fresh before/after asset identity. No further merge until it passes.

## Public RPC range limit found; release repair required
The corrected11-stage path passed at both sizes, with real14200/7713-byte deployments, matching linkage,32/32 asset identity,22 health checks and zero errors/transactions. However, both snapshots honestly showed recent events unavailable. A bounded public diagnostic identified JSON-RPC-32602: this endpoint allows at most100 blocks, not500. The otherwise-identical100-block request succeeded with an empty result.

The provisional core-only acceptance is superseded; CXC2 is not marked DONE. Release repair round2 in /private/tmp/tbh-cxc2-rpc-fix tightens the window/UI/docs/exact-bound assertions to100 blocks. Fresh gates and actual-main/live verification are required before unrelated merges resume. No provider setting or backend change is needed.

## Release repair fresh A complete
Head df83851f5f653f25072f116c6bfa9f3ad02c7936 passes fresh A96: core2423,317 browser cases per size,40 changed-spec repeats across both sizes and12 mutants. The five-file diff only tightens the window/label/decision/exact request oracles. Clean fresh B is now tests-first in /private/tmp/tbh-cxc2-rpc-fix-b; no repair PR/merge yet. The post-repair live probe will additionally require recent-event availability, including a legitimate empty result.

## Release repair fresh B complete
Fresh B96 on clean df83851, tests first then full five-file diff. Core2423,40 both-size targeted repeats,38 classic cases and10 distinct mutants pass; A317×2 is shared on the identical head. A96/B96 meet all floors. The stricter100-block live guard passes23 controls and now requires available recent-event results. Fix PR and actual-main/live verification remain.

## Range repair merged; strict release verification active
PR254 merged as666088ce06ce0c03485f46371b8fd7c22a99e386. Its tree equals reviewed df83851 exactly; requested author/email/skip-ci suffix verified. Actual-main and live checks run sequentially in /private/tmp/tbh-main-after-cxc2-range, PID82005,5060–5063. The live probe now requires an available100-block event result as well as code/linkage/asset/health proofs. Unrelated merges remain held until acceptance.

The first post-fix main browser attempt used5060/5061, which Chromium blocks as unsafe SIP ports. Failures occurred before application loading (46 other cases passed), not as product assertions. Core current-head checks had passed and remain valid. The entire unchanged browser matrices/live gate now run on proven free4980–4983; no browser security override, skips or retry-count changes. The invalid-port attempt remains recorded.
