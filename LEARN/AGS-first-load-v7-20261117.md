# LEARN: AGS First-Load Optimization (v7)

## Summary of Findings

To optimize H5 game first-load performance and bridge the current 9.306MB cold gap, industry standards suggest strict adherence to performance budgets.

### Performance Budgets & Targets
| Metric | Ideal Target | Acceptable Limit |
| :--- | :--- | :--- |
| **Initial Download Size** | < 3 MB | < 10 MB |
| **Initial JS Bundle** | < 300 KB | < 500 KB |
| **FCP (First Contentful Paint)** | < 1.0 s | < 1.5 s |
| **TTI (Time to Interactive)** | < 2.5 s | < 5.0 s |

### Core Optimization Strategies
1.  **HTML-Based Splash Screen:** Use a lightweight, self-contained HTML/CSS loading screen. This avoids "white/black screen" while the heavy JS engine bootstraps.
2.  **Asset Sub-packing:** Only include assets required for the *very first scene* in the initial bundle. All other assets (later scenes, high-def textures, long audio) must be lazy-loaded.
3.  **Engine Stripping:** Utilize engine-specific build tools to remove unused modules (e.g., 3D physics if using 2D, unused UI components).
4.  **Network/Bundle Optimization:** Enable Brotli compression and ensure aggressive CDN caching with file-hashing (immutable names).

---

## Experiment Candidate: Reducing the 9.306MB Cold Gap

**Goal:** Reduce initial cold-load size from 9.306MB to **< 3MB**.

### Proposed Steps:
1.  **Analyze Current Bundle:** Run a bundle analysis (using Webpack/Vite analyzer plugins) to identify the top 5 largest contributors to the 9.306MB.
2.  **Implement "Skeleton" Loader:** Replace the current heavy loading script with a < 50KB HTML/CSS/Base64-image static splash screen that renders immediately.
3.  **Aggressive Asset Splitting:**
    *   Move all Level 2+ assets to a secondary, lazy-loaded bundle.
    *   Recompress all UI textures using WebP.
    *   Downmix non-spatial audio to mono/lower bitrates.
4.  **Verify & Measure:** Compare the new initial bundle size against the 3MB target. Measure FCP/TTI improvements in a throttled network environment (e.g., 3G/Slow 4G).

