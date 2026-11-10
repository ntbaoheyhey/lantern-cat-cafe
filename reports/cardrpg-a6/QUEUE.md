# Lane A6 queue

- [x] Q0 Setup — draft #438; completed in STEP 1.
- [x] Q1  Sim tool (3 h): tools/cardrpg-a6/sim.mjs per R-8, plus the new-player bot (plays the real rules with the real economy, follows hints). Record BEFORE numbers for G1-G5 in reports/cardrpg-a6/BASELINE.md (one table).
- [x] Q2  Pacing + rage + ultimate banner (by 11 Nov 18:00 UTC): rage rules (P2), damage/HP retune toward G1, boss phases, speed x1/x2/x3, skip for 3-star stages, auto-continue. Emit events-v2 `rage.full`, `ultimate.cast` (with display name) and a DOM fallback banner in the battle HUD. G1+G2.
- [x] Q3  Bonds (by 12 Nov 18:00 UTC): 8-10 collection bonds and 6-8 pair combos (hợp kích) using existing kits and crew reactions; events `bond.combo`; Bond Book screen (who you own, what is missing, current bonus); bond icons on cat cards and in formation.
- [x] Q4  Power + upgrade loop (by 13 Nov 06:00 UTC): one power formula, shown on cats, team, enemy, stages; "Nâng cấp nhanh" one-tap best upgrade and auto-equip best gear; level/star/gear upgrade feedback (power count-up + flash); loss hint engine (G3) that names the cheapest fix.
- [x] Q5  Formation (by 13 Nov 18:00 UTC): front/back rows on the existing grid, enemy preview with power and threats, 3 suggested teams, saved teams per mode, bond lines visible. Click-to-place stays; keyboard OK.
- [x] Q6  Campaign map + idle chest (by 14 Nov 18:00 UTC): chapter map inside the cafe theme (night street / rooftops), stages with 3 stars (win; no cat fallen; within N rounds), chapter boss node, star chests, idle chest in the cafe scene with claim animation, fast-reward button (limited per day).
- [x] Q7  Yarn Tower (by 15 Nov 12:00 UTC): 30 floors, fixed lineups, milestone chests every 5 floors, uses the same battle and formation. Entry from the dock or the hub.
- [x] Q8  Daily loop + red dots (by 15 Nov 18:00 UTC): 5 daily tasks, weekly bar with 3 chests, 7-day login gifts, ONE badge module that computes every red dot (no ad-hoc badges); every red dot must lead to an action that is possible right now.
- [x] Q9  Recruit upgrade (by 16 Nov 18:00 UTC): x1/x10, pity counter, rate table, 4-beat reveal (deal card backs, glow color tease, flip in rarity order, full splash for new Epic+), shards and star-up, NFT caps unchanged. Extend Lane U's reveal (#434), don't fork it.
- [ ] Q10 Relic treasure slot (by 17 Nov 06:00 UTC): read-only Fuji Relics (existing chain package, RelicNFT 0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D) -> team-wide bonus, capped (+8% total max), "Relic Fuji" badge with explorer link; fixture in the offline demo. No contract or server change.
- [ ] Q11 First 30 minutes (by 17 Nov 18:00 UTC): unlock order and celebrations (P11), hand pointer for the first 3 actions, chapter-1 difficulty curve, copy rewrite (short Vietnamese-friendly English UI text; keep i18n structure if present). G3 must pass here.
- [ ] Q12 Balance + economy pass (by 18 Nov 12:00 UTC): tune to G1-G5 with the sim. Then one real-click 30-minute run.
- [ ] Q13 Screen polish vs section 6 (by 18 Nov 18:00 UTC): juice (P12), layout above the fold at 1280x720, contrast, empty states, loading states. G7.
- [ ] Q14 Integration (by 19 Nov 12:00 UTC): merge the newest PUBLISHED lane B tip (draft #427 branch or newer, check B's STATE/A-OUTBOX) with merge commits only; A-owned rules/screens take A, B-owned canvas/art takes B. Build offline demo docs/cardrpg-a6/index.html (<= 40 MB) and docs/cardrpg-a6/CHAY-DEMO.md (Vietnamese, 10 lines: how to open, what to click in 5 minutes for judges).
- [ ] Q15 Final check (by 19 Nov 18:00 UTC): fresh seeds 60001-60500 once, full E2E, real-click 30-minute run, screenshots of every screen at 1440x900 and 1280x720, one 60-90 s clip of a first session and one of a boss with ultimates.
- [ ] Q16 Report (by 20 Nov 06:00 UTC): reports/cardrpg-a6/A6-REPORT.md (<= 2 pages: what a player now gets, gates table with BEFORE/AFTER, self-score, known issues), STATUS-VI.md summary, PR description. Then loop: improve the lowest self-score row until 2026-11-20 12:00 UTC.

## Operating rules
- Work the first unfinished item; update INBOX, status, state, handoff and draft #438 at each checkpoint, then continue.
- One agent; no model requests, app control, other-worktree writes, merge/deploy/main push/force-push/secrets.
- Use only tools/cardrpg-a6/sim.mjs for simulations; dev seeds 1–500, fresh 60001–60500 once at Q15.
- Per item: typecheck/lint/touched-package unit tests; simulation + existing exact OFF/fallback check for rules changes; inspect 1–3 screen captures.
- Full E2E + real-click 30-minute session every third item and Q15; no acceptance ceremony.
- Three repairs maximum per failing gate, then fallback and continue; reports budget 60 MB.
- Heavy builds/E2E/perf use timing.lock lease ≤20 minutes; check disk before builds; own ports 5960–5963 and /tmp/cardrpg-a6-* only.
- Stop only for explicit pause/STOP-A6, deadline 2026-11-20 12:00 UTC, or no unblocked work remains.

## Current item
- Q1 completed 2026-11-10 06:38 UTC; baseline 500 seeds in 496.99 seconds (runtime known issue).
- Q2 completed 2026-11-10 06:56 UTC; G1 passes, G2 partial after three tunes (see Q2.md).
- Q3 completed 2026-11-10 07:50 UTC: nine collections, eight combos, Bond Book; exact OFF/A5 and all 421 E2E tests pass. Thirty-minute browser run complete; normal browser pacing still partial.
- Q4 complete 2026-11-10 08:04 UTC: shared Power, quick upgrades/auto-equip, visible loss advice, exact OFF/A5.
- Q5 complete 2026-11-10 08:09 UTC: front/back rows, three suggestions, mode teams, forecast and bond links.
- Q6 complete: campaign map, star chests, twelve-hour idle and two fast rewards; 421 E2E and thirty-minute session pass stability. Final bookkeeping fix rolls into Q7 sim.
- Q7 complete: thirty fixed Tower floors, six milestone chests, shared formation/battle and exact OFF/A5. Tower pacing is partial for Q12.
- Q8 complete: five daily tasks, weekly bar, seven login gifts and one actionable badge selector; exact OFF/A5.
- Q9 complete: resumed 1,800.65-second browser run, twenty-eight wins and no losses/errors/stalls. Normal 43.71/59.73 seconds remains partial; Q10 is next. Prior interrupted observation is preserved separately.
- Q14 integration merge conflicts with the fixed no-merge rule; prepare reviewable integration and skip any unauthorized merge while continuing other work.
