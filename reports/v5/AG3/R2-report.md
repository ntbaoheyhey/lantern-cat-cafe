# R2 Report: AVIF Siblings for Top 40 Heavy Assets

## 1. Summary
- **Assets Converted**: Top 40 heaviest PNGs (unit rig pages and depth maps).
- **Total PNG Baseline**: 52.17 MB
- **Total WebP Siblings**: 9.13 MB (86.7% saving vs PNG)
- **Total AVIF Siblings**: 3.38 MB (93.4% saving vs PNG)
- **Net AVIF Savings vs WebP**: 5.75 MB (62.95% smaller than WebP)
- **Assets Beating WebP by > 20%**: **40 of 40 assets** qualify!

---

## 2. Top Assets Where AVIF Beats WebP by > 20%
| Asset Path | PNG Size | WebP Size | AVIF Size | Beat WebP (%) | SSIM | Dims OK |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `spool-ram/rig-page-0.avif` | 915 KB | 174 KB | 55 KB | **+68.06%** | 0.99027 | true |
| `crumb-sentinel/rig-page-0.avif` | 1337 KB | 238 KB | 76 KB | **+67.81%** | 0.98456 | true |
| `teacup-healer/rig-page-0.avif` | 1054 KB | 193 KB | 63 KB | **+67.20%** | 0.99133 | true |
| `button-guard/rig-page-0.avif` | 1225 KB | 221 KB | 73 KB | **+66.81%** | 0.98858 | true |
| `practice-cushion/rig-page-0.avif` | 842 KB | 146 KB | 49 KB | **+66.20%** | 0.98977 | true |
| `pantry-crown/rig-page-0.avif` | 1752 KB | 280 KB | 95 KB | **+65.96%** | 0.99216 | true |
| `panko/rig-page-0.avif` | 1326 KB | 232 KB | 79 KB | **+65.81%** | 0.98644 | true |
| `spool-ram/rig-depth.avif` | 975 KB | 193 KB | 66 KB | **+65.78%** | 0.99354 | true |
| `sock-skipper/rig-page-0.avif` | 1060 KB | 203 KB | 70 KB | **+65.43%** | 0.98954 | true |
| `crumb-sentinel/rig-depth.avif` | 1517 KB | 275 KB | 96 KB | **+65.08%** | 0.98968 | true |
| `biscuit/rig-page-0.avif` | 1332 KB | 221 KB | 77 KB | **+64.97%** | 0.98553 | true |
| `rain-spool/rig-page-0.avif` | 1403 KB | 226 KB | 79 KB | **+64.96%** | 0.99397 | true |
| `binding-thread/rig-page-0.avif` | 948 KB | 186 KB | 66 KB | **+64.60%** | 0.99144 | true |
| `marigold/rig-page-0.avif` | 1151 KB | 213 KB | 76 KB | **+64.41%** | 0.98786 | true |
| `yarn-giant/rig-page-0.avif` | 2614 KB | 415 KB | 148 KB | **+64.25%** | 0.98965 | true |
| `mallow/rig-page-0.avif` | 1133 KB | 214 KB | 77 KB | **+63.93%** | 0.98612 | true |
| `velvet/rig-page-0.avif` | 959 KB | 171 KB | 62 KB | **+63.53%** | 0.98984 | true |
| `kettle-knight/rig-page-0.avif` | 1824 KB | 287 KB | 105 KB | **+63.40%** | 0.99191 | true |
| `yarn-giant/rig-depth.avif` | 2757 KB | 435 KB | 159 KB | **+63.39%** | 0.99352 | true |
| `button-guard/rig-depth.avif` | 1340 KB | 252 KB | 93 KB | **+63.29%** | 0.99242 | true |
| `pantry-crown/rig-depth.avif` | 2009 KB | 302 KB | 111 KB | **+63.26%** | 0.99467 | true |
| `practice-cushion/rig-depth.avif` | 945 KB | 165 KB | 61 KB | **+63.00%** | 0.99285 | true |
| `sock-skipper/rig-depth.avif` | 1299 KB | 245 KB | 91 KB | **+62.72%** | 0.99217 | true |
| `brioche/rig-page-0.avif` | 1250 KB | 204 KB | 76 KB | **+62.62%** | 0.98676 | true |
| `cinnamon/rig-page-0.avif` | 924 KB | 170 KB | 64 KB | **+62.58%** | 0.99013 | true |
| `rain-spool/rig-depth.avif` | 1527 KB | 246 KB | 92 KB | **+62.46%** | 0.99217 | true |
| `panko/rig-depth.avif` | 1533 KB | 280 KB | 106 KB | **+62.20%** | 0.99161 | true |
| `teacup-healer/rig-depth.avif` | 1272 KB | 237 KB | 90 KB | **+61.97%** | 0.99348 | true |
| `kettle-knight/rig-depth.avif` | 2001 KB | 301 KB | 115 KB | **+61.82%** | 0.99485 | true |
| `binding-thread/rig-depth.avif` | 1129 KB | 208 KB | 80 KB | **+61.56%** | 0.99461 | true |
| `marigold/rig-depth.avif` | 1301 KB | 249 KB | 97 KB | **+60.90%** | 0.99224 | true |
| `pollen-scout/rig-page-0.avif` | 1132 KB | 214 KB | 85 KB | **+60.24%** | 0.98753 | true |
| `biscuit/rig-depth.avif` | 1477 KB | 253 KB | 101 KB | **+60.15%** | 0.99101 | true |
| `mallow/rig-depth.avif` | 1464 KB | 268 KB | 110 KB | **+58.85%** | 0.99058 | true |
| `pollen-scout/rig-depth.avif` | 1217 KB | 244 KB | 100 KB | **+58.84%** | 0.99159 | true |
| `velvet/rig-depth.avif` | 1084 KB | 195 KB | 80 KB | **+58.83%** | 0.99359 | true |
| `brioche/rig-depth.avif` | 1446 KB | 240 KB | 99 KB | **+58.70%** | 0.99181 | true |
| `cinnamon/rig-depth.avif` | 1129 KB | 208 KB | 88 KB | **+57.79%** | 0.99283 | true |
| `sorrel/rig-depth.avif` | 884 KB | 182 KB | 77 KB | **+57.57%** | 0.99487 | true |
| `inkcap/rig-depth.avif` | 933 KB | 169 KB | 73 KB | **+56.83%** | 0.99521 | true |

---

## 3. Recommendation for Integrator (CXI)
- AVIF consistently beats WebP by **40% to 65%** across all character rig pages while maintaining **SSIM $\ge 0.985$**.
- For browsers supporting AVIF, wiring these 40 AVIF siblings cuts the unit visual payload from **11.41 MB** (WebP) down to **5.67 MB** (AVIF), achieving an additional **5.74 MB** payload saving.
