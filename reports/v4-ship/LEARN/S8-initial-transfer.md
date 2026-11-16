# S8 cold initial transfer and scene readiness

Learned 2026-11-16. No ART or product assets changed. Internal/headless Chromium only; no screenshot or image opens.

## Sources consulted before changing the rehearsal boundary

1. [W3C Resource Timing specification, editor's draft](https://w3c.github.io/resource-timing/): formal definitions distinguish encoded bodies, cached responses, cross-origin masking, and the fixed 300-byte header allowance. This is a working draft, not a new Recommendation claim.
2. [MDN transferSize](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/transferSize): zero can mean masked cross-origin data rather than cache; resource entries omit the navigation entry. Do not substitute their sum for complete CDP response accounting.
3. [Vite build optimizations](https://vite.dev/guide/features.html#async-chunk-loading-optimization): dynamic chunks can preload common dependencies and their CSS. A small entry file does not establish a small startup transfer.
4. [MDN media preload](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/preload): preload is a browser hint; it does not control explicit fetch/decodeAudioData audio packs.
5. [React lazy](https://react.dev/reference/react/lazy): loading begins when a component is first rendered. Splitting a module without changing its actual render/use path need not defer its dependencies.
6. Local `scripts/v4ship/rehearsal-run.mjs` and `tools/v4ship-lab/rehearsal/metrics.mjs`: the existing boundary waited only for the battle container; CDP correctly counts entire responses for requests begun before that boundary, rather than only bytes received so far.
7. Local `apps/web/src/game/cardrpg/depth/Battle.tsx`: the public `.dp-loading` overlay stays present until the renderer's sceneReady flag is true; errors also retain that overlay. This permits a stronger DOM observation without reading debug state or modifying ART.
8. Local `apps/web/src/audio/engine.ts`: first-gesture home preload fetches menu voices, shared UI/receipt packs and home music. Actor preloads include shared hit/death packs deliberately added for onset. Fetch-backed audio is not governed by HTML media preload attributes.

## Own comparison before implementation

`S8/initial-transfer-1.json` preserves three complete early-container observations and the fourth failure (HTTP429). That diagnostic omitted the established local SQL/Anvil begin/rollback fixture. Its 17,709,063–17,709,067 bytes cannot establish an improvement over the earlier 26,411,893-byte rehearsal. The complete first attempt and its exact harness are retained. A fresh owned production12 fixture and per-entry rollback correct isolation without weakening quotas.

`S8/initial-transfer-2.json`: four cold entries, two viewport sizes and immediate versus five-second landing dwell, all isolated and rolled back. Compare both methods within each entry:

- Container-visible boundary: approximately17.7MB, before the loading overlay disappears.
- Visible canvas with no loading/error overlay:27,546,250–27,546,251 bytes. The immediate-entry scene-ready times are2.883s and3.024s; dwell scenarios include the additional5s.
- Complete response accounting remains authoritative. Resource Timing provides a secondary comparison with masked zero-sized entries and synthetic headers. The Node-side CDP snapshot and browser-side evaluation are asynchronous, so their timestamp observations are not claimed to be simultaneous.

Decision: strengthen the future rehearsal runner to wait for the public scene-ready UI before its transfer boundary; retain the container-visible timestamp for comparison. This tightens measurement and does not change the8,000,000-byte gate, assets or timing rules. Make captures explicitly opt-in so scheduled reruns cannot consume the remaining image budget by default. Validate the helper with controlled browser fixtures that keep the container visible while its canvas/loading state is not ready.

Measured SHIP review: audio2,845,647B; all scripts1,422,344B; images22,861,499B. Even removing every audio byte would leave24,700,604B. Home music303,928B and menu voices98,469B are possible future scheduling candidates, but the home bed is actually requested by Gate.enter and actor preloads protect an already-open audio-onset gate. No audio pack is removed or delayed on this evidence. ART texture/VFX request reduction is necessary; the entire image allowance with current non-image responses is only3,315,248B. Full ten-journey/FPS acceptance remains pending.
