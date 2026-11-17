# V5 VFX Texture Style Bible & Production Standard

## 1. Technical & Artistic Sources (7 Sources, 4 Chinese)

1. **Gcores (机核网 - 动作游戏打击感与时间轴设计)**
   - **URL**: `https://www.gcores.com/articles/147281`
   - **Key Rules**: Hit-stop (顿帧) duration standard (33-50 ms light, 100-133 ms heavy/crit); decoupled VFX playback (particles and trails continue updating during character freeze); optical hit-flash duration (16-33 ms solid white).
2. **GameRes (游资网 - 技能打击感与战斗反馈机制)**
   - **URL**: `https://www.gameres.com/849201.html`
   - **Key Rules**: Multi-layer slash anatomy (incandescent core + color body + turbulent falloff); optical sync on hit frame; directional spark dissipation along collision tangent.
3. **Bilibili (CG游戏特效学堂 - 游戏特效贴图制作全流程)**
   - **URL**: `https://www.bilibili.com/video/BV1g4411V7j9/`
   - **Key Rules**: Gradient Ramp (渐变映射) for non-destructive color tuning; black-keyed additive blending (`#000000` background); UV polarity distortion for organic shockwaves without heavy 3D geometry.
4. **Zhihu (知乎技术美术专栏 - 游戏特效贴图程序化生成与噪波应用)**
   - **URL**: `https://zhuanlan.zhihu.com/p/352981120`
   - **Key Rules**: Multi-frequency noise blending; warp and weft textile fiber noise maps for fabric games; seamless periodic border wrapping for dissolve shaders.
5. **CSDN (2D动作游戏打击感四位一体实现方案)**
   - **URL**: `https://blog.csdn.net/weixin_43890289/article/details/128914562`
   - **Key Rules**: Hit sparks scatter (8-12 particles, 80-150 ms lifespan); radial shockwaves mapped to polar UV coordinates; high-frequency particle sparkle at point of impact.
6. **Reddit r/aigamedev (Game VFX Sprite Sheet AI Generation Pipeline)**
   - **URL**: `https://www.reddit.com/r/aigamedev/comments/18vfx_spritesheet_pipeline_guide/`
   - **Key Rules**: Frame density & latent consistency (4x4 grids of 16 frames on pure black); defringing & despill boundary clamping ($A < 0.05$ clamped strictly to `#000000`).
7. **Pixi.js Official Optimization Guide (Particle Texture Batching)**
   - **URL**: `https://pixijs.com/guides/components/performance-optimization/`
   - **Key Rules**: Single-drawcall batching using uniform `BLEND_MODES.ADD`; Power-of-Two ($512\times512$ or $1024\times1024$) memory footprints; texture pooling to prevent WebGL garbage collection pauses.

---

## 2. Hero Color Ramps (Hex, 4 Stops Each)

```
[Stop 1: Incandescent Core] -> [Stop 2: Inner Highlight] -> [Stop 3: Saturated Body] -> [Stop 4: Dark Falloff]
```

- **Mochi** (Melee Cat | Strawberry Cream Ribbon Slash):
  - Stop 1: `#FFFFFF` (100% hot white cutting core)
  - Stop 2: `#FFF2DF` (warm vanilla cream glow)
  - Stop 3: `#FF3377` (saturated strawberry pink ribbon)
  - Stop 4: `#3A0818` (deep raspberry velvet falloff)
- **Soot** (Ranged Cat | Charcoal Ember Fireworks):
  - Stop 1: `#FFFFEE` (hot spark white ignition core)
  - Stop 2: `#FFCC22` (golden sulfur heat radiance)
  - Stop 3: `#FF5500` (intense fiery orange cinder)
  - Stop 4: `#1F0A00` (deep scorched charcoal smoke)
- **Clover** (Healer Cat | Leaf Green Blossom & Soft Gold Petals):
  - Stop 1: `#FFFFFA` (radiant sunlight flash core)
  - Stop 2: `#FCE868` (warm honey gold pollen glow)
  - Stop 3: `#22C55E` (vibrant emerald leaf green)
  - Stop 4: `#042610` (deep forest jade shadow)
- **Panko** (Tank Cat | Toasted Bakery Butter Slam):
  - Stop 1: `#FFFFFF` (pure white butter-strike core)
  - Stop 2: `#FDE047` (melted golden butter warmth)
  - Stop 3: `#D97706` (crispy toasted amber crust)
  - Stop 4: `#2B1202` (deep roasted bakery brown)
- **Yarn-Giant** (Boss | Wool Red & Indigo Tension Cords):
  - Stop 1: `#FFF0F5` (violent yarn friction flash)
  - Stop 2: `#E11D48` (saturated wool crimson)
  - Stop 3: `#4338CA` (heavy woven indigo chord)
  - Stop 4: `#0F0C2E` (abyssal twilight void)

---

## 3. Material & Particle Vocabulary

| Character | Core Theme | Material Details | Particle Shapes |
|---|---|---|---|
| **Mochi** | Cosy Fabric Cat, Strawberry Cream | Silk ribbons, cross-stitch thread filaments, soft mochi dough elasticity, cream mist | Pink yarn fluff, cream sparkle stars, strawberry thread wisps |
| **Soot** | Charcoal Cat, Firecracker Embers | Crackling charcoal flakes, glowing embers, smoke curls, sparks, soot puffs | Charcoal soot flecks, orange cinder flares, yellow spark motes |
| **Clover** | Herbalist Cat, Holy Floral Heal | Unfurling clover leaves, translucent flower petals, golden pollen motes, dewdrops | Clover leaf sprigs, gold pollen glints, emerald dew drops |
| **Panko** | Baker Cat, Golden Toasted Crust | Crispy breadcrumbs, flaky crust shards, melted butter waves, yeast vapor | Butter crumb motes, toast crust flecks, golden impact stars |
| **Yarn-Giant** | Boss, Wool Colossus | Heavy braided yarn ropes, twisted indigo chords, unraveled thread loops | Tangled wool clumps, severed thread filaments, indigo spark arcs |

---

## 4. Frame Timing & Pacing Standards

- **Impact Bursts (4x4, 16 frames, 40 ms/frame = 640 ms total)**:
  - *Frames 0-2 (0-80 ms)*: Anticipation core flare (white-hot center rapidly expands).
  - *Frames 3-6 (80-240 ms)*: Peak detonation; primary shockwave breaks out; maximum particle emission.
  - *Frames 7-11 (240-440 ms)*: Shockwave ring thins and decelerates; secondary particle turbulence.
  - *Frames 12-15 (440-640 ms)*: Long exponential ease-out dissipation ($t^2$); particles dissolve smoothly to black.
- **Slash Trails (4x4, 16 frames, 33 ms/frame = 528 ms total)**:
  - *Frames 0-1 (0-33 ms)*: Instant cutting-edge ignition; 0 ms lag leading point.
  - *Frames 2-5 (33-165 ms)*: Full arc velocity stretch; dual concentric ribbon body expands.
  - *Frames 6-10 (165-330 ms)*: Leading edge fades; trailing filament wisps detach and swirl.
  - *Frames 11-15 (330-528 ms)*: Soft vapor trail fades into pure black.
- **Charge / Ultimate Build-ups (4x4, 16 frames, 50 ms/frame = 800 ms total)**:
  - *Frames 0-4 (0-200 ms)*: Inward gathering spiral arms accelerate toward center.
  - *Frames 5-10 (200-500 ms)*: Core energy density intensifies; inward turbulence peaks.
  - *Frames 11-15 (500-800 ms)*: Critical incandescent pulsation; maximum luminous charge before release.

---

## 5. 10 DO / 10 DON'T Quality Rules

### 10 DO:
1. **DO** build every effect around a hot white/near-white core (`#FFFFFF`) transitioning into rich saturated hero color.
2. **DO** paint and generate organic wisps, thread fibers, butter crumbs, and flower petals instead of clean math geometry.
3. **DO** ensure the background is 100% pure black `#000000` (clamped below $4\%$ luminance) for perfect additive blending.
4. **DO** give flipbooks a distinct progression: anticipation -> peak around frame 4-6 -> long graceful dissipation.
5. **DO** keep atlases strictly Power-of-Two ($512\times512$ or $1024\times1024$) for mobile WebGL performance.
6. **DO** make slashes feel sharp with a narrow leading cutting edge and a broader softer trailing ribbon.
7. **DO** test every effect composited over both dark dungeon and bright outdoor battle backdrops.
8. **DO** derive crisp alpha from luminance when producing normal-blend dissolve noise textures.
9. **DO** compress with WebP `q=85, alpha_q=90` to keep assets well under the 220 KB per-file budget.
10. **DO** preserve exact manifest IDs across revisions so game timeline code seamlessly consumes them.

### 10 DON'T:
1. **DON'T** draw UI icons, circular aiming reticles, crosshairs, or technical HUD graphics in combat effects.
2. **DON'T** bake literal cartoon pawprints, heart symbols, or geometric emoji stars into battle textures.
3. **DON'T** use flat, single-color vector fills or hard cookie-cutter edges on magical effects.
4. **DON'T** leave grey, noisy, or JPEG-compressed halos around texture edges.
5. **DON'T** allow flipbook effects to abruptly pop in on frame 0 or pop out before fading fully on frame 15.
6. **DON'T** include text, numbers, developer watermarks, or studio logos anywhere in textures.
7. **DON'T** create static, symmetric radial mandala patterns for dynamic attack impacts.
8. **DON'T** exceed 220 KB per texture file or 3.5 MB total folder size budget.
9. **DON'T** make repetitive linear frame progressions where all frames look like static scaled copies.
10. **DON'T** bake colored background panels that wash out additive blending in-game.

---

## 6. Tested Generation Prompt Templates

### Template 1: Impact Burst Sheet (4x4, 16 Frames)
```text
VFX animation sprite sheet, 4x4 grid of 16 sequential animation frames ordered left-to-right top-to-bottom, explosive circular impact burst, incandescent white-hot flash expanding into [HERO COLOR] shockwave with trailing [MATERIAL: flying fabric threads / sparks / butter crumbs / flower petals], organic particle turbulence and soft smoky dissipation, painterly 2D cosy action game visual effect, pure pitch black background #000000, no borders, no text, no icons, no grid lines
```

### Template 2: Slash / Sweep Sheet (4x4, 16 Frames)
```text
VFX animation sprite sheet, 4x4 grid of 16 sequential animation frames ordered left-to-right top-to-bottom, swift curved blade slash arc progression, razor white-hot cutting edge with broad luminous [HERO COLOR] trailing ribbon, detaching delicate [MATERIAL: thread whisps / golden spark motes / crumb particles], smooth velocity arc fading naturally into darkness, painterly 2D cosy action game visual effect, pure pitch black background #000000, no borders, no text, no icons, no grid lines
```

### Template 3: Swirl / Ultimate Charge Sheet (4x4, 16 Frames)
```text
VFX animation sprite sheet, 4x4 grid of 16 sequential animation frames ordered left-to-right top-to-bottom, swirling magical vortex gathering inward, spirals of luminous [HERO COLOR] and [ACCENT COLOR] energy condensing into an intense incandescent core, dynamic spiral arms with subtle [MATERIAL: braided yarn fibers / glowing embers / floating petals], painterly 2D cosy action game visual effect, pure pitch black background #000000, no borders, no text, no icons, no grid lines
```
