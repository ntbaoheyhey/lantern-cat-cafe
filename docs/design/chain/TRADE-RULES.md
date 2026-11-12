# Item trading — Fuji only
Testnet — no real value. Sources: [research, Item trading](TOKENOMICS-RESEARCH.md#item-trading--ten-read-sources).

## Policy
Sale fee 5% (500 bps): 40% of the fee to burn/native sink, 60% treasury. YARN seal burns 10% of fixed reference value. These are prototype hypotheses, benchmarked in T1–T5, not market valuations. No floor, ceiling, deposit or volume rewards. Fee rate is immutable at deployment (max 10%); cancellation costs only gas. Integer math rounds down the total fee and burned share; treasury gets the remainder. V1 and direct transfers can bypass V2 fees.

Three seals per account/UTC day, level 2 from authoritative progression, 10-minute V2 relisting delay after purchase. These limit issuance velocity and casual cycling; wallets and shared faucet funding are not human identity. No listing deposit: friction is already supplied by the seal burn and gas. Suspicious same-pair round trips, self-funded transfers, new-wallet clusters and abnormally concentrated volume should be reviewed, never automatically punished based only on price or common sponsor (T6–T8). No trading-volume rewards to farm.

The fixed server-run boss grants one original Star Thread/account and authoritative level 2. Its 20-YARN reference makes a seal cost 2 YARN. Ordinary offline campaign saves, localStorage edits and imported saves never create transferable inventory. The boss-proof achievement stays bound. Existing Epic/Legendary templates are catalog-eligible, but campaign issuance awaits C2 server authority; no client inventory can seal them today. Depth seals normalize to an unenhanced template with minimum affix rolls and the same set/unique effects. Normalization requires explicit disclosure before a future authority adapter consumes rolled gear. All 64 Epic+ templates are checked against reachable same-tier gear at levels 1/10/30 within 5% Power; the current chain Treasure slot is cosmetic with zero combat effect (stronger than the <=3pp requirement).

## Ownership and recovery
Reserve locks one inventory row under a transaction lock and daily cap. YARN.seal burns once per player/intent. The server checks the immutable on-chain amount, consumes the source row and signs an ERC-1155 voucher. Renewals always use the same nonce; crash/retry cannot mint twice. Consumed means removed from off-chain inventory even before mint. No unsealing. Browser loss can recover the intent with the same SIWE wallet; guest-key loss cannot be recovered by the server. The chain bag reads balanceOfBatch on load and Transfer events; escrow, sales and direct transfers remove usable ownership. RelicNFT has no burn API: future forge item sinks must use irrecoverable custody and be tracked separately from token supply.

## Reserved ID ranges
1–4 existing Relics; 10000–19999 materials (10001 Star Thread); 20000–29999 gear. Stable gear IDs encode explicit set codes 0–7, rarity and slot; the original 20020–20233 IDs remain unchanged. The union covers all 128 Depth templates and the 48 overlapping legacy templates exactly once; unknown sets fail closed. Rarity indexes are 0 common, 1 rare, 2 epic, 3 legendary. No new NFT contract. Original game resources remain off chain.

## Complete catalog decision table
| Item ID · name | Class | Token ID | Reference YARN | Reason |
|---|---|---:|---:|---|
| hearthloom-weapon-common · Common Hearthloom Pan | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| hearthloom-outfit-common · Common Hearthloom Apron | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| hearthloom-charm-common · Common Hearthloom Bell | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| hearthloom-relic-common · Common Hearthloom Cup | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| hearthloom-weapon-rare · Rare Hearthloom Pan | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| hearthloom-outfit-rare · Rare Hearthloom Apron | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| hearthloom-charm-rare · Rare Hearthloom Bell | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| hearthloom-relic-rare · Rare Hearthloom Cup | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| hearthloom-weapon-epic · Epic Hearthloom Pan | TRADABLE | 20020 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| hearthloom-outfit-epic · Epic Hearthloom Apron | TRADABLE | 20021 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| hearthloom-charm-epic · Epic Hearthloom Bell | TRADABLE | 20022 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| hearthloom-relic-epic · Epic Hearthloom Cup | TRADABLE | 20023 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| hearthloom-weapon-legendary · The patient doorstop · Hearthloom Utensil | TRADABLE | 20030 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| hearthloom-outfit-legendary · The nightglass needle · Hearthloom Apron | TRADABLE | 20031 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| hearthloom-charm-legendary · The first seedcup · Hearthloom Clasp | TRADABLE | 20032 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| hearthloom-relic-legendary · The rain bell · Hearthloom Keepsake | TRADABLE | 20033 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| moonwick-weapon-common · Common Moonwick Needle | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| moonwick-outfit-common · Common Moonwick Shawl | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| moonwick-charm-common · Common Moonwick Button | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| moonwick-relic-common · Common Moonwick Wick | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| moonwick-weapon-rare · Rare Moonwick Needle | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| moonwick-outfit-rare · Rare Moonwick Shawl | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| moonwick-charm-rare · Rare Moonwick Button | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| moonwick-relic-rare · Rare Moonwick Wick | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| moonwick-weapon-epic · Epic Moonwick Needle | TRADABLE | 20120 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| moonwick-outfit-epic · Epic Moonwick Shawl | TRADABLE | 20121 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| moonwick-charm-epic · Epic Moonwick Button | TRADABLE | 20122 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| moonwick-relic-epic · Epic Moonwick Wick | TRADABLE | 20123 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| moonwick-weapon-legendary · The crumb ledger · Moonwick Utensil | TRADABLE | 20130 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| moonwick-outfit-legendary · The returning pan lid · Moonwick Apron | TRADABLE | 20131 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| moonwick-charm-legendary · The unfading wick · Moonwick Clasp | TRADABLE | 20132 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| moonwick-relic-legendary · The hidden silk spool · Moonwick Keepsake | TRADABLE | 20133 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| mossbrew-weapon-common · Common Mossbrew Kettle | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| mossbrew-outfit-common · Common Mossbrew Vest | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| mossbrew-charm-common · Common Mossbrew Leaf | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| mossbrew-relic-common · Common Mossbrew Snowdrop | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| mossbrew-weapon-rare · Rare Mossbrew Kettle | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| mossbrew-outfit-rare · Rare Mossbrew Vest | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| mossbrew-charm-rare · Rare Mossbrew Leaf | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| mossbrew-relic-rare · Rare Mossbrew Snowdrop | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| mossbrew-weapon-epic · Epic Mossbrew Kettle | TRADABLE | 20220 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| mossbrew-outfit-epic · Epic Mossbrew Vest | TRADABLE | 20221 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| mossbrew-charm-epic · Epic Mossbrew Leaf | TRADABLE | 20222 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| mossbrew-relic-epic · Epic Mossbrew Snowdrop | TRADABLE | 20223 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| mossbrew-weapon-legendary · The star ladle · Mossbrew Utensil | TRADABLE | 20230 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| mossbrew-outfit-legendary · The soft collar · Mossbrew Apron | TRADABLE | 20231 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| mossbrew-charm-legendary · The tide tray · Mossbrew Clasp | TRADABLE | 20232 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| mossbrew-relic-legendary · The garden key · Mossbrew Keepsake | TRADABLE | 20233 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| rainlace-weapon-common · Common Rainlace Utensil | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| rainlace-outfit-common · Common Rainlace Apron | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| rainlace-charm-common · Common Rainlace Clasp | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| rainlace-relic-common · Common Rainlace Keepsake | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| rainlace-weapon-rare · Rare Rainlace Utensil | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| rainlace-outfit-rare · Rare Rainlace Apron | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| rainlace-charm-rare · Rare Rainlace Clasp | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| rainlace-relic-rare · Rare Rainlace Keepsake | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| rainlace-weapon-epic · Epic Rainlace Utensil | TRADABLE | 20320 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| rainlace-outfit-epic · Epic Rainlace Apron | TRADABLE | 20321 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| rainlace-charm-epic · Epic Rainlace Clasp | TRADABLE | 20322 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| rainlace-relic-epic · Epic Rainlace Keepsake | TRADABLE | 20323 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| rainlace-weapon-legendary · The patient doorstop · Rainlace Utensil | TRADABLE | 20330 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| rainlace-outfit-legendary · The nightglass needle · Rainlace Apron | TRADABLE | 20331 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| rainlace-charm-legendary · The first seedcup · Rainlace Clasp | TRADABLE | 20332 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| rainlace-relic-legendary · The rain bell · Rainlace Keepsake | TRADABLE | 20333 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| crumbweave-weapon-common · Common Crumbweave Utensil | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| crumbweave-outfit-common · Common Crumbweave Apron | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| crumbweave-charm-common · Common Crumbweave Clasp | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| crumbweave-relic-common · Common Crumbweave Keepsake | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| crumbweave-weapon-rare · Rare Crumbweave Utensil | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| crumbweave-outfit-rare · Rare Crumbweave Apron | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| crumbweave-charm-rare · Rare Crumbweave Clasp | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| crumbweave-relic-rare · Rare Crumbweave Keepsake | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| crumbweave-weapon-epic · Epic Crumbweave Utensil | TRADABLE | 20420 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| crumbweave-outfit-epic · Epic Crumbweave Apron | TRADABLE | 20421 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| crumbweave-charm-epic · Epic Crumbweave Clasp | TRADABLE | 20422 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| crumbweave-relic-epic · Epic Crumbweave Keepsake | TRADABLE | 20423 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| crumbweave-weapon-legendary · The crumb ledger · Crumbweave Utensil | TRADABLE | 20430 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| crumbweave-outfit-legendary · The returning pan lid · Crumbweave Apron | TRADABLE | 20431 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| crumbweave-charm-legendary · The unfading wick · Crumbweave Clasp | TRADABLE | 20432 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| crumbweave-relic-legendary · The hidden silk spool · Crumbweave Keepsake | TRADABLE | 20433 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| bellsteel-weapon-common · Common Bellsteel Utensil | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| bellsteel-outfit-common · Common Bellsteel Apron | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| bellsteel-charm-common · Common Bellsteel Clasp | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| bellsteel-relic-common · Common Bellsteel Keepsake | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| bellsteel-weapon-rare · Rare Bellsteel Utensil | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| bellsteel-outfit-rare · Rare Bellsteel Apron | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| bellsteel-charm-rare · Rare Bellsteel Clasp | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| bellsteel-relic-rare · Rare Bellsteel Keepsake | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| bellsteel-weapon-epic · Epic Bellsteel Utensil | TRADABLE | 20520 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| bellsteel-outfit-epic · Epic Bellsteel Apron | TRADABLE | 20521 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| bellsteel-charm-epic · Epic Bellsteel Clasp | TRADABLE | 20522 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| bellsteel-relic-epic · Epic Bellsteel Keepsake | TRADABLE | 20523 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| bellsteel-weapon-legendary · The star ladle · Bellsteel Utensil | TRADABLE | 20530 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| bellsteel-outfit-legendary · The soft collar · Bellsteel Apron | TRADABLE | 20531 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| bellsteel-charm-legendary · The tide tray · Bellsteel Clasp | TRADABLE | 20532 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| bellsteel-relic-legendary · The garden key · Bellsteel Keepsake | TRADABLE | 20533 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| emberfelt-weapon-common · Common Emberfelt Utensil | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| emberfelt-outfit-common · Common Emberfelt Apron | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| emberfelt-charm-common · Common Emberfelt Clasp | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| emberfelt-relic-common · Common Emberfelt Keepsake | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| emberfelt-weapon-rare · Rare Emberfelt Utensil | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| emberfelt-outfit-rare · Rare Emberfelt Apron | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| emberfelt-charm-rare · Rare Emberfelt Clasp | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| emberfelt-relic-rare · Rare Emberfelt Keepsake | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| emberfelt-weapon-epic · Epic Emberfelt Utensil | TRADABLE | 20620 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| emberfelt-outfit-epic · Epic Emberfelt Apron | TRADABLE | 20621 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| emberfelt-charm-epic · Epic Emberfelt Clasp | TRADABLE | 20622 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| emberfelt-relic-epic · Epic Emberfelt Keepsake | TRADABLE | 20623 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| emberfelt-weapon-legendary · The patient doorstop · Emberfelt Utensil | TRADABLE | 20630 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| emberfelt-outfit-legendary · The nightglass needle · Emberfelt Apron | TRADABLE | 20631 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| emberfelt-charm-legendary · The first seedcup · Emberfelt Clasp | TRADABLE | 20632 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| emberfelt-relic-legendary · The rain bell · Emberfelt Keepsake | TRADABLE | 20633 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| velvetrim-weapon-common · Common Velvetrim Utensil | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| velvetrim-outfit-common · Common Velvetrim Apron | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| velvetrim-charm-common · Common Velvetrim Clasp | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| velvetrim-relic-common · Common Velvetrim Keepsake | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| velvetrim-weapon-rare · Rare Velvetrim Utensil | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| velvetrim-outfit-rare · Rare Velvetrim Apron | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| velvetrim-charm-rare · Rare Velvetrim Clasp | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| velvetrim-relic-rare · Rare Velvetrim Keepsake | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| velvetrim-weapon-epic · Epic Velvetrim Utensil | TRADABLE | 20720 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| velvetrim-outfit-epic · Epic Velvetrim Apron | TRADABLE | 20721 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| velvetrim-charm-epic · Epic Velvetrim Clasp | TRADABLE | 20722 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| velvetrim-relic-epic · Epic Velvetrim Keepsake | TRADABLE | 20723 | 100 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| velvetrim-weapon-legendary · The crumb ledger · Velvetrim Utensil | TRADABLE | 20730 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| velvetrim-outfit-legendary · The returning pan lid · Velvetrim Apron | TRADABLE | 20731 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| velvetrim-charm-legendary · The unfading wick · Velvetrim Clasp | TRADABLE | 20732 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| velvetrim-relic-legendary · The hidden silk spool · Velvetrim Keepsake | TRADABLE | 20733 | 300 | Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity. |
| boss-proof · Yarnkeeper Seal | BOUND | — | — | Achievement evidence, not a transferable substitute for boss completion. |
| milk-tonic · Warm Milk Tonic | BOUND | — | — | Repeatable consumable/key; routine farming must not mint supply. |
| shield-biscuit · Shield Biscuit | BOUND | — | — | Repeatable consumable/key; routine farming must not mint supply. |
| quicken-yarn · Quicken Yarn | BOUND | — | — | Repeatable consumable/key; routine farming must not mint supply. |
| cleanse-tea · Clearleaf Tea | BOUND | — | — | Repeatable consumable/key; routine farming must not mint supply. |
| ultimate-treat · Starlight Treat | BOUND | — | — | Repeatable consumable/key; routine farming must not mint supply. |
| pantry-key · Pantry Key | BOUND | — | — | Repeatable consumable/key; routine farming must not mint supply. |
| cafe-ribbon · Cafe Ribbon | BOUND | — | — | Repeatable permanent collection unlock, not a scarce issue. |
| cat:mochi · Mochi | BOUND | — | — | Cats and their XP/shards are account progression; never sold. |
| cat:soot · Soot | BOUND | — | — | Cats and their XP/shards are account progression; never sold. |
| cat:clover · Clover | BOUND | — | — | Cats and their XP/shards are account progression; never sold. |
| cat:panko · Panko | BOUND | — | — | Cats and their XP/shards are account progression; never sold. |
| cat:mallow · Mallow | BOUND | — | — | Cats and their XP/shards are account progression; never sold. |
| cat:sorrel · Sorrel | BOUND | — | — | Cats and their XP/shards are account progression; never sold. |
| cat:biscuit · Biscuit | BOUND | — | — | Cats and their XP/shards are account progression; never sold. |
| cat:inkcap · Inkcap | BOUND | — | — | Cats and their XP/shards are account progression; never sold. |
| cat:cinnamon · Cinnamon | BOUND | — | — | Cats and their XP/shards are account progression; never sold. |
| cat:brioche · Brioche | BOUND | — | — | Cats and their XP/shards are account progression; never sold. |
| cat:velvet · Velvet | BOUND | — | — | Cats and their XP/shards are account progression; never sold. |
| cat:marigold · Marigold | BOUND | — | — | Cats and their XP/shards are account progression; never sold. |
| fish · fish | BOUND | — | — | Soft currency, common material or progression; never a transferable earning receipt. |
| threads · threads | BOUND | — | — | Soft currency, common material or progression; never a transferable earning receipt. |
| essence · essence | BOUND | — | — | Soft currency, common material or progression; never a transferable earning receipt. |
| stamps · stamps | BOUND | — | — | Soft currency, common material or progression; never a transferable earning receipt. |
| xp · xp | BOUND | — | — | Soft currency, common material or progression; never a transferable earning receipt. |
| shards · shards | BOUND | — | — | Soft currency, common material or progression; never a transferable earning receipt. |
| materials · materials | BOUND | — | — | Soft currency, common material or progression; never a transferable earning receipt. |
| seals · seals | BOUND | — | — | Soft currency, common material or progression; never a transferable earning receipt. |
| selector-marks · selector-marks | BOUND | — | — | Soft currency, common material or progression; never a transferable earning receipt. |
| route-points · route-points | BOUND | — | — | Soft currency, common material or progression; never a transferable earning receipt. |
| star-thread · Star Thread | TRADABLE | 10001 | 20 | One authoritative judge boss drop/account; reserved rare-material fixture, no combat power. |
| relic:1 · Paw Charm | TRADABLE | 1 | 50 | Existing signed-voucher collection; cosmetic Treasure only. Judge mints are free test allocations. |
| relic:2 · Star Bell | TRADABLE | 2 | 100 | Existing signed-voucher collection; cosmetic Treasure only. Judge mints are free test allocations. |
| moon-collar · Moon Collar | TRADABLE | 3 | 200 | Existing signed-voucher collection; cosmetic Treasure only. Judge mints are free test allocations. |
| golden-maneki · Golden Maneki | TRADABLE | 4 | 400 | Existing signed-voucher collection; cosmetic Treasure only. Judge mints are free test allocations. |

Generated from packages/game-rules/src/cardrpg/trade.ts by tools/chain/trade-doc.mjs. Every current gear, stack item, cat and soft resource is classified; unknown IDs are bound by default. C2 owns stats/drop tables. Research T9 informs filters and visible fee/proceeds.
