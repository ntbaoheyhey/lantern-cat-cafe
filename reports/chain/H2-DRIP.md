# H2 gas drip evidence
- New Edge Function: `guest-drip`; disabled unless `GUEST_DRIP_ENABLED=1`.
- Verified existing secret name in source: `VOUCHER_SIGNER_PRIVATE_KEY`.
- Optional isolated sponsor: `SPONSOR_PRIVATE_KEY`. No existing secret value was read.
- One signed legacy Fuji transaction persisted before broadcast; retries preserve nonce, bytes and hash.
- SQL serializes reservations and enforces wallet identity, one lifetime payment/address,
  50 reservations/UTC day, three distinct recipients/IP/rolling day, and a 1-AVAX reserve after pending costs.
- Table and functions are service-role only, with RLS enabled. HMAC IP hashes, no raw IP retention.
- `node tools/chain/check-drip.mjs`: PASS, real SIWE over HTTP, successful 0.05 AVAX receipt,
  repeated request, mined-before-DB crash recovery, one table row, wrong-chain refusal.
- `guest-wallet.spec.ts`: PASS with production SIWE parser and local drip service.
- `guest-drip.test.ts`: six cases cover limits, concurrent reservations, immutable signed bytes and roles.
- No hosted migration/function deployed. Only disposable PGlite and Anvil used.
- Operator: keep sponsor nonce exclusive to this service; do not send unrelated transactions from it.
  A reserved-but-not-signed request must be retried to fill its nonce before later payments mine.
  Low gas-price reservations may remain pending; do not delete rows or replace their signed bytes.
- Hosted gateway forwarding trust must be checked before enabling the public drip.
- Local harness binds ports 5980–5982 to loopback, checks Host/Origin, never loads `.env`.
