# Read-only Compendium adapter

The adapter in [codex](../packages/game-rules/src/v2/codex/index.ts) reads the current game registries. It does not change gameplay, draw randomness, access player state, call a server or import the rune demo. It builds snapshots on demand; importing the package does not build a Compendium.

```ts
import { v2 } from '@taskbar-hero/game-rules';
const entries = v2.toCompendiumEntries();
const odds = v2.chestOdds('chest.ch1.repeat');
const all = v2.compendiumData(); // { entries, chestOdds: Record<chestId, ChestOdds> }
const related = entries.find(entry => entry.id === entries[0]?.links[0]?.id);
```

Snapshots are detached and deeply frozen, including nested stats, arrays and source/link records. The discriminated `CompendiumEntry` union narrows `stats` by `kind`. The exported entry types describe classes, regular/elite monsters, bosses, gear, materials, recipes, Relics and chapters. Elites remain `monster` entries with an `elite` tag; bosses are separate entries. No enemy appears twice.

## IDs, names and sources

Existing registry IDs are preserved globally; Relics use `relic:<pinned token ID>` because the tier registry shares rarity words with gear. There are currently 209 entries: 7 classes, 20 monsters, 5 bosses, 155 gear, 7 materials, 6 recipes and 4 Relics, plus 5 chapters. Tests pin these counts and full registry membership. No demo names or stats are included.

Names remain the existing names. Recipes have no display name in [recipes.ts](../packages/game-rules/src/v2/content/recipes.ts), so their name is their existing ID. Four Relic names are projected from [existing metadata](../apps/web/public/relics/1.json) into [relic-metadata.ts](../packages/game-rules/src/v2/codex/relic-metadata.ts); tests check every name against the corresponding JSON. This avoids a rules-to-web JSON import in Deno. Update that small projection if existing metadata is renamed; do not generate new content here.

Each entry has `summary`, `iconKey`, `rarity`, `stats`, `tags`, `sources`, `unlock`, `links` and `missingFacts`. Null means a fact is absent, inapplicable or context-dependent, as explained by its note. Material tiers are not converted into gear rarities. Null unlock does not promise unconditional availability.

Source reference resolution:

| Source kind | `ref` resolves to | Probability meaning |
| --- | --- | --- |
| registry / rule | Repository-relative file, then exported symbol after `#` | Null: provenance or a context-dependent formula |
| metadata | Existing repository-relative JSON file | Null: presentation provenance |
| chest | Key in CHESTS and in the exported chest-odds map | Materials: chance of at least one from the table. Gear: null because a particular item needs player context. Boss/chapter: reward table reference, not acquisition of the boss/chapter. |
| recipe | Compendium recipe ID | Relic: conditional on an allowed forge. Gear: null, because the player chooses slot/class. |
| monster | Compendium monster ID | Null; note gives the actual material probability formula and its player-dependent multiplier |
| starter | Compendium class ID | Null; starter assignment is a state transition, not a drop trial |

Links always carry the target's real `kind` and ID. Relationships are bidirectional: starter/class weapons, chapter encounters and gear pools, recipe costs and outputs, material chest chapters and monster sources, salvage returns. Chapter and boss source records expose both chest IDs for navigation to the odds panel. Chapter gear pools reflect catalog eligibility; rarity chance and player slot availability still constrain actual drops.

Icon keys are renderer inputs, not file URLs: class IDs, monster IDs, item IDs, material IDs, chapter background IDs and `relic:<token ID>`. Dispatch them through the existing class/monster/item/material/background/Relic renderer. Recipes have null keys. No new art or guarantee of a dedicated icon file is implied.

## Exact chest odds

[odds.ts](../packages/game-rules/src/v2/codex/odds.ts) derives all ten chapter chest variants from the current CHESTS weights and chance gates. Values are analytic, unrounded JavaScript numbers, subject only to IEEE-754 precision. Original weights and their total are included so a client can also display the ratio.

For a gear roll with chance `c`, rarity weight `w` and total `W`:

- `conditional.probability = w / W`: rarity distribution given that this roll awards gear. Its five rarity rows sum to 100%.
- `perChest.probability = c * w / W`: chance this roll awards that rarity per opened chest. Its rows plus `noDrop` sum to 100%.
- Each probability has `chancePct = probability * 100` and `oneIn = 1 / probability`. Impossible outcomes explicitly have 0%, probability 0 and `oneIn: null`; render “Impossible” instead of “1 in null”.
- `atLeastOne` combines independent main/accessory rolls for each rarity: `1 - product(1 - p)`. Those rows overlap and must not be summed or normalized to 100%.

Chapter 1 first-clear main rarity weights are 0/60/30/9/1. Main gear is guaranteed; accessory gear rolls at 50%. Legendary accessory odds are therefore 0.5%, or 1 in 200. At least one Legendary across both rolls is 1.495%, not 1.5%. Chapter 5 first-clear weights total 92, so its Legendary conditional probability is 9/92, not 9%. All examples are asserted against current registries and the existing analytic loot engine.

The adapter intentionally accepts the current gear grammar: one nested gear table and one draw behind each independent chest chance gate. It throws for unknown tables, malformed weights, cycles, multi-draw gear lines or newly mixed/nested reward shapes. If gameplay changes that grammar, extend the adapter and tests before publishing odds; expected item counts must never masquerade as probabilities. Fish/material counts do not affect the independent gear rolls.

## Facts that require context or are absent

- Class HP/ATK/DEF are multipliers. Monster stats are archetype multipliers; absolute values require a stage. Boss values use the existing chapter-end helper including config overrides.
- Gear base stats are before rarity and level scaling. Bonus line count and maximum level are exposed; individual rolled bonus values are not invented.
- Per-item loot odds depend on player class, level, slot availability and candidate pools. Rarity odds are not item odds. Chest eligibility uses catalog chapter membership; current registries always have local candidates.
- Monster material chances depend on `lootMul` and `materialFind`. Yarn accrues and is floored per claim, not a Bernoulli drop. Daily/cleared-chapter keys are capped by inventory. Disabled first-clear key rewards are not advertised as active.
- Gear unlock describes the equipment slot's level requirement, not a claim that an item has been acquired. Chapter unlock references the previous boss; actual fight eligibility still depends on progress, keys, cooldown and daily attempts.
- Recipes have no display names or icons. The Relic recipe defines no fish field; it is null here. Gear recipes define no daily cap field; it is null here.
- Relic tiers have pinned token IDs and forge odds, but no combat stats in their registry. The four Relic tiers never gain an invented Uncommon tier.
- Source summaries describe code, not live deployment state. Existing first-party content is reused; no third-party or demo content is copied.

## Offline generation and verification

From a checkout installed with pnpm 10.28.0:

```sh
node scripts/gen-codex-json.mjs > /dev/null
node scripts/gen-codex-json.mjs --out /path/to/scratch/compendium.json
pnpm --filter @taskbar-hero/game-rules test src/v2/codex
```

The CLI works from another working directory when invoked by absolute path. It uses the locked TypeScript compiler and Node standard library, loads only local rules modules in memory, creates no build output and needs no network, environment secrets or backend. Tests block Node networking, parse output, compare stdout and file output byte for byte, validate source symbols/metadata and check error exits. Current pretty JSON exceeds 200 KB; it is generated only in scratch storage and is not committed. No timestamp is included, so unchanged rules produce identical output.

Builder evidence and remaining coordinator gates are in [the CXL1 report](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/cxl1.md). This adapter introduces no UI and does not activate proposed rune, skill, pet or workshop mechanics.
