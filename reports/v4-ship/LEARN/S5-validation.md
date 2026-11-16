# S5 source timing and intelligibility

Accessed 16 November 2026. RULES remains authoritative: -18 +/-2 LUFS, true peak <=-1 dBTP, LRA >=5 LU, 4-8 dB duck, <=6 actual source starts per rolling100ms, onset +/-33ms, 10/12 intelligible lines, primary UI <=300ms, persisted mix.

## Sources and decisions
1. [W3C Web Audio formal specification](https://www.w3.org/TR/webaudio/#dom-audiobuffersourcenode-start): schedule source starts against the audio clock; count actual source nodes and preserve complete composite groups.
2. [MDN source start](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/start): duration describes buffer content; divide by playback rate when measuring output length.
3. [MDN output timestamps](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp): the output/performance clock mapping is an estimate. It cannot establish physical audible-onset compliance on its own.
4. [MDN decoding](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData): decode asynchronously before contact. Preserve resolved buffers so a warmed request avoids a Promise continuation behind a busy rendering task.
5. [MDN gain ramps](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/linearRampToValueAtTime): use scheduled ramps for duck attack/recovery and the UI release envelope.
6. [FFmpeg loudnorm](https://ffmpeg.org/ffmpeg-filters.html#loudnorm): read input loudness/LRA/true-peak metrics from the original recording. No normalized output is acceptance evidence.

## Measured alternatives before changes
The three90s source-pilot-1 scenes measured wave1 -18.59 LUFS/5.0 LRA/-4.36 dBTP, boss -17.60/6.0/-3.16, and home -17.33/5.0/-2.14. Peak actual source starts per100ms were4/5/2, respectively. Wave1 cold impact delayed69.33ms; a warmed boss impact delayed85.33ms through the asynchronous path. No page errors.

The isolated engine-probe-before comparison measured cold52.4ms versus selectively preloaded0.9ms for the first impact, with54.8ms preload cost. Its simultaneous warmed-cue burst started20 actual sources inside100ms. The six selected battle packs total1,344,253 encoded WebM bytes on disk; this is not proof of the full8MB application budget.

The first ten distinct gameplay lines in the mixed capture all failed the strict unprompted recognition proxy. Every first occurrence was interrupted when the fixed-beat charge fallback restarted the same line approximately600ms after its explicit start. Actual source starts and end events establish this mechanism independently of ASR. Do not substitute later successful occurrences.

## Implemented response and initial checks
Selective scene-entry preload; synchronous use of decoded manifest/buffers; atomic whole-composite reservations across all buses with a six-source rolling100ms limit; scene beds may wait for a slot, transients are never delayed to fit. Suppress the same authored line while it is still active.

engine-probe-after: cold62.0ms versus preloaded0.7ms, preload52.7ms; burst maximum6 in both modes. The cold diagnostic deliberately bypasses scene entry. Native slider tests pass15/15, including measured output RMS and reload. Focused engine/feedback/transaction/timeline tests pass34/34. Two earlier focused logs retain an incorrect test expectation at110ms; the corrected95ms burst case tests a real overlapping window. Thresholds unchanged.

No30-minute or physical-onset gate is claimed here. Source-pilot-2 and subsequent long capture must remeasure the changed mix and speech; full regression remains required.

## Recovery diagnosis, 16 Nov 09:30 UTC
The real-engine probe with one full spoken line followed by UI clicks every 100 ms produced 12 recovery ramps and minimum gain 0.852643 after 450 ms. Releasing only on the last ducking-source transition produced one ramp and gain 1.0. Two regression tests first failed (five instead of one recovery ramps; a designed effect released before its last layer); all 24 engine tests pass after the fix. Evidence: S5/duck-before.json, duck-after.json, duck-regression-before.json. All shipped manifest designs currently have ducking=false; the source flag also covers future designed duckers without treating ordinary effects as duckers.

The frozen pilot2 selection yields 10/12 exact unprompted ASR on the shipped source takes versus 7/12 in the full mix. Teacup-healer and Spool-ram fail even in isolation; no acceptance occurrences are substituted. Pilot3 also scores 7/12. The next diagnostic changes voice EQ while holding the random variant pool seed fixed. Production stays unchanged until the six-scene capture completes.

## Speech-EQ decision, 16 Nov 09:36 UTC
The eight first-occurrence variants are identical across all three seeded diagnostic runs (speech-eq-1/pool-comparison.json). Current high shelf -3 dB: 3/8 exact ASR, -17.81 LUFS, 7.7 LU LRA, -2.87 dBTP. Flat shelf: 3/8, -16.89/8.5/-2.76. A +3 dB shelf: 4/8, -15.79/10/-1.65, violating the loudness ceiling. Neither candidate establishes the required clarity. Keep the calibrated current EQ, retain all failed recognition, and move remaining articulation/listening work to S11 after the uninterrupted validation. This comparison uses its own fixed diagnostic variants; the independent twelve-line gameplay proxy remains 7/12.

Pilot3 totals 541.922 seconds across six separate scenes: aggregate -17.55 LUFS, 8.8 LU LRA, -1.64 dBTP; source budget, duck depth, recovery and zero errors pass. It is not a 30-minute or continuous run. Menu voices still incurred up to 26.67 ms scheduling delay. The shared 98,201-byte menu pack now preloads at home, and roster changes now warm newly appearing actors. Two regression tests failed before those changes; all 33 focused engine/timeline tests pass afterward. Production audio was not edited during pilot3.
