# M-L1-TIMING.md
## Designer Idle Measurement (Mochi & Clover)

### Mochi (Clip 1: Idle)
- **Period**: 3.33s (Dominant)
- **Blink/Wink**: ~0.6-0.8s every ~3.4s
- **Channels**:
  - **Body (x)**: Range 15.7px (3.6%H), Extrema F88, F117. Phase -1.48 rad.
  - **Head (y)**: Range 9.1px (2.1%H), Extrema F18, F141. Phase -2.66 rad.
  - **EarLeft (x)**: Range 61.7px, Extrema F32, F187. Phase 0.60 rad.
  - **Cloth (x)**: Range 27.3px, Extrema F264, F38. Phase -1.51 rad.
- **Tail**: REJECT (Unstable/Occluded at F90/F180).
- **Easing**: Linear interpolation inferred between extrema frames.

### Clover (Clip 2: Idle)
- **Period**: 3.33s (Dominant)
- **Channels**:
  - **Body (x)**: Range 34.3px (5.6%H), Extrema F110, F261. Phase 2.91 rad.
  - **Head (x/y)**: 53.6px / 23.2px, Extrema F97, F42. Phase -1.73 rad.
  - **EarLeft (x)**: Range 91.5px, Extrema F248, F211. Phase -1.35 rad.
  - **Cloth (x)**: Range 94.6px, Extrema F196, F155. Phase 2.95 rad.
- **Tail**: REJECT (Unstable/Occluded at F90/F180).
- **Easing**: Linear interpolation inferred between extrema frames.

*Provenance: Measurements derived from `M-V1-source-study.json` corners (LK Sequential Tracking).*
