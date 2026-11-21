# Revenue and value — research, not launch claims

Lantern Café currently demonstrates a free desktop game and transactions on Fuji with test assets. **Observed cash revenue: $0.** Season Café Pass sales, paid cosmetics/decor and a Genesis Deed primary sale are launch proposals. The existing market allocation is 5%: 2% burn plus 3% treasury. Treasury YARN is not USD revenue; a burn is not publisher income.

## What the sources support

| Source and population | Published observation | Use here |
|---|---|---|
| [Unity 2024 mobile report](https://activation.unity3d.com/vn/resources/mobile-growth-monetization-report-2024) | 1.83% lifetime IAP conversion; 28.81% of payers purchase again | Context for conversion risk; neither number is monthly pass conversion |
| [GameAnalytics October 2026](https://www.gameanalytics.com/benchmarks-hub), roughly 1,800 revenue-reporting mobile games with ≥10,000 MAU | IAP ARPPU P25/P50/P75: $4.73/$10.93/$25.43 | Mature mobile sample with selection bias; our desktop demo has no measured ARPPU |
| [Axie historical whitepaper](https://whitepaper.axieinfinity.com/axie-infinity-history/future-streams) | Marketplace fee 4.25%; breeding fees | Fees can fund a treasury; the [5.25% proposal was rolled back](https://blog.axieinfinity.com/p/marketplacefee), so its headline is not a current benchmark |
| [Pixels integrator case, April 2023](https://blog.thirdweb.com/case-studies/pixels-builds-an-onchain-ecosystem-for-its-web3-game/) | Time-limited VIP memberships represented by NFTs | Historical subscription mechanism; present price and conversion not verified |
| [Off The Grid publisher FAQ](https://support.console.gameoffthegrid.com/hc/en-us/articles/28909795772445-Off-The-Grid-Steam-FAQ) | Subscription perks/cosmetics alongside free battle-pass rewards | Free play can coexist with an optional paid layer; no published conversion used |
| [DeFi Kingdoms chain documentation](https://docs.defikingdoms.com/how-defi-kingdoms-works/defi-kingdoms-blockchain) | JEWEL gas; distribution 25% validators, 50% burn, 25% quest fund | A game chain can define gas economics; token burn does not guarantee token value |

These are design examples, not a common population from which to calculate an average web3 conversion rate. No defensible public pass-conversion or cosmetic-share benchmark for this particular game was found. The following ranges are explicit assumptions.

## Reproducible monthly model

[Model JSON](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v4-ship/S9/model-1.json), [CSV](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v4-ship/S9/revenue-1.csv), [calculator](../../tools/v4ship-lab/research/model.mjs). No economy setting is changed.

`gross USD = MAU × pass conversion × pass price + MAU × cosmetic conversion × cosmetic spend`

`unique payers = MAU × (pass conversion + cosmetic conversion − overlap)`

`ARPPU = recurring gross USD / unique payers`; market treasury is `market YARN volume × 3%`, reported separately.

| Assumption/result per month | Low | Base | High |
|---|---:|---:|---:|
| MAU | 1,000 | 10,000 | 50,000 |
| Pass buyers / cosmetic buyers / overlap | 1% / 0.5% / 0.25% | 2% / 1% / 0.5% | 4% / 2% / 1% |
| Pass price / cosmetic buyer spend | $5 / $4 | $7 / $8 | $9 / $12 |
| Distinct payer conversion | 1.25% | 2.5% | 5% |
| Pass gross | $50 | $1,400 | $18,000 |
| Cosmetic gross | $20 | $800 | $12,000 |
| **Recurring gross** | **$70** | **$2,200** | **$30,000** |
| ARPPU | $5.60 | $8.80 | $12.00 |
| Cosmetic share of recurring gross | 28.57% | 36.36% | 40% |
| After assumed 15–30% distribution costs | $49–59.50 | $1,540–1,870 | $21,000–25,500 |
| Market volume in YARN | 5,000 | 50,000 | 250,000 |
| 3% treasury in YARN | 150 | 1,500 | 7,500 |
| Genesis units × assumed price, one time | 25 × $10 | 100 × $20 | 300 × $30 |
| Genesis gross, separate from recurring | $250 | $2,000 | $9,000 |

Fractional users in the low scenario represent expected counts, not actual customers. Genesis quantities fit the existing 3,000-Deed supply ceiling but do not authorize a sale, reserve supply or set prices. Distribution percentages are assumptions, not a quote from a payment provider. Gross excludes acquisition, production, support, tax, refunds, chargebacks, hosting and chain fees; it is not profit.

At the same 10,000 MAU and 250 unique payers, the comparison swaps the buyer mix: 200 passes +100 cosmetic buyers yields $2,200; 100 passes +200 cosmetic buyers yields $2,300. Both include 50 overlapping buyers. The $100 difference depends entirely on unmeasured willingness to pay. Keep both alternatives until actual lawful-launch research supports one.

## Who receives value

Players receive a playable café/battle loop, visible ownership/history, and receipts showing fee and payer. Payment should purchase an explained entertainment benefit; this model makes no earnings or asset-price promise. Deed/Spool and the frozen economy remain governed by the implemented rules, with [unresolved E3 boundaries](ECONOMY-ONEPAGER.md).

The publisher can evaluate pass/cosmetic receipts, the existing 3% market treasury allocation and a separately scoped Genesis sale. Retained Spool stays in the reward pool; it is not a 25% publisher cash margin. The balance sheet must distinguish earned receipts, token balances, reward liabilities and gas sponsorship.

Avalanche receives verifiable application activity when a public build is used: distinct active wallets, successful transaction counts and AVAX gas usage, with bots/self-transfers identified separately. The present testnet demo creates **test AVAX usage**, not proven mainnet demand, paying-user growth or cash revenue. Public sponsored latency and deployed configuration remain unverified.

For a future C-Chain budget, 200,000 transactions/month at assumed 50,000–200,000 gas and 0.1–5 gwei costs **1–200 AVAX/month**. These wide input bounds are assumptions, not a current gas-price observation. A 0.05 AVAX guest transfer is funding advanced to a wallet, not 0.05 AVAX necessarily consumed as gas. Track actual receipt fees and remaining wallet balances.

For a future Lantern Café L1, [activated ACP-77](https://build.avax.network/docs/acps/77-reinventing-subnets) permits an independent validator set with a continuous P-Chain fee. At the documented minimum 512 nAVAX/s, five validators for 30 days cost **6.63552 AVAX** in P-Chain fees, before hosting and operations; [the rate is dynamic](https://build.avax.network/blog/l1-validator-fee). A YARN gas token or subsidized transactions would change who pays game-chain fees; it would not eliminate P-Chain fees or operating costs. L1, ICM and VRF are roadmap items, with Anvil-only prototypes scheduled after freeze.

## Vietnam launch flag

Article 57 of Decree 147/2024 concerns virtual items, currencies and rewards. The [government explanation](https://xaydungchinhsach.chinhphu.vn/nghi-dinh-147-2024-nd-cp-khong-mua-ban-vat-pham-ao-giua-nhung-nguoi-choi-tro-choi-dien-tu-voi-nhau-119241113161443995.htm) describes restrictions on cash-out and player-to-player trading. The [official history](https://vbpl.moj.gov.vn/bothongtin/Pages/vbpq-lichsu.aspx?ItemID=171689&Keyword=) marks the decree partly amended from 8 April 2026. Inspection of [116/2026, Chapter VI](https://congbaocdn.chinhphu.vn/180507251028987904/2026/4/20/469315-1776647256_v1_1776647889_signed.pdf) found no listed amendment/repeal of Article 57; repeal of **Form 57** is different. This comparison is not a legal opinion. Obtain qualified Vietnam launch advice before enabling real-value trading, token redemption or a paid Deed offer; testnet labeling alone does not establish compliance.

Research record: [LEARN/S9](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v4-ship/LEARN/S9.md). Dates and assumptions must be refreshed before using this document as a launch business plan.
