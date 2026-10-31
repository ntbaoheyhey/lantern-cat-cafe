# Comparison with our design and ideas to adopt

Our side, from `packages/game-rules/src/config.ts` and `docs/content-v2.md`: Cat RPG v2 has 7 cat classes with weapon profiles, 5 gear slots plus 4 accessory slots, 5 gear rarities (decoupled from the 4 on-chain Relic tiers common/rare/epic/legendary), 5 chapters x 10 rounds with key-gated bosses and chests, a recipe forge (craft, salvage, Relic), Boss Key + 30 shards forging one Relic per day, offline cap 8 h at 50% efficiency, boss fights 5 per day, and a levelGrowth of 12% per item level up to 30.

Hard constraints: no fungible token; Relic NFTs on Fuji only; original content only; online screening scores Technical 25 + Avalanche Integration 25; the final round adds Creativity 15, Impact 15, Pitch 10, UI/UX + Demo 10. This proposal changes no numbers (Tier 3: economy changes need the user's sign-off).

## What is the same or already covered

| Their system | Ours | Verdict |
|---|---|---|
| Idle strip, offline rewards table by stage level | Idle claim with offline cap/efficiency | Same genre; our server-authoritative claim is stronger for on-chain integrity |
| 6 classes, distinct base stats | 7 classes with HP/ATK/DEF leanings | Covered |
| 10 grades | 5 gear rarities | We are deliberately smaller; do not grow |
| Synthesis with "great success" | `forge-great-success.md` | Concept already adopted |
| Chest drops with weights | `drop-rates-v2.md` | Covered |

## Ranked ideas (value for the contest)

Ranking criterion: judges' score, then cost/risk. "Inspiration" means the idea is a general game-design pattern we reimplement with our own numbers and cat theme.

1. **Transparent "Codex / Index" tab with odds and formulas (UI/UX, Impact, Technical).** The most valuable thing the source site demonstrates is not a mechanic but a product: published formulas, drop odds, caps and simulators build player trust. For us it doubles as an Avalanche story: odds are served from the same game-rules package the contracts' vouchers use, so "provably the numbers you see are the numbers used". Cheap, data-only (see section below). Recommended first.
2. **Live odds and pity-style counters in the forge/chest reveal ("rolls since last Rare+", "best drop this session", drop feed) (UI/UX, Creativity).** Pure presentation. Requires no rule change if the counters only display what the server already knows. A pity mechanic itself would change economy: needs approval.
3. **Documented stat-stacking and caps page (Technical).** Their clearest lesson: say whether bonuses are additive or multiplicative and what the caps are. Our v2 already has "stepped bonus lines"; publish a single formula `final = (base + flat) x (1 + sum of additive) x product(multiplicative)` and the cap table in the codex. Suggest we check that our engine actually follows one rule, then document it. Any change to the engine is Tier 3.
4. **Per-stage lookup tables instead of one growth exponent (Technical, balance).** Their offline reward table is a hand-tuned stepped curve (plateaus and jumps) per stage level, plus separate per-stage boss multipliers. We use `powerGrowth: 1.15` per boss level. A stepped table gives designers control and makes chapter pacing readable. Idea only; changing it is a numbers decision for C9 (M-D2) sign-off.
5. **Cube-style unlock ladder (Creativity, retention).** One shared "Forge level" fed by everything salvaged or crafted, unlocking recipes at thresholds. It would give our forge a progression spine and an easy demo story. Larger design change, so a post-cut-over candidate (links to M-D1/M-D3 timing).
6. **Resonance / set bonuses on Relics (Creativity, Avalanche Integration).** "Equip N relics of colour X for a party effect" ties the on-chain Relic NFT directly to gameplay, which scores under Avalanche Integration. Our Relics have 4 tiers only; adding colours/traits is a contract/metadata change: strictly post-approval and probably out of scope before 30 Nov.
7. **Stat identity per class table (UI/UX).** A radar or bar comparison of classes on the class-pick screen. Presentation only; our content registry already holds the data.
8. **Global cooldown on chests (design).** One shared cooldown to throttle drops is simple to enforce server-side and reduces abuse load. Only if rate-limit/abuse work needs it; changes economy.
9. **Wall-clock gauge that runs offline (e.g. contamination).** Fits our timestamp-based claim model. Low priority.

Not recommended: 10 grades, 197-node rune tree, 1,500+ item catalogue, pets, anniversary coins, DLC pools. Too large for the remaining time and would also move us closer to the original, which hurts the originality requirement.

## What to ask the user to decide

- Approve ideas 1 to 3 (presentation/documentation only) as a UI round item.
- Decide whether ideas 4 to 6 (economy/contract-adjacent) are post-contest or go to the C9 numbers sign-off.
- Whether to ask the source site owner or game publisher for written permission before any further use (see `licence-risk.md`).

## Index / Codex tab: data model only

Goal: a read-only reference tab in the web app generated from our own `packages/game-rules` registry, so docs cannot drift (same approach as `scripts/gen-content-docs.mjs`). No third-party assets, text or numbers.

```ts
// Sketch only. All fields come from our own content registry.
type CodexEntryKind = 'class' | 'monster' | 'boss' | 'gear' | 'material' | 'recipe' | 'relic' | 'chapter';

interface CodexEntry {
  id: string;            // our content id, e.g. "wpn.sword.twig"
  kind: CodexEntryKind;
  name: string;          // our own name
  summary: string;       // our own flavour text
  icon: string;          // our own asset key
  rarity?: RarityId;
  stats?: Record<string, number | [number, number]>;   // value or range
  tags?: string[];                                      // "melee", "area", "fire"
  sources?: Array<{ kind: 'drop' | 'craft' | 'chest' | 'boss'; ref: string; chancePct?: number }>;
  unlock?: { level?: number; chapter?: number };
  links?: Array<{ kind: CodexEntryKind; id: string; rel: 'drops' | 'used-in' | 'upgrades-to' }>;
}

interface CodexFormula {
  id: string;            // "dps", "stat-stack", "boss-power"
  label: string;
  expression: string;    // human-readable, generated from config constants
  inputs: Array<{ key: string; min: number; max: number; default: number }>;
}

interface CodexOddsTable {
  source: string;        // chest or forge id
  rows: Array<{ outcome: string; pct: number; displayRounded: boolean }>;
}
```

UI: search box, kind filter chips, entry detail with "drops from / used in" links, an Odds panel and a small formula calculator (sliders that call the same pure functions as the game). Seen on the source site and worth copying as UX pattern (not code): filters, sortable tables, "show all" loading, shareable URLs.
