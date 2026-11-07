# Gameplay v4 research: preparation must explain the result
REFERENCE: RESEARCH.md; research-matrix.json; sources.json; PATTERNS.md; DECISIONS.md; DESIGN.md; RESEARCH-ADDENDUM-AUTO.md; reports/gameplay/RESEARCH.md; reports/gameplay2/RESEARCH.md; reports/cardrpg-big/memory/PROMPT-A4.md.

Access date: 2026-11-07 UTC. This is a compact five-section brief (under 2,000 words); the field-level matrix and equipment comparison carry the detail. Source IDs below resolve to URLs, dates and verification limits in sources.json. Prior research is retained, including superseded manual-battle ideas as history. No reference art is downloaded or reused. A desk study can inform choices; it cannot establish that our game is fun.

## 1. What the existing 34-game study answers, and what it does not

| Question | Existing evidence | A4 gap filled / remaining limit |
|---|---|---|
| Collect, equip, progress, repeat | RESEARCH/PATTERNS describe roster, equipment, routes and earned rewards | Automatic battle responsibility: TFT, Super Auto Pets, Battlegrounds, Backpack Battles, AFK Arena, Idle Heroes, Eversoul, Dislyte; Legend of Keepers is only a preparation analogue |
| Equipment architecture | SW/SW2/E7/AFK and ITEM-TIERS cover main/substats, sets and targeting | Six-game comparison in RESEARCH-V4-EQUIPMENT.md separates verified features from unknown costs/caps/binding |
| Distinct rarity | Existing four-tier content and collectible design limits | Separate gameplay tier, item growth and prestige edition; never infer value from scarcity alone |
| Gacha | Existing pity, banner and platform research | Deterministic chosen reward; prominent conditional odds; current official platform/legal pages rechecked |
| On-chain economies | Existing 11-game on-chain subset | Issuer postmortems, seasonal scarcity, aesthetic fusion and 2025 Axie study; no guarantee that caps preserve prices |
| Balance | Historical outcome tables, display-power formula | Restricted-play comparisons; heldout seeds; utility attribution; source/sink accounting rather than simulated revenue |
| Session/retention | Existing GDC game-feel/onboarding work | Untimed preparation, bounded idle credit, optional weekly goals; no streak-loss pressure |

Nine new game rows are added in the same schema; more than twelve newly verified source records and six papers plus three talk abstracts extend the evidence. Community guides remain explicitly secondary. Exact live numeric tables, item binding and capacities that were not supported are marked unverified rather than filled from memory.

## 2. Common model we keep

Preparation creates a hypothesis: this front row survives, this kit answers that enemy, and this equipment changes the plan. Automatic combat tests it. A short result explains one useful observation and offers a concrete next adjustment. Collection and long-term upgrades supply alternatives; targeted crafting and selectors stop randomness from becoming a permanent wall.

TFT's role inspection connects equipment to a unit's job (V4-TFT/INSPECT). Super Auto Pets supplies untimed asynchronous preparation and rotating pools (V4-SAP). Battlegrounds separates recruiting from automatic resolution (V4-BG); Backpack Battles makes placement and combination the build itself (V4-BPB). Their shared lesson is the visibility of cause and effect, not their board geometry, currencies or exact bonuses. Faction bonuses in the AFK Arena guide (V4-AFKA) are useful evidence for composition incentives, but no exact threshold is imported.

Four equipment slots and eight existing sets are enough to support distinct decisions. Maintain main stats for easy comparison, selected substats for refinement, 2/4-piece set identity and bounded legendary behavior. Every set needs a documented matchup; a higher colour alone must not erase the previous decision. Investment should be reversible through loadouts and salvage, with a visible guaranteed craft route (see the six-game comparison). Official named-preset and forge guides (V4-RAID-PRESETS/FORGE) also support a try-on summary and visible capacity checks; atomic application is our implementation inference.

## 3. Scarcity, reward fairness and current policy

Sky Mavis described issuance exceeding use and later cut two reward sources (V4-AXIE-SOURCES/CUT). The later monetary-policy announcement (V4-AXIE-LATER) is an issuer response, not proof of recovery. Ali and Vidan's 2025 case study (V4-P2E) connects growth dependence to crises and players' attempts to recover investments. Therefore our reward loops must work without new buyers, resale expectations or a fungible token.

Sorare documents seasonal scarcity (V4-SOR); Immutable describes aesthetic quality fusion (V4-GU). We adopt edition accounting and prestige separation, not their purchase flows or token costs. The opened Parallel manual (V4-PAR) does not substantiate a universal fixed supply guarantee; no such claim is made. A local ledger can enforce transitions and replay them, but copied saves are not independent global authorities. Future authoritative issuance and account identity remain required.

| Policy check | Evidence and scope | Design consequence |
|---|---|---|
| Apple / Google | Current review/payment pages require pre-purchase disclosure for purchased randomized items (V4-APPLE/GOOGLE) | Earned-only odds still shown beside the draw, including current pity and featured guarantee |
| Japan | Consumer Affairs Agency card-matching Q&A covers complete-gacha premium schemes (V4-JP) | No reward requiring a paid random collection; selector progress counts effort, never a particular random set |
| China | Beijing labels the 2016 notice valid; the cited interim measures were repealed in 2019. Consolidated applicability remains unresolved (V4-CN/STATUS/REPEAL) | Disclose pool and odds; deterministic alternative; do not call historical text universal current legal clearance |
| Belgium | 2025 SPF Economie consumer notice reiterates the paid-loot-box position; Dutch ministerial answer distinguishes unlicensed paid mechanisms and free boxes (V4-BE-OFFICIAL/NL-UPDATE) | No purchases/cash-out; no false countdowns or misleading rewards; no claim of legal approval |
| Netherlands | 2022 ruling concerns FIFA packs as part of a broader game; the official 2026 budget seeks broader European restrictions (V4-NL/NL-UPDATE/NL-2026) | Neither a blanket ban nor blanket permission is inferred; latest enacted 2026 general rule NOT VERIFIED |

Six papers are verified by publisher/university records: Zendle & Cairns 2018, DOI **10.1371/journal.pone.0206767** (association, not causal proof); Drummond & Sauer 2018, **10.1038/s41562-018-0360-1** (psychological comparison); Xiao et al., online 2021/issue 2024, **10.1017/bpp.2021.23** (disclosure visibility/compliance); Jaffe et al. 2012, [university PDF](https://homes.cs.washington.edu/~zoran/jaffe2012ecg.pdf) (restricted play); Dormans 2011, **10.1609/aiide.v7i3.12477** (resource-flow simulation); Ali & Vidan 2025, **10.1177/20539517251357296** (growth crises). DOI redirects failed for four reopen attempts; indexed publisher/university records verified identity and scoped claims. GDC TFT, economy-sink and C.A.T.S. entries are public abstracts, not claims of watching full paid talks (V4-GDC-TFT/SINK/CATS).

## 4. Thirteen design principles, with tests they imply

1. **A visible opponent creates a useful choice.** Show enemy role, opening intent and one counter before committing; explain why the proposed formation helps. Sources V4-TFT-INSPECT/BPB; test counter-hint and row changes.
2. **The fight resolves a plan.** Only pre-battle tactics affect the AI; playback buttons cannot affect RNG or results. Sources V4-BG/SAP/CATS; replay-equivalence test.
3. **Composition rewards coordination without making it compulsory.** Two/four crew-mark thresholds encourage coherent teams; a primary job contributes two marks and a secondary job one, with at least two distinct cats needed for activation. V4-AFKA plus our inference; require a 10–25 pp advantage over matched-power random legal teams, not a free win.
4. **A piece is more than its raw stats.** Compare shielding, healing, targeting and unique behavior, with paired boss outcomes alongside display score. V4-TFT and V4-JAFFE; <=12 pp single-piece gain is our gate, not a literature constant.
5. **Every tier stays useful at its intended level.** Separate content band from equipment bonuses; show challenge rating before entry. V4-JAFFE; test >=44/48 positive tier steps, zero reversals and >=15 pp bare-to-best spread per level band.
6. **Every set has a job and a cost.** Avoid universal best kits; publish counterexamples. V4-BPB/TFT; matched-power set bands and niche fixtures.
7. **Random discovery has a deterministic destination.** Targeted crafting, duplicate shards and a permanent earned selector progress bar. V4-DIS-SELECT, SW and V4-XIAO; no expiry, refund loopholes or selective hidden odds.
8. **Disclosures belong at the decision.** Base odds, next-draw conditional odds, pity and chosen-reward distance stay one click away. V4-XIAO/APPLE/GOOGLE; accessible UI and 10,000-account distribution checks.
9. **No manufactured urgency.** Earned currency only, no near-miss display, no paid pass, no lost streak reward. V4-ZC/DS/BE-OFFICIAL; a batch charges exactly its displayed cost and can be declined safely.
10. **Bound sources before promising scarcity.** Log every claim, cap replayed receipts, distinguish total issued from active holdings; burns do not reopen lifetime issuance. V4-DORMANS/AXIE-SOURCES/SOR; race, replay and rollover tests.
11. **Prestige must not buy a boss win.** Local collectible editions add zero combat stats; future Relic proposals must stay <=3 pp paired gain. V4-GU/P2E; test identical outcomes with and without designs.
12. **The cafe respects absence.** A capped shift, achievable daily board and persistent collection milestones offer several reasons to return without compulsory attendance. V4-SAP, prior onboarding research; 45-day heavy/casual earned ratio <=3x is our target.
13. **An outcome should end when its meaning is clear.** Boss phases mark progress; linked adds retire with the boss; result names observed shield/heal/status contributions without pretending correlation proves the win. V4-JAFFE and prior game-feel work; real x1 timings, no post-boss cleanup.

## 5. What makes Taskbar Hero OURS

The team is an evening cafe shift: doorway protection, kettle support and table clearing are coherent jobs. Each cat has an original primary crew job worth two marks and a secondary job worth one. A four-mark threshold is therefore reachable by a three-cat team; activation still requires at least two cats. A standing service plan changes automatic focus and rescue priorities. The player sees both its intended benefit in Prepare and its observed contribution after combat.

The taskbar presence becomes a bounded cafe shift, not an obligation to grind. A recipe shelf turns surplus gear into a chosen missing piece. A collection journal keeps permanent milestones and stories. Relic design editions commemorate accomplishments with visible supply ledgers; they do not promise income or stronger combat. Short sessions can end after a claim, a build adjustment or one route, and returning later does not erase progress. All names, numbers, code, text and presentation are authored for the cozy cafe; research titles stay in research documents.
