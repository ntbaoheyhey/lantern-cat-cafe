# Card RPG item tiers and local supply
REFERENCE: DESIGN.md, BALANCE.md, ../../../packages/game-rules/src/cardrpg/depth/equipment.ts, ../../../packages/game-rules/src/cardrpg/depth/run.ts, ../../../packages/game-rules/src/cardrpg/config.ts

Source audit and automatic-battle measurements for phase I, 6 November 2026. Equipment-only receipts are in reports/cardrpg-big/items/BALANCE.md. The later encounter tuning and its paired gear/economy receipts are in reports/cardrpg-big/items/ENCOUNTER-BALANCE.md. The table describes the depth game's current rules. All random rewards and spendable balances are account-bound.

## Equipment bands
REFERENCE: ../../../packages/game-rules/src/cardrpg/depth/equipment.ts, ../../../packages/game-rules/src/cardrpg/catalog.ts

There are 128 templates across eight sets and four slots. Two and four matching pieces activate the existing set effects. Main-stat enhancement adds 6% of the base per level, up to +12, with integer rounding. Affix ranges depend on item level and the selected affix. Phase I main stats use 75% of earlier values and affix ranges use 25%, rounded with a minimum of one. Old saved rolls use the current effective bounds in the equipment panel and combat.

| Rarity | Weapon ATK | Outfit HP | Charm DEF | Keepsake HP | Affixes | Item levels | Distinct presentation | Salvage threads |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: |
| Common | 9 | 34 | 5 | 19 | 0 | 1–9 | Linen frame and role equipment | 2 |
| Rare | 12 | 43 | 6 | 25 | 1 | 9–17 | Blue enamel frame | 5 |
| Epic | 15 | 52 | 8 | 31 | 2 | 17–25 | Violet foil frame | 12 |
| Legendary | 18 | 61 | 9 | 37 | 3 | 25–33 | Animated gold frame and one of 12 named effects/geometries | 25 |

| Reward source | Common | Rare | Epic | Legendary | Selection and limit |
| --- | ---: | ---: | ---: | ---: | --- |
| Won ordinary encounter | 65% | 30% | 5% | 0% | Uniform eligible template within rolled rarity |
| Won elite encounter | 0% | 70% | 27% | 3% | Source chapter must be reached |
| Won boss encounter | 0% | 20% | 70% | 10% | Shared limit of six encounter drops per local day |
| Mending Basket invitation | 55% | 34% | 10% | 1% | First three sets, missing templates preferred, pity applies |
| Chosen tailoring | Selected | Selected | Selected | Selected | Deterministic chosen template and chapter requirement |

Tailoring common/rare costs180 fish and30 threads. Epic costs120 fish,180 threads and5 essence. Legendary costs500 fish,100 threads,20 essence,20 mastery materials and1 boss seal, with a Midnight Pantry clear. Enhancement level n costs30×n² fish and3×n threads. Reforge costs90 fish and15 threads for a compatible different affix at its minimum tier roll.

The strongest tested legendary at maximum compatible rolls and+12 contributes9.63% of the bare level1 starter team's final displayed power, passing the stated10%cap. The earlier maximum was15.22%. Paired boss results separately measure utility omitted by the display score. The display score uses HP/5 +2×ATK +1.5×DEF. Per-cat stat caps and the existing unique-effect rules bound combat values. After encounter tuning, paired boss utility peaks at+42percentage points in training and+34in heldout.26/48adjacent tier steps raise wins and22tie. Level1 heldout bare/common/rare/epic/legendary route wins are0/33/40/48/50 in chapter1,0/16/29/41/50 in chapter2 and0/4/11/33/49 in chapter3, each out of50. Level6 saturation and wide set/cat utility spreads keep the balance gate open.45-day heavy/casual earned ratios peak at2.194775696×, passing3×.

## Item types, sources and sinks
REFERENCE: ../../../packages/game-rules/src/cardrpg/depth/state.ts, ../../../packages/game-rules/src/cardrpg/depth/run.ts, ../../../packages/game-rules/src/cardrpg/depth/bridge.ts, ../../../packages/game-rules/src/cardrpg/catalog.ts

| Type | Tiers and source | Use and sink | Power / binding |
| --- | --- | --- | --- |
| Cat cards and duplicate shards | Common/rare/epic/legendary. Cat invitations start60/30/9/1% | Collect team members. Duplicates become2/5/12/25 shards. Ascension consumes shards | Account-bound. Level caps20/30/40/50, up to5 stars |
| Equipment | Four tiers and source table above | Four slots per cat. Enhance, reforge, salvage | Account-bound, deterministic main-stat bands |
| Mastery materials | Route rewards, capped30 repeatable/day. First chapter clears grant80/100/120 | Awakening and legendary tailoring | Account-bound. Awakening adds3% HP/ATK per rank, up to3 |
| Boss seals | One rewarded successful route/day |3 or10 seals reserve a design. One seal also funds legendary tailoring | Account-bound effort currency |
| Packed milk tonic | One at route start, existing route shop can refill | Consume between encounters to restore up to100 HP per cat | Account-bound current-route supply |
| Pantry inventory | Common tonic and rare consumables from existing pantry recipes | Stored account consumables retain their existing recipe/sink definitions | Account-bound legacy inventory |
| Pantry key | Rare, weekly quest or40-thread recipe | Consumed by the existing pantry refill recipe | Account-bound |
| Cafe ribbon | Epic,10 essence and20 threads | Permanent local collection unlock | Account-bound cosmetic |
| Run charms and skill upgrades | Offered after encounters or by route choices | Run-limited bonuses, individual stacking caps, upgrades up to3 | Account-bound current-route rewards |
| Run points |35 opening points,35/65/100 for ordinary/elite/boss wins, plus route events | Shop and event choices | Current-route balance |
| Fish / threads / stamps / essence | Routes, quests and cafe service. Repeatable daily caps420/90/180/6 | Levels and equipment / equipment / invitations / ascension and awakening | Account-bound spendable balances |
| Relic design reservation | Deterministic effort path below | Consumes seals and one local account reservation slot | Collectible-eligible design record |

## Collectible-eligible designs
REFERENCE: ../../../packages/game-rules/src/cardrpg/depth/bridge.ts, ../../../packages/game-rules/src/cardrpg/catalog.ts

| Design | Global design cap | Season cap | Effort | Local counters | Gameplay effect |
| --- | ---: | ---: | --- | --- | --- |
| Moon Collar | 2,400 | 400 |3 seals and one cleared chapter | Account scarcity records show issued and season-issued totals. One reservation/account | Reservation adds0 battle stats |
| Golden Maneki |360 |60 |10 seals and all3 chapter masteries, or tower floor5 with10 seals | Same counter checks and one reservation/account | Reservation adds0 battle stats |

The in-game label is “Design only - not minted”. A reservation checks both local counters before consuming seals and increments both in one successful transaction. Local save counters support the prototype's cap checks. Network-wide issuance authority is a future integration. The existing read-only Fuji holdings panel separately applies one selected cup's fixed effect to the leading companion. Quantity contributes zero extra power.

Earned invitations cost150 stamps each, with up to10 per batch and30 per local day. Soft pity starts on pull41 at +3 percentage points legendary chance per pull. Pull60 guarantees legendary. Each banner group carries its own pity and the featured banner guarantees its featured cat after a legendary miss. Every invitation result remains account-bound.
