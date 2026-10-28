# Art Direction Guide — Cat Café Quest v2

This document defines the resolution, silhouette, palette, lighting, and readability standards for Cat Café Quest v2 pixel art assets. It serves as the canonical style foundation for all chapter rosters, elite variations, bosses, and hero characters following Owner Decision D-G3 (Option A).

---

## 1. Resolution & Canvas Dimensions (Decision D-G3 Option A)

The game maintains a **96 logical pixel scene height** (`SCENE_HEIGHT = 96`), rendered at integer display scaling (2× and 3×) with crisp nearest-neighbor / pixelArt sampling.

Instead of stretching 16×16 blobs, higher pixel budgets and frame counts are allocated per role:

| Character Role | Dimensions (W × H) | Scale Ratio | Minimum Animations & Frame Counts |
| :--- | :--- | :--- | :--- |
| **Regular (Balanced)** | **24 × 24 px** | 1.0× | Walk (4–6), Attack (3–4), Hit (2), Defeat (4) |
| **Regular (Swift)** | **24 × 24 px** | 1.0× | Walk (4–6), Attack (3–4), Hit (2), Defeat (4) |
| **Regular (Sturdy)** | **24 × 24 px** | 1.0× | Walk (4–6), Attack (3–4), Hit (2), Defeat (4) |
| **Elite** | **28 × 28 px** | ~1.17× – 1.2× | Walk (4–6), Attack (3–4), Hit (2), Defeat (4) |
| **Boss** | **40 × 40 px** | ~1.67× – 2.0× | Idle/Walk (4–6), Windup/Attack (3–4), Hit (2), Defeat (4–6) |
| **Hero Cat** | **32 × 32 px** (32 px tall) | — | Idle (4), Walk (4), Attack (3–4: windup → strike → recover), Hit (2) |

### Core Format Invariants
1. **Facing**: All monsters face **LEFT** (facing `x = 0`). The hero cat faces **RIGHT** (facing `x = width - 1`). They meet horizontally in the combat arena.
2. **Ground Contact / Feet Placement**: The bottom row (`y = height - 1`) of every frame must contain non-transparent pixels anchoring the character to the stage floor.
3. **Monochrome Matrix**: Authored as arrays of strings where each character maps to a hex color in `palette`. `.` is strictly transparent.
4. **Outline Key**: `'k'` is reserved for outer outlines.

---

## 2. Palette System: The "Cozy Cat Café at Night"

The game takes place inside a whimsical cat café after dark. Characters, monsters, and UI share an integrated color space rooted in `apps/web/src/theme.css` and chapter stage backdrops (`apps/web/src/art/backdrops/`).

### Global Surface & Theme Tokens
- `--bg: #1a1220` (Dark plum canvas background)
- `--surface: #2a1f36` (Plum container surface)
- `--surface-2: #3a2c4a` (Secondary elevated surface)
- `--surface-3: #4a3a5e` (High-contrast surface / active items)
- `--border: #72578d` (Plum border line)
- `--text: #fff3e0` (Warm milk white body text)
- `--muted: #c3aed0` (Soft lavender muted text)
- `--accent: #ffb86b` (Warm apricot amber primary highlight)
- `--good: #6be08a` / `--bad: #ff6b6b` (Feedback green / coral red)

### Chapter Palette Mapping

Each chapter extracts its primary colors from the corresponding stage backdrop:

```
+-------------------------------------------------------------------------------+
|  Chapter 1: Living Room    | Deep muted plum, walnut wood, brass, dust lilacs |
|  Chapter 2: Basement       | Damp stone, slate iron pipes, rusted copper-amber|
|  Chapter 3: Bathroom       | Glazed aquatic tile, porcelain lilac, bubble foam|
|  Chapter 4: Kitchen        | Stainless steel, granite gray, burner flame amber|
|  Chapter 5: Rooftops       | Midnight navy sky, chimney brick, starlight gold |
+-------------------------------------------------------------------------------+
```

#### Chapter 1: Living Room (`livingroom.ts`)
- **Atmosphere**: Cozy parlor illuminated by low brass floor lamps.
- **Backdrop Colors**:
  - Dark trim & outlines: `0x100c18` / `0x1e1824`
  - Wallpaper plum: `0x261e2e` (base), `0x2e2438` (pattern), `0x1a1422` (shadow)
  - Polished walnut floor: `0x322016` (light), `0x261610` (mid), `0x160c08` (grain)
  - Brass & velvet: `0xf0de96` / `0xd0b064` (brass lamps), `0x423250` (plum velvet sofa)
- **Monster Palette Guide**:
  - Dust Bunny: Lilac-gray fluff (`0xdad6e5`, `0xa29cb0`, `0x675f78`), blush pink (`0xffa8be`), white shine (`0xffffff`).
  - Loose Yarn: Magenta/berry wool (`0xd04878`, `0xa02858`, `0x681438`), lavender trim (`0xe8a8d0`), button eye amber (`0xffb848`).
  - Sock Puppet: Oatmeal knit (`0xf0e6d2`, `0xc8b8a0`), emerald heel/toe stripes (`0x389868`, `0x206040`), felt red tongue (`0xd83848`).
  - Roomba Scout: Brushed dark chassis (`0x342c3c`, `0x221c28`), safety gold bumper (`0xf4c042`, `0xb88820`), scanner ruby eye (`0xff4868`).
  - Yarn Giant: Royal violet wool (`0x5c3882`, `0x3c2058`, `0x241238`), wooden knitting needles (`0xd49b5c`, `0x8c5828`), magic core cyan (`0x68d8ff`).

#### Chapter 2: Basement (`basement.ts`)
- **Atmosphere**: Cool subterranean workshop with exposed timbers and copper plumbing.
- **Key Hues**: Cellar mortar (`0x1a1418`), wet brick (`0x302420`, `0x201612`), iron pipes (`0x242e34`, `0x3c4a52`), tarnished brass (`0xd8b04a`), dark timber (`0x4e3e2c`, `0x34261a`).

#### Chapter 3: Bathroom (`bathroom.ts`)
- **Atmosphere**: Steamy porcelain spa with glazed turquoise tile and lavender shadows.
- **Key Hues**: Deep marine tile (`0x1c2434`, `0x141822`), lavender enamel (`0x46566e`, `0x2c3848`), glazed terracotta (`0x6e5842`, `0x6a3852`), iridescent chrome & soap suds (`0xc4c0ce`, `0x767082`).

#### Chapter 4: Kitchen (`kitchen.ts`)
- **Atmosphere**: High-contrast culinary arena with stainless steel countertops and warm stove glows.
- **Key Hues**: Cold sheet steel (`0x1e262a`, `0x161c20`), granite prep station (`0x283236`, `0x384248`), brushed aluminum (`0x566068`, `0x3c444c`), cutting board oak (`0x322822`, `0x1c1412`), gas burner amber (`0xdca852`).

#### Chapter 5: Rooftops (`rooftops.ts`)
- **Atmosphere**: Midnight expanse under moonlit stars above chimney pots.
- **Key Hues**: Deep indigo skyline (`0x0c0818`, `0x140e24`), chimney silhouette (`0x06040a`), full moon ivory (`0xf4e29e`, `0x9a8a64`), slate shingles (`0x282032`, `0x181220`), red brick mortar (`0x48342a`), trailing chimney steam (`0x626c7c`).

---

## 3. Outline & Lighting Rules

To ensure sprites read crisply against complex parallax backdrops, every sprite follows strict contour and shading principles.

### The 1 px Dark Outline Rule
1. **Thickness**: Outlines must be **exactly 1 art pixel thick** on all external silhouettes.
2. **Color Choice**: Never use absolute `#000000` for organic characters. Use a deep, saturated plum-charcoal (`#140a12` for cats, `#100c18` to `#221a24` for monsters) to harmonize with `--bg` and prevent a "sticker" cutout effect.
3. **Corner Hygiene**: No unneeded double-corner pixels ("stair-step clumping"). Diagonal contours should connect diagonally to maintain crisp single-pixel silhouettes.
4. **Internal Detail Lines**: Creases and interior borders (e.g. between arm and torso, or collar trim) may use a medium-dark shade from the character's own ramp rather than the exterior outline `'k'`, preventing visual clutter at small sizes.

### Lighting Direction: Top-Left Key Light
1. **Light Vector**: The key light source shines from the **top-left at approximately 135°** (overhead and slightly behind the hero cat's starting position).
2. **Highlight Placement**:
   - Top and left-facing surfaces receive the lightest value in the ramp.
   - Specular glints (eye reflections, metal tips) occupy 1–2 pixels on upper-left edges.
3. **Shadow Placement**:
   - Bottom and right-facing edges receive deep shade values.
   - Underbellies, feet, and trailing fabric cast 1 px self-shadows against grounded limbs.

---

## 4. Silhouette Rules per Role

Readability in combat hinges on instant role recognition. Players should immediately understand a monster's defensive weight and attack timing from shape alone.

```
       ROUND BODY                  STREAMLINED / FORWARD            TALL / BLOCKY RECTANGLE
   (Regular - Balanced)              (Regular - Swift)                (Regular - Sturdy)
         /\_/\                             __......---.                       +-----+
       =( o.o )=                     (----'            `\                     | O O |
        (  "  )                       `--..________...--'                     |  U  |
         "" ""                                ""   ""                         |     |
      Dust Bunny                          Loose Yarn                          +-----+
                                                                            Sock Puppet
```

### Regular — Balanced (Round Body)
- **Silhouette Geometry**: Spherical, rounded mass, centered weight.
- **Readability**: Approaching circular or teardrop envelope. Soft, fluffy, or spherical contours.
- **Speed & Timing**: Standard cadence (e.g. 1.0s attack cycle).
- **Example**: `mon.dust.bunny` (24×24) — round fluff body with upright bouncy ears.

### Regular — Swift (Low, Long, Leaning Forward)
- **Silhouette Geometry**: Low center of gravity, horizontally stretched (width > height), leaning forward along the vector of motion.
- **Readability**: Trailing ribbons, swept-back appendages, aerodynamic contours that read as fast even when static.
- **Speed & Timing**: Fast attack cadence (e.g. 0.8s attack cycle).
- **Example**: `mon.loose.yarn` (24×24) — horizontally unravelled spool with trailing thread ribbons whipping backward.

### Regular — Sturdy (Tall, Blocky)
- **Silhouette Geometry**: Dominant vertical axis (height > width), rectangular or trapezoidal base, wide solid footing.
- **Readability**: High inertia, armored or rigid appearance, minimal taper at the ground line.
- **Speed & Timing**: Slower, heavier cadence (e.g. 1.4s attack cycle).
- **Example**: `mon.sock.puppet` (24×24) — vertical tube stance, rigid jaw hinge, heavy base.

### Elite (Regular's Shape + Crown or Armor, 1.2× Size)
- **Silhouette Geometry**: Scaled up to **28×28 px** (~1.2× visual volume).
- **Identification**: Retains the archetype silhouette of a household object, but augmented with distinct authority markers:
  - Golden antenna or crown spire.
  - Spiked or reinforced chassis plating.
  - Glowing scanner lens or auxiliary mechanical appendages.
- **Example**: `mon.roomba.scout` (28×28) — disc chassis augmented with a 3-prong antenna crown, heavy front bumper, and spinning rotary whiskers.

### Boss (Unique, Commanding, 2.0× Size)
- **Silhouette Geometry**: Sized at **40×40 px** (~2.0× linear dimension, ~4× area).
- **Identification**: Completely unique, towering profile that dominates the right half of the stage. Layered extremities, dramatic asymmetry, visible weaponry or totems.
- **Example**: `mon.yarn.giant` (40×40) — colossal knitted golem wielding a giant wooden knitting needle as a greatclub, with trailing wool capes and glowing button eyes.

---

## 5. Melee vs. "Throws Things" (Visual-Only Role Distinction)

While mechanical combat calculations remain uniform across archetypes, monster visual design communicates attack style through staging, posture, and props:

### Melee Monsters
- **Stance**: Forward lunge, low ready stance, limbs cocked backward to spring.
- **Prop / Anatomy**: Claws, biting jaws, heavy horns, or bludgeoning arms close to the body.
- **Attack Motion**: Body leaps or extends directly forward into the hero cat's space during impact.
- **Examples**: `mon.dust.bunny` (lunging ear-headbutt), `mon.sock.puppet` (gaping chomp strike), `mon.roomba.scout` (boosted bumper ram).

### "Throws Things" / Ranged Monsters
- **Stance**: Upright or rear-leaning posture with high center of balance.
- **Prop / Anatomy**: Held projectile, whip, spool, or wand clearly separated from the primary torso by negative space (visible silhouette gap).
- **Attack Motion**: Prop is drawn back overhead or behind, then hurled or whipped forward while the monster's body stays grounded.
- **Examples**: `mon.loose.yarn` (whips trailing thread lasso outward), `mon.yarn.giant` (sweeping shockwave with knitting needle).

---

## 6. Readability Verification: The 1× Solid Silhouette Test

Before any sprite is approved for production, it must pass the **1× Solid Silhouette Test**:

### Test Protocol
1. Take every authored frame at native resolution (24×24, 28×28, 40×40, 32×32).
2. Replace all opaque non-transparent pixels with solid black (`#000000`).
3. Display against a neutral contrast background (`#fff3e0` or `#3a2c4a`) at **1× scale** (unmagnified).

### Acceptance Criteria
- **Role Differentiation**: A player viewing the silhouette at 1× must immediately distinguish the balanced, swift, sturdy, elite, and boss shapes without color cues.
- **Action Readability**: In attack and hit frames, the active limb, weapon, or recoil direction must read clearly through silhouette extension rather than relying on interior line art.
- **Zero Ambiguity**: No accidental merged limbs where negative space is needed to define arms, tails, or ears.

All five Chapter 1 monsters and the Warrior Hero Cat in the G4 Art Pilot satisfy this readability benchmark.
