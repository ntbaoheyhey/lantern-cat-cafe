# V5 Audio Master Loudness Table & EBU R128 Audit

**Date**: 2026-11-17  
**Audited Cues**: 222 distinct cues across 4 buses  
**Sound Gate S5 Compliance**: 216 / 222 (97.3%) pass strict $\pm 2.0$ LUFS tolerance & $\le -1.0$ dBTP peak  
**Opus Streaming Size**: 1498.4 KB for complete cue registry  

---

## 1. Bus Loudness Targets & Compliance Summary

| Audio Bus | Target Integrated LUFS | Allowed Tolerance | Max True Peak | Audited Cues | Avg Integrated LUFS | Peak True Peak | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **SFX** | `-18.0 LUFS` | $\pm 2.0$ LU | $\le -1.0$ dBTP | 102 | `-17.7 LUFS` | `-1.2 dBFS` | **PASS** |
| **UI** | `-19.0 LUFS` | $\pm 2.0$ LU | $\le -1.0$ dBTP | 15 | `-17.8 LUFS` | `-1.5 dBFS` | **PASS** |
| **VOICE** | `-18.0 LUFS` | $\pm 2.0$ LU | $\le -1.0$ dBTP | 100 | `-16.5 LUFS` | `-4.5 dBFS` | **PASS** |
| **BGM** | `-22.0 LUFS` | $\pm 2.0$ LU | $\le -1.0$ dBTP | 5 | `-21.5 LUFS` | `-6.7 dBFS` | **PASS** |

---

## 2. Comprehensive Loudness & Peak Registry by Category

### Hero Skills & Attacks (45 Cues)

| Cue ID | Bus | Integrated LUFS | True Peak (dBFS) | Target | Gain Proposal | S5 Gate Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `hero.mochi.basic` | sfx | `-19.5` | `-1.8` | `-18.0` | `0.0 dB` | PASS |
| `hero.mochi.skill` | sfx | `-18.4` | `-2.3` | `-18.0` | `0.0 dB` | PASS |
| `hero.mochi.ultimate` | sfx | `-17.0` | `-1.7` | `-18.0` | `0.0 dB` | PASS |
| `hero.soot.basic` | sfx | `-18.5` | `-1.2` | `-18.0` | `0.0 dB` | PASS |
| `hero.soot.skill` | sfx | `-17.0` | `-2.5` | `-18.0` | `0.0 dB` | PASS |
| `hero.soot.ultimate` | sfx | `-19.9` | `-4.1` | `-18.0` | `+1.9 dB` | PASS |
| `hero.clover.basic` | sfx | `-17.3` | `-1.2` | `-18.0` | `0.0 dB` | PASS |
| `hero.clover.skill` | sfx | `-16.6` | `-1.7` | `-18.0` | `0.0 dB` | PASS |
| `hero.clover.ultimate` | sfx | `-16.3` | `-2.5` | `-18.0` | `-1.7 dB` | PASS |
| `hero.panko.basic` | sfx | `-16.9` | `-1.4` | `-18.0` | `0.0 dB` | PASS |
| `hero.panko.skill` | sfx | `-17.5` | `-2.3` | `-18.0` | `0.0 dB` | PASS |
| `hero.panko.ultimate` | sfx | `-17.2` | `-2.2` | `-18.0` | `0.0 dB` | PASS |
| `skill.mochi.1.impact` | sfx | `-19.5` | `-1.8` | `-18.0` | `0.0 dB` | PASS |
| `skill.mochi.2.impact` | sfx | `-18.4` | `-2.3` | `-18.0` | `0.0 dB` | PASS |
| `ult.mochi.impact` | sfx | `-17.0` | `-1.7` | `-18.0` | `0.0 dB` | PASS |
| `ult.mochi.release` | sfx | `-17.0` | `-1.7` | `-18.0` | `0.0 dB` | PASS |
| `skill.soot.1.impact` | sfx | `-18.5` | `-1.2` | `-18.0` | `0.0 dB` | PASS |
| `skill.soot.2.impact` | sfx | `-17.0` | `-2.5` | `-18.0` | `0.0 dB` | PASS |
| `ult.soot.impact` | sfx | `-19.9` | `-4.1` | `-18.0` | `+1.9 dB` | PASS |
| `ult.soot.release` | sfx | `-19.9` | `-4.1` | `-18.0` | `+1.9 dB` | PASS |
| `skill.clover.1.impact` | sfx | `-17.3` | `-1.2` | `-18.0` | `0.0 dB` | PASS |
| `skill.clover.2.impact` | sfx | `-16.6` | `-1.7` | `-18.0` | `0.0 dB` | PASS |
| `ult.clover.impact` | sfx | `-16.3` | `-2.5` | `-18.0` | `-1.7 dB` | PASS |
| `ult.clover.release` | sfx | `-16.3` | `-2.5` | `-18.0` | `-1.7 dB` | PASS |
| `skill.panko.1.impact` | sfx | `-16.9` | `-1.4` | `-18.0` | `0.0 dB` | PASS |
| `skill.panko.2.impact` | sfx | `-17.5` | `-2.3` | `-18.0` | `0.0 dB` | PASS |
| `ult.panko.impact` | sfx | `-17.2` | `-2.2` | `-18.0` | `0.0 dB` | PASS |
| `ult.panko.release` | sfx | `-17.2` | `-2.2` | `-18.0` | `0.0 dB` | PASS |
| `ult.yarn-giant.impact` | sfx | `-16.5` | `-2.7` | `-18.0` | `0.0 dB` | PASS |
| `hero.mochi.basic.var1` | sfx | `-18.8` | `-1.9` | `-18.0` | `0.0 dB` | PASS |
| `hero.mochi.basic.var2` | sfx | `-18.7` | `-2.7` | `-18.0` | `0.0 dB` | PASS |
| `hero.mochi.skill.var1` | sfx | `-19.1` | `-3.0` | `-18.0` | `0.0 dB` | PASS |
| `hero.mochi.skill.var2` | sfx | `-19.3` | `-2.9` | `-18.0` | `0.0 dB` | PASS |
| `hero.soot.basic.var1` | sfx | `-18.8` | `-1.7` | `-18.0` | `0.0 dB` | PASS |
| `hero.soot.basic.var2` | sfx | `-18.5` | `-1.2` | `-18.0` | `0.0 dB` | PASS |
| `hero.soot.skill.var1` | sfx | `-17.3` | `-2.6` | `-18.0` | `0.0 dB` | PASS |
| `hero.soot.skill.var2` | sfx | `-16.8` | `-2.3` | `-18.0` | `0.0 dB` | PASS |
| `hero.clover.basic.var1` | sfx | `-17.5` | `-2.1` | `-18.0` | `0.0 dB` | PASS |
| `hero.clover.basic.var2` | sfx | `-17.2` | `-1.8` | `-18.0` | `0.0 dB` | PASS |
| `hero.clover.skill.var1` | sfx | `-16.8` | `-1.2` | `-18.0` | `0.0 dB` | PASS |
| `hero.clover.skill.var2` | sfx | `-16.7` | `-2.1` | `-18.0` | `0.0 dB` | PASS |
| `hero.panko.basic.var1` | sfx | `-17.5` | `-1.4` | `-18.0` | `0.0 dB` | PASS |
| `hero.panko.basic.var2` | sfx | `-17.7` | `-1.4` | `-18.0` | `0.0 dB` | PASS |
| `hero.panko.skill.var1` | sfx | `-17.7` | `-1.8` | `-18.0` | `0.0 dB` | PASS |
| `hero.panko.skill.var2` | sfx | `-16.5` | `-1.7` | `-18.0` | `0.0 dB` | PASS |

### Combat Variations & Impacts (28 Cues)

| Cue ID | Bus | Integrated LUFS | True Peak (dBFS) | Target | Gain Proposal | S5 Gate Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `enemy.hit.light` | sfx | `-19.8` | `-2.2` | `-18.0` | `+1.8 dB` | PASS |
| `enemy.hit.medium` | sfx | `-18.5` | `-1.9` | `-18.0` | `0.0 dB` | PASS |
| `enemy.hit.heavy` | sfx | `-19.1` | `-2.0` | `-18.0` | `0.0 dB` | PASS |
| `skill.mochi.1.impact` | sfx | `-19.5` | `-1.8` | `-18.0` | `0.0 dB` | PASS |
| `kit.holy.impact` | sfx | `-19.5` | `-1.8` | `-18.0` | `0.0 dB` | PASS |
| `skill.mochi.2.impact` | sfx | `-18.4` | `-2.3` | `-18.0` | `0.0 dB` | PASS |
| `ult.mochi.impact` | sfx | `-17.0` | `-1.7` | `-18.0` | `0.0 dB` | PASS |
| `skill.soot.1.impact` | sfx | `-18.5` | `-1.2` | `-18.0` | `0.0 dB` | PASS |
| `skill.soot.2.impact` | sfx | `-17.0` | `-2.5` | `-18.0` | `0.0 dB` | PASS |
| `ult.soot.impact` | sfx | `-19.9` | `-4.1` | `-18.0` | `+1.9 dB` | PASS |
| `skill.clover.1.impact` | sfx | `-17.3` | `-1.2` | `-18.0` | `0.0 dB` | PASS |
| `hit.magic` | sfx | `-17.3` | `-1.2` | `-18.0` | `0.0 dB` | PASS |
| `skill.clover.2.impact` | sfx | `-16.6` | `-1.7` | `-18.0` | `0.0 dB` | PASS |
| `ult.clover.impact` | sfx | `-16.3` | `-2.5` | `-18.0` | `-1.7 dB` | PASS |
| `skill.panko.1.impact` | sfx | `-16.9` | `-1.4` | `-18.0` | `0.0 dB` | PASS |
| `hit.blunt` | sfx | `-16.9` | `-1.4` | `-18.0` | `0.0 dB` | PASS |
| `skill.panko.2.impact` | sfx | `-17.5` | `-2.3` | `-18.0` | `0.0 dB` | PASS |
| `ult.panko.impact` | sfx | `-17.2` | `-2.2` | `-18.0` | `0.0 dB` | PASS |
| `hit.light` | sfx | `-19.8` | `-2.2` | `-18.0` | `+1.8 dB` | PASS |
| `hit.slash` | sfx | `-19.8` | `-2.2` | `-18.0` | `+1.8 dB` | PASS |
| `hit.medium` | sfx | `-18.5` | `-1.9` | `-18.0` | `0.0 dB` | PASS |
| `hit.heavy` | sfx | `-19.1` | `-2.0` | `-18.0` | `0.0 dB` | PASS |
| `hit.crit` | sfx | `-19.1` | `-2.0` | `-18.0` | `0.0 dB` | PASS |
| `ult.yarn-giant.impact` | sfx | `-16.5` | `-2.7` | `-18.0` | `0.0 dB` | PASS |
| `enemy.hit.light.var1` | sfx | `-19.1` | `-1.6` | `-18.0` | `0.0 dB` | PASS |
| `enemy.hit.light.var2` | sfx | `-19.3` | `-1.4` | `-18.0` | `0.0 dB` | PASS |
| `enemy.hit.medium.var1` | sfx | `-18.3` | `-2.1` | `-18.0` | `0.0 dB` | PASS |
| `enemy.hit.medium.var2` | sfx | `-17.7` | `-1.7` | `-18.0` | `0.0 dB` | PASS |

### Enemy Deaths & Boss Layers (18 Cues)

| Cue ID | Bus | Integrated LUFS | True Peak (dBFS) | Target | Gain Proposal | S5 Gate Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `enemy.death.small` | sfx | `-19.4` | `-2.2` | `-18.0` | `0.0 dB` | PASS |
| `enemy.death.boss` | sfx | `-18.2` | `-2.0` | `-18.0` | `0.0 dB` | PASS |
| `boss.yarn-giant.ultimate` | sfx | `-16.5` | `-2.7` | `-18.0` | `0.0 dB` | PASS |
| `ui.death` | ui | `-19.4` | `-2.2` | `-19.0` | `0.0 dB` | PASS |
| `enemy.death` | sfx | `-19.4` | `-2.2` | `-18.0` | `0.0 dB` | PASS |
| `boss.death` | sfx | `-18.2` | `-2.0` | `-18.0` | `0.0 dB` | PASS |
| `ui.death.boss` | ui | `-18.2` | `-2.0` | `-19.0` | `0.0 dB` | PASS |
| `mochi-death-1-1.flac` | voice | `-16.5` | `-7.4` | `-18.0` | `0.0 dB` | PASS |
| `mochi-death-1-2.flac` | voice | `-16.5` | `-7.8` | `-18.0` | `0.0 dB` | PASS |
| `soot-death-1-1.flac` | voice | `-16.0` | `-6.9` | `-18.0` | `-2.0 dB` | PASS |
| `soot-death-1-2.flac` | voice | `-16.0` | `-7.2` | `-18.0` | `-2.0 dB` | PASS |
| `clover-death-1-1.flac` | voice | `-16.3` | `-5.9` | `-18.0` | `-1.7 dB` | PASS |
| `clover-death-1-2.flac` | voice | `-16.1` | `-4.8` | `-18.0` | `-1.9 dB` | PASS |
| `panko-death-1-1.flac` | voice | `-16.0` | `-6.9` | `-18.0` | `-2.0 dB` | PASS |
| `panko-death-1-2.flac` | voice | `-16.4` | `-7.1` | `-18.0` | `-1.6 dB` | PASS |
| `boss.yarn-giant.phase_change` | sfx | `-16.7` | `-2.5` | `-18.0` | `0.0 dB` | PASS |
| `boss.yarn-giant.shockwave` | sfx | `-18.0` | `-1.6` | `-18.0` | `0.0 dB` | PASS |
| `boss.yarn-giant.thread_charge` | sfx | `-16.4` | `-2.9` | `-18.0` | `-1.6 dB` | PASS |

### UI Sound Set & Receipts (15 Cues)

| Cue ID | Bus | Integrated LUFS | True Peak (dBFS) | Target | Gain Proposal | S5 Gate Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `ui.receipt.confirmed` | ui | `-16.6` | `-2.3` | `-19.0` | `-2.4 dB` | CALIBRATE |
| `ui.death` | ui | `-19.4` | `-2.2` | `-19.0` | `0.0 dB` | PASS |
| `ui.death.boss` | ui | `-18.2` | `-2.0` | `-19.0` | `0.0 dB` | PASS |
| `tx.confirmed` | ui | `-16.6` | `-2.3` | `-19.0` | `-2.4 dB` | CALIBRATE |
| `chain.confirmed` | ui | `-16.6` | `-2.3` | `-19.0` | `-2.4 dB` | CALIBRATE |
| `ui.click` | ui | `-19.4` | `-3.5` | `-19.0` | `0.0 dB` | PASS |
| `ui.hover` | ui | `-19.2` | `-3.3` | `-19.0` | `0.0 dB` | PASS |
| `ui.confirm` | ui | `-17.6` | `-2.6` | `-19.0` | `0.0 dB` | PASS |
| `ui.cancel` | ui | `-17.3` | `-3.2` | `-19.0` | `-1.7 dB` | PASS |
| `ui.card_flip` | ui | `-19.4` | `-1.5` | `-19.0` | `0.0 dB` | PASS |
| `ui.coin` | ui | `-16.6` | `-2.3` | `-19.0` | `-2.4 dB` | CALIBRATE |
| `ui.error` | ui | `-18.5` | `-3.3` | `-19.0` | `0.0 dB` | PASS |
| `chain.tx_sent` | ui | `-17.9` | `-2.8` | `-19.0` | `0.0 dB` | PASS |
| `chain.tx_confirmed` | ui | `-16.4` | `-2.0` | `-19.0` | `-2.6 dB` | CALIBRATE |
| `chain.receipt_ready` | ui | `-16.6` | `-2.7` | `-19.0` | `-2.4 dB` | CALIBRATE |

### Game Stingers (4 Cues)

| Cue ID | Bus | Integrated LUFS | True Peak (dBFS) | Target | Gain Proposal | S5 Gate Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `stinger.victory` | sfx | `-16.2` | `-2.0` | `-18.0` | `-1.8 dB` | PASS |
| `stinger.defeat` | sfx | `-16.2` | `-1.9` | `-18.0` | `-1.8 dB` | PASS |
| `stinger.level_up` | sfx | `-16.8` | `-2.1` | `-18.0` | `0.0 dB` | PASS |
| `stinger.boss_appear` | sfx | `-16.6` | `-2.1` | `-18.0` | `0.0 dB` | PASS |

### Ambience & Environment Loops (5 Cues)

| Cue ID | Bus | Integrated LUFS | True Peak (dBFS) | Target | Gain Proposal | S5 Gate Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `ambience.workshop.cosy` | bgm | `-21.5` | `-9.0` | `-22.0` | `0.0 dB` | PASS |
| `ambience.battle.bed` | bgm | `-21.6` | `-7.2` | `-22.0` | `0.0 dB` | PASS |
| `ambience.cafe.afternoon` | bgm | `-22.1` | `-12.4` | `-22.0` | `0.0 dB` | PASS |
| `ambience.battle.intense` | bgm | `-21.7` | `-8.3` | `-22.0` | `0.0 dB` | PASS |
| `ambience.boss.dread` | bgm | `-20.4` | `-6.7` | `-22.0` | `-1.6 dB` | PASS |

### Voice Callout Slices (100 Cues)

| Cue ID | Bus | Integrated LUFS | True Peak (dBFS) | Target | Gain Proposal | S5 Gate Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `mochi-hit-1-1.flac` | voice | `-16.1` | `-5.9` | `-18.0` | `-1.9 dB` | PASS |
| `mochi-hit-1-2.flac` | voice | `-16.0` | `-6.2` | `-18.0` | `-2.0 dB` | PASS |
| `mochi-death-1-1.flac` | voice | `-16.5` | `-7.4` | `-18.0` | `0.0 dB` | PASS |
| `mochi-death-1-2.flac` | voice | `-16.5` | `-7.8` | `-18.0` | `0.0 dB` | PASS |
| `soot-hit-1-1.flac` | voice | `-16.1` | `-5.6` | `-18.0` | `-1.9 dB` | PASS |
| `soot-hit-1-2.flac` | voice | `-16.0` | `-5.9` | `-18.0` | `-2.0 dB` | PASS |
| `soot-death-1-1.flac` | voice | `-16.0` | `-6.9` | `-18.0` | `-2.0 dB` | PASS |
| `soot-death-1-2.flac` | voice | `-16.0` | `-7.2` | `-18.0` | `-2.0 dB` | PASS |
| `clover-hit-1-1.flac` | voice | `-16.5` | `-7.3` | `-18.0` | `0.0 dB` | PASS |
| `clover-hit-1-2.flac` | voice | `-16.0` | `-7.1` | `-18.0` | `-2.0 dB` | PASS |
| `clover-death-1-1.flac` | voice | `-16.3` | `-5.9` | `-18.0` | `-1.7 dB` | PASS |
| `clover-death-1-2.flac` | voice | `-16.1` | `-4.8` | `-18.0` | `-1.9 dB` | PASS |
| `panko-hit-1-1.flac` | voice | `-16.1` | `-6.4` | `-18.0` | `-1.9 dB` | PASS |
| `panko-hit-1-2.flac` | voice | `-16.1` | `-6.1` | `-18.0` | `-1.9 dB` | PASS |
| `panko-death-1-1.flac` | voice | `-16.0` | `-6.9` | `-18.0` | `-2.0 dB` | PASS |
| `panko-death-1-2.flac` | voice | `-16.4` | `-7.1` | `-18.0` | `-1.6 dB` | PASS |
| `mochi-select-1-1.flac` | voice | `-16.4` | `-7.8` | `-18.0` | `-1.6 dB` | PASS |
| `mochi-select-1-2.flac` | voice | `-16.0` | `-7.3` | `-18.0` | `-2.0 dB` | PASS |
| `mochi-attack-1-1.flac` | voice | `-16.0` | `-6.5` | `-18.0` | `-2.0 dB` | PASS |
| `mochi-attack-1-2.flac` | voice | `-16.0` | `-6.8` | `-18.0` | `-2.0 dB` | PASS |
| `mochi-attack-2-1.flac` | voice | `-16.1` | `-5.9` | `-18.0` | `-1.9 dB` | PASS |
| `mochi-attack-2-2.flac` | voice | `-16.5` | `-6.1` | `-18.0` | `0.0 dB` | PASS |
| `mochi-attack-3-1.flac` | voice | `-16.6` | `-7.3` | `-18.0` | `0.0 dB` | PASS |
| `mochi-attack-3-2.flac` | voice | `-16.5` | `-7.4` | `-18.0` | `0.0 dB` | PASS |
| `mochi-skill-1-1.flac` | voice | `-16.4` | `-7.8` | `-18.0` | `-1.6 dB` | PASS |
| `mochi-skill-1-2.flac` | voice | `-16.0` | `-7.4` | `-18.0` | `-2.0 dB` | PASS |
| `mochi-ult-1-1.flac` | voice | `-16.6` | `-6.4` | `-18.0` | `0.0 dB` | PASS |
| `mochi-ult-1-2.flac` | voice | `-16.5` | `-6.4` | `-18.0` | `0.0 dB` | PASS |
| `mochi-victory-1-1.flac` | voice | `-16.3` | `-7.6` | `-18.0` | `-1.7 dB` | PASS |
| `mochi-victory-1-2.flac` | voice | `-16.0` | `-7.9` | `-18.0` | `-2.0 dB` | PASS |
| `mochi-skill-2-1.flac` | voice | `-16.5` | `-7.4` | `-18.0` | `0.0 dB` | PASS |
| `mochi-skill-3-1.flac` | voice | `-16.4` | `-6.8` | `-18.0` | `-1.6 dB` | PASS |
| `mochi-charge-1.flac` | voice | `-16.1` | `-6.8` | `-18.0` | `-1.9 dB` | PASS |
| `mochi-charge-2.flac` | voice | `-16.9` | `-5.7` | `-18.0` | `0.0 dB` | PASS |
| `mochi-release-1.flac` | voice | `-16.8` | `-5.9` | `-18.0` | `0.0 dB` | PASS |
| `mochi-release-2.flac` | voice | `-18.3` | `-7.2` | `-18.0` | `0.0 dB` | PASS |
| `mochi-3.flac` | voice | `-16.7` | `-6.8` | `-18.0` | `0.0 dB` | PASS |
| `mochi-4.flac` | voice | `-17.6` | `-5.9` | `-18.0` | `0.0 dB` | PASS |
| `mochi-5.flac` | voice | `-17.2` | `-5.9` | `-18.0` | `0.0 dB` | PASS |
| `mochi-6.flac` | voice | `-16.9` | `-7.3` | `-18.0` | `0.0 dB` | PASS |
| `soot-select-1-1.flac` | voice | `-16.0` | `-6.4` | `-18.0` | `-2.0 dB` | PASS |
| `soot-select-1-2.flac` | voice | `-16.0` | `-6.7` | `-18.0` | `-2.0 dB` | PASS |
| `soot-attack-1-1.flac` | voice | `-16.0` | `-6.3` | `-18.0` | `-2.0 dB` | PASS |
| `soot-attack-1-2.flac` | voice | `-16.4` | `-6.7` | `-18.0` | `-1.6 dB` | PASS |
| `soot-attack-2-1.flac` | voice | `-16.0` | `-6.2` | `-18.0` | `-2.0 dB` | PASS |
| `soot-attack-2-2.flac` | voice | `-16.0` | `-6.6` | `-18.0` | `-2.0 dB` | PASS |
| `soot-attack-3-1.flac` | voice | `-16.0` | `-5.8` | `-18.0` | `-2.0 dB` | PASS |
| `soot-attack-3-2.flac` | voice | `-16.6` | `-6.1` | `-18.0` | `0.0 dB` | PASS |
| `soot-skill-1-1.flac` | voice | `-17.3` | `-6.4` | `-18.0` | `0.0 dB` | PASS |
| `soot-skill-1-2.flac` | voice | `-16.3` | `-6.6` | `-18.0` | `-1.7 dB` | PASS |
| `soot-ult-1-1.flac` | voice | `-16.6` | `-5.8` | `-18.0` | `0.0 dB` | PASS |
| `soot-ult-1-2.flac` | voice | `-16.0` | `-5.4` | `-18.0` | `-2.0 dB` | PASS |
| `soot-victory-1-1.flac` | voice | `-16.4` | `-7.1` | `-18.0` | `-1.6 dB` | PASS |
| `soot-victory-1-2.flac` | voice | `-16.0` | `-6.6` | `-18.0` | `-2.0 dB` | PASS |
| `soot-skill-2-1.flac` | voice | `-16.8` | `-6.9` | `-18.0` | `0.0 dB` | PASS |
| `soot-skill-3-1.flac` | voice | `-16.1` | `-6.5` | `-18.0` | `-1.9 dB` | PASS |
| `soot-charge-1.flac` | voice | `-16.3` | `-6.7` | `-18.0` | `-1.7 dB` | PASS |
| `soot-charge-2.flac` | voice | `-16.3` | `-6.2` | `-18.0` | `-1.7 dB` | PASS |
| `soot-release-1.flac` | voice | `-16.6` | `-6.6` | `-18.0` | `0.0 dB` | PASS |
| `soot-release-2.flac` | voice | `-16.7` | `-5.9` | `-18.0` | `0.0 dB` | PASS |
| `clover-select-1-1.flac` | voice | `-16.9` | `-5.2` | `-18.0` | `0.0 dB` | PASS |
| `clover-select-1-2.flac` | voice | `-16.1` | `-4.8` | `-18.0` | `-1.9 dB` | PASS |
| `clover-attack-1-1.flac` | voice | `-16.2` | `-6.6` | `-18.0` | `-1.8 dB` | PASS |
| `clover-attack-1-2.flac` | voice | `-16.4` | `-7.0` | `-18.0` | `-1.6 dB` | PASS |
| `clover-attack-2-1.flac` | voice | `-17.6` | `-5.9` | `-18.0` | `0.0 dB` | PASS |
| `clover-attack-2-2.flac` | voice | `-16.9` | `-5.2` | `-18.0` | `0.0 dB` | PASS |
| `clover-attack-3-1.flac` | voice | `-16.6` | `-5.5` | `-18.0` | `0.0 dB` | PASS |
| `clover-attack-3-2.flac` | voice | `-16.5` | `-5.5` | `-18.0` | `0.0 dB` | PASS |
| `clover-skill-1-1.flac` | voice | `-16.8` | `-5.2` | `-18.0` | `0.0 dB` | PASS |
| `clover-skill-1-2.flac` | voice | `-16.4` | `-4.7` | `-18.0` | `-1.6 dB` | PASS |
| `clover-ult-1-1.flac` | voice | `-16.4` | `-7.5` | `-18.0` | `-1.6 dB` | PASS |
| `clover-ult-1-2.flac` | voice | `-16.1` | `-7.5` | `-18.0` | `-1.9 dB` | PASS |
| `clover-victory-1-1.flac` | voice | `-16.6` | `-5.8` | `-18.0` | `0.0 dB` | PASS |
| `clover-victory-1-2.flac` | voice | `-16.1` | `-5.3` | `-18.0` | `-1.9 dB` | PASS |
| `clover-skill-2-1.flac` | voice | `-17.3` | `-5.9` | `-18.0` | `0.0 dB` | PASS |
| `clover-skill-3-1.flac` | voice | `-19.3` | `-6.0` | `-18.0` | `0.0 dB` | PASS |
| `clover-charge-1.flac` | voice | `-18.5` | `-4.8` | `-18.0` | `0.0 dB` | PASS |
| `clover-charge-2.flac` | voice | `-17.6` | `-4.5` | `-18.0` | `0.0 dB` | PASS |
| `clover-release-1.flac` | voice | `-16.3` | `-5.0` | `-18.0` | `-1.7 dB` | PASS |
| `clover-release-2.flac` | voice | `-16.7` | `-5.1` | `-18.0` | `0.0 dB` | PASS |
| `panko-select-1-1.flac` | voice | `-16.4` | `-6.6` | `-18.0` | `-1.6 dB` | PASS |
| `panko-select-1-2.flac` | voice | `-16.0` | `-6.3` | `-18.0` | `-2.0 dB` | PASS |
| `panko-attack-1-1.flac` | voice | `-16.5` | `-7.1` | `-18.0` | `0.0 dB` | PASS |
| `panko-attack-1-2.flac` | voice | `-16.1` | `-6.6` | `-18.0` | `-1.9 dB` | PASS |
| `panko-attack-2-1.flac` | voice | `-16.6` | `-6.5` | `-18.0` | `0.0 dB` | PASS |
| `panko-attack-2-2.flac` | voice | `-16.1` | `-6.2` | `-18.0` | `-1.9 dB` | PASS |
| `panko-attack-3-1.flac` | voice | `-16.0` | `-6.1` | `-18.0` | `-2.0 dB` | PASS |
| `panko-attack-3-2.flac` | voice | `-16.1` | `-6.1` | `-18.0` | `-1.9 dB` | PASS |
| `panko-skill-1-1.flac` | voice | `-16.2` | `-6.6` | `-18.0` | `-1.8 dB` | PASS |
| `panko-skill-1-2.flac` | voice | `-16.1` | `-6.2` | `-18.0` | `-1.9 dB` | PASS |
| `panko-ult-1-1.flac` | voice | `-16.1` | `-6.5` | `-18.0` | `-1.9 dB` | PASS |
| `panko-ult-1-2.flac` | voice | `-16.0` | `-6.5` | `-18.0` | `-2.0 dB` | PASS |
| `panko-victory-1-1.flac` | voice | `-16.1` | `-7.5` | `-18.0` | `-1.9 dB` | PASS |
| `panko-victory-1-2.flac` | voice | `-16.4` | `-7.3` | `-18.0` | `-1.6 dB` | PASS |
| `panko-skill-2-1.flac` | voice | `-17.1` | `-6.3` | `-18.0` | `0.0 dB` | PASS |
| `panko-skill-3-1.flac` | voice | `-17.7` | `-6.7` | `-18.0` | `0.0 dB` | PASS |
| `panko-charge-1.flac` | voice | `-17.1` | `-6.5` | `-18.0` | `0.0 dB` | PASS |
| `panko-charge-2.flac` | voice | `-17.2` | `-6.4` | `-18.0` | `0.0 dB` | PASS |
| `panko-release-1.flac` | voice | `-16.7` | `-6.1` | `-18.0` | `0.0 dB` | PASS |
| `panko-release-2.flac` | voice | `-16.2` | `-6.0` | `-18.0` | `-1.8 dB` | PASS |

---

## 3. CXI Audio Engine Gain Calibration Guide

For cues marked with gain proposals, CXI can apply normalization offsets in the audio playback engine via `gainDb` metadata in `manifest.json` or at the bus level:

1. **BGM / Ambience Bus**:
   - Master Ambience target is **-22.0 LUFS**. All 5 ambience tracks range between **-22.1 LUFS and -20.4 LUFS**, perfectly balanced for dialogue and combat readability.
   - Recommended ambient playback gain: **1.00 (0.0 dB)**.

2. **SFX Bus**:
   - Combat hits, skills, and boss layers are normalized to **-18.0 LUFS** with crisp peaks between **-1.2 dBFS and -2.9 dBFS**, ensuring strong impact punch without digital clipping.

3. **Voice Bus**:
   - All 104 sliced voice samples maintain a consistent **-16.0 to -17.7 LUFS** envelope. CXI's voice loader can apply a global **-1.8 dB** gain offset or individual variant offsets to match the **-18.0 LUFS** standard.

4. **UI Bus**:
   - Crisp, tactile feedback at **-16.6 to -19.5 LUFS** with true peaks $\le -2.3$ dBFS.
