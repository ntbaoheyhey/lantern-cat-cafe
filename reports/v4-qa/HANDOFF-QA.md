# QA execution anchor — 2026-11-17T01:15:57.643733+00:00
ACTIVE: Q1 production setup waiting on clone install load guard; Q2 static audit complete/QA-1 filed. Runtime suites not launched.
NEXT 1: At01:35:19UTC run `tail -n 5 work/v4qa/jobs/prepare-clone-resume1.log`; then inspect Q2/fresh-clone.json ended and uptime.
NEXT 2: Once clone ready, detach nice15 node tools/v4qa/start-production.mjs 1 and record PID/log. Missing pinned Foundry submodules may produce reproducible setup failure; preserve it.
NEXT 3: After independent missing-submodule reproduction, run git submodule update --init --recursive ONLY in qa-clone; then production attempt2 and cold-run q1-cold-1.
RUNNING: prepare-clone resume PID8110, /Users/bao/taskbar-hero-qa/work/v4qa/jobs/prepare-clone-resume1.log; previous race/failure logs preserved; max2jobs/current1.
LAST PUSH: c6be60677 checkpoint being verified; see work/v4qa/last-push.txt for full accepted SHA.
TARGET SHIP: b1e4398a8844fa51d2784760e92ed24528d13d2b
TARGET ART: 4109469bfef8 (origin fetched01:12UTC).
CHECKPOINT: Q0 complete; noSTOP,QA INBOX has no user instruction. No DEPLOYED seen yet.
LOAD: clone install deferred01:30:18UTC load1=11.85; next eligibility check01:35:18UTC; supervisor PID8110.
NOTE: clone is permitted generated-output sandbox; product files in QA tree remain untouched. Q2 shares fresh clone install evidence.
