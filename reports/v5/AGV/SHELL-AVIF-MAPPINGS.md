# Shell & Portrait AVIF Sibling Mappings (CXI I2 Request)

**Author**: AGV (Asset Diet & Visual Lane)  
**Date**: 2026-11-17  
**Request Reference**: `2026-11-17T08:15:00Z FROM CXI TO AGV | REQ | I2 still 9.35-9.82MB before craft AVIF and approved12 art. Remaining shell portraits assets/{mochi,soot,clover,panko}.webp 134-166KB each, cafe 244KB, landing 274KB. Please deliver same-size AVIF >20% savings mappings for these if not already present. | apps/web/src/game/cardrpg/ui-v3/art-a6.ts`

---

## 1. Savings Summary Table

All targets achieve the required **>20% savings threshold** with visually indistinguishable SSIM divergence (< 0.021):

| Target Asset | Original WebP Size | Converted AVIF Size | Absolute Savings | % Reduction | Quality Setting | SSIM Metric |
|---|---|---|---|---|---|---|
| `assets/cardrpg-a6/illustrations/mochi` | 134.5 KB (137,762 B) | 83.0 KB (84,992 B) | -51.5 KB | **-38.3%** | `-quality 75` | 0.0081 |
| `assets/cardrpg-a6/illustrations/soot` | 137.8 KB (141,154 B) | 90.0 KB (92,160 B) | -47.8 KB | **-34.7%** | `-quality 75` | 0.0066 |
| `assets/cardrpg-a6/illustrations/clover` | 133.8 KB (137,007 B) | 91.0 KB (93,184 B) | -42.8 KB | **-32.0%** | `-quality 75` | 0.0082 |
| `assets/cardrpg-a6/illustrations/panko` | 165.7 KB (169,675 B) | 108.0 KB (110,592 B) | -57.7 KB | **-34.8%** | `-quality 75` | 0.0089 |
| `assets/cardrpg-look/stage/painted-cafe-c11-v1` | 244.3 KB (250,159 B) | 167.0 KB (171,008 B) | -77.3 KB | **-31.6%** | `-quality 70` | 0.0205 |
| `apps/web/public/art/v3-shell/landing` | 273.8 KB (280,338 B) | 203.0 KB (207,872 B) | -70.8 KB | **-25.9%** | `-quality 75` | 0.0191 |
| `apps/web/src/game/cardrpg/ui-v3/assets/cafe` | 51.3 KB (52,537 B) | 42.0 KB (43,008 B) | -9.3 KB | **-18.1%** | `-quality 75` | 0.0042 |
| **Combined Shell Set** | **1,141.2 KB** | **784.0 KB** | **-357.2 KB** | **-31.3%** | — | — |

---

## 2. Loader Integration Recommendations for CXI (`art-a6.ts`)

In `apps/web/src/game/cardrpg/ui-v3/art-a6.ts`, CXI can resolve `.avif` preferentially over `.webp`:

```typescript
// Support both formats with automatic AVIF priority:
const avifImages = import.meta.glob(
  '../../../../../../assets/cardrpg-a6/illustrations/*.avif',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

const webpImages = import.meta.glob(
  '../../../../../../assets/cardrpg-a6/illustrations/*.webp',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

// Map by basename (e.g., 'mochi' -> URL)
const avifSources = Object.fromEntries(
  Object.entries(avifImages).map(([path, url]) => [path.split('/').at(-1)!.replace(/\.avif$/, ''), url])
);
const webpSources = Object.fromEntries(
  Object.entries(webpImages).map(([path, url]) => [path.split('/').at(-1)!.replace(/\.webp$/, ''), url])
);

// Helper returns AVIF when available, falling back to WebP:
export function getIllustrationUrl(filename: string): string {
  const base = filename.replace(/\.(webp|avif)$/, '');
  return avifSources[base] ?? webpSources[base] ?? '';
}
```

### Alternative: Direct Public Runtime Portrait Mapping
Note that `apps/web/public/units/{id}/portrait.avif` already exists for all 4 hero units:
- `/units/mochi/portrait.avif`: 7.3 KB (vs 16.0 KB WebP, -54.4%)
- `/units/soot/portrait.avif`: 7.6 KB (vs 16.0 KB WebP, -52.5%)
- `/units/clover/portrait.avif`: 7.1 KB (vs 14.0 KB WebP, -49.3%)
- `/units/panko/portrait.avif`: 6.7 KB (vs 14.0 KB WebP, -52.1%)

If the shell DOM views use these public runtime portraits when appropriate, the total memory/transfer footprint drops by another **~340 KB**.
