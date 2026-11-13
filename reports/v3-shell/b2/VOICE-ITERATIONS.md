# Voice production iterations

## S4 cat-speak

| Iteration | Change | Measured result | Decision |
|---|---|---|---|
| 1 | Initial 12-source syllable + common formant banks; 216 takes | All -16.81 to -15.96 LUFS; 0/12 nearest identities reach source p25 46.97 (closest pair 18.29) | Shared filtering removes too much recording identity. Preserve excitation and tune physical voice profiles before rebuilding. |
| 2 | Retain 70% natural excitation around vowel resonances | 1/12 nearest identities pass; closest pair 20.91 | Fixed sources retained. Try bounded physical profile selection: pitch, rolloff, one broad resonance; reject candidates lacking voiced excitation. |
| 3 | 626 voiced DSP candidates across 12 fixed recordings; bounded pitch, rolloff and broad resonance | All 12 three-line probes above source p25; closest 51.70 before final encoding | Rebuild full 216 takes, then verify decoded output. |
| 3 final | Decode all rebuilt output; measure select, attack and ultimate per cat | 12/12 pass; nearest 51.697 vs 46.968 required. All 216 takes -16.05 to -15.96 LUFS | Retain. Browser cadence is the only outstanding S4 gate. |
| 3 browser | 180-second audio and muted battle/replay traces | Cadence 7.563 s; CPU +4.525%; max 1 voice / 14 SFX; zero errors | All S4 gates PASS. |
