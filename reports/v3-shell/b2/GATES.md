# B2 gate results

Generated from current files. Missing evidence is FAIL; no production completion is inferred.

```text
PASS G0.inventory: measured 24; required every required card has gates and thresholds
PASS G0.tests: measured 14; required passing test + SHA-256-verified log
PASS R.windows: measured 10; required >= 10 measured windows with all metrics, or logged videos missing
PASS R.candidates: measured 755; required >= 120 candidate files with licence URLs
PASS R.levers: measured 10; required >= 8 new economy levers with file:line
PASS R.report: measured 8233; required nonempty reports/v3-shell/b2/RESEARCH-B2.md
PASS S1.events: measured 2549; required >= 160 complete events; 0 TBD
PASS S1.screens: measured 49; required >= 18 screens
PASS S1.existingCues: measured 0; required 0 existing cues absent; >= 1 inspected
PASS S1.callsites: measured 0; required 0 unresolved playCue sites; >= 1 inspected
PASS S1.report: measured 629637; required nonempty reports/v3-shell/b2/SOUND-MAP.md
PASS S1.typedMap: measured 12721; required nonempty apps/web/src/audio/sound-map.ts
PASS S2.clips: measured 593; required >= 350 usable hashed source clips
PASS S2.catRecordings: measured 22; required >= 15 distinct original recordings
PASS S2.catAuthors: measured 18; required >= 6 cat-recording authors
PASS S2.consonants: measured 76; required >= 40 consonant/mouth/click grains
PASS S2.ambience: measured 11; required >= 6 ambience beds
PASS S2.music: measured 12; required >= 8 music pieces
PASS S2.stings: measured 18; required >= 8 stings
PASS S2.licenceCoverage: measured 1; required 100% source and shipped audio files with licence, author, URL, date, SHA-256
PASS S2.licences: measured 0; required 0 non-commercial, unlicensed, or disallowed licence rows
PASS S3.hitLayers: measured 106/106; required each battle hit >= 3 layers
PASS S3.hitVariants: measured 106/106; required each hit layer >= 4 variants
PASS S3.uiVariants: measured 58/58; required each UI cue >= 2 variants
PASS S3.repeats: measured 0; required 0 consecutive identical variants in >= 180s auto battle
PASS S3.sfxConcurrency: measured 14; required <= 14 sfx including layers
PASS S3.voiceConcurrency: measured 1; required <= 1 voice
PASS S3.bytes: measured 14491591; required <= 16000000 bytes incl. callouts
PASS S3.cpu: measured 4.524575153654773; required < 8% added main-thread time, 180s paired traces
PASS S4.cats: measured 12; required >= 12 cats, >= 9 lines each
PASS S4.consonants: measured 12/12; required each rendered line >= 0.5 consonants/syllable
PASS S4.distinct: measured 12/12; required nearest MFCC >= source p25; F0 >= 3 semitones OR different source
PASS S4.loudness: measured 12/12; required -16 LUFS +/- 1
PASS S4.cadence: measured 7.563; required median voice interval 6-9s
PASS S4.lines: measured 5873; required nonempty reports/v3-shell/b2/VOICE-LINES.md
PASS V.coverage: measured 25/25; required 100% playable, elite and boss active skills + ultimates from rules
PASS V.variants: measured 50/50; required >= 2 takes per ultimate line
FAIL V.ultAccuracy: measured 32/50; required recogniser word accuracy >= 0.7
FAIL V.skillAccuracy: measured 59/62; required recogniser word accuracy >= 0.5
PASS V.distinct: measured 12/12; required S4 distinctness holds for callouts
PASS V.battle: measured 0; required 0 missing ultimate callouts; music ducks; >= 180s
PASS V.levels: measured 212/212; required -16 LUFS +/- 1, peak <= -1 dBTP
PASS V.lines: measured 2815; required nonempty reports/v3-shell/b2/VOICE-CALLOUTS.md
PASS U1.screens: measured 53; required >= 24 states, screenshots, all metrics and fix lists
PASS U1.report: measured 17010; required nonempty reports/v3-shell/b2/UI-AUDIT.md
PASS U2.files: measured 76; required >= 60 new art files with provenance
PASS U2.bytes: measured 3997810; required <= 8000000 bytes new UI art
PASS U2.inputs: measured 76/76; required 0 reference frames as generator inputs; text/own images only
PASS U2.sheet: measured 947189; required nonempty reports/v3-shell/b2/shots/ui-kit.png
FAIL U3.screens: measured missing; required >= 24 rebuilt screens
FAIL U3.coverage: measured 0/53; required every U1 screen rebuilt
FAIL U3.images: measured missing; required 1280x720 AND 1440x900 before/after images per screen
FAIL U3.words: measured missing; required <= 25 visible words every screen
FAIL U3.buttons: measured missing; required <= 2 plain text buttons every screen
FAIL U3.fonts: measured missing; required 0 system fonts
FAIL U3.glyphs: measured missing; required 0 Unicode glyph icons
FAIL U3.scores: measured missing; required average >= 8; every criterion >= 7
FAIL U3.flows: measured missing; required passing test + SHA-256-verified log
FAIL U4.tour: measured missing; required >= 60s WebM with sound, <= 25000000 bytes
FAIL U4.cls: measured missing; required 0 layout shifts > 0.05 CLS
FAIL U4.fps: measured missing; required median >= 60 fps in panel transitions
FAIL U4.reducedMotion: measured missing; required passing test + SHA-256-verified log
FAIL S5.battle.render: measured missing; required >= 180s measured Opus render
FAIL S5.battle.onsetsPerSecond: measured missing; required reference +/- 30% (reference 4.066666666666666)
FAIL S5.battle.layers: measured missing; required >= reference median - 0.5
FAIL S5.battle.tickTransientsPerSecond: measured missing; required reference +/- 40% (reference 0.6499999999999999)
FAIL S5.battle.music: measured missing; required music bed >= 95%
FAIL S5.battle.voiceContoursPerMinute: measured missing; required reference +/- 35% (reference 5)
FAIL S5.battle.silence: measured missing; required <= reference + 3 percentage points
FAIL S5.battle.lufs: measured missing; required -16 to -13 LUFS
FAIL S5.battle.peak: measured missing; required <= -1 dBTP
FAIL S5.boss.render: measured missing; required >= 120s measured Opus render
FAIL S5.boss.onsetsPerSecond: measured missing; required reference +/- 30% (reference 4.066666666666666)
FAIL S5.boss.layers: measured missing; required >= reference median - 0.5
FAIL S5.boss.tickTransientsPerSecond: measured missing; required reference +/- 40% (reference 0.6499999999999999)
FAIL S5.boss.music: measured missing; required music bed >= 95%
FAIL S5.boss.voiceContoursPerMinute: measured missing; required reference +/- 35% (reference 5)
FAIL S5.boss.silence: measured missing; required <= reference + 3 percentage points
FAIL S5.boss.lufs: measured missing; required -16 to -13 LUFS
FAIL S5.boss.peak: measured missing; required <= -1 dBTP
FAIL S5.home.render: measured missing; required >= 60s measured Opus render
FAIL S5.home.onsetsPerSecond: measured missing; required reference +/- 30% (reference 5.5)
FAIL S5.home.layers: measured missing; required >= reference median - 0.5
FAIL S5.home.tickTransientsPerSecond: measured missing; required reference +/- 40% (reference 8.9)
FAIL S5.home.music: measured missing; required music bed >= 95%
FAIL S5.home.voiceContoursPerMinute: measured missing; required reference +/- 35% (reference 2)
FAIL S5.home.silence: measured missing; required <= reference + 3 percentage points
FAIL S5.home.lufs: measured missing; required -20 to -16 LUFS
FAIL S5.home.peak: measured missing; required <= -1 dBTP
FAIL S5.bag.render: measured missing; required >= 60s measured Opus render
FAIL S5.bag.onsetsPerSecond: measured missing; required reference +/- 30% (reference 5.8)
FAIL S5.bag.layers: measured missing; required >= reference median - 0.5
FAIL S5.bag.tickTransientsPerSecond: measured missing; required reference +/- 40% (reference 8.466666666666667)
FAIL S5.bag.music: measured missing; required music bed >= 95%
FAIL S5.bag.voiceContoursPerMinute: measured missing; required reference +/- 35% (reference 2)
FAIL S5.bag.silence: measured missing; required <= reference + 3 percentage points
FAIL S5.bag.lufs: measured missing; required -20 to -16 LUFS
FAIL S5.bag.peak: measured missing; required <= -1 dBTP
FAIL S5.gacha.render: measured missing; required >= 60s measured Opus render
FAIL S5.gacha.onsetsPerSecond: measured missing; required reference +/- 30% (reference 5.4)
FAIL S5.gacha.layers: measured missing; required >= reference median - 0.5
FAIL S5.gacha.tickTransientsPerSecond: measured missing; required reference +/- 40% (reference 8.233333333333333)
FAIL S5.gacha.music: measured missing; required music bed >= 95%
FAIL S5.gacha.voiceContoursPerMinute: measured missing; required reference +/- 35% (reference 0)
FAIL S5.gacha.silence: measured missing; required <= reference + 3 percentage points
FAIL S5.gacha.lufs: measured missing; required -20 to -16 LUFS
FAIL S5.gacha.peak: measured missing; required <= -1 dBTP
FAIL S5.forge.render: measured missing; required >= 60s measured Opus render
FAIL S5.forge.onsetsPerSecond: measured missing; required reference +/- 30% (reference 5.966666666666667)
FAIL S5.forge.layers: measured missing; required >= reference median - 0.5
FAIL S5.forge.tickTransientsPerSecond: measured missing; required reference +/- 40% (reference 3.433333333333333)
FAIL S5.forge.music: measured missing; required music bed >= 95%
FAIL S5.forge.voiceContoursPerMinute: measured missing; required reference +/- 35% (reference 2)
FAIL S5.forge.silence: measured missing; required <= reference + 3 percentage points
FAIL S5.forge.lufs: measured missing; required -20 to -16 LUFS
FAIL S5.forge.peak: measured missing; required <= -1 dBTP
FAIL S5.duck: measured missing; required -8 dB, 120ms attack, 400ms release
FAIL S5.chart: measured missing; required nonempty reports/v3-shell/b2/shots/audio-vs-ref.png
FAIL S5.reel: measured missing; required >= 90s sound reel
FAIL S6.coverage: measured missing; required >= 95% interactive elements emit mapped cue
FAIL S6.errors: measured missing; required 0 console audio errors
FAIL S6.gaps: measured missing; required no music silence > 400ms during screen changes
FAIL S6.settings: measured missing; required passing test + SHA-256-verified log
FAIL S7.coverage: measured missing; required 100% mapped cues listed in lab
FAIL S7.random: measured missing; required >= 20 random cues from static server, 0 errors
FAIL E1.scenarios: measured missing; required 3 mixes x 2 demands x 3 bot shares; >= 200 seeds each, 52 weeks + gear cohort
FAIL E1.runtime: measured missing; required < 1800s
FAIL E1.liveConfig: measured missing; required passing test + SHA-256-verified log
FAIL E2.sinks: measured missing; required >= 3 new sinks in rules, server, UI, sim with tests and screenshots
FAIL E2.bellsOnly: measured missing; required passing test + SHA-256-verified log
FAIL E3.rounds: measured 0; required >= 15 logged rounds with scenario tables and lessons
FAIL E3.leverChanges: measured missing; required >= 2 changed levers per round on average
FAIL E3.searchLevers: measured missing; required >= 10 levers per search
FAIL E3.configs: measured missing; required >= 600 unique configs evaluated with >= 40 seeds
FAIL E3.confirmed: measured missing; required top 10 confirmed with >= 200 seeds
FAIL E3.structural: measured missing; required >= 3 model/lever structural changes
FAIL E3.finalScenarios: measured missing; required all 18 scenarios at >= 200 seeds
FAIL E3.T-a: measured missing; required burn/all claims >= 1; at 100% demand <= 1.6
FAIL E3.T-b: measured missing; required Star Thread source/sink 0.9-1.1
FAIL E3.T-c: measured missing; required heavy/casual YARN/hour <= 3x both directions
FAIL E3.T-d: measured missing; required casual day 10-16; heavy day 5-9, strictly faster
FAIL E3.T-e: measured missing; required at 35% bots, bot/regular YARN/hour <= 0.5
FAIL E3.T-f: measured missing; required top-1% share of withdrawn YARN <= 8%
FAIL E3.T-g: measured missing; required p90: half-demand burn >= 0.95; Star 0.8-1.2
FAIL E3.T-h: measured missing; required each assumption +/- 20%: burn >= 0.95; Star 0.8-1.2
FAIL E3.configOdds: measured missing; required passing test + SHA-256-verified log
FAIL E3.configSource: measured missing; required committed final rules config matches measured hash
FAIL E4.receipts: measured missing; required >= 13 + new sink count confirmed receipts
FAIL E4.sinks: measured missing; required one confirmed use of every new sink
FAIL E4.screenshots: measured missing; required 1280x720 and 1440x900 economy screenshots
FAIL E4.odds: measured missing; required passing test + SHA-256-verified log
FAIL E5.report: measured missing; required nonempty reports/v3-shell/b2/econ/ECONOMY-FINAL.md
FAIL E5.numbers: measured missing; required >= 10 report numbers checked against committed JSON
FAIL E5.allCitations: measured missing; required all report-number citations valid
FAIL E6.migration: measured missing; required passing test + SHA-256-verified log
FAIL E6.dynamicFee: measured missing; required passing test + SHA-256-verified log
FAIL E6.median: measured missing; required 7-day median seal price
FAIL T1.walkthrough: measured missing; required passing test + SHA-256-verified log
FAIL T1.geometry: measured missing; required target inside spotlight with >= 8px padding; bubble not overlapping
FAIL T1.fallbacks: measured missing; required 0 fallback steps on owned screens
FAIL T1.words: measured missing; required <= 12 words per step
FAIL C1.counters: measured missing; required >= 3/4 real Fuji counters numeric, raw RPC + screenshot
FAIL C1.policy: measured missing; required 6000ms timeout, 60000ms cache, 2 retries
FAIL C1.offline: measured missing; required passing test + SHA-256-verified log
FAIL SY1.time: measured missing; required at or after 2026-11-16T12:00:00Z
FAIL SY1.commits: measured missing; required both branch commit IDs, suite, coverage numbers
FAIL SY1.report: measured missing; required nonempty reports/v3-shell/b2/SYNC-16.md
FAIL SY2.time: measured missing; required at or after 2026-11-18T12:00:00Z
FAIL SY2.commits: measured missing; required both branch commit IDs, suite, coverage numbers
FAIL SY2.report: measured missing; required nonempty reports/v3-shell/b2/SYNC-18.md
FAIL SY3.time: measured missing; required at or after 2026-11-19T12:00:00Z
FAIL SY3.report: measured missing; required nonempty reports/v3-shell/b2/REPORT-B2.md
PASS SY3.status: measured 1014; required nonempty reports/v3-shell/b2/STATUS-VI.md
PASS SY3.user: measured 406; required nonempty reports/v3-shell/b2/NEEDS-USER.md
FAIL SY3.final: measured missing; required all other gates PASS or explicitly qualified PARTIAL
```
