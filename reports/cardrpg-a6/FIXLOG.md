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

- Final clock regression checks pass. Separate ten-minute browser probe: nine wins, no losses/errors/stalls; normal 44.09/46.45 s (six samples), boss 69.21/92.9 (three). The clock tracks elapsed time, but normal browser pacing remains PARTIAL after three repairs; keep the existing escalation fallback and lane-B performance request, then continue Q13.

## Q13
- Cats details now use four panels; the defeat advice action is primary. Typecheck/lint and 1,905 web tests pass; visual review waits for timing.lock.
- Consecutive B jobs repeatedly acquired the lock during the existing two-second waiter gap. Added an opt-in CARDRPG_TIMING_POLL_MS (100–2,000 ms, default unchanged) to the existing lock tool. A6 uses 100 ms while waiting, never steals a live lock, and keeps leases below twenty minutes.
- A 100 ms waiter also missed an immediate B-to-B handoff. The existing lock tool now wakes on parent-directory changes as well as its bounded polling fallback; atomic mkdir/live-owner checks remain unchanged. A6 batches sequential review commands within one nineteen-minute lease.

- Q13a packaging: first checks raced an unfinished manifest; waited for packaging, reran types/lint/33 touched tests successfully, restarted only own Vite to clear failed resolution cache. Twelve captures then passed.

- Q13c: Epic splash initially inherited the sheet transform and overlapped HUD; app-root portal restores full viewport. Mouse/Escape skip and focus trap checked in real browser at both sizes.

- Q13d: annotated vector-building tuples for strict types; corrected inherited pale run-stat text on parchment after inspecting both resolutions. Real graph/reward controls verified unchanged.

- Q13e review: the default Playwright headless-shell captured shader loading before sceneReady. Switched this review to the published B harness configuration (Chromium channel + Metal) and explicitly waits for sceneReady. Captures now show actual puppets. This is a review environment repair, not a measured game performance improvement.
- Q13e verification: initial test command incorrectly forwarded `--` and began the full web suite; stopped own process immediately, then reran only the three touched suites with `pnpm exec vitest run <files>` (20 pass). Fixed test fixture to use public finishMoment instead of private fields; types/lint pass.

## Q13f resumed fallback — 2026-11-10T17:46:18Z
- Saved baseline and attempts1–3 retained, not rerun. Third attempt: first loss486.17s,3.92mean losses/30min,max5,hint retry35.71%,normal win HP98%. Raising attack to hit a Power number created a shield-wash/Hush wall.
- R-3 fallback: keep frozen content/HP and named mechanics, reduce later guardian strike budgets (Rain Spool78%,Pantry Crown90% of the third-pass attack). Power labels still use real stats. Do not change enemies when the player upgrades; do not force healer teams to finish injured. One verification pass follows; remaining numeric misses will be reported and Q13g continues.
- Fallback100-seed result: first loss median725.79s,70%accounts1–3losses,mean2.9/max5; reward-gap median10s. Hint retry48.23%,normal HP98%,boss95.31s remain misses. No further Q13f numeric tuning after the repair cap. Browser confirmation and Q13g follow.
- Recorder now takes one level per route instead of buying repeatedly to level8 before playing; follows real loss advice and captures both-size Prepare/Map/Loss. This is a documented observer policy change, not a combat grant. Existing sim counters remain distinct from browser evidence.

- 2026-11-10T18:25:01Z Q13f browser finished:21wins/2losses,first loss395.62s,normalHP100%,0errors/stalls. Both cheap hints won next route; same-seed success still48.23% in development sim. Mark completed with explicit misses underR-3, no fourth balance loop. Inspected remaining3captures; route boon contrast/fold and truthful loss label already queuedQ14a.

- 2026-11-10T18:55:15Z Q14a review attempt1: saved first five1440px captures; keyboard route-choice assertion failed because reviewer fixture omitted run.current, which chooseReward requires. Set the fixture to its first node; production transaction unchanged. Resume with existing images retained and incremental review.json checkpoints.

- 2026-11-10T18:57:07Z Q14a visual repair: the new gear-card selector also matched the nested empty-state button, overriding its44px minimum with166/146px and pushing it below720p. Limit both viewport rules to direct gear-card buttons; add actual primary-action fold assertion to the existing capture tool.

- 2026-11-10T19:05:24Z Q14 visual review found top boss Phase2 beside world label Phase1 at523/802HP. A6 first phase is a bonus flag; world label/scene bridge still read the legacy two-phase field. Use one displayedBossPhase adapter in both DOM labels and the existing scene input; no rules or B renderer change. Real threshold regression added; verification pending.

- 2026-11-10T19:10:08Z Q14 B P13 improves the two-add view after merge7b23959ad. A6phase3 spawns a third live add; slot%2 places it over another. Confirmed from real automatic fixture, requestedB extension with exact reproducer/evidence. Keep bossvisibility provisional; continue independent Q15checks, no combat-rule workaround.

2026-11-10T19:15:22Z Q15 capture harness: Saved/Suggested summaries require distinct selection; resume keeps prior images. Map focus check used focus() after mouse input and therefore did not establish keyboard modality. Existing CSS has a focus-visible outline; focused verification now uses actual Tab/Shift+Tab and asserts focus before inspecting the ring. App source unchanged; failed receipt retained.

2026-11-10T19:20:48Z Q15 E2E: full suite420/421, idle XP stayed0 after fake-clock jump before app readiness. Minimal test-only wait for visible Catstatus before advancing clock; three concurrent focused repeats pass. Preserve original failure in final-e2e.json. No gameplay changes;420passing cases not repeated.

2026-11-10T20:00:25Z Q17 capture harness: returning through a lazy guide can preserve an open details section; unconditional click closed it before replay lookup. Check details.open before opening; resumed only missing captures/navigation. No product edit; both sizes pass and prior receipts retained.

2026-11-10T20:07:41Z: Film delivery resumed with the existing Pillow venv after the system Python lacked PIL. Original encodes were retained while creating storyboards. Visual review then found leading browser white frames; one recut removes them, with85s/62s real-speed clips and Sootultimate/Victory inspected. No new gameplay recording or measurement.

Q18: first gallery completed8views, then the harness looked for Settings immediately after import. Existing restoreEncounter intentionally returns to the imported route/home; no product failure. Harness now opens Settings again, retains captured images and completes both transfers/reset confirmations.16views/0browser errors accepted. Inspecting guide exposed older V4 enemy/status/phase copy; current V5 mechanics and A6 phase prose are now used only in A6.

Q18 render repair1: full guide and controls passed, but the embedded battle guide retained its dark panel while new field-note text was brown and card headings inherited cream. Inspected1440battle-guide exposed low contrast. Scoped parchment background/explicit card titles now match the A6 sheet, leaving legacy overlays unchanged. Retain successful pause/Escape/x3 receipts; recheck only embedded guide contrast at both sizes.

2026-11-10T20:25:56Z Q19 validation command mistakenly passed -- to Vitest, expanding to224files. Retained actual result1966pass/1fail; do not repeat broad suite. Correctly filtered5files reproduce31pass/1fail: B CardBossAtmosphere disposes motes twice and test still expects old3resources. Sent exact reproducer/cause in A6-OUTBOX; preserve B renderer ownership and continue unblocked UI work.

2026-11-10T20:39:18Z Q19 visual repair1: twenty initial captures/controls completed with0browsererrors, but inspection shows three-enemy boss preview hides its final helper/forecast at720p; placement controls are too small and replacement/plan summary is below the fold. Use three foe columns, 40px placement targets and move the existing replacement details beside Saved/Suggested. Forecast risk prose still used V4 even after the enemy card was corrected; use the existing A6 guide adapter for presentation only, preserving worker bands/seeds/results and all legacy prose. First Team capture caught lazy loading; wait for actual formation before recapture. Original receipts retained.

2026-11-10T20:40:59Z Q14 motion harness used an enemy action ID for Inkcap (a cat). One1440SpoolRam view already passed and is retained. Resume with real gallery IDs inkcap-2/cinnamon-2; only missing views, no product fix. Q19 final20views/controls remain accepted.

- 2026-11-10T20:46:21Z Q19 offline receipt: first harness waited only for the outer sheet, so six Team/guide/save captures show loading despite zero errors. Accepted tutorial/home/result/relic checks preserved. Repair readiness to require loaded content/buttons for all12lazy screens, then replace only those six captures; no app change or build rerun.

- 2026-11-10T20:52:11Z Q20 selector repair: decorative index numbers are correctly aria-hidden; two new UI tests and the initial gallery asked for those numbers in accessible names. Changed selectors to the actual friendship names; application unchanged. Preserve first1440collection view and resume remaining gallery only.

- 2026-11-10T20:53:24Z Q20 full-roster fixture: browser reviewer shortcut rejects grants unless offline mode is set; the fresh-to-full step omitted it, so Inkcap correctly stayed missing. Set reviewer offline before the existing unlock command; retain four accepted fresh1440 views/profile checks and resume full-roster/720p. No product change.

2026-11-10 Q21 repair1: all96skill checks and controls passed viewport bounds, but visual inspection showed the fresh locked-ultimate preview clipped by the720p sheet edge (bottom718px vs sheet~702px). Tightened the harness to the sheet clip, reduced unused gaps/tile height, and made the Skills-only hero100px at720p. Primary preview40px and effect text14px remain. First30captures retained separately. Also mapped passive status names through existing A6 glossary (Scalded→Burning), without changing rules. Initial type-only failure came from Playwright exact options in Testing Library; corrected selectors and types/lint/5UItests pass.

Q22 initial focused test:33tests pass; the second new dialog test incorrectly searches for “Mochi…Level” although the card uses “Lv.”. Corrected the selector to its existing cat name; no application fix. Typecheck/lint and the other33tests remain accepted.

Q22 browser repair1: first1440preview loaded with all actions/text inside the dialog. Native Shift+Tab from the first button moved focus to the browser/body even with the parent sheet trap suppressed. Added explicit first/last Tab wrapping within the native modal; preserve the first capture and recheck this changed keyboard boundary plus the remaining views. Escape continues to close only the preview.
Visual inspection of that initial preview also found the shell h2 colour overriding the light header. Added explicit cream heading colour; first capture/review retained under q22-preview-initial. Recheck only the new Q22 views, not accepted Q21 skills.

Q22 visual repair2: all16views and keyboard/account/preview checks passed, but Stats inherited pale labels and squeezed gear below the notes column. Opening Stats now uses that existing notes area, with an explicit Back to skill choices disclosure and13px brown labels. No rule/renderer change. Keep12unaffected views and recapture only stats/reduced views atbothsizes.
Q22 stats-only harness initially counted the intentionally hidden skill buttons as clipped actions. Filter the audit to rendered controls, and read actual dt labels (the shared Stats component uses dt/dd, not spans). Set13px directly on dt/dd; retain earlier keyboard and main preview receipts.

- Q23 offline fixture clock: saved earned state had a newer watermark than the fixed offline cafe clock, so daily readiness correctly appeared locked. resetCafeClock after fixture injection aligned the review clock; login/task/all3weekly public claims pass at both sizes. Test-data repair only; no source/reward change.

Q25 presentation repair1: initial locked-gifts extended8px below the720p sheet; compact gift grid/header restored all six actions. Repair2: final24-view visual inspection found enemy captions touching advice in the embedded active-route view. Bound images inside flexible figure rows with an explicit caption row; eight affected climb views pass11px/13px separation and zero overflow. Gift/control receipts retained; no gameplay changes.

Q26 gallery fixture assertion: ten1440views and all eight public claim deltas passed before a hard-coded gear count expected40 rather than the actual36 unique journal designs. Read the expected collection from journalV4, retain those captures/claims, and resume only outstanding1440views plus untouched1280coverage. No application change.

Q26 presentation repair1: inspection of the retained1280partial-cap view found the five ticket bottoms outside the book, despite all buttons passing the looser sheet-bound check. Tightened the affected-view audit to the actual book content edge and reduced ticket whitespace at720p, retaining14px reason text and40px actions. All36earlier captures/public-claim receipts retained; recapture affected Keepsakes views only.
Q26 presentation repair2: tightened audit found3.52px remaining overhang in partial-cap720p. The shared sheet label layout overrides the intended inline progress row; scoped the existing flex declaration to the Journal so progress returns to one line. This provides space without reducing text or buttons. Recheck only the twelve affected ticket views.
Q26 presentation repair3: the inherited flex-direction:column still kept progress on two lines. Explicit row direction fixes that confirmed cause; this is the final presentation repair loop. Existing claim/reward checks remain accepted.

Q26 offline gallery fixture: ten1440Journal captures and all public claims/caps/locks/navigation passed, then the separate Marigold setup called watchNow while an unentered active fixture route existed. That helper correctly preserves the active route and therefore never started a battle. Clear only the review fixture route before the separate gallery; retain accepted1440Journal checks and resume1440art plus untouched1280. No application change.

2026-11-10T22:36:00Z Q27: browser gallery passed controls but visual inspection found note seals inheriting24px SVG height and weak battle-category contrast. Explicit165/190pxheight and scoped selected/unselected palettes passed28focusedcaptures. Test-only unsupported exact options removed; scrollTop preserves index reset in browser and jsdom. Fourguide/settings tests and retainedfiveHUD tests pass; types/lint pass.

Q29 probe corrections: exact whole-save comparison included timed idle accrual; the retained probe now compares account/battle/team/rows/preferences/gear. Pantry Crown begins with two Binding Thread helpers, so the expected card count follows battle actors rather than initial enemy IDs. No application changes for either assertion.
Q29 presentation repairs: prior first repair compacted the enemy heading/forecast after a1440boss note overran. The continued720p audit found44.75px overhang from the formation grid plus a long boss note. Repair2 uses an inline crew Power label, smaller table padding/112pxcrew art,72pxfoe art and tighter panel gaps;15pxmechanic/counter text and40pxrow controls stay intact. Prior20captures/control receipts retained; recapture affected720p only.

Q30 gallery correction: retained1440prepare shows no content under Fight; the audit compared the stretched aside border (1.44px past the sticky border) instead of its final child. Measure actual content. Await loaded formation before fresh capture and clone directly mutated review fixtures so memoized suggestions see the granted roster. Prior eighttests/types/lint and1440 public save/restore/replacements retained; resume outstanding controls, no app change.

Q30 presentation repair1:34source views/control checks pass, but visual review found Team pair badge6.74px beyond720p sheet and a clipped final disabled-roster label at1440. Reduce only table mat/padding/hint whitespace at720p (cat art unchanged), and locked-dialog roster art80→68px. Audit actual pair/content boundary and zero inner roster clipping; recapture eight affected views only.

Q32 presentation attempt1: initial gallery had no clipping, but larger first star chest shared16px of the Tea Cart transparent hit box. Move that chest from37% to35% horizontal position; preserve every node/path/reward coordinate and command. Recheck affected route geometry with the remaining choice coverage.

2026-11-10T23:47:11Z Q33 presentation repair1: source1440 all10states/control checks pass;720p full12hour amounts wrap to a second line, extending the corner6.36px into the map shortcut. Keep13–14pxlabels/42pxfast action and reduce only720p tip illustration101→85px. Retain1440 acceptance and resume affected720p states plus earned Tower layout.

- 2026-11-10T23:50:13Z Q33 saved-image review exposed discovery toast stretched from top86px to legacy bottom130px, covering the tip box after a claim. Clear bottom to auto in the A6 home rule; preserve content/dismissal/timers. Recheck affected current images before acceptance.

- 2026-11-10T23:52:43Z Q33 check invocation used pnpm test -- files, which forwarded a literal -- and unexpectedly ran2000web tests (all pass). Corrected future focused calls to pnpm exec vitest run files. No second full-suite run. Shared origin ref advanced to published BP36 before merge:96531256b includes bothP35/P36; package will inspect both units.

2026-11-11T00:12:32Z Q34: retained variant shots exposed reward flecks persisting after currency decreased before1100ms. Two normal/reduced-motion regressions failed; one-line reset of flecks on a nonpositive delta passes both. Core settlement untouched. Header contrast and nested-dialog keyboard propagation were repaired in retained source checks; probe selector failures were corrected without changing gameplay.

- 2026-11-11T00:34:26Z Q36: retained detail captures reproduced stale reading scroll after page/cat/item changes. Key only the reading pane by its content context; actual browser verifies resets and preserves same-item upgrade scroll. Types/lint pass. A pnpm test double-dash unintentionally ran all2005web tests; all passed. Do not repeat; future targeted runs use pnpm --filter @taskbar-hero/web exec vitest run <path> without extra --.

Q38: Initial unit failures were invalid free-row/Tower fixtures and an uncapped poor fixture that still earned consolation supplies. Corrected the fixtures, retaining public rules;13 tests pass. Browser continuation selector corrected for an aria-hidden arrow;13 accepted1440 states retained. First720 capture showed the new status/cost expanding the receipt27px into its footer (448px receipt). Use one three-column reward row for compact defeat receipts; keep14px copy/44px advice button and the existing reward amounts.

2026-11-11T01:10:41Z Q39 browser audit: first1440 image is visually clear; the assertion repeated the Q30 stretched-aside-border error (1.44px beyond sticky bar) although final content ends at702px, before797px footer. Measure actual last-child content for overlap, retain initial image and all9tests/type/lint results. No app change.

Q39 lifecycle fixture: all13 foe controls and16 captures at1440 passed, then whole-state equality included live idle accrual. Compare unchanged account/battle/team/rows/preferences/gear as in the already-accepted Q29 probe; keep catalogue checks/captures and resume outstanding worker lifecycle. No application change.

Q39 presentation repair1: unavailable forecast text widened the first auto grid column and squeezed Scout their plan into three lines, overflowing the1440 footer by41px. Use wrapping rows for pending/unavailable only, keep ready presentation, and correct the Prepare fallback to point to the enemy note above. Recapture affected states; ready/catalogue captures and controls retained.

Q39 presentation repair2: all1440 worker/Fight controls passed. At720 Rain Spool ready note ended1.63px into the footer; compact only note whitespace while retaining15px body/14px metadata and all art. Pending/unavailable has no probability claim, so show its explicit state/instruction without the result-only disclaimer. Retain completed controls; recapture affected layout and verify longest Pantry Crown note with all worker states.

2026-11-11T01:26:59Z Q40 presentation repair1: all13large views and public controls pass;720 locked gifts extend their44px buttons roughly6px through the parcel bottom. Compact only the gift-banner decorative eyebrow/portrait at720 (52px), retaining its23px title/14px copy, all parcel text and44px actions. Gains about20px for the two parcel rows; retain1440 checks and six Tower tests/types/lint.

- Q41 browser probe correction: the reused Q26 script expected40gear from a fixture explicitly installing36designs. Current public claims award no gear. Exact eight-claim deltas had already passed; correct the probe to36 and resume after the accepted1440collection view. No application fix or repeated unit run needed.

- Q41 presentation repair1: fourteen-pixel labels and44px actions make the720p partial-cap keepsake tickets overhang the book inner edge by3.453px. Trim seven pixels of header/page-divider spacing; retain all copy and action sizes. Recheck the affected720p page/state matrix only; accepted1440views and47tests retained.

- Q41 visual repair2: inspection caught capped720p star parcels exceeding their inner board even though buttons stayed onscreen. Widen the existing reward column and tighten only card/header spacing; raise inherited tiny CostView text to14px too. Extend geometry audit to the parcel edge and inspect the affected discovery states at both sizes. Public claim/history checks are retained.

Q44 presentation repair1: preserved52-view gallery confirms selecting lower roster cards scrolls quick training offscreen, Cinnamon preview exceeds720p, and shared passive-small specificity leaves unlock reasons12px. Bound the roster inside the existing grid, keep training fixed, allow only long skill text to scroll beside a visible preview action, compact skill-header whitespace/art and correct unlock specificity. Retain exact public-command/11-test results; recheck affected presentation.

Q44 presentation repair2: visual inspection catches essential unlock requirements partially clipped inside the new bounded skill note despite all controls passing. Reduce only the skill-header art/whitespace at both sizes and inter-section padding at720p, retaining14px text/44px actions and large roster art. Extend acceptance to require all current skill/unlock notes fully visible; retain exact-command results.

Q44 presentation repair3: only720p unowned Velvet retains6px of note overflow. Trim7px of paragraph/unlock spacing without changing text size, art or controls. Recheck that boundary plus the two longest ultimates; all prior public command and other layout checks remain retained.

- 2026-11-11T02:19:34Z Q45 presentation attempt1: ready rank-one receipt clipped Awaken by31px at720p. Keep14px text/44px action, remove repeated eligibility sentence (actual blocked reason remains), reduce only open-receipt header art128→100px. Initial audit also counted closed native-details children; use browser checkVisibility to exclude unpainted controls. Preserve first gallery and public transaction evidence; recheck current views.

2026-11-11T02:32:02Z Q46 probe: corrected a testing-library selector to Playwright getByLabel; retained four existing captures. Manual HP jumps froze hit-flash while paused; four settled captures now advance the public gallery playback briefly before pause, without renderer changes. Original images retained, superseded for visual acceptance.

Q47: initial unit harness used spyOn for missing jsdom native-dialog methods; corrected test-only bounded polyfill,18tests pass. First browser gate showed native Tab can leave the dialog for browser chrome; explicit first/last wrap added. Background inertness and paused clocks already passed.

2026-11-11T02:54:37Z Q48: first browser continuation found Tower focus returned to the previous entry because HomeScene called m.go directly. Smallest fix passes Shell go as onTower; all three signs/dock/Escape focus checks pass at both sizes. Original7accepted source frames retained;14tests retained, final types/lint and7B scale/staging tests pass.
