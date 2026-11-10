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

## Q4
- Full-health Power normalizes battle actor stat aliases and ignores wounds, so roster and battle scores agree.
- Screenshot review caught a stale cat-detail level after quick upgrade. The Cats sheet now subscribes directly to model revisions; a rendered regression checks the new level.
- Loss fallback navigation names the target cat or equipment; it does not claim a predicted win when no forecast improvement qualifies.
- Q4 sim: twelve-candidate advisor lowers runtime to 235.92 seconds but hint retry success is 68.77%, below Q3’s 71.31%. Keep it as a known issue for the scheduled first-session/balance pass; do not claim G3 complete.

## Q5
- Initial preparation layout pushed the back row below the fold. Collapsed save/suggestion selectors and compact row cards expose both rows and Fight at 1280×720. Supporting details still scroll; retain for Q13.
- Initial bond links missed ancestor refs during the child layout effect. Drawing after refs attach fixes first-mount links; screenshots and the browser check confirm the path exists.

## Q6
- Screenshot review collapsed inactive chapter choices and tightened stage cards; the full branching map fits at 1280 by 720.
- Fixed the home map tab remaining selected after entering an encounter; the browser path and a rendered regression now reach Prepare/Fight.
- Preserved the daily service quest on passive idle claims. Fast rewards do not bypass its ten-minute wait. Twenty-one related rules tests pass.
- Avoided cloning the entire account for same-day idle previews. The final sim is rerunning after the service fix; the first Q6 table is superseded.
- Q6 checkpoint: the final service-task fix has twenty-one passing focused tests. A repeated full sim waited behind another lane; retained the completed 500-seed table with its scope stated and deferred the rerun to Q7 so evidence work does not block new gameplay.
- Q6 browser normal median 43.14 s/p90 63.61 remains above target; 963.12-second trailing account-reward gap excludes route points/boons. Keep both for Q11/Q12.

## Q7
- Added explicit milestone chest labels and a model subscription so a claim updates immediately. The first screen test exposed concatenated accessible names.
- Kept the preparation Route tab on the active Tower floor, including replaying an earlier floor; a rendered regression passes.
- Full rules suite: 1,286 pass plus existing expected failures/skips. Two unrelated web layout tests timed out under concurrent host load; their isolated retry and the new Tower regression pass all twenty-four tests without changing timeouts.
- A real click exposed the Route tab closing during unrelated account notifications. Reset it only on a changed screen/encounter, and provide an explicit return-to-formation action.
- Q7 measurement: Tower median 58.94 s and per-floor medians 18.6–169.2 s miss the 20–50 s target on the fixed level-six fixture. Preserve fixed lineups and log this for Q12 balance; no earned-player pacing claim. The sim runtime is 212.14 s, still above three minutes.

## Q8
- Initial 1280×720 layout placed daily claim buttons below the fold. Moved the login action beside its heading and tightened small-height spacing; all five actions now fit and the real-click check asserts their bounds.
- Daily progression is observed only after successful public transactions. The final test group covers all five activities, duplicate claims, caps, rollover, rollback and OFF preservation.

## Q9 validation
- The full E2E run passed 420 cases; existing v2 idle-clock XP accrual timed out. The isolated retry passed in 9.8 seconds after the shared lock became available. No unrelated product code was changed.
- The first-session recorder now counts visible route points and boon offers, and carries its final observation into the next lease to avoid duplicate reward signals.

## Q11
- The hand glyph entered accessible button names. Rendered it as a decorative SVG background; the real-click harness now finds exact Recruit/Welcome/Level up labels.
- Existing discovery and new unlock banners overlapped at 720-pixel height. Unlocks now wait in their queue until the existing discovery finishes; the queue test and inspected screenshot confirm the sequence.
- Moved A6 cat growth before kit descriptions so the first level button is visible on the small screen. OFF order is retained.
- One unrelated StageLayout test timed out in the full suite; its isolated file plus Q11 introduction/tower tests passed sixteen tests. No unrelated source changes.

- Q11 first 500-seed pass: runtime 83.39 s, first-session losses up to one by ten minutes/four by thirty, hint retry 72.32%. Default bands alone were insufficient. Added explicit first-clear attack easing at entry band one; final measurements pending.
- Q11 second pass: zero early losses, up to three by thirty minutes, hint retry 82.93%, runtime 87.87 s. Entry-only first-clear easing caused a replay difficulty jump. Final third pass keeps band-one easing on replay and tapers through bands two/three.
- Q11 final third pass: zero losses at ten/thirty minutes, median reward gap ten seconds; runtime 72.64 s. Retry advice unobserved. G1 normal rounds five, Tower and G2 remain explicit Q12 gaps. Final full suites pass 1,898 web/1,303 rules.

## Q12
- The first tune reached six normal rounds but left Clover at 72 percent ultimate use and Tower floor medians from 19.79 to 66.56 seconds. The second tune lowers Clover rage and the HP budget of later healing/tank formations, while slightly increasing the middle Tower boss HP.
- The second 500-seed run takes 65.56 seconds: normal ultimate rates 50.4–69.17 percent, boss minimum 91.2 percent; all thirty Tower floor medians 26.05–47.99 seconds. No third repair or escalation fallback is needed for these simulated gates.
- Full E2E passes all 421 cases without retries. Browser timing remains in progress; first normal 47.34 seconds, next normal 23.97 and first boss 57.47. Preserve all observations in the final summary.
- The complete Q12 browser run had thirty-one wins/no losses/errors/stalls; normal 37.64/50.8 s still missed. Third repair: A6 model uses bounded elapsed frame time instead of the canvas-clipped delta; B-owned source is unchanged. Five clock regressions and a separate shorter browser probe are pending.

- Final clock regression checks pass. Separate ten-minute browser probe: nine wins, no losses/errors/stalls; normal44.09/46.45 s (six samples), boss69.21/92.9 (three). The clock tracks elapsed time, but normal browser pacing remains PARTIAL after three repairs; keep the existing escalation fallback and lane-B performance request, then continue Q13.
