# Taskbar Hero — six-card UI report

| Card | PR | Self-graded (fresh pass) | Merged commit | Live state |
| --- | --- | --- | --- | --- |
| CXR2 | [#261](https://github.com/ntbaoheyhey/taskbar-hero/pull/261) | A96 / B96 · self-graded (fresh pass) | 340f88b | Main340f88b · live accepted; SYSTEM independently confirmed |
| ART2 | [#262](https://github.com/ntbaoheyhey/taskbar-hero/pull/262) | A96 / B96 · self-graded (fresh pass) | — | Draft; backend health hold; feature flag OFF |
| MOTION | [#263](https://github.com/ntbaoheyhey/taskbar-hero/pull/263) | A95 / B95 · self-graded (fresh pass) | — | Draft; SYSTEM health hold; not live |
| PREVIEWS | [#264](https://github.com/ntbaoheyhey/taskbar-hero/pull/264) | A95 / B95 · self-graded (fresh pass) | — | Draft; SYSTEM health hold; feature flag OFF |
| FIRSTPLAY | [#265](https://github.com/ntbaoheyhey/taskbar-hero/pull/265) | A95 / B95 · self-graded (fresh pass) | — | Draft; SYSTEM health hold; not live |
| GALLERY | [#266](https://github.com/ntbaoheyhey/taskbar-hero/pull/266) | A95 / B95 · self-graded (fresh pass) | — | Draft; offline gallery ready; SYSTEM health hold; not live |

The gallery indexes 624 captures at 1280×720 and 1600×900, with native-size links, screen/state filters and four playable local motion recordings. Original captures and before-repair evidence remain intact.

Across 12 fresh local guest runs, Home appears in 0.90–1.47 seconds and the first natural reward in 30.42–31.02 seconds. Tests use the real claim interval without seeded saves, manual claims or accelerated clocks. Every measured run has zero blank frames, errors and network writes; reward text passes 4.5:1 contrast.

Four isolated motion samples measure 60.002–60.002 fps, p95 ≤ 16.8ms and CLS 0. Reduced motion reaches the same final state instantly. Stage recordings are local samples, not funded mints.

Release blocker: SYSTEM retained an auth-nonce HTTP502 health hold and was stopped by the user. ART2 and later cards remain drafts and must be refreshed and released in stack order only after the owner explicitly clears that hold. The optional owner step is recorded in reports/OPTIONAL-USER-STEPS.md on ai/codex-ui-ledger. No backend deployment, migration or live write was performed.

The authoritative rune/companion/skill ownership selector remains absent. Conditional previews use only the existing default-OFF flag and label every entry Sample/Unavailable, without ownership or persistence writes.

Superseded drafts [#257](https://github.com/ntbaoheyhey/taskbar-hero/pull/257) and [#252](https://github.com/ntbaoheyhey/taskbar-hero/pull/252) remain open untouched and must not be merged.

Review: [local gallery](/Users/bao/taskbar-hero-ui-gallery/reports/ui/gallery.html), [one-page card index](/Users/bao/taskbar-hero-ui-gallery/reports/ui/cards/index.html), [static repo demo](/Users/bao/taskbar-hero-ui-gallery/docs/ui/demo/index.html), [gallery source](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-gallery/reports/ui/gallery.html), [capture hashes and raw measurements](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-gallery/reports/ui/gallery-manifest.json). Exact-head fresh grades, failure history, scope and release receipts are maintained on [ai/codex-ui-ledger](https://github.com/ntbaoheyhey/taskbar-hero/tree/ai/codex-ui-ledger/reports/ui).

GALLERY exact-head acceptance: `f2a05881fe0d6235d1eeaa57c7d9a155f2445280`, self-graded (fresh pass) A95/B95. Each reviewer passes all 14 product-gate commands plus five artifact stages, 12 repeated product cases per size, nine standalone cases per size, 20/20 resize executions, 18 strict audit views and 28 pinned axe scans with zero confirmed violations. Generation leaves a clean tracked tree; all 624 capture hashes match. Scope has 819 cumulative owned paths, append-only art provenance and all 1,141 original image blobs unchanged. Clean B ran tests before diff/native visual review. [Grade A](cards/GALLERY/grade-a.json), [grade B](cards/GALLERY/grade-b.json), [report](cards/GALLERY/REPORT.md).

No full matrix was repeated for the documentation-only gallery: app source/tests, tools and dependency trees exactly equal accepted FIRSTPLAY `7d0d08e`, whose full suite passed 388 cases per size once. The frozen gallery links this separate ledger receipt for its own final PR/grade, so acceptance does not mutate the reviewed artifact.

Additional hosted-preview limitation: GitHub Vercel bot comments on draft PRs #262–#265 report `api-deployments-free-per-day` (more than 100 deployments). No successful preview is claimed; no manual deploy/retry or provider-setting change was attempted. After explicit SYSTEM health-hold clearance, recheck capacity and refresh/release the draft stack in order #262 → #263 → #264 → #265 → #266 through the merge lock, changed-spec refresh, fresh-main acceptance and live hash checks.

No gallery gate processes remain active. The existing UI heartbeat was not changed; SYSTEM stayed stopped, its worktrees were not operated, and no merge lock was acquired. Local UI work is review-ready; production release is parked until the owner clears the recorded hold.
