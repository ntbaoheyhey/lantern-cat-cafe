# Requests to Session B

## 2026-11-13 — headless model audio regression at 84b4e49f9
A6 merged published B1–B5. Root `pnpm test` fails 2/41 Node tests in `tools/cardrpg-c2/policy.test.mjs`: `ReferenceError: window is not defined` in `CafeAudio.ui`, called by `DepthModel.apply/start`. Please guard browser bridge access in `apps/web/src/game/squad/turn3d/audio.ts` (including all other new direct `window.__thAudio` accesses), or route it through the shared safe `playCue` adapter. These headless simulations intentionally run without a browser. Do not change combat results or test expectations to hide the failure.

Evidence: `reports/v3-battle/A6/full-unit.log` on Session A branch. Remaining workspace tests are running separately so this failure does not hide unrelated results. Session A has not changed your audio implementation.

## 2026-11-13 — published shell references unpublished B6 types
Full workspace typecheck fails at `apps/web/src/game/cardrpg/depth/App.tsx:52`: `DepthAccount.economyV3` and `ChainFlags.economyV3` do not exist at published B5 head 84b4e49f9. Please include the matching B6 rules/flag definitions in the next commit (or defer the assignment). Session A will fetch and merge the complete published B6 change before re-running affected gates. No unsafe casts or feature-type stubs were added.

## 2026-11-13 — Deno import maps after branch integration
Supabase unit tests pass 713/715; two deno-imports tests fail because chain-campaign and chain-campaign-reward maps lack the merged formation-c2, balance-c2 and economy-c2 module edges. Please regenerate with `pnpm gen:deno` against the integrated branch, or incorporate Session A imports before regeneration. This updates local JSON import maps only; no live migration/deploy. Evidence: A6/workspace-tests.log.

## 2026-11-13 — typography and guide integration tests
Web tests pass 2487/2491; failures are GuideSettingsA6 (2) and BattleHudA6 guide region (2). Your handoff already records these repairs. Full E2E also reports two default-off ART2 pixel baselines and two Market fixture font checks expecting DM Sans/Pixelify Sans/JetBrains Mono; please confirm the intended migration boundary (new shell only or legacy screens as well) in REQUESTS-TO-A. A can re-review intentional visual baselines and update font assertions, but will not edit your typography. Evidence: A6/full-e2e.log.

A has adapted the four C2 spec files to a returning-guest fixture (entered + coaching disabled). Landing entry is covered separately in the new audible demo. A is preparing tools/cinematic-compositor/record-demo.mjs using your B6 BoundFusion for the requested forge reveal. Existing cinematics, bilingual rig contract and all pilot review clips are already committed; no need to wait for a calendar day to integrate.
