# CHAIN decisions

2026-11-12: Existing VOUCHER_SIGNER_PRIVATE_KEY identified in source; never read its value. Sponsor selection will be explicit and documented.
2026-11-12: Managed worktree created, then moved to the exact user-requested path. App attachment rejected the moved path; use the explicit path in every command.

2026-11-12 H2: SPONSOR_PRIVATE_KEY is optional; reuse the existing VOUCHER_SIGNER_PRIVATE_KEY by default, as requested. Source proves the name, not its current balance. Fail closed below a 1-AVAX reserve including pending payments. Dedicated sponsor separation is supported without requiring a new key to start.
2026-11-12 H2: Persist exact signed bytes before broadcast; reserve sponsor nonces under one DB lock. Count reserved/failed requests toward daily caps to fail closed after interruptions. Three distinct recipients per gateway IP/rolling day; HMAC IP, no plaintext retention.
2026-11-12 H2: Official Core support now points to Builder Hub faucet, verified https://support.core.app/en/articles/6639882-does-core-have-a-faucet and https://build.avax.network/console/primary-network/faucet (read 2026-11-12). UI links directly there.
2026-11-12 H2: pnpm gen:deno regenerates missing base-branch cardrpg import mappings. Keep generated maps together so CI's generation drift check passes.
2026-11-12 H4b/H5: Research completed before token code. Chose 5% sale fee (500 bps; 40% fee sink/60% treasury), 10% reference seal burn; T1–T4 comparisons and T7/T8 wash-price concern documented. No price bands or deposit; zero-price V2 gifts supported. Fee fixed at deploy to protect pending listings. AVAX sink is not YARN burn.
2026-11-12 H5: Retain all coordinator allocation shares. Interpret treasury's <=2%/quarter as 2% of its own bucket (conservative ambiguity resolution). Interpret cliff/linear as sequential periods. Normalize five 20%-declining annual ceilings to 350m, do not force unused rewards into circulation (E1/E2/E10). Genesis distributor is not a vesting contract.
2026-11-12 H4b: Keep existing boss-proof achievement bound. Use separate original Star Thread for the authoritative judge rare-material fixture; C2 owns campaign supply/stats. Testnet transfer grants no added combat power. Three seals/day, level2, 10-minute V2-only relisting cooldown; direct transfers remain possible.
2026-11-12 H5: C2 supply absent; explicitly provisional simulation. No per-battle payment. 20-YARN judge grant + at most 12 routine weekly units; on-chain cap32 including grant. Controller requires operator calculation; no falsely claimed on-chain oracle.
