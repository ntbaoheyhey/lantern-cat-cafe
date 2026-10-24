# Contest submission kit

Ready-to-paste text for the Avalanche Team1 Vietnam UniHack 2026 submission. Every claim below comes from `README.md`, `docs/*` or the confirmed Fuji deployment, and is true on `main`.

> **Before submitting**
> - **Deadline and platform: TBD, confirm with organizers.** Do not paste a date from here.
> - **The repository is private.** Make it public (or add the organizers as collaborators if the rules allow) before submitting, then check the link below opens while signed out.
> - Re-check the live URL and both contract links the day you submit.

## Project name

Taskbar Hero

## One-line pitch

An idle RPG that lives in a thin strip at the bottom of a web page, where everyday progress is free and off-chain and the rare Relics you forge are real ERC-1155 NFTs on Avalanche Fuji that you can trade.

## Pitch (one paragraph)

Taskbar Hero is a cozy idle RPG that sits in a strip at the bottom of a web page, like a game on your taskbar. Mochi the cat fights on its own while you work; you claim Fish (gold), Yarn (shards) and gear drops, upgrade gear, and beat a daily boss for a Cat Key. Spend 30 Yarn and one Cat Key to forge a collectible Relic: the server signs a voucher, your wallet mints it on Avalanche Fuji, and you can list it on a fixed-price market for test AVAX. Gameplay stays fast and free of gas; only the things worth owning go on-chain. There is no fungible token.

## Problem and solution

**Problem.** Blockchain games often put every action on-chain, which makes them slow and costly to play, or they add a token whose price matters more than the game.

**Solution.** Taskbar Hero keeps fast, frequent progress off-chain and decided by the server (gold, gear, shards, Boss Keys), so it cannot be forged from the browser. Only the rare, collectible outcome, the Relic, becomes an NFT. The server proves a forge was earned by signing an EIP-712 voucher; the player's wallet submits it and pays only test-AVAX gas for the mint. Relics then trade peer to peer in an escrow market. The game is low-attention by design, so it fits next to your real work.

## How it uses Avalanche

- **Network:** Avalanche Fuji testnet, chain ID 43113. Test AVAX only; no mainnet, no custom L1.
- **RelicNFT (ERC-1155):** one token id per rarity (Common, Rare, Epic, Legendary). Mints require a valid voucher.
- **Server-signed EIP-712 vouchers:** the voucher binds player, Relic ID, rarity, nonce and expiry to this chain and contract. RelicNFT checks the signer, the caller, expiry, that the nonce is unused, and that rarity matches the Relic ID, then mints one copy. Expired vouchers are re-signed with a new nonce only after the server confirms on-chain that the old nonce was not used, so one paid forge can never mint twice.
- **RelicMarket:** fixed-price, escrow-based listings in test AVAX. No fees, no token, no owner.
- **Reconciliation:** after minting, the client reports the transaction hash; the server reads the receipt on Fuji and accepts it only if RelicNFT emitted a matching `RelicForged` event for that voucher. The chain is the source of truth for ownership.

Details: `docs/contracts.md`, `docs/api.md`.

## Tech stack

- Client: Vite, React 19, TypeScript, Phaser 3 (the strip), wagmi 2 and viem 2 (injected wallets), react-query.
- Backend: Supabase (Postgres with row-level security, Edge Functions on Deno), wallet sign-in with SIWE and a session JWT.
- Shared rules: `packages/game-rules`, deterministic TypeScript used by both client (prediction) and server (truth); seeds are HMACs the client cannot predict.
- Contracts: Solidity, Foundry, OpenZeppelin v5.
- Hosting: Vercel (web), Supabase free tier (backend). Tests: Vitest, PGlite (in-process Postgres), Foundry, Playwright; CI on GitHub Actions.

## Links

| What | Link |
| --- | --- |
| Live demo | https://web-zeta-tan-13.vercel.app |
| Repository | https://github.com/ntbaoheyhey/taskbar-hero (**private now; must be made public before submitting**) |
| RelicNFT (ERC-1155) | [`0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`](https://testnet.routescan.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D) |
| RelicMarket | [`0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`](https://testnet.routescan.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93) |

Both contracts are on Fuji (43113). The Routescan links are used because Snowtrace is not reachable from our build environment; Snowtrace links for the same addresses are in the README.

## Try it in 2 minutes

1. Open the live demo in **Chrome, Brave or Edge** (wallet extensions do not work in Safari).
2. Read the short "How to play" card, then watch Mochi fight in the bottom strip.
3. Open the menu and look at Inventory and Boss to see gear, upgrades and the daily boss.
4. To play for real, connect an injected wallet such as Core or MetaMask, switch to Avalanche Fuji, and sign in. You need a little Fuji test AVAX for gas (from a public faucet).
5. Claim, upgrade, win the boss for a Cat Key, then Forge (30 Yarn + 1 Cat Key, once per day) and approve the mint in your wallet.
6. Open Market to see your Relic and list it for test AVAX.

Without a wallet you can still see the game, but claims, the Forge and the Market need sign-in. Running locally without Supabase config uses a mock backend that does not mint (see the README).

## What is honestly not done

- **Testnet only.** Fuji and test AVAX. No mainnet deployment, no audit of the contracts or backend.
- **No rate limiting.** There is no per-IP limiter on the public endpoints (`docs/auth.md`, "Known limits"); the free Supabase tier has none built in. Server rules still stop duplicate or concurrent requests from double-paying.
- **Wallet support is narrow.** Injected wallets on desktop Chrome, Brave and Edge only. No Safari, no mobile wallet connection (WalletConnect is a possible later addition).
- **Market needs a wallet.** Browsing the Relic market requires connecting one; there is no read-only view.
- **Placeholder art.** The strip uses pixel art drawn at runtime; there is no commissioned art, music or sound.
- **Small content set.** One boss line, four gear slots, four Relic rarities. Game numbers were tuned by simulation and signed off by the project owner, not by a large playtest.
- **Known browser QA findings.** The remaining open items from the Round 2 browser QA are listed in `docs/qa-report-2.md` (for example, the tab bar overflowing on very narrow phones).

## Team

Built solo for the hackathon, with AI coding assistants. Third-party art and code are credited in the README; project code is MIT licensed.
