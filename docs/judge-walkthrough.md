# Judge walkthrough — DRAFT, local candidate and live baseline

> **Archived (v2, early November 2026).** This page describes the earlier v2 build and is kept for history only. The current judge path, Fuji contracts (including the fixed-supply ERC-20 YARN) and demo steps are in the [README](../README.md).

Use [the live frontend](https://taskbarhero-eight.vercel.app) on desktop. This guide separates local guest progress, authenticated server state and Fuji transactions. It is not a completed timed demo or submission. Integrated candidate `1eefc3e` is not deployed; live baseline remains `340f88b`. Use the [current release evidence](release-status.md) and [90-second candidate shot list](submission/shot-list-90-second.md) to label the source being demonstrated.

## Guest inspection

1. Dismiss initial Help if shown and choose one of three starter classes. The broader class registry has seven classes; do not describe every class as a first-entry choice.
2. On Home, observe a real idle claim and the Fish/Yarn/XP counters. Guest progress is stored locally and is editable; it is not proof of server entitlement.
3. Open Bag, inspect an earned item and compare it with equipped gear. The capacity is 200; Hero exposes nine gear slots. Use real values rather than mockup numbers.
4. Map shows five chapters and the current boss requirement. A daily first claim grants a Cat Key; a win spends one and a loss keeps it. If Fight is disabled, read the reason. Do not claim a victory from a locked-gate screenshot.
5. Forge can craft gear from owned game resources. The v2 Relic recipe is 30 Yarn plus 1 Moon Pearl, once per day in the shared rule configuration. Ordinary gear stays off-chain.
6. Help→On-chain proof reads the public Fuji contracts. Inspect code presence, Market→NFT linkage and the recent-event window. Missing supply data remains unavailable, not a fabricated zero or lifetime count.
7. Market requires a wallet for its transaction flow. This guest walkthrough does not complete a mint/list/buy run. Help's optional catalog is a local preview; its shared gameplay flag remains OFF.

## Timed recording and wallet evidence

The separate QA route is Landing→Guest→Class→Idle→Boss→Forge→Bag→On-chain proof→Market, within three minutes at 1280×720 and 1600×900. A prepared guest profile must be earned through normal play and disclosed; do not inject clock/progress changes into a live claim. Record each step, viewport, console result and exact release identity. A failed demo step stops further merges until handled.

For the funded scenario, use only throwaway Fuji accounts and free test AVAX. Record actual mint/list/buy transaction hashes against the specified contracts and verify successful receipts. Wallet/key/login prerequisites remain owner-controlled; never share seeds/private keys. There is no mainnet or real-funds step. Pending evidence stays explicitly NOT VERIFIED.

[145-second recording draft](video-script.md) · [Submission pack DRAFT](submission.md) · [Versioned baseline screenshots](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/submission/evidence/media-manifest.json). Baseline 6144d42 images remain historical guest/read-only evidence. The [refreshed integrated gallery](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/ai/codex-gallery-on-stack/docs/ui/gallery/index.html) supplies current local candidate captures with fixture labels; it is not a new live recording.

## Security in 2 minutes

Guest progress is local browser data. Authenticated progress uses wallet sign-in, verified player identity and server-computed rewards; a wallet signature does not authorize another player's rows. Local tests exercise RLS/grants, request-ID retry/ownership, per-player budgets and voucher replay/recovery. V2 budgets fail closed if their counter store is unavailable; per-IP and human-uniqueness protections remain gaps.

Open Help → On-chain proof to read the public Fuji contracts (43113). Code/linkage/events are read-only evidence, not a transaction receipt or an independent audit. The [security overview](security-overview.md) links exact source tests and explains the distinction.

PR #244 is still blocked by the missing complete deployed function backup and tested restore path. This session has not deployed the backend, changed flags/settings or completed fresh funded mint/list/buy proof. The [exact integration receipt](release-status.md) records local UI verification. A released timed recording and funded wallet proof remain pending; local browser tests do not complete them.
