# Item trading — Fuji only
Testnet — no real value. Sources: [research, Item trading](TOKENOMICS-RESEARCH.md#item-trading--ten-read-sources).

## Policy
Sale fee 5% (500 bps): 40% of the fee to burn/native sink, 60% treasury. YARN seal burns 10% of fixed reference value. These are prototype hypotheses, benchmarked in T1–T5, not market valuations. No floor, ceiling, deposit or volume rewards. Fee rate is immutable at deployment (max 10%); cancellation costs only gas. Integer math rounds down the total fee and burned share; treasury gets the remainder. V1 and direct transfers can bypass V2 fees.

Three seals per account/UTC day, level 2 from authoritative progression, 10-minute V2 relisting delay after purchase. These limit issuance velocity and casual cycling; wallets and shared faucet funding are not human identity. No listing deposit: friction is already supplied by the seal burn and gas. Suspicious same-pair round trips, self-funded transfers, new-wallet clusters and abnormally concentrated volume should be reviewed, never automatically punished based only on price or common sponsor (T6–T8). No trading-volume rewards to farm.

The fixed server-run boss grants one original Star Thread/account and authoritative level 2. Its 20-YARN reference makes a seal cost 2 YARN. Ordinary offline campaign saves, localStorage edits and imported saves never create transferable inventory. The boss-proof achievement stays bound. Existing Epic/Legendary templates are catalog-eligible, but campaign issuance awaits C2 server authority; no client inventory can seal them today. Equipment uses an identical grindable template, tested within 5% Power; the current chain Treasure slot is cosmetic with zero combat effect (stronger than the <=3pp requirement).

## Ownership and recovery
Reserve locks one inventory row under a transaction lock and daily cap. YARN.seal burns once per player/intent. The server checks the immutable on-chain amount, consumes the source row and signs an ERC-1155 voucher. Renewals always use the same nonce; crash/retry cannot mint twice. Consumed means removed from off-chain inventory even before mint. No unsealing. Browser loss can recover the intent with the same SIWE wallet; guest-key loss cannot be recovered by the server. The chain bag reads balanceOfBatch on load and Transfer events; escrow, sales and direct transfers remove usable ownership. RelicNFT has no burn API: future forge item sinks must use irrecoverable custody and be tracked separately from token supply.

## Reserved ID ranges
1–4 existing Relics; 10000–19999 materials (10001 Star Thread); 20000–29999 gear. Stable gear IDs encode an explicit set key, rarity and slot; adding unknown sets fails closed. Rarity indexes are 0 common, 1 rare, 2 epic, 3 legendary. No new NFT contract. Original game resources remain off chain.

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
| hearthloom-weapon-epic · Epic Hearthloom Pan | TRADABLE | 20020 | 100 | Scarce earned gear; identical grindable template; no token premium. |
| hearthloom-outfit-epic · Epic Hearthloom Apron | TRADABLE | 20021 | 100 | Scarce earned gear; identical grindable template; no token premium. |
| hearthloom-charm-epic · Epic Hearthloom Bell | TRADABLE | 20022 | 100 | Scarce earned gear; identical grindable template; no token premium. |
| hearthloom-relic-epic · Epic Hearthloom Cup | TRADABLE | 20023 | 100 | Scarce earned gear; identical grindable template; no token premium. |
| hearthloom-weapon-legendary · Legendary Hearthloom Pan | TRADABLE | 20030 | 300 | Scarce earned gear; identical grindable template; no token premium. |
| hearthloom-outfit-legendary · Legendary Hearthloom Apron | TRADABLE | 20031 | 300 | Scarce earned gear; identical grindable template; no token premium. |
| hearthloom-charm-legendary · Legendary Hearthloom Bell | TRADABLE | 20032 | 300 | Scarce earned gear; identical grindable template; no token premium. |
| hearthloom-relic-legendary · Legendary Hearthloom Cup | TRADABLE | 20033 | 300 | Scarce earned gear; identical grindable template; no token premium. |
| moonwick-weapon-common · Common Moonwick Needle | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| moonwick-outfit-common · Common Moonwick Shawl | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| moonwick-charm-common · Common Moonwick Button | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| moonwick-relic-common · Common Moonwick Wick | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| moonwick-weapon-rare · Rare Moonwick Needle | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| moonwick-outfit-rare · Rare Moonwick Shawl | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| moonwick-charm-rare · Rare Moonwick Button | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| moonwick-relic-rare · Rare Moonwick Wick | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| moonwick-weapon-epic · Epic Moonwick Needle | TRADABLE | 20120 | 100 | Scarce earned gear; identical grindable template; no token premium. |
| moonwick-outfit-epic · Epic Moonwick Shawl | TRADABLE | 20121 | 100 | Scarce earned gear; identical grindable template; no token premium. |
| moonwick-charm-epic · Epic Moonwick Button | TRADABLE | 20122 | 100 | Scarce earned gear; identical grindable template; no token premium. |
| moonwick-relic-epic · Epic Moonwick Wick | TRADABLE | 20123 | 100 | Scarce earned gear; identical grindable template; no token premium. |
| moonwick-weapon-legendary · Legendary Moonwick Needle | TRADABLE | 20130 | 300 | Scarce earned gear; identical grindable template; no token premium. |
| moonwick-outfit-legendary · Legendary Moonwick Shawl | TRADABLE | 20131 | 300 | Scarce earned gear; identical grindable template; no token premium. |
| moonwick-charm-legendary · Legendary Moonwick Button | TRADABLE | 20132 | 300 | Scarce earned gear; identical grindable template; no token premium. |
| moonwick-relic-legendary · Legendary Moonwick Wick | TRADABLE | 20133 | 300 | Scarce earned gear; identical grindable template; no token premium. |
| mossbrew-weapon-common · Common Mossbrew Kettle | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| mossbrew-outfit-common · Common Mossbrew Vest | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| mossbrew-charm-common · Common Mossbrew Leaf | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| mossbrew-relic-common · Common Mossbrew Snowdrop | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| mossbrew-weapon-rare · Rare Mossbrew Kettle | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| mossbrew-outfit-rare · Rare Mossbrew Vest | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| mossbrew-charm-rare · Rare Mossbrew Leaf | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| mossbrew-relic-rare · Rare Mossbrew Snowdrop | BOUND | — | — | Repeatable ordinary gear; keep routine progression bound. |
| mossbrew-weapon-epic · Epic Mossbrew Kettle | TRADABLE | 20220 | 100 | Scarce earned gear; identical grindable template; no token premium. |
| mossbrew-outfit-epic · Epic Mossbrew Vest | TRADABLE | 20221 | 100 | Scarce earned gear; identical grindable template; no token premium. |
| mossbrew-charm-epic · Epic Mossbrew Leaf | TRADABLE | 20222 | 100 | Scarce earned gear; identical grindable template; no token premium. |
| mossbrew-relic-epic · Epic Mossbrew Snowdrop | TRADABLE | 20223 | 100 | Scarce earned gear; identical grindable template; no token premium. |
| mossbrew-weapon-legendary · Legendary Mossbrew Kettle | TRADABLE | 20230 | 300 | Scarce earned gear; identical grindable template; no token premium. |
| mossbrew-outfit-legendary · Legendary Mossbrew Vest | TRADABLE | 20231 | 300 | Scarce earned gear; identical grindable template; no token premium. |
| mossbrew-charm-legendary · Legendary Mossbrew Leaf | TRADABLE | 20232 | 300 | Scarce earned gear; identical grindable template; no token premium. |
| mossbrew-relic-legendary · Legendary Mossbrew Snowdrop | TRADABLE | 20233 | 300 | Scarce earned gear; identical grindable template; no token premium. |
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
| fish · fish | BOUND | — | — | Soft currency, common material or progression; unlimited/off chain. |
| threads · threads | BOUND | — | — | Soft currency, common material or progression; unlimited/off chain. |
| essence · essence | BOUND | — | — | Soft currency, common material or progression; unlimited/off chain. |
| stamps · stamps | BOUND | — | — | Soft currency, common material or progression; unlimited/off chain. |
| xp · xp | BOUND | — | — | Soft currency, common material or progression; unlimited/off chain. |
| shards · shards | BOUND | — | — | Soft currency, common material or progression; unlimited/off chain. |
| star-thread · Star Thread | TRADABLE | 10001 | 20 | One authoritative judge boss drop/account; reserved rare-material fixture, no combat power. |
| relic:1 · Paw Charm | TRADABLE | 1 | 50 | Existing signed-voucher collection; cosmetic Treasure only. Judge mints are free test allocations. |
| relic:2 · Star Bell | TRADABLE | 2 | 100 | Existing signed-voucher collection; cosmetic Treasure only. Judge mints are free test allocations. |
| moon-collar · Moon Collar | TRADABLE | 3 | 200 | Existing signed-voucher collection; cosmetic Treasure only. Judge mints are free test allocations. |
| golden-maneki · Golden Maneki | TRADABLE | 4 | 400 | Existing signed-voucher collection; cosmetic Treasure only. Judge mints are free test allocations. |

Generated from packages/game-rules/src/cardrpg/trade.ts by tools/chain/trade-doc.mjs. Every current gear, stack item, cat and soft resource is classified; unknown IDs are bound by default. C2 owns stats/drop tables. Research T9 informs filters and visible fee/proceeds.
