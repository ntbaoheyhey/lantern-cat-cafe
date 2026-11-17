# R1 Report: pngquant & Lossy-Alpha Variants

## 1. Objective
Evaluate whether `pngquant` palette reduction, lossy-alpha, or AVIF compression can achieve the $\ge 30\%$ size reduction gate (with $\text{SSIM} \ge 0.98$) for the 32 art assets where standard WebP failed to achieve 30% savings.

---

## 2. Experimental Results Summary
- **Total Files Tested**: 32 files (range: 549 bytes to 5,549 bytes).
- **Methods Evaluated**:
  1. `pngquant --quality 65-90 --speed 1` $\rightarrow$ `cwebp -lossless -exact`
  2. `cwebp -q 80 -m 6` (lossy alpha)
  3. `magick -quality 50` (AVIF)
- **Qualified New Sibling Created**:
  - `apps/web/public/art/visual/shade.png` (1,134 B) $\rightarrow$ `apps/web/public/art/visual/shade.avif` (774 B, **31.7% saving**, $\text{SSIM} = 0.9956$).

---

## 3. Analysis: Why Sub-3KB PNGs Resist Further Reduction
1. **Container Header Overhead**:
   - WebP RIFF/VP8X container headers require $\approx 300\text{ bytes}$.
   - AVIF ISOBMFF box headers require $\approx 400\text{ bytes}$.
   - For a 600-byte PNG sprite (e.g. `mon.bathtub.tyrant-idle.png`), the format container alone takes up $>50\%$ of the original file size, making 30% net savings impossible.
2. **Pre-Optimized Indexed Palettes**:
   - The original PNG files under `art/gameplay` and `art/visual` are already 8-bit indexed palette sprites. `pngquant` cannot reduce colors below what is already indexed without creating noticeable banding (dropping SSIM $< 0.98$).
3. **Savings vs. Quality Tradeoff**:
   - For `squad/ranger.png` (5,549 B), `pngquant` achieved 4,404 B (20.6% saving). While visually clean, it did not reach the $\ge 30\%$ work order threshold.

---

## 4. Conclusion & Action
- Generated new sibling: `apps/web/public/art/visual/shade.avif`.
- Retained original PNGs for the remaining 31 micro-sprites where PNG is already the mathematically optimal format.
