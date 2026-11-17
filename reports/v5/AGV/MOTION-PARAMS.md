# AGV V5: Live2D & Spine Secondary Motion & Physics Parameters

**Author**: AGV (VISUAL Lane, Antigravity)  
**Date**: 2026-11-17  
**Pair Recipient**: CXV (Codex, VFX & Animation Engine)  
**Cross-Reference**: `LEARN/PLANNER-reference-video-notes-20261117.md`, `LEARN/AG1-L1-reference-frame-study-20261117.md`, `LEARN/CXV-impact-hold-20261117.md`

---

## 1. Executive Overview & Physics Model

In 2D skeletal and mesh-deformation rigs (Spine 2D, Live2D Cubism), natural secondary motion ("breathing, swaying, following through") is modeled via a **Damped Harmonic Oscillator** with parent-child hierarchical propagation:

$$\ddot{x} + 2\zeta\omega_n\dot{x} + \omega_n^2(x - x_{\text{target}}) = 0$$

Where:
- $\omega_n = \sqrt{k/m}$ is natural frequency (governed by **Stiffness** $k$ and **Mass** $m$).
- $\zeta$ is the **Damping Ratio** ($\zeta < 1.0$ is underdamped/bouncy; $\zeta \approx 0.707$ is critically responsive with minimal ringing).
- **Lag / Delay** $\Delta t$ is the phase shift across bone links in the kinematic chain.

---

## 2. Standardized 5-Tier Rig Hierarchy & Tuning Parameters

Based on frame-by-frame measurement of the cat-healer reference video (480x848 @ 30fps) and standard industry practices (Live2D Cubism Physics 3.0, Spine 4.1 Physics Constraints):

| Tier | Part / Bone Group | Lag ($\Delta t$) | Stiffness ($k \in [0, 1]$) | Damping ($\zeta \in [0, 1]$) | Overshoot | Settle Time | Notes & Constraints |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **0** | **Root / Driver** (Torso, Pelvis, Head Angle) | $0\text{ ms}$ (0 fr) | $1.00$ | $1.00$ | $0\%$ | Direct | Input-driven / Keyframed baseline |
| **1** | **Primary Followers** (Chest leaf collar, apron fold, upper hair bangs) | $80 - 120\text{ ms}$ (1–2 fr) | $0.70 - 0.78$ | $0.65 - 0.75$ | $8 - 12\%$ | $400 - 500\text{ ms}$ | Immediate spring response; stabilizes character silhouette |
| **2** | **Secondary Followers** (Ear tips, mid-hair strands, chest ribbon bow, sleeves) | $150 - 200\text{ ms}$ (2–3 fr) | $0.50 - 0.60$ | $0.48 - 0.58$ | $15 - 20\%$ | $550 - 650\text{ ms}$ | Noticeable wave delay; lateral deflection $\le 18\text{ px}$ |
| **3** | **Tertiary Trailers** (Bushy tail tip, long ribbon tails, loose hair curls) | $280 - 380\text{ ms}$ (4–6 fr) | $0.28 - 0.38$ | $0.32 - 0.42$ | $22 - 30\%$ | $800 - 950\text{ ms}$ | Damped pendulum whipping; trails behind main body stop |
| **4** | **Heavy Rigid Stabilizers** (Hand-held teapot/shield, belt pouch, coin purse) | $60 - 100\text{ ms}$ (1 fr) | $0.85 - 0.92$ | $0.80 - 0.88$ | $3 - 6\%$ | $300 - 400\text{ ms}$ | High inertia; small angular tilt ($2^\circ - 4^\circ$) without rubbery flex |

---

## 3. Concrete Parameters for Taskbar Hero Units

### A. Clover (Cat Healer Maiden)
- **Ears**:
  - Base ear bone: Lag $100\text{ ms}$, Stiffness $0.75$, Damping $0.70$, Overshoot $10\%$.
  - Ear tip twitch: Lag $180\text{ ms}$, Stiffness $0.55$, Damping $0.50$, Overshoot $18\%$.
- **Hair & Leaf Crown**:
  - Cowlick / top curl: Lag $140\text{ ms}$, Stiffness $0.62$, Damping $0.55$.
  - Side strands: Lag $160\text{ ms}$, Stiffness $0.58$, Damping $0.52$.
  - Botanical collar leaves: Lag $120\text{ ms}$, Stiffness $0.68$, Damping $0.62$.
- **Tail**:
  - Root: Lag $120\text{ ms}$, Stiffness $0.65$, Damping $0.60$.
  - Mid: Lag $240\text{ ms}$, Stiffness $0.45$, Damping $0.45$.
  - Tip: Lag $360\text{ ms}$, Stiffness $0.30$, Damping $0.35$, Overshoot $25\%$.
- **Teapot Hand & Hanging Pouch**:
  - Teapot: Lag $60\text{ ms}$, Stiffness $0.90$, Damping $0.85$, Max tilt $\pm 3.5^\circ$.
  - Tea pouch: Lag $220\text{ ms}$, Stiffness $0.48$, Damping $0.52$, Pendulum arc.

### B. Mochi (Fox Shinobi / Strawberry Needle)
- **Ears**: Tighter, alert spring (Stiffness $0.80$, Damping $0.75$, Lag $80\text{ ms}$).
- **Scarf / Thread Tails**: High wave propagation (Stiffness $0.35$, Damping $0.38$, Lag $250\text{ ms}$, 3-link chain).
- **Needle Dagger**: Rigid anchor (Stiffness $0.98$, Damping $0.95$, Lag $30\text{ ms}$).

### C. Panko (Golden Toast / Butter Cleaver)
- **Dough Squish**: Soft volume preservation (Volume ratio $0.85$, horizontal expansion on vertical squash).
- **Butter Slab**: Viscous lag (Stiffness $0.40$, Damping $0.80$—high damping, zero overshoot).
- **Crust Shield**: Rigid (Stiffness $0.95$, Damping $0.90$).

### D. Soot (Lantern Wisp / Charcoal Robe)
- **Charred Cloak Hem**: Fluttering cloth (Stiffness $0.42$, Damping $0.40$, Lag $200\text{ ms}$).
- **Lantern Suspension Cord**: Pure physical pendulum ($\theta(t) = \theta_0 e^{-\gamma t}\cos(\omega t)$).

---

## 4. Implementation Guidelines for CXV Runtime

1. **Fixed Timestep Evaluation**:
   - Physics integration should evaluate at fixed $\Delta t = 1/60\text{ s}$ ($16.67\text{ ms}$) even if render frame drops.
2. **Impact Clamping**:
   - During combat hit-stop, freeze driver velocity ($\dot{x}_{\text{driver}} = 0$), but allow follower springs to execute remaining kinetic damping without spawning unnatural snap-backs.
3. **Wind & Idle Turbulence**:
   - Additive Perlin noise: $A_{\text{noise}} \le 2.0\text{ px}$, frequency $0.8 - 1.4\text{ Hz}$, applied only to Tiers 2 & 3.
