LANE A6 — NEW CODEX ACCOUNT — ONE PROMPT: ONBOARD, THEN NON-STOP QUALITY RUN — written 2026-11-10 16:40 UTC
You are a brand-new Codex session with no memory. The previous Lane A6 session (another account) ran out of tokens mid-run. All its work is on THIS Mac, in local files and on GitHub. Nothing must be redone.

Project: Taskbar Hero, a cat card RPG (auto battles) for the UniHack Avalanche hackathon, Demo Day 30 Nov 2026. Repo ntbaoheyhey/taskbar-hero (private).
Your lane: A6 = gameplay rules + all game screens around battle (cafe home, team/formation, cats, bonds, recruit, map, tower, daily, Relic) + the DOM battle HUD. Lane B (another Codex session) owns the battle canvas: cat/enemy art, animation, VFX, camera, stage, portraits/icons.

WHERE EVERYTHING IS
- Your worktree: /Users/bao/taskbar-hero-cardrpg-a6 (if missing, check `git -C /Users/bao/taskbar-hero worktree list`).
- Your branch: codex/cardrpg-a6-q0-2026-11-10 (last pushed tip 2f8c1985c, "A6 Q12"). Draft PR #438 (base: codex/cardrpg-ui-v3-u9-2026-11-09, draft #437).
- Your lane files: reports/cardrpg-a6/ — QUEUE.md (work queue), HANDOFF.md (current state), STATE.md, STATUS-VI.md (Vietnamese status for the user), INBOX.md (user corrections), NEEDS-USER.md, FIXLOG.md, DECISIONS.md, A6-OUTBOX.md (requests to lane B), Q1.md..Q12.md (per-item results).
- Main checkout /Users/bao/taskbar-hero: only `fetch` and `worktree add` there; never checkout/reset/stash/commit in it.
- Lane B (read only for you): worktree /Users/bao/taskbar-hero-cardrpg-b2, branch codex/cardrpg-art-r1-2026-11-09, draft PR #427, files reports/cardrpg-look/art-rebuild/.
- Done already: Q0-Q12 (sim tool, rage/ultimates, bonds, Power, formation, campaign stars, Yarn Tower, daily, recruit x10 + pity, Fuji Relic slot, first 30 minutes, balance). Q13+ not done. Partly staged Q13/Q14 drafts may exist under /tmp/cardrpg-a6-* (inspect before using; never restore reports/cardrpg-a6/resume-drafts.tar.gz).

RULES (always)
One agent only: no subagents, helpers or parallel codex runs (the account allows few threads). Local scripts/tests/Playwright are fine. No PR merge, no deploy, no push to main, no force-push, no secrets. Draft PRs only. Never write in other worktrees. Original art/text only. Keep tool output small (| tail -n 40).

PART 1: ONBOARD NOW (about 30 min), in order
1. cd /Users/bao/taskbar-hero-cardrpg-a6; `git status --short | head -30`; `git log --oneline -3`; `git fetch origin codex/cardrpg-a6-q0-2026-11-10 codex/cardrpg-art-r1-2026-11-09`. If local is behind/ahead of origin, write it in STATE.md (do not force anything). Keep uncommitted work; list it.
2. Find leftover processes from the old session: `lsof -iTCP:5960-5963 -sTCP:LISTEN`; `pgrep -fl cardrpg-a6 | head`. Stop only your own lane's stale Vite/probe processes (ports 5960-5963, /tmp/cardrpg-a6-*). Never touch lane B processes or ports 5920-5923, and never pkill broadly.
3. `df -h ~ | tail -1`.
4. Read, short: reports/cardrpg-a6/HANDOFF.md, QUEUE.md, STATUS-VI.md, INBOX.md, Q12.md. Then look at these screenshots yourself: reports/cardrpg-a6/shots/q6-home.webp, q6-map.webp, q5-prepare.webp, q9-splash.webp, q12-normal.webp, q12-ultimate.webp.
5. Run typecheck + lint + web unit tests once (filtered). Note the result.
6. Rewrite HANDOFF.md as one short section (<= 40 lines): "New account session started <UTC time>", what is done, git state, processes found/stopped, test result. Add 3 Vietnamese lines to STATUS-VI.md. Commit "A6: new-session onboarding check" and push.
7. Do NOT end your turn. Continue straight into PART 2 below.

PART 2 (after PART 1, same turn). This prompt replaces every earlier lane A prompt, queue order and pause note. Paste this into reports/cardrpg-a6/TASK.md (overwrite) as your first action, then rewrite QUEUE.md from section 4 (keep the ticked Q0-Q12 lines as history at the bottom), then start the first unfinished item.

=====================================================================
0. WHY THE DIRECTION CHANGED (read once)
=====================================================================
The user (Vietnamese, 10 Nov): quality matters, not time; Codex follows our direction, so the direction must be right. Q0-Q12 built all the systems, but a review of your own screenshots found the game does NOT look or feel like a top idle hero battler (AFK Arena/AFK Journey, Idle Heroes, OMG3Q, Danh Tướng 3Q are the genre bar; never copy their art, layouts, names or text):
1. Every screen is the same dark-teal modal panel. It reads like a web dashboard, not a game.
2. Recruit reveal: a small low-poly model on a dark panel, rarity "epic" in tiny grey text. No rarity colour, burst or big art. This is the moment players remember and it is the weakest screen.
3. The campaign "map" is a grid of grey boxes.
4. Difficulty: Team Power 7,503 vs Recommended 2,878 (2.6x), forecast "Favoured 100%", 0 losses in 30 minutes. No tension, no reason to upgrade.
5. Battle: units are tiny on a huge empty carpet; the ultimate is only a text banner; HUD cards are plain; normal battle takes about 44 s in the browser (target 20-35 s).
6. Q14: the previous session read "no merge" as forbidding merging lane B. Wrong. "No merge" means no PR merge into main. MERGE COMMITS of lane B's published branch into your branch are ALLOWED and REQUIRED.
Meanwhile lane B's 2D concept art (12 cats, 13 enemies) is excellent, and the user has decided (10 Nov 16:09 UTC) that lane B turns those concepts into illustrated 2.5D animated puppets for every unit. So the whole game should look like those concepts.
So: NO NEW SYSTEMS. Every remaining hour goes into look, feel and difficulty. Keep all Q1-Q12 rules and features working.

=====================================================================
1. RUN-FOREVER RULES (highest priority)
=====================================================================
R-1 QUEUE. Always work the top unfinished item of QUEUE.md. When done: tick, commit, push, update draft #438 description, update STATUS-VI.md (Vietnamese, short), and IMMEDIATELY start the next item in the same turn. Never end the turn while unfinished items exist, except an R-6 stop.
R-2 Checkpoints, pushes, PARTIAL results and self-scores are not stops. Never end with "next steps for the user".
R-3 Failed gate: reproduce -> measure -> smallest fix -> re-verify, max 3 attempts, then take the simplest version that looks and plays well, log it in FIXLOG.md, move on.
R-4 Check reports/cardrpg-a6/INBOX.md between items. A correction goes into QUEUE.md, gets 1-3 Vietnamese lines in STATUS-VI.md, and you continue. Only "dừng", "stop", "pause", "khoan" or a STOP-A6 file in the worktree root pause you. A question is not a pause.
R-5 Context: keep output small. If lost or compacted: re-read TASK.md section 4, QUEUE.md, HANDOFF.md (one section <= 60 lines, rewrite it each item), continue.
R-6 Hard stops only: (a) queue done and report pushed, then keep improving the lowest-scored screen until (b); (b) 2026-11-20 12:00 UTC: push the report with what exists and stop; (c) STOP-A6 or pause word; (d) true user-only blocker (payment, a login only the user can do, PR merge, deploy, live DB/contract change, disk full after cleanup): write the exact ask in NEEDS-USER.md, mark BLOCKED-USER, skip it, keep working everything else.
R-7 One agent only: no subagents/helpers/parallel codex or anything else making model requests. Local tools fine. No PR merge, deploy, push to main, force-push, secrets. Draft PRs only. Never write in lane B's worktree. Ports 5960-5963 and /tmp/cardrpg-a6-* only. Heavy builds/E2E: check disk first; use the existing shared timing.lock lease (<= 20 min) as HANDOFF/STATE describe, so you do not slow lane B's renders.
R-8 Evidence diet: per item typecheck + lint + touched tests, plus 1440x900 screenshots of the touched screens that you LOOK AT yourself. Full E2E and one real-click 30-minute session after Q13f and at Q15. No hash ceremonies, no seed registries, no new one-off sim tools (use tools/cardrpg-a6/sim.mjs).

=====================================================================
2. ART SOURCE AND OWNERSHIP
=====================================================================
- Lane B: worktree /Users/bao/taskbar-hero-cardrpg-b2 (read only), branch codex/cardrpg-art-r1-2026-11-09, draft #427. Read B's HANDOFF.md, STATUS-VI.md and B-OUTBOX (if present) under reports/cardrpg-look/art-rebuild/ each item via `git fetch` + `git show origin/<branch>:<path>`.
- 2D art you may use now: B's concept PNGs (r2/concepts/ and the masters in ~/art/look-v3, read only; copy what you need into your branch as WebP, record source path in DECISIONS.md) and B's Q8 portrait/icon/face-crop manifest. When B publishes puppet atlases, merge B's branch and use them.
- You own: all DOM screens and the DOM battle HUD (portrait cards, HP/rage bars, ultimate cut-in overlay, boss bar, speed/skip, result screen). B owns: everything drawn in the canvas (units, animation, VFX, damage numbers, camera, stage). Before adding damage numbers, check whether B's canvas already draws them; never duplicate. Ask B for things in A6-OUTBOX.md (e.g. "closer camera: units fill 40-50% of battle height").

=====================================================================
3. LOOK TARGET (write this as reports/cardrpg-a6/LOOK-CHECKLIST.md first, 20 concrete rows, then score every screen against it)
=====================================================================
Must include at least: warm lantern palette (cream, amber, warm wood, soft night-blue accents) instead of dark-teal panels; big character art on every cat card and screen header; ornate card frames by rarity (Common grey, Rare blue, Epic purple, Legendary gold with animated shine); stars and level badges on cards; chunky primary buttons with glow and press animation; currency/reward popups with icons and count-up; red dots only where an action is possible now; screen transitions (slide/fade, 150-250 ms); the cafe home shows the crew BIG (each cat >= 25% of screen height) with idle motion; empty states and loading states drawn, not blank; text short and readable at 1280x720; nothing important below the fold at 1280x720.
Scoring: per screen at 1440x900 and 1280x720, score 1-10 for "a player would believe this is a real commercial game". Not done while any LOOK-CHECKLIST row on that screen is below 7. Fix the lowest row first. Put scores in reports/cardrpg-a6/LOOK-SCORES.md (one table, update in place).

=====================================================================
4. QUEUE (write into QUEUE.md in this order; budgets are guides, quality wins)
=====================================================================
- [ ] Q13a Onboard art (2 h): copy concept art/portraits into the app (WebP, lean sizes), one art manifest used by every screen, fallbacks to the old model render if a unit has no art yet. Done: every cat card, team slot, Bond Book entry, recruit result and enemy preview shows the 2D art.
- [ ] Q13b Look system (6 h): LOOK-CHECKLIST.md, design tokens (palette, frames per rarity, buttons, panels, popups, motion timings) in one place, then restyle: cafe home, top HUD, dock, Cats, Team/formation, Prepare, Bag/gear, Daily, Tower, Relic, result screens. Done: LOOK-SCORES.md all >= 7 on these screens.
- [ ] Q13c Recruit reveal (4 h): card backs deal in, glow colour tease per rarity, flip in rarity order, Epic+ full-screen splash with the concept art, rarity colour burst and particles (DOM/CSS or small canvas inside the DOM layer), name plate, stars, "New!" stamp; x10 summary grid with rarity frames; duplicate -> shards shown with count-up. Respect reduced motion. Done: score >= 8 and a 10-pull feels exciting in a real click run.
- [ ] Q13d Campaign map (4 h): illustrated night-street route (painted/generated ORIGINAL background or layered CSS/SVG scenery), nodes on a winding path, current node pulses, stars under cleared nodes, chapter boss node larger with its art, chest milestones along the path. Keep all existing route/star logic. Done: score >= 8.
- [ ] Q13e Battle HUD (4 h): portrait cards with 2D art, HP bar with delayed damage trail, rage bar that fills visibly and glows when full, ultimate cut-in (full-body art slides in, skill name, 0.6-0.9 s at x1, shorter at x2/x3, skipped by "skip"), boss HP bar at top with phase pips, clean result screen (stars earned one by one, rewards with icons, Next / Retry / Upgrade hint). Write the camera/scale request to A6-OUTBOX. Done: score >= 8 on normal, boss and ultimate screenshots.
- [ ] Q13f Difficulty curve (3 h): Recommended Power near the player's: stages 1-1..1-4 at 0.6-0.8x of a new player's expected power, 1-5..1-9 at 0.9-1.05x, chapter boss 1.1-1.2x; later chapters keep a similar saw-tooth. Normal wins end with 20-60% team HP left. Forecast labels only Favoured / Even / Risky (never "100%"). First real loss for a new player between minute 12 and 20; the loss screen names one cheap fix; the retry after that fix wins within 2 tries. Bot target: 1-3 losses in the first 30 minutes, no stuck player, reward gap median <= 60 s. Then one real-click 30-minute run to confirm.
- [ ] Q13g Pacing in the browser (3 h): normal battle 20-35 s at x1 measured in the real browser (median of >= 8 fights), boss 45-90 s. If animation beats cause it, shorten ordinary beats (keep ultimates/boss beats); if canvas frame time causes it, measure and write the numbers in A6-OUTBOX for B, keep the A-side fix, move on.
- [ ] Q14 Integration (4 h, repeat whenever B publishes a new tip): `git merge --no-ff origin/codex/cardrpg-art-r1-2026-11-09` into your branch (merge commits only; A-owned rules/screens/HUD take A; B-owned canvas/art/VFX/camera take B; B's old left-nav shell must never show in your build). Wire B's puppet units and VFX; re-check LOOK-SCORES on battle screens. Build the offline demo docs/cardrpg-a6/index.html (<= 40 MB) and docs/cardrpg-a6/CHAY-DEMO.md (Vietnamese, 10 lines: how to open, what to click in 5 minutes for judges). Merge again after B's final tip (B's report is due 20 Nov 12:00 UTC; take whatever is published by 19 Nov 18:00 UTC for the final demo, and re-merge later tips if time remains).
- [ ] Q15 Final check (by 19 Nov 18:00 UTC): fresh seeds 60001-60500 once with the sim, full E2E, one real-click 30-minute run, screenshots of every screen at 1440x900 and 1280x720, one 60-90 s clip of a first session and one of a boss fight with ultimates.
- [ ] Q16 Report (by 20 Nov 06:00 UTC): reports/cardrpg-a6/A6-REPORT.md (<= 2 pages: what a player gets now, before/after screenshots of home/recruit/map/battle, LOOK-SCORES summary, difficulty numbers, known issues), STATUS-VI.md summary, PR #438 description. Then improve the lowest LOOK-SCORES row until 20 Nov 12:00 UTC.

=====================================================================
5. SELF-SCORE (in A6-REPORT.md; target 8.5)
=====================================================================
Looks like a real game (LOOK-SCORES average) 30; first 10 minutes fun and clear 20; battle readability and excitement (HUD, cut-in, pacing) 20; difficulty curve and upgrade pull 15; integration with lane B art 10; stability (tests, E2E, no console errors) 5.

ADDENDUM FROM THE USER (10 Nov): ANTI-FORGET RULE R-9. This is not a pause and not a new task. Do NOT restart, do NOT redo finished work. At the next safe point (within 10 minutes), do steps a-c below, append this whole addendum word for word to the end of reports/cardrpg-a6/TASK.md (and to the saved prompt copy if different), commit + push, then keep working the current queue item in the same turn.

R-9 ANTI-FORGET (your context WILL be compacted; the files are your memory; if memory and files disagree, the files win):
 a) Make sure the full original prompt is saved word for word in reports/cardrpg-a6/TASK.md (no summary), record `wc -c` + `shasum -a 256` at the top of reports/cardrpg-a6/STATE.md, commit + push.
 b) Write reports/cardrpg-a6/RULES.md (<= 30 lines): the non-negotiables from this prompt: one agent/no model-calling helpers; draft PRs only, no PR merge/deploy/main push/force-push/secrets; never write in the other lane's worktree; original art only; NO new systems, quality of look/feel/difficulty first; battles fully auto; merge commits of lane B's branch allowed, B-owned canvas takes B; hard stops R-6 only; deadline 2026-11-20 12:00 UTC.
 c) Keep reports/cardrpg-a6/HANDOFF.md as ONE section (<= 60 lines), rewritten (never appended) after every queue item and before any long job: NOW (item + step, branch, last pushed SHA, PR), NEXT (3 concrete actions), RUNNING (PIDs, ports, log paths, locks held), DONE this session (one line each with SHA), KNOWN ISSUES, DECISIONS (one line each). Add one line per finished step to reports/cardrpg-a6/PROGRESS.log (UTC time, item, result, SHA).
 d) RE-READ reports/cardrpg-a6/RULES.md, QUEUE.md and HANDOFF.md: at the start of every queue item; right after any compaction/summary or when you feel unsure; before any git merge/push/branch command; and at least every 2 hours. Re-read section 0 and section 4 of reports/cardrpg-a6/TASK.md at the start of each queue item.
 e) Never rely on remembered paths, PIDs, SHAs or numbers: read them from files or the system. Commit + push lane files at least every 60 minutes, even mid-item, so a crash or account switch loses nothing.
 f) If a new session starts with no memory: read reports/cardrpg-a6/RULES.md, HANDOFF.md, QUEUE.md, then reports/cardrpg-a6/TASK.md, then continue the top unfinished item. Never redo ticked items.

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
