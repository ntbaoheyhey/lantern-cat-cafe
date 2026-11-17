# V5 Sound Design & Layering Research (AG4)

## 1. Executive Summary & Principles
Sound effects for 2D/3D games require instant clarity, tactile feedback ("punchiness" / 打击感), and precise spatial/temporal synchronization with visual cues. Rather than relying on a single monolith sound, production standard relies on the **Transient-Body-Tail (TBT)** layering architecture.

## 2. Research Sources (>= 6 Sources, >= 3 Chinese)
1. **Indienova (indienova.com)**: 《游戏音效设计实战：打击感与技能音效分层解析》 — Focuses on the 4-phase lifecycle (Anticipation, Whoosh, Impact, Tail) and layering physics/magic/impacts.
2. **CiGA (ciga.me)**: 《游戏技能音效的生命周期与视听对齐》 — Transient alignment at exact impact frame ($0\text{ ms}$), physical material support for elemental abilities.
3. **Bilibili / Zhihu Audio Lab**: 《动作游戏打击感音效拆解：Transient/Body/Tail 频段雕刻与胶水压缩》 — Transient click extraction, 60–120 Hz fundamental thud, noise tail crossfades.
4. **Musician.ie / Sound Design Foundations**: *The Transient-Body-Tail (TBT) Layering Framework for Game Impacts* — Micro-timing offsets (+5 ms to +15 ms for body) and dynamic punch.
5. **Electronic Production UK**: *Micro-Timing and Frequency Carving for Punchy Impacts* — EQ separation (HPF transient > 1 kHz, body notch, tail sub-rumble).
6. **MasteringBox / GDC Audio Vault**: *Dynamic Processing and Limiting for Mobile & Web Game SFX* — Integrated loudness target (-16 to -18 LUFS for one-shots), true peak limiting <= -1.0 dBTP.

---

## 3. Layering Recipe Specification (Timing in ms, Gain in dB)

| Layer | Time Offset | Duration | Frequency / Synthesis Profile | Gain Target | Function |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Transient (Snap/Click)** | $0\text{ ms}$ (strict) | $5\text{ – }15\text{ ms}$ | High-pass filtered noise (> 1.2 kHz) or rapid frequency sweep (8 kHz -> 2 kHz). | $-6\text{ to }-9\text{ dBFS}$ | Edge clarity, instant arrival perception, high-frequency focus. |
| **Body (Thump/Weight)** | $+5\text{ to }+15\text{ ms}$ | $60\text{ – }150\text{ ms}$ | Sine pitch drop (120 Hz -> 45 Hz) or resonant acoustic thud (100–250 Hz boost). | $0\text{ to }-3\text{ dBFS}$ | Physical mass, gut-punch power, fundamental tone. |
| **Tail (Decay/Space)** | $+20\text{ to }+50\text{ ms}$ | $150\text{ – }400\text{ ms}$ | Low-pass filtered pink/brown noise (< 800 Hz) or decaying reverb flutter. | $-12\text{ to }-18\text{ dBFS}$ | Environmental dissipation, material resonance (metal, leaf, cloth). |

### Mathematical Synthesis Parameters for FFmpeg
1. **Transient Click**:
   `aevalsrc='sin(2*PI*3000*t)*exp(-t/0.005)':s=48000:d=0.02`
2. **Body Thump**:
   Pitch drop frequency $f(t) = f_0 \cdot \exp(-k \cdot t)$ where $f_0 = 120\text{ Hz}$, dropping to $50\text{ Hz}$ within $0.08\text{ s}$.
   `aevalsrc='sin(2*PI*(120 - 70*t/0.08)*t)*exp(-t/0.04)':s=48000:d=0.12`
3. **Tail Residue**:
   `anoisesrc=d=0.35:c=pink:s=48000,lowpass=f=600,afade=t=out:st=0.05:d=0.30`

---

## 4. Character-Specific Acoustic Motifs (Taskbar Hero V5)
- **Mochi**: Soft cloth whoosh (filtered white noise bandpass 400-1500 Hz) + plush thud (soft sine sweep 90->55 Hz, fast damping).
- **Soot**: Crackle + ember pop (staccato high transient clicks at 2.5 kHz - 5 kHz, warm low rumble 80 Hz).
- **Clover**: Airy chime (high harmonic overtone series 880 Hz, 1320 Hz, 1760 Hz with bell decay) + leaf rustle (granular high-mid flutter).
- **Panko**: Crunchy toast crack (asymmetric saturation on short noise burst) + butter squish (sub-low wet pop 110 Hz).

---

## 5. Web/Mobile Budget Constraints
- Integrated Loudness target: $-18\text{ LUFS} \pm 2\text{ LU}$ (one-shots), True Peak $\le -1.0\text{ dBTP}$.
- Codec: Opus in WebM container (mono, 48 kHz, 32-48 kbps) with AAC (.m4a) fallback.
- Size budget: $\le 25\text{ KB}$ per cue (typically 4-12 KB for Opus).
