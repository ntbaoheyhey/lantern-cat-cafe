# Taskbar Hero — integrated candidate and historical UI report

| Card | PR | Self-graded (fresh pass) | Merged commit | Live state |
| --- | --- | --- | --- | --- |
| STACK | [#271](https://github.com/ntbaoheyhey/taskbar-hero/pull/271) | A95 / B95 · self-graded (fresh pass) | — | LOCAL CANDIDATE, not live; 262–266 +268+269+271; samples/fixtures labelled |
| CXR2 | [#261](https://github.com/ntbaoheyhey/taskbar-hero/pull/261) | A96 / B96 · self-graded (fresh pass) | 340f88b | Historical individual-head evidence. Main340f88b · live accepted; SYSTEM independently confirmed |
| ART2 | [#262](https://github.com/ntbaoheyhey/taskbar-hero/pull/262) | A96 / B96 · self-graded (fresh pass) | — | Historical individual-head evidence. Draft; deployment-capacity hold; feature flag OFF |
| MOTION | [#263](https://github.com/ntbaoheyhey/taskbar-hero/pull/263) | A95 / B95 · self-graded (fresh pass) | — | Historical individual-head evidence. Draft; deployment-capacity hold; not live |
| PREVIEWS | [#264](https://github.com/ntbaoheyhey/taskbar-hero/pull/264) | A95 / B95 · self-graded (fresh pass) | — | Historical individual-head evidence. Draft; deployment-capacity hold; feature flag OFF |
| FIRSTPLAY | [#265](https://github.com/ntbaoheyhey/taskbar-hero/pull/265) | A95 / B95 · self-graded (fresh pass) | — | Historical individual-head evidence. Draft; deployment-capacity hold; not live |
| GALLERY | [#266](https://github.com/ntbaoheyhey/taskbar-hero/pull/266) | A95 / B95 · self-graded (fresh pass) | — | Historical individual-head evidence. Static local review; deployment-capacity hold; not live |

The gallery indexes 910 captures at 1280×720 and 1600×900, with native-size links, screen/state filters and four playable local motion recordings. Original captures and before-repair evidence remain intact.

Across 16 fresh local guest runs, Home appears in 0.86–1.57 seconds and the first natural reward in 30.41–31.08 seconds. Tests use the real claim interval without seeded saves, manual claims or accelerated clocks. Every measured run has zero blank frames, errors and network writes; reward text passes 4.5:1 contrast.

Four isolated motion samples measure 60.001–60.004 fps, p95 ≤ 16.7ms and CLS 0. Reduced motion reaches the same final state instantly. Stage recordings are local samples, not funded mints.

Release blocker: Vercel reported more than 100 deployments on 2026-11-03 UTC. The nonce health hold cleared after two HTTP 200 responses 628.63 seconds apart on 2026-11-04 Vietnam time; no backend deployment or migration was performed. Main/live remains 340f88b. ART2 and later cards remain parked drafts under the deployment-capacity rule. Next planned capacity check: 2026-11-04T21:00Z, only if still running; no guaranteed reset and no scheduled retry. The overnight report and optional owner steps are on ai/codex-ui-ledger. The STACK measurements belong to integrated product head1eefc3e. Other card grades belong to their historical individual heads. Neither is a final live acceptance.

The authoritative rune/companion/skill ownership selector remains absent. Conditional previews use only the existing default-OFF flag and label every entry Sample/Unavailable, without ownership or persistence writes.

Superseded drafts [#257](https://github.com/ntbaoheyhey/taskbar-hero/pull/257) and [#252](https://github.com/ntbaoheyhey/taskbar-hero/pull/252) remain open untouched and must not be merged.

Review: [gallery](gallery.html), [one-page card index](cards/index.html), [static repo demo](../../docs/ui/demo/index.html), [capture hashes and raw measurements](gallery-manifest.json). Exact-head fresh grades, failure history, scope and release receipts are maintained on [ai/codex-ui-ledger](https://github.com/ntbaoheyhey/taskbar-hero/tree/ai/codex-ui-ledger/reports/ui).
