Help now has an On-chain proof tab for the deployed Avalanche Fuji RelicNFT and RelicMarket. It validates chain43113, reads deployment code, market linkage and active listings at one block, and shows at most10 events from500 recent blocks. Reads mount only when selected and use a30-second cache, including failures. Missing data and unsupported lifetime supply stay explicit; no wallet signing or transaction methods are used.

Validation on e54f0750644322dbdc40dffe389130a1f6fc736f: self-graded fresh A95/B96, zero auto-fails, all criterion floors passed.2423 unit/script cases,317 browser cases per size at1280×720/1600×900,140 changed-spec repeats per pass, strict UI/effects,12 A and10 B mutants pass. B used a clean checkout and different ports, tests before diff; it explicitly shares A's exact-head full matrix. Browser RPC fixtures are synthetic; separate public read-ahead verified the deployed addresses/code/linkage. Actual-main and live asset/health/phased validation follows merge.

No backend deploy, migration, contract, dependency, art, production flag, provider-setting or .github change. CXN3 #244 still requires the owner's deployed-source backup and tested restore path; it stays unmerged. CXU3 #252 remains an independent partial draft.

Decision: docs/decisions/cxc2-fuji-proof.md. Exact-head evidence and self-grades: ai/codex-mega-ledger, reports/cards/CXC2-FRESH/.
