# Avalanche integration and evidence

Taskbar Hero's repo targets Avalanche Fuji, chain ID **43113**.
Open the [generated live proof](../reports/chain-proof.md) for its timestamp,
checks, event table, and complete JSON. A failed check means **NOT VERIFIED**.

## V4 configured contracts and proof scope

The [Fuji deployment registry](../packages/chain/deployments/43113.json) contains all five addresses below. The [V4 source](../apps/web/src/game/cardrpg/shell/DemoJourney.tsx) implements the café journey; the public site still serves an older build. No local transaction is presented as public Fuji proof.

| Contract | Purpose | Fuji explorer |
| --- | --- | --- |
| RelicNFT | ERC-1155 ownership, signed mint vouchers and used nonces | [0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D](https://testnet.snowtrace.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D) |
| RelicMarket | Legacy native AVAX escrow | [0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93](https://testnet.snowtrace.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93) |
| YarnToken | ERC-20 YARN, token burns and seal intents | [0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b](https://testnet.snowtrace.io/address/0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b) |
| RelicMarketV2 | AVAX/YARN sale settlement and withdrawable proceeds | [0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4](https://testnet.snowtrace.io/address/0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4) |
| SeasonRewards | Signed reward claims and bounded reward accounting | [0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11](https://testnet.snowtrace.io/address/0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11) |

RelicForge is an optional local fixture; it is absent from this public registry. Source availability is not deployment evidence. YARN is a distinct ERC-20 token; ordinary legacy yarn and Spool balances are server/game resources. Spool withdrawal retains 25%, and retained value is not counted as an ERC-20 burn.

## V4 evidence that can be reproduced

[Public counter recovery](../reports/v4-ship/S4/counter-recovery.json) covers the four real Fuji counters, an aged cache, request failure, reload and recovery. The recorded public-log checks cover five configured contracts and RPC-verified receipts. These are read-only checks, not a completed sponsored public journey or a public-latency measurement.

The [local harness](../scripts/v4ship/journey-run.mjs) drives guest, battle, reward, workshop, boss and wallet proof against disposable Anvil/SQL. Before rollback, an independent verifier compares every observed receipt's successful status, hash, payer, fee and block against the local RPC. It checks at least five action types and that the guest wallet's observed receipts appear in history. The twenty-run completion report is separate from production rehearsal.

The browser derives AVAX fee from `gasUsed × effectiveGasPrice`, records confirmation duration and exposes the actual payer plus café gas funding. A local receipt keeps its local label even though its link follows Snowtrace's public URL format. Such a hash cannot be looked up on public Fuji.

Follow the [README local setup](../README.md#run-the-complete-local-journey). Build-time feature flags, server entitlements and wallet/chain checks remain necessary; URL parameters do not enable unavailable services.

## Legacy two-contract read-only command

The `scripts/chain-proof.mjs` command described below covers RelicNFT and the legacy RelicMarket. It does not validate all five V4 contracts. It reads code at both addresses and checks `RelicMarket.relicNFT()` points to this NFT, plus `RelicNFT.owner()` and `signer()`. The legacy market has no owner getter. The NFT ABI exposes no collection `name()`, `symbol()` or `totalSupply()`; missing values remain unavailable. The EIP-712 domain name is not a collection-name getter.

## Legacy connected play: off-chain authority

Gold, shards, boss keys, combat, idle claims, forge eligibility, daily limits,
and voucher issuance are checked by the server and its database.
This keeps frequent game actions out of wallet prompts and gas payments.
Relics become wallet-owned assets only when the player mints on Fuji.
The source implements these checks; this proof does not audit the hosted server.

## Legacy forge-to-market flow

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

## Re-run the legacy read-only proof

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
