# QA execution anchor — 2026-11-17T02:15:36.731104+00:00
ACTIVE: Q2 reserve fault confirmed locally (QA8); rollback verified; now refresh source and recheck QA2/QA4.
NEXT 1: Stop only owned production PID13685 after verifying its command; fetch/pin clean scratch clone to4b4c41114ea9795820aa9204023e0954a9810f84; build production2 under load guard.
NEXT 2: After funding ends, stop only owned production PID13685, fetch/pin clone to4b4c41114ea9795820aa9204023e0954a9810f84, rebuild as production2 under load guard; preserve production1 evidence.
NEXT 3: Independently recheck QA2transfer/QA4phone on production2; finalize Q2 and checkpoint; then Q3 LEARN/export/scan.
RUNNING: production PID13685 work/v4qa/jobs/production-1.log; funding-fault PID33563 completed02:27:03UTC, rollback verified; max2/current1.
FINISHED: cold PID14675; post-cold PID21099 (completed02:09:07UTC); never relaunch or regenerate verified metadata.
LAST PUSH: 2026-11-17T02:20:58.056672+00:00 89f2049340217f0cde3028d46ddaf8397d2a9e49
TARGET SHIP runtime: b1e4398a8844fa51d2784760e92ed24528d13d2b; latest pinned SHIP 4b4c41114ea9795820aa9204023e0954a9810f84.
TARGET ART: 8a256755d4178741dafb9e3faf1957885d1a6a1f. Q4 sync1 at17Nov12UTC/latest14.
FIXTURE: owned production preview6200/API6201/Anvil6202 configured chain43113 (verified owned anvil/v1.8.6). Funding fault snapshots and restores this local fixture only.
Q1 ENDED02:05:57UTC: three paths,54successful local receipts;12JPEGs; transferFAIL; phone attributionQA4; desktop closed-audio flags false positives.
Q2 PASS: typecheck/Supabase/Forge/icons/build. FAIL: root7presentation tests (QA5ART), manifest, typography (triage ongoing).
Q2 metadata final:7942files/248741169bytes; endpoints and runtime/index preservation verified; completed evidence pushed.
OPEN: QA2transfer/QA4phone/QA6manifest/QA7typography SHIP; QA5tests ART. QA1fixed52aaaba39; QA3fixed4b4c4111.
PUBLIC: reserve candidate unconfirmed; no public transaction. Vercel upload-size concern conditional on plan/packaging.
CHECKPOINT: noSTOP/noQA pause/noactualDEPLOYED line at02:14UTC; inspect next checkpoint. Q2 timebox ends~03:23:48UTC.

Prior reserve attempt1 stopped before mutation on incorrect31337 assumption; preserved Q2/reserve-fault-reproduction.json. Attempt2 verifies owned process, Anvil identity and local receipt before changing balance.
