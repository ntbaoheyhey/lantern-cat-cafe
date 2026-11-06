# Decisions and tradeoffs

Decision date: 2026-11-05 UTC. Base: `3bf2cfa3bd32d8355c5c967e979240330a595682`. The user's no-limits update removes clock/retry/token/PR/demo-size ceilings; checkpoint content order and all safety/ownership boundaries remain. Only Session A writes the rules/design/sim paths. No subagents or extra model-calling helpers.

| Decision | Rationale | Evidence / tradeoff |
| --- | --- | --- |
| Preserve numbered rounds | Each living eligible actor acts once; readable tactics over frequency racing | `battle.test.ts`, existing `squad/turn/rounds.ts`; active-control effects reorder only pending actors |
| Four existing rarities | Keep stable language and pinned Relic IDs | `content.ts`, contract metadata tests; no mythic relabeling |
| Four slots, 2/4 sets | Enough build choices without multiplying housekeeping | `rules.test.ts` equip/set cases; no extra helm/boots grind |
| Three roles, twelve collectible variants | Start with complete role coverage and honest existing kit reuse | catalog test; new independent skill kits explicitly later |
| No energy gating | Let the player practise; cap economic output instead | service/XP/draw tests, 30-day simulations |
| Fixed main/affix templates, chosen reforge | Transparent equipment outcomes and complete deterministic set path | equip/enhance/reforge/salvage tests |
| Failure-free +12 | Avoid spending resources and making no progress | monotonic cost/stat property tests; high levels remain a long-term sink |
| 150 earned stamps per draw | Initial 100-cost trial collected the small roster too quickly | preserve `economy-initial.json`; tuned cohort and odds data; no runtime purchase path |
| Shared currency/XP caps | Heavy activity should not multiply weekly progress beyond 3× casual | 30-day cohort output; caps apply to repeatable grants, one-time rewards separately |
| Thread mending and epic tailoring | Initial spending left large thread and essence balances without chosen repeatable uses | `rules.test.ts` loop losses; tuned spending simulation |
| Full reward preview | Player must see exactly what is received, including first-clear and caps | regression tests compare preview and settlement and input immutability |
| Frozen item/card identity in combat | B must render the actual equipped loadout | identity/replay regression tests; B #4 answered in A #5 |
| Packed supplies spent on entry | Prevent abandon/restart from duplicating extra inventory | five-supply replay test; base expedition supplies are a separate finite run budget |
| No paid/tradeable draws | Reduce legal/contest risk structurally | `GachaResult` binding fields, no purchase command, odds/pity/property tests |
| Deterministic design claims only | Separate collectible issuance from random acquisition | cap-edge/effort/duplicate tests; no actual mint |
| Global and seasonal caps | Bound edition issuance across seasons | local proofs only; no claim of on-chain enforcement |
| Existing NFT contract untouched | No deployment or server authority in this task | diff ownership audit; source contract lacks supply cap and burn support |
| Feature flags remain B-owned and default off | Preserve existing app behavior | B integration screenshot/import/isolation gates; A does not edit shell |
| Chapter 2/3 data only | Design requested, but artwork/new mechanics and balance need their own production pass | `implemented:false` and startBattle rejection tests; no false playable claim |

## Review criteria and freeze

C0: verified base and research outline exchanged. C1: early versioned contract and seven fixtures. C2: full actions, evidence-backed economy/combat results and B consumption. C3: freeze only after open rule issues are resolved, then B integrates. C4: ledger reports and combined summary. The phases can overlap to unblock B, but none is considered complete only because a clock elapsed.

Four separate self-reviews must cover first-time player, skeptical three-minute contest judge, long-term collector and economy director. They are the same primary agent taking different perspectives, not independent human approval. Scores, five weakest points, fixes and residual limits belong in FRESH-EYES.md. Any UI-only issue is requested through the sync channel, never edited by A.

No runtime dependency added. Existing TypeScript, Vitest, fast-check and Vite run headless tools. The JSON fixtures are generated from typed rules; the battle reward fixture comes from a real completed run. CLI simulations do not call a model.

## Depth pass, 2026-11-06

| Decision | Reason | Verification |
| --- | --- | --- |
| Additive 0.5.0 depth contract enclosing the existing 0.4.0 account | Existing callers and identifiers keep their own schema while the new battle/run boundary can migrate independently | `cardrpg/depth/contract.ts`, migration tests in depth mode |
| Three equipped skills from each cat's four-skill kit | Reuses the approved rune proposal's pre-combat loadout choice and explicit unlocks. Two basics and a signature are available immediately. Level 6 or three stars unlocks the ultimate, which replaces one equipped skill | `cardrpg/depth/catalog.ts`, loadout and battle tests |
| Shared five energy per numbered round, individual ultimate charge | Makes support, control and damage compete for a visible resource. Defend and Pour energy each consume the actor's one turn | `cardrpg/depth/battle.test.ts` |
| Five-flavour cycle adds one break pressure | The exact consequence fits one sentence and works with enemy intent counterplay | `cardrpg/depth/catalog.test.ts` |
| Keep the inherited cafe shell and TurnScene | Layout, sockets, context disposal and existing animations already have measured coverage. Optional model IDs load only when the depth entry supplies them | `turn3d/assets.ts`, `turn3d/scene.ts` and new runtime captures |
| Original transform-node silhouettes | Each cat has individually authored body/head/ear/tail proportions, costume geometry and motion rhythm. Later art review must judge identity beyond file hash distinctness | `assets/provenance/cardrpg-depth-models.json`, portrait captures |

REFERENCE: packages/game-rules/src/cardrpg/depth/; docs/proposals/rune-skill-system/demo/index.html; tools/cardrpg-depth/models.mjs; assets/provenance/cardrpg-depth-portraits.json.
