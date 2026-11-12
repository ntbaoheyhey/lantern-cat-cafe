# Server campaign source calibration

144 accounts ×14 days,24 deterministic seeds for each profile/loadout pair. Uses actual starter, battles, losses, daily quota and atomic-export transition rules. Rules hash: `23843bbd18cfe95aabc680f40b5e1a3128fb29b8672666ba4991f740cb787321`. This is a source experiment, not observed human behavior, verified bot identity, paid seals or a healthy token economy.

| Loadout | Profile | Win rate mean | Epic/week mean | Legendary/week mean | Export/week mean | Full14d seal cost10% /5% | First eligible day median /p95 |
|---|---|---:|---:|---:|---:|---:|---:|
|starter-only|casual|97.92%|2.42|0.25|2.67|63.33 / 31.67|1 / 3|
|starter-only|regular|97.22%|10.88|1.50|12.38|307.50 / 153.75|1 / 1|
|starter-only|heavy|98.02%|10.81|1.38|12.19|298.75 / 149.38|1 / 1|
|equip-earned|casual|100.00%|2.29|0.31|2.60|64.58 / 32.29|1 / 3|
|equip-earned|regular|99.11%|11.17|1.25|6.46|130.00 / 65.00|1 / 1|
|equip-earned|heavy|99.36%|11.44|1.21|6.71|134.17 / 67.08|1 / 1|

- Same server campaignStep as the optional endpoint; no injected resources or victories. Independent deterministic seeds, not humans.
- All profiles use actual starter funds to reach level2; no later training, invitations, craft or chapter advancement.
- Starter-only retains starter loadout; equip-earned chooses by rarity then base main value, with no duplicate equipment.
- Same first available route, first reward and first free event choice; no hidden-seed lookahead.
- At most3 unused eligible instances exported per active day. Export is source removal, not token demand or a paid seal.
- YARN costs are full eligible export costs without a balance ceiling. Judge grant20 can fund two10-YARN or four5-YARN Epics only; income from resale is not guaranteed.
- This new server campaign is separate from existing browser saves and from the C2 600-account supply study. Public activation remains off.

Conservation checked for every account: each generated instance remains in inventory or has exactly one export; equipped gear cannot export. Daily starts and rewarded-route counters never exceed6. Week values divide total14-calendar-day production by2; casual plays three days/week, regular three routes/day, heavy six routes/day.

The6-start cap bounds seed sampling and computation. It is not a population-level supply control: more wallets can still add source. The3-seal/day cap cannot establish affordability. Do not increase rewards merely to absorb all exports. Keep candidate5% and routine issuance disabled pending their separate gates; use earned surplus for optional cosmetics while preserving scarce gameplay loadouts.
