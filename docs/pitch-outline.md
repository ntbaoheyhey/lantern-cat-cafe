# Taskbar Hero (Cat RPG v2) — Pitch Slide Outline

A 7-slide outline for a 3-minute pitch to the **Avalanche Team1 Vietnam UniHack 2026** judges.

- **Pacing**: ~25 seconds per slide (Live Demo: ~45s; total <= 3 min).
- **Core Theme**: Cat Café Quest — cozy dusk pixel art, ambient off-chain idle RPG, gas-free core progression, and genuine digital collectibles on Avalanche Fuji without speculative fungible tokens.
- **Live Demo**: [https://web-zeta-tan-13.vercel.app](https://web-zeta-tan-13.vercel.app) (fallback: local preview via `VITE_GAME_V2=1 pnpm --filter @taskbar-hero/web dev`).
- **Deadline and Platform**: TODO: [Owner to confirm deadline and portal with organizers].

---

## Slide 1: Problem (~20s)

### Headline
Most Web3 games force high-frequency micro-actions on-chain or center on volatile speculative tokens, creating severe friction and financial stress instead of casual fun.

### Key Points
- **Friction kills casual play**: Paying gas fees, waiting for block confirmations, and approving frequent wallet popups ruin the pacing of casual and idle games.
- **Token distraction**: Speculative fungible tokens overshadow core game loops, inviting hyper-financialization and rapid economy collapses.
- **Unmet ambient niche**: Modern desktop users want low-attention, ambient games that run quietly alongside work without demanding active focus or upfront investment.

### Show on screen
A clean presentation visual showing the contrast: on the left, an overcrowded Web3 screen with repetitive wallet approval prompts and volatile price charts; on the right, Taskbar Hero running calmly in the browser ([`reports/t3-demo-media/01-title.png`](../reports/t3-demo-media/01-title.png)).

### Speaker Note
Web3 games too often sacrifice fun for gas fees, repetitive wallet popups, and fragile token economics. We designed Taskbar Hero to give desktop users a relaxing, zero-gas RPG that progresses quietly alongside work while preserving genuine digital collectibles.

---

## Slide 2: Product (~25s)

### Headline
Taskbar Hero expands into a rich chapter-based dungeon crawler with 7 cat classes, 9 gear slots, 5 chapters, and daily on-chain Relics.

### Key Points
- **7 feline classes & 9 gear slots**: Choose from 7 distinct hero archetypes (Warrior, Guardian, Rogue, Hunter, Archer, Witch, Alchemist) with dedicated weapon families, combat passives, and 9 equipment slots (5 main visual slots and 4 leveling accessories).
- **5 household chapters & bosses**: Battle through 10 rounds across 5 environments (Living Room to Night Rooftops), defeating round Elites and challenging chapter bosses using earned Cat Keys.
- **Deterministic crafting & daily Relic**: Forge guaranteed gear rarities, dismantle surplus items with an anti-exploit ~25% salvage recovery, and spend 30 Yarn and 1 Moon Pearl to craft an exclusive daily Avalanche Relic voucher.

### Show on screen
Desktop stage view showing Chapter 1 (Living Room), top HUD with Fish, Yarn, and Cat Keys, equipped cat sprite, active combat cadence, and bag panel ([`reports/t3-demo-media/02-class-pick.png`](../reports/t3-demo-media/02-class-pick.png), [`reports/t3-demo-media/03-idle-loop.png`](../reports/t3-demo-media/03-idle-loop.png)).

### Speaker Note
Taskbar Hero transforms the ambient browser game into a complete dungeon crawler featuring seven cat classes, nine equipment slots, and five boss chapters. Players farm ambient loot, craft gear deterministically, and forge an exclusive on-chain Relic once each day.

---

## Slide 3: Live Demo (~45s)

### Headline
In 45 seconds, a player selects a cat class, equips optimal gear, defeats the chapter boss, and unlocks daily Relic crafting in demo mode.

### Key Points
- **Fast demo click path**: (1) Open demo mode on the main stage, (2) select Warrior in ClassPicker and confirm, (3) open Inventory and click "Equip best" to optimize 9 slots, (4) launch the Round 10 Boss fight to fell the Yarn Giant, and (5) open the First-Clear Chest for guaranteed Moon Pearl and gear drops (exact path from `docs/demo-script-v2.md`).
- **Deterministic combat & auto-salvage**: Experience deterministic combat simulation where Cat Keys are consumed only on victory, 60-second cooldowns throttle losses, and full 200-slot bags auto-salvage overflow rewards safely on the spot.
- **Local preview fallback**: Demonstrated live in demo mode with zero wallet popups; if the live hosted demo is down or unreachable, seamlessly fallback to local preview via `pnpm --filter @taskbar-hero/web exec vite preview --port 4174`.

### Show on screen
Rapid sequence walkthrough: Inventory character panel and "Equip best" stat deltas ([`reports/t3-demo-media/04-bag.png`](../reports/t3-demo-media/04-bag.png)), Forge workshop crafting ([`reports/t3-demo-media/05-forge-reveal.png`](../reports/t3-demo-media/05-forge-reveal.png)), Yarn Giant combat in arena ([`reports/t3-demo-media/07-boss-arena.png`](../reports/t3-demo-media/07-boss-arena.png)), and First-Clear Chest reward modal revealing 1 Moon Pearl and gear drops ([`reports/t3-demo-media/08-result.png`](../reports/t3-demo-media/08-result.png)).

### Speaker Note
In this forty-five second demo, we select Warrior, click 'Equip best' across nine gear slots, and defeat the Yarn Giant boss to claim a Moon Pearl. The entire flow runs client-side in demo mode, with a local preview fallback if network drops.

---

## Slide 4: How Avalanche is Used (~30s)

### Headline
Avalanche Fuji powers our verifiable collectible economy through EIP-712 server-mint vouchers and an escrow marketplace.

### Key Points
- **Deployed Fuji smart contracts**: Taskbar Hero uses deployed, immutable `RelicNFT` and `RelicMarket` contracts on Avalanche Fuji (Chain ID 43113) with zero migrations or token redeployments needed.
- **EIP-712 voucher gating**: Forging a daily Relic (30 Yarn + 1 Moon Pearl) produces a cryptographically signed typed voucher `(player, relicId, rarity, nonce, expiry)`; `RelicNFT` verifies caller, timestamp, unused nonce, and permanent rarity on Fuji.
- **Shared daily milestone**: The daily Relic forge is limited to 1 per account per day across the game, feeding the same on-chain collectible registry and zero-fee escrow market.

### Show on screen
Architecture flow diagram: Client -> Supabase Edge Functions (EIP-712 signing) -> Injected Wallet (Core / MetaMask on Fuji) -> `RelicNFT` (mint validation) -> `RelicMarket` (fixed-price escrow sales).

### Speaker Note
Avalanche Fuji secures our digital item economy without interrupting casual play. Daily Relic forging generates an EIP-712 server voucher, allowing players to mint ERC-1155 tokens on Fuji using existing, unchanged contracts for pennies in test AVAX.

---

## Slide 5: What is Verifiably On-Chain (~25s)

### Headline
Two deployed contracts on Avalanche Fuji govern all Relic issuance and trading, while high-frequency RPG progression stays off-chain for zero gas.

### Key Points
- **On-chain source of truth**: `RelicNFT` ([`0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`](https://testnet.routescan.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D)) and `RelicMarket` ([`0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`](https://testnet.routescan.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93)) enforce rarity tiers, single-use nonces, and trustless escrow trades verifiable on Snowtrace and Routescan.
- **Off-chain RPG speed**: 1,000 ms combat ticks, monster kill waves, 155 gear items, bag management, and crafting salvage run in Supabase Edge Functions using shared TypeScript rules (`packages/game-rules`) to keep play instant and free of gas.
- **Reconciliation & contract ownership**: Server marks a Relic minted only after verifying the on-chain receipt for `RelicForged`; transparently note that `RelicNFT` has an owner who can rotate the signer or metadata URI, whereas `RelicMarket` has no owner and zero platform fees.

### Show on screen
Routescan / Snowtrace Fuji explorer tabs showing verified Solidity source code, contract ABIs, and recent `RelicForged` and marketplace transaction events alongside the backend schema mapping.

### Speaker Note
We keep a strict boundary: Relic ownership, rarity tiers, and escrow sales are fully verifiable on Avalanche Fuji. High-frequency combat, equipment drops, and crafting salvage remain server-authoritative in Edge Functions for zero-gas instant pacing.

---

## Slide 6: What is Next (~20s)

### Headline
Our roadmap expands mobile accessibility, synchronous cooperative multiplayer, and custom Avalanche L1 subnet scaling.

### Key Points
- **Mobile wallet onboarding**: Integrate WalletConnect and Core Mobile to enable mobile touch play and expand browser access beyond desktop Chrome, Brave, and Edge.
- **Cooperative multiplayer raids**: Introduce synchronous multi-cat café and rooftop boss raids with shared party rewards and passive in-game stat bonuses for holding specific on-chain Relic sets.
- **Avalanche L1 & Teleporter**: Explore migrating high-frequency server game logic to a dedicated zero-gas Avalanche L1 subnet and leveraging Teleporter for cross-chain Relic bridging.

### Show on screen
A 3-phase roadmap graphic: Phase 1 (Fuji MVP & v2 Dungeon Crawler — Delivered), Phase 2 (Mobile Wallets & Co-op Raids — Planned), Phase 3 (Dedicated Avalanche L1 & Teleporter — Planned). Responsive mobile screenshots: [`reports/t3-demo-media/09-phone-stage.png`](../reports/t3-demo-media/09-phone-stage.png) to [`reports/t3-demo-media/12-phone-forge.png`](../reports/t3-demo-media/12-phone-forge.png).

### Speaker Note
Our post-hackathon roadmap brings Cat RPG v2 to mobile with Core and WalletConnect, introduces cooperative multi-cat boss raids, and explores custom Avalanche L1 subnets with Teleporter cross-chain messaging.

---

## Slide 7: Honest Limitations (~15s)

### Headline
We maintain clear engineering boundaries: simulation-tuned parameters, procedural visuals, testnet scope, and pending auth decisions.

### Key Points
- **Simulation-tuned balance**: Game pacing and combat parameters are validated via automated Monte Carlo simulations, rather than multi-week human playtests.
- **Class visual status & testnet only**: Deployed on Avalanche Fuji testnet with test AVAX (no mainnet audit); cat class visuals currently use procedural pixel maps and CC0 foundations pending bespoke sprite animations.
- **Desktop wallets & demo mode**: Injected wallet connection requires desktop Chrome, Brave, or Edge; demo mode operates locally without a wallet.

### Show on screen
A transparent "Delivered Today vs. Production Roadmap" checklist highlighting live Fuji contracts, verified v2 engine loops, and known prototype constraints.

### Speaker Note
We are transparent about our current scope: game pacing is tuned by automated simulation pending final sign-off, art relies on runtime pixel graphics, and wallet connectivity is currently focused on desktop Chrome, Brave, and Edge.

---

## Media Kit & Recorded Evidence Index

All screenshots and clips generated from the verified v2 build:

| File Name | Screen Description | Resolution | File Size |
| :--- | :--- | :---: | :---: |
| [01-title.png](../reports/t3-demo-media/01-title.png) | Onboarding modal ("How to play") over dark stage | 1600x900 | 40 KB |
| [02-class-pick.png](../reports/t3-demo-media/02-class-pick.png) | Class selection modal: 7 cat hero classes and passives | 1600x900 | 30 KB |
| [03-idle-loop.png](../reports/t3-demo-media/03-idle-loop.png) | Main stage: Chapter 1 Living Room, HUD counters, combat | 1600x900 | 38 KB |
| [04-bag.png](../reports/t3-demo-media/04-bag.png) | Inventory: 9 equipment slots, character stats, "Equip best" | 1600x900 | 36 KB |
| [05-forge-reveal.png](../reports/t3-demo-media/05-forge-reveal.png) | Forge tab: guaranteed recipes, material costs, confirm box | 1600x900 | 30 KB |
| [06-chapter-map.png](../reports/t3-demo-media/06-chapter-map.png) | Chapter map: unlocked Ch 2, locked Ch 3–5, Boss Gate | 1600x900 | 30 KB |
| [07-boss-arena.png](../reports/t3-demo-media/07-boss-arena.png) | Boss battle: Yarn Giant combat, telegraphs, and health bars | 1600x900 | 38 KB |
| [08-result.png](../reports/t3-demo-media/08-result.png) | Victory modal: First-Clear Chest reward with Moon Pearl | 1600x900 | 60 KB |
| [09-phone-stage.png](../reports/t3-demo-media/09-phone-stage.png) | Mobile viewport: responsive stage and HUD layout | 390x844 | 16 KB |
| [10-phone-bag.png](../reports/t3-demo-media/10-phone-bag.png) | Mobile viewport: responsive inventory and character panel | 390x844 | 14 KB |
| [11-phone-boss.png](../reports/t3-demo-media/11-phone-boss.png) | Mobile viewport: responsive boss gate and chapter map | 390x844 | 12 KB |
| [12-phone-forge.png](../reports/t3-demo-media/12-phone-forge.png) | Mobile viewport: responsive forge workshop and recipes | 390x844 | 13 KB |
| [13-idle-loop.mp4](../reports/t3-demo-media/13-idle-loop.mp4) | Animated idle combat loop with moving damage numbers | 1280x720 | 184 KB |
| [13-idle-loop.gif](../reports/t3-demo-media/13-idle-loop.gif) | Animated GIF of idle combat loop | 640x360 | 1.0 MB |
| [14-boss-fight.mp4](../reports/t3-demo-media/14-boss-fight.mp4) | Animated boss battle from gate to victory chest reveal | 1280x720 | 275 KB |
| [14-boss-fight.gif](../reports/t3-demo-media/14-boss-fight.gif) | Animated GIF of boss battle from gate to victory chest | 640x360 | 1.3 MB |

---

## Claims to Re-check on Submission Day

1. **Submission deadline & platform**: Confirm official UniHack 2026 channels before submitting.
2. **Repository visibility**: Ensure `https://github.com/ntbaoheyhey/taskbar-hero` is made public (or organizers added as collaborators) and accessible while signed out.
3. **Live demo availability**: Test production demo in an incognito desktop browser window.
4. **Fuji contract addresses & explorer links**: Re-verify `RelicNFT` (`0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`) and `RelicMarket` (`0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`) on Routescan and Snowtrace.
5. **Wallet connectivity check**: Confirm injected wallet connections (Core, MetaMask) function smoothly on Fuji testnet with test AVAX.
