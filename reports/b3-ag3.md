# Task Report: Demo Script for Judges (b3-ag3)

**Branch:** `ai/antigravity-b3-ag3`  
**Base:** `origin/main` (commit `fde8909`)  
**Author:** `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`  
**Task ID:** `b3-ag3`

---

## 1. What was changed

Created `docs/demo-script.md` containing a comprehensive presentation and demonstration guide tailored for the **Avalanche Team1 Vietnam UniHack 2026** judges:

1. **Quick Reference & Deployment Details**:
   - Pinned verified contracts on Avalanche Fuji (Chain ID `43113`):
     - `RelicNFT` (ERC-1155): `0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`
     - `RelicMarket`: `0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`
   - Explorers (Snowtrace & Routescan backup), RPC endpoints, and live deployment (`https://web-zeta-tan-13.vercel.app`).
   - Clear mapping of player-facing Cat Café Quest display names (Mochi, Fish, Yarn, Cat Key, Paw Charm, Silver Bell, Moon Collar, Golden Maneki, Yarn Giant) to immutable internal technical IDs.
   - Presenter pre-flight checklist.

2. **The 30-Second Elevator Pitch**:
   - Punchy, high-impact verbal pitch highlighting the ambient idle strip, gas-free off-chain progression, EIP-712 voucher-gated minting, and pure digital collectibles without speculative fungible tokenomics.

3. **3-Minute Demo Video Script**:
   - Precise second-by-second audio/video cue table (0:00 to 3:00) covering:
     - 0:00 - 0:30: The Hook & Ambient Idle Strip (Zero gas, zero popups)
     - 0:30 - 1:05: Inventory Progression & Boss Combat (Gasless gear upgrades, deterministic server combat)
     - 1:05 - 1:55: The Forge, EIP-712 Voucher & Avalanche Fuji Minting (~1.5s finality, Snowtrace verification)
     - 1:55 - 2:35: RelicMarket Escrow Trading & Peer-to-Peer Settlement (Zero fee, trustless escrow, native AVAX)
     - 2:35 - 3:00: Architecture Recap & Avalanche Value Proposition

4. **5-Minute Live Walkthrough**:
   - Step-by-step interactive guide for live presentations (screen share / booth / stage) with presenter actions and narrative prompts across 5 focused stages.

5. **What Each Step Proves About Avalanche**:
   - In-depth technical breakdown and Mermaid architecture diagram detailing how each game mechanic leverages Avalanche:
     - Pragmatic scalability (ambient loop doesn't congest C-Chain state)
     - Cryptographic state integrity (server authority with HMAC seeds)
     - EVM standards & typed data security (EIP-712 domain & struct validation)
     - Sub-second finality & low transaction fees on Avalanche
     - Chain-as-truth reconciliation (reconciling server state only after on-chain `RelicForged` event)
     - Trustless asset composability (`RelicMarket` autonomous escrow with zero owner keys)
     - Native value settlement (atomic peer-to-peer trades in test AVAX)

6. **Comprehensive Fallback Plan (Contingency Guide)**:
   - Actionable contingency workflows for:
     - Scenario A: Injected wallet fails or Safari browser used
     - Scenario B: Public Avalanche Fuji RPC latency or rate-limiting
     - Scenario C: Faucet dry or wallet lacks test AVAX
     - Scenario D: Daily forge limit reached ("You already forged today")
     - Scenario E: Backend Supabase Edge Functions network timeout (offline demo mode fallback)

7. **Anticipated Judge Q&A Defenses**:
   - Robust architectural defenses addressing why C-Chain vs. Avalanche L1, ERC-1155 vs. ERC-721, absence of fungible tokens, anti-cheat guarantees, and smart contract non-custodial security.

8. **Presenter Quick-Reference Cheat Sheet**:
   - Compact reference block summarizing URLs, contract addresses, display terms, costs, odds, and demonstration order.

---

## 2. Exact Commands Ran & Pass/Fail Output

### Git Identity Verification
```sh
$ git config user.name && git config user.email
ntbaoheyhey
108352255+ntbaoheyhey@users.noreply.github.com
# Status: PASS
```

### TypeScript Typecheck
```sh
$ pnpm typecheck
Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit (Done in 748ms)
packages/chain typecheck$ tsc --noEmit (Done in 830ms)
packages/game-rules typecheck$ tsc --noEmit (Done in 1.2s)
supabase/tests typecheck$ tsc --noEmit (Done in 1.9s)
packages/api-contract typecheck$ tsc --noEmit (Done in 365ms)
apps/web typecheck$ tsc --noEmit (Done in 2.9s)
# Status: PASS (0 errors)
```

### Linter Check
```sh
$ pnpm lint
Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit (Done in 371ms)
packages/chain lint$ tsc --noEmit (Done in 470ms)
packages/game-rules lint$ tsc --noEmit (Done in 831ms)
supabase/tests lint$ tsc --noEmit (Done in 1.2s)
packages/api-contract lint$ tsc --noEmit (Done in 277ms)
apps/web lint$ tsc --noEmit (Done in 2.4s)
# Status: PASS (0 errors)
```

### Unit Tests
```sh
$ pnpm test
Scope: 6 of 7 workspace projects
packages/auth test: 2 passed (7 tests)
packages/chain test: 2 passed (7 tests)
packages/game-rules test: 4 passed (63 tests)
supabase/tests test: 4 passed (24 tests)
apps/web test: 23 passed (188 tests)
# Status: PASS (All tests passed across all packages)
```

### Production Build
```sh
$ pnpm build
apps/web build$ tsc --noEmit && vite build
✓ 1658 modules transformed.
dist/index.html                               2.05 kB │ gzip:   0.75 kB
dist/assets/index-DotazktF.css               30.48 kB │ gzip:   6.53 kB
dist/assets/index-CR1S46O6.js                81.94 kB │ gzip:  23.56 kB
dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
✓ built in 343ms
# Status: PASS
```

### Playwright End-to-End Tests
```sh
$ pnpm --filter @taskbar-hero/web test:e2e
Running 16 tests using 6 workers
✓ market tab asks for a wallet when none is connected (912ms)
✓ shows How to play; closing it reveals the game and it stays closed (1.1s)
✓ boss tab fights, replays the log and shows the outcome (1.5s)
✓ strip horizontal scroll and no overlap between the HUD, wallet and Menu (582ms)
✓ screenshots renders at 1280px with no horizontal scroll and valid layout (662ms)
✓ forge tab shows the cost, odds and why forging is blocked in demo mode (2.0s)
✓ strip horizontal scroll and no overlap between the HUD, wallet and Menu (600ms)
✓ full plays from onboarding through upgrading, a boss fight, Forge and Market (2.2s)
✓ screenshots renders at 390px with no horizontal scroll and valid layout (547ms)
✓ strip horizontal scroll and no overlap between the HUD, wallet and Menu (448ms)
✓ screenshots renders at 320px with no horizontal scroll and valid layout (395ms)
✓ strip renders a canvas and the panel opens and closes (3.8s)
✓ inventory tab equips a demo item and the power goes up (6.8s)
✓ reduced motion the forge reveal shows the Relic without motion (4.9s)
✓ polish.spec.ts tabs switch with the keyboard (Tab and Enter) (464ms)
16 passed (9.6s)
# Status: PASS
```

---

## 3. Anything Could Not Do

None. All requested sections and requirements were fully researched and authored in alignment with current production and contracts state on `main`.

---

## 4. Open Questions

None.
