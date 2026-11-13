# Requests to Session B

## 2026-11-13 — S5-A-VOICE-WINDOW and U3 formation responses

A source2bb54cf9c reserves each required take's durationMs plus80ms, including consecutive ultimate charge/release lines. Voiced windows run at1x at every selected battle speed; full plate contact remains3200ms and rules events are unchanged. Nine actual browser timing captures (three fixtures at×1/×2/×3) fire130/130 required cues with0 duration overlaps, minimum clearance96.33ms, and9/9 combat parity. Evidence:`a2/P1/audio-window-after.json` and `voice-*-x*.json`. This closes the A event-timing reproduction; B's audible source interruption/recognition checks still need the scheduled integration. No accelerated speech, extra generic voice, or engine changes were introduced.

A sourcea94248fd6 replaces the U3 formation marks with GameIcon controls,44px targets, and an orange Fight action at1280/1440/390px. Native and touch drag swaps, rows, seed, HP and enemy stats still pass. Evidence:`a2/P8/controls-metrics.json`, `compare-controls.png`, and `metrics.json`. A uses the current clock artwork for Saved until B's history icon arrives. Scheduled merges stay16/18November12:00UTC.

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

## 2026-11-13 — root cause for the legacy typography failures
After restoring the test build folder, eight guidance cases still fail: next-hint button computes `font-family: Times`, even after the test sets --font-body:sans-serif. B2 removed font-family declarations from legacy CSS (onboarding.css/theme.css etc.), but typography.css is loaded only by the cardrpg entry; legacy-entry does not load the shared font application rules. Please apply the tokens/centralized rules to legacy entry or scope the migration to the new shell. Repro: e2e/ui/baseline-hud.spec.ts:228. This is a real font fallback regression, not an assertion update. Market fixture entry needs the same consideration. A has not edited B-owned typography/screens.

Manual battle controls are delivered: battle-v3/controls.ts queues a clicked ready portrait for its legal turn when Auto is off, without changing Auto's chosen action. docs/rig-contract.md and public/units/*/rig.json provide the shared native rig/event interface.

## 2026-11-13 — hidden Night tips and menu text
C2 recheck now passes formation and skill cases. The 33-screen word-budget flow reaches 32 screens, then times out on `Review Night tips`: shell.css line 6 hides both .uv-tips and .a6-idle-chest with display:none!important. Please restore a reachable tips/fast-reward entry (keep its accessible name or tell A the replacement). The existing menu is also 28 visible words vs the unchanged 25-word budget. A will rerun the exact cases after your fix; no test thresholds have been relaxed. Evidence A6/e2e-failed-recheck.log.

A resumed at 00:34 UTC: BattleHudA6 guide assertions now target the real Guide chapters navigation; 18/18 pass. B-owned font/tips/menu fixes remain outstanding in your current working tree. Request details above still apply before final merge.

## Final integration after B6/B7
Merged 9af6da640 and b7a6ed179. All 4,721 local unit tests, typecheck, lint and production build now pass, resolving headless audio/types/maps/guide issues above. Battle-owned toolbar now reserves shared audio space; exact three-viewport pointer test passes. B7 did not include the legacy font or hidden tips/menu fixes requested above, so the final full E2E retains those gates unchanged. No new shell fixes have been made by A. The manual ultimate controls, native rig contract and 13 plates are already available on A.

## Final closure — 13 remaining browser cases
All published B commits through b7a6ed179 are merged; a final fetch found no newer work. The latest full suite is 420/435. A repaired image-icon Odds selectors and all four Odds cases pass, resolving two of the 15 failures. Remaining: 8 legacy fallback-font cases, 2 Market font cases, 2 ART2 default-off pixel baselines, and the text-diet flow. No font expectation or baseline was weakened.

The word-budget collector recorded 32/33 screens before hidden Night tips: collection 31, tower 39, bonds 27, skills 30, cat-gear 26, cat-bonds 26, tasks 34, gifts 30, menu 28 (limit 25). Include the shared Mix control in the existing count. Please restore reachable Review Night tips, decide/apply fonts consistently in legacy and Market entries, and reduce the listed screen copy. Detailed diagnosis and the exact port-isolated reproduction command are in A6/REMAINING-GATES.md. A6 closes PARTIAL; B fixes and affected/full reruns remain follow-up work. A did not modify your typography or screen implementation.

## 2026-11-13 — V3-A2 G0: shell tips route blocks shared browser subset
At A source 506a79d75, typecheck, full unit suite and combat parity pass. Browser subset is 9/10. `tools/cardrpg-c2/word-budget.mjs:69` waits for the absent button `Review Night tips` from the shell menu; the text-diet test times out after 180 seconds. Please repair the current tips route/accessible action and update the shell-owned helper if the intended action name changed. Keep all word-count expectations. Evidence: `reports/v3-battle/a2/G0/suite-e2e.log`. A does not skip this case or mark the suite green. Scheduled merges remain 16/18 November; A continues battle work meanwhile.

## 2026-11-13 — V3-A2 audio timeline integration
A now owns all C2 battle cue timing in battle-v3/audio-timeline.ts + battle-audio.ts (source d2def5b5e). Explicit specific voice cues precede their corresponding cast SFX in the same tick, following your documented 300 ms microtask suppression. The C2 legacy adapter and the cinematic player's duplicate audio calls are disabled. Charge/release offsets come from your 112-row JSON at a1353ff10 (read-only snapshot; no early merge). Every active and both ultimate phases are voiced once in all three fixtures.

| Unit | Skill | Suggested line | Mood | Missing row |
|---|---|---|---|---|
| None | All cat actives/ultimates and all 13 enemy signatures checked | Existing B lines retained | Existing | 0 |

There are 88 distinct cue/element pairs in the three captured timelines. Your manifest resolves 84 directly; status.buff.on/off and status.debuff.on/off currently use your generic shield-status fallback. Please supply explicit buff/debuff designs or confirm that intended alias. All move/kit/voice/ultimate cues resolve at a1353ff10. Coverage is file/design verification only; audible mix and final ducking still require the scheduled integration review. A has not modified src/audio or public/audio.

## 2026-11-13 — T1 HUD icon hooks
The battle uses current /icons clock, fight, boss-seal, menu and refresh. Please preserve these IDs through U2. Please supply the U2 paths for speed, pause/play, auto and skip painted controls so A can adopt them at SY1. A uses original inline skip geometry and scoped button frames meanwhile; no B icon or font file was edited.

## 2026-11-13 — phone shell around battle result/preparation
A2 P6/P8 uses a single-column result and working native/touch formation swaps. At390×844, the shared wallet/avatar strip compresses the avatar into a vertical sliver, and first-patrol guidance can extend off the right edge over the result stars or preparation sheet. Please keep shared guidance within the viewport and collapse the wallet strip on phone. A's returning-player review clears journey.pending as the established word-budget fixture does; the shared shell files remain unchanged. See a2/P6/phone.png and a2/P8/phone-preview.png for shell geometry. The battle-owned result colors and mobile grid are fixed on A.

## 2026-11-13 — active callout cadence is still engine-owned
Read-only review of B's current audio/engine.ts finds that only `voiceCallout(id)?.kind === 'ultimate'` bypasses the7000ms voice cadence. A emits every active's explicit `voice.<unit>.skill.<skillId>` once, but this policy can suppress most of those lines. Please let required explicit skill callouts bypass chatter cadence too, while preserving one voice source and suppressing low-priority barks. A is reserving the full durationMs for required active/ultimate speech; no engine change or early merge is made here. The V3 event gate does not substitute for audible coverage at SY1.

Q8 stable battle targets: battle-roles, battle-rows, battle-order, battle-intent, battle-rage, battle-statuses, battle-supplies, battle-speed. Existing HUD anchors plus a compact real queue and packed-supply indicator; no combat changes. Commit on A only; use current A files in B temporary integration for tutorial audit.
