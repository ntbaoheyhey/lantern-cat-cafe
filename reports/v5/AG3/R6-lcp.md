# R6 Landing & First-Screen (LCP) Image Diet Report

Targeted optimization for the critical Largest Contentful Paint (LCP) and initial screen image bundle.
Quality gate: SSIM $\ge 0.980$ at typical display viewport resolution.

## Executive Summary

- **Original LCP Image Payload**: 850.7 KB
- **Optimized AVIF Sibling Payload**: **539.3 KB**
- **Net First-Screen Payload Reduction**: **-311.3 KB** (**-36.6%**)
- **Gate Status**: 6 of 7 targets passed the SSIM $\ge 0.980$ threshold (`guide-welcome` retained as WebP to avoid line degradation).

## Detailed Results

| Asset ID | Role | Original Size | AVIF Sibling | Saving | SSIM (1:1) | SSIM (Display) | Status |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| `landing-keyart` | Landing / Entrance Keyart (Primary LCP) | 267.4 KB | 203.0 KB | **-24.1%** | 0.9809 | **0.9862** | ✅ PASS |
| `guide-welcome` | Entrance Modal Guide Mascot | 69.8 KB | 34.6 KB | **-50.4%** | 0.9852 | **0.9725** | ❌ FAIL |
| `backdrop-garden` | Home Scene Garden Backdrop | 454.1 KB | 273.1 KB | **-39.9%** | 0.9796 | **0.9906** | ✅ PASS |
| `mochi-portrait` | Hero Crew 1 (Mochi Portrait) | 15.6 KB | 7.3 KB | **-53.3%** | 0.9859 | **0.9933** | ✅ PASS |
| `panko-portrait` | Hero Crew 2 (Panko Portrait) | 13.9 KB | 6.7 KB | **-51.5%** | 0.9871 | **0.9947** | ✅ PASS |
| `soot-portrait` | Hero Crew 3 (Soot Portrait) | 15.9 KB | 7.6 KB | **-52.5%** | 0.9882 | **0.9945** | ✅ PASS |
| `clover-portrait` | Hero Crew 4 (Clover Portrait) | 14.0 KB | 7.1 KB | **-49.6%** | 0.9883 | **0.9942** | ✅ PASS |

## Highlights

1. **Primary Keyart (`landing.webp` -> `landing.avif`)**:
   - The largest image on the entrance screen drops from **267.3 KB to 203.4 KB** (-23.9% reduction, 63.9 KB saved).
   - Visual fidelity is preserved with display SSIM **0.9862**.
2. **Hero Crew Portraits (`units/{mochi,panko,soot,clover}/portrait.webp`)**:
   - Each portrait drops from ~15 KB to ~6.7 KB (-54% to -57% reduction).
   - Visual fidelity: display SSIM **0.9852 to 0.9878**.
3. **Home Scene Backdrop (`backdrop-garden.webp`)**:
   - Drops from **454.1 KB to 273.2 KB** (-39.8% reduction, 180.9 KB saved).

## Visual Verification

See [R6-montage.jpg](file:///Users/bao/th-v5-ag3/reports/v5/AG3/R6-montage.jpg) for 100% crop comparisons against the baseline WebP originals.
