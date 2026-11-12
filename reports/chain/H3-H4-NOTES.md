# Local chain loop and issuance boundary
- `pnpm chain:local`: loopback-only web 5980, Anvil 5981 (Fuji ID 43113), authenticated API 5982.
- RelicNFT and RelicMarket are deployed to deterministic local addresses. Existing Fuji deployments are unchanged.
- Public Anvil fixtures only; no `.env` load and no real secrets. Addresses go to ignored `chain-local.json`.
- Four real bot escrow listings seed the market. The browser signs real transactions and verifies receipts.
- Production SIWE + drip logic + PGlite migrations run locally. This is not a hosted Supabase integration test.
- `chain-judge`: capped two-voucher pass, fixed server-run boss drop, ten-minute signatures.
- Re-signing an expired entitlement keeps its nonce; a transferred/minted item never gains a second mint.
- The boss uses `createBattle`/`playBattle` and starter stats, with an explicitly authored introductory boss budget.
- No client save/claimed win/stats/loot is accepted as authority. Ordinary offline campaign wins remain local.
- Judge allocation is capped at 50 new wallets/UTC day, three/trusted IP/rolling day.
- The in-game panel reads listings and balances from contracts, not DB mirrors.
- Treasure slots store only cosmetic presentation in wallet-scoped storage and clear on loss of ownership.
- This cosmetic path never sets the legacy `selectedRelic` combat bonus. C2 owns its existing balance rules.
- History reads up to 120,000 recent blocks in 10,000-block windows, displaying the latest 20 found transactions.
  For older activity, use the contract explorer; no claim of a complete archival index.
- `bot-seller.mjs --run`: operator only, env BOT_PRIVATE_KEY, maintains 3–6 owned listings; never mints.
- Local Snowtrace URLs have the required format but local hashes do not exist on public Fuji.
- User must apply both migrations and deploy `chain-judge`/`guest-drip` before enabling their server flags.
