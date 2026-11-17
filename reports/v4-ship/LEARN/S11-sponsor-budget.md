# QA-8 complete demo sponsor budget

Read17November before changes. Keep0.05AVAX/grant,1AVAX reserve,3wallets/IP/24h,50wallets/UTCday and server gas-price cap200gwei. No new economics, contract, drip amount or live funding.

1. [Ethereum gas](https://ethereum.org/en/developers/docs/gas/): a simple native transfer uses21,000gas; gas prices vary.
2. [Viem getGasPrice](https://viem.sh/docs/actions/public/getGasPrice): reads a current gas-price estimate, not a promise for all future grants.
3. [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html), formal documentation: transaction-scoped advisory locks serialize cooperating reservations.
4. Existing `20261112010000_guest_drip.sql`: a locked per-wallet admission subtracts pending reservations and the new payment+21,000gas, preserving1AVAX. It is not a whole-journey reservation.
5. `guest-drip.ts` and `journey-workshop.ts`: a fresh guest and a separate demo buyer require two grants. Already-funded wallets can be accounted for explicitly; no private keys are needed for planning.
6. Independent QA `Q2/RESERVE-FAULT.md`: local1.075AVAX passes the one-wallet runbook check, but the second drip fails; fixture restored exactly. This is not evidence of a public Fuji failure.
7. Own two-method arithmetic `S11/sponsor-budget-study-1.json`: compare old one-wallet minimum to whole-run/batch limits for1run,3runs and3runs+2pending grants. The reported fault passes old and fails new. Current-price1run minimum1.10105AVAX; conservative200gwei+0.1AVAXheadroom minimum1.2084AVAX before pending. Three fresh runs require1.4252AVAX before pending.

Decision: a read-only reusable CLI budgets2×runs minus explicitly already-funded wallets, existing pending obligations, worst allowed gas per new grant and fixed0.1AVAXheadroom. The runbook requires this complete-batch check and quota planning; it allocates no funds and does not claim an atomic journey reservation. Preserve the server transaction as final per-wallet authority and require a fresh check before each planned batch. Change only sponsor_low recovery text to identify café funding, not the guest balance. Validate boundary arithmetic, unsafe inputs, pending/gas stress, existing API mapping and a local two-wallet admission sequence.
