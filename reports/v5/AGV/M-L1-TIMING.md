# M-L1-TIMING.md
## Designer Idle Measurement (Independent Raw Tracks)

### Mochi (Clip 1: Idle)
- **Period**: 3.33s (Dominant)
- **Status**: `rawTracks` data is not available in current `M-V1-source-study.json` export.
- **Primary Evidence**: Independent OpenCV LK Corner Tracking (3-point min).
- **Channel**: Body (x-axis)
- **Sample Frames (Corner Tracking)**:
  - F88 (Extrema 1): 135.2px
  - F117 (Extrema 2): 119.5px
  - Range: 15.7px
- **Source Frame Hash (Full Corner Data)**: 4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945
- **Method Limitations**: `rawTracks` unavailable; corner data used as primary tracking evidence. Uncertainty derived from LK variance.

*Request: CXV provide `rawTracks` or verify corner coordinate samples at F88/F117.*
