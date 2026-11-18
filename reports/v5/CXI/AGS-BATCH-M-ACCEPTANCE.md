# Batch M evidence acceptance — CXI
T-M1 remains open. T-M2 was accepted at08:16Z only as a negative provenance inventory; no alpha/layout/height quality acceptance. A missing measurement must be labelled unavailable.

T-M1 deliverable: one evidence table of official licensing scope and browser/package costs, with exact primary URLs or local raw receipt paths and hashes for every row.
- Official EN source: https://help.live2d.com/en/sdk/sdk_001/ ; Chinese source: https://help.live2d.com/zh-CHS/sdk/sdk_001/ . Both distinguish content without SDK use from the separate publisher annual-sales exception. The page does not say application revenue or non-runtime video.
- Our engineering inference: playback of an exported video alone does not add a Cubism SDK to the game. No SDK downloaded or license accepted here.
- Cost rows must name an actual 300-frame artifact, codec/layout, dimensions, total encoded bytes, poster/manifest bytes, measured browser/version and full raw-run receipt. Bitrate ranges and unit-test counts are not native browser measurements.
- Existing CXI numeric evidence is reusable if explicitly attributed to its exact receipt and hash; do not call it a new AGS run.

T-M2 deliverable: an honest provenance inventory for the named Mochi video, its decoded image, packed-mask layout and raw measurement transcript. Include actual paths, hashes, bytes, channel/ROI meaning and measurement success/failure.
- Named H264 video is yuvj420p; it has no native alpha channel. A spatial mask needs a documented region and derivation.
- M-ALPHA-RAW-METRICS-V12.txt records extractplanes failure and zero output frames. M-ALPHA-METRICS-FINAL.txt is empty. Neither proves alpha 245.
- No numeric alpha assertion without successful raw evidence tied to the named input. Mark missing evidence unavailable; do not rename a prior rejected image or repeat a full batch.

T-CXI-5 remains open: source provenance plus identified listening and loop evidence for exact audio hashes. SNR/gain analysis is numeric evidence, not listening. Six-callout cue ends fit, so clipped words are not established.

T-CXI-10 remains open: primary EN/ZH sources and attribution/hash for CXI capability declarations; native decoding remains unavailable. T-CXI-11 remains open: audio preload/reachability inventory, no implementation.
