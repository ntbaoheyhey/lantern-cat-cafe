# Lane A6 state

- Worktree: /Users/bao/taskbar-hero-cardrpg-a6 (reused existing clean worktree on the requested branch; fallback not needed).
- Branch: codex/cardrpg-a6-q0-2026-11-10
- Base: origin/codex/cardrpg-ui-v3-u9-2026-11-09
- Base tip SHA: c95097eed7f543c26ac982242d5823057117da92
- Node: v24.22.2 (.nvmrc: 24)
- pnpm: 10.28.0 (repository packageManager version)
- Free disk at setup: 147 GiB (df -h ~); above 15 GB threshold.
- Dependencies: pnpm install --frozen-lockfile completed without lockfile changes.
- Scope: STEP 2 active; Q4 active; Q1 completed 2026-11-10 06:38 UTC.
- Delivery branch remains codex/cardrpg-a6-q0-2026-11-10; one draft PR #438 for the whole lane.

## Report skim (15 lines; existing claims, not re-verified)
1. Read the three skills-v5 reports and both ui-v3 reports from this worktree; no fallback git show was needed.
2. V5 adds Burn, Bleed, Bitter, multi-target actions and four reactions while battles remain automatic.
3. V5 acceptance is PARTIAL: shipping 21 PASS/21 MISS; fallback 17 PASS/25 MISS.
4. Registered acceptance used 500 seeds/cell, 20001–20500; TRAIN 1–500 is separate and 10001–10500 is contaminated.
5. Multi-foe damage and announced reactions pass; multi-ally support and every-cat ultimates still miss.
6. Normal fights average about 13.3 rounds and earned bosses about 130 seconds; pacing misses its targets.
7. Balance misses include equipment gains, crew/cat ranges, set outcomes, calibration and tier comparisons.
8. S6 scores 6.16/10 versus 8.0; pacing 2.59 and balance 5.00 are the next priorities.
9. V5 compatibility/old-save receipts pass; human recognition and enjoyment remain NOT VERIFIED.
10. FRESH-EYES is an agent self-review: tomorrow 5, choices 7, win/loss understanding 6, excitement 5; reward gaps and repeated losses remain concerns.
11. UI v3 delivers U0–U9, product default OFF, opt-in ?ui=v3 or VITE_UI_V3=1; ?ui=legacy preserves comparison.
12. UI v3 remains PARTIAL at 8.475/10: G6 cold interaction is about 1.36 s versus a 223 ms baseline; other reported gates pass.
13. UI owns ui-v3/** and shell integration; B owns renderer/art; the resumed sync watcher and excluded PARTIAL art are context only, not A6 Q0 work.
14. Rules live in packages/game-rules/src/cardrpg; depth/index.ts exposes battle APIs, depth/skills-v5 holds V5 rules, and depth/run-bot.ts supplies playRun.
15. One future tool can reuse tools/cardrpg-big/skills-v5/load.mjs and matrix.mjs patterns with createBattle/playBattle, replayBattle, seeded RNG and playRun; no sims ran in Q0.

## Q0 verification — 2026-11-10
- pnpm typecheck: PASS (exit 0).
- pnpm lint: PASS (exit 0).
- pnpm --filter @taskbar-hero/web test: PASS (201 files, 1,868 tests, exit 0; includes one new default-OFF/opt-in test).
- git diff --check: PASS; no dependency lockfile or prior rules/renderer changes.
- gameplayA6: apps/web/src/game/cardrpg/gate.ts, OFF by default, ON only with ?a6=1; no behavior attached.
- Delivery: draft-only PR against codex/cardrpg-ui-v3-u9-2026-11-09; no merge or deployment.

## Q1 complete
- One sim entry point added: tools/cardrpg-a6/sim.mjs. Up to twelve local CPU workers; no model requests.
- Typecheck/lint PASS; web 1,868 PASS; rules 1,262 PASS, two existing expected failures and eleven existing skips.
- BEFORE baseline complete: 500 seeds in 496.99 seconds; see BASELINE.md. Runtime over three minutes is a known issue after three repairs.
- Mean first-session losses: 1.92 in ten minutes and 7.07 in thirty; existing hint retry win rate 17.59 percent.
- Fresh seeds 60001–60500 remain unused.

## Q2 complete — 2026-11-10 06:56 UTC
- Flag-gated automatic rage/ultimates, boss phases, x1/x2/x3, three-star skip and optional auto-continue.
- Final 500-seed sim: normal six rounds, median 32.17 seconds, p90 44.46; boss median 81.69 seconds, p90 95.11. G1 passes on authored timing.
- G2 partial: normal ultimate range 48–79.17 percent; boss minimum 90 percent. Three numeric tuning attempts exhausted; remaining overflow goes to Q12.
- G3 remains partial: early losses mean 0.29, thirty-minute losses mean 1.01/worst five; hint retry wins 63.82 percent.
- Sim runtime 270.17 seconds; economy now dominates cost. Keep the existing measurement definitions.
- Exact OFF digest PASS (8,250 routes); A5 fallback PASS (45 routes). q2-compatibility.json records both expected hashes unchanged.
- Typecheck/lint and full touched-package suites pass; final Daze/save edge cases pass (five rules and two web tests).
- Three WebP shots inspected. Forced full-rage fixture proves banner layout; natural-cast timing under concurrent CPU load is not a browser pacing claim.
- Next: Q3 bonds/combos/book and the scheduled full E2E + thirty-minute real-click session.

## Q3 complete — 2026-11-10 07:50 UTC
- Nine collection bonds, eight automatic pair combos, Bond Book and cat/formation badges. Three inspected WebP screenshots; no B-owned canvas/art edits.
- Final 500-seed sim: normal six rounds/30.91 seconds authored median; boss 79.82 seconds. G2/G3/G5 remain partial; 258.39-second sim runtime remains a known issue.
- Typecheck/lint and touched tests pass; four concurrent-load web timeouts passed isolated retry. Existing E2E: all 421 pass.
- Legacy OFF digest exact over 8,250 routes; A5 fallback exact over forty-five routes. q3-compatibility.json retains expected digests.
- Real-click run: 1,800.90 active seconds, twenty-nine wins, no losses or stalls. Normal median 39.49 seconds/p90 60.51; boss median 72.09/p90 79.32. Browser G1 normal pacing misses.
- Page errors observed throughout and console errors in the second half: none. Tutorial and one lease-crossing fight excluded from timing statistics.
- Patrol/training path skipped Events and idle claims; 809.67-second final account-reward gap is path-specific, not proof no rewards were available. Route points/boons remained visible.
- Q4 is next; temporary source/test drafts exist under /tmp/cardrpg-a6-*-draft.* and are not yet applied or tested.
