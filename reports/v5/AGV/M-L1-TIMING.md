# M-L1-TIMING.md
## Designer Idle Measurement (Independent Raw Tracks)

### Mochi (Clip 1: Idle)
- **Period (Dominant)**: 3.33s
- **Blink/Wink**: ~0.6-0.8s every ~3.4s (Derived from `M-V1-source-study.json` timing study).
- **Channels (Independent Tracking)**:
  - **Body (x)**: Range 15.7px, Phase -1.48 rad, Extrema Frames [88, 117].
  - **Head (y)**: Range 9.1px, Phase -2.66 rad, Extrema Frames [18, 141].
  - **EarLeft (x)**: Range 61.7px, Phase 0.60 rad, Extrema Frames [32, 187].
  - **Prop (y)**: Range 77.7px, Phase 1.72 rad, Extrema Frames [84, 115].
- **Tail**: REJECT (Unstable/Occluded at F90/F180).
- **Uncertainty**: ±1 frame, ±0.25px (Provenanced by OpenCV LK sequence tracking).

### Clover (Clip 2: Idle)
- **Period (Dominant)**: 3.33s
- **Blink/Wink**: ~0.6-0.8s every ~3.4s (Assumed consistent with Mochi design pattern).
- **Channels (Independent Tracking)**:
  - **Body (x)**: Range 34.3px, Phase 2.91 rad, Extrema Frames [110, 261].
  - **Head (x)**: Range 53.6px, Phase -1.74 rad, Extrema Frames [42, 97].
  - **Cloth (x)**: Range 94.6px, Phase 2.95 rad, Extrema Frames [155, 196].
  - **FootLeft (x)**: Range 27.4px, Phase 2.88 rad, Extrema Frames [154, 174].
- **Tail**: REJECT (Unstable/Occluded at F90/F180).
- **Uncertainty**: ±1 frame, ±0.25px (Provenanced by OpenCV LK sequence tracking).
