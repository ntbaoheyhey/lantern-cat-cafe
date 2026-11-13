FAIL G0.freshness: measured=506a79d750f772bc0b96776bc2cef8b9b3ff3f3c; required=evidence >= d2def5b5e311fa9946a020b25f758a46c931de06
PASS G0.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS G0.bootstrap-all-fail: measured=325; required=eq 325
PASS G0.bootstrap-gate-count: measured=325; required=min 100
PASS G0.tests: measured=0; required=eq 0
PASS G0.fixtures: measured=3; required=eq 3
PASS G0.fps: measured=30; required=eq 30
PASS G0.fixture-captures: measured=3; required=min 3
PASS G0.checker-test-log: measured=1; required=min 1
PASS G0.bootstrap-log: measured=1; required=min 1
PASS G0.compare-tool: measured=1; required=min 1
PASS G0.capture-tool: measured=1; required=min 1
PASS G0.typecheck: measured=0; required=eq 0
PASS G0.unit: measured=0; required=eq 0
FAIL G0.e2e: measured=1; required=eq 0
PASS G0.parity: measured=0; required=eq 0
FAIL G0.artifact-freshness: measured=5; required=eq 0 artifacts older than last source commit
PASS R.freshness: measured=ae12e046fd36daf7633838a26a3579a116d9324e; required=evidence >= ae12e046fd36daf7633838a26a3579a116d9324e
PASS R.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS R.windows: measured=12; required=min 12
PASS R.window-seconds: measured=10; required=min 10
PASS R.ultimate-windows: measured=6; required=min 6
PASS R.unit-boxes: measured=44; required=min 40
PASS R.unit-frames: measured=11; required=min 10
PASS R.number-boxes: measured=33; required=min 30
PASS R.text-frames: measured=10; required=min 10
PASS R.displacement-windows: measured=3; required=min 3
PASS R.scale.median: measured=0.20946; required=min 0
PASS R.scale.p10: measured=0.16723; required=min 0
PASS R.scale.p90: measured=0.22247; required=min 0
PASS R.motion.meanEnergy: measured=22.565131092745876; required=min 0
PASS R.motion.displacementPer10s: measured=0.6666666666666666; required=min 0
PASS R.ultimate.coverageMedian: measured=0.8743749999999999; required=min 0
PASS R.ultimate.peakLuminance: measured=255; required=min 0
PASS R.ultimate.whiteoutFraction: measured=0.05936355311355311; required=min 0
PASS R.ultimate.dominantHues: measured=3; required=min 0
PASS R.ultimate.durationMedian: measured=2.599999999999997; required=min 0
PASS R.numbers.medianHeight720: measured=46.21621621621622; required=min 0
PASS R.numbers.maxSimultaneous: measured=9; required=min 0
PASS R.numbers.impactPerSecond: measured=4.28571428571429; required=min 0
PASS R.text.medianWords: measured=13; required=min 0
PASS R.audio.normalOnsetsPerSecond: measured=5.544373284537969; required=min 0
PASS R.audio.ultimateOnsetsPerSecond: measured=6.822429906542055; required=min 0
PASS R.audio.voiceLikePerMinute: measured=2; required=min 0
PASS R.reference-json: measured=1; required=min 1
PASS R.baseline-json: measured=1; required=min 1
PASS R.research-table: measured=1; required=min 1
PASS R.table-rows: measured=22; required=min 20
PASS R.articles: measured=4; required=min 3
PASS R.motion-rules: measured=12; required=min 12
PASS R.split-pilots: measured=3; required=eq 3
PASS R.layer-types: measured=20; required=min 15
PASS R.targets-measured: measured=1; required=eq 1
PASS R.typecheck: measured=0; required=eq 0
PASS R.unit: measured=0; required=eq 0
FAIL R.e2e: measured=1; required=eq 0
PASS R.parity: measured=0; required=eq 0
PASS R.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
FAIL F1.freshness: measured=c55e4ed0dbf287eee865f69236a22ae160d5f14d; required=evidence >= 1af92d4d36554f09b78a4ae8bba2ef748f580ed5
PASS F1.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS F1.unit-height[wave1@1280x720]: measured=0.20945999999999987; required=band [0.157095,0.26182500000000003]
PASS F1.unit-height[wave3@1280x720]: measured=0.20946000000000006; required=band [0.157095,0.26182500000000003]
PASS F1.unit-height[boss@1280x720]: measured=0.19689240000000005; required=band [0.157095,0.26182500000000003]
PASS F1.unit-height[wave1@1440x900]: measured=0.2094599999999999; required=band [0.157095,0.26182500000000003]
PASS F1.unit-height[wave3@1440x900]: measured=0.2094600000000002; required=band [0.157095,0.26182500000000003]
PASS F1.unit-height[boss@1440x900]: measured=0.19689240000000008; required=band [0.157095,0.26182500000000003]
PASS F1.face-occlusion[wave1@1280x720]: measured=0; required=max 0.1
PASS F1.face-occlusion[wave3@1280x720]: measured=0; required=max 0.1
PASS F1.face-occlusion[boss@1280x720]: measured=0; required=max 0.1
PASS F1.face-occlusion[wave1@1440x900]: measured=0; required=max 0.1
PASS F1.face-occlusion[wave3@1440x900]: measured=0; required=max 0.1
PASS F1.face-occlusion[boss@1440x900]: measured=0; required=max 0.1
PASS F1.clipping[wave1@1280x720]: measured=0; required=eq 0
PASS F1.clipping[wave3@1280x720]: measured=0; required=eq 0
PASS F1.clipping[boss@1280x720]: measured=0; required=eq 0
PASS F1.clipping[wave1@1440x900]: measured=0; required=eq 0
PASS F1.clipping[wave3@1440x900]: measured=0; required=eq 0
PASS F1.clipping[boss@1440x900]: measured=0; required=eq 0
PASS F1.floor[wave1@1280x720]: measured=0.6374801136363636; required=min 0.5
PASS F1.floor[wave3@1280x720]: measured=0.5198451704545455; required=min 0.5
PASS F1.floor[boss@1280x720]: measured=0.5875596590909091; required=min 0.5
PASS F1.floor[wave1@1440x900]: measured=0.6296851217656012; required=min 0.5
PASS F1.floor[wave3@1440x900]: measured=0.5106792237442922; required=min 0.5
PASS F1.floor[boss@1440x900]: measured=0.578119292237443; required=min 0.5
PASS F1.field-names[wave1@1280x720]: measured=0; required=eq 0
PASS F1.field-names[wave3@1280x720]: measured=0; required=eq 0
PASS F1.field-names[boss@1280x720]: measured=0; required=eq 0
PASS F1.field-names[wave1@1440x900]: measured=0; required=eq 0
PASS F1.field-names[wave3@1440x900]: measured=0; required=eq 0
PASS F1.field-names[boss@1440x900]: measured=0; required=eq 0
PASS F1.core-size: measured=0; required=eq 0
PASS F1.comparisons: measured=3; required=min 3
PASS F1.typecheck: measured=0; required=eq 0
PASS F1.unit: measured=0; required=eq 0
FAIL F1.e2e: measured=1; required=eq 0
PASS F1.parity: measured=0; required=eq 0
FAIL F1.artifact-freshness: measured=3; required=eq 0 artifacts older than last source commit
FAIL F2.freshness: measured=e502656bd0c3a703bee3dd9158411dade777cbab; required=evidence >= aa8659b245c889ea7d359f19887fd91aba1bf306
PASS F2.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS F2.alpha[wave1]: measured=1; required=min 0.97
PASS F2.alpha[wave3]: measured=1; required=min 0.97
PASS F2.alpha[boss]: measured=1; required=min 0.97
PASS F2.persistent-bubbles[wave1]: measured=0; required=eq 0
PASS F2.persistent-bubbles[wave3]: measured=0; required=eq 0
PASS F2.persistent-bubbles[boss]: measured=0; required=eq 0
PASS F2.contrast[wave1]: measured=42.590909221323315; required=min 18
PASS F2.contrast[wave3]: measured=42.590909221323315; required=min 18
PASS F2.contrast[boss]: measured=42.590909221323315; required=min 18
PASS F2.comparisons: measured=3; required=min 3
PASS F2.typecheck: measured=0; required=eq 0
PASS F2.unit: measured=0; required=eq 0
FAIL F2.e2e: measured=1; required=eq 0
PASS F2.parity: measured=0; required=eq 0
FAIL F2.artifact-freshness: measured=3; required=eq 0 artifacts older than last source commit
FAIL M1.freshness: measured=1f8261375afaed7a42197d9df55e16994c461873; required=evidence >= 1af92d4d36554f09b78a4ae8bba2ef748f580ed5
PASS M1.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS M1.seconds[wave1]: measured=31; required=min 30
PASS M1.seconds[wave3]: measured=30.366666666666667; required=min 30
PASS M1.seconds[boss]: measured=33.3; required=min 30
PASS M1.displacements[wave1]: measured=18.709677419354836; required=min 2
PASS M1.displacements[wave3]: measured=20.08781558726674; required=min 2
PASS M1.displacements[boss]: measured=16.816816816816818; required=min 2
FAIL M1.motion-energy[wave1]: measured=8.052015373429048; required=min 15.795591764922111
FAIL M1.motion-energy[wave3]: measured=8.964323986088088; required=min 15.795591764922111
FAIL M1.motion-energy[boss]: measured=9.484081449278866; required=min 15.795591764922111
PASS M1.every-action-moves[wave1]: measured=0.08795395679706272; required=min 0.06
PASS M1.every-action-moves[wave3]: measured=0.08795395679706272; required=min 0.06
PASS M1.every-action-moves[boss]: measured=0.08795395679706272; required=min 0.06
PASS M1.hit-knockback[wave1]: measured=1; required=eq 1
PASS M1.hit-knockback[wave3]: measured=1; required=eq 1
PASS M1.hit-knockback[boss]: measured=1; required=eq 1
PASS M1.high-fps[wave1]: measured=59.878247563258306; required=min 50
PASS M1.high-fps[wave3]: measured=60.00083218907336; required=min 50
PASS M1.high-fps[boss]: measured=60.02181097709672; required=min 50
PASS M1.crowded-units: measured=10; required=min 10
PASS M1.archetype-strips: measured=6; required=min 6
PASS M1.typecheck: measured=0; required=eq 0
PASS M1.unit: measured=0; required=eq 0
FAIL M1.e2e: measured=1; required=eq 0
PASS M1.parity: measured=0; required=eq 0
FAIL M1.artifact-freshness: measured=6; required=eq 0 artifacts older than last source commit
PASS M2.freshness: measured=341567cfb9a2e3e974de03bda6f4f649542fc103; required=evidence >= 341567cfb9a2e3e974de03bda6f4f649542fc103
PASS M2.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS M2.units-inspected: measured=22; required=eq 22
PASS M2.separate-parts: measured=22; required=min 20
PASS M2.visible-faces: measured=22; required=eq 22
PASS M2.zero-holes: measured=18; required=min 18
PASS M2.remaining-holes: measured=79; required=max 150
PASS M2.extreme-poses: measured=8; required=min 8
PASS M2.joint-overlap: measured=12; required=min 12
PASS M2.core-size: measured=0; required=eq 0
PASS M2.face-strips: measured=23; required=min 22
PASS M2.typecheck: measured=0; required=eq 0
PASS M2.unit: measured=0; required=eq 0
FAIL M2.e2e: measured=1; required=eq 0
PASS M2.parity: measured=0; required=eq 0
FAIL M2.artifact-freshness: measured=1; required=eq 0 artifacts older than last source commit
FAIL V1.freshness: measured=d03416bbab0c887ca8d7f5167eea4e3caa6f8d46; required=evidence >= d2def5b5e311fa9946a020b25f758a46c931de06
PASS V1.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS V1.plate-count: measured=13; required=eq 13
PASS V1.coverage: measured=0.6536363636363637; required=min 0.6120624999999998
PASS V1.viewport: measured=1; required=eq 1
PASS V1.edges: measured=2; required=eq 2
PASS V1.layer-types: measured=11; required=min 7
PASS V1.particles: measured=480; required=min 300
PASS V1.beats: measured=3; required=min 3
PASS V1.distinctness: measured=0.19967248657396475; required=max 0.55
PASS V1.pair-count: measured=78; required=eq 78
PASS V1.bytes: measured=19269131; required=max 20971520
PASS V1.motif-area: measured=0.45515625; required=min 0.4
PASS V1.camera-paths: measured=13; required=eq 13
PASS V1.comparisons: measured=13; required=min 13
PASS V1.render-log: measured=1; required=min 1
PASS V1.typecheck: measured=0; required=eq 0
PASS V1.unit: measured=0; required=eq 0
FAIL V1.e2e: measured=1; required=eq 0
PASS V1.parity: measured=0; required=eq 0
FAIL V1.artifact-freshness: measured=14; required=eq 0 artifacts older than last source commit
FAIL V2.freshness: measured=1af92d4d36554f09b78a4ae8bba2ef748f580ed5; required=evidence >= d2def5b5e311fa9946a020b25f758a46c931de06
PASS V2.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS V2.number-height[wave1]: measured=46; required=band [34.66216216216216,57.770270270270274]
PASS V2.number-height[wave3]: measured=46; required=band [34.66216216216216,57.770270270270274]
PASS V2.number-height[boss]: measured=46; required=band [34.66216216216216,57.770270270270274]
PASS V2.active-coverage[wave1]: measured=0.27606119791666667; required=min 0.15
PASS V2.active-coverage[wave3]: measured=0.16379231770833333; required=min 0.15
PASS V2.active-coverage[boss]: measured=0.3190256076388889; required=min 0.15
PASS V2.basic-coverage[wave1]: measured=0.06484592013888889; required=min 0.05
PASS V2.basic-coverage[wave3]: measured=0.052203776041666664; required=min 0.05
PASS V2.basic-coverage[boss]: measured=0.06672634548611112; required=min 0.05
PASS V2.impact-density[wave1]: measured=5.76923076923081; required=min 3.0000000000000027
PASS V2.impact-density[wave3]: measured=5.769230769230769; required=min 3.0000000000000027
PASS V2.impact-density[boss]: measured=5.769230769230769; required=min 3.0000000000000027
PASS V2.high-fps[wave1]: measured=59.93001238496691; required=min 50
PASS V2.high-fps[wave3]: measured=60.05080581351768; required=min 50
PASS V2.high-fps[boss]: measured=60.00482701804433; required=min 50
PASS V2.sequences: measured=36; required=min 36
PASS V2.all-active-coverage: measured=0.21612738715277777; required=min 0.15
PASS V2.all-basic-coverage: measured=0.06421766493055556; required=min 0.05
PASS V2.distinctness: measured=0.5763846476870877; required=max 0.6
PASS V2.sequence-strips: measured=36; required=min 36
PASS V2.typecheck: measured=0; required=eq 0
PASS V2.unit: measured=0; required=eq 0
FAIL V2.e2e: measured=1; required=eq 0
PASS V2.parity: measured=0; required=eq 0
FAIL V2.artifact-freshness: measured=36; required=eq 0 artifacts older than last source commit
PASS V3.freshness: measured=d2def5b5e311fa9946a020b25f758a46c931de06; required=evidence >= d2def5b5e311fa9946a020b25f758a46c931de06
PASS V3.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS V3.cue-density[wave1]: measured=8.193548387096774; required=min 4.775700934579438
PASS V3.cue-density[wave3]: measured=8.792535675082327; required=min 4.775700934579438
PASS V3.cue-density[boss]: measured=7.297297297297298; required=min 4.775700934579438
PASS V3.ultimate-voice[wave1]: measured=1; required=eq 1
PASS V3.ultimate-voice[wave3]: measured=1; required=eq 1
PASS V3.ultimate-voice[boss]: measured=1; required=eq 1
PASS V3.active-voice[wave1]: measured=1; required=eq 1
PASS V3.active-voice[wave3]: measured=1; required=eq 1
PASS V3.active-voice[boss]: measured=1; required=eq 1
PASS V3.unknown-cues[wave1]: measured=0; required=eq 0
PASS V3.unknown-cues[wave3]: measured=0; required=eq 0
PASS V3.unknown-cues[boss]: measured=0; required=eq 0
PASS V3.bark-spacing[wave1]: measured=7.5; required=band [7,8]
PASS V3.bark-spacing[wave3]: measured=7.5; required=band [7,8]
PASS V3.bark-spacing[boss]: measured=7.5; required=band [7,8]
PASS V3.callout-rows: measured=112; required=min 25
PASS V3.callout-table: measured=1; required=min 1
PASS V3.typecheck: measured=0; required=eq 0
PASS V3.unit: measured=0; required=eq 0
FAIL V3.e2e: measured=1; required=eq 0
PASS V3.parity: measured=0; required=eq 0
PASS V3.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
FAIL T1.freshness: measured=missing; required=evidence >= aa8659b245c889ea7d359f19887fd91aba1bf306
FAIL T1.committed-source: measured=missing evidence; required=eq 0 uncommitted source changes
FAIL T1.word-samples[wave1]: measured=missing; required=min 30
FAIL T1.word-samples[wave3]: measured=missing; required=min 30
FAIL T1.word-samples[boss]: measured=missing; required=min 30
FAIL T1.word-max[wave1]: measured=missing; required=max 8
FAIL T1.word-max[wave3]: measured=missing; required=max 8
FAIL T1.word-max[boss]: measured=missing; required=max 8
FAIL T1.system-fonts: measured=missing; required=eq 0
FAIL T1.desktop-small: measured=0; required=min 1
FAIL T1.desktop-large: measured=0; required=min 1
FAIL T1.phone: measured=0; required=min 1
FAIL T1.comparisons: measured=0; required=min 3
FAIL T1.typecheck: measured=missing; required=eq 0
FAIL T1.unit: measured=missing; required=eq 0
FAIL T1.e2e: measured=missing; required=eq 0
FAIL T1.parity: measured=missing; required=eq 0
FAIL T1.artifact-freshness: measured=missing; required=eq 0 artifacts older than last source commit
FAIL SY1.freshness: measured=missing; required=evidence >= source revision
FAIL SY1.committed-source: measured=missing evidence; required=eq 0 uncommitted source changes
FAIL SY1.date: measured=2026-11-13T07:30:01.296Z; required=>= 2026-11-16T12:00:00Z and evidence after that time
FAIL SY1.report: measured=0; required=min 1
FAIL SY1.commit-ids: measured=missing; required=eq 2
FAIL SY1.lint: measured=missing; required=eq 0
FAIL SY1.build: measured=missing; required=eq 0
FAIL SY1.browser-cases: measured=missing; required=eq 13
FAIL SY1.cue-coverage: measured=missing; required=eq 1
FAIL SY1.typecheck: measured=missing; required=eq 0
FAIL SY1.unit: measured=missing; required=eq 0
FAIL SY1.e2e: measured=missing; required=eq 0
FAIL SY1.parity: measured=missing; required=eq 0
FAIL SY1.artifact-freshness: measured=missing; required=eq 0 artifacts older than last source commit
FAIL SY2.freshness: measured=missing; required=evidence >= source revision
FAIL SY2.committed-source: measured=missing evidence; required=eq 0 uncommitted source changes
FAIL SY2.date: measured=2026-11-13T07:30:01.298Z; required=>= 2026-11-18T12:00:00Z and evidence after that time
FAIL SY2.report: measured=0; required=min 1
FAIL SY2.commit-ids: measured=missing; required=eq 2
FAIL SY2.lint: measured=missing; required=eq 0
FAIL SY2.build: measured=missing; required=eq 0
FAIL SY2.browser-cases: measured=missing; required=eq 13
FAIL SY2.cue-coverage: measured=missing; required=eq 1
FAIL SY2.typecheck: measured=missing; required=eq 0
FAIL SY2.unit: measured=missing; required=eq 0
FAIL SY2.e2e: measured=missing; required=eq 0
FAIL SY2.parity: measured=missing; required=eq 0
FAIL SY2.artifact-freshness: measured=missing; required=eq 0 artifacts older than last source commit
FAIL D1.freshness: measured=missing; required=evidence >= 4ab25a4690db7254e039d8db87698f6147eaeec8
FAIL D1.committed-source: measured=missing evidence; required=eq 0 uncommitted source changes
FAIL D1.date: measured=2026-11-13T07:30:01.298Z; required=>= 2026-11-18T12:00:00Z and evidence after that time
FAIL D1.after-sync: measured=missing; required=eq 1
FAIL D1.duration: measured=missing; required=eq 90
FAIL D1.battle-time: measured=missing; required=min 55
FAIL D1.landing-home: measured=missing; required=max 15
FAIL D1.forge-time: measured=missing; required=max 12
FAIL D1.ultimates: measured=missing; required=min 3
FAIL D1.geometry: measured=missing; required=eq 1280
FAIL D1.height: measured=missing; required=eq 720
FAIL D1.fps: measured=missing; required=eq 30
FAIL D1.F1: measured=missing; required=eq 1
FAIL D1.F2: measured=missing; required=eq 1
FAIL D1.M1: measured=missing; required=eq 1
FAIL D1.V1: measured=missing; required=eq 1
FAIL D1.V2: measured=missing; required=eq 1
FAIL D1.loudness: measured=missing; required=band UNMEASURED TARGET
FAIL D1.trailer-seconds: measured=missing; required=eq 30
FAIL D1.trailer-bytes: measured=missing; required=max 6291456
FAIL D1.desktop-copy: measured=missing; required=eq 1
FAIL D1.video: measured=0; required=min 1
FAIL D1.filmstrip: measured=0; required=min 1
FAIL D1.comparisons: measured=0; required=min 6
FAIL D1.typecheck: measured=missing; required=eq 0
FAIL D1.unit: measured=missing; required=eq 0
FAIL D1.e2e: measured=missing; required=eq 0
FAIL D1.parity: measured=missing; required=eq 0
FAIL D1.artifact-freshness: measured=missing; required=eq 0 artifacts older than last source commit
FAIL SY3.freshness: measured=missing; required=evidence >= source revision
FAIL SY3.committed-source: measured=missing evidence; required=eq 0 uncommitted source changes
FAIL SY3.date: measured=2026-11-13T07:30:01.369Z; required=>= 2026-11-19T12:00:00Z and evidence after that time
FAIL SY3.report: measured=0; required=min 1
FAIL SY3.status: measured=1; required=min 1
FAIL SY3.status-lines: measured=missing; required=max 30
FAIL SY3.final-gate-coverage: measured=missing; required=eq 1
FAIL SY3.draft-pr: measured=missing; required=eq 1
FAIL SY3.typecheck: measured=missing; required=eq 0
FAIL SY3.unit: measured=missing; required=eq 0
FAIL SY3.e2e: measured=missing; required=eq 0
FAIL SY3.parity: measured=missing; required=eq 0
FAIL SY3.artifact-freshness: measured=missing; required=eq 0 artifacts older than last source commit
FAIL P.freshness: measured=missing; required=evidence >= source revision
FAIL P.committed-source: measured=missing evidence; required=eq 0 uncommitted source changes
FAIL P.items: measured=missing; required=eq 10
FAIL P.commits: measured=missing; required=min 10
FAIL P.comparisons: measured=missing; required=eq 10
FAIL P.unresolved-partials: measured=missing; required=eq 0
FAIL P.six-camera-variants: measured=missing; required=min 6
FAIL P.low-fps: measured=missing; required=min 30
FAIL P.typecheck: measured=missing; required=eq 0
FAIL P.unit: measured=missing; required=eq 0
FAIL P.e2e: measured=missing; required=eq 0
FAIL P.parity: measured=missing; required=eq 0
FAIL P.artifact-freshness: measured=missing; required=eq 0 artifacts older than last source commit
TOTAL 204 PASS / 126 FAIL / 330 gates

## T1 final verification
```text
PASS T1.freshness: measured=df506d321ab40b3e86f48ddd69a2a754444c2a99; required=evidence >= df506d321ab40b3e86f48ddd69a2a754444c2a99
PASS T1.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS T1.word-samples[wave1]: measured=30; required=min 30
PASS T1.word-samples[wave3]: measured=30; required=min 30
PASS T1.word-samples[boss]: measured=30; required=min 30
PASS T1.word-max[wave1]: measured=3; required=max 8
PASS T1.word-max[wave3]: measured=3; required=max 8
PASS T1.word-max[boss]: measured=3; required=max 8
PASS T1.system-fonts: measured=0; required=eq 0
PASS T1.desktop-small: measured=1; required=min 1
PASS T1.desktop-large: measured=1; required=min 1
PASS T1.phone: measured=1; required=min 1
PASS T1.comparisons: measured=3; required=min 3
PASS T1.typecheck: measured=0; required=eq 0
PASS T1.unit: measured=0; required=eq 0
FAIL T1.e2e: measured=1; required=eq 0
PASS T1.parity: measured=0; required=eq 0
PASS T1.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
TOTAL 17 PASS / 1 FAIL / 18 gates
```

## Q1 current-build closure 2026-11-13T13:19:00.871648+00:00

```text
PASS G0.freshness: measured=c5f9192bc647547278c25f9213be3e80db75399e; required=evidence >= fcd64aac3b8a68d6f271a8bf7de24a3d105e9d7f
PASS G0.suite-freshness: measured=e7ce360769ce3a32d7586ee1df8a434e9cd48d32; required=suite >= fcd64aac3b8a68d6f271a8bf7de24a3d105e9d7f
PASS G0.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS G0.bootstrap-all-fail: measured=347; required=eq 347
PASS G0.bootstrap-gate-count: measured=347; required=min 100
PASS G0.tests: measured=0; required=eq 0
PASS G0.fixtures: measured=3; required=eq 3
PASS G0.fps: measured=30; required=eq 30
PASS G0.fixture-captures: measured=3; required=min 3
PASS G0.checker-test-log: measured=1; required=min 1
PASS G0.bootstrap-log: measured=1; required=min 1
PASS G0.compare-tool: measured=1; required=min 1
PASS G0.capture-tool: measured=1; required=min 1
PASS G0.typecheck: measured=0; required=eq 0
PASS G0.unit: measured=0; required=eq 0
PASS G0.e2e: measured=0; required=eq 0
PASS G0.parity: measured=0; required=eq 0
PASS G0.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS R.freshness: measured=ae12e046fd36daf7633838a26a3579a116d9324e; required=evidence >= ae12e046fd36daf7633838a26a3579a116d9324e
PASS R.suite-freshness: measured=e7ce360769ce3a32d7586ee1df8a434e9cd48d32; required=suite >= ae12e046fd36daf7633838a26a3579a116d9324e
PASS R.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS R.windows: measured=12; required=min 12
PASS R.window-seconds: measured=10; required=min 10
PASS R.ultimate-windows: measured=6; required=min 6
PASS R.unit-boxes: measured=44; required=min 40
PASS R.unit-frames: measured=11; required=min 10
PASS R.number-boxes: measured=33; required=min 30
PASS R.text-frames: measured=10; required=min 10
PASS R.displacement-windows: measured=3; required=min 3
PASS R.scale.median: measured=0.20946; required=min 0
PASS R.scale.p10: measured=0.16723; required=min 0
PASS R.scale.p90: measured=0.22247; required=min 0
PASS R.motion.meanEnergy: measured=22.565131092745876; required=min 0
PASS R.motion.displacementPer10s: measured=0.6666666666666666; required=min 0
PASS R.ultimate.coverageMedian: measured=0.8743749999999999; required=min 0
PASS R.ultimate.peakLuminance: measured=255; required=min 0
PASS R.ultimate.whiteoutFraction: measured=0.05936355311355311; required=min 0
PASS R.ultimate.dominantHues: measured=3; required=min 0
PASS R.ultimate.durationMedian: measured=2.599999999999997; required=min 0
PASS R.numbers.medianHeight720: measured=46.21621621621622; required=min 0
PASS R.numbers.maxSimultaneous: measured=9; required=min 0
PASS R.numbers.impactPerSecond: measured=4.28571428571429; required=min 0
PASS R.text.medianWords: measured=13; required=min 0
PASS R.audio.normalOnsetsPerSecond: measured=5.544373284537969; required=min 0
PASS R.audio.ultimateOnsetsPerSecond: measured=6.822429906542055; required=min 0
PASS R.audio.voiceLikePerMinute: measured=2; required=min 0
PASS R.reference-json: measured=1; required=min 1
PASS R.baseline-json: measured=1; required=min 1
PASS R.research-table: measured=1; required=min 1
PASS R.table-rows: measured=22; required=min 20
PASS R.articles: measured=4; required=min 3
PASS R.motion-rules: measured=12; required=min 12
PASS R.split-pilots: measured=3; required=eq 3
PASS R.layer-types: measured=20; required=min 15
PASS R.targets-measured: measured=1; required=eq 1
PASS R.typecheck: measured=0; required=eq 0
PASS R.unit: measured=0; required=eq 0
PASS R.e2e: measured=0; required=eq 0
PASS R.parity: measured=0; required=eq 0
PASS R.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS F1.freshness: measured=c5f9192bc647547278c25f9213be3e80db75399e; required=evidence >= b6ac286d2cefcbfe008fcf427d2071f69fa8e69f
PASS F1.suite-freshness: measured=e7ce360769ce3a32d7586ee1df8a434e9cd48d32; required=suite >= b6ac286d2cefcbfe008fcf427d2071f69fa8e69f
PASS F1.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS F1.unit-height[wave1@1280x720]: measured=0.2080669501050842; required=band [0.157095,0.26182500000000003]
PASS F1.unit-height[wave3@1280x720]: measured=0.21747252706566694; required=band [0.157095,0.26182500000000003]
PASS F1.unit-height[boss@1280x720]: measured=0.20228747426319904; required=band [0.157095,0.26182500000000003]
PASS F1.unit-height[wave1@1440x900]: measured=0.2080669501050843; required=band [0.157095,0.26182500000000003]
PASS F1.unit-height[wave3@1440x900]: measured=0.21747252706566694; required=band [0.157095,0.26182500000000003]
PASS F1.unit-height[boss@1440x900]: measured=0.20228747426319899; required=band [0.157095,0.26182500000000003]
PASS F1.face-occlusion[wave1@1280x720]: measured=0; required=max 0.1
PASS F1.face-occlusion[wave3@1280x720]: measured=0; required=max 0.1
PASS F1.face-occlusion[boss@1280x720]: measured=0; required=max 0.1
PASS F1.face-occlusion[wave1@1440x900]: measured=0; required=max 0.1
PASS F1.face-occlusion[wave3@1440x900]: measured=0.0018061181589966798; required=max 0.1
PASS F1.face-occlusion[boss@1440x900]: measured=0; required=max 0.1
PASS F1.clipping[wave1@1280x720]: measured=0; required=eq 0
PASS F1.clipping[wave3@1280x720]: measured=0; required=eq 0
PASS F1.clipping[boss@1280x720]: measured=0; required=eq 0
PASS F1.clipping[wave1@1440x900]: measured=0; required=eq 0
PASS F1.clipping[wave3@1440x900]: measured=0; required=eq 0
PASS F1.clipping[boss@1440x900]: measured=0; required=eq 0
PASS F1.floor[wave1@1280x720]: measured=0.6295568181818182; required=min 0.5
PASS F1.floor[wave3@1280x720]: measured=0.5163139204545455; required=min 0.5
PASS F1.floor[boss@1280x720]: measured=0.5814076704545454; required=min 0.5
PASS F1.floor[wave1@1440x900]: measured=0.6211691400304414; required=min 0.5
PASS F1.floor[wave3@1440x900]: measured=0.5052768264840183; required=min 0.5
PASS F1.floor[boss@1440x900]: measured=0.5707267884322679; required=min 0.5
PASS F1.field-names[wave1@1280x720]: measured=0; required=eq 0
PASS F1.field-names[wave3@1280x720]: measured=0; required=eq 0
PASS F1.field-names[boss@1280x720]: measured=0; required=eq 0
PASS F1.field-names[wave1@1440x900]: measured=0; required=eq 0
PASS F1.field-names[wave3@1440x900]: measured=0; required=eq 0
PASS F1.field-names[boss@1440x900]: measured=0; required=eq 0
PASS F1.core-size: measured=0; required=eq 0
PASS F1.comparisons: measured=3; required=min 3
PASS F1.typecheck: measured=0; required=eq 0
PASS F1.unit: measured=0; required=eq 0
PASS F1.e2e: measured=0; required=eq 0
PASS F1.parity: measured=0; required=eq 0
PASS F1.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS F2.freshness: measured=ec01ea423ca3928db42e5eacc7e42aef76254c57; required=evidence >= ec01ea423ca3928db42e5eacc7e42aef76254c57
PASS F2.suite-freshness: measured=e7ce360769ce3a32d7586ee1df8a434e9cd48d32; required=suite >= ec01ea423ca3928db42e5eacc7e42aef76254c57
PASS F2.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS F2.alpha[wave1]: measured=1; required=min 0.97
PASS F2.alpha[wave3]: measured=1; required=min 0.97
PASS F2.alpha[boss]: measured=1; required=min 0.97
PASS F2.persistent-bubbles[wave1]: measured=0; required=eq 0
PASS F2.persistent-bubbles[wave3]: measured=0; required=eq 0
PASS F2.persistent-bubbles[boss]: measured=0; required=eq 0
PASS F2.contrast[wave1]: measured=39.69182659063967; required=min 18
PASS F2.contrast[wave3]: measured=39.69182659063967; required=min 18
PASS F2.contrast[boss]: measured=39.69182659063967; required=min 18
PASS F2.comparisons: measured=3; required=min 3
PASS F2.typecheck: measured=0; required=eq 0
PASS F2.unit: measured=0; required=eq 0
PASS F2.e2e: measured=0; required=eq 0
PASS F2.parity: measured=0; required=eq 0
PASS F2.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS M2.freshness: measured=341567cfb9a2e3e974de03bda6f4f649542fc103; required=evidence >= 341567cfb9a2e3e974de03bda6f4f649542fc103
PASS M2.suite-freshness: measured=e7ce360769ce3a32d7586ee1df8a434e9cd48d32; required=suite >= 341567cfb9a2e3e974de03bda6f4f649542fc103
PASS M2.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS M2.units-inspected: measured=22; required=eq 22
PASS M2.separate-parts: measured=22; required=min 20
PASS M2.visible-faces: measured=22; required=eq 22
PASS M2.zero-holes: measured=18; required=min 18
PASS M2.remaining-holes: measured=79; required=max 150
PASS M2.extreme-poses: measured=8; required=min 8
PASS M2.joint-overlap: measured=12; required=min 12
PASS M2.core-size: measured=0; required=eq 0
PASS M2.face-strips: measured=23; required=min 22
PASS M2.typecheck: measured=0; required=eq 0
PASS M2.unit: measured=0; required=eq 0
PASS M2.e2e: measured=0; required=eq 0
PASS M2.parity: measured=0; required=eq 0
PASS M2.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS V1.freshness: measured=c7ff00b92a7a18d658a5b24c4576d20ecbea1046; required=evidence >= c7ff00b92a7a18d658a5b24c4576d20ecbea1046
PASS V1.suite-freshness: measured=e7ce360769ce3a32d7586ee1df8a434e9cd48d32; required=suite >= c7ff00b92a7a18d658a5b24c4576d20ecbea1046
PASS V1.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS V1.plate-count: measured=13; required=eq 13
PASS V1.coverage: measured=0.625700284090909; required=min 0.6120624999999998
PASS V1.viewport: measured=1; required=eq 1
PASS V1.edges: measured=2; required=eq 2
PASS V1.layer-types: measured=11; required=min 7
PASS V1.particles: measured=480; required=min 300
PASS V1.beats: measured=3; required=min 3
PASS V1.distinctness: measured=0.18218093990217687; required=max 0.55
PASS V1.pair-count: measured=78; required=eq 78
PASS V1.bytes: measured=20157327; required=max 20971520
PASS V1.motif-area: measured=0.46392361111111113; required=min 0.4
PASS V1.camera-paths: measured=13; required=eq 13
PASS V1.comparisons: measured=13; required=min 13
PASS V1.render-log: measured=1; required=min 1
PASS V1.typecheck: measured=0; required=eq 0
PASS V1.unit: measured=0; required=eq 0
PASS V1.e2e: measured=0; required=eq 0
PASS V1.parity: measured=0; required=eq 0
PASS V1.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS V2.freshness: measured=e7ce360769ce3a32d7586ee1df8a434e9cd48d32; required=evidence >= a40eb3bea88598ad1f27c9d90a9f3d4fe2ec3a94
PASS V2.suite-freshness: measured=e7ce360769ce3a32d7586ee1df8a434e9cd48d32; required=suite >= a40eb3bea88598ad1f27c9d90a9f3d4fe2ec3a94
PASS V2.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS V2.input-freshness: measured=0; required=eq 0 missing or stale raw captures/reviews
PASS V2.number-height[wave1]: measured=46; required=band [34.66216216216216,57.770270270270274]
PASS V2.number-height[wave3]: measured=46; required=band [34.66216216216216,57.770270270270274]
PASS V2.number-height[boss]: measured=46; required=band [34.66216216216216,57.770270270270274]
PASS V2.active-coverage[wave1]: measured=0.2562977430555556; required=min 0.15
PASS V2.active-coverage[wave3]: measured=0.163154296875; required=min 0.15
PASS V2.active-coverage[boss]: measured=0.3271169704861111; required=min 0.15
PASS V2.basic-coverage[wave1]: measured=0.053942057291666665; required=min 0.05
PASS V2.basic-coverage[wave3]: measured=0.07492513020833333; required=min 0.05
PASS V2.basic-coverage[boss]: measured=0.07865559895833334; required=min 0.05
PASS V2.impact-density[wave1]: measured=5.769230769230728; required=min 3.0000000000000027
PASS V2.impact-density[wave3]: measured=5.76923076923085; required=min 3.0000000000000027
PASS V2.impact-density[boss]: measured=5.769230769230728; required=min 3.0000000000000027
PASS V2.high-fps[wave1]: measured=60.053306679993334; required=min 50
PASS V2.high-fps[wave3]: measured=60.008322929671245; required=min 50
PASS V2.high-fps[boss]: measured=60.01131974967843; required=min 50
PASS V2.sequences: measured=36; required=min 36
PASS V2.all-active-coverage: measured=0.23224283854166666; required=min 0.15
PASS V2.all-basic-coverage: measured=0.06520290798611111; required=min 0.05
PASS V2.distinctness: measured=0.5459541153139136; required=max 0.6
PASS V2.sequence-strips: measured=36; required=min 36
PASS V2.typecheck: measured=0; required=eq 0
PASS V2.unit: measured=0; required=eq 0
PASS V2.e2e: measured=0; required=eq 0
PASS V2.parity: measured=0; required=eq 0
PASS V2.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS V3.freshness: measured=b55fef878076ed880504f74a8719dc1f33839c72; required=evidence >= a40eb3bea88598ad1f27c9d90a9f3d4fe2ec3a94
PASS V3.suite-freshness: measured=e7ce360769ce3a32d7586ee1df8a434e9cd48d32; required=suite >= a40eb3bea88598ad1f27c9d90a9f3d4fe2ec3a94
PASS V3.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS V3.cue-density[wave1]: measured=7.54945054945055; required=min 4.775700934579438
PASS V3.cue-density[wave3]: measured=7.5809935205183585; required=min 4.775700934579438
PASS V3.cue-density[boss]: measured=6.983805668016195; required=min 4.775700934579438
PASS V3.ultimate-voice[wave1]: measured=1; required=eq 1
PASS V3.ultimate-voice[wave3]: measured=1; required=eq 1
PASS V3.ultimate-voice[boss]: measured=1; required=eq 1
PASS V3.active-voice[wave1]: measured=1; required=eq 1
PASS V3.active-voice[wave3]: measured=1; required=eq 1
PASS V3.active-voice[boss]: measured=1; required=eq 1
PASS V3.unknown-cues[wave1]: measured=0; required=eq 0
PASS V3.unknown-cues[wave3]: measured=0; required=eq 0
PASS V3.unknown-cues[boss]: measured=0; required=eq 0
PASS V3.bark-spacing[wave1]: measured=7.5; required=band [7,8]
PASS V3.bark-spacing[wave3]: measured=7.5; required=band [7,8]
PASS V3.bark-spacing[boss]: measured=7.5; required=band [7,8]
PASS V3.callout-rows: measured=112; required=min 25
PASS V3.callout-table: measured=1; required=min 1
PASS V3.typecheck: measured=0; required=eq 0
PASS V3.unit: measured=0; required=eq 0
PASS V3.e2e: measured=0; required=eq 0
PASS V3.parity: measured=0; required=eq 0
PASS V3.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS T1.freshness: measured=e7ce360769ce3a32d7586ee1df8a434e9cd48d32; required=evidence >= a40eb3bea88598ad1f27c9d90a9f3d4fe2ec3a94
PASS T1.suite-freshness: measured=e7ce360769ce3a32d7586ee1df8a434e9cd48d32; required=suite >= a40eb3bea88598ad1f27c9d90a9f3d4fe2ec3a94
PASS T1.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS T1.word-samples[wave1]: measured=30; required=min 30
PASS T1.word-samples[wave3]: measured=30; required=min 30
PASS T1.word-samples[boss]: measured=30; required=min 30
PASS T1.word-max[wave1]: measured=3; required=max 8
PASS T1.word-max[wave3]: measured=3; required=max 8
PASS T1.word-max[boss]: measured=3; required=max 8
PASS T1.system-fonts: measured=0; required=eq 0
PASS T1.desktop-small: measured=1; required=min 1
PASS T1.desktop-large: measured=1; required=min 1
PASS T1.phone: measured=1; required=min 1
PASS T1.comparisons: measured=3; required=min 3
PASS T1.typecheck: measured=0; required=eq 0
PASS T1.unit: measured=0; required=eq 0
PASS T1.e2e: measured=0; required=eq 0
PASS T1.parity: measured=0; required=eq 0
PASS T1.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
TOTAL 230 PASS / 0 FAIL / 230 gates
```

## SOLO Q2: timing + real combined audio

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

## Q3 final verification 2026-11-13T16:15:40.347744+00:00

```text
PASS G0.freshness: measured=af1e1fdf32fb184fb597bfc59888376c653ef005; required=evidence >= 4a0dc810dd1ac99f8eb58f0cf5e42f4bb3965ca7
PASS G0.suite-freshness: measured=af1e1fdf32fb184fb597bfc59888376c653ef005; required=suite >= 4a0dc810dd1ac99f8eb58f0cf5e42f4bb3965ca7
PASS G0.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS G0.bootstrap-all-fail: measured=347; required=eq 347
PASS G0.bootstrap-gate-count: measured=347; required=min 100
PASS G0.tests: measured=0; required=eq 0
PASS G0.fixtures: measured=3; required=eq 3
PASS G0.fps: measured=30; required=eq 30
PASS G0.fixture-captures: measured=3; required=min 3
PASS G0.checker-test-log: measured=1; required=min 1
PASS G0.bootstrap-log: measured=1; required=min 1
PASS G0.compare-tool: measured=1; required=min 1
PASS G0.capture-tool: measured=1; required=min 1
PASS G0.typecheck: measured=0; required=eq 0
PASS G0.unit: measured=0; required=eq 0
PASS G0.e2e: measured=0; required=eq 0
PASS G0.parity: measured=0; required=eq 0
PASS G0.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS R.freshness: measured=ae12e046fd36daf7633838a26a3579a116d9324e; required=evidence >= ae12e046fd36daf7633838a26a3579a116d9324e
PASS R.suite-freshness: measured=e7ce360769ce3a32d7586ee1df8a434e9cd48d32; required=suite >= ae12e046fd36daf7633838a26a3579a116d9324e
PASS R.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS R.windows: measured=12; required=min 12
PASS R.window-seconds: measured=10; required=min 10
PASS R.ultimate-windows: measured=6; required=min 6
PASS R.unit-boxes: measured=44; required=min 40
PASS R.unit-frames: measured=11; required=min 10
PASS R.number-boxes: measured=33; required=min 30
PASS R.text-frames: measured=10; required=min 10
PASS R.displacement-windows: measured=3; required=min 3
PASS R.scale.median: measured=0.20946; required=min 0
PASS R.scale.p10: measured=0.16723; required=min 0
PASS R.scale.p90: measured=0.22247; required=min 0
PASS R.motion.meanEnergy: measured=22.565131092745876; required=min 0
PASS R.motion.displacementPer10s: measured=0.6666666666666666; required=min 0
PASS R.ultimate.coverageMedian: measured=0.8743749999999999; required=min 0
PASS R.ultimate.peakLuminance: measured=255; required=min 0
PASS R.ultimate.whiteoutFraction: measured=0.05936355311355311; required=min 0
PASS R.ultimate.dominantHues: measured=3; required=min 0
PASS R.ultimate.durationMedian: measured=2.599999999999997; required=min 0
PASS R.numbers.medianHeight720: measured=46.21621621621622; required=min 0
PASS R.numbers.maxSimultaneous: measured=9; required=min 0
PASS R.numbers.impactPerSecond: measured=4.28571428571429; required=min 0
PASS R.text.medianWords: measured=13; required=min 0
PASS R.audio.normalOnsetsPerSecond: measured=5.544373284537969; required=min 0
PASS R.audio.ultimateOnsetsPerSecond: measured=6.822429906542055; required=min 0
PASS R.audio.voiceLikePerMinute: measured=2; required=min 0
PASS R.reference-json: measured=1; required=min 1
PASS R.baseline-json: measured=1; required=min 1
PASS R.research-table: measured=1; required=min 1
PASS R.table-rows: measured=22; required=min 20
PASS R.articles: measured=4; required=min 3
PASS R.motion-rules: measured=12; required=min 12
PASS R.split-pilots: measured=3; required=eq 3
PASS R.layer-types: measured=20; required=min 15
PASS R.targets-measured: measured=1; required=eq 1
PASS R.typecheck: measured=0; required=eq 0
PASS R.unit: measured=0; required=eq 0
PASS R.e2e: measured=0; required=eq 0
PASS R.parity: measured=0; required=eq 0
PASS R.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS F1.freshness: measured=af1e1fdf32fb184fb597bfc59888376c653ef005; required=evidence >= 134f13e711208b825f71e860ba029a31c287dce3
PASS F1.suite-freshness: measured=af1e1fdf32fb184fb597bfc59888376c653ef005; required=suite >= 134f13e711208b825f71e860ba029a31c287dce3
PASS F1.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS F1.unit-height[wave1@1280x720]: measured=0.20676215855120456; required=band [0.157095,0.26182500000000003]
PASS F1.unit-height[wave3@1280x720]: measured=0.2215818039782693; required=band [0.157095,0.26182500000000003]
PASS F1.unit-height[boss@1280x720]: measured=0.20554791138210932; required=band [0.157095,0.26182500000000003]
PASS F1.unit-height[wave1@1440x900]: measured=0.20676215855120447; required=band [0.157095,0.26182500000000003]
PASS F1.unit-height[wave3@1440x900]: measured=0.22158180397826924; required=band [0.157095,0.26182500000000003]
PASS F1.unit-height[boss@1440x900]: measured=0.20554791138210918; required=band [0.157095,0.26182500000000003]
PASS F1.face-occlusion[wave1@1280x720]: measured=0; required=max 0.1
PASS F1.face-occlusion[wave3@1280x720]: measured=0; required=max 0.1
PASS F1.face-occlusion[boss@1280x720]: measured=0; required=max 0.1
PASS F1.face-occlusion[wave1@1440x900]: measured=0; required=max 0.1
PASS F1.face-occlusion[wave3@1440x900]: measured=0.003386293028293538; required=max 0.1
PASS F1.face-occlusion[boss@1440x900]: measured=0; required=max 0.1
PASS F1.clipping[wave1@1280x720]: measured=0; required=eq 0
PASS F1.clipping[wave3@1280x720]: measured=0; required=eq 0
PASS F1.clipping[boss@1280x720]: measured=0; required=eq 0
PASS F1.clipping[wave1@1440x900]: measured=0; required=eq 0
PASS F1.clipping[wave3@1440x900]: measured=0; required=eq 0
PASS F1.clipping[boss@1440x900]: measured=0; required=eq 0
PASS F1.floor[wave1@1280x720]: measured=0.6295369318181818; required=min 0.5
PASS F1.floor[wave3@1280x720]: measured=0.5162088068181818; required=min 0.5
PASS F1.floor[boss@1280x720]: measured=0.5813480113636363; required=min 0.5
PASS F1.floor[wave1@1440x900]: measured=0.6209446347031964; required=min 0.5
PASS F1.floor[wave3@1440x900]: measured=0.5049448249619483; required=min 0.5
PASS F1.floor[boss@1440x900]: measured=0.570519406392694; required=min 0.5
PASS F1.field-names[wave1@1280x720]: measured=0; required=eq 0
PASS F1.field-names[wave3@1280x720]: measured=0; required=eq 0
PASS F1.field-names[boss@1280x720]: measured=0; required=eq 0
PASS F1.field-names[wave1@1440x900]: measured=0; required=eq 0
PASS F1.field-names[wave3@1440x900]: measured=0; required=eq 0
PASS F1.field-names[boss@1440x900]: measured=0; required=eq 0
PASS F1.core-size: measured=0; required=eq 0
PASS F1.comparisons: measured=3; required=min 3
PASS F1.typecheck: measured=0; required=eq 0
PASS F1.unit: measured=0; required=eq 0
PASS F1.e2e: measured=0; required=eq 0
PASS F1.parity: measured=0; required=eq 0
PASS F1.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS F2.freshness: measured=e9493db6e147c28e1d39b25e90d56a940593959b; required=evidence >= e9493db6e147c28e1d39b25e90d56a940593959b
PASS F2.suite-freshness: measured=af1e1fdf32fb184fb597bfc59888376c653ef005; required=suite >= e9493db6e147c28e1d39b25e90d56a940593959b
PASS F2.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS F2.alpha[wave1]: measured=1; required=min 0.97
PASS F2.alpha[wave3]: measured=1; required=min 0.97
PASS F2.alpha[boss]: measured=1; required=min 0.97
PASS F2.persistent-bubbles[wave1]: measured=0; required=eq 0
PASS F2.persistent-bubbles[wave3]: measured=0; required=eq 0
PASS F2.persistent-bubbles[boss]: measured=0; required=eq 0
PASS F2.contrast[wave1]: measured=39.72415996830986; required=min 18
PASS F2.contrast[wave3]: measured=39.72415996830986; required=min 18
PASS F2.contrast[boss]: measured=39.72415996830986; required=min 18
PASS F2.comparisons: measured=3; required=min 3
PASS F2.typecheck: measured=0; required=eq 0
PASS F2.unit: measured=0; required=eq 0
PASS F2.e2e: measured=0; required=eq 0
PASS F2.parity: measured=0; required=eq 0
PASS F2.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS M1.freshness: measured=af1e1fdf32fb184fb597bfc59888376c653ef005; required=evidence >= e9493db6e147c28e1d39b25e90d56a940593959b
PASS M1.suite-freshness: measured=af1e1fdf32fb184fb597bfc59888376c653ef005; required=suite >= e9493db6e147c28e1d39b25e90d56a940593959b
PASS M1.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS M1.input-freshness: measured=0; required=eq 0 missing or stale raw captures/reviews
PASS M1.seconds[wave1]: measured=30.333333333333332; required=min 30
PASS M1.seconds[wave3]: measured=30.866666666666667; required=min 30
PASS M1.seconds[boss]: measured=32.93333333333333; required=min 30
PASS M1.displacements[wave1]: measured=17.802197802197803; required=min 2
PASS M1.displacements[wave3]: measured=17.170626349892007; required=min 2
PASS M1.displacements[boss]: measured=16.396761133603242; required=min 2
PASS M1.motion-energy[wave1]: measured=15.908401105663565; required=min 15.795591764922111
PASS M1.motion-energy[wave3]: measured=17.3206211638141; required=min 15.795591764922111
PASS M1.motion-energy[boss]: measured=17.095655655063755; required=min 15.795591764922111
PASS M1.every-action-moves[wave1]: measured=0.1052002746839527; required=min 0.06
PASS M1.every-action-moves[wave3]: measured=0.1052002746839527; required=min 0.06
PASS M1.every-action-moves[boss]: measured=0.1052002746839527; required=min 0.06
PASS M1.hit-knockback[wave1]: measured=1; required=eq 1
PASS M1.hit-knockback[wave3]: measured=1; required=eq 1
PASS M1.hit-knockback[boss]: measured=1; required=eq 1
PASS M1.high-fps[wave1]: measured=59.95553297967696; required=min 50
PASS M1.high-fps[wave3]: measured=60.046304778764494; required=min 50
PASS M1.high-fps[boss]: measured=59.94804502761296; required=min 50
PASS M1.crowded-units: measured=10; required=min 10
PASS M1.archetype-strips: measured=12; required=min 6
PASS M1.typecheck: measured=0; required=eq 0
PASS M1.unit: measured=0; required=eq 0
PASS M1.e2e: measured=0; required=eq 0
PASS M1.parity: measured=0; required=eq 0
PASS M1.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS M2.freshness: measured=af1e1fdf32fb184fb597bfc59888376c653ef005; required=evidence >= e9493db6e147c28e1d39b25e90d56a940593959b
PASS M2.suite-freshness: measured=af1e1fdf32fb184fb597bfc59888376c653ef005; required=suite >= e9493db6e147c28e1d39b25e90d56a940593959b
PASS M2.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS M2.units-inspected: measured=22; required=eq 22
PASS M2.separate-parts: measured=22; required=min 20
PASS M2.visible-faces: measured=22; required=eq 22
PASS M2.zero-holes: measured=18; required=min 18
PASS M2.remaining-holes: measured=79; required=max 150
PASS M2.extreme-poses: measured=8; required=min 8
PASS M2.joint-overlap: measured=12; required=min 12
PASS M2.core-size: measured=0; required=eq 0
PASS M2.face-strips: measured=23; required=min 22
PASS M2.typecheck: measured=0; required=eq 0
PASS M2.unit: measured=0; required=eq 0
PASS M2.e2e: measured=0; required=eq 0
PASS M2.parity: measured=0; required=eq 0
PASS M2.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS V1.freshness: measured=af1e1fdf32fb184fb597bfc59888376c653ef005; required=evidence >= af1e1fdf32fb184fb597bfc59888376c653ef005
PASS V1.suite-freshness: measured=af1e1fdf32fb184fb597bfc59888376c653ef005; required=suite >= af1e1fdf32fb184fb597bfc59888376c653ef005
PASS V1.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS V1.plate-count: measured=13; required=eq 13
PASS V1.coverage: measured=0.6254928977272727; required=min 0.6120624999999998
PASS V1.viewport: measured=1; required=eq 1
PASS V1.edges: measured=2; required=eq 2
PASS V1.layer-types: measured=11; required=min 7
PASS V1.particles: measured=480; required=min 300
PASS V1.beats: measured=3; required=min 3
PASS V1.distinctness: measured=0.18218093990217687; required=max 0.55
PASS V1.pair-count: measured=78; required=eq 78
PASS V1.bytes: measured=20157327; required=max 20971520
PASS V1.motif-area: measured=0.46392361111111113; required=min 0.4
PASS V1.camera-paths: measured=13; required=eq 13
PASS V1.comparisons: measured=13; required=min 13
PASS V1.render-log: measured=1; required=min 1
PASS V1.typecheck: measured=0; required=eq 0
PASS V1.unit: measured=0; required=eq 0
PASS V1.e2e: measured=0; required=eq 0
PASS V1.parity: measured=0; required=eq 0
PASS V1.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS V2.freshness: measured=af1e1fdf32fb184fb597bfc59888376c653ef005; required=evidence >= e9493db6e147c28e1d39b25e90d56a940593959b
PASS V2.suite-freshness: measured=af1e1fdf32fb184fb597bfc59888376c653ef005; required=suite >= e9493db6e147c28e1d39b25e90d56a940593959b
PASS V2.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS V2.input-freshness: measured=0; required=eq 0 missing or stale raw captures/reviews
PASS V2.number-height[wave1]: measured=46; required=band [34.66216216216216,57.770270270270274]
PASS V2.number-height[wave3]: measured=46; required=band [34.66216216216216,57.770270270270274]
PASS V2.number-height[boss]: measured=46; required=band [34.66216216216216,57.770270270270274]
PASS V2.active-coverage[wave1]: measured=0.25296332465277777; required=min 0.15
PASS V2.active-coverage[wave3]: measured=0.16555338541666667; required=min 0.15
PASS V2.active-coverage[boss]: measured=0.328974609375; required=min 0.15
PASS V2.basic-coverage[wave1]: measured=0.09510308159722222; required=min 0.05
PASS V2.basic-coverage[wave3]: measured=0.07045572916666666; required=min 0.05
PASS V2.basic-coverage[boss]: measured=0.0726974826388889; required=min 0.05
PASS V2.impact-density[wave1]: measured=5.769230769230728; required=min 3.0000000000000027
PASS V2.impact-density[wave3]: measured=5.76923076923085; required=min 3.0000000000000027
PASS V2.impact-density[boss]: measured=5.769230769230728; required=min 3.0000000000000027
PASS V2.high-fps[wave1]: measured=60.03480519911581; required=min 50
PASS V2.high-fps[wave3]: measured=60.05606341657097; required=min 50
PASS V2.high-fps[boss]: measured=60.0518061351273; required=min 50
PASS V2.sequences: measured=36; required=min 36
PASS V2.all-active-coverage: measured=0.23277560763888888; required=min 0.15
PASS V2.all-basic-coverage: measured=0.06610894097222222; required=min 0.05
PASS V2.distinctness: measured=0.5463187399806122; required=max 0.6
PASS V2.sequence-strips: measured=36; required=min 36
PASS V2.typecheck: measured=0; required=eq 0
PASS V2.unit: measured=0; required=eq 0
PASS V2.e2e: measured=0; required=eq 0
PASS V2.parity: measured=0; required=eq 0
PASS V2.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS V3.freshness: measured=e9493db6e147c28e1d39b25e90d56a940593959b; required=evidence >= a6cfbb3014f09719bec2584ecfcd6f8126e183df
PASS V3.suite-freshness: measured=af1e1fdf32fb184fb597bfc59888376c653ef005; required=suite >= a6cfbb3014f09719bec2584ecfcd6f8126e183df
PASS V3.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS V3.cue-density[wave1]: measured=7.54945054945055; required=min 4.775700934579438
PASS V3.cue-density[wave3]: measured=7.5809935205183585; required=min 4.775700934579438
PASS V3.cue-density[boss]: measured=6.983805668016195; required=min 4.775700934579438
PASS V3.ultimate-voice[wave1]: measured=1; required=eq 1
PASS V3.ultimate-voice[wave3]: measured=1; required=eq 1
PASS V3.ultimate-voice[boss]: measured=1; required=eq 1
PASS V3.active-voice[wave1]: measured=1; required=eq 1
PASS V3.active-voice[wave3]: measured=1; required=eq 1
PASS V3.active-voice[boss]: measured=1; required=eq 1
PASS V3.unknown-cues[wave1]: measured=0; required=eq 0
PASS V3.unknown-cues[wave3]: measured=0; required=eq 0
PASS V3.unknown-cues[boss]: measured=0; required=eq 0
PASS V3.bark-spacing[wave1]: measured=7.5; required=band [7,8]
PASS V3.bark-spacing[wave3]: measured=7.5; required=band [7,8]
PASS V3.bark-spacing[boss]: measured=7.5; required=band [7,8]
PASS V3.callout-rows: measured=112; required=min 25
PASS V3.callout-table: measured=1; required=min 1
PASS V3.typecheck: measured=0; required=eq 0
PASS V3.unit: measured=0; required=eq 0
PASS V3.e2e: measured=0; required=eq 0
PASS V3.parity: measured=0; required=eq 0
PASS V3.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS T1.freshness: measured=e7ce360769ce3a32d7586ee1df8a434e9cd48d32; required=evidence >= a40eb3bea88598ad1f27c9d90a9f3d4fe2ec3a94
PASS T1.suite-freshness: measured=e7ce360769ce3a32d7586ee1df8a434e9cd48d32; required=suite >= a40eb3bea88598ad1f27c9d90a9f3d4fe2ec3a94
PASS T1.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS T1.word-samples[wave1]: measured=30; required=min 30
PASS T1.word-samples[wave3]: measured=30; required=min 30
PASS T1.word-samples[boss]: measured=30; required=min 30
PASS T1.word-max[wave1]: measured=3; required=max 8
PASS T1.word-max[wave3]: measured=3; required=max 8
PASS T1.word-max[boss]: measured=3; required=max 8
PASS T1.system-fonts: measured=0; required=eq 0
PASS T1.desktop-small: measured=1; required=min 1
PASS T1.desktop-large: measured=1; required=min 1
PASS T1.phone: measured=1; required=min 1
PASS T1.comparisons: measured=3; required=min 3
PASS T1.typecheck: measured=0; required=eq 0
PASS T1.unit: measured=0; required=eq 0
PASS T1.e2e: measured=0; required=eq 0
PASS T1.parity: measured=0; required=eq 0
PASS T1.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
TOTAL 259 PASS / 0 FAIL / 259 gates
```
