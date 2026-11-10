# Lane A6 decisions

- Reuse the existing clean A6 worktree on the requested branch; no checkout, reset, or stash.
- Keep Q0 limited to setup; defer gameplay behavior and Q1–Q16 to STEP 2.
- Add gameplayA6 beside cardRpgEnabled in apps/web/src/game/cardrpg/gate.ts; exact ?a6=1 opt-in, no build override and no attached behavior.
- Reuse existing actual-rule sim loaders and seeded battle/run APIs for a future single tool; do not re-run prior acceptance evidence in Q0.

## Q1
- Keep one simulation entry point and one development seed range, 1–500. Preserve the final seed block for Q15.
- Test all seeds on a fixed candidate-team sample, including the four authored V5 crews. Report coverage instead of claiming an exhaustive ranking.
- Define seven-day economy visits as four-minute check-ins with real commands; preserve unfinished patrols between visits.
- Memoize the old fixed-seed advisor only when builds and legal level-up choices match; restore the real account's stale-click guard.
- Authored animation time includes action anticipation and defeats. Browser overhead and human enjoyment require separate checks.
