# CHAIN acceptance audit — 2026-11-12

This audit distinguishes implementation from public deployment and production campaign authority. No real key is read and no public transaction is sent by Codex. Full completion remains unproven while the open rows below remain.

| Requirement | Current evidence | Result / next action |
|---|---|---|
| Isolated branch, exact worktree, one draft PR/base/title | git status; open draft PR #441 against codex/cardrpg-c-2026-11-11 | Verified; keep existing PR |
| H0 audit <=60 lines; baseline Forge/web | H0-AUDIT.md, reports/chain/tests/H0-* | Complete |
| H1 browser key, versioned storage, SIWE, chain guard, repeat login | guest.ts, guest.test.ts, guest-wallet.spec.ts | Verified: final three fresh browser runs pass |
| H1 export and full migration | warning/copy action; check-move.mjs actual V1/V2 cancellation, proceeds, NFT/YARN/AVAX receipts | Passed local transaction check; no external-wallet browser automation claim |
| H2 0.05 drip, once/address, <=50/day, sponsor reserve, IP cap, crash idempotency | guest-drip handler, migration, PGlite tests, check-drip.mjs; bounded HTTP/parser and fixed recovery codes | Implemented/local proof; user deployment and two public drips verified; trusted proxy IP assurance still pending |
| H3 deterministic chain43113 harness, bot listings, full authenticated boss/mint/trade/cancel | local.mjs, chain-guest.spec.ts, dedicated CI job | Original H3 and final expanded V2 gates each passed three fresh runs (2 specs/run) |
| H4 on-chain market/bag/history, receipt art and links, judge vouchers/checklist, bot operator | ChainRoom.tsx, runtime.ts, chain-judge, screenshots, E2E assertions | Judge loop implemented; public18-receipt smoke PASS; public browser timing remains unmeasured |
| H4 ordinary campaign boss-drop mint | Fixed authoritative judge boss is implemented; offline campaign has no server ledger | OPEN: C2 authority integration; cannot authorize mint from a local save |
| H4 error/retry, offline play, <=3pp rule | guarded writes and offline/retry; cosmetic Treasure clears on ownership loss | Implemented for CHAIN; legacy combat Relic bonuses not proven and not connected |
| H4b complete catalog split, stable ranges, price freedom and fees | trade.ts/tests, TRADE-RULES.md, V2 fee fuzz, arbitrary-price E2E | 128 Depth templates classified; 64 Epic+ normalized previews checked against reachable same-tier gear at levels 1/10/30; stable old IDs |
| H4b seal, burn, recover without duplicate, ownership follows NFT | chain-items SQL/handler, Yarn.seal, nonce reuse, E2E balance/treasury/burn checks | Implemented for server inventory; Star Thread boss drop is live test source |
| H4b ordinary Epic+/rare-material campaign issuance and item use | Catalog policy is ready; source row adapter needs C2 authoritative progression | OPEN: do not describe catalog eligibility as shipped campaign issuance |
| H4b abuse controls, filters/stats, ten item-trading sources | cap3/day, level2, cooldown600s; UI; TOKENOMICS-RESEARCH.md | Implemented; direct-transfer/V1 bypasses disclosed |
| H5 >=15 dated sources, required economy/failure/legal/vesting topics | TOKENOMICS-RESEARCH.md, 48 distinct dated URLs; ten item-trading entries including one overlap | Complete research record; no primary-source claim for community idle-market data |
| H5 allocations/vesting/reward/sink policy and decisions | TOKENOMICS.md, DECISIONS.md | Design complete; genesis distributor does not enforce vesting |
| H5 52-week fixed-seed three mixes incl20% bots, CSV/charts, conservation and thresholds | token-sim.mjs, 16 main CSV scenarios, 63 reward/demand runs, 720 multi-seed cases plus12 stresses, exact token/item conservation | Integrity PASS; economic gate NOT MET (2.07–2.41×); closed-season rank, persistent adoption and stock limits; future sinks separated |
| H5 use actual C2 supply | C2 B4b600 accounts/30days received and reconciled; all64 eligible templates | Pinned C2 inputs, per-profile3.5/7/21h, partial fifth week and gross source before use/salvage;486 scenarios+18 stresses. Earlier4,000-cohort controls remain. Ordinary authority and voluntary behavior remain OPEN |
| H5 automatic next-season reward reduction | Deployed YarnToken burn history + SeasonRewards rollover independently verified; grant-inclusive integer model matches | Controller COMPLETE; routine issuer still OPEN pending authoritative weekly/rank entitlements |
| H5 Vietnamese pitch <=40 lines and chart | TOKENOMICS-VI.md + tokenomics.svg | Written and visually checked |
| H6 YARN/V2/rewards + unit/fuzz/invariant, >=90% line coverage | 128 Forge pass; Yarn100%, Season100%, Market95.95%, RelicForge100%; replay/caps/fee/conservation tests | Verified locally |
| H6 deployment script, code-only backend, balances/currency/claim behind flags | DeployChainV2, chain-items, ChainRoom/YarnBalance, USER-DEPLOY-VI | Written; local type/lint/build pass; user deployment and public smoke complete; frontend hosting still pending |
| H5 finite price experiment | 216 paired cases+36 stresses; optional5% policy default off; actual20 grant completes18-YARN basket; immutable quotes and altered-price rejection | Local feasibility COMPLETE; weak-demand/seasonal gates still OPEN |
| H7 optional commit/reveal recruit | No RecruitCommit or verifier yet | OPEN stretch; evaluate after required green gate, no claim of fairness shipped |
| H8 smoke real mode + Anvil dry mode + docs/contracts and static architecture page | fuji-smoke.mjs, FUJI-SMOKE-DRY-RUN, docs/chain/index.html, docs/contracts.md | Dry and user-run public mode18 receipts each; frontend assets and browser timing pending |
| H8b C-Chain/L1 roadmap <=60 lines incl YARN gas, ICTT and validators | L1-ROADMAP.md; distinguishes ERC20 ICTT from required ERC1155 bridge adapter | Complete design only |
| H9 truthful proof, scores, requeue <8 once, READY SHA, Vietnamese handoff and PR | CHAIN-REPORT, OUTBOX/HANDOFF, screenshots/logs and draft PR441; tested implementation in OUTBOX.md | Recorded; source unchanged by the final evidence commit |
| Flags off keep existing behavior; bounded text; original content | build flags, baseline tests, original metadata/SVG, visual inspection | Implemented; full existing browser suite has not been claimed green in this audit |
| No deploy/merge/mainnet/secrets/agents; stop/deadline checks | No public mutation except authorized PR/branch workflow; STOP-CHAIN absent | Preserved |

Remote CI cannot start because of the GitHub account billing/spending limit, confirmed by source-check annotations in REMOTE-CHECKS.json. Vercel integrations have reported deployment rate limits (REMOTE-CHECKS.json); the earlier preview was Canceled despite successful GitHub status. Production CHAIN metadata still returns404. Vercel project/root settings are now verified and a user-run prebuilt deployment guide is ready. Drip sponsor top-up and3 seed listings are required; seed dry-run is idempotent and passes. Local evidence is not a remote-green claim. See TOKENOMICS-AUDIT.md and FRONTEND-READINESS-VI.md.
