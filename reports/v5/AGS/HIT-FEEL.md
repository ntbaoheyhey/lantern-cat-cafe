# Combat Hit Feel Quantitative Specification (HIT-FEEL.md)

**Author:** AGS (SHIP Lane - Sound, QA & Research)  
**Date:** 2026-11-17  
**Audience:** Integrators (CXI), VFX/Rig Engineers (CXV), Sound Designers (AGS)  
**Scope:** Quantitative timing, frame budgets, displacement curves, and cross-modal synchronization for combat game feel.

---

## 1. The Core Combat Feel Equation
Combat impact in 2D card/action RPGs relies on the **four-pillar synchronized impulse**:

$$\text{Hit Feel} = \text{Hit-Stop (Freeze)} + \text{Camera Impulse} + \text{Model Flash} + \text{Audio Transient Snap}$$

When these four events align within a **16.6 ms (1-frame) tolerance window**, the brain perceives weight, mass, and physical consequence. If any element desynchronizes by $\ge 33\text{ ms}$ (2 frames), the strike feels "floaty" or "disconnected".

---

## 2. Quantitative Matrix by Impact Severity

| Parameter | Light Hit (Basic Attack) | Medium Hit (Hero Skill) | Heavy Hit / Critical | Boss Ultimate (Yarn Slam) | Support / Heal / Buff |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Hit-Stop Duration** | **45 ms** (2.5 frames) | **70 ms** (4 frames) | **90 ms** (5.5 frames) | **110 ms** (6.5 frames) | **0 ms** (Explicitly Suppressed) |
| **Renderer Loop State** | Actor clock paused; particle/VFX clock active | Actor clock paused; particle/VFX clock active | Actor clock paused; particle/VFX clock active | Actor clock paused; particle/VFX clock active | Full 60 fps continuous |
| **Camera Shake Impulse** | **1.5 px – 2.5 px** | **4.0 px – 6.0 px** | **7.0 px – 9.0 px** | **10.0 px – 12.0 px** | **0.0 px** (Suppressed) |
| **Camera Shake Decay** | 100 ms linear | 120 ms exponential | 150 ms exponential | 180 ms ($D_0 e^{-15t}$) | N/A |
| **Camera Roll ($\theta$)** | Rigid $0.0^\circ$ | Rigid $0.0^\circ$ | Rigid $0.0^\circ$ | Rigid $0.0^\circ$ | Rigid $0.0^\circ$ |
| **Hit Flash Duration** | **33 ms** (2 frames) | **33 ms** (2 frames) | **45 ms** (2.7 frames) | **50 ms** (3 frames) | **0 ms** (Suppressed) |
| **Hit Flash Color** | Unlit `#FFFFFF` | Elemental Tinted | Pure `#FFFFFF` | Inverted `#FFE082` | Soft Green/Cyan Aura |
| **Victim Knockback** | **4 px – 8 px** | **12 px – 16 px** | **18 px – 22 px** | **24 px – 32 px** | **0 px** |
| **Knockback Duration** | 80 ms ease-out | 120 ms ease-out | 150 ms damped ($k=180$) | 200 ms damped ($k=160$) | N/A |
| **Ear Droop Duration** | 240 ms | 320 ms | 360 ms | 450 ms | 0 ms |
| **Audio Lead/Lag Window** | $0 \text{ to } +10\text{ ms}$ | $0 \text{ to } +10\text{ ms}$ | $-5 \text{ to } +5\text{ ms}$ | $-5 \text{ to } +5\text{ ms}$ | $0\text{ ms}$ |

---

## 3. Detailed Parameter Breakdown

### 3.1 Hit-Stop (Time Dilation & Pose Freezing)
- **Principle**: Upon damage evaluation at contact time $T_0$, freeze the victim's and attacker's skeletal/pose clocks (`animator.timeScale = 0`).
- **Critical Rule**: **Never freeze the GPU or the particle rendering engine.** Atmospheric dust, trailing slash arcs, and spark bursts must continue simulating at full 60 fps. Freezing the whole engine creates perceived stutter or browser jank; freezing only character poses creates punchy weight.
- **Timing Window**:
  - Basic: **45 ms** (CXV verified in `spine/scene.ts`).
  - Skill: **70 ms**.
  - Maximum ceiling: Never exceed **120 ms**, even on lethal boss strikes, to prevent player control anxiety.
- **Support Action Immunity**: Healing and barrier spells must **never** trigger hit-stop or camera shake on the caster or ally recipients.

### 3.2 Directional Camera Impulse & Exponential Decay
- **Displacement Vector**: The camera impulse is calculated along the opposing line of strike force:
  $$\vec{D}_0 = -A \cdot \frac{\vec{P}_{\text{victim}} - \vec{P}_{\text{attacker}}}{\|\vec{P}_{\text{victim}} - \vec{P}_{\text{attacker}}\|}$$
- **Decay Formula**:
  $$D(t) = \|\vec{D}_0\| \cdot e^{-\lambda t} \cdot \cos(\omega t)$$
  Where $\lambda = 15.0$ and $\omega = 45\text{ rad/s}$ over $t \in [0, 180\text{ ms}]$.
- **UI Decoupling**: HUD, health bars, damage numbers, and card hand containers must read from an anchored camera root with zero offset ($\vec{D}_{\text{UI}} = \vec{0}$). Shaking UI elements degrades phone legibility and irritates judges.

### 3.3 Hit Flash & Color Temperature
- **Flash Geometry**: Rendered as an unlit material override on the victim's mesh.
- **Temporal Curve**:
  - Frame 1 ($0 - 16.6\text{ ms}$): 100% white luminance (`#FFFFFF`, alpha 1.0).
  - Frame 2 ($16.6 - 33.3\text{ ms}$): 60% elemental tint (`#FFE082` Ember, `#A7F3D0` Clover, `#E9D5FF` Shadow, `#93C5FD` Tide).
  - Frame 3 ($33.3 - 50.0\text{ ms}$): Complete fade-out to normal diffuse.
- **Eye Safety Limit**: Maximum flash luminance clamped to 50 ms total; repeated multi-hit flurries must decay flash opacity by 50% per successive hit within a 300 ms window to prevent strobe fatigue.

### 3.4 Cross-Modal Audio-Visual Synchronization
- **Acoustic Psychoacoustics**:
  - Humans tolerate audio leading visuals by up to **20 ms** without perceiving desynchronization, but notice audio lagging visuals by as little as **15 ms** (perceiving the impact as "spongy" or "muddy").
- **Transient Alignment Gate**:
  - The synthesized attack transient (S1) must peak at **$T_{\text{impact}} \in [0, +10\text{ ms}]$** relative to the visual contact frame.
  - The low-frequency body weight (S2, 60–150 Hz) swells between **$+10\text{ ms}$ and $+50\text{ ms}$**, coinciding exactly with the hit-stop hold.
  - The spatial resonance tail (S3) decays over **$150 - 350\text{ ms}$**, decaying in parallel with camera shake settle and particle dissipation.

---

## 4. Reduced Motion Fallback Mode
When `prefers-reduced-motion: reduce` is detected:
1. **Camera Shake**: Impulse set to **0.0 px** (zero camera displacement).
2. **Hit-Stop**: Scaled to **0 ms** (pose clocks advance continuously).
3. **Screen Flash**: Replaced by a gentle, localized 10% opacity border vignette pulse (`#FFFFFF` fading over 150 ms).
4. **Knockback**: Scaled down by 50% without elastic spring overshoot.
5. **Audio**: Full spatial sound, transients, and loudness remain 100% intact.
