# R4 Unused-Image Audit Report

Comprehensive scan cross-referencing all 601 inventory images against 1,231 source files and manifests in `apps/web/src/` and `apps/web/public/**/*.json`.

> [!IMPORTANT]
> **READ-ONLY AUDIT**: In accordance with the AG3 specification, NO existing files have been moved, renamed, or deleted. This report provides exact data for CXI to safely clean up dead assets.

## Executive Summary

- **Total Tracked Images in Scope**: 601 images (74.22 MB)
- **Referenced (Direct, Dynamic, or Stem)**: 190 images (46.16 MB)
- **Completely Unreferenced**: **411 images** (**28.05 MB**, **37.8% of total image payload**)

## Breakdown by Folder

| Category | Total Files | Total Size | Unreferenced Files | Unreferenced Size | % Dead Payload |
|:---|:---:|:---:|:---:|:---:|:---:|
| `units/` | 141 | 68.20 MB | **22** | **25.64 MB** | 37.6% |
| `art/` | 410 | 4.55 MB | **351** | **1.08 MB** | 23.7% |
| `cinematics/` | 13 | 1.33 MB | **13** | **1.33 MB** | 100.0% |
| `relics/` | 4 | 0.13 MB | **0** | **0.00 MB** | 0.0% |
| `ui-art2/` | 33 | 0.01 MB | **25** | **0.01 MB** | 69.6% |

## Major Dead Asset Clusters

### 1. Rig Color Pages (`units/*/rig-page-0.png`) — 22 files, 26.88 MB
- **Root Cause**: The runtime cut-out loader (`apps/web/src/game/cardrpg/spine/assets.ts` line 40) parses `rig.json` which explicitly defines `pages: ["rig-depth.png"]`. The diffuse/color sheet `rig-page-0.png` is never loaded or referenced anywhere in `src/`.
- **Impact**: 26.88 MB of the 28.05 MB unreferenced total (95.8%) comes strictly from these 22 files. If CXI confirms color diffuse maps are not used by the shader pipeline, removing them frees ~27 MB from the repository.

### 2. Cinematics Posters (`cinematics/*-ult-poster.webp`) — 13 files, 1.40 MB
- **Root Cause**: The entire `cinematics/` folder (both videos and webp poster stills) is unreferenced in `apps/web/src/`. No UI component mounts or preloads these posters.
- **Impact**: 1.40 MB dead payload.

### 3. Legacy 2D Gameplay Sprites (`art/gameplay/mon.*` & `art/gameplay/mochi-*`) — ~200 files, ~800 KB
- **Root Cause**: Pre-turn3D raster animation frames (attack, walk, idle, hurt, nap for monsters and heroes). The active combat pipeline now renders Spine/cut-out puppet meshes via `turn3d`.

### 4. Legacy Shell & UI Assets (`art/v3-shell/b2/` & `ui-art2/`) — 75 files, ~300 KB
- **Root Cause**: Older UI iteration background slices and obsolete button graphics.

## Top 25 Heaviest Unreferenced Images

| Rank | File Path | Resolution | Size (KB) | Alpha | Category |
|:---:|:---|:---:|:---:|:---:|:---|
| 1 | `units/yarn-giant/rig-page-0.png` | 1536x1536 | 2614.5 KB | true | units |
| 2 | `units/kettle-knight/rig-page-0.png` | 1536x1536 | 1823.6 KB | true | units |
| 3 | `units/pantry-crown/rig-page-0.png` | 1536x1536 | 1752.5 KB | true | units |
| 4 | `units/rain-spool/rig-page-0.png` | 1536x1536 | 1402.9 KB | true | units |
| 5 | `units/crumb-sentinel/rig-page-0.png` | 1024x1024 | 1337.3 KB | true | units |
| 6 | `units/biscuit/rig-page-0.png` | 1024x1024 | 1332.1 KB | true | units |
| 7 | `units/panko/rig-page-0.png` | 1024x1024 | 1326.0 KB | true | units |
| 8 | `units/brioche/rig-page-0.png` | 1024x1024 | 1249.7 KB | true | units |
| 9 | `units/button-guard/rig-page-0.png` | 1024x1024 | 1225.1 KB | true | units |
| 10 | `units/marigold/rig-page-0.png` | 1024x1024 | 1151.3 KB | true | units |
| 11 | `units/mallow/rig-page-0.png` | 1024x1024 | 1133.5 KB | true | units |
| 12 | `units/pollen-scout/rig-page-0.png` | 1024x1024 | 1132.3 KB | true | units |
| 13 | `units/sock-skipper/rig-page-0.png` | 1024x1024 | 1060.1 KB | true | units |
| 14 | `units/teacup-healer/rig-page-0.png` | 1024x1024 | 1054.1 KB | true | units |
| 15 | `units/velvet/rig-page-0.png` | 1024x1024 | 958.8 KB | true | units |
| 16 | `units/binding-thread/rig-page-0.png` | 1024x1024 | 947.5 KB | true | units |
| 17 | `units/cinnamon/rig-page-0.png` | 1024x1024 | 924.2 KB | true | units |
| 18 | `units/spool-ram/rig-page-0.png` | 1024x1024 | 914.7 KB | true | units |
| 19 | `units/practice-cushion/rig-page-0.png` | 1024x1024 | 841.9 KB | true | units |
| 20 | `units/inkcap/rig-page-0.png` | 1024x1024 | 772.7 KB | true | units |
| 21 | `units/sorrel/rig-page-0.png` | 1024x1024 | 715.6 KB | true | units |
| 22 | `units/needle-moth/rig-page-0.png` | 1024x1024 | 583.7 KB | true | units |
| 23 | `cinematics/panko-ult-poster.webp` | 1280x720 | 125.9 KB | false | cinematics |
| 24 | `cinematics/brioche-ult-poster.webp` | 1280x720 | 118.3 KB | false | cinematics |
| 25 | `cinematics/yarn-giant-ult-poster.webp` | 1280x720 | 111.2 KB | false | cinematics |

## Recommendations for CXI

1. **Verify `rig-page-0.png` Requirement**: Confirm whether the 3D depth shader ever requires the diffuse color rig page. If not, removing or archiving them immediately eliminates 26.88 MB of redundant assets.
2. **Cinematics Pruning**: If in-game video cinematics are postponed past V5 milestone builds, the 13 poster WebPs (and accompanying MP4/WebMs) can be safely excluded from the web bundle.
3. **Full Reference CSV**: See [R4-unused.csv](file:///Users/bao/th-v5-ag3/reports/v5/AG3/R4-unused.csv) for the exhaustive file-by-file classification.
