# Release evidence — November 4, 2026

**DRAFT — local candidate, not deployed or submitted.** The repository remains private. This packet distinguishes the integrated source, historical live observations and local fixtures.

## Candidate and live identity

The integrated frontend candidate is `1eefc3ef6d828b06710c8be18feb08e90b099e3e` on `ai/codex-stack-tip`. This branch is **integration only, never merge**. Its source combines #262 → #263 → #264 → #265 → #266 → #268 → #269 and the Salvage contrast and cold-font geometry repairs #271. All original merges were clean. #271 removes inherited row opacity and reserves stable Landing text/control slots; it does not alter eligibility, rewards, economy values or art.

Main/live remains `340f88b92405ceb6b5421b207307fdbb283b2ca3` (PR #261) at the retained November 4 read-only check. [The live site](https://taskbarhero-eight.vercel.app) served `index-Ccs5evFH.js` and `index-jL_b_lsJ.css`; [observed hashes](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-ledger/reports/sys/single-session/live-assets.json) belong to that observation. No final-candidate deployment is claimed. Local main checkout `6144d42` is not the remote release identity and was left untouched.

| PR | Reviewed source | Candidate role |
| --- | --- | --- |
| #262 | a9afaad | Additive art, behind default-OFF flag |
| #263 | 4b0e69a | Motion, stage semantics, reward contrast, keyboard scroll regions |
| #264 | 949cc44 | Explicit Sample/Unavailable feature previews |
| #265 | 7d0d08e | Visible first guest journey and natural reward |
| #266 | f2a0588 | Historical static review gallery |
| #268 | afd0699 | Session-expiry explanation and class-confirmation focus |
| #269 | 85a6919 | Nonce handling, wallet notice and compact connected HUD; edge source undeployed |
| #271 | 1eefc3e | Readable Salvage explanations and zero cold-font layout shift; strict contrast and exact-pixel regressions |
| #267 refresh | ai/codex-gallery-on-stack | Final integrated captures, static gallery and 90-second walkthrough; draft |
| #270 refresh | ai/codex-docs-on-stack | This submission and security packet; draft |

Original #262–#269 receipts belong to their individual heads. SINGLE2 grades belong to the exact integrated head. The original #270 head `127e3f8` remains rejected A0/B0 in the archive; its main-based product inherited accessibility failures. The first integration `d31cb2a` also remains rejected A0/B0 after expanded scans found Salvage contrast failures. Neither rejection is rewritten as a pass.

## Integrated verification

**PASS — self-graded (fresh pass), A95/B95**, exact integrated product `1eefc3ef6d828b06710c8be18feb08e90b099e3e`. Both passes ran typecheck, lint, build, script/package units and 1,467 web units. Full Playwright ran once per size on this head: **399/399 at 1280×720 and 399/399 at 1600×900**. Complete changed-spec coverage repeats each spec three times: 246 executions per size per reviewer. Resize burst: 0/40 failures across A/B; strict geometry: 0/36 failures; pinned axe 4.10.3: zero violations in 38 scans per reviewer. The previous four failing accessibility scans and twelve confirmation keyboard failures are now zero.

Both isolated performance passes reached nominal 60 fps, p95 below 20 ms and exactly zero CLS, including cold-font keyboard journeys. Stage effects pass 10/10 per size per reviewer. Final mocked recovery/wallet audit passes 14/14 with no signing or live writes. The entry JS is 143,074 B gzip using Node gzip defaults, +1,471 B (+1.04%) versus the 141,603 B baseline; Phaser remains lazy at 315,728 B gzip. No runtime flag or economy value changed.

Package results retain **two expected failures and eleven inherited skips**; none were added or weakened. Axe reports some incomplete contrast determinations; measured text regressions and native visual review supplement those checks. Accessibility-tree/live-region inspection is automated, not a human screen-reader listening session. These local results do not prove deployed backend source, native gateway behavior, production asset identity or a funded wallet journey.

[Integration receipts and failures](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-ledger/reports/sys/single2/stack-tip-receipts.md) · [Mocked wallet/recovery audit](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-ledger/reports/ui/cards/SINGLE2-U5/stack-audit.md) · [Session report](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-ledger/reports/SINGLE2-REPORT.md).

Screenshots in this refreshed packet are labelled by capture source and state. Local stocked inventories, simulated RPC errors and synthetic connected wallets are fixtures, not earned live balances or transactions. The seven original packet PNGs and their `6144d42` manifest remain historical. Their 2,490-package-unit/323-browser-case counts are not current candidate results.

The refreshed [gallery source](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-gallery-on-stack/docs/ui/gallery/index.html) provides current stack captures and a separate historical archive. The private GitHub source viewer is not a published HTML site; clone the branch and open the standalone HTML locally. [90-second walkthrough](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-gallery-on-stack/docs/ui/demo-script.md).

## Release hold and sequence

**CAPACITY BLOCKED.** Vercel CLI is absent; the latest provider status on #269 reports deployment rate limiting. #270 previews were ignored builds. Zero main commits/merged PRs today UTC do not establish actual remaining deployments. The warning was recorded at November 3, 20:51:55 UTC. The next planned check is **November 4, 21:00 UTC** (November 5, 04:00 Vietnam), only if a session is running; it is not a guaranteed reset and no scheduler is created. [Capacity evidence](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-ledger/reports/sys/deploy-capacity.md).

After verified capacity, release #262 → #263 → #264 → #265 → #266 → #268 → #269 → #271 → refreshed #267, with docs refreshed against the result. Never merge either integration branch. Retarget each draft after its dependencies are squash-merged; integrate current main, validate its exact head and receipt, take the merge lock, verify deployed assets and run both-size live smoke. At most one merge per 20 minutes; stop at 80 deployments, any quota error or a regression. #269's edge source remains undeployed even after a frontend release.

## Product and owner boundaries

Fuji chain ID: **43113**. RelicNFT: `0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`. RelicMarket: `0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`. Public code/linkage/event reads do not certify deployed source identity, lifetime supply or a mint/list/buy journey. See the [one-page verification guide](submission/avalanche-proof.md).

Original economy remains OFF. Rune, skill and companion views stay Sample/Unavailable and grant no entitlement. No environment settings, production flags, live database, deployed function or contract changes occur in this session. No wallet signature or transaction occurs.

#244 remains blocked by a complete supported backup of deployed functions, dependencies and import maps, followed by successful local restore rehearsal. A repository-source rehearsal is not that backup. Never bypass `UnsafeFunctionDownloadPathError`. #252 and #257 remain open and superseded. [Exact owner steps](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-ledger/reports/OPTIONAL-USER-STEPS.md).
