# SINGLE2 U5 — final integration mocked-state audit

Exact head: `d31cb2a3961e49fea4aab7ebbef216dc4277cda2`. **14/14 PASS**, two desktop sizes. This is local candidate evidence, not a deployed-build or funded-wallet claim.

The browser uses the exact integration source, fresh isolated Vite builds with no env file, a synthetic injected provider and synthetic session. Every function call is intercepted on loopback. No signature, transaction, auth-verify request or live mutation occurs.

| State | 1280×720 | 1600×900 | Verified behavior |
| --- | --- | --- | --- |
| nonce-503 | PASS | PASS | Persistent for5.5s; dismissible; retry remains; one nonce request; no verification |
| expired | PASS | PASS | Expiry explained; session cleared; Enter/Escape/Cancel preserve focus |
| wrong-network | PASS | PASS | Network message and action remain visible on Home |
| connected-hud | PASS | PASS | Connected Power/Live rectangles do not overlap |
| connected-unsigned | PASS | PASS | Connected Power/Live rectangles do not overlap |
| offline | PASS | PASS | Offline status visible; guest remains painted |
| api-503 | PASS | PASS | API503 explanation and Retry visible |

All cases have zero document overflow and zero product console/page errors. Intentionally injected HTTP401/503 resource diagnostics are preserved separately in the JSON; they are not application errors. Both signed-in and connected-but-unsigned HUD variants are exercised.

The initial harness run incorrectly checked for Connect wallet before asynchronous rendering, then required the unsigned address selector in a signed-in case. The second run measured a display:contents wrapper, which has no box. Those harness failures are retained in harness-r1/ and harness-r2/. The corrected run waits for connection UI, checks the correct signed/unsigned badge and measures the painted Power chip. No product code or assertion threshold was changed.

Visual review: persistent nonce notification and dismiss button, expiry explanation/focus, wrong-network switch, connected HUD wrap, offline status and API retry stay readable and inside the viewport. Native screenshots are in [final](final/); full [machine receipt](final/audit.json).

Command: `node reports/ui/single2-stack-audit.mjs /Users/bao/taskbar-hero-single2 <fresh-output-directory>` from the ledger; harness and exact source head are recorded.
