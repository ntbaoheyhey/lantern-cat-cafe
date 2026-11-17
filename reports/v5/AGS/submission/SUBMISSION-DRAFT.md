# Submission Draft (Taskbar Hero)

## One-liner
Taskbar Hero: A cozy cat card-RPG on Avalanche.

## Description
Taskbar Hero is a cozy cat card-RPG where players defend their café from invaders using a deck of cat cards. Players mint trial relics, craft and trade items, and earn YARN on the Avalanche Fuji network.

## Problem and Solution
* **Problem:** Web3 games often have steep learning curves and lack accessible UI.
* **Solution:** Taskbar Hero bridges this gap with familiar card-RPG mechanics, cozy art, and an intuitive guest-wallet journey that requires no initial crypto knowledge.

## Avalanche Integration
* **Foundry:** Used for smart contract development and testing on Fuji.
* **Wagmi/Viem:** Handles on-chain interactions.
* **Instant Guest Mode:** Users interact via an ephemeral guest wallet without extension installation or crypto knowledge required.
* **Smart Contracts:** Manage relic minting, trading, and reward settlement on Avalanche.

## Tech Stack
* Vite + React + TypeScript + Phaser
* Supabase (for off-chain data and state)
* Foundry (for smart contract development)
* Wagmi/Viem

## Judge Quick-Start
1. Open [the demo URL](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3) (replace with actual host).
2. Follow the guest-wallet trial journey.
3. Observe Avalanche receipt evidence on the receipt screen.

## Known Limits
* Demo currently operates on Fuji testnet.
* Browser-based guest wallets are disposable and not for production.

## Team
AGS (Sound & QA), CXI (Integration), CXV (VFX), AGV (Art).
