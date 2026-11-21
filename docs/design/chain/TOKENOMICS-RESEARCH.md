# YARN research — read 2026-11-12

Scope: Fuji demonstration, no real value. Sources below were read on **2026-11-12**. Dates in titles describe publication or policy dates, not verification of live contract state. Exact prototype parameters are design judgments; these references do not prove an optimal fee or sustainable demand. No names, art, or game text are imported.

## Economy evidence

| ID | Source / URL (date read: 2026-11-12) | Finding and consequence |
|---|---|---|
| E1 | [Axie: Season 20 economic balancing, 2022](https://blog.axieinfinity.com/p/upcoming-season-20-and-economic-balancing) | Team reported roughly four times more SLP issued than burned. Adventure/daily rewards were cut. Failure post-mortem #1: repeatable activity emissions can outrun breeding demand. YARN never pays per battle. AXS leaderboard rewards illustrate a distinct, capped reward channel. This is a failure of the historical economy, not a claim that Axie closed. |
| E2 | [Axie: SLP monetary policy, 2024](https://blog.axieinfinity.com/p/slpcap) | 44bn cap was described as a social/game issuance rule, not replacement-contract enforcement; stability-fund issuance offsets some gross burns. We measure net supply changes and implement an immutable genesis cap. |
| E3 | [Ronin: BERRY sunset, 2024](https://blog.roninchain.com/p/pixels-players-the-berry-sunset-has) | Pixels moved ordinary currency off chain and retained PIXEL as its on-chain token. Separating soft progression from transferable scarcity reduces economic coupling. It does not eliminate speculation. |
| E4 | [Binance Research: Pixels launch profile, 2024](https://www.binance.com/en/research/projects/pixels) | Launch profile states 5bn maximum PIXEL and describes premium utilities. Historical listing research, not an independent audit or current circulating-supply measurement. |
| E5 | [NXPC whitepaper: Item Fusion](https://docs.nexpace.io/tokenomics/nxpc/item-fusion/) | Historical mechanism exchanged NFT baskets for previously locked NXPC; returning NFTs to a pool is not a permanent NFT burn. Do not count recycled supply as destroyed. |
| E6 | [MapleStory Universe: November 2026 change FAQ](https://medium.com/maplestory-universe/faq-on-nxpc-burn-plan-and-whitepaper-revision-nov-2026-37a06113283d) | **Announced, not completed:** December termination of Reactor; at least 52 weeks of contribution-release burns; a Recycle Vault burn. Item Fusion had already been suspended. Protocol reports fee-funded rewards and a quarterly 20% fee-revenue burn. Do not pitch the old exchange mechanism as current, proven policy. Revenue claims are publisher-reported. |
| E7 | [GUNZ: token and network](https://www.gunbygunz.com/gun/) | Off The Grid uses an independent Avalanche L1 and GUN for gas/game transactions. The page mixes old launch language with current chain details; only architectural facts are used. A dedicated validator network adds operations our Fuji demo does not need. |
| E8 | [Motorverse: F1 Delta Time closure, 2022](https://themotorverse.medium.com/f1-delta-time-to-cease-operations-announces-rewards-for-supporters-2fbf307fe89f) | Failure post-mortem #2: non-renewed IP licence ended the game despite surviving tokens; publisher offered alternative assets. Ownership alone cannot preserve gameplay or demand. Original IP, portable metadata, explicit service dependence are necessary. |
| E9 | [LiquiFi: vesting/allocation benchmarks, 2022 archive](https://liquifi-august-2022.webflow.io/blog-posts/token-vesting-and-allocations-industry-benchmarks) | Historical sample finds typical team vesting of 3–4 years, investors around 2 years, common 1-year cliffs. It distinguishes lockups from earned vesting. Retain proposed cliffs; make post-cliff duration explicit and disclose that distributor custody is not on-chain vesting. |
| E10 | [Xie et al., Sustainability 16(15), 6587, 2024](https://www.mdpi.com/2071-1050/16/15/6587) | Academic discussion of Axie/Alien Worlds relates participation to token incentives and external conditions. Observational relationships do not establish causation or forecast this game's demand. Stress no-growth and low-demand cases rather than projecting token prices. |
| E11 | [Government: Decree 147/2024 game items](https://xaydungchinhsach.chinhphu.vn/nghi-dinh-147-2024-nd-cp-khong-mua-ban-vat-pham-ao-giua-nhung-nguoi-choi-tro-choi-dien-tu-voi-nhau-119241113161443995.htm) | Government explanation describes restrictions on player-to-player virtual-item sales and converting game items/rewards to external value. This is a direct issue for a Vietnamese commercial trading game, not merely generic crypto uncertainty. |
| E12 | [Government: Resolution 05/2025/NQ-CP full text](https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-5-2025-nq-cp-ve-trien-khai-thi-diem-thi-truong-tai-san-ma-hoa-tai-viet-nam-119250909184045221.htm) | A five-year crypto-market pilot is regulated and conditional; it does not by itself authorize a game's token or override gaming restrictions. No inference of permission for public issuance, exchange or cash rewards. |
| E13 | [Avalanche: Interchain Token Transfer](https://build.avax.network/docs/cross-chain/interchain-token-transfer/overview) | ICTT supports ERC-20/native home/remote representations. ERC-1155 Relics need separately designed ICM custody/messaging; do not claim stock ICTT handles them. |

Vietnam assessment: this prototype stays Fuji-only, carries no value claim and provides no fiat redemption. Whether a specific testnet competition demo, guest wallet or game marketplace falls within particular rules is unresolved here. Testnet labelling is not a legal exemption. Obtain Vietnamese gaming/digital-asset advice before any public commercial release; this research is not legal advice.

## Item trading — ten read sources

| ID | Source / URL (date read: 2026-11-12) | Evidence → design consequence |
|---|---|---|
| T1 | [Axie marketplace fee correction](https://blog.axieinfinity.com/p/marketplacefee) | The March 16, 2022 correction rolls back the announced 5.25% increase. 4.25% is a historical benchmark, **not** an independently verified current fee. Do not repeat the stale increase. |
| T2 | [Guild Wars 2 support: Missing Gold](https://help.guildwars2.com/hc/en-us/articles/222384087-Missing-Gold) | 5% nonrefundable listing + 10% sale fee. A closed soft-currency economy can support stronger sinks; this is not an NFT fee norm. We avoid repeated listing charges. |
| T3 | [Magic Eden SOL fee guide, March 2026](https://help.magiceden.io/en/articles/5858632-what-fees-will-i-pay-to-list-or-sell-nfts-on-magic-eden) | 0% listing, 2% transactions; creator royalties separate. Scope is Solana, not all chains. Supports free cancellation and clearly disclosed sale fees. |
| T4 | [OpenSea fee guide](https://support.opensea.io/en/articles/8867091-what-fees-do-i-pay-on-opensea) | Typically 1% selling NFTs, 10% primary drops; fees can change. Primary-mint and resale rates are different mechanisms. Neither establishes a fair price for our items. |
| T5 | [IdleMMO Tools: Milky Way Idle FAQ](https://idlemmotools.com/milky-way-idle/faq/) | **Community secondary source**, explicitly based on a community wiki: reports 2% ordinary-item and 18% premium-bag taxes, plus single-account rules. Reference for idle-market separation, not independently audited game policy. No assets/content copied. |
| T6 | [Jagex: Rules of RuneScape](https://legal.jagex.com/docs/rules/rules-of-runescape) | RMT and automated acquisition connect to account abuse. A wallet is not a human identity. Server-owned entitlements and limited issuance matter more than a token transfer UI. |
| T7 | [Chainalysis: NFT wash-trading study, 2022](https://www.chainalysis.com/blog/2022-crypto-crime-report-preview-nft-wash-trading-money-laundering/) | Self-funded buyer/seller address relationships are useful suspicion signals, not proof. Shared faucets must be excluded from automatic common-funder bans. Never reward volume. |
| T8 | [von Wachter et al.: NFT Wash Trading, 2022](https://arxiv.org/abs/2202.03866) | Academic graph/pattern analysis of suspicious trades; reported estimates depend on collection sample and heuristics. Pair cycling and round trips warrant review, not price floors or automatic confiscation. |
| T9 | [ArenaNet: trading-post interface design](https://www.guildwars2.com/en/news/introducing-the-new-trading-post/) | Category filters, visible fees and clear outstanding proceeds support comprehensible trading. We use type/rarity filters and pull proceeds with an explicit claim control. |
| T10 | [Motorverse closure and replacement plan](https://themotorverse.medium.com/f1-delta-time-to-cease-operations-announces-rewards-for-supporters-2fbf307fe89f) | Tradable tokens still depend on game support; permanence of a ledger does not guarantee a market. We retain offline play and avoid promises of liquidity. |

Additional attempted references: Steam FAQ returned an image-only page; Milky Way Idle wiki returned HTTP 403. Their search snippets were not counted as read sources or used as authoritative numeric evidence. The old Pixels litepaper remains visibly stale. These gaps are not concealed by a citation count.

## Decisions from the evidence (prototype hypotheses)

- Sale fee **500 bps (5%)**, configured at deployment, capped at 1,000 bps; 40% of fee to burn/sink and 60% to treasury. It is above low-cost NFT venues (T3/T4), near the historical game-NFT benchmark (T1), below T2's total; no claim it maximizes retention. YARN burn reduces totalSupply; native AVAX goes to the zero address and is accounted separately, never called YARN burned.
- Seal fee **10% of a published fixed YARN reference**, all burned. A one-time issuance sink avoids a price oracle and wash-trade manipulation (T7/T8). Reference is not an enforceable resale price or guaranteed value. Prototype references: rare chain material 20 YARN; Epic gear 100; Legendary gear 300; Relics 50/100/200/400. Re-evaluate against measured uptake; no elastic market-price feedback.
- No price floor, ceiling or listing deposit; a zero-price V2 gift is allowed. A 1-wei sale and all representable prices work. Gas still applies. Floor-rounded fees can be zero on dust trades; volume earns nothing.
- Three seals/account/UTC day; authoritative level >=2; acquired-in-V2 item type waits 10 minutes before relisting in V2. This limits bursts, not Sybils. Direct ERC-1155 transfers/other venues bypass market-only cooldowns; do not overclaim enforcement.
- Ordinary materials, XP, soft currencies and common/rare gear stay bound. Epic+ gear trades without extra stats. Existing boss-proof stays bound because it represents earned achievement; a separate **Star Thread** test fixture is the tradable rare material. It does not change C2 drops or counterfeit campaign progress.
- No volume rebates, trading achievements that pay YARN, transferable XP, or token-funded combat upgrades. Flag round trips, repeated counterparties and reused entitlement attempts for review; faucet funding alone is insufficient evidence.

## Implementation cross-check, 2026-11-12

The follow-up [audit](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/chain/TOKENOMICS-AUDIT.md) uses primary read-only Fuji evidence at block60934939, plus deployed Solidity policy and deterministic sensitivity tests. It is additional engineering evidence, not an extra independent economic source. E1/E2/E10 motivate no-growth/weak-demand tests; T6/T7/T8 motivate Sybil/fee-bypass scenarios. They do not establish the assumed0.4/0.08 weekly supply,20-YARN sale price or adoption probabilities. C2 has supplied none of those weekly issuance rates.

Historical checkpoint (superseded by model v5 below): after removing future sinks from the implemented-sink case and matching grant-inclusive on-chain policy, emissions/burn are2.3904 /2.5332 /2.7797, so the requested2× gate fails. This supersedes any earlier summary that treated optional forge/cosmetic demand as adequate proof. Fifty-percent bot wallets capture53.24% of claims under that scenario; wallet fairness is not human fairness. No allocation or fee change is justified by these uncalibrated outputs alone.


## Follow-up: cadence, demand and item stock — read 2026-11-12

These five additional primary pages were opened and read during the autonomous follow-up. They extend the earlier22 distinct sources; no fee or adoption coefficient is copied from another game.

| ID | Source (date read:2026-11-12) | Evidence and decision |
|---|---|---|
| E14 | [Sky Mavis: Origins Arena Mode](https://support.axieinfinity.com/hc/en-us/articles/7997700973595-Origins-Arena-Mode) | Distinguishes first-time progression rewards and rewards at the end of an era/season. The support page was updated in2025; use it for cadence, not current token payouts. Correct YARN rank to one closed-season entitlement, never6 every week. |
| E15 | [Axie: Origins S18, July8 2026](https://blog.axieinfinity.com/p/origins-s18-is-live) | Publisher says season rewards use nontransferable bAXS and holds era rewards for integrity review. Thus historicalAXS examples are not current transferable issuance. YARN remains the user's Fuji ERC20 choice; require final rank/anti-abuse receipts before signing, and separate earning season from claim season. No purchased-power qualification. |
| E16 | [Pixels: Feed the Deep/update, October23 2026](https://pixelspost.substack.com/p/new-event-feed-the-deep) | Update describes task quantities/rewards retuned and recipes consuming surplus items. Its event items expire; copying that into immutable NFTs would be misleading. Our forge roadmap needs explicit irreversible item custody, separate from the ERC20 fee burn; no promised demand from more emissions. |
| E17 | [EVE: October2026 Monthly Economic Report, November9](https://www.eveonline.com/news/view/monthly-economic-report-october-2026) | Production, destruction and active currency changes are reported separately, with raw downloadable data. Track YARN issuance/burn, off-chain acquisition, sealed stock and item sinks as distinct series; a token fee cannot by itself remove equipment. No EVE magnitudes transferred to YARN. |
| E18 | [CCP: A Deal is a Deal,2006](https://www.eveonline.com/fr/news/view/a-deal-is-a-deal...) | Historical developer explanation distinguishes transfers between players from faucets/sinks and treats supply/demand as separate variables. The cited concepts motivate conservation and persistent non-adopter stress; it is not a contemporary economic estimate or an optimum-price formula. |

Re-read E1 in full relevant sections: the published2022 adjustment cut repeatable rewards while proposed sinks were still unshipped. This reinforces the distinction between a proposed feature budget and actual demand. Albion's original Black Market announcement returned403 and is **not counted** as read; no trash-rate numbers were used.

### Source-backed corrections and original design hypotheses

- **Cadence correction, not a contract change:** boss up to6 YARN/week and rank0/1/2/4/6 once per13-week season; a closed season is settled under the next season's current cap. Initial12 routine/32 total ceilings and20 tester grant remain deployed facts. Rank tiers are our test design, not a benchmark optimum.
- **Supply measured from source:**4000 schedule cohorts ×8 weeks use actual drop/pity functions, source hashes and stated successful-route assumptions. No recurring tradable rare material exists. Do not treat0.4/0.08 placeholders as C2 data; do not treat conditional12.6 Epic+/week as observed player supply.
- **Demand sensitivity:**720 52-week runs use20 seeds, persistent10/25/50/100% adopters, three reward budgets, stock/cap limits and no cosmetic utility buying by bots. Twenty seeds measure simulation variation, not the uncertainty of the adoption hypothesis. Common sponsor funding still does not prove common ownership.
- **Original pilot envelope:**1.5 weekly-boss, rank≤1.5 per season, rename2, small decor4, cosmetic forge3 plus2 already-sealed items, optional cosmetic season pass12. These are disabled design candidates grounded in affordability relative to the reduced reward envelope and E1/E14–E18 mechanisms. No citation establishes these exact amounts; demand tests and authority remain required before activation.


### Saturation and funding review — 2026-11-12

Reopened E1, E14 and E17 and read the relevant publisher sections. E1 explicitly described proposed sinks alongside reward cuts; E14 distinguishes era/season completion rewards; E17 publishes production, destruction and currency changes separately. These support keeping observed behavior separate from hypothetical future features. The six-item voluntary sealing target, four-item buying target,1.5-YARN pilot and50% organic-burn budget factor are our sensitivity choices, **not figures established by these sources**.

Model v5 adds stock saturation, switches the CLI default to the conditional source study and reruns720 cases. The original6 weekly/6 seasonal ceiling fails all60 full-adoption mix/seed cases; smaller3/3 and1.5/1.5 pass at full adoption only. All scales fail at50%,25%,10%. Removing saturation recreates an optimistic~1.02 claims/burn ratio by assuming people keep sealing unsold goods. That result is not evidence of utility. See [validation](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/chain/ECONOMY-VALIDATION.md).

Fee break-even and reserve calculations in [feature budgets](FEATURE-BUDGETS.md) are transparent arithmetic, not valuation research. Recovering a30-YARN seal at a5% sale fee requires at least31.579 gross even with certain sale, before gas. No price floor is added. The cosmetic forge's3 token fee also requires two real input items; self-sealing two Epics raises total preparation cost to23. Neither listing references nor hypothetical cosmetic demand justify issuing the full allocation envelope.


## Measurement and finite utility — read 2026-11-12

Four additional distinct primary pages were opened and read (31 distinct dated URLs total). The two university entries are abstracts and bibliographic records, not claims of full-paper review. The university PDF endpoints denied access; the Stanford marketplace-experiment page returned403 and is not counted.

| ID | Source (date read:2026-11-12) | Evidence and decision |
|---|---|---|
| E19 | [Hamari et al.,2017, Tampere University research record](https://researchportal.tuni.fi/en/publications/why-do-players-buy-in-game-content-an-empirical-study-on-concrete/) | Abstract describes a519-response survey and multiple purchase motives. Associations do not establish that our players want a given style. Preview and voluntary feedback should test utility; do not create progression obstacles to compel spending. No numerical purchase rate is imported. |
| E20 | [Hamari and Keronen,2017, Tampere University meta-analysis record](https://researchportal.tuni.fi/en/publications/why-do-people-buy-virtual-goods-a-meta-analysis/) | Abstract summarizes24 studies and context-dependent goods value. This motivates measuring our own finite content and reuse horizon rather than copying another game's sink coefficient. A cosmetic in the room must have observable use; finite ownership cannot be counted as recurring purchases. |
| E21 | [NIST/SEMATECH, confidence intervals for a proportion](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm) | Read the Wilson formula, boundary behavior and exact-binomial distinction. The pilot reports95% Wilson intervals, raw counts and null for zero sample, under stated independence assumptions. Fixed7-day follow-up avoids selecting early successful buyers. Wilson precision is not A/B power or proof of human independence. |
| E22 | [Microsoft Research, Diagnosing Sample Ratio Mismatch,2020](https://www.microsoft.com/en-us/research/articles/diagnosing-sample-ratio-mismatch-in-a-b-testing/) | Full article explains missing-user/triggering bias and a bot-filter example that removed engaged users. Keep nonbuyers and nonviewers, predeclare review rules, and diagnose assignment/logging before causal interpretation. Our first single-price pilot is observational, so it does not claim an A/B effect or blindly apply Microsoft's SRM threshold. |

Implementation decisions and all failing model rows: [round2](CALIBRATION-ROUND-2.md). The4-YARN permanent room-style price is the existing decor hypothesis made testable; it is not a price estimated by these studies. [Pilot protocol](COSMETIC-PILOT.md) separates a local functional proof, observed testnet behavior, and evidence needed for a complete seasonal economy. No source supports converting scripted operator burns into organic demand.

## Competing purchases and experiment design — read 2026-11-12

Two additional primary papers (33 distinct sources total). Abstracts and the linked full-text introduction, experiment-design and bias/variance sections were read; this is not a claim that every proof was independently verified.

| ID | Source | Evidence and decision |
|---|---|---|
| E23 | [Holtz et al., 2020, Reducing Interference Bias in Online Marketplace Pricing Experiments](https://arxiv.org/html/2004.12489v1) | Marketplace participants affect each other's available supply and choices; clustered and individually randomized estimates can differ. Do not treat buyers and sellers sharing one P2P market as isolated price-test subjects. No numerical effect size or optimal fee is transferred to this game. |
| E24 | [Li et al., 2021, Interference, Bias, and Variance in Two-Sided Marketplace Experimentation](https://arxiv.org/html/2104.12222v1) | Experiment type and treatment share depend on supply/demand conditions and trade bias against variance. Before a later price trial, preserve treatment assignment, exposure and market boundaries; a tiny demo cannot establish the best split. Larger simulated samples do not cure design bias. |

Our finite forge and style comparison holds the cohort/seed fixed, uses a single conserved wallet budget and reports both spend orders. It is a mechanistic counterfactual, not an A/B result. Hold prices constant in the first voluntary observational pilot; record market participation and spending on other features along with nonbuyers. Buying an ornament can replace a style or a seal: gross forge burn is not automatically incremental total burn. A future experiment must predeclare the assignment unit, contamination handling and funding, rather than retroactively calling selected buyers a treatment group. Neither paper justifies our exact3/4-YARN prices or50% interest hypothesis.


## Revenue recycling and benchmark definitions — read 2026-11-12

Re-read E2 and E6 in their publisher versions. E6 already documents the **announced December** Reactor closure and contribution burns; do not count it again as a new source or say the change has happened. The direct NEXPACE disclosure returned a loading shell; the official publisher FAQ was readable. The earlier MSU launch notice redirected to maintenance and is not counted. Two additional distinct publisher pages bring the total to35 dated URLs.

| ID | Source | Evidence and decision |
|---|---|---|
| E25 | [MapleStory Universe, H1 2026 report, September9](https://medium.com/maplestory-universe/ir-state-of-maplestory-universe-h1-2026-d317b7a850a1) | Read results and metric definitions. Publisher reports protocol revenue above gameplay emissions, but explicitly excludes other distributions, counts addresses rather than people and applies no estimated wash filter to trades. Its net absorption is neither profit nor total supply change. Our experiment reports original gross reward claims, fresh reserve release and recycled fees separately. Do not import their participation rate or progress-upgrade monetization into a cosmetic-only game. |
| E26 | [MapleStory Universe, hack/macro countermeasures, August29 2025](https://medium.com/maplestory-universe/developers-note-updates-on-hack-and-macro-countermeasures-91c2cfc8012e) | Publisher distinguishes impossible state manipulation from automation of legal actions; detecting the latter requires longitudinal behavior and attention to false positives. CHAIN's signed source receipts prevent forged inventory, but do not establish that one wallet is one human. Rate limits and a perfect simulated bot label must not be advertised as a working identity detector. |

The new [recycling study](../../chain/recycle-study.html) uses only closed, unspent treasury cash.50% retention and100% upper-bound recycling are explicit hypotheses. It cannot use forecast sales, AVAX, uncollected proceeds or the same cash twice. Weekly boss/rank eligibility stays independent of personal payments; no trade-volume rebates. The original claim-inclusive2× gate still applies, including every recycled reward. No contract, allocation, grant or public setting is changed. Results:144 five-year scenarios+24 stresses; at50% adoption each recycling policy passes only3/9 initial-year cases;25/10% pass0/9. No tested case keeps all four tail seasons active. More efficient funding alone does not create a recurring content demand.

## Grant-inclusive budgets and current rewards — read2026-11-12

Two additional distinct primary pages were read (37 dated URLs total). E2 was reread and is not counted twice.

|ID|Source|Evidence and design consequence|
|---|---|---|
|E27|[Sky Mavis: historical updates,2026 reward sections](https://support.axieinfinity.com/hc/en-us/articles/21397975338523-Lunacian-Homecoming-Navigating-the-History-of-Axie-Infinity-for-New-and-Returning-Players)|Read the2026 section: publisher says Origins SLP emissions stopped January7 in response to automated farming, while crafting/morphing deposits remained; it describes later bAXS transitions. This corrects any inference that2022 or2024 payout rules are current. It does not prove that bound rewards eliminate bots. Keep ordinary progression in bound currencies and verify event eligibility independently of spending. No benchmark payout is copied.|
|E28|[EVE Online: September2026 economic report, published October14](https://www.eveonline.com/news/view/monthly-economic-report-september-2026)|Read narrative and report structure, not a reconstruction of its underlying dataset. Publisher distinguishes production/destruction, price indices and active-money changes. Our retained wallet balances, treasury cash, actual token burns and gross claims must remain separate. Activity changes cannot be relabelled as token burns; no EVE numerical coefficient is imported.|

The revised offline reward planner requires a pinned, cumulative ledger as well as closed-period credit. Algebraically, a new budget R requires C+L+20N+R≤2B for the original cumulative threshold, with every recycled claim in C and disjoint unpaid promises in L. B excludes operator/scripted/unreviewed burns. This is our conservative accounting choice, not a published optimum or proof of future demand.50 exact synthetic cases exercise that boundary. At500 of1000 participants burning their entire20 grants, it allows0 new rewards; a three-style catalog can burn only12 per interested participant. Do not solve that shortfall by inventing repeat purchases, rewarding spenders or manufacturing sponsor burns.

## Recipe completion and behavioral validity — read 2026-11-12

Three additional distinct primary sources bring the documented total to40 URLs. The Immutable guide is explicitly archived v1 guidance, the JASSS model/analysis/validation sections were read in full, and the Waterloo source is a thesis abstract rather than a full-thesis review. The IEEE CoG PDF returned502 and is not counted.

|ID|Source|Evidence and consequence|
|---|---|---|
|E29|[Immutable: Designing an in-game economy, archived v1](https://deprecated-docs.immutable.com/v1/projects/zkevm/designing-in-game-economies/)|Discusses hybrid economies, persona-specific utility and changes across a player's lifecycle. Its sink examples are not automatic recommendations: no purchased combat power, yield upgrades, forced market floor or asset decay is imported. Inspect the completed collectible and retained inventory as well as token flows. The guide supplies no3/4/10-YARN price estimate.|
|E30|[Richiardi et al., JASSS9(1),2006: A Common Protocol for Agent-Based Social Simulation](https://jasss.soc.surrey.ac.uk/9/1/15.html)|Separates random-seed variation, behavioral/temporal assumptions and empirical/program validity. A large seed grid cannot establish how people budget a crafting chain. Compare pay-as-you-go preparation with saving for the whole recipe, using the same cohort; preserve the original flow metric and add completion outcomes. These are structural sensitivities, not fitted human behavior.|
|E31|[Lin Yang, University of Waterloo,2014: Pricing Virtual Goods](https://uwspace.uwaterloo.ca/items/3583e03b-c04e-4a81-991a-11335448d152)|Abstract describes sales/usage data and intervention analysis around product releases. It does not validate transferring a price from another game or treating ingredient purchases as final cosmetic use. No Elo-based power pricing is adopted. Predeclare complete-recipe cost and outcome tracking before inferring utility from burns.|

The exact zero-income control is reproducible:1000 accounts ×20-YARN grants, abundant unsealed Epics, no routine claims or buyers. Sealing two Epics consumes all20; claims/burn=1 while completed forge outputs=0. Saving the full23-YARN recipe instead leaves20 unspent. Neither behavior is established as the population truth. The [completion study](../../chain/completion-study.html) compares both and reserves the same wallet cash across seals, styles and market purchases; a market purchase cannot silently spend a forge-first reserve. Fee amounts and existing public settings are unchanged.

## Finite program and completed value — read 2026-11-12

Two further distinct primary practitioner articles bring the record to42 dated URLs. Read Lostgarden's introduction, value-chain definitions and motivation sections, and Heroic Labs' accounting, tuning and measurement sections. These are design guidance, not measured YARN demand or experimental proof.

|ID|Source|Evidence and consequence|
|---|---|---|
|E32|[Daniel Cook, Lostgarden, Value chains,2021](https://lostgarden.com/2021/12/12/value-chains/)|Connects resource gathering through crafting to a player-valued outcome. Report completed ornaments alongside input burns and expose the whole recipe cost. A taxed intermediate action alone does not demonstrate a desirable output. No rates, prices or game content are copied.|
|E33|[Heroic Labs, How In-Game Currency Systems Work,2026-10-22](https://heroiclabs.com/blog/how-in-game-currencies-work-and-why-live-economies-break/)|Recommends counting all grant sources, examining cohorts and purchase milestones, and testing configuration changes. Retain initial grants in the denominator and match the reward window to the announced program. It establishes neither our1.5 reward nor an adoption forecast.|

Review found a semantic mismatch: FEATURE-BUDGETS proposes one13-week pilot, while previous studies repeatedly renew1.5 rewards. Those remain valid recurring counterfactuals, but cannot represent a single pilot. The explicit earning window now stops new boss/rank earning after week13; already earned rank may settle in weeks14–26 subject to the actual reduced contract cap. Historical controls and original thresholds remain intact. Scheduled silence is not a healthy late-season result. No automatic renewal, excess reward promise or observed testnet spending is inferred.

## Complete baskets and shared program budgets — read 2026-11-12

Three additional primary sources bring the record to45 distinct dated URLs. Their mechanisms inform the work below; none supplies a YARN adoption rate or an optimal seal fee.

|ID|Source|Evidence and consequence|
|---|---|---|
|E34|[Unity, Building an in-game economy](https://unity.com/how-to/building-game-economy-guide-part-2)|Read resource/progression and source/sink sections. Affordability and progression must be examined together with aggregate flows. Compare complete affordable baskets, retained currency and cosmetic outputs; do not count unfinished taxed ingredients as proof of satisfaction. The source does not establish5% as an optimum, and its paid-progression examples are not adopted.|
|E35|[Unity Economy, Introduction to resources](https://docs.unity.com/en-us/economy/item-types)|Read currency and virtual-purchase definitions. Distinguishes initial balances, balance caps and transactions with costs and outputs. A pool balance does not authorize an unlimited gift program. The study enumerates finite style/forge outputs against one shared balance and explicit input inventory; no duplicated money or free input assumptions.|
|E36|[PostgreSQL17, Explicit Locking](https://www.postgresql.org/docs/17/explicit-locking.html)|Read row locks, deadlock ordering and advisory locks. Advisory protection requires participation by every relevant writer. Registering a new routine budget must use the same transaction lock and funding row as gift admission; service-role direct budget inserts are removed. Eight real sessions plus a missing-lock negative control validate the mixed path.|

`catalog-budget-study.mjs` enumerates48 exact budget/input/fee cases and48 optimistic cohort bounds, separate from behavioral simulations. With20 YARN and2 retained, current10% sealing cannot complete a23-YARN self-sourced forge. A hypothetical5% seal makes it13; one forge +one4-YARN style +one1-YARN Star Thread seal fits18. The5% fee is therefore a **next experimental price**, not a live change or calibrated demand estimate. Even the optimistic maximum-basket bound fails every50/25/10% participation group. Cheaper access cannot burn grants retained by absent recipients. Existing20 grant, live10% seal,5% sale and all original acceptance thresholds remain unchanged.


## Seal-price calibration and market fee scope — read 2026-11-12

Two further distinct primary pages bring the research record to47 dated URLs. Read the Jagex tax/item-sink sections and the complete CCP fee article. These are mechanism benchmarks, not evidence of YARN demand elasticity.

|ID|Source|Evidence and consequence|
|---|---|---|
|E37|[Jagex: Yama CAs & More!, May29 2025](https://secure.runescape.com/m=news/yama-cas--more?oldschool=1)|Publisher increased the GE tax from1% to2%, preserved existing offers and separately adjusted item sinks/exemptions. A tax update and an equipment-removal policy are different levers. Preserve pending price commitments if a future seal version changes; do not apply a new reference retroactively or copy their price-support purchases.|
|E38|[CCP: Broker Fee and Sales Tax, updated March2 2026](https://support.eveonline.com/hc/en-us/articles/203218962-Broker-Fee-and-Sales-Tax)|Publisher distinguishes fees at order creation, seller tax at successful sale, and portions paid to venue owners versus removed from circulation. Fee incidence and treasury receipts must stay separate from burn. Their base7.5% sale tax and reducible broker fees are not a recommended YARN rate; free listing/cancel and existing5% V2 sale remain unchanged.|

The [216-case fee experiment](../../chain/seal-fee-study.html) changes only seal price, using the same fixed cohorts, C2 source, one13-week earning window and finite catalog.36 stress cases retain zero authority, low demand, bot hoarding, fee bypass, alternate resale prices and five-year saturation. Human participation and cosmetic interest do not increase automatically when prices fall; this is not an estimate of a demand curve.

The exact complete-basket bound is `20 grant −2 retained −3 forge −4 style =11`, divided by `200 Epic references +20 Star Thread reference`, giving a5% maximum seal rate. A5% candidate lowers a self-sourced forge from23 to13. At50% assumed participation and forge-first behavior, worst claims/burn improves from2.623 to2.395 and outputs increase from201–258 to424–526, but0/9 cases meet the original2× threshold.2.5% makes more outputs yet worsens the worst ratio to2.788; lower fees are not monotonically healthier. No case meets all four seasonal health targets.

A targeted zero-reward/no-buyer control also exposes a preference assumption: saving for all three13-YARN recipes retains7 after the first, producing no style purchase; choosing one planned recipe allows a4-YARN style. The finite catalog is not a purchase mandate. We select5% as the next **disabled price-trial candidate** based on the complete basket and paired mechanical comparison, not as a validated optimum. Public/signed seal policy stays10%, grant20 and sale5% stay fixed. Source authority and voluntary usage remain independently necessary.

## Price experiments that preserve transaction intent — read 2026-11-12

Re-read E37's existing-offer rule; it is not a new source. One further primary source brings the record to48 distinct dated URLs.

|ID|Source|Evidence and consequence|
|---|---|---|
|E39|[OWASP, Transaction Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html)|Read functional guidelines on displaying and acknowledging significant transaction data. Bind the debit to the displayed item, amount and unique reservation; stop on a changed quote. This is authorization guidance, not an endorsement of our price or demand model.|

The disabled5% candidate is now locally executable, with old reservations preserved across activation and rollback. A real Anvil20-YARN tester claim completes the13-YARN forge,4-YARN style and1-YARN thread seal, leaving2. Browser quote-tampering tests require zero debit. This tests affordable completion and correct charging; it does not turn a scripted purchase into voluntary demand or close the still-failing economic gate. See [price-trial protocol](SEAL-PRICE-TRIAL.md).
## Campaign authority and retry intent — read 2026-11-12

Read the Unity server-authority explanation and AWS's idempotency, semantic-equivalence, atomicity and changed-intent sections. These concern trustworthy source accounting; they do not supply demand or price estimates.

|ID|Source|Evidence and implementation consequence|
|---|---|---|
|E40|[Unity Cloud Code: Server authority](https://docs.unity.com/en-us/cloud-code/3.0.0/server-authority)|Server-held progression and server-enforced rules separate legitimate commands from client-edited saves. The optional campaign endpoint creates its own starter and accepts choices only. It never imports offline victory, item, seed or clock fields. A server-run legal action can still be automated.|
|E41|[AWS Builders' Library: Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)|Caller intent IDs need atomic coupling with mutations and equivalent retry responses. The campaign stores revision, source removal, inventory receipt and response in one transaction. Browser intent survives reload; same ID with changed payload fails. This prevents duplicated exports after ambiguous response loss, not unwanted account creation.|

The new campaign is a distinct server save for the same SIWE wallet. It uses existing A6 rules without CHAIN changing combat stats or drops. Six starts/day includes abandoned runs; only current choices and owned-item eligibility are projected to the browser. Future seeds and complete server state are withheld. Ordinary campaign source is now executable locally; public activation remains off. The original C2 population model and the new command-engine study remain separate, with their own runtime hashes and conditions.

## Closed-season evidence and tied reward budgets — read 2026-11-12

Read the Unity sample's reset event, archived-version query and currency-award flow, the reset/archive semantics, and PostgreSQL's complete ranking/peer definitions. These sources support implementation choices; none estimates player demand.

|ID|Source|Evidence and implementation consequence|
|---|---|---|
|E42|[Unity: Reward top players at the end of season](https://docs.unity.com/en-us/triggers/tutorials/use-cases/reward-top-players)|Awards are derived from a specific archived leaderboard version after reset. Use a closed, immutable campaign snapshot; never determine seasonal entitlement from the live changing score list. Their sample is not taken as an idempotency guarantee; our reservation ledger handles repeats.|
|E43|[Unity: Leaderboard resets](https://docs.unity.com/en-us/leaderboards/concepts/resets)|Reset clears current scores and can retain a read-only archive; one-time and recurring schedules differ. The13-week pilot has one earning period and a distinct settlement period, with no automatic renewal.|
|E44|[PostgreSQL17: Window functions](https://www.postgresql.org/docs/17/functions-window.html)|`rank`, `percent_rank` and `cume_dist` treat peer groups differently. A rank-derived reward is not automatically budget conserving under ties. Divide the finite occupied-slot pool equally in integer wei; preserve the original1/10/25/50% boundaries.|

## Campaign-linked calibration — read 2026-11-12

|ID|Source / URL (date read:2026-11-12)|Finding and concrete consequence|
|---|---|---|
|E45|[Axie: Introducing the Daily Bounty Board, April15 2024](https://blog.axieinfinity.com/p/bounty-board-is-live)|The historical program divides a fixed weekly pool by participants' verified point shares. More completed actions need not expand total issuance. This supports separately checking entitlement and global budget; its NFT ownership and paid-action eligibility are not adopted. It does not establish our1.5 ceiling or current Axie payouts.|
|E46|[Axie: Q3 State of the Nation, October30 2024](https://blog.axieinfinity.com/p/q3-state-of-the-nation)|The publisher reports distinct gameplay, bounty participation, trading and consumption measures; its campaign increased participation and a cosmetic feature reportedly burned15M SLP over two months. These are publisher reports, not an independent causal study. A source count or reward-claim count alone cannot demonstrate voluntary cosmetic demand.|

Re-read E30's model specification and replication discussion and E40's server-held progression guidance. The new campaign study uses actual legal transitions, losses and unused exported instances. Monday UTC alignment matches the reward ledger. Its two-week account traces preserve the relationship between winning and source supply; repeated later weeks are explicitly conditional, with a stop-source stress. All52-week results remain simulations. The shared server/model rank allocator conserves tied slots; no random score substitutes for the campaign's best-chapter-per-week rule. Human hours and willingness to spend remain assumptions, not measurements. No fee, allocation, live grant or C2 combat/drop parameter changes from this evidence.

The measured source experiment now includes144 server-rule accounts ×14 days, losses, real starter-resource upgrades, actual equipment choices and unique export conservation. Casual export means2.60–2.67/week; heavier profiles6.46–12.38, depending on retaining earned equipment. These are different conditions from the600-account C2 study, not revised C2 drop values. Full14-day export costs31.67–153.75 at the5% candidate, above the20 grant. Source availability cannot justify paying enough YARN to seal every drop.

The new rank ledger exposes a concrete budget error:100 tied players at a1.5 ceiling must share24.25 total, not each receive1.5. A300-population property check preserves every original tier slot and floors only division dust. The real starter-to-boss-to1.5 claim passes on Anvil with one immutable earning fact. These prove authority and accounting. Routine activation remains off and weak-demand economics remain failed.

## Multiple wallets, bounded loss and newcomer access — read 2026-11-12

|ID|Primary source / URL|Finding and concrete consequence|
|---|---|---|
|E47|[John R. Douceur, Microsoft Research, The Sybil Attack, IPTPS2002](https://www.microsoft.com/en-us/research/wp-content/uploads/2002/01/IPTPS2002.pdf)|Read the identity/entity distinction, abstract and formal-model assumptions. A distinct cryptographic identity is not evidence of a distinct operator. Our96 exact exposure cases assign synthetic operators explicitly and report concentration at both levels. This paper is not a calibrated detector or proof about all possible identity systems.|
|E48|[OWASP API6:2023, Unrestricted Access to Sensitive Business Flows](https://api-security.owasp.org/editions/2023/en/0xa6-unrestricted-access-to-sensitive-business-flows/)|Read the automated purchase, reservation and referral examples and two-layer mitigation guidance. Valid API actions can still exhaust an intended benefit. Bound total signed commitments, test different identities contending for one pool and preserve the failure of human-equity metrics. We do not adopt intrusive fingerprinting or assume IP limits identify people.|
|E49|[Human Passport, Double Verification tutorial](https://docs.passport.human.tech/building-with-passport/models/tutorials/double-verification)|Read the score definitions and fallback discussion. A new wallet can receive an insufficient-data result; requiring old-wallet history would penalize our intended guest judge. No provider integration, credential collection or bot-classification claim is added. The tutorial uses deprecated Stamps APIv1, so its sample API is not adopted.|

Decision: campaign reward activation now also requires judge grants to enter the existing shared funding ledger, even when the separate tester-budget flag is omitted. A missing/disabled budget refuses signing. With both optional flags off the original demo behavior stays unchanged. Pausing a funded program must keep the tester-budget flag on while any liabilities exist; both flags are configuration controls, not an irrevocable identity guarantee. Deploying only one updated function does not upgrade the other: the guide requires the matching pair.

Actual local proof: eight distinct Anvil wallets controlled by one script compete for a40-YARN lifetime grant ceiling. Two claim20 each; six are refused before signing. One operator captures100% of this finite budget. Synthetic1000-wallet exposure assigns200 aliases to one operator: top1% wallet share1%, top1% operator share20.8%. At assumed0.35bot hours versus3.5casual hours/week, the inclusive hourly ratio is10×, even with routine rewards zero because grants remain. Hours/ownership are assumptions, not observed identities or a benchmark imported from these sources.

The unchanged seasonal target also has a structural bound: when20% of equally rewarded wallets hoard all rewards, even100% burning by every other wallet yields at most0.8 burn/claims. Another seed sweep or smaller equal per-wallet reward cannot change that bound. Keep the original failed gate visible; do not silently redefine emissions, erase grants, force spending or award combat power to manufacture a pass.
