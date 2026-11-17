# QA execution anchor — 2026-11-17T01:15:57.643733+00:00
ACTIVE: Q1 production attempt1 launched with load guard; both frozen installs PASS. Q2 runbook static checks and QA-1 complete.
NEXT 1: Inspect Q1/build-1.json ready; when true detach nice15 node tools/v4qa/cold-run.mjs q1-cold-1 and record PID/log.
NEXT 2: Review independent cold-run outputs/screenshots; complete Q1 findings+scorecard; no missing-submodule finding (Forge setup passed).
NEXT 3: Run tools/v4qa/local-checks.py as detached nice15 after cold job completes; capture production artifact sizes and candidate withdrawal/funding checks.
RUNNING: production PID13685 work/v4qa/jobs/production-1.log; cold-run PID14675 /Users/bao/taskbar-hero-qa/work/v4qa/jobs/q1-cold-1.log; max2/current2.
LAST PUSH: c6be60677 checkpoint being verified; see work/v4qa/last-push.txt for full accepted SHA.
TARGET SHIP: b1e4398a8844fa51d2784760e92ed24528d13d2b
TARGET ART: 4109469bfef8 (origin fetched01:12UTC).
CHECKPOINT: Q0 complete; noSTOP,QA INBOX has no user instruction. No DEPLOYED seen yet.
LOAD: clone install deferred01:30:18UTC load1=11.85; next eligibility check01:35:18UTC; supervisor PID8110.
NOTE: clone is permitted generated-output sandbox; product files in QA tree remain untouched. Q2 shares fresh clone install evidence.
