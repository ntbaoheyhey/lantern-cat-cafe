# C11 — quality checkpoint, 11 November 2026

The continuous quality pass remains open. Preserved C0–C10, both complete raw UI accounts and the three C5 seed cohorts. Scored 31 screens at both requested sizes, plus retained battle shots. The clean x1 account completed 1,800.25 seconds with 15 wins / 4 losses; first loss 6.56 minutes, normal median 54.33 seconds, boss median 170.77 seconds, normal-win HP median100%. Same-node recovery2/4 is descriptive only. No fourth tuning round. Full method and limitations: C11-SESSION-NOTES.md. Weighted score7.745/10, below8.5.

Fixed the recruitment summary retaining153–203px scroll at900p: scroll to top and focus its heading after animated and reduced-motion reveals. Clarified field-guide stack/ultimate text using the existing status icons. Disabled premature fallback advice while its comparison runs. A real browser check then exposed discovery acknowledgements cloning the battle and restarting comparison; exact setup/run/node content now identifies an encounter, while build changes still invalidate advice. The unchanged eight-second timeout enables review without buying.

Verification:26 focused component tests (16advice,5recruit,5guide/settings), workspace typecheck/lint and git diff --check pass. The first focused command used an incorrect guide test path, so its21cases were supplemented by a separate correct5case invocation; no missing test is counted. Controlled browser check: six captures at1280×720/1440×900, all inspected, no overflow/broken images/errors; completed comparison survives receipts, exactly one worker per encounter, timeout opens the fallback review. The failed initial browser receipt is preserved. Original evidence from two full421caseE2E gates predates this advice fix; it is not represented as a fresh full suite.

Earlier visual checks retained:62baseline screens,12recruit replacements,2guide captures and4battle captures. Evidence folder remains about28MB (<120MB); demo stays28.82MB (<40MB). Designer inbox contains only README;0/25final exports,25placeholders, currentMochi117layer pilot still source-PARTIAL. No designer/source edits, main/deploy/contract changes or acceptance-seed replays.

Next: continue the weakest actionable screenshot/UX issues, check designer arrivals per item, and refresh the final report at20November06:00UTC. Report date is not a claim that all targets have passed.

Equipment follow-up: the existing auto-equip action now shows its free rounded team Power gain and owned-gear source; active routes explain the lock, and fully equipped teams show no stronger gear. A separate controlled review account copied only the recorded crew/cards/owned gear: +641 preview matched the actual +641 result on Cats, Team and Bag at both sizes, with identical currencies and the public command’s exact equipment map. Ten captures inspected (two contact sheets plus full-size720pCats); controls and first roster row remain visible, no overflow/broken images/browser errors. Nine existing focused tests, workspace typecheck/lint passed before resumption; retained their logs, no rerun. Reproducible harness: tools/cardrpg-c/equipment-review.mjs; receipt shots/c11-equipment/review.json. This is UI/transaction evidence only, not a new balance cohort or recovery-rate claim.

Painted stage follow-up: original empty cafe painting with three parallax regions, seamless feathered glass/floor joins and procedural loading/failure fallback. Delayed, corrupt/retry and disposed-scene checks pass at both sizes; 11 focused tests plus workspace typecheck/lint pass. Final offline p95 16.7–16.8ms, 60 draws, zero face/HP mask violations/errors/HTTP. Demo29.21MB; original fight clips visibly labeled as preceding the backdrop update. Captures inspected; full details in C11-STAGE-RECEIPT.md. Latest weighted visual score7.79; gameplay measurements and limits unchanged.

Impact playback follow-up: fixed the hostile flash staying on after every gallery particle ended. Expiry uses the presentation clock, so pause is stable and advancing samples clear the flash.60cases each in source/offline at both sizes/x1–x3/motion variants pass;16final captures inspected,11focused tests and final workspace types/lint pass. Initial compiler guard issue is retained in logs. Offlinep95 16.7ms at both sizes/60draws/0maskfailures/errors/HTTP;demo29.21MB. C11-IMPACT-RECEIPT.md contains scope and evidence. Score7.79unchanged.

Patrol follow-up: explicit free +641 owned-gear action now appears beside Night Patrol before route locks, after onboarding.16browserchecks/14inspectedcaptures/11existingfocusedtests/types/lintPASS; unchanged currencies, exact gear in Prepare, focus on Patrol, correct onboarding/route guards and skippable action. C11-PATROL-RECEIPT.md; no recovery claim or score change.

VFX timing follow-up: late caster-anchored paint now fires at hit rather than exhausting during windup.888source+888offlinecases,12battlecases and six real Pause/Play checks per gallery pass;12focusedtests/types/lintPASS. Offline22/battle12/performance2captures inspected, p9516.7–16.8ms/60draws, sweep peak61. Manual forced-redraw equality remains PARTIAL in four cases after three attempts; diagnostic retained. Kettle Knight legacy friendly recipe is the next semantic repair. C11-VFX-CUES-RECEIPT.md; score7.79unchanged.

Kettle follow-up: damaging signature now uses hostile spout/steam paint and actual acting-unit damage recipients; opening self-shield/reflections are excluded.72actual-enemy+888source+888offlinecases/14focusedtests/types/lintPASS;14finalbattle+22source+22offlinecaptures inspected.56drawbattle/61gallery,0mask/drop/error;forced-redraw4differences remainPARTIAL. Demo29.21MB, score7.79unchanged; C11-KETTLE-RECEIPT.md.

Utility checkpoint: see C11-UTILITY-RECEIPT.md. Actual charge and support now avoid false shake; charged-row/Daze damage preserved.29focusedtests,96battle,16live,48source/48offline,34finalviews allPASS. No gameplay or score change.

Cat outcome checkpoint: C11-CAT-RECEIPT.md.624full combat+120final focused+24live,576source+576offline and six playback controls eachPASS;46final captures inspected. Final29tests/types/lint/galleryTS pass; full-sweep peak101draws. Demo29.22MB/evidence91.03MB; no gameplay/score/new performance claim.

Framing checkpoint: C11-FRAMING-RECEIPT.md. Animated geometry guides ultimate zoom/recentering; reduced motion fixed.240source+144offline/sixPausePlay/12tests/types/lintPASS;20finalcaptures inspected. Clearance4.16px,catspread3.6%,boss51.66%;70maxdrawsource. Offlinep9516.8ms/60draws,0mask/HTTP/errors. Demo29.225MB/evidence105.81MB;score7.79unchanged.

Roster checkpoint: C11-ROSTER-RECEIPT.md. Eight baseline order mismatches fixed; 20 public preview cases and 10 lifecycle cases pass. Preserved 30 focused tests/types/lint; 240 source framing/144 offline/six playback controls pass, 26 final captures inspected. Demo29.225MB/evidence111.0MB; score/gameplay unchanged.

Pending actor checkpoint: C11-PENDING-RECEIPT.md. Six cold-load failures fixed; 6 current +10 retained lifecycle checks, 526 offline switches/six batches/two playback controls, 34 focused tests/types/lint pass. Four final captures inspected. No gameplay/score claim; demo29.226MB/evidence111.87MB.

Loading clock checkpoint: C11-LOADING-CLOCK-RECEIPT.md. Four delayed actor playback failures fixed; four browser/two offline smoke/two controls/56 focused tests/types/lint pass. Eight final views inspected; demo29.226MB/evidence113.75MB. No gameplay/score/performance claim.

Ultimate silhouette checkpoint: C11-ULTIMATE-PAINT-RECEIPT.md.144source/144battle/144offline/two controls/30focused/types/lint/galleryTS pass;38views inspected. Peak99battle/60gallery draws; offline x1 p9516.8/16.7ms,57sampledraws. Demo29,226,021bytes/evidence118.70MB. No gameplay/score change.

Asset recovery checkpoint: C11-ASSET-RETRY-RECEIPT.md.4browser failures ->4PASS;12focused/types/lint;2offline smoke/10changes/2controls;4views inspected. Demo29,226,045bytes/evidence119.21MB;score/gameplay unchanged.

PNG intake checkpoint: C11-PNG-GATE-RECEIPT.md.2falsePASS corrupt PNGs ->FIX;41tests plus15final diagnostic checks/types/lintPASS;25published placeholders retained. No browser/art/demo change;29,226,045bytes/evidence119.19MB. Score/gameplay unchanged.

Event fallback checkpoint: C11-EVENT-FALLBACK-RECEIPT.md.4baseline misses ->120sourcePASS;30focused/types/lint,2offline smoke/10changes/2controls/4inspectedviewsPASS. Demo29,226,081bytes;large diagnostics outside git. No gameplay/score/performance claim.

Active format checkpoint: C11-ACTIVE-FORMAT-RECEIPT.md.2baseline browser failures->10sourcePASS;32focused tests across runs/types/lint/2offlinesmoke/2controls/4viewsPASS. Demo29,226,105bytes;large diagnostics outside git; no gameplay/score/performance claim.

Override cue checkpoint: C11-VFX-OVERRIDE-CUE-RECEIPT.md.4baseline misses->192sourcePASS;20focused/types/lint/2offlinesmoke/2controls/4finalviewsPASS. Demo29,226,565bytes; no gameplay/score/performance claim.

Override pool checkpoint: C11-VFX-POOL-RECEIPT.md.4baseline cases/5regressions fixed;24source/96contacts/24gap reuses/16focused/types/lint/2offline/2controls/4finalviewsPASS. Demo29,226,665bytes; no gameplay/score/performance claim.

Gear-slot checkpoint: C11-GEAR-SLOTS-RECEIPT.md.10baseline mismatches->20browser checksPASS;20focused/types/lintPASS;16captures inspected,2retained. Empty slots open the correct shelf; general Bag entry resets. Static demo29,226,665bytes unchanged; evidence119.54MB; score/gameplay unchanged.
