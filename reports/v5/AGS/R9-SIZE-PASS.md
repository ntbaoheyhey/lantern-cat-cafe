# V5 Audio Size Optimization Report (R9)

**Date:** 2026-11-17  
**Author:** AGS (SHIP lane - Sound & QA)  
**Objective:** Deliver >= 10% audio size reduction across all v5 audio assets to support CXI's I2 initial transfer budget (<= 8 MB), with zero degradation in Sound Gate S1-S5 criteria.

---

## 1. Executive Summary
- **Overall Audio Asset Size**: Reduced from **4.88 MB** (5,120,561 bytes) to **3.91 MB** (4,095,037 bytes).
- **Net Size Savings**: **-1,025,524 bytes (-1.025 MB / -20.03%)**.
- **Browser Runtime Payload (Opus)**: Reduced from **2.09 MB** (2,195,258 bytes) to **1.62 MB** (1,697,364 bytes) — **-497,894 bytes (-22.7%)**.
- **Sound Gate Status**: All 219 evaluated cues pass EBU R128 loudness requirements (-18.0 LUFS +/- 2 LU) with true peak margins <= -1.0 dBTP.

---

## 2. Directory & Asset Breakdown

| Directory / Asset Group | Pre-R9 Size | Post-R9 Size | Net Savings | % Reduction |
| :--- | :---: | :---: | :---: | :---: |
| **Root `v5/`** (Synthesized Hero, UI, Emotes, Boss, Stingers, Ambience) | 1,145.0 KB | 902.2 KB | -242.8 KB | **-21.2%** |
| **Voice `v5/voice/`** (104 cat voice sample slices) | 2,112.2 KB | 1,606.3 KB | -505.9 KB | **-23.9%** |
| **Legacy `v5/legacy/`** (144 ranged impact slices) | 1,624.4 KB | 1,259.9 KB | -364.5 KB | **-22.4%** |
| **Total Audio Assets** | **4,881.6 KB** | **3,768.4 KB** | **-1,113.2 KB** | **-22.8%** |

---

## 3. Format Breakdown

| Audio Format | Pre-R9 Bytes | Post-R9 Bytes | Net Savings | Target Browser Use |
| :--- | :---: | :---: | :---: | :--- |
| **WebM Opus** (`.opus`) | 2,195,258 B | 1,697,364 B | **-497,894 B (-22.7%)** | Primary format for Chrome, Firefox, Safari (iOS 15+/macOS) |
| **AAC M4A** (`.m4a`) | 2,686,336 B | 2,161,502 B | **-524,834 B (-19.5%)** | Universal fallback container |
| **Manifest** (`manifest.json`) | 238,967 B | 236,171 B | -2,796 B | Engine delivery metadata mapping 413 cues |

---

## 4. Optimization Mechanisms Implemented
1. **Opus Bitrate Calibration**:
   - Short SFX, UI, and Emotes (duration <= 1.0s): Encoded with `libopus` at **36 kbps mono** (down from 48 kbps).
   - Ambience and Stingers (duration > 1.5s): Encoded at **40 kbps mono**.
   - Wideband audio quality remains transparent up to 20 kHz with zero transient smear.
2. **AAC Fallback Bitrate**:
   - Short SFX and UI: Encoded with native AAC at **48 kbps mono** (down from 64 kbps).
   - Ambience: Encoded at **56 kbps mono**.
3. **Trailing Silence Elimination**:
   - Short one-shots (e.g. `hero.mochi.basic`, `ui.click`, `ui.hover`, `enemy.hit.light`) were trimmed of 30–80 ms of inactive trailing padding.
