# Sound startup follow-up
REFERENCE: apps/web/src/game/squad/turn3d/audio-startup.ts; audio.ts; summary.json; ../opening-profile; ../../b4/CHECKPOINT.md

The explicit Sound click starts silent PCM through HTML media to open the output device asynchronously, then starts the existing synthesizer. Abort and disposal cleanup have four lifecycle tests. Source checks pass with1,702 web and935 rules tests, plus2 expected failures and11 skips.

Six fresh Chromium processes cover three native and three CPU4 cases. The complete enable wait and subsequent automatic fight have MAX16.8ms in every case. AudioContext construction takes15.6–20.9ms. The click-to-enabled delay spans223.6–232.8ms. The earlier B4 window reached133.5ms and its diagnostic attributed133.6ms to first context construction.

ArtifactSHA256`3b82f45c0669aa0ebfc6220277290258d8943febe1c5692b8f865fe3b2968ec4`. No context exists before the real click. One context is created per process. Raw RAF arrays, marks and constructor timings are retained. These measurements use DPR1 and the current Mac audio device. Listening quality and other audio hardware remain unverified.
