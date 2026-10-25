# V6c rebalance investigation

Proposal only. V2_CONFIG unchanged.

Branch: `ai/codex-v6c-rebalance`, based on freshly fetched `origin/main` at `31689de289b578290a63a613b43f4b6ab19ba736`.

## Outcome and what the user is signing

This is a **failing fallback proposal, not ready for sign-off**; no passing configuration was found in the finite search. The 20-seed run passes four of nine targets. Chapter-growth, class-spread, chapter-bounds, never-stuck and boss-check are NO.
Chapter 1's per-class median clear times range from 10 to 14 active minutes; chapter 5 takes 1,446 active minutes (24 hours 6 minutes) for every class because of the key wait.
Classes retain their attack intervals, passives and defensive multipliers; the generated tables below show timing and boss-loss differences rather than assuming identical classes are balanced.
The candidate grants 3 daily keys, uses 1000 ms walking, and allows at most 180 seconds per boss attempt. Active minutes exclude boss replay time.
Signing would approve the exact candidate leaves below; the recommendation is to address the reported content/key constraints and re-simulate before signing.

The user explicitly authorized a fallback regression test and pushing the documented result if the search found no passing config-only proposal. The regression verifies the exact failing target set on three seeds per class; target thresholds remain strict. Passing the software tests does **not** mean the balance proposal passes its targets.

## Gate check

Executed before branching or implementation:

```text
$ git config user.email
anthony.robinson.125292048@ms.namdinh.edu.vn
$ git config user.name
Hazel
$ git config user.email 108352255+ntbaoheyhey@users.noreply.github.com
$ git config user.name ntbaoheyhey
$ git fetch origin +main:refs/remotes/origin/main
From https://github.com/ntbaoheyhey/taskbar-hero
 * [new branch]      main       -> origin/main
$ git rev-parse origin/main
31689de289b578290a63a613b43f4b6ab19ba736
$ for file in simulate.ts targets.ts proposal.ts report.ts report.write.test.ts; do if git cat-file -e "origin/main:packages/game-rules/src/v2/sim/$file" 2>/dev/null; then echo "PASS exists: $file"; else echo "FAIL missing: $file"; fi; done
PASS exists: simulate.ts
PASS exists: targets.ts
PASS exists: proposal.ts
PASS exists: report.ts
PASS exists: report.write.test.ts
$ git show origin/main:docs/proposals/numbers-v2.md | grep -n 'User: ____'
94:User: ____ (approved / changes)
$ git show origin/main:packages/game-rules/src/v2/config.ts | rg -n 'walkTimeMs:|baseHp:'
9:    baseHp: 100,
24:    walkTimeMs: 1000,
```

All gate checks passed. Local Git identity was corrected before creating any commit.

## Old and new proposal side by side

A missing override means the current production value remains in effect. Unchanged leaves retained by the search are listed explicitly.

| path | current | old proposal | new proposal |
| --- | ---: | ---: | ---: |
| boss.attackIntervalMs | 1500 | 1500 | 4500 |
| boss.bigEveryMs | 6000 | 6000 | 6000 |
| boss.bigMultiplier | 2.5 | 2.5 | 1.5 |
| boss.maxMs | 60000 | 1200000 | 180000 |
| cat.baseAtk | 10 | 52 | 14 |
| cat.baseDef | 5 | 5 | 5 |
| cat.baseHp | 100 | 6000 | 300 |
| cat.levelGrowth | 0.06 | 0.008 | 0.06 |
| idle.clearedChapterKeyChance | 0.006666666666666667 | 0.006666666666666667 | 0.02 |
| idle.dailyKeys | 1 | 5 | 3 |
| idle.walkTimeMs | 1000 | 6000 | 1000 |
| monster.atkBase | 4 | 4 | 8 |
| monster.atkGrowth | 1.12 | 1.01 | 1.06 |
| monster.hpBase | 30 | 30 | 90 |
| monster.hpGrowth | 1.13 | 1.111 | 1.06 |
| monster.xpBase | 6 | 6 | 18 |

The larger sample exposes a stall that seeds 1–3 do not: hunter seed 5 is stuck at minute 1,384, chapter 4 round 10, during the key wait. The sticky stall remains a failure even though the run later finishes. This is reported without relaxing the no-stall target.

## Three-seed regression outcome

| target | passes on seeds 1–3 |
| --- | --- |
| first-boss | yes |
| chapter-growth | NO |
| class-spread | NO |
| chapter-bounds | NO |
| never-stuck | yes |
| craft-salvage-loss | yes |
| walk-share | yes |
| boss-check | NO |
| guardrails | yes |

## Search and limits

The reproducible opt-in search first screened 81 grid candidates at stepMinutes 2, seed 1 per class, 360 active minutes. The initial progress log had an incorrect denominator of 243; it actually iterated 3^4 = 81 candidates, and the reproducible search now prints 81. It then rechecked the eight highest-ranked candidates on seeds 1–3 at the full 1,800-minute horizon. A second deterministic exploration sampled 96 candidates across starting HP/ATK/DEF, stat growth, monster HP/damage/XP, walking, key-drop chance, boss attack interval and big-attack parameters. Its leading candidates were also checked on three seeds per class before final selection. The screening score prioritizes passing aggregate targets, then first-boss-window samples and reached chapter wins; final selection uses the full-horizon score. Ties retain deterministic input order. A one-seed screen cannot satisfy a 40–90% per-class boss-win interval; its boss-check is diagnostic, with actual acceptance evaluated on three and twenty seeds.

The early search used nearest-observed-level walk samples; final measurement was tightened to evaluate every entry gear set at the exact median level, using production's flooring rule. The selected candidate was revalidated with that strict measurement on three and twenty seeds. No candidate in this searched family passed every target. This does not prove no configuration-only solution exists, and no global optimum or minimal set is claimed. Suggestions below identify plausible content levers; they are not a validated patch or a promise that one change closes all gaps.

Final focused sim runtime: 51.32 seconds. The complete game-rules test suite took 73.23 seconds in the full local run, below the approximately two-minute budget. Normal tests share the 21 proposed runs between target and final-state checks; the opt-in report and search are excluded from the normal suite. Both the focused run and the complete game-rules runtime are retained in the logs. Report writer runtime: Full 7 x 20 current + proposed + diagnostic runtime: 791.905s The writer exceeded ten minutes.

## Content changes suggested from the measured constraints

Fix the key budget before tuning late bosses: add one CatKey to each chapter 2 and 3 first-clear chest. That supplies five first wins from three daily keys and two chest rewards; it removes the particular day-two wait without changing the daily-key cap. Then increase chapter 2/3/5 kill requirements where measured durations are below ten minutes, and tune each chapter separately for 1.3–2x growth. Re-run before choosing exact content numbers because extra kills change XP, drops and boss-entry strength.

For the fast three-seed check, two-minute claims yield even first-boss medians. Combining 10–15 minutes, ±15% class deviation and nonzero spread forces the class center to 14 minutes, with class medians of 12 or 14 and at least four classes at 14. A center of 10 or 12 permits only identical times and necessarily fails minimum spread. A promising content direction is slightly more chapter-1 kills to move most classes toward 14, with a small Witch damage/passive adjustment if it overshoots; keep a faster class near 12 instead of flattening every class. A Guardian HP/DEF reduction could slow early boss wins if it remains too far ahead. These are directions to validate, not approved numerical changes.

After removing the key wait, tune each chapter boss archetype separately: lower early boss ATK where first-attempt wins are below 40%, and raise challenge where wins remain above 90%. The current late-boss measurements include extra leveling/gear obtained during the key wait, so raising late boss difficulty before fixing keys could overtune those fights. No particular class multiplier or chapter patch has been validated as sufficient to close every target.

## Remaining uncertainty

The search is finite, the suggestions are unvalidated content directions, and class timing is not a complete measure of combat feel. Boss replay duration is excluded from active minutes. Both step sizes are shown, with matched seeds 1–5 as well as the main 20-seed cohort. The three-seed fallback regression documents its own exact failing set; the report independently re-evaluates all targets on twenty seeds, so differences between sample sizes remain visible.

## Files changed

- `docs/proposals/numbers-v2.md`
- `packages/game-rules/src/v2/sim/proposal.ts`
- `packages/game-rules/src/v2/sim/report.ts`
- `packages/game-rules/src/v2/sim/report.write.test.ts`
- `packages/game-rules/src/v2/sim/search.test.ts`
- `packages/game-rules/src/v2/sim/sim.test.ts`
- `packages/game-rules/src/v2/sim/simulate.ts`
- `packages/game-rules/src/v2/sim/targets.test.ts`
- `packages/game-rules/src/v2/sim/targets.ts`
- `reports/v6c-rebalance.md`

Only allow-listed files are included. No dependencies were added. The host's fallback pnpm 11 initially wrote build-policy placeholders into pnpm-workspace.yaml; they were immediately restored to the exact original contents, and subsequent commands used the repository-pinned pnpm 10.28.0 through a temporary PATH shim outside the repository. The lockfile, production config/content, production barrel, apps and Supabase files are unchanged. No Actions are dispatched and no PR is opened; workflow triggers were inspected before pushing.

## Generated measurements and target table

The following content comes from docs/proposals/numbers-v2.md, generated only by the writer test. It includes both step sizes, quartiles, boss losses, time-to-kill, explanations and the blank sign-off.

# Cat RPG v2 numbers proposal (V6c)

Proposal only. V2_CONFIG unchanged. Needs the user's sign-off. Main run: seven classes, seeds 1–20, stepMinutes 2, maximum 1,800 active minutes. Diagnostic: stepMinutes 1, seeds 1–5, same horizon. Greedy equipment, up to three improving crafts per claim, salvage at 90% bag usage, boss attempts at the frontier. Stop after chapter five's first clear. Null milestones remain Infinity in every timing target and percentile.

**Status:** NOT READY FOR SIGN-OFF. Failing targets: chapter-growth, class-spread, chapter-bounds, never-stuck, boss-check. The bounded config search found no all-targets solution; this is a fallback candidate, not an approved balance.

## Targets

| id | target in words | current result | proposed result | ok? |
| --- | --- | --- | --- | --- |
| first-boss | Every class median first win 10–15 minutes | warrior 38m; guardian 28m; rogue 38m; hunter 40m; archer 47m; witch 49m; alchemist 47m | warrior 12m; guardian 10m; rogue 12m; hunter 12m; archer 14m; witch 14m; alchemist 12m | yes |
| chapter-growth | Every class chapter duration grows 1.3–2.0x | warrior ch2 36.95x; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch2 50.50x; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch2 36.95x; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch2 35.05x; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch2 29.68x; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch2 28.43x; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch2 29.68x; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached | warrior ch2 0.67x; warrior ch3 1.00x; warrior ch4 177.00x; warrior ch5 0.00x; guardian ch2 0.80x; guardian ch3 1.00x; guardian ch4 177.00x; guardian ch5 0.00x; rogue ch2 0.67x; rogue ch3 0.75x; rogue ch4 236.00x; rogue ch5 0.00x; hunter ch2 0.67x; hunter ch3 0.88x; hunter ch4 202.29x; hunter ch5 0.00x; archer ch2 0.57x; archer ch3 1.00x; archer ch4 176.50x; archer ch5 0.00x; witch ch2 0.57x; witch ch3 1.00x; witch ch4 176.50x; witch ch5 0.00x; alchemist ch2 0.67x; alchemist ch3 1.00x; alchemist ch4 176.75x; alchemist ch5 0.00x | NO |
| class-spread | Every cumulative class median within ±15% of center AND chapter range / center ≥3% | ch1 range 52.5%; ch2 range 0.0%; ch3 range not reached; ch4 range not reached; ch5 range not reached; warrior ch1 -5.0%; guardian ch1 -30.0%; rogue ch1 -5.0%; hunter ch1 0.0%; archer ch1 17.5%; witch ch1 22.5%; alchemist ch1 17.5%; warrior ch2 0.0%; guardian ch2 0.0%; rogue ch2 0.0%; hunter ch2 0.0%; archer ch2 0.0%; witch ch2 0.0%; alchemist ch2 0.0%; warrior ch3 not reached; guardian ch3 not reached; rogue ch3 not reached; hunter ch3 not reached; archer ch3 not reached; witch ch3 not reached; alchemist ch3 not reached; warrior ch4 not reached; guardian ch4 not reached; rogue ch4 not reached; hunter ch4 not reached; archer ch4 not reached; witch ch4 not reached; alchemist ch4 not reached; warrior ch5 not reached; guardian ch5 not reached; rogue ch5 not reached; hunter ch5 not reached; archer ch5 not reached; witch ch5 not reached; alchemist ch5 not reached | ch1 range 33.3%; ch2 range 20.0%; ch3 range 15.4%; ch4 range 0.0%; ch5 range 0.0%; warrior ch1 0.0%; guardian ch1 -16.7%; rogue ch1 0.0%; hunter ch1 0.0%; archer ch1 16.7%; witch ch1 16.7%; alchemist ch1 0.0%; warrior ch2 0.0%; guardian ch2 -10.0%; rogue ch2 -10.0%; hunter ch2 0.0%; archer ch2 10.0%; witch ch2 10.0%; alchemist ch2 0.0%; warrior ch3 0.0%; guardian ch3 0.0%; rogue ch3 0.0%; hunter ch3 0.0%; archer ch3 15.4%; witch ch3 15.4%; alchemist ch3 7.7%; warrior ch4 0.0%; guardian ch4 0.0%; rogue ch4 0.0%; hunter ch4 0.0%; archer ch4 0.0%; witch ch4 0.0%; alchemist ch4 0.0%; warrior ch5 0.0%; guardian ch5 0.0%; rogue ch5 0.0%; hunter ch5 0.0%; archer ch5 0.0%; witch ch5 0.0%; alchemist ch5 0.0% | NO |
| chapter-bounds | Every chapter duration median 10–360 minutes | warrior ch1 38m; warrior ch2 1404m; warrior ch3 not reached; warrior ch4 not reached; warrior ch5 not reached; guardian ch1 28m; guardian ch2 1414m; guardian ch3 not reached; guardian ch4 not reached; guardian ch5 not reached; rogue ch1 38m; rogue ch2 1404m; rogue ch3 not reached; rogue ch4 not reached; rogue ch5 not reached; hunter ch1 40m; hunter ch2 1402m; hunter ch3 not reached; hunter ch4 not reached; hunter ch5 not reached; archer ch1 47m; archer ch2 1395m; archer ch3 not reached; archer ch4 not reached; archer ch5 not reached; witch ch1 49m; witch ch2 1393m; witch ch3 not reached; witch ch4 not reached; witch ch5 not reached; alchemist ch1 47m; alchemist ch2 1395m; alchemist ch3 not reached; alchemist ch4 not reached; alchemist ch5 not reached | warrior ch1 12m; warrior ch2 8m; warrior ch3 8m; warrior ch4 1416m; warrior ch5 4m; guardian ch1 10m; guardian ch2 8m; guardian ch3 8m; guardian ch4 1416m; guardian ch5 4m; rogue ch1 12m; rogue ch2 8m; rogue ch3 6m; rogue ch4 1416m; rogue ch5 4m; hunter ch1 12m; hunter ch2 8m; hunter ch3 7m; hunter ch4 1416m; hunter ch5 4m; archer ch1 14m; archer ch2 8m; archer ch3 8m; archer ch4 1412m; archer ch5 4m; witch ch1 14m; witch ch2 8m; witch ch3 8m; witch ch4 1412m; witch ch5 4m; alchemist ch1 12m; alchemist ch2 8m; alchemist ch3 8m; alchemist ch4 1414m; alchemist ch5 4m | NO |
| never-stuck | No six-hour period without level, round, boss win or power gain | 0/140 runs stuck | 1/140 runs stuck | NO |
| craft-salvage-loss | Every recipe returns less weighted salvage value than cost | rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 | rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600 | yes |
| walk-share | Every class at ch1 r1 and ch3 r5: walking ≤50% at median observed entry level | warrior ch1 r1 L1.0: 44.6%; warrior ch3 r5 L60.0: 80.6%; guardian ch1 r1 L1.0: 34.2%; guardian ch3 r5 L60.0: 65.8%; rogue ch1 r1 L1.0: 34.5%; rogue ch3 r5 L60.0: 65.3%; hunter ch1 r1 L1.0: 41.7%; hunter ch3 r5 L60.0: 76.9%; archer ch1 r1 L1.0: 35.1%; archer ch3 r5 L60.0: 66.7%; witch ch1 r1 L1.0: 29.0%; witch ch3 r5 L60.0: 54.1%; alchemist ch1 r1 L1.0: 33.2%; alchemist ch3 r5 L60.0: 58.5% | warrior ch1 r1 L1.0: 21.1%; warrior ch3 r5 L37.0: 29.8%; guardian ch1 r1 L1.0: 17.5%; guardian ch3 r5 L35.0: 25.5%; rogue ch1 r1 L1.0: 17.5%; rogue ch3 r5 L36.0: 30.0%; hunter ch1 r1 L1.0: 19.4%; hunter ch3 r5 L37.0: 30.7%; archer ch1 r1 L1.0: 18.0%; archer ch3 r5 L37.0: 28.8%; witch ch1 r1 L1.0: 17.1%; witch ch3 r5 L37.0: 30.2%; alchemist ch1 r1 L1.0: 17.8%; alchemist ch3 r5 L36.0: 25.4% | yes |
| boss-check | Every chapter/class first-attempt wins 40–90%; median boss duration ≤180s | warrior ch1 first win 0.0%, median 25.50s; warrior ch2 first win 100.0%, median 7.84s; warrior ch3 first win 0.0%, median not reached (missing attempts); warrior ch4 first win 0.0%, median not reached (missing attempts); warrior ch5 first win 0.0%, median not reached (missing attempts); guardian ch1 first win 0.0%, median 36.00s; guardian ch2 first win 100.0%, median 8.49s; guardian ch3 first win 0.0%, median not reached (missing attempts); guardian ch4 first win 0.0%, median not reached (missing attempts); guardian ch5 first win 0.0%, median not reached (missing attempts); rogue ch1 first win 0.0%, median 22.50s; rogue ch2 first win 100.0%, median 7.93s; rogue ch3 first win 0.0%, median not reached (missing attempts); rogue ch4 first win 0.0%, median not reached (missing attempts); rogue ch5 first win 0.0%, median not reached (missing attempts); hunter ch1 first win 0.0%, median 24.00s; hunter ch2 first win 100.0%, median 8.49s; hunter ch3 first win 0.0%, median not reached (missing attempts); hunter ch4 first win 0.0%, median not reached (missing attempts); hunter ch5 first win 0.0%, median not reached (missing attempts); archer ch1 first win 0.0%, median 22.50s; archer ch2 first win 100.0%, median 8.51s; archer ch3 first win 0.0%, median not reached (missing attempts); archer ch4 first win 0.0%, median not reached (missing attempts); archer ch5 first win 0.0%, median not reached (missing attempts); witch ch1 first win 0.0%, median 22.50s; witch ch2 first win 100.0%, median 9.85s; witch ch3 first win 0.0%, median not reached (missing attempts); witch ch4 first win 0.0%, median not reached (missing attempts); witch ch5 first win 0.0%, median not reached (missing attempts); alchemist ch1 first win 0.0%, median 24.00s; alchemist ch2 first win 100.0%, median 9.93s; alchemist ch3 first win 0.0%, median not reached (missing attempts); alchemist ch4 first win 0.0%, median not reached (missing attempts); alchemist ch5 first win 0.0%, median not reached (missing attempts) | warrior ch1 first win 0.0%, median 83.24s; warrior ch2 first win 100.0%, median 81.18s; warrior ch3 first win 100.0%, median 74.72s; warrior ch4 first win 100.0%, median 14.00s; warrior ch5 first win 100.0%, median 25.56s; guardian ch1 first win 25.0%, median 117.98s; guardian ch2 first win 100.0%, median 94.19s; guardian ch3 first win 100.0%, median 83.03s; guardian ch4 first win 100.0%, median 14.96s; guardian ch5 first win 100.0%, median 27.64s; rogue ch1 first win 0.0%, median 76.71s; rogue ch2 first win 100.0%, median 76.74s; rogue ch3 first win 100.0%, median 71.39s; rogue ch4 first win 100.0%, median 13.67s; rogue ch5 first win 100.0%, median 25.38s; hunter ch1 first win 0.0%, median 79.50s; hunter ch2 first win 100.0%, median 85.49s; hunter ch3 first win 100.0%, median 82.20s; hunter ch4 first win 100.0%, median 14.19s; hunter ch5 first win 100.0%, median 26.68s; archer ch1 first win 0.0%, median 73.43s; archer ch2 first win 95.0%, median 79.45s; archer ch3 first win 100.0%, median 72.14s; archer ch4 first win 100.0%, median 15.01s; archer ch5 first win 100.0%, median 27.51s; witch ch1 first win 0.0%, median 72.00s; witch ch2 first win 90.0%, median 80.19s; witch ch3 first win 100.0%, median 76.93s; witch ch4 first win 100.0%, median 14.01s; witch ch5 first win 100.0%, median 24.84s; alchemist ch1 first win 0.0%, median 82.82s; alchemist ch2 first win 100.0%, median 84.43s; alchemist ch3 first win 100.0%, median 78.61s; alchemist ch4 first win 100.0%, median 15.25s; alchemist ch5 first win 100.0%, median 27.40s | NO |
| guardrails | Each proposed numeric leaf 0.33–3x current; walk ≤2000ms; boss ≤180s; daily keys ≤3 | All numeric leaves within 0.33–3x; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 | All numeric leaves within 0.33–3x; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3 | yes |

## Proposed changes

| path | current | proposed | why |
| --- | --- | --- | --- |
| cat.baseAtk | 10 | 14 | Use 14 starting ATK to move first-boss medians toward 10–15 minutes without making normal kills instantaneous. |
| cat.baseHp | 100 | 300 | Cap starting HP at three times current health, retaining meaningful early boss losses and class HP/DEF differences. |
| cat.baseDef | 5 | 5 | Keep the current base DEF of 5; class defensive multipliers remain content-defined. |
| cat.levelGrowth | 0.06 | 0.06 | Retain current 6% stat growth rather than the old 0.8% proposal so levels materially improve combat strength. |
| monster.hpBase | 30 | 90 | Use three times starting monster HP so attacking matters more than walking at the measured probes. |
| monster.hpGrowth | 1.13 | 1.06 | Use 6% stage HP growth to keep later monsters manageable within the three-minute boss cap; chapter growth still fails. |
| monster.atkBase | 4 | 8 | Double initial monster damage to retain survival pressure alongside the bounded HP increase. |
| monster.atkGrowth | 1.12 | 1.06 | Use 6% stage damage growth to avoid late survival walls; first-attempt success still needs content tuning. |
| monster.xpBase | 6 | 18 | Triple initial XP per monster to make level progression meaningful before the first boss and reduce early farming waits. |
| idle.dailyKeys | 1 | 3 | Grant three daily keys, the allowed maximum; the remaining key budget gap is explicitly reported. |
| idle.walkTimeMs | 1000 | 1000 | Keep current one-second walking instead of six seconds; measured combat retains the larger share of each probe. |
| idle.clearedChapterKeyChance | 0.006666666666666667 | 0.02 | Triple key-drop chance when farming cleared content; the frontier policy cannot rely on these drops while waiting at a boss. |
| boss.maxMs | 60000 | 180000 | Bound every boss attempt to three minutes instead of the old twenty-minute proposal. |
| boss.attackIntervalMs | 1500 | 4500 | Allow 4.5 seconds between normal boss attacks to keep bounded player HP viable; first-attempt rate failures remain visible. |
| boss.bigEveryMs | 6000 | 6000 | Keep the current six-second big-attack cadence so telegraphed attacks remain part of combat. |
| boss.bigMultiplier | 2.5 | 1.5 | Reduce big-hit damage to 1.5 times normal damage while retaining early survival losses. |

## Per-class times (proposed, stepMinutes 2)

Cumulative active minutes. Chapter cells: p25 / median / p75. Level columns: median.

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 11.5 / 12 / 12 | 18 / 20 / 20 | 26 / 26 / 28 | 1442 / 1442 / 1442 | 1446 / 1446 / 1446 | 10 | 26 |
| guardian | 9.5 / 10 / 10 | 17.5 / 18 / 18 | 24 / 26 / 26 | 1442 / 1442 / 1442 | 1446 / 1446 / 1446 | 10 | 24 |
| rogue | 11.5 / 12 / 12 | 18 / 18 / 20 | 24 / 26 / 26 | 1442 / 1442 / 1442 | 1446 / 1446 / 1446 | 10 | 24 |
| hunter | 12 / 12 / 12 | 18 / 20 / 20 | 26 / 26 / 26 | 1442 / 1442 / 1442 | 1446 / 1446 / 1446 | 10 | 26 |
| archer | 12 / 14 / 14 | 20 / 22 / 22 | 28 / 30 / 30 | 1442 / 1442 / 1442 | 1446 / 1446 / 1446 | 10 | 27 |
| witch | 13.5 / 14 / 14.5 | 22 / 22 / 22.5 | 30 / 30 / 30 | 1442 / 1442 / 1442 | 1446 / 1446 / 1446 | 10 | 28 |
| alchemist | 12 / 12 / 14 | 20 / 20 / 22 | 28 / 28 / 30 | 1442 / 1442 / 1442 | 1446 / 1446 / 1446 | 10 | 26 |

## StepMinutes 1 diagnostic (proposed, seeds 1–5)

Cumulative boss-win medians in active minutes; no seed is omitted for a missing win.

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 11 | 18 | 25 | 1441 | 1444 | 9 | 24 |
| guardian | 8 | 16 | 23 | 1441 | 1444 | 9 | 23 |
| rogue | 11 | 18 | 24 | 1441 | 1444 | 9 | 23 |
| hunter | 11 | 18 | 25 | 1441 | 1444 | 9 | 24 |
| archer | 12 | 19 | 26 | 1441 | 1445 | 9 | 25 |
| witch | 13 | 21 | 28 | 1441 | 1445 | 10 | 26 |
| alchemist | 12 | 19 | 26 | 1441 | 1445 | 9 | 25 |

Matched two-minute run restricted to seeds 1–5, so seed cohort changes can be separated from step-size effects:

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 12 | 18 | 26 | 1442 | 1446 | 10 | 24 |
| guardian | 10 | 18 | 26 | 1442 | 1446 | 10 | 24 |
| rogue | 12 | 18 | 26 | 1442 | 1446 | 10 | 24 |
| hunter | 12 | 18 | 26 | 1442 | 1446 | 10 | 26 |
| archer | 12 | 20 | 28 | 1442 | 1446 | 10 | 26 |
| witch | 12 | 20 | 28 | 1442 | 1446 | 10 | 28 |
| alchemist | 12 | 20 | 28 | 1442 | 1446 | 10 | 26 |

## Per-class times (current, stepMinutes 2)

| class | ch1 | ch2 | ch3 | ch4 | ch5 | level 20 | level 40 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| warrior | 35.5 / 38 / 44 | 1442 / 1442 / 1442 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16 | 68 |
| guardian | 26 / 28 / 30 | 1442 / 1442 / 1442 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16 | 70 |
| rogue | 32 / 38 / 40 | 1442 / 1442 / 1442 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16 | 66 |
| hunter | 38 / 40 / 44.5 | 1442 / 1442 / 1442 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16 | 70 |
| archer | 43.5 / 47 / 52 | 1442 / 1442 / 1442 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 16 | 76 |
| witch | 42 / 49 / 54 | 1442 / 1442 / 1442 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 18 | 78 |
| alchemist | 44 / 47 / 50.5 | 1442 / 1442 / 1442 | not reached / not reached / not reached | not reached / not reached / not reached | not reached / not reached / not reached | 18 | 78 |

## Boss fights and losses (proposed)

Totals across seeds; median duration includes wins and losses. First attempt means the first actual boss fight in each run, never the first winning attempt. Missing attempts fail boss-check.

| class | chapter | fights | losses | first-attempt wins / seeds | median fight seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
| warrior | 1 | 59 | 39 | 0 / 20 | 83.24 |
| warrior | 2 | 20 | 0 | 20 / 20 | 81.18 |
| warrior | 3 | 20 | 0 | 20 / 20 | 74.72 |
| warrior | 4 | 20 | 0 | 20 / 20 | 14 |
| warrior | 5 | 20 | 0 | 20 / 20 | 25.56 |
| guardian | 1 | 35 | 15 | 5 / 20 | 117.98 |
| guardian | 2 | 20 | 0 | 20 / 20 | 94.19 |
| guardian | 3 | 20 | 0 | 20 / 20 | 83.03 |
| guardian | 4 | 20 | 0 | 20 / 20 | 14.96 |
| guardian | 5 | 20 | 0 | 20 / 20 | 27.64 |
| rogue | 1 | 56 | 36 | 0 / 20 | 76.71 |
| rogue | 2 | 20 | 0 | 20 / 20 | 76.74 |
| rogue | 3 | 20 | 0 | 20 / 20 | 71.39 |
| rogue | 4 | 20 | 0 | 20 / 20 | 13.67 |
| rogue | 5 | 20 | 0 | 20 / 20 | 25.38 |
| hunter | 1 | 65 | 45 | 0 / 20 | 79.5 |
| hunter | 2 | 20 | 0 | 20 / 20 | 85.49 |
| hunter | 3 | 20 | 0 | 20 / 20 | 82.2 |
| hunter | 4 | 20 | 0 | 20 / 20 | 14.19 |
| hunter | 5 | 20 | 0 | 20 / 20 | 26.68 |
| archer | 1 | 71 | 51 | 0 / 20 | 73.43 |
| archer | 2 | 21 | 1 | 19 / 20 | 79.45 |
| archer | 3 | 20 | 0 | 20 / 20 | 72.14 |
| archer | 4 | 20 | 0 | 20 / 20 | 15.01 |
| archer | 5 | 20 | 0 | 20 / 20 | 27.51 |
| witch | 1 | 80 | 60 | 0 / 20 | 72 |
| witch | 2 | 22 | 2 | 18 / 20 | 80.19 |
| witch | 3 | 20 | 0 | 20 / 20 | 76.93 |
| witch | 4 | 20 | 0 | 20 / 20 | 14.01 |
| witch | 5 | 20 | 0 | 20 / 20 | 24.84 |
| alchemist | 1 | 66 | 46 | 0 / 20 | 82.82 |
| alchemist | 2 | 20 | 0 | 20 / 20 | 84.43 |
| alchemist | 3 | 20 | 0 | 20 / 20 | 78.61 |
| alchemist | 4 | 20 | 0 | 20 / 20 | 15.25 |
| alchemist | 5 | 20 | 0 | 20 / 20 | 27.4 |

## Median monster time-to-kill (proposed)

Each probe uses the equal-weight median of that round's three regular archetypes and elite. Levels are medians of observed entry levels. Entry within a claim is recovered by replaying the pure claim with a binary search (16 iterations), using that claim's existing equipment; no extra rewards are applied. Walk-share evaluates every seed's entry equipment at the class's median entry level (floored as in deriveStats), then computes walkTimeMs / (walkTimeMs + median time-to-kill). Level profiles are captured under the run's active overrides, so aggregation cannot accidentally use production numbers. Missing probes fail.

| class | ch1 r1 | ch3 r1 | ch3 r5 | ch5 r1 |
| --- | ---: | ---: | ---: | ---: |
| warrior | 3740 ms (L1) | 2350.52 ms (L34) | 2386.95 ms (L37) | 240 ms (L60) |
| guardian | 4720 ms (L1) | 3061.21 ms (L32) | 2917.3 ms (L35) | 520 ms (L60) |
| rogue | 4700 ms (L1) | 2137.93 ms (L33) | 2226.04 ms (L36) | 515.34 ms (L60) |
| hunter | 4150 ms (L1) | 2290.79 ms (L34) | 2270.36 ms (L37) | 300 ms (L60) |
| archer | 4550 ms (L1) | 2526.4 ms (L34) | 2515.09 ms (L37) | 745.27 ms (L60) |
| witch | 4850 ms (L1) | 2291.83 ms (L34) | 2280.63 ms (L37) | 850 ms (L60) |
| alchemist | 4610 ms (L1) | 2976.4 ms (L33) | 2938.95 ms (L36) | 710 ms (L60) |

## How classes differ

Ch1: fastest guardian (10m), slowest archer, witch (14m); Ch2: fastest guardian, rogue (18m), slowest archer, witch (22m); Ch3: fastest warrior, guardian, rogue, hunter (26m), slowest archer, witch (30m); Ch4: fastest warrior, guardian, rogue, hunter, archer, witch, alchemist (1442m), slowest warrior, guardian, rogue, hunter, archer, witch, alchemist (1442m); Ch5: fastest warrior, guardian, rogue, hunter, archer, witch, alchemist (1446m), slowest warrior, guardian, rogue, hunter, archer, witch, alchemist (1446m). Boss losses, most first: witch 62, archer 52, alchemist 46, hunter 45, warrior 39, rogue 36, guardian 15. These observations retain the content-defined attack intervals, passives, HP, DEF and dodge differences; timing spread alone does not validate combat feel.

## Content changes suggested

Investigate chapter-specific boss HP/ATK archetypes instead of one 40x HP / 2.5x ATK multiplier for all chapters: lower late boss HP where fights time out, and tune early boss ATK per chapter to put first-attempt success inside 40–90%. Guardian bonk and 1.3x HP/DEF need a separate balance pass against fragile classes; adjust its HP/DEF multipliers only if measured first-attempt rates stay above 90% while other classes fail. Increase killsPerRound in chapters that clear too quickly instead of adding walking time; tune each chapter separately to recover 1.3–2x growth. Add one CatKey to each chapter 2 and chapter 3 first-clear chest in a separately approved content task: three daily keys plus those two rewards cover five first wins without raising dailyKeys above three. That closes the key budget gap, while timing, class spread and boss success still require revalidation. The current policy only earns cleared-chapter key drops when a gate sends it backward; it does not proactively farm earlier chapters or repeat bosses. These are unvalidated directions, not a claim that any specific content edit closes every gap. Re-run both step sizes and all seeds after a separately authorized content change.

## Not overridable

- MATERIALS.*.maxStack (STACK_CAPS_V2 and CAT_KEY_CAP)
- CHEST_SCALING.* (CHESTS)
- content registries (combat/bag/idle lookup maps)

## How to apply

Only after a passing review and explicit sign-off, copy these exact leaves into v2/config.ts:

- cat.baseAtk: 10 → 14
- cat.baseHp: 100 → 300
- cat.baseDef: 5 → 5
- cat.levelGrowth: 0.06 → 0.06
- monster.hpBase: 30 → 90
- monster.hpGrowth: 1.13 → 1.06
- monster.atkBase: 4 → 8
- monster.atkGrowth: 1.12 → 1.06
- monster.xpBase: 6 → 18
- idle.dailyKeys: 1 → 3
- idle.walkTimeMs: 1000 → 1000
- idle.clearedChapterKeyChance: 0.006666666666666667 → 0.02
- boss.maxMs: 60000 → 180000
- boss.attackIntervalMs: 1500 → 4500
- boss.bigEveryMs: 6000 → 6000
- boss.bigMultiplier: 2.5 → 1.5

## Method and limits

Claims use computeClaimV2 with offline=false. Both one- and two-minute steps fit within the inherited five-minute online window, so combat time is fully credited. Boss replay duration is recorded but is not added to active claim minutes. Retries happen at the next eligible step after the loss cooldown. Dates advance every 1,440 simulated minutes; keys are granted on the next claim. Equipment and crafting decisions still happen at claim boundaries, so step-size sensitivity includes different loot and craft decisions as well as timestamp rounding. A finite search cannot prove no config-only solution exists.

Chest rolls use rollLoot(CHESTS, first-clear/repeat table), with the idle gear rules for unlocked slot, smart weapon, chapter catalog, stage level, bonus lines and chest group. Craft/salvage weights: Fish 1, Yarn 10, Fluff Tuft 100, Shiny Button 200, Catnip Crystal 300, Starlight Scale 400. Every recipe must return less weighted salvage than it costs.

## Sign-off

User: ____ (approved / changes)

## Full command transcripts

All requested validation output is retained below, including the complete local suite. The temporary PATH shim invokes `corepack pnpm` (10.28.0); no project file was changed to select the tool version. Initial installation and early exploratory failures are retained for transparency.

### `pnpm install --frozen-lockfile (initial host pnpm 11 attempt)`

```text
$ pnpm install --frozen-lockfile (initial host pnpm 11 attempt)
Scope: all 7 workspace projects
[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY] Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true", or set "confirmModulesPurge" to "false".
```

### `CI=true pnpm install --frozen-lockfile (host pnpm 11 retry)`

```text
$ CI=true pnpm install --frozen-lockfile (host pnpm 11 retry)
Scope: all 7 workspace projects
Recreating /workspace/taskbar-hero/node_modules
? Verifying lockfile against supply-chain policies (520 entries)...
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +504
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 504, reused 0, downloaded 0, added 0
Progress: resolved 504, reused 0, downloaded 21, added 6
Progress: resolved 504, reused 0, downloaded 28, added 8
Progress: resolved 504, reused 0, downloaded 68, added 12
Progress: resolved 504, reused 0, downloaded 93, added 16
Progress: resolved 504, reused 0, downloaded 165, added 29
Progress: resolved 504, reused 0, downloaded 229, added 87
Progress: resolved 504, reused 0, downloaded 292, added 165
Progress: resolved 504, reused 0, downloaded 405, added 316
✓ Lockfile passes supply-chain policies (520 entries in 9.5s)
Progress: resolved 504, reused 0, downloaded 495, added 504, done

[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

### `pnpm install --frozen-lockfile (host pnpm 11 retry)`

```text
$ pnpm install --frozen-lockfile (host pnpm 11 retry)
Scope: all 7 workspace projects
✓ Lockfile passes supply-chain policies (verified 25s ago)
Lockfile is up to date, resolution step is skipped
Already up to date

   ╭──────────────────────────────────────────────────────────────────────╮
   │                                                                      │
   │                 Update available! 11.25.0 → 12.15.0.                 │
   │                 Changelog: https://pnpm.io/v/12.15.0                 │
   │   To update, run: curl -fsSL https://get.pnpm.io/install.sh | sh -   │
   │                                                                      │
   ╰──────────────────────────────────────────────────────────────────────╯


[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

### `pnpm install --frozen-lockfile (pinned pnpm; initial non-TTY attempt)`

```text
$ pnpm install --frozen-lockfile (pinned pnpm; initial non-TTY attempt)
Scope: all 7 workspace projects
 ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY  Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true".
```

### `CI=true pnpm install --frozen-lockfile (pinned pnpm)`

```text
$ CI=true pnpm install --frozen-lockfile (pinned pnpm)
Scope: all 7 workspace projects
Recreating /workspace/taskbar-hero/node_modules
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +506
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 506, reused 0, downloaded 16, added 5
Progress: resolved 506, reused 0, downloaded 19, added 7
Progress: resolved 506, reused 0, downloaded 28, added 9
Progress: resolved 506, reused 0, downloaded 57, added 25
Progress: resolved 506, reused 0, downloaded 134, added 131
Progress: resolved 506, reused 0, downloaded 192, added 184
Progress: resolved 506, reused 0, downloaded 268, added 277
Progress: resolved 506, reused 0, downloaded 317, added 312
Progress: resolved 506, reused 0, downloaded 377, added 383
Progress: resolved 506, reused 0, downloaded 412, added 399
Progress: resolved 506, reused 0, downloaded 451, added 460
Progress: resolved 506, reused 0, downloaded 480, added 474
Progress: resolved 506, reused 0, downloaded 497, added 506, done

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 14.6s using pnpm v10.28.0
```

### `pnpm install --frozen-lockfile (final pinned verification)`

```text
$ pnpm install --frozen-lockfile (final pinned verification)
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
Done in 1.3s using pnpm v10.28.0
```

### `V2_SIM_SEARCH=1 V2_SIM_SEARCH_OUTPUT=/tmp/v6c/search.json pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/search.test.ts`

```text
$ V2_SIM_SEARCH=1 V2_SIM_SEARCH_OUTPUT=/tmp/v6c/search.json pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/search.test.ts

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

Searched 9/243 in 17.2s
Searched 18/243 in 30.4s
Searched 27/243 in 41.5s
Searched 36/243 in 59.9s
Searched 45/243 in 76.5s
Searched 54/243 in 90.4s
Searched 63/243 in 110.2s
Searched 72/243 in 128.3s
Searched 81/243 in 144.5s
Best bounded candidate: {"overrides":{"cat":{"baseAtk":22,"baseHp":300,"levelGrowth":0.06},"monster":{"hpBase":45,"hpGrowth":1.13,"atkGrowth":1.06},"idle":{"dailyKeys":3,"walkTimeMs":330},"boss":{"maxMs":180000}},"score":439,"checks":[{"id":"first-boss","ok":false,"detail":"warrior 12m; guardian 6m; rogue 10m; hunter 10m; archer 10m; witch 14m; alchemist 12m"},{"id":"chapter-growth","ok":false,"detail":"warrior ch2 1.17x; warrior ch3 3.14x; warrior ch4 not reached; warrior ch5 not reached; guardian ch2 1.67x; guardian ch3 4.40x; guardian ch4 not reached; guardian ch5 not reached; rogue ch2 2.00x; rogue ch3 0.90x; rogue ch4 not reached; rogue ch5 not reached; hunter ch2 2.00x; hunter ch3 1.90x; hunter ch4 not reached; hunter ch5 not reached; archer ch2 1.80x; archer ch3 1.78x; archer ch4 not reached; archer ch5 not reached; witch ch2 1.29x; witch ch3 2.00x; witch ch4 not reached; witch ch5 not reached; alchemist ch2 1.50x; alchemist ch3 1.33x; alchemist ch4 not reached; alchemist ch5 not reached"},{"id":"class-spread","ok":false,"detail":"ch1 range 80.0%; ch2 range 53.3%; ch3 range 36.7%; ch4 range not reached; ch5 range not reached; warrior ch1 20.0%; guardian ch1 -40.0%; rogue ch1 0.0%; hunter ch1 0.0%; archer ch1 0.0%; witch ch1 40.0%; alchemist ch1 20.0%; warrior ch2 -13.3%; guardian ch2 -46.7%; rogue ch2 0.0%; hunter ch2 0.0%; archer ch2 -6.7%; witch ch2 6.7%; alchemist ch2 0.0%; warrior ch3 16.7%; guardian ch3 0.0%; rogue ch3 -20.0%; hunter ch3 13.3%; archer ch3 0.0%; witch ch3 13.3%; alchemist ch3 -10.0%; warrior ch4 not reached; guardian ch4 not reached; rogue ch4 not reached; hunter ch4 not reached; archer ch4 not reached; witch ch4 not reached; alchemist ch4 not reached; warrior ch5 not reached; guardian ch5 not reached; rogue ch5 not reached; hunter ch5 not reached; archer ch5 not reached; witch ch5 not reached; alchemist ch5 not reached"},{"id":"chapter-bounds","ok":false,"detail":"warrior ch1 12m; warrior ch2 14m; warrior ch3 44m; warrior ch4 not reached; warrior ch5 not reached; guardian ch1 6m; guardian ch2 10m; guardian ch3 44m; guardian ch4 not reached; guardian ch5 not reached; rogue ch1 10m; rogue ch2 20m; rogue ch3 18m; rogue ch4 not reached; rogue ch5 not reached; hunter ch1 10m; hunter ch2 20m; hunter ch3 38m; hunter ch4 not reached; hunter ch5 not reached; archer ch1 10m; archer ch2 18m; archer ch3 32m; archer ch4 not reached; archer ch5 not reached; witch ch1 14m; witch ch2 18m; witch ch3 36m; witch ch4 not reached; witch ch5 not reached; alchemist ch1 12m; alchemist ch2 18m; alchemist ch3 24m; alchemist ch4 not reached; alchemist ch5 not reached"},{"id":"never-stuck","ok":true,"detail":"0/7 runs stuck"},{"id":"craft-salvage-loss","ok":true,"detail":"rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600"},{"id":"walk-share","ok":true,"detail":"warrior ch1 r1 L1.0: 21.0%; warrior ch3 r5 L33.0: 7.5%; guardian ch1 r1 L1.0: 14.7%; guardian ch3 r5 L26.0: 4.5%; rogue ch1 r1 L1.0: 18.0%; rogue ch3 r5 L34.0: 8.9%; hunter ch1 r1 L1.0: 19.1%; hunter ch3 r5 L34.0: 8.6%; archer ch1 r1 L1.0: 19.1%; archer ch3 r5 L32.0: 6.6%; witch ch1 r1 L1.0: 16.7%; witch ch3 r5 L34.0: 7.7%; alchemist ch1 r1 L1.0: 14.1%; alchemist ch3 r5 L33.0: 6.9%"},{"id":"boss-check","ok":false,"detail":"warrior ch1 first win 0.0%, median 54.00s; warrior ch2 first win 0.0%, median 75.00s; warrior ch3 first win 0.0%, median 129.00s; warrior ch4 first win 0.0%, median not reached (missing attempts); warrior ch5 first win 0.0%, median not reached (missing attempts); guardian ch1 first win 0.0%, median 82.61s; guardian ch2 first win 0.0%, median 164.45s; guardian ch3 first win 0.0%, median 138.00s; guardian ch4 first win 0.0%, median not reached (missing attempts); guardian ch5 first win 0.0%, median not reached (missing attempts); rogue ch1 first win 0.0%, median 56.25s; rogue ch2 first win 0.0%, median 75.00s; rogue ch3 first win 0.0%, median 120.75s; rogue ch4 first win 0.0%, median not reached (missing attempts); rogue ch5 first win 0.0%, median not reached (missing attempts); hunter ch1 first win 0.0%, median 59.14s; hunter ch2 first win 0.0%, median 78.00s; hunter ch3 first win 0.0%, median 105.00s; hunter ch4 first win 0.0%, median not reached (missing attempts); hunter ch5 first win 0.0%, median not reached (missing attempts); archer ch1 first win 0.0%, median 45.00s; archer ch2 first win 0.0%, median 90.00s; archer ch3 first win 0.0%, median 114.00s; archer ch4 first win 0.0%, median not reached (missing attempts); archer ch5 first win 0.0%, median not reached (missing attempts); witch ch1 first win 0.0%, median 45.00s; witch ch2 first win 0.0%, median 66.00s; witch ch3 first win 0.0%, median 90.75s; witch ch4 first win 0.0%, median not reached (missing attempts); witch ch5 first win 0.0%, median not reached (missing attempts); alchemist ch1 first win 0.0%, median 48.00s; alchemist ch2 first win 0.0%, median 88.21s; alchemist ch3 first win 0.0%, median 129.00s; alchemist ch4 first win 0.0%, median not reached (missing attempts); alchemist ch5 first win 0.0%, median not reached (missing attempts)"},{"id":"guardrails","ok":true,"detail":"All numeric leaves within 0.33–3x; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3"}]}
Search runtime 144.509s

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  03:32:09
   Duration  144.76s (tests 100%)

```

### `V2_SIM_SEARCH=1 V2_SIM_REFINE_INPUT=/tmp/v6c/search.json V2_SIM_SEARCH_OUTPUT=/tmp/v6c/refined.json pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/search.test.ts`

```text
$ V2_SIM_SEARCH=1 V2_SIM_REFINE_INPUT=/tmp/v6c/search.json V2_SIM_SEARCH_OUTPUT=/tmp/v6c/refined.json pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/search.test.ts

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

Refined 1/8 in 43.1s
Refined 2/8 in 97.9s
Refined 3/8 in 152.7s
Refined 4/8 in 194.5s
Refined 5/8 in 239.1s
Refined 6/8 in 296.2s
Refined 7/8 in 335.9s
Refined 8/8 in 391.9s
Best bounded candidate: {"overrides":{"cat":{"baseAtk":14,"baseHp":300,"levelGrowth":0.06},"monster":{"hpBase":45,"hpGrowth":1.1,"atkGrowth":1.06},"idle":{"dailyKeys":3,"walkTimeMs":330},"boss":{"maxMs":180000}},"score":4141,"checks":[{"id":"first-boss","ok":false,"detail":"warrior 10m; guardian 12m; rogue 12m; hunter 10m; archer 16m; witch 18m; alchemist 16m"},{"id":"chapter-growth","ok":false,"detail":"warrior ch2 1.20x; warrior ch3 1.33x; warrior ch4 87.63x; warrior ch5 0.00x; guardian ch2 0.67x; guardian ch3 1.25x; guardian ch4 141.40x; guardian ch5 0.00x; rogue ch2 0.83x; rogue ch3 0.80x; rogue ch4 176.25x; rogue ch5 0.00x; hunter ch2 1.40x; hunter ch3 1.14x; hunter ch4 87.63x; hunter ch5 0.00x; archer ch2 0.50x; archer ch3 2.00x; archer ch4 87.63x; archer ch5 0.00x; witch ch2 0.67x; witch ch3 1.17x; witch ch4 99.86x; witch ch5 0.00x; alchemist ch2 0.88x; alchemist ch3 0.86x; alchemist ch4 116.83x; alchemist ch5 0.00x"},{"id":"class-spread","ok":false,"detail":"ch1 range 66.7%; ch2 range 41.7%; ch3 range 40.0%; ch4 range 0.0%; ch5 range 0.1%; warrior ch1 -16.7%; guardian ch1 0.0%; rogue ch1 0.0%; hunter ch1 -16.7%; archer ch1 33.3%; witch ch1 50.0%; alchemist ch1 33.3%; warrior ch2 0.0%; guardian ch2 -25.0%; rogue ch2 -16.7%; hunter ch2 0.0%; archer ch2 0.0%; witch ch2 16.7%; alchemist ch2 16.7%; warrior ch3 0.0%; guardian ch3 -30.0%; rogue ch3 -20.0%; hunter ch3 0.0%; archer ch3 0.0%; witch ch3 10.0%; alchemist ch3 0.0%; warrior ch4 0.0%; guardian ch4 0.0%; rogue ch4 0.0%; hunter ch4 0.0%; archer ch4 0.0%; witch ch4 0.0%; alchemist ch4 0.0%; warrior ch5 -0.1%; guardian ch5 0.0%; rogue ch5 0.0%; hunter ch5 -0.1%; archer ch5 -0.1%; witch ch5 0.0%; alchemist ch5 0.0%"},{"id":"chapter-bounds","ok":false,"detail":"warrior ch1 10m; warrior ch2 12m; warrior ch3 16m; warrior ch4 1402m; warrior ch5 4m; guardian ch1 12m; guardian ch2 8m; guardian ch3 10m; guardian ch4 1414m; guardian ch5 6m; rogue ch1 12m; rogue ch2 10m; rogue ch3 8m; rogue ch4 1410m; rogue ch5 6m; hunter ch1 10m; hunter ch2 14m; hunter ch3 16m; hunter ch4 1402m; hunter ch5 4m; archer ch1 16m; archer ch2 8m; archer ch3 16m; archer ch4 1402m; archer ch5 4m; witch ch1 18m; witch ch2 12m; witch ch3 14m; witch ch4 1398m; witch ch5 6m; alchemist ch1 16m; alchemist ch2 14m; alchemist ch3 12m; alchemist ch4 1402m; alchemist ch5 6m"},{"id":"never-stuck","ok":true,"detail":"0/21 runs stuck"},{"id":"craft-salvage-loss","ok":true,"detail":"rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600"},{"id":"walk-share","ok":true,"detail":"warrior ch1 r1 L1.0: 15.9%; warrior ch3 r5 L31.0: 9.3%; guardian ch1 r1 L1.0: 14.7%; guardian ch3 r5 L28.0: 6.8%; rogue ch1 r1 L1.0: 12.5%; rogue ch3 r5 L29.0: 8.0%; hunter ch1 r1 L1.0: 14.5%; hunter ch3 r5 L31.0: 8.6%; archer ch1 r1 L1.0: 12.5%; archer ch3 r5 L30.0: 7.3%; witch ch1 r1 L1.0: 11.9%; witch ch3 r5 L32.0: 7.9%; alchemist ch1 r1 L1.0: 14.1%; alchemist ch3 r5 L32.0: 8.8%"},{"id":"boss-check","ok":false,"detail":"warrior ch1 first win 0.0%, median 60.00s; warrior ch2 first win 0.0%, median 90.00s; warrior ch3 first win 33.3%, median 114.00s; warrior ch4 first win 100.0%, median 30.24s; warrior ch5 first win 100.0%, median 80.96s; guardian ch1 first win 0.0%, median 74.47s; guardian ch2 first win 33.3%, median 117.85s; guardian ch3 first win 66.7%, median 179.85s; guardian ch4 first win 100.0%, median 29.33s; guardian ch5 first win 100.0%, median 79.94s; rogue ch1 first win 0.0%, median 54.00s; rogue ch2 first win 33.3%, median 72.00s; rogue ch3 first win 66.7%, median 113.58s; rogue ch4 first win 100.0%, median 28.19s; rogue ch5 first win 100.0%, median 77.75s; hunter ch1 first win 0.0%, median 52.50s; hunter ch2 first win 0.0%, median 84.00s; hunter ch3 first win 0.0%, median 94.50s; hunter ch4 first win 100.0%, median 32.42s; hunter ch5 first win 100.0%, median 87.48s; archer ch1 first win 0.0%, median 48.00s; archer ch2 first win 33.3%, median 81.61s; archer ch3 first win 0.0%, median 90.00s; archer ch4 first win 100.0%, median 31.16s; archer ch5 first win 100.0%, median 77.51s; witch ch1 first win 0.0%, median 48.00s; witch ch2 first win 0.0%, median 73.08s; witch ch3 first win 0.0%, median 84.00s; witch ch4 first win 100.0%, median 32.90s; witch ch5 first win 100.0%, median 88.91s; alchemist ch1 first win 0.0%, median 57.00s; alchemist ch2 first win 0.0%, median 78.00s; alchemist ch3 first win 33.3%, median 100.50s; alchemist ch4 first win 100.0%, median 32.11s; alchemist ch5 first win 100.0%, median 84.65s"},{"id":"guardrails","ok":true,"detail":"All numeric leaves within 0.33–3x; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3"}]}
Search runtime 391.931s

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  03:35:31
   Duration  392.16s (tests 100%)

```

### `V2_SIM_SEARCH=1 V2_SIM_EXPLORE=1 pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/search.test.ts (initial exploration rejected a floating-point boundary value; changed candidate 0.825 to 0.83)`

```text
$ V2_SIM_SEARCH=1 V2_SIM_EXPLORE=1 pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/search.test.ts (initial exploration rejected a floating-point boundary value; changed candidate 0.825 to 0.83)

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

 ❯ src/v2/sim/search.test.ts (1 test | 1 failed) 2996ms
   × searches bounded config candidates without changing production 2995ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/v2/sim/search.test.ts > searches bounded config candidates without changing production
Error: exploration escaped guardrails
 ❯ src/v2/sim/search.test.ts:26:51
     24|         boss: { maxMs: 180000, attackIntervalMs: pick([1500, 3000, 450…
     25|       };
     26|       if (!guardrailsCheckV2(overrides).ok) throw new Error('explorati…
       |                                                   ^
     27|       const results = CLASS_IDS.map((classId) => simulateV2({ classId,…
     28|       const checks = checkTargetsV2(results, overrides);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  03:37:27
   Duration  3.26s (tests 96%, transform 3%, import 1%)

undefined
/workspace/taskbar-hero/packages/game-rules:
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: vitest run src/v2/sim/search.test.ts
```

### `V2_SIM_SEARCH=1 V2_SIM_EXPLORE=1 V2_SIM_SEARCH_OUTPUT=/tmp/v6c/explore.json pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/search.test.ts`

```text
$ V2_SIM_SEARCH=1 V2_SIM_EXPLORE=1 V2_SIM_SEARCH_OUTPUT=/tmp/v6c/explore.json pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/search.test.ts

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

Explored 8/96 in 15.9s
Explored 16/96 in 34.8s
Explored 24/96 in 51.4s
Explored 32/96 in 67.1s
Explored 40/96 in 79.2s
Explored 48/96 in 91.3s
Explored 56/96 in 106.9s
Explored 64/96 in 120.7s
Explored 72/96 in 134.9s
Explored 80/96 in 150.7s
Explored 88/96 in 165.6s
Explored 96/96 in 179.0s
Best bounded candidate: {"overrides":{"cat":{"baseAtk":14,"baseHp":100,"baseDef":5,"levelGrowth":0.08},"monster":{"hpBase":60,"hpGrowth":1.15,"atkBase":8,"atkGrowth":1.01,"xpBase":18},"idle":{"dailyKeys":3,"walkTimeMs":330,"clearedChapterKeyChance":0.02},"boss":{"maxMs":180000,"attackIntervalMs":1500,"bigEveryMs":12000,"bigMultiplier":0.83}},"score":542,"checks":[{"id":"first-boss","ok":true,"detail":"warrior 10m; guardian 10m; rogue 12m; hunter 12m; archer 14m; witch 14m; alchemist 14m"},{"id":"chapter-growth","ok":false,"detail":"warrior ch2 0.80x; warrior ch3 3.75x; warrior ch4 not reached; warrior ch5 not reached; guardian ch2 1.00x; guardian ch3 4.00x; guardian ch4 not reached; guardian ch5 not reached; rogue ch2 0.67x; rogue ch3 3.00x; rogue ch4 not reached; rogue ch5 not reached; hunter ch2 0.67x; hunter ch3 3.25x; hunter ch4 not reached; hunter ch5 not reached; archer ch2 0.57x; archer ch3 3.25x; archer ch4 not reached; archer ch5 not reached; witch ch2 0.71x; witch ch3 3.20x; witch ch4 not reached; witch ch5 not reached; alchemist ch2 0.71x; alchemist ch3 3.20x; alchemist ch4 not reached; alchemist ch5 not reached"},{"id":"class-spread","ok":false,"detail":"ch1 range 33.3%; ch2 range 30.0%; ch3 range 33.3%; ch4 range not reached; ch5 range not reached; warrior ch1 -16.7%; guardian ch1 -16.7%; rogue ch1 0.0%; hunter ch1 0.0%; archer ch1 16.7%; witch ch1 16.7%; alchemist ch1 16.7%; warrior ch2 -10.0%; guardian ch2 0.0%; rogue ch2 0.0%; hunter ch2 0.0%; archer ch2 10.0%; witch ch2 20.0%; alchemist ch2 20.0%; warrior ch3 0.0%; guardian ch3 25.0%; rogue ch3 -8.3%; hunter ch3 -4.2%; archer ch3 0.0%; witch ch3 16.7%; alchemist ch3 16.7%; warrior ch4 not reached; guardian ch4 not reached; rogue ch4 not reached; hunter ch4 not reached; archer ch4 not reached; witch ch4 not reached; alchemist ch4 not reached; warrior ch5 not reached; guardian ch5 not reached; rogue ch5 not reached; hunter ch5 not reached; archer ch5 not reached; witch ch5 not reached; alchemist ch5 not reached"},{"id":"chapter-bounds","ok":false,"detail":"warrior ch1 10m; warrior ch2 8m; warrior ch3 30m; warrior ch4 not reached; warrior ch5 not reached; guardian ch1 10m; guardian ch2 10m; guardian ch3 40m; guardian ch4 not reached; guardian ch5 not reached; rogue ch1 12m; rogue ch2 8m; rogue ch3 24m; rogue ch4 not reached; rogue ch5 not reached; hunter ch1 12m; hunter ch2 8m; hunter ch3 26m; hunter ch4 not reached; hunter ch5 not reached; archer ch1 14m; archer ch2 8m; archer ch3 26m; archer ch4 not reached; archer ch5 not reached; witch ch1 14m; witch ch2 10m; witch ch3 32m; witch ch4 not reached; witch ch5 not reached; alchemist ch1 14m; alchemist ch2 10m; alchemist ch3 32m; alchemist ch4 not reached; alchemist ch5 not reached"},{"id":"never-stuck","ok":true,"detail":"0/7 runs stuck"},{"id":"craft-salvage-loss","ok":true,"detail":"rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600"},{"id":"walk-share","ok":true,"detail":"warrior ch1 r1 L1.0: 10.7%; warrior ch3 r5 L36.0: 4.5%; guardian ch1 r1 L1.0: 9.0%; guardian ch3 r5 L36.0: 4.2%; rogue ch1 r1 L1.0: 9.6%; rogue ch3 r5 L37.0: 4.8%; hunter ch1 r1 L1.0: 9.8%; hunter ch3 r5 L37.0: 4.9%; archer ch1 r1 L1.0: 9.3%; archer ch3 r5 L38.0: 5.0%; witch ch1 r1 L1.0: 9.2%; witch ch3 r5 L38.0: 4.6%; alchemist ch1 r1 L1.0: 9.1%; alchemist ch3 r5 L39.0: 5.6%"},{"id":"boss-check","ok":false,"detail":"warrior ch1 first win 0.0%, median 48.00s; warrior ch2 first win 100.0%, median 164.79s; warrior ch3 first win 0.0%, median 180.00s; warrior ch4 first win 0.0%, median not reached (missing attempts); warrior ch5 first win 0.0%, median not reached (missing attempts); guardian ch1 first win 0.0%, median 69.50s; guardian ch2 first win 100.0%, median 179.06s; guardian ch3 first win 0.0%, median 180.00s; guardian ch4 first win 0.0%, median not reached (missing attempts); guardian ch5 first win 0.0%, median not reached (missing attempts); rogue ch1 first win 0.0%, median 49.50s; rogue ch2 first win 100.0%, median 133.50s; rogue ch3 first win 0.0%, median 180.00s; rogue ch4 first win 0.0%, median not reached (missing attempts); rogue ch5 first win 0.0%, median not reached (missing attempts); hunter ch1 first win 0.0%, median 56.55s; hunter ch2 first win 100.0%, median 140.97s; hunter ch3 first win 0.0%, median 180.00s; hunter ch4 first win 0.0%, median not reached (missing attempts); hunter ch5 first win 0.0%, median not reached (missing attempts); archer ch1 first win 0.0%, median 48.00s; archer ch2 first win 0.0%, median 123.05s; archer ch3 first win 0.0%, median 180.00s; archer ch4 first win 0.0%, median not reached (missing attempts); archer ch5 first win 0.0%, median not reached (missing attempts); witch ch1 first win 0.0%, median 46.50s; witch ch2 first win 0.0%, median 123.11s; witch ch3 first win 0.0%, median 180.00s; witch ch4 first win 0.0%, median not reached (missing attempts); witch ch5 first win 0.0%, median not reached (missing attempts); alchemist ch1 first win 0.0%, median 58.50s; alchemist ch2 first win 0.0%, median 136.64s; alchemist ch3 first win 0.0%, median 180.00s; alchemist ch4 first win 0.0%, median not reached (missing attempts); alchemist ch5 first win 0.0%, median not reached (missing attempts)"},{"id":"guardrails","ok":true,"detail":"All numeric leaves within 0.33–3x; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3"}]}
Search runtime 178.992s

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  03:37:47
   Duration  179.20s (tests 100%)

```

### `V2_SIM_SEARCH=1 V2_SIM_REFINE_INPUT=/tmp/v6c/explore.json V2_SIM_SEARCH_OUTPUT=/tmp/v6c/explore-refined.json pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/search.test.ts`

```text
$ V2_SIM_SEARCH=1 V2_SIM_REFINE_INPUT=/tmp/v6c/explore.json V2_SIM_SEARCH_OUTPUT=/tmp/v6c/explore-refined.json pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/search.test.ts

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

Refined 1/8 in 42.9s
Refined 2/8 in 76.3s
Refined 3/8 in 117.0s
Refined 4/8 in 152.1s
Refined 5/8 in 191.7s
Refined 6/8 in 229.3s
Refined 7/8 in 272.5s
Refined 8/8 in 310.4s
Best bounded candidate: {"overrides":{"cat":{"baseAtk":14,"baseHp":300,"baseDef":5,"levelGrowth":0.06},"monster":{"hpBase":90,"hpGrowth":1.06,"atkBase":8,"atkGrowth":1.06,"xpBase":18},"idle":{"dailyKeys":3,"walkTimeMs":1000,"clearedChapterKeyChance":0.02},"boss":{"maxMs":180000,"attackIntervalMs":4500,"bigEveryMs":6000,"bigMultiplier":1.5}},"score":5162,"checks":[{"id":"first-boss","ok":true,"detail":"warrior 12m; guardian 10m; rogue 12m; hunter 12m; archer 12m; witch 14m; alchemist 12m"},{"id":"chapter-growth","ok":false,"detail":"warrior ch2 0.67x; warrior ch3 1.00x; warrior ch4 177.00x; warrior ch5 0.00x; guardian ch2 0.80x; guardian ch3 1.00x; guardian ch4 177.00x; guardian ch5 0.00x; rogue ch2 0.67x; rogue ch3 0.75x; rogue ch4 236.00x; rogue ch5 0.00x; hunter ch2 0.67x; hunter ch3 1.00x; hunter ch4 177.00x; hunter ch5 0.00x; archer ch2 0.67x; archer ch3 1.00x; archer ch4 176.75x; archer ch5 0.00x; witch ch2 0.57x; witch ch3 1.00x; witch ch4 176.50x; witch ch5 0.00x; alchemist ch2 0.67x; alchemist ch3 1.00x; alchemist ch4 176.75x; alchemist ch5 0.00x"},{"id":"class-spread","ok":false,"detail":"ch1 range 33.3%; ch2 range 22.2%; ch3 range 15.4%; ch4 range 0.0%; ch5 range 0.0%; warrior ch1 0.0%; guardian ch1 -16.7%; rogue ch1 0.0%; hunter ch1 0.0%; archer ch1 0.0%; witch ch1 16.7%; alchemist ch1 0.0%; warrior ch2 0.0%; guardian ch2 0.0%; rogue ch2 0.0%; hunter ch2 0.0%; archer ch2 11.1%; witch ch2 22.2%; alchemist ch2 11.1%; warrior ch3 0.0%; guardian ch3 0.0%; rogue ch3 0.0%; hunter ch3 0.0%; archer ch3 7.7%; witch ch3 15.4%; alchemist ch3 7.7%; warrior ch4 0.0%; guardian ch4 0.0%; rogue ch4 0.0%; hunter ch4 0.0%; archer ch4 0.0%; witch ch4 0.0%; alchemist ch4 0.0%; warrior ch5 0.0%; guardian ch5 0.0%; rogue ch5 0.0%; hunter ch5 0.0%; archer ch5 0.0%; witch ch5 0.0%; alchemist ch5 0.0%"},{"id":"chapter-bounds","ok":false,"detail":"warrior ch1 12m; warrior ch2 8m; warrior ch3 8m; warrior ch4 1416m; warrior ch5 4m; guardian ch1 10m; guardian ch2 8m; guardian ch3 8m; guardian ch4 1416m; guardian ch5 4m; rogue ch1 12m; rogue ch2 8m; rogue ch3 6m; rogue ch4 1416m; rogue ch5 4m; hunter ch1 12m; hunter ch2 8m; hunter ch3 8m; hunter ch4 1416m; hunter ch5 4m; archer ch1 12m; archer ch2 8m; archer ch3 8m; archer ch4 1414m; archer ch5 4m; witch ch1 14m; witch ch2 8m; witch ch3 8m; witch ch4 1412m; witch ch5 4m; alchemist ch1 12m; alchemist ch2 8m; alchemist ch3 8m; alchemist ch4 1414m; alchemist ch5 4m"},{"id":"never-stuck","ok":true,"detail":"0/21 runs stuck"},{"id":"craft-salvage-loss","ok":true,"detail":"rcp.common: 210 < 550; rcp.uncommon: 430 < 1400; rcp.rare: 480 < 3300; rcp.epic: 500 < 5100; rcp.legendary: 900 < 11600"},{"id":"walk-share","ok":true,"detail":"warrior ch1 r1 L1.0: 21.1%; warrior ch3 r5 L36.0: 29.9%; guardian ch1 r1 L1.0: 17.5%; guardian ch3 r5 L35.0: 28.4%; rogue ch1 r1 L1.0: 17.5%; rogue ch3 r5 L36.0: 29.5%; hunter ch1 r1 L1.0: 19.4%; hunter ch3 r5 L36.0: 27.3%; archer ch1 r1 L1.0: 18.0%; archer ch3 r5 L36.0: 25.6%; witch ch1 r1 L1.0: 17.1%; witch ch3 r5 L37.0: 30.8%; alchemist ch1 r1 L1.0: 17.8%; alchemist ch3 r5 L36.0: 25.4%"},{"id":"boss-check","ok":false,"detail":"warrior ch1 first win 0.0%, median 78.10s; warrior ch2 first win 100.0%, median 83.13s; warrior ch3 first win 100.0%, median 75.73s; warrior ch4 first win 100.0%, median 16.30s; warrior ch5 first win 100.0%, median 26.89s; guardian ch1 first win 33.3%, median 118.12s; guardian ch2 first win 100.0%, median 101.09s; guardian ch3 first win 100.0%, median 77.39s; guardian ch4 first win 100.0%, median 14.57s; guardian ch5 first win 100.0%, median 28.62s; rogue ch1 first win 0.0%, median 80.67s; rogue ch2 first win 100.0%, median 76.82s; rogue ch3 first win 100.0%, median 83.93s; rogue ch4 first win 100.0%, median 14.37s; rogue ch5 first win 100.0%, median 23.58s; hunter ch1 first win 0.0%, median 77.93s; hunter ch2 first win 100.0%, median 84.98s; hunter ch3 first win 100.0%, median 84.21s; hunter ch4 first win 100.0%, median 15.68s; hunter ch5 first win 100.0%, median 26.51s; archer ch1 first win 0.0%, median 76.50s; archer ch2 first win 100.0%, median 89.04s; archer ch3 first win 100.0%, median 87.53s; archer ch4 first win 100.0%, median 14.93s; archer ch5 first win 100.0%, median 27.06s; witch ch1 first win 0.0%, median 74.25s; witch ch2 first win 66.7%, median 81.26s; witch ch3 first win 100.0%, median 78.25s; witch ch4 first win 100.0%, median 16.78s; witch ch5 first win 100.0%, median 28.95s; alchemist ch1 first win 0.0%, median 87.25s; alchemist ch2 first win 100.0%, median 85.39s; alchemist ch3 first win 100.0%, median 99.56s; alchemist ch4 first win 100.0%, median 16.25s; alchemist ch5 first win 100.0%, median 27.75s"},{"id":"guardrails","ok":true,"detail":"All numeric leaves within 0.33–3x; walking ≤2000ms, boss timeout ≤180000ms, daily keys ≤3"}]}
Search runtime 310.386s

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  03:41:17
   Duration  310.62s (tests 100%)

```

### `pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/targets.test.ts (before replacing old proposal; expected guardrail rejection of the old proposal)`

```text
$ pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/targets.test.ts (before replacing old proposal; expected guardrail rejection of the old proposal)

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

 ❯ src/v2/sim/targets.test.ts (6 tests | 1 failed) 92ms
   × enforces numeric ratios and each absolute guardrail on the override object 7ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/v2/sim/targets.test.ts > enforces numeric ratios and each absolute guardrail on the override object
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 ❯ src/v2/sim/targets.test.ts:38:55
     36|   expect(guardrailsCheckV2({ cat: { levelGrowth: 0.019 } }).ok).toBe(f…
     37|   expect(guardrailsCheckV2({ cat: { baseHp: NaN } }).ok).toBe(false);
     38|   expect(guardrailsCheckV2(PROPOSED_V2_OVERRIDES).ok).toBe(true);
       |                                                       ^
     39| });
     40|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)
   Start at  03:34:00
   Duration  391ms (transform 40%, tests 39%, import 19%, worker 1%)

undefined
/workspace/taskbar-hero/packages/game-rules:
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: vitest run src/v2/sim/targets.test.ts
```

### `pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim (before exact-median measurement refinement)`

```text
$ pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim (before exact-median measurement refinement)

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules


 Test Files  2 passed | 2 skipped (4)
      Tests  15 passed | 2 skipped (17)
   Start at  03:47:07
   Duration  52.37s (tests 100%)

```

### `pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim (final measurement)`

```text
$ pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim (final measurement)

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules


 Test Files  2 passed | 2 skipped (4)
      Tests  16 passed | 2 skipped (18)
   Start at  03:50:50
   Duration  51.32s (tests 100%)

```

### `V2_SIM_WRITE=1 pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/report.write.test.ts (interrupted to tighten median-level measurement before any document write)`

```text
$ V2_SIM_WRITE=1 pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/report.write.test.ts (interrupted to tighten median-level measurement before any document write)

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

Completed warrior, step 2, 20 seeds; elapsed 60.821s
Completed guardian, step 2, 20 seeds; elapsed 111.002s
undefined
/workspace/taskbar-hero/packages/game-rules:
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 143: vitest run src/v2/sim/report.write.test.ts
```

### `V2_SIM_WRITE=1 V2_SIM_DATA=/tmp/v6c/report-data.json pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/report.write.test.ts`

```text
$ V2_SIM_WRITE=1 V2_SIM_DATA=/tmp/v6c/report-data.json pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/sim/report.write.test.ts

 RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules

Completed warrior, step 2, 20 seeds; elapsed 60.675s
Completed guardian, step 2, 20 seeds; elapsed 112.348s
Completed rogue, step 2, 20 seeds; elapsed 173.362s
Completed hunter, step 2, 20 seeds; elapsed 232.769s
Completed archer, step 2, 20 seeds; elapsed 288.153s
Completed witch, step 2, 20 seeds; elapsed 337.742s
Completed alchemist, step 2, 20 seeds; elapsed 387.070s
Current 7 x 20 runtime: 387.070s
Completed warrior, step 2, 20 seeds; elapsed 428.878s
Completed guardian, step 2, 20 seeds; elapsed 468.312s
Completed rogue, step 2, 20 seeds; elapsed 507.740s
Completed hunter, step 2, 20 seeds; elapsed 552.037s
Completed archer, step 2, 20 seeds; elapsed 589.568s
Completed witch, step 2, 20 seeds; elapsed 626.506s
Completed alchemist, step 2, 20 seeds; elapsed 665.303s
Completed warrior, step 1, 5 seeds; elapsed 684.592s
Completed guardian, step 1, 5 seeds; elapsed 702.201s
Completed rogue, step 1, 5 seeds; elapsed 720.130s
Completed hunter, step 1, 5 seeds; elapsed 740.025s
Completed archer, step 1, 5 seeds; elapsed 757.306s
Completed witch, step 1, 5 seeds; elapsed 774.713s
Completed alchemist, step 1, 5 seeds; elapsed 791.884s
Full 7 x 20 current + proposed + diagnostic runtime: 791.905s
Report exceeded ten minutes.

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  03:52:05
   Duration  792.16s (tests 100%)

```

### `pnpm gen:deno && git diff --exit-code -- supabase/functions`

```text
$ pnpm gen:deno && git diff --exit-code -- supabase/functions

> taskbar-hero@0.0.0 gen:deno /workspace/taskbar-hero
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
```

### `git diff --stat origin/main -- packages/game-rules/src/v2/config.ts packages/game-rules/src/v2/content`

```text
$ git diff --stat origin/main -- packages/game-rules/src/v2/config.ts packages/game-rules/src/v2/content
(exit 0; no output)
```

### `pnpm typecheck && pnpm lint && pnpm test && pnpm build`

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
packages/chain test:    Start at  04:05:51
packages/chain test:    Duration  308ms (import 35%, transform 34%, worker 18%, tests 13%, environment 1%)
packages/chain test: Done
packages/game-rules test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/game-rules
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  04:05:51
packages/auth test:    Duration  647ms (import 70%, tests 26%, transform 3%, worker 1%)
packages/auth test: Done
supabase/tests test$ vitest run
supabase/tests test:  RUN  v5.0.5 /workspace/taskbar-hero/supabase/tests
supabase/tests test:  Test Files  15 passed (15)
supabase/tests test:       Tests  340 passed (340)
supabase/tests test:    Start at  04:05:52
supabase/tests test:    Duration  32.78s (tests 90%, import 9%, transform 1%)
supabase/tests test:     Isolate  15 workers spawned · ~118ms startup each (spawn + environment, per file)
supabase/tests test:              at least ~1.65s faster with isolate: false — reuses workers across files instead of one per file
supabase/tests test: Done
packages/game-rules test:  Test Files  17 passed | 2 skipped (19)
packages/game-rules test:       Tests  292 passed | 2 expected fail | 2 skipped (296)
packages/game-rules test:    Start at  04:05:52
packages/game-rules test:    Duration  73.23s (tests 99%, import 1%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /workspace/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  04:07:06
packages/api-contract test:    Duration  251ms (transform 69%, import 25%, tests 4%, worker 2%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /workspace/taskbar-hero/apps/web
apps/web test:  Test Files  61 passed (61)
apps/web test:       Tests  717 passed (717)
apps/web test:    Start at  04:07:06
apps/web test:    Duration  53.21s (environment 66%, tests 20%, import 12%, transform 1%, worker 1%)
apps/web test: Environment  jsdom was created 61 times · 30.93s total, 66% of tracked time
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
apps/web build: ✓ 1722 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-C0PSJB46.css               38.76 kB │ gzip:   7.94 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-Rjyucpee.js               126.75 kB │ gzip:  36.88 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 781ms
apps/web build: Done
```

### `git diff --check; allow-list and unchanged-file audit`

```text
$ git diff --check; allow-list and unchanged-file audit
PASS allowed: docs/proposals/numbers-v2.md
PASS allowed: packages/game-rules/src/v2/sim/proposal.ts
PASS allowed: packages/game-rules/src/v2/sim/report.ts
PASS allowed: packages/game-rules/src/v2/sim/report.write.test.ts
PASS allowed: packages/game-rules/src/v2/sim/search.test.ts
PASS allowed: packages/game-rules/src/v2/sim/sim.test.ts
PASS allowed: packages/game-rules/src/v2/sim/simulate.ts
PASS allowed: packages/game-rules/src/v2/sim/targets.test.ts
PASS allowed: packages/game-rules/src/v2/sim/targets.ts
PASS allowed: reports/v6c-rebalance.md
PASS unchanged lockfile, workspace manifest, production config/content/barrel and Edge Function maps
PASS git diff --check
```

## Final validation and author audit

The final frozen-lockfile install, focused sim tests, complete writer, Deno generation/diff, production config/content diff, typecheck, lint, full local tests and build all passed. The complete game-rules run took 73.23 seconds. Only the ten allow-listed files above are committed. The two normal-suite skips are the explicitly opt-in search and report writer, both run separately in the transcripts; existing expected-failure tests were preserved.

Before the first push:

```text
$ git log --format='%an <%ae>' origin/main..HEAD
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

There is one commit with the required author; no author reset was needed. This report-only amendment preserves that author. The branch push is authorized; no PR is opened and no Actions are dispatched.
