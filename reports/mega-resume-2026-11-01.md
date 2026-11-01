TASKBAR HERO MEGA MISSION - RESUME (balanced: one long session, coordinator does the work, few subagents, small context, ship by priority)
The user RESUMES the mission now. This message is the explicit resume the pause note asks for. The pause, the heartbeat pause and "do not resume" lines in the state file are lifted by this message.
Model: best available (the one in the state file, gpt-6-astra / ultra / priority; never downgrade) | Effort: highest | Speed: priority / 1.5x | Tokens do not matter; context size does.
Repo ntbaoheyhey/taskbar-hero (private). Author ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>. Every commit ends " [skip ci]". No direct push to main, no Actions, no .github changes.

=== 0. SOURCE OF TRUTH ===
Read, in this order, with small reads (head / grep / sed -n ranges, never the whole 180 KB at once):
 1. reports/MEGA-STATE-AND-RULES-2026-11-01.md (your own consolidated state; sections 1-11 fully, appendices A/B only for the item you are working on). If you saved it elsewhere, find it in the ledger worktree /Users/bao/.codex/worktrees/mega-ledger/taskbar-hero.
 2. reports/MEGA-CURRENT-HANDOFF.md, mega-ledger.md, mega-scorecard.md, mega-runtime.md, mega-checkpoint-policy.md.
All rules in the state file section 9 stay in force (authority, two independent graders >= 92 with the C1/C2/C6/C7 floors and auto-fails, G1-G7, serial merges, default-OFF flags, safety guardrails, original content, desktop 1280x720 + 1600x900, evidence honesty). This prompt changes only what sections 1-6 below say.

=== 1. CONTEXT WITHOUT NEW SESSIONS (replaces any "start a new session per batch" rule) ===
Stay in THIS session for the whole mission. Do not open new sessions on purpose. Keep it alive like this:
 - The user's latest preference (1 Nov 10:35): FEW SUBAGENTS. You, the coordinator, do most of the work yourself: build, fix, verify, write reports, merge. Spawn a worker ONLY when it is truly needed:
     a. the two independent graders per item (mandatory: a grader may never be you or the builder), and a third grader when the two differ by more than 5;
     b. a long-running check that would otherwise block you for a long time (e.g. a full e2e repeat suite) - run it as a detached background process that writes to a log file, not as an agent, whenever possible;
     c. at most one parallel builder, only when two P0 items are independent and waiting would cost more than a day.
   Never more than 2 workers at once (1 if any HTTP 429 appeared in the last 30 minutes; back off 2, 4, 8 minutes, same model, never downgrade). Never spawn a worker just to write a handoff, a report or a summary.
 - Each worker you do spawn gets a self-contained brief file (reports/cards/<card>/brief.md: spec excerpt, paths, ports, tests, done-definition) and returns ONLY reports/cards/<card>/RESULT.md (max 15 lines). Full logs stay in files. Never use the CLI -o option on a file a worker writes itself (it overwrote result.md before); point -o at logs/last-message.txt.
 - Because you do the work yourself, protect your own context: run every build/test with output redirected to a log file (cmd > reports/<id>/logs/<step>.log 2>&1; echo exit=$?) and read only the exit code plus tail -n 30 or grep -E "error|fail|FAIL". Read source with line ranges or grep first. Work on ONE item at a time and finish its checkpoint before starting the next.
 - Never cat long files or logs; never paste diffs or test output into your context; read RESULT.md and tail -n 20 only.
 - CHECKPOINT after every milestone (card done, grade recorded, merge, failure) and at least every 30 minutes: rewrite reports/MEGA-CURRENT-HANDOFF.md as a SHORT file (max ~80 lines: true state per item, cards in flight with PID/worktree/ports, last merged commit, next 3 actions) and push the ledger branch. Run your existing checkpoint.py for the backup snapshot.
 - Rely on the auto-compaction you already configured (model_auto_compact_token_limit = 64000). After every compaction, or whenever you are unsure what you were doing, re-read MEGA-CURRENT-HANDOFF.md and the ledger table before acting. Files are memory; your recollection is not.
 - Waiting on a background process or worker: poll with sleep 120 + test -f DONE (or check the PID); do not stream its output.
 - Fallback only if this session truly dies (no response, transport error that does not recover): the user opens a new session with this same prompt; section 0 + MEGA-CURRENT-HANDOFF.md are enough to continue. Do not plan for that; just keep the handoff current so it is possible.
 - A transport error or 429 is not context overflow: retry the same step after a back-off, check PID/cwd/ports and persisted results first, never duplicate a commit, PR, merge or release.

=== 2. FIRST STEPS NOW ===
 1. Check processes and ports: confirm CXU5's worker really stopped (it had not acknowledged the pause). Nothing from before the pause is still working unless a live PID proves it. Refresh the CXU5 backup snapshot after it is confirmed stopped.
 2. BASE0 to MERGE first (main is red without it, so every later gate depends on it): finish the open lines from state section 8 steps 3-7 on exact head e68eee0 (or its successor), push the report, two fresh graders, G1-G7, merge PR #246, re-test main + live. Do this before any new build work except the parallel work allowed in section 3.
 3. Then merge the already-built items in this order, each through the full gate: FXRB #243, CXP1 #240, CXL1 #248, ART1 #247, CXN3 #244, CXU5 #249, CXU4 (commit + PR first). Merge origin/main into each (no history rewrite) before verifying.

=== 3. PRIORITY ORDER FOR EVERYTHING ELSE (contest-driven; replaces the flat queue order where they differ, dependencies still apply) ===
Contest: UniHack, Demo Day 30 Nov 2026; planning deadline 21 Nov (UTC+7). Screening = Technical 25 + Avalanche Integration 25; final = Creativity 15, Impact 15, Pitch 10, UI/UX + Demo 10. A merged, demo-able core beats many half-graded extras.
 P0 (target: merged by 12 Nov) - BASE0, FXRB, CXU4, CXU3 (Forge + Market), CXU5, CXC2 (on-chain proof panel: shows the Fuji RelicNFT 0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D / RelicMarket 0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93 proof clearly, this is the Avalanche score), CXN3 + a new card CXN3-FIX for its 10 live probe failures (oversized bodies return 401 instead of 413/400, boss timeouts): find the root cause, fix in function source with tests, release only through the state file's additive/rollback-documented path or record it as an optional user step.
 P1 (target: merged by 18 Nov) - CXR1 + CXR2 over every merged screen, CXQ1 full play-through (wallet-free + throwaway Fuji wallet mint/list/buy), CXS1 security docs, CXS2 submission pack (prepare only; judging-criteria mapping, demo script, pitch outline, screenshots).
 P2 (merged by 21 Nov if green, behind default-OFF flags) - CXP1 UI (CXP2), CXL1 UI (CXLU1), ART2, CXN4, CXN5.
 P3 (only after P0-P2 are merged and main is green; never block P0-P1 for them) - CXLU2, CXL2, CXG1, CXG2, ART3. After 25 Nov: no new server-side behaviour turned ON, bug fixes and polish only.
 Re-check already-merged AGR0, AGR1, AGR2, CXR0, CXN1, CXN2, CXC1, AGN1 inside CXR1's verify, not as separate graded items, unless CXR1 finds a failure.
While a P0 item waits on its graders, you may work on the next item yourself, but merges always go P0 first.

=== 4. EFFICIENCY WITHOUT LOWERING THE BAR ===
 - Keep two independent graders and every threshold. To spawn fewer graders, one grader may score up to 3 items in one card (each scored separately, the grader built none of them); group items that are ready at the same time.
 - Reuse one fresh-worktree full-suite run per exact head for verifier AND graders' raw evidence only if the grader re-runs at least: typecheck, lint, unit tests, the item's changed specs with repeats at both sizes, and its own mutants. Any head change = new evidence.
 - Fix inherited baseline failures once (BASE0), not inside every item.
 - Shared resources: one e2e lock per port block, distinct ports for graders, kill only processes you own.

=== 5. ADDITIONS TO THE PLAN ===
 - Add CXN3-FIX (section 3 P0) to the ledger and task cards.
 - Add a "Demo path" card under CXQ1: one scripted 3-minute judge path (landing -> guest -> class -> idle loop -> boss -> forge -> bag -> on-chain proof -> market) that must pass at both sizes on live after every P0/P1 merge. Its failure stops further merges.
 - tbhindex.com and the research ZIPs are user-authorized REFERENCE for structure and mechanics only; never copy names, art, text or tables; never feed third-party art to a generator; record sources in reports/reference-usage-2026-11-01.md.
 - The living-draft rule stays: no item is "final".

=== 6. REPORTING ===
Keep MEGA-FINAL-REPORT.md current at every checkpoint (living, not a completion claim). When P0 is all merged, and again when P1 is all merged, write a short milestone section in it for the user: what is merged and live, scores, decisions made, optional user steps. Optional user steps live in reports/OPTIONAL-USER-STEPS.md and block nothing.
When everything that can be merged is merged (or on 28 Nov at the latest): REGRESSION card, final report sections as the state file describes, and stop. Final answer: ledger table, one line per item (PR, score, merged commit, live state), path to MEGA-FINAL-REPORT.md.
