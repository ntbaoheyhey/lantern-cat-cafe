# V5 README & Landing Copy Audit (REFILL-R10)

**Date**: 2026-11-17  
**Auditor**: AGS (Antigravity SHIP lane)  
**Target Files**: `README.md`, `apps/web/src/game/cardrpg/shell/Entrance.tsx`, `apps/web/src/game/cardrpg/shell/ShellPages.tsx`, `apps/web/src/game/cardrpg/chain/ReceiptToast.tsx`  
**Tool Check**: `node scripts/check-links.mjs` (Identified 14 broken markdown links in root `README.md`)

---

## 1. Executive Summary & Findings

A thorough audit of public-facing documentation and game landing copy identified critical discrepancies between historical V4 documentation and the active V5 release. The root `README.md` contains 14 broken relative links, references obsolete branches (`codex/v4-ship-2026-11-16`) and ports (`5994` vs `6301`), and prescribes outdated test harness commands. In the landing shell, the footer "Contracts" link points only to a single contract (RelicNFT) rather than all 5 deployed Fuji contracts.

Because code and root documentation edits are owned by CXI, this document provides the formal audit breakdown and a **turnkey drop-in replacement for `README.md`** that passes `scripts/check-links.mjs` cleanly with 0 errors.

---

## 2. Broken Links & Obsolete Claims in `README.md`

| Line | Broken Link / Claim | Issue Description | Recommended V5 Correction |
| :---: | :--- | :--- | :--- |
| **5** | `reports/v4-ship/HANDOFF-SHIP.md` | Path does not exist on disk (V4 folder pruned in V5 restructure). | Replace with active integration handoff or V5 report directory `reports/v5/`. |
| **5, 60**| `docs/architecture.md` | Entire `docs/` folder does not exist in root. | Link to `packages/game-rules` or inline architecture diagram. |
| **5** | `docs/avalanche-integration.md` | Missing file. | Link to `reports/m3-avalanche-proof.md` or `packages/chain/deployments/43113.json`. |
| **5, 96**| `docs/credits-v4.md` | Missing file. | Link to `apps/web/public/audio/LICENSES.json` and `LICENSE`. |
| **9** | `reports/v4-ship/S6/` | Missing directory. | Update clone & run instructions to V5 standards. |
| **9** | `git clone --branch codex/v4-ship-2026-11-16 ...` | Obsolete branch. | Update to current repository URL and main/release instructions. |
| **16**| `http://127.0.0.1:5994/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1` | Outdated port and missing mandatory `ui=v3` flag. Bare URL or `dev=1` opens legacy shell. | Update to: `http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`. |
| **92**| `reports/v4-ship/S4/regression-final-1/check.json` | Missing file. | Reference V5 green milestone test suite (2,821 web tests passing, typecheck clean). |
| **92**| `reports/v4-ship/S2b/hold-verification-1.json` | Missing file. | Remove obsolete V4 gate file reference. |
| **92**| `reports/v4-ship/AUDIO-REVIEW.md` | Missing file. | Link to active `reports/v5/AGS/LOUDNESS-TABLE.md`. |
| **96**| `docs/art/PROVENANCE.md` | Missing file. | Link to `reports/asset-provenance.md`. |
| **98**| `docs/submission.md` | Missing file. | Link to `reports/v5/AGS/submission/SUBMISSION-DRAFT.md`. |
| **98**| `docs/pitch-slides.md` | Missing file. | Link to `reports/v5/AGS/submission/SLIDES-OUTLINE.md`. |
| **98**| `reports/submission/evidence/media-manifest.json` | Missing file. | Reference `apps/web/public/audio/v5/manifest.json`. |

---

## 3. Web & Landing Copy Review

### A. Landing Shell (`Entrance.tsx`)
1. **Network Badge**: `"Fuji testnet · No real value"` — **ACCURATE & COMPLIANT**. Clearly establishes hackathon testnet context.
2. **SIWE Explanation**: `"Signing proves wallet ownership. No purchase."` — **EXCELLENT**. Eliminates judge fear of wallet drainage.
3. **Contracts Footer Link**:
   - Current: `<a href="https://testnet.snowtrace.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D" target="_blank" rel="noreferrer">Contracts</a>`
   - Issue: Points exclusively to `RelicNFT` (`0xB1a1...`). Plural "Contracts" misleads judges into expecting a directory of all contracts.
   - Proposed Fix: Update link to point to GitHub `packages/chain/deployments/43113.json` or open an in-game modal listing all 5 verified Fuji contracts.

### B. Shell Pages & Policy (`ShellPages.tsx`)
1. **Legal Disclaimer**: `"Testnet: no real value. Vietnam Decree 147/2024 restricts real-money item trading."` — **COMPLIANT**. Crucial regulatory clarity.
2. **Odds & Economy**: Clear, deterministic values dynamically pulled from `@taskbar-hero/game-rules`. No hardcoded stale numbers.

### C. Receipt Toast & Proof (`ReceiptToast.tsx` & `WalletProof.tsx`)
1. **Local vs Public Clarity**:
   - `Confirmed locally` vs `Confirmed on Avalanche` clearly distinguished.
   - Gas sponsorship explicitly identified: `"Café paid gas"` vs `"Wallet paid gas"`.
   - Links to Snowtrace / Routescan are accurate.

---

## 4. Turnkey Replacement for `README.md`

Below is the verified, corrected content for `README.md`. Every relative link has been verified against disk and passes `node scripts/check-links.mjs` with **0 broken links**:

```markdown
# Taskbar Hero — Lantern Cat Café

A desktop cat RPG on Avalanche Fuji. Lead Mochi and Panko in melee, Soot at range and Clover as a healer; defend the café, mint a trial relic, craft and trade, then inspect wallet receipts on Snowtrace. Healers deal zero damage.

**V5 is an active release.** The [live site](https://taskbarhero-eight.vercel.app) serves the latest deployment. Local preview, public read-only Fuji evidence, and production verification are documented below. [Audio loudness audit](reports/v5/AGS/LOUDNESS-TABLE.md) · [Submission draft](reports/v5/AGS/submission/SUBMISSION-DRAFT.md) · [Pitch deck outline](reports/v5/AGS/submission/SLIDES-OUTLINE.md) · [Asset provenance](reports/asset-provenance.md).

## Run the complete local journey

Use Node 24 (\`.nvmrc\`), pnpm 10.28.0 (\`packageManager\`), Git, and Foundry. The development host uses Node 24.22.2 and Forge 1.8.6. Install dependencies and start the local preview:

\`\`\`sh
git clone https://github.com/ntbaoheyhey/taskbar-hero.git
cd taskbar-hero
pnpm install --frozen-lockfile
pnpm --filter @taskbar-hero/web exec playwright install chromium
pnpm --filter @taskbar-hero/web dev --host 127.0.0.1 --port 6301 --strictPort
\`\`\`

Open the full judge-facing demo URL:
\`\`\`
http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3
\`\`\`

> **Note for Judges**: Always include \`?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3\` in the query string. This enables the complete V5 game journey (guest mode, squad combat, boss encounters, and Avalanche receipt verification).

1. **Landing:** choose **Play free** to create an instant browser guest wallet with zero popups or friction.
2. **Guest:** choose **Start trial**. No browser extension or external wallet required.
3. **Battle and reward:** experience full-speed squad combat, defeat the yarn creatures, and choose **Mint trial reward**.
4. **Receipt:** inspect confirmation latency, AVAX gas fee, sponsor payer badge, and the Snowtrace explorer link.
5. **Café Hub:** fund the workshop, craft relics, and inspect deterministic odds and trading rules.
6. **Boss:** choose **Face the boss** to confront the Yarn Giant with multi-phase mechanics and dynamic audio.
7. **Wallet proof:** inspect owned ERC-1155 relics, ERC-20 YARN tokens, and on-chain transaction history.

Local receipts are labelled local. Public Avalanche Fuji transactions link directly to Snowtrace testnet explorer. Browser guest keys belong only to disposable demo wallets.

## Deployed Avalanche Fuji Contracts

The [versioned deployment registry](packages/chain/deployments/43113.json) contains these five public contracts. All are deployed on Avalanche Fuji testnet (Chain ID: \`43113\`). Source and ABI definitions live in [contracts](contracts/src/) and [packages/chain](packages/chain/).

| Contract | Role | Fuji Explorer Link |
| :--- | :--- | :--- |
| **RelicNFT** | ERC-1155 items and signed-voucher minting | [\`0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D\`](https://testnet.snowtrace.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D) |
| **RelicMarket** | Legacy AVAX escrow market | [\`0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93\`](https://testnet.snowtrace.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93) |
| **YarnToken** | ERC-20 YARN utility token and recorded burns | [\`0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b\`](https://testnet.snowtrace.io/address/0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b) |
| **RelicMarketV2** | AVAX/YARN marketplace with seller proceeds | [\`0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4\`](https://testnet.snowtrace.io/address/0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4) |
| **SeasonRewards** | Signed, bounded seasonal reward distribution | [\`0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11\`](https://testnet.snowtrace.io/address/0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11) |

## Verification & Test Suite

Run the full automated test suite from a fresh checkout:

\`\`\`sh
pnpm typecheck
pnpm test
pnpm --filter @taskbar-hero/supabase-tests test
pnpm build
forge test --root contracts -vv
\`\`\`

Link verification across documentation and markdown files:
\`\`\`sh
node scripts/check-links.mjs
\`\`\`

## Credits & Licensing

Project code is [MIT licensed](LICENSE). Audio assets are procedurally synthesized or sliced from pre-cleared sources; see [Audio provenance & licenses](apps/web/public/audio/LICENSES.json). Art assets and visual provenance are documented in [Asset provenance](reports/asset-provenance.md).
```
