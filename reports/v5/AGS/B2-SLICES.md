# B2 Audio Variant Slicing Report (CXI 08:05 REQ)

**Date**: 2026-11-17  
**CXI Request**: Derive exact variant slices under `audio/v5` for top audio packs (`b2-hits`, `b2-ui`, `b2-motion`, `b2-magic`) to eliminate monolithic preloads.  
**Total Slices Generated**: 264 variants in both WebM Opus (36 kbps mono) and AAC M4A (48 kbps mono).  
**Location**: `apps/web/public/audio/v5/b2/`  
**Manifest Updated**: `apps/web/public/audio/v5/manifest.json` (680 total registered cues)  

---

## 1. Transfer Payload Optimization & Savings

| Audio Pack | Monolithic WebM Size | Sliced Variants | Total Opus Slices Size | Avg Slice Size | Initial Load Transfer Impact |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `b2-hits` | **491.3 KB** | 113 | **166.4 KB** | 1508 B | Monolithic pack eliminated; initial battle only loads active hits (~15 KB). |
| `b2-ui` | **246.8 KB** | 97 | **64.9 KB** | 685 B | Monolithic pack eliminated; UI only fetches clicked interactions (~6 KB). |
| `b2-motion` | **166.2 KB** | 36 | **33.0 KB** | 939 B | Monolithic pack eliminated; foley motion sounds loaded on-demand (~8 KB). |
| `b2-magic` | **99.2 KB** | 18 | **24.3 KB** | 1381 B | Monolithic pack eliminated; magic charge layers loaded on-demand (~4 KB). |
| **TOTAL** | **1,003.5 KB (~1.00 MB)** | **264** | **288.6 KB** | **1119 B** | **Net Initial Preload Reduction: -970 KB (-96.6%)** |

---

## 2. CXI Manifest Loader Integration Guide

In `apps/web/src/audio/v5-manifest-loader.ts`:

1. Update the substitution regex to recognize `b2-` packs and the `/b2/` folder path:
```ts
const sample = (s: Sample): Sample => {
  if (!/^(?:v4-ranged-|cat-|callout-|b2-)/.test(s.pack)) return s;
  const d = byId.get(s.variantId ?? '');
  const next = d && (/\/(?:legacy|voice|b2)\//.test(d.opus)) && d.bus === s.bus && d.durationSeconds + .02 >= s.duration
   ? { ...s, pack: packFor(d), start: 0, gainDb: d.gainDb }
   : s;
  const set = substitutions.get(s.pack) ?? new Set<string>();
  set.add(next.pack);
  substitutions.set(s.pack, set);
  return next;
};
```

2. When the v5 audio manifest loads, all 264 variant layers seamlessly point to their individual slice files with `start: 0`, and `b2-hits.webm`, `b2-ui.webm`, `b2-motion.webm`, and `b2-magic.webm` are completely bypassed during initial page load!

---

## 3. Sample Sliced Variants (First 10)

| Variant ID | Pack | Bus | Duration | Opus File | Size |
| :--- | :---: | :---: | :---: | :--- | :---: |
| `kenney:impact-sounds:impactPunch_heavy_000:impact-sounds/impactPunch_heavy_000.flac/transient` | `b2-hits` | `sfx` | `0.120s` | `/audio/v5/b2/b2-hits-000-transient.opus` | 700 B |
| `kenney:impact-sounds:impactPunch_heavy_001:impact-sounds/impactPunch_heavy_001.flac/transient` | `b2-hits` | `sfx` | `0.120s` | `/audio/v5/b2/b2-hits-001-transient.opus` | 789 B |
| `kenney:impact-sounds:impactPunch_heavy_002:impact-sounds/impactPunch_heavy_002.flac/transient` | `b2-hits` | `sfx` | `0.120s` | `/audio/v5/b2/b2-hits-002-transient.opus` | 762 B |
| `kenney:impact-sounds:impactPunch_heavy_003:impact-sounds/impactPunch_heavy_003.flac/transient` | `b2-hits` | `sfx` | `0.120s` | `/audio/v5/b2/b2-hits-003-transient.opus` | 757 B |
| `kenney:impact-sounds:impactPunch_heavy_004:impact-sounds/impactPunch_heavy_004.flac/transient` | `b2-hits` | `sfx` | `0.120s` | `/audio/v5/b2/b2-hits-004-transient.opus` | 768 B |
| `kenney:impact-sounds:impactPunch_medium_000:impact-sounds/impactPunch_medium_000.flac/transient` | `b2-hits` | `sfx` | `0.120s` | `/audio/v5/b2/b2-hits-005-transient.opus` | 805 B |
| `kenney:impact-sounds:impactWood_heavy_000:impact-sounds/impactWood_heavy_000.flac/body` | `b2-hits` | `sfx` | `0.310s` | `/audio/v5/b2/b2-hits-006-body.opus` | 1238 B |
| `kenney:impact-sounds:impactWood_heavy_001:impact-sounds/impactWood_heavy_001.flac/body` | `b2-hits` | `sfx` | `0.310s` | `/audio/v5/b2/b2-hits-007-body.opus` | 1236 B |
| `kenney:impact-sounds:impactWood_heavy_002:impact-sounds/impactWood_heavy_002.flac/body` | `b2-hits` | `sfx` | `0.310s` | `/audio/v5/b2/b2-hits-008-body.opus` | 1311 B |
| `kenney:impact-sounds:impactWood_heavy_003:impact-sounds/impactWood_heavy_003.flac/body` | `b2-hits` | `sfx` | `0.310s` | `/audio/v5/b2/b2-hits-009-body.opus` | 1298 B |

*Complete mapping of all 264 variants available in `reports/v5/AGS/B2-SLICES-MAPPING.json`.*
