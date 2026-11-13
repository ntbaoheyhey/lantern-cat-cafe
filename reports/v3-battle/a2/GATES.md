# V3-A2 gate results

```text
PASS G0.freshness: measured=506a79d750f772bc0b96776bc2cef8b9b3ff3f3c; required=evidence >= 506a79d750f772bc0b96776bc2cef8b9b3ff3f3c
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
PASS G0.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
TOTAL 16 PASS / 1 FAIL / 17 gates
```

## R measured research
```
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
TOTAL 40 PASS / 1 FAIL / 41 gates
```

## F1 field scale
```
PASS F1.freshness: measured=c55e4ed0dbf287eee865f69236a22ae160d5f14d; required=evidence >= c55e4ed0dbf287eee865f69236a22ae160d5f14d
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
PASS F1.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
TOTAL 38 PASS / 1 FAIL / 39 gates
```

## F2 — 2026-11-13
```text
PASS F2.freshness: measured=e502656bd0c3a703bee3dd9158411dade777cbab; required=evidence >= e502656bd0c3a703bee3dd9158411dade777cbab
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
PASS F2.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
TOTAL 16 PASS / 1 FAIL / 17 gates
```

## M2 fresh source 341567cfb
```text
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
TOTAL 14 PASS / 2 FAIL / 16 gates
```

## V1 encoded plate audit
```text
PASS V1.freshness: measured=d03416bbab0c887ca8d7f5167eea4e3caa6f8d46; required=evidence >= d03416bbab0c887ca8d7f5167eea4e3caa6f8d46
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
PASS V1.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
TOTAL 20 PASS / 1 FAIL / 21 gates
```

## V2 current measured gates
PASS V2.freshness: measured=1af92d4d36554f09b78a4ae8bba2ef748f580ed5; required=evidence >= 1af92d4d36554f09b78a4ae8bba2ef748f580ed5
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
PASS V2.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
TOTAL 26 PASS / 1 FAIL / 27 gates
