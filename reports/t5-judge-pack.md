STATUS: DONE

# T5 — Avalanche judge pack

Date: 2026-10-27 (Asia/Ho_Chi_Minh, UTC+7). Base: `origin/main` at `6d493b0`;
T2 was already merged in `991df9e`. Branch: `ai/codex-t5-judge-pack`.
DONE means the requested repository deliverables and checks are complete. Live wallet execution,
transaction receipts and token supply remain explicitly NOT VERIFIED; the documented live site is down.

## 1. Per-piece acceptance

### Piece 1 — integration page

- **PASS:** [English judge page](../docs/avalanche-integration.md) explains ERC-1155 mint, EIP-712 vouchers,
  fixed-price escrow and SIWE. SIWE is accurately distinguished as off-chain wallet authentication.
  Gold, gear, shards and keys stay server-authoritative; routine play requires no gas. No measured
  finality/gas benchmark is invented.
- **PASS:** both exact deployment addresses, chain 43113 and Routescan Contract/Snowtrace links are listed.
- **PASS:** owner-confirmed Exact Match status, date, compiler, optimization, EVM, creation timestamp and
  abbreviated creator are recorded. **PASS:** independent read-only explorer API calls returned source
  and matching compiler/settings; both main Solidity files matched repo text byte for byte.
  [Machine-readable evidence](t5-judge-pack/explorer-check.json). **NOT VERIFIED:** explorer UI's Exact
  Match label, creation receipt timestamp, imported-source completeness and runtime-bytecode rebuild.
- **PASS:** Mermaid names actual `mint`, approval, `list`, `safeTransferFrom` and `buy` functions;
  cancellation and receipt reconciliation are also explained.
- **PASS:** five-minute steps include Fuji faucet, two wallets, expected events/state and prerequisites.
  Fresh-account progression/faucet latency are not promised within five minutes.
  **NOT VERIFIED:** actual wallet/browser/SIWE/forge/mint/list/buy execution against a live deployment.
- **PASS:** searched docs/reports Markdown for real transaction URLs and 64-hex values. Only the
  documented public Anvil example key matched the latter. Five TODO-OWNER slots specify where to
  paste existing NFT/market creation hashes and successful mint/list/purchase hashes; no hashes invented.
- **PASS:** all seven Foundry files are linked by unit/fuzz/invariant/edge role; current dated Foundry
  and TypeScript results are recorded, including existing expected failures and skips.

### Piece 2 — read-only proof

- **PASS:** [script](../scripts/onchain-proof.mjs) uses the existing web workspace's viem dependency,
  generated ABI JSON and deployment addresses; public RPC fallback is viem's existing Fuji setting.
  Optional `VITE_FUJI_RPC_URL` mirrors the web config. Root package changes only add `onchain-proof`.
- **PASS:** checks RPC chain, pins reads to one block, prints code presence for both contracts,
  NFT owner/signer/URI/existence for IDs discovered in committed metadata, market NFT binding,
  active count and lifetime count. [Real Fuji output](t5-judge-pack/onchain-proof.log).
- **PASS:** no accounts, signing, private keys, `.env` loading, transaction submissions or writes.
  Missing code, wrong chain/binding, RPC failure and failed supported reads exit non-zero.
  [Reproducible failure checks](t5-judge-pack/proof-failure-check.mjs) and [output](t5-judge-pack/proof-failure-check.log)
  cover empty code at both addresses, wrong chain and read failures (all exit 1).
- **NOT VERIFIED:** numeric total supply. Actual ABI/source has no `totalSupply(uint256)` getter;
  each discovered ID prints an explicit limitation. Supply is not guessed from balances or existence.
  Full chain history was not scanned; a real `eth_getLogs` attempt returned:
  `block range too large: total block range in this request exceeds the maximum of 100 blocks`.
  The metadata catalogue does not claim exhaustive on-chain token discovery.
- **PASS:** market fees are accurately attributed to source: no platform fee or fee getters;
  network gas still applies. No fictitious fee settings are queried or printed as RPC facts.

### Piece 3 — README and architecture

- **PASS:** top “For judges” block is 11 lines (within 15), contains live URL with current failure,
  60-second tour, guide, explorer table, test/proof commands, both security reviews and architecture.
  Existing README below the inserted block is preserved exactly.
- **PASS:** architecture adds voucher/market sequence and server-authoritative boundary, clearly
  separates SIWE signatures from transactions and local demo saves from connected server behavior.
- **PASS:** deployment docs include reference-only verification commands with original public
  constructor arguments from explorer, compiler/EVM settings and optimization off. None submitted.

### Piece 4 — checks

- **PASS:** touched Markdown path/link check; full repository check has zero new failures (baseline 0,
  final 0; the mission's historical ~58 broken links were already fixed on this base).
- **PASS:** `pnpm onchain-proof` against public Fuji, Foundry, full workspace checks and classic browser
  tests. **FAIL (external availability):** live URL returns HTTP 404 / `DEPLOYMENT_NOT_FOUND`;
  [HTTP evidence](t5-judge-pack/live-check.txt). Deployment repair is outside this mission.
- **NOT VERIFIED:** full browser-wallet transaction reproduction; no wallet or live DB writes performed.

## 2. Problems found and fixed

- **FOUND:** documented live site is unavailable because Vercel returns `DEPLOYMENT_NOT_FOUND`.
  **FIXED in docs:** prominently disclose failure and require owner restoration before live reproduction;
  no deployment was attempted.
- **FOUND:** NFT has no supply getter and public RPC allows at most 100 blocks per log request.
  **FIXED in proof:** explicitly label supply unavailable per ID rather than returning a false zero.
- **FOUND:** zero active listings could conceal prior activity. **FIXED:** report both active count (0)
  and lifetime count (1 from `nextListingId = 2`); do not equate removal with a purchase.
- **FOUND:** transaction evidence is missing from repository documents. **FIXED:** exact owner-action
  slots for both deployments, mint, listing and purchase, rather than fabricated examples.
- **FOUND:** first local link check treated a backticked Markdown wildcard as a literal missing file.
  **FIXED:** use prose for the search scope; final checks have zero broken links.
- **FOUND:** first temporary failure-test harness expected the raw RPC error; viem wraps it in a
  contract-read error. **FIXED:** assert the intended explicit NOT VERIFIED result and non-zero exit;
  script behavior was correct. All three final failure-path cases pass.

## 3. Tier 2 changes

None. Only allowed files changed. Contracts, auth, secrets, migrations, config/content numbers,
lockfile/workspace settings and GitHub workflow files were not edited. The separate managed worktree
preserved unrelated changes in the original checkout. Dependencies were initialized as pinned submodules;
no submodule revisions changed. No new dependency or remote asset was added.

## 4. Diff evidence

The committed snapshot and exact `git diff --stat origin/main...HEAD` / name-only output are recorded
below after the initial implementation commit. The following report metadata commit only finalizes
this report's diff/commit evidence.

## 5. Checks actually run

Corepack is unavailable, so every executed pnpm command was prefixed with `npx -y pnpm@10.28.0`.
Node `v26.11.1`; Foundry `1.8.6`. Version check:

```text
$ npx -y pnpm@10.28.0 --version
10.28.0
```

Frozen install — **PASS**:

```text
$ CI=true npx -y pnpm@10.28.0 install --frozen-lockfile
Progress: resolved 505, reused 496, downloaded 0, added 504
Progress: resolved 505, reused 496, downloaded 0, added 505, done

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 6.2s using pnpm v10.28.0
```

Ignored optional native dependency build scripts were reported; no approval prompt appeared and no lockfile/workspace changes occurred.

Deno drift — **PASS** (diff exit 0):

```text
$ npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions
> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/t5-judge-pack/taskbar hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
```

typecheck — **PASS**:

```text
$ npx -y pnpm@10.28.0 typecheck
packages/auth typecheck: Done
packages/chain typecheck: Done
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck: Done
apps/web typecheck: Done
```

lint — **PASS**:

```text
$ npx -y pnpm@10.28.0 lint
packages/chain lint: Done
packages/auth lint: Done
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint: Done
apps/web lint: Done
```

TypeScript workspace tests — **PASS**, 1,968 passed, 2 expected failures, 11 pre-existing skipped. No tests changed/disabled:

```text
$ npx -y pnpm@10.28.0 test
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
supabase/tests test:  Test Files  21 passed (21)
supabase/tests test:       Tests  442 passed (442)
packages/game-rules test:  Test Files  22 passed | 3 skipped (25)
packages/game-rules test:       Tests  339 passed | 2 expected fail | 11 skipped (352)
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
apps/web test:  Test Files  89 passed (89)
apps/web test:       Tests  1140 passed (1140)
```

build — **PASS**:

```text
$ npx -y pnpm@10.28.0 build
packages/chain build: Done
packages/auth build: Done
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build: Done
apps/web build: ✓ built in 551ms
apps/web build: Done
```

classic-build — **PASS**:

```text
$ VITE_GAME_V2=0 npx -y pnpm@10.28.0 --filter @taskbar-hero/web build
✓ built in 327ms
```

Foundry — **PASS**:

```text
$ forge test --root contracts
Ran 1 test for test/Deploy.t.sol:DeployTest
Suite result: ok. 1 passed; 0 failed; 0 skipped; finished in 18.11ms (10.52ms CPU time)
Ran 19 tests for test/RelicEdges.t.sol:RelicEdgesTest
Suite result: ok. 19 passed; 0 failed; 0 skipped; finished in 25.05ms (11.13ms CPU time)
Ran 27 tests for test/RelicMarket.t.sol:RelicMarketTest
Suite result: ok. 27 passed; 0 failed; 0 skipped; finished in 173.32ms (174.65ms CPU time)
Ran 26 tests for test/RelicNFT.t.sol:RelicNFTTest
Suite result: ok. 26 passed; 0 failed; 0 skipped; finished in 296.53ms (65.61ms CPU time)
Ran 5 tests for test/Fuzz.t.sol:RelicFuzzTest
Suite result: ok. 5 passed; 0 failed; 0 skipped; finished in 305.59ms (766.40ms CPU time)
Ran 10 tests for test/RelicMarketFuzz.t.sol:RelicMarketFuzzTest
Suite result: ok. 10 passed; 0 failed; 0 skipped; finished in 307.86ms (1.36s CPU time)
Ran 1 test for test/Invariants.t.sol:RelicInvariantsTest
Suite result: ok. 1 passed; 0 failed; 0 skipped; finished in 1.22s (1.21s CPU time)
Ran 7 test suites in 1.23s (2.35s CPU time): 89 tests passed, 0 failed, 0 skipped (89 total tests)
```

Classic browser/app check — **PASS** (no old preview processes/listeners existed; cleanup command executed before running):

```text
$ pkill -f "vite preview" || true
$ npx -y pnpm@10.28.0 --filter @taskbar-hero/web test:e2e --project=classic
  38 passed (26.2s)
```

The full v2-loop/stage-layout browser suite was not required: no `apps/web`, `packages` or lockfile changes. Classic was run to satisfy the shared classic-build/browser requirement. No screenshots requested/generated; `git status --short reports/` showed no unrelated report artifacts after e2e.

Read-only Fuji proof — **PASS**, exit 0; complete real output:

```text
> taskbar-hero@0.0.0 onchain-proof /Users/bao/.codex/worktrees/t5-judge-pack/taskbar hero
> node scripts/onchain-proof.mjs

{"chainId":43113,"blockNumber":"60097612","blockHash":"0x0d8fa9802d9ad4f0c91a45e169e46e89aa840ca84cc4180c8f2b4e068d99512a","checkedAt":"2026-10-27T10:16:17.455Z"}
{"contract":"RelicNFT","address":"0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D","codePresent":true,"codeBytes":14200}
{"contract":"RelicMarket","address":"0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93","codePresent":true,"codeBytes":7713}
{"contract":"RelicNFT","owner":"0x2Bba9a48F7F79d99154108A28d32f1a21d17055c","signer":"0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000","tokenIdDiscovery":"committed relic metadata; not exhaustive chain history"}
{"contract":"RelicNFT","tokenId":"1","exists":true,"uri":"https://web-zeta-tan-13.vercel.app/relics/{id}.json","totalSupply":"NOT VERIFIED: no totalSupply(uint256) getter in this contract; full mint/transfer history not reconstructed"}
{"contract":"RelicNFT","tokenId":"2","exists":false,"uri":"https://web-zeta-tan-13.vercel.app/relics/{id}.json","totalSupply":"NOT VERIFIED: no totalSupply(uint256) getter in this contract; full mint/transfer history not reconstructed"}
{"contract":"RelicNFT","tokenId":"3","exists":false,"uri":"https://web-zeta-tan-13.vercel.app/relics/{id}.json","totalSupply":"NOT VERIFIED: no totalSupply(uint256) getter in this contract; full mint/transfer history not reconstructed"}
{"contract":"RelicNFT","tokenId":"4","exists":false,"uri":"https://web-zeta-tan-13.vercel.app/relics/{id}.json","totalSupply":"NOT VERIFIED: no totalSupply(uint256) getter in this contract; full mint/transfer history not reconstructed"}
{"contract":"RelicMarket","activeListingCount":"0","nextListingId":"2","lifetimeListingCount":"1","relicNFT":"0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D"}
{"contract":"RelicMarket","feeSettings":"No fee getters in committed ABI; repository source charges no platform fee (network gas still applies)"}
```

Script syntax — **PASS**, `node --check scripts/onchain-proof.mjs` exited 0. Failure checks — **PASS**:

```text
$ node reports/t5-judge-pack/proof-failure-check.mjs "$PWD"
PASS empty: exit 1; both missing contracts reported
PASS wrong-chain: exit 1; failure explicitly reported
PASS read-error: exit 1; failure explicitly reported
```

Link and final scope checks are recorded below after report finalization. The explorer re-check and HTTP failure evidence above are genuine read-only network observations. No `forge verify-contract`, PR, merge, Actions invocation, deployment, database mutation or contest submission was performed. Commits use `[skip ci]` to suppress push CI.

## 6. NOT verified

- Live game health, current deployed build/configuration, Supabase auth/backend availability, real
  wallet SIWE/mint/trade and faucet funding. The documented Vercel deployment is missing.
- Any numeric token supply or exhaustive token enumeration; contract lacks a getter and historical
  log reconstruction was not performed. `exists = false` is not printed as a measured supply value.
- Deploy/mint/list/purchase transaction receipts; no recorded hashes were available in docs/reports.
- Explorer UI's Exact Match badge/creation timestamp and full independent runtime-bytecode rebuild.
  The owner-confirmed record and independent API/source/settings check are distinguished.
- Mainnet readiness, audit completion, production performance, measured finality or gas costs.

## 7. Human decisions and out-of-zone observations

1. Restore the documented Vercel deployment, or supply the correct URL. The on-chain NFT metadata URI
   points at this same unavailable host, so metadata/art availability also needs owner attention.
2. Retrieve the existing two deployment receipts (do not redeploy to fill evidence), execute/locate
   one successful mint/list/buy and paste hashes into the integration guide's five TODO-OWNER rows.
3. Prepare two funded Fuji wallets and a progressed player/pending voucher for the live demonstration.
4. If judges need exact supply, use a complete historical log/indexer reconstruction; changing the
   contract to add a getter is outside this mission. Market lifetime count is not purchase evidence.
5. Existing game-rules expected failures/skips and prior security-review findings remain outside scope.
   No assertion is made that those are fixed or that the security reviews constitute an audit.

## 8. Branch, commits and reproduction

Branch: `ai/codex-t5-judge-pack`; clean base: `6d493b0` (latest fetched `origin/main`, after T2).
Git author: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`.
Implementation/evidence snapshot commit and push result are recorded below. A later report-only metadata
commit is visible in `git log origin/main..HEAD` and in the task's final response.

Reproduce from the task branch after frozen install: run `pnpm onchain-proof`,
`node reports/t5-judge-pack/proof-failure-check.mjs "$PWD"`, `forge test --root contracts`, and the
workspace commands above. On hosts without corepack, prefix every pnpm command with
`npx -y pnpm@10.28.0`. RPC state/counts will change; the saved proof pins block 60097612 and its hash.
Explorer API URLs and source SHA-256 values are retained in the evidence JSON. Network checks use
public read-only endpoints and need no wallet, secrets or live database write.
