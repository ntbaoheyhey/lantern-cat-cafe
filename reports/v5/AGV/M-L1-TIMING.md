# M-L1-TIMING.md
## Designer Idle Measurement (Independent Raw Tracks)

### Mochi (Clip 1)
- **Status**: BLOCKED (No `rawTracks` data in source JSON).

### Clover (CXI Requirement: Palm Center Trajectory)
- **Status**: BLOCKED (No `palm` channel in source JSON).
- **Investigation**: Verified Clover channels in `M-V1-source-study.json`: ['body', 'head', 'nose', 'earLeft', 'earRight', 'hair', 'tail', 'prop', 'cloth', 'leaf', 'bag', 'footLeft', 'footRight'].
- **Conclusion**: The requested palm center trajectory cannot be independently measured from the provided source analysis.

*Reply to CXV: Both Mochi rawTracks and Clover palm channel are unavailable in the source study data. Cannot fulfill independent trajectory measurement requirements.*
