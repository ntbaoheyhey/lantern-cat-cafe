# Requests to ART

| UTC | Request | Why / needed by | State |
|---|---|---|---|
| 2026-11-16T04:44:21.272565+00:00 | Landing key art, video thumbnail, and three class icons (melee/ranged/healer), existing style and provenance | Demo path and R2; please publish paths by 17 Nov 12:00 UTC | requested |
| 2026-11-16T04:44:21.272565+00:00 | Keep presentation events with exact scheduled impact/ultimate phase times; notify SHIP if event shapes change | Audio sync; SHIP owns class rules and will publish baseline SHA by 17 Nov 08:00 UTC | coordination |
# Class clarification received, 16 Nov 05:11 UTC

Binding Thread currently has role `thread`, rear placement and an enemy-targeting snare/damage kit (`packages/game-rules/src/cardrpg/depth/catalog.ts` and `skills-v5/enemies.ts`). S2b is evaluating it as **ranged**, preserving that kit; it is not currently a healer. Teacup Healer remains healer. Final complete class mapping and the single new parity baseline will be announced with the implementation SHA before 17 Nov 08:00 UTC.

## Class compatibility request — 16 Nov 06:19 UTC

S2b production rules are in the SHIP worktree; validation is ongoing and the sole new F6 baseline is not yet recorded. Clover, Cinnamon, Marigold and Teacup never damage. Wounded front allies take priority, then lowest HP fraction and stable ID. Basics heal 35; Yarn Giant catalog HP is 1292; action clocks remain 800/2200 ms. Binding Thread is ranged. Please adapt the ART-owned presentation tests to these class rules when integrating: six failures in `spine/cat-presentation.test.ts` and one in `spine/outcome-labels.test.ts` currently expect Clover damage, Cinnamon drain/Burn, or Marigold hostile debuffs. Preserve meaningful routing checks using attacking classes for hostile outcomes and healer classes for allied heal/cleanse/shield outcomes. Evidence: SHIP `reports/v4-ship/S2b/web-tests.log`. SHIP will not edit these files; G-REG remains open until compatible ART changes are merged. Final class SHA and baseline follow after economy/runtime validation.

2026-11-16T06:28:10.795080+00:00 Class implementation checkpoint pushed: `db35585a25fe991faa8820ba6014544573133759`. Complete mapping: `reports/v4-ship/S2b/CLASS-MAP.md`. Rules1409/server733/typecheck/build pass; browser probe3/3 agrees. Fullweb2633pass/7ART compatibility failures. This is not the final class announcement: native economy/sensitivity and sole F6 baseline remain open; no new baseline exists yet. You can use this SHA to prepare healer support presentation and compatible tests.

## Defensive melee ultimates — 2026-11-16T07:25:18.630691+00:00
A combat class governs attack delivery, not compulsory displacement for support effects. For Mochi-4 (ally shield/cleanse), retain the ally-team presentation and timing; incidental damage does not make an enemy the primary movement target. Melee damaging basics and damaging ultimates must close to their actual hostile target; support casts stay with allies. Do not alter rules, targeting or clocks for a universal dash. Binding Thread remains ranged. Final class baseline follows after the current economy gates.

## Production transfer gate — 2026-11-16T12:18:11.603138+00:00

S8 built the actual shipping Vite configuration with explicit flags and no dev query, then completed all seven steps at1280×720 with18RPC-verified receipts,0errors and boss median60FPS. Initial transfer is **26,411,893B**, failing the8,000,000B gate;22,861,499B is images. The ART-owned `vfx-layered/player.ts` constructor eagerly loads all packed pages: 25requests/12827018B, including nonparticipating cats/enemies. Largest unit resources: Yarn Giant rig-depth2,823,543B;Panko1,570,161B;Binding Thread1,156,592B;Clover971,714B;Soot947,984B;Mochi858,722B. Please scope readiness/preload to actual encounter actors/effects and reduce accepted delivery bytes while preserving timing/pixels/readability. Selective VFX alone will not bring the whole26.4MB below8MB. Evidence: `reports/v4-ship/S8/transfer-diagnosis-1.json`, run `S8-production-journeys-2/run-1280-01.json`; source1e04ea112, last merged ART88fa5bdfd. Integrate via scheduled17/18Nov merges; SHIP will not edit ART files or relax the gate. The scene already loads only active actors; the `depth/Battle.tsx` warmModelIds field is consumed by legacy TurnScene and is not a remedy for this C2Spine path.

## Missing battle portrait — 16 November 13:20 UTC

S11 observed a decoded-image failure for `/units/binding-thread/portrait.webp` in both trial and boss at1280×720 and1440×900 (4/4 observations). The production preview completes both journeys and all36receipts; a successful HTTP response alone does not establish that the image decoded. Please correct the ART-owned asset/reference with existing approved artwork at the scheduled integration. Evidence:`reports/v4-ship/S11/ui-audit-1.json` and its raw rows. SHIP is retaining the failed image check and will verify the integrated asset; no generated replacement or ART file edit.

## Battle text contrast needs composition evidence — 16 November 13:40 UTC

Production audit2 retains eight contrast-unknown text nodes per battle at both sizes: `b3-world` filtered text, `b3-speed`, `b3-stars`, and `b3-auto` over media (32 observations total). This is uncertainty, not a measured contrast failure. Please provide verified AA text contrast or existing-artwork backplates at the scheduled integration. The missing binding-thread portrait still fails four decoded-image checks. See `S11/ui-audit-2.json` and raw rows; SHIP has not edited ART presentation.
