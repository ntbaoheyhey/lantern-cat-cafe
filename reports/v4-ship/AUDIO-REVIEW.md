# S5 audio review

Measured on the unchanged production audio from f16d4ec7a. Learning: [S5](LEARN/S5.md). Evidence is bound to runtime signatures and file hashes in [final check](S5/final-check-1.json).

| Measurement | Result | Gate |
|---|---|---|
| Uninterrupted boss capture | 1801.137 s wall; 1801.080 s decoded; 18 restarts | PASS >=1800 s |
| Boss loudness / range / true peak | -16.97 LUFS / 8.9 LU / -1.53 dBTP | PASS -18 +/-2 / >=5 / <=-1 |
| Five other scenes | 451.666 s; -17.64 LUFS / 8.7 LU / -1.06 dBTP | Levels PASS; coverage is separate from endurance |
| Actual source starts / 100 ms | Maximum 6 in endurance | PASS <=6 |
| Music duck / recovery | 8 dB; 27044 recovery samples passed | PASS |
| Page errors / interrupted voices | 0 / 0 in endurance | PASS |
| Device-estimated onset | One failure: first boss-death voice 40.665 ms; p95 17.757 ms | FAIL <=33 ms; physical timing unverified |
| Frozen first twelve recognition | 8/12 exact, no substitutions | FAIL >=10/12; human listening unverified |
| UI / transaction cue duration | 34/34 cases <=300 ms | PASS duration only |
| Native mixer settings | 15/15 slider, mute and reload checks | PASS |
| Primary buttons / every receipt chime / every weapon impact | Complete journey or visual-event evidence not yet bound | OPEN |

Before/after: the real-engine duck probe fell from 12 recovery ramps and minimum gain 0.852643 after 450 ms to one ramp and gain 1.0. Earlier pilot 2 measured -18.65 LUFS / 4.3 LU LRA / -1.97 dBTP and 7/12 recognition. EQ alternatives were rejected: brighter speech reached only 4/8 and exceeded the loudness ceiling. All previous failures remain in S5/.

The original duration-header method found no duration for 0/5 streaming WebM files; the corrected decoder measured all five without changing the recordings. They all correctly remain shorter than 1800 s. See [comparison](S5/duration-method.json).

Open onset diagnosis: `voice.yarn-giant.death`, group187, request-to-call23.5ms and scheduling delay26.667ms. One first-occurrence failure suggests testing terminal-voice warmup separately; it is not proof of the cause. Preserve the failing take. Failed recognition cues are Mochi, Soot, Teacup-healer and Spool-ram. Source clarity and masking need a new measured method using the same frozen twelve selections.

G-AUDIO remains FAIL. Full regression: server/rules/typecheck/three-fixture probe/build exit0; web2663 pass and seven unchanged ART-owned failures. The probe is not the official class baseline. G-REG remains FAIL.

S5 is timeboxed open for S11. Score6/10: the mix and endurance measurements pass, while timing, clarity and complete coverage still need acceptance evidence. Updated 2026-11-16T10:25:20.636444+00:00.
