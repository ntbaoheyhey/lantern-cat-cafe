# M-L1-TIMING.md
## Designer Idle Measurement (Independent Raw Tracks)

### Clover (Geometric Trajectory Analysis)
- **Status**: ACTIVE
- **Semantic Boundary Audit (Frame F6)**:
  - **Audit Source**: `palm-observations.json` (SHA: `dcc06d16...`)
  - **F6 Audit Results**:
    - `thumbAndDigitsVisible`: True
    - `cuffVisible`: True
    - `wristPalmTransition`: "Smooth shading and contour, without an independently identifiable wrist boundary"
    - `palmCoreExtents`: `null` (Audit Gate: "UNRESOLVED: cuff edge is visible but is not the wrist")
    - `geometricCenter`: `null`
    - `uncertaintyBoundSourcePxPerAxis`: 6px

- **Note**: Per semantic audit, an independently identifiable palm core/wrist center does not exist for F6. The requested silhouette geometry (cuff-bounded paw) is trackable as a boundary, but not as a central coordinate.

*Status: Independent audit result for F6 (boundary=traceable, palm-core=null) delivered.*
