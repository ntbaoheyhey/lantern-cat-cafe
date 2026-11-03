# CXR2: cross-screen findings and shared dialogs — gate pending

3 November2026. Isolated local draft based on CXR1candidate187a1b5; no main/live acceptance yet. Must incorporate actual main after PR245 before grading. Earlier dirty CXR2 work in the separate clone is preserved in ledger CXR2-FRESH/preserved-old.

| Finding | Disposition | Source/evidence |
|---|---|---|
| Warning AA, page/body tokens | CXR1 raises warning without lowering4.5 threshold; requested page/type tokens | CXR1ed11f01; theme.contrast.test.ts |
| Landing inset/scene and false NFT/private-source claims | Corrected by CXR1; exact public contract links and existing art at integer scale | CXR1ed11f01; merged-redesign.spec.ts |
| Class short centred cards | CXR1 fills first-run desktop frame; actual classes/stats/radio semantics retained | CXR1ed11f01 |
| Home three columns/unused space | CXR1 stage+log left, one320px sidebar; actual HUD/context reserved, pixel scale integral | CXR1ed11f01/187a1b5 |
| Phone stage and shared-button regression | Repaired source, all original geometry/target thresholds retained | CXR1187a1b5 |
| Bag grid/toolbar/competing actions/compare/fake mint | CXR1 eight fluid columns incl. empties,200capacity, secondary bulk equip, separate comparison and unavailable proof | CXR1ed11f01/187a1b5 |
| Rail frame/footer detail | Square active frame, correct page surface and contrasting Fuji badge in this change | shell.css; cxr2-dialogs.spec.ts |
| Three custom dialogs | HowToPlay/WelcomeBack/ChestReveal now use shared Modal stack | ui/legacy-dialogs.test.tsx; cxr2-dialogs.spec.ts |
| Long offline modal loses heading/rule on focus | Only summary scrolls; header/rule/action stay visible | loot.css; cxr2-dialogs.spec.ts |
| V2 initial Help shows classic economy | StageLayout selects current rule-derived v2 steps; classic remains unchanged | HowToPlay.test.tsx; cxr2-dialogs.spec.ts |
| Extra HUD context row | Retained to keep truthful status/guidance accessible; intentional adaptation, no fake wallet/value | baseline-hud.spec.ts |
| Existing art/classes/values differ from mock placeholders | Preserve authoritative original assets/data, not copied placeholder art or balance | No asset/rule changes |
| Forge/Market redesign absent | PR252 remains PARTIAL after3 rounds; current screens only are regressed, no redesign acceptance | Ledger CXU3-FRESH |
| Timed live demo and wallet transactions | CXQ1 follows this pass; NOT VERIFIED here | No wallet operations or backend writes |

Builder failures and exact repairs remain in ledger CXR2-FRESH. Existing tests were not skipped or weakened: portal-root and controlled-owner query adaptations are documented in [the decision](../../docs/decisions/cxr2-shared-dialogs.md). New tests enforce isolation/stack focus/reward timing, current rule copy, geometry, motion and visible actions. Full gate/fresh grades/bundle budget and live verification remain pending.
