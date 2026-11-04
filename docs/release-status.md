# Release evidence — November 4, 2026

This status accompanies the private submission draft. It is not a submission, hosted-preview approval, security certification or funded-wallet receipt.

## Current live and held candidates

At the November 4 single-session read-only check, main remains `340f88b92405ceb6b5421b207307fdbb283b2ca3` (PR #261), and [the live site](https://taskbarhero-eight.vercel.app) still serves `index-Ccs5evFH.js` and `index-jL_b_lsJ.css`. [The observed entry hashes](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-ledger/reports/sys/single-session/live-assets.json) establish the fetched assets; the prior 35-file release comparison establishes their accepted source build. These are separate from screenshots of later local candidates.

| PR | Exact accepted candidate | Status |
| --- | --- | --- |
| #262 | a9afaad | Additive art; draft |
| #263 | 4b0e69a | Motion, stage semantics and reward contrast; draft |
| #264 | 949cc44 | Explicit Sample/Unavailable previews; draft |
| #265 | 7d0d08e | First guest play; draft |
| #266 | f2a0588 | Static capture gallery; draft |
| #268 | afd0699 | Session-expiry explanation and class-confirmation focus; draft |
| #269 | 85a6919 | Nonce handling, wallet notice and compact connected HUD; draft; edge source undeployed |
| #267 | e161f06 | Gallery/demo/walkthrough refresh; draft; refresh again after the final screens land |

All eight heads retain their existing self-graded (fresh pass) receipts. None is current production. Release order is the table order: #262 → #263 → #264 → #265 → #266 → #268 → #269 → #267. Each needs latest-main integration, its required checks, the merge lock, deployed-asset verification and both-size live smoke. At most one merge per 20 minutes; stop at 80 deployments or any quota error.

The current Vercel status still reports a deployment rate limit. CLI access is unavailable, and zero main commits/merged PRs today UTC do not prove remaining deployment quota. The latest recorded provider warning runs through November 4 at 20:51:55 UTC; the planned next check is 21:00 UTC (04:00 on November 5 in Vietnam), not a guaranteed reset. [Capacity evidence](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-ledger/reports/sys/deploy-capacity.md)

## Evidence that can be reviewed now

- Current-main regression: 1,448 web units and 368 browser cases at each of 1280×720 and 1600×900. Resize burst passed five repeats of its two cases at each size: 0/20 failures in that recorded run. This is the unchanged exact-main receipt, not a fresh rerun or a claim that inherited accessibility defects passed. [Raw receipt](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-ledger/reports/sys/logs/main-regression/receipt.json)
- Fresh single-session screenshots and the current-live audit are recorded [with defects and evidence](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-ledger/reports/ui/cards/OVN-U4/live-audit.md). They are baseline evidence for unchanged main, not final-stack acceptance.
- The prior current-live audit measured natural first rewards at 29.49 and 29.96 seconds. It covers fresh/saved guests, routes, Forge modes, public proof, offline and mocked error states. It does not prove a boss win or transaction. [Audit](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-ledger/reports/ui/cards/OVN-U2/live-audit.md)
- [The 624-capture gallery source](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ovn-ui-gallery/docs/ui/gallery/index.html) and [90-second walkthrough draft](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ovn-ui-gallery/docs/ui/demo-script.md) remain local review artifacts. GitHub's private source viewer is not a published HTML site. Candidate screenshots retain their candidate labels and do not represent the live build.
- The submission's seven archived packet images and 2,490-package-unit/323-browser-case counts remain explicitly tied to `6144d42`. Do not replace those historical counts with later candidate totals or call the archive current.

Known medium defects remain live until #263, #268 and #269 land: stage semantics/reward contrast, missing expiry explanation/class-confirm focus, and wallet notice/connected-HUD overlap. Their accepted fixes must be released and rechecked before final live acceptance. No duplicate repair is implied by this documentation refresh.

## Product and security limits

Fuji chain ID is 43113. RelicNFT is `0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`; RelicMarket is `0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`. Public code/linkage/event reads do not certify source identity, ownership, lifetime supply or a mint/list/buy journey.

Original economy remains OFF. Rune, skill and companion candidates remain labelled Sample/Unavailable and grant no entitlement. No economy values, settings, environment variables, production flags, contracts or deployed backend functions are changed by this documentation PR.

PR #244 is blocked by a complete supported deployed-function/dependency/import-map backup and a successful local restore rehearsal. Never bypass `UnsafeFunctionDownloadPathError`. #252 and #257 remain open and superseded. [Exact owner steps](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-ledger/reports/OPTIONAL-USER-STEPS.md)
