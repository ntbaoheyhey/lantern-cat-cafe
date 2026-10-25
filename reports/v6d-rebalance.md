# V6d rebalance investigation

Proposal only. V2_CONFIG unchanged.

Branch: `ai/codex-v6d-rebalance`, based on freshly fetched `origin/main` at `4dd8e681ab91081765ec22bd82306629c608b056`. PR #154 is in its ancestry (`443f307`). No PR or Actions run is part of this task.

**Status:** NOT READY FOR SIGN-OFF. Failing targets: first-boss, chapter-growth, class-spread, chapter-bounds, boss-check.

Runtime: writer **182.078s**, focused simulator suite **54.23s**, full game-rules suite **74.28s**. The first full game-rules run was 139.10s; the final runtime follows the exact-roll craft-preview optimization and full 455-run equivalence check.

## What the user would be signing

The measurement-stable fallback clears chapter 1 in 6.1–9.4 active minutes across class medians; it misses the unchanged 10–15-minute target.
Chapter 5 takes 1442.4–1443.3 active minutes; three daily keys still force a second daily session.
Guardian's defensive/passive advantage remains visible; the class-spread target fails, and classes converge during the key wait.
The numbers include three daily keys, one-second walking, 180-second boss attempts, 18 starting ATK, 1.15 monster XP growth, and gear drops reduced from 2% to 0.67% (33.5% of current).
This is **not a recommendation to sign**. No proposal or scenario is applied to production; the sign-off remains blank.

## Gate checks

All three required gates passed before branching. The local Git identity was corrected before any commit. The full output is below.

```text
$ git config user.email
anthony.robinson.125292048@ms.namdinh.edu.vn
$ git config user.name
Hazel
$ git fetch origin +main:refs/remotes/origin/main
From https://github.com/ntbaoheyhey/taskbar-hero
 * [new branch]      main       -> origin/main
$ git config user.email 108352255+ntbaoheyhey@users.noreply.github.com
$ git config user.name ntbaoheyhey
$ git config user.email
108352255+ntbaoheyhey@users.noreply.github.com
$ git config user.name
ntbaoheyhey
$ git ls-tree --name-only origin/main packages/game-rules/src/v2/sim/search.test.ts packages/game-rules/src/v2/sim/targets.test.ts docs/proposals/numbers-v2.md
docs/proposals/numbers-v2.md
packages/game-rules/src/v2/sim/search.test.ts
packages/game-rules/src/v2/sim/targets.test.ts
$ git show origin/main:packages/game-rules/src/v2/sim/proposal.ts | grep -n 'dailyKeys: 3'
6:  idle: { dailyKeys: 3, walkTimeMs: 1000, clearedChapterKeyChance: 0.02 },
$ git show origin/main:docs/proposals/numbers-v2.md | grep -n 'User: ____'
193:User: ____ (approved / changes)
$ git show origin/main:packages/game-rules/src/v2/config.ts | grep -nE 'walkTimeMs:|baseHp:|dailyKeys:'
9:    baseHp: 100,
24:    walkTimeMs: 1000,
29:    dailyKeys: 1,
$ git rev-parse origin/main
4dd8e681ab91081765ec22bd82306629c608b056
$ git switch -c ai/codex-v6d-rebalance origin/main
Switched to a new branch 'ai/codex-v6d-rebalance'
branch 'ai/codex-v6d-rebalance' set up to track 'origin/main'.
```

## Changes and search selection

Boss gates are located with pure-claim binary-search replay to the earliest whole second. Only that prefix is applied, the boss is attempted, and the remainder of the original claim step continues. Cooldowns and daily boundaries are also events; a new-day top-up is credited by a one-second claim at a zero-key gate. Boss wins are displayed to 0.1 minute. Boss replay time is recorded separately and excluded from active claim minutes, as before.

Per-run data now retains per-chapter key-wait minutes, every boss attempt's level, max-level-before-ch5 status, and elapsed calendar days. Player-day profiles change only the daily-clock budget, with no away-time gains. The existing state/claim/combat rules are used throughout. S-A overrides daily keys to five, deliberately failing the unmodified guardrail. S-B adds exactly one chest key on a first clear, none on repeats, through an optional sim chest flag.

The final selection explicitly requires a ≤1-minute ch1 median difference at both three and five matched seeds before a config can become the main proposal. Among eligible, guardrail-passing refined sets it maximizes passing target count, then the search score (first-window samples and clears). This measurement qualification explains why the main proposal has fewer passing targets than the five-target config witness: the latter fails the required claim-size diagnostic. Scenario selection maximizes target count without this additional main-proposal qualification, and stays diagnostic. The witness and scenario configs are separately exported and fully disclosed; no target threshold is changed to accommodate the choice.

The broad family screens C5b (with current key-drop chance) plus 32 seeded random candidates across cat stats/XP growth, monster HP/XP growth, damage, walking and boss parameters, one seed/class for 360 minutes; the top three in each space are refined on seeds 1–5 for 1,800 minutes. Two focused 36-candidate grids cross starting ATK, monster HP growth and cat XP growth, with monster XP growth 1.06 and 1.11 respectively. A nine-candidate HP/ATK neighborhood, a 32-candidate lower-gear-drop calibration and a 24-candidate cooldown neighborhood follow. The focused screens use three seeds, or five with both step sizes for calibration, local and cooldown runs; the top four (top two for cooldown) are refined in all three spaces. Final selection rechecks all refined candidates' ch1 step stability. Search outputs and command transcripts below preserve the actual candidate numbers and runtimes. These are finite, deterministic families, not an exhaustive optimizer or a proof of impossibility.

The early broad screen preceded the small numeric-clock rounding fix; all final selected configs and the witness are independently remeasured by the final writer. The equipment fixed-point cache skips only identical level, inventory ids and equipped flags: item attributes never change in this policy. It preserves the greedy result while avoiding redundant work. Writer tables share cached runs; current/scenarios/profiles use five seeds, main uses twenty. The normal three-seed regression shares final states and target runs. The first full game-rules suite took 139.10s, above the roughly two-minute budget; craft previews were then changed to use the pure production roll and derived power without cloning the full state for every rejected slot. Only the chosen craft calls applyCraft. Recipe priority, slot order, ties, rolls, ids and state transitions are preserved; the second writer deep-compares its complete data against the 455 unique pre-optimization runs before writing the proposal.

## C5b versus new proposal

An absent override retains production's value. The cleared-chapter drop chance is restored to its current value and is absent from every search candidate; it is never used as an assumed source of first-clear keys.

| path | current | C5b | new proposal |
| --- | ---: | ---: | ---: |
| boss.attackIntervalMs | 1500 | 4500 | 4500 |
| boss.bigEveryMs | 6000 | 6000 | 6000 |
| boss.bigMultiplier | 2.5 | 1.5 | 1.5 |
| boss.maxMs | 60000 | 180000 | 180000 |
| cat.baseAtk | 10 | 14 | 18 |
| cat.baseDef | 5 | 5 | 5 |
| cat.baseHp | 100 | 300 | 300 |
| cat.levelGrowth | 0.06 | 0.06 | 0.06 |
| cat.xpGrowth | 1.12 | 1.12 | 1.12 |
| idle.clearedChapterKeyChance | 0.00666667 | 0.02 | 0.00666667 |
| idle.dailyKeys | 1 | 3 | 3 |
| idle.gearDropChance | 0.02 | 0.02 | 0.0067 |
| idle.walkTimeMs | 1000 | 1000 | 1000 |
| monster.atkBase | 4 | 8 | 8 |
| monster.atkGrowth | 1.12 | 1.06 | 1.06 |
| monster.hpBase | 30 | 90 | 90 |
| monster.hpGrowth | 1.13 | 1.06 | 1.06 |
| monster.xpBase | 6 | 18 | 18 |
| monster.xpGrowth | 1.11 | 1.11 | 1.15 |

## Planner diagnosis with measured numbers

| class | current ch2 win, min | C5b ch4 key wait, min | C5b ch4 / ch5 win, min | C5b ch5 entry level | C5b + S-A ch5 win, min |
| --- | ---: | ---: | --- | ---: | ---: |
| warrior | 1440.0 | 1409.9 | 1440.0 / 1442.7 | 60 | 36.8 |
| guardian | 1440.0 | 1410.1 | 1440.0 / 1442.9 | 60 | 37.0 |
| rogue | 1440.0 | 1411.8 | 1440.0 / 1443.1 | 60 | 34.4 |
| hunter | 1440.0 | 1408.0 | 1440.0 / 1442.7 | 60 | 38.3 |
| archer | 1440.0 | 1406.4 | 1440.0 / 1443.2 | 60 | 40.2 |
| witch | 1440.0 | 1405.7 | 1440.0 / 1443.4 | 60 | 41.5 |
| alchemist | 1440.0 | 1407.5 | 1440.0 / 1443.4 | 60 | 39.3 |

**D1 — CONFIRMED for the C5b frontier runs.** All classes wait more than 1,000 minutes for the fourth key; current config reaches the second boss just after minute 1,440. Five daily keys remove all C5b key waits (three seeds/class regression, plus five-seed causal tables). The daily top-up and one-key-on-win/no-key-on-loss behavior are production rules. The old C5b report recorded Hunter seed 5 stalled at minute 1,384 during that wait. The corrected C5b five-seed run still has a stall: Archer seed 5 at minute 1,420, ch4 r10 (1/35). The original Hunter seed 5 case no longer reproduces because sub-step/retry claims change loot/craft opportunities, but the same key-wait failure mechanism remains. C5b + S-A has 0/35 stalls; the new main proposal has 0/140. The key wait itself remains above 1,400 minutes and is not declared fixed merely because the new proposal passes never-stuck. The two chance-only C5b runs give identical complete results through ch5. Caveat to the planner's universal wording: computeClaimV2 can farm backward into a cleared chapter when the current combat gate cannot be won. Cleared-chapter drops can then matter for other configs. There is no invented action that deliberately farms old chapters, and no claim that this leaf is inert for all possible configs.

**D2 — CONFIRMED.** Every measured C5b class enters ch5 at level 60 after the key wait. The late first-attempt rates below are inflated by that wait. Removing the wait reduces entry levels and ch5 active time; it does not itself guarantee a 40–90% boss win rate. C5b + S-A enters ch5 at levels 49–51, yet ch4 and ch5 remain 100% first-attempt wins for every class (5/5 each). That is independent evidence for chapter-specific boss HP/ATK tuning even after the key artefact is removed.

**D3 — CONFIRMED for the old timestamp grid, with a limit to the proposed remedy.** Two-minute end-of-claim boss wins restricted the old 12-minute center to 10/12/14; 14/12−1 = 16.7%, outside ±15%. Gate events now occur inside claims, with a real synthetic gate-to-win test before the step end. The selected proposal's largest matched five-seed ch1 median difference is 0.267 minutes (≤1), and the three-seed regression also passes. Binary-search timing alone did not guarantee this for arbitrary configs: the initial C5b check measured a 1.8-minute Guardian difference. Claim size changes loot rolls, gear decisions, partial-kill time loss and bulk XP/stat-update boundaries in the production claim engine. Those real policy differences remain. Final selection qualifies timing explicitly, rather than claiming every config is claim-invariant.

**D4 — WRONG as stated after corrected timing; the XP/pacing mechanism is supported.** The new C5b five-seed run has Guardian ch1 success 40% (not 25%), Witch ch2 40%, Archer ch2 60%, and Archer/Witch ch3 80%: ch2/ch3 are not uniformly 90–100%. Immediate gate attempts change the actual entry strength. Nevertheless, ch1 entry is level 16 and ch3 entry is level 40–42, and later chapter duration ratios below 1.3 remain failures. Tripled XP and ten-kill later rounds still support the over-leveling/pacing diagnosis; the numerical claim about early success rates does not hold in this corrected five-seed diagnostic. These are five-seed diagnostics versus C5b's old twenty-seed summary, so individual percentage differences should not be attributed solely to timing. Per-chapter kill requirements and boss multipliers need separate design review after the key decision.

| class | C5b ch1 first-attempt win % | ch2 % | ch3 % | ch1 / ch2 / ch3 durations, min | first-attempt levels ch1 / ch3 |
| --- | ---: | ---: | ---: | --- | --- |
| warrior | 0 | 80 | 100 | 10.9 / 6.2 / 6.4 | 16 / 40 |
| guardian | 40 | 100 | 100 | 9.2 / 7.3 / 7.0 | 16 / 40 |
| rogue | 0 | 100 | 100 | 12.2 / 6.5 / 6.1 | 16 / 41 |
| hunter | 0 | 80 | 100 | 12.2 / 6.3 / 6.6 | 16 / 41 |
| archer | 0 | 60 | 80 | 12.4 / 7.3 / 6.9 | 16 / 41 |
| witch | 0 | 40 | 80 | 13.7 / 7.7 / 6.4 | 16 / 42 |
| alchemist | 0 | 100 | 100 | 11.7 / 6.9 / 6.9 | 16 / 40 |

## Unreachable targets and decisions for the user

The generated report below lists every failed target with a category, exact evidence and a content lever. “Not reachable” is restricted to the measured searched family; it is not a theorem about the full config space. The first-boss witness is explicitly “reachable with config (set found)”, despite its separate measurement failure. S-A/S-B remove the key wall but neither passes chapter-growth, class-spread, chapter-bounds or boss-check. Chapter-bounds still fails on chapters shorter than ten minutes even after its long-wait violation disappears.

- **S-A, five daily keys:** removes the first-five-clears key wait and its stall/cap artefacts; costs a lift of the ≤3 daily-key guardrail and a larger repeat-farming budget. It does not solve all targets.
- **S-B, first-clear key refund:** removes that wait while keeping three daily keys and one-key repeat wins; costs a first-clear chest content change, or coordinated rule/SQL work. It does not solve all targets.
- **Chapter pacing and bosses:** tune killsPerRound independently in chapters.ts and separate chapter boss hpMul/atkMul in monsters.ts from the single 40/2.5 archetype. Costs a content pass and remeasurement; no exact content numbers are approved by this task.
- **Class identity:** tune Guardian stats.hp/def and bonk.delayMs for the measured early lead, and per-class stats.atk/attackIntervalMs plus markPrey, volley, burn and poison damage if later timing spread is too small. Costs some current class strength/feel; keep both ≥3% range and ±15% bounds.


S-A, after removing D1: no chapter range is below 3%; the class-spread failure instead comes from classes outside the ±15% center bound.

S-B, after removing D1: no chapter range is below 3%; the class-spread failure instead comes from classes outside the ±15% center bound.

## Generated measurements

The following is the complete writer-generated proposal: target tables for all three spaces, quartiles at both step sizes, per-class key waits/levels/cap counts, calendar-day profiles, C5b causal diagnostics, monster TTK, boss durations/losses and class identity.

# Cat RPG v2 numbers proposal (V6d)

Proposal only. V2_CONFIG unchanged. Main proposal: seven classes, seeds 1–20, stepMinutes 2, 1,800 active minute horizon. Current, scenarios, C5b and player-day diagnostics: seeds 1–5. StepMinutes 1 diagnostic: seeds 1–5. Missing milestones remain Infinity. All boss times below are active minutes, rounded to 0.1 minute in timing tables.

**Status:** NOT READY FOR SIGN-OFF. Failing targets: first-boss, chapter-growth, class-spread, chapter-bounds, boss-check.

## Targets

| id | target in words | current result (5 seeds) | proposed result (20 seeds) | ok? |
| --- | --- | --- | --- | --- |
| first-boss | Every class median first win 10–15 minutes | warrior 36.3m; guardian 27.5m; rogue 36.3m; hunter 42.3m; archer 52.5m; witch 47.6m; alchemist 44.9m | warrior 8.0m; guardian 6.1m; rogue 8.1m; hunter 8.1m; archer 9.3m; witch 9.4m; alchemist 8.4m | NO |
| chapter-growth | Every class chapter duration grows 1.3–2.0x | warrior ch2 38.69x; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch2 51.43x; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch2 38.72x; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch2 33.07x; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch2 26.42x; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch2 29.27x; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch2 31.11x; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached | warrior ch2 0.66x; warrior ch3 0.89x; warrior ch4 301.52x; warrior ch5 0.00x; guardian ch2 1.01x; guardian ch3 0.85x; guardian ch4 269.64x; guardian ch5 0.00x; rogue ch2 0.66x; rogue ch3 0.87x; rogue ch4 304.15x; rogue ch5 0.00x; hunter ch2 0.65x; hunter ch3 0.93x; hunter ch4 290.15x; hunter ch5 0.00x; archer ch2 0.61x; archer ch3 0.93x; archer ch4 270.89x; archer ch5 0.00x; witch ch2 0.62x; witch ch3 0.92x; witch ch4 264.07x; witch ch5 0.00x; alchemist ch2 0.69x; alchemist ch3 0.93x; alchemist ch4 263.45x; alchemist ch5 0.00x | NO |
| class-spread | Every cumulative class median within ±15% of center AND chapter range / center ≥3% | ch1 range 59.3%; ch2 range 0.0%; ch3 range not reached; ch4 range not reached; ch5 range not reached; warrior ch1 -14.2%; guardian ch1 -35.0%; rogue ch1 -14.2%; hunter ch1 0.0%; archer ch1 24.3%; witch ch1 12.5%; alchemist ch1 6.1%; warrior ch2 0.0%; guardian ch2 0.0%; rogue ch2 0.0%; hunter ch2 0.0%; archer ch2 0.0%; witch ch2 0.0%; alchemist ch2 0.0%; warrior ch3 not reached; guardian ch3 not reached; rogue ch3 not reached; hunter ch3 not reached; archer ch3 not reached; witch ch3 not reached; alchemist ch3 not reached; warrior ch4 not reached; guardian ch4 not reached; rogue ch4 not reached; hunter ch4 not reached; archer ch4 not reached; witch ch4 not reached; alchemist ch4 not reached; warrior ch5 not reached; guardian ch5 not reached; rogue ch5 not reached; hunter ch5 not reached; archer ch5 not reached; witch ch5 not reached; alchemist ch5 not reached | ch1 range 40.6%; ch2 range 21.3%; ch3 range 16.5%; ch4 range 0.0%; ch5 range 0.1%; warrior ch1 -1.8%; guardian ch1 -24.6%; rogue ch1 0.0%; hunter ch1 0.0%; archer ch1 13.7%; witch ch1 16.0%; alchemist ch1 2.9%; warrior ch2 -2.2%; guardian ch2 -8.5%; rogue ch2 0.0%; hunter ch2 -0.6%; archer ch2 10.3%; witch ch2 12.8%; alchemist ch2 5.1%; warrior ch3 -2.4%; guardian ch3 -3.6%; rogue ch3 -0.9%; hunter ch3 0.0%; archer ch3 10.0%; witch ch3 13.0%; alchemist ch3 7.1%; warrior ch4 0.0%; guardian ch4 0.0%; rogue ch4 0.0%; hunter ch4 0.0%; archer ch4 0.0%; witch ch4 0.0%; alchemist ch4 0.0%; warrior ch5 -0.0%; guardian ch5 -0.0%; rogue ch5 0.0%; hunter ch5 -0.0%; archer ch5 0.0%; witch ch5 0.0%; alchemist ch5 0.0% | NO |
| chapter-bounds | Every chapter duration median 10–360 minutes | warrior ch1 36.3m; warrior ch2 1403.7m; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch1 27.5m; guardian ch2 1412.5m; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch1 36.3m; rogue ch2 1403.8m; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch1 42.3m; hunter ch2 1397.8m; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch1 52.5m; archer ch2 1387.5m; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch1 47.6m; witch ch2 1392.5m; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch1 44.9m; alchemist ch2 1395.2m; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached | warrior ch1 8.0m; warrior ch2 5.3m; warrior ch3 4.7m; warrior ch4 1422.2m; warrior ch5 2.4m; guardian ch1 6.1m; guardian ch2 6.2m; guardian ch3 5.3m; guardian ch4 1422.4m; guardian ch5 2.7m; rogue ch1 8.1m; rogue ch2 5.4m; rogue ch3 4.7m; rogue ch4 1421.9m; rogue ch5 2.7m; hunter ch1 8.1m; hunter ch2 5.3m; hunter ch3 4.9m; hunter ch4 1421.7m; hunter ch5 2.5m; archer ch1 9.3m; archer ch2 5.6m; archer ch3 5.2m; archer ch4 1419.9m; archer ch5 2.9m; witch ch1 9.4m; witch ch2 5.8m; witch ch3 5.4m; witch ch4 1419.3m; witch ch5 3.3m; alchemist ch1 8.4m; alchemist ch2 5.8m; alchemist ch3 5.4m; alchemist ch4 1420.4m; alchemist ch5 3.1m | NO |
| never-stuck | No six-hour period without level, round, boss win or power gain | 0/35 runs stuck | 0/140 runs stuck | yes |
| craft-salvage-loss | Every recipe returns less weighted salvage value than cost | rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 | rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 | yes |
| walk-share | Every class at ch1 r1 and ch3 r5: walking ≤50% at median observed entry level | warrior ch1 r1 L1.0: 44.6%; warrior ch3 r5 L60.0: 80.6%; guardian ch1 r1 L1.0: 34.2%; guardian ch3 r5 L60.0: 65.8%; rogue ch1 r1 L1.0: 34.5%; rogue ch3 r5 L60.0: 65.1%; hunter ch1 r1 L1.0: 41.7%; hunter ch3 r5 L60.0: 76.9%; archer ch1 r1 L1.0: 35.1%; archer ch3 r5 L60.0: 66.7%; witch ch1 r1 L1.0: 29.0%; witch ch3 r5 L60.0: 54.1%; alchemist ch1 r1 L1.0: 33.2%; alchemist ch3 r5 L60.0: 58.5% | warrior ch1 r1 L1.0: 21.1%; warrior ch3 r5 L40.0: 38.7%; guardian ch1 r1 L1.0: 19.9%; guardian ch3 r5 L39.0: 36.2%; rogue ch1 r1 L1.0: 22.2%; rogue ch3 r5 L40.0: 36.9%; hunter ch1 r1 L1.0: 21.7%; hunter ch3 r5 L40.0: 36.8%; archer ch1 r1 L1.0: 21.5%; archer ch3 r5 L40.0: 32.7%; witch ch1 r1 L1.0: 19.8%; witch ch3 r5 L40.0: 30.7%; alchemist ch1 r1 L1.0: 20.2%; alchemist ch3 r5 L40.0: 35.2% | yes |
| boss-check | Every chapter/class first-attempt wins 40–90%; median boss duration ≤180s | warrior ch1 first win 0.0%, median 24.00s; warrior ch2 first win 100.0%, median 8.20s; warrior ch3 first win 0.0%, median not reached (missing attempts); warrior ch4 first win 0.0%, median not reached (missing attempts); warrior ch5 first win 0.0%, median not reached (missing attempts); guardian ch1 first win 0.0%, median 30.00s; guardian ch2 first win 100.0%, median 9.77s; guardian ch3 first win 0.0%, median not reached (missing attempts); guardian ch4 first win 0.0%, median not reached (missing attempts); guardian ch5 first win 0.0%, median not reached (missing attempts); rogue ch1 first win 0.0%, median 21.00s; rogue ch2 first win 100.0%, median 8.61s; rogue ch3 first win 0.0%, median not reached (missing attempts); rogue ch4 first win 0.0%, median not reached (missing attempts); rogue ch5 first win 0.0%, median not reached (missing attempts); hunter ch1 first win 0.0%, median 24.00s; hunter ch2 first win 100.0%, median 7.83s; hunter ch3 first win 0.0%, median not reached (missing attempts); hunter ch4 first win 0.0%, median not reached (missing attempts); hunter ch5 first win 0.0%, median not reached (missing attempts); archer ch1 first win 0.0%, median 24.00s; archer ch2 first win 100.0%, median 8.62s; archer ch3 first win 0.0%, median not reached (missing attempts); archer ch4 first win 0.0%, median not reached (missing attempts); archer ch5 first win 0.0%, median not reached (missing attempts); witch ch1 first win 0.0%, median 21.00s; witch ch2 first win 100.0%, median 9.27s; witch ch3 first win 0.0%, median not reached (missing attempts); witch ch4 first win 0.0%, median not reached (missing attempts); witch ch5 first win 0.0%, median not reached (missing attempts); alchemist ch1 first win 0.0%, median 24.00s; alchemist ch2 first win 100.0%, median 9.16s; alchemist ch3 first win 0.0%, median not reached (missing attempts); alchemist ch4 first win 0.0%, median not reached (missing attempts); alchemist ch5 first win 0.0%, median not reached (missing attempts) | warrior ch1 first win 0.0%, median 78.00s; warrior ch2 first win 100.0%, median 67.34s; warrior ch3 first win 100.0%, median 53.16s; warrior ch4 first win 100.0%, median 11.48s; warrior ch5 first win 100.0%, median 21.27s; guardian ch1 first win 0.0%, median 98.66s; guardian ch2 first win 100.0%, median 71.91s; guardian ch3 first win 100.0%, median 53.95s; guardian ch4 first win 100.0%, median 12.14s; guardian ch5 first win 100.0%, median 22.71s; rogue ch1 first win 0.0%, median 72.00s; rogue ch2 first win 100.0%, median 63.70s; rogue ch3 first win 100.0%, median 47.21s; rogue ch4 first win 100.0%, median 11.67s; rogue ch5 first win 100.0%, median 21.46s; hunter ch1 first win 0.0%, median 73.31s; hunter ch2 first win 100.0%, median 66.39s; hunter ch3 first win 100.0%, median 53.36s; hunter ch4 first win 100.0%, median 11.26s; hunter ch5 first win 100.0%, median 22.36s; archer ch1 first win 0.0%, median 72.00s; archer ch2 first win 100.0%, median 66.87s; archer ch3 first win 100.0%, median 52.18s; archer ch4 first win 100.0%, median 12.68s; archer ch5 first win 100.0%, median 23.16s; witch ch1 first win 0.0%, median 66.00s; witch ch2 first win 100.0%, median 68.95s; witch ch3 first win 100.0%, median 53.82s; witch ch4 first win 100.0%, median 14.07s; witch ch5 first win 100.0%, median 25.85s; alchemist ch1 first win 0.0%, median 73.51s; alchemist ch2 first win 100.0%, median 68.01s; alchemist ch3 first win 100.0%, median 57.06s; alchemist ch4 first win 100.0%, median 12.62s; alchemist ch5 first win 100.0%, median 23.24s | NO |
| guardrails | Each proposed numeric leaf 0.33–3x current; walk ≤2000ms; boss ≤180s; daily keys ≤3 | All numeric leaves within 0.33–3x; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 | All numeric leaves within 0.33–3x; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 | yes |

## Scenario table — scenario, needs a user decision

S-A gives five daily keys (the material cap); it deliberately FAILS the unchanged dailyKeys ≤3 guardrail. S-B adds one key to each first-clear chest, none on repeats; it requires a content change in chests.ts, or a coordinated applyBossResult + SQL v2_boss_fight rule change. Neither is part of PROPOSED_V2_OVERRIDES. Each scenario uses its separately searched config below.

| target | proposal (20 seeds) | S-A (5 seeds) | S-B (5 seeds) |
| --- | --- | --- | --- |
| first-boss | NO | yes | yes |
| chapter-growth | NO | NO | NO |
| class-spread | NO | NO | NO |
| chapter-bounds | NO | NO | NO |
| never-stuck | yes | yes | yes |
| craft-salvage-loss | yes | yes | yes |
| walk-share | yes | yes | yes |
| boss-check | NO | NO | NO |
| guardrails | yes | NO | yes |

### S-A: scenario, needs a user decision

Config overrides (S-A additionally sets dailyKeys=5):

```json
{
  "cat": {
    "baseAtk": 14,
    "baseHp": 300,
    "baseDef": 5,
    "levelGrowth": 0.06,
    "xpGrowth": 1.12
  },
  "monster": {
    "hpBase": 90,
    "hpGrowth": 1.06,
    "atkBase": 8,
    "atkGrowth": 1.06,
    "xpBase": 18,
    "xpGrowth": 1.11
  },
  "idle": {
    "dailyKeys": 5,
    "walkTimeMs": 1000,
    "gearDropChance": 0.0067
  },
  "boss": {
    "maxMs": 180000,
    "attackIntervalMs": 4500,
    "bigEveryMs": 6000,
    "bigMultiplier": 1.5
  }
}
```

| target | result | ok? |
| --- | --- | --- |
| first-boss | warrior 12.2m; guardian 10.4m; rogue 12.3m; hunter 13.2m; archer 14.4m; witch 14.7m; alchemist 12.7m | yes |
| chapter-growth | warrior ch2 0.54x; warrior ch3 0.99x; warrior ch4 1.00x; warrior ch5 0.97x; guardian ch2 0.70x; guardian ch3 0.97x; guardian ch4 0.96x; guardian ch5 0.99x; rogue ch2 0.54x; rogue ch3 0.96x; rogue ch4 0.96x; rogue ch5 0.99x; hunter ch2 0.47x; hunter ch3 1.09x; hunter ch4 1.03x; hunter ch5 0.93x; archer ch2 0.54x; archer ch3 0.86x; archer ch4 1.04x; archer ch5 1.09x; witch ch2 0.60x; witch ch3 0.79x; witch ch4 1.04x; witch ch5 1.03x; alchemist ch2 0.55x; alchemist ch3 1.03x; alchemist ch4 0.96x; alchemist ch5 0.99x | NO |
| class-spread | ch1 range 34.0%; ch2 range 35.0%; ch3 range 25.0%; ch4 range 21.2%; ch5 range 21.6%; warrior ch1 -3.4%; guardian ch1 -18.1%; rogue ch1 -2.8%; hunter ch1 4.5%; archer ch1 13.7%; witch ch1 15.9%; alchemist ch1 0.0%; warrior ch2 -2.1%; guardian ch2 -9.8%; rogue ch2 -1.8%; hunter ch2 0.0%; archer ch2 14.7%; witch ch2 25.3%; alchemist ch2 4.6%; warrior ch3 -1.9%; guardian ch3 -6.0%; rogue ch3 -2.2%; hunter ch3 0.0%; archer ch3 11.2%; witch ch3 19.0%; alchemist ch3 4.8%; warrior ch4 -2.3%; guardian ch4 -5.3%; rogue ch4 -4.6%; hunter ch4 0.0%; archer ch4 9.4%; witch ch4 16.0%; alchemist ch4 3.8%; warrior ch5 -2.0%; guardian ch5 -3.4%; rogue ch5 -4.9%; hunter ch5 0.0%; archer ch5 10.0%; witch ch5 16.7%; alchemist ch5 4.1% | NO |
| chapter-bounds | warrior ch1 12.2m; warrior ch2 6.7m; warrior ch3 6.6m; warrior ch4 6.6m; warrior ch5 6.4m; guardian ch1 10.4m; guardian ch2 7.3m; guardian ch3 7.0m; guardian ch4 6.8m; guardian ch5 6.7m; rogue ch1 12.3m; rogue ch2 6.6m; rogue ch3 6.3m; rogue ch4 6.1m; rogue ch5 6.0m; hunter ch1 13.2m; hunter ch2 6.2m; hunter ch3 6.7m; hunter ch4 6.9m; hunter ch5 6.4m; archer ch1 14.4m; archer ch2 7.7m; archer ch3 6.6m; archer ch4 6.9m; archer ch5 7.5m; witch ch1 14.7m; witch ch2 8.8m; witch ch3 7.0m; witch ch4 7.3m; witch ch5 7.5m; alchemist ch1 12.7m; alchemist ch2 7.0m; alchemist ch3 7.2m; alchemist ch4 6.9m; alchemist ch5 6.8m | NO |
| never-stuck | 0/35 runs stuck | yes |
| craft-salvage-loss | rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 | yes |
| walk-share | warrior ch1 r1 L1.0: 21.1%; warrior ch3 r5 L35.0: 27.6%; guardian ch1 r1 L1.0: 17.5%; guardian ch3 r5 L35.0: 25.0%; rogue ch1 r1 L1.0: 17.5%; rogue ch3 r5 L35.0: 26.6%; hunter ch1 r1 L1.0: 19.4%; hunter ch3 r5 L36.0: 26.7%; archer ch1 r1 L1.0: 18.0%; archer ch3 r5 L36.0: 26.1%; witch ch1 r1 L1.0: 17.1%; witch ch3 r5 L37.0: 25.3%; alchemist ch1 r1 L1.0: 17.8%; alchemist ch3 r5 L35.0: 24.5% | yes |
| boss-check | warrior ch1 first win 0.0%, median 81.00s; warrior ch2 first win 100.0%, median 94.48s; warrior ch3 first win 100.0%, median 91.15s; warrior ch4 first win 100.0%, median 86.61s; warrior ch5 first win 100.0%, median 81.81s; guardian ch1 first win 0.0%, median 108.16s; guardian ch2 first win 100.0%, median 101.87s; guardian ch3 first win 100.0%, median 97.78s; guardian ch4 first win 100.0%, median 89.23s; guardian ch5 first win 100.0%, median 88.71s; rogue ch1 first win 0.0%, median 66.00s; rogue ch2 first win 60.0%, median 85.50s; rogue ch3 first win 100.0%, median 81.89s; rogue ch4 first win 100.0%, median 75.28s; rogue ch5 first win 100.0%, median 61.76s; hunter ch1 first win 0.0%, median 76.50s; hunter ch2 first win 80.0%, median 93.35s; hunter ch3 first win 100.0%, median 92.46s; hunter ch4 first win 100.0%, median 89.15s; hunter ch5 first win 100.0%, median 79.94s; archer ch1 first win 0.0%, median 66.00s; archer ch2 first win 20.0%, median 85.50s; archer ch3 first win 80.0%, median 91.96s; archer ch4 first win 80.0%, median 94.38s; archer ch5 first win 100.0%, median 95.61s; witch ch1 first win 0.0%, median 67.50s; witch ch2 first win 20.0%, median 85.50s; witch ch3 first win 80.0%, median 90.76s; witch ch4 first win 80.0%, median 100.53s; witch ch5 first win 100.0%, median 100.11s; alchemist ch1 first win 0.0%, median 72.00s; alchemist ch2 first win 80.0%, median 95.56s; alchemist ch3 first win 80.0%, median 98.06s; alchemist ch4 first win 100.0%, median 90.29s; alchemist ch5 first win 100.0%, median 86.52s | NO |
| guardrails | idle.dailyKeys: 5 outside 0.33–3x current 1; idle.dailyKeys: 5 > 3 | NO |

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 12.2 / 12.2 / 12.2 | 18.6 / 18.9 / 18.9 | 25.4 / 25.5 / 25.5 | 31.8 / 32.1 / 32.3 | 38.2 / 38.5 / 38.8 | 9.22 | 25.47 |
| guardian | 10.4 / 10.4 / 10.4 | 16.9 / 17.4 / 17.6 | 23.9 / 24.4 / 24.6 | 30.5 / 31.2 / 31.6 | 37.0 / 38.0 / 38.3 | 9.37 | 24 |
| rogue | 12.3 / 12.3 / 12.3 | 18.8 / 18.9 / 19.5 | 25.3 / 25.4 / 25.6 | 31.3 / 31.4 / 31.6 | 36.4 / 37.4 / 37.8 | 9.3 | 25.38 |
| hunter | 13.2 / 13.2 / 13.2 | 19.0 / 19.3 / 19.6 | 25.6 / 26.0 / 26.6 | 32.4 / 32.9 / 33.4 | 39.3 / 39.3 / 39.7 | 9.22 | 25.97 |
| archer | 14.4 / 14.4 / 14.4 | 21.9 / 22.1 / 22.2 | 28.6 / 28.9 / 29.0 | 35.0 / 36.0 / 36.9 | 42.3 / 43.3 / 43.5 | 9.38 | 28 |
| witch | 14.7 / 14.7 / 14.7 | 23.5 / 24.1 / 24.4 | 30.4 / 30.9 / 30.9 | 37.5 / 38.1 / 39.3 | 45.2 / 45.9 / 46.8 | 9.67 | 30 |
| alchemist | 12.7 / 12.7 / 12.7 | 19.6 / 20.1 / 20.1 | 27.1 / 27.2 / 27.5 | 34.1 / 34.1 / 34.4 | 40.7 / 41.0 / 41.2 | 9.65 | 27.12 |

Key waits and levels (wait; first attempt level / all-attempt median level):

| class | ch1 | ch2 | ch3 | ch4 | ch5 | reached max level before ch5 win |
| --- | --- | --- | --- | --- | --- | --- |
| warrior | 0m; L16 / L21 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| guardian | 0m; L16 / L19 | 0m; L31 / L31 | 0m; L40 / L40 | 0m; L50 / L50 | 0m; L59 / L59 | 1/5 |
| rogue | 0m; L16 / L21 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| hunter | 0m; L16 / L20 | 0m; L32 / L32.5 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| archer | 0m; L16 / L21 | 0m; L33 / L33 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L60 / L60 | 3/5 |
| witch | 0m; L16 / L22 | 0m; L33 / L34 | 0m; L42 / L42 | 0m; L50 / L50 | 0m; L60 / L60 | 3/5 |
| alchemist | 0m; L16 / L20 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 1/5 |

| class | chapter | fights | losses | first-attempt wins / seeds | median fight seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
| warrior | 1 | 35 | 30 | 0 / 5 | 81 |
| warrior | 2 | 5 | 0 | 5 / 5 | 94.48 |
| warrior | 3 | 5 | 0 | 5 / 5 | 91.15 |
| warrior | 4 | 5 | 0 | 5 / 5 | 86.61 |
| warrior | 5 | 5 | 0 | 5 / 5 | 81.81 |
| guardian | 1 | 24 | 19 | 0 / 5 | 108.16 |
| guardian | 2 | 5 | 0 | 5 / 5 | 101.87 |
| guardian | 3 | 5 | 0 | 5 / 5 | 97.78 |
| guardian | 4 | 5 | 0 | 5 / 5 | 89.23 |
| guardian | 5 | 5 | 0 | 5 / 5 | 88.71 |
| rogue | 1 | 35 | 30 | 0 / 5 | 66 |
| rogue | 2 | 7 | 2 | 3 / 5 | 85.5 |
| rogue | 3 | 5 | 0 | 5 / 5 | 81.89 |
| rogue | 4 | 5 | 0 | 5 / 5 | 75.28 |
| rogue | 5 | 5 | 0 | 5 / 5 | 61.76 |
| hunter | 1 | 39 | 34 | 0 / 5 | 76.5 |
| hunter | 2 | 6 | 1 | 4 / 5 | 93.35 |
| hunter | 3 | 5 | 0 | 5 / 5 | 92.46 |
| hunter | 4 | 5 | 0 | 5 / 5 | 89.15 |
| hunter | 5 | 5 | 0 | 5 / 5 | 79.94 |
| archer | 1 | 44 | 39 | 0 / 5 | 66 |
| archer | 2 | 10 | 5 | 1 / 5 | 85.5 |
| archer | 3 | 6 | 1 | 4 / 5 | 91.96 |
| archer | 4 | 6 | 1 | 4 / 5 | 94.38 |
| archer | 5 | 5 | 0 | 5 / 5 | 95.61 |
| witch | 1 | 46 | 41 | 0 / 5 | 67.5 |
| witch | 2 | 15 | 10 | 1 / 5 | 85.5 |
| witch | 3 | 6 | 1 | 4 / 5 | 90.76 |
| witch | 4 | 6 | 1 | 4 / 5 | 100.53 |
| witch | 5 | 5 | 0 | 5 / 5 | 100.11 |
| alchemist | 1 | 36 | 31 | 0 / 5 | 72 |
| alchemist | 2 | 6 | 1 | 4 / 5 | 95.56 |
| alchemist | 3 | 6 | 1 | 4 / 5 | 98.06 |
| alchemist | 4 | 5 | 0 | 5 / 5 | 90.29 |
| alchemist | 5 | 5 | 0 | 5 / 5 | 86.52 |

Entry-level monster time-to-kill:

| class | ch1 r1 | ch3 r1 | ch3 r5 | ch5 r1 |
| --- | ---: | ---: | ---: | ---: |
| warrior | 3740 ms (L1) | 2462.67 ms (L32) | 2623.45 ms (L35) | 2577.29 ms (L50) |
| guardian | 4720 ms (L1) | 3007.03 ms (L31) | 3001.91 ms (L35) | 2737.86 ms (L50) |
| rogue | 4700 ms (L1) | 2410.74 ms (L32) | 2410.74 ms (L35) | 2659.13 ms (L50) |
| hunter | 4150 ms (L1) | 2722.21 ms (L33) | 2745.66 ms (L36) | 2456.63 ms (L50) |
| archer | 4550 ms (L1) | 2549.55 ms (L34) | 2512.65 ms (L36) | 3101.63 ms (L50) |
| witch | 4850 ms (L1) | 2307.46 ms (L35) | 2955.69 ms (L37) | 3360.91 ms (L50) |
| alchemist | 4610 ms (L1) | 3078.37 ms (L32) | 3078.37 ms (L35) | 2907.73 ms (L50) |

| class | chapter | entry level | entry monster TTK, seconds | median boss duration, seconds | median boss losses/run |
| --- | --- | --- | --- | --- | --- |
| warrior | 1 | 1 | 3.74 | 81 | 6 |
| warrior | 3 | 32 | 2.46 | 91.15 | 0 |
| warrior | 5 | 50 | 2.58 | 81.81 | 0 |
| guardian | 1 | 1 | 4.72 | 108.16 | 4 |
| guardian | 3 | 31 | 3.01 | 97.78 | 0 |
| guardian | 5 | 50 | 2.74 | 88.71 | 0 |
| rogue | 1 | 1 | 4.7 | 66 | 6 |
| rogue | 3 | 32 | 2.41 | 81.89 | 0 |
| rogue | 5 | 50 | 2.66 | 61.76 | 0 |
| hunter | 1 | 1 | 4.15 | 76.5 | 7 |
| hunter | 3 | 33 | 2.72 | 92.46 | 0 |
| hunter | 5 | 50 | 2.46 | 79.94 | 0 |
| archer | 1 | 1 | 4.55 | 66 | 8 |
| archer | 3 | 34 | 2.55 | 91.96 | 0 |
| archer | 5 | 50 | 3.1 | 95.61 | 0 |
| witch | 1 | 1 | 4.85 | 67.5 | 8 |
| witch | 3 | 35 | 2.31 | 90.76 | 0 |
| witch | 5 | 50 | 3.36 | 100.11 | 0 |
| alchemist | 1 | 1 | 4.61 | 72 | 6 |
| alchemist | 3 | 32 | 3.08 | 98.06 | 0 |
| alchemist | 5 | 50 | 2.91 | 86.52 | 0 |

How classes differ: Warrior attacks every 1s with cleave; Guardian every 1.4s with 1.3× HP/DEF and a 500ms bonk delay; Rogue has 0.8s twin strikes, 25% crit and 10% dodge; Hunter has a 1.1s mark (+20% damage taken and material find); Archer has a 0.9s volley cycle; Witch has 1.6s bolts, splash and burn; Alchemist has 1.3s poison flasks and heal-on-kill. Ch1: fastest guardian (10.37m), slowest witch (14.67m); Ch2: fastest guardian (17.38m), slowest witch (24.13m); Ch3: fastest guardian (24.4m), slowest witch (30.9m); Ch4: fastest guardian (31.17m), slowest witch (38.15m); Ch5: fastest rogue (37.42m), slowest witch (45.92m). Boss losses, most first: witch 53, archer 46, hunter 35, alchemist 33, rogue 32, warrior 30, guardian 19. These observations retain the content-defined attack intervals, passives, HP, DEF and dodge differences; timing spread alone does not validate combat feel.

### S-B: scenario, needs a user decision

Config overrides (S-A additionally sets dailyKeys=5):

```json
{
  "cat": {
    "baseAtk": 14,
    "baseHp": 300,
    "baseDef": 5,
    "levelGrowth": 0.06,
    "xpGrowth": 1.12
  },
  "monster": {
    "hpBase": 90,
    "hpGrowth": 1.06,
    "atkBase": 8,
    "atkGrowth": 1.06,
    "xpBase": 18,
    "xpGrowth": 1.11
  },
  "idle": {
    "dailyKeys": 3,
    "walkTimeMs": 1000,
    "gearDropChance": 0.0067
  },
  "boss": {
    "maxMs": 180000,
    "attackIntervalMs": 4500,
    "bigEveryMs": 6000,
    "bigMultiplier": 1.5
  }
}
```

| target | result | ok? |
| --- | --- | --- |
| first-boss | warrior 12.2m; guardian 10.4m; rogue 12.3m; hunter 13.2m; archer 14.4m; witch 14.7m; alchemist 12.7m | yes |
| chapter-growth | warrior ch2 0.54x; warrior ch3 0.99x; warrior ch4 1.00x; warrior ch5 0.97x; guardian ch2 0.70x; guardian ch3 0.97x; guardian ch4 0.96x; guardian ch5 0.99x; rogue ch2 0.54x; rogue ch3 0.96x; rogue ch4 0.96x; rogue ch5 0.99x; hunter ch2 0.47x; hunter ch3 1.09x; hunter ch4 1.03x; hunter ch5 0.93x; archer ch2 0.54x; archer ch3 0.86x; archer ch4 1.04x; archer ch5 1.09x; witch ch2 0.60x; witch ch3 0.79x; witch ch4 1.04x; witch ch5 1.03x; alchemist ch2 0.55x; alchemist ch3 1.03x; alchemist ch4 0.96x; alchemist ch5 0.99x | NO |
| class-spread | ch1 range 34.0%; ch2 range 35.0%; ch3 range 25.0%; ch4 range 21.2%; ch5 range 21.6%; warrior ch1 -3.4%; guardian ch1 -18.1%; rogue ch1 -2.8%; hunter ch1 4.5%; archer ch1 13.7%; witch ch1 15.9%; alchemist ch1 0.0%; warrior ch2 -2.1%; guardian ch2 -9.8%; rogue ch2 -1.8%; hunter ch2 0.0%; archer ch2 14.7%; witch ch2 25.3%; alchemist ch2 4.6%; warrior ch3 -1.9%; guardian ch3 -6.0%; rogue ch3 -2.2%; hunter ch3 0.0%; archer ch3 11.2%; witch ch3 19.0%; alchemist ch3 4.8%; warrior ch4 -2.3%; guardian ch4 -5.3%; rogue ch4 -4.6%; hunter ch4 0.0%; archer ch4 9.4%; witch ch4 16.0%; alchemist ch4 3.8%; warrior ch5 -2.0%; guardian ch5 -3.4%; rogue ch5 -4.9%; hunter ch5 0.0%; archer ch5 10.0%; witch ch5 16.7%; alchemist ch5 4.1% | NO |
| chapter-bounds | warrior ch1 12.2m; warrior ch2 6.7m; warrior ch3 6.6m; warrior ch4 6.6m; warrior ch5 6.4m; guardian ch1 10.4m; guardian ch2 7.3m; guardian ch3 7.0m; guardian ch4 6.8m; guardian ch5 6.7m; rogue ch1 12.3m; rogue ch2 6.6m; rogue ch3 6.3m; rogue ch4 6.1m; rogue ch5 6.0m; hunter ch1 13.2m; hunter ch2 6.2m; hunter ch3 6.7m; hunter ch4 6.9m; hunter ch5 6.4m; archer ch1 14.4m; archer ch2 7.7m; archer ch3 6.6m; archer ch4 6.9m; archer ch5 7.5m; witch ch1 14.7m; witch ch2 8.8m; witch ch3 7.0m; witch ch4 7.3m; witch ch5 7.5m; alchemist ch1 12.7m; alchemist ch2 7.0m; alchemist ch3 7.2m; alchemist ch4 6.9m; alchemist ch5 6.8m | NO |
| never-stuck | 0/35 runs stuck | yes |
| craft-salvage-loss | rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 | yes |
| walk-share | warrior ch1 r1 L1.0: 21.1%; warrior ch3 r5 L35.0: 27.6%; guardian ch1 r1 L1.0: 17.5%; guardian ch3 r5 L35.0: 25.0%; rogue ch1 r1 L1.0: 17.5%; rogue ch3 r5 L35.0: 26.6%; hunter ch1 r1 L1.0: 19.4%; hunter ch3 r5 L36.0: 26.7%; archer ch1 r1 L1.0: 18.0%; archer ch3 r5 L36.0: 26.1%; witch ch1 r1 L1.0: 17.1%; witch ch3 r5 L37.0: 25.3%; alchemist ch1 r1 L1.0: 17.8%; alchemist ch3 r5 L35.0: 24.5% | yes |
| boss-check | warrior ch1 first win 0.0%, median 81.00s; warrior ch2 first win 100.0%, median 94.48s; warrior ch3 first win 100.0%, median 91.15s; warrior ch4 first win 100.0%, median 86.61s; warrior ch5 first win 100.0%, median 81.81s; guardian ch1 first win 0.0%, median 108.16s; guardian ch2 first win 100.0%, median 101.87s; guardian ch3 first win 100.0%, median 97.78s; guardian ch4 first win 100.0%, median 89.23s; guardian ch5 first win 100.0%, median 88.71s; rogue ch1 first win 0.0%, median 66.00s; rogue ch2 first win 60.0%, median 85.50s; rogue ch3 first win 100.0%, median 81.89s; rogue ch4 first win 100.0%, median 75.28s; rogue ch5 first win 100.0%, median 61.76s; hunter ch1 first win 0.0%, median 76.50s; hunter ch2 first win 80.0%, median 93.35s; hunter ch3 first win 100.0%, median 92.46s; hunter ch4 first win 100.0%, median 89.15s; hunter ch5 first win 100.0%, median 79.94s; archer ch1 first win 0.0%, median 66.00s; archer ch2 first win 20.0%, median 85.50s; archer ch3 first win 80.0%, median 91.96s; archer ch4 first win 80.0%, median 94.38s; archer ch5 first win 100.0%, median 95.61s; witch ch1 first win 0.0%, median 67.50s; witch ch2 first win 20.0%, median 85.50s; witch ch3 first win 80.0%, median 90.76s; witch ch4 first win 80.0%, median 100.53s; witch ch5 first win 100.0%, median 100.11s; alchemist ch1 first win 0.0%, median 72.00s; alchemist ch2 first win 80.0%, median 95.56s; alchemist ch3 first win 80.0%, median 98.06s; alchemist ch4 first win 100.0%, median 90.29s; alchemist ch5 first win 100.0%, median 86.52s | NO |
| guardrails | All numeric leaves within 0.33–3x; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 | yes |

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 12.2 / 12.2 / 12.2 | 18.6 / 18.9 / 18.9 | 25.4 / 25.5 / 25.5 | 31.8 / 32.1 / 32.3 | 38.2 / 38.5 / 38.8 | 9.22 | 25.47 |
| guardian | 10.4 / 10.4 / 10.4 | 16.9 / 17.4 / 17.6 | 23.9 / 24.4 / 24.6 | 30.5 / 31.2 / 31.6 | 37.0 / 38.0 / 38.3 | 9.37 | 24 |
| rogue | 12.3 / 12.3 / 12.3 | 18.8 / 18.9 / 19.5 | 25.3 / 25.4 / 25.6 | 31.3 / 31.4 / 31.6 | 36.4 / 37.4 / 37.8 | 9.3 | 25.38 |
| hunter | 13.2 / 13.2 / 13.2 | 19.0 / 19.3 / 19.6 | 25.6 / 26.0 / 26.6 | 32.4 / 32.9 / 33.4 | 39.3 / 39.3 / 39.7 | 9.22 | 25.97 |
| archer | 14.4 / 14.4 / 14.4 | 21.9 / 22.1 / 22.2 | 28.6 / 28.9 / 29.0 | 35.0 / 36.0 / 36.9 | 42.3 / 43.3 / 43.5 | 9.38 | 28 |
| witch | 14.7 / 14.7 / 14.7 | 23.5 / 24.1 / 24.4 | 30.4 / 30.9 / 30.9 | 37.5 / 38.1 / 39.3 | 45.2 / 45.9 / 46.8 | 9.67 | 30 |
| alchemist | 12.7 / 12.7 / 12.7 | 19.6 / 20.1 / 20.1 | 27.1 / 27.2 / 27.5 | 34.1 / 34.1 / 34.4 | 40.7 / 41.0 / 41.2 | 9.65 | 27.12 |

Key waits and levels (wait; first attempt level / all-attempt median level):

| class | ch1 | ch2 | ch3 | ch4 | ch5 | reached max level before ch5 win |
| --- | --- | --- | --- | --- | --- | --- |
| warrior | 0m; L16 / L21 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| guardian | 0m; L16 / L19 | 0m; L31 / L31 | 0m; L40 / L40 | 0m; L50 / L50 | 0m; L59 / L59 | 1/5 |
| rogue | 0m; L16 / L21 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| hunter | 0m; L16 / L20 | 0m; L32 / L32.5 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| archer | 0m; L16 / L21 | 0m; L33 / L33 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L60 / L60 | 3/5 |
| witch | 0m; L16 / L22 | 0m; L33 / L34 | 0m; L42 / L42 | 0m; L50 / L50 | 0m; L60 / L60 | 3/5 |
| alchemist | 0m; L16 / L20 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 1/5 |

| class | chapter | fights | losses | first-attempt wins / seeds | median fight seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
| warrior | 1 | 35 | 30 | 0 / 5 | 81 |
| warrior | 2 | 5 | 0 | 5 / 5 | 94.48 |
| warrior | 3 | 5 | 0 | 5 / 5 | 91.15 |
| warrior | 4 | 5 | 0 | 5 / 5 | 86.61 |
| warrior | 5 | 5 | 0 | 5 / 5 | 81.81 |
| guardian | 1 | 24 | 19 | 0 / 5 | 108.16 |
| guardian | 2 | 5 | 0 | 5 / 5 | 101.87 |
| guardian | 3 | 5 | 0 | 5 / 5 | 97.78 |
| guardian | 4 | 5 | 0 | 5 / 5 | 89.23 |
| guardian | 5 | 5 | 0 | 5 / 5 | 88.71 |
| rogue | 1 | 35 | 30 | 0 / 5 | 66 |
| rogue | 2 | 7 | 2 | 3 / 5 | 85.5 |
| rogue | 3 | 5 | 0 | 5 / 5 | 81.89 |
| rogue | 4 | 5 | 0 | 5 / 5 | 75.28 |
| rogue | 5 | 5 | 0 | 5 / 5 | 61.76 |
| hunter | 1 | 39 | 34 | 0 / 5 | 76.5 |
| hunter | 2 | 6 | 1 | 4 / 5 | 93.35 |
| hunter | 3 | 5 | 0 | 5 / 5 | 92.46 |
| hunter | 4 | 5 | 0 | 5 / 5 | 89.15 |
| hunter | 5 | 5 | 0 | 5 / 5 | 79.94 |
| archer | 1 | 44 | 39 | 0 / 5 | 66 |
| archer | 2 | 10 | 5 | 1 / 5 | 85.5 |
| archer | 3 | 6 | 1 | 4 / 5 | 91.96 |
| archer | 4 | 6 | 1 | 4 / 5 | 94.38 |
| archer | 5 | 5 | 0 | 5 / 5 | 95.61 |
| witch | 1 | 46 | 41 | 0 / 5 | 67.5 |
| witch | 2 | 15 | 10 | 1 / 5 | 85.5 |
| witch | 3 | 6 | 1 | 4 / 5 | 90.76 |
| witch | 4 | 6 | 1 | 4 / 5 | 100.53 |
| witch | 5 | 5 | 0 | 5 / 5 | 100.11 |
| alchemist | 1 | 36 | 31 | 0 / 5 | 72 |
| alchemist | 2 | 6 | 1 | 4 / 5 | 95.56 |
| alchemist | 3 | 6 | 1 | 4 / 5 | 98.06 |
| alchemist | 4 | 5 | 0 | 5 / 5 | 90.29 |
| alchemist | 5 | 5 | 0 | 5 / 5 | 86.52 |

Entry-level monster time-to-kill:

| class | ch1 r1 | ch3 r1 | ch3 r5 | ch5 r1 |
| --- | ---: | ---: | ---: | ---: |
| warrior | 3740 ms (L1) | 2462.67 ms (L32) | 2623.45 ms (L35) | 2577.29 ms (L50) |
| guardian | 4720 ms (L1) | 3007.03 ms (L31) | 3001.91 ms (L35) | 2737.86 ms (L50) |
| rogue | 4700 ms (L1) | 2410.74 ms (L32) | 2410.74 ms (L35) | 2659.13 ms (L50) |
| hunter | 4150 ms (L1) | 2722.21 ms (L33) | 2745.66 ms (L36) | 2456.63 ms (L50) |
| archer | 4550 ms (L1) | 2549.55 ms (L34) | 2512.65 ms (L36) | 3101.63 ms (L50) |
| witch | 4850 ms (L1) | 2307.46 ms (L35) | 2955.69 ms (L37) | 3360.91 ms (L50) |
| alchemist | 4610 ms (L1) | 3078.37 ms (L32) | 3078.37 ms (L35) | 2907.73 ms (L50) |

| class | chapter | entry level | entry monster TTK, seconds | median boss duration, seconds | median boss losses/run |
| --- | --- | --- | --- | --- | --- |
| warrior | 1 | 1 | 3.74 | 81 | 6 |
| warrior | 3 | 32 | 2.46 | 91.15 | 0 |
| warrior | 5 | 50 | 2.58 | 81.81 | 0 |
| guardian | 1 | 1 | 4.72 | 108.16 | 4 |
| guardian | 3 | 31 | 3.01 | 97.78 | 0 |
| guardian | 5 | 50 | 2.74 | 88.71 | 0 |
| rogue | 1 | 1 | 4.7 | 66 | 6 |
| rogue | 3 | 32 | 2.41 | 81.89 | 0 |
| rogue | 5 | 50 | 2.66 | 61.76 | 0 |
| hunter | 1 | 1 | 4.15 | 76.5 | 7 |
| hunter | 3 | 33 | 2.72 | 92.46 | 0 |
| hunter | 5 | 50 | 2.46 | 79.94 | 0 |
| archer | 1 | 1 | 4.55 | 66 | 8 |
| archer | 3 | 34 | 2.55 | 91.96 | 0 |
| archer | 5 | 50 | 3.1 | 95.61 | 0 |
| witch | 1 | 1 | 4.85 | 67.5 | 8 |
| witch | 3 | 35 | 2.31 | 90.76 | 0 |
| witch | 5 | 50 | 3.36 | 100.11 | 0 |
| alchemist | 1 | 1 | 4.61 | 72 | 6 |
| alchemist | 3 | 32 | 3.08 | 98.06 | 0 |
| alchemist | 5 | 50 | 2.91 | 86.52 | 0 |

How classes differ: Warrior attacks every 1s with cleave; Guardian every 1.4s with 1.3× HP/DEF and a 500ms bonk delay; Rogue has 0.8s twin strikes, 25% crit and 10% dodge; Hunter has a 1.1s mark (+20% damage taken and material find); Archer has a 0.9s volley cycle; Witch has 1.6s bolts, splash and burn; Alchemist has 1.3s poison flasks and heal-on-kill. Ch1: fastest guardian (10.37m), slowest witch (14.67m); Ch2: fastest guardian (17.38m), slowest witch (24.13m); Ch3: fastest guardian (24.4m), slowest witch (30.9m); Ch4: fastest guardian (31.17m), slowest witch (38.15m); Ch5: fastest rogue (37.42m), slowest witch (45.92m). Boss losses, most first: witch 53, archer 46, hunter 35, alchemist 33, rogue 32, warrior 30, guardian 19. These observations retain the content-defined attack intervals, passives, HP, DEF and dodge differences; timing spread alone does not validate combat feel.

## Three-seed regression (same seeds as the normal proposal test)

| target | passes on seeds 1–3 |
| --- | --- |
| first-boss | NO |
| chapter-growth | NO |
| class-spread | NO |
| chapter-bounds | NO |
| never-stuck | yes |
| craft-salvage-loss | yes |
| walk-share | yes |
| boss-check | NO |
| guardrails | yes |

## Proposed changes

| path | current | proposed | why |
| --- | --- | --- | --- |
| cat.baseAtk | 10 | 18 | The best candidate meeting the mandatory claim-size stability check in the searched family. Its first-boss target still fails; do not sign off. |
| cat.baseHp | 100 | 300 | Cap starting HP at three times current health, retaining meaningful early boss losses and class HP/DEF differences. |
| cat.baseDef | 5 | 5 | Keep the current base DEF of 5; class defensive multipliers remain content-defined. |
| cat.levelGrowth | 0.06 | 0.06 | Retain current 6% stat growth rather than the old 0.8% proposal so levels materially improve combat strength. |
| cat.xpGrowth | 1.12 | 1.12 | Search XP-to-next-level growth to reduce late over-leveling. |
| monster.hpBase | 30 | 90 | Use three times starting monster HP so attacking matters more than walking at the measured probes. |
| monster.hpGrowth | 1.13 | 1.06 | Use 6% stage HP growth to keep later monsters manageable within the three-minute boss cap; chapter growth still fails. |
| monster.atkBase | 4 | 8 | Double initial monster damage to retain survival pressure alongside the bounded HP increase. |
| monster.atkGrowth | 1.12 | 1.06 | Use 6% stage damage growth to avoid late survival walls; first-attempt success still needs content tuning. |
| monster.xpBase | 6 | 18 | Triple initial XP per monster to make level progression meaningful before the first boss and reduce early farming waits. |
| monster.xpGrowth | 1.11 | 1.15 | Search stage XP growth independently of monster HP. |
| idle.dailyKeys | 1 | 3 | Grant three daily keys, the allowed maximum; the remaining key budget gap is explicitly reported. |
| idle.walkTimeMs | 1000 | 1000 | Keep current one-second walking instead of six seconds; measured combat retains the larger share of each probe. |
| idle.gearDropChance | 0.02 | 0.0067 | Reduce gear drops to 0.67% (33.5% of current); the finite search uses this lower loot rate to change early equipment progression. This is a real balance cost, not a measurement-only adjustment. |
| boss.maxMs | 60000 | 180000 | Bound every boss attempt to three minutes instead of the old twenty-minute proposal. |
| boss.attackIntervalMs | 1500 | 4500 | Allow 4.5 seconds between normal boss attacks to keep bounded player HP viable; first-attempt rate failures remain visible. |
| boss.bigEveryMs | 6000 | 6000 | Keep the current six-second big-attack cadence so telegraphed attacks remain part of combat. |
| boss.bigMultiplier | 2.5 | 1.5 | Reduce big-hit damage to 1.5 times normal damage while retaining early survival losses. |

## Per-class times (proposed, stepMinutes 2)

Cumulative active minutes: p25 / median / p75. Level columns: median.

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 8.0 / 8.0 / 8.0 | 12.9 / 13.2 / 13.4 | 17.6 / 17.9 / 18.1 | 1440.0 / 1440.0 / 1440.0 | 1442.4 / 1442.4 / 1442.5 | 5.98 | 16 |
| guardian | 6.1 / 6.1 / 6.1 | 12.3 / 12.3 / 12.5 | 17.6 / 17.6 / 17.7 | 1440.0 / 1440.0 / 1440.0 | 1442.7 / 1442.8 / 1442.8 | 6.13 | 16 |
| rogue | 8.1 / 8.1 / 8.1 | 13.3 / 13.5 / 13.6 | 17.9 / 18.1 / 18.3 | 1440.0 / 1440.0 / 1440.0 | 1442.7 / 1442.8 / 1442.8 | 6.13 | 16 |
| hunter | 8.1 / 8.1 / 8.1 | 13.3 / 13.4 / 13.4 | 18.2 / 18.3 / 18.4 | 1440.0 / 1440.0 / 1440.0 | 1442.4 / 1442.5 / 1442.5 | 6.13 | 16 |
| archer | 9.0 / 9.3 / 9.3 | 14.2 / 14.9 / 14.9 | 19.3 / 20.1 / 20.2 | 1440.0 / 1440.0 / 1440.0 | 1442.9 / 1442.9 / 1443.0 | 6.25 | 18 |
| witch | 9.4 / 9.4 / 9.4 | 15.1 / 15.2 / 15.3 | 20.4 / 20.7 / 20.8 | 1440.0 / 1440.0 / 1440.0 | 1443.3 / 1443.3 / 1443.3 | 7.43 | 18 |
| alchemist | 8.4 / 8.4 / 8.4 | 14.1 / 14.2 / 14.3 | 19.5 / 19.6 / 19.7 | 1440.0 / 1440.0 / 1440.0 | 1443.1 / 1443.1 / 1443.1 | 6.37 | 18 |

## StepMinutes 1 diagnostic (proposed, seeds 1–5)

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 8.2 / 8.2 / 8.2 | 13.3 / 13.3 / 13.4 | 18.0 / 18.1 / 18.1 | 1440.0 / 1440.0 / 1440.0 | 1442.3 / 1442.4 / 1442.4 | 6.17 | 16 |
| guardian | 6.3 / 6.3 / 6.3 | 12.2 / 12.5 / 12.7 | 17.4 / 17.5 / 17.6 | 1440.0 / 1440.0 / 1440.0 | 1442.7 / 1442.7 / 1442.8 | 6.3 | 15 |
| rogue | 8.3 / 8.3 / 8.3 | 13.4 / 13.4 / 13.7 | 18.1 / 18.2 / 18.4 | 1440.0 / 1440.0 / 1440.0 | 1442.8 / 1442.8 / 1442.8 | 6.28 | 16 |
| hunter | 8.3 / 8.3 / 8.3 | 13.5 / 13.6 / 13.6 | 18.2 / 18.4 / 18.5 | 1440.0 / 1440.0 / 1440.0 | 1442.4 / 1442.5 / 1442.6 | 6.3 | 16 |
| archer | 9.4 / 9.4 / 9.4 | 14.9 / 15.1 / 15.3 | 20.3 / 20.4 / 20.4 | 1440.0 / 1440.0 / 1440.0 | 1443.0 / 1443.0 / 1443.0 | 6.45 | 18 |
| witch | 9.7 / 9.7 / 9.7 | 15.5 / 15.6 / 15.8 | 20.9 / 21.1 / 21.2 | 1440.0 / 1440.0 / 1440.0 | 1443.3 / 1443.3 / 1443.3 | 6.7 | 18 |
| alchemist | 8.5 / 8.5 / 9.5 | 14.3 / 14.6 / 15.1 | 19.8 / 19.9 / 20.6 | 1440.0 / 1440.0 / 1440.0 | 1443.1 / 1443.1 / 1443.1 | 6.5 | 17 |

Matched stepMinutes 2, seeds 1–5:

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 7.9 / 8.0 / 8.0 | 12.8 / 13.0 / 13.3 | 17.4 / 17.8 / 17.9 | 1440.0 / 1440.0 / 1440.0 | 1442.4 / 1442.5 / 1442.5 | 5.98 | 16 |
| guardian | 6.1 / 6.1 / 6.1 | 12.3 / 12.3 / 12.3 | 17.6 / 17.6 / 17.7 | 1440.0 / 1440.0 / 1440.0 | 1442.7 / 1442.8 / 1442.8 | 6.13 | 16 |
| rogue | 8.1 / 8.1 / 8.1 | 13.3 / 13.4 / 13.5 | 17.9 / 18.1 / 18.1 | 1440.0 / 1440.0 / 1440.0 | 1442.7 / 1442.8 / 1442.8 | 6.13 | 16 |
| hunter | 8.1 / 8.1 / 8.1 | 13.3 / 13.3 / 13.4 | 17.9 / 18.2 / 18.3 | 1440.0 / 1440.0 / 1440.0 | 1442.5 / 1442.5 / 1442.5 | 6.13 | 16 |
| archer | 9.3 / 9.3 / 9.3 | 14.7 / 14.9 / 14.9 | 19.8 / 20.1 / 20.1 | 1440.0 / 1440.0 / 1440.0 | 1442.9 / 1442.9 / 1443.0 | 6.25 | 18 |
| witch | 9.4 / 9.4 / 9.4 | 14.9 / 15.1 / 15.3 | 20.3 / 20.4 / 20.7 | 1440.0 / 1440.0 / 1440.0 | 1443.3 / 1443.3 / 1443.3 | 7.43 | 18 |
| alchemist | 8.4 / 8.4 / 8.4 | 14.1 / 14.2 / 14.2 | 19.5 / 19.6 / 19.6 | 1440.0 / 1440.0 / 1440.0 | 1443.1 / 1443.1 / 1443.1 | 6.37 | 18 |

| class | ch1 median absolute difference, minutes | within 1 minute? |
| --- | --- | --- |
| warrior | 0.18 | yes |
| guardian | 0.17 | yes |
| rogue | 0.15 | yes |
| hunter | 0.17 | yes |
| archer | 0.2 | yes |
| witch | 0.27 | yes |
| alchemist | 0.13 | yes |

## Key wait and boss-attempt level (proposed)

Each chapter: median key wait minutes; median first-attempt level / median level over all attempts. Missing attempts remain Infinity. Last column is runs reaching maxLevel before the ch5 win, including incomplete runs that reached the cap.

| class | ch1 | ch2 | ch3 | ch4 | ch5 | reached max level before ch5 win |
| --- | --- | --- | --- | --- | --- | --- |
| warrior | 0m; L17 / L20 | 0m; L35 / L35 | 0m; L47 / L47 | 1417.83m; L60 / L60 | 0m; L60 / L60 | 20/20 |
| guardian | 0m; L17 / L18.5 | 0m; L34 / L34 | 0m; L47 / L47 | 1417.82m; L60 / L60 | 0m; L60 / L60 | 20/20 |
| rogue | 0m; L17 / L20 | 0m; L35 / L35 | 0m; L47 / L47 | 1417.78m; L60 / L60 | 0m; L60 / L60 | 20/20 |
| hunter | 0m; L17 / L21 | 0m; L35 / L35 | 0m; L47 / L47 | 1417.51m; L60 / L60 | 0m; L60 / L60 | 20/20 |
| archer | 0m; L17 / L22 | 0m; L35 / L35 | 0m; L47 / L47 | 1415.32m; L60 / L60 | 0m; L60 / L60 | 20/20 |
| witch | 0m; L17 / L21 | 0m; L35 / L35 | 0m; L47 / L47 | 1414.59m; L60 / L60 | 0m; L60 / L60 | 20/20 |
| alchemist | 0m; L17 / L20 | 0m; L35 / L35 | 0m; L47 / L47 | 1415.61m; L60 / L60 | 0m; L60 / L60 | 20/20 |

## Player-day profiles — diagnostic only, never used by targets

Seeds 1–5; cell = median elapsed calendar days / active minutes. Each player starts at the beginning of their daily activity window. Day advances after the stated active-minute budget; no away-time gains are simulated. Fractions use active minutes / 1440 within the current calendar day. Thus 1.01d means just into the second daily session, not two full days.

| active minutes/day | class | ch1 | ch2 | ch3 | ch4 | ch5 |
| --- | --- | --- | --- | --- | --- | --- |
| 1440 | warrior | 0.01d / 7.98m | 0.01d / 13.02m | 0.01d / 17.82m | 1d / 1440.02m | 1d / 1442.47m |
| 1440 | guardian | 0d / 6.13m | 0.01d / 12.32m | 0.01d / 17.6m | 1d / 1440.02m | 1d / 1442.75m |
| 1440 | rogue | 0.01d / 8.13m | 0.01d / 13.42m | 0.01d / 18.08m | 1d / 1440.02m | 1d / 1442.83m |
| 1440 | hunter | 0.01d / 8.13m | 0.01d / 13.35m | 0.01d / 18.2m | 1d / 1440.02m | 1d / 1442.52m |
| 1440 | archer | 0.01d / 9.25m | 0.01d / 14.9m | 0.01d / 20.1m | 1d / 1440.02m | 1d / 1442.93m |
| 1440 | witch | 0.01d / 9.43m | 0.01d / 15.07m | 0.01d / 20.43m | 1d / 1440.02m | 1d / 1443.3m |
| 1440 | alchemist | 0.01d / 8.37m | 0.01d / 14.17m | 0.01d / 19.57m | 1d / 1440.02m | 1d / 1443.1m |
| 480 | warrior | 0.01d / 7.98m | 0.01d / 13.02m | 0.01d / 17.82m | 1d / 480.02m | 1d / 482.72m |
| 480 | guardian | 0d / 6.13m | 0.01d / 12.32m | 0.01d / 17.6m | 1d / 480.02m | 1d / 482.88m |
| 480 | rogue | 0.01d / 8.13m | 0.01d / 13.42m | 0.01d / 18.08m | 1d / 480.02m | 1d / 482.93m |
| 480 | hunter | 0.01d / 8.13m | 0.01d / 13.35m | 0.01d / 18.2m | 1d / 480.02m | 1d / 482.92m |
| 480 | archer | 0.01d / 9.25m | 0.01d / 14.9m | 0.01d / 20.1m | 1d / 480.02m | 1d / 483.2m |
| 480 | witch | 0.01d / 9.43m | 0.01d / 15.07m | 0.01d / 20.43m | 1d / 480.02m | 1d / 483.45m |
| 480 | alchemist | 0.01d / 8.37m | 0.01d / 14.17m | 0.01d / 19.57m | 1d / 480.02m | 1d / 483.3m |
| 120 | warrior | 0.01d / 7.98m | 0.01d / 13.02m | 0.01d / 17.82m | 1d / 120.02m | 1d / 123.45m |
| 120 | guardian | 0d / 6.13m | 0.01d / 12.32m | 0.01d / 17.6m | 1d / 120.02m | 1d / 123.43m |
| 120 | rogue | 0.01d / 8.13m | 0.01d / 13.42m | 0.01d / 18.08m | 1d / 120.02m | 1d / 123.1m |
| 120 | hunter | 0.01d / 8.13m | 0.01d / 13.35m | 0.01d / 18.2m | 1d / 120.02m | 1d / 123.1m |
| 120 | archer | 0.01d / 9.25m | 0.01d / 14.9m | 0.01d / 20.1m | 1d / 120.02m | 1d / 123.78m |
| 120 | witch | 0.01d / 9.43m | 0.01d / 15.07m | 0.01d / 20.43m | 1d / 120.02m | 1d / 123.77m |
| 120 | alchemist | 0.01d / 8.37m | 0.01d / 14.17m | 0.01d / 19.57m | 1d / 120.02m | 1d / 123.6m |

## C5b remeasured with sub-step timing (5 seeds)

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 9.5 / 10.9 / 11.2 | 17.0 / 17.1 / 17.6 | 23.0 / 23.4 / 23.6 | 1440.0 / 1440.0 / 1440.0 | 1442.6 / 1442.7 / 1442.8 | 9.2 | 23.35 |
| guardian | 6.3 / 9.2 / 9.4 | 14.3 / 16.4 / 16.5 | 21.7 / 23.3 / 23.5 | 1440.0 / 1440.0 / 1440.0 | 1442.8 / 1442.9 / 1442.9 | 9.37 | 23.25 |
| rogue | 9.2 / 12.2 / 12.3 | 16.0 / 17.4 / 18.8 | 22.2 / 22.9 / 25.0 | 1440.0 / 1440.0 / 1440.0 | 1442.8 / 1443.1 / 1443.1 | 9.2 | 22.85 |
| hunter | 12.0 / 12.2 / 12.2 | 18.3 / 18.4 / 18.8 | 24.1 / 25.3 / 25.4 | 1440.0 / 1440.0 / 1440.0 | 1442.7 / 1442.7 / 1442.7 | 9.2 | 25.32 |
| archer | 10.4 / 12.4 / 12.4 | 18.8 / 19.3 / 20.1 | 26.0 / 26.6 / 27.0 | 1440.0 / 1440.0 / 1440.0 | 1443.2 / 1443.2 / 1443.3 | 9.38 | 26 |
| witch | 10.7 / 13.7 / 13.7 | 18.9 / 20.1 / 21.4 | 26.9 / 27.3 / 27.6 | 1440.0 / 1440.0 / 1440.0 | 1443.3 / 1443.4 / 1443.4 | 9.67 | 26 |
| alchemist | 10.6 / 11.7 / 12.7 | 16.9 / 18.9 / 19.4 | 23.9 / 25.9 / 26.2 | 1440.0 / 1440.0 / 1440.0 | 1443.2 / 1443.4 / 1443.4 | 9.65 | 25.92 |

| class | ch1 | ch2 | ch3 | ch4 | ch5 | reached max level before ch5 win |
| --- | --- | --- | --- | --- | --- | --- |
| warrior | 0m; L16 / L19.5 | 0m; L31 / L31.5 | 0m; L40 / L40 | 1409.87m; L60 / L60 | 0m; L60 / L60 | 5/5 |
| guardian | 0m; L16 / L18 | 0m; L31 / L31 | 0m; L40 / L40 | 1410.12m; L60 / L60 | 0m; L60 / L60 | 5/5 |
| rogue | 0m; L16 / L20 | 0m; L32 / L32 | 0m; L41 / L41 | 1411.77m; L60 / L60 | 0m; L60 / L60 | 5/5 |
| hunter | 0m; L16 / L21 | 0m; L32 / L32 | 0m; L41 / L41 | 1408.02m; L60 / L60 | 0m; L60 / L60 | 5/5 |
| archer | 0m; L16 / L21 | 0m; L32 / L32 | 0m; L41 / L41 | 1406.38m; L60 / L60 | 0m; L60 / L60 | 5/5 |
| witch | 0m; L16 / L21 | 0m; L32 / L33 | 0m; L42 / L42 | 1405.72m; L60 / L60 | 0m; L60 / L60 | 5/5 |
| alchemist | 0m; L16 / L19 | 0m; L32 / L32 | 0m; L40 / L40 | 1407.48m; L60 / L60 | 0m; L60 / L60 | 5/5 |

| class | chapter | fights | losses | first-attempt wins / seeds | median fight seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
| warrior | 1 | 28 | 23 | 0 / 5 | 79.5 |
| warrior | 2 | 6 | 1 | 4 / 5 | 86.18 |
| warrior | 3 | 5 | 0 | 5 / 5 | 86.27 |
| warrior | 4 | 5 | 0 | 5 / 5 | 13.33 |
| warrior | 5 | 5 | 0 | 5 / 5 | 22.93 |
| guardian | 1 | 15 | 10 | 2 / 5 | 114 |
| guardian | 2 | 5 | 0 | 5 / 5 | 97.86 |
| guardian | 3 | 5 | 0 | 5 / 5 | 96.33 |
| guardian | 4 | 5 | 0 | 5 / 5 | 15.82 |
| guardian | 5 | 5 | 0 | 5 / 5 | 27.89 |
| rogue | 1 | 29 | 24 | 0 / 5 | 78 |
| rogue | 2 | 5 | 0 | 5 / 5 | 87.6 |
| rogue | 3 | 5 | 0 | 5 / 5 | 63.88 |
| rogue | 4 | 5 | 0 | 5 / 5 | 14.23 |
| rogue | 5 | 5 | 0 | 5 / 5 | 26.94 |
| hunter | 1 | 35 | 30 | 0 / 5 | 72 |
| hunter | 2 | 6 | 1 | 4 / 5 | 91.7 |
| hunter | 3 | 5 | 0 | 5 / 5 | 89.53 |
| hunter | 4 | 5 | 0 | 5 / 5 | 11.87 |
| hunter | 5 | 5 | 0 | 5 / 5 | 24.93 |
| archer | 1 | 33 | 28 | 0 / 5 | 72 |
| archer | 2 | 8 | 3 | 3 / 5 | 87.3 |
| archer | 3 | 7 | 2 | 4 / 5 | 85.5 |
| archer | 4 | 5 | 0 | 5 / 5 | 13.15 |
| archer | 5 | 5 | 0 | 5 / 5 | 25.27 |
| witch | 1 | 34 | 29 | 0 / 5 | 69.75 |
| witch | 2 | 9 | 4 | 2 / 5 | 84 |
| witch | 3 | 6 | 1 | 4 / 5 | 87.42 |
| witch | 4 | 5 | 0 | 5 / 5 | 14 |
| witch | 5 | 5 | 0 | 5 / 5 | 25.68 |
| alchemist | 1 | 29 | 24 | 0 / 5 | 80.67 |
| alchemist | 2 | 5 | 0 | 5 / 5 | 91.41 |
| alchemist | 3 | 5 | 0 | 5 / 5 | 85.25 |
| alchemist | 4 | 5 | 0 | 5 / 5 | 14.79 |
| alchemist | 5 | 5 | 0 | 5 / 5 | 27.91 |

## C5b with only S-A removing the key wall (5 seeds; causal diagnostic)

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 9.5 / 10.9 / 11.2 | 17.0 / 17.1 / 17.6 | 23.0 / 23.4 / 23.6 | 28.4 / 30.1 / 30.3 | 34.1 / 36.8 / 36.8 | 9.2 | 23.35 |
| guardian | 6.3 / 9.2 / 9.4 | 14.3 / 16.4 / 16.5 | 21.7 / 23.3 / 23.5 | 28.3 / 29.9 / 29.9 | 35.2 / 37.0 / 37.2 | 9.37 | 23.25 |
| rogue | 9.2 / 12.2 / 12.3 | 16.0 / 17.4 / 18.8 | 22.2 / 22.9 / 25.0 | 27.9 / 28.2 / 30.7 | 33.0 / 34.4 / 36.6 | 9.2 | 22.85 |
| hunter | 12.0 / 12.2 / 12.2 | 18.3 / 18.4 / 18.8 | 24.1 / 25.3 / 25.4 | 30.4 / 32.0 / 32.0 | 37.0 / 38.3 / 38.6 | 9.2 | 25.32 |
| archer | 10.4 / 12.4 / 12.4 | 18.8 / 19.3 / 20.1 | 26.0 / 26.6 / 27.0 | 32.8 / 33.6 / 34.1 | 39.7 / 40.3 / 41.2 | 9.38 | 26 |
| witch | 10.7 / 13.7 / 13.7 | 18.9 / 20.1 / 21.4 | 26.9 / 27.3 / 27.6 | 34.0 / 34.3 / 34.4 | 41.4 / 41.5 / 41.7 | 9.67 | 26 |
| alchemist | 10.6 / 11.7 / 12.7 | 16.9 / 18.9 / 19.4 | 23.9 / 25.9 / 26.2 | 30.7 / 32.5 / 33.0 | 38.2 / 39.3 / 39.8 | 9.65 | 25.92 |

| class | ch1 | ch2 | ch3 | ch4 | ch5 | reached max level before ch5 win |
| --- | --- | --- | --- | --- | --- | --- |
| warrior | 0m; L16 / L19.5 | 0m; L31 / L31.5 | 0m; L40 / L40 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| guardian | 0m; L16 / L18 | 0m; L31 / L31 | 0m; L40 / L40 | 0m; L50 / L50 | 0m; L59 / L59 | 1/5 |
| rogue | 0m; L16 / L20 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| hunter | 0m; L16 / L21 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| archer | 0m; L16 / L21 | 0m; L32 / L32 | 0m; L41 / L41 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |
| witch | 0m; L16 / L21 | 0m; L32 / L33 | 0m; L42 / L42 | 0m; L51 / L51 | 0m; L60 / L60 | 4/5 |
| alchemist | 0m; L16 / L19 | 0m; L32 / L32 | 0m; L40 / L40 | 0m; L50 / L50 | 0m; L59 / L59 | 2/5 |

| class | chapter | fights | losses | first-attempt wins / seeds | median fight seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
| warrior | 1 | 28 | 23 | 0 / 5 | 79.5 |
| warrior | 2 | 6 | 1 | 4 / 5 | 86.18 |
| warrior | 3 | 5 | 0 | 5 / 5 | 86.27 |
| warrior | 4 | 5 | 0 | 5 / 5 | 82.16 |
| warrior | 5 | 5 | 0 | 5 / 5 | 80.38 |
| guardian | 1 | 15 | 10 | 2 / 5 | 114 |
| guardian | 2 | 5 | 0 | 5 / 5 | 97.86 |
| guardian | 3 | 5 | 0 | 5 / 5 | 96.33 |
| guardian | 4 | 5 | 0 | 5 / 5 | 84.83 |
| guardian | 5 | 5 | 0 | 5 / 5 | 97.2 |
| rogue | 1 | 29 | 24 | 0 / 5 | 78 |
| rogue | 2 | 5 | 0 | 5 / 5 | 87.6 |
| rogue | 3 | 5 | 0 | 5 / 5 | 63.88 |
| rogue | 4 | 5 | 0 | 5 / 5 | 60.79 |
| rogue | 5 | 5 | 0 | 5 / 5 | 62.59 |
| hunter | 1 | 35 | 30 | 0 / 5 | 72 |
| hunter | 2 | 6 | 1 | 4 / 5 | 91.7 |
| hunter | 3 | 5 | 0 | 5 / 5 | 89.53 |
| hunter | 4 | 5 | 0 | 5 / 5 | 85.8 |
| hunter | 5 | 5 | 0 | 5 / 5 | 86.28 |
| archer | 1 | 33 | 28 | 0 / 5 | 72 |
| archer | 2 | 8 | 3 | 3 / 5 | 87.3 |
| archer | 3 | 7 | 2 | 4 / 5 | 85.5 |
| archer | 4 | 5 | 0 | 5 / 5 | 86.36 |
| archer | 5 | 5 | 0 | 5 / 5 | 84.24 |
| witch | 1 | 34 | 29 | 0 / 5 | 69.75 |
| witch | 2 | 9 | 4 | 2 / 5 | 84 |
| witch | 3 | 6 | 1 | 4 / 5 | 87.42 |
| witch | 4 | 5 | 0 | 5 / 5 | 81.46 |
| witch | 5 | 5 | 0 | 5 / 5 | 80.86 |
| alchemist | 1 | 29 | 24 | 0 / 5 | 80.67 |
| alchemist | 2 | 5 | 0 | 5 / 5 | 91.41 |
| alchemist | 3 | 5 | 0 | 5 / 5 | 85.25 |
| alchemist | 4 | 5 | 0 | 5 / 5 | 82.71 |
| alchemist | 5 | 5 | 0 | 5 / 5 | 79.36 |

## Per-class times (current, 5 seeds)

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 31.4 / 36.3 / 38.2 | 1440.0 / 1440.0 / 1440.0 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16 | 66 |
| guardian | 26.5 / 27.5 / 31.4 | 1440.0 / 1440.0 / 1440.0 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16.52 | 72 |
| rogue | 34.4 / 36.3 / 38.5 | 1440.0 / 1440.0 / 1440.0 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 15.35 | 66 |
| hunter | 39.3 / 42.3 / 44.4 | 1440.0 / 1440.0 / 1440.0 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 15.47 | 70 |
| archer | 43.5 / 52.5 / 52.6 | 1440.0 / 1440.0 / 1440.0 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16.53 | 74 |
| witch | 45.5 / 47.6 / 49.8 | 1440.0 / 1440.0 / 1440.0 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 17.57 | 76 |
| alchemist | 41.5 / 44.9 / 45.8 | 1440.0 / 1440.0 / 1440.0 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16.83 | 74 |

## Boss fights and losses (proposed)

Totals across seeds; median duration includes wins and losses. First attempt is the first actual fight, never the first winning attempt. Level for every attempt is retained in the run data.

| class | chapter | fights | losses | first-attempt wins / seeds | median fight seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
| warrior | 1 | 77 | 57 | 0 / 20 | 78 |
| warrior | 2 | 20 | 0 | 20 / 20 | 67.34 |
| warrior | 3 | 20 | 0 | 20 / 20 | 53.16 |
| warrior | 4 | 20 | 0 | 20 / 20 | 11.48 |
| warrior | 5 | 20 | 0 | 20 / 20 | 21.27 |
| guardian | 1 | 40 | 20 | 0 / 20 | 98.66 |
| guardian | 2 | 20 | 0 | 20 / 20 | 71.91 |
| guardian | 3 | 20 | 0 | 20 / 20 | 53.95 |
| guardian | 4 | 20 | 0 | 20 / 20 | 12.14 |
| guardian | 5 | 20 | 0 | 20 / 20 | 22.71 |
| rogue | 1 | 78 | 58 | 0 / 20 | 72 |
| rogue | 2 | 20 | 0 | 20 / 20 | 63.7 |
| rogue | 3 | 20 | 0 | 20 / 20 | 47.21 |
| rogue | 4 | 20 | 0 | 20 / 20 | 11.67 |
| rogue | 5 | 20 | 0 | 20 / 20 | 21.46 |
| hunter | 1 | 80 | 60 | 0 / 20 | 73.31 |
| hunter | 2 | 20 | 0 | 20 / 20 | 66.39 |
| hunter | 3 | 20 | 0 | 20 / 20 | 53.36 |
| hunter | 4 | 20 | 0 | 20 / 20 | 11.26 |
| hunter | 5 | 20 | 0 | 20 / 20 | 22.36 |
| archer | 1 | 95 | 75 | 0 / 20 | 72 |
| archer | 2 | 20 | 0 | 20 / 20 | 66.87 |
| archer | 3 | 20 | 0 | 20 / 20 | 52.18 |
| archer | 4 | 20 | 0 | 20 / 20 | 12.68 |
| archer | 5 | 20 | 0 | 20 / 20 | 23.16 |
| witch | 1 | 99 | 79 | 0 / 20 | 66 |
| witch | 2 | 20 | 0 | 20 / 20 | 68.95 |
| witch | 3 | 20 | 0 | 20 / 20 | 53.82 |
| witch | 4 | 20 | 0 | 20 / 20 | 14.07 |
| witch | 5 | 20 | 0 | 20 / 20 | 25.85 |
| alchemist | 1 | 79 | 59 | 0 / 20 | 73.51 |
| alchemist | 2 | 20 | 0 | 20 / 20 | 68.01 |
| alchemist | 3 | 20 | 0 | 20 / 20 | 57.06 |
| alchemist | 4 | 20 | 0 | 20 / 20 | 12.62 |
| alchemist | 5 | 20 | 0 | 20 / 20 | 23.24 |

## Median monster time-to-kill (proposed)

Probe = equal-weight median of three regular archetypes and elite, at observed entry level and equipment. Binary-search replay recovers entries within claims. Walk-share re-evaluates all entry equipment at the exact floored class median level; missing probes fail.

| class | ch1 r1 | ch3 r1 | ch3 r5 | ch5 r1 |
| --- | ---: | ---: | ---: | ---: |
| warrior | 3740 ms (L1) | 1986.29 ms (L35) | 1588.35 ms (L40) | 240 ms (L60) |
| guardian | 4020 ms (L1) | 1812.61 ms (L34) | 1763.29 ms (L39) | 520 ms (L60) |
| rogue | 3500 ms (L1) | 1774.45 ms (L35) | 1718.51 ms (L40) | 300 ms (L60) |
| hunter | 3600 ms (L1) | 1781.69 ms (L35) | 1719.4 ms (L40) | 300 ms (L60) |
| archer | 3650 ms (L1) | 2139.64 ms (L35) | 2054.03 ms (L40) | 500 ms (L60) |
| witch | 4050 ms (L1) | 2265.99 ms (L35) | 2261.77 ms (L40) | 850 ms (L60) |
| alchemist | 3960 ms (L1) | 1879.85 ms (L35) | 1841.02 ms (L40) | 710 ms (L60) |

## How classes differ

| class | chapter | entry level | entry monster TTK, seconds | median boss duration, seconds | median boss losses/run |
| --- | --- | --- | --- | --- | --- |
| warrior | 1 | 1 | 3.74 | 78 | 3 |
| warrior | 3 | 35 | 1.99 | 53.16 | 0 |
| warrior | 5 | 60 | 0.24 | 21.27 | 0 |
| guardian | 1 | 1 | 4.02 | 98.66 | 1 |
| guardian | 3 | 34 | 1.81 | 53.95 | 0 |
| guardian | 5 | 60 | 0.52 | 22.71 | 0 |
| rogue | 1 | 1 | 3.5 | 72 | 3 |
| rogue | 3 | 35 | 1.77 | 47.21 | 0 |
| rogue | 5 | 60 | 0.3 | 21.46 | 0 |
| hunter | 1 | 1 | 3.6 | 73.31 | 3 |
| hunter | 3 | 35 | 1.78 | 53.36 | 0 |
| hunter | 5 | 60 | 0.3 | 22.36 | 0 |
| archer | 1 | 1 | 3.65 | 72 | 4 |
| archer | 3 | 35 | 2.14 | 52.18 | 0 |
| archer | 5 | 60 | 0.5 | 23.16 | 0 |
| witch | 1 | 1 | 4.05 | 66 | 4 |
| witch | 3 | 35 | 2.27 | 53.82 | 0 |
| witch | 5 | 60 | 0.85 | 25.85 | 0 |
| alchemist | 1 | 1 | 3.96 | 73.51 | 3 |
| alchemist | 3 | 35 | 1.88 | 57.06 | 0 |
| alchemist | 5 | 60 | 0.71 | 23.24 | 0 |

Entry probes use chapter round 1; boss duration and losses are from actual later attempts at the recorded levels, including retries.

Warrior attacks every 1s with cleave; Guardian every 1.4s with 1.3× HP/DEF and a 500ms bonk delay; Rogue has 0.8s twin strikes, 25% crit and 10% dodge; Hunter has a 1.1s mark (+20% damage taken and material find); Archer has a 0.9s volley cycle; Witch has 1.6s bolts, splash and burn; Alchemist has 1.3s poison flasks and heal-on-kill. Ch1: fastest guardian (6.13m), slowest witch (9.43m); Ch2: fastest guardian (12.34m), slowest witch (15.21m); Ch3: fastest guardian (17.64m), slowest witch (20.67m); Ch4: fastest warrior, guardian, rogue, hunter, archer, witch, alchemist (1440.02m), slowest warrior, guardian, rogue, hunter, archer, witch, alchemist (1440.02m); Ch5: fastest warrior (1442.43m), slowest witch (1443.3m). Boss losses, most first: witch 79, archer 75, hunter 60, alchemist 59, rogue 58, warrior 57, guardian 20. These observations retain the content-defined attack intervals, passives, HP, DEF and dodge differences; timing spread alone does not validate combat feel.

## First-boss config witness (five seeds, 60-minute diagnostic horizon)

warrior 12.2m; guardian 10.4m; rogue 12.3m; hunter 13.2m; archer 14.4m; witch 14.7m; alchemist 12.7m. This is a target-specific witness; it is excluded from main selection because its one- versus two-minute timing diagnostic exceeds one minute for at least one class/cohort. It does not pass all targets.

```json
{
  "cat": {
    "baseAtk": 14,
    "baseHp": 300,
    "baseDef": 5,
    "levelGrowth": 0.06,
    "xpGrowth": 1.12
  },
  "monster": {
    "hpBase": 90,
    "hpGrowth": 1.06,
    "atkBase": 8,
    "atkGrowth": 1.06,
    "xpBase": 18,
    "xpGrowth": 1.11
  },
  "idle": {
    "dailyKeys": 3,
    "walkTimeMs": 1000,
    "gearDropChance": 0.0067
  },
  "boss": {
    "maxMs": 180000,
    "attackIntervalMs": 4500,
    "bigEveryMs": 6000,
    "bigMultiplier": 1.5
  }
}
```

## Unreachable targets in the searched family

- first-boss: reachable with config (set found: CONFIG_FIRST_BOSS_WITNESS_V2 above); that set still fails measurement acceptance and is not the main proposal. Proposal evidence: warrior 8.0m; guardian 6.1m; rogue 8.1m; hunter 8.1m; archer 9.3m; witch 9.4m; alchemist 8.4m.
- chapter-growth: not reachable by config or these scenarios in this bounded search; needs content change: killsPerRound per chapter in chapters.ts, and per-chapter boss HP in monsters.ts. Proposal evidence: warrior ch2 0.66x; warrior ch3 0.89x; warrior ch4 301.52x; warrior ch5 0.00x; guardian ch2 1.01x; guardian ch3 0.85x; guardian ch4 269.64x; guardian ch5 0.00x; rogue ch2 0.66x; rogue ch3 0.87x; rogue ch4 304.15x; rogue ch5 0.00x; hunter ch2 0.65x; hunter ch3 0.93x; hunter ch4 290.15x; hunter ch5 0.00x; archer ch2 0.61x; archer ch3 0.93x; archer ch4 270.89x; archer ch5 0.00x; witch ch2 0.62x; witch ch3 0.92x; witch ch4 264.07x; witch ch5 0.00x; alchemist ch2 0.69x; alchemist ch3 0.93x; alchemist ch4 263.45x; alchemist ch5 0.00x.
- class-spread: not reachable by config or these scenarios in this bounded search; needs content change: classes.ts guardian HP/DEF/bonk and per-class ATK/attack intervals/passive damage. Proposal evidence: ch1 range 40.6%; ch2 range 21.3%; ch3 range 16.5%; ch4 range 0.0%; ch5 range 0.1%; warrior ch1 -1.8%; guardian ch1 -24.6%; rogue ch1 0.0%; hunter ch1 0.0%; archer ch1 13.7%; witch ch1 16.0%; alchemist ch1 2.9%; warrior ch2 -2.2%; guardian ch2 -8.5%; rogue ch2 0.0%; hunter ch2 -0.6%; archer ch2 10.3%; witch ch2 12.8%; alchemist ch2 5.1%; warrior ch3 -2.4%; guardian ch3 -3.6%; rogue ch3 -0.9%; hunter ch3 0.0%; archer ch3 10.0%; witch ch3 13.0%; alchemist ch3 7.1%; warrior ch4 0.0%; guardian ch4 0.0%; rogue ch4 0.0%; hunter ch4 0.0%; archer ch4 0.0%; witch ch4 0.0%; alchemist ch4 0.0%; warrior ch5 -0.0%; guardian ch5 -0.0%; rogue ch5 0.0%; hunter ch5 -0.0%; archer ch5 0.0%; witch ch5 0.0%; alchemist ch5 0.0%.
- chapter-bounds: not reachable by config or these scenarios in this bounded search; needs content change: chapters.ts killsPerRound and chests.ts first-clear catKey rewards to remove the key-clock wall. Proposal evidence: warrior ch1 8.0m; warrior ch2 5.3m; warrior ch3 4.7m; warrior ch4 1422.2m; warrior ch5 2.4m; guardian ch1 6.1m; guardian ch2 6.2m; guardian ch3 5.3m; guardian ch4 1422.4m; guardian ch5 2.7m; rogue ch1 8.1m; rogue ch2 5.4m; rogue ch3 4.7m; rogue ch4 1421.9m; rogue ch5 2.7m; hunter ch1 8.1m; hunter ch2 5.3m; hunter ch3 4.9m; hunter ch4 1421.7m; hunter ch5 2.5m; archer ch1 9.3m; archer ch2 5.6m; archer ch3 5.2m; archer ch4 1419.9m; archer ch5 2.9m; witch ch1 9.4m; witch ch2 5.8m; witch ch3 5.4m; witch ch4 1419.3m; witch ch5 3.3m; alchemist ch1 8.4m; alchemist ch2 5.8m; alchemist ch3 5.4m; alchemist ch4 1420.4m; alchemist ch5 3.1m.
- boss-check: not reachable by config or these scenarios in this bounded search; needs content change: per-chapter boss hpMul/atkMul in monsters.ts instead of the single 40 / 2.5 archetype, plus guardian HP/DEF/bonk in classes.ts. Proposal evidence: warrior ch1 first win 0.0%, median 78.00s; warrior ch2 first win 100.0%, median 67.34s; warrior ch3 first win 100.0%, median 53.16s; warrior ch4 first win 100.0%, median 11.48s; warrior ch5 first win 100.0%, median 21.27s; guardian ch1 first win 0.0%, median 98.66s; guardian ch2 first win 100.0%, median 71.91s; guardian ch3 first win 100.0%, median 53.95s; guardian ch4 first win 100.0%, median 12.14s; guardian ch5 first win 100.0%, median 22.71s; rogue ch1 first win 0.0%, median 72.00s; rogue ch2 first win 100.0%, median 63.70s; rogue ch3 first win 100.0%, median 47.21s; rogue ch4 first win 100.0%, median 11.67s; rogue ch5 first win 100.0%, median 21.46s; hunter ch1 first win 0.0%, median 73.31s; hunter ch2 first win 100.0%, median 66.39s; hunter ch3 first win 100.0%, median 53.36s; hunter ch4 first win 100.0%, median 11.26s; hunter ch5 first win 100.0%, median 22.36s; archer ch1 first win 0.0%, median 72.00s; archer ch2 first win 100.0%, median 66.87s; archer ch3 first win 100.0%, median 52.18s; archer ch4 first win 100.0%, median 12.68s; archer ch5 first win 100.0%, median 23.16s; witch ch1 first win 0.0%, median 66.00s; witch ch2 first win 100.0%, median 68.95s; witch ch3 first win 100.0%, median 53.82s; witch ch4 first win 100.0%, median 14.07s; witch ch5 first win 100.0%, median 25.85s; alchemist ch1 first win 0.0%, median 73.51s; alchemist ch2 first win 100.0%, median 68.01s; alchemist ch3 first win 100.0%, median 57.06s; alchemist ch4 first win 100.0%, median 12.62s; alchemist ch5 first win 100.0%, median 23.24s.

This is a finite searched family, not a proof of mathematical impossibility. Chapter-growth and boss-check need revalidation after key/content decisions. If a scenario still fails class-spread after removing the key wall, tune classes.ts attackIntervalMs and stats.atk alongside markPrey, volley, burn and poison damage; guardian stats.hp/def and bonk.delayMs control survival. Keep ≥3% spread and ±15% bounds together; no multiplier values are approved here.

## Not overridable

- MATERIALS.*.maxStack (STACK_CAPS_V2 and CAT_KEY_CAP)
- CHEST_SCALING.* (CHESTS)
- content registries (combat/bag/idle lookup maps)

## Method and limits

Claims use computeClaimV2, offline=false. A claim crossing the boss gate is replayed to its earliest whole second, only that prefix is applied, and the rest of the original step continues after the attempt. Cooldown and daily boundaries split claims too. Loot and crafting remain claim-dependent, so event timing removes timestamp quantization but does not make different claim sizes identical. Equipment is selected greedily, up to three improving crafts per applied claim, salvage at 90% bag usage. Boss replay seconds are recorded separately and excluded from active minutes. Keys drop only when computeClaimV2 actually farms cleared content; no old-chapter action is invented. Cleared-chapter key chance stays at production's value in all searched configs.

## Sign-off

User: ____ (approved / changes)


## Verification transcripts

All required command output is preserved below, including the complete local suite. The install runs through a temporary `pnpm` shim outside the repository that invokes Corepack's pinned pnpm 10.28.0. CI=true permits the noninteractive frozen install; no manifest or lockfile changed. Initial failed experiments are retained after the final verification logs. Expected opt-in skips in normal tests are the writer and searches; they were executed explicitly here. No existing test was skipped, removed or weakened.


### Pre-optimization writer (455-run baseline)

```text

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

current: warrior, 5 seeds; elapsed 16.185s
current: guardian, 5 seeds; elapsed 28.505s
current: rogue, 5 seeds; elapsed 42.537s
current: hunter, 5 seeds; elapsed 57.470s
current: archer, 5 seeds; elapsed 69.567s
current: witch, 5 seeds; elapsed 80.829s
current: alchemist, 5 seeds; elapsed 92.491s
proposal: warrior, 20 seeds; elapsed 122.378s
proposal: guardian, 20 seeds; elapsed 150.193s
proposal: rogue, 20 seeds; elapsed 179.680s
proposal: hunter, 20 seeds; elapsed 209.837s
proposal: archer, 20 seeds; elapsed 237.924s
proposal: witch, 20 seeds; elapsed 264.505s
proposal: alchemist, 20 seeds; elapsed 290.740s
step 1: warrior, 5 seeds; elapsed 303.309s
step 1: guardian, 5 seeds; elapsed 315.027s
step 1: rogue, 5 seeds; elapsed 327.414s
step 1: hunter, 5 seeds; elapsed 340.496s
step 1: archer, 5 seeds; elapsed 352.805s
step 1: witch, 5 seeds; elapsed 364.697s
step 1: alchemist, 5 seeds; elapsed 376.571s
S-A: warrior, 5 seeds; elapsed 376.644s
S-A: guardian, 5 seeds; elapsed 376.719s
S-A: rogue, 5 seeds; elapsed 376.801s
S-A: hunter, 5 seeds; elapsed 376.883s
S-A: archer, 5 seeds; elapsed 376.969s
S-A: witch, 5 seeds; elapsed 377.059s
S-A: alchemist, 5 seeds; elapsed 377.143s
S-B: warrior, 5 seeds; elapsed 377.220s
S-B: guardian, 5 seeds; elapsed 377.291s
S-B: rogue, 5 seeds; elapsed 377.366s
S-B: hunter, 5 seeds; elapsed 377.447s
S-B: archer, 5 seeds; elapsed 377.531s
S-B: witch, 5 seeds; elapsed 377.619s
S-B: alchemist, 5 seeds; elapsed 377.695s
day 1440: warrior, 5 seeds; elapsed 377.696s
day 1440: guardian, 5 seeds; elapsed 377.696s
day 1440: rogue, 5 seeds; elapsed 377.696s
day 1440: hunter, 5 seeds; elapsed 377.696s
day 1440: archer, 5 seeds; elapsed 377.696s
day 1440: witch, 5 seeds; elapsed 377.696s
day 1440: alchemist, 5 seeds; elapsed 377.696s
day 480: warrior, 5 seeds; elapsed 379.735s
day 480: guardian, 5 seeds; elapsed 381.762s
day 480: rogue, 5 seeds; elapsed 383.831s
day 480: hunter, 5 seeds; elapsed 385.835s
day 480: archer, 5 seeds; elapsed 387.879s
day 480: witch, 5 seeds; elapsed 389.789s
day 480: alchemist, 5 seeds; elapsed 391.739s
day 120: warrior, 5 seeds; elapsed 392.075s
day 120: guardian, 5 seeds; elapsed 392.427s
day 120: rogue, 5 seeds; elapsed 392.787s
day 120: hunter, 5 seeds; elapsed 393.125s
day 120: archer, 5 seeds; elapsed 393.444s
day 120: witch, 5 seeds; elapsed 393.762s
day 120: alchemist, 5 seeds; elapsed 394.088s
C5b: warrior, 5 seeds; elapsed 404.138s
C5b: guardian, 5 seeds; elapsed 413.861s
C5b: rogue, 5 seeds; elapsed 423.142s
C5b: hunter, 5 seeds; elapsed 433.140s
C5b: archer, 5 seeds; elapsed 442.258s
C5b: witch, 5 seeds; elapsed 451.172s
C5b: alchemist, 5 seeds; elapsed 459.801s
C5b + S-A: warrior, 5 seeds; elapsed 459.881s
C5b + S-A: guardian, 5 seeds; elapsed 459.959s
C5b + S-A: rogue, 5 seeds; elapsed 460.036s
C5b + S-A: hunter, 5 seeds; elapsed 460.117s
C5b + S-A: archer, 5 seeds; elapsed 460.204s
C5b + S-A: witch, 5 seeds; elapsed 460.299s
C5b + S-A: alchemist, 5 seeds; elapsed 460.383s
first-boss witness: warrior, 5 seeds; elapsed 460.487s
first-boss witness: guardian, 5 seeds; elapsed 460.586s
first-boss witness: rogue, 5 seeds; elapsed 460.698s
first-boss witness: hunter, 5 seeds; elapsed 460.809s
first-boss witness: archer, 5 seeds; elapsed 460.907s
first-boss witness: witch, 5 seeds; elapsed 461.004s
first-boss witness: alchemist, 5 seeds; elapsed 461.104s
Writer runtime: 461.138s; 455 unique runs (shared tables cached)

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  05:18:33
   Duration  461.44s (tests 100%)
```


### Pre-optimization focused simulator suite

```text
$ pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules


 Test Files  3 passed | 2 skipped (5)
      Tests  21 passed | 4 skipped (25)
   Start at  05:26:22
   Duration  119.92s (tests 100%)


Exit status: 0
```


### Pre-optimization complete local suite (139.10s game-rules, all checks passed)

```text
$ pnpm typecheck && pnpm lint && pnpm test && pnpm build

> taskbar-hero@0.0.0 typecheck /workspace/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/game-rules typecheck$ tsc --noEmit
packages/auth typecheck: Done
supabase/tests typecheck$ tsc --noEmit
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done

> taskbar-hero@0.0.0 lint /workspace/taskbar-hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/chain lint: Done
packages/game-rules lint$ tsc --noEmit
packages/auth lint: Done
supabase/tests lint$ tsc --noEmit
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done

> taskbar-hero@0.0.0 test /workspace/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/chain test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/chain
packages/auth test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/auth
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  05:28:49
packages/chain test:    Duration  327ms (import 46%, transform 28%, tests 16%, worker 10%, environment 1%)
packages/chain test: Done
packages/game-rules test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  05:28:49
packages/auth test:    Duration  643ms (import 65%, tests 30%, transform 4%, worker 1%)
packages/auth test: Done
supabase/tests test$ vitest run
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
supabase/tests test:  Test Files  16 passed (16)
supabase/tests test:       Tests  355 passed (355)
supabase/tests test:    Start at  05:28:50
supabase/tests test:    Duration  35.59s (tests 89%, import 10%, transform 1%)
supabase/tests test:     Isolate  16 workers spawned · ~135ms startup each (spawn + environment, per file)
supabase/tests test:              at least ~2.03s faster with isolate: false — reuses workers across files instead of one per file
supabase/tests test: Done
packages/game-rules test:  Test Files  18 passed | 2 skipped (20)
packages/game-rules test:       Tests  297 passed | 2 expected fail | 4 skipped (303)
packages/game-rules test:    Start at  05:28:50
packages/game-rules test:    Duration  139.10s (tests 99%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  05:31:09
packages/api-contract test:    Duration  251ms (transform 66%, import 27%, tests 5%, worker 2%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /workspace/taskbar-hero/apps/web
apps/web test:  Test Files  66 passed (66)
apps/web test:       Tests  957 passed (957)
apps/web test:    Start at  05:31:10
apps/web test:    Duration  62.78s (environment 57%, tests 30%, import 11%, transform 1%)
apps/web test: Environment  jsdom was created 66 times · 32.31s total, 57% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done

> taskbar-hero@0.0.0 build /workspace/taskbar-hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/chain build: Done
packages/game-rules build$ tsc --noEmit
packages/auth build: Done
supabase/tests build$ tsc --noEmit
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build$ tsc --noEmit
packages/api-contract build: Done
apps/web build$ tsc --noEmit && vite build
apps/web build: vite v8.3.5 building client environment for production...
apps/web build: transforming...
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/workspace/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1724 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-unBFXH2h.js               132.03 kB │ gzip:  38.56 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 739ms
apps/web build: Done

Exit status: 0
```


### Final frozen install

```text
$ CI=true pnpm install --frozen-lockfile
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 907ms using pnpm v10.28.0

Exit status: 0
```


### Focused sim suite

```text
$ pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules


 Test Files  3 passed | 2 skipped (5)
      Tests  21 passed | 4 skipped (25)
   Start at  05:34:57
   Duration  54.23s (tests 100%)


Exit status: 0
```


### Writer: V2_SIM_WRITE=1 pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/report.write.test.ts (V2_SIM_DATA saves raw runs; V2_SIM_COMPARE_DATA=/tmp/v6d-data-before-craft.json checks all pre-optimization data)

```text

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

current: warrior, 5 seeds; elapsed 7.802s
current: guardian, 5 seeds; elapsed 13.761s
current: rogue, 5 seeds; elapsed 21.524s
current: hunter, 5 seeds; elapsed 28.629s
current: archer, 5 seeds; elapsed 34.065s
current: witch, 5 seeds; elapsed 39.133s
current: alchemist, 5 seeds; elapsed 44.839s
proposal: warrior, 20 seeds; elapsed 56.128s
proposal: guardian, 20 seeds; elapsed 66.305s
proposal: rogue, 20 seeds; elapsed 76.983s
proposal: hunter, 20 seeds; elapsed 88.019s
proposal: archer, 20 seeds; elapsed 97.876s
proposal: witch, 20 seeds; elapsed 107.112s
proposal: alchemist, 20 seeds; elapsed 116.339s
step 1: warrior, 5 seeds; elapsed 119.983s
step 1: guardian, 5 seeds; elapsed 123.449s
step 1: rogue, 5 seeds; elapsed 127.283s
step 1: hunter, 5 seeds; elapsed 131.775s
step 1: archer, 5 seeds; elapsed 135.849s
step 1: witch, 5 seeds; elapsed 139.436s
step 1: alchemist, 5 seeds; elapsed 143.144s
S-A: warrior, 5 seeds; elapsed 143.201s
S-A: guardian, 5 seeds; elapsed 143.254s
S-A: rogue, 5 seeds; elapsed 143.314s
S-A: hunter, 5 seeds; elapsed 143.380s
S-A: archer, 5 seeds; elapsed 143.445s
S-A: witch, 5 seeds; elapsed 143.506s
S-A: alchemist, 5 seeds; elapsed 143.565s
S-B: warrior, 5 seeds; elapsed 143.621s
S-B: guardian, 5 seeds; elapsed 143.695s
S-B: rogue, 5 seeds; elapsed 143.761s
S-B: hunter, 5 seeds; elapsed 143.818s
S-B: archer, 5 seeds; elapsed 143.879s
S-B: witch, 5 seeds; elapsed 143.938s
S-B: alchemist, 5 seeds; elapsed 143.996s
day 1440: warrior, 5 seeds; elapsed 143.997s
day 1440: guardian, 5 seeds; elapsed 143.997s
day 1440: rogue, 5 seeds; elapsed 143.997s
day 1440: hunter, 5 seeds; elapsed 143.997s
day 1440: archer, 5 seeds; elapsed 143.997s
day 1440: witch, 5 seeds; elapsed 143.997s
day 1440: alchemist, 5 seeds; elapsed 143.997s
day 480: warrior, 5 seeds; elapsed 144.913s
day 480: guardian, 5 seeds; elapsed 145.719s
day 480: rogue, 5 seeds; elapsed 146.503s
day 480: hunter, 5 seeds; elapsed 147.301s
day 480: archer, 5 seeds; elapsed 148.041s
day 480: witch, 5 seeds; elapsed 148.745s
day 480: alchemist, 5 seeds; elapsed 149.492s
day 120: warrior, 5 seeds; elapsed 149.662s
day 120: guardian, 5 seeds; elapsed 149.832s
day 120: rogue, 5 seeds; elapsed 150.009s
day 120: hunter, 5 seeds; elapsed 150.179s
day 120: archer, 5 seeds; elapsed 150.360s
day 120: witch, 5 seeds; elapsed 150.535s
day 120: alchemist, 5 seeds; elapsed 150.705s
C5b: warrior, 5 seeds; elapsed 155.388s
C5b: guardian, 5 seeds; elapsed 159.730s
C5b: rogue, 5 seeds; elapsed 164.085s
C5b: hunter, 5 seeds; elapsed 168.757s
C5b: archer, 5 seeds; elapsed 172.962s
C5b: witch, 5 seeds; elapsed 177.047s
C5b: alchemist, 5 seeds; elapsed 181.003s
C5b + S-A: warrior, 5 seeds; elapsed 181.070s
C5b + S-A: guardian, 5 seeds; elapsed 181.151s
C5b + S-A: rogue, 5 seeds; elapsed 181.209s
C5b + S-A: hunter, 5 seeds; elapsed 181.274s
C5b + S-A: archer, 5 seeds; elapsed 181.334s
C5b + S-A: witch, 5 seeds; elapsed 181.397s
C5b + S-A: alchemist, 5 seeds; elapsed 181.479s
first-boss witness: warrior, 5 seeds; elapsed 181.549s
first-boss witness: guardian, 5 seeds; elapsed 181.616s
first-boss witness: rogue, 5 seeds; elapsed 181.693s
first-boss witness: hunter, 5 seeds; elapsed 181.779s
first-boss witness: archer, 5 seeds; elapsed 181.847s
first-boss witness: witch, 5 seeds; elapsed 181.910s
first-boss witness: alchemist, 5 seeds; elapsed 181.979s
All 455 saved runs match exactly after craft-preview optimization.
Writer runtime: 182.078s; 455 unique runs (shared tables cached)

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  05:32:44
   Duration  182.32s (tests 100%)
```


### Deno generation and clean diff

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 13 Edge Function import maps

Exit status: 0
```


### Required forbidden-path diff (must have empty command output)

```text
$ git diff --stat origin/main -- packages/game-rules/src/v2/config.ts packages/game-rules/src/v2/content packages/game-rules/src/v2/idle packages/game-rules/src/v2/state packages/game-rules/src/v2/combat pnpm-lock.yaml pnpm-workspace.yaml

Exit status: 0
```


### Full local typecheck, lint, test and build

```text
$ pnpm typecheck && pnpm lint && pnpm test && pnpm build

> taskbar-hero@0.0.0 typecheck /workspace/taskbar-hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/game-rules typecheck$ tsc --noEmit
packages/auth typecheck: Done
supabase/tests typecheck$ tsc --noEmit
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done

> taskbar-hero@0.0.0 lint /workspace/taskbar-hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/chain lint: Done
packages/game-rules lint$ tsc --noEmit
packages/auth lint: Done
supabase/tests lint$ tsc --noEmit
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done

> taskbar-hero@0.0.0 test /workspace/taskbar-hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/auth test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/auth
packages/chain test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/chain
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  05:36:17
packages/chain test:    Duration  269ms (import 52%, transform 25%, tests 13%, worker 11%)
packages/chain test: Done
packages/game-rules test$ vitest run
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  05:36:17
packages/auth test:    Duration  606ms (import 64%, tests 27%, transform 8%, worker 1%)
packages/auth test: Done
supabase/tests test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
supabase/tests test:  Test Files  16 passed (16)
supabase/tests test:       Tests  355 passed (355)
supabase/tests test:    Start at  05:36:18
supabase/tests test:    Duration  36.08s (tests 90%, import 9%)
supabase/tests test:     Isolate  16 workers spawned · ~128ms startup each (spawn + environment, per file)
supabase/tests test:              at least ~1.92s faster with isolate: false — reuses workers across files instead of one per file
supabase/tests test: Done
packages/game-rules test:  Test Files  18 passed | 2 skipped (20)
packages/game-rules test:       Tests  297 passed | 2 expected fail | 4 skipped (303)
packages/game-rules test:    Start at  05:36:18
packages/game-rules test:    Duration  74.28s (tests 99%, import 1%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  05:37:32
packages/api-contract test:    Duration  189ms (transform 48%, import 41%, tests 8%, worker 3%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /workspace/taskbar-hero/apps/web
apps/web test:  Test Files  66 passed (66)
apps/web test:       Tests  957 passed (957)
apps/web test:    Start at  05:37:33
apps/web test:    Duration  60.73s (environment 58%, tests 31%, import 10%, transform 1%)
apps/web test: Environment  jsdom was created 66 times · 31.52s total, 58% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done

> taskbar-hero@0.0.0 build /workspace/taskbar-hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/chain build: Done
packages/game-rules build$ tsc --noEmit
packages/auth build: Done
supabase/tests build$ tsc --noEmit
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build$ tsc --noEmit
packages/api-contract build: Done
apps/web build$ tsc --noEmit && vite build
apps/web build: vite v8.3.5 building client environment for production...
apps/web build: transforming...
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/workspace/taskbar-hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1724 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-unBFXH2h.js               132.03 kB │ gzip:  38.56 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 746ms
apps/web build: Done

Exit status: 0
```


### Initial noninteractive install rejection

```text
Scope: all 7 workspace projects
 ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY  Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true".
```


### Successful initial CI frozen install

```text
Scope: all 7 workspace projects
Recreating /workspace/taskbar-hero/node_modules
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +506
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 506, reused 0, downloaded 7, added 5
Progress: resolved 506, reused 0, downloaded 22, added 7
Progress: resolved 506, reused 0, downloaded 36, added 11
Progress: resolved 506, reused 0, downloaded 96, added 104
Progress: resolved 506, reused 0, downloaded 155, added 163
Progress: resolved 506, reused 0, downloaded 210, added 218
Progress: resolved 506, reused 0, downloaded 269, added 278
Progress: resolved 506, reused 0, downloaded 314, added 308
Progress: resolved 506, reused 0, downloaded 382, added 391
Progress: resolved 506, reused 0, downloaded 441, added 450
Progress: resolved 506, reused 0, downloaded 480, added 479
Progress: resolved 506, reused 0, downloaded 497, added 506, done

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 15.1s using pnpm v10.28.0
```


### Initial diagnosis (retained failed assertion)

```text

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

 ❯ src/v2/sim/diagnosis.test.ts (5 tests | 1 failed) 126703ms
   × records wins inside steps and ch1 medians agree within one minute 522ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/v2/sim/diagnosis.test.ts > records wins inside steps and ch1 medians agree within one minute
AssertionError: guardian: expected 1.7999999999999998 to be less than or equal to 1
 ❯ src/v2/sim/diagnosis.test.ts:23:74
     21|   for (const classId of CLASS_IDS) {
     22|     const times = [1, 2].map((stepMinutes) => [1, 2, 3].map((seed) => …
     23|     expect(Math.abs(medianV2(times[0]!) - medianV2(times[1]!)), classI…
       |                                                                          ^
     24|     expect(times[1]!.some((time) => time !== null && time % 2 !== 0)).…
     25|   }

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
   Start at  04:56:28
   Duration  126.96s (tests 100%)

undefined
/workspace/taskbar-hero/packages/game-rules:
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: vitest run src/v2/sim/diagnosis.test.ts
```


### Initial calibration guardrail rejection (0.0066 rounded below the strict 0.33× boundary; corrected to 0.0067)

```text

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

 ❯ src/v2/sim/search.test.ts (2 tests | 1 failed | 1 skipped) 16ms
   × refines the first-boss neighborhood with independent XP and HP growth 14ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/v2/sim/search.test.ts > refines the first-boss neighborhood with independent XP and HP growth
Error: search escaped guardrails
 ❯ src/v2/sim/search.test.ts:81:49
     79|   }
     80|   const screened = candidates.map((overrides, i) => {
     81|     if (!guardrailsCheckV2(overrides).ok) throw new Error('search esca…
       |                                                 ^
     82|     const seeds = (process.env.V2_SIM_LOCAL === '1' || process.env.V2_…
     83|     const runs = CLASS_IDS.flatMap((classId) => seeds.map((seed) => si…
 ❯ src/v2/sim/search.test.ts:80:31

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 1 skipped (2)
   Start at  05:05:52
   Duration  804ms (transform 84%, import 11%, tests 3%, worker 1%)

undefined
/workspace/taskbar-hero/packages/game-rules:
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: vitest run src/v2/sim/search.test.ts
```


### Initial proposal regression before updating the exact failure set

```text

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

 ❯ src/v2/sim/sim.test.ts (9 tests | 1 failed) 41335ms
   × records the fallback target failures across seven classes and three seeds 31951ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/v2/sim/sim.test.ts > records the fallback target failures across seven classes and three seeds
AssertionError: expected [ Array(5) ] to deeply equal [ 'chapter-growth', …(3) ]

- Expected
+ Received

  [
+   "first-boss",
    "chapter-growth",
    "class-spread",
    "chapter-bounds",
    "boss-check",
  ]

 ❯ src/v2/sim/sim.test.ts:57:72
     55|   const results = proposedMatrix().map((run) => run.result);
     56|   const checks = checkTargetsV2(results);
     57|   expect(checks.filter((check) => !check.ok).map((check) => check.id))…
       |                                                                        ^
     58|   expect(checks.find((check) => check.id === 'walk-share')?.ok).toBe(t…
     59|   expect(checks.find((check) => check.id === 'guardrails')?.ok).toBe(t…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 8 passed (9)
   Start at  05:18:15
   Duration  41.61s (tests 100%)

undefined
/workspace/taskbar-hero/packages/game-rules:
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: vitest run src/v2/sim/sim.test.ts
```


### Broad search: V2_SIM_SEARCH=1 V2_SIM_SEARCH_OUTPUT=/tmp/v6d-search.json pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/search.test.ts

```text

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

config screened 8/33; 20.4s
config screened 16/33; 36.5s
config screened 24/33; 55.2s
config screened 32/33; 75.0s
config refined 1/3; 159.3s
config refined 2/3; 216.6s
config refined 3/3; 278.0s
Best config: {"overrides":{"cat":{"baseAtk":22,"baseHp":200,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.16,"atkBase":4,"atkGrowth":1.04,"xpBase":18,"xpGrowth":1.15},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":3000,"bigEveryMs":6000,"bigMultiplier":1.5}},"score":4010.714285714286,"checks":[{"id":"first-boss","ok":false,"detail":"warrior 13m; guardian 11m; rogue 14m; hunter 14m; archer 16m; witch 16m; alchemist 14m"},{"id":"chapter-growth","ok":false,"detail":"warrior ch2 2.11x; warrior ch3 4.59x; warrior ch4 not reached; warrior ch5 not reached; guardian ch2 3.18x; guardian ch3 4.10x; guardian ch4 not reached; guardian ch5 not reached; rogue ch2 1.78x; rogue ch3 3.56x; rogue ch4 not reached; rogue ch5 not reached; hunter ch2 2.32x; hunter ch3 4.89x; hunter ch4 not reached; hunter ch5 not reached; archer ch2 1.96x; archer ch3 6.80x; archer ch4 not reached; archer ch5 not reached; witch ch2 2.00x; witch ch3 6.61x; witch ch4 not reached; witch ch5 not reached; alchemist ch2 2.47x; alchemist ch3 5.44x; alchemist ch4 not reached; alchemist ch5 not reached"},{"id":"class-spread","ok":false,"detail":"ch1 range 37.6%; ch2 range 19.9%; ch3 range 66.0%; ch4 range not reached; ch5 range not reached; warrior ch1 -4.9%; guardian ch1 -22.0%; rogue ch1 -0.2%; hunter ch1 0.0%; archer ch1 14.5%; witch ch1 15.6%; alchemist ch1 0.6%; warrior ch2 -11.1%; guardian ch2 -1.7%; rogue ch2 -14.2%; hunter ch2 0.0%; archer ch2 4.1%; witch ch2 5.7%; alchemist ch2 5.7%; warrior ch3 -17.3%; guardian ch3 -9.8%; rogue ch3 -37.9%; hunter ch3 0.0%; archer ch3 24.0%; witch ch3 28.1%; alchemist ch3 16.1%; warrior ch4 not reached; guardian ch4 not reached; rogue ch4 not reached; hunter ch4 not reached; archer ch4 not reached; witch ch4 not reached; alchemist ch4 not reached; warrior ch5 not reached; guardian ch5 not reached; rogue ch5 not reached; hunter ch5 not reached; archer ch5 not reached; witch ch5 not reached; alchemist ch5 not reached"},{"id":"chapter-bounds","ok":false,"detail":"warrior ch1 13m; warrior ch2 27m; warrior ch3 126m; warrior ch4 not reached; warrior ch5 not reached; guardian ch1 11m; guardian ch2 34m; guardian ch3 139m; guardian ch4 not reached; guardian ch5 not reached; rogue ch1 14m; rogue ch2 24m; rogue ch3 87m; rogue ch4 not reached; rogue ch5 not reached; hunter ch1 14m; hunter ch2 32m; hunter ch3 155m; hunter ch4 not reached; hunter ch5 not reached; archer ch1 16m; archer ch2 31m; archer ch3 208m; archer ch4 not reached; archer ch5 not reached; witch ch1 16m; witch ch2 32m; witch ch3 209m; witch ch4 not reached; witch ch5 not reached; alchemist ch1 14m; alchemist ch2 34m; alchemist ch3 185m; alchemist ch4 not reached; alchemist ch5 not reached"},{"id":"never-stuck","ok":true,"detail":"0/35 runs stuck"},{"id":"craft-salvage-loss","ok":true,"detail":"rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600"},{"id":"walk-share","ok":true,"detail":"warrior ch1 r1 L1.0: 23.6%; warrior ch3 r5 L45.0: 10.9%; guardian ch1 r1 L1.0: 23.1%; guardian ch3 r5 L45.0: 9.9%; rogue ch1 r1 L1.0: 24.4%; rogue ch3 r5 L45.0: 11.0%; hunter ch1 r1 L1.0: 24.7%; hunter ch3 r5 L46.0: 10.2%; archer ch1 r1 L1.0: 23.8%; archer ch3 r5 L46.0: 10.0%; witch ch1 r1 L1.0: 23.5%; witch ch3 r5 L46.0: 9.6%; alchemist ch1 r1 L1.0: 23.2%; alchemist ch3 r5 L46.0: 9.8%"},{"id":"boss-check","ok":false,"detail":"warrior ch1 first win 0.0%, median 114.00s; warrior ch2 first win 0.0%, median 180.00s; warrior ch3 first win 0.0%, median 180.00s; warrior ch4 first win 0.0%, median 180.00s; warrior ch5 first win 0.0%, median not reached (missing attempts); guardian ch1 first win 0.0%, median 168.50s; guardian ch2 first win 0.0%, median 180.00s; guardian ch3 first win 0.0%, median 180.00s; guardian ch4 first win 0.0%, median 180.00s; guardian ch5 first win 0.0%, median not reached (missing attempts); rogue ch1 first win 0.0%, median 106.50s; rogue ch2 first win 0.0%, median 180.00s; rogue ch3 first win 0.0%, median 180.00s; rogue ch4 first win 0.0%, median 180.00s; rogue ch5 first win 0.0%, median not reached (missing attempts); hunter ch1 first win 0.0%, median 108.00s; hunter ch2 first win 0.0%, median 180.00s; hunter ch3 first win 0.0%, median 180.00s; hunter ch4 first win 0.0%, median 180.00s; hunter ch5 first win 0.0%, median not reached (missing attempts); archer ch1 first win 0.0%, median 102.00s; archer ch2 first win 0.0%, median 180.00s; archer ch3 first win 0.0%, median 180.00s; archer ch4 first win 0.0%, median 180.00s; archer ch5 first win 0.0%, median not reached (missing attempts); witch ch1 first win 0.0%, median 102.00s; witch ch2 first win 0.0%, median 180.00s; witch ch3 first win 0.0%, median 180.00s; witch ch4 first win 0.0%, median 180.00s; witch ch5 first win 0.0%, median not reached (missing attempts); alchemist ch1 first win 0.0%, median 111.00s; alchemist ch2 first win 0.0%, median 180.00s; alchemist ch3 first win 0.0%, median 180.00s; alchemist ch4 first win 0.0%, median 180.00s; alchemist ch5 first win 0.0%, median not reached (missing attempts)"},{"id":"guardrails","ok":true,"detail":"All numeric leaves within 0.33–3x; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3"}]}
S-A screened 8/33; 297.6s
S-A screened 16/33; 320.8s
S-A screened 24/33; 338.7s
S-A screened 32/33; 354.8s
S-A refined 1/3; 357.4s
S-A refined 2/3; 413.2s
S-A refined 3/3; 414.2s
Best S-A: {"overrides":{"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}},"score":3013.285714285714,"checks":[{"id":"first-boss","ok":false,"detail":"warrior 11m; guardian 9m; rogue 11m; hunter 12m; archer 12m; witch 14m; alchemist 12m"},{"id":"chapter-growth","ok":false,"detail":"warrior ch2 0.64x; warrior ch3 0.91x; warrior ch4 1.04x; warrior ch5 0.97x; guardian ch2 0.79x; guardian ch3 0.96x; guardian ch4 0.95x; guardian ch5 1.04x; rogue ch2 0.59x; rogue ch3 0.97x; rogue ch4 0.96x; rogue ch5 0.97x; hunter ch2 0.53x; hunter ch3 1.02x; hunter ch4 0.98x; hunter ch5 1.01x; archer ch2 0.59x; archer ch3 0.94x; archer ch4 1.01x; archer ch5 0.97x; witch ch2 0.54x; witch ch3 0.86x; witch ch4 1.06x; witch ch5 1.06x; alchemist ch2 0.60x; alchemist ch3 0.99x; alchemist ch4 0.98x; alchemist ch5 1.01x"},{"id":"class-spread","ok":false,"detail":"ch1 range 38.2%; ch2 range 20.4%; ch3 range 17.3%; ch4 range 14.7%; ch5 range 15.3%; warrior ch1 -6.0%; guardian ch1 -20.9%; rogue ch1 -5.6%; hunter ch1 3.0%; archer ch1 6.3%; witch ch1 17.3%; alchemist ch1 0.0%; warrior ch2 -3.7%; guardian ch2 -10.5%; rogue ch2 -4.5%; hunter ch2 0.0%; archer ch2 5.2%; witch ch2 9.9%; alchemist ch2 3.0%; warrior ch3 -1.9%; guardian ch3 -3.6%; rogue ch3 -1.5%; hunter ch3 0.0%; archer ch3 10.4%; witch ch3 13.7%; alchemist ch3 7.5%; warrior ch4 -0.2%; guardian ch4 -1.5%; rogue ch4 -1.8%; hunter ch4 0.0%; archer ch4 10.8%; witch ch4 12.9%; alchemist ch4 7.1%; warrior ch5 -0.8%; guardian ch5 0.0%; rogue ch5 -3.5%; hunter ch5 -0.2%; archer ch5 8.6%; witch ch5 11.8%; alchemist ch5 6.0%"},{"id":"chapter-bounds","ok":false,"detail":"warrior ch1 11m; warrior ch2 7m; warrior ch3 6m; warrior ch4 7m; warrior ch5 6m; guardian ch1 9m; guardian ch2 7m; guardian ch3 7m; guardian ch4 7m; guardian ch5 7m; rogue ch1 11m; rogue ch2 7m; rogue ch3 6m; rogue ch4 6m; rogue ch5 6m; hunter ch1 12m; hunter ch2 6m; hunter ch3 6m; hunter ch4 6m; hunter ch5 6m; archer ch1 12m; archer ch2 7m; archer ch3 7m; archer ch4 7m; archer ch5 7m; witch ch1 14m; witch ch2 7m; witch ch3 6m; witch ch4 7m; witch ch5 7m; alchemist ch1 12m; alchemist ch2 7m; alchemist ch3 7m; alchemist ch4 7m; alchemist ch5 7m"},{"id":"never-stuck","ok":true,"detail":"0/35 runs stuck"},{"id":"craft-salvage-loss","ok":true,"detail":"rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600"},{"id":"walk-share","ok":true,"detail":"warrior ch1 r1 L1.0: 21.1%; warrior ch3 r5 L35.0: 28.8%; guardian ch1 r1 L1.0: 17.5%; guardian ch3 r5 L34.0: 25.0%; rogue ch1 r1 L1.0: 17.5%; rogue ch3 r5 L35.0: 29.1%; hunter ch1 r1 L1.0: 19.4%; hunter ch3 r5 L35.0: 28.1%; archer ch1 r1 L1.0: 18.0%; archer ch3 r5 L36.0: 26.6%; witch ch1 r1 L1.0: 17.1%; witch ch3 r5 L37.0: 30.7%; alchemist ch1 r1 L1.0: 17.8%; alchemist ch3 r5 L35.0: 24.9%"},{"id":"boss-check","ok":false,"detail":"warrior ch1 first win 0.0%, median 78.00s; warrior ch2 first win 60.0%, median 94.06s; warrior ch3 first win 100.0%, median 86.27s; warrior ch4 first win 100.0%, median 82.16s; warrior ch5 first win 100.0%, median 85.45s; guardian ch1 first win 40.0%, median 114.00s; guardian ch2 first win 100.0%, median 97.86s; guardian ch3 first win 100.0%, median 96.33s; guardian ch4 first win 100.0%, median 84.83s; guardian ch5 first win 100.0%, median 97.20s; rogue ch1 first win 0.0%, median 75.30s; rogue ch2 first win 60.0%, median 86.92s; rogue ch3 first win 100.0%, median 80.75s; rogue ch4 first win 100.0%, median 64.71s; rogue ch5 first win 100.0%, median 73.24s; hunter ch1 first win 0.0%, median 72.00s; hunter ch2 first win 80.0%, median 91.70s; hunter ch3 first win 100.0%, median 83.57s; hunter ch4 first win 100.0%, median 85.50s; hunter ch5 first win 100.0%, median 84.15s; archer ch1 first win 0.0%, median 72.00s; archer ch2 first win 60.0%, median 87.30s; archer ch3 first win 80.0%, median 85.50s; archer ch4 first win 100.0%, median 86.36s; archer ch5 first win 100.0%, median 84.24s; witch ch1 first win 0.0%, median 67.50s; witch ch2 first win 60.0%, median 83.93s; witch ch3 first win 80.0%, median 86.36s; witch ch4 first win 100.0%, median 81.46s; witch ch5 first win 100.0%, median 80.86s; alchemist ch1 first win 0.0%, median 80.67s; alchemist ch2 first win 100.0%, median 91.41s; alchemist ch3 first win 100.0%, median 85.25s; alchemist ch4 first win 100.0%, median 82.71s; alchemist ch5 first win 100.0%, median 79.36s"},{"id":"guardrails","ok":false,"detail":"idle.dailyKeys: 5 outside 0.33–3x current 1; idle.dailyKeys: 5 > 3"}]}
S-B screened 8/33; 456.7s
S-B screened 16/33; 500.2s
S-B screened 24/33; 542.0s
S-B screened 32/33; 581.3s
S-B refined 1/3; 590.9s
S-B refined 2/3; 689.1s
S-B refined 3/3; 690.0s
Best S-B: {"overrides":{"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}},"score":4013.285714285714,"checks":[{"id":"first-boss","ok":false,"detail":"warrior 11m; guardian 9m; rogue 11m; hunter 12m; archer 12m; witch 14m; alchemist 12m"},{"id":"chapter-growth","ok":false,"detail":"warrior ch2 0.64x; warrior ch3 0.91x; warrior ch4 1.04x; warrior ch5 0.97x; guardian ch2 0.79x; guardian ch3 0.96x; guardian ch4 0.95x; guardian ch5 1.04x; rogue ch2 0.59x; rogue ch3 0.97x; rogue ch4 0.96x; rogue ch5 0.97x; hunter ch2 0.53x; hunter ch3 1.02x; hunter ch4 0.98x; hunter ch5 1.01x; archer ch2 0.59x; archer ch3 0.94x; archer ch4 1.01x; archer ch5 0.97x; witch ch2 0.54x; witch ch3 0.86x; witch ch4 1.06x; witch ch5 1.06x; alchemist ch2 0.60x; alchemist ch3 0.99x; alchemist ch4 0.98x; alchemist ch5 1.01x"},{"id":"class-spread","ok":false,"detail":"ch1 range 38.2%; ch2 range 20.4%; ch3 range 17.3%; ch4 range 14.7%; ch5 range 15.3%; warrior ch1 -6.0%; guardian ch1 -20.9%; rogue ch1 -5.6%; hunter ch1 3.0%; archer ch1 6.3%; witch ch1 17.3%; alchemist ch1 0.0%; warrior ch2 -3.7%; guardian ch2 -10.5%; rogue ch2 -4.5%; hunter ch2 0.0%; archer ch2 5.2%; witch ch2 9.9%; alchemist ch2 3.0%; warrior ch3 -1.9%; guardian ch3 -3.6%; rogue ch3 -1.5%; hunter ch3 0.0%; archer ch3 10.4%; witch ch3 13.7%; alchemist ch3 7.5%; warrior ch4 -0.2%; guardian ch4 -1.5%; rogue ch4 -1.8%; hunter ch4 0.0%; archer ch4 10.8%; witch ch4 12.9%; alchemist ch4 7.1%; warrior ch5 -0.8%; guardian ch5 0.0%; rogue ch5 -3.5%; hunter ch5 -0.2%; archer ch5 8.6%; witch ch5 11.8%; alchemist ch5 6.0%"},{"id":"chapter-bounds","ok":false,"detail":"warrior ch1 11m; warrior ch2 7m; warrior ch3 6m; warrior ch4 7m; warrior ch5 6m; guardian ch1 9m; guardian ch2 7m; guardian ch3 7m; guardian ch4 7m; guardian ch5 7m; rogue ch1 11m; rogue ch2 7m; rogue ch3 6m; rogue ch4 6m; rogue ch5 6m; hunter ch1 12m; hunter ch2 6m; hunter ch3 6m; hunter ch4 6m; hunter ch5 6m; archer ch1 12m; archer ch2 7m; archer ch3 7m; archer ch4 7m; archer ch5 7m; witch ch1 14m; witch ch2 7m; witch ch3 6m; witch ch4 7m; witch ch5 7m; alchemist ch1 12m; alchemist ch2 7m; alchemist ch3 7m; alchemist ch4 7m; alchemist ch5 7m"},{"id":"never-stuck","ok":true,"detail":"0/35 runs stuck"},{"id":"craft-salvage-loss","ok":true,"detail":"rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600"},{"id":"walk-share","ok":true,"detail":"warrior ch1 r1 L1.0: 21.1%; warrior ch3 r5 L35.0: 28.8%; guardian ch1 r1 L1.0: 17.5%; guardian ch3 r5 L34.0: 25.0%; rogue ch1 r1 L1.0: 17.5%; rogue ch3 r5 L35.0: 29.1%; hunter ch1 r1 L1.0: 19.4%; hunter ch3 r5 L35.0: 28.1%; archer ch1 r1 L1.0: 18.0%; archer ch3 r5 L36.0: 26.6%; witch ch1 r1 L1.0: 17.1%; witch ch3 r5 L37.0: 30.7%; alchemist ch1 r1 L1.0: 17.8%; alchemist ch3 r5 L35.0: 24.9%"},{"id":"boss-check","ok":false,"detail":"warrior ch1 first win 0.0%, median 78.00s; warrior ch2 first win 60.0%, median 94.06s; warrior ch3 first win 100.0%, median 86.27s; warrior ch4 first win 100.0%, median 82.16s; warrior ch5 first win 100.0%, median 85.45s; guardian ch1 first win 40.0%, median 114.00s; guardian ch2 first win 100.0%, median 97.86s; guardian ch3 first win 100.0%, median 96.33s; guardian ch4 first win 100.0%, median 84.83s; guardian ch5 first win 100.0%, median 97.20s; rogue ch1 first win 0.0%, median 75.30s; rogue ch2 first win 60.0%, median 86.92s; rogue ch3 first win 100.0%, median 80.75s; rogue ch4 first win 100.0%, median 64.71s; rogue ch5 first win 100.0%, median 73.24s; hunter ch1 first win 0.0%, median 72.00s; hunter ch2 first win 80.0%, median 91.70s; hunter ch3 first win 100.0%, median 83.57s; hunter ch4 first win 100.0%, median 85.50s; hunter ch5 first win 100.0%, median 84.15s; archer ch1 first win 0.0%, median 72.00s; archer ch2 first win 60.0%, median 87.30s; archer ch3 first win 80.0%, median 85.50s; archer ch4 first win 100.0%, median 86.36s; archer ch5 first win 100.0%, median 84.24s; witch ch1 first win 0.0%, median 67.50s; witch ch2 first win 60.0%, median 83.93s; witch ch3 first win 80.0%, median 86.36s; witch ch4 first win 100.0%, median 81.46s; witch ch5 first win 100.0%, median 80.86s; alchemist ch1 first win 0.0%, median 80.67s; alchemist ch2 first win 100.0%, median 91.41s; alchemist ch3 first win 100.0%, median 85.25s; alchemist ch4 first win 100.0%, median 82.71s; alchemist ch5 first win 100.0%, median 79.36s"},{"id":"guardrails","ok":true,"detail":"All numeric leaves within 0.33–3x; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3"}]}
Search runtime 690.043s

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  04:57:09
   Duration  690.35s (tests 100%)
```


### Focused search: V2_SIM_FINE=1 V2_SIM_FINE_XP=1.06 (first run used this literal before parameterization), output /tmp/v6d-fine.json

```text

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

Fine 1/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; warrior 16.9m; guardian 12.9m; rogue 16.8m; hunter 17.7m; archer 19.9m; witch 22.3m; alchemist 19.0m
Fine 2/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.06; first=false; warrior 20.9m; guardian 16.3m; rogue 18.9m; hunter 22.3m; archer 25.3m; witch 33.3m; alchemist 27.4m
Fine 3/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.06; first=false; warrior 26.9m; guardian 19.3m; rogue 35.3m; hunter 43.3m; archer 39.3m; witch 47.5m; alchemist 35.4m
Fine 4/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08; first=false; warrior 21.3m; guardian 15.6m; rogue 21.4m; hunter 20.3m; archer 23.3m; witch 31.0m; alchemist 27.3m
Fine 5/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.08; first=false; warrior 30.5m; guardian 19.8m; rogue 30.6m; hunter 31.5m; archer 45.4m; witch 51.4m; alchemist 40.4m
Fine 6/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.08; first=false; warrior 46.6m; guardian 30.9m; rogue 35.7m; hunter 47.6m; archer 57.4m; witch not reached; alchemist not reached
Fine 7/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; warrior 24.8m; guardian 23.6m; rogue 27.9m; hunter 31.0m; archer 36.6m; witch 39.6m; alchemist 35.7m
Fine 8/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.1; first=false; warrior 38.1m; guardian 36.6m; rogue 42.6m; hunter 44.2m; archer not reached; witch not reached; alchemist 57.6m
Fine 9/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.1; first=false; warrior 57.5m; guardian 31.9m; rogue 57.8m; hunter 57.5m; archer not reached; witch not reached; alchemist 57.9m
Fine 10/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; warrior 16.7m; guardian 12.1m; rogue 16.0m; hunter 16.1m; archer 19.0m; witch 17.3m; alchemist 15.3m
Fine 11/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.06; first=false; warrior 14.9m; guardian 19.3m; rogue 18.3m; hunter 17.3m; archer 25.4m; witch 24.4m; alchemist 21.4m
Fine 12/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.06; first=false; warrior 19.0m; guardian 18.5m; rogue 23.4m; hunter 25.3m; archer 35.8m; witch 36.5m; alchemist 26.5m
Fine 13/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08; first=false; warrior 19.1m; guardian 17.3m; rogue 20.6m; hunter 18.6m; archer 24.0m; witch 20.3m; alchemist 22.3m
Fine 14/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.08; first=false; warrior 25.6m; guardian 24.3m; rogue 22.3m; hunter 22.3m; archer 25.3m; witch 27.3m; alchemist 26.3m
Fine 15/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.08; first=false; warrior 34.7m; guardian 32.3m; rogue 35.4m; hunter 51.3m; archer 48.3m; witch 59.4m; alchemist 50.3m
Fine 16/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; warrior 24.9m; guardian 22.4m; rogue 22.4m; hunter 26.4m; archer 25.4m; witch 26.5m; alchemist 23.5m
Fine 17/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.1; first=false; warrior 35.4m; guardian 19.5m; rogue 35.4m; hunter 32.5m; archer 42.5m; witch 47.9m; alchemist 33.6m
Fine 18/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.1; first=false; warrior 51.4m; guardian 26.7m; rogue 43.4m; hunter 51.6m; archer not reached; witch not reached; alchemist not reached
Fine 19/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; warrior 13.2m; guardian 10.4m; rogue 14.2m; hunter 15.2m; archer 16.4m; witch 16.9m; alchemist 15.7m
Fine 20/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.06; first=false; warrior 19.4m; guardian 11.6m; rogue 17.5m; hunter 19.4m; archer 19.5m; witch 19.0m; alchemist 18.9m
Fine 21/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.06; first=false; warrior 25.4m; guardian 17.7m; rogue 25.6m; hunter 26.9m; archer 32.6m; witch 26.0m; alchemist 21.9m
Fine 22/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08; first=false; warrior 16.2m; guardian 13.0m; rogue 15.8m; hunter 17.8m; archer 19.0m; witch 22.4m; alchemist 15.3m
Fine 23/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.08; first=false; warrior 25.2m; guardian 17.3m; rogue 18.1m; hunter 17.0m; archer 23.1m; witch 29.5m; alchemist 25.5m
Fine 24/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.08; first=false; warrior 33.1m; guardian 19.4m; rogue 34.3m; hunter 31.1m; archer 40.3m; witch 40.9m; alchemist 38.5m
Fine 25/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; warrior 22.3m; guardian 17.8m; rogue 20.6m; hunter 23.6m; archer 26.5m; witch 27.3m; alchemist 24.6m
Fine 26/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.1; first=false; warrior 32.7m; guardian 24.8m; rogue 30.7m; hunter 34.6m; archer 35.7m; witch 43.3m; alchemist 34.8m
Fine 27/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.1; first=false; warrior 51.7m; guardian 30.9m; rogue 37.8m; hunter 55.9m; archer 59.7m; witch not reached; alchemist 54.8m
Fine 28/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; warrior 10.5m; guardian 10.0m; rogue 11.8m; hunter 11.6m; archer 15.2m; witch 15.9m; alchemist 15.2m
Fine 29/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.06; first=false; warrior 13.7m; guardian 14.3m; rogue 15.3m; hunter 17.2m; archer 20.6m; witch 22.2m; alchemist 20.2m
Fine 30/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.06; first=false; warrior 17.8m; guardian 16.3m; rogue 19.4m; hunter 23.4m; archer 26.3m; witch 28.7m; alchemist 24.6m
Fine 31/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08; first=false; warrior 15.3m; guardian 11.3m; rogue 15.3m; hunter 16.3m; archer 17.3m; witch 19.5m; alchemist 17.5m
Fine 32/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.08; first=false; warrior 21.3m; guardian 16.6m; rogue 21.7m; hunter 21.4m; archer 27.8m; witch 26.3m; alchemist 24.6m
Fine 33/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.08; first=false; warrior 32.5m; guardian 22.6m; rogue 25.7m; hunter 29.8m; archer 33.8m; witch 38.8m; alchemist 29.8m
Fine 34/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; warrior 19.6m; guardian 12.3m; rogue 20.6m; hunter 19.7m; archer 22.1m; witch 23.1m; alchemist 20.1m
Fine 35/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.1; first=false; warrior 25.8m; guardian 20.2m; rogue 26.3m; hunter 28.9m; archer 33.1m; witch 25.2m; alchemist 29.3m
Fine 36/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.1; first=false; warrior 36.2m; guardian 18.3m; rogue 30.3m; hunter 43.2m; archer 49.2m; witch 59.1m; alchemist 43.3m
Fine refined config: score 4010.1428571428573; 113.2s
Fine refined config: score 4010.1428571428573; 281.6s
Fine refined config: score 4008.1428571428573; 456.8s
Fine refined config: score 4008.714285714286; 607.8s
Fine refined S-A: score 3010.1428571428573; 612.2s
Fine refined S-A: score 3010.1428571428573; 614.2s
Fine refined S-A: score 3008.1428571428573; 617.2s
Fine refined S-A: score 3008.714285714286; 622.8s
Fine refined S-B: score 4010.1428571428573; 626.0s
Fine refined S-B: score 4010.1428571428573; 628.0s
Fine refined S-B: score 4008.1428571428573; 633.6s
Fine refined S-B: score 4008.714285714286; 645.8s
Fine search runtime 645.797s

 Test Files  1 passed (1)
      Tests  1 passed | 1 skipped (2)
   Start at  05:02:31
   Duration  646.13s (tests 100%)
```


### Focused search: V2_SIM_FINE=1 V2_SIM_FINE_XP=1.11, output /tmp/v6d-near.json

```text

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

Fine 1/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; warrior 15.4m; guardian 12.5m; rogue 16.5m; hunter 16.4m; archer 15.8m; witch 16.9m; alchemist 14.9m
Fine 2/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.06; first=false; warrior 15.9m; guardian 16.9m; rogue 16.8m; hunter 20.7m; archer 21.9m; witch 27.3m; alchemist 22.3m
Fine 3/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.06; first=false; warrior 25.9m; guardian 16.3m; rogue 22.9m; hunter 22.3m; archer 24.3m; witch 35.3m; alchemist 30.4m
Fine 4/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08; first=false; warrior 16.3m; guardian 12.3m; rogue 17.3m; hunter 17.3m; archer 19.3m; witch 22.7m; alchemist 21.7m
Fine 5/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.08; first=false; warrior 22.3m; guardian 16.4m; rogue 25.4m; hunter 25.3m; archer 32.3m; witch 36.3m; alchemist 32.3m
Fine 6/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.08; first=false; warrior 30.5m; guardian 20.8m; rogue 32.6m; hunter 37.6m; archer 52.4m; witch not reached; alchemist 44.4m
Fine 7/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; warrior 18.6m; guardian 18.4m; rogue 20.8m; hunter 20.8m; archer 28.4m; witch 31.4m; alchemist 26.5m
Fine 8/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.1; first=false; warrior 36.0m; guardian 27.6m; rogue 36.5m; hunter 36.1m; archer 44.6m; witch 46.6m; alchemist 38.7m
Fine 9/36: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.1; first=false; warrior 56.1m; guardian 36.8m; rogue 54.6m; hunter 57.5m; archer not reached; witch not reached; alchemist not reached
Fine 10/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; warrior 12.7m; guardian 10.9m; rogue 12.7m; hunter 13.1m; archer 14.9m; witch 16.1m; alchemist 13.1m
Fine 11/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.06; first=false; warrior 17.7m; guardian 15.3m; rogue 14.2m; hunter 16.1m; archer 18.2m; witch 23.4m; alchemist 18.3m
Fine 12/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.06; first=false; warrior 15.9m; guardian 17.3m; rogue 18.3m; hunter 18.3m; archer 22.5m; witch 25.4m; alchemist 22.4m
Fine 13/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08; first=false; warrior 15.1m; guardian 12.5m; rogue 15.3m; hunter 16.4m; archer 15.8m; witch 18.9m; alchemist 16.0m
Fine 14/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.08; first=false; warrior 23.5m; guardian 17.3m; rogue 25.9m; hunter 24.0m; archer 23.0m; witch 22.3m; alchemist 22.3m
Fine 15/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.08; first=false; warrior 25.6m; guardian 23.3m; rogue 22.3m; hunter 33.0m; archer 27.3m; witch 35.3m; alchemist 29.3m
Fine 16/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; warrior 19.6m; guardian 16.3m; rogue 20.3m; hunter 21.3m; archer 19.3m; witch 22.3m; alchemist 18.3m
Fine 17/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.1; first=false; warrior 26.4m; guardian 15.8m; rogue 22.4m; hunter 29.5m; archer 34.5m; witch 35.6m; alchemist 26.6m
Fine 18/36: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.1; first=false; warrior 37.4m; guardian 21.5m; rogue 38.4m; hunter 37.5m; archer 49.5m; witch 51.9m; alchemist 39.6m
Fine 19/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; warrior 10.9m; guardian 9.2m; rogue 12.2m; hunter 12.0m; archer 12.4m; witch 13.7m; alchemist 12.7m
Fine 20/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.06; first=false; warrior 15.2m; guardian 11.5m; rogue 15.3m; hunter 16.2m; archer 19.4m; witch 15.9m; alchemist 17.7m
Fine 21/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.06; first=false; warrior 19.7m; guardian 11.6m; rogue 19.5m; hunter 20.5m; archer 25.4m; witch 26.0m; alchemist 18.9m
Fine 22/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08; first=false; warrior 13.5m; guardian 10.9m; rogue 13.7m; hunter 14.6m; archer 15.8m; witch 16.1m; alchemist 16.0m
Fine 23/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.08; first=false; warrior 18.7m; guardian 15.0m; rogue 16.0m; hunter 18.8m; archer 22.0m; witch 24.4m; alchemist 21.3m
Fine 24/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.08; first=false; warrior 26.2m; guardian 17.3m; rogue 22.0m; hunter 21.0m; archer 25.1m; witch 34.9m; alchemist 26.5m
Fine 25/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; warrior 17.1m; guardian 13.4m; rogue 16.4m; hunter 17.4m; archer 19.4m; witch 20.9m; alchemist 18.6m
Fine 26/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.1; first=false; warrior 24.3m; guardian 19.8m; rogue 25.6m; hunter 26.6m; archer 29.7m; witch 22.3m; alchemist 27.6m
Fine 27/36: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.1; first=false; warrior 34.7m; guardian 25.8m; rogue 33.7m; hunter 36.6m; archer 36.7m; witch 50.3m; alchemist 34.8m
Fine 28/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; warrior 8.4m; guardian 7.9m; rogue 9.7m; hunter 9.6m; archer 11.9m; witch 12.9m; alchemist 10.9m
Fine 29/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.06; first=false; warrior 12.6m; guardian 10.2m; rogue 12.8m; hunter 12.9m; archer 15.2m; witch 16.2m; alchemist 14.2m
Fine 30/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.06; first=false; warrior 14.7m; guardian 14.3m; rogue 17.3m; hunter 17.4m; archer 22.2m; witch 25.2m; alchemist 20.2m
Fine 31/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08; first=false; warrior 11.9m; guardian 9.3m; rogue 11.9m; hunter 12.2m; archer 14.2m; witch 14.4m; alchemist 12.4m
Fine 32/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.08; first=false; warrior 16.3m; guardian 12.4m; rogue 16.6m; hunter 18.3m; archer 19.4m; witch 21.6m; alchemist 19.5m
Fine 33/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.08; first=false; warrior 22.3m; guardian 16.6m; rogue 23.7m; hunter 27.4m; archer 27.6m; witch 26.3m; alchemist 26.3m
Fine 34/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; warrior 14.3m; guardian 10.7m; rogue 15.3m; hunter 15.6m; archer 17.6m; witch 18.1m; alchemist 15.8m
Fine 35/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16} hpGrowth=1.1; first=false; warrior 21.6m; guardian 16.1m; rogue 19.6m; hunter 21.7m; archer 26.1m; witch 27.1m; alchemist 25.1m
Fine 36/36: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.2} hpGrowth=1.1; first=false; warrior 28.8m; guardian 17.2m; rogue 27.3m; hunter 30.2m; archer 34.5m; witch 33.2m; alchemist 30.6m
Fine refined config: score 4013.285714285714; 158.1s
Fine refined config: score 4012.4285714285716; 333.3s
Fine refined config: score 3012.4285714285716; 480.3s
Fine refined config: score 4011.5714285714284; 609.2s
Fine refined S-A: score 3013.285714285714; 614.4s
Fine refined S-A: score 3012.4285714285716; 616.8s
Fine refined S-A: score 3012.4285714285716; 618.7s
Fine refined S-A: score 3011.5714285714284; 627.8s
Fine refined S-B: score 4013.285714285714; 631.5s
Fine refined S-B: score 4012.4285714285716; 632.4s
Fine refined S-B: score 4012.4285714285716; 633.5s
Fine refined S-B: score 4011.5714285714284; 639.2s
Fine search runtime 639.169s

 Test Files  1 passed (1)
      Tests  1 passed | 1 skipped (2)
   Start at  05:03:12
   Duration  639.64s (tests 100%)
```


### Local search: V2_SIM_LOCAL=1, output /tmp/v6d-local.json

```text

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

Fine 1/9: {"baseAtk":12,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 13.7m; guardian 11.9m; rogue 14.7m; hunter 15.1m; archer 14.9m; witch 18.1m; alchemist 15.1m
Fine 2/9: {"baseAtk":12,"baseHp":270,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 12.7m; guardian 11.9m; rogue 13.9m; hunter 14.1m; archer 14.9m; witch 17.1m; alchemist 14.1m
Fine 3/9: {"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 12.7m; guardian 10.9m; rogue 12.7m; hunter 13.1m; archer 14.9m; witch 16.1m; alchemist 13.1m
Fine 4/9: {"baseAtk":13,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 12.4m; guardian 10.7m; rogue 14.5m; hunter 14.5m; archer 15.4m; witch 16.1m; alchemist 13.9m
Fine 5/9: {"baseAtk":13,"baseHp":270,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 12.4m; guardian 9.7m; rogue 13.5m; hunter 13.5m; archer 14.4m; witch 15.1m; alchemist 13.7m
Fine 6/9: {"baseAtk":13,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 11.4m; guardian 9.7m; rogue 12.5m; hunter 12.5m; archer 13.4m; witch 14.1m; alchemist 11.9m
Fine 7/9: {"baseAtk":14,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 12.2m; guardian 10.2m; rogue 13.3m; hunter 13.2m; archer 14.4m; witch 15.7m; alchemist 13.7m
Fine 8/9: {"baseAtk":14,"baseHp":270,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 11.9m; guardian 9.4m; rogue 12.3m; hunter 13.0m; archer 13.4m; witch 14.7m; alchemist 12.7m
Fine 9/9: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 10.9m; guardian 9.2m; rogue 12.2m; hunter 12.2m; archer 12.4m; witch 13.7m; alchemist 11.7m
Fine refined config: score 4014.1428571428573; 191.0s
Fine refined config: score 3013.285714285714; 359.4s
Fine refined config: score 4012.4285714285716; 512.9s
Fine refined config: score 3012.4285714285716; 653.4s
Fine refined S-A: score 3014.1428571428573; 654.3s
Fine refined S-A: score 3013.285714285714; 655.2s
Fine refined S-A: score 3012.4285714285716; 656.2s
Fine refined S-A: score 3012.4285714285716; 657.1s
Fine refined S-B: score 4014.1428571428573; 658.1s
Fine refined S-B: score 4013.285714285714; 659.1s
Fine refined S-B: score 4012.4285714285716; 660.1s
Fine refined S-B: score 4012.4285714285716; 661.0s
Fine search runtime 660.961s

 Test Files  1 passed (1)
      Tests  1 passed | 1 skipped (2)
   Start at  05:04:04
   Duration  661.63s (tests 100%)
```


### Calibration search: V2_SIM_CALIBRATE=1, output /tmp/v6d-calibrate.json

```text

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

Fine 1/32: {"baseAtk":10,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 20.6m; guardian 15.8m; rogue 19.8m; hunter 19.4m; archer 21.8m; witch 22.3m; alchemist 19.9m
Fine 2/32: {"baseAtk":10,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 15.2m; guardian 12.3m; rogue 16.4m; hunter 16.4m; archer 17.8m; witch 18.9m; alchemist 16.8m
Fine 3/32: {"baseAtk":10,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; stable=false; warrior 28.8m; guardian 24.4m; rogue 27.9m; hunter 28.8m; archer 34.4m; witch 36.5m; alchemist 33.5m
Fine 4/32: {"baseAtk":10,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; stable=false; warrior 23.5m; guardian 20.4m; rogue 23.6m; hunter 23.8m; archer 27.4m; witch 28.4m; alchemist 26.4m
Fine 5/32: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 17.6m; guardian 12.8m; rogue 16.8m; hunter 16.4m; archer 18.8m; witch 20.3m; alchemist 17.9m
Fine 6/32: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 13.2m; guardian 12.3m; rogue 16.4m; hunter 14.3m; archer 15.8m; witch 16.9m; alchemist 15.8m
Fine 7/32: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; stable=false; warrior 24.8m; guardian 21.4m; rogue 24.9m; hunter 24.8m; archer 29.4m; witch 31.4m; alchemist 29.5m
Fine 8/32: {"baseAtk":10,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; stable=false; warrior 21.5m; guardian 16.4m; rogue 20.6m; hunter 22.8m; archer 23.4m; witch 26.4m; alchemist 24.4m
Fine 9/32: {"baseAtk":14,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 14.2m; guardian 10.4m; rogue 14.3m; hunter 14.2m; archer 15.4m; witch 17.7m; alchemist 14.7m
Fine 10/32: {"baseAtk":14,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 10.9m; guardian 9.2m; rogue 12.2m; hunter 11.9m; archer 13.3m; witch 14.3m; alchemist 13.4m
Fine 11/32: {"baseAtk":14,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; stable=false; warrior 20.1m; guardian 17.4m; rogue 21.4m; hunter 21.4m; archer 24.4m; witch 24.9m; alchemist 22.6m
Fine 12/32: {"baseAtk":14,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; stable=false; warrior 16.1m; guardian 14.2m; rogue 17.1m; hunter 16.2m; archer 19.4m; witch 20.5m; alchemist 18.4m
Fine 13/32: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=true; stable=false; warrior 12.2m; guardian 10.4m; rogue 12.3m; hunter 13.2m; archer 14.4m; witch 14.7m; alchemist 12.7m
Fine 14/32: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 9.9m; guardian 8.2m; rogue 10.2m; hunter 9.9m; archer 12.3m; witch 12.3m; alchemist 11.4m
Fine 15/32: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; stable=false; warrior 18.1m; guardian 14.4m; rogue 17.4m; hunter 20.4m; archer 21.4m; witch 21.9m; alchemist 20.6m
Fine 16/32: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; stable=false; warrior 15.1m; guardian 12.2m; rogue 15.3m; hunter 16.2m; archer 18.4m; witch 18.5m; alchemist 17.4m
Fine 17/32: {"baseAtk":18,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 10.2m; guardian 8.3m; rogue 11.3m; hunter 10.4m; archer 12.4m; witch 12.7m; alchemist 11.7m
Fine 18/32: {"baseAtk":18,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 9.0m; guardian 7.1m; rogue 8.1m; hunter 8.1m; archer 10.3m; witch 10.4m; alchemist 9.4m
Fine 19/32: {"baseAtk":18,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; stable=false; warrior 16.2m; guardian 12.3m; rogue 16.3m; hunter 16.3m; archer 18.4m; witch 18.3m; alchemist 17.3m
Fine 20/32: {"baseAtk":18,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; stable=false; warrior 12.8m; guardian 10.3m; rogue 13.9m; hunter 13.8m; archer 14.2m; witch 15.2m; alchemist 14.2m
Fine 21/32: {"baseAtk":18,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 9.2m; guardian 7.3m; rogue 9.3m; hunter 9.4m; archer 10.4m; witch 11.7m; alchemist 9.7m
Fine 22/32: {"baseAtk":18,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=true; warrior 8.0m; guardian 6.1m; rogue 8.1m; hunter 8.1m; archer 9.3m; witch 9.4m; alchemist 8.4m
Fine 23/32: {"baseAtk":18,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; stable=false; warrior 14.2m; guardian 11.3m; rogue 15.3m; hunter 14.3m; archer 15.4m; witch 17.3m; alchemist 14.3m
Fine 24/32: {"baseAtk":18,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; stable=false; warrior 10.8m; guardian 9.3m; rogue 11.9m; hunter 11.8m; archer 13.2m; witch 13.2m; alchemist 12.2m
Fine 25/32: {"baseAtk":22,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=false; warrior 7.6m; guardian 6.8m; rogue 8.6m; hunter 7.7m; archer 9.8m; witch 10.8m; alchemist 8.8m
Fine 26/32: {"baseAtk":22,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=true; warrior 7.4m; guardian 5.6m; rogue 7.4m; hunter 7.4m; archer 8.7m; witch 8.8m; alchemist 7.8m
Fine 27/32: {"baseAtk":22,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; stable=false; warrior 12.3m; guardian 10.5m; rogue 12.3m; hunter 12.3m; archer 14.7m; witch 15.4m; alchemist 13.7m
Fine 28/32: {"baseAtk":22,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; stable=false; warrior 9.1m; guardian 8.4m; rogue 10.3m; hunter 10.3m; archer 11.4m; witch 12.4m; alchemist 11.4m
Fine 29/32: {"baseAtk":22,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=true; warrior 7.6m; guardian 5.8m; rogue 7.6m; hunter 7.7m; archer 8.8m; witch 8.8m; alchemist 7.8m
Fine 30/32: {"baseAtk":22,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06; first=false; stable=true; warrior 6.4m; guardian 5.6m; rogue 6.4m; hunter 6.4m; archer 7.7m; witch 7.8m; alchemist 6.8m
Fine 31/32: {"baseAtk":22,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; stable=false; warrior 11.3m; guardian 8.5m; rogue 11.3m; hunter 11.3m; archer 12.7m; witch 12.4m; alchemist 11.7m
Fine 32/32: {"baseAtk":22,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.1; first=false; stable=false; warrior 9.1m; guardian 7.4m; rogue 9.3m; hunter 9.3m; archer 10.4m; witch 11.4m; alchemist 10.4m
Fine refined config: score 5014.428571428572; 277.9s
Fine refined config: score 4105; 397.1s
Fine refined config: score 4105; 499.7s
Fine refined config: score 4105; 567.7s
Fine refined S-A: score 4014.4285714285716; 568.2s
Fine refined S-A: score 3105; 568.7s
Fine refined S-A: score 3105; 569.2s
Fine refined S-A: score 3105; 569.7s
Fine refined S-B: score 5014.428571428572; 570.2s
Fine refined S-B: score 4105; 570.7s
Fine refined S-B: score 4105; 571.1s
Fine refined S-B: score 4105; 571.6s
Fine search runtime 571.594s

 Test Files  1 passed (1)
      Tests  1 passed | 1 skipped (2)
   Start at  05:06:20
   Duration  572.24s (tests 100%)
```


### Cooldown search: V2_SIM_TIMING=1, output /tmp/v6d-timing.json

```text

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

Fine 1/24: {"baseAtk":14,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06 cooldown=20; first=false; stable=true; warrior 14.9m; guardian 11.7m; rogue 14.6m; hunter 15.9m; archer 17.7m; witch 18.4m; alchemist 15.7m
Fine 2/24: {"baseAtk":14,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06 cooldown=30; first=false; stable=false; warrior 14.2m; guardian 11.9m; rogue 15.3m; hunter 15.2m; archer 16.4m; witch 17.7m; alchemist 15.7m
Fine 3/24: {"baseAtk":14,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06 cooldown=60; first=false; stable=false; warrior 14.2m; guardian 10.4m; rogue 14.3m; hunter 14.2m; archer 15.4m; witch 17.7m; alchemist 14.7m
Fine 4/24: {"baseAtk":14,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08 cooldown=20; first=false; stable=false; warrior 17.9m; guardian 14.7m; rogue 19.3m; hunter 19.7m; archer 22.3m; witch 23.2m; alchemist 20.4m
Fine 5/24: {"baseAtk":14,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08 cooldown=30; first=false; stable=false; warrior 17.5m; guardian 14.5m; rogue 18.4m; hunter 19.7m; archer 21.8m; witch 22.2m; alchemist 19.5m
Fine 6/24: {"baseAtk":14,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08 cooldown=60; first=false; stable=false; warrior 17.5m; guardian 14.0m; rogue 16.9m; hunter 17.7m; archer 18.8m; witch 19.2m; alchemist 18.0m
Fine 7/24: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06 cooldown=20; first=false; stable=false; warrior 12.2m; guardian 9.7m; rogue 12.6m; hunter 13.6m; archer 15.7m; witch 15.3m; alchemist 13.0m
Fine 8/24: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06 cooldown=30; first=true; stable=false; warrior 12.2m; guardian 10.9m; rogue 12.2m; hunter 14.2m; archer 14.4m; witch 14.7m; alchemist 13.7m
Fine 9/24: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06 cooldown=60; first=true; stable=false; warrior 12.2m; guardian 10.4m; rogue 12.3m; hunter 13.2m; archer 14.4m; witch 14.7m; alchemist 12.7m
Fine 10/24: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08 cooldown=20; first=false; stable=false; warrior 16.5m; guardian 12.3m; rogue 15.3m; hunter 17.0m; archer 21.1m; witch 19.9m; alchemist 17.4m
Fine 11/24: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08 cooldown=30; first=false; stable=false; warrior 15.5m; guardian 12.5m; rogue 15.9m; hunter 17.2m; archer 18.8m; witch 19.2m; alchemist 17.0m
Fine 12/24: {"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08 cooldown=60; first=false; stable=false; warrior 15.5m; guardian 12.0m; rogue 15.9m; hunter 15.7m; archer 16.8m; witch 17.2m; alchemist 16.0m
Fine 13/24: {"baseAtk":16,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06 cooldown=20; first=false; stable=true; warrior 12.7m; guardian 10.0m; rogue 12.7m; hunter 12.9m; archer 14.9m; witch 15.9m; alchemist 13.3m
Fine 14/24: {"baseAtk":16,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06 cooldown=30; first=false; stable=true; warrior 11.9m; guardian 10.5m; rogue 13.2m; hunter 13.1m; archer 13.9m; witch 15.4m; alchemist 13.4m
Fine 15/24: {"baseAtk":16,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06 cooldown=60; first=false; stable=false; warrior 11.4m; guardian 10.0m; rogue 11.7m; hunter 11.6m; archer 13.9m; witch 14.9m; alchemist 12.9m
Fine 16/24: {"baseAtk":16,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08 cooldown=20; first=false; stable=false; warrior 15.2m; guardian 11.7m; rogue 15.9m; hunter 16.9m; archer 19.3m; witch 19.8m; alchemist 17.2m
Fine 17/24: {"baseAtk":16,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08 cooldown=30; first=false; stable=false; warrior 14.7m; guardian 12.8m; rogue 16.2m; hunter 15.7m; archer 18.8m; witch 19.0m; alchemist 16.0m
Fine 18/24: {"baseAtk":16,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08 cooldown=60; first=false; stable=false; warrior 14.2m; guardian 11.3m; rogue 15.2m; hunter 14.2m; archer 17.3m; witch 18.5m; alchemist 15.5m
Fine 19/24: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06 cooldown=20; first=false; stable=false; warrior 10.4m; guardian 8.6m; rogue 11.7m; hunter 10.6m; archer 13.6m; witch 13.2m; alchemist 12.3m
Fine 20/24: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06 cooldown=30; first=false; stable=true; warrior 9.9m; guardian 9.0m; rogue 10.2m; hunter 11.1m; archer 12.9m; witch 13.4m; alchemist 11.4m
Fine 21/24: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.06 cooldown=60; first=false; stable=false; warrior 10.4m; guardian 9.0m; rogue 10.7m; hunter 11.6m; archer 12.9m; witch 12.9m; alchemist 11.9m
Fine 22/24: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08 cooldown=20; first=false; stable=false; warrior 13.9m; guardian 10.3m; rogue 13.6m; hunter 14.2m; archer 16.6m; witch 17.5m; alchemist 15.2m
Fine 23/24: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08 cooldown=30; first=false; stable=false; warrior 13.7m; guardian 10.7m; rogue 13.2m; hunter 14.2m; archer 16.3m; witch 16.5m; alchemist 15.0m
Fine 24/24: {"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12} hpGrowth=1.08 cooldown=60; first=false; stable=false; warrior 13.2m; guardian 10.3m; rogue 13.2m; hunter 13.2m; archer 15.3m; witch 16.5m; alchemist 14.5m
Fine refined config: score 5014.428571428572; 142.6s
Fine refined config: score 5014.142857142857; 190.9s
Fine refined S-A: score 4014.4285714285716; 191.4s
Fine refined S-A: score 4014.1428571428573; 191.9s
Fine refined S-B: score 5014.428571428572; 192.4s
Fine refined S-B: score 5014.142857142857; 192.9s
Fine search runtime 192.943s

 Test Files  1 passed (1)
      Tests  1 passed | 1 skipped (2)
   Start at  05:13:04
   Duration  193.42s (tests 100%)
```


### Final selection: V2_SIM_SELECT=1 V2_SIM_SELECT_INPUTS=/tmp/v6d-search.json,/tmp/v6d-fine.json,/tmp/v6d-near.json,/tmp/v6d-local.json,/tmp/v6d-calibrate.json,/tmp/v6d-timing.json V2_SIM_SEARCH_OUTPUT=/tmp/v6d-selected.json pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/search.test.ts

```text

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

config: stable=false, passing=4, {"cat":{"baseAtk":22,"baseHp":200,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.16,"atkBase":4,"atkGrowth":1.04,"xpBase":18,"xpGrowth":1.15},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":3000,"bigEveryMs":6000,"bigMultiplier":1.5}}
config: stable=false, passing=4, {"cat":{"baseAtk":22,"baseHp":200,"baseDef":10,"levelGrowth":0.045,"xpGrowth":1.24},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":2,"atkGrowth":1.04,"xpBase":6,"xpGrowth":1.15},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
config: stable=false, passing=4, {"cat":{"baseAtk":14,"baseHp":200,"baseDef":5,"levelGrowth":0.03,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":2,"atkGrowth":1.01,"xpBase":6,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":330},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
config: stable=false, passing=4, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.06},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
config: stable=false, passing=4, {"cat":{"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.06},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
config: stable=false, passing=4, {"cat":{"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.06},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
config: stable=false, passing=4, {"cat":{"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.06},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
config: stable=false, passing=4, {"cat":{"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.08,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
config: stable=false, passing=4, {"cat":{"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
config: stable=false, passing=4, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.08,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
config: stable=false, passing=3, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
config: stable=false, passing=4, {"cat":{"baseAtk":14,"baseHp":270,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
config: stable=false, passing=3, {"cat":{"baseAtk":14,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
config: stable=false, passing=5, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
config: stable=true, passing=4, {"cat":{"baseAtk":18,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.15},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
config: stable=true, passing=4, {"cat":{"baseAtk":22,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.15},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
config: stable=true, passing=4, {"cat":{"baseAtk":22,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
config: stable=false, passing=5, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5,"lossCooldownSeconds":60}}
config: stable=false, passing=5, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5,"lossCooldownSeconds":30}}
S-A: stable=false, passing=3, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-A: stable=false, passing=3, {"cat":{"baseAtk":22,"baseHp":200,"baseDef":10,"levelGrowth":0.045,"xpGrowth":1.24},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":2,"atkGrowth":1.04,"xpBase":6,"xpGrowth":1.15},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-A: stable=false, passing=2, {"cat":{"baseAtk":14,"baseHp":200,"baseDef":5,"levelGrowth":0.03,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":2,"atkGrowth":1.01,"xpBase":6,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":330},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-A: stable=false, passing=3, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.06},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-A: stable=false, passing=3, {"cat":{"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.06},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-A: stable=false, passing=3, {"cat":{"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.06},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-A: stable=false, passing=3, {"cat":{"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.06},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-A: stable=false, passing=3, {"cat":{"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.08,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-A: stable=false, passing=3, {"cat":{"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-A: stable=false, passing=3, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-A: stable=false, passing=3, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.08,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-A: stable=false, passing=3, {"cat":{"baseAtk":14,"baseHp":270,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-A: stable=false, passing=3, {"cat":{"baseAtk":14,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-A: stable=false, passing=4, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-A: stable=true, passing=3, {"cat":{"baseAtk":18,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.15},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-A: stable=true, passing=3, {"cat":{"baseAtk":22,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.15},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-A: stable=true, passing=3, {"cat":{"baseAtk":22,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-A: stable=false, passing=4, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5,"lossCooldownSeconds":60}}
S-A: stable=false, passing=4, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5,"lossCooldownSeconds":30}}
S-B: stable=false, passing=4, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-B: stable=false, passing=4, {"cat":{"baseAtk":22,"baseHp":200,"baseDef":10,"levelGrowth":0.045,"xpGrowth":1.24},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":2,"atkGrowth":1.04,"xpBase":6,"xpGrowth":1.15},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-B: stable=false, passing=3, {"cat":{"baseAtk":14,"baseHp":200,"baseDef":5,"levelGrowth":0.03,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":2,"atkGrowth":1.01,"xpBase":6,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":330},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-B: stable=false, passing=4, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.06},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-B: stable=false, passing=4, {"cat":{"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.06},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-B: stable=false, passing=4, {"cat":{"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.16},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.06},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-B: stable=false, passing=4, {"cat":{"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.06},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-B: stable=false, passing=4, {"cat":{"baseAtk":16,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.08,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-B: stable=false, passing=4, {"cat":{"baseAtk":12,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-B: stable=false, passing=4, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-B: stable=false, passing=4, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.08,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-B: stable=false, passing=4, {"cat":{"baseAtk":14,"baseHp":270,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-B: stable=false, passing=4, {"cat":{"baseAtk":14,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-B: stable=false, passing=5, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-B: stable=true, passing=4, {"cat":{"baseAtk":18,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.15},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-B: stable=true, passing=4, {"cat":{"baseAtk":22,"baseHp":240,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.15},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-B: stable=true, passing=4, {"cat":{"baseAtk":22,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}}
S-B: stable=false, passing=5, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5,"lossCooldownSeconds":60}}
S-B: stable=false, passing=5, {"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06,"xpGrowth":1.12},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18,"xpGrowth":1.11},"idle":{"dailyKeys":3,"walkTimeMs":1000,"gearDropChance":0.0067},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5,"lossCooldownSeconds":30}}

 Test Files  1 passed (1)
      Tests  1 passed | 2 skipped (3)
   Start at  05:16:42
   Duration  38.80s (tests 100%)
```


## Files changed and remaining uncertainty


- `docs/proposals/numbers-v2.md`
- `packages/game-rules/src/v2/sim/diagnosis.test.ts`
- `packages/game-rules/src/v2/sim/player.ts`
- `packages/game-rules/src/v2/sim/proposal.ts`
- `packages/game-rules/src/v2/sim/report.ts`
- `packages/game-rules/src/v2/sim/report.write.test.ts`
- `packages/game-rules/src/v2/sim/search.test.ts`
- `packages/game-rules/src/v2/sim/sim.test.ts`
- `packages/game-rules/src/v2/sim/simulate.ts`
- `packages/game-rules/src/v2/sim/targets.test.ts`
- `packages/game-rules/src/v2/sim/targets.ts`
- `reports/v6d-rebalance.md`


The production config, content, idle/state/combat code, exports, dependency manifests, applications, Supabase maps and workflows are unchanged. Checks below audit the allow-list and whitespace. The search is finite; scenario cohorts have five seeds, the main cohort twenty, and the normal regression three. Claimed scenario reachability is measured evidence, not a guarantee for future seeds. Boss replay duration is excluded from active minutes, profiles exclude away-time gains, and claim-size changes retain genuine production RNG/batching/policy differences. The main proposal is selected with the mandatory measurement criterion, so its additional first-boss failure is disclosed instead of hiding that tradeoff. The cap flag includes incomplete runs that reach max level before any eventual ch5 win; missing milestones fail targets through Infinity. Content suggestions remain unvalidated words.

## Final scope audit

```text
$ python /tmp/v6d-audit.py
PASS allowed: docs/proposals/numbers-v2.md
PASS allowed: packages/game-rules/src/v2/sim/diagnosis.test.ts
PASS allowed: packages/game-rules/src/v2/sim/player.ts
PASS allowed: packages/game-rules/src/v2/sim/proposal.ts
PASS allowed: packages/game-rules/src/v2/sim/report.ts
PASS allowed: packages/game-rules/src/v2/sim/report.write.test.ts
PASS allowed: packages/game-rules/src/v2/sim/search.test.ts
PASS allowed: packages/game-rules/src/v2/sim/sim.test.ts
PASS allowed: packages/game-rules/src/v2/sim/simulate.ts
PASS allowed: packages/game-rules/src/v2/sim/targets.test.ts
PASS allowed: packages/game-rules/src/v2/sim/targets.ts
PASS allowed: reports/v6d-rebalance.md
PASS git diff --check
PASS production paths, barrel, manifests, apps, Supabase and workflows unchanged
```

## Author audit before first push

```text
$ git log --format='%an <%ae>' origin/main..HEAD
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

There is one commit with the requested author. No author reset was needed; the report-only amendment preserves this author. All required checks passed, the allow-list audit is clean, and the branch is ready for the authorized push. No PR is opened and no Actions are dispatched.
