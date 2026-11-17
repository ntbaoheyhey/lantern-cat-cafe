# AGV V6: Combat Hit-Feel Architecture & Calibrated Values

**Author**: AGV (VISUAL Lane, Antigravity)  
**Date**: 2026-11-17  
**Pair Recipient**: CXV (Codex, VFX & Combat Timeline Engine)  
**Cross-Reference**: `LEARN/AG1-vfx-recipes-20261117.md`, `LEARN/CXV-impact-hold-20261117.md`, `LEARN/CXV-native-death-source-20261117.md`

---

## 1. Executive Summary & Four Pillars of Hit-Feel (四位一体打击感)

A visceral 2D combat feel relies on the coordinated execution of four simultaneous perceptual feedback channels triggered precisely at the moment of contact ($t = 0\text{ ms}$):

$$\text{Hit Feel} = \text{Hit-Stop (时间停顿)} + \text{Camera Shake (屏幕震屏)} + \text{Hit Flash (受击闪白)} + \text{Knockback & Deform (击退形变)}$$

All parameters below are calibrated for 60 fps simulation ($1\text{ frame} \approx 16.67\text{ ms}$).

---

## 2. Calibrated Parameter Matrix by Attack Severity

| Impact Tier | Attack Type Example | Hit-Stop Duration | Flash Color & Frames | Shake Amplitude & Duration | Knockback Distance | Return Curve |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **Tier 1 (Light)** | Mochi basic needle poke, Clover tea drop tick | **$33.3\text{ ms}$** (2 fr) | `#FFFFFF` (1 fr, $16.7\text{ ms}$) | $3 - 5\text{ px}$, $100\text{ ms}$ | $6 - 10\text{ px}$ | $100\text{ ms}$ ease-out quad |
| **Tier 2 (Medium)** | Mochi cherry slash, Panko butter cleaver | **$50.0\text{ ms}$** (3 fr) | `#FFFFFF` (2 fr, $33.3\text{ ms}$) | $6 - 8\text{ px}$, $140\text{ ms}$ | $14 - 18\text{ px}$ | $140\text{ ms}$ damped spring |
| **Tier 3 (Heavy)** | Soot fire lantern burst, Boss arm swing | **$83.3\text{ ms}$** (5 fr) | `#FFE082` (2 fr, $33.3\text{ ms}$) | $10 - 14\text{ px}$, $180\text{ ms}$ | $22 - 28\text{ px}$ | $180\text{ ms}$ damped spring |
| **Tier 4 (Critical)** | Hero Critical Detonation (all 4 heroes) | **$100.0\text{ ms}$** (6 fr) | `#FFF5B0` (3 fr, $50.0\text{ ms}$) | $14 - 18\text{ px}$, $220\text{ ms}$ | $30 - 38\text{ px}$ | $220\text{ ms}$ spring ($\zeta = 0.65$) |
| **Tier 5 (Boss Ult)** | Yarn Giant Spool Slam / Ground Crack | **$116.7\text{ ms}$** (7 fr) | `#FF4040` (2 fr) $\to$ `#FFD700` (2 fr) | $20 - 26\text{ px}$, $300\text{ ms}$ | $40 - 55\text{ px}$ | $300\text{ ms}$ spring + ground shake |

> [!IMPORTANT]
> **Hard Upper Bound**: Hit-stop must **never exceed $120\text{ ms}$** (7.2 frames). Exceeding $120\text{ ms}$ breaks game responsiveness and feels like engine frame dropping rather than physical weight.

---

## 3. Concrete Timeline & Execution Recipe for CXV Engine

### Step 1: Hit Contact ($t = 0\text{ ms}$)
- **Physics Freeze**:
  - Attacker bone update delta is set to $0$ (`animator.timeScale = 0`).
  - Defender bone update delta is set to $0$.
  - **Renderer Invariant**: Particle systems, screen shake, and additive VFX atlas flipbooks (`apps/web/public/vfx/v5/*.webp`) must **continue advancing at full 60 fps**.
- **Model Flash**:
  - Tint victim mesh unlit with target flash color for the specified frame count.
  - Set blend mode to additive or overwrite fragment color with uniform alpha.

### Step 2: Directional Screen Shake ($t = 0\text{ ms} \dots 220\text{ ms}$)
- Calculate directional impact vector:
  $$\vec{u}_{\text{dir}} = \frac{P_{\text{victim}} - P_{\text{attacker}}}{\|P_{\text{victim}} - P_{\text{attacker}}\|}$$
- Impulse displacement along primary axis and minor perpendicular axis ($3:1$ ratio):
  $$\Delta \vec{P}_{\text{cam}}(t) = A_0 \cdot e^{-15 t} \cdot \left(\cos(40\pi t) \vec{u}_{\text{dir}} + 0.33 \sin(60\pi t) \vec{u}_{\text{dir}}^\perp\right)$$
- **UI Decoupling Rule**: Only the battle stage world matrix is translated. The HUD, card hand, turn order pills, and damage number layer coordinates remain locked at $(0, 0)$ displacement.

### Step 3: Knockback & Squash-and-Stretch Deformation ($t = 0\text{ ms} \dots 200\text{ ms}$)
- **Squash on Contact**:
  - On Tier 3 & 4 impacts: squash victim sprite along impact normal to $0.88\times$ dimension, expanding transverse dimension to $1.12\times$ to preserve volume.
  - Hold squash for the duration of hit-stop ($33 - 100\text{ ms}$).
- **Knockback Curve**:
  - Immediate displacement along $\vec{u}_{\text{dir}}$ reaching peak displacement at end of hit-stop.
  - Return to anchor position via critically damped spring ($\zeta = 0.707$).

### Step 4: Support Suppression Rule (from CXV yarn-contact findings)
- When a boss or area skill impacts the party:
  - **Primary target (front-line hero taking direct contact)**: receives $100\%$ hit-stop, $100\%$ knockback, and triggers primary flash.
  - **Secondary allies / support units**: receive only background impulse shake ($30\%$ amplitude), **zero knockback**, and **zero hit-stop** freeze.
  - This prevents total visual disarray and keeps ally spell-casting readable.

---

## 4. Audio-Visual Synchronization Offsets
- **Audio Hit SFX**: Must start playing at $t = 0\text{ ms}$ (leading transient $\le 5\text{ ms}$).
- **VFX Spawn**: The 4x4 atlas (`mochi-crit-burst`, `clover-impact`, etc.) frame 0 must render on the exact frame hit-stop begins.
- **Damage Number Popup**: Spawns at $t = \text{hit-stop duration}$ (immediately when character unfreezes and begins recoil), ensuring player eye is drawn to the number as recoil resolves.
