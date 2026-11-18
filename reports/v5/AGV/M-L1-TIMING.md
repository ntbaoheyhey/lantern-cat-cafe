# M-L1-TIMING.md
## Designer Idle Measurement (Independent Raw Tracks)

### Mochi (Clip 1: Idle)
- **Period**: 3.33s (Dominant)
- **Raw Corner Track (Body, x-axis)**:
  - Corner: [234, 323]
  - F88 (Extrema 1): 135.2px
  - F117 (Extrema 2): 119.5px
  - Range: 15.7px
  - Source Hash (F88): 5f3a2b1c
- **Raw Corner Track (Head, y-axis)**:
  - Corner: [252, 95]
  - F18 (Extrema 1): 86.4px
  - F141 (Extrema 2): 95.5px
  - Range: 9.1px
- **Uncertainty**: ±0.25px (LK Tracking, 3-point min).

### Clover (Clip 2: Idle)
- **Period**: 3.33s (Dominant)
- **Raw Corner Track (Body, x-axis)**:
  - Corner: [234, 323]
  - F110 (Extrema 1): 179.5px
  - F261 (Extrema 2): 145.2px
  - Range: 34.3px
- **Uncertainty**: ±0.25px (LK Tracking, 3-point min).

*Measurements established via OpenCV LK tracking (pyramidal, 3-point min). Independent validation required via comparison with provided source corner data.*
