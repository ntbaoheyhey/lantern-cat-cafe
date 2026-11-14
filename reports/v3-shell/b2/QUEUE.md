# V3B2 queue

Revision 2, 13 November 2026. A card is done only with all checker PASS lines below its entry.

- [x] G0 — done (self-score 8/10 for acceptance tooling; production quality not yet scored)
- [x] R — done (self-score 8/10; spectral proxies explicitly qualified)
- [x] S1 — done (self-score 8/10 for plan/coverage; sound production remains pending)
- [x] S2 — done (self-score 8/10 for library/licence integrity; shipped sound design pending)
- [x] S3 — done (self-score 8/10 for layered playback; final mix and new voices pending)
- [ ] S4 — reopened: identity/levels PASS; integrated current A cadence was not refreshed (trial38 raw median2.980s, required6–9s). No threshold reinterpretation.
- [x] V — done (50/50 ultimates,62/62 skills,12/12 identities,212/212 levels;34/34 battle casts; full37 suite435 browser PASS; self-score8/10)
- [x] U1 — done (53 actual states, private comparisons; self-score 8/10 for audit depth, UI quality remains below target)
- [x] U2 — done (76 original exports, 3.998 MB; self-score 8/10 for kit quality; screen acceptance belongs to U3)
- [x] U3 — done (9/9 gates;54/54 states,108 desktop and24 phone captures;435/435 browser cases; self-score8/10, remaining visual limitations in q6/CRITIQUE.md)
- [x] U4 — done (62s audible tour, median 60 fps, all shifts below 0.05; self-score 8/10)
- [x] S5 — done (six full37 renders, every numeric gate PASS;90.054s reel; mixed recognition7/12 battle and7/12 boss disclosed in q5/CRITIQUE.md; self-score8/10)
- [x] S6 — done (795/802 activations, 54 states; self-score 8/10)
- [x] S7 — done (867/867 cues, static browser playback; self-score 8/10)
- [x] E1 — done (18 scenarios, 200 seeds each, 1,000 native C2 accounts; 1,737.34s cold run; self-score 8/10 for model integrity, targets still fail)
- [x] E2 — done (three deterministic sinks in rules/server/UI and model; Anvil screenshots and exact burns; self-score 8/10)
- [x] E3 — done (17/17 gates;24 rounds,1273 configs,top10 at200 seeds,5 structural changes,18 scenarios,T-a..T-h PASS;85 assumptions,170 cases; self-score8/10)
- [x] E4 — done (4/4 gates;16 exact-policy Anvil receipts,3 sinks,18 desktop shots,5 odds tests; self-score8/10)
- [x] E5 — done (3/3 gates;816/816 committed citations; final sensitivity and15-line Vietnamese summary; self-score8/10)
- [x] T1 — done (90/90 steps at three widths;0 fallback,4/4 gates;435 browser PASS; self-score8/10)
- [x] C1 — done (3/4 live Fuji counters;bounded public RPC,offline test,3/3 gates; self-score8/10)
- [ ] E6 — todo
- [ ] P — todo
- [ ] SY1 — todo
- [ ] SY2 — todo
- [ ] SY3 — todo

Syncs interrupt the active card at 16 / 18 / 19 November, 12:00 UTC.

## Polish backlog

- [x] P1 — done;361/361 layers have six distinct decoded variants;S3 eight gates PASS;production unchanged;self-score8/10;ENDED 2026-11-13T23:56:30.140143+00:00
- [x] P2 — done;24/24 phases;S1/S3/S5/S7/V all PASS;current suite435/435;self-score8/10;ENDED 2026-11-14T00:30:00.219584+00:00; STARTED 2026-11-13T23:57:22.827701+00:00;distinct elemental material palettes within unchanged byte budget
- [ ] P3 — STARTED 2026-11-14T00:32:12.449560+00:00;authoring independent ambience/music assets while S4 pilots run;acceptance waits for cadence outcome
- [ ] P4 — todo
- [ ] P5 — todo
- [ ] P6 — todo
- [ ] P7 — todo
- [ ] P8 — todo
- [ ] P9 — todo
- [ ] P10 — todo
- [ ] P11 — todo

## G0 evidence

PASS G0.inventory: measured 24; required every required card has gates and thresholds

PASS G0.tests: measured 14; required passing test + SHA-256-verified log

Checks: tests/g0-unit.log, tests/g0-types.log, tests/g0-suite.log. Full local suite passes; 2 expected failures and 11 existing skips in game rules remain explicitly reported.

## R evidence

PASS R.windows: measured 10; required >= 10 measured windows with all metrics, or logged videos missing
PASS R.candidates: measured 755; required >= 120 candidate files with licence URLs
PASS R.levers: measured 10; required >= 8 new economy levers with file:line
PASS R.report: measured 8146; required nonempty reports/v3-shell/b2/RESEARCH-B2.md

Checks: tests/r-analysis.log (5), tests/r-types.log, tests/r-suite.log. Full local suite passes; 2 expected failures and 11 pre-existing skips remain disclosed. No reference audio was saved.

## S1 evidence

PASS S1.events: measured 2497; required >= 160 complete events; 0 TBD
PASS S1.screens: measured 49; required >= 18 screens
PASS S1.existingCues: measured 0; required 0 existing cues absent; >= 1 inspected
PASS S1.callsites: measured 0; required 0 unresolved playCue sites; >= 1 inspected
PASS S1.report: measured 606357; required nonempty reports/v3-shell/b2/SOUND-MAP.md
PASS S1.typedMap: measured 12537; required nonempty apps/web/src/audio/sound-map.ts

Checks: tests/s1-map-unit.log (3), tests/s1-coverage.log (3), tests/s1-types.log, tests/s1-final-types.log, tests/s1-suite.log. Web 2,488 and server 724 pass. Existing game-rule expected failures/skips remain reported.

## S2 evidence

PASS S2.clips: measured 593; required >= 350 usable hashed source clips
PASS S2.catRecordings: measured 22; required >= 15 distinct original recordings
PASS S2.catAuthors: measured 18; required >= 6 cat-recording authors
PASS S2.consonants: measured 76; required >= 40 consonant/mouth/click grains
PASS S2.ambience: measured 11; required >= 6 ambience beds
PASS S2.music: measured 12; required >= 8 music pieces
PASS S2.stings: measured 18; required >= 8 stings
PASS S2.licenceCoverage: measured 1; required 100% source and shipped audio files with licence, author, URL, date, SHA-256
PASS S2.licences: measured 0; required 0 non-commercial, unlicensed, or disallowed licence rows

Checks: tests/s2-source-verify.log (989 files, zero errors), tests/s2-python.log, tests/s2-source-unit.log, tests/s2-types.log, tests/s2-suite.log. Web 2,488 and server 724 pass; game-rule expected failures/skips remain disclosed.

## S3 evidence

PASS S3.hitLayers: measured 106/106; required each battle hit >= 3 layers
PASS S3.hitVariants: measured 106/106; required each hit layer >= 4 variants
PASS S3.uiVariants: measured 58/58; required each UI cue >= 2 variants
PASS S3.repeats: measured 0; required 0 consecutive identical variants in >= 180s auto battle
PASS S3.sfxConcurrency: measured 14; required <= 14 sfx including layers
PASS S3.voiceConcurrency: measured 1; required <= 1 voice
PASS S3.bytes: measured 5618061; required <= 16000000 bytes incl. callouts
PASS S3.cpu: measured 2.1909003031056833; required < 8% added main-thread time, 180s paired traces

Checks: tests/s3-verified-types.log, tests/s3-verified-suite.log, tests/s3-restored-audio-tests.log, tests/s3-source-verified.log. Web 2,497 and server 724 pass; game-rule 2 expected failures and 11 existing skips remain disclosed. The repaired 180-second paired traces and logs are saved with hashes in AUDIO-PERFORMANCE.json and AUDIO-BATTLE.json.

## S4 evidence

PASS S4.cats: measured 12; required >= 12 cats, >= 9 lines each
PASS S4.consonants: measured 12/12; required each rendered line >= 0.5 consonants/syllable
PASS S4.distinct: measured 12/12; required nearest MFCC >= source p25; F0 >= 3 semitones OR different source
PASS S4.loudness: measured 12/12; required -16 LUFS +/- 1
PASS S4.cadence: measured 7.563; required median voice interval 6-9s
PASS S4.lines: measured 5873; required nonempty reports/v3-shell/b2/VOICE-LINES.md

Checks: tests/s4-types.log, tests/s4-suite.log, tests/s4-browser.log; web 2,499 and server 724 pass. Paired 180-second traces: 4.525% added main-thread time, no console errors, cadence median 7.563 seconds, one voice and at most 14 SFX layers. All 216 takes and 12 identities meet loudness/consonant/distinctness gates. Existing game-rule expected failures and skips remain disclosed.

## V permitted PARTIAL evidence

PASS V.coverage: measured 25/25; required 100% playable, elite and boss active skills + ultimates from rules

PASS V.variants: measured 50/50; required >= 2 takes per ultimate line

FAIL V.ultAccuracy: measured 32/50; required recogniser word accuracy >= 0.7

FAIL V.skillAccuracy: measured 59/62; required recogniser word accuracy >= 0.5

PASS V.distinct: measured 12/12; required S4 distinctness holds for callouts

PASS V.battle: measured 0; required 0 missing ultimate callouts; music ducks; >= 180s

PASS V.levels: measured 212/212; required -16 LUFS +/- 1, peak <= -1 dBTP

PASS V.lines: measured 2815; required nonempty reports/v3-shell/b2/VOICE-CALLOUTS.md

Acceptance checker confirms the permitted recognition-only PARTIAL condition with 9 measured iterations. Checks: tests/v-types.log, tests/v-suite.log, tests/v-source-final.log; exact misses and current hashes: VOICE-CALLOUTS-VALIDATION.json.

## U1 evidence

PASS U1.screens: measured 53; required >= 24 states, screenshots, all metrics and fix lists

PASS U1.report: measured 17010; required nonempty reports/v3-shell/b2/UI-AUDIT.md

Checks: tests/u1-types.log, tests/u1-suite.log (2,503 web and 724 server tests pass; existing rule expected failures/skips remain disclosed). Real campaign victory/defeat verified by tests/u1-campaign-results-2.log. All 53 private comparisons are outside the repository. Baseline: 26 states exceed 25 words, 42 exceed two plain buttons; no U3 completion claimed.

## U2 evidence

PASS U2.files: measured 76; required >= 60 new art files with provenance

PASS U2.bytes: measured 3997810; required <= 8000000 bytes new UI art

PASS U2.inputs: measured 76/76; required 0 reference frames as generator inputs; text/own images only

PASS U2.sheet: measured 947189; required nonempty reports/v3-shell/b2/shots/ui-kit.png

Checks: tests/u2-types.log, tests/u2-suite.log (2,503 web and 724 server tests pass; 2 expected rule failures and 11 existing skips retained), tests/u2-browser.log (76/76 images, font loaded, zero errors/overflow). Typography and icon lint pass. Original kit reviewed at small display sizes and as stretched frames; generator source-size limits disclosed in UI-ART.json.

## U3 permitted PARTIAL evidence

PASS U3.screens: measured 54; required >= 24 rebuilt screens

PASS U3.coverage: measured 53/53; required every U1 screen rebuilt

PASS U3.images: measured 54/54; required 1280x720 AND 1440x900 before/after images per screen

PASS U3.words: measured 54/54; required <= 25 visible words every screen

FAIL U3.buttons: measured 53/54; required <= 2 plain text buttons every screen

PASS U3.fonts: measured 0; required 0 system fonts

PASS U3.glyphs: measured 0; required 0 Unicode glyph icons

FAIL U3.scores: measured 32/54; required average >= 8; every criterion >= 7

PASS U3.flows: measured 108; required passing test + SHA-256-verified log

The checker confirms the permitted PARTIAL condition. All 53 baseline states plus the new batch dialog have before/after comparisons at both sizes. Visual quality remains below target in 22 states; protected A preparation has four plain buttons. See UI-REBUILD.md and U3-ITERATIONS.md. Local suite and type evidence: tests/u3-accept-suite.log, tests/u3-accept-types.log, tests/u3-accept-final-web-types.log. No full U3 acceptance is claimed.

## U4 evidence

PASS U4.tour: measured 62; required >= 60s WebM with sound, <= 25000000 bytes

PASS U4.cls: measured 0; required 0 layout shifts > 0.05 CLS

PASS U4.fps: measured 60; required median >= 60 fps in panel transitions

PASS U4.reducedMotion: measured 16; required passing test + SHA-256-verified log

Checks: tests/u4-types.log, tests/u4-suite.log (2,514 web, 724 server; 1,388 rules with 2 expected failures and 11 existing skips), tests/u4-motion-unit-targeted.log (16), tests/u4-reduced-motion.log (16 browser assertions), tests/u4-gate-unit.log (14). The 62-second real menu tour has output audio and is 6.7 MiB. Video encoding and runtime FPS were measured separately; both raw traces are retained in UI-MOTION.json.

## S5 permitted PARTIAL evidence

PASS S5.algorithm: measured 6/6; required same current measurement algorithm for references and all six non-diagnostic renders

PASS S5.battle.render: measured 180.20099773242632; required >= 180s measured Opus render

PASS S5.battle.onsetsPerSecond: measured 3.396207610951943; required reference +/- 30% (reference 2.6333333333333333)

PASS S5.battle.layers: measured 0.4493464052287582; required >= reference median - 0.5

FAIL S5.battle.tickTransientsPerSecond: measured 1.7813441880973424; required reference +/- 40% (reference 0.6499999999999999)

PASS S5.battle.music: measured 1; required music bed >= 95%

FAIL S5.battle.voiceContoursPerMinute: measured 2.330730713398392; required reference +/- 35% (reference 5)

PASS S5.battle.silence: measured 0; required <= reference + 3 percentage points

PASS S5.battle.lufs: measured -14.38; required -16 to -13 LUFS

PASS S5.battle.peak: measured -1.77; required <= -1 dBTP

PASS S5.boss.render: measured 120.19800453514739; required >= 120s measured Opus render

PASS S5.boss.onsetsPerSecond: measured 3.302883450813963; required reference +/- 30% (reference 2.6333333333333333)

PASS S5.boss.layers: measured 0.44080604534005036; required >= reference median - 0.5

FAIL S5.boss.tickTransientsPerSecond: measured 1.3893741468159493; required reference +/- 40% (reference 0.6499999999999999)

PASS S5.boss.music: measured 1; required music bed >= 95%

FAIL S5.boss.voiceContoursPerMinute: measured 2.9950580410403695; required reference +/- 35% (reference 5)

PASS S5.boss.silence: measured 0; required <= reference + 3 percentage points

PASS S5.boss.lufs: measured -14.63; required -16 to -13 LUFS

PASS S5.boss.peak: measured -1.44; required <= -1 dBTP

PASS S5.home.render: measured 60.20199546485261; required >= 60s measured Opus render

PASS S5.home.onsetsPerSecond: measured 4.086243289786313; required reference +/- 30% (reference 3.6666666666666665)

PASS S5.home.layers: measured 1.5609756097560976; required >= reference median - 0.5

FAIL S5.home.tickTransientsPerSecond: measured 5.165941720014404; required reference +/- 40% (reference 8.9)

PASS S5.home.music: measured 1; required music bed >= 95%

FAIL S5.home.voiceContoursPerMinute: measured 0; required reference +/- 35% (reference 2)

PASS S5.home.silence: measured 0; required <= reference + 3 percentage points

PASS S5.home.lufs: measured -17.52; required -20 to -16 LUFS

PASS S5.home.peak: measured -4.06; required <= -1 dBTP

PASS S5.bag.render: measured 60.19800453514739; required >= 60s measured Opus render

PASS S5.bag.onsetsPerSecond: measured 4.086514194276485; required reference +/- 30% (reference 3.7)

PASS S5.bag.layers: measured 1.4308943089430894; required >= reference median - 0.5

PASS S5.bag.tickTransientsPerSecond: measured 5.249343436550281; required reference +/- 40% (reference 8.466666666666667)

PASS S5.bag.music: measured 1; required music bed >= 95%

FAIL S5.bag.voiceContoursPerMinute: measured 0; required reference +/- 35% (reference 2)

PASS S5.bag.silence: measured 0; required <= reference + 3 percentage points

PASS S5.bag.lufs: measured -17.68; required -20 to -16 LUFS

PASS S5.bag.peak: measured -3.69; required <= -1 dBTP

PASS S5.gacha.render: measured 60.19800453514739; required >= 60s measured Opus render

PASS S5.gacha.onsetsPerSecond: measured 4.136349733231076; required reference +/- 30% (reference 3.966666666666667)

PASS S5.gacha.layers: measured 1.5823293172690762; required >= reference median - 0.5

FAIL S5.gacha.tickTransientsPerSecond: measured 4.850659124913551; required reference +/- 40% (reference 8.233333333333333)

PASS S5.gacha.music: measured 1; required music bed >= 95%

PASS S5.gacha.voiceContoursPerMinute: measured 0; required reference +/- 35% (reference 0)

PASS S5.gacha.silence: measured 0; required <= reference + 3 percentage points

PASS S5.gacha.lufs: measured -17.88; required -20 to -16 LUFS

PASS S5.gacha.peak: measured -5.7; required <= -1 dBTP

PASS S5.forge.render: measured 60.19800453514739; required >= 60s measured Opus render

PASS S5.forge.onsetsPerSecond: measured 4.136349733231076; required reference +/- 30% (reference 4.4)

PASS S5.forge.layers: measured 1.4538152610441768; required >= reference median - 0.5

FAIL S5.forge.tickTransientsPerSecond: measured 5.099836819686507; required reference +/- 40% (reference 3.433333333333333)

PASS S5.forge.music: measured 1; required music bed >= 95%

FAIL S5.forge.voiceContoursPerMinute: measured 0; required reference +/- 35% (reference 2)

PASS S5.forge.silence: measured 0; required <= reference + 3 percentage points

PASS S5.forge.lufs: measured -17.74; required -20 to -16 LUFS

PASS S5.forge.peak: measured -3.5; required <= -1 dBTP

PASS S5.duck: measured {"db":-8,"attackMs":120,"releaseMs":400}; required -8 dB, 120ms attack, 400ms release

PASS S5.chart: measured 87147; required nonempty reports/v3-shell/b2/shots/audio-vs-ref.png

PASS S5.reel: measured 90.045; required >= 90s sound reel

Historical S5 evidence below describes11-room-tails on the old battle timing. Q2 resolves S5-A-VOICE-WINDOW on current A. Current S5 is open for B mix failures, not PARTIAL on an A blocker. The earlier six renders and reel are retained; numeric acceptance remains unchanged.

S5 checks: tests/s5-types.log and tests/s5-suite.log pass (2,521 web, 724 server; 1,388 rules plus 2 expected failures and 11 existing skips). tests/s5-source-final.log verifies all audio provenance and hashes. Acceptance remains PARTIAL, never done.

## S6 evidence

PASS S6.coverage: measured 0.9912718204488778; required >= 95% interactive elements emit mapped cue
PASS S6.errors: measured 0; required 0 console audio errors
PASS S6.gaps: measured 3.54167; required no music silence > 400ms during screen changes
PASS S6.settings: measured 15; required passing test + SHA-256-verified log

Checks: tests/s6-accept-types.log and tests/s6-accept-suite.log (2,532 web, 724 server, 1,388 rules; two expected failures and eleven existing skips). Fifteen real mixer assertions verify amplitude, isolated buses, mute and reload persistence. Seven inconclusive fixture activations remain listed in UI-AUDIO.md and count against coverage. No public transactions.

## S7 evidence

PASS S7.coverage: measured 1; required 100% mapped cues listed in lab
PASS S7.random: measured 20; required >= 20 random cues from static server, 0 errors

Checks: tests/s7-types.log, tests/s7-suite.log (2,532 web and 724 server; existing rules expected failures/skips retained), tests/s7-static-browser.log. Static lab plays twenty seeded random cues, randomises layered variants and previews editable text for all twelve cats. Production engine and licensed source grains are used locally.

## E1 evidence

PASS E1.scenarios: measured 18; required 3 mixes x 2 demands x 3 bot shares; >= 200 seeds each, 52 weeks + gear cohort

PASS E1.runtime: measured 1737.338635708; required < 1800s

PASS E1.liveConfig: measured 5; required passing test + SHA-256-verified log

Checks: tests/e1-model-unit.log (5), tests/e1-accept-types.log, tests/e1-accept-suite.log. Full suite: 2,536 web and 730 server tests pass; 1,393 rules pass with two existing expected failures and eleven skips. Native 42-day cohorts feed the 52-week token model. BASELINE.md documents extrapolation, finite market float and target misses. No baseline numbers were tuned.

## E2 evidence

PASS E2.sinks: measured 3; required >= 3 new sinks in rules, server, UI, sim with tests and screenshots

PASS E2.bellsOnly: measured 11; required passing test + SHA-256-verified log

Checks: tests/e2-final-types.log, tests/e2-final-suite.log (2,536 web, 730 server; 1,393 rules plus two existing expected failures and eleven skips), tests/e2-model.log (8), tests/e2-browser-final.log. SINKS.json ties production source hashes to three actual Anvil burns and quote screenshots. SINK-MODEL.json is a 40-seed regression, not E3 acceptance. Existing audio callsites were re-inspected: no unresolved or missing cues.

## V3SOLO Q0 preservation checks

Workspace types PASS; economy-lab 17/17 PASS; full unit suite PASS (73 root, 1,396 rules, 732 server, 2,537 web, 72 other package tests; two existing expected failures and eleven skips). Logs: tests/q0-typecheck.log, tests/q0-economy-lab.log, tests/q0-full-unit.log. Standalone browser budget fails before entry because it lacks the returning-guest fixture (tests/q0-browser.log); Q1 repairs this without excluding screens. Inherited source preserved at 021dd1d43ee82d9459ba56413089a201c5d04a66; no E3 acceptance claimed.

## SOLO Q2 closure — 2026-11-13T14:37:58.241996+00:00

Source B298a4fbd8 with A18ea6e6e8. Final B435/435 browser cases,2538 web unit tests and all workspace types PASS. Q2 does not close V recognition or the remaining S5 mix targets.

```text
PASS Q2.matrix: measured=9; required=3 fixtures x3 speeds
PASS Q2.wave1.x1.ultimates: measured=4; required=all required charge/release callouts played
PASS Q2.wave1.x1.ultimate-interrupted: measured=0; required=eq0
PASS Q2.wave1.x1.skill-interrupted: measured=0; required=<=0.05 of played skills
PASS Q2.wave1.x1.bark-spacing: measured=7.49563333333532; required=7–8 seconds
PASS Q2.wave1.x1.parity: measured=true; required=true
PASS Q2.wave1.x1.browser-errors: measured=0; required=eq0
PASS Q2.wave1.x2.ultimates: measured=8; required=all required charge/release callouts played
PASS Q2.wave1.x2.ultimate-interrupted: measured=0; required=eq0
PASS Q2.wave1.x2.skill-interrupted: measured=0; required=<=0.05 of played skills
PASS Q2.wave1.x2.bark-spacing: measured=7.503599999999007; required=7–8 seconds
PASS Q2.wave1.x2.parity: measured=true; required=true
PASS Q2.wave1.x2.browser-errors: measured=0; required=eq0
PASS Q2.wave1.x3.ultimates: measured=8; required=all required charge/release callouts played
PASS Q2.wave1.x3.ultimate-interrupted: measured=0; required=eq0
PASS Q2.wave1.x3.skill-interrupted: measured=0; required=<=0.05 of played skills
PASS Q2.wave1.x3.bark-spacing: measured=7.50393333333234; required=7–8 seconds
PASS Q2.wave1.x3.parity: measured=true; required=true
PASS Q2.wave1.x3.browser-errors: measured=0; required=eq0
PASS Q2.wave3.x1.ultimates: measured=4; required=all required charge/release callouts played
PASS Q2.wave3.x1.ultimate-interrupted: measured=0; required=eq0
PASS Q2.wave3.x1.skill-interrupted: measured=0; required=<=0.05 of played skills
PASS Q2.wave3.x1.bark-spacing: measured=7.503199999998014; required=7–8 seconds
PASS Q2.wave3.x1.parity: measured=true; required=true
PASS Q2.wave3.x1.browser-errors: measured=0; required=eq0
PASS Q2.wave3.x2.ultimates: measured=6; required=all required charge/release callouts played
PASS Q2.wave3.x2.ultimate-interrupted: measured=0; required=eq0
PASS Q2.wave3.x2.skill-interrupted: measured=0; required=<=0.05 of played skills
PASS Q2.wave3.x2.bark-spacing: measured=7.516099999999007; required=7–8 seconds
PASS Q2.wave3.x2.parity: measured=true; required=true
PASS Q2.wave3.x2.browser-errors: measured=0; required=eq0
PASS Q2.wave3.x3.ultimates: measured=8; required=all required charge/release callouts played
PASS Q2.wave3.x3.ultimate-interrupted: measured=0; required=eq0
PASS Q2.wave3.x3.skill-interrupted: measured=0; required=<=0.05 of played skills
PASS Q2.wave3.x3.bark-spacing: measured=7.513599999999006; required=7–8 seconds
PASS Q2.wave3.x3.parity: measured=true; required=true
PASS Q2.wave3.x3.browser-errors: measured=0; required=eq0
PASS Q2.boss.x1.ultimates: measured=4; required=all required charge/release callouts played
PASS Q2.boss.x1.ultimate-interrupted: measured=0; required=eq0
PASS Q2.boss.x1.skill-interrupted: measured=0; required=<=0.05 of played skills
PASS Q2.boss.x1.bark-spacing: measured=7.5168333333333335; required=7–8 seconds
PASS Q2.boss.x1.parity: measured=true; required=true
PASS Q2.boss.x1.browser-errors: measured=0; required=eq0
PASS Q2.boss.x2.ultimates: measured=10; required=all required charge/release callouts played
PASS Q2.boss.x2.ultimate-interrupted: measured=0; required=eq0
PASS Q2.boss.x2.skill-interrupted: measured=0; required=<=0.05 of played skills
PASS Q2.boss.x2.bark-spacing: measured=7.49813333333532; required=7–8 seconds
PASS Q2.boss.x2.parity: measured=true; required=true
PASS Q2.boss.x2.browser-errors: measured=0; required=eq0
PASS Q2.boss.x3.ultimates: measured=10; required=all required charge/release callouts played
PASS Q2.boss.x3.ultimate-interrupted: measured=0; required=eq0
PASS Q2.boss.x3.skill-interrupted: measured=0; required=<=0.05 of played skills
PASS Q2.boss.x3.bark-spacing: measured=7.514699999998013; required=7–8 seconds
PASS Q2.boss.x3.parity: measured=true; required=true
PASS Q2.boss.x3.browser-errors: measured=0; required=eq0
PASS Q2.battle.voice-contours: measured=4.661461426796784; required=3.25–6.75/min
PASS Q2.battle.duration: measured=180.20099773242632; required=full S5 duration
PASS Q2.boss.voice-contours: measured=3.4940893635709207; required=3.25–6.75/min
PASS Q2.boss.duration: measured=120.20299319727891; required=full S5 duration
TOTAL 59 PASS / 0 FAIL / 59 gates
```

## Q5 final37 acceptance — 2026-11-13T21:25:40.463029+00:00

```text
PASS V.coverage: measured 25/25; required 100% playable, elite and boss active skills + ultimates from rules
PASS V.variants: measured 50/50; required >= 2 takes per ultimate line
PASS V.ultAccuracy: measured 50/50; required recogniser word accuracy >= 0.7
PASS V.skillAccuracy: measured 62/62; required recogniser word accuracy >= 0.5
PASS V.distinct: measured 12/12; required S4 distinctness holds for callouts
PASS V.battle: measured 0; required 0 missing ultimate callouts; music ducks; >= 180s
PASS V.levels: measured 212/212; required -16 LUFS +/- 1, peak <= -1 dBTP
PASS V.lines: measured 2428; required nonempty reports/v3-shell/b2/VOICE-CALLOUTS.md
PASS S5.algorithm: measured 6/6; required same current measurement algorithm for references and all six non-diagnostic renders
PASS S5.battle.render: measured 180.20099773242632; required >= 180s measured Opus render
PASS S5.battle.onsetsPerSecond: measured 3.179782616136378; required reference +/- 30% (reference 2.6333333333333333)
PASS S5.battle.layers: measured 0.20593368237347295; required >= reference median - 0.5
PASS S5.battle.tickTransientsPerSecond: measured 0.6714724198123939; required reference +/- 40% (reference 0.6499999999999999)
PASS S5.battle.music: measured 0.9751342969485518; required music bed >= 95%
PASS S5.battle.voiceContoursPerMinute: measured 4.994422957282269; required reference +/- 35% (reference 5)
PASS S5.battle.silence: measured 0; required <= reference + 3 percentage points
PASS S5.battle.lufs: measured -14.82; required -16 to -13 LUFS
PASS S5.battle.peak: measured -2.79; required <= -1 dBTP
PASS S5.boss.render: measured 120.2; required >= 120s measured Opus render
PASS S5.boss.onsetsPerSecond: measured 3.1613976705490847; required reference +/- 30% (reference 2.6333333333333333)
PASS S5.boss.layers: measured 0.22631578947368422; required >= reference median - 0.5
PASS S5.boss.tickTransientsPerSecond: measured 0.7321131447587355; required reference +/- 40% (reference 0.6499999999999999)
PASS S5.boss.music: measured 1; required music bed >= 95%
PASS S5.boss.voiceContoursPerMinute: measured 4.9916805324459235; required reference +/- 35% (reference 5)
PASS S5.boss.silence: measured 0; required <= reference + 3 percentage points
PASS S5.boss.lufs: measured -14.93; required -16 to -13 LUFS
PASS S5.boss.peak: measured -2.76; required <= -1 dBTP
PASS S5.home.render: measured 60.20199546485261; required >= 60s measured Opus render
PASS S5.home.onsetsPerSecond: measured 4.102854034866745; required reference +/- 30% (reference 3.6666666666666665)
PASS S5.home.layers: measured 1.45748987854251; required >= reference median - 0.5
PASS S5.home.tickTransientsPerSecond: measured 5.9466467387947155; required reference +/- 40% (reference 8.9)
PASS S5.home.music: measured 1; required music bed >= 95%
PASS S5.home.voiceContoursPerMinute: measured 1.9932894096518599; required reference +/- 35% (reference 2)
PASS S5.home.silence: measured 0; required <= reference + 3 percentage points
PASS S5.home.lufs: measured -17.39; required -20 to -16 LUFS
PASS S5.home.peak: measured -2.23; required <= -1 dBTP
PASS S5.bag.render: measured 60.202993197278914; required >= 60s measured Opus render
PASS S5.bag.onsetsPerSecond: measured 4.219059327626262; required reference +/- 30% (reference 3.7)
PASS S5.bag.layers: measured 1.437007874015748; required >= reference median - 0.5
PASS S5.bag.tickTransientsPerSecond: measured 5.996379595563309; required reference +/- 40% (reference 8.466666666666667)
PASS S5.bag.music: measured 1; required music bed >= 95%
PASS S5.bag.voiceContoursPerMinute: measured 1.9932563752565018; required reference +/- 35% (reference 2)
PASS S5.bag.silence: measured 0; required <= reference + 3 percentage points
PASS S5.bag.lufs: measured -17.37; required -20 to -16 LUFS
PASS S5.bag.peak: measured -1.96; required <= -1 dBTP
PASS S5.gacha.render: measured 60.20199546485261; required >= 60s measured Opus render
PASS S5.gacha.onsetsPerSecond: measured 4.252350740590634; required reference +/- 30% (reference 3.966666666666667)
PASS S5.gacha.layers: measured 1.5078125; required >= reference median - 0.5
PASS S5.gacha.tickTransientsPerSecond: measured 5.83037152323169; required reference +/- 40% (reference 8.233333333333333)
PASS S5.gacha.music: measured 1; required music bed >= 95%
PASS S5.gacha.voiceContoursPerMinute: measured 0; required reference +/- 35% (reference 0)
PASS S5.gacha.silence: measured 0; required <= reference + 3 percentage points
PASS S5.gacha.lufs: measured -18.11; required -20 to -16 LUFS
PASS S5.gacha.peak: measured -6.08; required <= -1 dBTP
PASS S5.forge.render: measured 60.19800453514739; required >= 60s measured Opus render
PASS S5.forge.onsetsPerSecond: measured 3.77088911423074; required reference +/- 30% (reference 4.4)
PASS S5.forge.layers: measured 1.198237885462555; required >= reference median - 0.5
PASS S5.forge.tickTransientsPerSecond: measured 3.5217114194577834; required reference +/- 40% (reference 3.433333333333333)
PASS S5.forge.music: measured 1; required music bed >= 95%
PASS S5.forge.voiceContoursPerMinute: measured 1.993421558183651; required reference +/- 35% (reference 2)
PASS S5.forge.silence: measured 0; required <= reference + 3 percentage points
PASS S5.forge.lufs: measured -17.36; required -20 to -16 LUFS
PASS S5.forge.peak: measured -1.94; required <= -1 dBTP
PASS S5.duck: measured {"db":-8,"attackMs":120,"releaseMs":400}; required -8 dB, 120ms attack, 400ms release
PASS S5.chart: measured 86892; required nonempty reports/v3-shell/b2/shots/audio-vs-ref.png
PASS S5.reel: measured 90.054; required >= 90s sound reel
```

## Q4 final committed-evidence checker

```text
PASS E3.rounds: measured 24; required >= 15 logged rounds with scenario tables and lessons
PASS E3.leverChanges: measured 8.958333333333334; required >= 2 changed levers per round on average
PASS E3.searchLevers: measured 20; required >= 10 levers per search
PASS E3.configs: measured 1273; required >= 600 unique configs evaluated with >= 40 seeds
PASS E3.confirmed: measured 10; required top 10 confirmed with >= 200 seeds
PASS E3.structural: measured 5; required >= 3 model/lever structural changes
PASS E3.finalScenarios: measured 18; required all 18 scenarios at >= 200 seeds
PASS E3.T-a: measured 18/18; required burn/all claims >= 1; at 100% demand <= 1.6
PASS E3.T-b: measured 18/18; required Star Thread source/sink 0.9-1.1
PASS E3.T-c: measured 18/18; required heavy/casual YARN/hour <= 3x both directions
PASS E3.T-d: measured 18/18; required casual day 10-16; heavy day 5-9, strictly faster
PASS E3.T-e: measured 6/6; required at 35% bots, bot/regular YARN/hour <= 0.5
PASS E3.T-f: measured 18/18; required top-1% share of withdrawn YARN <= 8%
PASS E3.T-g: measured 18/18; required p90: half-demand burn >= 0.95; Star 0.8-1.2
PASS E3.T-h: measured 85/85; required each assumption +/- 20%: burn >= 0.95; Star 0.8-1.2
PASS E3.configOdds: measured 5; required passing test + SHA-256-verified log
PASS E3.configSource: measured packages/game-rules/src/cardrpg/economy-v3.ts; required committed final rules config matches measured hash
PASS E4.receipts: measured 16; required >= 13 + new sink count confirmed receipts
PASS E4.sinks: measured 3/3; required one confirmed use of every new sink
PASS E4.screenshots: measured 18; required 1280x720 and 1440x900 economy screenshots
PASS E4.odds: measured 5; required passing test + SHA-256-verified log
PASS E5.report: measured 18077; required nonempty reports/v3-shell/b2/econ/ECONOMY-FINAL.md
PASS E5.numbers: measured 816; required >= 10 report numbers checked against committed JSON
PASS E5.allCitations: measured 816/816; required all report-number citations valid
```

Evidence commit838434f59. Full current unit/types PASS; browser suite must finish before SOLO Q4 closes.

## SOLO Q4 and Q6 final acceptance — 2026-11-13T22:45:54.020159+00:00

Full current source suite: tests/q6-final6-suite.json (workspace types and unit tests), tests/q6-final6-browser.json (435 passing browser cases). Q4 report-only completion reuses this same current-source run; no duplicate suite claimed.

```text
PASS E3.rounds: measured 24; required >= 15 logged rounds with scenario tables and lessons
PASS E3.leverChanges: measured 8.958333333333334; required >= 2 changed levers per round on average
PASS E3.searchLevers: measured 20; required >= 10 levers per search
PASS E3.configs: measured 1273; required >= 600 unique configs evaluated with >= 40 seeds
PASS E3.confirmed: measured 10; required top 10 confirmed with >= 200 seeds
PASS E3.structural: measured 5; required >= 3 model/lever structural changes
PASS E3.finalScenarios: measured 18; required all 18 scenarios at >= 200 seeds
PASS E3.T-a: measured 18/18; required burn/all claims >= 1; at 100% demand <= 1.6
PASS E3.T-b: measured 18/18; required Star Thread source/sink 0.9-1.1
PASS E3.T-c: measured 18/18; required heavy/casual YARN/hour <= 3x both directions
PASS E3.T-d: measured 18/18; required casual day 10-16; heavy day 5-9, strictly faster
PASS E3.T-e: measured 6/6; required at 35% bots, bot/regular YARN/hour <= 0.5
PASS E3.T-f: measured 18/18; required top-1% share of withdrawn YARN <= 8%
PASS E3.T-g: measured 18/18; required p90: half-demand burn >= 0.95; Star 0.8-1.2
PASS E3.T-h: measured 85/85; required each assumption +/- 20%: burn >= 0.95; Star 0.8-1.2
PASS E3.configOdds: measured 5; required passing test + SHA-256-verified log
PASS E3.configSource: measured packages/game-rules/src/cardrpg/economy-v3.ts; required committed final rules config matches measured hash
PASS E4.receipts: measured 16; required >= 13 + new sink count confirmed receipts
PASS E4.sinks: measured 3/3; required one confirmed use of every new sink
PASS E4.screenshots: measured 18; required 1280x720 and 1440x900 economy screenshots
PASS E4.odds: measured 5; required passing test + SHA-256-verified log
PASS E5.report: measured 18077; required nonempty reports/v3-shell/b2/econ/ECONOMY-FINAL.md
PASS E5.numbers: measured 816; required >= 10 report numbers checked against committed JSON
PASS E5.allCitations: measured 816/816; required all report-number citations valid
PASS U3.screens: measured 54; required >= 24 rebuilt screens
PASS U3.coverage: measured 53/53; required every U1 screen rebuilt
PASS U3.images: measured 54/54; required 1280x720 AND 1440x900 before/after images per screen
PASS U3.words: measured 54/54; required <= 25 visible words every screen
PASS U3.buttons: measured 54/54; required <= 2 plain text buttons every screen
PASS U3.fonts: measured 0; required 0 system fonts
PASS U3.glyphs: measured 0; required 0 Unicode glyph icons
PASS U3.scores: measured 54/54; required average >= 8; every criterion >= 7
PASS U3.flows: measured 435; required passing test + SHA-256-verified log
```

## Q8 accepted 2026-11-13T23:50:04.048077+00:00

```text
PASS T1.walkthrough: measured 90; required passing test + SHA-256-verified log
PASS T1.geometry: measured 90/90; required target inside spotlight with >= 8px padding; bubble not overlapping
PASS T1.fallbacks: measured 0; required 0 fallback steps on owned screens
PASS T1.words: measured 90/90; required <= 12 words per step
PASS C1.counters: measured 3; required >= 3/4 real Fuji counters numeric, raw RPC + screenshot
PASS C1.policy: measured {"timeoutMs":6000,"cacheMs":60000,"retries":2,"logWindow":100,"deedBatchSize":500}; required 6000ms timeout, 60000ms cache, 2 retries
PASS C1.offline: measured 11; required passing test + SHA-256-verified log
```

Source 496df289b5172f23d0947ee901bc4db547bb878b; q8/ACCEPTANCE.json links full unit,435/435 browser and corrected typecheck. Fused remains Offline without a verified indexer; transaction count is labelled for the last1,000 blocks.

## Q9 P1 checker evidence

```text
PASS P1.layers: measured 361 ; required every effect layer >=6 actual variants
PASS P1.distinct: measured 6 ; required >=6 unique non-silent PCM segments in every layer
PASS P1.licences: measured 4 ; required all referenced packs hashed CC0
```

## Q9 P2 acceptance

```text
PASS P2.arrangements: measured=0; required=0 missing or duplicated elemental arrangements
PASS P2.authored: measured=24; required=24 current arrangements match measured source
PASS P2.playback: measured=24; required=24/24 phases, six distinct admitted sources per layer
PASS P2.errors: measured=0; required=0 browser errors
PASS P2.bytes: measured=0; required=0 encoded audio files changed by P2
PASS P2.reel: measured=1; required=SHA-256-verified isolated kit reel

PASS S1.events: measured 2556; required >= 160 complete events; 0 TBD
PASS S1.screens: measured 49; required >= 18 screens
PASS S1.existingCues: measured 0; required 0 existing cues absent; >= 1 inspected
PASS S1.callsites: measured 0; required 0 unresolved playCue sites; >= 1 inspected
PASS S1.report: measured 630935; required nonempty reports/v3-shell/b2/SOUND-MAP.md
PASS S1.typedMap: measured 13019; required nonempty apps/web/src/audio/sound-map.ts
PASS S3.hitLayers: measured 106/106; required each battle hit >= 3 layers
PASS S3.hitVariants: measured 106/106; required each hit layer >= 4 variants
PASS S3.uiVariants: measured 58/58; required each UI cue >= 2 variants
PASS S3.repeats: measured 0; required 0 consecutive identical variants in >= 180s auto battle
PASS S3.sfxConcurrency: measured 14; required <= 14 sfx including layers
PASS S3.voiceConcurrency: measured 1; required <= 1 voice
PASS S3.bytes: measured 15958952; required <= 16000000 bytes incl. callouts
PASS S3.cpu: measured 4.524575153654773; required < 8% added main-thread time, 180s paired traces
PASS V.coverage: measured 25/25; required 100% playable, elite and boss active skills + ultimates from rules
PASS V.variants: measured 50/50; required >= 2 takes per ultimate line
PASS V.ultAccuracy: measured 50/50; required recogniser word accuracy >= 0.7
PASS V.skillAccuracy: measured 62/62; required recogniser word accuracy >= 0.5
PASS V.distinct: measured 12/12; required S4 distinctness holds for callouts
PASS V.battle: measured 0; required 0 missing ultimate callouts; music ducks; >= 180s
PASS V.levels: measured 212/212; required -16 LUFS +/- 1, peak <= -1 dBTP
PASS V.lines: measured 2428; required nonempty reports/v3-shell/b2/VOICE-CALLOUTS.md
PASS S5.algorithm: measured 6/6; required same current measurement algorithm for references and all six non-diagnostic renders
PASS S5.battle.render: measured 180.20099773242632; required >= 180s measured Opus render
PASS S5.battle.onsetsPerSecond: measured 3.2019800515020767; required reference +/- 30% (reference 2.6333333333333333)
PASS S5.battle.layers: measured 0.23570190641247835; required >= reference median - 0.5
PASS S5.battle.tickTransientsPerSecond: measured 0.5660346018253237; required reference +/- 40% (reference 0.6499999999999999)
PASS S5.battle.music: measured 0.9718668660353326; required music bed >= 95%
PASS S5.battle.voiceContoursPerMinute: measured 4.994422957282269; required reference +/- 35% (reference 5)
PASS S5.battle.silence: measured 0; required <= reference + 3 percentage points
PASS S5.battle.lufs: measured -14.98; required -16 to -13 LUFS
PASS S5.battle.peak: measured -3.09; required <= -1 dBTP
PASS S5.boss.render: measured 120.19700680272109; required >= 120s measured Opus render
PASS S5.boss.onsetsPerSecond: measured 3.2945911926904583; required reference +/- 30% (reference 2.6333333333333333)
PASS S5.boss.layers: measured 0.23484848484848486; required >= reference median - 0.5
PASS S5.boss.tickTransientsPerSecond: measured 0.8569264970886797; required reference +/- 40% (reference 0.6499999999999999)
PASS S5.boss.music: measured 1; required music bed >= 95%
PASS S5.boss.voiceContoursPerMinute: measured 5.490985321150764; required reference +/- 35% (reference 5)
PASS S5.boss.silence: measured 0; required <= reference + 3 percentage points
PASS S5.boss.lufs: measured -14.76; required -16 to -13 LUFS
PASS S5.boss.peak: measured -2.45; required <= -1 dBTP
PASS S5.home.render: measured 60.19700680272109; required >= 60s measured Opus render
PASS S5.home.onsetsPerSecond: measured 4.335763750768452; required reference +/- 30% (reference 3.6666666666666665)
PASS S5.home.layers: measured 1.475095785440613; required >= reference median - 0.5
PASS S5.home.tickTransientsPerSecond: measured 5.93052742921202; required reference +/- 40% (reference 8.9)
PASS S5.home.music: measured 1; required music bed >= 95%
PASS S5.home.voiceContoursPerMinute: measured 1.9934545980544605; required reference +/- 35% (reference 2)
PASS S5.home.silence: measured 0; required <= reference + 3 percentage points
PASS S5.home.lufs: measured -17.36; required -20 to -16 LUFS
PASS S5.home.peak: measured -1.95; required <= -1 dBTP
PASS S5.bag.render: measured 60.19800453514739; required >= 60s measured Opus render
PASS S5.bag.onsetsPerSecond: measured 4.119737886912879; required reference +/- 30% (reference 3.7)
PASS S5.bag.layers: measured 1.4879032258064515; required >= reference median - 0.5
PASS S5.bag.tickTransientsPerSecond: measured 5.631415901868814; required reference +/- 40% (reference 8.466666666666667)
PASS S5.bag.music: measured 1; required music bed >= 95%
PASS S5.bag.voiceContoursPerMinute: measured 1.993421558183651; required reference +/- 35% (reference 2)
PASS S5.bag.silence: measured 0; required <= reference + 3 percentage points
PASS S5.bag.lufs: measured -17.39; required -20 to -16 LUFS
PASS S5.bag.peak: measured -1.97; required <= -1 dBTP
PASS S5.gacha.render: measured 60.19800453514739; required >= 60s measured Opus render
PASS S5.gacha.onsetsPerSecond: measured 4.119737886912879; required reference +/- 30% (reference 3.966666666666667)
PASS S5.gacha.layers: measured 1.5887096774193548; required >= reference median - 0.5
PASS S5.gacha.tickTransientsPerSecond: measured 5.980264674550953; required reference +/- 40% (reference 8.233333333333333)
PASS S5.gacha.music: measured 1; required music bed >= 95%
PASS S5.gacha.voiceContoursPerMinute: measured 0; required reference +/- 35% (reference 0)
PASS S5.gacha.silence: measured 0; required <= reference + 3 percentage points
PASS S5.gacha.lufs: measured -17.57; required -20 to -16 LUFS
PASS S5.gacha.peak: measured -5.48; required <= -1 dBTP
PASS S5.forge.render: measured 60.202993197278914; required >= 60s measured Opus render
PASS S5.forge.onsetsPerSecond: measured 3.6709138244307242; required reference +/- 30% (reference 4.4)
PASS S5.forge.layers: measured 1.2307692307692308; required >= reference median - 0.5
PASS S5.forge.tickTransientsPerSecond: measured 3.488198656698878; required reference +/- 40% (reference 3.433333333333333)
PASS S5.forge.music: measured 1; required music bed >= 95%
PASS S5.forge.voiceContoursPerMinute: measured 1.9932563752565018; required reference +/- 35% (reference 2)
PASS S5.forge.silence: measured 0; required <= reference + 3 percentage points
PASS S5.forge.lufs: measured -17.43; required -20 to -16 LUFS
PASS S5.forge.peak: measured -1.74; required <= -1 dBTP
PASS S5.duck: measured {'db': -8, 'attackMs': 120, 'releaseMs': 400}; required -8 dB, 120ms attack, 400ms release
PASS S5.chart: measured 87087; required nonempty reports/v3-shell/b2/shots/audio-vs-ref.png
PASS S5.reel: measured 90.05; required >= 90s sound reel
PASS S7.coverage: measured 1; required 100% mapped cues listed in lab
PASS S7.random: measured 20; required >= 20 random cues from static server, 0 errors
```
