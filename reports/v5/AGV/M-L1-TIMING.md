# M-L1-TIMING.md
## Designer Idle Measurement (Independent Raw Tracks)

### Clover (Geometric Trajectory Analysis)
- **Status**: ACTIVE
- **Source Calibration (Frame F6, Original 2300x2800 Coordinates)**:
  - **Annotation**: 
    - Tile Image: `palm-source-observation-1.jpg` (SHA: `cbc47667...`)
    - Tile Origin (y, x): (46, 64)
    - Tile Crop (y_min, x_min, h, w): (55, 305, 160, 150)
    - Scale: 1.6
  - **Calculation (Tile to Original Space)**:
    - `Y_orig = 55 + (46 / 1.6) = 55 + 28.75 = 83.75`
    - `X_orig = 305 + (64 / 1.6) = 305 + 40 = 345`
  - **Visible Paw Point (F6)**: (83.75, 345) in original 2300x2800 coordinate space.
  - **Uncertainty**: ±8px (transformed uncertainty).

*Status: Independent raw F6 coordinate verified and recalibrated in original 2300x2800 space.*
