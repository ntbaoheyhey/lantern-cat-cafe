# Exact native screenshot baselines

`art2-flag-off.spec.ts` selects `darwin/` or `linux/` using the runner OS. It still requires exact PNG byte equality, with no pixel tolerance or ignored regions. Root-level captures remain the historical reference. Unsupported platforms fail until native captures are reviewed.

Both platforms use Playwright 1.64.1 and Chromium 156.0.8078.4, the existing fixed clock and SHA-256-pinned fonts. OS text rasterization differs, even with the same font bytes. `platform-source.json` records native captures and source hashes. The Landing CSS repair reserves the body-copy height, action line height, pill/help widths and enough proof-link space across fallback and loaded font metrics. It avoids moving adjacent labels, wrapping or clipping as fonts arrive. The delayed-font regression retains its zero-shift assertion.
