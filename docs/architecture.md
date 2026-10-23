# Architecture

## Layout
- `apps/web`: Vite + React + TS client; the game strip fixed to the bottom of the page.
- `packages/game-rules`: pure TS game rules shared by client and server.
- `packages/chain`: chain constants and contract addresses (Fuji, 43113).
- `contracts`: Foundry project (RelicNFT, RelicMarket).
- `supabase`: migrations and Edge Functions.

## On-chain vs off-chain
- Off-chain (Supabase, server decides): gold, gear, shards, Boss Key.
- On-chain (Avalanche Fuji): Relic NFTs (ERC-1155) minted with a server-signed EIP-712 voucher, and the Relic market. There is no token.

## Wallet

`apps/web/src/wallet/` holds wallet connect and sign-in. It uses wagmi v2 with viem and TanStack Query, with only the injected connector (Core Wallet or MetaMask), on Avalanche Fuji (`avalancheFuji` from `viem/chains`, chain id 43113). The RPC comes from `VITE_FUJI_RPC_URL` and falls back to the public one. `WalletProvider` wraps the app and `WalletButton` sits on the strip: "Connect wallet", then short address + "Sign in", then a signed-in badge. On the wrong network it shows a message and a "Switch to Fuji" button. With no injected wallet it links to https://core.app.

Sign-in goes through the `AuthApi` interface (`getNonce`, `verify`). `createHttpAuthApi` calls `{VITE_SUPABASE_URL}/functions/v1/auth-nonce` and `auth-verify`; `createMockAuthApi` works offline and is used when `VITE_SUPABASE_URL` is unset. The client builds an EIP-4361 message (`siwe.ts`: domain = `window.location.host`, uri = origin, chain 43113, 10 minute expiry), signs it with the wallet and sends `{message, signature}` to verify. The returned `{token, playerId, wallet}` becomes the session (`session.ts`), kept in memory and mirrored to `sessionStorage` (storage errors are ignored). Expiry is read from the JWT `exp` claim, or defaults to 1 hour. Disconnecting, or switching to a different account, clears the session.
