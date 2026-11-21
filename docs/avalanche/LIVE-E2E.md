# Live Avalanche Fuji check — 21 November 2026 (full sale)

After the owner funded the café sponsor (2.35 AVAX at 02:35 UTC), the whole judge path ran again against the deployed backend with no mocks: guest SIWE sign-in, server-replayed boss battle (`chain-judge` action `boss`), café gas, mint, list, a second guest buys, the seller withdraws. Raw proof: [`live-e2e-2026-11-21.json`](live-e2e-2026-11-21.json).

| Step | Payer | Confirmed in | Transaction |
| --- | --- | --- | --- |
| Café gas (guest-drip) | sponsor | 5622 ms | [0x75b9639f…](https://testnet.snowtrace.io/tx/0x75b9639f85fd0b86eb435a53cecb1dc13b1312377208a18d001995d8dc6cf644) |
| RelicNFT.mint | seller | 4736 ms | [0x90a79ef3…](https://testnet.snowtrace.io/tx/0x90a79ef39aa2f77c2f96396b7364d39d91d7c886f94cf413089fb93643391a61) |
| RelicNFT.setApprovalForAll | seller | 4561 ms | [0x1a73526b…](https://testnet.snowtrace.io/tx/0x1a73526b5921051f3c6bdfeecae11471553dfde568279b83404378c37817c9e2) |
| RelicMarketV2.list | seller | 4633 ms | [0xc9bbd0a6…](https://testnet.snowtrace.io/tx/0xc9bbd0a6e649a6c4a4a7f1c689c0d72457201fef2e96c7ecb9600b699cb60b4f) |
| Seller funds buyer gas | seller | 2209 ms | [0x1b11f56f…](https://testnet.snowtrace.io/tx/0x1b11f56ff6aff3b3c428e7ea77d42b05899faca4a85f04176fa7bc51d6f85938) |
| RelicMarketV2.buy | buyer | 4595 ms | [0xb16588ad…](https://testnet.snowtrace.io/tx/0xb16588ad63b85922f9233205c05b075aff0e3a894204c1101f6c0eb8d07e16c9) |
| RelicMarketV2.withdraw | seller | 1307 ms | [0x762c833b…](https://testnet.snowtrace.io/tx/0x762c833b4ff4979e4679154648602717939008402835734ed27a12b2bcd51176) |

Market split for the 0.001 AVAX sale (listing #5): fee 0.00005 AVAX, of which 0.00002 burned and 0.00003 to treasury; seller received 0.00095 AVAX. Final ownership: buyer 1, seller 0.

Still open: the hosted `chain-judge` is the 12 Nov build, so the in-game `finale` reward (Relic #3) needs the redeploy below; `boss` works today.

## Earlier check — 19 November 2026

This records what was run against the **deployed** backend (Supabase `qoalewtxflagoprrxrgh`) and the **deployed, verified** Fuji contracts, with no mocks. Script: [`tools/fuji/live-e2e.mjs`](../../tools/fuji/live-e2e.mjs).

### What happened on chain (20:35–20:36 UTC)

A fresh in-memory guest wallet signed in with SIWE for `taskbarhero-eight.vercel.app`, asked `chain-judge` for a server-signed voucher (the server replays the boss battle itself), received café gas from `guest-drip`, minted, and listed the Relic on RelicMarketV2.

| Step | Payer | Transaction |
| --- | --- | --- |
| Café gas 0.05 AVAX (`guest-drip`) | sponsor `0x5eC8…B000` | [0xe7f14e6c…](https://testnet.snowtrace.io/tx/0xe7f14e6cef4e7105e25bd50cf26e62cd6508ff132ba3b748c5646be182611c45) |
| `RelicNFT.mint` (Relic #1, server voucher) | guest `0xe1bf…b862` | [0x0fc6ef87…](https://testnet.snowtrace.io/tx/0x0fc6ef874ac73420f4fe1be9dbc17cabb1bda081d09733b5b74595985f8e9ee9) |
| `RelicNFT.setApprovalForAll` (market) | guest | [0x56c1daf3…](https://testnet.snowtrace.io/tx/0x56c1daf315c14f9d85c4aec5cd62d972485d528d4d88b5c62c3ed776abfc3821) |
| `RelicMarketV2.list` (listing #4, 0.001 AVAX) | guest | [0xefe712af…](https://testnet.snowtrace.io/tx/0xefe712af32bfc68f18ef24be6b7180ff59a673e9db880172ed336b8fc8e6c5e8) |

Each step confirmed in about 4–5 seconds. Listing #4 is still open on RelicMarketV2; any Fuji wallet (including the recording guest in the Market tab) can buy it.

The buy step did not run: the second café grant was refused. The script now funds the buyer from the seller instead, so a full run needs only one grant.

### Problems found and their fixes

| # | Problem | Evidence | Fix |
| --- | --- | --- | --- |
| 1 | **Café sponsor is effectively empty.** `chain_drip_reserve` refuses a grant that would leave the sponsor under **1 AVAX**. The sponsor now holds **1.0499 AVAX**, so every new guest gets `sponsor_low` and the in-game mint cannot start. | `supabase/migrations/20261112010000_guest_drip.sql` line 39; RPC balance read 20:37 UTC | Owner sends test AVAX to `0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000` (2+ AVAX ≈ 20 more guests). |
| 2 | **Deployed `chain-judge` is the 12 Nov build.** The V9 game calls `action: "finale"` (Moon Collar, Relic #3); the deployed function answers `503 judge_unavailable`, so the UI falls back to the labelled fixture. `action: "boss"` still works. The repository source passes its 8 tests for `finale`. | live probe 17:10 and 20:35 UTC; `supabase/tests/src/chain-judge.test.ts` | Redeploy `chain-judge` (and `auth-verify`, `guest-drip`) from this branch. |
| 3 | **SIWE accepted exactly one host.** A local recording build on `127.0.0.1:6301` and the public Vercel build could not both sign in against one backend. | `packages/auth/src/index.ts` | `SIWE_DOMAIN` now accepts a comma-separated list (2 new tests, 26/26 pass). |
| 4 | **Vercel production builds 3 Nov `main` with no chain flags.** Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_FUJI_RPC_URL`, `VITE_GAME_V2` are set. | Vercel project `taskbarhero` env list | Recording uses the local chain-mode build (`docs/RUN-CHAIN-MODE.md`); Vercel cut-over is separate. |

Already working and confirmed: SIWE sign-in against the live backend, server-signed RelicNFT vouchers (signer = sponsor `0x5eC8…B000`, matches `RelicNFT.signer()`), guest-drip idempotency, and all five contracts verified on Routescan/Snowtrace.

### Re-run

```sh
LIVE_FUJI=YES node tools/fuji/live-e2e.mjs --out docs/avalanche/live-e2e-$(date -u +%F).json
```

Use `--action finale` after `chain-judge` is redeployed (default is `finale`; pass `--action boss` against the old deployment). Guest keys are generated in memory and never written. Grants are limited to 3 per network address per 24 h and 50 per day overall.
