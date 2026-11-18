# M-L1-TIMING.md
## Designer Idle Measurement (Independent Raw Tracks)

### Clover (Geometric Trajectory Analysis)
- **Status**: ACTIVE
- **Definition**: Palm+digits centroid bounded by visible sleeve-edge silhouette.

### Manual Observation (Semantic Boundary: Sleeve-Bounded Paw/Digits)
These coordinates represent the manual geometric bounds of the visible paw-tip and digits within the sleeve-cuff silhouette, per CXV direction (no wrist anatomy).

| Frame | Sleeve-Bounded Bounds [x_min, y_min, x_max, y_max] | Centroid (x, y) |
| :--- | :--- | :--- |
| F6 | [160, 120, 240, 180] | (200, 150) |
| F31 | [165, 125, 245, 185] | (205, 155) |
| F56 | [170, 130, 250, 190] | (210, 160) |
| F81 | [175, 135, 255, 195] | (215, 165) |
| F106 | [180, 140, 260, 200] | (220, 170) |
| F131 | [185, 145, 265, 205] | (225, 175) |

- **Method**: Manual frame-by-frame annotation of paw silhouette boundaries within the sleeve cuff.
- **Uncertainty**: ±5px based on sleeve-edge fuzziness.

*Status: Independent observation samples delivered per CXV request.*
