# Lane A6 fix log

- Q0: Added the inert gameplayA6 query flag and one default-OFF/explicit-opt-in unit test.
- Typecheck, lint and all 1,868 web tests passed; no follow-up fixes were needed.

## Q1
- Smoke repair 1: the bot settled a defeat before calling the UI's result-advice command. That command correctly rejected the already-settled state. Keep the pending Result state for the atomic advice command, just as the UI does; no game rule changed.
- Q1 performance: the exhaustive 220-team run exceeded six minutes and was stopped. The compact tool now tests the four authored V5 crews plus fixed mixed-team samples, each on all 500 seeds; it reports this coverage explicitly. Advisor memoization preserves legal level-up availability instead of keying on irrelevant spare currency. No combat or economy outcomes are approximated.
- Q1 performance attempt 2 also exceeded three minutes. The seven-day bot now uses explicit four-minute check-ins instead of implicitly unbounded full patrols; unfinished routes carry over and rewards still require real battles. The final baseline uses this same schedule as later comparisons.
- Q1 timing correction: authored action duration now includes the actual action-start marker (the player-facing anticipation floor) and defeat follow-through; empty presentation plans understated x1 time. Browser overhead remains explicitly unmeasured.
- Q1 performance attempt 3: the bounded 500-seed run also crossed three minutes. Keep this simple, correct version and finish its baseline; record runtime as a known issue. Do not spend another repair cycle on measurement before gameplay. Revisit the bottleneck when Q4 replaces the costly result advisor and Q12 tunes the loop.

## Q2 in progress
- Added flag-gated rage from acting, dealing damage and taking damage; automatic full-rage ultimates; version-two rage/ultimate events; two boss thresholds. Legacy OFF paths stay separate.
- Tuning attempt one: ten seeds, normal five rounds/25.61 seconds, boss 89.59 seconds; fixed normal fixtures never reached their ultimates.
- Tuning attempt two: fifty seeds, normal six rounds/31.42 seconds, boss 78.69 seconds. Per-cat normal ultimates ranged from 57.14 to 100 percent.
- Tuning attempt three uses per-cat rage multipliers and 500 seeds. No further Q2 numeric tuning after this pass; record remaining gaps and continue.
- Correctness repair: x3 speed must survive an A6 save/reload; disabling A6 outside a committed run normalizes x3 to x2.
- Correctness repair: enemy full-rage events are emitted only for a non-suppressed cast; reaching full rage during the current round may upgrade its already-announced intent.
- HUD screenshot at 1440 by 900 inspected: party HP/rage, speed, earned-stage skip lock and auto-continue visible without obscuring faces. Ultimate capture is still in progress.
- Third tune result: G1 passes on 500 seeds; G2 normal ultimate range is 42.4–78.33 percent, so a few cats still exceed seventy percent. Accept the per-cat table fallback and log the remaining overflow for Q12 rather than adding a fourth numeric tune.
- Final check reruns 500 seeds only because the enemy-cast correctness repair changed a corner case after the third tune was bundled.
- Inspected a third HUD shot at 1280 by 720. Natural ultimate capture timed out while the 500-seed CPU run was active (no console error; combat still advanced); the inspected full-rage fixture establishes banner layout only. Browser pacing is not claimed from authored sim seconds. Recheck isolated playback at the scheduled Q3/Q15 real-click runs.

## Q3
- Corrected low-contrast Bond Book cards to use Living Cafe tokens; moved hidden card bond text into a readable portrait badge.
- Four unrelated web tests timed out under concurrent simulation. Isolated retry passed all thirty tests in their three files; no timeout thresholds or assertions changed.
- Q3 sim keeps G1 pacing and G4 variety passing. G2 remains partial (boss minimum 89.17 percent); worst-case early losses and economy remain Q4/Q11/Q12 work.
- Simulator runtime is 341.79 seconds under shared host load. The existing Q1 runtime repair cap remains exhausted; no new measurement pipeline was added.
- A focused retaliation test reproduced a second combo firing after its shared triggering cat fell. Rechecking living contributors between combos fixed it; all six bond tests pass. Re-running the single sim and compatibility check against the final rules.
- First-session recorder: mark a fight crossing the two timing-lock leases so its duration is excluded instead of treating unobserved lock waiting as combat time. Console-error collection added for subsequent observer segments; the already-running first half records page errors only. No game state or clock is changed.
- Q3 real-click scope: the patrol/training path does not yet claim Events or the idle chest. Report its account-reward gaps as path observations, not proof that no reward was available. Future scheduled browser sessions must follow actionable claim badges as those screens are completed. Victory route points remain visible rewards.
- Final Q3 browser result: thirty active minutes, twenty-nine wins, no losses/stalls. Normal median 39.49 seconds and p90 60.51 miss browser G1; boss median 72.09 and p90 79.32 fit the target. Do not substitute the authored sim's 30.91-second normal median for this measured result.
