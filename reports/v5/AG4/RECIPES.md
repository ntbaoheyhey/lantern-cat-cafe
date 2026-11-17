# V5 Audio Recipes (Reproducible synthesis and cuts)

All synthesis must be deterministic and runnable via `node tools/v5audio/render.mjs` or documented ffmpeg commands.
Source materials must be synthetic (ffmpeg aevalsrc/anoisesrc/sine/filters) or cut from files documented in `apps/web/public/audio/LICENSES.json`.

## U0 Calibration Impact
- File: `audio/v5/calibration-impact.opus` / `.m4a`
- Transient: click (5-15 ms) high-pass noise / chirp
- Body: thump (60-120 ms, 60-120 Hz sine pitch drop)
- Tail: noise (200-400 ms, filtered pink/white noise with exponential decay)
- Target: integrated loudness ~ -18 LUFS, true peak <= -1.0 dBTP, file size <= 25 KB.
