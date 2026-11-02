STATUS: IN-PROGRESS

# CXU4 — Hero, Help and shared UI states

Source d408ada368a05c078dcd97bbd61f4e4b1dbc238b is now published on ai/codex-cxu4, based on main1fb25ed. Its30-file scope is unchanged from the saved implementation; the original untracked reports and media remain preserved. Draft publication is preparation, not a merge or grade.

Hero uses the existing cat art, nine equipment slots, state-derived stats, an additive level/gear/bonus power breakdown, XP and the existing class action. Help keeps the six-topic answer inventory and classic content while adding search and one active answer pane. Typed additional-tab hosts prepare Hero/Help for later cards without adding rail items. Shared UI exports controlled modals, confirmation, toasts, banners, empty states and tabs. Other dialog migrations remain assigned to CXR2. No gameplay, backend, dependency, contract, flag or asset changes.

## Verification and scope

Fresh coordinator checks on the published source d408ada, in an isolated clean checkout: frozen install passed;56focused component/contrast tests across9files passed;19onboarding tests across2files passed. Exact commands, tails and outcomes are in [publication evidence](../cards/CXU4-PUBLISH-R1/REPORT.md). These source tests do not replace complete browser/UI/main/live gates or independent review.

Historical prospective integration b06a68d combined CXU4 with the earlier queue. It passed58focused tests,200browser repeat10 cases, web typecheck and10effects checks at each desktop size. Those results belong to b06a68d, not d408ada. The source-only selection has two fewer contrast cases because the integrated theme test also includes two additional baseline checks for muted text and the XP indicator. The CXU4 Hero/Help/UI source files are byte-identical across these two heads. See [preflight report](../cards/CXU4-PREFLIGHT-R2/REPORT.md) and its exact commands/logs. No old helper was rerun.

| Case | Observed evidence | Remaining requirement |
| --- | --- | --- |
| T1 equipment and power | Source HeroScreen tests pass; historical browser checks on b06a68d | Final integrated browser/gates |
| T2 Help search and preserved strings | Source tests pass against saved baseline oracle, including classic and key-source variants | Final full suite |
| T3 modal focus/Escape/return | Source shared-UI tests pass | Final browser/a11y matrix |
| T4 timed toasts and durable errors | Source shared-UI tests pass | Final rendered-state audit |
| T5 offline failure | Historical b06a68d browser repeat matrix passed | Source/final integrated browser proof |
| T6 UI audit/effects/reference comparison | Historical b06a68d effects10/10per size passed | Current full audit and closed reference diff table |
| T7 original assets | Source diff changes no asset, public art or art manifest | Recheck on final integrated head |
| T8 character/Help/onboarding | Source56focused+19onboarding tests pass | Full suite on actual integrated head |

Round1 preflight3a34e8c failed because a coordinator snapshot omitted the existing Help oracle. The unchanged3809-byte oracle was restored, checked independently against baseline rendering, and included in b06a68d and source d408ada. Original failure logs remain in CXU4-PREFLIGHT-R1; no expected text was regenerated from the new UI and no assertion/retry was loosened.

## Reference differences — still open

References: reports/ui-redesign/index.html Character/Help/States, BRIEF.md/PLAN.md/README.md, and the seven-item shell/manifest/theme. Historical implementation decisions are in docs/decisions/cxu4-hero-help.md on the source branch. Research sources are the user-supplied2026-10-31 archive members sources.csv, pages/wiki__mechanics.json and skill-trees-all-heroes.json, plus https://tbhindex.com/wiki/mechanics as a dated structure reference. Product numbers and text remain from this repository; no third-party content/art was imported.

| Reference area | Implemented scope | Comparison state |
| --- | --- | --- |
| Character | Three-column equipment/cat/stats with real state and class control | OPEN: final two-size visual comparison required |
| Help | Searchable topic list and answer pane; classic unchanged | OPEN: final two-size visual comparison required |
| States | Shared confirmation/toasts/banner/empty state | OPEN: all-state audit and screenshots required |

Tier2 changes connect the Hero host and existing class callback in StageLayout, adapt ActionNotice presentation, update audit selectors/browser tests for new nesting while preserving assertions, add contrast cases and record the decision/index/oracle. Source diff stat is in CXU4-PUBLISH-R1/source-diff-stat.txt. Unrelated shell, authentication, game rules and other dialogs are outside this item.

No score is assigned. Actual-main integration after preceding queued items, full G1–G7, current mutations, independent reviews, merge, deployment identity and live path remain incomplete. The latest user instruction prohibits new subagents/helpers; coordinator checks are not independent grading. No optional user action is required merely to publish this draft.

Branch ai/codex-cxu4; merge NONE; PR pending; report reports/redesign/CXU4.md on the ledger branch; STATUS: IN-PROGRESS.
