# On-chain end-to-end test (live, Fuji) - 2026-10-31

Throwaway wallet `0x91D3fbE33D83BfC4104405ed0AfC243a3ef7D203` (key not stored anywhere); buyer wallet `0x65585Db6cA3749bCD393600AFc522ce94C89D342` (generated in-process, discarded). Public endpoints and contracts only, as a normal player. Live v1 flow (VITE_GAME_V2 not flipped).

## Result: all steps passed

| Step | Result |
|---|---|
| SIWE: auth-nonce, auth-verify | 200, returns token, playerId, wallet, expiresAt |
| game-state | 200 (account already had shards/gold; no live data edited) |
| relic-forge | 200, voucher relicId 1, common, nonce 4; shards 1093 -> 1063 (30 paid) |
| relic-forge again | 200, same pending voucher (idempotent) |
| RelicNFT.mint(voucher) | success, tx `0xd669e64c50fb24f8411f94bfdf44e01d3ade5549b4b127f84ebc32cd36dba9b0` (block 60283768) |
| relic-mint-report | 200, forge.today.minted=true, blockedBy daily_limit; replay of same report 200 (idempotent) |
| setApprovalForAll(market) | success `0x9039e7f7584389ca1cf8c4b1093d81f2fa1d6339e8a425020f9125e2deee00ec` |
| RelicMarket.list(1, 1, 0.01 AVAX) | success `0xce5d59ee8cdd7af9e5567dc3e7b43babccaa25a8f2430dd983103a65e887f1f9`, listing id 3 |
| Fund buyer 0.05 AVAX | `0xce8ccbaa9021849dd0a456fefc1f0084db4df49e10d167d1f019e4b1967f89de` |
| RelicMarket.buy(3) by buyer | success `0x90588c0023e88a2f445f8a61d796c099430a5fc9c0774e3390d14a097dcc6c1a`; balanceOf: buyer 1, seller 0 |
| Buyer returned leftover AVAX | `0xdd2ad9a98b0aea3dfdd48caa8f6e64e65e5d9ab3eeb76f79006f7fcdc0c1720e` |
| Routescan | mint tx status true (`mint(...)`), buy tx status true (`buy(uint256) payable`) |
| scripts/fuji-proof.mjs | ran OK ("On-chain proof verification complete"); needs workspace deps installed (it resolves viem from apps/web) |

## Abuse paths

| Attempt | Response |
|---|---|
| mint with another wallet's voucher | contract revert (simulation) |
| mint with tampered rarity | contract revert |
| mint replay after success | contract revert |
| relic-mint-report with other player's token | 404 `{"error":"not_found"}` |
| relic-mint-report with unknown txHash | 409 `{"error":"mint_not_confirmed"}` |
| buy with price - 1 wei | contract revert |
| game-state without token / bad token | 401 `{"error":"unauthenticated"}` |
| Rate limit | NOT triggered: no 429 in 90 sequential game-state calls or 60 auth-nonce calls. No limiter observed at these volumes (finding; may be intentional or limited at platform level). |

## Notes
- The account already held earlier forges (relic #2, listing #2 visible in fuji-proof), so it was not a fresh account.
- Relic #1 now sits in the buyer wallet; the test relic was a Common.
