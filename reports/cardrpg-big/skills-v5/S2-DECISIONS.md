# S2 prospective resolver choices (before S2 samples)
- Formation adjacency uses stable actor order across front/rear boundaries; dead units are skipped. Row still uses the explicit row field.
- Bounce visits the chosen target then other living foes in formation order, without repeats, at 100/70/50% of skill power.
- Multi-hit draws a living foe before each of three landings, using only battle RNG; later hits retarget after a defeat. Each landing's status follows its hit.
- One source-target reaction per round is shared by all four reactions. A lethal direct hit can Spread; a surviving target checks Rupture before Wildfire. A lethal unmarked wide hit can still trigger Wildfire from the struck target’s Burn. Detonation offers Crumb Burst at its effect position.
- Reaction damage never produces another reaction, including Spread on a reaction-caused defeat. Reaction-applied statuses may prime later direct actions.
- Crumb Burst requires Crumb. Its existing formula still consumes Crumb plus Burn, at the existing detonation power; it does not detonate Burn alone.
- Spread copies debuffs with half stacks rounded up through the ordinary effect hit/resist path, refreshing durations; it never copies buffs.
- Self/weakest/team side effects execute once per cast, and only living sources finish those effects. Repeated-hit effects execute per landing.
- S3 must retain the appendix's Cinnamon revive and keep-skills. Those leave a structural conflict with the blanket every-cat-multitarget and every-cat-ultimate-per-normal-fight gates; report the conflict explicitly instead of hiding it or adding unsolicited effects.
