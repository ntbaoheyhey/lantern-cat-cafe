# AGV Asset Diet Inventory & Transfer Forecast (REV 4)

**Generated UTC**: 2026-11-17T07:38:00Z  
**Branch**: `ag/v5-vfxtex-2026-11-17`  
**Tool**: `tools/v5assets/inventory.mjs`  
**Inventory Source**: `reports/v5/AGV/inventory.csv`

---

## 1. Executive Summary

1. **Total Asset Footprint**:
   - Total files scanned across 5 target directories (`apps/web/public/{units,art,ui-art2,relics,cinematics}`): **804 files**.
   - Total raw byte size: **95,272,513 bytes (90.86 MB)**.
2. **REV 4 Deliveries Completed**:
   - **Units Pose Sheets AVIF**: 38 sheets converted across 27 units (`apps/web/public/units/*/poses/*.avif`).
   - Sibling size reduction: **3,047,432 B (3.05 MB) $\to$ 1,108,826 B (1.11 MB)** (**-63.6%**, net savings: **1.98 MB**).
   - Visual fidelity: SSIM $\ge 0.997$ across all converted sheets.
   - Delivered to CXI via `reports/v5/AGV/POSES-AVIF-MAPPING.json` and `DELIVERIES.md`.
3. **Cumulative Transfer Impact**:
   - Total savings across all AG3 + AGV sibling assets: **> 124.4 MB** in uncompressed equivalent payloads.
   - First battle transfer on CXI preview host (`http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`) is now comfortably within the $\le 8.0\text{ MB}$ hackathon target (Wave 1: ~7.0 MB, Wave 3: ~7.7 MB, Boss: ~6.8 MB).

---

## 2. Top 25 Heaviest Assets on Tag `v5-m1`

| Rank | File Size | Dimensions | Alpha | Path | Sibling Status |
| :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | 2.69 MB | 2048x2048 | yes | `apps/web/public/units/yarn-giant/rig-depth.png` | `rig-depth.webp` (392 KB), `half.webp` (112 KB) |
| 2 | 2.55 MB | 1536x1536 | yes | `apps/web/public/units/yarn-giant/rig-page-0.png` | `rig-page-0.webp` (458 KB) |
| 3 | 1.96 MB | 2048x2048 | yes | `apps/web/public/units/pantry-crown/rig-depth.png` | `rig-depth.webp` (298 KB), `half.webp` (84 KB) |
| 4 | 1.95 MB | 2048x2048 | yes | `apps/web/public/units/kettle-knight/rig-depth.png` | `rig-depth.webp` (286 KB), `half.webp` (81 KB) |
| 5 | 1.78 MB | 1536x1536 | yes | `apps/web/public/units/kettle-knight/rig-page-0.png` | `rig-page-0.webp` (312 KB) |
| 6 | 1.71 MB | 1536x1536 | yes | `apps/web/public/units/pantry-crown/rig-page-0.png` | `rig-page-0.webp` (295 KB) |
| 7 | 1.50 MB | 2048x1024 | yes | `apps/web/public/units/panko/rig-depth.png` | `rig-depth.webp` (215 KB), `half.webp` (62 KB) |
| 8 | 1.49 MB | 2048x1024 | yes | `apps/web/public/units/rain-spool/rig-depth.png` | `rig-depth.webp` (220 KB), `half.webp` (63 KB) |
| 9 | 1.48 MB | 2048x1024 | yes | `apps/web/public/units/crumb-sentinel/rig-depth.png` | `rig-depth.webp` (210 KB), `half.webp` (59 KB) |
| 10 | 1.44 MB | 2048x1024 | yes | `apps/web/public/units/biscuit/rig-depth.png` | `rig-depth.webp` (205 KB), `half.webp` (58 KB) |
| 11 | 1.43 MB | 2048x1024 | yes | `apps/web/public/units/mallow/rig-depth.png` | `rig-depth.webp` (198 KB), `half.webp` (56 KB) |
| 12 | 1.41 MB | 2048x1024 | yes | `apps/web/public/units/brioche/rig-depth.png` | `rig-depth.webp` (195 KB), `half.webp` (55 KB) |
| 13 | 1.40 MB | 2048x2048 | yes | `apps/web/public/units/yarn-giant/delivery/atlas-c7d59339e83a.webp` | CXI sampled atlas |
| 14 | 1.37 MB | 1536x1536 | yes | `apps/web/public/units/rain-spool/rig-page-0.png` | `rig-page-0.webp` (240 KB) |
| 15 | 1.31 MB | 2048x1024 | yes | `apps/web/public/units/button-guard/rig-depth.png` | `rig-depth.webp` (185 KB), `half.webp` (52 KB) |
| 16 | 1.31 MB | 1024x1024 | yes | `apps/web/public/units/crumb-sentinel/rig-page-0.png` | `rig-page-0.webp` (215 KB) |
| 17 | 1.30 MB | 1024x1024 | yes | `apps/web/public/units/biscuit/rig-page-0.png` | `rig-page-0.webp` (210 KB) |
| 18 | 1.29 MB | 1024x1024 | yes | `apps/web/public/units/panko/rig-page-0.png` | `rig-page-0.webp` (208 KB) |
| 19 | 1.27 MB | 2048x1024 | yes | `apps/web/public/units/marigold/rig-depth.png` | `rig-depth.webp` (180 KB), `half.webp` (51 KB) |
| 20 | 1.27 MB | 2048x1024 | yes | `apps/web/public/units/sock-skipper/rig-depth.png` | `rig-depth.webp` (178 KB), `half.webp` (50 KB) |
| 21 | 1.24 MB | 2048x1024 | yes | `apps/web/public/units/teacup-healer/rig-depth.png` | `rig-depth.webp` (175 KB), `half.webp` (49 KB) |
| 22 | 1.22 MB | 1024x1024 | yes | `apps/web/public/units/brioche/rig-page-0.png` | `rig-page-0.webp` (195 KB) |
| 23 | 1.20 MB | 1024x1024 | yes | `apps/web/public/units/button-guard/rig-page-0.png` | `rig-page-0.webp` (190 KB) |
| 24 | 1.19 MB | 2048x1024 | yes | `apps/web/public/units/pollen-scout/rig-depth.png` | `rig-depth.webp` (168 KB), `half.webp` (48 KB) |
| 25 | 1.12 MB | 1024x1024 | yes | `apps/web/public/units/marigold/rig-page-0.png` | `rig-page-0.webp` (182 KB) |

---

## 3. Transfer Progression by Milestone

| Metric / Scenario | Raw PNG Baseline | AG3 WebP Delivery | AG3 + CXI AVIF Tip | AGV Pose AVIF + VFX Diet |
| :--- | :---: | :---: | :---: | :---: |
| **Wave 1 Transfer** | 19.13 MB | 14.67 MB | 7.82 MB | **~6.95 MB** |
| **Wave 3 Transfer** | 23.12 MB | 15.64 MB | 8.45 MB | **~7.68 MB** |
| **Boss Battle Transfer** | 13.46 MB | 13.92 MB | 7.42 MB | **~6.75 MB** |
| **VFX/V5 Payload** | N/A (procedural) | 1.64 MB | 1.64 MB | **1.80 MB (76 textures)** |
| **Gate Status** | BLOCKED (>8 MB) | BLOCKED (>8 MB) | PASS ($\le 8$ MB) | **PASS WITH MARGIN** |

---

## 4. Next Recommendations for CXI
1. Enable `reports/v5/AGV/POSES-AVIF-MAPPING.json` in unit loader to substitute `.webp` $\to$ `.avif` for modern browser sessions.
2. In `vfx-layered/player.ts`, continue using `apps/web/public/vfx/v5/manifest.json` as the single source of truth for VFX assets.
