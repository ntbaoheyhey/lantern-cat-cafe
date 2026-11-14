# Voice production iterations

## S4 cat-speak

| Iteration | Change | Measured result | Decision |
|---|---|---|---|
| 1 | Initial 12-source syllable + common formant banks; 216 takes | All -16.81 to -15.96 LUFS; 0/12 nearest identities reach source p25 46.97 (closest pair 18.29) | Shared filtering removes too much recording identity. Preserve excitation and tune physical voice profiles before rebuilding. |
| 2 | Retain 70% natural excitation around vowel resonances | 1/12 nearest identities pass; closest pair 20.91 | Fixed sources retained. Try bounded physical profile selection: pitch, rolloff, one broad resonance; reject candidates lacking voiced excitation. |
| 3 | 626 voiced DSP candidates across 12 fixed recordings; bounded pitch, rolloff and broad resonance | All 12 three-line probes above source p25; closest 51.70 before final encoding | Rebuild full 216 takes, then verify decoded output. |
| 3 final | Decode all rebuilt output; measure select, attack and ultimate per cat | 12/12 pass; nearest 51.697 vs 46.968 required. All 216 takes -16.05 to -15.96 LUFS | Retain. Browser cadence is the only outstanding S4 gate. |
| 3 browser | 180-second audio and muted battle/replay traces | Cadence 7.563 s; CPU +4.525%; max 1 voice / 14 SFX; zero errors | All S4 gates PASS. |

## V spoken callouts

| Iteration | Change | Measured result | Decision |
|---|---|---|---|
| V1 | Piper LJSpeech, 65% S4 pitch shift, mixed character filtering, cat grains at word starts | 9/12 sampled ultimates meet 70% recognition; 0/12 identities meet unchanged source MFCC p25 | Shared speech masks identity; test full character filtering. Evidence: tests/v-probe-first.json. |
| V2 | Full S4 filtering, 90% pitch shift, louder grains | 4/12 sampled ultimates meet recognition; 1/12 distinct identities | Strong low-pass loses consonants. Evidence: tests/v-probe-second.json. |
| V3 | 1,320 bounded high/low-pass and broad-resonance candidates; unprompted ASR | Four compatible identities found; ambiguous short phrases repeatedly misheard | Change wording of three authored lines, retaining each character’s action meaning. Evidence: tests/v-eq-third.log. |
| V4 | Clearer Panko/Biscuit/Marigold scripts with same processing | Search still fails on Marigold’s opening consonants; no complete roster selected | Change method: move cat grains 60 ms behind the word onset, reduce speech pitch to 35%, preserve the cat source in the accents and ending. Evidence: tests/v-eq-fourth.log. |
| V5 | Consonant-preserving timing, 35% pitch shift, physical vocal EQ search across 1,320 candidates | 12/12 compatible identities selected; all sampled release lines 100% recognised with no text prompt | Render all 162 production takes; final decoded output still requires complete checks. Evidence: tests/v-eq-selection.json. |
| V6 | 0.1 ms, 8:1 compressor before normalization | 180/212 source+sprite files in range, but only 1/12 cat identities still above source p25; ASR records stale after audio change | Reject fast compressor. Do not reuse old recognition evidence. |
| V7 pilot | Smooth look-ahead syllable gain: 25 ms peak window, 5 ms smoothing; Velvet highpass 850→637.5 Hz | Three-line probes preserve all 12 identities after one broad filter refinement; Velvet release 100% unprompted recognition; remaining roster rerender active | Validate final encoded output and rerun recognition for every take. Evidence: tests/v-smooth-probe.json, tests/v-smooth-refine.json. |
| V7 final | All 162 takes rebuilt and recognized without text prompts | All 12 identities preserved; short charge syllables remain the main recognition weakness | Keep explicit failures. Evidence: tests/v-production-smooth.log and tests/v-validation-smooth.log. |
| V8 | At most four articulation candidates for each failing take: lower grain masking, slower/clearer speech and lower pitch weight; fresh hashed unprompted ASR | 32/50 ultimate entries and 59/62 skill entries pass, using the worse of both ultimate takes; all source takes meet levels | Retain only measured improvements. Four failed candidates trigger a method change, not unlimited retries. Evidence: tests/v-articulation-repairs.json. |
| V9 | Investigate encoded-sprite overshoot with bitrate/gain probes; move Opus from 48 to 64 kb/s and verify both codecs after bounded gain trim | All 212 source/sprite files pass: -17.00 to -15.38 LUFS, peak at most -1.34 dBTP. All 12 identities still pass | Accept recognition-only PARTIAL under card V, not done. Evidence: tests/v-codec-probe.json, tests/v-publish-64k.log, VOICE-CALLOUTS-VALIDATION.json. |

The final real 180-second auto battle/replay requested 62 ultimate charge/release lines: 62 played and scheduled -8 dB music ducking, zero missing, one voice and at most fourteen SFX layers. No browser audio errors. Full local suite: 2,503 web and 724 server tests pass; existing game-rules expected failures/skips remain disclosed. Recognition failures are retained per entry in VOICE-CALLOUTS-VALIDATION.json. No threshold was lowered and no expected text was supplied to the recognizer as a prompt.

| V10 | WORLD formant-preserving pitch; four slower/prosodic candidates per failed take, original texts | 6/32 failing takes rescued, 32/32 explored; unpublished candidates, complete source and unprompted ASR hashes in q5/formant-probes.json | Retain candidates for later distinctness audit; most one-word charges still fail. Switch to word-aligned consonant grains. |

| V10 | Q5 unchanged-word formants and aligned consonants, then A-authored phrases | 35 selected takes; all 50 ultimate lines >=0.70, 62 skill lines >=0.50, 12 identities retain source p25 separation | Published selected original assets. Current full battle coverage still needs refresh. Evidence q5/selection.json; three overwritten historical scratch candidates explicitly invalidated in q5/probe-path-integrity.json and excluded from selection. |

| V11 | Mild runtime speech shelf and codec expose seven ambiguous phrases; A commits clearer original wording; nine selected takes pass dry and encoded ASR |50/50 ultimate lines,62/62 skill lines,12/12 identities; source/sprite212 levels pass | Full candidate28 browser capture pending. Evidence q5/scene28-wording.json and q5/scene28-selection.json. |
