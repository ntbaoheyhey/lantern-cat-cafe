# Taskbar Hero — Pitch Slide Outline

A 7-slide outline for a 3-minute pitch to the **Avalanche Team1 Vietnam UniHack 2026** judges.

- **Pacing**: ~25 seconds per slide (Demo: ~45s).
- **Core Theme**: Cat Café Quest — cozy dusk pixel art, off-chain ambient idle RPG, gas-free gameplay, and true digital collectibles on Avalanche Fuji without speculative fungible tokens.
- **Live Demo**: [https://taskbarhero-eight.vercel.app](https://taskbarhero-eight.vercel.app)

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
Fast-paced product walkthrough or split-screen sequence: Mochi defeating the Yarn Giant -> Forge reveal animation of a rising pixel-art Relic (`docs/screenshots/forge-reveal.png`) -> Relic listed in the market (`docs/screenshots/market.png`). For full presenter timing and narration, see [Demo Script v2](demo-script-v2.md).

---

## Slide 4: How Avalanche is Used (~30s)

### Headline
Avalanche Fuji powers our trustless item economy through EIP-712 server-mint vouchers and a zero-fee escrow marketplace.

### Key Points
- **Fast, low-cost network**: Avalanche Fuji testnet (Chain ID 43113) finalizes in about a second or two with cheap gas, making minting and trading painless for players using test AVAX.
- **EIP-712 voucher gating**: The server signs typed vouchers `(player, relicId, rarity, nonce, expiry)`, allowing `RelicNFT` to verify caller address, unexpired timestamp, and global unused nonce before minting.
- **Trustless RelicMarket**: A dedicated Solidity escrow contract for fixed-price sales in test AVAX featuring checks-effects-interactions, zero platform fees, and no contract owner.

### Show on screen
Architecture flow diagram: Client -> Supabase Edge Functions (game logic & EIP-712 signing) -> Injected Wallet (Core / MetaMask) -> `RelicNFT` (mint validation) -> `RelicMarket` (escrow trading on Avalanche Fuji).

---

## Slide 5: What is Verifiably On-Chain (~25s)

### Headline
Two deployed contracts on Avalanche Fuji govern all Relic token issuance, rarity enforcement, and peer-to-peer escrow sales.

### Key Points
- **RelicNFT (`0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`)**: ERC-1155 enforcing ECDSA voucher validation, single-mint nonces, caller matching, and permanent rarity tiers per Relic ID.
- **RelicMarket (`0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`)**: Autonomous fixed-price escrow contract managing active listings, safe ERC-1155 deposits, and test-AVAX seller payouts.
- **Reconciled truth**: All Relic ownership and marketplace trades are verifiable on Snowtrace and Routescan; the backend checks the mint receipt for the `RelicForged` event before it marks a Relic as minted. Be upfront that `RelicNFT` has an owner who can rotate the signer and change the metadata URI.

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

---

## Cat RPG v2 version (draft, swap in after cut-over)

A 7-slide outline for a 3-minute pitch updating Taskbar Hero to Cat RPG v2 (Cat Café Quest) for the **Avalanche Team1 Vietnam UniHack 2026** judges.

- **Pacing**: ~25 seconds per slide (Demo: ~45s; total <= 3 min).
- **Core Theme**: Ambient browser dungeon crawler — 7 feline hero classes, 9 equipment slots, 5 chapters and bosses, deterministic crafting and salvage, zero gas for core gameplay, and daily Relic milestone NFTs on Avalanche Fuji.
- **Live Demo**: [https://taskbarhero-eight.vercel.app](https://taskbarhero-eight.vercel.app) (fallback: local preview via `VITE_GAME_V2=1 pnpm --filter @taskbar-hero/web dev`).
- **Deadline and Platform**: TBD, confirm with organizers.

---

### Slide 1: Problem (~20s)

#### Headline
Most Web3 games force repetitive micro-actions on-chain or center on volatile speculative tokens, creating high friction and financial stress instead of casual fun.

#### Key Points
- **Friction kills casual play**: Paying gas fees, waiting for block confirmations, and approving frequent wallet popups ruin the pacing of casual and idle games (unchanged from Slide 1).
- **Token distraction**: Speculative fungible tokens overshadow core game loops, inviting hyper-financialization and rapid economy collapses.
- **Unmet ambient niche**: Modern desktop users want low-attention, ambient games that run quietly alongside work without demanding active focus or upfront investment.

#### Show on screen
A split comparison graphic: on the left, an overcrowded Web3 screen with repetitive wallet approval prompts and volatile price charts; on the right, a calm desktop workspace where a browser taskbar game quietly hums along at the bottom of the screen (docs/screenshots/v2/problem-split.png, placeholder without backticks, to capture after V16).

#### Speaker Note
Web3 games too often sacrifice fun for gas fees, repetitive wallet popups, and fragile token economics. We designed Taskbar Hero to give desktop users a relaxing, zero-gas RPG that progresses quietly alongside work while preserving genuine digital collectibles.

---

### Slide 2: Product v2 (~25s)

#### Headline
Cat RPG v2 expands Taskbar Hero into a rich chapter-based dungeon crawler with 7 cat classes, 9 gear slots, 5 chapters, and daily on-chain Relics (after cut-over).

#### Key Points
- **7 feline classes & 9 gear slots**: Choose from 7 distinct hero archetypes (Warrior, Guardian, Rogue, Hunter, Archer, Witch, Alchemist) with dedicated weapon families, combat passives, and 9 equipment slots (5 main visual slots and 4 leveling accessories).
- **5 household chapters & bosses**: Battle through 10 rounds across 5 environments (Living Room to Night Rooftops), defeating round Elites and challenging chapter bosses using earned Cat Keys.
- **Deterministic crafting & daily Relic**: Forge guaranteed gear rarities, dismantle surplus items with an anti-exploit ~25% salvage recovery, and spend 30 Yarn and 1 Moon Pearl to craft an exclusive daily Avalanche Relic voucher.

#### Show on screen
Full Cat RPG v2 desktop stage showing Chapter 1 (Living Room), top HUD with Fish, Yarn, and Cat Keys, equipped cat sprite, active combat cadence, and bag panel (docs/screenshots/v2/stage-livingroom.png, placeholder without backticks, to capture after V16).

#### Speaker Note
Cat RPG v2 transforms our ambient browser game into a complete dungeon crawler featuring seven cat classes, nine equipment slots, and five boss chapters. Players farm ambient loot, craft gear deterministically, and forge an exclusive on-chain Relic once each day.

---

### Slide 3: Live Demo v2 (~45s)

#### Headline
In 45 seconds, a player selects a cat class, equips optimal gear, defeats the chapter boss, and unlocks daily Relic crafting in demo mode (after cut-over).

#### Key Points
- **Fast demo click path**: (1) Open demo mode on the main stage, (2) select Warrior in ClassPicker and confirm, (3) open Inventory and click "Equip best" to optimize 9 slots, (4) launch the Round 10 Boss fight to fell the Yarn Giant, and (5) open the First-Clear Chest for guaranteed Moon Pearl and gear drops (exact path from [docs/demo-script-v2.md](demo-script-v2.md); see also [docs/judge-walkthrough.md](judge-walkthrough.md)).
- **Deterministic combat & auto-salvage**: Experience deterministic combat simulation where Cat Keys are consumed only on victory, 60-second cooldowns throttle losses, and full 200-slot bags auto-salvage overflow rewards safely on the spot.
- **Local preview fallback**: Demonstrated live in demo mode with zero wallet popups; if the live hosted demo is down or unreachable, seamlessly fallback to local preview via `VITE_GAME_V2=1 pnpm --filter @taskbar-hero/web dev`.

#### Show on screen
Rapid sequence walkthrough: ClassPicker confirmation -> Inventory character panel and "Equip best" stat deltas -> Yarn Giant combat sequence -> First-Clear Chest reward modal revealing 1 Moon Pearl and gear drops (docs/screenshots/v2/demo-walkthrough.png, placeholder without backticks, to capture after V16).

#### Speaker Note
In this forty-five second demo, we select Warrior, click 'Equip best' across nine gear slots, and defeat the Yarn Giant boss to claim a Moon Pearl. The entire flow runs client-side in demo mode, with a local preview fallback if network drops.

---

### Slide 4: How Avalanche is Used (~30s)

#### Headline
Avalanche Fuji powers our verifiable collectible economy through EIP-712 server-mint vouchers and an escrow marketplace using unchanged contracts.

#### Key Points
- **Unchanged Fuji smart contracts**: Cat RPG v2 reuses the deployed, immutable `RelicNFT` and `RelicMarket` contracts on Avalanche Fuji (Chain ID 43113) with zero migrations or token redeployments needed.
- **EIP-712 voucher gating**: Forging a daily Relic (30 Yarn + 1 Moon Pearl) produces a cryptographically signed typed voucher `(player, relicId, rarity, nonce, expiry)`; `RelicNFT` verifies caller, timestamp, unused nonce, and permanent rarity on Fuji.
- **Shared daily milestone**: The daily Relic forge is limited to 1 per account per day (midnight UTC+7 reset) across both v1 and v2, feeding the same on-chain collectible registry and zero-fee escrow market.

#### Show on screen
Architecture flow diagram: Client -> Supabase Edge Functions (`v2-relic-forge` EIP-712 signing) -> Injected Wallet (Core / MetaMask on Fuji) -> `RelicNFT` (mint validation) -> `RelicMarket` (fixed-price escrow sales) (docs/screenshots/v2/avalanche-arch.png, placeholder without backticks, to capture after V16).

#### Speaker Note
Avalanche Fuji secures our digital item economy without interrupting casual play. Daily Relic forging generates an EIP-712 server voucher, allowing players to mint ERC-1155 tokens on Fuji using existing, unchanged contracts for pennies in test AVAX.

---

### Slide 5: What is Verifiably On-Chain (~25s)

#### Headline
Two deployed contracts on Avalanche Fuji govern all Relic issuance and trading, while high-frequency RPG progression stays off-chain for zero gas.

#### Key Points
- **On-chain source of truth**: `RelicNFT` (`0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`) and `RelicMarket` (`0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`) enforce rarity tiers, single-use nonces, and trustless escrow trades verifiable on Snowtrace and Routescan.
- **Off-chain RPG speed**: 1,000 ms combat ticks, monster kill waves, 155 gear items, bag management, and crafting salvage run in Supabase Edge Functions (`v2-` endpoints) using shared TypeScript rules to keep play instant and free of gas.
- **Reconciliation & contract ownership**: Server marks a Relic minted only after verifying the on-chain receipt for `RelicForged`; transparently note that `RelicNFT` has an owner who can rotate the signer or metadata URI, whereas `RelicMarket` has no owner and zero platform fees.

#### Show on screen
Routescan / Snowtrace Fuji explorer tabs showing verified Solidity source code, contract ABIs, and recent `RelicForged` and marketplace transaction events alongside the backend schema mapping (docs/screenshots/v2/onchain-explorer.png, placeholder without backticks, to capture after V16).

#### Speaker Note
We keep a strict boundary: Relic ownership, rarity tiers, and escrow sales are fully verifiable on Avalanche Fuji. High-frequency combat, equipment drops, and crafting salvage remain server-authoritative in Edge Functions for zero-gas instant pacing.

---

### Slide 6: What is Next (~20s)

#### Headline
Our roadmap expands mobile accessibility, synchronous cooperative multiplayer, and custom Avalanche L1 subnet scaling (planned).

#### Key Points
- **Mobile wallet onboarding**: Integrate WalletConnect and Core Mobile to enable mobile touch play and expand browser access beyond desktop Chrome, Brave, and Edge (planned).
- **Cooperative multiplayer raids**: Introduce synchronous multi-cat café and rooftop boss raids with shared party rewards and passive in-game stat bonuses for holding specific on-chain Relic sets (planned).
- **Avalanche L1 & Teleporter**: Explore migrating high-frequency server game logic to a dedicated zero-gas Avalanche L1 subnet and leveraging Teleporter for cross-chain Relic bridging (planned).

#### Show on screen
A 3-phase roadmap graphic: Phase 1 (Fuji MVP & v2 Dungeon Crawler — Delivered), Phase 2 (Mobile Wallets & Co-op Raids — Planned), Phase 3 (Dedicated Avalanche L1 & Teleporter — Planned) (docs/screenshots/v2/roadmap-v2.png, placeholder without backticks, to capture after V16).

#### Speaker Note
Our post-hackathon roadmap brings Cat RPG v2 to mobile with Core and WalletConnect, introduces cooperative multi-cat boss raids, and explores custom Avalanche L1 subnets with Teleporter cross-chain messaging.

---

### Slide 7: Honest Limitations v2 (~15s)

#### Headline
We maintain clear engineering boundaries: simulation-tuned parameters, procedural visuals, testnet scope, and pending auth decisions.

#### Key Points
- **Simulation-tuned balance**: Game pacing and combat parameters are validated via automated Monte Carlo simulations (<from signed numbers> pending user sign-off in `docs/proposals/numbers-v2.md`), rather than multi-week human playtests.
- **Class visual status & testnet only**: Deployed on Avalanche Fuji testnet with test AVAX (no mainnet audit); cat class visuals currently use procedural pixel maps and CC0 foundations pending bespoke sprite animations.
- **Desktop wallets & mock-auth decision**: Injected wallet connection requires desktop Chrome, Brave, or Edge; demo mode operates locally, and the unification of mock authentication with production Supabase remains a planned cut-over step.

#### Show on screen
A transparent "Delivered Today vs. Production Roadmap" checklist highlighting live Fuji contracts, verified v2 engine loops, and known prototype constraints (docs/screenshots/v2/limitations-scorecard.png, placeholder without backticks, to capture after V16).

#### Speaker Note
We are transparent about our current scope: game pacing is tuned by automated simulation pending final sign-off, art relies on runtime pixel graphics, and wallet connectivity is currently focused on desktop Chrome, Brave, and Edge.

---

### Screenshot Shot List

Placeholder screenshot references to capture during submission asset week (Card A24 / A27) after layout integration (V16/V19):

| File Name Placeholder | Screen Description | State Needed (from `apps/web/src/api/mockV2Fixtures.ts`) | Width (px) |
| --- | --- | --- | --- |
| docs/screenshots/v2/problem-split.png | Problem comparison: Web3 wallet friction vs. calm ambient taskbar | Graphic asset (split comparison) | 1280 |
| docs/screenshots/v2/stage-livingroom.png | Main stage: Chapter 1 Living Room, HUD counters, ambient combat | fresh | 1280 |
| docs/screenshots/v2/class-picker.png | Class selection modal: 7 cat hero archetypes and passives | fresh | 1280 |
| docs/screenshots/v2/inventory-equip.png | Inventory: 9 equipment slots, character stats, "Equip best" deltas | bossReadyStrong | 1280 |
| docs/screenshots/v2/boss-battle.png | Boss battle: Yarn Giant combat timeline and telegraphed slams | bossReadyWeak | 1280 |
| docs/screenshots/v2/boss-win.png | Victory modal: First-Clear Chest reward with guaranteed Moon Pearl | bossReadyStrong | 1280 |
| docs/screenshots/v2/forge-craft.png | Forge tab: guaranteed rarity recipes, material costs, and salvage | forgeRich | 1280 |
| docs/screenshots/v2/bag-warning.png | Bag management: near-full capacity notice (180/200 auto-salvage) | bagNearFull | 1280 |
| docs/screenshots/v2/chapter-map.png | Chapter map: unlocked Chapter 2, locked Chapters 3–5 nodes | midGame | 1280 |
| docs/screenshots/v2/avalanche-arch.png | Architecture diagram: Edge Functions -> EIP-712 -> Fuji contracts | Graphic asset (system flow) | 1280 |
| docs/screenshots/v2/onchain-explorer.png | Routescan / Snowtrace: RelicNFT and RelicMarket Fuji transactions | Explorer live capture | 1280 |
| docs/screenshots/v2/roadmap-v2.png | 3-phase roadmap visual: UniHack v2 -> Mobile -> Avalanche L1 | Graphic asset (roadmap) | 1280 |
| docs/screenshots/v2/limitations-scorecard.png | Scope boundaries: Delivered on Fuji vs. Production roadmap | Graphic asset (scorecard) | 1280 |
| docs/screenshots/v2/phone-stage.png | Mobile viewport: responsive stage and HUD layout | fresh | 390 |
| docs/screenshots/v2/phone-inventory.png | Mobile viewport: responsive inventory and character panel | midGame | 390 |

---

### Verified Media Kit & Recorded Evidence Index (Mission T3)

The verified media files captured from the static v2 build are stored in [`reports/t3-demo-media/`](../reports/t3-demo-media/):

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

### Claims to Re-check on Submission Day

Checklist for submission week (18–19 Nov 2026, Card A27):

1. **Submission deadline & platform**: "TBD, confirm with organizers" (verify official UniHack 2026 channels before submitting; do not guess).
2. **Repository visibility**: Ensure `https://github.com/ntbaoheyhey/taskbar-hero` is made public (or organizers added as collaborators) and accessible while signed out.
3. **Live demo availability**: Test [https://taskbarhero-eight.vercel.app](https://taskbarhero-eight.vercel.app) in an incognito desktop browser window.
4. **Fuji contract addresses & explorer links**: Re-verify `RelicNFT` (`0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`) and `RelicMarket` (`0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`) on Routescan and Snowtrace.
5. **Signed numbers substitution**: Check `docs/proposals/numbers-v2.md` for user sign-off (Card CL8); replace `<from signed numbers>` placeholders with finalized metrics.
6. **Real screenshot assets**: Confirm all screenshot placeholders in the shot list are captured and committed under docs/screenshots/v2/ (Card A24).
7. **v2 cut-over status**: Verify whether the v2 cut-over (V29) is merged to `main`, making v2 the default experience without requiring `VITE_GAME_V2=1`.
8. **Wallet connectivity check**: Confirm injected wallet connections (Core, MetaMask) function smoothly on Fuji testnet with test AVAX.
