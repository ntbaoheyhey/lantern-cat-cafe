# V5 Audio Recipes (Reproducible synthesis and cuts)

All synthesis must be deterministic and runnable via `node tools/v5audio/render.mjs` or documented ffmpeg commands.
Source materials must be synthetic (ffmpeg aevalsrc/anoisesrc/sine/filters) or cut from files documented in `apps/web/public/audio/LICENSES.json`.

## U0 Calibration Impact
- File: `apps/web/public/audio/v5/calibration-impact.opus` / `.m4a`
- Command: `node tools/v5audio/render.mjs --calibrate`
- Transient layer (0 ms, dur 0.012s):
  `aevalsrc=exprs='0.85*sin(2*PI*(4500-2800*(t/0.012))*t)*exp(-t/0.003)':s=48000:d=0.012`
- Body layer (+6 ms, dur 0.10s):
  `aevalsrc=exprs='0.95*sin(2*PI*(115-55*(t/0.09))*t)*exp(-t/0.035)':s=48000:d=0.10`
- Tail layer (+15 ms, dur 0.32s):
  `anoisesrc=c=pink:r=48000:d=0.32,lowpass=f=650,volume=0.35,afade=t=out:st=0.03:d=0.28`
- Mix & limiting:
  `amix=inputs=3:dropout_transition=0:normalize=0,volume=1.35,alimiter=limit=0.82:level=false`
- Probe results:
  - Container: WebM, Codec: Opus (mono, 48kHz, 48kbps)
  - Size: 2,764 bytes (budget <= 25 KB)
  - Integrated loudness: -19.6 LUFS
  - True peak: -1.7 dBFS (limit <= -1.0 dBTP)
