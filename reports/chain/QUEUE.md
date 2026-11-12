# CHAIN queue

## Current checkpoint (2026-11-12)
- H0–H4: implemented/local judge proof; original campaign authority remains a separate integration gap recorded in ACCEPTANCE.md.
- H4b: seal/V2 UI/catalog implementation verified locally; requeue #1 (score7) for authoritative ordinary campaign gear source integration.
- H5: 22-source research and corrected16-scenario52-week model plus63 reward/demand runs ready (economic gate NOT MET); requeue #1 (score7) for real C2 weekly supply, demand validation and authoritative routine-reward issuer wiring.
- H6: contracts/coverage/UI/user deployment handoff ready; three fresh expanded browser runs passed.
- H7: stretch condition not yet met because H4b/H5 integration/calibration remains open.
- H8/H8b: smoke dry mode, static architecture/tokenomics docs and L1 design ready; user deployment and18-receipt public smoke complete; frontend/bot/timing pending.
- H9: final report, evidence, self-scores and tested implementation SHA recorded; no claim that every requirement is finished.


## Requeue #1 disposition (2026-11-12)
- H4b score7: rechecked C2 OUTBOX and the server inventory boundary. Safe source remains the authenticated starter boss. No authoritative ordinary campaign receipts exist to consume; do not import browser saves or change C2 stats/drop tables. REQUESTS-TO-C2.md specifies the interface needed. Retain open, not silently waived.
- H5 score7: rechecked C2 OUTBOX; only SLOTS/PILOTS readiness, no weekly counts. The --supply JSON override and conservation checks are ready. Auto-reduction is deployed and independently verified; routine weekly/rank signing still needs authoritative entitlement wiring. Implemented-sink model fails<=2 acceptance; future forge/cosmetic assumptions are separated. Retain open, not marked calibrated or enforced.
- H7 is gated on H1–H6 green; the unresolved required cards keep the stretch out of this checkpoint.
- The final review repaired cause-specific error messages and seal pagination; it does not close either C2 dependency.

=====================================================================
H0 AUDIT (short). Map: wallet connect code, SIWE flow, voucher signing function, how cardrpg Forge/Gacha/Journal fake Relics today, CI, forge tests. Write reports/chain/H0-AUDIT.md (<=60 lines). Run `forge test` and the web unit tests once as baseline.

H1 GUEST WALLET (flag `guestWallet`, ON in demo build).
- "Play as guest" creates a Fuji-only burner key in the browser (viem generatePrivateKey), stored in localStorage under a versioned key, never sent to any server, never logged.
- It signs SIWE like any wallet, so the server sees a normal address. Same game save as a wallet user.
- Buttons: "Export key" (shows warning, copy once) and "Move to my wallet" (transfers Relics + YARN + leftover AVAX to a connected MetaMask/Core address, real txs).
- Tests: unit (key never leaves storage, chain guard rejects any chainId != 43113), Playwright (guest login twice keeps same address).

H2 GAS DRIP (Edge Function `guest-drip`, code + local test only; the user deploys).
- POST with SIWE session -> sends 0.05 test AVAX from a sponsor wallet. The user ALREADY has a funded Fuji wallet and ALREADY stored its key as a Supabase secret: find the existing secret/env name in supabase/functions code, .env.example or docs (likely the voucher signer or a deployer key); if none matches, use env SPONSOR_PRIVATE_KEY and write the exact name needed in NEEDS-USER.md. Never hardcode, commit, print or log a key. Never ask the user to paste a key.
- Limits: once per address, <=50 per UTC day, refuse when sponsor balance < 1 AVAX, per-IP rate limit; idempotent by address; records in a new table via a migration file (not applied).
- UI: after guest login, show "Getting test gas..." then balance; if drip unavailable, show the official faucet link and a "copy address" button.
- Tests against Anvil (see H3) with a throwaway Anvil key.

H3 LOCAL CHAIN E2E HARNESS.
- `pnpm chain:local` starts Anvil with chainId 43113, deploys RelicNFT + RelicMarket (+ later YARN contracts) with deterministic addresses, seeds a bot seller, writes a local address file the web app reads when VITE_CHAIN_MODE=local.
- Playwright spec chain-guest.spec.ts: guest -> drip -> win a scripted boss -> mint Relic -> list -> second guest buys -> cancel flow -> balances checked on chain. Must pass 3 runs in a row. Add to CI as its own job if CI can run Anvil (foundry action); else document.

H4 IN-GAME ON-CHAIN LOOP (the visible part; keep words short, icons first).
- After a boss win that drops a Relic: card "Mint to Fuji" -> wallet tx -> success sheet with Relic art, tx hash, Snowtrace link (testnet.snowtrace.io).
- Market screen inside the card RPG: grid of active listings read from RelicMarket.getListings, Buy / List / Cancel, price in AVAX (later YARN), own listings tab, last 20 tx with links. Read state from chain, not from the database.
- Bag reads Relic balances from chain (balanceOf). An owned Relic can go into a cat's Treasure slot (cosmetic + <=3 pp rule).
- "Judge pass": a new guest gets 2 pre-signed Relic vouchers (short expiry, server-signed as today) and a small YARN grant when H6 is on, plus a 4-step checklist: Mint, List, Buy, View on Snowtrace. Target: done in under 2 minutes.
- Bot seller: script tools/chain/bot-seller.mjs keeps 3-6 cheap Relic listings alive (key from env BOT_PRIVATE_KEY, user runs it).
- States: no gas, wrong network, tx pending, tx failed, RPC down -> each has one short line + retry. Never block offline play.

H4b TRADABLE ITEMS + P2P MARKET (user decision 12 Nov 00:40 UTC, Taskbar-Hero-style split; exact numbers come from YOUR research).
- Split every item in the catalog into BOUND (never tradable) and TRADABLE. User's model: ordinary materials, soft currency, XP items, common gear stay BOUND; RARE or LIMITED materials, Epic+ gear and Relics can be TRADABLE. Research and decide the exact list per item (criteria: scarcity, bot-farmability, effect on power, demand); write docs/design/chain/TRADE-RULES.md with a table: item, bound/tradable, reason.
- Bring on chain ("Seal to Fuji"): the player pays a seal fee (user suggests about 10%, of the item's reference value in YARN; research the right %) that is burned or sent to treasury (decide with reasons). Minted as ERC-1155 through the EXISTING RelicNFT voucher flow (reserve new id ranges for materials and gear; rarity field reused; no new NFT contract). Once sealed, the in-game copy follows the token: if the token leaves the wallet, the item leaves the bag (read balanceOf on load and on market events). No unsealing, no dupes.
- P2P market: players list at ANY price they choose. RULE: NO enforced price floor and NO ceiling. The seller pays a sale fee as % of the sale price (research the %; benchmark real game/NFT markets; split burn/treasury). Market v2 fee becomes this researched value (configurable bps, max 10%, set at deploy).
- Anti-abuse WITHOUT price floors (research and pick): per-account seal cap per day, level requirement, cooldown before relisting a bought item, listing deposit refunded on sale/cancel if needed. Document why each limit exists.
- Pay-to-win guard: a tradable item must not beat the best grindable alternative of the same tier by more than 5% Power; unit test against the catalog; if it fails, write to reports/chain/REQUESTS-TO-C2.md (C2 tunes numbers).
- Trade rules live in packages/game-rules/src/cardrpg/trade.ts (you own it; lane C2 owns drop tables and item stats).
- Research for this card (>=10 cited sources in TOKENOMICS-RESEARCH.md, section "Item trading"): fees of real game markets and NFT markets, Taskbar-Hero-like idle game markets (data reference only, never copy content), bot/RMT problems and countermeasures, wash-trading detection.
- Market UI: filter by type/rarity, item card with stats, own listings, fee shown before confirm (number only). Anvil E2E: drop rare material -> seal (fee paid) -> list at any price -> other guest buys -> buyer has it, seller does not, fee burned/treasury balance correct.
- Include sealed supply vs sinks (seal fee, sale fee, forge consuming items) in token-sim.mjs; use C2's weekly Epic+/rare-material supply from /Users/bao/taskbar-hero-cardrpg-a6/reports/cardrpg-c2/OUTBOX.md.

H5 TOKENOMICS RESEARCH + DESIGN (no code first; research is mandatory and must be strong).
- Read >=15 sources and cite each with URL + date read in docs/design/chain/TOKENOMICS-RESEARCH.md. Must cover: Axie (SLP emission vs burn, AXS), Pixels (BERRY -> off-chain coins, PIXEL capped), MapleStory Universe NXPC on Avalanche (burns, sinks, NFT-to-token), Off The Grid/GUNZ (Avalanche L1), at least 2 failed GameFi post-mortems, vesting/allocation benchmarks (e.g. Tally guide, LiquiFi data), and at least 1 academic paper on play-to-earn economies. Also Vietnam legal context for crypto rewards (state uncertainty plainly; no legal advice).
- Write docs/design/chain/TOKENOMICS.md. Starting proposal from the coordinator (you may change numbers ONLY with cited reasons, write each change in DECISIONS.md):
  * Two layers: soft currency (in-game, off-chain, unlimited, never on chain) + YARN (ERC-20, fixed 1,000,000,000, no mint after genesis).
  * Allocation: Player rewards 35% (5 years, -20%/yr) · Team 15% (12-mo cliff, 36-mo linear) · Community treasury 12% (<=2%/quarter) · Investors 12% (12-mo cliff, 24-mo linear) · Ecosystem/tournaments/artists 10% (4 yrs) · Early-tester airdrop 6% (25% TGE, 75% over 6 mo) · Liquidity 5% · Advisors 3% (12/24) · Partner reserve 2% (6-mo lock).
  * No YARN per battle. Earned only from season rank, weekly boss, tester airdrop, with weekly per-account caps.
  * Sinks: seal fee and P2P sale fee (researched in H4b), premium Relic forge (burn), season pass, cafe cosmetics/rename.
  * Health metric: burn/emission >= 1.0 per season; next season's rewards auto-reduce when < 0.8.
- Simulation: tools/chain/token-sim.mjs, 52 weeks, 3 player mixes (casual-heavy, balanced, farmer-heavy incl. 20% bot accounts), seeds fixed. Output CSV + charts in docs/chain/tokenomics.html (static, self-contained). Report circulating supply, burn/emission, price-free "YARN per active hour", top-1% share. Pass: no mix exceeds 2x emission over burn by week 52; farmers' share <= 3x casual per hour.
- Write a one-page pitch version in Vietnamese: docs/design/chain/TOKENOMICS-VI.md (<=40 lines, numbers + one chart).

DEADLINE NOTE: submission is 21 Nov 23:59 UTC+7. H6 contracts + tests + USER-DEPLOY-VI.md must be pushed by 15 Nov 12:00 UTC so the user can deploy to Fuji on 15-16 Nov; H8 dry-run must pass by 16 Nov 12:00 UTC.

H6 YARN + MARKET V2 + SEASON REWARDS (contracts; flag `yarnToken`, ON in the demo build, OFF on live main until the user deploys. USER DECIDED 12 Nov 00:27 UTC: token form A = real YARN on Fuji).
- contracts/src/YarnToken.sol: ERC-20 (OpenZeppelin v5), fixed supply minted once to a distributor at deploy, burnable, no owner mint, permit (EIP-2612).
- contracts/src/RelicMarketV2.sol: list ERC-1155 Relics priced in AVAX or YARN; sale fee in bps = the H4b researched value (configurable, max 1000 bps), split burn/treasury per H4b; same fee for AVAX and YARN sales; no price floor or ceiling; reentrancy guard; pull-payment safe; events for indexer.
- contracts/src/SeasonRewards.sol: server-signed EIP-712 claim vouchers (player, amount, season, nonce, expiry), weekly cap per player enforced on chain, nonce replay protection, owner can rotate signer, renounce disabled (same pattern as RelicNFT).
- Tests: unit + fuzz + invariant (total supply never grows; fee math; caps; replay). `forge coverage` >=90% lines on new contracts.
- contracts/script/DeployChainV2.s.sol: deploy to Fuji with addresses printed; NEVER broadcast yourself. Write exact commands for the user in reports/chain/USER-DEPLOY-VI.md (Vietnamese, numbered, copy-paste).
- Web: YARN balance in HUD (icon + number only), market currency toggle, season claim button. All behind `yarnToken`.

H7 PROVABLY FAIR RECRUIT (stretch; only if H1-H6 are green by 16 Nov 00:00 UTC).
- Commit-reveal: server commits keccak(seed) per recruit batch on chain (small contract RecruitCommit.sol), reveals seed after the pull; the client verifies the pull from the published odds table. A "Verify" link per pull. Never changes odds.

H8 FUJI SMOKE + DOCS.
- tools/chain/fuji-smoke.mjs: runs the full judge loop on real Fuji with keys from env, writes reports/chain/FUJI-SMOKE.md with every tx hash + Snowtrace link. You do not run it with real keys; the user does after deploy. Dry-run mode against Anvil must pass.
- docs/chain/index.html: static page (architecture diagram, contract table with Snowtrace links, judge 2-minute test steps, tokenomics chart). Update docs/contracts.md.

H8b NETWORK DECISION (coordinator, 12 Nov): deploy YARN and V2 contracts on Fuji C-Chain, same chain as the existing Relic contracts. Do NOT create an Avalanche L1. Write docs/design/chain/L1-ROADMAP.md (<=60 lines): why C-Chain now, how the game would later move to its own L1 (YARN as gas token, Interchain Token Transfer for YARN/Relics, validator plan) — design only, no code, no deploy.

H9 REPORT. reports/chain/CHAIN-REPORT.md: what works (with proof: test names, run counts, screenshots under reports/chain/shots/), what needs the user, risks. Self-score 1-10 per card; any card < 8 goes back to the queue once.

=====================================================================
