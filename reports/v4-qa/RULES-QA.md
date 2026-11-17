# V4 QA hard rules
1. Worktree /Users/bao/taskbar-hero-qa; branch codex/v4-qa-2026-11-17 ONLY; no PRs or merges to main.
2. Write only reports/v4-qa/**, tools/v4qa/**, work/v4qa/**; scratch qa-int, qa-clone, snapshot allowed.
3. Never edit product, assets, audio, docs, config, package files or other lanes' reports. Findings go to owning lane.
4. NEVER generate/draw/edit images. Running-game screenshots/recordings allowed.
5. No deploy/login/settings, remote repo creation, secrets/private keys, mainnet spend, or Fuji writes.
6. Local Anvil writes and public Fuji reads allowed; local product guest transactions only with local config.
7. Independent Playwright journeys only; SHIP/ART harnesses may inform selectors, never supply QA verdict.
8. Focus five-minute judge Technical25/Avalanche25; screening weighting is planning assumption, not verified rule.
9. Each Q starts with <=20min LEARN; honor item timeboxes; never rerun a closed check on unchanged target SHA.
10. Checkpoint each step and <=20min: commit+push owned files only; push retries10/20/40/80s.
11. Resume: status count, commit+push any owned WIP, then read this card and HANDOFF only; run NEXT1.
12. Jobs >2min detached nice15, logs work/v4qa/jobs; max2; immediately record PIDs/logs; don't watch foreground.
13. uptime before heavy work; load1>9 means light work then recheck after5min; timings shared-machine, indicative.
14. Ports6200-6209 only; never stop/kill/reuse another lane's ports/processes.
15. Each command <=40lines/3KB; no cat >100lines; summary tests; no secret values; no image/base64 dumps.
16. Committed QA reports <25MB; raw media in work; <=12 JPEG screenshots <=200KB each per run.
17. Findings newest first/max10open per lane; reproduce independently; recheck open findings on owner tip changes.
18. At checkpoints inspect STOP-V4QA, INBOX, UTC, trigger schedule and SHIP deployment inbox (read-only).
19. Valid finals: STOPPED: STOP-V4QA present; STOPPED: user pause word in INBOX; WAITING FOR END 2026-11-29T12:00Z.
20. Done/commit/push/compaction is not stop: update HANDOFF and continue next item.
21. Triggers UTC:17Nov12 sync1/latest14;18Nov09 pre-R2;19Nov10:30+12 freeze;20Nov DEPLOYED;22-29daily;29Nov12end.
22. No subagents unless user/applicable instructions explicitly request them; no automated future task tracking.
23. Order copy: reports/v4-qa/WORK-ORDER.txt; read only current item by grep+sed after compaction.
