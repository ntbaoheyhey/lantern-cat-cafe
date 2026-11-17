# QA execution anchor — 2026-11-17T01:15:57.643733+00:00
ACTIVE: Q1 production attempt1 launched with load guard; both frozen installs PASS. Q2 runbook static checks and QA-1 complete.
NEXT 1: Inspect `ps -p 13685; tail -n 5 work/v4qa/jobs/production-1.log` and Q1/build-1.json; preserve any missing-submodule failure.
NEXT 2: Once clone ready, detach nice15 node tools/v4qa/start-production.mjs 1 and record PID/log. Missing pinned Foundry submodules may produce reproducible setup failure; preserve it.
NEXT 3: After independent missing-submodule reproduction, run git submodule update --init --recursive ONLY in qa-clone; then production attempt2 and cold-run q1-cold-1.
RUNNING: production supervisor PID13685, /Users/bao/taskbar-hero-qa/work/v4qa/jobs/production-1.log; prepare-clone PID8110 finished; max2/current1.
LAST PUSH: c6be60677 checkpoint being verified; see work/v4qa/last-push.txt for full accepted SHA.
TARGET SHIP: b1e4398a8844fa51d2784760e92ed24528d13d2b
TARGET ART: 4109469bfef8 (origin fetched01:12UTC).
CHECKPOINT: Q0 complete; noSTOP,QA INBOX has no user instruction. No DEPLOYED seen yet.
LOAD: clone install deferred01:30:18UTC load1=11.85; next eligibility check01:35:18UTC; supervisor PID8110.
NOTE: clone is permitted generated-output sandbox; product files in QA tree remain untouched. Q2 shares fresh clone install evidence.
