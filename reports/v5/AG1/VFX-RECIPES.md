# R2: Deep-Dive VFX Recipes (5 Best Chinese Gamedev Tutorials)
- Scope: Step-by-step production recipes extracted from the top 5 Chinese game VFX and combat feel tutorials identified in L2.
- Purpose: Provide unambiguous, mathematically grounded parameter sets for CXV (runtime timeline & shader hooks) and AG2 (texture authoring & sprite sheet packaging).

---

## Recipe 1: Hit-Stop & Combat Impact Envelope (机核网 Gcores)
- **Source**: `https://www.gcores.com/articles/147281` (Gcores 动作游戏打击感与时间轴设计)
- **Target Component**: CXV Battle Timeline (`apps/web/src/game/cardrpg/battle-v3`)

### Step-by-Step Implementation:
1. **Frame 0 (Hit Detection Trigger, $0\text{ ms}$)**:
   - Synchronously execute logic hit registration and damage subtraction.
   - Spawn point-of-impact VFX at contact coordinates $(X, Y)$.
   - Trigger unlit solid white `#FFFFFF` Hit Flash on the victim model for exactly **2 frames ($33.3\text{ ms}$)**.
2. **Frames 1–3 (Hit-Stop Freeze, $16.6\text{ ms} - 50.0\text{ ms}$)**:
   - Freeze attacker and defender character animation update loops (`animator.speed = 0` or freeze frame delta).
   - **Crucial Rule**: Keep particle emitters and slash trails updating at full 60 fps; do NOT freeze the renderer.
   - For light slashes: freeze **2 frames ($33\text{ ms}$)**.
   - For heavy/crit slashes: freeze **4–6 frames ($66 - 100\text{ ms}$)**. (Never exceed $120\text{ ms}$).
3. **Frames 1–12 (Directional Camera Shake, $16.6\text{ ms} - 200\text{ ms}$)**:
   - Calculate impact vector $\vec{V}_{impact} = (P_{victim} - P_{attacker})$.
   - Apply instantaneous camera displacement impulse along $-\vec{V}_{impact}$ with magnitude **$8 - 12\text{ px}$**.
   - Decay displacement using exponential curve: $D(t) = D_0 \cdot e^{-15t}$ over **$180\text{ ms}$**.
   - Keep camera Roll locked to $0^\circ$. UI overlay coordinates must remain unshifted.
4. **Frames 4–15 (Follow-Through & Knockback)**:
   - Unfreeze character animation; apply victim knockback displacement ($12 - 24\text{ px}$) decaying over **$150\text{ ms}$**.

---

## Recipe 2: Directional Hit Sparks & Micro-TimeScale (CSDN)
- **Source**: `https://blog.csdn.net/weixin_43890289/article/details/128914562` (2D动作游戏打击感四位一体实现方案)
- **Target Component**: CXV Particle Emitter & AG2 Particle Textures

### Step-by-Step Implementation:
1. **TimeScale Micro-Slowdown (Alternative to Hard Pause)**:
   - Set global combat `timeScale = 0.05` for **$40\text{ ms}$**, then smoothly restore to $1.0$ over **$20\text{ ms}$** via linear interpolation. Softens multi-hit combo stutter.
2. **Hit Spark Emitter Configuration**:
   - **Texture**: $64\times64$ px elongated diamond spark (`spark_diamond.png`), pure white core fading to warm yellow (`#FFE082`). Additive blend.
   - **Particle Count**: Burst of **$8 - 14$ particles**.
   - **Spread Angle**: Cone of **$45^\circ$** aligned with the reflection angle of the incoming slash.
   - **Initial Velocity**: $250 - 450\text{ px/s}$.
   - **Lifespan**: $80 - 160\text{ ms}$ ($5 - 10$ frames).
   - **Size Over Lifetime**: Scale from $1.0$ ($32\text{ px}$) down to $0.1$ ($3\text{ px}$) with linear falloff.
   - **Alpha Over Lifetime**: Start at $1.0$, maintain through $50\%$ life, fade out rapidly to $0$ by $100\%$.

---

## Recipe 3: Polar Coordinates Radial Shockwave & 3-Tier Slash Arc (Bilibili)
- **Source**: `https://www.bilibili.com/video/BV1xK4y1P7vT/` (刀光拖尾与极坐标Shader游戏特效精粹)
- **Target Component**: AG2 Texture Authoring & CXV Shader / Sprite Mesh

### Step-by-Step Implementation:
1. **Linear Noise Texture Preparation (AG2)**:
   - Create a $512\times128$ px grayscale noise strip.
   - Horizontal axis ($U$): Represents radial angle ($0^\circ - 360^\circ$ or $0^\circ - 180^\circ$).
   - Vertical axis ($V$): Represents radius from center ($0$ at center, $1$ at outer rim).
   - Generate Perlin noise with horizontal tileability (`wrapMode = Repeat`).
2. **Polar Transform (Shader / Canvas UV)**:
   - Compute UV: $U = \text{atan2}(y, x) / (2\pi) + 0.5$; $V = \sqrt{x^2 + y^2} / R_{max}$.
   - Sample $512\times128$ noise texture with polar UV; expands instantaneously into a perfectly circular shockwave or curved slash crescent.
3. **Three-Tier Slash Anatomy**:
   - **Tier 1 (Core Knife Line)**: Pure white `#FFFFFF`, Additive blend, width $2 - 4\text{ px}$, opacity $100\%$, lifespan $90\text{ ms}$.
   - **Tier 2 (Gradient Energy Ribbon)**: Tapered crescent ribbon, width $28 - 42\text{ px}$, color ramp `#FFF9C4` (inner) $\to$ `#2ECC71` (mid) $\to$ transparent `#27AE60` (edge), Additive blend, lifespan $160\text{ ms}$.
   - **Tier 3 (Perimeter Sparks)**: 12 flecks trailing along outer curve, velocity $120\text{ px/s}$, lifespan $220\text{ ms}$.
4. **Timing Keyframes**:
   - $0\text{ ms}$: Opacity $0\%$, scale $0.2$.
   - $30\text{ ms}$ (Peak): Opacity $100\%$, scale $1.0$.
   - $120\text{ ms}$: Opacity $15\%$, scale $1.15$ (dissolve via noise threshold).
   - $160\text{ ms}$: Complete fade-out.

---

## Recipe 4: 4-Tier Healing Aura Architecture (Indienova)
- **Source**: `https://indienova.com/indie-game-development/vfx-layering-and-healing-magic-circles/` (治疗技能特效与多层法阵视觉构建)
- **Target Component**: AG2 Holy Texture Assets & CXV Layered VFX Scene

### Step-by-Step Implementation:
1. **Tier 1: Ground Magic Circle ($512\times512\text{ px}$ POT Texture)**:
   - Outer ring with runic glyphs; inner ring with octagonal clover/leaf sacred geometry.
   - Blend Mode: `BLEND_MODES.ADD`.
   - Scale-in: Easing spring from scale $0.1 \to 1.05 \to 1.0$ over **$240\text{ ms}$**.
   - Continuous Rotation: Outer ring at $+15^\circ\text{/s}$, inner ring at $-25^\circ\text{/s}$.
   - Lifetime: $1,600\text{ ms}$, fading out over final $300\text{ ms}$.
2. **Tier 2: Character Holy Light Pillar (Cylinder / Vertical Mesh)**:
   - Texture: $256\times512$ px vertical beam with soft Gaussian falloff on horizontal edges.
   - Animation: Panner node scrolling noise vertically ($V = -0.85\text{ units/s}$).
   - Color: Bright pale yellow core (`#FFFFD4`) to emerald glow (`#2ECC71`). Max alpha $0.35$.
   - Duration: $800\text{ ms}$ (trigger at cast, peak at $200\text{ ms}$, fade by $800\text{ ms}$).
3. **Tier 3: Rising Spores / Leaf Particles**:
   - Texture: $32\times32$ px clover leaf & sparkling star sprites (AG2).
   - Emitter: 24 particles spawned randomly within ground circle perimeter.
   - Motion: Initial velocity $Y = -90\text{ px/s}$, gravity $Y = -25\text{ px/s}^2$ (negative gravity, accelerating upward).
   - Sine Sway: Horizontal oscillation $X = X_0 + 8 \cdot \sin(6t)$ simulating rising thermal air currents.
   - Lifespan: $800 - 1,200\text{ ms}$.
4. **Tier 4: Screen Ambient Bloom Tint**:
   - Soft full-screen perimeter vignette with tint `#A8E6CF`.
   - Attack: $80\text{ ms}$ to peak alpha $0.12$.
   - Decay: $240\text{ ms}$ back to $0$.

---

## Recipe 5: Live2D / Spine Physics Damping & Secondary Chaining (Live2D CN)
- **Source**: `https://docs.live2d.com/cubism-editor-manual/physics-settings/` (Live2D 官方物理模拟摆动与多摆锤串联指南)
- **Target Component**: CXV Character Rig Physics (`apps/web/src/game/rig`)

### Step-by-Step Implementation:
1. **Multi-Pendulum Hierarchy (3-Stage Chain)**:
   - **Node 1 (Root, e.g. Hair Base / Skirt Waist)**:
     - Pendulum Length = $8$.
     - Stiffness $k = 0.85$, Damping $d = 0.75$.
     - Input Weight: $100\%$ from Body X/Z.
     - Lag: **$1\text{ frame}$ ($16.6\text{ ms}$)**. Overshoot: $\le 5\%$.
   - **Node 2 (Mid-section, e.g. Hair Mid / Apron)**:
     - Pendulum Length = $15$.
     - Stiffness $k = 0.65$, Damping $d = 0.80$.
     - Input Weight: $65\%$ from Node 1.
     - Lag: **$2 - 3\text{ frames}$ ($33 - 50\text{ ms}$)**. Overshoot: $12\%$.
   - **Node 3 (Tip / Trailer, e.g. Ribbon Ends / Tail Tip)**:
     - Pendulum Length = $24$.
     - Stiffness $k = 0.45$, Damping $d = 0.70$.
     - Input Weight: $80\%$ from Node 2.
     - Lag: **$4 - 5\text{ frames}$ ($66 - 83\text{ ms}$)**. Overshoot: **$22\%$**.
     - Settle Time: $650 - 850\text{ ms}$.
2. **Curve Interpolation Standard**:
   - Enforce **Continuous Bezier** curve mapping between parent driver angle and child offset.
   - Eliminates jerkiness when character abruptly stops or reverses movement direction.
