# Architecture

## Layout
- `apps/web`: Vite + React + TS client; the game strip fixed to the bottom of the page.
- `packages/game-rules`: pure TS game rules shared by client and server.
- `packages/chain`: chain constants and contract addresses (Fuji, 43113).
- `packages/auth`: wallet sign-in (SIWE) logic used by the auth Edge Functions; see `docs/auth.md`.
- `contracts`: Foundry project (RelicNFT, RelicMarket).
- `supabase`: migrations and Edge Functions.

## On-chain vs off-chain
- Off-chain (Supabase, server decides): gold, gear, shards, Boss Key.
- On-chain (Avalanche Fuji): Relic NFTs (ERC-1155) minted with a server-signed EIP-712 voucher, and the Relic market. There is no token.
