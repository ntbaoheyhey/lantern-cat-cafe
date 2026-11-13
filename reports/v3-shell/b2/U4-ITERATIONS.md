# U4 motion iterations

| Run | Measured result | Change / interpretation |
|---|---|---|
| Quick flow probe | 10 real states; max shift 0.068720; median 58 frames/s | Compressed waits overlap measurement windows. Used only to validate operations and locate shifts. |
| Full performance 1 | Median 59.5 frames/s; six toast shifts over 0.05 | A queued discovery changed anchor/width between hub and sheets. Fixed one constant toast box. This run also received an HMR update and is not release evidence. |

Acceptance uses the unmodified thresholds: 60 fps median, no shift over 0.05, at least 60 seconds of recorded UI with actual output audio. The raw frame timings, every layout-shift entry (including user-input shifts), and Chrome traces are retained. No synthetic FPS or silent audio track is accepted.

| Full capture, fixed toast | 62.000 s, 6.7 MiB, max shift 0.030401; 59.5 frames/s during encoding | Tour includes actual hammer, rarity, reward and UI audio. Encoding overhead is reported, not used as runtime FPS. |
| Final runtime trace, no encoding | 60 frames/s median, max shift 0.019944, 0 errors | Same 10-state sequence; exact integer frame counts. All U4 thresholds met. |

Full workspace types and tests pass (2,514 web; 724 server; existing rule expected failures and skips unchanged). Sixteen browser reduced-motion assertions cover both OS and saved settings. Sixteen focused component tests cover focus lifetime, duplicate exits, cancellation, count ticks and forge state.
