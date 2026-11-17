# S11 audio latency boundary study

Read17November before any runtime edit. Current forge evidence has28.024–33.178ms device-estimated onset, baseLatency5.333ms and outputLatency32ms. These are estimates, not physical loopback. Keep33ms gate unchanged.

1. [W3C Web Audio API1.1](https://webaudio.github.io/web-audio-api/#dictdef-audiocontextoptions), formal specification: the context options request latency; actual audio processing and output clocks remain browser/device decisions.
2. [MDN AudioContext constructor](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext): omitted latencyHint defaults to interactive; a numeric value requests a maximum in seconds. Interactive already seeks low latency without glitches.
3. [MDN baseLatency](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/baseLatency): graph-to-host processing latency is separate; the browser may ignore the hint.
4. [MDN outputLatency](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/outputLatency): estimated host-to-device delay varies with the platform/output device.
5. [MDN getOutputTimestamp](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp): contextTime maps to a performanceTime estimate for output frames. Do not present it as a measured physical speaker onset.
6. [MDN currentTime](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime): advances by render quanta;128frames are2.667ms at48kHz. Audio and wall clocks have distinct origins.

Prespecified experiment: three counterbalanced fresh-context pairs, default context versus latencyHint0.001;20cached UI cues per context at120ms spacing, unchanged AudioEngine/manifest/native graph. Record actual source.start, request clock, getOutputTimestamp, sample rate, base/output latency, errors, missing cues and drift. No production edit, mix change, simulated physical measurement or gate relaxation. Select a runtime change only if repeated evidence improves onset without lost cues; otherwise retain default and document the limit. This isolates browser buffering, not battle frame scheduling or full G-AUDIO.

Result `S11/audio-context-latency-1.json`:6fresh contexts/120native sources,120distinct requests,0page errors. Default base5.333ms, measured device output32ms initially/24ms after device reconfiguration; per-context onset maxima33.386/30.617/30.714ms. Numeric hint base2.667ms/output24ms; maxima25.284/25.383/25.383ms,0/60outside33ms. The output device changed globally after the first numeric context; retain this limitation and use counterbalanced within-pair results, rather than attributing all8ms device change solely to each later context. Numeric medians remain lower in all3pairs and no cue was dropped.

Decision: request latencyHint0.001 at context creation. This is a browser hint, so other devices may ignore it. Keep the full native mixer, samples, source-admission limits, scene timing and33ms gate. Validate three real battle fixtures plus forge, errors/interruption/duck behavior, and existing engine tests before any acceptance. This is not proof of physical speaker onset or a global audio gate pass.

Real-fixture result `S5/latency-hint-1/validation.json`: wave1/wave3/boss/forge each90seconds,360.415seconds total. All estimatedonsets <=25.382ms; all four loudness/peak/LRA, source caps, duck depth/recovery and zero-error/interruption checks pass.45engine tests pass. No physical onset or30-minute-current-runtime claim; prior speech proxy7/12still fails. This supports retaining the hint while keeping G-AUDIO open.
