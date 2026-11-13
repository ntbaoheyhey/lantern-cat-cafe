# V3B2 queue

Revision 2, 13 November 2026. A card is done only with all checker PASS lines below its entry.

- [x] G0 — done (self-score 8/10 for acceptance tooling; production quality not yet scored)
- [x] R — done (self-score 8/10; spectral proxies explicitly qualified)
- [x] S1 — done (self-score 8/10 for plan/coverage; sound production remains pending)
- [x] S2 — done (self-score 8/10 for library/licence integrity; shipped sound design pending)
- [x] S3 — done (self-score 8/10 for layered playback; final mix and new voices pending)
- [x] S4 — done (self-score 8/10; measured cat-speak, intelligible skill callouts follow in V)
- [ ] V — PARTIAL (allowed: only recognition misses after 9 documented processing iterations; all other V gates PASS; self-score 7/10)
- [x] U1 — done (53 actual states, private comparisons; self-score 8/10 for audit depth, UI quality remains below target)
- [ ] U2 — in progress (original text-only painted assets)
- [ ] U3 — todo
- [ ] U4 — todo
- [ ] S5 — todo
- [ ] S6 — todo
- [ ] S7 — todo
- [ ] E1 — todo
- [ ] E2 — todo
- [ ] E3 — todo
- [ ] E4 — todo
- [ ] E5 — todo
- [ ] T1 — todo
- [ ] C1 — todo
- [ ] E6 — todo
- [ ] P — todo
- [ ] SY1 — todo
- [ ] SY2 — todo
- [ ] SY3 — todo

Syncs interrupt the active card at 16 / 18 / 19 November, 12:00 UTC.

## Polish backlog

- [ ] P1 — todo
- [ ] P2 — todo
- [ ] P3 — todo
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
