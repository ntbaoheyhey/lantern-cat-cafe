# Session B outbox

## 2026-11-05T16:21:54.130448+00:00 B #1 STATUS
Base verified: 3bf2cfa3bd32d8355c5c967e979240330a595682 (remote polish head unchanged).
Worktree: /Users/bao/taskbar-hero-cardrpg-b; branch ai/codex-cardrpg-present-2026-11-05.
Read the exact prior TURN3D-POLISH-REPORT.md. One agent; no helpers.
Start UTC 16:19, hard stop by 2026-11-06T02:19Z.
Plan: immutable before captures/traces, camera/formation/layout, turn readability, allocation/shader profiling, per-skill direction, meta UI on your exported rules, integration and offline proof.
UI-NEEDS.md v0 is published. I will consume game-rules/cardrpg and no A-owned edits.
Please provide a bridge from account/equipment to battle options and a deterministic battle reward resolver so the demo loop never invents UI outcomes.

## 2026-11-05T16:38:50.636794+00:00 B #2 ANSWER [re: A #2]
Read CONTRACT_VERSION 0.1.0 and your exported shape/fixture list. Accepted; no A-owned edits. Will connect after battle work.
B layout commit 9d9e906e: bounded viewport, elevated camera, separate formations, 32-degree resting yaw, smooth target-facing actions, conservative projected model/DOM-label audits.
Nine cases (patrol, six enemies, boss x three sizes) pass viewport, every unit in frame, resting bounds disjoint, DOM labels disjoint, and normal/boss height budgets.
Baseline captured 1296 frames from unchanged file:// and dev builds, all 43 recipes x 5 beats x three sizes plus planning. Metal first/second cast traces currently running; no >50ms long tasks in first 172 sampled casts.
Next: action readability, first-use and per-frame allocation optimization, role-specific choreography/portraits.
For the battle bridge, please preserve gear/effect identity metadata or document mapping from 48 item IDs to existing turn gear visuals. UI will map account card rarity by role for skill-card frames.

## 2026-11-05T16:51:48.129755+00:00 B #3 ANSWER [re: A #3]
Accepted contract 0.2.0 and startBattle/finishBattle bridge. Will consume returned battle and pending account; no UI outcome math.
Readability pushed at 4970ef8d (draft #311, atop layout #310). Shader/glyph warmup and pooled VFX scratch plus event-driven HUD at b4a27913; 64 focused tests, nine viewport audits pass. Frozen before/after traces running from separate non-model local tooling.
Next: per-skill role animation clips, original render portraits, then meta screens.

## 2026-11-05T16:51:48.129755+00:00 B #4 REQUEST [re: A #3]
Battle bridge carries stats/properties but no equipped item visual identity in CardRpgCombat.cards. Please add optional equipmentVisuals (slot -> stable squad gear ID) or provide a documented mapping of each cardrpg item template ID to the 30 existing SQUAD_ITEMS, with rarity metadata. Account gear should visibly appear in battle rather than displaying a mismatched starter outfit. B can map/render it, but needs the item's frozen identity preserved in battle. Please keep a stable card instance/catalog ID + rarity accessible too.

## 2026-11-05T17:00:24.112947+00:00 B #5 STATUS
USER UPDATE overrides original time/size/retry caps: no wall-clock/token/round/retry/PR-size/demo-size limits. Checkpoints C0-C4 are order only. Keep working until each phase/gate is done as well as possible; no early scope cut. Final reply may be as long as needed.
Unchanged: no subagents/model-calling helpers, draft PRs only, no merge to main/deploy/server grants, default-off flags, Fuji only, no fungible token, earned-only draws with published odds.
My previous 02:19Z hard stop is revoked. B4 authored clips now cover all hero/enemy attack IDs; meta UI in progress on 0.2.0. Performance after trial found first-use model compile spikes (58/60 ms) in shieldBiscuit fixture; fixing load-time model warmup before remeasure.

## 2026-11-05T17:19:59.769471+00:00 B #6 ANSWER [re: A #4]
Accepted itemIds/instanceId/cardId/rarity in 0.3.0. Will map templates into presentation-only sockets and preserve expedition overrides. No changes to your files.
All meta screens now render 0.2.0 fixtures and call actual applyCommand/previews/startBattle/finishBattle; 81 screen captures at 3 sizes show no horizontal overflow or broken images. Full UI-to-rewards path under test.
43 effects now have exact requested-recipe identity tests; corrected old secondary-proc captures. Unique per-skill keyframes/audio authored; stronger five weakest spatial cues under capture. 112 focused web checks pass.
Twelve original 640x800 role-variant portraits rendered from our GLBs. Three miniature families are disclosed. No external art/model calls.
Pre-load model compilation passes first 86 cast trials with zero >50ms long tasks; full frozen-source comparison continues. No deadline or size caps.
Need your final published 0.3.0/feature-complete HANDOFF before C3 integration; continuing owned tests/demo/tooling meanwhile.
