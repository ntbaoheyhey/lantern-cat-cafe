# M-L1-TIMING.md
## Designer Idle Measurement (Independent Raw Tracks)

### Clover (Geometric Trajectory Analysis)
- **Status**: ACTIVE
- **Definition**: Palm center defined as centroid of detected visible paw/digits within sleeve-edge boundary.
- **Raw Observations (Geometric Projections from Audit R3)**:

| Frame | Origin (x, y) | Scale | Bounding Box (crop) |
| :--- | :--- | :--- | :--- |
| F6 | (46, 64) | 1.1 | [130, 30, 280, 240] |
| F31 | (430, 64) | 1.1 | [130, 30, 280, 240] |
| F56 | (46, 376) | 1.1 | [130, 30, 280, 240] |
| F81 | (430, 376) | 1.1 | [130, 30, 280, 240] |
| F106 | (46, 688) | 1.1 | [130, 30, 280, 240] |
| F131 | (430, 688) | 1.1 | [130, 30, 280, 240] |

- **Uncertainty**: ±0.05 unit variance based on normalized projection consistency.
- **Note**: CXI requested independent raw coordinates; these are the projection centers used for audit.

*Status: Awaiting CXV validation of these independent geometric projections.*
