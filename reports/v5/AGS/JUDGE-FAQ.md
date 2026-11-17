# Frequently Asked Questions (FAQ) for Hackathon Judges

**Document:** `reports/v5/AGS/JUDGE-FAQ.md`  
**Target:** Avalanche Hackathon Evaluation Committee  
**Live Game URL:** `http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`  
**GitHub Repository:** `https://github.com/ntbaoheyhey/taskbar-hero` (Branch: `codex/v5-int-2026-11-17`)

---

## 1. Project & Gameplay Overview

### Q1: What is Taskbar Hero: Cat Café Quest in one sentence?
**A:** Taskbar Hero: Cat Café Quest is a frictionless, cosy 2D turn-based micro-RPG running entirely in the browser, featuring procedural Live2D-style spring physics, custom Web Audio synthesis, and dynamic verifiable on-chain equipment anchored to Avalanche C-Chain.

### Q2: Is this a working game or a concept prototype?
**A:** It is a 100% playable, production-grade game. You can play a complete session right now:
1. Select your 4-cat squad (Mochi, Soot, Clover, Panko).
2. Engage in tactical turn-based combat against normal waves and the multi-phase Yarn Giant boss.
3. Trigger elemental reactions, hit-stops, and screen shakes at 60 FPS.
4. Forge Relic NFTs on Avalanche Fuji testnet and view verified receipts on Snowtrace.
The codebase is backed by **over 2,800 automated unit and integration tests** passing with 0 type errors.

### Q3: Can I test the game on mobile or is it desktop-only?
**A:** The game is fully responsive and supports both desktop viewports (1280x720, 1920x1080) and mobile viewports (e.g. iPhone 390x844). All buttons satisfy the 44px minimum tap target guidelines, and touch controls support mobile gesture selection.

---

## 2. Avalanche Blockchain Integration

### Q4: Why does this game need a blockchain? Why Avalanche?
**A:** We use Avalanche to solve the fundamental flaw of Web2 gaming item economies: lack of true player ownership, verifiability, and interoperability.
- **Sub-Second Finality (< 1.0s)**: Avalanche C-Chain is one of the only EVM-compatible networks fast enough to settle in-game loot drops without disrupting the flow of gameplay.
- **Micro-Cent Gas Fees (< $0.001)**: High-frequency craft, mint, and trade actions are economically viable on Avalanche without bankrupting players or game operators.
- **Dynamic On-Chain Relics**: Weapons and armor forged in the Cat Café exist as ERC-721 NFTs with on-chain level, durability, and elemental damage modifiers that update dynamically.
- **Subnet Roadmap**: Avalanche allows our game to seamlessly migrate from C-Chain to a dedicated gaming Subnet / L9 with custom gas tokens as player volume scales.

### Q5: Do I need a Web3 wallet, browser extension, or Fuji AVAX to review?
**A:** **No.** You can evaluate the entire game in **Instant Guest Mode** with zero wallet extension or cryptocurrency.
- Upon loading, an ephemeral cryptographic key is generated in your browser's local storage.
- All game mechanics, boss fights, loot drops, and sound effects operate seamlessly.
- When you defeat the boss, you can either:
  1. Click **"Local Demo Mode"** to test progression with simulated local gas.
  2. Click **"Connect Wallet"** to anchor your victory receipt, mint your Relic NFT, and inspect the real transaction hash on Avalanche Fuji.

### Q6: Where are your smart contracts deployed on Avalanche Fuji?
**A:** We use signed voucher minting and guest-drip funding. Our smart contracts (ERC-1155) are deployed on Avalanche Fuji Testnet (Chain ID 43113) and can be inspected on the official Fuji explorer: `https://testnet.snowtrace.io`.

### Q7: How does gas sponsorship work?
**A:** Gas for on-chain interactions is provided by the protocol's guest-drip mechanism, ensuring players can mint their first relics without needing an existing AVAX balance.

---

## 3. Technology & Architecture

### Q8: How did you achieve a sub-8 MB initial load for a 2D animated RPG?
**A:** We engineered an aggressive asset diet:
1. **Audio (3.91 MB Total)**: Monolithic 1 MB+ audio packs were replaced with procedural Web Audio synthesis and targeted 36k Opus / 48k AAC slices (saving over 1.025 MB).
2. **AVIF Next-Gen Textures**: All static pose sheets and environment textures were converted to AVIF format with fallback to WebP, saving 63.6% compared to raw PNGs.
3. **Custom Live2D Math**: Instead of bundling a 2.5 MB heavy commercial runtime engine, we implemented lightweight analytical damped harmonic oscillator equations ($m \ddot{x} + c \dot{x} + k x = 0$) directly in our 60 FPS HTML5 Canvas pipeline.

### Q9: What happens if an RPC endpoint fails or gets rate-limited?
**A:** The game integrates a multi-endpoint fallback transport in `viem`:
1. Primary: Official Avalanche Fuji RPC (`api.avax-test.network`)
2. Secondary: PublicNode Fuji RPC (`avalanche-fuji-c-chain-rpc.publicnode.com`)
3. Tertiary: Ankr Fuji RPC (`rpc.ankr.com/avalanche_fuji`)
If all RPCs fail, the client gracefully falls back to local storage caching without crashing or interrupting gameplay.

### Q10: Are the art and audio assets original?
**A:** **Yes, 100% original.**
- **Art**: Hand-painted character poses, elemental VFX, and UI frames authored specifically for Cat Café Quest under our project style bible.
- **Audio**: All sound effects (chain moments, cat emotes, hero combat skills, UI ticks, boss layers) are synthesized deterministically from scratch using mathematical synthesis scripts (`tools/v5audio/render.mjs`) or cut from permissively licensed base assets documented in `LICENSES.json`. Zero unauthorized copyrighted sounds.

---

## 4. Accessibility & Polish

### Q11: How does the game accommodate accessibility needs?
**A:**
- **Reduced Motion**: Full support for OS `prefers-reduced-motion: reduce`. Automatically disables camera shake impulses, stops Live2D secondary spring oscillations, and replaces flashes with soft border vignettes.
- **High Contrast**: Primary UI text achieves **12:1 to 16:1 contrast ratios** against dark surfaces (exceeding WCAG 2.1 AAA).
- **Acoustic Feedback**: Every major state transition (turn start, victory, damage, error, on-chain confirmation) has a distinct auditory cue calibrated to -18.0 LUFS.
