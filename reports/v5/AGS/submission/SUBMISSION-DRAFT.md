# Submission Draft (Taskbar Hero)

## One-liner
Taskbar Hero: A cozy cat card-RPG with desktop-integrated asset proofing.

## Description
Taskbar Hero is a cozy cat card-RPG where players defend their café from invaders using a deck of cat cards. Players earn trial vouchers, craft items, and manage relics with a seamless desktop-integrated interface.

## Problem and Solution
* **Problem:** Web3 games often have steep learning curves and lack accessible UI.
* **Solution:** Taskbar Hero bridges this gap with familiar card-RPG mechanics, cozy art, and an intuitive guest-wallet journey that requires no initial crypto knowledge.

## Technical Integration
* **Foundry:** Used for smart contract development and testing on Fuji.
* **Wagmi/Viem:** Handles verification of ownership of off-chain assets mapped to on-chain tokens.
* **Instant Guest Mode:** Users interact via an ephemeral guest wallet without extension installation or crypto knowledge required.
* **Off-chain to On-chain:** Game state is tracked off-chain, with verifiable proof of ownership for tokens/relics available on Avalanche.

## Tech Stack
* Vite + React + TypeScript + Phaser
* Supabase (for off-chain data and state)
* Foundry (for smart contract development)
* Wagmi/Viem

## Judge Quick-Start
1. Open [the demo URL](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3).
2. Follow the guest-wallet trial journey.
3. Observe proof of asset ownership for earned relics.

## Known Limits
* Demo currently operates on Fuji testnet.
* Browser-based guest wallets are disposable and not for production.

## Team
AGS (Sound & QA), CXI (Integration), CXV (VFX), AGV (Art).
