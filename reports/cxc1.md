# CXC1 — Avalanche proof script and evidence

Date: 2026-11-01 (Asia/Ho_Chi_Minh). Repository: `ntbaoheyhey/taskbar-hero`.
Branch: `ai/codex-cxc1`. Base: latest fetched `origin/main` at `ea3da8c85a5486863403ea11c2d9172b416b332f`.
Implementation and local verification are complete. Live event history is **NOT VERIFIED**, an accepted outcome. Delivery is a draft PR targeting `main`; no merge is authorized or performed.

## What changed

- `scripts/chain-proof.mjs` runs a read-only viem proof using only the existing public Fuji RPC, with one JSON document on stdout, human tables on stderr, optional `--out`, and exit 1 on any failed check.
- `packages/chain/src/proof/` contains injected-client helpers, CLI/runtime wiring, and 25 new offline tests. They cover pass fixtures, wrong chain, absent code, selector mismatch, timeouts/rate limits, getter/history failures, event formatting/pagination, output files, argument validation, and CLI exit codes.
- Checks confirm chain 43113, bytecode at the required NFT/market addresses, every generated ABI function selector (including zero-trimmed Solidity selectors), NFT owner/signer, and `RelicMarket.relicNFT()`.
- Event categories use the actual ABI: `TransferSingle`/`TransferBatch`, `Listed`, and `Bought` (labeled Sold). A complete scan returns the newest 20 per category or explicitly exhausts deployment history; failed scans cannot be reported as successful empty histories.
- Public reads are paced, logs use 100-block windows, state reads share one snapshot block, and historical code locates deployment. The runtime reuses viem already installed in `apps/web`; no dependency or ABI changes.
- `docs/avalanche-integration.md` replaces the prior long guide with a 97-line source-backed judge guide, classic/v2 forge distinctions, actual contract function names, explorer links, and exact proof commands.
- `reports/chain-proof.md` includes the complete new live stdout JSON and stderr table. Its evidence is summarized below.

Tier 2 edits: **none**. All implementation files are in Tier 1; this mission report is explicitly requested.
No contract, ABI, authentication/SIWE, secrets, migration, live database, game/economy configuration, dependency, `.github`, art, visibility, or submission changes. No art was created. Existing forge work remains untouched in the original checkout; this branch uses a separate clean worktree.

## What is NOT verified

- **Complete last-20 Transfer/Listed/Sold event history:** both live scans failed on HTTP 429 from the public RPC. The script exited **1**, and the generated report correctly says **NOT VERIFIED**. There are no fabricated event rows or alternate explorer/API fallbacks.
- Hosted UI/server configuration and a complete hosted forge → voucher → mint → list → buy session were not exercised. The guide distinguishes source facts from deployment claims.
- Exact runtime-source identity, proxy implementation behavior, return types, and all function behavior are not established by static selector compatibility.
- `name()`, `symbol()`, and `totalSupply()` are **NOT EXPOSED** by this generated ERC-1155 ABI; the script does not infer or fabricate them. The NFT exposes `owner()` and `signer()`; the market has no owner getter.
- UI screenshots at 1280×720 and 1600×900: **not applicable**; no UI, CSS, assets, or layouts were changed. No UI result is claimed.

## Commands and output tails

Configured the requested Git identity before any branch work:

```sh
git config user.email 108352255+ntbaoheyhey@users.noreply.github.com
git config user.name ntbaoheyhey
git fetch origin
git worktree add -b ai/codex-cxc1 /Users/bao/.codex/worktrees/cxc1/taskbar-hero origin/main
```

```text
HEAD is now at ea3da8c CXR0: desktop audit and future shell smoke harness (#230)
```

### Install — exit 0

```sh
node --version
pnpm --version
CI=true pnpm install --frozen-lockfile
```

```text
v24.22.2
10.28.0
Progress: resolved 505, reused 496, downloaded 0, added 503
Progress: resolved 505, reused 496, downloaded 0, added 505, done

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 6s using pnpm v10.28.0
```

The installer left `pnpm-workspace.yaml` and `pnpm-lock.yaml` unchanged; no restoration or dependency edit was needed.

### Offline proof tests and typecheck — exit 0

```sh
pnpm --filter @taskbar-hero/chain test
pnpm --filter @taskbar-hero/chain typecheck
```

```text
 RUN  v5.0.5 /Users/bao/.codex/worktrees/cxc1/taskbar-hero/packages/chain


 Test Files  3 passed (3)
      Tests  32 passed (32)
   Start at  00:30:24
   Duration  1.05s (import 39%, tests 36%, transform 24%, worker 1%)


> @taskbar-hero/chain@0.0.0 typecheck /Users/bao/.codex/worktrees/cxc1/taskbar-hero/packages/chain
> tsc --noEmit

```

### Workspace tests — exit 0

```sh
pnpm test
```

**2,240 passed**, 2 expected failures, 11 existing skipped tests. No test failures were introduced or hidden.

```text
packages/auth test:    Duration  1.90s (import 73%, tests 24%, transform 4%)
packages/auth test: Done
supabase/tests test:  Test Files  27 passed (27)
supabase/tests test:       Tests  517 passed (517)
supabase/tests test:    Start at  00:30:24
supabase/tests test:    Duration  15.64s (tests 79%, import 16%, transform 4%)
supabase/tests test: Done
packages/game-rules test:  Test Files  24 passed | 3 skipped (27)
packages/game-rules test:       Tests  366 passed | 2 expected fail | 11 skipped (379)
packages/game-rules test:    Start at  00:30:24
packages/game-rules test:    Duration  37.55s (tests 86%, transform 12%, import 2%)
packages/game-rules test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/cxc1/taskbar-hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  00:31:02
packages/api-contract test:    Duration  267ms (transform 79%, import 18%, tests 2%, worker 1%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /Users/bao/.codex/worktrees/cxc1/taskbar-hero/apps/web
apps/web test:  Test Files  110 passed (110)
apps/web test:       Tests  1285 passed (1285)
apps/web test:    Start at  00:31:03
apps/web test:    Duration  20.40s (environment 47%, tests 37%, import 10%, transform 5%)
apps/web test: Environment  jsdom was created 110 times · 80.94s total, 47% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done
```

### Live proof — exit 1, NOT VERIFIED

```sh
node scripts/chain-proof.mjs
# Optional JSON file on a later rerun:
node scripts/chain-proof.mjs --out reports/chain-proof.json
```

The first command was executed live; the optional rerun command is documented, not claimed as another successful live run. Nine checks passed and two event checks failed on HTTP 429. Complete captured stdout/stderr are pasted in [chain-proof.md](chain-proof.md).

```text
Fuji chain proof: NOT VERIFIED

| Check | Result | Detail |
| --- | --- | --- |
| Fuji chain id | PASS | 43113 |
| Snapshot block | PASS | 60312845 |
| RelicNFT: code exists | PASS | 14200 bytes |
| RelicNFT: ABI selectors | PASS | 22 ABI function selectors present |
| RelicNFT: owner() | PASS | 0x2Bba9a48F7F79d99154108A28d32f1a21d17055c |
| RelicNFT: signer() | PASS | 0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000 |
| RelicMarket: code exists | PASS | 7713 bytes |
| RelicMarket: ABI selectors | PASS | 12 ABI function selectors present |
| Market uses this RelicNFT | PASS | 0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D |
| RelicNFT: recent events | FAIL | RPC rate limited (HTTP 429): Fuji is NOT VERIFIED. Wait for the public endpoint limit to reset, then retry. |
| RelicMarket: recent events | FAIL | RPC rate limited (HTTP 429): Fuji is NOT VERIFIED. Wait for the public endpoint limit to reset, then retry. |
```

### Scope and formatting

```sh
git diff --check
wc -l docs/avalanche-integration.md
git diff --exit-code -- pnpm-workspace.yaml pnpm-lock.yaml
```

```text
97 docs/avalanche-integration.md
```

Diff/manifest checks produced no errors. No lint/link debt was used as an acceptance line. All verification ran locally; no Actions workflow was dispatched. The delivery commit carries `[skip ci]`; the PR must remain a draft.
