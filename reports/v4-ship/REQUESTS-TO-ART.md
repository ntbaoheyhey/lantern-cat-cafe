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
