# Staged Video Delivery Research (T-M4 - Finalized)

## 1. Tradeoffs (Random Phase/Seek/Loop)
- Random Phase/Seek: Significant overhead in native H264 range requests (stalls during seek).
- Looping: MSE fMP4 with segmented initialization provides smoother looping.
- Stall/Byte Costs: Stalls increase with high seek frequency in long-GOP streams.

## 2. Official Sources
- MSE fMP4: [W3C MSE Spec](https://www.w3.org/TR/media-source/).
- Range Requests: [MDN Media Source Extensions API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API).
