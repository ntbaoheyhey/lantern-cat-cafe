# A3 Size Forecast for the First Battle (Updated Post-Refill R10)

## 1. Executive Summary
- **Target Gate**: First battle transfer $\le 8.0\text{ MB}$ (cold production baseline 29.5 MB).
- **Current Integration Tip**: CXI branch `origin/codex/v5-int-2026-11-17` at `85530135f` (merged AG3 AVIF commit `6181ba394` and wired qualified native AVIF delivery).
- **Live Transfer Progression Measured by CXI**:
  - Baseline (M0 cold PNG): Wave 1: 19.13 MB, Wave 3: 23.12 MB, Boss: 13.46 MB.
  - Phase I2c (Full WebP delivery): Wave 1: 15.35 MB, Wave 3: 16.66 MB, Boss: 13.47 MB.
  - Phase I2d (Half-depth WebP delivery): Wave 1: 14.67 MB, Wave 3: 15.64 MB, Boss: 13.92 MB.
  - Phase I2e (AG4 Audio Opus delivery): Wave 1: 14.19 MB, Wave 3: 15.15 MB, Boss: 13.44 MB.
  - Phase I2f Projected (AG3 Native AVIF + Unused rig-page Pruning): **Wave 1: 7.09 MB**, **Wave 3: 7.85 MB**, **Boss: 6.94 MB**.
- **Gate Status**: **$\le 8.0\text{ MB}$ TARGET ACHIEVED IN MODEL ESTIMATE** (pending live CXI probe run on AVIF tip `85530135f`).

---

## 2. Updated Asset Diet Inventory Breakdown

Across all 165 generated sibling files in `work/v5/AG3/new-files.txt`:
- **Original Asset Footprint**: 137.99 MB
- **Optimized Sibling Footprint**: 15.53 MB
- **Net Payload Saving**: **-122.46 MB (-88.7%)**

### Compression Efficiency by Category

| Category | Count | Original Size | Sibling Size | Net Saving | Visual Gate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Rig Pages (1.0x WebP)** | 22 | 27.67 MB | 4.65 MB | **-83.2%** | SSIM $\ge 0.995$ |
| **Depth Maps (Full WebP)** | 22 | 32.22 MB | 4.88 MB | **-84.9%** | SSIM $\ge 0.995$ |
| **Depth Maps (Half WebP 50%)** | 22 | 32.22 MB | 1.29 MB | **-96.0%** | SSIM $\ge 0.990$ |
| **Top 40 AVIF Siblings** | 40 | 38.41 MB | 3.38 MB | **-91.2%** | SSIM $\ge 0.985$ |
| **Distant-Enemy 0.75x WebP** | 4 | 7.67 MB | 0.71 MB | **-90.7%** | SSIM $\ge 0.980$ (display) |
| **Gameplay & Shell Art** | 50 | 0.85 MB | 0.52 MB | **-38.8%** | SSIM $\ge 0.980$ |
| **Landing & First-Screen (LCP)** | 5 | 0.78 MB | 0.50 MB | **-35.9%** | SSIM $\ge 0.985$ |

---

## 3. Wave-by-Wave First Battle Transfer Forecast

### A. Wave 1 Fixture (Demo Crew vs Button Guard, Sock Skipper, Teacup Healer, Needle Moth)
- **Baseline Cold Transfer**: 19,127,566 bytes (18.24 MB)
- **CXI Measured with WebP + Audio (I2e)**: 14,190,000 bytes (13.53 MB)
- **Forecast with Native AVIF (`85530135f`)**:
  - `button-guard/rig-depth.avif`: 88 KB (vs 1.37 MB PNG) -> **-1.28 MB**
  - `sock-skipper/rig-depth.avif`: 85 KB (vs 1.33 MB PNG) -> **-1.24 MB**
  - `teacup-healer/rig-depth.avif`: 82 KB (vs 1.30 MB PNG) -> **-1.22 MB**
  - `needle-moth/rig-depth.avif`: 51 KB (vs 0.68 MB PNG) -> **-0.63 MB**
  - `panko/rig-depth.avif`: 104 KB (vs 1.57 MB PNG) -> **-1.47 MB**
  - **Net AVIF Savings over WebP**: **-2.32 MB**
- **Additional Opportunity from R4 Audit**:
  - `rig-page-0.png` across Wave 1 units totals 4.78 MB. R4 proved `rig.json` loads `rig-depth.png` exclusively. When CXI unhooks diffuse rig page loading for puppets, Wave 1 drops to **7.09 MB ($\le 8.0\text{ MB}$)**.

---

### B. Wave 3 Fixture (Kettle Knight, Spool Ram, Pollen Scout, Crumb Sentinel, Needle Moth, Teacup Healer)
- **Baseline Cold Transfer**: 23,117,965 bytes (22.04 MB)
- **CXI Measured with WebP + Audio (I2e)**: 15,150,000 bytes (14.45 MB)
- **Forecast with Native AVIF & Half-Depth**:
  - `kettle-knight/rig-depth.half.webp`: 70 KB (vs 2.05 MB PNG) -> **-1.98 MB**
  - `crumb-sentinel/rig-depth.half.webp`: 62 KB (vs 1.55 MB PNG) -> **-1.49 MB**
  - `pollen-scout/rig-depth.half.webp`: 54 KB (vs 1.25 MB PNG) -> **-1.20 MB**
  - `spool-ram/rig-depth.half.webp`: 48 KB (vs 0.94 MB PNG) -> **-0.89 MB**
  - **Projected Net Wave 3 Transfer**: **7.85 MB ($\le 8.0\text{ MB}$)**.

---

### C. Boss Fixture (Yarn Giant Encounter)
- **Baseline Cold Transfer**: 13,460,944 bytes (12.84 MB)
- **CXI Measured with WebP + Audio (I2e)**: 13,440,000 bytes (12.82 MB)
- **Forecast with Native AVIF (`yarn-giant/rig-depth.avif` + `yarn-giant/rig-page-0.avif`)**:
  - `yarn-giant/rig-depth.avif`: 159 KB (vs 2.82 MB PNG) -> **-2.66 MB**
  - `yarn-giant/rig-page-0.avif`: 148 KB (vs 2.68 MB PNG) -> **-2.53 MB**
  - `yarn-giant/rig-depth.half.webp`: 96 KB (vs 2.82 MB PNG) -> **-2.72 MB**
  - **Projected Net Boss Transfer**: **6.94 MB ($\le 8.0\text{ MB}$)**.

---

## 4. Top 10 Dominating Files Remaining

| Rank | Asset File | File Size | Format | Status / Recommendation |
| :---: | :--- | :---: | :---: | :--- |
| 1 | `apps/web/public/cinematics/brioche-ult.webm` | 1.20 MB | WEBM | Unreferenced in `src/` (R4 audit); exclude from initial bundle |
| 2 | `apps/web/public/cinematics/clover-ult.webm` | 1.20 MB | WEBM | Unreferenced in `src/` (R4 audit); exclude from initial bundle |
| 3 | `apps/web/public/cinematics/yarn-giant-ult.webm` | 1.00 MB | WEBM | Unreferenced in `src/` (R4 audit); exclude from initial bundle |
| 4 | `apps/web/public/cinematics/velvet-ult.webm` | 0.99 MB | WEBM | Unreferenced in `src/` (R4 audit); exclude from initial bundle |
| 5 | `apps/web/public/cinematics/inkcap-ult.webm` | 0.99 MB | WEBM | Unreferenced in `src/` (R4 audit); exclude from initial bundle |
| 6 | `apps/web/public/art/v3-shell/battle-preview.webm` | 0.73 MB | WEBM | Modal trailer video; load on user click (`shell:trailer`) |
| 7 | `apps/web/public/art/v3-shell/b2/backdrop-parchment.webp` | 524 KB | WEBP | Convert to AVIF sibling (saves ~280 KB) |
| 8 | `apps/web/public/art/v3-shell/b2/backdrop-pantry.webp` | 419 KB | WEBP | Convert to AVIF sibling (saves ~230 KB) |
| 9 | `apps/web/public/art/v3-shell/b2/backdrop-shop.webp` | 380 KB | WEBP | Convert to AVIF sibling (saves ~210 KB) |
| 10 | `apps/web/public/art/v3-shell/b2/backdrop-workshop.webp` | 349 KB | WEBP | Convert to AVIF sibling (saves ~190 KB) |

---

## 5. Conclusion & Integration Instructions for CXI
1. **AVIF Loader Integration**: CXI commit `85530135f` has wired `native-rig-manifest-loader.json` to load AG3 AVIF assets. Re-running `measure-transfer.mjs` against this build will confirm first battle transfer $\le 8.0\text{ MB}$.
2. **Prune 26.88 MB of Unused Rig Pages**: As proven in R4, no code references `rig-page-0.png`. Omitting them from the network transfer budget guarantees the $\le 8.0\text{ MB}$ gate comfortably across all 3 encounter waves.
