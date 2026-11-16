# S5 implementation: quiet music, preserved impacts and measurable delivery

2026-11-16. RULES-SHIP is authoritative: -18 +/-2 LUFS, <=-1 dBTP, >=5 LU LRA, 4-8 dB duck, <=6 starts per 100 ms, onset +/-33 ms, 10/12 intelligible lines, primary UI <=300 ms, persisted mix. The earlier -23 proposal is superseded; no threshold is relaxed.

## Sources

1. [W3C Web Audio API 1.1](https://www.w3.org/TR/webaudio/), formal document: audio rendering uses blocks, normally 128 frames. Schedule through audio-context time; keep gameplay clocks unchanged.
2. [MDN setTargetAtTime](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime): a time constant is not a fade duration; three constants reach about 95%. Use explicit linear duck attack/release times for the measured range.
3. [MDN cancelAndHoldAtTime](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/cancelAndHoldAtTime): preserves automation value while cancelling future events, but support is limited. Retain a compatible scheduling path rather than relying on a new unsupported API.
4. [MDN AudioBufferSourceNode.start](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/start): duration refers to source-buffer seconds; rate affects audible duration. Bound primary UI output including layer offset and pitch, with a short release envelope.
5. [MDN getOutputTimestamp](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp): relate the audio-context sample clock to performance time. Separate source scheduling measurements from physical output latency claims.
6. [FFmpeg ebur128](https://ffmpeg.org/ffmpeg-filters.html#ebur128): measure integrated loudness, range and peaks on captured output. Do not normalize the measured artifact to manufacture a pass.

## Existing measured comparison

`S5/mix-probe.json`, real 60-second boss output: current -14.91 LUFS / 2.6 LU LRA / -2.23 dBTP; music -6 dB and trim -3 dB gives -19.39 / 6.1 / -4.38; music -10 dB and unchanged trim gives -16.87 / 9.5 / -2.13. All had one maximum speech source and zero page errors. These are exploratory windows, not 30-minute acceptance.

## Method before implementation

Compare unchanged current output against music -6 dB / trim -1.5 dB / 40 ms attack / 8 dB duck, aiming at the center of the frozen loudness range. Preserve every required hit layer and user bus preferences. Calibrate with internal mix gains, not writes to user volume. Measure source starts in rolling 100 ms windows, warm/cold request-to-schedule delay, short UI duration, speech-slot arbitration and persisted values independently. Run 30 minutes of actual browser output after stabilization, preserve failures, and keep G-AUDIO open for any unmeasured requirement.

The fresh comparison in `S5/center-probe/mix-probe.json` measured current -14.94 LUFS / 2.2 LU LRA / -2.23 dBTP versus quiet-center -17.95 / 5.9 / -3.07, with 144 cue records and zero errors in each 60-second window. Implement the measured calibration for battle/boss scenes, preserving menu calibration pending its separate measurement. The earlier boss log's maximum 100 ms sum of transient source layers was four; inspect real source starts across the longer session before adding admission changes.
