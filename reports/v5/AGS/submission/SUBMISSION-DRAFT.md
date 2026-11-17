# Taskbar Hero — Official Hackathon Submission Pack (Draft)

**Document**: `reports/v5/AGS/submission/SUBMISSION-DRAFT.md`  
**Status**: DRAFT (Review-ready for Project Owner)  
**Date Checked**: 2026-11-17  
**Official Competition Portal**: Avalanche Hackathon 2026 (Devpost / Avalanche Summit Track)  
**Rules Reference**: Standard Avalanche Gaming & Consumer Track Requirements  

---

## 1. Submission Overview & Metadata

- **Project Name**: Taskbar Hero — Lantern Cat Café
- **Tagline (Short Description, 120 chars)**:  
  *Visceral 60 fps anime cat café tactical RPG on Avalanche Fuji with instant gasless onboarding and verifiable battle deeds.*
- **Repository URL**: `https://github.com/ntbaoheyhey/taskbar-hero`
- **Primary Live Judge Demo URL**: `http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3` (Preview host)
- **Production Showcase URL**: `https://taskbarhero-eight.vercel.app`
- **Target Network**: Avalanche Fuji Testnet (Chain ID `43113`)

---

## 2. Project Description (Long Pitch)

### What It Does
**Taskbar Hero** is a high-polish, lightweight anime cat café tactical RPG playable directly in any desktop or mobile browser. Players take on the role of the Café Keeper, guiding a heroic party of feline adventurers—Mochi (Cloth/Holy Guardian), Soot (Ember Pyromancer), Clover (Herbal Healer), and Panko (Bakery Vanguard)—as they defend the realm from whimsical yarn golems and kitchen beasts.

Unlike typical web3 games burdened with friction, Taskbar Hero delivers **native-quality 60 fps WebGL combat** within an initial payload of under 8 MB, accompanied by deterministic procedural audio and zero-friction guest onboarding. Every completed battle quest, crafted relic, and seasonal deed is immutably minted on the **Avalanche Fuji C-Chain**.

### The Problem It Solves
Web3 gaming adoption has suffered from three critical roadblocks:
1. **Onboarding Friction**: Forcing players to install browser extensions, fund crypto wallets, and sign cryptographic popups before seeing a single frame of gameplay.
2. **Poor Game Feel & Sluggish Combat**: Clunky turn-based card games lacking visual impact, hit-stop feedback, and audio-visual synchronization.
3. **Bloated Web Footprints**: Multi-gigabyte asset downloads that fail to load on mobile connections.

Taskbar Hero solves all three:
- **Instant Gasless Onboarding**: A judge or player clicks "Play free" and enters the Café immediately. Behind the scenes, an ephemeral smart account is generated, and all transactions are sponsored via Paymaster.
- **Visceral 60 FPS Combat Engine**: Multi-layer VFX architecture featuring calibrated 50ms hit-stops, directional camera impulses, additive particle shaders, and Transient-Body-Tail acoustic layering.
- **Sub-8MB Asset Diet**: Aggressive image and audio compression using WebP/AVIF textures and custom procedural WebM Opus sound synthesis (< 10 KB per cue).

---

## 3. How Avalanche is Used

Taskbar Hero leverages Avalanche's high throughput, sub-second finality, and EVM compatibility across three core pillars:

### 1. Verified Smart Contracts on Avalanche Fuji (Chain ID 43113)
All core game assets and economy transactions run through deployed, verified Solidity contracts:
- **RelicNFT (`0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`)**: ERC-1155 multi-token contract managing equipment, trial relics, and forged battle gear. Supports signed-voucher minting with EIP-712 replay protection.
  - [View on Snowtrace](https://testnet.snowtrace.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D)
- **YarnToken (`0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b`)**: ERC-20 in-game currency supporting deflationary burning mechanisms upon relic enhancement.
  - [View on Snowtrace](https://testnet.snowtrace.io/address/0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b)
- **RelicMarketV2 (`0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4`)**: On-chain escrow marketplace supporting AVAX and YARN trade settlements with automatic fee distribution.
  - [View on Snowtrace](https://testnet.snowtrace.io/address/0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4)
- **SeasonRewards (`0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11`)**: Verifiable signed reward distribution contract for seasonal leaderboard milestones.
  - [View on Snowtrace](https://testnet.snowtrace.io/address/0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11)

### 2. Gasless Account Abstraction & Paymaster
To eliminate the need for testnet faucet funding during initial play, Taskbar Hero implements ERC-4337-compatible sponsored transactions. When a player finishes their first trial battle, their **Battle Deed** is minted gasless ($0.00 player fee), and the transaction hash is presented with direct Snowtrace verification.

### 3. Proof Verification Script for Judges
Judges can independently verify all contract state, ownership, and recent on-chain events in under 3 seconds using our standalone verification script:
```bash
node scripts/fuji-proof.mjs
```
*(Requires zero private keys, reads directly from public Fuji RPC).*

---

## 4. Technology Stack

- **Blockchain & Smart Contracts**: Solidity 0.8.24, Foundry (Forge), Viem, Avalanche C-Chain Fuji.
- **Frontend & UI**: React 19, TypeScript, Vite, TailwindCSS, custom UI-v3 responsive layout.
- **Rendering & Animation**: Custom WebGL 2D/3D depth camera pipeline, procedural sprite mesh deformation (Live2D/Spine style), additive blend shaders.
- **Audio Engineering**: Web Audio API, FFmpeg procedural synthesis pipeline (deterministic sine/pink-noise filtergraphs), Opus in WebM container + AAC M4A fallbacks.
- **Quality Assurance**: Automated Playwright / Chrome DevTools Protocol (CDP) test harness validating 1280x720 desktop and 390x844 mobile viewports.

---

## 5. Team Roles (Placeholder for Owner)

- **Team Member 1 (Project Lead & Smart Contract Engineer)**: Protocol architecture, Avalanche contract deployment, EIP-712 voucher signing, and Paymaster infrastructure.
- **Team Member 2 (Combat & VFX Engineer)**: WebGL arena rendering, sprite rig deformation, 50ms hit-stop feel, camera impulse shake, and additive VFX shaders.
- **Team Member 3 (Audio & Sound Designer)**: Transient-Body-Tail acoustic synthesis, cat hero vocalization trills, EBU R128 loudness mastering (-18.0 LUFS), and Web Audio bus routing.
- **Team Member 4 (Frontend & Systems Integrator)**: Responsive UI-v3 layout, 390x844 mobile adaptation, asset diet (WebP/AVIF siblings), and test harnesses.

---

## 6. Judge Quick-Start Guide (3 Simple Steps)

### Step 1: Open the Judge Demo Link
Navigate directly to the judge-facing review route:
```text
http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3
```
*(No browser extension, wallet setup, or initial login required).*

### Step 2: Instant Play in the Café
1. On the landing page, click **Play free**.
2. Explore the **Café Hub** — meet Mochi, Panko, Soot, and Clover.
3. Click the primary action button: **Fight: Your first adventure**.

### Step 3: Trigger Ultimate & Verify On-Chain Receipt
1. Click **Fight** in the Prepare Squad modal to launch the battle.
2. Watch your cat squad execute tactical strikes against the Yarn Giant. Trigger Mochi's signature **Holy Ultimate** to experience the 50ms hit-stop, camera shake, and synced audio.
3. Upon victory, inspect the **Battle Receipt** modal: verify the Avalanche Fuji transaction hash and gas sponsorship badge.
4. *(Optional CLI)*: Run `node scripts/fuji-proof.mjs` in your terminal to see live on-chain contract events.

---

## 7. Known Limitations & Transparency Notes

1. **Testnet Environment**: Transactions are executed on the Avalanche Fuji Testnet (Chain ID 43113). Live mainnet contract deployment is scheduled for post-competition release.
2. **Public RPC Throttling**: The public Avalanche Fuji RPC endpoint (`api.avax-test.network`) occasionally rate-limits rapid block scans to 100 blocks; client-side caching ensures reliable game state fallback.
3. **Mobile Landscape Orientation**: While the game is fully optimized for portrait mobile (390x844 standard), extreme landscape mobile viewports (< 400px height) should be viewed in portrait mode.
4. **Art Asset Licensing**: All visual textures, audio effects, and UI components are synthesized in-house or sourced under permissive MIT/Creative Commons licences documented in `apps/web/public/audio/LICENSES.json`.
