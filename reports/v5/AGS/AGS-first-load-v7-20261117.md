# First-Load Research (T-CXI-3)
**Findings Summary:**
- Targets: Cold-start < 5MB, TTI < 3s, FCP < 1s.
- Optimization Strategies: Code splitting, texture compression (KTX2/Basis), deferred asset loading.
- Experiment Candidates: 
  1. Brotli compression for static assets.
  2. Deferred loading for non-critical assets (Level 2+, BGM).
  3. KTX2/WebP conversion for large images.
  4. Dynamic imports for module code splitting.
- Sources: Defold Docs, CrazyGames Engineering Blog, GDC Vault.
