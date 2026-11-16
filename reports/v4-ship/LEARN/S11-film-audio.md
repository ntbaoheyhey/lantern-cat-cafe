# S11 preparation-film audio range

Accessed 2026-11-16 UTC. Scope: the failed 152.833-second preparation edit, not R2/FINAL or runtime audio acceptance.

1. [EBU Tech 3342 (2023), formal specification](https://tech.ebu.ch/docs/tech/tech3342.pdf): LRA uses gated three-second loudness measurements and the 10th–95th percentile range. A single loud event does not establish sustained range. Keep the existing 5 LU requirement.
2. [ITU-R BS.1770](https://www.itu.int/rec/R-REC-BS.1770/en): authoritative loudness/true-peak algorithm family; the listing identifies BS.1770-5 as current. Evaluate programme loudness and peak separately from range.
3. [FFmpeg filters](https://ffmpeg.org/ffmpeg-filters.html#atrim): atrim selects source-time audio without resetting timestamps. Reset each cut before concatenation, and rebuild video with the same cuts. The concat documentation warns about mismatched stream durations.
4. [FFmpeg AAC encoder](https://ffmpeg.org/ffmpeg-codecs.html#aac): bitrate selects the encoding rate. Keep the existing 64 kbps AAC settings and measure the encoded output; metadata or pre-encode levels are insufficient.
5. [ffprobe](https://ffmpeg.org/ffprobe.html): machine-readable stream properties and frame counts support independent duration, stream and frame checks after rendering.
6. [W3C WAI captions](https://www.w3.org/WAI/media/av/captions/): captions include speech and relevant non-speech audio and must remain synchronized. Automatic transcription alone does not establish accuracy. Preserve whole spoken lines and keep human review open.

Own experiment, declared before measurement: compare the unchanged original edit with twelve additional source seconds in either the first battle or boss battle. Adjust an endpoint only to avoid clipping an already-recorded voice. Retain every action and use no speed, gain, EQ, normalization, inserted silence or replacement sound. The reasoning is that genuine sustained battle material may broaden the edited programme's loudness distribution; this is a hypothesis to measure, not an assumed improvement.

Plan: `reports/v4-ship/S11/film-audio-plan-1.json`. Harness and immutable source hashes: `tools/v4ship-lab/film/audio-edits.py` and `reports/v4-ship/S11/film-audio-comparison-1.json`. Quantified comparison and decision will be recorded after all three measurements finish, before changing the audiovisual editor.

No new screenshots or image generation. The original failed film remains preserved. Explorer recording, scheduled integrated rehearsals and human review remain required.

Measured comparison (AAC 64 kbps, unchanged gates):

| Edit | Seconds | LUFS | dBTP | LRA LU | Result |
|---|---:|---:|---:|---:|---|
| original | 152.833 | -17.27 | -1.18 | 4.8 | fail |
| longer-first-battle | 164.833 | -17.12 | -0.69 | 4.9 | fail |
| longer-boss-battle | 164.833 | -17.08 | -0.69 | 5.2 | fail |

Neither longer cut passes all gates. Stop extending excerpts. The boss version has sufficient range (5.2 LU) but needs peak headroom. A separate predeclared method applies constant −0.8 dB gain to the identical boss cut, targeting approximately −18 LUFS and adding true-peak margin. This changes film playback level only; it cannot clear runtime audio or human listening. Measure encoded output before rebuilding the video.

The separate headroom method completed before the audiovisual editor change: 164.833s, -17.87 LUFS, -2.17 dBTP, 5.2 LU LRA. All candidate audio checks pass. Proceed with the exact recorded boss cuts and −0.8 dB film attenuation, then remeasure the final MP4 and verify captions, frame provenance and AV timing. Codec output peaks must be measured; do not assume a one-to-one change from the gain setting. Evidence: `reports/v4-ship/S11/film-audio-headroom-1.json`.

Final audiovisual result: 164.833333 seconds, 9,343,307 bytes, −17.87 LUFS, −2.22 dBTP, 5.2 LU LRA; complete decode and AV timing pass, SSIM 0.974828. All 1,567 previously selected frames are unchanged; the longer cut adds 360 verified original frames. All 52 English/Vietnamese cues have identical timing; 13 complete voice events match source callouts. Delivery is byte-identical to the measured render. Evidence: `reports/v4-ship/S10/film-edit-2.json` and `film-verify-2.json`. Human listening/readability, genuine Snowtrace footage and scheduled R2/FINAL remain open. Regression preserves the same seven ART failures; no class baseline or runtime audio gate is cleared.
