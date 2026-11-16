# S11 genuine explorer footage

Method review16November2026 after the first native capture diagnostic, before further capture or film assembly. This extends S10; public page access and recorded footage are separate checks.

1. [W3C MediaStream Recording](https://www.w3.org/TR/mediastream-recording/), formal working draft: a recording captures stream data; a reconstructed page or static frame is not evidence of a live explorer visit.
2. [W3C Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/), formal candidate recommendation: source tracks and media constraints belong to the capture method. Record the actual surface and dimensions.
3. [Playwright video](https://playwright.dev/docs/videos): set viewport and recording dimensions explicitly and close the context before reading the completed video.
4. [Playwright locators](https://playwright.dev/docs/locators): wait for the real rendered status and transaction fields; a successful navigation response alone does not establish the correct transaction.
5. [MDN MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder): encoded media comes from a supplied stream and must be finalized; do not infer page identity from container metadata.
6. [FFprobe](https://ffmpeg.org/ffprobe.html): count decoded frames and report stream dimensions/container duration. These validate the recording container, not the public transaction content.
7. The actual [Fuji Snowtrace transaction](https://testnet.snowtrace.io/tx/0xa23579b4b9f46e5153c6e05a6825044f3f6fef052be5eb88371d36e197087388) was read through IAB in preflight2; the text web tool could not access it on this review.

Own two-method comparison: IAB preflight2 showed Success/chain43113/block60934441/20YARN but exposed no recording capability and captured0video frames. A fresh standard Chromium recording produced a real video container, but the public server returned403 and the Success locator timed out after25seconds. The failed capture is preserved in explorer-capture-1.json and ignored work storage; it is not accepted Snowtrace footage. Do not substitute the failed page, a fabricated explorer view or a still image. Continue using supported native access/recording capabilities if available; human review and the whole submission gate remain false.
