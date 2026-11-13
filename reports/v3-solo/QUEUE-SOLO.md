# Solo priority queue

Time triggers preempt Q0-Q9. A = /Users/bao/taskbar-hero-cardrpg-a6; B = /Users/bao/taskbar-hero-chain.

| Item | State | Worktree | Evidence / gates | Item log |
|---|---|---|---|---|
| Q0 | done | B then A | Q0-RESULT.json; saved evidence/source and all tests | STARTED 2026-11-13 12:26:47 UTC; PASS Q0.A.clean=0; PASS Q0.B.clean=0; PASS both pushes; A ca90150a5 B e281e4d73; ENDED 2026-11-13 12:38:57 UTC |
| Q1 | done | B then A | 435/435 browser; B E2E; 33 word-budget screens | STARTED 2026-11-13 12:39:36 UTC; A e7ce36076 B c32b6475f; 230 PASS/0 FAIL; ENDED 2026-11-13T13:19:00.871648+00:00 |
| Q2 | done | A then B | 0 interrupted ults; skill <=5%; contours 3.25-6.75/min; parity | STARTED 2026-11-13T13:20:12.094442+00:00; PASS59/59; A18ea6e6e8 B298a4fbd8/evidence fa65a9b40; ENDED 2026-11-13T14:38:34.072973+00:00 |
| Q3 | done | A | M1 29/29; dependencies 259/259; SOLO9/9; High59.95–60.05; parity | STARTED 2026-11-13T14:39:07.792289+00:00; PASS 259 A +9 SOLO; source af1e1fdf3; evidence a881b1fc8; ENDED 2026-11-13T16:15:40.347744+00:00 |
| Q4 | done | B | E3-E5 24/24 PASS;85 assumptions,170 cases,0 misses; current suite435/435 PASS | STARTED 2026-11-13T16:16:50.578116+00:00; evidence838434f59; ENDED 2026-11-13T22:45:54.020159+00:00 |
| Q5 | done | B (+ A texts) | V8/8, S5 all PASS; 50/50 ultimate,62/62 skill; 6 full renders; reel90.054s; suite435 browser PASS | STARTED 2026-11-13T17:25:44.984813+00:00; source422585ca5/evidence d67b0a303; ENDED 2026-11-13T21:25:40.344963+00:00 |
| Q6 | done | B | U3 9/9 PASS;54/54 screens;435/435 browser; types/unit PASS;24 phone samples | STARTED 2026-11-13T21:17:35.227574+00:00; sourceB9b25782ff,Af6dc3cadd; ENDED 2026-11-13T22:45:54.020159+00:00 |
| Q7 | done | A | 259 A +8 Q7 +9 Q3 PASS;IoU max.8203;saturation.815–.866;luminance1.003;High60FPS;browser435/435 | STARTED 2026-11-13T22:46:49.566670+00:00; source9b4323716/media16cb6cdfc/measurementb066e4caa; ENDED 2026-11-13T23:21:53.009864+00:00 |
| Q8 | done | B (+ A attributes) | T1 90/90,0 fallback;C1 3/4;7 gates PASS;browser435/435,unit/types/parity PASS | STARTED 2026-11-13T23:10:58.474439+00:00;A14a4f33bb,B496df289b;ENDED 2026-11-13T23:50:37.928363+00:00 |
| Q9 | todo | A/B by ownership | Open items then A P1, B P1-P8, E6 if E3 passed |  |
| S1 | scheduled | A then B | 2026-11-16 12:00 UTC; SYNC-16 |  |
| S2 | scheduled | A then B | 2026-11-18 12:00 UTC; SYNC-18 + D1 |  |
| S3 | scheduled | A/B | 2026-11-19 12:00 UTC; FREEZE final reports/checkers |  |

## Q1 checker evidence

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
PASS Q1.A.browser: measured435/435 required435/435
PASS Q1.B.browser: measured435/435 required435/435
PASS Q1.words: measured33/33 max25 required33/33 max25
```

## Q2 checker evidence

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

## Q3 checker evidence

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
PASS Q3.wave1.enemy-actions: measured=12; required=>0 measured enemy actions
PASS Q3.wave1.enemy-displacement: measured=12; required=100% >6% viewport width
PASS Q3.wave1.minimum-displacement: measured=0.11500722867799087; required=>0.06
PASS Q3.wave3.enemy-actions: measured=12; required=>0 measured enemy actions
PASS Q3.wave3.enemy-displacement: measured=12; required=100% >6% viewport width
PASS Q3.wave3.minimum-displacement: measured=0.11500722867799087; required=>0.06
PASS Q3.boss.enemy-actions: measured=9; required=>0 measured enemy actions
PASS Q3.boss.enemy-displacement: measured=9; required=100% >6% viewport width
PASS Q3.boss.minimum-displacement: measured=0.11499948174032582; required=>0.06
TOTAL 9 PASS / 0 FAIL / 9 gates
```

## Q5 checker evidence

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

## Q4 and Q6 checker evidence

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

## Q7 final checks

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
PASS F1.freshness: measured=16cb6cdfce0f68112c8cac5664e7cb3375349e76; required=evidence >= f6dc3cadd8565fb8624496cfa72744b6493ca6bf
PASS F1.suite-freshness: measured=16cb6cdfce0f68112c8cac5664e7cb3375349e76; required=suite >= f6dc3cadd8565fb8624496cfa72744b6493ca6bf
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
PASS F2.freshness: measured=16cb6cdfce0f68112c8cac5664e7cb3375349e76; required=evidence >= e9493db6e147c28e1d39b25e90d56a940593959b
PASS F2.suite-freshness: measured=16cb6cdfce0f68112c8cac5664e7cb3375349e76; required=suite >= e9493db6e147c28e1d39b25e90d56a940593959b
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
PASS M1.freshness: measured=b066e4caa22bcf8660d6496a816b5dcae2297e34; required=evidence >= 16cb6cdfce0f68112c8cac5664e7cb3375349e76
PASS M1.suite-freshness: measured=16cb6cdfce0f68112c8cac5664e7cb3375349e76; required=suite >= 16cb6cdfce0f68112c8cac5664e7cb3375349e76
PASS M1.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS M1.input-freshness: measured=0; required=eq 0 missing or stale raw captures/reviews
PASS M1.seconds[wave1]: measured=30.333333333333332; required=min 30
PASS M1.seconds[wave3]: measured=30.866666666666667; required=min 30
PASS M1.seconds[boss]: measured=32.93333333333333; required=min 30
PASS M1.displacements[wave1]: measured=17.802197802197803; required=min 2
PASS M1.displacements[wave3]: measured=17.170626349892007; required=min 2
PASS M1.displacements[boss]: measured=16.396761133603242; required=min 2
PASS M1.motion-energy[wave1]: measured=16.956576866285243; required=min 15.795591764922111
PASS M1.motion-energy[wave3]: measured=18.315804627808657; required=min 15.795591764922111
PASS M1.motion-energy[boss]: measured=18.075246884467752; required=min 15.795591764922111
PASS M1.every-action-moves[wave1]: measured=0.1052002746839527; required=min 0.06
PASS M1.every-action-moves[wave3]: measured=0.1052002746839527; required=min 0.06
PASS M1.every-action-moves[boss]: measured=0.1052002746839527; required=min 0.06
PASS M1.hit-knockback[wave1]: measured=1; required=eq 1
PASS M1.hit-knockback[wave3]: measured=1; required=eq 1
PASS M1.hit-knockback[boss]: measured=1; required=eq 1
PASS M1.high-fps[wave1]: measured=60.00532640888257; required=min 50
PASS M1.high-fps[wave3]: measured=59.99484094285322; required=min 50
PASS M1.high-fps[boss]: measured=60.04880527042215; required=min 50
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
PASS V1.freshness: measured=16cb6cdfce0f68112c8cac5664e7cb3375349e76; required=evidence >= 16cb6cdfce0f68112c8cac5664e7cb3375349e76
PASS V1.suite-freshness: measured=16cb6cdfce0f68112c8cac5664e7cb3375349e76; required=suite >= 16cb6cdfce0f68112c8cac5664e7cb3375349e76
PASS V1.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS V1.plate-count: measured=13; required=eq 13
PASS V1.coverage: measured=0.6232670454545455; required=min 0.6120624999999998
PASS V1.viewport: measured=1; required=eq 1
PASS V1.edges: measured=2; required=eq 2
PASS V1.layer-types: measured=11; required=min 7
PASS V1.particles: measured=480; required=min 300
PASS V1.beats: measured=3; required=min 3
PASS V1.distinctness: measured=0.17879489214216607; required=max 0.55
PASS V1.pair-count: measured=78; required=eq 78
PASS V1.bytes: measured=20458604; required=max 20971520
PASS V1.motif-area: measured=0.46392361111111113; required=min 0.4
PASS V1.camera-paths: measured=13; required=eq 13
PASS V1.comparisons: measured=13; required=min 13
PASS V1.render-log: measured=1; required=min 1
PASS V1.typecheck: measured=0; required=eq 0
PASS V1.unit: measured=0; required=eq 0
PASS V1.e2e: measured=0; required=eq 0
PASS V1.parity: measured=0; required=eq 0
PASS V1.artifact-freshness: measured=0; required=eq 0 artifacts older than last source commit
PASS V2.freshness: measured=b066e4caa22bcf8660d6496a816b5dcae2297e34; required=evidence >= 9b4323716824a3099f0a7c9955a15040356dd8ff
PASS V2.suite-freshness: measured=16cb6cdfce0f68112c8cac5664e7cb3375349e76; required=suite >= 9b4323716824a3099f0a7c9955a15040356dd8ff
PASS V2.committed-source: measured=0; required=eq 0 uncommitted source changes
PASS V2.input-freshness: measured=0; required=eq 0 missing or stale raw captures/reviews
PASS V2.number-height[wave1]: measured=46; required=band [34.66216216216216,57.770270270270274]
PASS V2.number-height[wave3]: measured=46; required=band [34.66216216216216,57.770270270270274]
PASS V2.number-height[boss]: measured=46; required=band [34.66216216216216,57.770270270270274]
PASS V2.active-coverage[wave1]: measured=0.27985568576388886; required=min 0.15
PASS V2.active-coverage[wave3]: measured=0.201806640625; required=min 0.15
PASS V2.active-coverage[boss]: measured=0.354541015625; required=min 0.15
PASS V2.basic-coverage[wave1]: measured=0.10556098090277778; required=min 0.05
PASS V2.basic-coverage[wave3]: measured=0.07710828993055556; required=min 0.05
PASS V2.basic-coverage[boss]: measured=0.08049696180555556; required=min 0.05
PASS V2.impact-density[wave1]: measured=5.769230769230728; required=min 3.0000000000000027
PASS V2.impact-density[wave3]: measured=5.76923076923085; required=min 3.0000000000000027
PASS V2.impact-density[boss]: measured=5.769230769230728; required=min 3.0000000000000027
PASS V2.high-fps[wave1]: measured=60.04380449534407; required=min 50
PASS V2.high-fps[wave3]: measured=60.01981236530634; required=min 50
PASS V2.high-fps[boss]: measured=60.06155893852424; required=min 50
PASS V2.sequences: measured=36; required=min 36
PASS V2.all-active-coverage: measured=0.24435655381944443; required=min 0.15
PASS V2.all-basic-coverage: measured=0.07666124131944445; required=min 0.05
PASS V2.distinctness: measured=0.5810277991344527; required=max 0.6
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
PASS T1.freshness: measured=16cb6cdfce0f68112c8cac5664e7cb3375349e76; required=evidence >= f6dc3cadd8565fb8624496cfa72744b6493ca6bf
PASS T1.suite-freshness: measured=16cb6cdfce0f68112c8cac5664e7cb3375349e76; required=suite >= f6dc3cadd8565fb8624496cfa72744b6493ca6bf
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
PASS Q7.plates: measured=13; required=13 distinct plates
PASS Q7.caster-silhouettes: measured=[0.7916623950004578,0.755094051361084,0.7764502167701721,0.7087732553482056,0.7792301177978516,0.7608722448348999,0.7635061740875244,0.6290873885154724,0.7978551983833313,0.7748227119445801,0.6713889241218567,0.7135920524597168,0.8202793598175049]; required=all13 caster-region IoU <=0.85
PASS Q7.wave1.effect-saturation: measured=0.8162497866959187; required=>=70% reference median
PASS Q7.wave1.effect-luminance: measured=1.003247358260859; required=>=80% reference median
PASS Q7.wave3.effect-saturation: measured=0.865981318884256; required=>=70% reference median
PASS Q7.wave3.effect-luminance: measured=1.003247358260859; required=>=80% reference median
PASS Q7.boss.effect-saturation: measured=0.8148015516750522; required=>=70% reference median
PASS Q7.boss.effect-luminance: measured=1.003247358260859; required=>=80% reference median
TOTAL 8 PASS / 0 FAIL / 8 gates
PASS Q3.wave1.enemy-actions: measured=12; required=>0 measured enemy actions
PASS Q3.wave1.enemy-displacement: measured=12; required=100% >6% viewport width
PASS Q3.wave1.minimum-displacement: measured=0.11500722867799087; required=>0.06
PASS Q3.wave3.enemy-actions: measured=12; required=>0 measured enemy actions
PASS Q3.wave3.enemy-displacement: measured=12; required=100% >6% viewport width
PASS Q3.wave3.minimum-displacement: measured=0.11500722867799087; required=>0.06
PASS Q3.boss.enemy-actions: measured=9; required=>0 measured enemy actions
PASS Q3.boss.enemy-displacement: measured=9; required=100% >6% viewport width
PASS Q3.boss.minimum-displacement: measured=0.11499948174032582; required=>0.06
TOTAL 9 PASS / 0 FAIL / 9 gates
```

## Q8 checker evidence

```text
PASS T1.walkthrough: measured 90; required passing test + SHA-256-verified log
PASS T1.geometry: measured 90/90; required target inside spotlight with >= 8px padding; bubble not overlapping
PASS T1.fallbacks: measured 0; required 0 fallback steps on owned screens
PASS T1.words: measured 90/90; required <= 12 words per step
PASS C1.counters: measured 3; required >= 3/4 real Fuji counters numeric, raw RPC + screenshot
PASS C1.policy: measured {"timeoutMs":6000,"cacheMs":60000,"retries":2,"logWindow":100,"deedBatchSize":500}; required 6000ms timeout, 60000ms cache, 2 retries
PASS C1.offline: measured 11; required passing test + SHA-256-verified log
```
