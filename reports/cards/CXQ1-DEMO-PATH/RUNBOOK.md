# Recurring three-minute guest judge gate

This is a strict postmerge P0/P1 gate, not a formal grade, full CXQ1, or transaction validation. Run once per viewport after **every** P0/P1 merge and deployment. Any FAIL, BLOCKED, SETUP_ERROR, incomplete viewport, or unverified deployment mapping stops further merges. Do not replace an unavailable stage with a weaker assertion, hash shortcut, injected fixture, saved state, sign-in, wallet connection, transaction, or source-code claim.

## Invocation

From the ledger repository root, use the existing inspection repository's installed Playwright dependency. No package installation or product edits are required. Choose a fresh evidence directory for every merge; never overwrite prior evidence.

```sh
node --check reports/cards/CXQ1-DEMO-PATH/judge-path.mjs
node --check reports/cards/CXQ1-DEMO-PATH/gate-core.mjs
node --check reports/cards/CXQ1-DEMO-PATH/gate.test.mjs
node --test reports/cards/CXQ1-DEMO-PATH/gate.test.mjs
REPO_DEP_PATH=/absolute/repository-with-apps-web-playwright \
BASE_URL=https://taskbarhero-eight.vercel.app/ \
EVIDENCE_DIR=/absolute/new-evidence-directory \
node reports/cards/CXQ1-DEMO-PATH/judge-path.mjs both
```

Optional final argument `1280x720` or `1600x900` supports diagnosis; both are mandatory for a merge gate. Exit 0 means all path assertions passed; exit 1 includes product failure or setup error. Inspect machine-readable status to distinguish them. A controlled fixture test passing is harness evidence only.

The dependency repository's exact head and dirty state are inspection metadata, never the deployed head. The harness records public HTML SHA-256, script asset names, ETag, Vercel request ID, and optional declared commit metadata. Vercel request IDs are not commit identifiers. Coordinator must independently match deployment to the exact merged head using deployment records; an HTML declaration alone is not independent verification. Do not infer live head from local main or branch.

## Ordered assertions and action budget

Each viewport gets a new, unauthenticated browser context, no seeded storage, and at most 180 seconds including navigation and evidence. Navigation is capped at 20 seconds, ordinary assertions/actions at 5 seconds, idle progression at 20 + 15 seconds, and boss result at 20 seconds. These are fixed upper bounds, not sleeps or retries. A wall timer closes the context at the deadline. Both viewport runs can consume at most six minutes of judge actions in total.

| Stage | Required visible outcome |
| --- | --- |
| Landing | Public root shows landing hero and a usable `Play as guest` button. |
| Guest | Actual guest click exposes class picker and visible guest/demo/preview distinction. |
| Class | Choose and confirm Warrior; home dashboard identifies Warrior. |
| Idle loop | Visible chapter/round/kill progress changes and a real reward/progression event appears. An animated canvas or static auto-battle label alone does not pass. |
| Boss | Map/Boss Gate is reachable; Fight is enabled; battle completes with victory; return to exploring works. Locked gate, attempted click, or defeat fails. |
| Forge | Guest crafts ordinary gear through confirmation and sees an actual item result. This is local demo gear, not minting a Relic. |
| Bag | Bag contains selectable gear and shows its item detail. |
| On-chain proof | Visible proof button opens a named proof region identifying Avalanche Fuji testnet, guest preview versus no real transaction, both full exact addresses, and Fuji explorer links for both contracts. |
| Market | Guest can browse visible listings or an explicit empty listing state with Fuji testnet identification. A wallet-required screen is a failure. |

Contract targets: RelicNFT `0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`; RelicMarket `0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`. Contract links/visible disclosure are read-only proof affordances; they are **not** proof of guest mint/list/buy, deployed bytecode verification, or transaction success. Those belong to later full CXQ1.

## Transport and evidence

Only GET/HEAD/OPTIONS and an explicit allowlist of JSON-RPC read methods are allowed. The harness aborts other requests and records a gate failure; it never signs in, connects a wallet, or sends transactions. No auth headers, cookies, request bodies, or query strings are logged. The browser blocks service workers. No local servers or ports are needed for the supplied live baseline.

Every console error, page error, failed request, HTTP 4xx/5xx, or blocked write fails the gate. The first failing stage stops dependent actions and marks remaining stages BLOCKED, retaining all nine outcomes. No silent skips or live retries. On HTTP 429, retain evidence and stop scheduling further probes; coordinator handles the contract's 2/4/8-minute backoff before any independently authorized later attempt, without extending this gate's time limit.

Capture at most one viewport PNG per attempted stage, 9 per size; each <=2 MiB and total <=18 MiB per size. No full-page screenshots. Store visible text, network status observations, exact command/configuration, source metadata, per-step outcomes/duration, and aggregate summary. `harness-as-run` preserves the exact baseline script/core. Inspect screenshots manually before signing off; screenshots do not replace assertions.

## Current baseline and ordering conflict

2026-11-01 baseline: both public-root runs failed landing. Each showed a class picker underneath the first-run `How to play` modal; neither exposed the required landing hero or guest button. The 1280x720 run took 5,542 ms (PNG 79,401 bytes); 1600x900 took 5,466 ms (PNG 83,233 bytes). Each recorded 12 HTTP responses and no browser/network errors. There are 2 FAIL and 16 BLOCKED stage outcomes, not 16 additional observed product failures. Deployed commit is UNVERIFIED. No downstream live behavior was probed.

Inspection source head `e68eee0be82a085999f565800bf50925046acf18` defaults a new classless session to class rather than landing (`StageLayout.tsx`), and `MarketTab.tsx` returns a wallet-required message for guests. These are source observations, not additional live results. The resume spec orders BASE0 first while the full recurring path depends on future P0 CXC2 proof UI and CXU3 Forge/Market work. A strict all-stages-PASS requirement at the BASE0 postmerge point therefore has a dependency conflict. The coordinator must resolve ordering with the user; this card does not grant an exception or authorize another merge.

Current source supplies selectors for existing panels. The future proof button/region contract is explicitly provisional (`On-chain proof` accessible name) until CXC2 ships. Later-stage assertions have controlled error-detection coverage, but their integration with live product is NOT VERIFIED because landing blocked execution. Adapt selectors to the shipped accessible UI after reviewing it; preserve all semantic assertions and historical failures. Do not claim this preparatory harness has a verified passing end-to-end path.

Final harness adds end-of-capture health/time checks and avoids retrying failed captures; controlled tests validate these stronger guards. Baseline scripts are preserved unchanged, and no extra live probe was made because those guards cannot change the observed missing landing outcome.
