# Lossless audio transport — v5-m1.9

Thirteen immutable JSON packages carry 544 unchanged Opus files: the nine accepted combat/UI groups plus four selected hero voice groups. The engine enables a package only when every member is already requested by its current preload. Shared voice selection keeps the builder and runtime scopes equal. Source files, AGS manifests, cue choices, offsets, gains and alternate codecs remain intact. A build guard rejects stale package bytes or indexes. SHA-256 integrity and a two-second abort protect each request; failure retries the same original Opus before the alternate codec.

Application `4ae1c9580f91b816f6860a79420faa4edab59a99`; final capture source `32814db72df8ae8821367831c91b19e2dd5d80f5`. Production index `a7a8c615c0998065c2406a1eecc4c1612aaf868d14757ac7e4f3d10736c9e3b9`. Exact URL: http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3, desktop 1280×720. [Final evidence](evidence/v7-m19-final-validation.json).

| Cold fixture | m1.8 bytes | m1.9 bytes | Total-build saving | Budget |
| --- | ---: | ---: | ---: | --- |
| wave1 | 7,696,760 | 7,667,250 | 29,510 | PASS |
| wave3 | 8,260,321 | 8,228,520 | 31,801 | FAIL by 228,520 |
| boss | 7,774,452 | 7,742,967 | 31,485 | PASS |

The build also adds spatial/native CPU optimizations, so this table does not attribute every changed byte to voice packaging. The earlier per-hero estimate was 31,237 B gross. Each transfer has zero ordinary page/console/HTTP errors. Complete responses started by readiness are counted, including visible café portraits.

Expanding requested packages exactly reproduces released m1.8's audio request sets: 485/487/484 paths, zero missing or extra. The pipeline's original self-comparison is not evidence; it was independently repeated against m1.8 into `m18-audio-path-equivalence.json`. The tool now rejects identical input paths and accepts an explicit output path so the original report is retained.

Native Chromium independently decoded all 544 entries and originals at 48 kHz: encoded SHA-256, channel/sample counts and per-channel PCM hashes match. All selected clips are mono; no source channel conversion is involved. HTTP503/integrity/decode/stall faults recover original Opus in 144/157/152/2217 ms. Fault-specific console errors are expected; normal journeys remain clean. Unpackaged playback retains synchronous scheduling, including terminal voice playback.

Full suite succeeds: 5,269 passed, 11 skipped, two expected failures; 5,282 total = 77 Node + 5,205 workspace, including 2,969 web. The voice change also passed 71 focused tests across three files before this full run. Production build/typecheck pass. Three fresh actual gameplay films have browser audio; PCM identity is not a subjective listening or frame-exact A/V claim.

[Original nine-group acceptance](evidence/v7-audio-packages.json) remains historical evidence. Raw latest data stays ignored in work/v5/CXI/audio-delivery/v7-voice-packages and transfer/v7-m19-final. I-B remains open until all three fixtures are at most 8,000,000 B.
