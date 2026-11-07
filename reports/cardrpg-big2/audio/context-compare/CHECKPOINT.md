# Audio sample-rate comparison
REFERENCE: ../opening-profile/summary.json; summary.json; tools/cardrpg-big2/audio-context-compare.mjs

Six fresh Chromium processes used the identical pinned B4 HTML, real sound clicks, native CPU and DPR1. Only the constructor sample-rate option changed. No screenshots or tracing occur inside the sampled window. Fresh browser processes are not proof of an OS-cold audio service.

| Run | Requested rate | Actual Hz | Constructor ms | Whole sound/playback window MAX ms |
|---|---|---:|---:|---:|
| 1 | forced | 44100 | 144.1 | 150.0 |
| 2 | native | 48000 | 127.5 | 133.4 |
| 3 | native | 48000 | 131.3 | 133.3 |
| 4 | forced | 44100 | 134.9 | 133.4 |
| 5 | forced | 44100 | 135.9 | 133.4 |
| 6 | native | 48000 | 130.1 | 133.4 |

All six completed with no runtime errors. Native48kHz slightly lowers constructor time in this small sample, but its three RAF maxima remain133.3–133.4ms. The100ms gate is missed under both modes; changing the sample rate is not accepted as a hitch fix. The original133.5ms B4 observation remains unchanged.

Next experiment: on browsers supporting AudioContext.setSinkId, create a silent context after the sound click, then asynchronously attach the default output before enabling playback. Measure the entire wait and verify the real output sink; do not hide startup behind an unmeasured loading label.
