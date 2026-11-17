# QA execution anchor — 2026-11-17T01:15:57.643733+00:00
ACTIVE: Q1 own production launcher+journey syntax verified; waiting guarded frozen installs. Q2 static runbook audit next.
NEXT 1: python3 tools/v4qa/runbook-audit.py (after authoring); record env names/paths only; inspect prepare-clone-attempt3.log at01:22:45UTC.
NEXT 2: Once clone installs finish, detached nice15 node tools/v4qa/start-production.mjs 1; record PID/log immediately.
NEXT 3: Once build-1.json ready, detached nice15 node tools/v4qa/cold-run.mjs q1-cold-1; then Q2 safe local checks.
RUNNING: prepare-clone resume PID8110, /Users/bao/taskbar-hero-qa/work/v4qa/jobs/prepare-clone-resume1.log; previous race/failure logs preserved; max2jobs/current1.
LAST PUSH: c80ecb1d09cf86c9c30b8586db7b0dfdba4e81da verified; current harness edits pending checkpoint.
TARGET SHIP: b1e4398a8844fa51d2784760e92ed24528d13d2b
TARGET ART: 4109469bfef8 (origin fetched01:12UTC).
CHECKPOINT: Q0 complete; noSTOP,QA INBOX has no user instruction. No DEPLOYED seen yet.
LOAD: last01:14UTC18.21; initial01:12UTC11.75. Earliest nextheavy check01:17UTC.
NOTE: clone is permitted generated-output sandbox; product files in QA tree remain untouched. Q2 shares fresh clone install evidence.
