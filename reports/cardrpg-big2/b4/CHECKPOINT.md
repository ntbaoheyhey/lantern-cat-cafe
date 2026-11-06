# B4 · original skill audio and controls
REFERENCE: apps/web/src/game/squad/turn3d/{audio,card-audio-score}.ts; ../audio/checks.json; ../audio/opening-profile/summary.json

Each card recipe receives an element-based synth palette and seeded three-note motif, with impact noise, ultimate tails, kill and mechanics-proc cues. Mute and volume are real controls; volume is an optional browser preference, outside the game save. Context creation remains behind the explicit sound click.

## Measured audio
REFERENCE: ../audio/checks.json; ../audio/*.wav; ../audio/opening-profile

- 79 finite PCM buffers have 79 distinct SHA256 hashes. Peak0.030891, RMS0.001100–0.002662; no clipping. Seven WAV examples are retained. Waveform uniqueness does not prove perceptual identity; no listening-quality pass is claimed.
- Four real-click sound/volume/playback cases at three sizes and CPU4: volume0.35 persists, no overflow/runtime errors. First native case MAX133.5ms, others16.8ms. The audio hitch gate is **missed**.
- Focused native trace reproduces a116.7ms RAF gap during sound enable. The instrumented AudioContext constructor takes133.6ms; the subsequent CPU4 context takes1.9ms and its frame MAX is16.8ms. Constructor/trace overhead can perturb samples; the original133.5ms remains the primary observation.
- The expensive work occurs before enabling/resuming playback, inside first device-context creation. No evidence attributes this gap to per-skill synthesis. This does not prove the platform cost is unavoidable. A useful next controlled experiment is native device sample-rate initialization or loading-stage audio warmup, with its full interaction cost still measured. No unmeasured warmup fix is shipped here.
- Authored impact holds and reduced-motion mixer samples are in a later follow-up, not certified by this pinned B4 artifact.

## Cold opening samples
REFERENCE: cold/summary.json; cold/*-trace.json.gz

| Configuration | Page MAX ms | Post-interactive MAX ms | p95 ms | Errors |
|---|---:|---:|---:|---:|
| 1280×720 DPR1 CPU1 | 33.3 | 33.3 | 16.8 | 0 |
| 1280×720 DPR2 CPU1 | 33.3 | 33.3 | 16.7 | 0 |
| 1440×900 DPR1 CPU1 | 33.3 | 33.3 | 16.8 | 0 |
| 1440×900 DPR2 CPU1 | 33.4 | 33.4 | 16.7 | 0 |
| 1280×720 DPR1 CPU4 | 183.3 | 166.5 | 16.8 | 0 |
| 1280×720 DPR2 CPU4 | 133.2 | 100.0 | 16.8 | 0 |
| 2560×1440 DPR1 CPU1 | 33.3 | 33.3 | 16.8 | 0 |

Seven samples: native MAX33.4ms / CPU4 MAX183.3ms, post-interactive MAX166.5ms and CPU4 p9516.8ms. Opening and post-interactive100ms gates miss. This sample does not certify the later full-roster matrix.

## Validation and source identity
REFERENCE: ../validation/b4-kill.json; ../validation/b4-e2e.json; ../validation/pinned-source-audit.json

Typecheck/lint/build,1,692 web /935 rules tests(+2 expected failures,11 skips),581 Supabase/32 chain/24 auth/16 API-contract, and421 archived-source E2E pass. Runtime and asset bytes match archived source690a070f. Artifact SHA256`f03b6ff13472a5164874ea64285b4199bf531406c69d254553a8923f5abdd90f`.

Earlier analysis-route failures are retained in audio/initial-serving-error.log and audio/pilot-spa-route. The probe served the unrelated root Vite SPA and produced jsxDEV errors; switching its analysis endpoint to a custom app fixes the probe without changing game source. No failed run was relabelled as passing.
