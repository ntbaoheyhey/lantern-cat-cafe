# C2 outbox

SLOTS READY e2aa86f00

Contract: apps/web/src/game/cardrpg/stage/slots.json. Four party slots; normalized feet coordinates; rear half-slot stagger; mirrored enemy x. B1 full unit 4403, full E2E 424, typecheck pass.

PILOTS READY 07cfdb0e0

Review: docs/vfx/index.html (self-contained); three pilots only. Full E2E 427/427; runtime 0.193 MB. All three pilots approved by the user on 12 Nov; V3 authorized.

V3 READY — 86 accepted artworks/timelines; 78 combat-event effects, eight explicitly labeled passive-stat previews. Runtime assets 5,783,929 bytes. Full verification: 4,453 unit/script passes; 435/435 E2E, zero skips/flakes; 33/33 word budgets, max24. Reports: vfx/VFX-REPORT.md; gallery: docs/vfx/index.html. No new character art.


B4b SUPPLY READY — candidate7 completed 2026-11-12T15:54:08.263280+00:00; 600 modeled accounts ×30 days across 28 matched calendar start dates. Runtime `007ce084d8e4573ec2d3d275390a0181719f88bbeff585cafeb7e66185d97efc`.

[ECONOMY.md](ECONOMY.md) · [ECONOMY.json](ECONOMY.json) · [WEEKLY-SUPPLY.json](WEEKLY-SUPPLY.json) · [Validated ledgers](ITEM7-ECONOMY-VALIDATION.json) · [Rarity curves](../../docs/cardrpg-c2/economy-rarity.svg)

Consumable rates: `rarePerActiveWeek=0.000000000`, `epicPerActiveWeek=14.519866667`, `legendaryPerActiveWeek=0.659808333`. The declared mix is 75% casual / 20% regular / 5% heavy. Rates count every modeled invitation, battle, selector and useful-craft transaction before salvage. Catalog eligibility uses exact CHAIN READY `394cf60613b5b576367e860b7dff8bab60dc84aa`; all64 Epic+ templates are represented.

| Profile | Active hours/week | Tradable Rare/week | Tradable Epic/week | Tradable Legendary/week |
|---|---:|---:|---:|---:|
| casual | 3.5 | 0.000000 | 14.358167 | 0.662667 |
| regular | 7 | 0.000000 | 14.848167 | 0.651000 |
| heavy | 21 | 0.000000 | 15.632167 | 0.652167 |

Accounts cycle through 28 consecutive start dates from 2026-11-12, matched across player profiles. Daily-route seeds remain shared by calendar date; account count is not independent date count. Variation is measured across this declared start-date window only. These are modeled policies, not measured demand, bot telemetry or independent daily loot draws. CHAIN's 3/10/30/70-hour policies require an explicit adaptation. Price Legendary sealing separately from Epic (30 versus 10 YARN); recurring tradable rare-material production is zero.

**Ordinary campaign authoritative issuance remains zero.** Catalog eligibility does not make browser saves trustworthy. Server-owned player/wallet bindings, immutable earning receipts, earned levels and consumed/sealed state remain required. Star Thread is a separate one-time CHAIN Judge entitlement (maximum one/account), with recurring rate zero. Treasure remains cosmetic; no legacy Relic stat path is enabled.

The per-item table covers all64 Epic+ templates and all modeled materials. W1–W4 are seven observed modeled days; W5 contains days 29–30 only. `/active week` normalizes the full 30-day exposure by 7/30. Each item's authoritative ordinary-campaign issuance is zero; gross creation and eligible templates remain separate. The earlier single-start-date cohort remains in Git commit `bc6757c15` and its original external account files; no samples were pooled.

| Item ID | Tradable | W1 | W2 | W3 | W4 | W5 (2d) | Gross/active week | Eligible/active week |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| bellsteel-charm-epic | yes | 0.406500 | 2.899250 | 2.960250 | 1.534250 | 0.105750 | 1.844733 | 1.844733 |
| bellsteel-charm-legendary | yes | 0.003750 | 0.619250 | 0.052250 | 0.160250 | 0.049750 | 0.206558 | 0.206558 |
| bellsteel-outfit-epic | yes | 0.197750 | 0.261250 | 1.874500 | 2.406000 | 0.629000 | 1.252650 | 1.252650 |
| bellsteel-outfit-legendary | yes | 0.003750 | 0.018250 | 0.004000 | 0.019750 | 0.012750 | 0.013650 | 0.013650 |
| bellsteel-relic-epic | yes | 0.201500 | 0.148750 | 0.149250 | 0.618750 | 0.402500 | 0.354842 | 0.354842 |
| bellsteel-relic-legendary | yes | 0.001000 | 0.030750 | 0.027000 | 0.017750 | 0.003750 | 0.018725 | 0.018725 |
| bellsteel-weapon-epic | yes | 0.161500 | 0.081750 | 0.068500 | 0.118500 | 0.061000 | 0.114625 | 0.114625 |
| bellsteel-weapon-legendary | yes | 0.003750 | 0.024000 | 0.009000 | 0.020250 | 0.010000 | 0.015633 | 0.015633 |
| boss-proof | bound | 0.000000 | 0.000000 | 0.000000 | 0.000000 | 0.000000 | 0.000000 | 0.000000 |
| boss-seal | bound | 7.000000 | 7.000000 | 7.000000 | 7.000000 | 2.000000 | 7.000000 | 0.000000 |
| cafe-ribbon | bound | 0.992500 | 0.007500 | 0.000000 | 0.000000 | 0.000000 | 0.233333 | 0.000000 |
| crumbweave-charm-epic | yes | 0.147250 | 0.071500 | 0.099750 | 0.117250 | 0.068000 | 0.117542 | 0.117542 |
| crumbweave-charm-legendary | yes | 0.004000 | 0.026750 | 0.007500 | 0.033250 | 0.002250 | 0.017208 | 0.017208 |
| crumbweave-outfit-epic | yes | 0.167250 | 0.187500 | 0.203000 | 0.230750 | 0.055000 | 0.196817 | 0.196817 |
| crumbweave-outfit-legendary | yes | 0.000000 | 0.032500 | 0.009000 | 0.023000 | 0.011250 | 0.017675 | 0.017675 |
| crumbweave-relic-epic | yes | 0.260750 | 0.191500 | 0.197750 | 0.203000 | 0.061750 | 0.213442 | 0.213442 |
| crumbweave-relic-legendary | yes | 0.002250 | 0.029500 | 0.010000 | 0.016250 | 0.005250 | 0.014758 | 0.014758 |
| crumbweave-weapon-epic | yes | 0.235000 | 0.217500 | 0.279250 | 0.316000 | 0.092250 | 0.266000 | 0.266000 |
| crumbweave-weapon-legendary | yes | 0.001000 | 0.029500 | 0.012500 | 0.009750 | 0.005000 | 0.013475 | 0.013475 |
| emberfelt-charm-epic | yes | 0.053750 | 0.031250 | 0.027500 | 0.046750 | 0.014250 | 0.040483 | 0.040483 |
| emberfelt-charm-legendary | yes | 0.005000 | 0.020250 | 0.014750 | 0.020750 | 0.013250 | 0.017267 | 0.017267 |
| emberfelt-outfit-epic | yes | 0.045500 | 0.027750 | 0.043750 | 0.015000 | 0.009750 | 0.033075 | 0.033075 |
| emberfelt-outfit-legendary | yes | 0.000000 | 0.025250 | 0.004750 | 0.013000 | 0.009250 | 0.012192 | 0.012192 |
| emberfelt-relic-epic | yes | 0.033500 | 0.006000 | 0.025500 | 0.042500 | 0.009750 | 0.027358 | 0.027358 |
| emberfelt-relic-legendary | yes | 0.005750 | 0.028500 | 0.008000 | 0.013750 | 0.001250 | 0.013358 | 0.013358 |
| emberfelt-weapon-epic | yes | 0.042250 | 0.025750 | 0.039000 | 0.045000 | 0.018250 | 0.039725 | 0.039725 |
| emberfelt-weapon-legendary | yes | 0.000250 | 0.029750 | 0.016250 | 0.011000 | 0.004750 | 0.014467 | 0.014467 |
| hearthloom-charm-epic | yes | 0.603750 | 0.875750 | 0.764250 | 0.688500 | 0.208000 | 0.732725 | 0.732725 |
| hearthloom-charm-legendary | yes | 0.000000 | 0.037750 | 0.007500 | 0.035250 | 0.008250 | 0.020708 | 0.020708 |
| hearthloom-outfit-epic | yes | 0.678250 | 0.832750 | 0.817500 | 0.767750 | 0.202750 | 0.769767 | 0.769767 |
| hearthloom-outfit-legendary | yes | 0.009750 | 0.025000 | 0.009750 | 0.012250 | 0.002500 | 0.013825 | 0.013825 |
| hearthloom-relic-epic | yes | 0.692000 | 0.772250 | 0.727750 | 0.798250 | 0.268500 | 0.760375 | 0.760375 |
| hearthloom-relic-legendary | yes | 0.008500 | 0.014000 | 0.003250 | 0.004250 | 0.001000 | 0.007233 | 0.007233 |
| hearthloom-weapon-epic | yes | 0.704250 | 0.839500 | 0.731000 | 0.769250 | 0.197750 | 0.756408 | 0.756408 |
| hearthloom-weapon-legendary | yes | 0.003750 | 0.022000 | 0.005000 | 0.033250 | 0.000250 | 0.014992 | 0.014992 |
| mastery-material | bound | 509.100000 | 210.900000 | 210.000000 | 210.000000 | 60.000000 | 280.000000 | 0.000000 |
| moonwick-charm-epic | yes | 0.736250 | 0.812250 | 0.837750 | 0.734000 | 0.216500 | 0.778575 | 0.778575 |
| moonwick-charm-legendary | yes | 0.003750 | 0.022500 | 0.005250 | 0.029000 | 0.008250 | 0.016042 | 0.016042 |
| moonwick-outfit-epic | yes | 0.708000 | 0.828000 | 0.756250 | 0.730250 | 0.232250 | 0.759442 | 0.759442 |
| moonwick-outfit-legendary | yes | 0.007500 | 0.038500 | 0.000500 | 0.008250 | 0.008500 | 0.014758 | 0.014758 |
| moonwick-relic-epic | yes | 0.701750 | 0.868500 | 0.902000 | 0.778750 | 0.148750 | 0.793275 | 0.793275 |
| moonwick-relic-legendary | yes | 0.004000 | 0.024000 | 0.013750 | 0.018750 | 0.005000 | 0.015283 | 0.015283 |
| moonwick-weapon-epic | yes | 0.706750 | 0.925250 | 0.797250 | 0.868250 | 0.238750 | 0.825125 | 0.825125 |
| moonwick-weapon-legendary | yes | 0.004000 | 0.035750 | 0.009250 | 0.020250 | 0.001250 | 0.016450 | 0.016450 |
| mossbrew-charm-epic | yes | 0.637250 | 0.842750 | 0.831750 | 0.770250 | 0.203750 | 0.766675 | 0.766675 |
| mossbrew-charm-legendary | yes | 0.011000 | 0.021750 | 0.009000 | 0.010250 | 0.001000 | 0.012367 | 0.012367 |
| mossbrew-outfit-epic | yes | 0.671750 | 0.841000 | 0.861500 | 0.806250 | 0.180750 | 0.784292 | 0.784292 |
| mossbrew-outfit-legendary | yes | 0.007500 | 0.033250 | 0.008500 | 0.005250 | 0.006000 | 0.014117 | 0.014117 |
| mossbrew-relic-epic | yes | 0.671750 | 0.820000 | 0.773750 | 0.731500 | 0.175750 | 0.740308 | 0.740308 |
| mossbrew-relic-legendary | yes | 0.007500 | 0.023000 | 0.006250 | 0.018000 | 0.012500 | 0.015692 | 0.015692 |
| mossbrew-weapon-epic | yes | 0.696500 | 0.791500 | 0.853750 | 0.773250 | 0.213000 | 0.776533 | 0.776533 |
| mossbrew-weapon-legendary | yes | 0.000000 | 0.014500 | 0.014000 | 0.022000 | 0.001500 | 0.012133 | 0.012133 |
| pantry-key | bound | 3.478750 | 3.208750 | 3.230000 | 3.239000 | 1.521000 | 3.424750 | 0.000000 |
| rainlace-charm-epic | yes | 0.184750 | 0.077750 | 0.102500 | 0.168000 | 0.064250 | 0.139358 | 0.139358 |
| rainlace-charm-legendary | yes | 0.000500 | 0.029000 | 0.007000 | 0.023750 | 0.011000 | 0.016625 | 0.016625 |
| rainlace-outfit-epic | yes | 0.165000 | 0.096750 | 0.150750 | 0.220250 | 0.054750 | 0.160417 | 0.160417 |
| rainlace-outfit-legendary | yes | 0.003750 | 0.037250 | 0.000250 | 0.004750 | 0.012250 | 0.013592 | 0.013592 |
| rainlace-relic-epic | yes | 0.183000 | 0.096000 | 0.134000 | 0.131000 | 0.050500 | 0.138717 | 0.138717 |
| rainlace-relic-legendary | yes | 0.004750 | 0.019500 | 0.007250 | 0.015500 | 0.006750 | 0.012542 | 0.012542 |
| rainlace-weapon-epic | yes | 0.195250 | 0.069000 | 0.115500 | 0.237500 | 0.104500 | 0.168408 | 0.168408 |
| rainlace-weapon-legendary | yes | 0.000250 | 0.040000 | 0.004250 | 0.013250 | 0.004000 | 0.014408 | 0.014408 |
| velvetrim-charm-epic | yes | 0.027000 | 0.049250 | 0.033500 | 0.037000 | 0.008500 | 0.036225 | 0.036225 |
| velvetrim-charm-legendary | yes | 0.007750 | 0.024000 | 0.005750 | 0.007500 | 0.013500 | 0.013650 | 0.013650 |
| velvetrim-outfit-epic | yes | 0.054500 | 0.035000 | 0.047750 | 0.038500 | 0.008500 | 0.042992 | 0.042992 |
| velvetrim-outfit-legendary | yes | 0.000000 | 0.013000 | 0.006750 | 0.023000 | 0.003250 | 0.010733 | 0.010733 |
| velvetrim-relic-epic | yes | 0.052500 | 0.027750 | 0.059000 | 0.035500 | 0.010250 | 0.043167 | 0.043167 |
| velvetrim-relic-legendary | yes | 0.001500 | 0.030750 | 0.013500 | 0.016000 | 0.007000 | 0.016042 | 0.016042 |
| velvetrim-weapon-epic | yes | 0.065000 | 0.022250 | 0.029750 | 0.072250 | 0.007000 | 0.045792 | 0.045792 |
| velvetrim-weapon-legendary | yes | 0.000000 | 0.021500 | 0.006000 | 0.030250 | 0.000750 | 0.013650 | 0.013650 |
