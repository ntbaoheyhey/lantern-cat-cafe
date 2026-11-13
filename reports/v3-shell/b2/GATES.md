# B2 gate results

Measured from current files; pending sensitivity cases remain FAIL.

```text
PASS G0.inventory: measured 24; required every required card has gates and thresholds
PASS G0.tests: measured 14; required passing test + SHA-256-verified log
PASS R.windows: measured 10; required >= 10 measured windows with all metrics, or logged videos missing
PASS R.candidates: measured 755; required >= 120 candidate files with licence URLs
PASS R.levers: measured 10; required >= 8 new economy levers with file:line
PASS R.report: measured 8910; required nonempty reports/v3-shell/b2/RESEARCH-B2.md
PASS S1.events: measured 2552; required >= 160 complete events; 0 TBD
PASS S1.screens: measured 49; required >= 18 screens
PASS S1.existingCues: measured 0; required 0 existing cues absent; >= 1 inspected
FAIL S1.callsites: measured 0; required 0 unresolved playCue sites; >= 1 inspected
PASS S1.report: measured 630465; required nonempty reports/v3-shell/b2/SOUND-MAP.md
PASS S1.typedMap: measured 12853; required nonempty apps/web/src/audio/sound-map.ts
PASS S2.clips: measured 595; required >= 350 usable hashed source clips
PASS S2.catRecordings: measured 22; required >= 15 distinct original recordings
PASS S2.catAuthors: measured 18; required >= 6 cat-recording authors
PASS S2.consonants: measured 76; required >= 40 consonant/mouth/click grains
PASS S2.ambience: measured 11; required >= 6 ambience beds
PASS S2.music: measured 14; required >= 8 music pieces
PASS S2.stings: measured 18; required >= 8 stings
PASS S2.licenceCoverage: measured 1; required 100% source and shipped audio files with licence, author, URL, date, SHA-256
PASS S2.licences: measured 0; required 0 non-commercial, unlicensed, or disallowed licence rows
PASS S3.hitLayers: measured 106/106; required each battle hit >= 3 layers
PASS S3.hitVariants: measured 106/106; required each hit layer >= 4 variants
PASS S3.uiVariants: measured 58/58; required each UI cue >= 2 variants
PASS S3.repeats: measured 0; required 0 consecutive identical variants in >= 180s auto battle
PASS S3.sfxConcurrency: measured 14; required <= 14 sfx including layers
PASS S3.voiceConcurrency: measured 1; required <= 1 voice
PASS S3.bytes: measured 15791794; required <= 16000000 bytes incl. callouts
PASS S3.cpu: measured 4.524575153654773; required < 8% added main-thread time, 180s paired traces
PASS S4.cats: measured 12; required >= 12 cats, >= 9 lines each
PASS S4.consonants: measured 12/12; required each rendered line >= 0.5 consonants/syllable
PASS S4.distinct: measured 12/12; required nearest MFCC >= source p25; F0 >= 3 semitones OR different source
PASS S4.loudness: measured 12/12; required -16 LUFS +/- 1
PASS S4.cadence: measured 7.563; required median voice interval 6-9s
PASS S4.lines: measured 5873; required nonempty reports/v3-shell/b2/VOICE-LINES.md
PASS V.coverage: measured 25/25; required 100% playable, elite and boss active skills + ultimates from rules
PASS V.variants: measured 50/50; required >= 2 takes per ultimate line
PASS V.ultAccuracy: measured 50/50; required recogniser word accuracy >= 0.7
PASS V.skillAccuracy: measured 62/62; required recogniser word accuracy >= 0.5
PASS V.distinct: measured 12/12; required S4 distinctness holds for callouts
PASS V.battle: measured 0; required 0 missing ultimate callouts; music ducks; >= 180s
PASS V.levels: measured 212/212; required -16 LUFS +/- 1, peak <= -1 dBTP
PASS V.lines: measured 4261; required nonempty reports/v3-shell/b2/VOICE-CALLOUTS.md
PASS U1.screens: measured 53; required >= 24 states, screenshots, all metrics and fix lists
PASS U1.report: measured 17010; required nonempty reports/v3-shell/b2/UI-AUDIT.md
PASS U2.files: measured 76; required >= 60 new art files with provenance
PASS U2.bytes: measured 3997810; required <= 8000000 bytes new UI art
PASS U2.inputs: measured 76/76; required 0 reference frames as generator inputs; text/own images only
PASS U2.sheet: measured 947189; required nonempty reports/v3-shell/b2/shots/ui-kit.png
PASS U3.screens: measured 54; required >= 24 rebuilt screens
PASS U3.coverage: measured 53/53; required every U1 screen rebuilt
PASS U3.images: measured 54/54; required 1280x720 AND 1440x900 before/after images per screen
PASS U3.words: measured 54/54; required <= 25 visible words every screen
FAIL U3.buttons: measured 53/54; required <= 2 plain text buttons every screen
PASS U3.fonts: measured 0; required 0 system fonts
PASS U3.glyphs: measured 0; required 0 Unicode glyph icons
FAIL U3.scores: measured 32/54; required average >= 8; every criterion >= 7
PASS U3.flows: measured 108; required passing test + SHA-256-verified log
PASS U4.tour: measured 62; required >= 60s WebM with sound, <= 25000000 bytes
PASS U4.cls: measured 0; required 0 layout shifts > 0.05 CLS
PASS U4.fps: measured 60; required median >= 60 fps in panel transitions
PASS U4.reducedMotion: measured 16; required passing test + SHA-256-verified log
PASS S5.algorithm: measured 6/6; required same current measurement algorithm for references and all six non-diagnostic renders
PASS S5.battle.render: measured 180.20099773242632; required >= 180s measured Opus render
PASS S5.battle.onsetsPerSecond: measured 3.257473639916324; required reference +/- 30% (reference 2.6333333333333333)
PASS S5.battle.layers: measured 0.293015332197615; required >= reference median - 0.5
FAIL S5.battle.tickTransientsPerSecond: measured 1.553820475598928; required reference +/- 40% (reference 0.6499999999999999)
PASS S5.battle.music: measured 1; required music bed >= 95%
FAIL S5.battle.voiceContoursPerMinute: measured 0.33296153048548455; required reference +/- 35% (reference 5)
PASS S5.battle.silence: measured 0; required <= reference + 3 percentage points
PASS S5.battle.lufs: measured -14.87; required -16 to -13 LUFS
PASS S5.battle.peak: measured -1.79; required <= -1 dBTP
PASS S5.boss.render: measured 120.20299319727891; required >= 120s measured Opus render
PASS S5.boss.onsetsPerSecond: measured 3.252830812276738; required reference +/- 30% (reference 2.6333333333333333)
PASS S5.boss.layers: measured 0.37595907928388744; required >= reference median - 0.5
FAIL S5.boss.tickTransientsPerSecond: measured 1.9051106291850972; required reference +/- 40% (reference 0.6499999999999999)
PASS S5.boss.music: measured 1; required music bed >= 95%
PASS S5.boss.voiceContoursPerMinute: measured 3.993244986938195; required reference +/- 35% (reference 5)
PASS S5.boss.silence: measured 0; required <= reference + 3 percentage points
PASS S5.boss.lufs: measured -14.71; required -16 to -13 LUFS
PASS S5.boss.peak: measured -2.04; required <= -1 dBTP
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
PASS S6.coverage: measured 0.9912718204488778; required >= 95% interactive elements emit mapped cue
PASS S6.errors: measured 0; required 0 console audio errors
PASS S6.gaps: measured 3.54167; required no music silence > 400ms during screen changes
PASS S6.settings: measured 15; required passing test + SHA-256-verified log
PASS S7.coverage: measured 1; required 100% mapped cues listed in lab
PASS S7.random: measured 20; required >= 20 random cues from static server, 0 errors
PASS E1.scenarios: measured 18; required 3 mixes x 2 demands x 3 bot shares; >= 200 seeds each, 52 weeks + gear cohort
PASS E1.runtime: measured 1737.338635708; required < 1800s
PASS E1.liveConfig: measured 5; required passing test + SHA-256-verified log
FAIL E2.sinks: measured 0; required >= 3 new sinks in rules, server, UI, sim with tests and screenshots
PASS E2.bellsOnly: measured 11; required passing test + SHA-256-verified log
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
FAIL E3.T-h: measured 9/85; required each assumption +/- 20%: burn >= 0.95; Star 0.8-1.2
PASS E3.configOdds: measured 5; required passing test + SHA-256-verified log
PASS E3.configSource: measured packages/game-rules/src/cardrpg/economy-v3.ts; required committed final rules config matches measured hash
PASS E4.receipts: measured 16; required >= 13 + new sink count confirmed receipts
PASS E4.sinks: measured 3/3; required one confirmed use of every new sink
PASS E4.screenshots: measured 18; required 1280x720 and 1440x900 economy screenshots
PASS E4.odds: measured 5; required passing test + SHA-256-verified log
PASS E5.report: measured 18076; required nonempty reports/v3-shell/b2/econ/ECONOMY-FINAL.md
PASS E5.numbers: measured 816; required >= 10 report numbers checked against committed JSON
PASS E5.allCitations: measured 816/816; required all report-number citations valid
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
PASS SY3.status: measured 1120; required nonempty reports/v3-shell/b2/STATUS-VI.md
PASS SY3.user: measured 604; required nonempty reports/v3-shell/b2/NEEDS-USER.md
FAIL SY3.final: measured missing; required all other gates PASS or explicitly qualified PARTIAL
```

## Q4 checkpoint132 — 2026-11-13T20:57:39.794042+00:00

```text
PASS E3.rounds: measured=24; required=>= 15 logged rounds with scenario tables and lessons
PASS E3.leverChanges: measured=8.958333333333334; required=>= 2 changed levers per round on average
PASS E3.searchLevers: measured=20; required=>= 10 levers per search
PASS E3.configs: measured=1273; required=>= 600 unique configs evaluated with >= 40 seeds
PASS E3.confirmed: measured=10; required=top 10 confirmed with >= 200 seeds
PASS E3.structural: measured=5; required=>= 3 model/lever structural changes
PASS E3.finalScenarios: measured=18; required=all 18 scenarios at >= 200 seeds
PASS E3.T-a: measured=18/18; required=burn/all claims >= 1; at 100% demand <= 1.6
PASS E3.T-b: measured=18/18; required=Star Thread source/sink 0.9-1.1
PASS E3.T-c: measured=18/18; required=heavy/casual YARN/hour <= 3x both directions
PASS E3.T-d: measured=18/18; required=casual day 10-16; heavy day 5-9, strictly faster
PASS E3.T-e: measured=6/6; required=at 35% bots, bot/regular YARN/hour <= 0.5
PASS E3.T-f: measured=18/18; required=top-1% share of withdrawn YARN <= 8%
PASS E3.T-g: measured=18/18; required=p90: half-demand burn >= 0.95; Star 0.8-1.2
FAIL E3.T-h: measured=65/85; required=each assumption +/- 20%: burn >= 0.95; Star 0.8-1.2
PASS E3.configOdds: measured=5; required=passing test + SHA-256-verified log
PASS E3.configSource: measured=packages/game-rules/src/cardrpg/economy-v3.ts; required=committed final rules config matches measured hash
PASS E4.receipts: measured=16; required=>= 13 + new sink count confirmed receipts
PASS E4.sinks: measured=3/3; required=one confirmed use of every new sink
PASS E4.screenshots: measured=18; required=1280x720 and 1440x900 economy screenshots
PASS E4.odds: measured=5; required=passing test + SHA-256-verified log
PASS E5.report: measured=18077; required=nonempty reports/v3-shell/b2/econ/ECONOMY-FINAL.md
PASS E5.numbers: measured=816; required=>= 10 report numbers checked against committed JSON
PASS E5.allCitations: measured=816/816; required=all report-number citations valid
```

T-h remains open:65/85 assumptions have both perturbations;132/170 individual cases are retained. No measured burn/Star robustness miss in completed cases.

## Q5 final acceptance — 2026-11-13T21:25:40.463029+00:00

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
