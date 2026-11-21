# Record the V9 demo on Avalanche Fuji

The hosted campaign is available in [desktop Chrome](https://taskbarhero-eight.vercel.app/). For a local recording, from the repository root, after `pnpm install --frozen-lockfile` and the owner setup below, run:

```sh
node tools/v5int/run-chain-mode.mjs
```

This builds the production game with chain mode enabled and serves it on **6301**. Open [the judge route](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3). Stop an existing preview on that port first; the command never stops another process. The original game remains available with `&legacy=1`.

Play free → Guard the café → Face the Yarn Giant → **Mint my Relic on Fuji**. The squad is Mochi, Clover and Soot. The wave contains Needle Moth, Teacup Healer and Button Guard. The seeded boss fight casts each ultimate once and ends on Soot's third ultimate. Battles are reproducible public recordings, isolated from saved campaign progress.

The reward button obtains the server's `chain-judge` finale voucher for **Relic #3, Moon Collar**, waits for confirmed guest gas, and calls the existing `RelicNFT.mint`. The nonce is reused on retry, so a previously minted reward cannot mint again. The toast appears only after a successful RPC receipt. It shows the full transaction hash, **Avalanche Fuji**, the actual `receipt.from` fee payer, fee in AVAX, and a Snowtrace link. The guest wallet pays the mint fee using gas funded by the café; the sponsor pays the separate funding transaction.

Open **Collection** to read all catalog RelicNFT balances directly from Fuji RPC. It works without the backend or sign-in: enter any wallet address and choose **Read Fuji Relics**. All batches use one block number. The **Owned on Avalanche Fuji** label appears only after a successful chain read; RPC failures do not display fixture ownership.

## Public browser settings

Create `apps/web/.env.local` containing only public values. Fill the two project-specific fields using the existing Supabase project:

```dotenv
VITE_SUPABASE_URL=https://<YOUR_PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<YOUR_PROJECT_ANON_OR_PUBLISHABLE_KEY>
VITE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
```

The recording command supplies `VITE_CHAIN_DEMO=1` and `VITE_CHAIN_MODE=fuji`. Contract addresses come from `packages/chain/deployments/43113.json`; do not redeploy them. Restart/rebuild after changing browser variables.

## Owner setup: backend and sponsor

The production backend supports the hosted game and the local recording origin. Its functions validate SIWE sessions. The chain judge replays the three-cat reward trial before issuing a voucher. The following settings document the configuration for operators. [21 November live proof](avalanche/LIVE-E2E.md)

Set these in the **server's secret environment**, never in `apps/web/.env.local` or a `VITE_` variable:

| Variable | Exact value or owner-supplied value |
| --- | --- |
| `SUPABASE_URL` | `https://<YOUR_PROJECT_REF>.supabase.co` (hosted runtime normally supplies it) |
| `SUPABASE_SERVICE_ROLE_KEY` | Existing project's service role key, server only |
| `SUPABASE_JWT_SECRET` | Existing project's session JWT signing secret; if the reserved name cannot be set, use `AUTH_JWT_SECRET` consistently across auth and chain functions |
| `SPONSOR_PRIVATE_KEY` | Dedicated, owner-controlled Fuji sponsor key; owner funds its address |
| `VOUCHER_SIGNER_PRIVATE_KEY` | Existing signer key matching RelicNFT signer `0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000`; do not rotate or replace the deployed signer for this recording |
| `GUEST_DRIP_ENABLED` | `1` |
| `CHAIN_JUDGE_ENABLED` | `1` |
| `FUJI_RPC_URL` | `https://api.avax-test.network/ext/bc/C/rpc` |
| `SIWE_DOMAIN` | `taskbarhero-eight.vercel.app,127.0.0.1:6301` (comma-separated hosts) |
| `SIWE_ALLOWED_ORIGIN` | `https://taskbarhero-eight.vercel.app,http://127.0.0.1:6301` |

`guest-drip` refuses a grant that would leave the sponsor under **1 AVAX** (`sponsor_low`), so keep the sponsor at **2 AVAX or more** before recording. Check it on [Snowtrace](https://testnet.snowtrace.io/address/0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000). The drip sends **0.05 test AVAX per new guest** and retains the existing database caps and idempotency. The sponsor needs enough test AVAX for the transfer and gas. The operator maintains the sponsor balance. No new service subscription or paid API is needed.

For the owner-run funding proof, sign in as the recording guest, then set these variables in the owner's local shell:

```dotenv
PROOF_CONFIRM_FUJI=YES
PROOF_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
PROOF_DRIP_URL=https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/guest-drip
PROOF_GUEST_ADDRESS=<PUBLIC_ADDRESS_OF_THE_RECORDING_GUEST>
PROOF_GUEST_TOKEN=<CURRENT_SIWE_SESSION_TOKEN_FOR_THAT_GUEST>
```

Run `node tools/v5int/fuji-proof-kit.mjs --fuji`. Keep the session token private. This proves **funding only**; the recording must separately capture the real Relic mint toast and Collection read. A repeated funding request returns the prior transaction and does not prove a new transfer. Do not copy session storage or guest private keys into reports.

## Fixture fallback

When the backend is not configured, use:

```sh
node tools/v5int/run-chain-mode.mjs --fixture
```

Finish the boss and choose **Preview receipt fixture**. The toast visibly says **Fixture — Relic mint preview**, **not submitted**, and **No transaction or ownership is claimed**. It has no explorer link and is never stored as a real receipt. The Collection still supports public Fuji reads by address. A configured live build that cannot mint exposes the same labelled preview after showing its error; no silent fallback fabricates a transaction.

At the CXI checkpoint on 19 November 2026, this worktree had no Supabase configuration or owner-funded sponsor session. That fixture was used for UI review. The subsequent hosted Chapter 1 mint is [visible on Snowtrace](https://testnet.snowtrace.io/tx/0x566fe1355cad0c4b71dcab6daa8c0f23fe94282e7f601d2f16700800ddf47c56).

## Verified Fuji contracts

All five were checked using `forge verify-contract` through Routescan on **19 November 2026**, with Solidity `v0.8.24+commit.e11b9ed9`, optimization off and EVM `cancun`. RelicNFT and RelicMarket were already verified; YarnToken, RelicMarketV2 and SeasonRewards returned **Pass - Verified**. Verification publishes existing source and does not deploy contracts or spend gas.

| Contract | Fuji address / verified source |
| --- | --- |
| RelicNFT | [0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D](https://testnet.snowtrace.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D/contract/43113/code) |
| RelicMarket | [0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93](https://testnet.snowtrace.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93/contract/43113/code) |
| YarnToken | [0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b](https://testnet.snowtrace.io/address/0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b/contract/43113/code) |
| RelicMarketV2 | [0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4](https://testnet.snowtrace.io/address/0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4/contract/43113/code) |
| SeasonRewards | [0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11](https://testnet.snowtrace.io/address/0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11/contract/43113/code) |

Recheck with `node tools/v5int/verify-fuji.mjs`. It uses the original public constructor arguments, the Routescan Etherscan-compatible verifier, and **no API key**. Stop and ask the owner if a future verifier starts requiring an account or key. See [Routescan's Foundry verification guide](https://info.routescan.io/en/articles/11992459-deploying-and-verifying-contracts-foundry).
