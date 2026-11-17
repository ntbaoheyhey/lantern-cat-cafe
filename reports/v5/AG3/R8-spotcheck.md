# R8 In-Game Battle Frame Composite Spot-Check Report

Empirical verification of 10 diverse WebP and AVIF sibling assets composited over the live in-game battle viewport stage background (`#171326`) at native runtime display resolution.

## Quality Gate: SSIM $\ge 0.985$

| Target Name | Sibling File | Display Dims | Original Size | Sibling Size | Saving | Composite SSIM | Result |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Yarn Giant Rig Page (WebP)** | `apps/web/public/units/yarn-giant/rig-page-0.webp` | 384x384 | 2614.5 KB | 414.5 KB | **-84.1%** | **0.99954** | ✅ PASS |
| **Pantry Crown Rig Page (AVIF)** | `apps/web/public/units/pantry-crown/rig-page-0.avif` | 384x384 | 1752.5 KB | 95.2 KB | **-94.6%** | **0.99896** | ✅ PASS |
| **Kettle Knight Depth Map (Half WebP)** | `apps/web/public/units/kettle-knight/rig-depth.half.webp` | 512x512 | 2001.2 KB | 70.5 KB | **-96.5%** | **0.99753** | ✅ PASS |
| **Rain Spool 0.75x Sibling (WebP)** | `apps/web/public/units/rain-spool/rig-page-0.75x.webp` | 384x384 | 1402.9 KB | 148.8 KB | **-89.4%** | **0.99949** | ✅ PASS |
| **Yarn Giant Depth Map (AVIF)** | `apps/web/public/units/yarn-giant/rig-depth.avif` | 512x512 | 2757.1 KB | 159.1 KB | **-94.2%** | **0.99942** | ✅ PASS |
| **Mochi Hero Portrait (WebP)** | `apps/web/public/units/mochi/portrait.avif` | 160x220 | 15.6 KB | 7.3 KB | **-53.3%** | **0.99507** | ✅ PASS |
| **Soot Hero Portrait (AVIF)** | `apps/web/public/units/soot/portrait.avif` | 160x220 | 15.9 KB | 7.6 KB | **-52.5%** | **0.9963** | ✅ PASS |
| **Landing Keyart (AVIF)** | `apps/web/public/art/v3-shell/landing.avif` | 480x270 | 267.4 KB | 203.0 KB | **-24.1%** | **0.99689** | ✅ PASS |
| **Mochi Warrior Attack (WebP)** | `apps/web/public/art/gameplay/mochi-warrior-attack.webp` | 160x160 | 1.0 KB | 0.7 KB | **-30.4%** | **1** | ✅ PASS |
| **Visual Shade Alpha (AVIF)** | `apps/web/public/art/visual/shade.avif` | 320x320 | 1.1 KB | 0.8 KB | **-31.7%** | **1** | ✅ PASS |

## Aggregate Statistics

- **Average In-Game Composite SSIM**: **0.99832** (exceeds 0.985 gate across all categories)
- **Net Payload Saving across Sample**: **-89.8%** (10.58 MB -> 1.08 MB)
- **Visual Defects**: Zero alpha fringing, edge halos, or color drift detected when composited over stage tones.

## Visual Evidence

See [R8-spotcheck-montage.jpg](file:///Users/bao/th-v5-ag3/reports/v5/AG3/R8-spotcheck-montage.jpg) for the 10-pair comparison matrix (Original vs Sibling at runtime scale).
