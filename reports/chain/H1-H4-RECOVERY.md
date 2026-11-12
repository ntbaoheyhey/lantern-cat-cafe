# Guest and mint recovery — 2026-11-12

Continuation of H1/H4; existing worktree, draft PR, contracts and public evidence preserved.

- Mixed-flag builds no longer expose guest creation when guestWallet is off. Standard and depth entries mount the wallet provider consistently for individually enabled chain features.
- Every contract write checks Fuji and the authenticated signer before simulation and again before signing. Account disconnect/switch fails closed. Asset migration refuses zero/self destinations.
- A transaction client cannot create a replacement key if storage was cleared. Key creation remains at explicit guest sign-in. Export/move actions share a synchronous lock to prevent overlapping clicks.
- Gas balance is independent of drip availability, refreshes on confirmed transactions/polling without extra grant requests, and clears stale values when RPC fails. Faucet recovery remains available after funds are spent.
- Minting renews an expired/near-expiry judge voucher with its original nonce. Refresh also renews Judge vouchers; already-used vouchers cannot mint twice.
- Room events retain the requested tab; a disabled chainLoop cannot be activated by a custom browser event.

Proof: baseline Forge118 and web2395 pass. New focused guest/runtime/flags/gas regression cases added; expired-voucher regression is exercised in the authenticated Anvil browser loop. Three fresh browser runs pass2/2 each, full loops16.2s/18.6s/16.7s. Initial gas tests selected two implicit status regions; selector correction passed4/4 without changing behavior or skipping tests. Web typecheck passes. Final full unit suite passed (web2405, rules1352, SQL597, chain32, auth24, API16, scripts11); Forge118, web typecheck and production build passed. Evidence is in tests/recovery-*.log.

Screenshots regenerated and mobile Bag inspected. These local times do not establish the public Fuji two-minute target. No public signing, deployment, contract edit or C2 gameplay change. Card score9 after full gates.
