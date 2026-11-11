# Lane B non-negotiables
1. One agent; no subagents/model-calling helpers/parallel Codex runs, paid services or new accounts. Local tools allowed.
2. Draft PRs only; no PR merge, deploy, main push, force-push or secrets; preserve all old sources and unreviewed GLBs.
3. Never write in other lanes; main checkout fetch/worktree-add only; authorized disposable preview stays unpushed; never merge A6 into published B.
4. ALL units are real 3D rigged models + 3D VFX (user 11 Nov); raw generated meshes never ship; puppets = per-unit fallback only; size standard SCALE-STANDARD.md is law. Original art/imagegen with provenance only; no other games' art.
5. Top unfinished QUEUE item; never redo ticked work. Check INBOX/STOP-B/fetched A6-OUTBOX each item; publish batches to draft #427 and continue.
6. R-6 hard stops only as clarified below; deadline 2026-11-20 12:00 UTC. Max3 repairs per issue, then simpler real3D PARTIAL>=7.0 and FIXLOG; no puppet final.
7. Ports5920–5923 only; heavy tools nice10/shared timing.lock <=20min; masters ~/art/look-v3; evidence <=120MB; combined demo <=40MB.
8. 3D acceptance:8views+concept,both-size battle,4poses,no defects,yaw-20/0/+20 proof;mean>=7.5/each>=6.5;scale tests,type/lint/touchedtests;parity per batch.
9. Exact original/addenda in PROMPT.txt; byte count/SHA at STATE top. HANDOFF one section <=30lines, rewrite per item/before long jobs with NOW/NEXT3/RUNNING/DONE+SHA/ISSUES/DECISIONS.
10. PROGRESS.log UTC/item/result/SHA per finished step; commit/push lane files <=60min. Files override memory; read live paths/PIDs/SHAs/numbers.
11. Read RULES/QUEUE/HANDOFF/PROMPT-3D-SWITCH-2026-11-11.txt each item/after compaction; before git merge/push/branch and <=2h; new3D addendum overrides 10Nov fixed puppet route.

ADDENDUM FROM THE USER (10 Nov): DO NOT STOP UNTIL THE WORK IS DONE. This is not a pause and not a new task. Append it word for word to your RULES.md and to your saved prompt file (TASK.md for A6, PROMPT.txt for B), commit + push, then keep working the current queue item in the same turn.

NON-STOP RULE (overrides any habit of ending a turn):
1. You may end your turn ONLY in these cases:
   a) Every QUEUE.md item is ticked, the final report is pushed, AND the lowest self-score row has been improved until the deadline 2026-11-20 12:00 UTC.
   b) The deadline 2026-11-20 12:00 UTC is reached (push the report with what exists, then stop).
   c) A STOP file exists in your worktree root (STOP-A6 for lane A6, STOP-B for lane B), or the user writes "dừng", "stop", "pause" or "khoan".
   d) Every remaining item is BLOCKED-USER (needs payment, a login only the user can do, a PR merge, a deploy, or disk still full after cleanup). Each such ask must be written in NEEDS-USER.md and pushed first.
2. Everything else is NOT a reason to stop: a finished item, a commit, a push, a PR update, a report, a checkpoint, a PARTIAL result, a self-score, a failed test, a slow job, a long wait for a lock, the other lane being behind, or a question in chat. Never end with a summary, "next steps", or a question to the user while unfinished items exist.
3. A blocker on one item: write it in NEEDS-USER.md (if user-only) or FIXLOG.md (if technical, after max 3 repair attempts take the fallback), mark the item, and IMMEDIATELY start the next unfinished item.
4. While waiting for a long job (render, build, E2E, lock): work on another unblocked item or on the lowest-scored screen/unit; do not idle and do not end the turn.
5. Before you are about to end a turn, check this list: open QUEUE.md; if any item is unticked and not BLOCKED-USER, do not end the turn, start that item instead.
6. User messages: answer in 1-3 Vietnamese lines in STATUS-VI.md (and briefly in chat), add any correction to QUEUE.md, then continue working in the same turn.
