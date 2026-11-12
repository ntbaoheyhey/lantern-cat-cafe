# CHAIN acceptance audit — 2026-11-12

This audit distinguishes implementation from public deployment and production campaign authority. No real key is read and no public transaction is sent by Codex. Full completion remains unproven while the open rows below remain.

| Requirement | Current evidence | Result / next action |
|---|---|---|
| Isolated branch, exact worktree, one draft PR/base/title | git status; open draft PR #441 against codex/cardrpg-c-2026-11-11 | Verified; keep existing PR |
| H0 audit <=60 lines; baseline Forge/web | H0-AUDIT.md, reports/chain/tests/H0-* | Complete |
| H1 browser key, versioned storage, SIWE, chain guard, repeat login | guest.ts, guest.test.ts, guest-wallet.spec.ts | Verified: final three fresh browser runs pass |
| H1 export and full migration | warning/copy action; check-move.mjs actual V1/V2 cancellation, proceeds, NFT/YARN/AVAX receipts | Passed local transaction check; no external-wallet browser automation claim |
| H2 0.05 drip, once/address, <=50/day, sponsor reserve, IP cap, crash idempotency | guest-drip handler, migration, PGlite tests, check-drip.mjs | Implemented/local proof; user deploys and validates trusted proxy IP |
| H3 deterministic chain43113 harness, bot listings, full authenticated boss/mint/trade/cancel | local.mjs, chain-guest.spec.ts, dedicated CI job | Original H3 and final expanded V2 gates each passed three fresh runs (2 specs/run) |
| H4 on-chain market/bag/history, receipt art and links, judge vouchers/checklist, bot operator | ChainRoom.tsx, runtime.ts, chain-judge, screenshots, E2E assertions | Judge loop implemented; public two-minute timing pending user smoke |
| H4 ordinary campaign boss-drop mint | Fixed authoritative judge boss is implemented; offline campaign has no server ledger | OPEN: C2 authority integration; cannot authorize mint from a local save |
| H4 error/retry, offline play, <=3pp rule | guarded writes and offline/retry; cosmetic Treasure clears on ownership loss | Implemented for CHAIN; legacy combat Relic bonuses not proven and not connected |
| H4b complete catalog split, stable ranges, price freedom and fees | trade.ts/tests, TRADE-RULES.md, V2 fee fuzz, arbitrary-price E2E | Implemented; sealed gear equals a grindable template |
| H4b seal, burn, recover without duplicate, ownership follows NFT | chain-items SQL/handler, Yarn.seal, nonce reuse, E2E balance/treasury/burn checks | Implemented for server inventory; Star Thread boss drop is live test source |
| H4b ordinary Epic+/rare-material campaign issuance and item use | Catalog policy is ready; source row adapter needs C2 authoritative progression | OPEN: do not describe catalog eligibility as shipped campaign issuance |
| H4b abuse controls, filters/stats, ten item-trading sources | cap3/day, level2, cooldown600s; UI; TOKENOMICS-RESEARCH.md | Implemented; direct-transfer/V1 bypasses disclosed |
| H5 >=15 dated sources, required economy/failure/legal/vesting topics | TOKENOMICS-RESEARCH.md, 22 distinct URLs including overlap | Complete research record; no primary-source claim for community idle-market data |
| H5 allocations/vesting/reward/sink policy and decisions | TOKENOMICS.md, DECISIONS.md | Design complete; genesis distributor does not enforce vesting |
| H5 52-week fixed-seed three mixes incl20% bots, CSV/charts, conservation and thresholds | token-sim.mjs, seven CSV scenarios, tokenomics.json/html/svg | Pass under disclosed provisional inputs; zero-demand failure visible |
| H5 use actual C2 supply | C2 OUTBOX inspected again: SLOTS/PILOTS readiness only, no weekly counts | OPEN: replace provisional0.4 rare /0.08 Epic input once supplied; do not call calibrated |
| H5 automatic next-season reward reduction | Simulation implements feedback; production reward issuer currently only grants tester allocation | OPEN: automatic routine weekly/rank policy requires authoritative reward issuer; manual policy is not autonomous enforcement |
| H5 Vietnamese pitch <=40 lines and chart | TOKENOMICS-VI.md + tokenomics.svg | Written and visually checked |
| H6 YARN/V2/rewards + unit/fuzz/invariant, >=90% line coverage | 111 Forge pass; Yarn100%, Season100%, Market95.95%; replay/caps/fee/conservation tests | Verified locally |
| H6 deployment script, code-only backend, balances/currency/claim behind flags | DeployChainV2, chain-items, ChainRoom/YarnBalance, USER-DEPLOY-VI | Written; local type/lint/build pass; public deploy is user-only |
| H7 optional commit/reveal recruit | No RecruitCommit or verifier yet | OPEN stretch; evaluate after required green gate, no claim of fairness shipped |
| H8 smoke real mode + Anvil dry mode + docs/contracts and static architecture page | fuji-smoke.mjs, FUJI-SMOKE-DRY-RUN, docs/chain/index.html, docs/contracts.md | Dry mode18 receipts; public mode deliberately not run; docs desktop/mobile checked |
| H8b C-Chain/L1 roadmap <=60 lines incl YARN gas, ICTT and validators | L1-ROADMAP.md; distinguishes ERC20 ICTT from required ERC1155 bridge adapter | Complete design only |
| H9 truthful proof, scores, requeue <8 once, READY SHA, Vietnamese handoff and PR | CHAIN-REPORT, OUTBOX/HANDOFF, screenshots/logs and draft PR441; tested implementation b67126945 | Recorded; source unchanged by the final evidence commit |
| Flags off keep existing behavior; bounded text; original content | build flags, baseline tests, original metadata/SVG, visual inspection | Implemented; full existing browser suite has not been claimed green in this audit |
| No deploy/merge/mainnet/secrets/agents; stop/deadline checks | No public mutation except authorized PR/branch workflow; STOP-CHAIN absent | Preserved |

Remote CI is currently unable to start due to the GitHub account billing/spending limit (reconfirmed on check130978962411). Local evidence does not imply remote checks passed. An earlier Vercel build reported a rate limit; current preview checks were still pending at the final handoff review. No deployment retry is requested by this work.
