# V3B delivery — 13 November 2026

The café shell, licensed audio, fonts, icon sweep, tutorials and server-owned economy v3 flow are implemented. All current local application tests and the demo build pass. **B6 economic acceptance remains PARTIAL** after three tuning candidates and the end-of-queue review; see [ECONOMY-SIM.md](ECONOMY-SIM.md). This is a prepared testnet build, not a public v3 deployment or a launch-ready economy.

Delivery: implementation commit `9af6da640` on `codex/v3-shell-2026-11-13`; [draft PR #445](https://github.com/ntbaoheyhey/taskbar-hero/pull/445) targets main. The queue is closed with the economic misses recorded, and the two recorded local preview processes are stopped.

| Card | Outcome | Self-score | Evidence |
|---|---|---:|---|
| B1 | Complete: six buses, ducking, priorities, speed/pause support, licensed samples and cat-speak | 8/10 | AUDIO-BATTLE.json, AUDIO-LOUDNESS.json, docs/audio-lab |
| B2 | Complete: self-hosted Vietnamese display/body/number fonts and title treatments | 8/10 | shots/b2-vietnamese.png, tests/typography-final.log |
| B3 | Complete after revisit: painted items, SVG nav/status, rarity frames and glyph sweep | 8/10 | shots/b3-icon-sheet.png, tests/icons-final.log |
| B4 | Complete after revisit: landing, SIWE, café stage/dock, panels and truthful counters | 8/10 | shots/b4-*.png, tests/b4-browser.json, tests/b4-anvil.json |
| B5 | Complete: 26 short steps, 14 illustrated guide pages, skip/replay | 8/10 | tests/b5-flow.json, shots/b5-*.png |
| B6 | Implementation/proofs complete; simulation acceptance PARTIAL | 6/10 | tests/b6-anvil.json, tests/b6-browser.json, ECONOMY-SIM.md |
| B7 | Reports, user deployment preparation and draft PR; later integration belongs to Session A | 8/10 | QUEUE.md, STATUS-VI.md, USER-DEPLOY-VI.md |

## What changed

Audio uses one AudioContext and the shared `window.__thAudio` bridge. It unlocks on a gesture, persists bus levels and mute, ducks music for voices/ultimates, and uses sample sprites with MP3 fallback. The automated 180-second battle recorded 1,021 cues, 848 plays, no unmapped cues or oscillator fallback; cooldown and voice-priority suppression explain the rest. All 20 encoded files pass the measured loudness/peak/loop gates. This is measured audio QA, not a claim of human listening.

The shell uses Baloo 2 and Barlow Condensed, original painted key art/items, SVG navigation/status icons, large starter cats, a seven-button dock, dark framed panels and an orange Fight action. Returning sessions skip entry; guest and injected-wallet SIWE are locally proved. A ten-second local gameplay trailer is included. Session A's newer battle rigs, manual combat controls and final trailer remain integration inputs; protected battle directories were not edited.

The tutorial describes current controls accurately: ultimates auto-cast and portraits open details. It does not pretend manual targeting or manual ult activation exists. Each instruction is at most 12 words. The illustrated basics coexist with retained detailed battle notes.

Economy v3 adds finite, idempotent server ledgers for Deeds, signed Spool balances, net withdrawals, seals and deterministic fusion. The Deed gates withdrawal, not play or earning. Campaigns use v3 rules when enabled and transfer server-earned gear into the café; browser saves never authorize tradable rewards. Legacy reward/export paths are closed under v3. The 25% withdrawal fee remains in the funded pool, while seal/fusion YARN fees burn. Sealed inputs transfer to the dead address with an intent-bound, single-use receipt before output minting. Bag discovery and guest moves cover all Deed/quality IDs. Production builds generate 6,256 metadata filenames, including both supported URI forms, without per-Deed image duplication.

Bell-only cat/gear rates, pity, featured carryover, duplicate shards, enhancement/Blessing, quality floors, bound fusion and diminishing drops derive from shared rules. Bell remains the display name of the existing bound `stamps` save key. Optional currency merging and dynamic median seal fees were deferred because the MUST economy target is not green.

## Verification and limits

`tests/release-suite.log`: root 41 tests; auth 24; chain 32; API contract 16; game rules 1,388 passing plus two expected failures and 11 existing skips; server 724; web 2,485. `tests/release-types.log` passes all workspaces. The final shared-pool guard also passes its 11 targeted tests in `tests/release-shared-pool.log`. `tests/release-build.log` verifies the Fuji demo build. Contract evidence remains `tests/final-forge.log`: 128 passing tests; no contract source was changed.

The Anvil proof uses port 8546 and confirms 13 receipts through guest quest, mint, withdrawal, seal, dead-address fusion, listing and a second-wallet purchase. The browser proof covers visible guest/mint/withdrawal controls. PostgreSQL 17 concurrent sessions prove budget and allocation races, in addition to PGlite service tests. The generated operator SQL was applied to a local migrated PGlite database and retried: it preserved reservations and reserved the v3 allocation in the shared tester budget. Ten deployment shell blocks passed `zsh -n`; no deployment commands ran.

The legacy conditional supply snapshot was refreshed through its real measurement script after the source-hash regression, keeping it separate from v3 measurements. Historical failed repair logs remain in `tests/`; use [TEST-EVIDENCE.md](TEST-EVIDENCE.md) to identify final evidence rather than treating a historical filename as current status.

Economic misses are material: at half demand burn/all claims is 0.846–0.897, Star Thread source/sink is 25.93–36.04, and heavy first-Legendary median is day 11 versus target 5–9. Casual median day 11 passes its 10–16 target. No additional tuning was used after the three allowed candidates. Future balance work needs different material sinks and progression, not relabeling these failures.

The deployed SeasonRewards contract has a 13-week season and a controller cap; gameplay seasons are four weeks. The issuer enforces unique Deed IDs and the 3,000 ceiling because the existing ERC-1155 does not. A transfer to the dead address does not decrement an ERC-1155 supply counter. Edition issuance and a completed-fusion indexer are not deployed; their counters remain explicitly Offline. A full public Fuji v3 smoke is a user deployment follow-up, not satisfied by local Anvil.

## Live stats configuration

`VITE_V3_START_BLOCK` must be saved before the first v3 mint and reused in later builds. The client scans NFT/YARN/market/rewards logs only within its 200,000-block catch-up limit. It publishes no partial total. Burn supply and current contract-season emission/burn are direct RPC reads at a common block; tester claims are included in emission. A missing independent source does not erase other verified counters.

Optional `VITE_CHAIN_STATS_URL` points to an operator-controlled, preferably same-origin indexer. Its response must include `chainId: 43113`, `relicNFT` matching the registry, and `indexedAt` as Unix milliseconds no more than 120 seconds old and not in the future. Optional nonnegative integers: `deeds` (maximum 3,000), `fused` (completed output mints reconciled with inputs), `transactions`. Optional `edition` contains the current one-based gameplay `season`, `supply: 600`, and integer `minted` from 0 to 600. Missing, stale, wrong-chain or invalid values stay Offline. Merely transferring inputs to the dead address must not count as completed fusion. A remote indexer/RPC also requires an explicit CSP `connect-src` entry.

## Assets, integration and deployment

Audio payload: 3,937,590 bytes / 12 MB. Fonts: 82,456 bytes / 400 KB. Icons after sweep: 207,921 bytes / 3 MB. Original art prompts and tool provenance are in `assets/provenance.json`; audio source/licence/author/date coverage is in `apps/web/public/audio/LICENSES.json`; fonts ship OFL licences. No paid audio service was used. Resume cleanup recovered rebuildable outputs with about 98.3 GiB free; final disk figures are in DISK-LOG.md.

Session A should merge this pushed branch at the 16/18 November syncs, use the existing cue and typography contracts, replace the trailer when ready, and run the same local gates on the combined build. B imports A only after a request in REQUESTS-TO-B.md. No request was present at this delivery. Freeze is 19 November 12:00 UTC; afterward only crash/flow fixes. No scheduled automation, main merge or public deployment was created.

[USER-DEPLOY-VI.md](USER-DEPLOY-VI.md) is the exact Vietnamese operator sequence for 20 November: migration/function rollout, finite shared budgets, backend/demo flags, sponsor funding, Vercel prebuilt deployment, market seed, public smoke and rollback. GitHub Actions remain blocked by billing; local evidence is authoritative for this handoff.
