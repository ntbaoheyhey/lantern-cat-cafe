# Four separate self-review passes

These are four sequential reviews by the primary agent, using the delivered screens, rule outcomes and recorded simulations. Human playtesting remains an open validation step. Scores use a ten-point scale.

## First-time player — 8.3

The route, explicit skill costs and three tutorial prompts give a workable start. First invitation, first-equipment navigation, one hub next-step hint and manual save instructions are visible.

Five weaknesses observed were a saved battle reopening behind an absent scene, leaving a battle retaining its active overlay, the first equip step lacking an action, compact skill/status text at 1024, and requiring manual export in the offline file. The first three now have fixes and regression coverage. Keyboard-expandable status explanations help the fourth. Manual export follows the requested offline constraint. A measured three-minute human onboarding session remains pending.

REFERENCE: apps/web/src/game/cardrpg/depth/model.test.ts; packages/game-rules/src/cardrpg/depth/run.test.ts; reports/cardrpg-depth/browser/app-check.json; reports/cardrpg-depth/path/1024-tutorial.png; reports/cardrpg-depth/path/1024-save.png.

## Skeptical three-minute UniHack judge — 7.8

| Criterion | Self-assessment |
| --- | --- |
| Technical / 25 | 23 |
| Avalanche Integration / 25 | 14 |
| Creativity / 15 | 13 |
| Impact / 15 | 11 |
| Pitch / 10 | 8 |
| UI/UX and demo / 10 | 9 |
| Total / 100 | 78 |

Five weaknesses are fixture-only main-game receipts, wallet ownership exercised through a mocked provider, local supply counters, an inherited abstract stage vocabulary, and a large embedded artifact. Public Fuji bytecode and attribute reads now supply actual chain evidence, and zero-balance handling was corrected from those observations. The demo exposes review shortcuts and a census. End-to-end connected-wallet ownership and authoritative effort issuance remain future user-authorized integration work.

REFERENCE: reports/cardrpg-depth/validation/fuji-read.json; reports/cardrpg-depth/validation/fuji-attributes.json; apps/web/src/game/cardrpg/depth/relic-reader.test.ts; reports/cardrpg-depth/path/1280-relics.png; docs/cardrpg2/build.json.

## Long-term collector — 8.0

Day 8 retains many missing cats and equipment pieces. By day 30 the regular cohort owns 73.89% of cats and 66.95% of gear templates. Day 45 remains below saturation across all 30 regular accounts. Stars, fourth-skill unlocks, awakening, sets and deterministic tailoring add goals beyond invitations.

Five weaknesses are a fish-point bottleneck, idle mastery-material balances, a limited twelve-cat ceiling, sparse event writing, and reliance on behavioral simulation. Essence previously exceeded the heavy/casual ratio requirement and now has a lower cap. Legendary tailoring now consumes seals to give them a repeatable sink. The remaining balances and limits are reported rather than hidden by total-wealth averages.

REFERENCE: reports/cardrpg-depth/sim/economy-before-cap.json; reports/cardrpg-depth/sim/economy-45.json; packages/game-rules/src/cardrpg/depth/equipment.ts; packages/game-rules/src/cardrpg/depth/run.ts.

## Game-design director — 7.9

The roster has twelve mechanically distinct kits, meaningful targeting rules, shared energy, interruption and build-triggered bonuses. Every cat skill resolves through legal commands, and scripted tests cover status lifecycle and every enemy. Held-out full runs show substantial policy separation.

Five weaknesses are the deterministic smart policy's perfect chapter 2–3 win rate, a wide skill-use spread, only four skills per cat, correlated roster-team measurements, and a small set of event/map structures. The terminal-value policy was corrected after an earlier evaluator preferred safe stalled outcomes over victory. First-death evidence now records encounter results before settlement clears the battle. The expanded boss sample covers all 220 three-cat teams in 5,280 encounters and records 247,256 party actions. Every role appears among first deaths. Team-context win rates range from 83.71% for Sorrel to 99.85% for Mallow. Skills with at least 30 legal offers range from 5.37% to 86.25% conditional selection. The revive ultimate has only 80 legal offers, so its high rate has a different interpretation from ordinary attacks. Four shared omitted-skill patterns sample a subset of mixed loadouts. Further counterfactual loadouts and human balancing are required for the 8.5 target.

REFERENCE: reports/cardrpg-depth/sim/combat-heldout.json; reports/cardrpg-depth/sim/combat-terminal-policy.json; reports/cardrpg-depth/sim/combat-final.json; reports/cardrpg-depth/sim/roster-broad.json; packages/game-rules/src/cardrpg/depth/skills.test.ts.

## Target outcome

All four perspectives improve on the earlier pass. The requested 8.5 threshold remains PARTIAL. The most consequential remaining work concerns build balance, live idle-to-wallet integration and long-horizon human retention evidence.
