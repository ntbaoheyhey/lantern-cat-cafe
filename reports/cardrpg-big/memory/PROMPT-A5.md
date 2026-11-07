TASKBAR HERO - CODEX LANE A5 (FRESH SESSION): MAKE GAMEPLAY V4 FUN, FAIR AND FAST - CLOSE THE 5 BALANCE MISSES, FIX THE DAY-7 WALL, BUILD THE HOOKS (2026-11-08)
FRESH, SELF-CONTAINED SESSION WITH NO MEMORY. THIS IS THE USER'S EXPLICIT INSTRUCTION TO RUN NOW, UNATTENDED, UNTIL DONE. NO TIME LIMIT; QUALITY OVER SPEED. Estimated 20-30 h.
This is NOT "continue A4". A4 is delivered (draft stack #364 -> #376). You start a new lane, A5, on top of the A4 P7 tip. Do not redo research or rewrite the design; build on them. Where implementation proves the spec wrong, append the change to docs/design/cardrpg/DECISIONS.md and to a new section "A5 revision" at the end of GAMEPLAY-V4.md, with the reason and the evidence file.

REFERENCE: docs/design/cardrpg/GAMEPLAY-V4.md (binding spec, sections 1-9 + "P6 registered training revision"), docs/design/cardrpg/NFT-VALUE-SPEC.md, docs/design/cardrpg/RESEARCH-GAMEPLAY-V4.md, docs/design/cardrpg/{RESEARCH.md,research-matrix.json,PATTERNS.md,DECISIONS.md,ITEM-TIERS.md,BALANCE.md}, reports/cardrpg-big/a4/{A4-GAMEPLAY-REPORT.md,P6-BALANCE.md,P6-RESIDUALS.md,P6-INVITATIONS.md,P3-PACING.md,P5-CAFE-LOOP.md,COVERAGE.md,D-FRESH-EYES.md}, reports/cardrpg-big/a4/p6/{REGISTERED-METHOD.md,balance-gates.json,residual-map.json,economy/progression.json,sample-audit.json}, reports/cardrpg-big/a4/p7/{audit.json,journey/checks.json,performance/summary.json}, reports/cardrpg-big/memory/{PROMPT-A4-v2.md,RULES-A4.md,STATE-A4.md}, demo docs/cardrpg3/index.html (A4: SHA-256 067d2062f6836a6d0bb9f6753ece1b2f3ca923688f241866a7f42806c8f7b6a1, 26,215,694 bytes) and docs/cardrpg3/gameplay-v4.html (9dca8fe648d6e101de89ffa02099249327615648989b1207f7e7183c6c0d0482, 1,314,680 bytes) - all on branch codex/cardrpg-a4-p7-2026-11-08 (tip f1b433e89ec4626cb73daff24d35c699bcd94e0d, draft #376). Previous prompt: /mnt/project-files/taskbar-hero/PASTE-CODEX-CARDRPG-LANE-A4-GAMEPLAY-v2-2026-11-07.txt (its hard rules and lane split still apply unless this prompt says otherwise).

==================================================================
0. WHY THIS SESSION EXISTS (read twice)
==================================================================
The user asked (8 Nov, Vietnamese): "Is it really good now? Are the new features enough to attract players? If not, write a big prompt to continue."
The project coordinator reviewed the A4 report, the P6 receipts and played the offline demo headless. Honest verdict: NOT YET.
A4 made the systems COMPLETE ON PAPER (crew rows + jobs, standing plans, 128 gear templates / 8 sets, loadouts, earned invitations with pity, local edition ledger, cafe service, daily board, journal, boss phases, pacing bands). That is real progress (systems completeness ~7.5-8/10). But a player would not stay, for these reasons (engagement ~5.5-6/10):

 A. THE DECISIONS ARE NOT REALLY DECISIONS (balance):
    - One piece decides a fight: completing a 4-piece set on Mochi vs the chapter-3 boss turns 11/500 wins into 478/500 (+93.4 pp heldout; 31 cells over 12 pp, all in the fourth-slot comparison: Hearthloom 12, Bellsteel 12, Crumbweave 6, Emberfelt 1; Mochi 24, Soot 7). The displayed contribution is ~3%, so the screen lies to the player.
    - Cats 31.38-64.66% at matched power (target 55-75%): several cats are traps; a collector who pulls them is punished.
    - Coherent crew +47.73 pp over a random equal-power team (target +10-25): there is ONE right team, so team building collapses to "copy the answer".
    - Sets 67.03-79.60% (target 35-75%): the matched-power fixture is too easy for sets and too hard for some cats; difficulty calibration of the fixtures themselves is suspect.
    Hypothesis to TEST (not a conclusion): the chapter-3 boss and some set-4 effects create survival cliffs (one-shot thresholds, Defend/Riposte/link loops that either fully neutralise boss pressure or not at all), so win probability is a step function of a few HP/shield numbers. Smooth cliffs; do not just shave numbers until a gate turns green.

 B. THE PLAYER HITS A WALL AND IS NOT PULLED FORWARD (progression):
    - The earned real-click day-7 boss ends in DEFEAT (55.151 s at x1). The natural path walls the player at the moment the demo should feel triumphant.
    - P6 45-day bot: "Chosen reward" (60 selector marks) reached by 0% of casual/regular/heavy accounts by day 45 (all censored). A promised reward that nobody reaches is a broken promise.
    - First Legendary median day 33 / p90 day 38 and IDENTICAL for casual, regular and heavy (6.7% by day 7, 10% by day 14). Playing more changes nothing; nothing exciting happens in the first two weeks.
 C. THE SCREENS READ LIKE A SPEC, NOT A GAME (presentation of A-owned screens):
    - Developer buttons visible to players in the top bar on every screen: Feel lab, Review studio, Mechanics lab, Frame meter, Look A/B; also "Before / after" in the nav and "Seed 7930"/"Seed 791576452" in headers.
    - Row placement and gear filters are <select> dropdowns; the Prepare screen is a form.
    - Copy is defensive engineering prose: "Each draw commits before the skippable reveal", "Uncollected rewards are preferred within the rolled rarity and featured partition", "These are observed contributions, not proof that one effect decided the fight". Honesty belongs in reports and the odds page; the play surface needs short, warm, concrete player language.
    - The Result "why" is generic ("Your shields absorbed 36 damage... Next adjustment: compare the visible enemy intent"). It does not name the cat, the item or the choice that mattered, and it does not suggest a specific change.
    - No anticipation or celebration moments on A-owned screens: rewards, first set completion, first crew threshold, first legendary all pass as plain text. (In-fight 3D presentation stays lane B; A owns everything outside Battle.tsx.)
 D. COST: offline artifact 26.2 MB (24 MB gate, 32 MB exception), default app JS +552,596 bytes vs main, offline cold CPU4 max 166.6 ms, startup CPU slightly worse in all 3 configs.

The contest context: UniHack (Avalanche), planning deadline 21 Nov (UTC+7), Demo Day 30 Nov. Judges see a 3-5 minute demo. Final judging = Creativity 15, Impact 15, Pitch 10, UI/UX+Demo 10 after screening (Technical 25, Avalanche integration 25). So the first 5 minutes and the first 30 minutes of play matter more than day 45, and every claim must be true on screen.

GOAL OF A5 in one sentence: a new player in the first 30 minutes makes 5+ meaningful choices, sees each choice pay off with a specific named reason, gets a celebration moment at least every 3-5 minutes, beats the day-7 boss after at most one informed retry, and has a clear reason to come back tomorrow - while every A4 balance gate passes on a fresh, never-seen seed block.

STANDING USER DECISIONS YOU MUST KEEP (unchanged since 6 Nov):
 - CARD GAME outside battle; BATTLES FULLY AUTOMATIC (only speed / pause / skip / camera during a fight). Rejected and must not return under any name: choose-3-of-N skills in battle, energy bars, break bars, flavour wheels, manual-beats-auto bonuses, any in-fight player input.
 - Depth lives in decisions BEFORE and BETWEEN fights (collect, build, place, equip, upgrade, route, spend/save). The fight is the payoff and must make the reason visible.
 - Original content only (cozy cat cafe). Research subjects stay in research docs only.

==================================================================
1. HARD RULES (same as A4 unless stated)
==================================================================
 - ONE model-driven agent: you. NO subagents, workers, helper agents, parallel `codex exec`, or any process that makes model requests (the account allows only 4 model-request threads in total). Local tools with NO model requests are encouraged: tests, sims, Playwright, node/python scripts, image tools. No generative-model calls of any kind.
 - Repo ntbaoheyhey/taskbar-hero (private). Main checkout /Users/bao/taskbar-hero: never checkout/reset/stash there. Never touch lane B worktrees (/Users/bao/taskbar-hero-cardrpg-look*, /Users/bao/taskbar-hero-cardrpg-big2) or /Users/bao/taskbar-hero-cardrpg-portrait-prep. Do not delete worktrees you did not create.
 - DRAFT PRs ONLY. Never merge, never deploy, never push main, no Vercel, no secrets, no live Supabase, no wallets, no on-chain issuance.
 - PROTECTED, zero changes: packages/game-rules/src/config.ts, contracts/**, supabase/**, wallet/SIWE/auth, Relic/Fuji code paths, .github/**, secrets. No new runtime dependency.
 - Contest boundary: Relic NFTs on Fuji only; no fungible token, no mainnet, no custom L1, no real-money purchase or cash-out. Gacha uses earned in-game currency only.
 - Everything new stays behind the existing rules flag `gameplayV4` (ON in the demo). OFF must reproduce the frozen digest exactly: 165 cells / 8,250 routes = 47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3, plus the 13 historical sim files and reports/cardrpg-big/baseline/sim-hashes.txt. Old saves (THC7 OFF, THC12 ON and earlier) must load in both modes; bump the save version with migration + tests if state changes.
 - docs/cardrpg3/baseline-v1.html stays byte-identical (23,937,000 bytes, SHA-256 9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3).
 - BALANCE HONESTY: heldout 10001-10500 is now CONTAMINATED (its residuals were read in P6). Do not reuse it for acceptance and never reroll seeds. Keep train 1-500 for tuning. Register a NEW acceptance block, seeds 20001-20500, in reports/cardrpg-big/a5/REGISTERED-METHOD-A5.md (cases, weights, fixtures, source digest) BEFORE the first acceptance run; any later retune after seeing 20001-20500 must be labelled and needs another fresh block (30001-30500), which you also register first. Report every attempt.
 - Moving a gate is allowed ONLY if the gate itself is shown to be ill-posed (for example a fixture whose difficulty puts every set above 65% no matter what), with the evidence, the new definition, and BOTH the old and new results in the report. A gate never moves just because it failed.
 - Honesty: claim only what you measured; "NOT VERIFIED" and "PARTIAL" are respected outcomes; never write "final", "frozen" or "done for good". Bot metrics are proxies, not a human playtest; say so.
 - Desktop only: 1280x720 and 1440x900 primary, 1024x600 must not break; contrast >= 4.5:1.
 - Native Node/pnpm/Playwright only: NO Docker. NO desktop/screen control (no CUA); everything headless.
 - Do NOT run lane B's 860-case roster matrix. Run the full screenshot pack once, on your last artifact only.

==================================================================
2. LANE SPLIT WITH LANE B (unchanged)
==================================================================
Lane B owns (do NOT edit): apps/web/src/game/squad/turn3d/**, card-effects*.ts, card-staging.ts, apps/web/src/game/cardrpg/depth/Battle.tsx, chapter-stage.ts, battle/turn3d CSS, look-tokens.json, look-assets.json + assets, assets/provenance/look.md, model/texture/portrait/icon/flipbook assets, tools/cardrpg-look/**, docs/cardrpg-look/**, reports/cardrpg-look/**, docs/design/cardrpg/LOOK-BIBLE.md, docs/design/cardrpg/MECHANICS-LAB.md, packages/game-rules/src/cardrpg/depth/auto-extras/**.
You (lane A) own: gameplay rules in packages/game-rules/src/cardrpg/** (except auto-extras/), all sims and balance tools, all meta screens and meta CSS (Hub, Collection, TeamCollection, Equipment, Inventory, Invitations + invitations.css, Pages, RunMap, Journal, Encounter/Prepare/Result, CollectibleDesigns, Utility, new screens), App.tsx, depth.css, shared.tsx, tools/cardrpg-big/**, docs/design/cardrpg/** (except the two B files), docs/cardrpg3/index.html + tools/cardrpg-big/build.mjs, reports/cardrpg-big/**.
In-fight cues: emit typed data via packages/game-rules/src/cardrpg/depth/events-v4.ts (bump to version 2 only if needed, keep version 1 readable), render a plain fallback in your screens / HUD strip outside Battle.tsx, and post a REQUEST to lane B with schema, timing budget and fixture. Open B requests from A4 (P1 cues, P3 phase <=400 ms / finish <=800 ms, P4 earned-reveal receipts) stay valid; restate them only if their schema changes. Lane B may or may not be running: read B-OUTBOX first; never block on B.
Sync: branch ai/codex-cardrpg-big-sync, worktree /Users/bao/taskbar-hero-cardrpg-sync (fetch; do not recreate), folder coord/cardrpg-big/. You write ONLY A-OUTBOX.md, append-only, entries `## <UTC> A5-<phase> <TYPE>` (CLAIM / DONE / REQUEST / ANSWER / HEADS-UP / CHECKPOINT), max 8 lines. First entry: "A5 started from #376 f1b433e8: lane A works on balance closure, progression, A-owned screen polish and hooks; no B-owned edits". Push with `git pull --rebase`, up to 4 retries (2/4/8/16 s).
Heavy-work lock: browser timing/profiling and long CPU sims take /tmp/cardrpg-big-locks/timing.lock via tools/cardrpg-big/with-timing-lock.mjs, windows <= 20 min (sims in 2-3 min CPU slices if B is active), 6.5 s handoff. Ports 5910-5913. Temp dirs /tmp/cardrpg-a5-*. Kill only PIDs you started, never by name (an unrelated Python runner lives on this Mac). `df -h` first; clean only your own temp files.

==================================================================
3. SETUP, RESUME AND ANTI-FORGET
==================================================================
 - `git worktree list`. Reuse /Users/bao/taskbar-hero-cardrpg-a4 (lane A's) after recording `git status`; preserve anything uncommitted on a branch wip/a4-leftover-2026-11-08 (never discard). Fetch and verify `git ls-remote origin 'refs/heads/codex/cardrpg-a4-*'` shows p7 at f1b433e8 (or a later A tip; if later, read its commit messages first).
 - Branches: codex/cardrpg-a5-<phase>-2026-11-08 (use the actual UTC date if later), first one from origin/codex/cardrpg-a4-p7-2026-11-08; each phase is a draft PR stacked on the previous (first on #376). `CI=true pnpm install --frozen-lockfile` (pnpm 10.28.0); revert installer side effects.
 - Anti-forget: save THIS prompt verbatim to reports/cardrpg-big/memory/PROMPT-A5.md (record `wc -c` + sha256 in STATE), write RULES-A5.md (<= 30 lines: the rules above in short form) and a living STATE-A5.md (NOW / NEXT / DONE / GATES / DECISIONS append-only / MEASUREMENTS). After every compaction, before every phase and before every PR: re-read RULES-A5.md, the first 20 lines of STATE-A5.md, the last OUTBOX entries and this phase's text. Mirror STATE-A5.md to ai/codex-ui-ledger at each phase end. Park WIP on named WIP commits; never end half-wired.
 - Five gates (typecheck, lint, web unit, rules tests, E2E) + build at every phase end. Keep original failing logs; report retries.

==================================================================
4. PHASES (each ends with five gates + build + draft PR + A-OUTBOX CHECKPOINT + STATE update)
==================================================================
Order matters: H0 first; B1-B3 (balance) and C1 (copy/clean-up) may interleave by lock availability; E1-E3 build on B1-B3; Z last.

H0 FIRST-SESSION AUDIT (short, <= 2 h)
 - Write a scripted headless "new player" journey from a fresh save (real clicks, x1, no skip) and log a timeline: every screen, every choice offered, every reward, every wait. Compute PROXY ENGAGEMENT METRICS for minutes 0-5, 0-30 and 0-60: meaningful choices offered (a choice whose options lead to different sim outcomes), reward events, celebration moments, dead time (seconds on screens with no decision and no reward), text words per screen, number of dev/debug controls visible. Save reports/cardrpg-big/a5/H0-FIRST-SESSION.md + h0/timeline.json + contact sheet. These are the BEFORE numbers for E1-E3.
 - Reproduce the day-7 boss defeat from the A4 real-click journey and record why it lost (event counts, who died first, damage taken by row, which plan/crew/gear). This is the BEFORE for B3.

B1 SINGLE-PIECE AND SET CLIFFS (rules + sims; root cause first)
 - On TRAIN only: for the 31 heldout outlier cells (P6-RESIDUALS.md) and their train twins, run an ablation that adds the fourth piece's components separately: main stat only, affixes only, unique only, set 4-piece threshold only, all. Then find the first divergent automatic decision in paired replays (same seed) and the HP/shield margin at the moment the losing party died. Write B1-ROOT-CAUSE.md with the table and 3-6 example replays.
 - Fix the cause, not the symptom. Acceptable directions (pick by evidence): cap set-4 effects per encounter/round so they stop scaling with fight length; turn binary survival thresholds into graded effects; make the boss's lethal patterns telegraphed and partial (no one-shot thresholds a single shield number decides); re-tune chapter-3 boss pressure so the bare 3-piece kit is not at 2% wins while the 4-piece is at 96%. Keep every set's identity and niche from GAMEPLAY-V4 section 3.
 - Recalibrate the utility-aware display score on TRAIN so the number on the Equipment screen tracks paired combat reality: report the rank correlation between displayed delta and paired win delta per chapter (target Spearman >= 0.6 on train, then measured on 20001-20500), and show "set bonus: activates 4-piece" explicitly in the compare panel when the piece completes a threshold.
 - Gate (on 20001-20500): single piece <= 12 pp paired gain everywhere including the fourth-slot extension; display share <= 10%; set wins 35-75% at matched power and each set leads its predeclared situation. Also keep tiers >= 44/48 (each >= 2 pp, 0 reversals) and band spread >= 15 pp with no saturation (re-run; they PASSED in A4 and must not regress).

B2 CATS AND CREWS: MANY GOOD TEAMS, NOT ONE ANSWER
 - Cats at matched power: every cat 55-75% and a top pick in at least one documented team/situation. Lift the bottom cats by giving their kit a clear job that matters in some boss/elite (not by raw stats only); trim the top only where they dominate everything. Publish a per-cat "best at" line used on screen.
 - Crew advantage: coherent vs random equal-power +10-25 pp. Reduce threshold magnitudes and/or broaden what counts as coherent so that for each of the 3 bosses and each elite at least 4 DISTINCT crews (different cat sets, not row swaps) are within 5 pp of the best crew's win rate. Report the crew diversity count per encounter (this is a new gate; register it).
 - Check the matched-power fixture difficulty: if sets sit at 67-80% while cats sit at 31-65% on the same budget, the two fixtures disagree; document the calibration (target median outcome near 55-60% on train for the reference build) BEFORE acceptance, per the gate-moving rule above.

B3 PROGRESSION: NO WALL, REAL PULL
 - Day-7 boss on the EARNED path (public commands, no injected levels or currency): the regular bot wins at least 1 of its first 2 attempts in >= 70% of 30 accounts, the casual bot in >= 50%; after a loss the game must show one concrete, available improvement (a specific cat, row, plan, item, or upgrade the player can afford now) and the second attempt uses it. Measure the real-click x1 journey again: day-7 boss must end in VICTORY within 45-90 s. Do not trivialise: heavy-bot first-attempt win rate <= 95%.
 - Reward pacing: First Legendary - by day 7 >= 35% of regular accounts, by day 14 >= 70%, and the 45-day first-Legendary median must DIFFER by style (heavy earlier than casual) while heavy/casual earned ratio stays <= 3x for every currency and paid draws. Chosen reward (selector) reachable: regular median <= day 21, casual median <= day 35, none censored for heavy. If you change selector cost (60 marks), pity, or earn rates, update the odds page, NFT-VALUE-SPEC caps and the 10k-account invitation sim (conditional CDF deviation <= 1 pp must still PASS).
 - First-week arc: write a day 1-7 progression table (what unlocks, what is earned, what the player is chasing each day) in reports/cardrpg-big/a5/B3-PROGRESSION.md and make the Hub show "tomorrow you unlock/earn X" on each day.
 - Re-run the 45-day economy: 30 accounts per style, actual commands. Collectible paired gain <= 3 pp must still PASS.

C1 PLAYER-FACING CLEAN-UP (A-owned screens only)
 - Hide all developer tools from the player build: Feel lab, Review studio, Mechanics lab, Frame meter, Look A/B, Before/after nav item, seed numbers in headers. Keep them reachable behind `?dev=1` (or a documented key) for reviewers; E2E must cover both modes. If any of these buttons live in a B-owned file, do not edit it: hide them from A-owned App/shell code if possible, otherwise post a REQUEST to B.
 - Replace <select> row placement on Prepare with click-to-place (click a cat card, click Front/Back slot; keyboard accessible; Space/Enter). Keep the selects only as an accessibility fallback if needed.
 - Rewrite player-facing copy on Hub, Prepare, Result, Equipment, Inventory, Invitations, Journal, RunMap in short, warm, concrete sentences (<= 18 words each, no engineering hedges). Keep exact odds, pity and caps one click away on a clear "Odds and rules" panel (honesty stays). Words per screen must drop vs H0 (report it).
 - Equipment compare: show what changes in plain terms ("Mochi survives the boss slam: 2 more hits", "completes Bellsteel 4-piece: Riposte + Shelter on Defend") next to the utility score.

E1 DECISION -> PAYOFF LOOP ("why we won" that teaches)
 - Result screen names the top 3 causes from events-v4 with the actor, item/set/crew/plan and amount ("Bellsteel 4-piece on Mochi returned 312 damage - 28% of your total"; "Back row took 61% of damage - try Mochi in front"). One recommended next change, generated from rules (not canned), with a one-click "Apply and retry" or "Open in Prepare" when the change is available now.
 - Prepare "rough forecast": run a small deterministic sim (e.g., 20 seeds, in a web worker so the UI never blocks; budget <= 400 ms on 1280/CPU1, report CPU4) and show a qualitative band (Risky / Even / Favoured) for the selected encounter, with the main risk named ("boss slam on front row"). Label it as a forecast, never a promise; never show a percentage the gates did not validate. Cache per build hash.
 - Scouting: earlier nodes on the night route reveal one boss trait each (opening intent, phase-2 pattern, target exception) so the route choice feeds the boss preparation. Show "Known about the boss: 2/3" on RunMap and Prepare.

E2 GOALS AND CELEBRATION (outside the fight)
 - Node stars: each route node has up to 3 stars with simple, visible conditions (win; nobody fell; finish under N rounds or win with a given crew job active). Stars feed the daily board and journal and give a reason to replay with a different team. Rewards respect existing caps.
 - Discovery moments: first time a crew threshold activates, a set completes, a cat reaches a new rank, a legendary arrives, or a new star tier is reached -> a short celebration card on A-owned screens (CSS/DOM, <= 1.2 s, skippable, reduced-motion respected) and an entry in a "Discoveries" page in the journal (count found / total). Emit `earned-reveal` events so B can add 3D later.
 - Hub = home with pull: tonight's goal, the next star to earn, cafe service ready time, tomorrow's unlock, and one big primary button. No wall of panels above the fold at 1280x720.
 - Reward cadence target (proxy, measured by the H0 script on the new build): a reward or celebration at least every 3-5 minutes in minutes 0-30; >= 5 meaningful choices in minutes 0-30; dead time cut by >= 40% vs H0.

E3 A FIRST 5 MINUTES WORTH DEMOING
 - Script the opening for a judge: the first fight is won in <= 25 s and explains one choice; by minute 3 the player places a cat, equips one piece that visibly changes the next result, and opens one earned invitation with its reveal; by minute 5 the player sees the route map with a scouted boss trait. Keep it skippable for returning players (day-7 import path stays).
 - Add docs/cardrpg3/a5-first-5-minutes.html: a static offline page with the real screenshots/timeline of that path (DEMO RULE: first line in source is a REFERENCE comment listing GAMEPLAY-V4.md, A5-REPORT.md, B3-PROGRESSION.md).

P1 SIZE AND STARTUP
 - Default app (gameplayV4 OFF path, live default): JS byte delta vs current main <= +150,000 bytes (A4: +552,596) by lazy-loading gameplay-v4 meta screens/rules; cold CPU in the 3 configs not worse than main (report each run; >= 3 cold observations per config, median and max).
 - Offline demo artifact: target <= 24,000,000 bytes again (A4: 26,215,694). If not reachable without touching B assets, report exactly which bytes are A-owned vs B-owned and stay under the 32 MB exception. Offline cold CPU4 max: target <= 120 ms (A4: 166.6 ms); report.

Z ACCEPTANCE, DEMO, REPORT
 - Full acceptance on the registered fresh block 20001-20500 (>= 500 seeds per cell, Wilson intervals, paired differences): all A4 gates + the new crew-diversity gate + B3 progression gates. One BEFORE (A4 numbers) / AFTER table; train vs acceptance shown separately.
 - OFF digest exact; baseline-v1 exact; old saves load both modes.
 - Rebuild docs/cardrpg3/index.html (gameplayV4 ON, dev tools hidden unless ?dev=1; record SHA + bytes) and update docs/cardrpg3/gameplay-v4.html with an "A5 changes" section (new screenshots, BEFORE/AFTER balance table, progression table). Real-click Playwright journey: fresh save -> first 5 minutes -> first 30 minutes -> day-7 import AND earned day-7 -> boss VICTORY -> invitation -> equip with compare -> journal discoveries; contact sheet. Full screenshot pack once on the last artifact (+ new screens) at 1280/1440/1024, both themes, zero overflow, contrast >= 4.5:1.
 - FRESH-EYES SELF REVIEW: after a break of at least one compaction or phase, replay the first 30 minutes yourself (headless, screenshots) as a sceptical new player and score 1-10 with reasons: "would I play tomorrow?", "did my choices matter?", "did I understand why I won/lost?", "was anything exciting?". Keep the A4 scores for comparison. This is not a human playtest; say so.
 - HUMAN PLAYTEST KIT for the user: reports/cardrpg-big/a5/PLAYTEST-KIT.md (15-minute script, 8 questions, what to watch, how to send results back). Short and in plain English with a Vietnamese summary at the top.
 - Report reports/cardrpg-big/a5/A5-REPORT.md (<= 90 lines) + update reports/cardrpg-big/CARDRPG-BIG-REPORT.md (ledger copy on ai/codex-ui-ledger): first a 5-line Vietnamese summary for the user, then: engagement proxies H0 vs A5, balance BEFORE/AFTER (every gate PASS/MISS), progression table, day-7 boss result, size/startup, demo paths + SHAs, draft stack links, open B requests, decisions for the user (promote gameplayV4 to live? any on-chain step?). Every MISS stays visible.

==================================================================
5. QUALITY BAR AND SELF-CHECK (every phase)
==================================================================
 - From the screen alone, a new player can answer: what do I do next, why did I win/lose, what should I change, what does this item change, how rare is it, what are my odds, how much of this exists, what do I get tomorrow. If not, the phase is not done.
 - Every new rule has unit tests + a deterministic sim; numeric gates are tests that load real receipts, not hard-coded desired outcomes. Every new screen/flow has an E2E path and 1280/1440/1024 captures with zero overflow and contrast >= 4.5:1.
 - Before each PR: re-read RULES-A5.md; `git diff --name-only` has no B-owned or protected path; OFF digest unchanged; baseline-v1 exact; git author correct; five gates + build green (fix failures, max 2 rounds, then report honestly); PR body lists real checks only, links the phase report, says DRAFT, no merge/deploy.
 - Never stop half-wired; if blocked, write the blocker in STATE-A5.md and A-OUTBOX, park a named WIP commit, and continue with the next independent phase.
 - When everything is done, end with the report links and the full draft stack list (#376 -> A5 PRs). Do not merge. Do not deploy.
