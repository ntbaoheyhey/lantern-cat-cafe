# Lane A6 non-negotiables
1. One agent; no subagents, parallel Codex or model-calling helpers. Local scripts/tests allowed.
2. Draft PRs only; no PR merge, deploy, main push, force-push, secrets or live DB/contract changes.
3. Work only in /Users/bao/taskbar-hero-cardrpg-a6; never write in other worktrees. Ports5960–5963, /tmp/cardrpg-a6-* only.
4. Original art/text only; NO new systems. Preserve Q0–Q12; look/feel/difficulty first; battles fully auto.
5. Published B merge commits allowed/required; B canvas/art/VFX/camera takes B, A rules/screens/HUD takes A. Keep A shell; no duplicate damage numbers.
6. Hard stops R-6 as tightened by NON-STOP below only; deadline2026-11-20 12:00 UTC. Never redo ticked items; check INBOX and STOP-A6 between items.
7. Read RULES/QUEUE/HANDOFF each item, after compaction/uncertainty, before git merge/push/branch, and every<=2h; TASK sections0/4 each item. Files win over memory.
8. Rewrite HANDOFF one section<=60 lines after each item/before long jobs; log steps with UTC/SHA; verify live paths/PIDs/SHAs; commit/push at least hourly.
9. Per item: types/lint/touched tests, inspect1440x900+1280x720 screenshots, scores/status/draft#438. Heavy jobs: disk check + shared timing.lock<=20min. No new sim tools/seed registries/hash ceremonies except prompt receipt.
10. Failed gates: reproduce/measure/smallest fix/verify, max3 attempts then simplify/log. User-only blockers recorded; continue other work. TASK preserves exact prompts.

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

11. USER11Nov: B transitions to lookV3D real3D with per-unit puppet fallback; A6 treats canvas as actor/event black box, never adds puppet-internal coupling. Unit-attached UI uses B manifest sockets; retain2D portraits/cards, merge published tips, combined<=40MB. Queue order unchanged.
