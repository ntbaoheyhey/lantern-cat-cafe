# Lane B non-negotiables
1. One agent only; no subagents, model-calling helpers, parallel Codex runs, paid services, or new accounts.
2. Draft PRs only; no PR merge, deploy, main push, force-push, or secrets.
3. Work only in Lane B and the authorized disposable preview; never write in another lane's worktree.
4. Main checkout allows fetch/worktree add only; preserve all existing work, sources, receipts, and unreviewed GLBs.
5. Original art only; every cat, enemy, and boss is a 2.5D puppet from the original concepts.
6. No native image-to-3D roster generation; built-in image generation is allowed with tool/prompt/date provenance.
7. Never reference other games' art in generation.
8. Never merge A6 into the published B branch; A6 merges B. Disposable A6 preview stays local and unpushed.
9. Work the top unfinished QUEUE item; never redo ticked items; after completion commit/push, update draft #427 and STATUS-VI, immediately continue.
10. Check INBOX, STOP-B, and fetched A6-OUTBOX between items. A question is not a pause.
11. Only R-6 stops apply: explicit pause/STOP-B, deadline, or genuine user-only blockers after skipping to all other work.
12. Queue completion requires a pushed report, then continued improvement of the lowest score until the deadline.
13. Deadline: 2026-11-20 12:00 UTC; push the current report and stop then.
14. Failed gate: reproduce, measure, smallest fix, verify; maximum 3 attempts, then good simple fallback and FIXLOG.
15. Ports 5920–5923 only; never touch A6 ports/processes; heavy work nice 10 under shared timing.lock, lease <=20 min.
16. Large masters stay outside git in ~/art/look-v3; git evidence <=120 MB; combined demo <=40 MB.
17. Per unit: battle/concept comparison, motion sheet, face/HP check, score >=7.5; type/lint/touched tests; full parity once per batch.
18. PROMPT.txt contains the complete original plus exact addenda; record byte count and SHA-256 at top of STATE.md.
19. HANDOFF is ONE section <=60 lines, rewritten after each item and before long jobs: NOW, NEXT 3 actions, RUNNING, DONE with SHAs, KNOWN ISSUES, DECISIONS.
20. Append UTC/item/result/SHA per finished step to PROGRESS.log; commit and push lane files at least every 60 min.
21. Re-read RULES, QUEUE, HANDOFF at each item, after compaction/uncertainty, before git merge/push/branch, and every <=2 h.
22. Re-read PROMPT sections 0 and 4 at each queue item. With no memory read RULES, HANDOFF, QUEUE, then full PROMPT.
23. Files override memory; read current paths, PIDs, SHAs, and numbers from files/system; do not infer from recollection.
