# Submission README Sections

## Pitch
The Lantern Cat Cafe is the last lit shop on a street that the Tangle—the Yarn Giant born from tasks abandoned on your taskbar—is knotting up. Lead your cosy cat trio (Mochi, Clover, and Soot) into tactical card battles to protect the warmth of the cafe. Relics earned are cafe memories the Tangle cannot erase because they live forever on Avalanche.

## How to Play
1. **Choose Your Trio**: Field Mochi (tank with shield and lantern), Clover (healer with teapot), and Soot (mage in purple cloak).
2. **Play Memory Cards**: Spend stamina each turn to play offensive attacks, defensive lantern shields, and restorative tea brews.
3. **Build Ultimate Momentum**: Fill hero energy gauges through synergistic plays and hit-stop timing.
4. **Unleash Ultimates**: Trigger Mochi's "Last Lantern Vow", Clover's "Fourleaf Spring Brew", and Soot's "Chimney Comet" to shatter enemy waves.
5. **Defeat the Yarn Giant**: Conquer the towering boss to rescue the street and claim persistent on-chain spoils.

## How Avalanche is Used
- **Guest Sign-in with SIWE**: Players jump straight into gameplay without seed phrases or initial funding through Sign-In with Ethereum (SIWE).
- **Sponsored Gas**: All combat transactions and initial claims utilize account abstraction and gas sponsorship so players experience zero wallet friction.
- **ERC-1155 Relic Minting**: After conquering the Yarn Giant, victorious cafe memories are minted as permanent ERC-1155 tokens on Avalanche Fuji.
- **YARN ERC-20 Economy**: In-game rewards and market trades settle in YARN ERC-20 tokens.
- **Snowtrace Verification**: Every minted Relic, token transfer, and contract interaction is publicly verifiable on Snowtrace:
  - Avalanche Fuji Testnet Explorer: [https://testnet.snowtrace.io/](https://testnet.snowtrace.io/)
  - Fuji Chain ID: `43113` (AVAX Testnet)

## Architecture
- **Client & Engine**: Browser-based responsive web app built on Phaser 3 and Three.js with custom spine/video rig rendering.
- **Game Rules**: Deterministic TypeScript simulation engine governing card resolution, combat queues, and status effects.
- **Sound & VFX Design**: Multi-layer procedural and acoustic audio mix with 12 dedicated ultimate layers and dynamic combat music ducking.
- **Web3 Layer**: Viem and Wagmi contract bindings interfacing with deployed Solidity smart contracts on the Avalanche Fuji C-Chain.

## Credits
Complete media credits and licensing details are available in [CREDITS.md](file:///Users/bao/th-v5-ag4/docs/submission/CREDITS.md) and [LICENSES.json](file:///Users/bao/th-v5-ag4/apps/web/public/audio/LICENSES.json).
