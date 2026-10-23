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

### EIP-712 typed data (backend task B5 must match this exactly)

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

const account = privateKeyToAccount(process.env.RELIC_SIGNER_PRIVATE_KEY as `0x${string}`);

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

1. **Rarity is a fixed function of `relicId`.** Each `relicId` is exactly one rarity tier (for example
   `relicId` encodes the tier). Never roll rarity independently per voucher: the first mint fixes
   `rarityOf(relicId)`, and any later voucher with a different rarity reverts with `RarityMismatch()`
   and can never be redeemed.
2. **Keep voucher expiry short.** 30 minutes planned, never over 24 hours. Otherwise players can hoard
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
