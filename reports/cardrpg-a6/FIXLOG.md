# Lane A6 fix log

- Q0: Added the inert gameplayA6 query flag and one default-OFF/explicit-opt-in unit test.
- Typecheck, lint and all 1,868 web tests passed; no follow-up fixes were needed.

## Q1
- Smoke repair 1: the bot settled a defeat before calling the UI's result-advice command. That command correctly rejected the already-settled state. Keep the pending Result state for the atomic advice command, just as the UI does; no game rule changed.
- Q1 performance: the exhaustive 220-team run exceeded six minutes and was stopped. The compact tool now tests the four authored V5 crews plus fixed mixed-team samples, each on all 500 seeds; it reports this coverage explicitly. Advisor memoization preserves legal level-up availability instead of keying on irrelevant spare currency. No combat or economy outcomes are approximated.
- Q1 performance attempt 2 also exceeded three minutes. The seven-day bot now uses explicit four-minute check-ins instead of implicitly unbounded full patrols; unfinished routes carry over and rewards still require real battles. The final baseline uses this same schedule as later comparisons.
- Q1 timing correction: authored action duration now includes the actual action-start marker (the player-facing anticipation floor) and defeat follow-through; empty presentation plans understated x1 time. Browser overhead remains explicitly unmeasured.
- Q1 performance attempt 3: the bounded 500-seed run also crossed three minutes. Keep this simple, correct version and finish its baseline; record runtime as a known issue. Do not spend another repair cycle on measurement before gameplay. Revisit the bottleneck when Q4 replaces the costly result advisor and Q12 tunes the loop.
