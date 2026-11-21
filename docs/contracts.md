# Contracts

Foundry project in `contracts/` (Solidity 0.8.24, OpenZeppelin Contracts v5.1.0, forge-std).
Dependencies are git submodules under `contracts/lib/`; clone with `git clone --recursive`
or run `git submodule update --init --recursive`.

```sh
cd contracts
forge build
forge test -vv
```

## RelicNFT (`contracts/src/RelicNFT.sol`)

ERC-1155. A Relic is minted only by the player named in a voucher signed by the game server.
One voucher mints exactly one copy of `relicId`. No payments, no token.

### Rules enforced by `mint(voucher, signature)`

| Check | Revert error |
| --- | --- |
| `msg.sender == voucher.player` | `NotVoucherPlayer()` |
| `block.timestamp <= voucher.expiry` (valid up to and including `expiry`) | `VoucherExpired()` |
| `voucher.nonce` never used before (global, not per player) | `NonceAlreadyUsed()` |
| Signature recovers to the current `signer()` | `InvalidSignature()` |
| If `relicId` was minted before, `voucher.rarity == rarityOf(relicId)` | `RarityMismatch()` |

On success it emits `RelicForged(player, relicId, rarity, nonce)` and an ERC-1155 `TransferSingle`.
The owner can rotate the signer with `setSigner(address)` (emits `SignerUpdated(previous, new)`);
vouchers signed by the old key stop working immediately. The owner also sets the metadata URI with
`setURI(string)` (ERC-1155 `{id}` substitution applies).

`cancelNonce(uint256 nonce)` (owner only) marks a single nonce as used and emits `NonceCancelled(nonce)`,
killing that one voucher without rotating the signer. It reverts with `NonceAlreadyUsed()` if the nonce
was already redeemed or cancelled. `renounceOwnership()` is disabled and always reverts with
`RenounceDisabled()`, so the contract can never end up with no owner (and no way to rotate the signer).

### Deployed on Fuji (chain 43113)

| Contract | Address |
| --- | --- |
| RelicNFT | `0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D` |
| RelicMarket | `0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93` |

The source of truth is `packages/chain/deployments/43113.json`. The metadata URI points at the site's `/relics/{id}.json` (see [deploy](deploy.md)).

### EIP-712 typed data (the Edge Functions use this exactly)

Domain:

| Field | Value |
| --- | --- |
| `name` | `"TaskbarHeroRelic"` |
| `version` | `"1"` |
| `chainId` | `43113` (Avalanche Fuji) |
| `verifyingContract` | deployed `RelicNFT` address |

Primary type `Voucher`, exact type string (this is what `VOUCHER_TYPEHASH` hashes):

```
Voucher(address player,uint256 relicId,uint8 rarity,uint256 nonce,uint256 expiry)
```

- `player`: the wallet that will call `mint`.
- `relicId`: ERC-1155 token id.
- `rarity`: `uint8`, game-defined. The first mint of a `relicId` fixes its rarity.
- `nonce`: unique per voucher across the whole contract (server should allocate from a DB sequence
  or random 256-bit value). Readable on-chain via `usedNonces(nonce)`.
- `expiry`: unix seconds; compared with `block.timestamp`.

Signing with viem:

```ts
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.VOUCHER_SIGNER_PRIVATE_KEY as `0x${string}`);

const signature = await account.signTypedData({
  domain: {
    name: "TaskbarHeroRelic",
    version: "1",
    chainId: 43113,
    verifyingContract: RELIC_NFT_ADDRESS,
  },
  types: {
    Voucher: [
      { name: "player", type: "address" },
      { name: "relicId", type: "uint256" },
      { name: "rarity", type: "uint8" },
      { name: "nonce", type: "uint256" },
      { name: "expiry", type: "uint256" },
    ],
  },
  primaryType: "Voucher",
  message: { player, relicId, rarity, nonce, expiry }, // bigint for uint256, number for uint8
});
```

To check the encoding, compare viem's `hashTypedData({...same args})` against the contract's
`hashVoucher(voucher)` view, which returns the full EIP-712 digest (domain separator included).
The client then calls `mint(voucher, signature)` from `player`'s wallet. Only standard 65-byte
`r || s || v` signatures (what viem returns) are accepted; 64-byte EIP-2098 compact signatures are not.

### Security notes

- Signature malleability: OpenZeppelin `ECDSA.tryRecover` rejects high-`s` signatures; replay is
  blocked by the nonce anyway.
- Cross-chain / cross-contract replay: the EIP-712 domain includes `chainId` and the contract address.
- Reentrancy: the nonce is marked used and rarity stored before `_mint`, so a contract wallet's
  `onERC1155Received` hook cannot redeem the same voucher twice (covered by a test).
- Signer key compromise: owner rotates with `setSigner`. Outstanding vouchers from the old key die.

### Backend rules

The contract only enforces what is listed above; the backend must uphold these:

1. **Rarity is a fixed function of `relicId`.** Each `relicId` is exactly one rarity tier (the pinned ids are common 1, rare 2,
   epic 3, legendary 4, from `packages/game-rules/src/content.ts`). Never roll rarity independently per voucher: the first mint fixes
   `rarityOf(relicId)`, and any later voucher with a different rarity reverts with `RarityMismatch()`
   and can never be redeemed.
2. **Keep voucher expiry short.** 30 minutes (`VOUCHER_TTL_SECONDS` in `packages/chain`), never over 24 hours. Otherwise players can hoard
   vouchers and bypass the one-per-day rule.
3. **Use `cancelNonce` to kill a single bad voucher** (owner only) instead of rotating the signer.
4. **Check `relicExists(relicId)` before trusting `rarityOf(relicId)`.** For a relic that was never
   minted, `rarityOf` returns 0, which is indistinguishable from a real rarity 0. Markets and clients
   must check this first.

## RelicMarket (`contracts/src/RelicMarket.sol`)

Fixed-price escrow market for Relics, priced in AVAX (test AVAX on Fuji). No fees, no token, no owner:
nobody but the seller can touch a listed Relic, and nobody but a buyer paying the exact price can take it.
Constructor: `RelicMarket(address relicNFT)`; the address is immutable and readable as `relicNFT()`.

### Model

- **Escrow.** `list` moves the Relics from the seller into the market with `safeTransferFrom`. The seller
  must first call `RelicNFT.setApprovalForAll(market, true)`. Relics stay in the market until bought or
  cancelled.
- **Listing** = `{ seller, relicId, amount, price }`. `amount >= 1` copies of one `relicId`; `price` is the
  total in wei for all copies, `> 0`. Listing ids start at 1, increase by one and are never reused.
- **Payment is pushed** to the seller inside `buy` with a low-level call. If the seller cannot receive AVAX
  (e.g. a contract without `receive`), the whole `buy` reverts with `PaymentFailed()` and the buyer keeps
  their AVAX; only that seller's own listing is affected and they can still `cancel` it.
- **Only solicited deposits.** The market's ERC-1155 receiver hook accepts a single transfer only from the
  configured RelicNFT, only when the market itself is the operator, inside its own `list` call. Direct
  transfers (single or batch) and tokens from any other ERC-1155 revert with `UnsolicitedTransfer()`, so
  Relics can't be stranded here. Plain AVAX transfers to the market also revert.
- **Reentrancy.** `list`, `buy` and `cancel` are `nonReentrant`, and `buy`/`cancel` delete the listing
  before any external call (checks-effects-interactions). Tests cover a seller whose `receive()` re-enters
  `buy` and a buyer whose `onERC1155Received` re-enters `buy`.

### Functions

| Function | Who | Notes / reverts |
| --- | --- | --- |
| `list(uint256 relicId, uint256 amount, uint256 price) returns (uint256 listingId)` | anyone holding the Relic | `ZeroAmount()`, `ZeroPrice()`; ERC-1155 errors bubble up: `ERC1155MissingApprovalForAll(market, seller)` without approval, `ERC1155InsufficientBalance(...)` if the seller has too few copies |
| `buy(uint256 listingId)` payable | anyone | `msg.value` must equal `price` exactly, else `WrongPayment()`; `ListingNotActive()` if never listed, bought or cancelled; `PaymentFailed()` if the seller rejects AVAX |
| `cancel(uint256 listingId)` | seller only | returns the Relics to the seller; `NotSeller()`, `ListingNotActive()` |
| `getListings(uint256 offset, uint256 limit) view returns (uint256[] ids, Listing[] items)` | view | pages over **active** listings only; empty arrays once `offset >= activeListingCount()` |
| `activeListingCount() view returns (uint256)` | view | total active listings |
| `getListing(uint256 listingId) view returns (Listing)` | view | all-zero struct (`seller == 0x0`) if not active |
| `isActive(uint256 listingId) view returns (bool)` | view | |
| `nextListingId() view returns (uint256)` | view | id the next `list` will return |

`getListings` order is **not stable**: removing a listing moves the last active id into its slot. Page
through all of `activeListingCount()` and key results by listing id; don't assume ascending order.

### Events

```solidity
event Listed(uint256 indexed listingId, address indexed seller, uint256 indexed relicId, uint256 amount, uint256 price);
event Bought(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 relicId, uint256 amount, uint256 price);
event Cancelled(uint256 indexed listingId, address indexed seller);
```

### Client usage with viem

```ts
import { parseEther, parseEventLogs } from "viem";

// 1. One-time approval so the market can pull the seller's Relics.
const approved = await publicClient.readContract({
  address: RELIC_NFT_ADDRESS, abi: relicNftAbi,
  functionName: "isApprovedForAll", args: [account, RELIC_MARKET_ADDRESS],
});
if (!approved) {
  const hash = await walletClient.writeContract({
    address: RELIC_NFT_ADDRESS, abi: relicNftAbi,
    functionName: "setApprovalForAll", args: [RELIC_MARKET_ADDRESS, true],
  });
  await publicClient.waitForTransactionReceipt({ hash });
}

// 2. List 1 copy of relicId for 0.5 AVAX (total price, in wei).
const listHash = await walletClient.writeContract({
  address: RELIC_MARKET_ADDRESS, abi: relicMarketAbi,
  functionName: "list", args: [relicId, 1n, parseEther("0.5")],
});
const receipt = await publicClient.waitForTransactionReceipt({ hash: listHash });
const [listed] = parseEventLogs({ abi: relicMarketAbi, eventName: "Listed", logs: receipt.logs });
const listingId = listed.args.listingId;

// 3. Read active listings page by page (no indexer needed).
const total = await publicClient.readContract({
  address: RELIC_MARKET_ADDRESS, abi: relicMarketAbi, functionName: "activeListingCount",
});
const [ids, items] = await publicClient.readContract({
  address: RELIC_MARKET_ADDRESS, abi: relicMarketAbi,
  functionName: "getListings", args: [0n, 50n],
}); // items[i] = { seller, relicId, amount, price }

// 4. Buy: send exactly the listed price (re-read it right before buying).
const listing = await publicClient.readContract({
  address: RELIC_MARKET_ADDRESS, abi: relicMarketAbi, functionName: "getListing", args: [listingId],
});
await walletClient.writeContract({
  address: RELIC_MARKET_ADDRESS, abi: relicMarketAbi,
  functionName: "buy", args: [listingId], value: listing.price,
});

// 5. Cancel (seller only): the Relic comes back to the seller.
await walletClient.writeContract({
  address: RELIC_MARKET_ADDRESS, abi: relicMarketAbi, functionName: "cancel", args: [listingId],
});
```

Listing ids, prices and amounts are `uint256`, so pass and expect `bigint`.

### Notes

- `list` does not check `relicExists`: holding a balance of `relicId` (required by the transfer) already
  implies the Relic was minted.
- Seller and buyer may be the same address (harmless; no fees).
- A listing always sells as a whole lot; partial fills are not supported.


## Fuji YARN, Market V2 and season claims

**Testnet — no real value.** The user deployed the three new contracts on 2026-11-12. The existing Fuji NFT and V1 market are unchanged. All three new runtimes match local artifacts in the [read-only audit](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/chain/FUJI-READONLY-AUDIT.json); the [public smoke](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/chain/FUJI-SMOKE.md) has 18 confirmed receipts. No contract deployment was performed by Codex.

| Contract | Deployed address |
|---|---|
| YarnToken | `0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b` |
| RelicMarketV2 | `0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4` |
| SeasonRewards | `0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11` |

| Contract | Construction / authority | Main behavior |
| --- | --- | --- |
| `YarnToken` | Fuji-only; genesis distributor; no owner | ERC-20, OpenZeppelin v5 burnable + EIP-2612 permit; exactly 1,000,000,000 × 10^18 genesis units; no later mint |
| `RelicMarketV2` | Existing NFT, YARN, treasury, immutable fee <=1000 bps | ERC-1155 escrow, AVAX (`currency=0`) or YARN (`1`), arbitrary uint256 price including free gifts; pull proceeds |
| `SeasonRewards` | YARN, owner, rotatable signer, weekly cap and UTC-Monday season epoch | Prefunded EIP-712 claims; current 13-week season, global nonce replay guard, recipient binding and UTC-Monday weekly cap; renounce disabled |

The recommended V2 fee is 500 bps (5%). `quote(price)` uses full-precision floor division: 40% of the fee burns YARN (or goes to the native AVAX zero-address sink), 60% credits the treasury, and the rest credits the seller. `withdraw(currency, recipient)` claims only the caller's proceeds; failed payouts restore the balance. Native sinks never count as YARN burns. No fee admin, enforced market price bands, or listing deposit. `list`, `buy`, `cancel`, and `withdraw` are nonreentrant; only solicited single ERC-1155 transfers from the configured NFT are accepted. An item bought in V2 cannot be relisted by that buyer in V2 for ten minutes. V1 and direct transfers bypass V2 fees and cooldowns.

`getListings(offset, limit)` returns active IDs and `{seller,relicId,amount,price,currency}`. Its order can change after a removal; read all pages at one block. `proceeds(owner,currency)`, `feeBps`, `relistAfter` and `getListing(id)` are public reads. `Listed`, `Bought` (including fee/burn), `Cancelled` and `Withdrawn` support indexers. Wallet migration cancels V1/V2 escrow, withdraws both currencies, transfers all known NFT IDs and YARN, then sweeps remaining AVAX.

### Sealing with the existing NFT

Reserved IDs: 1–4 existing Relics; 10000–19999 materials (10001 Star Thread); 20000–29999 equipment. The first NFT mint still fixes each ID's rarity. The [trade policy](design/chain/TRADE-RULES.md) lists every catalog item and reference fee.

`YarnToken.seal(bytes32 intent, uint256 amount)` burns the caller's funds once and records `sealPayments(player,intent)`. The key is `keccak256(UTF8("taskbar-hero:seal:v1:" + intentUuid))`. This receipt does **not** authorize a mint by itself: the authenticated Edge Function checks a server-reserved inventory row, exact payment amount, and wallet; it consumes the source row and signs an ordinary RelicNFT voucher. Retrying or renewing uses that same hash as the uint256 mint nonce. No unsealing or new NFT contract. Offline/imported browser inventory is never authoritative. Campaign Epic+ issuance requires C2 authority; the fixed judge boss currently supplies Star Thread.

### Reward typed data

Domain: `{name:"TaskbarHeroSeasonRewards", version:"1", chainId:43113, verifyingContract:SeasonRewards}`. Exact type:

```text
Claim(address player,uint256 amount,uint256 season,uint256 nonce,uint256 expiry)
TesterClaim(address player,uint256 amount,uint256 season,uint256 nonce,uint256 expiry)
```

Claims enforce caller, nonzero amount, expiry (inclusive), current season, signer and globally unused nonce. Each player's aggregate claims are capped per UTC Monday week regardless of nonce or season; the deploy script chooses 32 YARN. The one-time judge grant is 20 YARN via `claimTester`, signed with `TesterClaim`; a routine `Claim` signature cannot substitute. `testerClaimed(wallet)` is a lifetime guard. Routine `claim` additionally enforces a 12-YARN initial weekly cap that can only fall. `YarnToken.burnedInWeek` tracks all true burns. `SeasonRewards` includes tester grants in `emittedInSeason`, aggregates 13 closed weeks, and rolls its automatic burn/emission reduction on every claim or permissionless `rollSeasons()`. `currentRoutineBudget()` previews the same result. Below0.8 health, multiply the prior cap by min(0.8, health/0.8); zero is absorbing. Late burns do not repair a closed season. All-holder burns count, so this is not an organic-demand oracle. The deployed issuer currently signs tester grants only. Transferring pool funds is part of the same transaction as nonce/cap updates, so insufficient pool funding rolls everything back. `setSigner` is owner-only; there is no discretionary pool withdrawal or mint authority. The genesis distributor does not enforce allocation vesting.

`DeployChainV2.s.sol` requires chain 43113, code at the fixed existing NFT address and its matching signer. It reads `CHAIN_DEPLOYER_PRIVATE_KEY`, `CHAIN_VOUCHER_SIGNER_ADDRESS`, `YARN_DISTRIBUTOR_ADDRESS`, `YARN_TREASURY_ADDRESS`, and optional `MARKET_FEE_BPS=500`. It prints only public addresses and epoch. It never redeploys the existing NFT/market. The user funded 10,000 test YARN; the audited balance after two tester claims is 9,960. Frontend deployment and bot inventory remain outstanding; do not rerun deployment or full smoke with the already-consumed tester wallets.

### Local verification

```sh
pnpm chain:local                    # Anvil chain 43113, ports 5980–5983, disposable keys
pnpm chain:test                     # authenticated guest, real mint/trade/seal and balances
node tools/chain/check-drip.mjs      # idempotent sponsor transfer
node tools/chain/check-move.mjs      # V1/V2 cancellation, withdrawal and asset sweep
node tools/chain/fuji-smoke.mjs --dry-run
forge test --root contracts
forge coverage --root contracts
```

Run the harness commands separately because each owns the same local ports. Public Fuji smoke is user-run with `--fuji`, never implied by a dry-run hash. [Architecture and judge guide](chain/index.html), [research](design/chain/TOKENOMICS-RESEARCH.md), and [report](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/chain/CHAIN-REPORT.md) distinguish tested implementation, design assumptions and public on-chain verification versus pending frontend/timing work.

## Optional finite RelicForge (local proof, public deployment pending)

`RelicForge.sol` pins existing NFT/YARN and permits32 canonical Epic IDs only. Each wallet may unlock each of three designs once. `forge(design,firstId,secondId)` atomically puts two units in permanent custody and burns3 YARN via exact ERC20 allowance. Identical IDs require two units. A failed payment rolls back transfers and unlocks. No owner, upgrade, withdrawal, approval forwarding or NFT/token mint exists. Unsolicited single/batch transfers are rejected. NFTs remain in ERC1155 accounting; the vault tracks unusable units in `consumedOf`, not an NFT burn.

The browser verifies pins/cost/design count, reloads on-chain ownership and recovers an already-confirmed craft before approving again. Ornament rights remain wallet-bound and are not transferred by guest asset migration. `VITE_RELIC_FORGE=1` and a user-deployed `VITE_RELIC_FORGE_ADDRESS` are independent opt-ins. The regular demo flag does not enable them. Unit/fuzz/invariant tests pass and forge line coverage is100%; this is not an independent audit. Public registry intentionally has no invented vault address.

Room styles use the existing YARN `seal` payment primitive with a distinct cosmetic intent domain. Server orders bind wallet/token/SKU/exact cost, and finalization recovers immutable payment state. See the cosmetic pilot protocol for roster/receipt evidence and deployment steps.
