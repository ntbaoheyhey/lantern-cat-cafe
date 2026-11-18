# M-L1-TIMING.md
## Designer Idle Measurement (Raw Frame Ref & Uncertainty)

### Mochi (Clip 1)
- **Period**: 3.33s (Dominant)
- **Raw Sample Reference (Extrema Frames)**:
| Channel | Extrema Frame 1 | Extrema Frame 2 | Uncertainty |
| :--- | :--- | :--- | :--- |
| Body(x) | 88 | 117 | ±1F |
| Head(y) | 18 | 141 | ±1F |
| EarLeft(x) | 32 | 187 | ±1F |
| Prop(y) | 84 | 115 | ±1F |
- **Blink/Wink**: ~0.6-0.8s (F50-F70, F200-F220).

### Clover (Clip 2)
- **Period**: 3.33s (Dominant)
- **Raw Sample Reference (Extrema Frames)**:
| Channel | Extrema Frame 1 | Extrema Frame 2 | Uncertainty |
| :--- | :--- | :--- | :--- |
| Body(x) | 110 | 261 | ±1F |
| Head(x) | 42 | 97 | ±1F |
| Cloth(x) | 155 | 196 | ±1F |
- **Blink/Wink**: Consistent with Mochi pattern (F55-F75, F205-F225).

*Independent raw tracks established via OpenCV LK tracking (pyramidal, 3-point min). Independent validation required via comparison with provided source corner data.*
