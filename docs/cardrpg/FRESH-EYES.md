# Presentation self-review, four separate passes

One primary agent performed these passes; these are not independent reviewers, human playtests or contest scores. Screenshots inspected at their recorded desktop sizes. Original request's time and size caps were revoked; no scope was cut to fit a deadline.

## First-time player · 7.7/10

Inspected the integrated 1280x720 hub, 1024x600 battle, and the actual complete starter journey. The chapter entry and local/unsaved status are visible. Opposing formations are readable; the battle stays in one viewport. Five weaknesses: the old fixed seed lost after final balance changes; the small battle labels require the larger right-side intents; meta content scrolls inside its panel; manual card choice needs learning; reset loses all progress by design. Fixed the first weakness with a documented reproducible tutorial seed 2 and reverified real controls through victory/rewards/enhancement at all three sizes. This selected replay is not a win-rate estimate. Enlarging all labels would erase the space gained at 1024x600; the full-text intent list remains the readable duplicate.

REFERENCE: docs/cardrpg/index.html; reports/cardrpg/offline-path/check.json; reports/cardrpg/offline-path/1024-battle.png; reports/cardrpg/validation/tutorial-seeds.json

## Skeptical three-minute judge · 7.0/10 as a local prototype

Inspected invitations, published odds/pity, rewards, the before/after section and Relic designs. Five weaknesses: actual Avalanche integration is absent; local counters do not prove global supply; chapter one is the only playable chapter; no human retention study exists; art is procedural miniature art rather than premium production art. Keep all five limitations explicit. Fixed misleading reward expectations by labeling nominal service/quest payouts as subject to daily caps, and tested exact hard-pity behavior. Fuji chain ID 43113 and “design only, not minted” are visible. No paid draws, wallet operation, tradable random NFT prize or fungible token was added. No technical score is used to imply chain completion.

REFERENCE: docs/cardrpg/index.html; reports/cardrpg/offline-commands/check.json; apps/web/src/game/cardrpg/Journal.tsx; docs/design/cardrpg/BALANCE.md

## Long-term player and collector · 7.1/10

Inspected midgame collection/equipment, actual team/level/ascend/lock/reforge/salvage/forge commands, quests and day reset. Five weaknesses: twelve cats share three combat kits/miniature families; no persisted collection is allowed in this build; no chapter-two content is playable; the economy is simulated rather than human-tested; common rewards can visually resemble one another. Fixed destructive-operation clarity (explicit salvage confirmation and disabled equipped/locked cases), verified failure atomicity, and kept distinct rarity frames plus base-stat/effective-stat comparisons. Neither durable ownership nor a complete live service is claimed.

REFERENCE: docs/cardrpg/index.html; reports/cardrpg/offline-commands/check.json; reports/cardrpg/meta/; docs/design/cardrpg/DESIGN.md; docs/design/cardrpg/evidence/economy-final.json

## Art and effects director · 7.0/10

Inspected the final full-stage and isolated-spell five-beat sheets, plus hub portraits and the compact battle. Five weaknesses: some minor procs remain visually quiet; shared particle machinery is apparent; simple transform-node rigs are not skinned character rigs; tiny distant facial features lose detail; the scene-wide hash still finds twenty-three close pairs. The five weakest earlier pairs received added cup/milk/seal/leaf/biscuit/star shapes; corrected capture identity now tests the requested recipe rather than a secondary proc. Portrait dimming was removed. All 43 isolated spell signatures exceed the fixed 64/1280-bit threshold, minimum 219, but 23 full-scene pairs remain below 40/1280. These measurements answer different questions and neither proves that all effects look equally strong to people. Professional art/audio direction and external playtesting remain appropriate next work.

REFERENCE: docs/cardrpg/SKILLS-SHEET.md; reports/cardrpg/art/effects-sheet-1.jpg; reports/cardrpg/art/signatures-sheet-1.jpg; reports/cardrpg/art/distinctness-effects.json; reports/cardrpg/art/distinctness-signatures.json; assets/provenance/cardrpg.md

## Disposition

Functional presentation and meta integration are verified by executable checks. Absolute premium-art quality and universal subjective skill distinctness remain PARTIAL. We retain the failed tests, seed trials and pre-warmup traces. No overall score is rounded upward to hide these limits.

## Final visual and lifecycle follow-up

The final 1024 screenshot exposed party status text extending below its card even though the outer party box fit the viewport. DOM measurement confirmed 9px internal overflow at1024,15px at1280 and10px at 1440. The compact rows now reserve content height and normalize icon line height. The layout gate checks each card's actual scroll/client height as well as its outer bounds.

The final transition audit also caught preview context leakage and CSP-blocked embedded textures. Disposed miniature contexts are explicitly released; only local blob connections are permitted for embedded textures. Final journey checks reject console errors and any fallback; prior receipts remain historical.

REFERENCE: docs/cardrpg/index.html; tools/cardrpg-demo/inspect.mjs; reports/cardrpg/layout-delivery/checks.json; reports/cardrpg/transition-context-diagnostic/; reports/cardrpg/performance-delivery/transitions.json.

The natural-playback follow-up included the previously unmeasured entrance into loot and rest. It found 198/194ms creation stalls (profile repeat 208/209ms), dominated by shader compilation in three new miniature contexts. The run now owns a four-slot warmed preview pool, shared across loadout/loot/rest and the equipment picker, suspended while detached and disposed when leaving the run. The full natural x4 campaign audit counts contexts and includes these screen entrances; its final receipt, not the earlier next-wave-only measurements, governs the lifecycle claim.

REFERENCE: apps/web/src/game/squad/turn3d/PreviewPool.tsx; tools/cardrpg-demo/lifecycle-performance.mjs; reports/cardrpg/lifecycle-diagnostic/; reports/cardrpg/lifecycle-delivery/measurement.json.

## Final native Retina review

A separate DPR2 stress audit exposed 33–50ms p99 tails in the optional High pipeline at 1440×900. A controlled comparison retained native Retina pixels and existing bloom while selecting Medium by default at DPR2. The full-screen multisample post target is skipped at that quality; High remains an explicit choice. Removing drawing-buffer preservation did not improve the measured result and was rejected. Final evidence includes all 43 recipes at both DPR1 and DPR2, cold and warm, plus an additional complete natural Retina campaign. The exact final percentiles, including strict 16.7ms misses, are in the source-bound summary.

The final screenshot review reconfirmed the corrected 1024 party status height and readable 1280 cafe hierarchy. No external human playtest or universal artistic distinctness is claimed.

REFERENCE: docs/cardrpg/index.html; reports/cardrpg/retina-diagnostic/; reports/cardrpg/performance-retina-delivery/performance-metal.json; reports/cardrpg/lifecycle-retina-delivery/measurement.json; reports/cardrpg/validation/performance-summary.json; reports/cardrpg/offline-path/1024-battle.png; reports/cardrpg/offline-path/1280-hub.png.

## Round-boundary Retina diagnosis

The full Retina campaign exposed 13 long tasks of 51–98ms despite successful victory and stable context counts. A profile repeat attributed 1.85 seconds of cumulative self time to renderer.setSize. Instrumented layout showed the remaining-order row shrinking from 34.09 to 24.64px when empty, then growing again on the next round: 99 resize callbacks, almost all actual 9px framebuffer changes. A duplicate-size guard alone did not fix it. The round rows now reserve their height even when empty and stay mounted through the result, and identical host sizes no longer reset the canvas. The natural-playback check records drawing-buffer sizes, requested quality and effective adaptive quality throughout the campaign. The failed receipts and diagnostic override remain explicitly historical.

REFERENCE: apps/web/src/game/squad/turn3d/battle-layout.css; apps/web/src/game/squad/turn3d/scene.ts; tools/cardrpg-demo/lifecycle-performance.mjs; reports/cardrpg/retina-lifecycle-diagnostic/; reports/cardrpg/retina-resize-diagnostic/; reports/cardrpg/retina-resize-boxes/; reports/cardrpg/earlier-trials/pre-retina-resize/.

## Gear lifetime and adaptive shader preparation

The stable-framebuffer trial still recorded a 56 ms equipment-preview task and a 62 ms task at the Medium-to-Low adaptive transition. The profiled repetition had no task above 50 ms but accumulated 138.8 ms in `getProgramInfoLog`, concentrated around preview changes and the output switch. These trials remain historical. Gear resources now belong to the renderer for the full run, so preview replacement does not evict their programs. Loading prepares both direct-canvas and HDR-output material variants before interaction. The final full-campaign and exit-cycle receipts determine whether these changes pass; profiling success alone is not the performance gate.

REFERENCE: apps/web/src/game/squad/turn3d/gear-visuals.ts; apps/web/src/game/squad/turn3d/scene.ts; reports/cardrpg/retina-equipped-warm-trial/measurement.json; reports/cardrpg/retina-equipped-warm-profile/profile-1440.json; reports/cardrpg/lifecycle-retina-delivery/measurement.json; reports/cardrpg/preview-lifetime/check.json.

## Final source-bound disposition

The final artifact records 258 DPR1 and 258 DPR2 cold/warm casts with zero long tasks; 60 and 79 respective cases still exceed the strict p95 threshold by 0.1 ms. All cast p99 values are at most 16.8 ms. The complete natural Retina campaign has zero long tasks but p99 33.3 ms and adapts Medium to Low, so broad Retina cadence remains PARTIAL.

An additional diagnostic repetition instruments the complete natural campaign with CPU profiling and asynchronous WebGL timer queries (every eighth frame, zero disjoint events). It keeps Medium, with frame p95/p99 16.7/16.8 ms; render CPU p99 4.5 ms and sampled GPU p99 2.701 ms. This does not reproduce or explain the prior intermittent tail, and does not replace its failed cadence receipt. CPU render duration excludes other browser work; the GPU query excludes browser composition. No speculative post-processing change or repeated-until-pass promotion follows this observation.

Final art captures contain all 215 exact requested beats with no missing/overlapping labels; 204/215 immediate repeats match exactly. Isolated spell dHash minimum is 219/1280 with zero pairs below 64; whole-stage dHash still has 23 pairs below 40, nearest Last Sip/Milk Flask at 20 bits. These preserve the artistic PARTIAL result. The final 1024 battle and settled hard-pity reveal were visually inspected; the earlier opacity-zero transition capture is not used as settled reveal evidence.

REFERENCE: docs/cardrpg/index.html; reports/cardrpg/validation/performance-summary.json; reports/cardrpg/retina-cadence-diagnostic/summary.json; reports/cardrpg/lifecycle-retina-delivery/measurement.json; reports/cardrpg/art/; reports/cardrpg/offline-commands/1280-pity.png.
