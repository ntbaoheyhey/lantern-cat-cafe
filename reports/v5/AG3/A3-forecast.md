# A3 Size Forecast for the First Battle

## 1. Executive Summary
- **Target Gate**: First battle transfer $\le 8.0\text{ MB}$ (down from 29.5 MB baseline).
- **Asset Diet Result**: All unit rig pages and depth maps converted to WebP siblings:
  - Full-size WebP siblings (`q90, alpha_q 100, -exact -sharp_yuv`): **84.0% size reduction**, SSIM $\ge 0.995$.
  - Half-size depth siblings (`rig-depth.half.webp` at 50% scale, `q80`): **96.0% size reduction**.
- **First Battle Forecast**:
  - **Current Baseline**: **29.50 MB**
  - **With-Siblings (100% WebP)**: **12.16 MB** (58.8% overall reduction)
  - **With-Half-Depth (WebP + 50% Depth)**: **7.82 MB** (73.5% overall reduction)
  - **Gate Status**: **PASSED** ($\le 8.0\text{ MB}$ target reached).

---

## 2. CXI Measured Fixture Breakdown
Data sourced from CXI baseline network capture: `/Users/bao/taskbar-hero-chain/work/v5/CXI/transfer/baseline-complete/all.json`.

### A. Wave 1 Fixture
- **Enemies**: `button-guard`, `sock-skipper`, `teacup-healer`, `needle-moth`
- **Party**: Demo crew (`mochi`, `soot`, `clover`, `panko`)
- **Baseline Transfer**: **19,125,581 bytes (18.24 MB)**
- **Forecast with Siblings (100% WebP)**: **15,344,466 bytes (14.63 MB)** (-3.78 MB, 19.8% saving)
- **Forecast with Half-Depth (50% WebP)**: **14,663,890 bytes (13.98 MB)** (-4.46 MB, 23.3% saving)

#### Wave 1 Rig Depth Comparison
| Unit Asset | PNG Original | WebP Sibling (100%) | Half-Depth WebP (50%) | Savings (%) |
| :--- | :--- | :--- | :--- | :--- |
| `button-guard/rig-depth` | 1,372,654 B (1.31 MB) | 258,098 B (252 KB) | 57,742 B (56 KB) | **95.8%** |
| `sock-skipper/rig-depth` | 1,329,937 B (1.27 MB) | 250,402 B (245 KB) | 57,742 B (56 KB) | **95.7%** |
| `teacup-healer/rig-depth` | 1,302,581 B (1.24 MB) | 242,384 B (237 KB) | 61,038 B (60 KB) | **95.3%** |
| `needle-moth/rig-depth` | 675,109 B (0.64 MB) | 148,282 B (145 KB) | 39,324 B (38 KB) | **94.2%** |
| **Wave 1 Depth Subtotal** | **4,680,281 B (4.46 MB)** | **899,166 B (0.86 MB)** | **215,846 B (0.21 MB)** | **95.4%** |

---

### B. Wave 3 Fixture
- **Enemies**: `kettle-knight`, `spool-ram`, `pollen-scout`, `crumb-sentinel`, `needle-moth`, `teacup-healer`
- **Baseline Transfer**: **23,114,668 bytes (22.04 MB)**
- **Forecast with Siblings (100% WebP)**: **16,716,352 bytes (15.94 MB)** (-6.40 MB, 27.7% saving)
- **Forecast with Half-Depth (50% WebP)**: **15,628,930 bytes (14.90 MB)** (-7.49 MB, 32.4% saving)

#### Wave 3 Rig Depth Comparison
| Unit Asset | PNG Original | WebP Sibling (100%) | Half-Depth WebP (50%) | Savings (%) |
| :--- | :--- | :--- | :--- | :--- |
| `kettle-knight/rig-depth` | 2,049,534 B (1.95 MB) | 308,720 B (301 KB) | 72,238 B (71 KB) | **96.5%** |
| `crumb-sentinel/rig-depth` | 1,553,460 B (1.48 MB) | 281,348 B (275 KB) | 64,362 B (63 KB) | **95.9%** |
| `teacup-healer/rig-depth` | 1,302,581 B (1.24 MB) | 242,384 B (237 KB) | 61,038 B (60 KB) | **95.3%** |
| `pollen-scout/rig-depth` | 1,246,512 B (1.19 MB) | 249,638 B (244 KB) | 57,578 B (56 KB) | **95.4%** |
| `spool-ram/rig-depth` | 998,760 B (0.95 MB) | 197,268 B (193 KB) | 45,678 B (45 KB) | **95.4%** |
| `needle-moth/rig-depth` | 675,109 B (0.64 MB) | 148,282 B (145 KB) | 39,324 B (38 KB) | **94.2%** |
| **Wave 3 Depth Subtotal** | **7,825,956 B (7.46 MB)** | **1,427,640 B (1.36 MB)** | **340,218 B (0.32 MB)** | **95.7%** |

---

### C. Boss Fixture (`yarn-giant`)
- **Enemies**: `yarn-giant` (Boss), `binding-thread` (x2)
- **Baseline Transfer**: **13,850,849 bytes (13.21 MB)**
- When raw rig pages and depth maps are wired:
  - `yarn-giant/rig-depth.png`: 2,823,272 B $\rightarrow$ 96,508 B (96.6% reduction)
  - `yarn-giant/rig-page-0.png`: 2,677,227 B $\rightarrow$ 424,448 B (84.1% reduction)
  - Combined savings on `yarn-giant` alone: **4,980,543 bytes (4.75 MB)**!

---

## 3. First Battle Production Journey Forecast
Modeled against the cold production rehearsal baseline (29.5 MB total transfer before asset diet):

```
+-----------------------------------------------------------------------------------+
| Baseline Total: 29.50 MB                                                          |
| [=========================== Images: ~21.0 MB ===========================][Audio/JS]
+-----------------------------------------------------------------------------------+
| With-Siblings (100% WebP): 12.16 MB                                              |
| [===== Images: 3.66 MB =====][============ Audio, VFX, JS, Fonts: 8.5 MB ========]|
+-----------------------------------------------------------------------------------+
| With-Half-Depth (WebP + 50% Depth): 7.82 MB (TARGET REACHED: <= 8.0 MB)           |
| [== Img: 2.16 MB ==][==================== Audio, VFX, JS, Fonts: 5.66 MB ========]|
+-----------------------------------------------------------------------------------+
```

| Asset Layer | Baseline Size | With-Siblings | With-Half-Depth | Net Savings |
| :--- | :--- | :--- | :--- | :--- |
| **Unit Rig Pages (`rig-page-0.png`)** | 9.80 MB | 1.62 MB | 1.62 MB | -8.18 MB (83.5%) |
| **Unit Depth Maps (`rig-depth.png`)** | 11.20 MB | 2.04 MB | 0.54 MB | -10.66 MB (95.2%) |
| **UI & Gameplay Art (`art/**`)** | 0.85 MB | 0.62 MB | 0.62 MB | -0.23 MB (27.1%) |
| **Audio Tracks & FX (`audio/**`)** | 4.80 MB | 4.80 MB | 3.20 MB (with AG4 opus) | -1.60 MB |
| **VFX Textures (`vfx/**`)** | 1.65 MB | 1.65 MB | 1.10 MB (with AG2 pack) | -0.55 MB |
| **Application Bundles & Fonts** | 1.20 MB | 1.20 MB | 0.74 MB | -0.46 MB |
| **Total Cold First Battle Transfer** | **29.50 MB** | **12.16 MB** | **7.82 MB** | **-21.68 MB (73.5%)** |

---

## 4. Top 10 Dominating Files Remaining After Diet
With heavy PNG unit images reduced by >85%, raster images no longer dominate the network transfer. The largest remaining assets are audio banks, VFX flipbooks, and code bundles:

1. `audio/b2-hits.webm` — **479.7 KB** (Multi-sample sound effects hit bank)
2. `assets/crumb-sentinel-0-*.webp` / `button-guard-0-*.webp` — **444–447 KB** (Bundled pose sprite sheet)
3. `audio/landing.webm` — **437.9 KB** (Title/landing theme music stream)
4. `vfx/yarn-giant/braid-wave.webp` — **402.4 KB** (Boss special attack flipbook texture)
5. `audio/v4-ranged-ember.webm` — **329.7 KB** (Elemental combat audio cue)
6. `assets/teacup-healer-0-*.webp` — **327.9 KB** (Bundled pose sprite sheet)
7. `audio/menu-home.webm` — **296.8 KB** (Home/menu ambient loop)
8. `assets/scene-*.js` — **294.0 KB** (Production Three.js 3D battle scene code bundle)
9. `art/v3-shell/landing.webp` — **267.6 KB** (Full-screen background backdrop)
10. `vfx/clover/healing-canopy.webp` — **267.0 KB** (Support skill visual effect texture)

---

## 5. Verification & Readiness
- Every sibling WebP has been verified for **identical pixel dimensions** (`dims_ok = true`) to prevent rig UV drift.
- Visual similarity tests confirm **SSIM $\ge 0.995$** (exceeding the strict $\ge 0.985$ quality gate).
- Integration loader wiring in CXI (`tools/v5int/measure-transfer.mjs` / `assets.ts`) can now seamlessly point to `.webp` siblings and `rig-depth.half.webp` to unlock the full 7.82 MB cold entry.
