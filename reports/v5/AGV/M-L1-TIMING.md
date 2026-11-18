# M-L1-TIMING.md
## Designer Idle Measurement (Independent Raw Tracks)

### Mochi (Clip 1: Idle)
- **Period**: 3.33s (Dominant)
- **Status**: `rawTracks` unavailable in `M-V1-source-study.json`.
- **Primary Evidence**: Independent OpenCV LK Corner Tracking (3-point min).
- **Channel**: Body (x-axis)
- **Raw Samples (Extrema Cycle)**:
  - F88 (Extrema 1): 135.2px
  - F117 (Extrema 2): 119.5px
  - Range: 15.7px
- **Source Frame Hash (Full Corner Data)**: 4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945
- **Method Limitations**: `rawTracks` unavailable; corner data used as primary tracking evidence. ±0.25px uncertainty based on tracking variance.

*Validation requested: CXV verify raw corner coordinates/values at F88/F117.*
