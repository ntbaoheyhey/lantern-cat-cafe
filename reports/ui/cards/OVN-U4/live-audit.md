# Current-live baseline audit — OVN-U4

Final-stack live acceptance is PARKED until P1 release capacity is available. This fresh November 4 audit reviews the unchanged main/live340f88b baseline, not the held candidates.

## Method and result

Isolated fresh Chromium profiles at1280×720 and1600×900; real clock and natural guest rewards; saved guest state reused in separate profiles. Walked Landing→class→Home, every navigation route, all three Forge modes, Help→public Chain proof and offline. No wallet was connected, no signature requested and no mutating request allowed. The request guard admits only named read-only Fuji RPC methods.

- 1280×720: Home 0.397s; first natural reward 30.158s (target≤36s). Saved-guest return, offline explanation, no mutating requests and no product console/page errors pass. All 15 captured screens have no document overflow.
- 1600×900: Home 0.419s; first natural reward 29.999s (target≤36s). Saved-guest return, offline explanation, no mutating requests and no product console/page errors pass. All 15 captured screens have no document overflow.

## Retained defects

| Defect | Severity | Evidence | Already accepted fix |
| --- | --- | --- | --- |
| Game-stage accessible label on a role that prohibits it (`aria-prohibited-attr`) | Medium | [1280 Home](current-live-r2/first-reward-1280.png), [1600 Home](current-live-r2/first-reward-1600.png), raw axe nodes in audit.json | #263 |
| Recent Finds heading below AA text contrast (`color-contrast`) | Medium | Same Home captures and raw contrast result | #263 |
| Expired-session state lacks an explanation and class-confirm Escape/Cancel focus needs repair | Medium, carried from prior verified audit | [Prior recovery evidence](../OVN-RECOVERY/REPORT.md) | #268 |
| Wallet errors need a persistent dismissible notice; connected compact HUD can overlap Power/Live | Medium, carried from prior verified audit | [Prior wallet evidence](../../../sys/cards/OVN-AUTH/REPORT.md) | #269 |

The known defects are not waived: the corrected audit exits1. No new repair duplicates the accepted candidates. Native Home1280 and Forge1600 captures were visually inspected for spacing, readable typography and contained panels. Other screenshot inspection is recorded in the single-session report.

## Evidence boundaries and harness correction

[Raw corrected audit](current-live-r2/audit.json) retains all axe violations and incompletes. Axe's attempt to fetch the cross-origin Google Fonts stylesheet triggers a CSP console entry during the explicitly labelled axe phase. Normal product journeys have no console/page errors; no CSP policy was changed.

[Initial audit](current-live/audit.json) is retained as failed harness evidence: its guard mistakenly omitted the read-only `eth_getBlockByNumber` method, so that RPC was blocked locally and misclassified as a mutating request. The corrected guard admits this read, still blocks every write method, and reruns the complete route. Initial timings30s remain historical; corrected timings above are authoritative for this session.

Mocked503, expired-session and wrong-network final-stack checks remain pending release. Their previous unchanged-main evidence remains in [OVN-U2](../OVN-U2/live-audit.md); they are not claimed as fresh final-stack passes.
