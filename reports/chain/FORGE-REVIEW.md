# Finite forge completion —2026-11-12

Implemented locally behind `VITE_RELIC_FORGE`; not enabled by the general demo flag. Existing Fuji NFT/YARN/markets are unchanged. User deployment of the optional new vault remains deferred.

- Three original permanent ornaments, zero combat/rank/reward effect. Each costs3 YARN +2 already-sealed canonical Epic units. Total self-sourcing seal preparation is20+3. No new NFT or transferable output.
- Ownerless, nonupgradeable vault has no withdrawal/approval/arbitrary-call route; receiver hooks reject unsolicited transfers. Items remain in ERC1155 supply but are unusable. `consumedOf` reports custody, not NFT burns.
- Contract tests verify atomic payment rollback, repeated identical IDs requiring two units, ownership/approval failures, unknown/non-Epic rejection, hook forgery, finite unlocks and no recovery path. Fuzz/invariant included.10 forge tests;100% lines in `tests/forge-final-coverage.log`.
- Browser client pins NFT/token/cost/catalog, checks on-chain holdings and uses exact3-YARN allowance. A lost successful response resolves from `hasDesign` without paying again. Free previews and explicit irreversible-input confirmation are provided.
- `check-forge.mjs` proves two synthetic trusted-source receipts →two real seal burns →unrestricted14-YARN lot sale →forge. The buyer has0 usable Epics, vault2, total burn23.28, treasury0.42, seller proceeds13.3. Retry adds0 charge. `FORGE-LOCAL.json` is Anvil evidence, not organic adoption or C2 campaign authority.
- Three consecutive independent browser runs passed with retries0: `forge-repair-e2e.log`, `forge-completion-e2e-2.log`, `forge-completion-e2e-3.log`. Judge/forge timings21.6/25.8,22.7/26.8,20.8/25.9seconds. Public Fuji timing remains unproven.
- The216-case shared-budget model and144-case recycling study still fail weak-demand/late-activity gates. Finite output is never reset every season or treated as endlessly repurchasable. Routine issuance stays disabled.

Wallet-bound ornaments do not move with fungible/NFT assets; the in-game help states this. Losing guest access loses access to these wallet-bound rights. No external security-audit claim is made.
