# CXR2 desktop design and state review

The review covers 1280×720 and 1600×900. It repairs the shared dialogs, incomplete loading/recovery paths, returning-guest navigation, and overflow or misleading capacity displays found in the screen/state matrix. Every original production image and the existing art palette are preserved. Game rules, APIs, contracts, wallets, dependencies and deployment flags are outside this change.

[Browse the complete before/after gallery](cards/CXR2/gallery.html). [Capture manifest, source labels and SHA-256 hashes](cards/CXR2/captures.json). These are local fixtures. Market wallet callbacks and Fuji RPC responses are explicitly simulated; they do not establish a live mint/list/buy journey.

| Severity | Finding | Result |
|---|---|---|
| High | A returning guest with an existing class could reach a blank Class screen through Landing → Play as guest (SYS-UI-007). | Existing guests return to Home; fresh guests choose a class. The two-size regression preserves the entire game snapshot. |
| High | First-class selection navigated away before the save completed and could leave no usable retry path. | The choice stays visible while saving, failure is shown beside it, and successful authoritative state opens Home. |
| High | Initial v2 Help described classic key/forge rules (SYS-UI-003). | V2 advice reads the current shared rule values. Classic advice remains in classic mode. |
| High | Long offline loot pushed the title and controls out of view. | A bounded keyboard-scroll region preserves the title, offline rule and OK button. Home/End are deterministic. |
| Medium | Separate modal handlers could compete for focus, and loot dialogs used pale fallback surfaces. | Shared portal stacking, background isolation and night surfaces; closing a reveal restores usable focus even when its opener is removed. |
| Medium | Loading and failure states were inconsistent across deep links. | All seven main screens expose loading status, a visible retry action, and recovery without page overflow. |
| Medium | Bag counts and empty slots ignored equipped gear although the existing capacity guard counts all owned items. | The headline reports owned capacity, the stored/equipped split stays explicit, and filters do not invent free slots. Full storage is labelled “Bag full”. |
| Medium | Maximum currency values were abbreviated or clipped in the HUD and Recent loot. | Full values wrap without reducing font size. Recent loot has a named keyboard-scroll region and wrapped names. |
| Medium | Very long Relic identifiers/uint256 values could expand the Market table or push Buy out of view. | Cells wrap; the facts region scrolls independently while the action remains reachable. Loading owned listings is explicit. |
| Low | Forge side groups lacked the approved frames; rail and guidance shapes were inconsistent. | Existing token-based frames and square navigation surfaces are applied. |

| Screen/state family | Review coverage at both sizes |
|---|---|
| Landing | Guest entry, original backdrop, initial Help, returning earned guest. It has no independent loading collection or balance/ownership payload to fabricate. |
| Class | Initial cards, saving, failed save, retry and successful entry. |
| Home / Bag / Map / Forge / Market / Hero / Help | Normal, zero/empty, maximum values/longest registered names, full Bag, offline, initial API loading, failed initial load and recovery. |
| Forge | Craft, Salvage and Relic, blocked materials/full storage, confirmation and reveal; normal/reduced motion. |
| Market | Wallet disconnected plus mocked populated, empty, loading, error and maximum bigint cases. Existing wrong-network and transaction guards remain covered by controller tests. |
| On-chain proof | Mocked valid read, partial event failure and unavailable/wrong-chain response. Existing read bounds and cache assertions remain intact. |
| Shared states | Initial Help, offline return, first-clear chest, stack isolation, keyboard trap, focus return and reduced motion. |

Selected comparisons:

| State | Before | After |
|---|---|---|
| First Help, 1280 | [Classic advice in v2](../../screenshots/ui/2026-11-03/cxr2-before-final/first-help-1280.png) | [Current v2 advice](../../screenshots/ui/2026-11-03/cxr2-preflight-final/help-1280-reduce.png) |
| Offline loot, 1280 | [Heading pushed offscreen](../../screenshots/ui/2026-11-03/cxr2-before-final/welcome-1280.png) | [Pinned heading and action](../../screenshots/ui/2026-11-03/cxr2-preflight-final/welcome-1280-reduce.png) |
| Boss chest, 1600 | [Legacy pale surface](../../screenshots/ui/2026-11-03/cxr2-before-final/chest-1600.png) | [Shared night dialog](../../screenshots/ui/2026-11-03/cxr2-preflight-final/chest-1600-reduce.png) |

Additional inspected states: [class save error](../../screenshots/ui/2026-11-03/cxr2-preflight-final/class-save-error-1280.png), [full Bag](../../screenshots/ui/2026-11-03/cxr2-preflight-final/bag-full-bag-1280.png), [maximum Home values](../../screenshots/ui/2026-11-03/cxr2-preflight-final/home-maximum-long-1280.png), [maximum Relic values](../../screenshots/ui/2026-11-03/cxr2-preflight-final/market-fixture-maximum-long-1280.png), [returning guest](../../screenshots/ui/2026-11-03/cxr2-preflight-final/returning-guest-home-1280.png).

Mobile-only redesign is WONTFIX for this desktop-only product scope. Existing compact and classic tests remain in the regression gate; no failures are skipped, quarantined, or given lower thresholds.

The migrated portal queries now check the actual dialog, while background controls must be both inert and hidden from assistive technology. Fixtures that intend an existing visit explicitly reset the Help store from their seeded storage. No test timeout was raised. Earlier builder failures are retained in the UI ledger. The formal fresh A/B grades, five-repeat resize rate, locked merge checks and main/live acceptance are tracked in [the CXR2 evidence directory](https://github.com/ntbaoheyhey/taskbar-hero/tree/ai/codex-ui-ledger/reports/ui/cards/CXR2).
