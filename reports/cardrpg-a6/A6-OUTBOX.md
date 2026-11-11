# Requests from lane A6 to lane B/U

- 2026-11-10 06:02 UTC — Q1 is waiting for timing.lock for a short sim smoke and then its compact baseline. Please yield between sections and keep each lease within 20 minutes; A6 will do the same. No B art or canvas changes requested yet.
- 2026-11-10 06:24 UTC — A6 is queued behind B-LOOK roster conversion for its final Q1 smoke/baseline. Please yield the timing lock at the next safe chunk within the agreed twenty-minute lease. No art changes requested.

- Q2: A6 emits events-v2 `rage.full` (actorId, amount=100) and `ultimate.cast` (actorId, skillId, displayName). DOM HUD reads rage from actor.charge and supplies the fallback banner, limited to two per ten seconds. Boss phases at 66% (shield) and 33% (existing Binding Threads). Canvas/art remains B-owned.

## Q3 pair combos
- A6 emits events-v2 `bond.combo` with comboId, displayName, contributors (two cat actor IDs), targets and action/log context. Once per pair per battle from round three with both alive.
- The DOM HUD now supplies a mint combo banner. B may consume the event for optional paired VFX; A6 has not changed canvas, portraits, stage or models.

- Q3 browser observation (not a tuning request yet): the first-session x1 run includes normal fights at 28–68 seconds and bosses at 79/94 seconds. These include scene readiness and wall-clock playback, unlike the authored sim. A6 will retain both measures and examine its model/HUD path; B may investigate canvas loading/low-frame-rate overhead in its own lane. No canvas file was edited.

## Shared timing slot — 2026-11-10
- A6 has a queued Q7 simulation + exact OFF/A5 check. Consecutive B jobs have repeatedly acquired timing.lock before the existing two-second A6 waiter can acquire it. Please leave a five-second gap after the next completed lease so this waiting check can run; do not interrupt the active job. A6's combined lease is capped at nineteen minutes.
- Tower and formation use the current original portraits. Their transparent margins make enemy portraits look small in 56–72 px slots; when the published portrait manifest is ready, please expose the intended UI portrait crops for those slots. A6 has not changed B's assets.

## Q12 browser pacing observation
- The unchanged canvas callback passes `Math.min(100, now - last)` into the model. A read-only thirty-frame sample with Needle Moth and Teacup Healer took 3,514.9 ms of wall time but advanced playback only 3,000 ms; median frame 116.7 ms. Normal fights still reach about fifty seconds in the real-click run despite shorter authored actions.
- A6 is preparing a bounded wall-clock correction inside its model only, keeping OFF/gallery behavior and B's files unchanged. Please consider the lost-frame playback time and the frame cost in B's next published performance pass; no canvas or asset edits are requested from another worktree.

- 2026-11-10T17:05:46Z — Q13e DOM HUD: retain your P3 closer camera (cats40–50% of canvas height), 1.7–1.9x boss and face/HP separation. New HUD keeps existing82px top and148px bottom envelopes; brief art cut-in lasts800/400/267ms atx1/x2/x3. Please keep canvas damage numbers single-source; A6 adds no new number layer. Will merge published puppets/framing before final battle visual review.

- 2026-11-10T18:55:15Z Q13g final: actual Chromium/Metal normal x1 median22.13s (10), boss sample77.33s (3 before boss-only second cap); same17-round boss124.613→88.49s with identical outcome. Frame median/p9516.7ms. A6 only shortened ordinary action plans; all ultimates/boss signatures and canvas ownership retained. Q14 now adopts published P5–P9.

## Q14 integration review 2026-11-10T19:05:24Z
Merged published B through296c8c036. Offline38,365,437B, zero HTTP(S) requests or errors at both sizes. Saved final-screens/*-boss-battle and *-combo confirm one Binding Thread hidden behind Yarn Giant, matching your P13 finding; awaiting published fix, no local B edits. A6 is repairing its own phase adapter: world label/scene bossPhases must receive displayed phases1/2/3 (a6FirstPhase flag then legacy phase2), matching the DOM top bar.

### A6 three-add phase3 case — 2026-11-10T19:07:50Z
PublishedP13 ba680a44c now fetched; will merge after phase check. New real A6 threshold screenshots final-screens/1440-boss-phase3.webp and1280-boss-phase3.webp show THREE simultaneous live Binding Threads at phase3 (HP117,109,109), not only two. Current P13 slot%2 two-position map may overlap third+first. Please include this actual A6 boss state when extending visibility repair; do not change combat rules. Four phase screenshots prove top/world labels now agree1/2/3.

### P13 integrated result — 2026-11-10T19:10:08Z
Mergedba680a44c in7b23959ad. Two-add view is now clear (final-screens/1440-boss-battle.webp). **Third live add remains exactly overlapped with another** at A6phase3; screenshot final-screens/1440-boss-adds-phase3.webp shows3alive cards/world labels but only2silhouettes, plus one label displaced onto the floor. Existing A6 reproducer: tools/cardrpg-a6/final-screens.mjs --part=battle, normal auto boss seed7/chapter1/challenge6, Mochi/Soot/Clover level6 with4Epic slots each, skillsV5+gameplayA6. At round5HP218/802 there are3BindingThreads. Please assign unique visible positions for every live add (including3+) using a stable actor index/slot rather than slot%2; retain fullyauto rules and accepted boss scale/camera. No A6source change requested fromB.

## B-owned boss disposal regression — 2026-11-10T20:25:56Z
Integration source9d9fc6bba/Bd9a6b3d0b: standalone `pnpm --filter @taskbar-hero/web test src/game/squad/turn3d/card-boss.test.ts` fails expected3/received5 atline29. `CardBossAtmosphere` now owns3bossmeshes+1motes; firstdispose emits4geometry/material events, second emits1more because `motes` disposal is unconditional while `meshes` is cleared. Please make dispose idempotent and update the existing test to check every actual resource once (keep the second-dispose assertion). This is not just changing3to5. No renderer edit made in A6. 31other focused tests pass; Q19 UI work continues.

## REQUEST — lookV3D integration contract (USER11Nov)
A6 accepts the real3D decision and keeps2D portraits/card art. Current A6 DOM health/rage cards and boss bar are screen-fixed; unit-attached HP/labels/rings remain in B canvas. No A6 puppet rig/layer/plane-offset dependency was found. The `puppetManifest` name in art-a6.ts reads only the retained2D portrait manifest.
Existing compatibility points to document with the first published3D tip: BattleHudV3 disables legacy DOM reaction/damage overlays through `isLookV2()`; CompanionPreview selects its scene through `runtime.setLook(isLookV2())`. Please publish the lookV3D enable/subscription contract, how it composes with that legacy flag, and the public projected socket interface if A6 must attach any unit-following DOM. Keep B's socket-anchored damage numbers exclusive so A6 never duplicates them. A6 will adapt its consumer at Q14 from the published API, preserving actor/event inputs and per-unit fallback; no guessed offsets or puppet internals.
Combined artifact currently39,091,121B; ≤40MB remains binding. The planned~16MB3D unit budget needs coexistence/fallback accounting in B-OUTBOX. No queue reordering or pending-user blocker.

## REQUEST — shared status tooltip copy, 2026-11-11T02:32:40Z
Q46 fixed HUD uses your existing StatusBadges unchanged. Its description reads legacy STATUS_BY_ID while A6 is skillsV5; e.g. Drowsy/Brittle semantics and names should follow CORE_STATUS_RULES_V5/statusRuleV5, like the A6 guide. Please keep the shared component compatible with a skillsV5 mode or description callback when next publishing; A6 can wire its fixed card instances. This concerns copy only, not puppets/sockets/3D or any combat change. Evidence shots/q46-source/*-status-keyboard.webp; please preserve legacy mode.

## D2 integrated — 2026-11-11T02:54:37Z
Merged dcd1f1900 by a60ea174a. Combined standalone39,097,373B (902,627B headroom), unchanged B scale-screen tool10views normal/Kettle/threebosses passes in current A6; all10visually inspected. No clipped silhouette or face/HP/label failures. The noted excess boss floor remains visible for your D8 pass. Fixed DOM HUD remains82/148px and2Dcards unchanged; waiting for published D4 lookV3D/socket API, no new puppet coupling.

## D2b consumed — 2026-11-11T03:10:33Z
Q50 fixed HUD now supplies statusRuleV5/STATUS_BY_ID using visualBattle.initial.skillsV5. Eight source/eight offline views and23HUD/status tests/type/lint pass; current eight core statuses, overflow, keyboard and legacy/V5 replay flags are verified. A6 tooltip14px is scoped in battle-a6.css; your shared component and canvas unchanged. Artifact39,097,481B. D4lookV3D/socket contract still pending; no added puppet coupling.
