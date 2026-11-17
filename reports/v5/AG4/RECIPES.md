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

## U2 Split Ranged Impacts (v4-ranged-impacts.mp3 -> audio/v5/legacy/)
- Source file: `apps/web/public/audio/v4-ranged-impacts.mp3` (3,029,184 bytes, 3.0 MB)
- License: CC0-1.0 (from `apps/web/public/audio/LICENSES.json`, inherited from Kenney audio packs)
- Command: `node tools/v5audio/render.mjs --split-ranged`
- Output directory: `apps/web/public/audio/v5/legacy/`
- Coverage: 36 selected variants (9 variants each for `ember`, `heavy`, `shadow`, `tide/ice`)
  - `ranged.ember.impact/0-0` to `2-2`
  - `ranged.heavy.impact/0-0` to `2-2`
  - `ranged.shadow.impact/0-0` to `2-2`
  - `ranged.tide.impact/0-0` to `2-2`
- Encodings:
  - Opus: WebM container, 48kHz mono, 16kbps (`-c:a libopus -b:a 16k -ac 1 -f webm`) -> 36 files, 84,139 bytes (82.2 KB)
  - M4A: AAC fallback, 48kHz mono, 32kbps (`-c:a aac -b:a 32k -ac 1`) -> 36 files, 164,155 bytes (160.3 KB)
  - Combined Total: 248,294 bytes (242.5 KB), achieving the <= 300 KB budget requirement (92% reduction from the 3 MB monolith).
- Manifest: All 36 variants mapped into `apps/web/public/audio/v5/manifest.json`.
- Mapping table: `reports/v5/AG4/U2-mapping.csv` and `reports/v5/AG4/U2-mapping.json`.

## U3 Enemy, Boss & UI Set (7 Cues)
Command: `node tools/v5audio/render.mjs --enemy-ui`
All cues synthesized deterministically with WebM Opus (48kHz mono, ~48kbps) + AAC M4A fallbacks.
Integrated loudness target: -18.0 LUFS +/- 2 LU. Measured spread: -19.5 to -17.1 LUFS (2.4 LU spread). True peak <= -2.0 dBFS.

1. `enemy.hit.light` (`enemy-hit-light`):
   - Transient: `anoisesrc=c=white:r=48000:d=0.012,highpass=f=2800,volume=0.8,afade=t=out:st=0:d=0.012`
   - Body: `aevalsrc=exprs='0.85*sin(2*PI*(160-70*(t/0.06))*t)*exp(-t/0.02)':s=48000:d=0.06` (delay 6ms)
   - Tail: `anoisesrc=c=pink:r=48000:d=0.18,lowpass=f=800,volume=0.22,afade=t=out:st=0.02:d=0.16` (delay 12ms)
   - Measured: -19.5 LUFS, peak -3.3 dBFS, size 2,837 B, dur 0.29s.

2. `enemy.hit.medium` (`enemy-hit-medium`):
   - Transient: `aevalsrc=exprs='0.9*sin(2*PI*(3600-2000*(t/0.015))*t)*exp(-t/0.003)':s=48000:d=0.015`
   - Body: `aevalsrc=exprs='0.95*sin(2*PI*(130-55*(t/0.10))*t)*exp(-t/0.035)':s=48000:d=0.10` (delay 8ms)
   - Tail: `anoisesrc=c=pink:r=48000:d=0.28,bandpass=f=600:w=400,volume=0.28,afade=t=out:st=0.03:d=0.25` (delay 15ms)
   - Measured: -18.3 LUFS, peak -2.3 dBFS, size 2,488 B, dur 0.39s.

3. `enemy.hit.heavy` (`enemy-hit-heavy`):
   - Transient: `aevalsrc=exprs='0.95*(sin(2*PI*2400*t)+0.6*sin(2*PI*4800*t))*exp(-t/0.005)':s=48000:d=0.018`
   - Body: `aevalsrc=exprs='1.0*sin(2*PI*(100-40*(t/0.18))*t)*exp(-t/0.06)':s=48000:d=0.18` (delay 10ms)
   - Tail: `anoisesrc=c=brown:r=48000:d=0.40,lowpass=f=450,volume=0.35,afade=t=out:st=0.05:d=0.35` (delay 20ms)
   - Measured: -18.5 LUFS, peak -2.3 dBFS, size 3,389 B, dur 0.53s.

4. `enemy.death.small` (`enemy-death-small`):
   - Transient: `anoisesrc=c=pink:r=48000:d=0.05,bandpass=f=1800:w=1200,afade=t=out:st=0:d=0.05,volume=0.85`
   - Body: `aevalsrc=exprs='0.85*sin(2*PI*(140-50*(t/0.14))*t)*exp(-t/0.05)':s=48000:d=0.14` (delay 15ms)
   - Tail: `anoisesrc=c=white:r=48000:d=0.50,bandpass=f=1200:w=800,afade=t=out:st=0.05:d=0.45,volume=0.30` (delay 30ms)
   - Measured: -18.2 LUFS, peak -2.0 dBFS, size 3,828 B, dur 0.66s.

5. `enemy.death.boss` (`enemy-death-boss`):
   - Transient: `aevalsrc=exprs='0.85*(sin(2*PI*2200*t)+0.6*sin(2*PI*3300*t)+0.4*sin(2*PI*5500*t))*exp(-t/0.03)':s=48000:d=0.08`
   - Body: `aevalsrc=exprs='1.0*sin(2*PI*(85-25*(t/0.35))*t)*exp(-t/0.12)':s=48000:d=0.35` (delay 30ms)
   - Tail: `anoisesrc=c=brown:r=48000:d=0.85,lowpass=f=350,volume=0.38,afade=t=out:st=0.10:d=0.75` (delay 60ms)
   - Measured: -17.7 LUFS, peak -2.0 dBFS, size 6,760 B, dur 1.16s.

6. `boss.yarn-giant.ultimate` (`boss-yarn-giant-ultimate`):
   - Anticipation: `anoisesrc=c=pink:r=48000:d=0.45,bandpass=f=900:w=600,afade=t=in:st=0:d=0.40,afade=t=out:st=0.40:d=0.05,volume=0.85`
   - Transient: `aevalsrc=exprs='0.95*sin(2*PI*(3500-2200*(t/0.02))*t)*exp(-t/0.005)':s=48000:d=0.02` (delay 450ms)
   - Body: `aevalsrc=exprs='1.0*sin(2*PI*(80-28*(t/0.30))*t)*exp(-t/0.10)':s=48000:d=0.30` (delay 450ms)
   - Tail: `anoisesrc=c=brown:r=48000:d=0.65,lowpass=f=380,volume=0.36,afade=t=out:st=0.08:d=0.57` (delay 480ms)
   - Measured: -17.1 LUFS, peak -2.3 dBFS, size 6,765 B, dur 1.19s.

7. `ui.receipt.confirmed` (`ui-receipt-confirmed`):
   - Harmonic chord cascade (G5, B5, D6, G6).
   - Transient: `aevalsrc=exprs='0.7*(0.9*sin(2*PI*783.99*t)+0.8*sin(2*PI*987.77*t)+0.7*sin(2*PI*1174.66*t)+0.6*sin(2*PI*1567.98*t))*exp(-t/0.22)':s=48000:d=0.78`
   - Body: `aevalsrc=exprs='0.5*sin(2*PI*392*t)*exp(-t/0.25)':s=48000:d=0.60` (delay 10ms)
   - Tail: `anoisesrc=c=pink:r=48000:d=0.70,bandpass=f=3200:w=1200,volume=0.18,afade=t=out:st=0.05:d=0.65` (delay 20ms)
   - Measured: -17.7 LUFS, peak -2.1 dBFS, size 8,145 B, dur 0.81s.

## R1: Variations (2 takes per frequent cue, pitch +/-3% and layer micro-adjustments)
Synthesis source: tools/v5audio/render.mjs (deterministic filtergraph execution via ffmpeg).
Target loudness: -18.0 LUFS +/- 2 LU. Measured spread: -20.2 to -16.5 LUFS (avg -18.2 LUFS). True peak <= -1.2 dBFS across all 20 cues.

1. `hero.mochi.basic.var1` (+3% pitch):
   - Transient: `anoisesrc=c=pink:r=48000:d=0.038,bandpass=f=1236:w=800,afade=t=out:st=0:d=0.038,volume=0.9`
   - Body: `aevalsrc=exprs='0.9*sin(2*PI*(98-41*(t/0.115))*t)*exp(-t/0.043)':s=48000:d=0.115` (delay 14ms)
   - Tail: `anoisesrc=c=brown:r=48000:d=0.24,lowpass=f=465,volume=0.32,afade=t=out:st=0.02:d=0.22` (delay 28ms)
   - Measured: -18.8 LUFS, peak -2.9 dBFS, size 2,907 B, dur 0.43s.

2. `hero.mochi.basic.var2` (-3% pitch):
   - Transient: `anoisesrc=c=pink:r=48000:d=0.042,bandpass=f=1164:w=800,afade=t=out:st=0:d=0.042,volume=0.9`
   - Body: `aevalsrc=exprs='0.9*sin(2*PI*(92-39*(t/0.125))*t)*exp(-t/0.047)':s=48000:d=0.125` (delay 16ms)
   - Tail: `anoisesrc=c=brown:r=48000:d=0.26,lowpass=f=435,volume=0.32,afade=t=out:st=0.02:d=0.24` (delay 32ms)
   - Measured: -19.3 LUFS, peak -2.3 dBFS, size 2,892 B, dur 0.44s.

3. `hero.mochi.skill.var1` (+3% pitch):
   - Transient: `anoisesrc=c=pink:r=48000:d=0.088,bandpass=f=1442:w=1000,afade=t=in:st=0:d=0.058,afade=t=out:st=0.058:d=0.03,volume=0.95`
   - Body: `aevalsrc=exprs='0.95*sin(2*PI*(113-46*(t/0.175))*t)*exp(-t/0.058)':s=48000:d=0.175` (delay 52ms)
   - Tail: `anoisesrc=c=brown:r=48000:d=0.43,lowpass=f=412,volume=0.36,afade=t=out:st=0.05:d=0.38` (delay 76ms)
   - Measured: -18.9 LUFS, peak -2.6 dBFS, size 4,107 B, dur 0.64s.

4. `hero.mochi.skill.var2` (-3% pitch):
   - Transient: `anoisesrc=c=pink:r=48000:d=0.092,bandpass=f=1358:w=1000,afade=t=in:st=0:d=0.062,afade=t=out:st=0.062:d=0.03,volume=0.95`
   - Body: `aevalsrc=exprs='0.95*sin(2*PI*(107-44*(t/0.185))*t)*exp(-t/0.062)':s=48000:d=0.185` (delay 58ms)
   - Tail: `anoisesrc=c=brown:r=48000:d=0.47,lowpass=f=388,volume=0.36,afade=t=out:st=0.05:d=0.42` (delay 84ms)
   - Measured: -18.7 LUFS, peak -1.9 dBFS, size 4,316 B, dur 0.68s.

5. `hero.soot.basic.var1` (+3% pitch):
   - Transient: `aevalsrc=exprs='0.9*sin(2*PI*(4120-1850*(t/0.008))*t)*exp(-t/0.002)':s=48000:d=0.008`
   - Body: `aevalsrc=exprs='0.92*sin(2*PI*(155-67*(t/0.078))*t)*exp(-t/0.024)':s=48000:d=0.078` (delay 5ms)
   - Tail: `anoisesrc=c=white:r=48000:d=0.23,highpass=f=2266,volume=0.28,afade=t=out:st=0.01:d=0.22` (delay 10ms)
   - Measured: -19.1 LUFS, peak -1.7 dBFS, size 2,503 B, dur 0.36s.

6. `hero.soot.basic.var2` (-3% pitch):
   - Transient: `aevalsrc=exprs='0.9*sin(2*PI*(3880-1750*(t/0.008))*t)*exp(-t/0.002)':s=48000:d=0.008`
   - Body: `aevalsrc=exprs='0.92*sin(2*PI*(145-63*(t/0.082))*t)*exp(-t/0.026)':s=48000:d=0.082` (delay 6ms)
   - Tail: `anoisesrc=c=white:r=48000:d=0.25,highpass=f=2134,volume=0.28,afade=t=out:st=0.01:d=0.24` (delay 11ms)
   - Measured: -18.2 LUFS, peak -1.6 dBFS, size 2,655 B, dur 0.38s.

7. `hero.soot.skill.var1` (+3% pitch):
   - Transient: `aevalsrc=exprs='0.95*(sin(2*PI*3914*t)+0.5*sin(2*PI*5974*t))*exp(-t/0.004)':s=48000:d=0.015`
   - Body: `aevalsrc=exprs='0.95*sin(2*PI*(144-52*(t/0.136))*t)*exp(-t/0.044)':s=48000:d=0.14` (delay 14ms)
   - Tail: `anoisesrc=c=pink:r=48000:d=0.43,bandpass=f=3300:w=1800,volume=0.34,afade=t=out:st=0.03:d=0.40` (delay 24ms)
   - Measured: -17.2 LUFS, peak -1.7 dBFS, size 3,898 B, dur 0.61s.

8. `hero.soot.skill.var2` (-3% pitch):
   - Transient: `aevalsrc=exprs='0.95*(sin(2*PI*3686*t)+0.5*sin(2*PI*5626*t))*exp(-t/0.004)':s=48000:d=0.015`
   - Body: `aevalsrc=exprs='0.95*sin(2*PI*(136-48*(t/0.144))*t)*exp(-t/0.046)':s=48000:d=0.15` (delay 16ms)
   - Tail: `anoisesrc=c=pink:r=48000:d=0.47,bandpass=f=3100:w=1800,volume=0.34,afade=t=out:st=0.03:d=0.44` (delay 26ms)
   - Measured: -17.0 LUFS, peak -2.1 dBFS, size 4,155 B, dur 0.65s.

9. `hero.clover.basic.var1` (+3% pitch):
   - Transient: `aevalsrc=exprs='0.8*(sin(2*PI*1813*t)+0.5*sin(2*PI*2719*t)+0.3*sin(2*PI*3626*t))*exp(-t/0.058)':s=48000:d=0.15`
   - Body: `aevalsrc=exprs='0.75*sin(2*PI*(216-41*(t/0.116))*t)*exp(-t/0.039)':s=48000:d=0.116` (delay 10ms)
   - Tail: `anoisesrc=c=pink:r=48000:d=0.29,bandpass=f=2266:w=1100,volume=0.25,afade=t=out:st=0.03:d=0.26` (delay 19ms)
   - Measured: -17.3 LUFS, peak -1.2 dBFS, size 2,499 B, dur 0.44s.

10. `hero.clover.basic.var2` (-3% pitch):
    - Transient: `aevalsrc=exprs='0.8*(sin(2*PI*1707*t)+0.5*sin(2*PI*2561*t)+0.3*sin(2*PI*3414*t))*exp(-t/0.062)':s=48000:d=0.15`
    - Body: `aevalsrc=exprs='0.75*sin(2*PI*(204-39*(t/0.124))*t)*exp(-t/0.041)':s=48000:d=0.124` (delay 11ms)
    - Tail: `anoisesrc=c=pink:r=48000:d=0.31,bandpass=f=2134:w=1100,volume=0.25,afade=t=out:st=0.03:d=0.28` (delay 21ms)
    - Measured: -17.1 LUFS, peak -1.3 dBFS, size 3,591 B, dur 0.46s.

11. `hero.clover.skill.var1` (+3% pitch):
    - Transient: `aevalsrc=exprs='0.75*(sin(2*PI*1813*t)+0.6*sin(2*PI*2283*t)+0.5*sin(2*PI*2716*t))*exp(-t/0.097)':s=48000:d=0.21`
    - Body: `aevalsrc=exprs='0.8*sin(2*PI*(165-31*(t/0.175))*t)*exp(-t/0.049)':s=48000:d=0.175` (delay 19ms)
    - Tail: `anoisesrc=c=white:r=48000:d=0.48,bandpass=f=1957:w=1300,volume=0.30,afade=t=out:st=0.04:d=0.44` (delay 34ms)
    - Measured: -16.7 LUFS, peak -2.1 dBFS, size 6,029 B, dur 0.71s.

12. `hero.clover.skill.var2` (-3% pitch):
    - Transient: `aevalsrc=exprs='0.75*(sin(2*PI*1707*t)+0.6*sin(2*PI*2150*t)+0.5*sin(2*PI*2558*t))*exp(-t/0.103)':s=48000:d=0.23`
    - Body: `aevalsrc=exprs='0.8*sin(2*PI*(155-29*(t/0.185))*t)*exp(-t/0.051)':s=48000:d=0.185` (delay 21ms)
    - Tail: `anoisesrc=c=white:r=48000:d=0.52,bandpass=f=1843:w=1300,volume=0.30,afade=t=out:st=0.04:d=0.48` (delay 36ms)
    - Measured: -16.5 LUFS, peak -2.1 dBFS, size 5,948 B, dur 0.75s.

13. `hero.panko.basic.var1` (+3% pitch):
    - Transient: `anoisesrc=c=white:r=48000:d=0.014,highpass=f=3090,volume=0.75,afade=t=out:st=0:d=0.014`
    - Body: `aevalsrc=exprs='0.92*sin(2*PI*(124-62*(t/0.09))*t)*exp(-t/0.029)':s=48000:d=0.09` (delay 7ms)
    - Tail: `anoisesrc=c=pink:r=48000:d=0.24,bandpass=f=2678:w=1400,volume=0.25,afade=t=out:st=0.02:d=0.22` (delay 14ms)
    - Measured: -19.4 LUFS, peak -2.5 dBFS, size 2,237 B, dur 0.38s.

14. `hero.panko.basic.var2` (-3% pitch):
    - Transient: `anoisesrc=c=white:r=48000:d=0.016,highpass=f=2910,volume=0.75,afade=t=out:st=0:d=0.016`
    - Body: `aevalsrc=exprs='0.92*sin(2*PI*(116-58*(t/0.095))*t)*exp(-t/0.031)':s=48000:d=0.095` (delay 8ms)
    - Tail: `anoisesrc=c=pink:r=48000:d=0.25,bandpass=f=2522:w=1400,volume=0.25,afade=t=out:st=0.02:d=0.23` (delay 16ms)
    - Measured: -19.7 LUFS, peak -2.1 dBFS, size 2,448 B, dur 0.40s.

15. `hero.panko.skill.var1` (+3% pitch):
    - Transient: `aevalsrc=exprs='0.88*(sin(2*PI*2781*t)+0.5*sin(2*PI*4223*t))*exp(-t/0.008)':s=48000:d=0.019`
    - Body: `aevalsrc=exprs='0.95*sin(2*PI*(108-46*(t/0.136))*t)*exp(-t/0.044)':s=48000:d=0.145` (delay 11ms)
    - Tail: `anoisesrc=c=white:r=48000:d=0.43,bandpass=f=3090:w=2000,volume=0.32,afade=t=out:st=0.04:d=0.39` (delay 24ms)
    - Measured: -17.7 LUFS, peak -2.0 dBFS, size 3,481 B, dur 0.64s.

16. `hero.panko.skill.var2` (-3% pitch):
    - Transient: `aevalsrc=exprs='0.88*(sin(2*PI*2619*t)+0.5*sin(2*PI*3977*t))*exp(-t/0.008)':s=48000:d=0.021`
    - Body: `aevalsrc=exprs='0.95*sin(2*PI*(102-44*(t/0.144))*t)*exp(-t/0.046)':s=48000:d=0.155` (delay 13ms)
    - Tail: `anoisesrc=c=white:r=48000:d=0.47,bandpass=f=2910:w=2000,volume=0.32,afade=t=out:st=0.04:d=0.43` (delay 26ms)
    - Measured: -17.6 LUFS, peak -2.1 dBFS, size 4,458 B, dur 0.68s.

17. `enemy.hit.light.var1` (+3% pitch):
    - Transient: `anoisesrc=c=white:r=48000:d=0.011,highpass=f=2884,volume=0.7,afade=t=out:st=0:d=0.011`
    - Body: `aevalsrc=exprs='0.9*sin(2*PI*(165-72*(t/0.078))*t)*exp(-t/0.024)':s=48000:d=0.078` (delay 6ms)
    - Tail: `anoisesrc=c=pink:r=48000:d=0.20,lowpass=f=824,volume=0.25,afade=t=out:st=0.02:d=0.18` (delay 12ms)
    - Measured: -19.4 LUFS, peak -3.1 dBFS, size 3,427 B, dur 0.33s.

18. `enemy.hit.light.var2` (-3% pitch):
    - Transient: `anoisesrc=c=white:r=48000:d=0.013,highpass=f=2716,volume=0.7,afade=t=out:st=0:d=0.013`
    - Body: `aevalsrc=exprs='0.9*sin(2*PI*(155-68*(t/0.082))*t)*exp(-t/0.026)':s=48000:d=0.082` (delay 6ms)
    - Tail: `anoisesrc=c=pink:r=48000:d=0.21,lowpass=f=776,volume=0.25,afade=t=out:st=0.02:d=0.19` (delay 12ms)
    - Measured: -20.2 LUFS, peak -2.8 dBFS, size 3,369 B, dur 0.34s.

19. `enemy.hit.medium.var1` (+3% pitch):
    - Transient: `aevalsrc=exprs='0.9*sin(2*PI*(3708-2060*(t/0.015))*t)*exp(-t/0.003)':s=48000:d=0.015`
    - Body: `aevalsrc=exprs='0.95*sin(2*PI*(134-57*(t/0.097))*t)*exp(-t/0.034)':s=48000:d=0.097` (delay 7ms)
    - Tail: `anoisesrc=c=pink:r=48000:d=0.27,bandpass=f=618:w=400,volume=0.28,afade=t=out:st=0.03:d=0.24` (delay 14ms)
    - Measured: -18.1 LUFS, peak -2.0 dBFS, size 2,309 B, dur 0.38s.

20. `enemy.hit.medium.var2` (-3% pitch):
    - Transient: `aevalsrc=exprs='0.9*sin(2*PI*(3492-1940*(t/0.015))*t)*exp(-t/0.003)':s=48000:d=0.015`
    - Body: `aevalsrc=exprs='0.95*sin(2*PI*(126-53*(t/0.103))*t)*exp(-t/0.036)':s=48000:d=0.103` (delay 9ms)
    - Tail: `anoisesrc=c=pink:r=48000:d=0.29,bandpass=f=582:w=400,volume=0.28,afade=t=out:st=0.03:d=0.26` (delay 16ms)
    - Measured: -17.7 LUFS, peak -2.2 dBFS, size 2,655 B, dur 0.40s.

## U2 & CXI Revision: 144 Ranged Impact Variants (Complete Per-Element Slices)
- Source files: `apps/web/public/audio/v4-ranged-{ember,heavy,shadow,tide}.webm` (CC0-1.0 in LICENSES.json).
- Extraction tool: `tools/v5audio/cut_ranged_and_voices.mjs` using exact `sample.start` and `sample.duration` from `apps/web/public/audio/manifest.json`.
- Output: 144 `.opus` (WebM container, 48kHz mono, 48k) + 144 `.m4a` (AAC LC, 64k) in `apps/web/public/audio/v5/legacy/`.
- Element breakdown:
  1. `ember`: 36 variants (`ranged.ember.impact/0-0` to `5-5`), start 0.000s to 31.051s, durations 0.64s to 1.03s.
  2. `heavy`: 36 variants (`ranged.heavy.impact/0-0` to `5-5`), start 0.000s to 35.888s, durations 0.82s to 1.16s.
  3. `shadow`: 36 variants (`ranged.shadow.impact/0-0` to `5-5`), start 0.000s to 30.228s, durations 0.73s to 0.88s.
  4. `tide`: 36 variants (`ranged.tide.impact/0-0` to `5-5`), start 0.000s to 25.568s, durations 0.44s to 0.74s.
- Total sizes: Opus 695.4 KB, M4A 891.0 KB (Combined 1.58 MB vs original 3.0 MB monolith + 2.0 MB individual packs = 68% total saving).
- Mapping report: `reports/v5/AG4/RANGED-144-MAPPING.json` and `reports/v5/AG4/RANGED-144-REPORT.csv`.

## CXI Revision: Cat Voice Hit & Death Slices (16 Cues)
- Source files: `apps/web/public/audio/cat-{mochi,soot,clover,panko}.webm` (LICENSES.json).
- Extraction tool: `tools/v5audio/cut_ranged_and_voices.mjs` using exact `start` and `duration` offsets from `apps/web/public/audio/manifest.json`.
- Output: 16 `.opus` + 16 `.m4a` files in `apps/web/public/audio/v5/voice/`.
- Slices:
  1. `mochi`: hit 1-1 (15.98s, 1.51s), hit 1-2 (17.57s, 1.55s), death 1-1 (19.20s, 1.27s), death 1-2 (20.55s, 1.30s).
  2. `soot`: hit 1-1 (14.53s, 0.93s), hit 1-2 (15.54s, 0.95s), death 1-1 (16.57s, 1.13s), death 1-2 (17.79s, 1.16s).
  3. `clover`: hit 1-1 (15.28s, 1.59s), hit 1-2 (16.95s, 1.63s), death 1-1 (18.67s, 1.59s), death 1-2 (20.34s, 1.63s).
  4. `panko`: hit 1-1 (14.12s, 1.21s), hit 1-2 (15.41s, 1.24s), death 1-1 (16.73s, 1.45s), death 1-2 (18.26s, 1.48s).
- Total sizes: Opus 161.2 KB, M4A 181.5 KB (Replaces 919 KB whole cat voice packs for battle entry = 82% saving).
- Mapping report: `reports/v5/AG4/VOICE-CUTS-MAPPING.json` and `reports/v5/AG4/VOICE-CUTS-REPORT.csv`.

## R2: Ambience Loops (Cosy Workshop/Café and Battle Bed)
Synthesis source: tools/v5audio/render.mjs (deterministic filtergraph execution via ffmpeg).
Target loudness: -22.0 LUFS +/- 2 LU (calibrated background bed level sitting under combat SFX). Measured spread: -22.0 to -21.6 LUFS (0.4 LU spread). True peak <= -8.1 dBFS. Sizes <= 89 KB opus (well within <= 150 KB budget).

1. `ambience.workshop.cosy` (`ambience-workshop-cosy`):
   - Harmonic pad: C major pentatonic (C3 130.81Hz, G3 196.00Hz, E3 164.81Hz, C4 261.63Hz)
   - Cat purr: 28Hz sub drone with 22Hz amplitude flutter
   - Dust & crackle: pink noise lowpass 1200Hz, volume 0.12
   - Wind chime reflections: soft periodic chimes at 1046.5Hz (C6) and 1567.98Hz (G6) every 3.5s
   - Duration: 14.0s seamless loop
   - Measured: -21.6 LUFS, peak -9.0 dBFS, opus 89,007 B (86.9 KB), m4a 116,039 B (113.3 KB).

2. `ambience.battle.bed` (`ambience-battle-bed`):
   - Dramatic pad: D minor chord (D2 73.42Hz, A2 110.00Hz, D3 146.83Hz, F3 174.61Hz)
   - Heartbeat pulse: 52Hz sub pulse repeating every 1.0s (60 BPM)
   - Tension wind: brown noise lowpass 450Hz, volume 0.18
   - Metallic shimmer: white noise bandpass 2200Hz (w=600), volume 0.04
   - Duration: 12.0s seamless loop
   - Measured: -22.0 LUFS, peak -8.1 dBFS, opus 65,932 B (64.4 KB), m4a 100,166 B (97.8 KB).
