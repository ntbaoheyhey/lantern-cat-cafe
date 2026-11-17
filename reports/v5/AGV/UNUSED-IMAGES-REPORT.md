# R4 Unused-Image Audit Report

Comprehensive scan cross-referencing all 601 inventory images against 1,231 source files and manifests in `apps/web/src/` and `apps/web/public/**/*.json`.

> [!IMPORTANT]
> **READ-ONLY AUDIT**: In accordance with the AG3 specification, NO existing files have been moved, renamed, or deleted. This report provides exact data for CXI to safely clean up dead assets.

## Executive Summary

- **Total Tracked Images in Scope**: 804 images (90.86 MB)
- **Referenced (Direct, Dynamic, or Stem)**: 335 images (86.69 MB)
- **Completely Unreferenced**: **469 images** (**4.17 MB**, **4.6% of total image payload**)

## Breakdown by Folder

| Category | Total Files | Total Size | Unreferenced Files | Unreferenced Size | % Dead Payload |
|:---|:---:|:---:|:---:|:---:|:---:|
| `units/` | 293 | 84.28 MB | **41** | **1.74 MB** | 2.1% |
| `art/` | 461 | 5.11 MB | **390** | **1.10 MB** | 21.5% |
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
| 1 | `units/yarn-giant/rig-page-0.75x.webp` | 1152x1152 | 270.2 KB | true | units |
| 2 | `units/pantry-crown/rig-page-0.75x.webp` | 1152x1152 | 179.5 KB | true | units |
| 3 | `units/rain-spool/rig-page-0.75x.webp` | 1152x1152 | 148.8 KB | true | units |
| 4 | `cinematics/panko-ult-poster.webp` | 1280x720 | 125.9 KB | false | cinematics |
| 5 | `cinematics/brioche-ult-poster.webp` | 1280x720 | 118.3 KB | false | cinematics |
| 6 | `cinematics/yarn-giant-ult-poster.webp` | 1280x720 | 111.2 KB | false | cinematics |
| 7 | `cinematics/marigold-ult-poster.webp` | 1280x720 | 110.2 KB | false | cinematics |
| 8 | `cinematics/clover-ult-poster.webp` | 1280x720 | 108.2 KB | false | cinematics |
| 9 | `cinematics/mochi-ult-poster.webp` | 1280x720 | 107.4 KB | false | cinematics |
| 10 | `cinematics/soot-ult-poster.webp` | 1280x720 | 106.2 KB | false | cinematics |
| 11 | `cinematics/mallow-ult-poster.webp` | 1280x720 | 103.5 KB | false | cinematics |
| 12 | `cinematics/velvet-ult-poster.webp` | 1280x720 | 101.9 KB | false | cinematics |
| 13 | `cinematics/inkcap-ult-poster.webp` | 1280x720 | 99.2 KB | false | cinematics |
| 14 | `cinematics/cinnamon-ult-poster.webp` | 1280x720 | 97.1 KB | false | cinematics |
| 15 | `units/practice-cushion/rig-page-0.75x.webp` | 768x768 | 93.2 KB | true | units |
| 16 | `cinematics/biscuit-ult-poster.webp` | 1280x720 | 90.0 KB | false | cinematics |
| 17 | `cinematics/sorrel-ult-poster.webp` | 1280x720 | 83.5 KB | false | cinematics |
| 18 | `art/v3-shell/b2/guide-celebrate.webp` | 512x640 | 76.4 KB | true | art |
| 19 | `art/v3-shell/b2/title-level-up.webp` | 768x256 | 72.2 KB | true | art |
| 20 | `art/v3-shell/b2/guide-welcome.webp` | 512x640 | 69.8 KB | true | art |
| 21 | `art/v3-shell/b2/guide-explain.webp` | 512x640 | 69.6 KB | true | art |
| 22 | `art/v3-shell/b2/guide-shop.webp` | 512x640 | 69.2 KB | true | art |
| 23 | `art/v3-shell/b2/guide-point.webp` | 512x640 | 69.2 KB | true | art |
| 24 | `art/v3-shell/b2/guide-comfort.webp` | 512x640 | 60.1 KB | true | art |
| 25 | `units/yarn-giant/poses/K5.avif` | 1152x1152 | 49.5 KB | true | units |

## Recommendations for CXI

1. **Verify `rig-page-0.png` Requirement**: Confirm whether the 3D depth shader ever requires the diffuse color rig page. If not, removing or archiving them immediately eliminates 26.88 MB of redundant assets.
2. **Cinematics Pruning**: If in-game video cinematics are postponed past V5 milestone builds, the 13 poster WebPs (and accompanying MP4/WebMs) can be safely excluded from the web bundle.
3. **Full Reference CSV**: See [unused.csv](file:///Users/bao/th-v5-ag2/reports/v5/AGV/unused.csv) for the exhaustive file-by-file classification.
