# Judge Interactive Walkthrough & Verification Guide

**Project**: Taskbar Hero — Lantern Cat Café  
**Target Environment**: `http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3` (or production live site)  
**Target Chain**: Avalanche Fuji Testnet (Chain ID: `43113`)  
**Estimated Review Time**: 3 to 5 minutes  

---

## 1. Fast-Track 30-Second Journey (Judge Priority)

1. **Step 1: Open Game URL**
   - Navigate to `http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3` (or deployed Vercel host).
   - Ensure the query string `?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3` is present.
   - *Audio Note*: Cosy café afternoon ambience (`ambience-cafe-afternoon.opus`, -22.1 LUFS) begins playing softly.

2. **Step 2: Instant Guest Entry**
   - Click **Play free** on the landing title screen.
   - An ephemeral browser guest key is generated instantly in Web Storage with deterministic cryptography.
   - **Zero wallet popups or browser extension requirements**.

3. **Step 3: Fast-Paced Squad Combat**
   - Click **Fight** (or Start Battle).
   - Watch the 4-cat squad (Mochi: tank, Panko: brawler, Soot: ranged, Clover: healer) auto-attack the animated Yarn Spools.
   - *Impact Feel*: Notice the 45 ms / 70 ms hit-stop, directional camera shake, and crisp transient audio snaps (Mochi wooden blunt thud, Soot shadow whisper, Clover magical chime).

4. **Step 4: Victory & On-Chain Voucher Mint**
   - Upon victory, the victory fanfare plays (`stinger-victory.opus`).
   - Click **Mint trial reward** (or Claim Relic).
   - The UI displays an Avalanche receipt toast showing confirmation latency, gas fee, sponsor payer badge, and a direct Snowtrace transaction link.

---

## 2. Deep-Dive Feature Inspection

### A. The Café Hub & Workshop (Deterministic Economy)
- Click **Café** in the navigation header.
- Explore the Workshop crafting features:
  - **Seal**: Burn off-chain resources to earn ERC-20 YARN tokens.
  - **Forge**: Fuse 3 lower-tier relics into a higher-tier NFT with guaranteed odds.
  - **Publish Odds**: Click **Odds** in the footer to verify the hardcoded pity tables (Soft pity at 60 bells, Hard pity at 80 bells).

### B. Boss Encounter: The Yarn Giant
- From the Hub, click **Face the boss**.
- Encounter the colossal Yarn Giant with multi-phase mechanics:
  - Phase 1: Heavy club sweeps with screen shake.
  - Phase 2: Dissonant thread charge drone (`boss.yarn-giant.thread_charge`) followed by a full-screen shockwave (`boss.yarn-giant.shockwave`).
  - Defeat: Boss disintegration animation with deep bass collapse.

### C. On-Chain Wallet Proof
- Click the wallet address in the top header (or navigate to **Wallet Proof**).
- The game queries the live Avalanche Fuji RPC using read-only calls (`eth_call` and `eth_getTransactionReceipt`):
  - Displays owned ERC-1155 Relic balances (`RelicNFT`).
  - Displays live ERC-20 YARN token balance (`YarnToken`).
  - Lists past transaction receipts with clickable Snowtrace hashes.

---

## 3. Web3 & Network Verification Checklist

| Test Item | Expected Result | How to Verify |
| :--- | :--- | :--- |
| **Guest Mode** | Zero friction, instant play | Click "Play free". No MetaMask popup occurs. |
| **Injected Wallet** | Prompts SIWE signature | Click "Connect wallet" with Core or MetaMask on Chain 43113. |
| **Chain ID Check** | Auto-prompts Fuji (43113) | Connect wallet while on Ethereum Mainnet; banner displays "Switch to Fuji". |
| **Gasless Experience** | Sponsored gas badge | Receipt toast shows "Café paid gas" for trial voucher claim. |
| **Explorer Integrity** | Valid transaction link | Click "Snowtrace receipt" in the toast to open the testnet explorer. |

---

## 4. Audio Quality Highlights

All game audio is procedurally synthesized or sliced from pre-cleared assets under strict EBU R128 compliance:
- **SFX**: Normalized to **-18.0 LUFS** with True Peak $\le -1.2$ dBFS (never clips).
- **UI**: Normalized to **-19.0 LUFS** with tactile transient snaps ($3 - 8\text{ kHz}$).
- **Ambience**: Seamless looping background beds normalized to **-22.0 LUFS** (never overpowers combat).
- **Voice**: 104 sliced cat vocalizations sit cleanly in the $1 - 4\text{ kHz}$ dialogue pocket.
- **Overall Streaming Payload**: Complete audio registry requires only **1.62 MB Opus** streaming payload.
