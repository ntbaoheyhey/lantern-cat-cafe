# Lane A6 state

- Worktree: /Users/bao/taskbar-hero-cardrpg-a6 (reused existing clean worktree on the requested branch; fallback not needed).
- Branch: codex/cardrpg-a6-q0-2026-11-10
- Base: origin/codex/cardrpg-ui-v3-u9-2026-11-09
- Base tip SHA: c95097eed7f543c26ac982242d5823057117da92
- Node: v24.22.2 (.nvmrc: 24)
- pnpm: 10.28.0 (repository packageManager version)
- Free disk at setup: 147 GiB (df -h ~); above 15 GB threshold.
- Dependencies: pnpm install --frozen-lockfile completed without lockfile changes.
- Scope: Q0 only; await STEP 2 for Q1–Q16.

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
