# Lane A6 state

- Worktree: /Users/bao/taskbar-hero-cardrpg-a6 (reused existing clean worktree on the requested branch; fallback not needed).
- Branch: codex/cardrpg-a6-q0-2026-11-10
- Base: origin/codex/cardrpg-ui-v3-u9-2026-11-09
- Base tip SHA: c95097eed7f543c26ac982242d5823057117da92
- Node: v24.22.2 (.nvmrc: 24)
- pnpm: 10.28.0 (repository packageManager version)
- Free disk at setup: 147 GiB (df -h ~); above 15 GB threshold.
- Dependencies: pnpm install --frozen-lockfile completed without lockfile changes.
- Scope: STEP 2 active; Q9 active; Q1 completed 2026-11-10 06:38 UTC.
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

## Q4 complete — 2026-11-10 08:04 UTC
- Shared full-health Power on cats/team/foes/stages; real-cost quick upgrade, non-stealing auto-equip and count-up feedback.
- Loss forecast exposed; bounded A6 candidates choose cheapest reliable improvement. Fallback opens the named cat or gear.
- Typecheck/lint PASS; full web 1,874 PASS, rules 1,277 PASS plus two existing expected failures/eleven skips. Later focused web fifteen tests and rules ten tests pass.
- Three inspected WebPs; browser click raised Power 7,503 to 7,537 and loss fallback opened Soot training. No page/console errors.
- Final sim: 235.92 seconds; normal median 30.88 seconds, boss 79.38. G2/G3/G5 remain partial; hint retry 68.77 percent, worst six losses in thirty minutes.
- OFF digest exact over 8,250 routes and A5 fallback exact over forty-five routes; q4-compatibility.json.
- Q5 next; drafts under /tmp/cardrpg-a6-formation-* are not applied or tested yet. Full E2E/thirty-minute real-click run next due Q6.

## Q5 complete — 2026-11-10 08:09 UTC
- Front/back formation, visible bond lines, three owned/eligible suggestions and Campaign/Daily/Tower saved teams reuse existing rules.
- Enemy Power/threats and existing forecast are visible before Fight. Keyboard Enter placement and per-mode restore exercised in Chromium.
- Typecheck/lint PASS; full web 1,878 PASS; three final formation tests PASS. No rules bytes changed, so Q4 sim/OFF/A5 evidence remains applicable.
- Three inspected WebPs include 1280×720. Both rows/Fight visible, no horizontal overflow or page/console errors. Extra bond/plan details still scroll on small height.
- Q6 is next; full E2E and thirty-minute real-click first session required at its checkpoint.

## Q6 complete — 2026-11-10
- Campaign map reuses journey stars/rewards; full map fits 1280×720. Twelve-hour stage-scaled tips and two capped fast rewards/day.
- Typecheck/lint PASS; full web 1,880 and rules 1,281 PASS; focused screen three and final rules twenty-one PASS. All 421 existing E2E PASS.
- OFF digest exact over 8,250 routes; A5 fallback exact over forty-five; expected hashes unchanged.
- Three inspected WebPs, no overflow/page/console errors. Thirty-minute session: 1,801.71 seconds, 29 wins, zero losses/stalls/errors.
- Browser normal median 43.14 s/p90 63.61 misses G1; boss 72.56/92.69 fits. Account-reward trailing gap 963.12 s excludes visible route rewards.
- Completed 500-seed sim: 253.89 s, authored normal 30.88 s, boss 79.38 s, idle cap 12 h. G2/G3/G5 partial.
- Final passive-service bookkeeping fix passed twenty-one tests; its queued sim rerun was deferred after a long shared-lock wait. Q7 sim will include it.
- Q7 next; Q8 drafts remain outside the worktree. No fresh seeds used.

## Q7 complete — 2026-11-10
- Thirty fixed Tower floors, six milestone chests and shared preparation/battle; route tab returns correctly to formation.
- Typecheck/lint PASS; rules 1,286 PASS; web 1,881 PASS plus two unrelated timeouts passed isolated retry (24 tests). Final Tower/Campaign six tests PASS.
- Three inspected WebPs, including 1280×720; synthetic unlocked fixtures. Real-click path passes without page/console errors or overflow.
- Sim: 500 seeds in 212.14 s; normal 30.88 s, boss 79.38 s. Tower median 58.94 s/p90 104.65 on level-six fixtures; pacing remains partial for Q12.
- OFF exact over 8,250 routes; A5 exact over forty-five; expected hashes unchanged. q7-compatibility.json.
- Q8 next. The draft bundle has virtual-source typechecks only; apply then test. Full E2E/thirty-minute session next due Q9.

## Q8 complete — 2026-11-10
- Five daily activities, weekly chests at ten/twenty/thirty claims and seven calendar-safe login gifts; one actionable badge module for A6.
- Typecheck/lint PASS; full web 1,887 PASS; rules 1,291 PASS plus existing expected failures/skips. Final six daily rules tests and rules typecheck PASS.
- Three inspected WebPs. All daily actions fit 1280×720; real login claim/reload remains one-time, without overflow or page/console errors.
- Sim: 500 seeds, 247.22 s. Pacing unchanged; Epic by day two 54.2%, pity budget by day six 0%. Current caps keep G5 partial for Q9/Q12.
- OFF exact 8,250 routes and A5 exact forty-five; expected hashes unchanged. q8-compatibility.json.
- Q9 next; full E2E and thirty-minute real-click session due. Fresh final seeds remain unused.
