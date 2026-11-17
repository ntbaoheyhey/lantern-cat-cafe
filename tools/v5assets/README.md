# Taskbar Hero V5 Asset Diet Tooling (`tools/v5assets`)

Automated, deterministic, zero-dependency Node.js toolchain for image asset compression, quality gating, dead asset discovery, and deduplication.

All scripts adhere strictly to the **WRITE ONLY** invariant: they only produce new sibling `*.webp` and `*.avif` files next to existing images. Existing code and original art assets are never edited, renamed, or deleted.

---

## Prerequisites

- **Node.js**: v18+ (uses native `node:fs`, `node:path`, `node:child_process`, `node:crypto`)
- **CLI Tools**:
  - `cwebp` (Google WebP encoder)
  - `magick` (ImageMagick 7+)
  - `pngquant` (palette quantizer)

Verify availability:
```bash
which node cwebp magick pngquant
```

---

## Tool Reference & Reproduction Commands

### 1. Asset Inventory (`inventory.mjs`)
Scans all 5 target public folders (`apps/web/public/{units,art,ui-art2,relics,cinematics}`), extracts byte counts, pixel dimensions, and alpha presence via ImageMagick, and sorts by file size.

```bash
node tools/v5assets/inventory.mjs
# Outputs:
#   reports/v5/AG3/inventory.csv
#   Top 25 summary printed to stdout
```

---

### 2. Rig Pages, Depth Maps & Art Batch Conversion (`convert.mjs`)
Batch converts input PNGs to sibling WebPs.
- **Rig Pages (`rig-page-0.png`)**: Encoded with `-q 90 -alpha_q 100 -exact -sharp_yuv` maintaining exact original dimensions for Spine UV integrity. Quality gate: SSIM $\ge 0.985$.
- **Depth Maps (`rig-depth.png`)**: Produces full-size `rig-depth.webp` and half-scale `rig-depth.half.webp` (`-resize 50% -q 80`) saving up to 96%.
- **Art Assets**: Encodes with `-q 90`, falling back to `cwebp -lossless -exact` if lossy causes size expansion on small indexed sprites.
- **Rule**: Skips any file where savings are $< 30\%$.

```bash
# Example: convert rig assets in background
nohup nice -n 15 node tools/v5assets/convert.mjs rig > work/v5/AG3/jobs/a1-rig.log 2>&1 &

# Example: convert art assets in background
nohup nice -n 15 node tools/v5assets/convert.mjs art work/v5/AG3/a2-top80.txt > work/v5/AG3/jobs/a2-art.log 2>&1 &
# Outputs:
#   reports/v5/AG3/A1-report.csv
#   reports/v5/AG3/A2-report.csv
#   Appends new sibling paths to work/v5/AG3/new-files.txt
```

---

### 3. Top-40 AVIF Generation (`convert-avif.mjs`)
Extracts the top 40 heaviest images from inventory, converts to sibling `.avif` using `magick -quality 60`, validates against SSIM $\ge 0.980$, and benchmarks against WebP.

```bash
node tools/v5assets/convert-avif.mjs
# Outputs:
#   reports/v5/AG3/R2-report.csv
#   reports/v5/AG3/R2-report.md
#   40 sibling *.avif files under apps/web/public/units/
```

---

### 4. Distant-Enemy 0.75x Downsampling (`convert-075x.mjs`)
Evaluates 0.75x scaled WebP variants for all 13 enemy units across Chapters 1-3. Generates `rig-page-0.75x.webp` only for units passing display-viewport SSIM $\ge 0.980$ (256x256 rear, 384x384 front).

```bash
node tools/v5assets/convert-075x.mjs
# Outputs:
#   reports/v5/AG3/R3-report.csv
#   reports/v5/AG3/R3-report.md
#   reports/v5/AG3/R3-montage.jpg
#   4 sibling rig-page-0.75x.webp files
```

---

### 5. Dead / Unused Asset Discovery (`find-unused.mjs`)
Cross-references every image in `reports/v5/AG3/inventory.csv` against 1,200+ source files and manifests in `apps/web/src/` and `apps/web/public/**/*.json`. Identifies unreferenced files and computes potential payload savings for CXI.

```bash
node tools/v5assets/find-unused.mjs
# Outputs:
#   reports/v5/AG3/R4-unused.csv
#   reports/v5/AG3/R4-unused.md
```

---

### 6. Hash Collision & Near-Duplicate Analysis (`find-duplicates.mjs`)
Performs SHA-256 hash grouping to detect bit-for-bit clones, and parallel multi-core SSIM analysis across matching dimension groups to find near-duplicates ($\text{SSIM} \ge 0.995$).

```bash
node tools/v5assets/find-duplicates.mjs
# Outputs:
#   reports/v5/AG3/R5-duplicates.csv
#   reports/v5/AG3/R5-duplicates.md
```

---

### 7. Landing & First-Screen (LCP) Diet (`optimize-landing.mjs`)
Optimizes the critical initial screen payload (Entrance keyart `landing.webp`, hero crew portraits, and scene backdrops) to AVIF with display-scale SSIM verification.

```bash
node tools/v5assets/optimize-landing.mjs
# Outputs:
#   reports/v5/AG3/R6-lcp.csv
#   reports/v5/AG3/R6-lcp.md
#   reports/v5/AG3/R6-montage.jpg
```

---

### 8. In-Game Battle Frame Composite Spot-Check (`spot-check-composite.mjs`)
Composites 10 representative WebP/AVIF siblings over the live `#171326` battle stage background at native runtime scale. Verifies zero alpha fringing, halos, or color drift.

```bash
node tools/v5assets/spot-check-composite.mjs
# Outputs:
#   reports/v5/AG3/R8-spotcheck.md
#   reports/v5/AG3/R8-spotcheck-montage.jpg
```

---

## Checkpoint & Delivery Workflow

```bash
# 1. Track newly created sibling files
cat work/v5/AG3/new-files.txt

# 2. Stage only owned paths
git add -- tools/v5assets reports/v5/AG3 $(cat work/v5/AG3/new-files.txt)

# 3. Commit and push
git commit -m "v5 AG3 <card> <step>"
git push -u origin ag/v5-assets-2026-11-17

# 4. Notify CXI via mailbox
echo "$TS FROM AG3 TO CXI | READY | <summary> | <branch>@<sha> <report-path>" >> /Users/bao/taskbar-hero-mailbox/DELIVERIES.md
echo "$TS FROM AG3 TO CXI | INFO | <details> | <branch>@<sha> <csv-path>" >> /Users/bao/taskbar-hero-mailbox/INBOX-CXI.md
```
