# Combined A5 + Skills V5 acceptance

Registered 2026-11-09T10:04:21.754Z, source 1d7c6f68e26c3c9f45a4502c6f762dfa19ec1433, rules digest 1e7f8c1c6576f0a0bcab7bf36f0f00939bfcffc16f71d4ab784f70b476799959. One block **20001–20500**, 500 direct seeds per combat cell, shipping gameplayV4 ON + skillsV5 ON and fallback gameplayV4 ON + skillsV5 OFF in the same registered run. TRAIN 1–500 is separate ; 10001–10500 stays contaminated. No later tuning is authorized on this block; a changed candidate requires registration of 30001–30500. All attempts remain visible.

## Cases, fixtures and weights

Actual production auto policy. Equal seeds per cell, no exclusions. Original 3,625 cells per mode:30 route tiers,165 boss bands,15 fixed farming,64 set situations,660 triples×boss cases,2,304 bare-item cells,384 fourth-slot cells,3 coherent/random cells. Add 880 elite cells (all 220 triples against Spool Ram, Kettle Knight, Pollen Scout, Crumb Sentinel). Each cell retains paired outcomes where applicable and Wilson 95% intervals. Matched-power normalization remains ±2%; exact fixtures, carriers, encounter arrays and seed derivations are bound by tool hashes in REGISTERED-METHOD.json. No fixture calibration was adopted: its difficulty mismatch remains a miss.

Coherent crew selected on TRAIN: mochi, clover, mallow. Use this same predeclared crew for both modes; never select a crew from acceptance. All four approved V5 crews are reported separately at every boss/elite. Their gaps stay relative to the best measured legal triple at that encounter, with ≥ 4 distinct crews counted independently. Set niches remain the original common pool; no eligible-carrier redefinition is substituted. The original 44/48 tier gate combines each mode’s own 24 TRAIN comparisons with its 24 acceptance comparisons; fallback TRAIN tiers are separately measured on1–500, never combined with V5 TRAIN tiers.

V5 probe: seven crews×three original encounters×500seeds = 10,500 battles per mode. Original three crews/180battle prefix and full 4,500-battle original pool remain separate. Damage actions count unique foes directly damaged/detonated; support actions count unique heal/shield recipients including zero-amount logs, matching S0. Announced reactions use emitted events. Keyword coverage is fraction of battles with application; per-skill/ultimate counts use executed action markers. Report unconditional ultimate coverage. Cinnamon's user-amended no-casualty team mode makes that case legal; it has no revive exemption in D4. Reaction coverage: Crumb Burst/night lamp, Wildfire/oven, Rupture/thread, Spread/thread. Boss cases remain in the combined denominator with production D1 helpers; original encounters and weights do not change. Additional matched-power D4 cells: four named crews×nine fixed encounters×500seeds=18,000 battles per mode, level6 epic with inherited ±2% reference normalization. Every skill share divides by all actions from that cat, including Defend. D3 requires each core keyword in at least1/3 of each named crew's base-stat battles, with pooled values also retained. D5 compares catalog-role ordered top-two shape+status patterns. Per-crew status/reaction/shape counts and fixed first-three example seeds are exported for laneB. These supplemental diagnostics never replace the original180/full4500 probe. The bound design-metrics-v3.mjs records both cohorts in one run.

Earned progression:30 accounts/style × 45 synthetic days, public commands, casual/regular/heavy budgets 1/2/6 routes and 15/60/60 service minutes. Root accounts 20001–20030, deterministic streams root+day×7919+route×71 and root+day×9349+pulls×97. These are derived account streams, not an assertion that every generated route seed lies in the direct 500-seed block. Day 7 tests every earned save (same root+7×7919; one informed retry at+1), no grants. Parent method fixes the 90 inputs; child registration records their hashes after generation and before evaluation. Local editions use 500 direct seeds; no network or on-chain action. Conditional invitation odds are reused only with exact source/registered receipt proof because V5 changes no odds, pity, selector or currency rules; otherwise mark NOT VERIFIED.

Elapsed Home cadence/startup and browser timing are separate registered real-time observations, not 500-seed statistics. Human recognition ≥ 4/5 stays NOT VERIFIED without human answers. Source gates, contrast, artifact/hash compatibility and last-artifact screenshot pack are recorded separately; passing tests never overrides numeric misses.

## A5 gates, unchanged

The referenced A5 registration file was absent (acceptance had never been opened). The exact B1–Z gate text below is copied verbatim from the inherited PROMPT-A5.md; no missing historical registration is fabricated. The older P6 registration is retained as a separate source with its contaminated seed block, not reused as acceptance.

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


## Skills V5 gates, unchanged

## Acceptance (same 180-battle probe + lane A sims)
| Metric | Now | Target |
|---|---|---|
| Damage actions hitting > 1 foe | 9.1% | >= 30% |
| Support actions touching > 1 ally | 19.4% | >= 35% |
| Reactions per battle | ~4.8 detonate, unannounced | >= 2 announced; each reaction in >= 40% of its crew's battles |
| Ultimates | 2-3% of actions | >= 1 per cat per normal battle |
| Normal fight length | 17.3 rounds | 8-12 rounds; boss stays 45-90 s |
| Keyword coverage | cleanse 0.1% | each keyword >= 1 per 3 battles; cleanse >= 3% of support actions |
| Crew diversity | not measured | 4 crews above within 5 pp of best per boss/elite; cats 55-75% |
| Performance | cast 16.8 ms, 115 draws | cast <= 16.8 ms, <= 130 draws, demo +<= 1.5 MB |
| Readability | not measured | viewer names "what is on this unit" >= 4/5 after 2 fights (playtest kit) |
| Compatibility | - | skillsV5 OFF: OFF digest 47477251... and A5 hashes byte-identical; old saves load |


