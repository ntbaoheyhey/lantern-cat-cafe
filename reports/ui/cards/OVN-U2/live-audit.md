# Overnight live UX audit

Site: https://taskbarhero-eight.vercel.app. Live main remains `340f88b`. Audit: 2026-11-03 UTC / 2026-11-04 Vietnam time. Isolated Chromium profiles at 1280×720 and 1600×900; returning profiles reuse only their own guest storage. Production assets were read; no real wallet, signature, transaction or gameplay write was made. Error and expired-session cases use browser-local synthetic sessions and intercept all Supabase function calls before the network.

| Check | 1280×720 | 1600×900 | Evidence |
| --- | --- | --- | --- |
| Landing → class → Home | 0.362 s | 0.355 s | `live-r2/audit.json` |
| First natural reward, real clock | 29.488 s | 29.957 s | Both meet ≤36 s; no seeded save or manual claim |
| Home, Bag, Map, Forge, Market, Hero, Help | Pass | Pass | Native screenshots in `live-r2/` |
| Forge Craft, Salvage, Relic | Pass | Pass | Same directory, `forge-*` |
| Chain proof, read-only RPC | Pass | Pass | `chain-proof-*`; no ownership/transaction claim |
| Saved guest Hero → Landing → guest → Home | Pass | Pass | `returning-guest-*` |
| Offline state | Visible | Visible | `offline-*` |
| Synthetic API 503 | Explanation + Retry | Explanation + Retry | `live-edge-r2/api-error-*` |
| Synthetic expired session 401 | Session cleared, explanation missing | Same | `live-edge-r2/expired-*` |
| Wrong network, Landing and Home | Text + Switch to Fuji | Same | `live-edge-r2/` and `live-wrong-network-home/` |
| Document overflow | None | None | Raw per-screen geometry |
| Product console/page errors in normal journey | None | None | Classified separately from injected axe errors |

## Defects

| ID | Severity | Defect | Screenshot | Disposition |
| --- | --- | --- | --- | --- |
| OVN-U2-01 | Medium | 401 returns to guest/class selection without explaining session expiry | [1280](live-edge-r2/expired-1280.png), [1600](live-edge-r2/expired-1600.png) | UI fix `993bfc4`, fresh A/B in progress; reuses existing status Banner and preserves guest save. Not live. |
| OVN-U2-02 | Medium | Stage canvas container has a prohibited aria-label without a semantic role | [1280](live-r2/first-reward-1280.png), [1600](live-r2/first-reward-1600.png) | Already repaired by accepted held #263 (`4b0e69a`); do not duplicate its change. Still present live. |
| OVN-U2-03 | Medium | First-reward heading contrast fails WCAG AA | Same first-reward screenshots | Already repaired by accepted held #263; original threshold retained. Still present live. |
| OVN-SYS-01 | Medium | Mocked nonce 502 produces raw wallet error/notification overlap in the old live wallet UI | See SYS browser evidence | SYS hardening `95d9c32` uses a persistent dismissible notification and plain-language guest explanation; exact-head A/B in progress. Not live. |

No other high/medium defect was confirmed by the audited paths. This is a bounded browser review, not a funded on-chain rehearsal or production sign-in acceptance. Deployment capacity blocks all releases, independently of the cleared nonce health hold.

## Evidence classification

Raw audit observations are preserved. `live-r2/classification-review.json` corrects the first tool's HTTP-POST-as-write classification: `eth_getBlockByNumber`, alongside the other recorded `eth_*` reads, does not write state. No request parameters, credentials or signatures were retained. The injected axe tool attempts a Google Fonts stylesheet fetch forbidden by the existing connect-src CSP; this is an audit-tool error recorded in the axe phase, while ordinary product interaction had zero console errors. No CSP was changed. Mocked 401/503 resource messages are expected injected transport failures and remain in raw edge evidence; they are not hidden product exceptions. The two confirmed axe findings above remain failures until #263 ships.

The live asset entrypoints are recorded in `live-r2/audit.json`, including `index-Ccs5evFH.js` and `index-jL_b_lsJ.css`. No deployment was attempted and no newer live build is claimed.
