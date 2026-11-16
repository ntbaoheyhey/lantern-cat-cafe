# S8 production rehearsal — 5/10, gate open

The real production pilot completes seven steps with 18 RPC-verified receipts, zero path errors/popups/network failures and median boss 60 FPS. G-REHEARSAL still fails: initial uncached transfer is 26,411,893 bytes against 8,000,000, and ten complete passing runs have not been obtained.

- [Learning](../LEARN/S8.md): 11 sources, including one formal and eight web sources; measured comparison retained.
- [Build 2](production-build-2.json): shipping Vite configuration, explicit flags, origin-bound local API and disposable Anvil. Source `1e04ea112c4e0de4a7bbe69b7f4946a44ac4d6a8`. No development-only path.
- [Attempt 1](rehearsal-1.json): preserved CORS failure. The starter now verifies allowed preview origin 5998 and rejects mismatching 5994; authentication remains enabled.
- [Attempt 2](rehearsal-2.json) and [diagnosis](transfer-diagnosis-1.json): 225 uncached responses; observed/conservative initial bytes agree. Images account for 22,861,499 bytes, including 25 ART VFX pages totalling 12,827,018 bytes. Unit atlases also exceed the remaining budget.
- [Regression 2](regression-2/check.json): server 742 and rules 1409 pass; web 2663 pass, seven existing ART failures. Typecheck, three-fixture probe and build exit zero. Official class baseline gate remains false.
- [Open gate](../S11/rehearsal-open.json) and [ART request](../REQUESTS-TO-ART.md): selective encounter loading and bounded asset delivery require ART-owned changes; remeasure after the scheduled integration. No ART assets or presentation sources changed.

Score rationale: the real path, receipts, FPS and strict transfer measurement are evidenced; oversized delivery and insufficient passing repetitions prevent acceptance. Six screenshots total across attempts; no extra screenshot was taken for finalization. Runbook preparation was validated previously; public deployment/sponsored latency remain outside this local rehearsal.
