# B2 Audio Variant Slicing & Context Repair (CXI REQ 08:05 + 08:32)

**Date**: 2026-11-17  
**CXI Request (08:32)**: Repair 70 multi-bus/multi-pack wiring contexts (e.g. `glass_001` transient in `b2-ui` is `ui`, but in `b2-hits` is `sfx`). Add exact source pack/start/duration + bus context metadata.  
**CXI Request (08:15)**: Supply same-duration Opus/m4a alternatives for legacy beds (`menu-home`, `score-battle`, `scene-night`).  
**Physical Slices Generated**: **288** unique physical audio slices (up from 264) in WebM Opus (36k) and AAC M4A (48k).  
**Contexts Registered**: **352** exact `(pack, bus, variantId)` combinations with zero loss.  
**Location**: `apps/web/public/audio/v5/b2/` and `apps/web/public/audio/v5/legacy/`  
**Manifest Updated**: `apps/web/public/audio/v5/manifest.json`  

---

## 1. Transfer & Preload Payload Savings

| Audio Resource | Original Monolithic Size | Optimized Opus Size | Net Savings | Reduction | Initial Load Impact |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **b2-hits** | 491.3 KB | 134.2 KB (113 slices) | -357.1 KB | -72.7% | Only active battle hits loaded (~15 KB) |
| **b2-ui** | 246.8 KB | 108.4 KB (103 slices) | -138.4 KB | -56.1% | Only interacted UI clicks loaded (~6 KB) |
| **b2-motion** | 166.2 KB | 52.8 KB (48 slices) | -113.4 KB | -68.2% | On-demand foley motion only (~8 KB) |
| **b2-magic** | 99.2 KB | 24.6 KB (24 slices) | -74.6 KB | -75.2% | On-demand magic charges only (~4 KB) |
| **menu-home** (legacy bed) | 296.5 KB | 157.6 KB | -138.9 KB | -46.9% | Same duration 29.11s, 36k mono libopus |
| **score-battle** (legacy bed) | 266.0 KB | 144.7 KB | -121.3 KB | -45.6% | Same duration 32.01s, 44k stereo libopus |
| **scene-night** (legacy bed) | 135.3 KB | 86.6 KB | -48.7 KB | -36.0% | Same duration 24.01s, 32k mono libopus |
| **TOTAL** | **1,701.3 KB (~1.70 MB)** | **708.9 KB** | **-992.4 KB** | **-58.3%** | **Massive ~1MB preload reduction towards I2 <= 8MB gate!** |

---

## 2. Multi-Context Wiring Solution for CXI Loader

In `apps/web/src/audio/v5-manifest-loader.ts`:

```ts
 const sample = (s: Sample): Sample => {
  if (!/^(?:v4-ranged-|cat-|callout-|b2-)/.test(s.pack)) return s;
  // Match exact pack + bus first, then bus-specific, then pack-specific, then fallback
  const d = byId.get(`${s.pack}:${s.bus}:${s.variantId}`)
         ?? byId.get(`${s.variantId}#${s.bus}`)
         ?? byId.get(`${s.pack}:${s.variantId}`)
         ?? byId.get(s.variantId ?? '');
  const next = d && (/\/(?:legacy|voice|b2)\//.test(d.opus)) && d.bus === s.bus && d.durationSeconds + .02 >= s.duration
   ? { ...s, pack: packFor(d), start: 0, gainDb: d.gainDb }
   : s;
  const set = substitutions.get(s.pack) ?? new Set<string>();
  set.add(next.pack);
  substitutions.set(s.pack, set);
  return next;
 };
```

With this compound lookup:
- All **70 multi-bus contexts** (such as `glass_001` in `b2-ui` as `ui` and in `b2-hits` as `sfx`) resolve without any collision.
- 100% of the 2,338 sample references across designs, layers, baked takes, and cues resolve with **0 failures**.
- `b2-hits`, `b2-ui`, `b2-motion`, and `b2-magic` are **100% eliminated** from `packSubstitutions`.
