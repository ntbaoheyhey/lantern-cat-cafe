# Contest submission kit

Ready-to-paste text for the Avalanche Team1 Vietnam UniHack 2026 submission. Every claim below comes from `README.md`, the files in `docs/` or the confirmed Fuji deployment, and is true on `main`.

> **Before submitting**
> - **Deadline and platform:** TODO: [Owner to confirm deadline and submission portal with organizers]. Do not paste a date from here until confirmed.
> - **The repository is private.** Make it public (or add the organizers as collaborators if the rules allow) before submitting, then check the link below opens while signed out.
> - Re-check the live URL and both contract links the day you submit.

## Project name

Taskbar Hero (Cat RPG v2 — Cat Café Quest)

## One-line pitch

A cozy ambient idle RPG living in a responsive web app (with desktop stage and classic taskbar strip modes) where everyday progress is gas-free and server-authoritative, and rare Relics forged from boss victories are real ERC-1155 NFTs on Avalanche Fuji traded in an escrow marketplace.

## Pitch (one paragraph)

Taskbar Hero is a cozy ambient idle RPG designed to run quietly in your browser while you work. Your feline hero—chosen from 7 distinct classes—battles passively through 5 household chapters (from the Living Room to Night Rooftops), auto-claiming Fish (gold), Yarn (shards), and crafting materials every 30 seconds. Players optimize gear across 9 equipment slots, use instant bulk equipping, craft custom equipment across 5 rarity tiers, and battle telegraphed chapter bosses using Cat Keys. Beating a chapter boss awards a prized Moon Pearl; combine 30 Yarn and 1 Moon Pearl to forge a daily collectible Relic. The server cryptographically signs an EIP-712 voucher, your wallet mints the ERC-1155 NFT on Avalanche Fuji for negligible testnet gas, and you can list it on a zero-fee escrow market for test AVAX. Gameplay stays fast, fluid, and free of transaction fatigue; only durable, earned accomplishments go on-chain. There is no speculative fungible token.

## Problem and solution

**Problem.** Blockchain games frequently make one of two fatal design mistakes: they put every high-frequency micro-action on-chain, burdening players with wallet popups, latency, and gas costs; or they introduce hyper-inflationary fungible tokens whose volatile prices destroy the fun and make the game unsustainable.

**Solution.** Taskbar Hero separates fast everyday progression from durable digital ownership. High-frequency loops (idle combat, drops, currency gains, bag management, crafting, and boss encounters) run off-chain with deterministic server authority in Supabase Edge Functions, preventing browser cheats with HMAC-derived seeds without charging gas. Only rare, milestone outcomes—the Relics—become on-chain NFTs. The backend issues a cryptographically signed EIP-712 voucher verifying that a player earned their daily forge; the player's wallet submits the voucher to the `RelicNFT` contract on Avalanche Fuji and pays only test-AVAX gas. Players can then trade Relics peer to peer in an autonomous, zero-fee escrow contract (`RelicMarket`). The ambient, low-attention format allows players to progress peacefully during the workday without financial anxiety.

## What is on-chain vs. what is off-chain

- **On-chain (Avalanche Fuji testnet, Chain ID 43113):**
  - **RelicNFT (ERC-1155):** Contract [`0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`](https://testnet.routescan.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D). One token ID per rarity tier (Common, Rare, Epic, Legendary). Minting requires an authentic server-signed EIP-712 voucher.
  - **Server-signed EIP-712 vouchers:** Vouchers cryptographically bind caller address, Relic ID, rarity tier, unique nonce, and expiration timestamp to the Fuji chain ID and `RelicNFT` contract address. `RelicNFT` validates the ECDSA signature, caller, expiry, rarity match, and ensures each nonce is used exactly once. Reissuing an expired voucher requires on-chain verification that the previous nonce remained unused, preventing double-minting.
  - **RelicMarket (Escrow Marketplace):** Contract [`0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`](https://testnet.routescan.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93). Autonomous fixed-price listings in test AVAX. Follows checks-effects-interactions, charges zero platform fees, requires no native token, and has no admin or owner keys.
  - **Reconciliation:** When a mint transaction completes, the client posts the transaction hash to the server. The backend queries the Avalanche Fuji receipt, verifies the emitted `RelicForged` event against the voucher, and registers the mint. The blockchain remains the absolute source of truth for Relic ownership.

- **Off-chain (Server-authoritative backend & client simulation):**
  - **Game State & Currencies:** Player level, XP, Fish (gold), Yarn (shards), Cat Keys, crafting tier materials (Fluff Tuft, Shiny Button, Catnip Crystal, Starlight Scale), and Moon Pearls are tracked off-chain in Supabase Postgres with Row-Level Security (RLS).
  - **Combat & Progression Rules:** Shared deterministic TypeScript engine (`packages/game-rules`) runs on both client (for smooth zero-latency rendering) and Supabase Edge Functions on Deno (for server verification). Random rolls derive from secret HMAC seeds that browser clients cannot predict.
  - **Inventory & Crafting:** 200-slot bag, equipment stat calculation, item locks, bulk "Equip best" algorithms, item salvaging (~25% material recovery), and deterministic Forge crafting are computed off-chain.
  - **Boss Battles & Cooldowns:** Chapter boss gates, Cat Key consumption upon victory, 60-second loss cooldowns, and First-Clear Chest reward generation run under strict server authority.

## Tech stack

- **Frontend:** Vite 8, React 19, TypeScript 5.9, HTML5 canvas stage layout with custom sprite/pixel-art rendering, optional classic taskbar strip view powered by Phaser 3.90, Wagmi 2 and Viem 2 (injected browser wallets: Core, MetaMask), and TanStack React Query.
- **Backend:** Supabase (Postgres with Row-Level Security, Edge Functions running on Deno), wallet authentication with Sign-In with Ethereum (SIWE, ERC-4361) and signed session JWTs.
- **Shared Game Rules:** `packages/game-rules`, a unified deterministic TypeScript package ensuring 100% logic alignment between client prediction and server truth.
- **Smart Contracts:** Solidity 0.8.24, OpenZeppelin Contracts v5, Foundry test & deployment framework.
- **Infrastructure & Testing:** Vercel (web hosting), Vitest (unit & integration tests), PGlite (in-memory Postgres testing), Playwright (end-to-end browser testing with Chromium), and GitHub Actions CI.

## What works today

- **Stage-first v2 UI:** Responsive desktop stage layout (1600x900, 1280x720) with live canvas combat, rich HUD bar, character equipment view, tabbed panels, and mobile drawer/bottom-sheet navigation (390x844).
- **7 Hero Classes:** Warrior, Guardian, Rogue, Hunter, Archer, Witch, and Alchemist—each with unique base stat traits, weapon type proficiencies, starter gear, and combat passives (Cleave, Bonk, Twin Strike, Mark Prey, Volley, Burn, Poison).
- **5 World Chapters:** Chapter 1 (Living Room), Chapter 2 (Kitchen), Chapter 3 (Bathroom), Chapter 4 (Basement), and Chapter 5 (Night Rooftops). 10 rounds per chapter with 6 monster kills per round and elite mini-bosses.
- **9 Equipment Slots:** 5 main gear slots (Weapon, Helmet, Armor, Gloves, Boots) and 4 accessory slots (Collar, Earring, Ring, Charm) unlocking at Levels 5, 10, and 20.
- **Smart Bag & Equip Best:** 200-slot bag with rarity coloring, stat comparison deltas, sorting, item locking, and one-click "Equip best" loadout optimization.
- **The Forge Workshop:** Deterministic gear crafting across 5 rarities, item salvaging for material reclamation, and daily Relic milestone forging.
- **Boss Climax Battles:** 5 distinct chapter bosses (Yarn Giant, Cucumber Scare, Bathtub Tyrant, Vacuum Beast, Laser Dot Phantom) with telegraphed auto-attacks and heavy slams. Winning requires 1 Cat Key (consumed only on win) and unlocks First-Clear Chests containing guaranteed Moon Pearls.
- **Zero-Config Demo Mode:** Complete local sandbox powered by `MockGameApiV2` in browser `localStorage`, letting anyone test the full 5-chapter game loop instantly without a wallet or gas.
- **Live Avalanche Fuji Integration:** Injected wallet connection, EIP-712 voucher verification, ERC-1155 Relic minting on Fuji, and decentralized trading on RelicMarket.

## What is demo-only

- **Mock Game API:** When visiting the static demo without Supabase backend credentials or without an active wallet sign-in, the application runs entirely in browser memory and `localStorage` (`taskbar-hero:v2-demo:1`). All chapters, classes, items, crafting recipes, and boss fights function locally.
- **Simulated Relic Vouchers:** In demo mode without a connected Fuji wallet, clicking "Forge Relic" demonstrates the voucher generation check and prompts the player to connect a wallet for on-chain minting. Actual minting and marketplace transactions execute on Avalanche Fuji once a wallet is connected.

## Why this is interesting (one paragraph)

Taskbar Hero demonstrates a viable, sustainable architecture for Web3 gaming by respecting players' time, wallets, and attention. Rather than financializing every minute of gameplay with inflationary micro-tokens or burdening casual players with gas fees for every sword swing, it treats blockchain technology as an achievement and ownership layer. Fast-paced, server-authoritative idle progression happens gas-free in the background while players focus on work. When players achieve major milestones—vanquishing difficult chapter bosses and assembling rare ingredients—they earn cryptographically provable vouchers that materialize into durable digital collectibles on Avalanche Fuji. This hybrid model delivers the instant gratification and low friction of traditional ambient web gaming, combined with the genuine digital property rights and trustless trading of Ethereum-compatible smart contracts.

## Links

| What | Link | Notes |
| :--- | :--- | :--- |
| Live Demo | TODO: [Owner to provide final live production URL, e.g. https://web-zeta-tan-13.vercel.app] | Open in Chrome, Brave, or Edge |
| Pitch Video | TODO: [Owner to insert 2-3 minute YouTube/Loom demo video URL] | Walkthrough matching demo script |
| Repository | [https://github.com/ntbaoheyhey/taskbar-hero](https://github.com/ntbaoheyhey/taskbar-hero) | **Make public or share with judges before deadline** |
| RelicNFT (ERC-1155) | [`0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`](https://testnet.routescan.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D) | Verified on Avalanche Fuji (43113) |
| RelicMarket (Escrow) | [`0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`](https://testnet.routescan.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93) | Zero-fee escrow market on Fuji |
| Snowtrace Explorer | [Snowtrace RelicNFT](https://testnet.snowtrace.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D) | Backup block explorer |

## Try it in 2 minutes (Judge Quickstart)

1. Open the demo link in **Chrome, Brave, or Edge**.
2. Dismiss the "How to play" welcome card and choose a hero class (e.g. **Warrior**).
3. Watch your cat hero battle ambiently across Chapter 1 in the large pixel-art stage.
4. Click **Inventory** to inspect your 200-slot bag, check item stat deltas, and click **Equip best**.
5. Switch to **Forge** to see deterministic crafting and the daily Relic milestone recipe (30 Yarn + 1 Moon Pearl).
6. Switch to **Boss** to inspect the 5-chapter World Map and challenge the Yarn Giant. Win to open the First-Clear Chest and claim your Moon Pearl!
7. *(Optional)* Connect Core or MetaMask on Avalanche Fuji with test AVAX to mint your forged Relic NFT and trade it on RelicMarket.

## What is honestly not done

- **Testnet only:** All contracts run on Avalanche Fuji (Chain ID 43113) with test AVAX. No mainnet deployment has been performed, and contracts have not undergone a formal third-party security audit.
- **No live server IP rate limiting:** The free Supabase tier lacks edge IP rate limiting. While server-side idempotency, nonces, and database transaction locks prevent double-spend and duplicate claims, a high-volume DDoS could impact backend responsiveness.
- **Injected desktop wallets only:** Wallet connectivity relies on desktop browser extensions (Core, MetaMask, Brave). Mobile wallet adapters (WalletConnect) and Safari desktop extension bridges are planned for future waves.
- **Marketplace requires a wallet:** Browsing RelicMarket listings currently requires connecting an Avalanche wallet; there is no unauthenticated read-only market browser.
- **Art & Audio:** Visuals use clean procedurally rendered pixel art, SVGs, and sprite canvases created for the hackathon; audio, music, and voice acting are not yet implemented.
- **Content Scope:** 5 quest chapters, 5 bosses, 7 feline classes, 5 crafting tiers, and 4 Relic rarities. Numbers were calibrated via automated simulation scripts rather than large-scale multiplayer beta testing.

## Team

Built solo for the hackathon, assisted by agentic AI coding tools. Third-party pixel art and libraries are credited in `README.md`; project code is MIT licensed.
