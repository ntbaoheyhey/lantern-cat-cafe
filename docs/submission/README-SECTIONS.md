# Submission README Sections

## Pitch
The Lantern Cat Cafe is the last lit shop on a street that the Tangle—the Yarn Giant born from tasks abandoned on your taskbar—is knotting up. Lead your cosy cat trio (Mochi, Clover, and Soot) into tactical card battles to protect the warmth of the cafe. Relics earned are cafe memories the Tangle cannot erase because they live forever on Avalanche.

## How to Play
1. **Choose Your Trio**: Field Mochi (tank with shield and lantern), Clover (healer with teapot), and Soot (mage in purple cloak).
2. **Tactical Card Battle**: Battle runs off-chain through deterministic TypeScript rules and Three.js visuals. Spend stamina to play shield slams, teapot brews, and ember spells.
3. **Build Ultimate Momentum**: Fill hero energy gauges through synergistic plays and hit-stop timing.
4. **Unleash Ultimates**: Trigger Mochi's "Last Lantern Vow", Clover's "Fourleaf Spring Brew", and Soot's "Chimney Comet" to shatter enemy waves.
5. **Conquer the Yarn Giant**: Defeat the towering boss to rescue the street and claim an on-chain memory voucher.

## How Avalanche is Used
Combat runs fully off-chain in deterministic TypeScript and Three.js; Avalanche Fuji provides verifiable ownership and post-battle settlement without network latency during combat.

- **Guest Sign-in with SIWE**: Players onboard immediately with an in-browser wallet signing an EIP-4361 SIWE message.
- **Sponsored Gas Entry (Funded-EOA)**: A backend sponsor drips test AVAX to the guest wallet via `guest-drip`. The guest wallet directly pays its own transaction gas for minting without personal funding friction.
- **ERC-1155 Relic Minting**: Defeating the Yarn Giant grants a signed EIP-712 finale voucher for Relic #3 (Moon Collar), submitted to `RelicNFT.mint` on Avalanche Fuji (chain ID `43113`).
- **Independent On-Chain Verification**: The browser verifies ownership directly against Fuji RPC using ERC-1155 `balanceOfBatch`.
- **Wider Economy & Snowtrace**: The deployed ecosystem includes YARN ERC-20 utility tokens and RelicMarketV2 escrow trading on Fuji, fully auditable on Snowtrace:
  - [RelicNFT (ERC-1155): 0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D](https://testnet.snowtrace.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D)
  - [RelicMarketV2: 0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4](https://testnet.snowtrace.io/address/0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4)
  - [YarnToken (ERC-20): 0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b](https://testnet.snowtrace.io/address/0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b)
  - [Historical Relic #3 Mint Tx: 0x1cd4a1fb…261b8](https://testnet.snowtrace.io/tx/0x1cd4a1fb0fbe78a95893608b0435b9b720e9191c5287137f64696a519c9261b8)

## Architecture
- **Client & Presentation**: Browser-based responsive client built with React, Three.js, and Phaser, utilizing custom animated 2D/3D cut-ins and Spine character rigs.
- **Deterministic Game Rules**: Off-chain shared TypeScript simulation engine powering turn queues, status effects, damage mitigation, and combat resolution.
- **Sound Engine & Audio Delivery**: Web Audio API engine with dynamic combat music ducking, 12 discrete ultimate audio layers (-16 LUFS peak), and CC0/CC-BY music beds.
- **Avalanche Fuji Smart Contracts**: Solidity contracts deployed on Avalanche Fuji (C-Chain 43113) interfacing through Viem and Wagmi for voucher minting and token balances.

## Credits
Complete media credits and licensing details are available in [CREDITS.md](CREDITS.md) and [LICENSES.json](../../apps/web/public/audio/LICENSES.json).
