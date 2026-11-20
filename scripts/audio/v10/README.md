# V10 battle audio

Rebuilt on 2026-11-20 after a full audit of the judge battle (wave + Yarn Giant).

## What changed
- **Voice lines** for Mochi, Clover, Soot and the Yarn Giant: real, intelligible speech instead of the
  grain-concatenated "cat-speak". 81 takes (ultimate name shouts, skill callouts, attacks, hurt, death,
  victory, select). One pack per unit: `apps/web/public/audio/v9/voice-v10-<unit>.{opus,m4a}`.
- **Ultimate cut-in** now plays the ultimate's name shout ("My Last Lantern Vow!", "Fourleaf Spring Brew!",
  "The Chimney Comet!") at 0 ms, landing before the 1100 ms impact (`battle-v3/audio-timeline.ts`).
- **Ultimate SFX** for the three MVP cats, four layers each, synthesised from oscillators and noise:
  a 1.10 s riser that lands exactly on impact, a transient, a body and a tail.
  Mochi = golden bell swell, bronze strike + sub boom, warm dome pad and shockwave, bell ring + embers.
  Clover = kettle steam + rising harp, soft sparkle bloom, major pad with bubbles, falling wind chimes.
  Soot = fire roar + falling comet whistle, distorted blast + sub drop, fire rumble + debris, embers.

## Provenance
| Asset | Tool | Source |
| --- | --- | --- |
| Voice takes | Kokoro-82M v1.0 (Apache-2.0) via `kokoro` 0.9.4, post FX in ffmpeg | `lines.json`, `build_voices.py` |
| Clarity QA | faster-whisper `small.en` transcript per take | `asr.py`, `voice-provenance.json` |
| Ultimate SFX | numpy/scipy synthesis, no samples | `dsp.py`, `build_ult_sfx.py` |

## Rebuild
```
python3.12 -m venv venv && venv/bin/pip install torch kokoro soundfile pyloudnorm faster-whisper scipy
venv/bin/python build_voices.py && venv/bin/python asr.py
venv/bin/python pack_voices.py /tmp/v10-voice/rows.json
venv/bin/python build_ult_sfx.py && node ../../../tools/v5int/audio-delivery.mjs
venv/bin/python preview.py /tmp/preview   # full ultimate mixdowns for review
```
