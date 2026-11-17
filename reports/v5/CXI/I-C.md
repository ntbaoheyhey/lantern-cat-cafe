# Desktop evidence — v5-m1.7
Application build: 0a3c6ab1a92834c079518903fcd454adf43523bf. Capture source: be701d072d3e5d8457360a7bf79639277230b354; it adds reports only. The release tag adds the final evidence.
Judge URL: http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3
Production index SHA256: 2fc8f62365123da073fa54eab0683387a3de421788da0ba6e12fa39ea5c837fd. Desktop 1280×720, fresh browser, cache disabled. Captures 17 November 2026, 16:10–16:13 UTC.

- **First hit passes:** 20,882 ms from cold navigation to visible enemy HP165→119, including 17,700 ms to read 59 words across eight tutorial cards at 200 words/minute. Ordinary guest controls; no fixture, saved progress, skipped tutorial or speed change. Zero console/page/HTTP errors.
- **Practice route passes:** detour → return to preparation → receipt in 9,684 ms, zero errors. This quick regression omits the reading allowance; use the first-hit result for judge timing.
- **Recovery passes:** an injected rejected download shows usable recovery in 637 ms; a stalled download in 8,696 ms. Both buttons fit the viewport and return to café; explicit reload restores the route. These injected failures do not establish the cause of AGS's reported stall.
- **Cold bytes remain open:** wave1 7,909,547 B passes; wave3 8,469,958 B fails; boss 7,984,401 B passes against 8,000,000 B. Wave3 needs 469,958 B more saving. Boss has only 15,599 B of headroom. The harness waits for the café to mount before selecting fixtures and counts complete responses for all requests begun before readiness.
- **Validation:** typecheck and full suite pass on69e68a660: 5,250 tests =77 Node +5,173 workspace, including2,950 web;11 skipped and2 expected failures. The subsequent runtime change is only three placement values from f34877866;18 focused layout/motion/Yarn/arrival tests and the production build pass at0a3c6ab1a. Final transfer, first-hit, route, recovery and films all exit0.
- **Visual review:**20 GPU blink drawings preserve open pixels and alpha;K4 stays unchanged and closed RGB changes remain inside eye bounds. CloverK5 iris pixels fall62→0; six green clothing pixels remain unchanged. The initial sheet interpretation was mistaken. Portrait checks cover26 samples across four cases with zero solid/fringe overlap. See[I-A-BLINK.md](I-A-BLINK.md).
- **Avalanche:** the local receipt says no transaction was sent and links the deployed Fuji items contract. Registry bytecode checks and the Anvil dry run do not prove a public player transaction.

[Reproducible evidence](evidence/v7-m17-final-validation.json). Four fresh guest/recovery sheets were measured at1024×576 then inspected once. The three fresh film sheets were also inspected once. Damage46 is visible, receipt wording is truthful and recovery buttons fit. Wave3 remains visually crowded; sampled frames do not establish every effect interval.

Three30-second films show real1× gameplay and actual browser audio. [Review and films](REVIEW-VI.md). Subjective listening quality and frame-exact A/V synchronization are not established. Historical66–70-second measurements timed the complete patrol receipt, not first hit.
