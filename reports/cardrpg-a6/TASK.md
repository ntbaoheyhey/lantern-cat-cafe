LANE A6 "TOP-GAME GAMEPLAY + GAME SCREENS" — STEP 2 OF 2: NON-STOP RUN — written 2026-11-10 06:00 UTC
STEP 1 (Q0 setup) is DONE in this session: worktree /Users/bao/taskbar-hero-cardrpg-a6 (or -a6-2, see reports/cardrpg-a6/STATE.md), lane files, gameplayA6 flag, draft PR. Do NOT redo it. Read reports/cardrpg-a6/STATE.md first, fill QUEUE.md with Q1-Q16 below, then start Q1.
REFERENCE (read in this order, skim, do not re-verify):
- reports/cardrpg-big/skills-v5/{V5A-REPORT.md,S6-SELF-SCORE.md,FRESH-EYES.md,PRE-S6-REVISIT.md,STATE.md} on branch codex/cardrpg-v5a-s6-2026-11-09 (draft #424, tip 1195b13fa)
- reports/ui-v3/{UI-V3-REPORT.md,HANDOFF.md,STATE.md} on branch codex/cardrpg-ui-v3-u9-2026-11-09 (draft #437, tip c95097eed) = YOUR BASE
- reports/cardrpg-big/a5/A5-REPORT.md, docs/design/cardrpg/RESEARCH.md + RESEARCH-GAMEPLAY-V4.md + RESEARCH-ADDENDUM-AUTO.md (old research; do not redo it)
- reports/cardrpg-look/art-rebuild/{STATE.md,HANDOFF.md} on draft #427 (lane B, read-only)
- packages/game-rules/src/cardrpg/** (rules), apps/web/src/game/cardrpg/** (screens), packages/game-rules/src/config.ts

You are Lane A6 for Taskbar Hero's cat card RPG (UniHack Avalanche, Demo Day 30 Nov 2026). You own GAMEPLAY RULES and the GAME SCREENS around battle (formation, cats, bonds, gear, recruit, map, tower, quests, Relic). Goal in the user's words (Vietnamese): "gameplay và giao diện thật sự bắt kịp với những game hàng đầu" = gameplay and UI that truly match top games of the genre (OMG3Q, Danh Tướng 3Q, AFK Arena/AFK Journey, Idle Heroes).
This prompt is the user's explicit instruction to run NOW, unattended and continuously, until a hard stop in section 1 R-6. It replaces every earlier lane A prompt (RULES-A, ADDENDUM, A5) and every earlier pause/stop note.

=====================================================================
0. WHY THIS PROMPT EXISTS (read once)
=====================================================================
The last lane A run (Skills V5, S0-S8-S6) ended PARTIAL at 6.16/10 with 21 of 42 gates missed. Your own files show why:
- Most effort went into measurement ceremony: registered seed blocks, 4,505 combat cells x 500, 28,500 probe rows, paired acceptance, hash receipts, a rule that retuning "requires TRAIN". The game itself barely got more fun. That ceremony is now BANNED (section 1 R-8).
- Fight pacing scored 2.59/10: normal fights 13.2 rounds (target 8-12), earned boss 130 s, fixed Yarn Giant 280 s. First 30 minutes: 15.5-minute reward gap and repeated route losses.
- Every cat's ultimate fires in ~78% of normal fights, so ultimates feel ordinary.
- One team is clearly best; off-meta crews lag; elite fixtures saturated.
- The run stopped at every milestone and wrote reports nobody can read ("multi32.525%PASS").
- 100+ one-off tools in tools/cardrpg-big/ (a4-p1-sim, a4-p2-sim, ...). Do not add more of those.
What already works and must be KEPT: Skills V5 rules (8 keywords, 7 target shapes, 4 crew reactions, 12 distinct cat kits, Binding Threads, Cinnamon support), events-v2 contract, A5 fallback, gear/sets/gacha/NFT caps, Lane U's "Living Cafe" shell (cafe hub, top HUD, 5-button dock, Night Patrol button, readable battle HUD, recruit reveal, claim badges; #428-#437, 8.475/10), dev tools only with ?dev=1, battles FULLY AUTO (user decision; never add manual targeting).

=====================================================================
1. RUN-FOREVER RULES (highest priority)
=====================================================================
R-1 WORK QUEUE. First action: fill reports/cardrpg-a6/QUEUE.md (created in STEP 1) from section 5, in order, each item with its time budget and done-check. Always work the top unfinished item. When an item is done: tick it, commit, push, update the draft PR, update STATUS-VI.md, and IMMEDIATELY start the next item in the same turn. Never end your turn while QUEUE.md has unfinished items, except for an R-6 hard stop.
R-2 CHECKPOINTS ARE NOT STOPS. A commit, push, PR update, report, PARTIAL result or self-score is never a reason to end the turn or ask the user anything. Do not write "next steps for the user" and stop.
R-3 REPAIR CAP = SWITCH, NOT STOP. For any failed gate: reproduce -> measure -> smallest fix -> re-verify, max 3 attempts. After the 3rd failure take the FALLBACK in section 4 (or, if none, the simplest version that plays well), log it in FIXLOG.md as a known issue, and move on. A known issue never blocks later items.
R-4 USER MESSAGES. The user may write to reports/cardrpg-a6/INBOX.md; check it between every queue item. A correction from INBOX or chat goes into QUEUE.md at the right priority, gets a 1-3 line Vietnamese answer in STATUS-VI.md (and briefly in chat if it came by chat), then you keep working the queue in the same turn. Only the words "dừng", "stop", "pause", "khoan", or a STOP-A6 file in the worktree root pause you. A question is not a pause: answer and continue.
R-5 CONTEXT HYGIENE. Keep tool output small (| tail -n 40, grep). When compacted or lost: re-read QUEUE.md, STATE.md, HANDOFF.md (one section, <= 60 lines, rewrite it, never stack), then continue the top unfinished item.
R-6 HARD STOPS (the only ones): (a) QUEUE.md done and the Q16 report pushed, then keep improving the lowest rubric row until (b); (b) 2026-11-20 12:00 UTC: write the report with what exists, push, stop; (c) STOP-A6 file or an explicit pause word; (d) a true user-only blocker (payment, a login only the user can do, merge, deploy, live DB/contract change, disk still full after cleanup): write the exact ask in reports/cardrpg-a6/NEEDS-USER.md, push, mark the item BLOCKED-USER, SKIP it and keep working every other item. End the turn for (d) only if no unblocked item remains.
R-7 TIME BOXES. Each item has a budget. When it is spent: ship the best version that passes the minimum gates, log the rest, move on. A complete, consistent game beats one perfect system.
R-8 EVIDENCE DIET (replaces the old ceremony).
  - ONE simulation tool: tools/cardrpg-a6/sim.mjs (reuse existing rule/sim code; no new per-phase sim scripts). It prints one compact table (pacing, ultimate rate, team variety, first-session timeline, 7-day economy) in under 3 minutes on 500 seeds.
  - Tune freely on dev seeds 1-500. ONCE at the very end (Q15) confirm on fresh seeds 60001-60500. No registration files, no paired acceptance, no per-change hashes, no "TRAIN before retune" rule.
  - Per item: typecheck + lint + unit tests of touched packages, the sim table if rules changed, and 1-3 screenshots at 1440x900 of the touched screens that you actually look at. Full E2E + one real-click 30-minute Playwright first-session run: once per 3 items and at Q15, not per fix.
  - Compatibility: with the A6 flag OFF, the legacy OFF digest and A5 fallback hashes must stay exact (one existing check, run per rules change). Do not re-hash unchanged bytes.
  - Evidence budget for reports/cardrpg-a6/: 60 MB (WebP shots, at most 4 clips of 30 s).
  - Reports are short, plain English sentences with numbers in words a judge can read. Every report table has a "what this means" line.

=====================================================================
2. THE DIRECTION (approved option B "top-game cat battler", 10 Nov)
=====================================================================
Principles learned from top games (LAYOUT AND SYSTEM PRINCIPLES ONLY, never their art, names, text, icons or audio):
P1 Short fights: normal 20-35 s at x1, boss 45-90 s at x1, speed x1/x2/x3, skip for already 3-starred stages, auto-continue toggle (AFK/Idle Heroes).
P2 Rage bar (nộ): every unit fills energy from acting, hitting and being hit; the ultimate fires when full, with a big name banner/cut-in. Ultimates are the highlight, not the routine (OMG3Q/Danh Tướng 3Q).
P3 Bonds (duyên): (a) collection bonds: owning a named set of cats gives the whole roster a small stat bonus even if they do not fight (OMG3Q); (b) pair combos (hợp kích): two bonded cats in the same team trigger one combo attack per battle (Danh Tướng 3Q). Build these on top of Skills V5 crew reactions, do not replace them.
P4 One Power number (Lực chiến): every cat, team and enemy shows it; every upgrade makes it visibly jump; every stage shows recommended power (all top games).
P5 Formation before fight: front/back rows, enemy lineup preview with power, 3 suggested teams ("Đội gợi ý"), saved teams per mode (Danh Tướng 3Q, AFK).
P6 Campaign map with 3 stars per stage, chapter boss, star chests, plus an idle chest that fills with time based on the highest stage cleared (AFK).
P7 A second mode: "Tháp Len" (Yarn Tower), 30 fixed floors, milestone chest every 5 floors (OMG3Q tower).
P8 Daily loop: 5 daily tasks + weekly bar, 7-day login gifts, red dots that always point to the next useful thing (all top games).
P9 Recruit (chiêu mộ) x1/x10 with a visible pity counter, rate table and a 4-beat reveal that escalates by rarity; duplicates -> shards -> star-up. (Danh Tướng 3Q was criticised for a flat pull reveal: ours must thrill.)
P10 Treasure slot (bảo vật): a team-wide stat bonus slot (OMG3Q). Ours = the player's Fuji Relic NFTs, read-only, capped so it is a bonus, never pay-to-win. This is our Avalanche hook.
P11 Unlock cadence: features open one by one in the first 30 minutes with a small celebration and a hand pointer, no walls of text.
P12 Juice: numbers count up, rewards fly to the HUD, buttons press, power-up flash, short synth sounds (existing audio code).

Fixed product rules: battles stay fully auto. Original art only. No fungible token, no mainnet, no real money, no new contract or server changes (Relic read is read-only client side; offline demo uses a mock wallet fixture). Off-chain gacha with the existing NFT caps.

=====================================================================
3. TARGETS AND SELF-SCORE (target 8.5/10)
=====================================================================
Gates (sim on 500 seeds unless stated):
G1 Pacing: normal fight median 6-10 rounds and 20-35 s at x1; p90 <= 45 s. Boss median 45-90 s at x1, p90 <= 110 s. Tower floors 20-50 s.
G2 Ultimates: each cat's ultimate fires in 35-70% of normal fights and in >= 90% of boss fights; at most 2 ultimate banners per 10 s.
G3 First session (scripted new-player bot + one real-click run): a reward, unlock or visible power jump at least every 90 s (median) in the first 30 min; 0 losses in the first 10 min; <= 2 losses in the first 30 min; every loss shows one concrete hint ("Nâng Mochi lên cấp 8", "Thử đội gợi ý 2") and following it wins the retry >= 80%.
G4 Variety: at the chapter-3 boss, >= 4 distinct teams within 5 pp win rate of the best team; no single cat in > 70% of the top-20 teams.
G5 Economy: 7-day sim for casual (2 sessions/day) and regular (5/day) players: progress every day, first Epic by day 2, first Legendary pity reachable by day 6 for regular; idle chest cap 12 h.
G6 Recruit: pity shown and correct; x10 reveal <= 8 s, skippable after beat 1; rarity tease visible.
G7 UI parity checklist (section 6): >= 18/20 items PASS in screenshots at 1440x900 and 1280x720.
G8 Stability: typecheck, lint, all web + rules tests, existing E2E, flag-OFF compatibility exact, offline demo <= 40 MB, cold start not worse than #437 by more than 10%, no console errors.
Self-score rows: Battle pacing and ultimates 20%, First 30 minutes 20%, Top-game feature parity (P1-P12 working) 20%, Screen clarity and juice 15%, Balance and economy 15%, Stability 10%. Score each 0-10 from your own screenshots and sim table, with one sentence of evidence each. Be strict.

=====================================================================
4. KNOWN RISKS AND FALLBACKS
=====================================================================
Pacing won't converge (G1) after 3 tuning attempts -> FALLBACK: escalation rule: from round 7 every unit deals +20% per round, cumulative (bosses from round 10), shown as a "Cafe closing!" banner. Guarantees the cap.
Boss too long or trivial -> cut HP to a 70 s median and add one phase mechanic per boss at 66%/33% HP (summon adds, Binding Threads, shield) so short still feels epic.
Ultimate rate wrong (G2) -> per-cat rage gain multiplier table; last resort: fixed rage cost per cat.
Variety (G4) fails -> bonds give off-meta pairs a catch-up bonus; then nerf the top cat by 5% steps (max 3). Then accept and log.
Bot first session fails G3 -> reorder unlocks and stage difficulty of chapter 1 first, not the core numbers.
Recruit reveal heavy (perf) -> CSS/DOM-only reveal with 2D portraits from lane B manifest or existing portraits.
Relic read fails (no wallet, RPC down, offline) -> fixture Relics in demo; product shows an empty slot with "Kết nối ví để dùng Relic Fuji". Never block gameplay on chain.
Flag-OFF digest breaks -> move the new code behind the flag until it is exact again. Never update the digest.
Lane B art not ready -> use current portraits/models; emit events so B can render later.

=====================================================================
5. THE QUEUE (seed QUEUE.md with this; budgets are wall-clock)
=====================================================================
Q0  Setup: DONE in STEP 1 (keep the worktree, branch naming codex/cardrpg-a6-qN-2026-11-10 stacked or one branch + one draft PR, as recorded in STATE.md).
Q1  Sim tool (3 h): tools/cardrpg-a6/sim.mjs per R-8, plus the new-player bot (plays the real rules with the real economy, follows hints). Record BEFORE numbers for G1-G5 in reports/cardrpg-a6/BASELINE.md (one table).
Q2  Pacing + rage + ultimate banner (by 11 Nov 18:00 UTC): rage rules (P2), damage/HP retune toward G1, boss phases, speed x1/x2/x3, skip for 3-star stages, auto-continue. Emit events-v2 `rage.full`, `ultimate.cast` (with display name) and a DOM fallback banner in the battle HUD. G1+G2.
Q3  Bonds (by 12 Nov 18:00 UTC): 8-10 collection bonds and 6-8 pair combos (hợp kích) using existing kits and crew reactions; events `bond.combo`; Bond Book screen (who you own, what is missing, current bonus); bond icons on cat cards and in formation.
Q4  Power + upgrade loop (by 13 Nov 06:00 UTC): one power formula, shown on cats, team, enemy, stages; "Nâng cấp nhanh" one-tap best upgrade and auto-equip best gear; level/star/gear upgrade feedback (power count-up + flash); loss hint engine (G3) that names the cheapest fix.
Q5  Formation (by 13 Nov 18:00 UTC): front/back rows on the existing grid, enemy preview with power and threats, 3 suggested teams, saved teams per mode, bond lines visible. Click-to-place stays; keyboard OK.
Q6  Campaign map + idle chest (by 14 Nov 18:00 UTC): chapter map inside the cafe theme (night street / rooftops), stages with 3 stars (win; no cat fallen; within N rounds), chapter boss node, star chests, idle chest in the cafe scene with claim animation, fast-reward button (limited per day).
Q7  Yarn Tower (by 15 Nov 12:00 UTC): 30 floors, fixed lineups, milestone chests every 5 floors, uses the same battle and formation. Entry from the dock or the hub.
Q8  Daily loop + red dots (by 15 Nov 18:00 UTC): 5 daily tasks, weekly bar with 3 chests, 7-day login gifts, ONE badge module that computes every red dot (no ad-hoc badges); every red dot must lead to an action that is possible right now.
Q9  Recruit upgrade (by 16 Nov 18:00 UTC): x1/x10, pity counter, rate table, 4-beat reveal (deal card backs, glow color tease, flip in rarity order, full splash for new Epic+), shards and star-up, NFT caps unchanged. Extend Lane U's reveal (#434), don't fork it.
Q10 Relic treasure slot (by 17 Nov 06:00 UTC): read-only Fuji Relics (existing chain package, RelicNFT 0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D) -> team-wide bonus, capped (+8% total max), "Relic Fuji" badge with explorer link; fixture in the offline demo. No contract or server change.
Q11 First 30 minutes (by 17 Nov 18:00 UTC): unlock order and celebrations (P11), hand pointer for the first 3 actions, chapter-1 difficulty curve, copy rewrite (short Vietnamese-friendly English UI text; keep i18n structure if present). G3 must pass here.
Q12 Balance + economy pass (by 18 Nov 12:00 UTC): tune to G1-G5 with the sim. Then one real-click 30-minute run.
Q13 Screen polish vs section 6 (by 18 Nov 18:00 UTC): juice (P12), layout above the fold at 1280x720, contrast, empty states, loading states. G7.
Q14 Integration (by 19 Nov 12:00 UTC): merge the newest PUBLISHED lane B tip (draft #427 branch or newer, check B's STATE/A-OUTBOX) with merge commits only; A-owned rules/screens take A, B-owned canvas/art takes B. Build offline demo docs/cardrpg-a6/index.html (<= 40 MB) and docs/cardrpg-a6/CHAY-DEMO.md (Vietnamese, 10 lines: how to open, what to click in 5 minutes for judges).
Q15 Final check (by 19 Nov 18:00 UTC): fresh seeds 60001-60500 once, full E2E, real-click 30-minute run, screenshots of every screen at 1440x900 and 1280x720, one 60-90 s clip of a first session and one of a boss with ultimates.
Q16 Report (by 20 Nov 06:00 UTC): reports/cardrpg-a6/A6-REPORT.md (<= 2 pages: what a player now gets, gates table with BEFORE/AFTER, self-score, known issues), STATUS-VI.md summary, PR description. Then loop: improve the lowest self-score row until 2026-11-20 12:00 UTC.

=====================================================================
6. TOP-GAME UI CHECKLIST (G7; check from your own screenshots)
=====================================================================
1 Home shows the team's Power and the next goal in 2 s. 2 One obvious big fight button. 3 Top HUD: currencies + Power, nothing else. 4 Dock <= 5 icons with red dots that are true. 5 Idle chest visible in the hub and shows fill level. 6 Formation shows both sides' power and a win-chance hint. 7 Suggested teams one tap away. 8 Battle HUD: HP + rage bar per unit, speed and skip, no overlaps with faces/HP. 9 Ultimate banner readable at 1x. 10 Bond combo has its own banner color. 11 Result screen: stars, rewards flying in, one "why" line, one next-action button. 12 Loss screen: one concrete fix button that goes to the right screen. 13 Map: clear current stage, stars, locked/unlocked states. 14 Tower: floor number and next milestone chest. 15 Recruit: pity counter and rates visible, reveal escalates. 16 Cat detail: big portrait, Power, skills with icons, bonds, gear slots. 17 Upgrade gives a count-up + flash. 18 Daily tasks show progress bars and claim states. 19 Relic slot shows "Relic Fuji" and the bonus. 20 No dev buttons, no raw ids, no spec-like text without ?dev=1.

=====================================================================
7. FIXED CONSTRAINTS
=====================================================================
- One agent only. No subagents, helper agents, parallel `codex exec` or anything else that makes model requests (account max 4 model threads across all lanes). Local no-model tools (tests, Playwright headless, sharp, ffmpeg, your scripts) are fine. No screen control of the user's apps.
- Image generation: allowed only for small UI art (icons, chest, map backdrop) with the built-in image tool, your own prompts, no reference images, provenance per asset in reports/cardrpg-a6/ASSETS.md. Units, VFX, stage and portraits are lane B's.
- No merge, no deploy, no push to main, no force-push, no Vercel/Supabase/contract changes, no secrets. Draft PRs only. Main checkout /Users/bao/taskbar-hero: only `fetch` and `worktree add`.
- Ownership: A6 = rules (packages/game-rules/src/cardrpg/**), meta screens and the DOM battle HUD; Lane U is stopped by the user, so A6 may extend U's shell/dock/HUD code, keeping U's look tokens and layout. Lane B (/Users/bao/taskbar-hero-cardrpg-b2, draft #427) owns the battle canvas, unit models, VFX, stage, camera, portraits/icons: never edit B's files or worktree; write requests to A6-OUTBOX.md (B reads it). Never write, build or run servers in other worktrees (-a4, -b2, -ui-v3, -look, -demo, -v5live, -sync).
- Ports 5960-5963 only. Temp /tmp/cardrpg-a6-*. Kill only your own PIDs. Heavy builds/E2E/perf take /tmp/cardrpg-big-locks/timing.lock via tools/cardrpg-big/with-timing-lock.mjs (lease <= 20 min). `df -h ~` before every build; under 15 GB free -> delete only your own outputs and caches.
- Flag `gameplayA6` OFF in product; flag-OFF behavior and hashes stay exact. Battle outcomes are deterministic for a seed.
- Original content only. Never copy names, art, text, icons or audio from OMG3Q, Danh Tướng 3Q, AFK or any game.
- Status for the user in Vietnamese (STATUS-VI.md, <= 15 lines, updated after every queue item). Code, docs and commits in English.

START NOW with Q1 and keep going through the queue without ending your turn.
