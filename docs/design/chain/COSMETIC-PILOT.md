# Finite cosmetic pilot — protocol v1, 2026-11-12

This is a prepared testnet measurement protocol, not a completed human trial. The local feature, receipt verifier and cohort analyzer work. No participants have been recruited by Codex; no messages, backend deployment or public transactions were sent. All testnet YARN has no real value.

## Product and cost

Fern, Tide and Ember are three permanent, account-bound room styles. Each costs exactly 4 YARN burned through the existing `YarnToken.seal` receipt mechanism. Preview and resetting the room style are free. Buying grants no stats, rank, better rewards or tradable output. There is no repeat charge, expiry, subscription or random outcome. The entire catalog costs 12; the existing 20-YARN judge grant is unchanged.

This is the implemented version of the 4-YARN decor hypothesis in FEATURE-BUDGETS. E19/E20 support investigating context-specific cosmetic utility; neither establishes the price of 4 or a purchase rate. A finite catalog creates finite potential demand. Its spending competes with seals and market purchases for the same wallet balance.

The UI validates the authenticated player, wallet, selected SKU, token, exact integer cost and domain-separated intent before signing. An order ID is bound to wallet and deployment. Finalization reads immutable `sealPayments(wallet,intent)`, not a client transaction hash. Lost responses recover the existing order and do not burn twice. Browser tests alter a quote by one wei and substitute another SKU; both are rejected before a transaction. SQL enforces one permanent purchase per player/SKU and denies browser writes. Styles intentionally remain with the original account when a guest moves blockchain assets to another wallet; the UI help discloses this distinction.

## Fixed protocol before recruitment

1. Freeze the feature/source revision, three-item catalog, 4-YARN price, 20-YARN grant, observation start/end, enrollment deadline and recruitment channel. Record changes as a new cohort; do not combine versions to make a result pass.
2. Enroll all agreeing participants before observing whether they preview or buy. Keep a pseudonymous subject ID and reviewed wallet mapping. No private keys, emails, names or IP addresses belong in the research export. Additional wallets are grouped under the same reviewed subject, not extra people.
3. Use one price for this first observational pilot. Do not call it a randomized price experiment or infer an optimal price. Retain nonbuyers, participants who never open Style, failed purchases and dropouts. Operator/script/suspected/unreviewed classifications are fixed using criteria independent of spending outcomes, with exclusion counts reported. A shared sponsor is not proof of a bot or shared identity.
4. Give every entrant a full seven-day purchase window; end enrollment at least eight days before the observation close if measuring the day7 return metric. At each predeclared review close, report incomplete follow-up. Do not include an immature entrant solely because they already bought.
5. Primary metric: proportion of eligible enrolled participants with a verified first cosmetic payment in `[joinedAt, joinedAt + 7 days)`. Secondary metrics: all-enrolled purchase over the entire observation window (unequal follow-up, labelled), purchase after preview (selected population), day7 return in `[join+7 days, join+8 days)`, burn by review class, unpaid orders and recovery failures. Chain receipts prove payment, not enjoyment; record optional qualitative reasons separately without turning them into rewards.
6. Keep 95% Wilson intervals with numerators and denominators. With 100 independent participants the largest half-width is about 9.6 percentage points; with 400 it is about 4.9 points. These are precision examples, not minimum recruitment promises, A/B power, or proof of independence. Reused wallets, self-selection and unobserved bot clusters may invalidate population inference. No optional stopping after a favorable interval.
7. Decide the next experiment after closing and reviewing the cohort: fix friction if errors prevent purchase; improve a specific style/preview if feedback supports it; run a new predeclared price comparison only if the sample and assignment support one. Do not increase token rewards merely to buy the new catalog. An unsuccessful pilot remains useful evidence.

The free testnet grant changes incentives. Even voluntary testnet spending cannot establish real-money willingness to pay or long-term demand. A seven-day pilot cannot close the original 13-week seasonal health gate. Cosmetic interest is conditional on chain participation; it must not replace the chain-adoption parameter in the model. Simulations still include zero/weak interest and stock saturation after this pilot.

## Evidence pipeline

`tools/chain/pilot-evidence.mjs` analyzes a versioned offline roster plus verified purchases. `tools/chain/audit-cosmetic-pilot.mjs` derives the purchases by checking reviewed server orders against read-only Fuji logs and immutable contract payment amounts. The verifier never signs, takes no key and uses a fixed public RPC endpoint.

The reviewed export has `{cohort, orders, fromBlock, snapshotBlock}`. `cohort` contains version1, chainId43113, token, mode (`synthetic`, `controlled` or `voluntary`), provenance, Unix-second `start/end/asOf`, and `subjects`. Each subject contains `id`, `wallets`, `review`, `joinedAt`, nullable `exposedAt`, and `visits`. It contains **no purchases**. `orders` is a complete trusted export of `chain_cosmetic_orders` for those wallets whose `created_at < cohort.end`, including pending orders. Participants with earlier purchases need a separately declared cohort; this protocol rejects pre-enrollment orders.

Enrollment, exposure, visits, review labels and export completeness are external assertions requiring a reviewed collection process. The current cosmetic API does not collect that roster/telemetry automatically; do not reconstruct nonbuyers from the orders table. A transaction hash, screenshot or list of buyers cannot substitute for the denominator.

`fromBlock` must have timestamp no later than `start`. `snapshotBlock` must have timestamp at least `end` and be at least 12 blocks behind the observed head. `asOf` cannot predate the snapshot. The verifier scans contiguous ranges of at most 100 blocks, checks each counted event against its successful canonical receipt and matching burn, checks each order's pinned `sealPayments`, and rechecks the snapshot hash. It includes burned payments whose HTTP acknowledgment was lost. Payments settling after the observation window reconcile but do not enter conversion. Unmatched `SealPaid` events remain unclassified; they may be item seals or omitted orders. They never become cosmetic demand by inference.

```sh
node tools/chain/audit-cosmetic-pilot.mjs reviewed-export.json pilot-audit.json --read-only
node tools/chain/pilot-evidence.mjs verified-input.json pilot-analysis.json
```

The second command is optional: the first already includes `input` and `analysis`. Keep real participant exports private; only publish aggregates reviewed for disclosure. The committed `COSMETIC-PILOT-LOCAL*.json` files contain disposable Anvil scripts and explicitly say synthetic. Their two scripted subjects cannot establish adoption or retention. All pilot reports return `activation:false` and `budgetEligibleBurn:'0'`; a feature sample is not a complete token ledger or closed-season budget authorization.

## Deployment boundary

The local harness enables the feature. Public builds require the user's migration `20261112060000_chain_cosmetics.sql`, function `chain-cosmetics`, server flag `CHAIN_COSMETICS_ENABLED=1`, and frontend `VITE_YARN_COSMETICS=1` with the existing YARN feature. Neither flag is automatically enabled by the normal demo flag. No new contract is needed and existing Relic/YARN deployments must be preserved. Source/routine preparatory migrations 040000/050000 remain disabled and do not grant browser authority.

References: [E19/E20/E21/E22](TOKENOMICS-RESEARCH.md#measurement-and-finite-utility--read-2026-11-12); [finite-style simulations](../../chain/cosmetic-pilot-study.html); [calibration decisions](CALIBRATION-ROUND-2.md).
