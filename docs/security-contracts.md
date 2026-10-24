# Contract security review

Scope: `contracts/src/RelicNFT.sol` and `contracts/src/RelicMarket.sol` at the `main` commit this PR is based on (OpenZeppelin 5.1.0, Solc 0.8.24, EVM `cancun`). Manual review by Claude; this is **not an audit** and no external tool (Slither, Echidna, formal verification) was run. No contract was changed. Every fix below is a **proposal for the user**, because contracts are core; none of them has been implemented.

Baseline: `forge test --offline` passes, 83 tests (see also [contracts-coverage](contracts-coverage.md)).

## Summary

| # | Severity | Finding | Needs |
| --- | --- | --- | --- |
| 1 | Medium | A leaked signer key allows unlimited mints, nonce pre-burning and permanent wrong rarity | Fast rotation, monitoring; optional contract hardening |
| 2 | Medium | Single-step `Ownable`: a wrong `transferOwnership` target locks all admin functions forever | `Ownable2Step` (redeploy) |
| 3 | Low | One owner key holds every admin power; the deployer wallet is the owner | Operational (multisig for real money) |
| 4 | Low | No maximum voucher lifetime on chain | One-line check (redeploy) |
| 5 | Low | `cancelNonce` and signer-issued nonces can burn nonces the server has not issued yet; the server also reads "nonce used" as "minted" | Server fix, see [relic recovery proposal](proposals/relic-recovery.md) |
| 6 | Low | A contract seller that later stops accepting ERC-1155 cannot cancel; its escrowed Relics stay stuck | Design note |
| 7 | Low | Seller payout forwards all gas | Accept, documented |
| 8 | Info | Contracts are immutable and unpausable | Accept for testnet |
| 9 | Info | One mutable metadata URI, no `URI` event, art lives on the Vercel site | Operational |
| 10 | Info | ERC-1155 `setApprovalForAll` risk, market approval persists | User education |
| 11 | Info | Force-sent AVAX is stuck in the market | Harmless |

No Critical or High finding: nothing found that lets an unprivileged account mint without a valid voucher, take escrowed Relics or another seller's payment, or replay a voucher on another chain or contract.

## Findings

### 1. Leaked signer key (Medium)

`mint` trusts any voucher signed by `signer`. With the key an attacker can, until the owner calls `setSigner`:

- Mint unlimited copies of any `relicId` to their own addresses (there is no supply cap, daily limit or fee on chain; the one-per-day rule exists only on the server). Market supply and value are diluted.
- Choose nonces. Server nonces are small, predictable integers from a database sequence. Minting with a nonce the server has not issued yet makes the server's later voucher fail with `NonceAlreadyUsed`. Verified in a scratch test: `usedNonces(5)` becomes true after an attacker mint with nonce 5.
- Fix a wrong rarity forever. `rarityOf` is written on the first mint of a `relicId` and never changes. A signer can mint an unused id with any rarity (verified: id 99 with rarity 3 stays 3). For ids 1 to 4 this only matters before their first mint, but `RarityMismatch` then blocks every honest voucher for that id. The server pins common 1, rare 2, epic 3, legendary 4; that is not enforced on chain.

Limits on the damage: vouchers are bound to `player` and `msg.sender`, so the attacker cannot mint into someone else's wallet; `setSigner` kills every pre-signed voucher at once (the signature is checked against the current signer), including ones with far-future expiry.

Smallest fixes:
- Operational, no code: keep the key only in the Edge Function secret store, rotate on any doubt ([runbook](runbook.md#rotate-the-voucher-signer)), and alert when a `RelicForged` log has a nonce that is not in `relic_vouchers`.
- Optional contract hardening if the contract is ever redeployed: let the owner register the rarity of each known `relicId` (or constructor-pin ids 1 to 4) so a signer cannot set rarity, and cap lifetime (finding 4). A per-day mint cap per player is possible but needs more storage and gas and still trusts the signer.

### 2. Single-step ownership transfer (Medium)

`RelicNFT` uses plain `Ownable`. `transferOwnership(wrongAddress)` immediately hands the admin role to an address nobody controls. `renounceOwnership` is correctly disabled and the zero address is refused, but a typo or a dead address is not. Result: `setSigner`, `setURI` and `cancelNonce` are lost; a leaked signer could then never be rotated. Verified in a scratch test (`transferOwnership(0xdead)` then `setSigner` reverts).

Smallest fix: use OpenZeppelin `Ownable2Step` (pending owner must call `acceptOwnership`) while keeping `renounceOwnership` disabled. Needs a redeploy and a new address in `packages/chain/deployments/43113.json`. Until then: never call `transferOwnership`.

### 3. One owner key has every admin power (Low on testnet)

The owner can swap the signer (equivalent to finding 1), change the URI for every Relic (finding 9) and burn nonces. The owner is the deployer wallet, whose key sits in a local `.env` on one machine ([deploy](deploy.md)). A stolen deployer key is a full compromise of minting. Smallest fix before any real-value use: move ownership to a multisig (needs finding 2's two-step flow to do it safely) and keep the signer key separate from the owner key (already the case).

### 4. No maximum voucher lifetime on chain (Low)

`mint` only checks `block.timestamp <= expiry`. The contract allows a voucher valid for centuries; the 30 minute TTL (`VOUCHER_TTL_SECONDS`) and the "never over 24 hours" rule are server conventions ([contracts](contracts.md#backend-rules)). A server bug or a leaked key could mint vouchers that can be hoarded and used long after the daily limit would have applied. Smallest fix: `if (v.expiry > block.timestamp + 24 hours) revert VoucherTooLong();` in `mint` (redeploy). Vouchers still die when the signer rotates, which limits the risk today.

### 5. Nonce burning and "used" read as "minted" (Low)

`cancelNonce` lets the owner burn any nonce, including ones not yet issued, and finding 1 lets a leaked signer do the same. The server treats `usedNonces(n) == true` as "this voucher was minted" and marks it minted without checking a `RelicForged` log, so a cancelled or pre-burnt voucher turns into a forge that is paid, unminted and blocked by `daily_limit`. This is a server logic gap, not a contract bug; the proposed fix is in [docs/proposals/relic-recovery.md](proposals/relic-recovery.md) (look for a matching `RelicForged` log before deciding "minted").

### 6. Escrowed Relics can be stuck for a contract seller (Low)

`cancel` and `buy` send Relics with `safeTransferFrom`, which calls the receiver hook. If a contract seller listed Relics and its code later stops accepting ERC-1155 (for example an upgradeable wallet whose handler changed), `cancel` reverts and the Relic stays in escrow; a buyer can still buy it if the seller can receive AVAX. Verified with a scratch contract whose hook starts reverting. Any contract that holds Relics had to accept them once, so this needs an unusual change of behaviour; EOAs are not affected. Smallest fix if wanted: `cancel(listingId, recipient)` restricted to the seller choosing where the Relic goes (changes the ABI, redeploy). Otherwise document that contract wallets must keep their ERC-1155 receiver.

### 7. Seller payout forwards all gas (Low)

`buy` pays the seller with `call{value: price}("")` and no gas cap. A malicious contract seller can consume all forwarded gas, making that one `buy` fail with out of gas. Impact is limited to that seller's own listing (the buyer's transaction reverts, nothing is lost but gas; wallets usually fail at gas estimation first) and the seller can `cancel` if they can receive the Relic. The gas bomb itself was not tested (a contract that cannot receive ERC-1155 cannot hold a Relic to list). No fix proposed: capping gas would break legitimate smart-contract wallets.

### 8. Immutable, unpausable contracts (Info)

Neither contract is upgradeable, `RelicMarket` has no owner and no pause. A bug found later cannot be patched in place; sellers can always `cancel` (good), and the fix is a redeploy plus a new `relicNFT`/market address. Accept for a testnet project; decide again before mainnet.

### 9. URI is one mutable string (Info)

All Relics share one URI template, changeable by the owner at any time, so existing Relics can change name and art, and OpenZeppelin 5.1 `_setURI` emits no `URI` event, so indexers and marketplaces are not told. The art is hosted on the Vercel site; if the site is down or compromised, Relics show wrong or no art (ownership is unaffected). Fix if needed: pin metadata and images to IPFS and set the URI once; or emit `URI(newURI, id)` for known ids after `setURI`. Operationally, `scripts/check-live.mjs` checks the URI and images.

### 10. ERC-1155 approvals (Info)

`setApprovalForAll(operator, true)` gives the operator control of all the owner's Relics. A phishing site that gets this approval can drain them; this is a property of ERC-1155, not of these contracts. The market approval is safe by construction: the only code path that moves a seller's tokens is `list`, which transfers from `msg.sender` (checked). The approval stays after listing, so users can revoke it when done. UI text could suggest that.

### 11. Force-sent AVAX (Info)

The market has no `receive`/`fallback`, so plain transfers revert, but `selfdestruct`-style forced sends can still add AVAX that nobody can withdraw. Nothing in the market reads `address(this).balance`, so it cannot affect accounting (checked).

## What was checked and found sound

- **Reentrancy.** `list`, `buy` and `cancel` are `nonReentrant`, delete or write storage before external calls and emit events before transfers. Buyer hook, seller payout and token hooks cannot re-enter or see inconsistent state (the listing is already deleted). `mint` sets `usedNonces`, relic existence and rarity before `_mint`, so a receiver hook cannot replay a voucher. The receiver hook accepts only transfers the market itself initiated inside `list`, and only with the guard held.
- **Price and payment math.** There is no arithmetic on amounts: `msg.value` must equal `price` exactly, nothing is split or rounded, there are no fees. Overpay, underpay and zero value revert and leave listing, escrow and balances untouched. A listing cannot change after creation, so there is no bait-and-switch; a seller that cancels and relists makes the buyer's old transaction revert, which costs gas only.
- **Refund paths.** There are no partial refunds: any failure (seller rejects AVAX, buyer cannot receive ERC-1155) reverts the whole transaction and the buyer keeps their AVAX and the listing stays.
- **Signature handling.** Only 65-byte `r,s,v` signatures from `signer` are accepted; high-`s` and 64-byte compact signatures are rejected (OpenZeppelin `ECDSA.tryRecover`); a malformed signature returns `InvalidSignature`, not a revert from the library.
- **Replay.** The EIP-712 domain has name, version, `chainId` and the contract address. OpenZeppelin `EIP712` recomputes the domain separator if `block.chainid` or the address differ from construction, so a chain fork or another deployment cannot reuse a signature (covered by tests for another chain and a second instance). The same signer key reused on another contract or chain stays safe for the same reason.
- **Nonce and expiry rules.** Nonces are global, single-use, set before minting; a failed mint (wrong caller, bad signature, expired, rarity mismatch) does not burn the nonce. A voucher is valid at exactly `expiry` and invalid one second later. A voucher is bound to `player == msg.sender`, so it cannot be front-run or stolen from the mempool.
- **Rarity consistency.** A mismatch with the first mint reverts `RarityMismatch` (also a permanent block for that voucher; see finding 1 and the server rule in [contracts](contracts.md#backend-rules)).
- **Owner powers.** Limited to `setSigner` (non-zero), `setURI`, `cancelNonce`; `renounceOwnership` reverts; the owner cannot mint, move or burn anyone's Relics. The market has no owner and no admin function.
- **Unsolicited transfers.** Direct single or batch transfers, tokens from other ERC-1155 contracts and plain AVAX to the market revert, so Relics cannot be stranded by mistake.

## Not checked

- No Slither, Echidna, Foundry invariant campaign or formal verification; no third-party audit.
- OpenZeppelin 5.1.0 itself and the Solidity compiler were assumed correct.
- Server-side issuance (`supabase/functions`) was read only where it touches nonces and expiry; its authorization, rate limiting and database logic are outside this review.
- The deployment script and key handling were skimmed, not reviewed; frontend wallet flows, gas costs and mainnet economics were not examined.
- Reorg or finality behaviour of Fuji and the server's mint confirmation were not analysed.
- On-chain state of the deployed addresses was not read (no network access in this session); the review is of the source on `main`, not of the deployed bytecode.

## Verification notes

The claims marked "verified" in findings 1, 2 and 6 were reproduced with throwaway Foundry tests that were run and then deleted (no test or contract files are part of this PR). Everything else comes from reading the code and the existing 83 tests.
