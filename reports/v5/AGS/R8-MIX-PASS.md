# R8: V5 Audio Mix Pass & Gain Proposals

- Total evaluated cues: 219
- Outliers requiring gain tuning: 80
- Bus Targets: SFX = -18.0 LUFS, UI = -19.0 LUFS, Voice = -18.0 LUFS, Ambience = -22.0 LUFS

## Gain Tuning Recommendations for CXI Audio Engine
| Cue ID | Bus | Current LUFS | Target LUFS | Proposed Gain (dB) | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `hero.soot.ultimate` | sfx | -19.9 | -18.0 | +1.9 dB | Calibration offset |
| `hero.clover.ultimate` | sfx | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `enemy.hit.light` | sfx | -19.8 | -18.0 | +1.8 dB | Calibration offset |
| `ult.soot.impact` | sfx | -19.9 | -18.0 | +1.9 dB | Calibration offset |
| `soot-4` | sfx | -19.9 | -18.0 | +1.9 dB | Calibration offset |
| `ult.soot.release` | sfx | -19.9 | -18.0 | +1.9 dB | Calibration offset |
| `ult.clover.impact` | sfx | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `clover-4` | sfx | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `ult.clover.release` | sfx | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `hit.light` | sfx | -19.8 | -18.0 | +1.8 dB | Calibration offset |
| `hit.slash` | sfx | -19.8 | -18.0 | +1.8 dB | Calibration offset |
| `tx.confirmed` | ui | -16.6 | -19.0 | -2.4 dB | Calibration offset |
| `chain.confirmed` | ui | -16.6 | -19.0 | -2.4 dB | Calibration offset |
| `mochi-hit-1-1.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `mochi-hit-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `soot-hit-1-1.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `soot-hit-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `soot-death-1-1.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `soot-death-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `clover-hit-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `clover-death-1-1.flac` | voice | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `clover-death-1-2.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `panko-hit-1-1.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `panko-hit-1-2.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `panko-death-1-1.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `panko-death-1-2.flac` | voice | -16.4 | -18.0 | -1.6 dB | Calibration offset |
| `ambience.workshop.cosy` | bgm | -21.5 | -18.0 | +3.5 dB | Calibration offset |
| `ambience.battle.bed` | bgm | -21.6 | -18.0 | +3.6 dB | Calibration offset |
| `ui.cancel` | ui | -17.3 | -19.0 | -1.7 dB | Calibration offset |
| `ui.coin` | ui | -16.6 | -19.0 | -2.4 dB | Calibration offset |
| `stinger.victory` | sfx | -16.2 | -18.0 | -1.8 dB | Calibration offset |
| `stinger.defeat` | sfx | -16.2 | -18.0 | -1.8 dB | Calibration offset |
| `chain.tx_confirmed` | sfx | -16.4 | -18.0 | -1.6 dB | Calibration offset |
| `mochi-select-1-1.flac` | voice | -16.4 | -18.0 | -1.6 dB | Calibration offset |
| `mochi-select-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `mochi-attack-1-1.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `mochi-attack-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `mochi-attack-2-1.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `mochi-skill-1-1.flac` | voice | -16.4 | -18.0 | -1.6 dB | Calibration offset |
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
| `clover-attack-1-1.flac` | voice | -16.2 | -18.0 | -1.8 dB | Calibration offset |
| `clover-attack-1-2.flac` | voice | -16.4 | -18.0 | -1.6 dB | Calibration offset |
| `clover-skill-1-2.flac` | voice | -16.4 | -18.0 | -1.6 dB | Calibration offset |
| `clover-ult-1-1.flac` | voice | -16.4 | -18.0 | -1.6 dB | Calibration offset |
| `clover-ult-1-2.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `clover-victory-1-2.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `clover-release-1.flac` | voice | -16.3 | -18.0 | -1.7 dB | Calibration offset |
| `panko-select-1-1.flac` | voice | -16.4 | -18.0 | -1.6 dB | Calibration offset |
| `panko-select-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `panko-attack-1-2.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `panko-attack-2-2.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `panko-attack-3-1.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `panko-attack-3-2.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `panko-skill-1-1.flac` | voice | -16.2 | -18.0 | -1.8 dB | Calibration offset |
| `panko-skill-1-2.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `panko-ult-1-1.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `panko-ult-1-2.flac` | voice | -16.0 | -18.0 | -2 dB | Calibration offset |
| `panko-victory-1-1.flac` | voice | -16.1 | -18.0 | -1.9 dB | Calibration offset |
| `panko-victory-1-2.flac` | voice | -16.4 | -18.0 | -1.6 dB | Calibration offset |
| `panko-release-2.flac` | voice | -16.2 | -18.0 | -1.8 dB | Calibration offset |
| `boss.yarn-giant.thread_charge` | sfx | -16.4 | -18.0 | -1.6 dB | Calibration offset |
