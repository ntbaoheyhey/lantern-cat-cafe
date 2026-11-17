# Judge Interactive Walkthrough & Verification Guide

**Project**: Taskbar Hero — Lantern Cat Café  
**Target Environment**: `http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`  
**Target Chain**: Avalanche Fuji Testnet (Chain ID: `43113`)  
**Estimated Review Time**: 3 to 5 minutes  

---

## 1. Fast-Track 30-Second Journey (Judge Priority)

1. **Step 1: Open Game URL**
   - Navigate to `http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`.
   - *Audio Note*: Cosy café afternoon ambience (`ambience-cafe-afternoon.opus`, -22.1 LUFS) begins playing softly.

2. **Step 2: Instant Guest Entry**
   - Click **Play free** on the landing title screen.
   - An ephemeral browser guest key is generated instantly in Web Storage.
   - **Zero wallet popups or browser extension requirements**.

3. **Step 3: Fast-Paced Squad Combat**
   - Click **Fight** (or Start Battle).
   - Watch the 4-cat squad (Mochi: tank, Panko: brawler, Soot: ranged, Clover: healer) auto-attack the animated Yarn Spools.

4. **Step 4: Victory & Voucher Claim**
   - Upon victory, click **Claim trial voucher** (or Claim Relic).
   - The UI displays local confirmation of the earned asset.

---

## 2. Deep-Dive Feature Inspection

### A. The Café Hub & Workshop (Deterministic Economy)
- Click **Café** in the navigation header.
- Explore the Workshop crafting features:
  - **Seal**: Burn off-chain resources to earn YARN.
  - **Forge**: Fuse 3 lower-tier relics into a higher-tier relic with guaranteed odds.
  - **Publish Odds**: Click **Odds** in the footer to verify the hardcoded pity tables.

### B. Wallet Proof
- Click the wallet address in the top header.
- The game verifies the local off-chain game state with the Avalanche Fuji RPC:
  - Displays relic balances.
  - Displays YARN token balance.

---

## 3. Web3 & Network Verification Checklist

| Test Item | Expected Result | How to Verify |
| :--- | :--- | :--- |
| **Guest Mode** | Zero friction, instant play | Click "Play free". |
| **Injected Wallet** | Prompts SIWE signature | Connect wallet with Core/MetaMask on Chain 43113. |
| **Chain ID Check** | Auto-prompts Fuji (43113) | Connect wallet while on Ethereum Mainnet; banner displays switch request. |

---

## 4. Audio Quality Highlights

All game audio is procedurally synthesized or sliced from pre-cleared assets under strict EBU R128 compliance:
- **SFX**: Normalized to **-18.0 LUFS**.
- **UI**: Normalized to **-19.0 LUFS**.
- **Ambience**: Seamless looping background beds normalized to **-22.0 LUFS**.
- **Voice**: 104 sliced cat vocalizations sit cleanly in the $1 - 4\text{ kHz}$ dialogue pocket.
- **Overall Streaming Payload**: Complete audio registry requires only **1.62 MB Opus** streaming payload.
