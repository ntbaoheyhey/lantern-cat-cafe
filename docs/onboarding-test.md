# Fresh-Clone Onboarding & Deployment Audit Report

**Date**: 2026-10-24  
**Repository**: [ntbaoheyhey/lantern-cat-cafe](https://github.com/ntbaoheyhey/lantern-cat-cafe)
**Branch**: `antigravity/fresh-clone-test`  
**Base Commit**: `346ec53` (`main`)  
**Target Specifications**: Follow [README.md](file:///Users/bao/taskbar-hero/README.md) and [docs/deploy.md](file:///Users/bao/taskbar-hero/docs/deploy.md) exactly as written on a machine without local caches. Do not modify or fix any code.

---

## 1. Test Environment & Tooling Baseline

The test was conducted by performing a fresh clone into an isolated empty directory (`/tmp/fresh-clone-test-*`) and running all documented commands with empty package caches.

| Tool | Installed Version | Requirement in Docs / Config | Status |
| --- | --- | --- | --- |
| **Node.js** | `v26.11.1` | Compatible with Vite 8 (README) | OK |
| **pnpm** | `10.28.0` | `10.28.0` (`packageManager` in `package.json`) | OK |
| **Git** | `2.54.0` | Required for clone & submodules (README) | OK |
| **forge** (Foundry) | `1.8.6` (commit `6bad0a6`) | Required for contract tests (README) | OK |
| **cast** (Foundry) | `1.8.6` (commit `6bad0a6`) | Required for contract calls / deploy (deploy.md) | OK |
| **anvil** (Foundry) | `1.8.6` (commit `6bad0a6`) | Required for local node (deploy.md) | OK |
| **Supabase CLI** | Not installed (`command not found`) | Optional caveat check (`docs/database.md`) | Omitted (PGlite used in-process) |
| **Docker** | Not installed (`command not found`) | Required only if using local Supabase CLI | Omitted |
| **Deno** | Not installed (`command not found`) | Edge function runtime | Not required for local tests |

---

## 2. Onboarding Steps Matrix & Results

| Step | Command as Written | Source Doc | Cache Status | Result | Findings / Notes |
| --- | --- | --- | --- | --- | --- |
| **1. Clone repo** | `git clone https://github.com/ntbaoheyhey/lantern-cat-cafe.git` | README | Empty folder | **PASS** | Cloned 1,775 objects cleanly |
| **2. Install dependencies** | `pnpm install` | README | Empty store (`/tmp/clean-pnpm-store`) | **PASS** | 505 packages added in 33.9s. Warning on ignored build scripts |
| **3. Run web dev server** | `pnpm --filter @taskbar-hero/web dev` | README | Fresh build | **PASS** | Vite ready in 697ms on `http://localhost:5173/`, returned HTTP 200 |
| **4. Run all unit tests** | `pnpm test` | README | Fresh build | **PASS** | 6 packages, 513 tests passed across all suites |
| **5. Run web tests** | `pnpm --filter @taskbar-hero/web test` | README | Fresh build | **PASS** | 23 files, 188 tests passed in 2.36s |
| **6. Run rules tests** | `pnpm --filter @taskbar-hero/game-rules test` | README | Fresh build | **PASS** | 3 files, 56 tests passed in 181ms |
| **7. Run Supabase tests** | `pnpm --filter @taskbar-hero/supabase-tests test` | `docs/database.md` | Fresh build | **PASS** | 11 files, 262 tests passed in 4.69s (PGlite in-process) |
| **8. Init submodules** | `git submodule update --init --recursive` | README | Fresh clone | **PASS** | `forge-std` and `openzeppelin-contracts` + recursive checked out |
| **9. Run Foundry tests** | `cd contracts && forge test -vv` | README | Clean cache | **PASS** | 5 suites, 83 tests passed (0 failed, 0 skipped) |
| **10. Local deploy (Anvil)** | `anvil` + `forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast` | `docs/deploy.md` | Local Anvil | **PASS** | RelicNFT & RelicMarket deployed; matched committed `31337.json` |
| **11. Deploy script env check** | `forge script script/Deploy.s.sol` (no env vars) | `docs/deploy.md` | Unconfigured | **FAIL (Expected)** | Failed with missing `DEPLOYER_PRIVATE_KEY` error |
| **12. Rebuild contracts** | `cd contracts && forge build` | `docs/deploy.md` | Clean build | **PASS** | Emitted 5 compiler/linter warnings in Foundry 1.8.6 |
| **13. Regenerate ABIs** | `pnpm --filter @taskbar-hero/chain gen` | `docs/deploy.md` | Fresh build | **PASS** | Generated `src/abi.ts` with 0 diff |
| **14. Generate Relics** | `node scripts/gen-relics.mjs` | `docs/deploy.md` | Fresh run | **PASS** | Wrote 4 relics to `apps/web/public/relics`, 0 diff |
| **15. Verify Fuji signer** | `cast call 0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D 'signer()(address)' ...` | `docs/deploy.md` | Live Fuji | **PASS** | Returned `0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000` |
| **16. Verify Fuji RelicNFT** | `cast call 0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93 'relicNFT()(address)' ...` | `docs/deploy.md` | Live Fuji | **PASS** | Returned `0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D` |
| **17. Verify Fuji URI** | `cast call 0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D "uri(uint256)(string)" 1 ...` | `docs/deploy.md` | Live Fuji | **PASS** | Returned `"https://web-zeta-tan-13.vercel.app/relics/{id}.json"` |
| **18. Verify Relic Metadata** | `curl -s https://web-zeta-tan-13.vercel.app/relics/...001.json` | `docs/deploy.md` | Live site | **PASS** | Returned valid ERC-1155 Common Relic metadata |
| **19. Web app build** | `pnpm --filter @taskbar-hero/web build` | PR checks | Fresh build | **PASS** | `tsc --noEmit && vite build` completed in ~452ms |
| **20. Playwright E2E** | `pnpm --filter @taskbar-hero/web test:e2e` | PR checks | Uncached Playwright | **FAIL (Missing browser)** | Playwright binary missing on machines without preinstalled browser |

---

## 3. Detailed Step Logs & Errors Encountered

### Step 2: `pnpm install` with Clean Store
- **Command**:
  ```sh
  pnpm install --store-dir /tmp/clean-pnpm-store
  ```
- **Exit Code**: `0`
- **Output / Warnings**:
  ```
  Progress: resolved 505, reused 0, downloaded 496, added 505, done
  ╭ Warning ─────────────────────────────────────────────────────────────────────╮
  │   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
  │   utf-8-validate@5.0.10.                                                     │
  │   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
  │   to run scripts.                                                            │
  ╰──────────────────────────────────────────────────────────────────────────────╯
  Done in 33.9s using pnpm v10.28.0
  ```
- **Clarity / Status**: Clean pass. Package lockfile was 100% frozen and reproducible from registry.

---

### Step 3: Web App Local Server
- **Command**:
  ```sh
  pnpm --filter @taskbar-hero/web dev
  ```
- **Output**:
  ```
  VITE v8.3.5  ready in 697 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ```
- **Verification**: `curl -I http://localhost:5173/` returned `HTTP/1.1 200 OK`.
- **Clarity / Status**: Clean pass. Without Supabase configuration, the app cleanly boots into demo mode with mock APIs.

---

### Steps 4-7: Unit Tests & Supabase Integration Tests
- **Root Unit Suite**: `pnpm test` (`pnpm -r test`)
  - Ran 6 workspace packages (`packages/auth`, `packages/chain`, `packages/game-rules`, `supabase/tests`, `apps/web`).
  - All **513 tests passed** across **40 test files**.
- **Web Unit Suite**: `pnpm --filter @taskbar-hero/web test`
  - **188 passed** across 23 test files.
- **Game Rules Suite**: `pnpm --filter @taskbar-hero/game-rules test`
  - **56 passed** across 3 test files.
- **Supabase Suite**: `pnpm --filter @taskbar-hero/supabase-tests test`
  - **262 passed** across 11 test files using in-process PGlite.
  - Stderr logs during execution:
    - `relic: signer not configured` (expected test case in `forge.test.ts`)
    - `Error: rpc down` (expected test case in `forge.test.ts` testing network receipt failures)
- **Unclear documentation point**: `README.md` under "Run locally" lists `pnpm test`, `pnpm --filter @taskbar-hero/web test`, and `pnpm --filter @taskbar-hero/game-rules test`, but does **not** list `pnpm --filter @taskbar-hero/supabase-tests test`. That command is only documented in `docs/database.md`. Fortunately, root `pnpm test` discovers and executes it automatically via `pnpm-workspace.yaml`.

---

### Steps 8-9: Contract Tests (Foundry)
- **Pre-requisite Check (Running without submodules)**:
  - If a user clones without `--recursive` and runs `cd contracts && forge test -vv` directly before `git submodule update`:
    - **Error**: `forge` cannot resolve `forge-std/Test.sol` or `@openzeppelin/contracts/`.
- **Command as Documented**:
  ```sh
  git submodule update --init --recursive
  cd contracts
  forge test -vv
  ```
- **Exit Code**: `0`
- **Output**:
  ```
  Ran 5 test suites in 280.08ms (922.52ms CPU time): 83 tests passed, 0 failed, 0 skipped (83 total tests)
  ```
  - `DeployTest`: 1 passed
  - `RelicNFTTest`: 26 passed
  - `RelicEdgesTest`: 19 passed
  - `RelicMarketFuzzTest`: 10 passed
  - `RelicMarketTest`: 27 passed
- **Clarity / Status**: Clean pass when following the documented submodule initialization command.

---

### Step 10: Local Deploy via Anvil
- **Command**:
  ```sh
  anvil & # Background daemon on 127.0.0.1:8545
  cd contracts
  DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  VOUCHER_SIGNER_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
  RELIC_BASE_URI='https://relics.example/{id}.json' \
  forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
  ```
- **Exit Code**: `0`
- **Output**:
  ```
  == Return ==
  nft: contract RelicNFT 0x5FbDB2315678afecb367f032d93F642f64180aa3
  market: contract RelicMarket 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
  ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.
  ```
- **File Output**: Written to `packages/chain/deployments/31337.json`. `git status` confirmed `31337.json` matched the committed repository version exactly with 0 diff.

---

### Step 11: Deployment Missing Environment Variables Check
- **Command**:
  ```sh
  cd contracts
  forge script script/Deploy.s.sol
  ```
- **Exit Code**: `1`
- **Exact Error**:
  ```
  Traces:
    [5984410] → new Deploy@0x9f7cF1d1F558E57ef88a59ac3D47214eF25B6A06
      └─ ← [Return] 29773 bytes of code

    [3099] Deploy::run()
      ├─ [0] VM::envUint("DEPLOYER_PRIVATE_KEY") [staticcall]
      │   └─ ← [Revert] vm.envUint: environment variable "DEPLOYER_PRIVATE_KEY" not found
      └─ ← [Revert] vm.envUint: environment variable "DEPLOYER_PRIVATE_KEY" not found

  Gas used: 24163
  Error: script failed: vm.envUint: environment variable "DEPLOYER_PRIVATE_KEY" not found
  ```
- **Required Env Vars**:
  - `DEPLOYER_PRIVATE_KEY`
  - `VOUCHER_SIGNER_ADDRESS`
  - `RELIC_BASE_URI`

---

### Step 12: Contract Build Linter Warnings
- **Command**:
  ```sh
  cd contracts && forge build
  ```
- **Exit Code**: `0`
- **Compiler / Linter Warnings**:
  Foundry 1.8.6 linter flags the following warnings:
  - `warning[reentrancy-no-eth]` on `src/RelicMarket.sol:82:9` (`relicNFT.safeTransferFrom(...)`)
  - `warning[block-timestamp]` on `src/RelicNFT.sol:72:13` (`if (block.timestamp > v.expiry)`)
  - `warning[arbitrary-send-eth]` on `src/RelicMarket.sol:97:22` (`payable(l.seller).call{value: l.price}("")`)
  - `warning[reentrancy-events]` on `src/RelicNFT.sol:86:9` (`emit RelicForged(...)`)
  - `warning[environment-read-across-mutation]` on `test/RelicNFT.t.sol:35:92` (`block.timestamp` across `vm.warp`)

---

### Step 13-18: Chain Generation, Relic Art, and Fuji On-Chain Calls
- **ABI Gen**: `pnpm --filter @taskbar-hero/chain gen` ran `node scripts/gen-abi.mjs` and wrote `packages/chain/src/abi.ts` with 0 diff.
- **Relic Art Gen**: `node scripts/gen-relics.mjs` wrote 4 relics to `apps/web/public/relics` with 0 diff.
- **Fuji RelicNFT Signer**:
  ```sh
  cast call 0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D 'signer()(address)' --rpc-url https://api.avax-test.network/ext/bc/C/rpc
  ```
  Returned `0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000`.
- **Fuji RelicMarket Target**:
  ```sh
  cast call 0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93 'relicNFT()(address)' --rpc-url https://api.avax-test.network/ext/bc/C/rpc
  ```
  Returned `0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`.
- **Fuji URI Check**:
  ```sh
  cast call 0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D "uri(uint256)(string)" 1 --rpc-url https://api.avax-test.network/ext/bc/C/rpc
  ```
  Returned `"https://web-zeta-tan-13.vercel.app/relics/{id}.json"`.
- **Fuji Relic 1 Metadata**:
  ```sh
  curl -s https://web-zeta-tan-13.vercel.app/relics/0000000000000000000000000000000000000000000000000000000000000001.json
  ```
  Returned valid ERC-1155 metadata:
  `{"name":"Paw Charm","description":"A cozy paw-print charm...","image":".../relics/1.svg","attributes":[{"trait_type":"Rarity","value":"Common"}]}`.

---

### Step 20: Missing Tool / Cache Failure in E2E Testing
- **Command**:
  ```sh
  pnpm --filter @taskbar-hero/web test:e2e
  ```
- **Condition**: Executed in an environment where Playwright browser cache (`~/Library/Caches/ms-playwright` or `/opt/pw-browsers/chromium`) is absent:
  ```sh
  PLAYWRIGHT_BROWSERS_PATH=/tmp/empty-pw-browsers pnpm --filter @taskbar-hero/web test:e2e
  ```
- **Exit Code**: `1`
- **Exact Error**:
  ```
  Error: browserType.launch: Executable doesn't exist at /tmp/empty-pw-browsers/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell
  ╔════════════════════════════════════════════════════════════╗
  ║ Looks like Playwright was just installed or updated.       ║
  ║ Please run the following command to download new browsers: ║
  ║                                                            ║
  ║     pnpm exec playwright install                           ║
  ║                                                            ║
  ║ <3 Playwright Team                                         ║
  ╚════════════════════════════════════════════════════════════╝
  ```
- **Documentation Gap**:
  - `README.md` lists `Node.js compatible with Vite 8`, `pnpm 10.28.0`, `Git`, and `Foundry` under Prerequisites.
  - `README.md` does **not** mention Playwright or the prerequisite to install browser binaries via `pnpm exec playwright install`.
  - Once `playwright install` is run, all **14 e2e tests pass in ~8.9s**.

---

## 4. Summary of Gaps, Friction Points & Recommendations

1. **Playwright Browser Installation**:
   - *Friction*: Running `pnpm --filter @taskbar-hero/web test:e2e` fails on a fresh machine if browsers have not been fetched.
   - *Recommendation*: Add `pnpm exec playwright install` to `README.md` under an E2E testing section or prerequisites.

2. **Git Submodules in Clone Step**:
   - *Friction*: If a user clones without `--recursive`, `forge test` fails until `git submodule update --init --recursive` is run.
   - *Recommendation*: Document `git clone --recursive https://github.com/ntbaoheyhey/lantern-cat-cafe.git` as the primary clone instruction in `README.md`.

3. **Supabase Test Command Discoverability**:
   - *Friction*: `pnpm --filter @taskbar-hero/supabase-tests test` is documented only in `docs/database.md`, missing from `README.md`'s "Run locally" test list.
   - *Recommendation*: Add `pnpm --filter @taskbar-hero/supabase-tests test` alongside `apps/web` and `packages/game-rules` in `README.md`.

4. **Foundry Linter Warnings**:
   - *Friction*: `forge build` logs several warnings about reentrancy and timestamp usage under Foundry 1.8.6.
   - *Recommendation*: Add linter suppression comments or adjust checks where applicable.

5. **Deployment Environment Variables**:
   - *Friction*: Running `forge script script/Deploy.s.sol` without env vars halts at `DEPLOYER_PRIVATE_KEY` without indicating the other required keys (`VOUCHER_SIGNER_ADDRESS`, `RELIC_BASE_URI`) up front.
   - *Recommendation*: `docs/deploy.md` clearly lists the required variables in its table, which is sufficient, but an `.env.example` inside `contracts/` would streamline onboarding.
