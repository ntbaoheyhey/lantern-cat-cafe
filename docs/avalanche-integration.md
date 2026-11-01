# Avalanche integration: a one-minute check

Taskbar Hero's repo targets Avalanche Fuji, chain ID **43113**.
Open the [generated live proof](../reports/chain-proof.md) for its timestamp,
checks, event table, and complete JSON. A failed check means **NOT VERIFIED**.

## What lives on Fuji

| Contract | Purpose | Explorer |
| --- | --- | --- |
| RelicNFT | ERC-1155 Relic ownership, voucher minting, spent nonces | [0xB1a1…6f2D](https://testnet.snowtrace.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D) |
| RelicMarket | Escrow listings and purchases paid in native AVAX | [0x10fc…ff93](https://testnet.snowtrace.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93) |

The proof reads code at both addresses and checks `RelicMarket.relicNFT()`
points to this NFT. It reads `RelicNFT.owner()` and `signer()`.
The market has no owner getter in its ABI.
These ERC-1155 contracts expose no `name()`, `symbol()`, or `totalSupply()`.
The proof prints **NOT EXPOSED** for those fields; it does not invent values.
The EIP-712 signing-domain name is not a collection-name getter.

## What stays off-chain, and why

Gold, shards, boss keys, combat, idle claims, forge eligibility, daily limits,
and voucher issuance are checked by the server and its database.
This keeps frequent game actions out of wallet prompts and gas payments.
Relics become wallet-owned assets only when the player mints on Fuji.
The source implements these checks; this proof does not audit the hosted server.

## How a Relic travels

1. **Forge:** the classic API's `forgeRelic()` calls `relic-forge`; server
   `forgeRelic()` checks the daily forge through `game_forge`. The v2 API's
   `forgeRelic()` calls `v2-relic-forge`; server `forgeRelicV2()` checks the
   server-owned recipe and daily limit through its store's `relicForge()`.
2. **Claim voucher:** the forge endpoint returns a server-signed EIP-712 voucher
   naming the player, Relic ID, rarity, nonce, and expiry. There is no separate
   on-chain `claim()` function. The server binds signing to chain 43113 and the NFT.
3. **Mint:** `MintPanel.tsx` calls `RelicNFT.mint(v, signature)` from the player's
   wallet on Fuji. The contract checks the player, signature, expiry, and nonce;
   it emits `RelicForged` and ERC-1155 `TransferSingle`.
   `relic-mint-report` calls server `reportMint()`, which checks a successful
   receipt's `RelicForged` against that voucher before recording the mint.
4. **List:** `MarketTab.tsx` reads `balanceOfBatch`, `isApprovedForAll`,
   `activeListingCount`, and `getListings`. It calls NFT `setApprovalForAll`
   when needed, then `RelicMarket.list(relicId, amount, price)`.
   The market escrows the Relics using `safeTransferFrom` and emits `Listed`.
5. **Buy:** the same tab calls `RelicMarket.buy(listingId)` with the exact AVAX
   price. The contract transfers the Relics to the buyer, pays the seller,
   and emits `Bought`. A seller can recover an unsold listing with `cancel()`.

These functions exist in source. The mint UI described above is the classic
`ForgeTab` / `MintPanel` path; this command does not verify which UI is hosted.
A completed hosted forge-to-buy session is **UNVERIFIED** by this command.
The classic demo path uses `MockGameApi`;
its demo vouchers are blocked from minting by `MintPanel.tsx`.

## Re-run the proof

From the repo root, after `pnpm install`, with Node **22.18+**:

```sh
node scripts/chain-proof.mjs
node scripts/chain-proof.mjs --out reports/chain-proof.json
```

No wallet, key, deployment, or transaction is needed. The script reuses the
web workspace's installed viem, generated ABI, and public Fuji RPC:
`https://api.avax-test.network/ext/bc/C/rpc`. It ignores private RPC overrides.
Stdout is one JSON document; stderr contains the human-readable tables.
Exit code is **0** only when every required check passes, otherwise **1**.
Timeouts, HTTP 429 rate limits, and network errors print a short reason and
**NOT VERIFIED**. Retry rate-limited runs after the public endpoint recovers.

Reads share one block number. The script compares every repo ABI function
selector with opcode-aligned selector comparisons in deployed runtime code,
including Solidity's shortened PUSH instructions for leading-zero selectors.
This checks selector compatibility, not exact source, return types, or behavior;
proxy implementations are not resolved.

The event table shows up to 20 newest logs **per category**: Transfer, Listed,
and Sold, with block, transaction hash, token IDs, and transaction explorer link.
Transfer combines the real ERC-1155 `TransferSingle` and `TransferBatch` events;
Sold is labeled with its actual ABI event, `Bought`. Batch transfers retain all IDs.
The scan walks backward in 100-block ranges to satisfy this public RPC's limit.
It stops at 20 per category or the deployment block found through historical code.
Fewer than 20 means history was exhausted, not that older events were omitted.
Requests are paced to four starts per second to reduce public RPC rate limiting.
A sparse full-history scan can take tens of minutes. Unavailable historical reads fail
verification rather than silently producing a partial history.

Source references: [contracts](../contracts/src/),
[ABI and addresses](../packages/chain/),
[mint UI](../apps/web/src/forge/MintPanel.tsx),
[market UI](../apps/web/src/market/MarketTab.tsx),
[classic server checks](../supabase/functions/_shared/game.ts),
[v2 forge checks](../supabase/functions/_shared/v2/forge.ts),
[voucher signing and receipt checks](../supabase/functions/_shared/relic.ts).
