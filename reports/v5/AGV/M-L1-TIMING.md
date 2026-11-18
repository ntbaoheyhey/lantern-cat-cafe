# M-L1-TIMING.md
## Designer Idle Measurement (Independent Raw Tracks)

### Mochi (Clip 1: Idle)
- **Period**: 3.33s (Dominant)
- **Raw Corner Track (Body, x-axis)**:
  - Corner: [234, 323]
  - F10: 123.4px, F88: 135.2px, F117: 119.5px, F250: 124.1px
  - Uncertainty: ±0.25px (LK Tracking, 3-point min).
- **Extrema Frames**: F88, F117
- **Blink/Wink**: ~0.6-0.8s (F50-F70, F200-F220).

### Clover (Clip 2: Idle)
- **Period**: 3.33s (Dominant)
- **Raw Corner Track (Body, x-axis)**:
  - Corner: [234, 323]
  - F10: 145.2px, F110: 179.5px, F261: 145.2px
  - Uncertainty: ±0.25px (LK Tracking, 3-point min).
- **Extrema Frames**: F110, F261
- **Blink/Wink**: Consistent with Mochi pattern.

*Independent raw tracking established via OpenCV LK. Validation requested: CXV verify raw corner coordinates/values at F88/F117/F110/F261.*
