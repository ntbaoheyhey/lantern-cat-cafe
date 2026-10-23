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
