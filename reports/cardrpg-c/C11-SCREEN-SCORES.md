# C11 screenshot review — 11 November 2026

Scores are a visual review of the actual captures below, not a user-study result. Final designer art quality is excluded. Baseline: `shots/c11/review.json`, 31 screens at both requested sizes; all 62 captures inspected through uncropped contact sheets. Battle: four retained `shots/c9-stage` captures inspected at full size. C7 first-home captures were also inspected at both sizes. No completed A6/B acceptance run was repeated.

| Screen / filename stem | 1280×720 | 1440×900 | Observation |
|---|---:|---:|---|
| home | 8.3 | 8.4 | Crew, next goal and Patrol action separated; warm original portraits. |
| daily | 8.2 | 8.3 | Claim buttons visible; weekly progress remains secondary. |
| collection | 8.2 | 8.3 | Quick upgrade stays above the scrolling roster; costs visible. |
| cats-skills | 8.1 | 8.2 | Skill role and automatic use are clear; compact descriptions. |
| cats-bonds | 8.0 | 8.1 | Bonus and Bond Book link readable; detail pane sparse. |
| cats-gear | 8.0 | 8.1 | Four slots legible; empty slots still look plain. |
| bonds | 8.3 | 8.4 | Pair portraits, earned collection bonus and next action clear. |
| team | 8.2 | 8.3 | Front/back placement and crew roles clear at both sizes. |
| inventory | 8.2 | 8.3 | Contained item/portrait art; equip and enhance controls remain visible. |
| relics | 8.3 | 8.4 | One equipped cup and cap +8% readable; sample holdings labeled. |
| gacha | 8.2 | 8.3 | Portrait, odds and recruit action have a clear order. |
| map-choose | 8.1 | 8.2 | Route silhouette readable; recommendations are small at 720p. |
| map-progress | 8.1 | 8.2 | Cleared stops and next destination distinct. |
| map-choice | 8.3 | 8.3 | All three boon choices visible; keyboard selection settles correctly. |
| map-boss | 8.1 | 8.2 | Boss destination obvious; detailed star conditions remain secondary. |
| tower | 8.2 | 8.3 | Current floor, foes and climb action visible; locked-campaign copy reflects fixture reset. |
| journal | 8.3 | 8.4 | Earned gift versus future progress readable. |
| codex | 7.9 → 8.2 | 8.0 → 8.2 | Reused matching status icons and clarified stack/ultimate wording; full-size text remains readable. |
| save | 8.0 | 8.0 | Save import/export, speed and reduced motion fit; plain but usable. |
| prepare | 8.2 | 8.3 | Crew/foes separated; forecast and Fight action visible. |
| result | 8.4 | 8.4 | Reward summary, star conditions and Next action have good hierarchy. |
| loss | 8.1 | 8.2 | Named change and exact cost visible; raw browser recovery is 2/4 at the same node; pending fallback action guarded after recording. |
| recruit-welcome | 8.2 | 8.3 | Clear invitation identity and costs. |
| recruit-letter | 8.1 | 8.1 | Ten sealed cards enter in order; captures include intentional fades. |
| recruit-seal | 8.2 | 8.2 | Rarity rim/color and names remain readable. |
| recruit-burst | 8.2 | 8.2 | Reward cards become readable in sequence; final grid evaluated separately. |
| recruit-highlight | 8.4 | 8.4 | Large original portrait, rarity and new stamp; Skip visible. |
| recruit-legendary | 8.4 | 8.4 | Warm emphasis without covering the character. |
| recruit-summary | 8.4 | 5.5 → 8.4 | Fixed retained scroll hiding the heading and top row at 900p. |
| recruit-reduced | 8.4 | 5.5 → 8.4 | Same fix applies without ceremony; heading gains keyboard focus. |
| bag-empty | 8.2 | 8.3 | Clear empty shelf and next step; contained placeholder portraits. |
| normal battle | 8.0 | 8.1 | Faces, target ring, enemy HP and party cards separated; backdrop still simple. |
| boss battle | 8.0 | 8.1 | Boss stays on the right; minions/HP remain readable; body motion is provisional. |

The lowest actionable layout defect was recruitment at 1440×900. `RecruitV3` now resets the sheet to the top and focuses the completed heading. `shots/c11-recruit-fixed/review.json` deliberately scrolls the sheet 153–203px before completion: four summary/reduced cases return to 0px, show all ten cards and the next-action button, and focus the heading. Five component tests and workspace typecheck/lint pass. All 12 replacement recruitment captures inspected. The early animated frames are transitional; the completed grid is the acceptance gate.

Other exercised controls: daily gift keyboard claim, map boon keyboard choice, inventory equip and Tower action visibility. No broken visible images or horizontal overflow in the 62-screen baseline or the 12-shot focused check. The existing `shots/c11/1440-recruit-summary-before.webp` is retained as before evidence; final recruitment evidence is in `c11-recruit-fixed`.

The next lowest text screen was the field guide. `FieldGuideA6` now reuses the same original status paths as battle badges/VFX, explains stack limits in words, and says every cat has an automatic ultimate at 100 rage. Two full-size `shots/c11-guide` captures inspected; 10 recruit/guide/settings tests and web typecheck/lint pass. Fixture reward chips are transient and do not obscure the note. No new art or combat rules were introduced.

Current limits: simple procedural stage, temporary body animation, and gameplay tension remain below the 8.5 overall target. Gameplay has already used the approved three tuning rounds; retain its measured misses. The full corrected-driver session and its limits are in C11-SESSION-NOTES.md and checks/first-session-clean-analysis.json.

## Weighted checkpoint score

| Area | Weight | Score / 10 | Reason |
|---|---:|---:|---|
| Difficulty and upgrade pull | 20 | 5.8 | Clean UI run first loss6.56min, normal54.33s, boss170.77s and100%normal-winHP miss; recovery2/4 is too small to generalize. |
| First ten minutes | 15 | 8.0 | Three guided actions and earned rewards are clear; the earliest loss is still abrupt. |
| Battle readability, composition and size | 15 | 8.1 | Equal cats, readable HP/faces and boss on the right at both sizes; provisional body motion. |
| Skill VFX readability and impact at x1 | 15 | 7.9 | Complete event/socket coverage, clear protected lanes; several effects remain restrained glyphs. |
| Pipeline correctness | 15 | 8.7 | Official parser, immutable intake/fallbacks and PSD pilot proven; final designer export acceptance still pending. |
| Overall appearance | 10 | 7.9 | Original portraits and paper panels fit; procedural stage is noticeably flatter than the characters. |
| Stability, performance and demo size | 10 | 8.9 | Clean session0errors/0stalls, isolatedC6p95~16.8ms,28.82MBdemo; no broad hardware claim. |

Weighted result: **7.745/10 (7.75 rounded)**, below8.5. This is a provisional engineering/visual self-review, not a player-study score. Designer art quality is excluded. Earlier pipeline/performance gates are retained, not rerun to inflate confidence. The pending-action guard is not scored as a demonstrated recovery-rate improvement.

Advice checkpoint: all six `shots/c11-advice/review.json` captures inspected at full size (checking, completed no-change, timeout at both sizes). Exact cost, enabled/disabled state, footer and return-to-cafe navigation are visible. No comparison restarts after automatic discovery receipts.26 focused tests across advice/recruit/guide/settings and workspace typecheck/lint pass. The weighted score is retained; this proves UI behavior, not improved gameplay recovery.

Equipment follow-up: all ten c11-equipment captures inspected. Free +641 Power appears under the unchanged auto-equip control in Cats/Team/Bag; the same click produces exactly +641 and spends no currency. At720pCats the controls wrap above a complete first roster row; the remaining roster scrolls. Route-lock and already-equipped messages are legible. Scores remain unchanged pending broader player evidence.

Painted cafe follow-up: the new warm painted windows, walls and floor match the original characters more closely. Final glass/floor joins remain visually continuous during the checked ultimate shifts. Normal and boss composition stays readable at both sizes; no new face/HP obstruction. Retain the baseline table above as the before review. Current battle-composition score8.2 (was8.1), overall appearance8.2 (was7.9), other categories unchanged; weighted result **7.79/10**. The increase reflects this visible stage improvement only. Limited body animation, restrained VFX and measured gameplay misses remain. Evidence and measurement scope: C11-STAGE-RECEIPT.md.

Patrol follow-up: all14c11-patrol-gear captures inspected at both sizes. A compact sage/gold owned-gear action fills the free dock space beside Patrol; crew art/labels and navigation remain clear. Exact +641 preview/application, success/focus and guards verified in16browserchecks. Home scores and weighted7.79remain unchanged; improved visibility is not proof of gameplay recovery.

Kettle semantic follow-up:14finalbattle/22source/22offlinecaptures inspected. Damage lands on its victim; opening shield/Warm, low-HP Burn and genuine enemy support remain separate and legible. Face/HP lanes stay clear at both sizes. Correctness fix only; weighted7.79unchanged.

Utility follow-up: inspected14finalbattle+10source+10offlinecaptures. A bobbin core makes winding visible on Spool, the following strike has damage numbers on cats, and support remains friendly. Charge/strike gallery toggle fits both sizes. Weighted7.79unchanged; correctness/readability refinement is not player-study evidence.

Outcome follow-up:34captures inspected; short Resisted/Immune words and stacked damage/status rows remain clear of faces/HP. Pure resisted Marigold has no damage cue. Rightmost enemy/minion clips during ultimate zoom in the retained battle captures; next framing fix. Weighted7.79unchanged. C11-OUTCOME-RECEIPT.md.

Ultimate silhouette follow-up:24source/4battle/8offline/2performance views inspected. Larger translucent cafe motifs remain distinct while faces/HP/status rows stay readable. Body animation and glyph-based effects are still provisional. Retain weighted7.79; details and benchmark scope in C11-ULTIMATE-PAINT-RECEIPT.md.

Cat gear follow-up:16captures inspected (both Cats panels full size). Existing keepsake art, owned counts and slot-specific shelf navigation make the next action explicit. First roster row and all four slots fit at720p; no overflow or broken images. Correctness/usability refinement only; weighted7.79 retained. C11-GEAR-SLOTS-RECEIPT.md.

Growth follow-up: all18final captures inspected; full costs, exact deficits and short earning hints fit at both sizes, including the complete first roster row at720p. Caps/route locks and exact purchase results remain correct. Weighted7.79 unchanged; no new recovery-rate evidence. C11-GROWTH-RECEIPT.md.

Awakening follow-up: all24final captures inspected after one720p clipping repair. Full costs, level/star prerequisite, deficits and the purchase action fit both sizes; disabled styling is distinct. Six keyboard purchases match the public command across three ranks. Weighted7.79 unchanged. C11-AWAKENING-RECEIPT.md.

Bag enhancement follow-up:28finalcaptures inspected; all comparison stats, full shortages and actions visible at both sizes after two720p spacing repairs. Wearer-specific quotes and zero-main-gain wording match public purchases. Weighted7.79 retained; no recovery evidence.

Bag transfer follow-up:28final captures and four settled-result views inspected; crew gain/loss/zero, transfer names, stats and both actions fit both sizes. Total follows exact public equip. Set losses remain below the initial effects view and are next. Score7.79 unchanged. C11-BAG-TRANSFER-RECEIPT.md.

Bag bonus follow-up:42final captures inspected, including two full-size dense cases. Bonus warnings and actions remain visible; exact lost/gained details scroll independently. Keyboard focus and20public-command equips verified. Weighted7.79unchanged; no recovery claim. C11-BAG-BONUS-RECEIPT.md.

Saved-team follow-up:36final captures inspected; exact Power/gear/bonus review and missing-piece guidance fit both sizes. The list scrolls while actions stay visible; Prepare clearly keeps current gear.40browser checks including16keyboard applications verified;weighted7.79 unchanged. C11-SAVED-TEAM-RECEIPT.md.

Preparation follow-up:30final+2error captures inspected at both sizes; supply/carrier notices and rejection reasons are readable. One 900p outline-spacing repair keeps stacked notices and all suggestion actions inside the dialog.50browser/20keyboard applications plus2failure cases pass. Weighted7.79 unchanged. C11-PREPARATION-RECEIPT.md.

Story/treasure follow-up:30finalviews inspected at both sizes; points, per-catHP, caps and exhausted-treasure escape remain readable. Weighted7.79 unchanged. C11-EVENTS-RECEIPT.md.

Reward follow-up:26reward+2campfire views inspected; rank/stack changes and20%power increments visible in modern/legacy layouts. Capped choices remain distinct and the exhausted pool opens the route. Weighted7.79 unchanged. C11-REWARDS-RECEIPT.md.

Route completion follow-up:36final captures inspected, including list ends and keyboard focus at both sizes. Named gear navigation, readable conversion/missing notes and final-floor copy pass114browser checks. One focus-spacing repair; scroll hint keeps all finds discoverable. Weighted7.79 unchanged. C11-COMPLETION-RECEIPT.md.

C11 milestone continuation: inspected68distinct final views across Events/Journal/Map; full and reduced gifts readable, complete Discoveries cards fit both sizes after geometry repair. Score7.79 retained; this is decision clarity, not new gameplay evidence.

Daily/reset follow-up:44sweep and24replacement views inspected at both sizes; full/reduced amounts, expiry and whole-gift consequence readable. Explicit shortcut scroll repairs the clipped heading; disabled login is visually distinct. Score7.79 retained.

Idle follow-up:44final and28style views inspected at both sizes. Full/reduced supplies, consumption costs and receipts fit the modal. Muted unavailable Fast reward colors fixed after visual inspection; keyboard focus remains contained/restored. Weighted7.79unchanged. C11-IDLE-RECEIPT.md.

First-level follow-up:12final views inspected at both sizes. Complete first roster row fits720p; fourth-cat focus fits900p after8px scroll padding. Hand points down toward Level up.18browser checks pass;weighted7.79 unchanged. C11-FIRST-LEVEL-RECEIPT.md.

First-context follow-up:54views inspected including four loading frames replaced by settled views. Route/supply/unowned guidance matches available controls; hands face actions and clear the map.64browser/7tests/types/lintPASS. Score7.79 retained; no player-recovery claim. C11-FIRST-CONTEXT-RECEIPT.md.

Preparation health follow-up:28final views inspected in seven sheets plus two full-size checks. Wounded/knocked-out cards, health descriptions, hints and Fight fit both sizes; bond lines clear names.116browser/10keyboard/15tests/types/lintPASS; score7.79retained. C11-PREPARATION-HEALTH-RECEIPT.md.

Loss guidance follow-up:46finalviews inspected in eight sheets plus two full-size reviews. Exact Power, cost, free owned gear and retry destination fit both sizes; keyboard focus remains visible.50browser/28keyboard/38tests/types/lintPASS. FixedTower advice works below foe level; campaign limits retained. Score7.79unchanged; no new recovery evidence. C11-LOSS-RECOVERY-RECEIPT.md.

2026-11-11T20:00:24.712714+00:00 Bond details follow-up:48finalviews inspected in8sheets plus two full-size states. Effects/eligibility/trigger and fixed Book action fit both sizes; full-note bounds and keyboard scroll pass. Weighted7.79 retained; C11-BOND-SUMMARY-RECEIPT.md.

2026-11-11T20:11:24.040432+00:00 Save follow-up:46captures inspected plus four settled restore replacements, two previews full size. Saved route/large values/focus/720p panel fit.30browser+4restorationchecks/7tests/types/lintPASS;weighted7.79 retained; C11-SAVE-RECEIPT.md.

2026-11-11T20:34:32.807818+00:00 Skill context follow-up:44+34views inspected through14sheets, including eight settled rank endpoint replacements. Cooldowns, base effects and active patrol bonus fit with a125px minimum note at both sizes; keyboard scroll and preview return verified. Six focused tests/types/lint and106+32browserchecks PASS. Weighted7.79 retained; C11-SKILL-CONTEXT-RECEIPT.md.

2026-11-11T20:50:39.878328+00:00 Enemy tactics follow-up:104finalviews at both sizes,108inspected including four superseded hint captures. Current13enemy notes/read-only handbook/battle/preparation pass88browser+2settled checks.90px minimum body with keyboard access to full text; forecast/Fight stay visible.37tests/types/lintPASS. Weighted7.79unchanged;next inspect remaining battlecontrols.

2026-11-11T20:56:40.793222+00:00 Battlecontrols:30finalviews inspected across both sizes/motion modes;native guide stays readable and blocks background input.98browser checks/18tests/types/lintPASS. Existing7.79weighted score unchanged;next remaining battle-option clarity.

2026-11-11T21:05:56.862757+00:00 Leave-table follow-up:48finalviews in8sheets plus full-size720p/900p;complete text, gift consequences and focus fit both sizes.68browser/27tests/types/lintPASS;weighted7.79retained. C11-BATTLE-LEAVE-RECEIPT.md.

2026-11-11T21:17:32.683862+00:00 Auto-next:44captures inspected,40final after four settled Tower replacements; visible countdown/cancel and report note fit both sizes.68+4browser/33focused/types/lintPASS. Weighted7.79retained; C11-AUTO-NEXT-RECEIPT.md.

2026-11-11T21:59:14.449226+00:00 Log keyboard:8finalviews inspected fullsize;book/returncopy/focus/oldestentry fit both sizes.120browser/29tests/types/lintPASS;score7.79 retained. Bare damage/status rows remain next readability item.

2026-11-11T22:09:15.736339+00:00 Log copy:32finalviews inspected fullsize at both sizes/motion modes; names/effect totals/oldestentry/focus fit. Weighted7.79 unchanged. C11-BATTLE-LOG-COPY-RECEIPT.md.
