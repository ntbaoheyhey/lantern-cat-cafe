# Contract test coverage (B3-H5)

Measured with `forge coverage --offline --report summary` in `contracts/` on `main` (64 tests) and after this change (83 tests). Contracts under `src/` are unchanged.

| Contract | Before (lines / branches / functions) | After |
| --- | --- | --- |
| `RelicNFT.sol` | 100% (32/32) / 100% (9/9) / 100% (8/8) | unchanged, 100% |
| `RelicMarket.sol` | 95.92% (47/49) / 100% (10/10) / 90% (9/10) | 100% (49/49) / 100% (10/10) / 100% (10/10) |

Branch coverage was already complete before this review. The only uncovered code was `RelicMarket.onERC1155BatchReceived`, which the ERC-1155 token never reaches in the existing batch test (the token's own check reverts first); the new test calls both receiver hooks directly. The rest of the work targets behaviour that line coverage cannot show, in `contracts/test/RelicEdges.t.sol`:

| Area | Tests added |
| --- | --- |
| Voucher expiry | expired long ago reverts; an expired attempt does not burn its nonce. |
| Reused / cancelled nonce | cancelled nonce leaves no Relic and does not register the Relic id; pre-cancelling an unissued nonce blocks a later voucher. |
| Failed mint | wrong caller reverts without using the nonce or creating the Relic; the right caller can still mint. |
| Repeat mints | same Relic id minted twice with different nonces gives balance 2. |
| Admin | ownership transfer moves the admin rights; interface support (ERC-1155, ERC-165, unknown id). |
| Market wrong price | zero, one wei under and one wei over all revert and leave listing, escrow and market balance untouched. |
| Cancel by non-seller | reverts, listing intact. |
| Refund paths | a buyer that cannot receive ERC-1155 reverts the whole buy and keeps its AVAX; seller buying their own listing nets zero. |
| Unsolicited transfers | an approved operator cannot push a Relic into the market; both receiver hooks revert when called directly. |
| Listing set | removing a middle listing keeps the others buyable; paging edge cases (limit 0, offset = total, huge offset); a new listing after a buy gets a new id. |

Already covered before this change (not repeated): wrong signer, malformed/high-s/compact signatures, other-chain and second-instance replay, signer rotation, reentrancy by seller and buyer, seller that rejects AVAX, fuzz tests for exact payment, replay and expiry boundary.

Results: `forge test --offline` passes (83 tests, none skipped). No contract bug was found by the new tests.

Related: [relic recovery proposal](proposals/relic-recovery.md) describes one design gap that is not a contract bug: the server treats `usedNonces` as "minted", and `cancelNonce` also sets it.
