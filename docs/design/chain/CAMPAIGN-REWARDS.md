# Campaign reward authority — disabled by default

The campaign now produces immutable boss-completion facts in the same database transaction as progression. A failed transaction produces neither. Only a real transition from an unfinished boss node to a won campaign route is recorded; losses, abandons, item exports and repeated response recovery produce no extra win. The timestamp comes from the database after the settlement lock. Offline saves, client scores and client clocks never authorize rewards.

The one-season reward program binds a Fuji SeasonRewards address, its verified Monday `seasonEpoch`, a campaign rules hash and one earning season. Migration1000 creates no program. Its enabled default is false; service roles cannot change its epoch, rules or earning window. A separately reviewed, funded budget is still required. The internal `createCampaignRewardAuthority` is also disabled by default and exposes no public signing endpoint.

Weekly boss eligibility is the first recorded campaign boss win in the current Monday week, once per player. The proposed maximum remains1.5 YARN in the disabled pilot; every ordinary battle and every repeat win grants0. A receipt selector includes the internal player UUID, kind and period, so two players cannot collide on one nonce. It resolves to server evidence, not caller-supplied amounts. Existing preparation/reservation binds player, wallet, evidence, budget, exact amount, current chain cap and an expiry before both week and season rollover.

Season rank scores sum the highest chapter completed in each week:1–3 per week, at most39 across13 weeks. Repeating the same chapter cannot raise that week's score. Payments, purchases, equipment ownership and trade volume never enter ranking. This is a bounded campaign-pilot scoring proposal, not a change to C2's offline leaderboard. The source study only exercises chapter1; it does not validate how harder-chapter ability distributes in a population.

The rank maximum comes from the immutable **earning-season** budget. A different maximum in the later settlement budget cannot inflate or rewrite that earned tier. Missing historical terms fail closed. The current funded budget and on-chain cap can still refuse payment. There is one reservation per earned event: an oversized claim is not silently split, paid partially or reissued under another nonce. An unpaid rank may therefore expire after its settlement season. The new campaign economy model follows this whole-voucher rule; historical hypothetical-issuer controls are separately labelled.

A finalizer can archive a season only after its end. Completions and finalization share an advisory lock. A completion waiting across that boundary receives its post-lock server timestamp and cannot appear retroactively in the old snapshot. The immutable archive stores all qualified player scores, including zero-award players. Repeated finalization returns the same archive. The following season can settle its rank while new boss earning remains closed; the pilot cannot silently renew.

The original top1/10/25/50% rank slots and6/4/2/1 relative weights remain. Equal-score players share the sum of the slots their tie occupies, with each share rounded down in wei. Dust stays in the pool. At100 players and a1.5 ceiling, all100 tied players each receive a maximum0.2425, totalling24.25. Assigning all of them the top award would incorrectly promise150. Small populations retain the original percentile boundary: a sole player occupies100%, outside the rewarded top50%, rather than receiving an invented minimum.

No amount is payable merely because a win or rank exists. Disabled programs, missing closed budgets, zero awards, exhausted reserves, reduced on-chain caps or expired claims fail closed. The funded reservation ledger still conservatively retains expired/ambiguous commitments; no unproven refund/reissue path is introduced. A closed score snapshot is proof of game results, not proof of voluntary token demand.

Local proof:

- `chain-campaign-rewards.test.ts`: exact tier/tie conservation across300 populations, identity separation, malformed values, disabled rules, historical season boundary, zero awards, immutable archive and unauthorized writes.
- `check-reservations-postgres.mjs`: eight competing wins create one fact; rollback creates none. Eight closes recover one snapshot; removal of the close lock in a disposable negative control produces conflicting inserts.
- `check-campaign-rewards.mjs`:20 real server commands from starter through a boss win, stored authority, disabled-by-default budget registration, explicit local activation,1.5-YARN Anvil claim and replay rejection. No injected victory or public transaction.

Research:E42–E44 in TOKENOMICS-RESEARCH.md. Program activation, organic demand and hosted verification remain separate gates. No change to deployed20-YARN tester grant, live seal/sale fees, token allocation or C2 combat/drop tables.
