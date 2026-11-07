# Relic edition value and issuance boundary
REFERENCE: GAMEPLAY-V4.md sections4/6/9; RESEARCH-GAMEPLAY-V4.md principles9–11; sources.json V4-AXIE-SOURCES/CUT/P2E/SOR/GU/DORMANS; packages/game-rules/src/cardrpg/catalog.ts SCARCITY.

Status: off-chain implementation specification and a future proposal, 2026-11-07. No contracts, wallet/auth, live Supabase or existing Fuji holdings behavior is changed. Scarcity supports provenance and collection meaning; it does not establish a resale price or guarantee income. The game's value must come from replayable preparation choices, original companions and completed activities without recruiting new buyers.

## Eligible objects and value separation

Only the two existing Relic edition designs are eligible for a future Avalanche Fuji Relic mint proposal. Ordinary cats, equipment, shards, currencies, selector marks, keys, run rewards and milestone badges remain account-bound. There is no fungible token, purchase, cash-out, mainnet or custom L1. No contract deployment or mint is part of this work.

| Edition | Lifetime issuance | Season issuance | Account allowance | Effort consumed / qualification |
|---|---:|---:|---|---|
| Moon Collar |2400|400|1 per edition per season|3 distinct rewarded boss-day seals and chapter1 clear|
| Golden Maneki |360|60|1 per edition per season|10 distinct rewarded boss-day seals and all3 chapter masteries or Tower floor5|

Season is a monotonic UTC calendar month in the demo authority. One account may reserve at most one edition on a UTC day, and earns at most one boss-day seal/day. Seals spent on gear or designs cannot count again. Existing seal balances may migrate as explicitly labelled legacy local effort; they are never accepted as server-authenticated proof. Past designClaims/counters migrate as legacy reservations using their historical counts, without granting a mint, refund or new allowance. Imported over-cap or inconsistent ledgers are rejected for new issuance rather than silently reducing counters.

Both designs and the fusion badge contribute **zero stats, skills, actions, drops or gacha odds**. Tested paired combat outcomes should be identical; the requested upper bound is3 percentage points. UI says "Design only — not minted", "Local authority preview" and shows issued counts rather than fabricated global network supply. Existing Fuji holdings stay in their protected read-only/selection flow and are not created by these commands.

## Pure authority model

`scarcity.ts` owns data types and a pure transition `applyIssuance(ledger, command, authorityContext)`. It returns either `{ok:true, ledger, receipt}` or `{ok:false, ledger: original, error}`. Inputs are not mutated. The account adapter spends seals and updates the ledger in one `transactDepth` transaction, so a failure never charges resources or advances IDs.

Ledger schema1 has authorityId, revision, currentSeason, lifetimeIssued by edition, seasonIssued by edition+season, durable accountClaims, lastReservationDay, consumedProofIds, reservation records and an ordered event list. Reservations have serial/id, edition, accountId, season, issuance sequence and status (`live`/`burned`/`fused`). Every event includes schema version, sequence, commandId, expectedRevision, kind, accountId, authority time/season and its full validated payload. IDs are canonical strings with bounded length; counters are nonnegative safe integers. No user-supplied count or claimed balance is trusted merely because it is in a command.

Authority context supplies the current time/season, effort receipts and qualification state independently of the request. In the local demo the context is derived from actual account commands and is user-editable with the rest of the save; this is not authentication. A future server context must come from authenticated identity and durable settlement records, not uploaded client state. Rules tests can construct contexts explicitly without calling a network.

| Command | Checks before mutation | Result |
|---|---|---|
| Reserve |Known edition; current season; valid account; expected revision equals head; new commandId; under lifetime/season/account/day limits; enough unspent eligible effort; qualification; serial unique|Consume effort, append one live reservation, increment monotonic issued counters and revision|
| Burn |New commandId/revision; record exists, live and owned by account|Mark burned and append event; lifetime, season, account issuance allowances and spent effort do not decrease|
| Fuse |Two distinct owned live Moon records from different seasons; no prior fusion badge; new commandId/revision|Mark both fused; grant one bound cosmetic badge; no new edition issuance, no cap reopened|
| Advance season |Trusted authority time enters a strictly later UTC month; cannot skip backward|Update currentSeason, retain prior records/counters; new month's counters start0 on first claim|

Same-command replay returns the original receipt only when its canonical payload matches; a reused ID with different payload is rejected. A stale distinct command is rejected with current revision and must be resubmitted after re-reading remaining supply. Do not mutate a stale request into a successful issue behind the user's back. Two requests for the last slot against the same starting revision cannot both succeed when applied sequentially to one authority. Independent copied ledgers can both succeed locally: the UI and report acknowledge this boundary.

Event replay begins from a validated genesis (including any explicit legacy migration anchors), revalidates every event against the preceding revision and independently derives all counters/holdings. Compare its resulting state to a stored snapshot. Unknown kinds, duplicate sequence/command/serial, altered proof use, out-of-order season changes, missing receipts, incorrect supplied counters and attempted negative burns fail. A checksum protects accidental corruption only; a future signature/Merkle commitment is additional infrastructure, not pretended local security.

## Tests and simulations

Unit tests: final lifetime and final season slot; race on same revision; exact duplicate request versus changed duplicate; wrong owner; insufficient seals; repeated proof; season rollback; forward rollover; account/day limit; burning cannot mint a replacement; fusion cannot increase supply; failed transaction spends nothing; unsafe numeric/prototype input; replay equality and edited-event rejection. Migration: old zero-state, existing design claims, spent seals, mismatched counters, oversized save and THC7/8 round trips. Ledger size is bounded by configured lifetime supply, with claim indexes derived from events and validated; no arbitrary history truncation may lose spent proofs.

Simulation: several accounts compete for a tiny configured test cap using production transition semantics, randomized request ordering and fixed seeds; replay must equal the authority and total successful issuance must equal the cap. Production cap fixtures exercise2400/400 and360/60 boundaries without requiring2400 model runs. Paired boss fixtures compare no edition, each edition and fused badge using identical teams/equipment/seeds; expected exact equality. Report original and replayed ledger digests, issuance totals, rejection reasons and seeds. No price or projected yield simulation.

## Future Fuji-only step — proposal, not implementation

1. An authenticated server becomes the sole issuance authority and owns atomic storage transactions, unique command/serial/proof constraints and monotonic season time. It verifies effort from durable game settlement, rate limits account actions and detects duplicate sessions. Client clocks, saves and seed-selected outcomes are not evidence for mint eligibility.
2. Account uniqueness remains a product/abuse-control decision; wallet count is not personhood. Earn caps, replay protection and effort requirements slow simple farming but do not prove resistance to Sybil accounts or bots. No biometric or identity-data scheme is introduced here.
3. An explicitly authorized issuer prepares a Fuji Relic mint proposal after reserved eligibility is verified and durable receipt exists. Contract review must confirm lifetime/season enforcement and issuer roles; the existing contract may not implement this proposal. No assumption that it can be upgraded safely or without a separate user decision.
4. Minted metadata references edition ID, season, serial, capped edition definition, original provenance and the issuance receipt commitment. Keep detailed gameplay receipts, account balances, anti-abuse information and personal data off-chain. No on-chain gacha randomness, fungible rewards or secrets.
5. Commit/reserve/mint reconciliation must distinguish pending, succeeded and failed network transactions; retries use the same issuance ID and can never allocate another serial for one reservation. A refund or cancel policy must explicitly preserve lifetime accounting and prevent race reuse. Local burn/fusion is not an on-chain burn transaction.
6. Tradeability, creator royalties, collection ownership, mint authority and whether any design should actually become a Fuji Relic remain user decisions. Even if approved later, gameplay power separation and no cash-out/token scope remain constraints. Nothing is promoted automatically.

## Player-facing explanation

"An edition records an evening you earned. Reserve it with boss seals after its milestone. This preview tracks local edition supply; it does not mint an NFT. Your design never changes combat strength."

The screen provides the actual lifetime/season numbers, remaining local slots, my live/burned/fused records, qualifications, spent effort and a readable issuance receipt. The ordinary equipment keepsake slot and actual Fuji holdings are linked with distinct labels so the player cannot mistake a gear draw for a minted asset.
