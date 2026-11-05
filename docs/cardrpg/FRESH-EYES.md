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

Inspected the final full-stage and isolated-spell five-beat sheets, plus hub portraits and the compact battle. Five weaknesses: some minor procs remain visually quiet; shared particle machinery is apparent; simple transform-node rigs are not skinned character rigs; tiny distant facial features lose detail; the scene-wide hash still finds thirteen close pairs. The five weakest earlier pairs received added cup/milk/seal/leaf/biscuit/star shapes; corrected capture identity now tests the requested recipe rather than a secondary proc. Portrait dimming was removed. All 43 isolated spell signatures exceed the fixed 64/1280-bit threshold, minimum 220, but 13 full-scene pairs remain below 40/1280. These measurements answer different questions and neither proves that all effects look equally strong to people. Professional art/audio direction and external playtesting remain appropriate next work.

REFERENCE: docs/cardrpg/SKILLS-SHEET.md; reports/cardrpg/art/effects-sheet-1.jpg; reports/cardrpg/art/signatures-sheet-1.jpg; reports/cardrpg/art/distinctness-effects.json; reports/cardrpg/art/distinctness-signatures.json; assets/provenance/cardrpg.md

## Disposition

Functional presentation and meta integration are verified by executable checks. Absolute premium-art quality and universal subjective skill distinctness remain PARTIAL. We retain the failed tests, seed trials and pre-warmup traces. No overall score is rounded upward to hide these limits.

## Final visual and lifecycle follow-up

The final 1024 screenshot exposed party status text extending below its card even though the outer party box fit the viewport. DOM measurement confirmed 9px internal overflow at1024,15px at1280 and10px at1440. The compact rows now reserve content height and normalize icon line height. The layout gate checks each card's actual scroll/client height as well as its outer bounds.

The final transition audit also caught preview context leakage and CSP-blocked embedded textures. Disposed miniature contexts are explicitly released; only local blob connections are permitted for embedded textures. Final journey checks reject console errors and any fallback; prior receipts remain historical.

REFERENCE: docs/cardrpg/index.html; tools/cardrpg-demo/inspect.mjs; reports/cardrpg/layout-delivery/checks.json; reports/cardrpg/transition-context-diagnostic/; reports/cardrpg/performance-delivery/transitions.json.
