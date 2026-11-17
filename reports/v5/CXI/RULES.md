# CXI V5 operating card
1. Worktree /Users/bao/taskbar-hero-chain; branch codex/v5-int-2026-11-17; ports 6300-6309.
2. Disk is truth. Read RULES + HANDOFF before each card, after resume/compaction, and every 60 min.
3. Keep RULES <=25, HANDOFF <=30, STATUS-VI <=12 lines; QUEUE records timestamps/evidence; append PROGRESS.
4. REV4: R0 then I2..I6/REFILL; USER08:12: dependency missing => BLOCKED-ON and next unblocked/refill immediately; never idle-wait.
5. Checkpoint every step and <=20 min: explicit owned git add paths; commit; push branch.
6. Push retries 10/20/40/80 seconds, max four retries; never git add -A, git add ., or commit -a.
7. Jobs >2 min: nohup nice -n 10, logs work/v5/CXI/jobs/, max two; immediately record PID/log in HANDOFF.
8. At load average >10 do light work first. Commands output <=40 lines; inspect max four images at once.
9. Films: inspect contact sheets (fps=4,scale=480:-1,tile=4x3), not individual frames.
10. Respect card time boxes; retain passing/flagged work, revert own failed changes, log TIMEBOX, move on.
11. No extra gates/metrics, history secret scans, onset/latency measurements, snapshots/exports, FPS studies.
12. Do not reverify unchanged verified SHAs; max two attempts at the same fix without a new idea.
13. Only cross-session channel: /Users/bao/taskbar-hero-mailbox. README read at setup.
14. Each checkpoint read new INBOX-CXI, DELIVERIES, USER lines; newest USER instruction wins.
15. CXI alone rewrites BOARD/OWNERSHIP; other inbox messages are one echo >> line in README format.
16. STOP-ALL/STOP-CXI: commit and push owned WIP, update HANDOFF; final STOPPED: <path>.
17. Owner-only: secrets/keys/.env values, hosting env/deploys, production DB, funded Fuji, contracts/** edits/deploys, main merge, submission.
18. Prepare owner commands in NEEDS-USER-VI.md; never read/print keys. Do not generate images.
19. Ownership is mailbox OWNERSHIP.md; request changes outside owned paths; preserve all old untracked lane work/history-*.
20. TOOL-PROPOSALS: log free tools before use; USER standing approval allows immediate use. No paid tools, login, account, key, payment, or sudo.
21. Install locally/user-level only; CXI owns dependency edits. Never pass third-party/reference art to generators.
22. Evidence in work/v5/CXI; reports small (<=300 KB/commit), <=6 contact JPGs/card, <=400 KB each.
23. REV4 CXI+AGS SHIP, CXV+AGV VISUAL; read LEARN/INDEX each card; before a new KIND, study Chinese+English15–30min, save>=3URL sources+concrete steps in own LEARN note and append INDEX; PULSE AGS hourly. NO FREEZE/END TIME. Merge new READY branches at least every 3h; green merge windows tag v5-m1.N + BOARD per USER08:12; M2/M3 remain merge points.
24. DONE only with printed proof: queue empty incl BLOCKED, all refill DONE, all READY merged/rejected+REQ, all inbox REQ ACK+DONE, newest tag suite green and all transfer <=8MB; otherwise keep working. STOP rule above wins.
