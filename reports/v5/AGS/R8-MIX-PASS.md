# R8: V5 Audio Mix Pass & Gain Proposals

- Total evaluated cues: 219
- Outliers requiring gain tuning: 70
- Bus Targets: SFX = -18.0 LUFS, UI = -19.0 LUFS, Voice = -18.0 LUFS, Ambience = -22.0 LUFS

## Gain Tuning Recommendations for CXI Audio Engine
| Cue ID | Bus | Current LUFS | Target LUFS | Proposed Gain (dB) | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `hero.panko.basic.var2` | sfx | -19.7 | -18.0 | +1.7 dB | Calibration offset |
| `enemy.hit.light.var2` | sfx | -20.2 | -18.0 | +2.2 dB | Calibration offset |
| `mochi-hit-1-1.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `mochi-hit-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `soot-hit-1-1.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `soot-hit-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `soot-death-1-1.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `soot-death-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `clover-hit-1-1.flac` | voice | -16.4 | -18.0 | -1.6 dB | Calibration offset |
| `clover-hit-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `clover-death-1-1.flac` | voice | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `clover-death-1-2.flac` | voice | -15.9 | -18.0 | -2.1 dB | Calibration offset |
| `panko-hit-1-1.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `panko-hit-1-2.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `panko-death-1-1.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `panko-death-1-2.flac` | voice | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `ambience.workshop.cosy` | bgm | -21.6 | -18.0 | +3.6 dB | Calibration offset |
| `ambience.battle.bed` | bgm | -22.0 | -18.0 | +4 dB | Calibration offset |
| `ui.cancel` | ui | -17.0 | -19.0 | -2 dB | Calibration offset |
| `ui.coin` | ui | -16.6 | -19.0 | -2.4 dB | Calibration offset |
| `stinger.victory` | sfx | -16.2 | -18.0 | -1.8 dB | Calibration offset |
| `stinger.defeat` | sfx | -16.2 | -18.0 | -1.8 dB | Calibration offset |
| `chain.tx_confirmed` | sfx | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `emote.panko.purr` | sfx | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `mochi-select-1-1.flac` | voice | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `mochi-select-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `mochi-attack-1-1.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `mochi-attack-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `mochi-attack-2-1.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `mochi-skill-1-1.flac` | voice | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `mochi-skill-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `mochi-victory-1-1.flac` | voice | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `mochi-victory-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `mochi-skill-3-1.flac` | voice | -16.4 | -18.0 | -1.6 dB | Calibration offset |
| `mochi-charge-1.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `soot-select-1-1.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `soot-select-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `soot-attack-1-1.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `soot-attack-1-2.flac` | voice | -16.4 | -18.0 | -1.6 dB | Calibration offset |
| `soot-attack-2-1.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `soot-attack-2-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `soot-attack-3-1.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `soot-skill-1-2.flac` | voice | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `soot-ult-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `soot-victory-1-1.flac` | voice | -16.4 | -18.0 | -1.6 dB | Calibration offset |
| `soot-victory-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `soot-skill-3-1.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `soot-charge-1.flac` | voice | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `soot-charge-2.flac` | voice | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `clover-select-1-2.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `clover-attack-1-1.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `clover-attack-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `clover-skill-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `clover-ult-1-1.flac` | voice | -16.2 | -18.0 | -1.8 dB | Calibration offset |
| `clover-ult-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `clover-victory-1-2.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `clover-release-1.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `panko-select-1-1.flac` | voice | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `panko-select-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `panko-attack-1-2.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `panko-attack-2-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `panko-attack-3-1.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `panko-attack-3-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `panko-skill-1-1.flac` | voice | -16.2 | -18.0 | -1.8 dB | Calibration offset |
| `panko-skill-1-2.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `panko-ult-1-1.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `panko-ult-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `panko-victory-1-1.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `panko-victory-1-2.flac` | voice | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `panko-release-2.flac` | voice | -16.2 | -18.0 | -1.8 dB | Calibration offset |
