# Original premature bundle inventory failure
REFERENCE: failure.log; premature-build-receipt.json; emitted-chunks.json; index-BCtfF1jX.js

The original browser check failed because generateBundle recorded the entry before Vite injected its preload map and finalized chunk names. The complete original inventory, all emitted JS file hashes, raw failure log and exact offending entry are retained here. The full distribution is preserved locally under dist/ (ignored build output); no claim that it is committed. The replacement build from identical archived application source uses final Vite output, independently verified against disk bytes. Original failure remains a failure.
