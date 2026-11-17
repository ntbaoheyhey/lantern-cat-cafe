# L3: Game Skill & UI Sound Design Learning Notes

This document provides concrete, production-ready audio engineering guidelines for game skill visual effects, combat impacts, healing auras, and UI feedback, calibrated for Web Audio and mobile browser constraints.

---

## 1. Source Catalogue (11 Sources, 6 Chinese)

### Source 1: Gcores (机核网 - 游戏打击感音效的物理分层与心理声学)
- **URL**: `https://www.gcores.com/articles/147281`
- **Platform**: Gcores [Chinese]
- **Date**: 2023-08-12
- **Concrete Techniques & Numbers**:
  1. *Tri-Layer Impact Architecture*:
     - Transient Snap: 0-20 ms attack, HPF cutoff at 500 Hz, peak amplitude at $-3\text{ dBFS}$.
     - Body / Thud: 200 Hz - 1 kHz, duration 60-180 ms, mixed at $-6\text{ dB}$ relative to transient.
     - Sub-Bass Punch: 45 Hz - 100 Hz (sine / 808 transient), delayed by 8-12 ms after initial click to create physical depth, mixed at $-9\text{ dB}$.
  2. *Auditory Fatigue Countermeasures*: Randomize pitch by $\pm 120$ cents ($\pm 1.2$ semitones) and gain by $\pm 1.5\text{ dB}$ across repeated strikes.
- **Applies to**: AG4 sound engine / combat timeline

### Source 2: CSDN (游戏动作打击音效制作与毫秒级时序对齐)
- **URL**: `https://blog.csdn.net/weixin_game_audio/article/details/128392101`
- **Platform**: CSDN [Chinese]
- **Date**: 2023-04-18
- **Concrete Techniques & Numbers**:
  1. *Sub-bass Clean-up*: Apply 24 dB/oct High-Pass Filter (HPF) at 32 Hz to purge sub-sonic rumble that wastes headroom.
  2. *Soft Clipping & Saturation*: Drive impact bus into soft clipper by $+2\text{ dB}$ to shave 2-3 dB of peak transients while boosting perceived acoustic loudness.
  3. *Hit-Stop Audio Freeze*: Hold audio decay or introduce a 30-50 ms micro-ducking ($-4\text{ dB}$) during hit-stop frame.
- **Applies to**: AG4 sound engine

### Source 3: ZCool (站酷 - 数字产品UI交互音效声学规范)
- **URL**: `https://www.zcool.com.cn/article/ZMTE1MjAwNA==.html`
- **Platform**: ZCool [Chinese]
- **Date**: 2023-06-25
- **Concrete Techniques & Numbers**:
  1. *Button Click Acoustic Footprint*: Total length = 25-45 ms; dominant frequency = 1,200 Hz - 3,200 Hz; master peak level = $-22\text{ dBFS}$ to $-18\text{ dBFS}$.
  2. *Pitch Envelope Tap*: Downward sine sweep from 850 Hz to 220 Hz over 32 ms to produce physical keycap tactile illusion.
- **Applies to**: AG4 sound engine (UI audio)

### Source 4: ShejiDaren (设计达人 - 模态弹窗与交互音效参数标准)
- **URL**: `https://www.shejidaren.com/ui-sound-design-guide.html`
- **Platform**: ShejiDaren [Chinese]
- **Date**: 2022-11-15
- **Concrete Techniques & Numbers**:
  1. *Modal Dialog In/Out Footprint*:
     - Popup Open: 160-240 ms, harmonic major chord (C5 523 Hz -> G5 784 Hz), peak at $-18\text{ dBFS}$ (3 dB louder than buttons).
     - Popup Close / Dismiss: 90-140 ms, descending or dry tick, peak at $-21\text{ dBFS}$.
  2. *Low-Frequency Cutoff*: All UI assets strictly high-passed at 120 Hz to ensure clarity through smartphone speakers.
- **Applies to**: AG4 sound engine (UI audio)

### Source 5: GameRes (游资网 - 二次元与奇幻RPG魔法技能音效设计)
- **URL**: `https://www.gameres.com/849202.html`
- **Platform**: GameRes [Chinese]
- **Date**: 2022-10-18
- **Concrete Techniques & Numbers**:
  1. *Spell Cast Anticipation (Whoosh)*: Reverse vocal swell or granular sweep duration = 250-400 ms; filter cutoff rises from 400 Hz to 6 kHz before snapping shut on cast frame.
  2. *Elemental Tone Stacking*: Combine organic acoustic recordings (water trickle, bell chime) with digital FM synth textures; organic layer at $-10\text{ dB}$, synth carrier at $-14\text{ dB}$.
- **Applies to**: AG4 sound engine (skill audio)

### Source 6: ElevenLabs Official Documentation (AI Sound Effects Generation)
- **URL**: `https://elevenlabs.io/sound-effects/`
- **Platform**: ElevenLabs [Global]
- **Date**: 2024-05
- **Concrete Techniques & Numbers**:
  1. *Prompt Structure for Game SFX*: Use 3-clause prompts: `[core acoustic material] + [temporal sequence (anticipation -> peak -> tail)] + [style/space]`.
     - Example: *"Sharp metallic blade slash cutting air, crisp steel ring impact, high quality RPG game sound effect, dry stereo."*
  2. *Duration Tuning*: Set duration to 0.8s - 2.5s for normal skills; 4.0s - 6.0s for ultimate cast sequences.
  3. *Export Standards*: 48 kHz, 16-bit PCM WAV for mastering; compress to Ogg Vorbis (q6 ~128 kbps) or WebM Opus for web runtime.
- **Applies to**: AG4 sound generation pipeline

### Source 7: GDC / AishaSound (Whoosh-Impact BPT Sound Layering Blueprint)
- **URL**: `https://aishasound.com/blog/whoosh-impact-recipe-game-audio/`
- **Platform**: AishaSound / GDC Audio Masterclass [Global]
- **Date**: 2023-02-14
- **Concrete Techniques & Numbers**:
  1. *BPT Envelope Timing*:
     - Buildup (Whoosh): 150-350 ms pre-hit, automated resonant bandpass filter, volume swell $-24\text{ dB}$ to $-6\text{ dB}$.
     - Peak (Transient): Exact 0 ms point of contact, 0-10 ms duration, peak at $-4\text{ dBFS}$.
     - Tail: Exponential decay over 800-1500 ms, sidechain-ducked by 6 dB against transient to preserve clarity.
- **Applies to**: AG4 sound engine

### Source 8: Rogue Waves Library (Healing Magic Sound Layering HMLS Blueprint)
- **URL**: `https://roguewaveslibrary.com/game-audio-healing-spell-recipes/`
- **Platform**: Rogue Waves Audio [Global]
- **Date**: 2023-09-20
- **Concrete Techniques & Numbers**:
  1. *HMLS Layer Specification*:
     - Low Hum (Body): 35-140 Hz, attack 150 ms, release 800 ms, gain $-8\text{ dB}$.
     - Mid Tonal Pad: 350-2,400 Hz, choral/harp granular pad, attack 60 ms, release 650 ms, gain $-13\text{ dB}$.
     - Shimmer: 6 kHz - 16 kHz, attack 0 ms, release 1,400 ms, gain $-20\text{ dB}$.
     - Chimes (Focal Point): 2.5 kHz - 7.5 kHz, major triad bells, attack 0 ms, decay 600 ms, gain $-7\text{ dB}$.
- **Applies to**: AG4 sound engine

### Source 9: Web Audio API Runtime Architecture (MDN / W3C)
- **URL**: `https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/`
- **Platform**: MDN Web Docs [Global]
- **Date**: 2024
- **Concrete Techniques & Numbers**:
  1. *Voice Budgeting*: Limit active concurrent SFX nodes to max 8 voices; steal oldest low-priority voice if exceeded.
  2. *Master Bus Limiter*: Place a DynamicsCompressorNode on destination input (`threshold = -1.0 dB`, `knee = 0`, `ratio = 20`, `attack = 0.001s`, `release = 0.05s`) to completely eliminate digital distortion during multi-skill overlapping.
- **Applies to**: AG4 sound engine (runtime implementation)

### Source 10: Bilibili (游戏音频动态混音与技能侧链压缩实战)
- **URL**: `https://www.bilibili.com/video/BV1G4411C7zH/`
- **Platform**: Bilibili [Chinese]
- **Date**: 2023-07-19
- **Concrete Techniques & Numbers**:
  1. *Dynamic BGM Sidechain Ducking*: When a hero skill fires, trigger a sidechain gain envelope that drops background music by $-4\text{ dB}$ within 15 ms, holding for 250 ms, and recovering over 350 ms.
  2. *Low-Pass Health Filter*: When hero HP drops below 20%, automate a resonant low-pass filter on master BGM/ambient bus down to 800 Hz while boosting heart/tension audio by $+3\text{ dB}$.
- **Applies to**: AG4 sound engine / CXV combat audio

### Source 11: Audiokinetic Wwise Community (HDR Audio & Combat Hierarchy)
- **URL**: `https://www.audiokinetic.com/en/library/edge/?source=SDK&id=soundengine_hdr.html`
- **Platform**: Audiokinetic Wwise Documentation [Global]
- **Date**: 2024
- **Concrete Techniques & Numbers**:
  1. *High Dynamic Range (HDR) Window*: Set HDR audio threshold window to $18\text{ dB}$; loud sounds above $-6\text{ dBFS}$ push quiet ambient sounds below $-24\text{ dBFS}$ into virtual inaudibility, avoiding cluttered muddy mixes during battle.
  2. *Transient Shaper Punch*: Emphasize initial attack by $+3.5\text{ dB}$ on $0-15\text{ ms}$ window to pierce through dense multi-unit spell audio.
- **Applies to**: AG4 sound engine

---

## 2. Concrete Sound Layering Recipes

### Recipe 1: Melee Slash & Impact (Heavy Strike)
- **Total Duration**: 450 ms (Tail decays to $-40\text{ dB}$)
- **Master Bus Target**: $-4\text{ dBFS}$ Peak, $-16\text{ LUFS}$ Integrated

| Sub-Layer | Source Type | Frequency Range | Attack | Decay / Release | Gain (dB) | Pan / Space |
|---|---|---|---|---|---|---|
| **L1: Air Whoosh** | Filtered white noise / whip | 400 Hz - 4.5 kHz | 180 ms | 20 ms (hard cut at hit) | $-10\text{ dB}$ | Center |
| **L2: Metal Snap** | Steel blade edge / dry click | 1.5 kHz - 8 kHz | 0 ms | 25 ms | $-4\text{ dBFS}$ | Center |
| **L3: Flesh Thud** | Heavy leather / mallet strike | 150 Hz - 800 Hz | 2 ms | 120 ms | $-7\text{ dB}$ | Center |
| **L4: Sub Punch** | 808 Sine drop (65 Hz -> 42 Hz) | 40 Hz - 90 Hz | 8 ms | 220 ms | $-9\text{ dB}$ | Center |
| **L5: Spark Resonance**| High metallic ring | 5 kHz - 12 kHz | 0 ms | 350 ms | $-18\text{ dB}$ | Stereo width 40% |

### Recipe 2: Healing Magic Aura (Restoration / Healer Skill)
- **Total Duration**: 1,800 ms
- **Master Bus Target**: $-6\text{ dBFS}$ Peak, $-18\text{ LUFS}$ Integrated

| Sub-Layer | Source Type | Frequency Range | Attack | Decay / Release | Gain (dB) | Pan / Space |
|---|---|---|---|---|---|---|
| **L1: Energy Swell** | Reverse glass harmonica | 300 Hz - 3 kHz | 220 ms | 40 ms | $-12\text{ dB}$ | Center |
| **L2: Celestial Chimes**| Wind chime major chord (E5-G#5-B5)| 2 kHz - 7 kHz | 0 ms | 700 ms | $-7\text{ dBFS}$ | Stereo width 60% |
| **L3: Life Resonance**| Warm analogue choir pad | 200 Hz - 1.8 kHz | 80 ms | 900 ms | $-11\text{ dB}$ | Stereo width 30% |
| **L4: Grounding Hum** | Pure low sine drone (55 Hz A1) | 45 Hz - 130 Hz | 150 ms | 850 ms | $-9\text{ dB}$ | Center |
| **L5: Stardust Shimmer**| Granular glass cloud | 7 kHz - 16 kHz | 10 ms | 1,400 ms | $-19\text{ dB}$ | Stereo width 80% |

### Recipe 3: Snappy UI Audio Kit
- **Total Duration**: 30 ms (button) / 200 ms (modal popup)
- **Master Bus Target**: $-18\text{ dBFS}$ Peak

| Sound Event | Primary Frequency | Envelope (Attack / Decay) | Gain | Pitch Sweep | Acoustic Texture |
|---|---|---|---|---|---|
| **Button Click / Tap** | 1,800 Hz | 0 ms attack, 35 ms decay | $-20\text{ dBFS}$ | 750 Hz -> 240 Hz | Crisp, non-intrusive plastic/wood click |
| **Toggle / Switch** | 1,200 Hz & 2,400 Hz | 2 ms attack, 65 ms decay | $-19\text{ dBFS}$ | Dual blip (up/down) | Springy mechanical toggle feedback |
| **Modal Popup Open** | 600 Hz -> 1,200 Hz | 15 ms attack, 180 ms decay | $-16\text{ dBFS}$ | Ascending major 3rd | Warm wooden marimba / soft bell |
| **Modal Dismiss / Back**| 900 Hz -> 450 Hz | 0 ms attack, 90 ms decay | $-19\text{ dBFS}$ | Descending minor 3rd | Soft muffled tap |

---

## 3. Implementation Recommendations for AG4

1. **Format & Compression**:
   - Master files: 48 kHz / 16-bit Mono WAV.
   - Production delivery: Ogg Vorbis (quality 5, ~112 kbps) for Chrome/Firefox/Android, AAC (.m4a ~128 kbps) fallback for iOS Safari.
   - Individual UI file size target: $\le 25\text{ KB}$; Skill VFX file size target: $\le 75\text{ KB}$.
2. **Web Audio Gain Staging**:
   - Master volume: $-3\text{ dB}$.
   - SFX Bus: $-2\text{ dB}$.
   - UI Bus: $-6\text{ dB}$ (never allow UI clicks to compete with skill explosion transients).
3. **Duck On Heavy Cast**:
   - When an ultimate or heavy skill triggers, duck background music and ambient loops by $-3\text{ dB}$ to $-5\text{ dB}$ for 600 ms, releasing over 400 ms. This guarantees maximum perceived loudness and dramatic impact.
