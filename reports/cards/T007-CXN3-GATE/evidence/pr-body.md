CXN3 updates the cutover runbook, catalog-only schema inventory, and strict unsigned probes for all nine v2 routes. Current main is merged into this branch; stale BASE0 import-map warnings are corrected.

Status: BLOCKED / draft. Head db0f9d64c408825a832d808bc31cfd88f1c3a014. PR #250 is merged, but its deployed backend identity is not established. All nine live functions report an October 31 deployment timestamp. A read-only catalog query found all 17 expected objects present. Supabase refused a complete source export with UnsafeFunctionDownloadPathError; the partial export cannot support a verified rollback. No backend release, migration, Vercel flag change, or live --v2 check was attempted.

Local checks completed on the corrected head: typecheck, lint, full unit suite, classic build, links, integrity/secret audit, 11/11 mutation checks, full 1600x900 browser suite (289), and the safe FORCE_ALL PR verifier (full 1280x720 browser suite, 289; Forge 96). These are preflight results, not a completed two-pass score/merge gate. The inherited 2 expected failures/11 skips remain disclosed.

T007 evidence and the exact owner recovery step: [report](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-mega-ledger/reports/cards/T007-CXN3-GATE/REPORT.md) and [optional user steps](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-mega-ledger/reports/OPTIONAL-USER-STEPS.md). Historical results remain in [the original report](reports/n3-cutover-truth.md). The first local browser run was disrupted by a concurrent root build; its 20 failures are retained separately from the clean, zero-retry reruns.

Do not merge until rollback readiness and the remaining full gate are complete. VITE_GAME_V2 settings stay unchanged. Run the deployed --v2 check only after #244 merges.
