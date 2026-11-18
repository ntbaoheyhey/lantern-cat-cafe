# Staged Video Delivery Research (T-M4 - Revised)

## 1. Tradeoffs (Random Phase/Seek/Loop)
- Random Phase/Seek: Significant overhead in native H264 range requests (stalls during seek).
- Looping: MSE fMP4 with segmented initialization provides smoother looping.
- Stall/Byte Costs: Stalls increase with high seek frequency in long-GOP streams.

## 2. Official Sources
- EN: [W3C MSE Spec](https://www.w3.org/TR/media-source/), [MDN Media Source](https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API).
- ZH: [MDN (ZH) Media Source](https://developer.mozilla.org/zh-CN/docs/Web/API/Media_Source_Extensions_API).
- Random phase/seek/loop/stall: Metrics unmeasured; claims regarding performance benefits in MSE loops vs native range loading are speculative without local empirical trial.
