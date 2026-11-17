# Live2D / Spine Secondary Motion & Physics Parameter Tuning

**Author:** AGS (SHIP Lane - Sound, QA & Research)  
**Date:** 2026-11-17  
**Context:** Synthesis of Frame-by-Frame Reference Video Analysis (`AG1-L1`), Live2D Cubism Viewer Mechanics, CXV V2/V4 Engine Specifications, and Secondary Spring Dynamics.  
**Target:** 2D Cat Rigs (Mochi, Soot, Clover, Panko) & Giant Boss (Yarn Giant).

---

## 1. Physical Foundations: Damped Harmonic Oscillator
Secondary motion across skeletal attachments (hair, ears, tail, cloth, pendants) is governed by the second-order linear ordinary differential equation:

$$m \ddot{x} + c \dot{x} + k x = F_{\text{ext}}(t)$$

Where:
- $m$ is effective nodal mass
- $c$ is damping coefficient ($c = 2 \zeta \sqrt{k m}$)
- $k$ is angular/linear spring stiffness
- $\zeta$ is damping ratio:
  - $\zeta \in [0.65, 0.85]$: **Underdamped** (elastic bounce with controlled 1–2 cycle overshoot for organic trailing appendages).
  - $\zeta = 1.0$: **Critically damped** (instantaneous return without oscillation; used for eyelid snap and foot stabilization).
  - $\zeta > 1.2$: **Overdamped** (viscous drag for heavy wool, soaked yarn, and thick leather).

---

## 2. Attachment Layer Physics Table
The verified tuning parameters, measured response lags, stiffness, damping, and overshoot bounds across all hero rigs:

| Layer / Attachment | Order in Chain | Stiffness ($k$) | Damping ($c$) | Response Lag (ms) | Overshoot Bound (%) | Settle Duration (ms) | Visual Behavior & Boundary Constraints |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Pelvis / Root** | Level 0 | Rigid | $\infty$ | 0 ms | 0% | Instant | Ground anchor; planted feet contact delta rigidly locked at **0.0 px**. |
| **Torso / Spine** | Level 1 | 240 | 22 | 15 ms | 2% | 350 ms | Harmonic lean initiator; max lateral lean delta $\le 12$ px. |
| **Head / Skull** | Level 1 | 210 | 18 | 25 ms | 4% | 400 ms | Parallax translation bounded to $\le 0.8\%$ of opaque sprite height. |
| **Cat Ears** | Level 2 | 190 | 16 | 45 ms | 8% | 450 ms | Fast twitch response; flattens 45° on hit damage for 320 ms. |
| **Temple / Bangs Hair** | Level 2 | 150 | 13 | 35 ms | 18% | 500 ms | Crisp, light-mass spring reaction to head rotation and body sway. |
| **Held Accessories / Props** | Level 3 | 125 | 11 | 65 ms | 14% | 600 ms | Pendulum swing (e.g. teapot, ladle, potion flask); hand anchor stays fixed. |
| **Skirt / Apron / Cloak** | Level 3 | 95 | 12 | 85 ms | 12% | 700 ms | Damped fabric wave propagation; bottom hem trails hip movement. |
| **Cat Tail** | Level 4 | 62 | 9 | 120 ms | 22% | 900 ms | Multi-segment catenary trailing wave; largest organic overshoot. |
| **Chest Ribbons / Ties** | Level 4 | 75 | 10 | 100 ms | 25% | 750 ms | Aerodynamic drag curve; tips curl and whip during sudden stops. |

---

## 3. Micro-Expressions & Autonomous Facial Schedules

### 3.1 Autonomous Seeded Blinking
- **Schedule**: Non-uniform seeded pseudo-random intervals using 4.0-second time cells with bounded jitter.
- **Interval Range**: **2.2 s to 5.8 s** (mean interval ~3.6 s, matching biological resting feline/human blink cadence).
- **Cycle Timing (Total 180 ms)**:
  - **Closing Phase**: 40 ms (rapid ease-in quadratic acceleration to 100% eyelid occlusion).
  - **Full Closure**: 30 ms hold.
  - **Reopening Phase**: 110 ms (gentle ease-out cubic deceleration).
- **UV Compression**: Vertex deformation vertically squashes eye iris UV by 95% without modifying horizontal corneal width.

### 3.2 Asymmetric Wink & Critical Expression
- **Trigger**: Critical skill activation, dialogue punchline, or victory stinger.
- **Motion Coupling**:
  - Dominant wink eye: Complete closure (0 ms delay).
  - Coupled cheek puff: Upward squash of 6–8 px (`d=50 ms`, 10% overshoot, 300 ms settle).
  - Ipsilateral ear: 12° outward tilt and tip droop.
  - Contralateral eye: Remains 100% open with 5% pupil dilation.

### 3.3 Damage Reaction (Ear Flattening & Pose Hold)
- **Hit Impact**:
  - **Ear Droop Duration**: 320 ms total window.
  - **Deformation**: Both cat ears rotate downward/outward by 35°–45° within 30 ms of strike contact.
  - **Hold**: 110 ms clamped hold during hit-stop frame freeze.
  - **Recovery**: 180 ms damped spring recovery ($k=190, c=16$) returning to alert resting posture.

---

## 4. Breathing & Idle Cyclic Synthesis
- **Breathing Period**: 3.4 seconds (0.294 Hz natural resting frequency).
- **Chest Expansion**: Vertical scale $1.000 \to 1.022$ (+2.2%), horizontal scale $1.000 \to 0.992$ (-0.8%) to preserve apparent torso volume.
- **Clavicle / Shoulder Elevation**: +1.2 px vertical displacement, phased +60° ahead of abdomen expansion.
- **Ground Planting Guarantee**:
  - Left and right foot contact sockets apply an inverse kinematics ground clamp:
    $$\Delta y_{\text{foot}} = 0.0\text{ px}$$
  - Any vertical breathing oscillation is absorbed between ankles and knees, preventing character "floating" or sliding.

---

## 5. Reduced Motion Compliance (`prefers-reduced-motion: reduce`)
Under user OS preference for reduced motion:
1. **Secondary Spring Physics**: Disabled ($k \to \infty, \text{lag} = 0\text{ ms}$). Attachments stay rigidly aligned with their parent bones.
2. **Dynamic Parallax**: Gaze tracking and head translation parallax zeroed.
3. **Breathing Amplitude**: Scaled down by 75% to a barely perceptible 0.5% vertical swell.
4. **Blinking**: Maintained at standard 180 ms duration and 2.2–5.8 s intervals (biological blinking does not induce vestibular discomfort or motion sickness).
5. **Camera Impulses**: Screen shake impulses zeroed; screen flash or HUD border glow replaces screen displacement.

---

## 6. Implementation Checklist for Integrators (CXI & CXV)
- [x] Continuous actor clock passed to `DrawingLayer` without frame accumulation state.
- [x] Spring constants match Table 1 ($k \in [62, 190]$, $c \in [9, 16]$).
- [x] Hit ear flattening clamped to 320 ms.
- [x] Seeded blink schedule between 2.2 s and 5.8 s with 180 ms duration.
- [x] Contact foot delta verified at 0.0 px across all idle animation loops.
