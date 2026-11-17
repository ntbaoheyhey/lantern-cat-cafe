# R3 Distant-Enemy 0.75x Rig Page Report

Evaluation of 0.75x downsampled WebP variants for all 13 enemy units across Chapter 1-3 encounters.
Quality gate: SSIM >= 0.980 at display viewport resolution (rear row: 256x256, front row: 384x384).

## Summary Table

| Unit ID | Row | Original Dims | 0.75x Dims | PNG Size | WebP (1.0x) | 0.75x WebP | Saving vs 1.0x | SSIM @ Display | Status |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `sock-skipper` | rear | 1024x1024 | 768x768 | 1060.1 KB | 202.5 KB | 129.5 KB | -36.1% | **0.9742** | ❌ FAIL |
| `needle-moth` | rear | 1024x1024 | 768x768 | 583.7 KB | 117.6 KB | 75.9 KB | -35.5% | **0.9725** | ❌ FAIL |
| `teacup-healer` | rear | 1024x1024 | 768x768 | 1054.1 KB | 193.1 KB | 123.8 KB | -35.9% | **0.9711** | ❌ FAIL |
| `binding-thread` | rear | 1024x1024 | 768x768 | 947.5 KB | 185.5 KB | 118.6 KB | -36.0% | **0.9755** | ❌ FAIL |
| `pollen-scout` | rear | 1024x1024 | 768x768 | 1132.3 KB | 213.6 KB | 136.6 KB | -36.1% | **0.9707** | ❌ FAIL |
| `pantry-crown` | rear | 1536x1536 | 1152x1152 | 1752.5 KB | 279.7 KB | 179.5 KB | -35.8% | **0.9885** | ✅ PASS |
| `button-guard` | front | 1024x1024 | 768x768 | 1225.1 KB | 221.4 KB | 142.8 KB | -35.5% | **0.9783** | ❌ FAIL |
| `spool-ram` | front | 1024x1024 | 768x768 | 914.7 KB | 173.6 KB | 107.9 KB | -37.8% | **0.9758** | ❌ FAIL |
| `kettle-knight` | front | 1536x1536 | 1152x1152 | 1823.6 KB | 287.0 KB | 189.0 KB | -34.1% | **0.9799** | ❌ FAIL |
| `yarn-giant` | front | 1536x1536 | 1152x1152 | 2614.5 KB | 414.5 KB | 270.2 KB | -34.8% | **0.9805** | ✅ PASS |
| `crumb-sentinel` | front | 1024x1024 | 768x768 | 1337.3 KB | 237.6 KB | 150.2 KB | -36.8% | **0.976** | ❌ FAIL |
| `rain-spool` | front | 1536x1536 | 1152x1152 | 1402.9 KB | 226.0 KB | 148.8 KB | -34.2% | **0.982** | ✅ PASS |
| `practice-cushion` | front | 1024x1024 | 768x768 | 841.9 KB | 145.9 KB | 93.2 KB | -36.2% | **0.9823** | ✅ PASS |

## Results & Analysis

- **Passed Gate (4/13)**: `pantry-crown` (SSIM 0.9885), `yarn-giant` (SSIM 0.9805), `rain-spool` (SSIM 0.9820), `practice-cushion` (SSIM 0.9823).
- **Failed Gate (9/13)**: The other 9 units have high-frequency linework and small details that drop below SSIM 0.980 (ranging from 0.9707 to 0.9799). Under the strict quality gate, these units retain their full 1.0x WebP/AVIF siblings to prevent aliasing.
- **Additional Byte Savings**: -374.5 KB (-35.2% average reduction on the 4 qualifying sheets vs full 1.0x WebP).
- **Visual Comparison**: See [R3-montage.jpg](file:///Users/bao/th-v5-ag3/reports/v5/AG3/R3-montage.jpg) for 100% crops at display size.
