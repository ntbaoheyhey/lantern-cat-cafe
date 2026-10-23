# Deploying the contracts

`contracts/script/Deploy.s.sol` deploys `RelicNFT` and `RelicMarket` and writes their addresses to
`packages/chain/deployments/<chainId>.json`, which `getAddresses(chainId)` in `@taskbar-hero/chain`
reads. The RelicNFT owner is the deployer wallet.

| Env var | What |
| --- | --- |
| `DEPLOYER_PRIVATE_KEY` | Key of a fresh, testnet-only wallet. Never a wallet that holds real funds. |
| `VOUCHER_SIGNER_ADDRESS` | Public address of the server's voucher key (`VOUCHER_SIGNER_PRIVATE_KEY`). |
| `RELIC_BASE_URI` | ERC-1155 metadata URI with `{id}`, e.g. `https://<app>/relics/{id}.json`. Owner can change it later with `setURI`. |

## Local (anvil)

```sh
anvil   # in another terminal
cd contracts
DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
VOUCHER_SIGNER_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
RELIC_BASE_URI='https://relics.example/{id}.json' \
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

The key above is anvil's public default account #0. The result must equal the committed
`packages/chain/deployments/31337.json` (`forge test` checks the same thing in-process).

## Avalanche Fuji (chain 43113)

Run this on your own machine, not in CI or a shared sandbox.

1. Make a new wallet only for this: `cast wallet new`. Save the private key in a password manager.
2. Fund it from the Fuji faucet: https://core.app/tools/testnet-faucet/?subnet=c&token=c
   (deploying both contracts costs well under 1 test AVAX).
3. Put the values in `contracts/.env` (git-ignored, never commit it):

   ```sh
   DEPLOYER_PRIVATE_KEY=0x...
   VOUCHER_SIGNER_ADDRESS=0x...
   RELIC_BASE_URI=https://.../relics/{id}.json
   ```

4. Deploy and verify:

   ```sh
   cd contracts
   set -a; source .env; set +a
   forge script script/Deploy.s.sol \
     --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
     --broadcast \
     --verify \
     --verifier-url 'https://api.routescan.io/v2/network/testnet/evm/43113/etherscan' \
     --etherscan-api-key verifyContract
   ```

   Routescan (which powers testnet.snowtrace.io) accepts any placeholder API key. If verification
   times out, rerun the same command with `--resume` instead of `--broadcast`.

5. Check:

   ```sh
   cast call <RelicNFT> 'signer()(address)' --rpc-url https://api.avax-test.network/ext/bc/C/rpc
   cast call <RelicMarket> 'relicNFT()(address)' --rpc-url https://api.avax-test.network/ext/bc/C/rpc
   ```

   Both contracts should show "Verified" on https://testnet.snowtrace.io/address/<address>.

6. Commit `packages/chain/deployments/43113.json` (only addresses, no secrets) and open a PR.
   Do not commit `contracts/broadcast/` or `contracts/cache/`.

## Regenerating ABIs

After changing a contract: `cd contracts && forge build`, then `pnpm --filter @taskbar-hero/chain gen`.
CI fails if `packages/chain/src/abi.ts` does not match `contracts/out`.
