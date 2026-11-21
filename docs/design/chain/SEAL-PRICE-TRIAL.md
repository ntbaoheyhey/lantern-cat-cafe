# Seal price trial — local implementation, 2026-11-12

The disabled `basket-trial-v1` policy makes a complete self-sourced forge cost13 YARN: two Epic seals at5 each and the existing forge cost3. One style4 and one Star Thread seal1 leave2 from the unchanged20 grant. This is a feasible basket, not a purchase requirement, demand estimate or completed economic calibration.

## Why this candidate

The original10% policy makes the same forge cost23. The216 paired cases in [seal-fee-study](../../chain/seal-fee-study.html) keep cohort, C2 supply, earning window, grant, cosmetic interest and purchasing priority fixed. At50% participation with forge first,5% raises completed outputs from201–258 to424–526 and reduces worst claims/burn from2.623 to2.395. Every case at that participation still fails the original2× threshold.2.5% worsens the ratio to2.788. There is no inferred demand elasticity and no automated reward increase.

The grant-inclusive conservation bound remains: `claims = burned + retained wallets + treasury`. Universal grants to persistent nonspenders cannot be repaired solely by lowering future rewards. At50% participation, even spending the active half's entire grant merely reaches2× with no room for additional claims. Preserve this failure in review; do not omit nonbuyers, burn their balances, or require spending for reward eligibility.

## Implemented behavior

- `CHAIN_SEAL_PRICE_TRIAL=1` selects5%; unset/0 selects the original10%. Selection is server-side; no client price, fee or policy field is accepted. Production defaults remain unchanged.
- Inventory responses publish the policy. New reservations use that policy. The existing atomic SQL reservation preserves the original exact cost when enabling or rolling back the trial. No migration or new NFT/token deployment is required for this price option.
- The client displays the existing reservation's amount when recovering. Before a debit it verifies inventory ID, item, token ID, rarity, intent ID/hash and the exact displayed amount. Any changed response stops before signing, reloads the quote and requires another player click. Existing receipts must match the reserved amount.
- The forge budget includes older reserved Epic inputs at their original cost. Missing future source inputs use the current hypothetical price, with the existing source requirement disclosed. Held/escrowed/consumed copies are never invented as inputs.
- The grant20, sale5% (2% burn +3% treasury), forge3 and style4 remain fixed. Prices in P2P listings stay unrestricted. Combat power, source authority, caps and allocation are unchanged.

## Local proof and reproduction

`node tools/chain/check-seal-trial.mjs` starts disposable Anvil43113 and uses only public development keys. One real tester claim funds two fixture-authorized Epic seals, the irreversible forge, a permanent room style and the authoritative judge Star Thread. It checks18 burned,2 retained, one bound ornament, one style, one sealed thread, consumed source copies and idempotent recovery. [SEAL-TRIAL-LOCAL.json](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/chain/SEAL-TRIAL-LOCAL.json) contains the local transaction evidence. The synthetic source fixture is explicitly not campaign authority or a human trial.

`pnpm chain:test` verifies the original policy; `CHAIN_SEAL_PRICE_TRIAL=1 pnpm chain:test` verifies the candidate on a fresh chain. Both exercise altered-quote rejection before any debit, recovery and exact on-chain balances. SQL tests cover pending reservations across activation and rollback. These commands never use public wallet keys.

## Later voluntary measurement

Use the existing fixed-denominator [pilot protocol](COSMETIC-PILOT.md), with a separately frozen cohort/version for a changed seal policy. Predeclare13-week earning window, source access, full basket costs, market exposure and seven-day completion follow-up. Count every enrolled nonbuyer and incomplete recipe; report completed outputs, retained money and errors as well as burns. Keep two-sided market interference explicit (E23/E24). Do not compare selected buyers or merge price cohorts retrospectively. No participant recruitment, telemetry collection or public flag activation has been performed.

Read E37 again for preservation of existing offers; E39 supports binding authorization to displayed transaction details. Neither establishes the5% rate. This implementation removes a testability/affordability defect; economic and ordinary campaign authority gates remain open.
