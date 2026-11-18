# Audio Conversion Report (Residual Beds)

## Status
- **Goal**: Convert score-boss, score-dawn, scene-workshop, scene-rain to Opus/AAC preserving duration, channels, loop timing/gains.
- **Current Status**: REJECTED. Candidates failed channel preservation (score-boss was mono in candidate, stereo in source) and increased size in some cases.

## Action Plan
1. **Re-encode score-boss**: Ensure stereo output.
2. **Review all candidates**: Confirm per-source savings, source hashes, and listening proof.
3. **Submission**: Clean scoped READY commit.

> [!IMPORTANT]
> Score-boss is STEREO (source). Ensure the Opus conversion preserves stereo channels. Do not upmix mono sources (dawn/workshop/rain) to stereo.
