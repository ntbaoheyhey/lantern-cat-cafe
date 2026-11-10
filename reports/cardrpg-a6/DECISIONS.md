# Lane A6 decisions

- Reuse the existing clean A6 worktree on the requested branch; no checkout, reset, or stash.
- Keep Q0 limited to setup; defer gameplay behavior and Q1–Q16 to STEP 2.
- Add gameplayA6 beside cardRpgEnabled in apps/web/src/game/cardrpg/gate.ts; exact ?a6=1 opt-in, no build override and no attached behavior.
- Reuse existing actual-rule sim loaders and seeded battle/run APIs for a future single tool; do not re-run prior acceptance evidence in Q0.
