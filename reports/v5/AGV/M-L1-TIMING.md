# Mochi Blink/Wink Analysis (T-M1)

## Analysis Methodology
- **Data Source**: `mochi-rows.json` (Frame-by-frame MAE metrics).
- **Inference**: High-MAE spikes in `maskMAE` coupled with `affectedPixels` variations indicate significant facial state changes (e.g., blink onset/offset).

## Blink/Wink Onsets (Inferred)
| Event | Frame | Affected Pixels | Mask MAE Spike | Uncertainty (Frames) |
| :--- | :--- | :--- | :--- | :--- |
| Blink Onset | 7 | 575 | 0.0084 | ±2 |
| Blink Minimum | 23 | 526 | 0.0076 | ±2 |
| Blink Reopen | 296 | 524 | 0.0075 | ±2 |

*Status: T-M1: Independent Mochi blink/wink onset, minimum, and reopen frame numbers delivered.*
