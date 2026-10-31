# Coverage table: every reference system -> our original version -> demo screen

Rules: ideas only. No copied art, names, text or tables. Every number in the "our version" column is a **demo-only placeholder**, not a game-rules change (Tier 3 stays untouched). "Demo screen" is a proposed Codex/Index screen or an existing screen; none is built by this PR. Priority: A = do first (presentation only), B = needs numbers/design sign-off, C = skip or post-contest.

Extra systems found in the zips beyond `systems.md`: bosses (3 act bosses x 4 difficulties), status effects (6, with durations), buffs/debuffs table (29 modifiers), skill priority list, unique modifiers (89), material effects (79), trade ship, mailbox, seasonal event, achievements (80), patch notes, roadmap, plus calculators (BiS, farming, damage taken, Cube EXP, compare) and community "meta" rankings.

| # | Reference feature | What it teaches | Our improved original version (demo-only numbers) | Demo screen | Pri |
|---|---|---|---|---|---|
| 1 | Chests (3 families, global cooldown, odds by grade, live drop feed, pity counters) | Trust through visible odds and a satisfying reveal | "Cat Chests": Paw / Boss / Chapter chests with a Codex odds panel, session feed, rolls-since-rare counter (display only; server already knows). Cooldown stays as today | Chest reveal + Odds panel | A |
| 2 | Stages and acts, 4 difficulties, per-stage drop keys and weights | Readable pacing, a map of what drops where | Chapter map showing each of our 5 chapters, monsters and drop sources; difficulty ladder is a stretch idea (e.g. "Kitten / Tabby / Alley / Feral") not built now | Chapter map | A (map), C (difficulties) |
| 3 | Stage scaling formulas (per-stage and per-level multipliers) and offline reward table | Stepped, designer-controlled curves | Show our existing boss power curve as a chart; propose a stepped table for review | Formula page | B |
| 4 | Act bosses with per-difficulty stats and skill lists | Boss cards sell the fight | Boss cards: portrait slot, power by level, attack pattern icons, drops. Reuse our existing boss data only | Boss codex card | A |
| 5 | Gear catalogue (1,500+ items, 10 grades, base item, level) | Searchable catalogue builds depth | Searchable view of our own equipment catalog (`content-v2`), filters by slot/class/rarity; we keep 5 rarities | Gear browser | A |
| 6 | Unique modifiers (89, rolled by top grades, change skill behaviour) | Build-defining effects beat raw stats | A few "twist" lines on Legendary gear (e.g. a skill resets or chains). Needs design and tests | Modifier list | B |
| 7 | Stats page (what each stat does, how it stacks, cap) | Players need rules in one place | "Stats & Caps" page generated from our config; states additive vs multiplicative and each cap | Stats & Caps | A |
| 8 | Status effects (6) and 29 buffs/debuffs with durations | Clear status language | Only if our combat has statuses; otherwise a glossary of our own effects (stun, bleed...) | Glossary | C |
| 9 | Classes / heroes (6) with base-stat ranks, skins, skill trees (90 points) | Distinct class identity at a glance | Class compare chart (HP/ATK/DEF/interval/crit) for our 7 cats; skill tree is out of scope | Class picker compare | A |
| 10 | Skills (36 actives, passives, priority order, cast-speed simulator) | Auto-battle readability: show the cast order | "Combat log" strip showing the order our cats act in; no cast simulator | Combat HUD | B |
| 11 | Pets (10 companions, unlocked by kill counts, passive %) | Collection and unlock goals | "Companions": cosmetic-first sidekicks unlocked by milestones; any % bonus would be an economy change | Companion shelf | C (cosmetic only: B) |
| 12 | Cube hub (Synthesis, Alchemy, Crafting, Decoration, Engraving, Inscription, Extraction, Offering, Attunement, Corrosion, own level track) | One central crafting station with a progression ladder | "Forge level" that unlocks our existing forge actions (craft, salvage, relic) in steps; new operations are out of scope | Forge ladder | B |
| 13 | Synthesis (9 -> 1, great success, odds table) | Fuse lots of cheap items into one better item | Our forge already has great success; publish its odds in the Codex | Forge odds | A |
| 14 | Alchemy (melt for gold) and Corrosion (melt for entry fuel) | Sinks for surplus items | Our salvage -> shards is the same idea; show a "value of this item" hint | Salvage preview | A |
| 15 | Crafting by slot with material tiers | Targeted crafting, not only gambling | Recipe forge already does this; add a recipe browser | Recipe browser | A |
| 16 | Materials (179) and material effects (79) | Materials with meaning | Our materials list with where-to-find; no effect layer | Materials list | A |
| 17 | Currencies: gold, Cube EXP, coins, contamination gauge | Few currencies, each with one clear sink | We have Gold, Shards, Boss Key, Yarn, Moon Pearl; show a one-page "what each currency does" | Economy page | A |
| 18 | Relics, reliquaries, resonance (colour sets), offering ladder | Collection set bonuses make NFTs matter | Our 4-tier on-chain Relics: show a set-bonus **concept** screen only; contract/metadata change is not proposed now | Relic sets mock | B |
| 19 | Rune tree (197 nodes, account-wide) | Long-term account progression | Skip for contest; maybe a tiny 6-node "Paw tree" mock, demo-only | Mock only | C |
| 20 | Plaguelands gauge (wall-clock drain/refill, runs offline) | Timestamp-based time gates | Fits our claim model; mention as design pattern only | none | C |
| 21 | Quests | None found in the zips (no quest or daily-mission page was captured) | If we want dailies they are a new feature, not adoption | none | C |
| 22 | Achievements (80, real global unlock rates) | Rarity-of-unlock bragging | Achievement list with our own badges and the % of players who earned them (computed from our DB, no wallet data shown) | Achievements | A |
| 23 | Seasonal event (Halloween: ticket, special stage, event chests, end timer) | Time-limited content drives return visits | One countdown banner + event chest concept for the demo; a real event is post-contest | Event banner mock | B |
| 24 | Market and Trade Ship (list item for sale, 8h slot lock), Mailbox (delivery tab) | Safe async delivery for trades | Our RelicMarket already trades Relics only; add a mailbox-style "delivered items" list in UI | Market + inbox | B |
| 25 | Calculators: BiS finder, compare, farming, damage taken, Cube EXP, drop finder, chest optimizer | Tools make the game feel deep | Two small tools using our own pure functions: "Compare two items" and "Where does this drop?" | Tools tab | A |
| 26 | Community meta rankings, builds, stash import | Social proof from real data | Skip | none | C |
| 27 | Patch notes, roadmap | Shows the project is alive | In-app "What's new" box | Footer card | A |
| 28 | Visual style of chests, reveals, cast animations | Pacing and feedback of opens | Rebuild reveals with our own sprites and effects (already in our effects tests) | Chest reveal | A |

## Demo plan (proposal)

Priority A items are all read-only views built from our registry, so one Codex round can cover rows 1, 2 (map), 4, 5, 7, 9, 13 to 17, 22, 25, 27 and 28. B rows stay as clearly marked mock screens until the user approves the numbers. C rows are skipped. No on-chain or economy change is needed for any A row.

## Not yet done

No demo or UI code is written by this PR. If the user wants it, the next step is a UI-round prompt for the Codex tab (data model in `adoption-ideas.md`), starting with the A rows.
