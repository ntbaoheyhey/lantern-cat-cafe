# Execution receipts — intentionally not fabricated

The exact current A/B review grades remain in the UI ledger. Execution additionally requires each PR after its isolated merge of latest main, complete changedPaths, and a production-equivalent asset SHA-256 inventory. Those future refreshed heads and provider-specific assets do not exist yet. The release dry run reports them as blockers instead of substituting E2E assets or copying grades onto a new head.

Create `<PR-number>.json` only after that refreshed head passes. Required fields: head (40-character SHA), complete:true, A and B each with head/score>=92/failures:[], changedPaths (exact sorted paths), assets (actual /assets/*.js and /assets/*.css SHA-256 values from the existing production configuration). Never change flags or disclose environment values to fill this receipt. Current capacity is BLOCKED.
