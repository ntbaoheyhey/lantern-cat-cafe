# Decisions and supersessions

2026-11-14T03:48:34.089519+00:00 — User request REQUEST-FEEL.txt supersedes SOLO. One integrated branch from origin/codex/v3-demo-2026-11-14 @ 83891115c. Frozen A/B lanes and B worktree will not be committed. Old SY1/SY2 lane merges on 16/18 Nov are cancelled; A+B are already integrated.

F2: static camera, in-field ultimate focus; full-screen plates disabled, original files kept. F3/F11: fixed 800/2200 ms basics/ultimates, impacts 350/1100 ms. F6: remove active battle skills and record one new deterministic parity baseline after retuning. No baseline changed yet.

F7: SOLO S4 7–8 second chatter cadence cancelled. P3–P8 and E6 demoted behind FEEL Q0–Q8. Old gates measuring plate coverage, active skill counts, camera movement or mandatory barks will be explicitly marked SUPERSEDED by the corresponding user decision; other regression gates remain required. No gate or test has been changed yet.

Demo supervisor 46445 on 5994/5997/8546 left untouched. Own ports limited to 5990–5993.

2026-11-14T04:11Z — Q0 baseline B checker crashed on inherited absolute evidence path /Users/bao/taskbar-hero-chain/reports/v3-shell/b2/tests/e1-model-unit.log. Checker now rebases only that historical reports/ prefix into the integrated checkout, retaining SHA-256 verification and rejecting escapes. Original reports/measurements unchanged. Added traversal/locality regression test. No threshold change. A baseline reports stale evidence and future SY gates; recorded as inherited failures, not a new PASS.

2026-11-14T04:12Z — Q0 parity baseline result enum is "party" (all three won), not "win"; fixed recorder exit-code interpretation. Hashes and measured durations remain untouched. Durations are full production scheduler playback at 30 Hz with no UI turn gap, not extrapolated from the 30-second films.

2026-11-14T04:23:42.358734+00:00 — New user request adds F13 and QR. Preserved earlier request as REQUEST-FEEL-before-F13.txt; REQUEST-FEEL.txt is now the verbatim current attachment. QR research + quality bar blocks Q1–Q3 animation/VFX edits. No animation code has changed. Existing Q0 evidence is resumed, not recreated.

2026-11-14T04:48:11.765103+00:00 — Resume preserves all Q0 recordings and reviewed-frame notes. Q0 reaches its 60-minute cap with incomplete boss-frame/audio review and inherited browser/A/B failures; state OPEN, never DONE. Continue QR per section 0.5; no animation or rules code edited. Next Q0 method: explicit per-action frame + audio evidence and failure classification, not another broad blind run.

2026-11-14T05:08:43.848205+00:00 — QR correction: B08 v2 43.1–44.1 was an ultimate follow-up, not a basic; replaced with v1 76.5–77.6 after frame inspection. B06/U02/U07 clips were extended before measurement. Timings are 10 fps wall samples at reference x2/x3; mask measurements are estimates, not alpha ground truth. Sound has not been heard. No animation code changed.

2026-11-14T05:10:53.153490+00:00 - Extended B01/B07/U05 and inspected recovery frames: B01 n11-13, B07 n11, U05 n50-54. Previous incomplete windows preserved in JSON; B07 contact refined to n7-8. No audio listening claim.

2026-11-14T05:27:42.753146+00:00 — QR pilot 1 rejected: {'PASS': 36, 'OPEN': 7, 'FAIL': 11}; full-resolution ultimate mask 17.8615%, face flash/early surface contact/focus/death defects. Original videos/JSON retained. Pilot 2 changes composition and contact-surface method; thresholds unchanged. Per-step rollout estimate remains unverified because P1 author/integration/sound intervals were bundled. Capture resampler will use actual compositor timestamps at explicit 30 fps instead of concat JPEG default timebase. Audio not heard.

2026-11-14T05:36:38.152488+00:00 — Pilot 2 rejected: {'PASS': 45, 'FAIL': 2, 'OPEN': 7}. Area/symmetry pass but recorded basic contact is late and the broad ribbon theme is visually weak. Direct canvas/audio recording will replace CDP timestamp resampling for final pilot. Audio emission did not establish listening perception; no listening claim.

2026-11-14T05:41:28.033861+00:00 — Pilot 3 capture infrastructure correction: recorder onstart can await the first new canvas frame. Start the live draw loop before awaiting that event. Incomplete capture cancelled by owned PID 83661; no quality rejection or fourth pilot.

2026-11-14T05:51:00.270484+00:00 — QR pilot 3 rejected after all 11 sheets (132 frame views), three widths and private reference comparisons: 46 PASS / 6 FAIL / 2 OPEN. Recorded scene clocks repeat through f152–167, then jump at contact; deterministic seek masks concealed this defect. Phone stretch is a FAIL despite zero scroll overflow. Use QR.6 max-three-pilot continuation exception; QR remains OPEN, not accepted. Retain key poses/static field/direct audio capture, replace expensive frame composition in production. No thresholds lowered; audio listening not claimed. Per-step revision timings do not prove fresh-authoring cost.

2026-11-14T06:10:56.669490+00:00 — Q1 one-time deterministic baseline, reason **user decision F6**. Two-skill kits enforced at setup and legal choices; enemy signatures require full rage. Charge multiplier 2 for both sides. No damage/HP/economy constants changed. Production scheduler ratios/hashes: Q1-baseline-change.json. A report-writer syntax error occurred before f38669e8e; this follow-up adds the decision ledger without changing evidence.

- wave1: `ad89a7c6ed679f0bd2104ec395871205d324cf7d67d6634e94f5dcba69bf475b` → `8b7ed13d9a5121d9b80d3fab1fd0cd40ce470098e35e5167d6794fb4c4cde6d2`; 248.000s → 213.233s (0.859812×); party win, parity PASS.
- wave3: `5a7983fbe4fa656d7cb5f9ffa1b4e4f9306b691f92b395b1e0035754f3fd8aa6` → `8a313fe134033cec00a98e2de3c5a2b9907c672451dc5c3233b2dd83d67fd0fc`; 637.400s → 573.700s (0.900063×); party win, parity PASS.
- boss: `c3e2d2471d6a945e10537ee3423faa65a38c67416386f403377b75b112031baf` → `6797d9cfe68da8201122a416304269c0d7568af72a447030bf535e7b3c398e02`; 246.067s → 211.133s (0.858033×); party win, parity PASS.

Q1 test changes (no cases silently deleted; parameterized matrices retained). Q1-test-changes.json contains before/after titles. Legacy equipment/passive/art fixtures explicitly isolate historical mechanics; live C2 still rejects retired actions. Defend/swap-dependent equipment descriptions remain a follow-on compatibility issue; no new equipment behavior is invented.

`apps/web/src/game/cardrpg/battle-v3/audio-timeline.test.ts`
- uses weapon cues for basics and at most one ultimate callout at focus start — was “gives every active one specific voice and every ultimate two phases with a single SFX owner”.
- keeps paused and gallery frames silent and never repeats a cue on redraw — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- uses one impact cue for a simultaneous hit on many recipients — was “caps a late multi-target impact at six cues in a hundred milliseconds”.
- never starts optional chatter before or after an ultimate callout — was “holds a due bark when an authored callout is about to start and resumes it afterwards”.
- cannot reintroduce chatter through archived lead-in metadata at ×%s — was “fits a bark before a real-time lead-in without over-reserving at ×%s”.

`apps/web/src/game/cardrpg/battle-v3/motion.test.ts`
- holds the caster in its slot during focus and ignores archived walk-up metadata — was “uses a deferred ultimate wind-up for one moving approach and hands off before the plate”.
- keeps every archetype planted with readable weight changes and an exact return — was “moves every archetype through anticipation, strike, return without mutating the event plan”.
- reacts to actual damage recipients, including counter-damage, and settles exactly — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- seeks an ultimate identically in reverse order without a hero-spot approach — was “lands at the hero spot before the cut-in and seeks identically in reverse order”.
- keeps both side cameras fixed before, during and after contact — was “holds the camera through contact, restores framing, and mirrors enemy attacks”.
- never reframes the stage to follow a moving or clipped actor — was “fits an action shot without clipping the upper row or a returning actor”.
- keeps archived spoken-release metadata from changing the fixed camera — was “leaves the ultimate plate camera intact and resolves the field shot through a long spoken release”.
- finishes basic weight recovery within its 800 ms action — was “finishes the landing squash before a long spoken recovery ends”.
- keeps idle feet planted, phases independent and seeks deterministic — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- mirrors enemy poses while retaining the same timing and bounded displacement — was “mirrors every enemy archetype through travel, strike and recovery without changing timing”.
- gives every simultaneous damage recipient its own recoil and flash — was “gives every target of a simultaneous multi-target hit its own recoil and flash”.
- braces actual recipients without inventing a hit or moving bystanders — was “braces actual recipients before contact without inventing a hit or moving bystanders”.

`apps/web/src/game/cardrpg/battle-v3/presentation.test.ts`
- gives enemies only Basic or Ultimate and limits shake to ultimate contact — was “gives signatures active feedback and basics a smaller, flash-free contact”.
- shows only a local caster banner during focus and clears it on the next action — was “paints and clears fallback contact without leaving a stale ultimate plate”.
- never loads a full-screen video or plate regardless of seeking and reduced motion — was “keeps the poster visible until a decoded plate is ready and restores it on media failure”.

`apps/web/src/game/cardrpg/battle-v3/sequence.test.ts`
- keeps fixed timing and resolved events regardless of archived mode %s — was “keeps resolved events and exact contact in %s”.
- exposes exactly one Basic and Ultimate per cat while preserving archived effect assets — was “covers every cat with two different actives and a basic from four archetypes”.
- repeated ultimates keep the same beat and cannot skip a nonexistent plate — was “shortens only after three full presentations and skips without a second resolution”.
- C2 seeded combat remains byte-identical across archived presentation preferences — was “C2 seeded combat remains byte-identical across presentation modes”.

`apps/web/src/game/cardrpg/battle-v3/voice-windows.test.ts`
- never lets an old speech lead-in move the fixed beat at ×%s — was “keeps the whole deferred wind-up and its spoken tracks in sync at ×%s”.
- scales every live Basic and Ultimate uniformly at ×%s — was “finishes every required spoken take before the next voice or action at ×%s”.
- keeps final hits and reduced motion on the same fixed clock — was “preserves final-hit slow motion inside a spoken window and reduced-motion speech timing”.
- keeps basic and ultimate contact fixed with no plate or speech windows — was “keeps ordinary basic attacks at the selected speed and leaves the full-plate contact unchanged”.

`apps/web/src/game/cardrpg/depth/OutcomeV4.test.tsx`
- explains the recorded %s/%s plan and preserves its actual decision — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- reads each decision’s own plan when the surrounding battle plan differs — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- formats complete version1 receipts and preserves unfamiliar or incomplete recorded text — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- does not show a back-row percentage without incoming HP damage (%s) — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- states the back-row share of incoming HP damage only (rear=%s) — retained case; fixture/assertion follows F2/F3/F6/F7/F11.

`apps/web/src/game/cardrpg/depth/battle-presentation.test.ts`
- presents all three A6 boss phases from the real thresholds while retaining the two legacy phases — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- holds Burn-triggered phase %s and its helpers until the round beat — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- keeps direct-hit phase %s and its helpers on the action impact — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- preserves an action phase when its following round tick reaches the next phase — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- holds HP, KO, round and order until their presentation beat while rules resolve once — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- separates action HP, reflected damage and round ticks into a single bounded round beat — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- keeps an imminent KO visible during anticipation and handles revival values exactly — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- restores a pending impact after preview, honors pause and skips a moment cleanly — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- fits every gallery action inside the x1 pacing budget including hit stop and kill settle — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- advances presentation at %sx and preserves the watched rules result — retained case; fixture/assertion follows F2/F3/F6/F7/F11.

`apps/web/src/game/cardrpg/depth/battle-summary.test.ts`
- sums actual HP damage, healing and damage taken without double-counting defeat events — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- does not call a Bleed-cancelled choice the first ultimate (A6=$0) — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- leaves biggest hit empty when every recorded strike was fully blocked — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- leaves the star unassigned without a crew contribution (%s) — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- keeps a support-only star when recorded %s is positive — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- keeps enemy ultimates separate and uses the first actual crew cast after a Daze interruption — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- reports actual Rupture HP loss through shields (incoming=$incoming, HP=$hp) — retained case; fixture/assertion follows F2/F3/F6/F7/F11.

`apps/web/src/game/cardrpg/depth/card-action-plan.test.ts`
- changes presentation identity while preserving existing action and target IDs — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- gives each starter ultimate a bounded presentation duration — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- returns from preview to the precise in-progress battle without changing saved progress — retained case; fixture/assertion follows F2/F3/F6/F7/F11.

`apps/web/src/game/cardrpg/depth/model.test.ts`
- presents the resolved A6 rage signature when rage fills after the round intent — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- keeps the offline entry free of storage access and writes — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- restores app progress and reports storage failures with manual recovery — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- mounts the battle scene when resuming a local or imported active encounter — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- starts a new lesson and resets without inheriting a paused battle — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- waits at Prepare, then completes a fully automatic watched fight — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- skips %s from a paused, partly watched fight and replays the same result — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- keeps lesson, immediate battle, reward settlement and improvement usable — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- restores an unstarted encounter to Prepare and a completed encounter to Result — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- previews every live basic, ultimate, passive motif and enemy without mutating account progress — was “previews every authored skill and enemy without mutating account progress”.

`apps/web/src/game/cardrpg/depth/passive-presentation.test.ts`
- places the first-heal cleanse on the actual patient, and does not retrigger later — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- shows Mochi shelter only when the ally-shield passive adds self shield — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- requires a real Soot detonation and presents Panko riposte on Defend — retained case; fixture/assertion follows F2/F3/F6/F7/F11.

`apps/web/src/game/cardrpg/ui-v3/CatDetailsA6.test.tsx`
- browses exactly Basic and Ultimate effects without changing the account or losing preview navigation — was “browses all four exact current effects without changing the account or losing preview navigation”.
- discloses automatic ultimates from recruitment through growth, and keeps unowned cats recruitable — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- explains the fixed Basic and Ultimate timings without historical cooldowns — was “explains the current kit cooldowns without using their historical values”.
- separates base effects from the active patrol bonus and clears completed-route bonuses — retained case; fixture/assertion follows F2/F3/F6/F7/F11.

`apps/web/src/game/cardrpg/ui-v3/CatPreviewA6.test.tsx`
- opens the selected skill, previews freely and restores its trigger without changing the account — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- allows unowned previews without implying unlock, and returns from the gear miniature — retained case; fixture/assertion follows F2/F3/F6/F7/F11.

`apps/web/src/game/cardrpg/vfx-layered/timeline.test.ts`
- keeps every pilot aligned to actual four-unit rules contacts at all playback speeds — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- shortens the calm tail without moving the hit and produces no layers after the clip — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- can scrub backwards with the same result as a fresh sample — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- does not stretch painted tails when combat has a longer recovery — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- rejects malformed intervals and unordered keys before playback — retained case; fixture/assertion follows F2/F3/F6/F7/F11.

`packages/game-rules/src/cardrpg/depth/economy-c2.test.ts`
- keeps Bellsteel Riposte bounded without adding a gear taunt, preserving native Panko and legacy replays — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- bounds the Rain Bell to one debuff stack per swap and preserves the legacy full-status cleanse — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- quotes the C2 Rain Bell stack limit and Bellsteel trigger without changing legacy item text — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- bounds Soft Collar opening shielding in C2 without changing legacy shielding or other cats — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- discloses normalized live source odds, including exhausted daily drops and exact templates — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- preserves the legacy rarity roll order and template pool for old saves — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- keeps the earned 24-pull guarantee and separate cat price when pacing gear invitations — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- uses the same advertised tailoring cost through the legacy recipe entry point — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- consumes ten distinct seals atomically, without accepting a forged balance as an extra receipt — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- prices Legendary selectors at their own quoted mark cost, keeping cat choices unchanged — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- recovers a useful full-shelf drop even after the earned-thread cap is exhausted — retained case; fixture/assertion follows F2/F3/F6/F7/F11.

`packages/game-rules/src/cardrpg/depth/feel-kit.test.ts`
- normalizes old four-skill loadouts into Basic + Ultimate for every live cat — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- resolves enemy signatures only from full rage, including a previously charged ram — retained case; fixture/assertion follows F2/F3/F6/F7/F11.

`packages/game-rules/src/cardrpg/depth/link-source-c2.test.ts`
- keeps a native link at 30% when its caster wears Hearthloom — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- uses the configured gear share, then allows the native skill to replace it — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- does not overwrite a living stronger skill link when Defend grants a gear link — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- preserves the legacy equipped-caster link behavior outside C2 — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- values a weak gear link below a native skill link during auto-play — retained case; fixture/assertion follows F2/F3/F6/F7/F11.

`packages/game-rules/src/cardrpg/depth/outcome-v4.test.ts`
- describes the selected plan without claiming it caused a manual action (legacy=%s) — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- counts only matching actor, focus and care receipts for the displayed plan — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- omits the tactic summary for absent or unfamiliar records — retained case; fixture/assertion follows F2/F3/F6/F7/F11.
- preserves measured effects ahead of the optional plan summary — retained case; fixture/assertion follows F2/F3/F6/F7/F11.

`packages/game-rules/src/cardrpg/depth/route-upgrades.test.ts`
- preserves rank ${rank} legacy effects and rejects retired actives in ${mode} — was “preserves rank ${rank} shield/healing amounts and status stacks in ${mode}”.
