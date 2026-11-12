# CHAIN decisions

2026-11-12: Existing VOUCHER_SIGNER_PRIVATE_KEY identified in source; never read its value. Sponsor selection will be explicit and documented.
2026-11-12: Managed worktree created, then moved to the exact user-requested path. App attachment rejected the moved path; use the explicit path in every command.

2026-11-12 H2: SPONSOR_PRIVATE_KEY is optional; reuse the existing VOUCHER_SIGNER_PRIVATE_KEY by default, as requested. Source proves the name, not its current balance. Fail closed below a 1-AVAX reserve including pending payments. Dedicated sponsor separation is supported without requiring a new key to start.
2026-11-12 H2: Persist exact signed bytes before broadcast; reserve sponsor nonces under one DB lock. Count reserved/failed requests toward daily caps to fail closed after interruptions. Three distinct recipients per gateway IP/rolling day; HMAC IP, no plaintext retention.
2026-11-12 H2: Official Core support now points to Builder Hub faucet, verified https://support.core.app/en/articles/6639882-does-core-have-a-faucet and https://build.avax.network/console/primary-network/faucet (read 2026-11-12). UI links directly there.
2026-11-12 H2: pnpm gen:deno regenerates missing base-branch cardrpg import mappings. Keep generated maps together so CI's generation drift check passes.
