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

## U1 Hero Skill Set (12 Cues)
Command: `node tools/v5audio/render.mjs --hero-skills`
All cues synthesized deterministically with WebM Opus (48kHz mono, ~48kbps) + AAC M4A fallbacks.
Integrated loudness target: -18.0 LUFS +/- 2 LU. Measured spread: -19.2 to -16.7 LUFS (2.5 LU spread). True peak <= -1.4 dBFS.

1. `hero.mochi.basic` (`hero-mochi-basic`):
   - Character motif: Soft cloth whoosh + plush thud.
   - Transient: `anoisesrc=c=pink:r=48000:d=0.04,bandpass=f=1200:w=800,afade=t=out:st=0:d=0.04`
   - Body: `aevalsrc=exprs='0.9*sin(2*PI*(95-40*(t/0.12))*t)*exp(-t/0.045)':s=48000:d=0.12` (delay 15ms)
   - Tail: `anoisesrc=c=brown:r=48000:d=0.25,lowpass=f=450,volume=0.32,afade=t=out:st=0.02:d=0.23` (delay 30ms)
   - Measured: -19.2 LUFS, peak -2.4 dBFS, size 2,932 B, dur 0.43s.

2. `hero.mochi.skill` (`hero-mochi-skill`):
   - Transient: `anoisesrc=c=pink:r=48000:d=0.09,bandpass=f=1400:w=1000,afade=t=in:st=0:d=0.06,afade=t=out:st=0.06:d=0.03`
   - Body: `aevalsrc=exprs='0.95*sin(2*PI*(110-45*(t/0.18))*t)*exp(-t/0.06)':s=48000:d=0.18` (delay 55ms)
   - Tail: `anoisesrc=c=brown:r=48000:d=0.45,lowpass=f=400,volume=0.36,afade=t=out:st=0.05:d=0.40` (delay 80ms)
   - Measured: -18.3 LUFS, peak -2.5 dBFS, size 4,330 B, dur 0.66s.

3. `hero.mochi.ultimate` (`hero-mochi-ultimate`):
   - Transient: `anoisesrc=c=pink:r=48000:d=0.22,bandpass=f=1300:w=900,afade=t=in:st=0:d=0.18,afade=t=out:st=0.18:d=0.04`
   - Body: `aevalsrc=exprs='1.0*sin(2*PI*(92-35*(t/0.25))*t)*exp(-t/0.08)':s=48000:d=0.25` (delay 220ms)
   - Tail: `anoisesrc=c=brown:r=48000:d=0.65,lowpass=f=360,volume=0.38,afade=t=out:st=0.08:d=0.57` (delay 250ms)
   - Measured: -17.6 LUFS, peak -2.7 dBFS, size 6,230 B, dur 1.06s.

4. `hero.soot.basic` (`hero-soot-basic`):
   - Character motif: Ember click + warm flame pop.
   - Transient: `aevalsrc=exprs='0.9*sin(2*PI*(4000-1800*(t/0.008))*t)*exp(-t/0.002)':s=48000:d=0.008`
   - Body: `aevalsrc=exprs='0.92*sin(2*PI*(150-65*(t/0.08))*t)*exp(-t/0.025)':s=48000:d=0.08` (delay 5ms)
   - Tail: `anoisesrc=c=white:r=48000:d=0.24,highpass=f=2200,volume=0.28,afade=t=out:st=0.01:d=0.23` (delay 10ms)
   - Measured: -18.5 LUFS, peak -1.8 dBFS, size 2,564 B, dur 0.37s.

5. `hero.soot.skill` (`hero-soot-skill`):
   - Transient: `aevalsrc=exprs='0.95*(sin(2*PI*3800*t)+0.5*sin(2*PI*5800*t))*exp(-t/0.004)':s=48000:d=0.015`
   - Body: `aevalsrc=exprs='0.95*sin(2*PI*(140-50*(t/0.14))*t)*exp(-t/0.045)':s=48000:d=0.15` (delay 15ms)
   - Tail: `anoisesrc=c=pink:r=48000:d=0.45,bandpass=f=3200:w=1800,volume=0.34,afade=t=out:st=0.03:d=0.42` (delay 25ms)
   - Measured: -17.8 LUFS, peak -2.1 dBFS, size 4,172 B, dur 0.63s.

6. `hero.soot.ultimate` (`hero-soot-ultimate`):
   - Transient: `anoisesrc=c=white:r=48000:d=0.26,bandpass=f=2600:w=1600,afade=t=in:st=0:d=0.24,afade=t=out:st=0.24:d=0.02`
   - Body: `aevalsrc=exprs='1.0*sin(2*PI*(120-40*(t/0.25))*t)*exp(-t/0.07)':s=48000:d=0.25` (delay 240ms)
   - Tail: `anoisesrc=c=pink:r=48000:d=0.70,bandpass=f=2800:w=2000,volume=0.38,afade=t=out:st=0.05:d=0.65` (delay 270ms)
   - Measured: -18.1 LUFS, peak -2.3 dBFS, size 5,590 B, dur 1.11s.

7. `hero.clover.basic` (`hero-clover-basic`):
   - Character motif: Airy chime + leaf rustle (nature/heal).
   - Transient: `aevalsrc=exprs='0.8*(sin(2*PI*1760*t)+0.5*sin(2*PI*2640*t)+0.3*sin(2*PI*3520*t))*exp(-t/0.06)':s=48000:d=0.15`
   - Body: `aevalsrc=exprs='0.75*sin(2*PI*(210-40*(t/0.12))*t)*exp(-t/0.04)':s=48000:d=0.12` (delay 10ms)
   - Tail: `anoisesrc=c=pink:r=48000:d=0.30,bandpass=f=2200:w=1100,volume=0.25,afade=t=out:st=0.03:d=0.27` (delay 20ms)
   - Measured: -17.5 LUFS, peak -1.8 dBFS, size 3,406 B, dur 0.45s.

8. `hero.clover.skill` (`hero-clover-skill`):
   - Transient: `aevalsrc=exprs='0.75*(sin(2*PI*1760*t)+0.6*sin(2*PI*2217*t)+0.5*sin(2*PI*2637*t))*exp(-t/0.10)':s=48000:d=0.22`
   - Body: `aevalsrc=exprs='0.8*sin(2*PI*(160-30*(t/0.18))*t)*exp(-t/0.05)':s=48000:d=0.18` (delay 20ms)
   - Tail: `anoisesrc=c=white:r=48000:d=0.50,bandpass=f=1900:w=1300,volume=0.30,afade=t=out:st=0.04:d=0.46` (delay 35ms)
   - Measured: -17.6 LUFS, peak -1.6 dBFS, size 5,929 B, dur 0.73s.

9. `hero.clover.ultimate` (`hero-clover-ultimate`):
   - Transient: `aevalsrc=exprs='0.6*sin(2*PI*(880+1800*t/0.24)*t)*exp(-t/0.24)':s=48000:d=0.24`
   - Body: `aevalsrc=exprs='0.85*(sin(2*PI*1320*t)+0.6*sin(2*PI*1980*t)+0.4*sin(2*PI*2640*t))*exp(-t/0.18)':s=48000:d=0.30` (delay 220ms)
   - Tail: `anoisesrc=c=pink:r=48000:d=0.75,bandpass=f=1700:w=1400,volume=0.35,afade=t=out:st=0.06:d=0.69` (delay 250ms)
   - Measured: -16.7 LUFS, peak -4.4 dBFS, size 6,671 B, dur 1.13s.

10. `hero.panko.basic` (`hero-panko-basic`):
    - Character motif: Crunchy toast crack + butter squish.
    - Transient: `anoisesrc=c=white:r=48000:d=0.015,highpass=f=3000,volume=0.85,afade=t=out:st=0:d=0.015`
    - Body: `aevalsrc=exprs='0.92*sin(2*PI*(120-60*(t/0.09))*t)*exp(-t/0.03)':s=48000:d=0.09` (delay 8ms)
    - Tail: `anoisesrc=c=pink:r=48000:d=0.24,bandpass=f=2600:w=1400,volume=0.25,afade=t=out:st=0.02:d=0.22` (delay 15ms)
    - Measured: -18.2 LUFS, peak -1.4 dBFS, size 2,488 B, dur 0.39s.

11. `hero.panko.skill` (`hero-panko-skill`):
    - Transient: `aevalsrc=exprs='0.88*(sin(2*PI*2700*t)+0.5*sin(2*PI*4100*t))*exp(-t/0.008)':s=48000:d=0.02`
    - Body: `aevalsrc=exprs='0.95*sin(2*PI*(105-45*(t/0.14))*t)*exp(-t/0.045)':s=48000:d=0.15` (delay 12ms)
    - Tail: `anoisesrc=c=white:r=48000:d=0.45,bandpass=f=3000:w=2000,volume=0.32,afade=t=out:st=0.04:d=0.41` (delay 25ms)
    - Measured: -17.5 LUFS, peak -2.2 dBFS, size 3,579 B, dur 0.66s.

12. `hero.panko.ultimate` (`hero-panko-ultimate`):
    - Transient: `anoisesrc=c=pink:r=48000:d=0.22,bandpass=f=1700:w=1100,afade=t=in:st=0:d=0.20,afade=t=out:st=0.20:d=0.02`
    - Body: `aevalsrc=exprs='1.0*sin(2*PI*(95-30*(t/0.25))*t)*exp(-t/0.08)':s=48000:d=0.25` (delay 220ms)
    - Tail: `anoisesrc=c=pink:r=48000:d=0.75,bandpass=f=2500:w=1800,volume=0.36,afade=t=out:st=0.06:d=0.69` (delay 250ms)
    - Measured: -17.6 LUFS, peak -2.3 dBFS, size 5,520 B, dur 1.09s.
