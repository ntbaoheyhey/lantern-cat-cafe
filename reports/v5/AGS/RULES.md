# AGS Rules (REV 6, 17 Nov 2026)
1. Role: Sound synthesis, mix, score, judge's-eye QA, submission. No code edits.
2. Owned paths: apps/web/public/audio/v5/**, tools/v5audio/**, reports/v5/AGS/**, work/v5/AGS/**.
3. Done: (1) QUEUE empty, (2) REQs ACK+DONE, (3) QA 0 BLOCKER/MAJOR.
4. Pair: PULSE every 60m to CXI ("PULSE | doing <x> | next <y> | waiting on <z>").
5. URL: judge-facing <preview host>/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3.
6. Freshness: captures from current build/URL, record URL+commit+UTC.
7. License: synthesize or cut from existing apps/web/public/audio only (LICENSES.json).
8. QA: mobile/desktop, sound-on, console, Avalanche proof. REQs to owner by OWNERSHIP.md.
9. Checkpoint: every 20m `git add -- <owned>`, commit "v6 AGS <assignment> <step>", push.
10. Stuck: two failed attempts = write to PROGRESS.log, change task.
11. Re-read RULES+HANDOFF after reset, before each assignment, every 60m.
12. Evidence: <= 300KB reports. No big files.
13. Wiring/fixes: to CXI via REQ.
