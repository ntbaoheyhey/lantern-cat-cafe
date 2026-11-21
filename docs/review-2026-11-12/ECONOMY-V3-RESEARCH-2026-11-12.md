# Taskbar Hero: Economy v3 (tokenomics, NFTs, onboarding, gacha, fusion, drop rates)

Research and design proposal, 12 Nov 2026. Written for the main review thread to fold into the full project document and the next Codex prompts.
Status: PROPOSAL. Nothing here is implemented or deployed. The numbers are design targets to be checked with the existing simulators (`tools/chain/token-sim.mjs`, C2 economy cohort).

Builds on (does not replace):
- CHAIN lane, branch `codex/chain-2026-11-12` @ 8d7198a: `docs/design/chain/TOKENOMICS.md`, `TRADE-RULES.md`, `TOKENOMICS-RESEARCH.md` (E1-E18, T1-T10), `reports/chain/TOKENOMICS-AUDIT.md`. Contracts already on Fuji: YarnToken (1B fixed, burnable), RelicMarketV2 (5% fee: 2% burn, 3% treasury), SeasonRewards (signed weekly claims + auto-cut controller), RelicNFT (ERC-1155 voucher mint).
- C2 lane, branch `codex/cardrpg-c2-2026-11-12` @ e90a78e: `reports/cardrpg-c2/DROP-TABLE.md`, `ECONOMY.md`, `docs/design/cardrpg/NFT-VALUE-SPEC.md`.
- Coordinator plan of 12 Nov (token form A = YARN on Fuji C-Chain; allocation 35/15/12/12/10/6/5/3/2).

---

## 0. TL;DR

1. **What exists is safe but has no pull.** The chain plumbing is real (18 public Fuji transactions passed), but the economy gives players almost no reason to want YARN or NFTs: YARN comes only from a weekly boss and a season rank (max 12/week), the only sinks are the seal fee and the market fee, tradable gear is a "canonical template with minimum rolls" (nobody needs a specific copy), and Relics have zero use. CHAIN's own simulator says acceptance is **NOT MET** (claims/burn 2.39 to 2.78, with about 22,000 sealed items piling up and no item sink).
2. **Progression is flat.** C2's 30-day cohort shows first Legendary on day 11 for casual, regular and heavy players alike, because daily caps zero out everything after the first 6 drops. A heavy player gets nothing extra per day, so there is no chase. The cat gacha is also far too generous: soft pity 13 and hard pity 24 give an effective Legendary rate of about 6.6%, which is one Legendary roughly every 2.5 days of free pulls. A 12-cat roster runs out in weeks.
3. **Fix with five connected mechanics** (sections 3 to 7):
   - **Genesis Café Deed** (limited NFT): not needed to play or trade, but needed to *withdraw* earnings, and it can host 3 free players (scholarship style). This is the onboarding hook and the FOMO object.
   - **Spool, a bonded YARN** (off-chain, spend-only; modelled on Axie bAXS and Pixels vPIXEL): all rewards pay out in Spool. It spends 1:1 in game, and withdrawing to real YARN burns a 25% fee (down to 10% with Deed tier and reputation).
   - **Forge fusion that burns NFTs**: 3 Epic + 2 Star Thread + YARN → Legendary; 2 Legendary + 5 Star Thread + YARN → Mythic, with a seasonal cap. This is the missing item sink, and the recipes tie prices across tiers.
   - **Seasons of 4 weeks** with a featured cat, a limited Relic edition, a Season Pass and an arena ladder. The FOMO is time-limited *cosmetics and editions*, never time-limited power.
   - **Rarer gacha with honest pity** (cat Legendary 1%, soft pity 50, hard 70, 50/50 featured with guarantee). Every random outcome is paid with *bound* currency only, never with YARN.
4. **Budget check** (section 8): with these sinks, the per-player season budget gives burn/emission of about 2.2 at assumed demand and about 1.5 at half demand, against the CHAIN target of 1.0 or more. CHAIN currently sits at about 0.4 (the inverse of 2.4).
5. **Legal flag (not legal advice):** Vietnam Decree 147/2024/ND-CP Art. 57(4)-(5), in force since 25 Dec 2024, bars converting game items or units into money and bars players buying or selling virtual items with each other in games licensed in Vietnam. The Fuji testnet demo is fine. A real launch with tradable items for players in Vietnam would need a legal structure (a foreign publisher, geo-fencing, or the pilot crypto framework in Resolution 05/2025/NQ-CP). Say this in the pitch under "Risks".

---

## 1. What the big games teach (research summary)

The CHAIN lane already cites 28 sources (E1-E18, T1-T10). Below are the lessons that change *our design*, with added sources (section 12).

| Game / case | What they did | What happened | What we take |
|---|---|---|---|
| **Axie Infinity** (Ronin) | SLP minted per battle; 2022-24 SLP caps; **Jan 2026: SLP emission halted in Origins, rewards moved to bAXS** (bonded AXS, account-bound, fee to convert to AXS, reputation-based fees) | SLP hyperinflation 2021-22 killed the scholar economy; the bAXS announcement brought a big AXS rally, but engagement did not recover by itself | No per-battle token. **Pay rewards in a bonded token with a conversion fee.** Lower fees for players with good reputation. |
| **Pixels** (Ronin) | BERRY (on-chain soft) sunset in 2024 → off-chain Coins; PIXEL capped; Farm Land NFT gives staking boost; 2025 **vPIXEL spend-only token**; email or phone sign-up, no wallet needed to start | Moving soft currency off-chain cut bot dumping; land is the status asset | **Soft currency stays off-chain.** Spend-only rewards. Wallet optional at start. A limited "land-like" asset gives status and earning rights. |
| **MapleStory Universe / N** (Avalanche, NXPC) | Two layers: NESO (game) ↔ NXPC (token) at a fixed ratio; **character must reach Lv 60 and finish a questline before minting**; items have fixed total supply and mint via raffle; Item Fusion burns NFTs; plan to burn 20% of quarterly revenue | The closest Avalanche reference: gated minting kept bots out of the token layer | **Level and quest gate before anything goes on-chain.** Fixed supply per edition. **Fusion that burns NFTs.** Revenue-linked burn. |
| **Off The Grid / GUNZ** (Avalanche L1) | Loot (HEX) must be *extracted* under PvP risk before it becomes an NFT; Gunzilla **never sells NFTs directly**; skins trade on OpenSea in GUN | Strong "earned not bought" story; cosmetics carry the value | **Tradables only come from effort.** Cosmetics (cat skins) are the main NFT value, not power. |
| **Big Time** (Open Loot) | Token earned only if you own or rent an Hourglass crafted on SPACE land by Time Wardens; crafting burns the token | Earning is gated by an ownable, rentable NFT. Criticised as pay-to-earn, but it does create real NFT demand | **Gate *earning*, not *playing*.** Allow renting or hosting so free players can still earn (our Deed hosting seats). |
| **Gods Unchained** (Immutable) | Free plain cards; Flux (earned, untradable) + GODS fee + burning copies to fuse a tradable Meteorite or Shadow NFT | Fusion is the bridge from free to tradable, and it is a sink | **Bound inputs + token fee → tradable output.** That is exactly our Forge. |
| **Splinterlands** | DEC/SPS, card burning; Chaos Legion printed about 15M packs | Over-printing crashed card prices; land did not create the expected sink | **Cap supply per season. Build sinks from day 1, not later.** |
| **MIR4** (Wemade) | Darksteel → DRACO smelting with a daily per-character cap; **dynamic smelting fee (Trinity algorithm) rises when the token is weak** | Bot farms still hit sell pressure; dynamic fee helped | **Daily caps + dynamic conversion fee** (our Spool withdraw fee can adjust each season). |
| **STEPN** | GST minted per move, sneakers needed to earn | Growth slowed → new inflow dropped → GST down about 97% (death spiral) | Never let rewards depend on new buyers. Rewards must be budgeted from a fixed pool with a controller. |
| **Hamster Kombat** | Huge airdrop (about 60% of supply to players), shallow gameplay, last-minute lock changes | About 86% of players left after listing; trust collapsed | Small, honest grants with clear rules published early. Gameplay must stand without the token. |
| **Seraph** (opBNB ARPG) | Only "Chaos" gear is NFT; most NFT gear needs buying or renting; revenue mainly from trade fees | Earned real money from fees, but pay-to-access is a risk | Revenue from market fees is viable. Keep *most* gear free and bound. |
| **Genshin / gacha norms** | 0.6% base 5★, soft pity about 74, hard pity 90, 50/50 featured with guarantee | Industry benchmark; players accept it if rates are published | Published rates + soft and hard pity + featured guarantee. |
| **Korea probability law** (Mar 2024) | Mandatory disclosure of capsule, *enhancement* and *synthesis* odds at every step | Enforcement and penalties since 2024-25 | Publish rates for gacha **and** enhancement **and** fusion, in game. |
| **Vietnam Decree 147/2024** | Art. 57: items only used in game, no conversion to money, no buying or selling between players | In force since 25 Dec 2024 | Testnet only now. Launch needs a legal plan (section 10). |

**Ten design rules that follow from this:**
1. Fun first: every loop must work with the token switched off (Hamster, STEPN).
2. Three layers: bound soft currency (off-chain) → bonded Spool (off-chain, spend-only) → YARN (on-chain, fixed supply).
3. No YARN per battle. Rewards come only from a fixed seasonal budget with an automatic controller (already deployed).
4. Tradables come only from effort plus burn (seal fee, fusion), never from a shop that sells power.
5. Every tradable item type has an item sink (fusion, upgrade, edition burn), not only a token sink.
6. Gate on-chain features behind level and quests (MSU Lv 60 → us Lv 15 + chapter 2).
7. Random outcomes are bought only with bound currency. **YARN never buys a random result.** This avoids crypto loot boxes.
8. Time-limited content is cosmetic or an edition. Power is always reachable later (reruns, selector, fusion).
9. Publish every probability (gacha, enhancement, fusion, drops) next to the button.
10. Measure burn/emission, YARN per active hour and the top-1% share every season. Auto-cut rewards when burn/emission < 0.8 (already in SeasonRewards).

---

## 2. Current state: honest audit

| Area | Now (code on branches) | Problem |
|---|---|---|
| Soft currencies | fish, threads, essence, stamps, shards, materials, seals, selector-marks, route-points (9) + XP | Too many names. New players cannot tell what matters. |
| Daily caps | 420 fish, 90 threads, 360 stamps, 6 essence; first 6 eligible wins/day drop gear, then 0 | Heavy/casual progress per *day* = 1.0x (first Legendary day 11 for all). Nothing to chase after 30 minutes. |
| Cat gacha | 60/30/9/1, soft pity 13 (+7pp), hard 24, 60 stamps/pull, 30 pulls/day | Effective Legendary about 6.6% (one every about 15 pulls). The roster is exhausted fast, and Legendary is not special. |
| Gear gacha | 55/34/10/1, soft 13, hard 24, 300 stamps | Same issue for gear. |
| Gear rarity | Common, Rare, Epic, Legendary (4) | No chase tier above Legendary, so no fusion goal. |
| YARN faucet | 20 tester grant once; up to 6/week boss; up to 6/season rank; cap 12/week | Too small to matter, too narrow to pull players in. |
| YARN sinks | Seal 10% of fixed reference; market fee 5% (2% burn) | Only two sinks. Simulator: claims/burn 2.4-2.8 → **fails**. |
| Tradable items | Epic/Legendary gear (64 templates, ERC-1155, canonical minimum rolls), 4 Relics, 1 Star Thread | A buyer gets the weakest roll, so there is no reason to buy. Relics have no use. No item sink: about 22k sealed items accumulate. |
| Onboarding | Guest burner wallet + Judge pass (2 vouchers + 20 YARN) | Works for judges, but there is no web3 identity: no landing page, no ownership hook, no reason to connect a real wallet. |
| Season | 13-week accounting season, monthly edition season | Too long for FOMO; two different season clocks. |

---

## 3. Currency stack v3

Merge 9 soft resources into **3 visible bound currencies + 1 bonded + 1 on-chain token**. Per-cat shards stay, shown only on the cat's page.

| Layer | Name (working) | Where | Earn | Spend | Transfer |
|---|---|---|---|---|---|
| Soft | **Fish** 🐟 | off-chain | battles, idle, dailies | cat level-up, gear enhance, tailoring | bound |
| Soft | **Thread** 🧵 (merges threads + essence + materials + route-points) | off-chain | salvage, elites, tower, dailies | crafting, fusion catalyst (low tiers), reforge | bound |
| Soft | **Bell** 🔔 (replaces stamps; 1 Bell = 1 pull) | off-chain | dailies, login, weekly chest, season pass, achievements | Cat Invitation and Gear Chest gacha **only** | bound |
| Proof | **Boss Seal** (keep) | off-chain | 1 per day for a rewarded boss win | sealing, editions, Legendary tailoring | bound |
| Bonded | **Spool** 🧶 (bonded YARN, 1 Spool = 1 YARN of claim right) | off-chain DB, signed | season rank, world boss rank, milestones, hosting share | anything YARN buys in game, 1:1 | bound; withdraw → YARN with fee |
| Token | **YARN** (ERC-20, 1B fixed, Fuji) | on-chain | withdraw Spool, buy from market or LP | seal, fusion fee, Deed upgrade, season pass, cosmetics, market | free |
| Rare material | **Star Thread** ✨ (ERC-1155 id 10001, already reserved) | off-chain until sealed | weekly world boss, tower every 10 floors, Legendary salvage | fusion, Deed upgrade | tradable after seal |

Why Spool (Axie bAXS / Pixels vPIXEL pattern):
- Most earned value is spent in game at 1:1, so fewer tokens hit the market.
- Withdrawing costs a fee that is **never minted** (it stays in the reward pool). It works like a burn for circulating supply, and no new contract is needed: the server signs a SeasonRewards voucher for `amount × (1 − fee)`.
- Withdraw fee: base 25%; −5pp per Deed tier (max −10pp); −5pp for reputation "Trusted" (90 active days, no flags). Floor 10%. Each season the fee can move ±5pp from the controller ratio (MIR4 Trinity idea).
- Withdraw needs: a Café Deed (owned or hosted seat), level 15, a 7-day account age, and at most 1 withdrawal per 7 days.

---

## 4. Onboarding: how a player starts

```
Landing page (game trailer, art, "Play free" + "Connect wallet")
   ├── Play free (guest burner wallet, already built) ──► tutorial ch.1 with 3 starter cats (Mochi, Soot, Clover)
   │         └── after Lv 15 + chapter 2: "Your café is ready to go on-chain" prompt
   └── Connect wallet (Core/MetaMask, SIWE already built) ──► same tutorial, wallet linked
Day 1-3: earn Spool from milestones (can spend in game, cannot withdraw)
Mint or host: claim a Genesis Café Deed (limited) OR join someone's café as a guest (hosted seat)
→ unlocks Spool withdrawal, sealing items, market listing, deed perks
```

### 4.1 Genesis Café Deed (the genesis NFT)

- **What it is:** a numbered NFT for the player's cat café (ERC-1155 in the existing RelicNFT, reserved id range 30001-33000, one unit per id). No new contract.
- **Supply:** 3,000 Genesis Deeds, ever. Later seasons can add non-genesis "Branch Deeds" with fewer perks and their own fixed cap, so genesis keeps its status.
- **Price model:**
  - Contest (Fuji): free mint via Judge pass or an allowlist; a counter shows "1,234 / 3,000 minted" (visible scarcity, real on-chain FOMO).
  - Launch (later): Dutch auction or fixed price in AVAX; 50% treasury, 30% LP, 20% ecosystem. Never sell power.
- **Utility (no combat power; NFT-VALUE-SPEC stays ≤3pp):**
  1. Unlocks Spool → YARN withdrawal for the owner.
  2. **Hosting:** 3 guest seats (tier 1) up to 6 (tier 5). A hosted free player can withdraw too; 20% of the guest's withdrawn amount goes to the host (Axie scholarship and Big Time renting, without the Deed leaving the owner's wallet). This is the referral engine.
  3. Café skin and title on profile and in battle loading screen; +1 sealing slot per day; early access to each season's edition mint.
  4. Upgrade tiers 1→5 by burning YARN + Star Thread (sink): 50 / 120 / 250 / 500 YARN + 2 / 4 / 8 / 12 Star Thread.
- **Why not make a Genesis NFT required to play:** NFT-gated P2E games lost most players at the wallet step (BGA 2025, YGG). Gate earnings, not fun.

### 4.2 Starter and early hooks (first 15 minutes, first 7 days)

| Moment | Reward | Purpose |
|---|---|---|
| Minute 1 | 3 starter cats, 10 Bells | Immediate team of 3 + first pulls |
| Minute 5 | First 10-pull guaranteed Epic cat | First "wow" reveal |
| Chapter 1 boss | Guaranteed Epic weapon | Power spike before the wall |
| Day 1-7 login | 7 gifts: day 7 = selector for one Epic cat | Retention for the first week (C2 already has 7 gifts; change the content) |
| Lv 15 | "On-chain café" quest: claim Deed or join a café, seal first item (fee waived once) | Converts to web3 with a real tx and a Snowtrace link |

---

## 5. Items: what becomes an NFT, what can be traded

### 5.1 Gear rarity ladder (add Mythic)

| Rarity | Source | Power vs Legendary | Tradable |
|---|---|---|---|
| Common | drops | — | bound |
| Rare | drops, fusion 4 Common | — | bound |
| Epic | drops, chest, fusion 3 Rare | — | **sealable** (seal fee) |
| Legendary | boss/elite drops (tiny), chest pity, tailoring, **fusion 3 Epic** | 100% | **sealable** |
| **Mythic (new)** | **only fusion 2 Legendary (same set)**; seasonal cap 500 per season | ≤ +5% stat budget, plus a unique visual aura | **sealable**, minted with season number |

Rule "time, not power": anything tradable must be reachable by a free player through drops, pity, selector or fusion. Buying only saves time. Mythic gives at most +5% over Legendary and cannot stack beyond 2 equipped per team.

### 5.2 Quality buckets (fix for "canonical minimum rolls")

Keep ERC-1155 (liquid markets for a small player base), but encode roll quality in the id: `20000 + set*100 + rarity*10 + slot`, then **+ quality offset** 0 / 1000 / 2000 for **Worn / Fine / Perfect** (affix roll in the bottom 40% / middle 45% / top 15%). Sealing snaps the item to the floor of its bucket. A buyer can now pay more for Perfect, so price has information. Enhancement level resets on seal (the buyer re-enhances with Fish, which is a soft sink).

### 5.3 Tradability table (refines CHAIN TRADE-RULES)

| Item | Bound / Tradable | Why |
|---|---|---|
| Cats (heroes) + their shards and XP | **Bound** | Core progression. Selling heroes = pay-to-win and bot farms. |
| **Cat Skins** (designer-made Spine skins; new) | **Tradable NFT** (ids 40001+) | Cosmetic value. Matches the "beautiful" goal; the designer's art becomes the premium asset (GUNZ skins model). Limited per season. |
| Common / Rare gear | Bound | Endless supply, would flood market |
| Epic / Legendary / Mythic gear | Tradable after seal | Scarce; has an item sink (fusion) |
| Star Thread | Tradable after seal | Needed by fusion and Deed upgrades → constant demand |
| Fish, Thread, Bell, Boss Seal, keys, consumables | Bound | Farmable; bots |
| Spool | Bound (withdraw → YARN) | Bonded by design |
| Relics / editions (Moon Collar, Golden Maneki, new seasonal) | Tradable | Fixed supply, collection set bonus = cosmetic café decor + title |
| Genesis Café Deed | Tradable | Status + earning rights |

### 5.4 Sealing (off-chain → NFT)

- Keep CHAIN rules: Lv gate (raise from 2 to 15), 3 seals/day (Deed +1), 10-minute relist delay, no unseal.
- **Seal fee becomes dynamic:** 10% of the 7-day median sale price of that id (fallback: fixed reference 100 / 300 / 900 YARN for Epic / Legendary / Mythic, and 20 for Star Thread). Median from on-chain sales, min 3 sales. Burned.
- Seal also costs 1 Boss Seal (proof of daily effort, bot friction).

---

## 6. Forge: fusion and enhancement (the item sink)

### 6.1 Fusion recipes (deterministic, 100% success; rates published)

| Recipe | Inputs | YARN fee (burned) | Output |
|---|---|---|---|
| Rare | 4 Common same slot + 20 Thread | — | 1 Rare (random set within slot) |
| Epic | 3 Rare same slot + 60 Thread | — | 1 Epic |
| Legendary | 3 Epic same set + 2 Star Thread | 20 | 1 Legendary same set, quality = best of inputs −1 bucket |
| Mythic | 2 Legendary same set & slot + 5 Star Thread + 3 Boss Seals | 80 | 1 Mythic, seasonal cap 500 (counter visible) |

- On-chain inputs (sealed) are sent to the burn address `0x…dEaD` with `safeBatchTransferFrom` (no RelicNFT change needed). The output is minted with a normal voucher. Off-chain inputs are just consumed. **This is the sink that CHAIN's model is missing.**
- **Price anchor:** because the recipe is open, the market enforces roughly `P(Legendary) ≈ 3·P(Epic) + 2·P(Star Thread) + 20` and `P(Mythic) ≈ 2·P(Legendary) + 5·P(StarThread) + 80`. If Epic prices crash, players buy cheap Epics and fuse, which removes Epics and lifts the price. If Legendary prices spike, fusion increases supply. No price floor or ceiling is needed (user rule kept); the recipe links the tiers.

### 6.2 Enhancement +0 to +10 (Fish sink, thrill without loss)

| Level | +1→+5 | +6 | +7 | +8 | +9 | +10 |
|---|---|---|---|---|---|---|
| Success | 100% | 80% | 70% | 60% | 50% | 40% |
| On fail | — | keep level, +10pp "Blessing" to next try (stacks until success) | same | same | same | same |
| Stat gain | +4% each | +5% | +5% | +6% | +6% | +8% |

No destroy, no level loss (gentler than MapleStory star force); the thrill comes from the roll plus the visible Blessing meter. Fish cost grows ×1.35 per level. Rates and Blessing are shown before each try (Korea rule).

---

## 7. Gacha, drops, seasons, FOMO and retention

### 7.1 Gacha (Bells only, bound)

| Banner | Base rates C / R / E / L | Soft pity | Hard pity | Featured | Effective L | Expected pulls / p90 |
|---|---|---|---|---|---|---|
| Cat Invitation (standard) | 55 / 33 / 11 / 1.0 | from pull 50, +6pp per pull | 70 | — | 2.4% | 42 / 56 |
| Cat Invitation (featured, season) | same | same | same | 50/50; guaranteed after a miss | 2.4% L, featured ≈ 1.2% | featured ≤140 worst case |
| Gear Chest | 50 / 35 / 14.2 / 0.8 | from 40, +6pp | 60 | — | 2.7% | 37 / 46 |
| Current C2 cat (for comparison) | 60 / 30 / 9 / 1 | 13 | 24 | 50/50 | 6.6% | 15 / 19 |

- Bell income for a daily free player: about 4/day (dailies 2, login 1, idle 1) + weekly chest 8 + free pass 10 → **about 130-140 per 4-week season**. So a daily player is guaranteed the featured cat within its season (2 hard pities), and a casual player who misses days may not get it: *achievable FOMO*.
- Pity counters carry over between banners of the same type; featured guarantee carries to the next featured banner.
- Duplicates → shards: 5 / 10 / 20 / 40 (C/R/E/L). Cat stars 1★→5★ need 10 / 20 / 40 / 80 shards. Long-term chase for whales of *time*.
- Selector: 1 mark per pull; 120 marks = choose any non-featured Legendary cat (rerun safety net).

### 7.2 Drop tables (per won encounter)

Diminishing returns replace the hard zero after 6 drops: drops 1-6 per day full rate, drops 7-18 at 50% chance, then bound Fish/Thread only. Heavy players get roughly 2× a casual's daily gear (target heavy/casual per day 1.5-2.5×, per hour ≤1×).

| Source | Gear chance | C / R / E / L / Mythic | Other |
|---|---|---|---|
| Normal fight | 30% | 65 / 30 / 5 / 0 / 0 | Fish, Thread |
| Elite | 60% | 0 / 72 / 27.9 / 0.1 / 0 | Thread ×2 |
| Chapter boss (first clear) | 100% | guaranteed Epic, 3% Legendary | 10 Bells |
| Chapter boss (repeat, 1 Boss Seal/day) | 100% | 0 / 30 / 69.7 / 0.3 / 0 | Boss Seal |
| Tower floor ×10 | chest | Epic + 5% Legendary | 1 Star Thread |
| **Weekly World Boss** (new; shared HP, damage rank) | chest | Epic guaranteed + 3% Legendary | Star Thread 1 (top 50% → 2, top 10% → 3), Spool by rank (below) |
| Salvage Legendary | — | — | 1 Star Thread + 25 Thread |

Star Thread supply per active player ≈ 2-4 per week, demand ≈ 2 per Legendary fusion + 5 per Mythic + Deed upgrades. Target: weekly sink/source 0.9-1.1 (check in sim).

### 7.3 Season loop (4 weeks)

| Week | Content |
|---|---|
| 1 | New featured cat banner + new skin line + season Relic edition opens (fixed supply, e.g. 600) |
| 2 | World Boss with the season's element twist; fusion event (Mythic fee −50% for 48h) |
| 3 | Arena ladder mid-point rewards; skin second wave |
| 4 | Final ranks; edition mint closes; preview of next featured cat (countdown on home screen) |

Season Pass: free track (Bells, Fish, Thread, 1 Star Thread) + premium track 100 YARN (skin, café decor, +20 Bells, title). 50% of the price burned, 50% treasury. The premium track has **no power items**.

Spool rewards per season (paid from the 35% player pool, under the existing controller and caps):

| Source | Spool |
|---|---|
| Arena / season rank | top 1%: 120; top 10%: 50; top 50%: 15; participation (20 fights): 5 |
| World Boss (weekly) | top 1%: 15; top 10%: 6; top 50%: 2 |
| Milestones (once per account) | ch.2: 5; ch.3: 10; first Legendary: 5; first fusion: 5 |
| Hosting share | 20% of guests' withdrawals |
| Weekly cap per account | 40 (contract cap must be raised from 12 → 40 by the user at redeploy, or keep 12 for the demo) |

### 7.4 FOMO and retention: what is time-limited, what is not

| Time-limited (FOMO) | Never time-limited |
|---|---|
| Season skins, season Relic edition (supply counter on-chain), Genesis Deed (3,000 ever), Mythic cap per season, featured banner window, season titles, "first clear" server titles | Cats (rerun + selector), gear power (drops + fusion), story chapters, enhancement |

Retention hooks: daily boss seal (1/day), idle offline 12 h cap, 7-day login gift, weekly World Boss, season pass, pity counters, cat star chase, café hosting (social).

---

## 8. YARN economy model

### 8.1 Allocation and schedule: keep the deployed one

Keep the coordinator/CHAIN allocation (players 35%, team 15% with 12m cliff + 36m linear, treasury 12%, investors 12% 12/24, ecosystem 10%, early testers 6%, liquidity 5%, advisors 3%, partners 2%) and the 5 annual player envelopes (each 80% of the previous year; year 1 ≈ 104.1M). Change only: **season length 13 weeks → 4 weeks** in the reward design (contract cadence is weekly, so the controller can stay as deployed; aggregation window changes in the issuer).

### 8.2 Faucets and sinks

| Faucet (into player hands) | Sink (out of circulation) |
|---|---|
| Spool withdrawals (rank, world boss, milestones, hosting) | Withdraw fee 25% (never minted) |
| One-time tester / judge grant (20) | Seal fee (dynamic, burned) |
| Ecosystem grants (artists, tournaments), vesting unlocks | Market fee 5% (2% burn, 3% treasury) |
| | Fusion fee 20 / 80 (burned) |
| | Deed upgrades (burned) |
| | Season Pass premium 100 (50% burn) |
| | Cosmetic shop: skins, café decor, rename (50% burn, 50% treasury → artists) |

### 8.3 Per-player season budget (assumptions explicit, average active player)

| Item | YARN per player per season |
|---|---|
| **Emission** (Spool earned) | **25** |
| Withdraw fee (50% of Spool withdrawn × 25%) | 3.1 |
| Season pass (30% buy × 100 × 50% burn) | 15.0 |
| Legendary fusion (50% of players × 20) | 10.0 |
| Mythic fusion (5% × 80) | 4.0 |
| Seal fees (about 3 seals × about 3) | 9.0 |
| Market fee burn (2% of 120 volume) | 2.4 |
| Cosmetics (20% × 60 × 50% burn) | 6.0 |
| Deed upgrades (10% × 50) | 5.0 |
| **Total burn** | **54.5 → burn/emission ≈ 2.2** |
| Half demand on pass, cosmetics, fusion | **≈ 1.5** |

Reading: sinks now exceed emission even at half the assumed demand, because the big sinks are things players *want* (pass, skins, fusion), not taxes. Spending more than the emission means players buy YARN from the market. That is the healthy direction (real demand), unlike STEPN where new buyers paid old players. These assumptions must be put into `token-sim.mjs` (3 mixes, 20% bots, 52 weeks) before any number is called a result.

### 8.4 P2P market and price effects (no floor, no ceiling)

- Fee 5% stays (RelicMarketV2 is immutable; within Axie 4.25%, OpenSea 2.5% + royalties, Magic Eden 2%, and well below Guild Wars 2's 15% trading post fee).
- What sets prices:
  - Supply = seal rate (capped 3-4/day/account, Lv 15, Boss Seal cost) + fusion output.
  - Demand = fusion inputs (recurring), power-seekers saving time, collectors (Perfect quality, editions), Deed upgrades (Star Thread).
  - Recipe arbitrage links tiers (section 6.1), so a crash in one tier is absorbed by fusion.
- Risks and answers:
  - Bots farming Epics → seal needs Lv 15 + Boss Seal + daily cap; reputation-based withdraw fee; server flags (same-pair round trips, fresh-wallet clusters).
  - Wash trading → no volume rewards; every trade costs 5%; leaderboards ignore market volume.
  - Price collapse after the season → old-season editions become set pieces for café decor; Mythic cap per season keeps Mythics scarce.
  - Whale buying power → Mythic +5% max and the power cap per team; arena brackets by Power.

### 8.5 KPIs per season (dashboard)

burn/emission (target ≥1.0; auto-cut <0.8), Spool withdraw rate, YARN per active hour (casual vs heavy ≤3×), top-1% share of Spool, sealed stock vs fused (target fused/sealed ≥ 0.5), Star Thread source/sink 0.9-1.1, median price per tier, D1/D7/D30 retention, featured-cat acquisition rate among daily players (target ≥90%), share of players with a Deed or seat.

---

## 9. What to build for the contest (by 21 Nov) vs later

Given 2 Codex sessions and the user's priority (visuals and effects first), the economy MVP should be small and visible.

**MUST (demo, judge-visible, about 1.5-2 Codex days):**
1. Landing page: art, trailer loop, "Play free" / "Connect wallet", live counters (Deeds minted, YARN burned, items fused; read from chain).
2. Genesis Café Deed free mint via Judge pass (RelicNFT voucher id 30001+), Deed card art, profile badge.
3. Spool balance in HUD; Withdraw → YARN (SeasonRewards voucher with fee); fee and burned amount shown.
4. Forge: Legendary fusion (3 Epic + 2 Star Thread + 20 YARN) with real burn tx to `0x…dEaD` + mint; Snowtrace links. Big reveal VFX + sound.
5. Gacha rates v3 + pity counters + "Rates" popover (rates also for enhancement and fusion).
6. Season banner with countdown and edition supply counter.
7. Economy page: tokenomics chart, faucets/sinks diagram, burn/emission live.

**SHOULD:** quality buckets, dynamic seal fee, enhancement +10, currency merge (9 → 3), diminishing drops.
**LATER (roadmap slide):** Mythic, World Boss, hosting seats, cat skins shop, Season Pass, arena ladder, Branch Deeds, own L1 (CHAIN's L1-ROADMAP).

Contract impact: **none required for MUST** (all through existing RelicNFT vouchers, YarnToken burn, SeasonRewards vouchers, dead-address transfers). Raising the weekly cap from 12 to 40 requires a SeasonRewards redeploy; keep 12 for the demo.

---

## 10. Legal and compliance notes (not legal advice)

- **Vietnam:** Decree 147/2024/ND-CP Art. 57: virtual items, units and points are used only inside the game for the purpose the publisher registered; no conversion to cash or cards; no buying or selling between players. In force 25 Dec 2024. Resolution 05/2025/NQ-CP starts a limited crypto-asset pilot. Our demo is Fuji testnet with "no real value" labels. A real launch needs counsel: likely a non-VN publisher, geo-blocking VN for trading and withdrawals, or a licence under the pilot.
- **Gacha:** publish all odds (Korea 2024 law, China rules, Apple/Google store rules). No random result bought with YARN or with any transferable asset; random outcomes only with bound Bells.
- **Securities risk:** no promised returns, no "earn" marketing, no staking yield from treasury. YARN utility = in-game spend. Testnet only in the contest.

---

## 11. Decisions for the user (recommendations marked ✅)

1. ✅ Genesis Café Deed: free to play, Deed (or hosted seat) needed only to withdraw earnings. Alternative: Deed needed to play (not recommended).
2. ✅ Rewards paid in bonded Spool with a 25% withdraw fee. Alternative: pay YARN directly (current; fails the simulator).
3. ✅ No YARN for random outcomes; gacha only with bound Bells.
4. ✅ Cats stay bound; Cat Skins become the main cosmetic NFT (uses the designer's Spine art).
5. ✅ Add Mythic tier only via fusion, seasonal cap 500, ≤ +5% power.
6. ✅ Season length 4 weeks.
7. ✅ Make the gacha rarer (cat L effective 6.6% → 2.4%) with a featured guarantee reachable by a daily free player.
8. ✅ Merge 9 soft resources into Fish / Thread / Bell (+ Boss Seal).
9. ✅ For the contest, build only the MUST list (section 9); everything else goes on the roadmap slide.

---

## 12. Sources (added in this research; CHAIN's E1-E18 and T1-T10 still apply)

- Axie bAXS overhaul, Jan 2026: https://cryptopotato.com/axie-infinitys-baxs-overhaul-sparks-200-axs-rally/ ; https://www.blockchaingamer.biz/amp/news/41370/axie-infinity-new-baxs-apptoken-reward/ ; https://cryptogames3d.com/?p=25419
- Pixels vPIXEL, staking, sign-up: https://nftnewstoday.com/2025/06/05/how-pixels-staking-works-support-featured-games-and-earn-pixel ; https://pixelspost.substack.com/p/ama-recap-jul-9-2025 ; https://litepaper.pixels.xyz/usdpixel-whitepaper/lessons-learned-and-revised-vision ; https://www.dextools.io/tutorials/what-is-pixels-game-ronin-web3-farming-pixel-guide-2026
- MapleStory Universe / N: https://messari.io/report/maplestory-universe-building-for-the-future ; https://dappradar.com/blog/maplestory-universe-nxpc-token-economy-tokenomics ; https://games.gg/maplestory-universe/guides/maple-story-n-guide-how-to-play-and-earn/ ; https://limelight-kor.notion.site/Acquire-item-1338840ef6ba811b8670f0c3075f8b3a ; https://docs.msu.io/msu-services/smithy
- Off The Grid / GUNZ: https://decrypt.co/resources/what-is-off-the-grid-battle-royale-shooter-avalanche ; https://decrypt.co/331777/off-the-grid-skin-sale-volume-hits-30k-as-the-avalanche-shooter-hits-opensea
- Big Time: https://wiki.bigtime.gg/big-time-economy/economy-overview ; https://medium.com/playbigtime/big-time-space-rarity-utility-explained-331c8de2905
- Gods Unchained fusion: https://portal.godsunchained.com/blog/fusing-in-the-forge ; https://immutable.zendesk.com/hc/en-us/articles/15427615705231-Flux-Fusing-and-the-Forge
- Splinterlands: https://naavik.co/deep-dives/economic-simulations-of-ilv-and-sps-tokens/ ; https://www.publish0x.com/costanza/splinterlands-the-need-to-fix-card-prices-and-how-xkezykx
- MIR4 dynamic smelting: https://cs.mir4global.com/post/618 ; https://forum.mir4global.com/post/493
- Seraph: https://www.chaincatcher.com/en/article/2156196 ; https://prnewswire.com/news-releases/seraph-in-the-darkness-confirms-innovative-blockchain-gaming-economic-models-at-conclusion-of-chaos-legacy-test-302025945.html
- STEPN post-mortems: https://blockcrunch.substack.com/p/stepn-a-quantitative-look-at-move ; https://decrypt.co/103666/strava-meets-pokemon-go-stepn-3-million-users
- Hamster Kombat: https://blog.aelf.com/posts/3-lessons-hamster-kombats-boom-to-dust-aelf-ventures ; https://crypto.news/hamster-kombat-ended-in-a-mass-exit-260-mln-players/
- Onboarding (F2P vs gated): https://blockchaingamealliance.net/web3-onboarding-in-2025-is-friction-a-thing-of-the-past/ ; https://regional-front.cointelegraph.com/news/free-to-play-web3-games-mass-adoption-ygg-gabby-dizon
- Gacha norms: https://sportskeeda.com/esports/what-pity-soft-pity-50-50-genshin-impact-banner-drop-rates-explained ; https://bestforandroid.com/tips/gacha-game-odds-pity-raid-genshin-star-rail/
- Korea probability law: https://www.hwawoo.com/eng/insights/newsletter/2547 ; https://www.legal500.com/firms/30196-yoon-yang-llc/c-south-korea/news-and-developments/punitive-damages-and-other-special-legal-provisions-for-litigation-concerning-probability-based-game-items
- Vietnam Decree 147/2024: https://luatvietnam.vn/tin-van-ban-moi/quy-dinh-ve-vat-pham-ao-diem-thuong-trong-game-tu-25-12-2024-186-99885-article.html ; https://hethongphapluat.com/nghi-dinh-147-2024-nd-cp-quan-ly-cung-cap-su-dung-dich-vu-internet-va-thong-tin-tren-mang/dieu-57 ; https://nhandan.vn/ocop/nghi-dinh-moi-cam-mua-ban-vat-pham-ao-trong-tro-choi-dien-tu-tren-mang-giua-nhung-nguoi-choi-post844806.html

Gacha math (expected pulls, p50, p90, effective rate) was computed with a short exact-probability script; the season budget in 8.3 is arithmetic on stated assumptions, not a simulation.
