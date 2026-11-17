# R5 Duplicate and Near-Duplicate Image Report

Exhaustive analysis across 601 public image assets detecting:
1. **Exact Bit-for-Bit Duplicates**: Identical SHA-256 hashes.
2. **Perceptual Near-Duplicates**: Identical dimensions with SSIM $\ge 0.995$.

## Executive Summary

- **Exact Duplicate Groups**: **40 groups** (88 total files)
- **Wasted Bytes from Exact Duplicates**: **110.8 KB**
- **Perceptual Near-Duplicates (SSIM $\ge 0.995$)**: **6 pairs**

## Key Findings & Opportunities

### 1. Heaviest Exact Duplicate: Binding Thread (`97.5 KB`)
- `units/binding-thread/portrait.webp` and `units/binding-thread/runtime.webp` are bit-for-bit identical (SHA-256 `cbd44de6...`).
- **Remediation**: CXI can alias `runtime.webp` to `portrait.webp`, saving 97.5 KB immediately.

### 2. Multi-Copy UI Foreground & Light Sets
- `art/visual/foreground-1.png` through `foreground-5.png`: **5 copies of the exact same 393-byte file**.
- `art/visual/light-1.png`, `light-2.png`, `light-5.png`: **3 copies of the exact same 663-byte file**.
- **Remediation**: Consolidate to single source assets in the visual system.

### 3. Monster Idle vs Walk Sprite Copies
- 25 monster sprite sets under `art/gameplay/mon.*` share 100% identical raster data for `-idle.png` and `-walk.png` (e.g. `mon.bathtub.tyrant`, `mon.vacuum.beast`, `mon.yarn.giant`).
- These are legacy 2D sprites (already identified in R4 as unreferenced by the current 3D rig combat engine).

### 4. Icon & Equipment Clones
- `art/squad/icon-restrain.png`, `icon-snare.png`, `icon-taunt.png`, `icon-threadSnare.png`: 4 identical copies.
- `art/squad/icon-burn.png`, `icon-emberOrb.png`, `icon-warmWick.png`: 3 identical copies.
- `art/squad/icon-guard.png`, `icon-shieldBash.png`, `icon-steadfast.png`: 3 identical copies.
- `item-arm.cozy.*` vs `item-slot*`: 5 equipment slot icons are duplicates of cozy armor set pieces.

## Top Exact Duplicate Groups

| Hash (First 8) | Copies | File Size | Wasted | Paths |
|:---:|:---:|:---:|:---:|:---|
| `cbd44de6` | 2 | 95.2 KB | **95.2 KB** | `units/binding-thread/portrait.webp`<br>`units/binding-thread/runtime.webp` |
| `3fa5fa56` | 5 | 0.4 KB | **1.5 KB** | `art/visual/foreground-1.png`<br>`art/visual/foreground-2.png`<br>`art/visual/foreground-3.png`<br>`art/visual/foreground-4.png`<br>`art/visual/foreground-5.png` |
| `4deda4eb` | 3 | 0.6 KB | **1.3 KB** | `art/visual/light-1.png`<br>`art/visual/light-2.png`<br>`art/visual/light-5.png` |
| `6e192c10` | 4 | 0.2 KB | **0.7 KB** | `art/squad/icon-restrain.png`<br>`art/squad/icon-snare.png`<br>`art/squad/icon-taunt.png`<br>`art/squad/icon-threadSnare.png` |
| `bafdfcfe` | 2 | 0.5 KB | **0.5 KB** | `art/gameplay/mon.bathtub.tyrant-idle.png`<br>`art/gameplay/mon.bathtub.tyrant-walk.png` |
| `3c81a014` | 2 | 0.5 KB | **0.5 KB** | `art/gameplay/mon.vacuum.beast-idle.png`<br>`art/gameplay/mon.vacuum.beast-walk.png` |
| `faf0b64b` | 2 | 0.5 KB | **0.5 KB** | `art/gameplay/mon.yarn.giant-idle.png`<br>`art/gameplay/mon.yarn.giant-walk.png` |
| `60377883` | 2 | 0.5 KB | **0.5 KB** | `art/gameplay/mon.laser.dot.phantom-idle.png`<br>`art/gameplay/mon.laser.dot.phantom-walk.png` |
| `b6b53302` | 2 | 0.5 KB | **0.5 KB** | `art/gameplay/mon.cucumber.scare-idle.png`<br>`art/gameplay/mon.cucumber.scare-walk.png` |
| `ac8b2a87` | 3 | 0.2 KB | **0.4 KB** | `art/squad/icon-burn.png`<br>`art/squad/icon-emberOrb.png`<br>`art/squad/icon-warmWick.png` |
| `8899b6c1` | 2 | 0.4 KB | **0.4 KB** | `art/gameplay/mon.pickle.imp-idle.png`<br>`art/gameplay/mon.pickle.imp-walk.png` |
| `527ee254` | 2 | 0.4 KB | **0.4 KB** | `art/gameplay/mon.hair.dryer.wisp-idle.png`<br>`art/gameplay/mon.hair.dryer.wisp-walk.png` |
| `6dd7a418` | 2 | 0.4 KB | **0.4 KB** | `art/gameplay/mon.chimney.ghost-idle.png`<br>`art/gameplay/mon.chimney.ghost-walk.png` |
| `4bdd1436` | 2 | 0.4 KB | **0.4 KB** | `art/gameplay/mon.box.fort.knight-idle.png`<br>`art/gameplay/mon.box.fort.knight-walk.png` |
| `d719cb88` | 2 | 0.4 KB | **0.4 KB** | `art/gameplay/mon.spoon.bug-idle.png`<br>`art/gameplay/mon.spoon.bug-walk.png` |

## Near-Duplicate Pairs (SSIM $\ge 0.995$)

| File A | File B | Dimensions | Size A | Size B | SSIM |
|:---|:---|:---:|:---:|:---:|:---:|
| `art/gameplay/item-acc.hunter.png` | `art/gameplay/item-acc.lucky.png` | 32x32 | 0.2 KB | 0.2 KB | **0.99748** |
| `ui-art2/skill-frame-lanternarc.png` | `ui-art2/skill-frame-seamsweep.png` | 48x48 | 0.2 KB | 0.2 KB | **0.99856** |
| `ui-art2/skill-frame-kettlepulse.png` | `ui-art2/skill-frame-mossparcel.png` | 48x48 | 0.2 KB | 0.2 KB | **0.99652** |
| `art/visual/light-2.png` | `art/visual/light-4.png` | 256x96 | 0.6 KB | 0.6 KB | **0.9958** |
| `art/visual/light-4.png` | `art/visual/light-5.png` | 256x96 | 0.6 KB | 0.6 KB | **0.9958** |
| `art/visual/light-1.png` | `art/visual/light-4.png` | 256x96 | 0.6 KB | 0.6 KB | **0.9958** |

## Next Steps for Integration

See [R5-duplicates.csv](file:///Users/bao/th-v5-ag3/reports/v5/AG3/R5-duplicates.csv) for the full list. CXI can deduplicate asset requests via runtime aliasing or loader mappings.
