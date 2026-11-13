# S5 mix iterations

Every row links to actual browser-output measurements. Early trials are 30-second probes, not full-duration acceptance. All have been remeasured with the same corrected analyser. Diagnostic isolated stems are excluded from the iteration count and all gates. Numeric acceptance thresholds are unchanged.

## 01-baseline

Actual app capture exposed missing battle music routing and quiet menus.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [bag](mix/01-baseline-bag.json) | 30.20 | 4.172 | 1.802 | 4.768 | 0.000 | 1.000 | -23.260 | -11.280 |
| [battle](mix/01-baseline-battle.json) | 29.85 | 3.584 | 1.243 | 5.762 | 2.010 | 1.000 | -20.400 | -5.970 |
| [boss](mix/01-baseline-boss.json) | 30.07 | 3.990 | 1.467 | 5.586 | 1.995 | 1.000 | -20.520 | -6.430 |
| [forge](mix/01-baseline-forge.json) | 30.20 | 4.172 | 1.817 | 4.834 | 0.000 | 1.000 | -23.230 | -11.150 |
| [gacha](mix/01-baseline-gacha.json) | 30.20 | 4.205 | 1.803 | 4.636 | 0.000 | 1.000 | -23.240 | -11.280 |
| [home](mix/01-baseline-home.json) | 30.20 | 4.139 | 1.632 | 6.026 | 0.000 | 1.000 | -23.070 | -11.390 |

## 02-routing-level

Routed battle/boss from visible battle state and raised mix trim; true peaks failed.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [bag](mix/02-routing-level-bag.json) | 30.20 | 4.338 | 1.695 | 5.066 | 0.000 | 1.000 | -16.060 | -4.570 |
| [battle](mix/02-routing-level-battle.json) | 30.20 | 4.371 | 1.348 | 4.438 | 3.974 | 1.000 | -13.270 | -0.150 |
| [boss](mix/02-routing-level-boss.json) | 30.20 | 3.841 | 0.991 | 5.728 | 1.987 | 1.000 | -13.190 | -0.150 |
| [forge](mix/02-routing-level-forge.json) | 30.20 | 4.173 | 1.730 | 4.736 | 0.000 | 1.000 | -16.020 | -4.690 |
| [gacha](mix/02-routing-level-gacha.json) | 30.20 | 4.173 | 1.825 | 4.570 | 0.000 | 1.000 | -16.030 | -4.430 |
| [home](mix/02-routing-level-home.json) | 30.20 | 4.172 | 1.619 | 5.728 | 0.000 | 1.000 | -15.860 | -4.180 |

## 03-headroom

Added 2 dB output headroom and a tighter compressor; levels recovered.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [battle](mix/03-headroom-battle.json) | 30.20 | 4.404 | 1.534 | 4.669 | 3.973 | 1.000 | -15.220 | -2.080 |
| [boss](mix/03-headroom-boss.json) | 30.20 | 3.841 | 1.181 | 4.934 | 3.974 | 1.000 | -15.260 | -2.150 |
| [home](mix/03-headroom-home.json) | 30.20 | 4.371 | 1.621 | 6.258 | 0.000 | 1.000 | -17.870 | -5.100 |

## 04-underscore

Authored separate original battle/boss scores; stationary-tone detector regression diagnosed independently.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [battle](mix/04-underscore-battle.json) | 30.20 | 3.344 | 1.099 | 8.476 | 3.973 | 1.000 | -15.680 | -2.230 |
| [boss](mix/04-underscore-boss.json) | 30.20 | 3.145 | 1.179 | 9.337 | 3.973 | 1.000 | -15.470 | -2.380 |

## 05-phase-history

Stopped replaying cast/travel history at impact; kept damage and status timing.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [battle](mix/05-phase-history-battle.json) | 30.20 | 3.344 | 1.248 | 8.212 | 5.960 | 1.000 | -15.870 | -1.960 |
| [boss](mix/05-phase-history-boss.json) | 30.20 | 3.345 | 1.109 | 8.014 | 0.000 | 1.000 | -15.720 | -2.250 |

## 06-scene-beds

Added licensed scene room tone and decode-safe 800 ms crossfades.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [bag](mix/06-scene-beds-bag.json) | 30.20 | 4.305 | 1.423 | 4.967 | 0.000 | 1.000 | -17.900 | -6.160 |
| [battle](mix/06-scene-beds-battle.json) | 30.20 | 3.477 | 0.952 | 6.259 | 5.961 | 1.000 | -15.670 | -1.810 |
| [boss](mix/06-scene-beds-boss.json) | 30.20 | 3.477 | 0.848 | 6.291 | 1.987 | 1.000 | -15.630 | -2.240 |
| [home](mix/06-scene-beds-home.json) | 30.20 | 4.139 | 1.672 | 5.133 | 0.000 | 1.000 | -17.880 | -5.830 |

## 07-string-texture

Added bowed-string friction and restored upper harp harmonics for a broader score.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [battle](mix/07-string-texture-battle.json) | 30.20 | 3.675 | 0.748 | 3.808 | 7.947 | 1.000 | -15.660 | -2.410 |
| [boss](mix/07-string-texture-boss.json) | 30.20 | 3.444 | 0.644 | 4.603 | 1.987 | 1.000 | -15.620 | -2.670 |

## 08-menu-voices

Added quiet hub chatter and rate-limited comments on gear inspection/enhancement.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [bag](mix/08-menu-voices-bag.json) | 60.20 | 4.136 | 1.490 | 5.232 | 0.997 | 1.000 | -17.720 | -5.980 |
| [forge](mix/08-menu-voices-forge.json) | 60.20 | 4.219 | 1.421 | 5.399 | 0.000 | 1.000 | -17.750 | -5.630 |
| [gacha](mix/08-menu-voices-gacha.json) | 60.20 | 4.236 | 1.506 | 4.900 | 0.000 | 1.000 | -17.880 | -5.780 |
| [home](mix/08-menu-voices-home.json) | 60.20 | 4.119 | 1.544 | 5.083 | 0.000 | 1.000 | -17.700 | -5.320 |

## 09-score-voice-balance

Raised the authored battle score 3 dB; fixed the encounter seed for subsequent comparisons and measured the first complete encounters.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [bag](mix/09-score-voice-balance-bag.json) | 30.20 | 4.139 | 1.472 | 5.563 | 0.000 | 1.000 | -17.620 | -3.360 |
| [battle](mix/09-score-voice-balance-battle.json) | 30.20 | 3.278 | 0.596 | 3.443 | 3.973 | 1.000 | -14.590 | -1.790 |
| [boss](mix/09-score-voice-balance-boss.json) | 30.20 | 3.344 | 0.594 | 3.377 | 0.000 | 1.000 | -14.760 | -2.310 |
| [forge](mix/09-score-voice-balance-forge.json) | 30.20 | 4.040 | 1.369 | 5.199 | 0.000 | 1.000 | -17.600 | -3.640 |
| [gacha](mix/09-score-voice-balance-gacha.json) | 30.20 | 4.139 | 1.576 | 5.100 | 0.000 | 1.000 | -17.850 | -5.860 |
| [home](mix/09-score-voice-balance-home.json) | 30.20 | 4.106 | 1.581 | 6.093 | 0.000 | 1.000 | -17.510 | -3.610 |

## 10-upper-strings

Restored upper bowed-string texture after spectral balance and isolated-stem diagnosis.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [battle](mix/10-upper-strings-battle.json) | 30.20 | 3.444 | 0.394 | 1.854 | 5.960 | 1.000 | -14.570 | -1.980 |
| [boss](mix/10-upper-strings-boss.json) | 30.20 | 3.477 | 0.371 | 1.556 | 5.960 | 1.000 | -14.700 | -2.060 |

## 11-room-tails

Smoothed the impact room tails to reduce excess short bursts. Full captures still miss transient/voice targets; source-start analysis identifies interrupted charge/release lines.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [bag](mix/11-room-tails-bag.json) | 60.20 | 4.087 | 1.431 | 5.249 | 0.000 | 1.000 | -17.680 | -3.690 |
| [battle](mix/11-room-tails-battle.json) | 180.20 | 3.396 | 0.449 | 1.781 | 2.331 | 1.000 | -14.380 | -1.770 |
| [boss](mix/11-room-tails-boss.json) | 120.20 | 3.303 | 0.441 | 1.389 | 2.995 | 1.000 | -14.630 | -1.440 |
| [forge](mix/11-room-tails-forge.json) | 60.20 | 4.136 | 1.454 | 5.100 | 0.000 | 1.000 | -17.740 | -3.500 |
| [gacha](mix/11-room-tails-gacha.json) | 60.20 | 4.136 | 1.582 | 4.851 | 0.000 | 1.000 | -17.880 | -5.700 |
| [home](mix/11-room-tails-home.json) | 60.20 | 4.086 | 1.561 | 5.166 | 0.000 | 1.000 | -17.520 | -4.060 |

## 12-solo-current

Current A battle in isolated B checkout: zero source-start interruptions in both full renders, but the battle mix masks voiced contours. Boss passes the voice band.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [battle](mix/12-solo-current-battle.json) | 180.20 | 3.257 | 0.293 | 1.554 | 0.333 | 1.000 | -14.870 | -1.790 |
| [boss](mix/12-solo-current-boss.json) | 120.20 | 3.253 | 0.376 | 1.905 | 3.993 | 1.000 | -14.710 | -2.040 |

## 13-battle-score-space

Lowering the entire battle score by6dB leaves the45s probe below voice density and loudness targets. Rejected as the final mix.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [battle](mix/13-battle-score-space-battle.json) | 45.07 | 3.528 | 0.453 | 2.618 | 1.331 | 1.000 | -16.810 | -1.620 |

## 14-speech-space

A low-shelf opening under battle speech keeps loudness, but this45s probe still misses voice density. Not acceptance evidence.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [battle](mix/14-speech-space-battle.json) | 45.20 | 3.119 | 0.383 | 1.881 | 1.327 | 1.000 | -14.850 | -2.080 |

## 15-speech-space-transitions

Schedule the speech shelf on voice-state changes only; inspect actual shelf automation alongside the45s probe. Full renders remain required.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [battle](mix/15-speech-space-transitions-battle.json) | 45.20 | 3.097 | 0.414 | 1.903 | 1.327 | 1.000 | -14.770 | -2.150 |

## 16-callout-presence

The short presence probe passes, but is not acceptance evidence. The following full capture exposes the remaining articulation weakness.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [battle](mix/16-callout-presence-battle.json) | 45.20 | 3.319 | 0.387 | 1.527 | 5.310 | 1.000 | -13.270 | -1.020 |

## 17-current-full

Full battle and boss fail contour density after the short probe passed. Source articulation, rather than more overall gain, is the next method.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [battle](mix/17-current-full-battle.json) | 180.20 | 3.158 | 0.397 | 1.454 | 2.331 | 1.000 | -13.300 | -0.980 |
| [boss](mix/17-current-full-boss.json) | 120.20 | 3.278 | 0.358 | 1.497 | 1.997 | 1.000 | -15.080 | -1.460 |

## 18-spoken-articulation

Both full voice-density bands pass, but a Mochi clarity edit breaks identity separation. Rejected; original Mochi restored.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [battle](mix/18-spoken-articulation-battle.json) | 180.20 | 3.147 | 0.365 | 1.598 | 5.327 | 1.000 | -13.460 | -1.380 |
| [boss](mix/18-spoken-articulation-boss.json) | 120.20 | 3.228 | 0.430 | 1.830 | 6.489 | 1.000 | -13.870 | -1.130 |

## 19-preserved-identities

All twelve voice identities pass. Battle contours4.661/min pass; boss6.988/min exceeds6.75. Rejected as final acceptance.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [battle](mix/19-preserved-identities-battle.json) | 180.20 | 3.252 | 0.389 | 1.620 | 4.661 | 1.000 | -13.420 | -1.140 |
| [boss](mix/19-preserved-identities-boss.json) | 120.20 | 3.369 | 0.420 | 1.631 | 6.988 | 0.996 | -13.760 | -1.600 |

## 20-boss-balance

Reduce only boss voice presence from6 to4.5dB; battle stays6dB. Source takes, every required callout, timing and analyser remain unchanged.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [battle](mix/20-boss-balance-battle.json) | 180.20 | 3.241 | 0.409 | 1.620 | 3.996 | 1.000 | -13.320 | -1.380 |
| [boss](mix/20-boss-balance-boss.json) | 120.20 | 3.253 | 0.402 | 1.839 | 6.988 | 1.000 | -13.980 | -1.530 |

## 21-battle-only-presence

See the change and interpretation recorded in DECISIONS.md.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [battle](mix/21-battle-only-presence-battle.json) | 180.20 | 3.196 | 0.358 | 1.826 | 4.661 | 1.000 | -13.310 | -1.240 |
| [boss](mix/21-battle-only-presence-boss.json) | 120.20 | 3.294 | 0.376 | 1.780 | 3.494 | 1.000 | -14.890 | -1.920 |

## 22-clear-callouts

See the change and interpretation recorded in DECISIONS.md.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [bag](mix/22-clear-callouts-bag.json) | 60.20 | 4.103 | 1.393 | 5.232 | 0.997 | 1.000 | -17.870 | -3.790 |
| [battle](mix/22-clear-callouts-battle.json) | 180.02 | 3.189 | 0.378 | 1.689 | 5.999 | 1.000 | -13.290 | -1.420 |
| [boss](mix/22-clear-callouts-boss.json) | 120.20 | 3.095 | 0.339 | 1.872 | 4.493 | 1.000 | -14.880 | -1.930 |
| [forge](mix/22-clear-callouts-forge.json) | 60.20 | 4.153 | 1.416 | 5.166 | 0.000 | 1.000 | -17.990 | -4.640 |
| [gacha](mix/22-clear-callouts-gacha.json) | 60.20 | 4.103 | 1.619 | 5.316 | 0.000 | 1.000 | -18.090 | -6.260 |
| [home](mix/22-clear-callouts-home.json) | 60.20 | 4.186 | 1.520 | 5.033 | 2.990 | 1.000 | -17.860 | -4.680 |

## 23-gentle-tone

See the change and interpretation recorded in DECISIONS.md.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [battle](mix/23-gentle-tone-battle.json) | 45.20 | 3.230 | 0.425 | 2.035 | 6.637 | 1.000 | -13.580 | -1.620 |
| [boss](mix/23-gentle-tone-boss.json) | 45.20 | 3.075 | 0.381 | 1.637 | 7.965 | 1.000 | -15.170 | -2.290 |

## 24-lowpass-menu-space

See the change and interpretation recorded in DECISIONS.md.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [bag](mix/24-lowpass-menu-space-bag.json) | 60.20 | 4.119 | 1.440 | 4.884 | 1.993 | 1.000 | -17.640 | -2.540 |
| [battle](mix/24-lowpass-menu-space-battle.json) | 180.20 | 3.169 | 0.392 | 2.053 | 6.659 | 1.000 | -13.600 | -1.450 |
| [boss](mix/24-lowpass-menu-space-boss.json) | 120.20 | 3.195 | 0.349 | 1.847 | 6.489 | 1.000 | -14.970 | -2.140 |
| [forge](mix/24-lowpass-menu-space-forge.json) | 60.20 | 4.120 | 1.488 | 5.415 | 1.993 | 1.000 | -17.530 | -2.930 |
| [gacha](mix/24-lowpass-menu-space-gacha.json) | 60.20 | 4.153 | 1.652 | 4.983 | 0.000 | 1.000 | -18.080 | -4.610 |
| [home](mix/24-lowpass-menu-space-home.json) | 60.20 | 4.153 | 1.488 | 5.016 | 1.993 | 1.000 | -17.660 | -2.360 |

## 25-balanced-transients

See the change and interpretation recorded in DECISIONS.md.

| Scene | Seconds | Onsets/s | Bands/onset | Ticks/s | Contours/min | Bed fraction | LUFS | dBTP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [battle](mix/25-balanced-transients-battle.json) | 45.20 | 3.186 | 0.319 | 1.748 | 6.637 | 1.000 | -14.130 | -1.580 |
| [boss](mix/25-balanced-transients-boss.json) | 45.20 | 3.186 | 0.264 | 1.527 | 7.964 | 1.000 | -15.900 | -2.980 |
