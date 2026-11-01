Status: PREPARED; strict live gate RED, not full CXQ1 or a formal grade.
Ledger head: c5233042f420e48aa8226771968b4a2d81ba6510; inspection source: e68eee0be82a085999f565800bf50925046acf18; deployed head UNVERIFIED.
Commits/PR: none; coordinator owns ledger commit. Product untouched.
Harness: judge-path.mjs + gate-core.mjs; configurable repository/base URL/evidence; strict nine-stage order, 180s per size, write guard.
Checks: 10/10 controlled tests PASS; three node --check commands exit 0; evidence/verification.json records commands/exits/sizes/paths.
Live command: EVIDENCE_DIR=reports/cards/CXQ1-DEMO-PATH/evidence/live-baseline node reports/cards/CXQ1-DEMO-PATH/judge-path.mjs both; exit 1.
Live counts: 1280x720 and 1600x900 each landing FAIL + eight BLOCKED; 2 FAIL/16 BLOCKED; no downstream live assertions verified.
Observed: class picker + How to play modal, no landing hero/guest CTA; 24 HTTP responses, 0 browser/network errors, 0 transactions.
Timing/screenshots: 5542ms/79401 bytes and 5466ms/83233 bytes; screenshots reviewed; evidence/live-baseline/*/result.json.
Blockers: missing live landing; future CXC2 proof and CXU3 guest Forge/Market dependencies conflict with BASE0-first/full-path gating.
Next: coordinator resolves ordering with user; every P0/P1 postmerge needs both sizes and independent deployed-head mapping; no merge exception granted.
Runbook: RUNBOOK.md; exact baseline scripts: evidence/live-baseline/harness-as-run; baseline summary: evidence/live-baseline/summary.json.
Evidence: evidence/source-inspection.json, evidence/verification.json, evidence/manifest.json, logs/tests-final.log, logs/live-baseline.log.
Cleanup: browsers closed, no servers/ports/locks created, known_pids empty; runtime.json updated; DONE marks bounded preparation only.
