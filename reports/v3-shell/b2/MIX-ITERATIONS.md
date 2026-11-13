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
