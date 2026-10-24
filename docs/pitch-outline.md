# Taskbar Hero — Pitch Slide Outline

A 7-slide outline for a 3-minute pitch to the **Avalanche Team1 Vietnam UniHack 2026** judges.

- **Pacing**: ~25 seconds per slide (Demo: ~45s).
- **Core Theme**: Cat Café Quest — cozy dusk pixel art, off-chain ambient idle RPG, gas-free gameplay, and true digital collectibles on Avalanche Fuji without speculative fungible tokens.
- **Live Demo**: [https://web-zeta-tan-13.vercel.app](https://web-zeta-tan-13.vercel.app)

---

## Slide 1: Problem (~20s)

### Headline
Most Web3 games force every micro-action on-chain or revolve around volatile tokens, creating high friction and financial stress instead of casual fun.

### Key Points
- **Friction kills casual play**: Paying gas fees, waiting for block confirmations, and approving frequent wallet popups ruin the pacing of casual and idle games.
- **Token distraction**: Speculative fungible tokens overshadow core game loops, inviting hyper-financialization and rapid economy collapses.
- **Unmet ambient niche**: Modern desktop users want low-attention, ambient games that run quietly alongside work without demanding active focus or upfront investment.

### Show on screen
A split comparison graphic: on the left, an overcrowded Web3 screen with repetitive wallet approval prompts and volatile price charts; on the right, a calm desktop workspace where a browser taskbar game quietly hums along at the bottom of the screen.

---

## Slide 2: Product (~25s)

### Headline
Taskbar Hero is a cozy idle RPG living in a bottom browser strip where everyday progress is gas-free and rare Relics become real on-chain collectibles.

### Key Points
- **Ambient taskbar strip**: Mochi the cat fights along the bottom strip of your web page, passively collecting Fish (gold), Yarn (shards), and Cat Keys (boss keys) while you work.
- **Off-chain speed with server authority**: Fast, deterministic progression and combat run in Supabase Edge Functions with shared TypeScript rules, preventing browser cheats without charging gas.
- **Pure collectibles, no tokenomics**: There is no fungible in-game token; players forge rare ERC-1155 Relic NFTs once per day through verified gameplay achievements.

### Show on screen
A live capture of the Taskbar Hero interface showing the Phaser pixel-art bottom strip (Mochi trotting, combat, HUD) with the Cat Café Quest board and tabs open above (`docs/screenshots/idle-strip.png`, `docs/screenshots/inventory.png`).

---

## Slide 3: Live Demo (~45s)

### Headline
In under two minutes, a player moves seamlessly from zero-gas background progression to minting and trading a verified on-chain Relic.

### Key Points
- **Idle loop & boss fight**: Claim passive loot, equip better gear in the Inventory, and battle the daily Yarn Giant boss to secure a Cat Key.
- **Voucher-gated forge**: Spend 30 Yarn and 1 Cat Key in the Forge to trigger server verification and receive an instant, cryptographically signed EIP-712 mint voucher.
- **Fuji mint & marketplace**: Approve a single wallet transaction on Avalanche Fuji to mint the ERC-1155 Relic, view its custom pixel art, and list it in the escrow market for test AVAX.

### Show on screen
Fast-paced product walkthrough or split-screen sequence: Mochi defeating the Yarn Giant -> Forge reveal animation of a rising pixel-art Relic (`docs/screenshots/forge-reveal.png`) -> Relic listed in the market (`docs/screenshots/market.png`).

---

## Slide 4: How Avalanche is Used (~30s)

### Headline
Avalanche Fuji powers our trustless item economy through EIP-712 server-mint vouchers and a zero-fee escrow marketplace.

### Key Points
- **Fast, low-cost network**: Avalanche Fuji testnet (Chain ID 43113) provides sub-second finality and cheap gas, making minting and trading painless for players using test AVAX.
- **EIP-712 voucher gating**: The server signs typed vouchers `(player, relicId, rarity, nonce, expiry)`, allowing `RelicNFT` to verify caller address, unexpired timestamp, and global unused nonce before minting.
- **Trustless RelicMarket**: A dedicated Solidity escrow contract for fixed-price sales in test AVAX featuring checks-effects-interactions, zero platform fees, and no contract owner.

### Show on screen
Architecture flow diagram: Client -> Supabase Edge Functions (game logic & EIP-712 signing) -> Injected Wallet (Core / MetaMask) -> `RelicNFT` (mint validation) -> `RelicMarket` (escrow trading on Avalanche Fuji).

---

## Slide 5: What is Verifiably On-Chain (~25s)

### Headline
Two deployed, immutable contracts on Avalanche Fuji govern all Relic token issuance, rarity enforcement, and peer-to-peer escrow sales.

### Key Points
- **RelicNFT (`0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`)**: ERC-1155 enforcing ECDSA voucher validation, single-mint nonces, caller matching, and permanent rarity tiers per Relic ID.
- **RelicMarket (`0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`)**: Autonomous fixed-price escrow contract managing active listings, safe ERC-1155 deposits, and test-AVAX seller payouts.
- **Reconciled truth**: All Relic ownership and marketplace trades are verifiable on Snowtrace and Routescan; the game backend reconciles balances directly from on-chain `RelicForged` event receipts.

### Show on screen
Snowtrace / Routescan block explorer tabs showing verified Solidity source code, contract ABIs, and recent `RelicForged` and listing transaction logs for both contract addresses on Fuji.

---

## Slide 6: What is Next (~20s)

### Headline
Our roadmap expands accessibility with mobile wallets, deeper social progression, and dedicated Avalanche L1 scaling.

### Key Points
- **Broader wallet support**: Integrate WalletConnect and Core Mobile to enable seamless mobile play and expand browser accessibility beyond desktop Chrome, Brave, and Edge.
- **Deeper RPG loops**: Introduce multi-stage cooperative boss raids, café daily bounties, and off-chain stat buffs granted by holding specific on-chain Relic sets.
- **Avalanche L1 & Teleporter**: Explore transitioning high-frequency gameplay logic to a dedicated Avalanche Subnet/L1 and leveraging Teleporter for cross-chain Relic mobility.

### Show on screen
A 3-phase roadmap visual: Phase 1 (UniHack MVP on Fuji — Delivered), Phase 2 (Mobile Wallets & Content Expansion), Phase 3 (Dedicated Avalanche L1 & Teleporter Integration).

---

## Slide 7: Honest Limitations (~15s)

### Headline
We delivered a focused, functional UniHack MVP with clear and transparent boundaries between our testnet prototype and production scale.

### Key Points
- **Testnet only & un-audited**: Deployed exclusively on Avalanche Fuji with test AVAX; contracts and Edge Functions have thorough automated tests and internal reviews, but no formal third-party audit.
- **Desktop injected wallets only**: Restricts wallet connectivity to desktop Chrome, Brave, and Edge (Safari unsupported; no mobile wallet yet), and browsing market listings requires connecting a wallet.
- **Curated MVP scope**: Features a single scaling boss (Yarn Giant), four gear slots, and four Relic rarities with procedural pixel-art sprites and no audio or music assets yet.

### Show on screen
A transparent "Built & Live Today vs. Production Roadmap" checklist highlighting live Fuji contracts, verified gameplay loops, and working market against known MVP scope boundaries.
