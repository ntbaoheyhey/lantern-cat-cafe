# CHAIN inbox

User deployment addresses and coordinator notes go here.

## User deployment — 2026-11-12

User broadcast `DeployChainV2.s.sol` on Avalanche Fuji C-Chain (43113). Codex verified all three public receipts have status `0x1`, matching contract addresses, and non-empty on-chain code using the public Fuji RPC. Codex performed read-only RPC calls; the user signed and broadcast the deployments.

| Contract | Address | Deployment transaction | Block |
| --- | --- | --- | --- |
| YarnToken | `0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b` | [0x42cdaa…](https://testnet.snowtrace.io/tx/0x42cdaae9a91984232225e6b9a57ce22447cae526703ad17eadc6e0ce8bc3a049) | 60931271 |
| RelicMarketV2 | `0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4` | [0x714678…](https://testnet.snowtrace.io/tx/0x71467887c6e95a167e1a3cf4bf6f56c82eb3e4c7e69f5ded4e1aa49bcb7207ef) | 60931272 |
| SeasonRewards | `0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11` | [0x341ca4…](https://testnet.snowtrace.io/tx/0x341ca4480e2e0bb39386d0eac3426c49a44c34d8144332dbdc4c14af569167d9) | 60931272 |

Verified configuration: distributor/deployer/rewards owner `0x91D3fbE33D83BfC4104405ed0AfC243a3ef7D203`; treasury `0x2Bba9a48F7F79d99154108A28d32f1a21d17055c`; voucher signer `0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000`; market fee 500 bps; rewards epoch `1794182400`; weekly cap 32 YARN. Market and rewards both reference the deployed YarnToken.

At deployment verification: total supply and distributor balance were each 1,000,000,000 YARN; SeasonRewards balance was 0 YARN. All tokens are testnet only, with no real value.

Funding completed by the user with `tools/chain/fund-rewards.mjs --run`: [transaction 0xa47048…](https://testnet.snowtrace.io/tx/0xa47048d43301503148e8b0babf1f5794692cd2d06d9487358d86c6e951642fae), block 60931514. Codex verified chain ID 43113, receipt status `0x1`, sender matching the distributor, destination matching YarnToken, and a SeasonRewards token balance of `10000000000000000000000` base units (10,000 YARN) using read-only RPC calls.

Supabase setup: the user pasted SQL Editor results `Success. No rows returned` after running each of `20261112010000_guest_drip.sql`, `20261112020000_chain_judge.sql`, and `20261112030000_chain_items.sql`. All three migrations are complete according to the supplied results; Codex has not independently queried the remote schema. The user confirmed saving `FUJI_RPC_URL`, `YARN_TOKEN_ADDRESS`, and `SEASON_REWARDS_ADDRESS` in project `qoalewtxflagoprrxrgh`. Read-only CLI inventory confirms these names exist; their stored values were not read.

Read-only CLI inventory before flag setup confirmed `VOUCHER_SIGNER_PRIVATE_KEY` and the supported fallback `AUTH_JWT_SECRET` exist; `SPONSOR_PRIVATE_KEY` and the four demo flags were absent. The user has since confirmed saving `CHAIN_ITEMS_ENABLED=1` and `CHAIN_YARN_ENABLED=1`. Public Fuji RPC recheck shows the existing voucher signer/default sponsor `0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000` still has 0 AVAX. The three functions `guest-drip`, `chain-judge`, and `chain-items` were absent in the last remote inventory. No secret values were read or printed.

Funding preparation: the user confirmed claiming from [Avalanche's official faucet](https://build.avax.network/console/primary-network/faucet). Read-only Fuji RPC confirms distributor `0x91D3fbE33D83BfC4104405ed0AfC243a3ef7D203` now holds `0.924999998138182058` AVAX, an increase of 0.5 AVAX from the previous reading. Treasury `0x2Bba9a48F7F79d99154108A28d32f1a21d17055c` remains at `0.57499999978920712` AVAX; default sponsor remains at 0 AVAX. The faucet transaction hash was not supplied or independently located.

First sponsor transfer: the user confirmed completion. Read-only public Fuji RPC verified chain ID 43113 and sponsor balance exactly `0.8` AVAX; the latest block observed in that query batch was `60932590`. Distributor balance is `0.124999998138245058` AVAX and treasury balance is `0.57499999978920712` AVAX. This verifies the sponsor balance increase; the transfer hash was not supplied or independently located. Codex has not signed or broadcast anything.

Second sponsor transfer: the user confirmed completion. Read-only public Fuji RPC verified chain ID 43113, sponsor balance exactly `1.2` AVAX, and treasury balance `0.17499999978927012` AVAX; the latest block observed in that query batch was `60932673`. This verifies the additional 0.4 AVAX balance increase; the transfer hash was not supplied or independently located. Both funding steps are complete. Codex has not signed or broadcast anything.

Current secret-name inventory confirms `GUEST_DRIP_ENABLED`, `CHAIN_JUDGE_ENABLED`, and `SPONSOR_PRIVATE_KEY` are absent; `CHAIN_ITEMS_ENABLED`, `CHAIN_YARN_ENABLED`, and `VOUCHER_SIGNER_PRIVATE_KEY` are present. No stored secret values were read. Guest drip/judge remain disabled while gateway trust is unresolved.

Guest drip deployment completed by the user: supplied CLI output reports `Deployed Functions on project qoalewtxflagoprrxrgh: guest-drip`. Independent read-only CLI inventory confirms `guest-drip` ACTIVE, version 1, `verify_jwt=false`; `chain-judge` and `chain-items` remain absent. A public GET to `/functions/v1/guest-drip` returns HTTP 405 with `{"error":"method_not_allowed"}`, matching the handler and confirming it boots. This is not an authenticated drip or transaction test. No deployment was performed by Codex.

Chain judge deployment completed by the user: supplied CLI output reports `Deployed Functions on project qoalewtxflagoprrxrgh: chain-judge`. Independent read-only CLI inventory confirms both `guest-drip` and `chain-judge` ACTIVE, version 1, `verify_jwt=false`; `chain-items` remains absent. A public GET to `/functions/v1/chain-judge` returns HTTP 405 with `{"error":"method_not_allowed"}`, matching the handler and confirming it boots. This is not an authenticated judge-pass or voucher test. No deployment was performed by Codex.

Chain items deployment completed by the user: supplied CLI output reports `Deployed Functions on project qoalewtxflagoprrxrgh: chain-items`. Independent read-only CLI inventory confirms all three functions ACTIVE, version 1, `verify_jwt=false`. Public GET to `/functions/v1/chain-items` returns HTTP 405 with `{"error":"method_not_allowed"}`, matching the handler and confirming it boots. This is not an authenticated inventory, seal, or YARN claim test. No deployment was performed by Codex.

Remaining Terminal phases are frontend environment/build, flag activation after the trusted-gateway prerequisite, public smoke after matching demo-origin setup, and bot listings after inventory funding. Provide them in grouped command blocks, without requesting completion after every command. Build preparation can proceed independently. Do not enable drip/judge until the gateway prerequisite is resolved. Current name inventory still shows the two flags absent. SIWE domain/origin names exist; comparing their digests against public candidate hosts from documentation did not identify the configured values. No stored secret values were read; do not guess the domain or overwrite the existing live auth configuration.

Guest drip/judge remain disabled by their default flag checks. Before enabling them, resolve sponsor funding and the trusted gateway prerequisite in USER-DEPLOY-VI.md; a drip reservation must leave at least 1 AVAX after the 0.05 AVAX grant, fees, and other reservations. Keep the configured reserve requirement. Function deployment remains a user action.

Guidance preference UPDATED by the user: group all related Terminal commands in one response; do not send individual commands in separate turns or require "xong" after each command. The clarification concerns Terminal commands; it does not authorize Codex to broadcast transactions or deploy remotely.

## Fuji smoke stopped at tester reward — 2026-11-12

User created seller 0x4628EA0f3F9F6B146fFFA9AaA0f636B24DBD1134 and buyer 0x39732360425f8f488048EEEB57fF046CE8AC794E. Public report records FAIL at SeasonRewards.claimTester at 06:53:14 UTC. Read-only RPC confirmed both recorded drip receipts have status 0x1 and the intended recipients. The rewards contract exposes the tester claim type hash, seller testerClaimed=false, seller YARN=0, currentSeason=0, expected signer, and 10,000 YARN pool. Public-setting digest comparisons match the configured rewards/token/RPC. These checks do not establish the claim failure cause.

Added tools/chain/diagnose-rewards.mjs: user-run existing-wallet authentication and reward retrieval, signature-type recovery, eth_call simulation and gas estimate; no public writes to the blockchain or fresh drip/judge grants. Prints only public diagnostics and fixed error categories, writes REWARD-DIAGNOSTIC.json, preserves FUJI-SMOKE.md. Three signature/redaction tests and full local diagnostic passed. Await user execution with keys that remain in their Terminal; do not read or request those keys.

## Public Fuji smoke PASS — 2026-11-12 07:11 UTC

User reran the corrected smoke with the same seller and buyer. `FUJI-SMOKE.md` records PASS at 2026-11-12T07:11:11.843Z and 18 confirmed transactions, ending at `RelicMarketV2.withdraw`. Codex independently read chain ID 43113 and verified all 18 report hashes have receipt status `0x1`. This includes the two previously completed drips, both tester rewards, mint/approval, AVAX sale/withdrawal, cancellation, seal/mint, YARN sale and withdrawal. All signing and public transactions were performed by the user.

The signing repair preserves the local account when submitting simulation requests; locked local RPC reproduced the original failure and passed after repair. These wallets have now used their tester claims; do not rerun the complete fresh-wallet smoke on them. Public frontend and bot-listing readiness remain separate steps. No Vercel link file exists in this worktree or apps/web and no global Vercel command was found. Next guided Terminal block is Vercel login/link to the existing project serving taskbarhero-eight.vercel.app, then inspect project settings before deployment instructions.
