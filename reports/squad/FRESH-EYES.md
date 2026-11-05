# Separate fresh-eyes reviews · 2026-11-05

One author, separate browser sessions and perspectives; no independent reviewer or human
playtest. Scores below are retrospective design judgments made after reading the recorded
screens/command logs, not player data. Runs began from the running build with the combat
log closed. Current runtime is 1604c70; earlier screenshots record the same rules/art.

| Pass | Running-build evidence | Depth | Ability / impact | Art | Readability | Mean |
|---|---|---:|---:|---:|---:|---:|
| First-time player | 06:52 UTC; 66.1 s wall-time patrol, opening and wave-two captures | 8.0 | 7.8 | 7.7 | 8.0 | 7.88 |
| Skeptical judge, three minutes | 07:08 UTC; boss then burst training, 180.082 s session | 7.8 | 8.0 | 7.7 | 8.1 | 7.90 |
| Active player | 07:50 UTC; manual keys 1/2/3 and thread/boss marks, win at 77.3 s | 8.3 | 8.0 | 7.7 | 8.0 | 8.00 |
| Frame-by-frame effects | 21 fixtures, 87 native frames; exact resolved HP/shield checked | 8.0 | 8.1 | 7.7 | 8.1 | 7.98 |

Equal-weight mean of these four passes: **7.94 → 7.9/10**. The requested 8+ bar is
not met overall and art is below 8. The active-policy simulation and UI run demonstrate
agency, but cannot establish that a new player understands or enjoys it.

## Observations and revisions

- Newcomer: distinct Mochi/Soot/Clover silhouettes and the arc toward damaged Mochi explain
  front-line protection, group damage and recovery without the log. Danger lanes and target
  brackets help; small status glyphs still need learning. Evidence: newcomer-opening.webp,
  newcomer-wave-two.webp, newcomer-result.webp in fresh-eyes/; natural full-wave capture in art/.
- Skeptic: Yarn's binding target and phase-two cross lanes are visible, and training exposes
  the entire cast. Routine attacks still feel repetitive; the burst preset bypasses much
  of the sustain/enrage pressure. Evidence: skeptic-first-thread.webp, skeptic-boss-result.webp,
  skeptic-three-minutes.webp and skeptic.json. The 49.55 s screenshot is still phase one;
  phase two is proven by result/events and crossSweep-strip.webp, not by that filename.
- Active: the recorded commands select a binding thread, return to the boss, and fire each
  ultimate with actual keyboard input. All ultimates were switched to manual first. A win
  at 77.3 s is one run, not a controlled comparison; use balance.json for the policy study.
- Frame review: actual engine fixtures drive the actual Phaser presenter, not a second
  animation model. All 9 skills, 3 passives, 6 enemy attacks and 3 boss moves have strips.
  Guardian closes to contact and returns; Milk Flask curves; Cross Stitch brackets actual
  victims even where floor lanes visually cross another sprite. AoE membership is locked
  at cast time and marked on actors whose melee presentation has moved from its anchor.

Initial inspection exposed duplicate status/death/zero-value residue crowding out impacts
and separate brightness caps for motion and residue. The fix reserves one four-effect bright
budget, keeps overflow subdued and leaves status glyphs persistent. Late thread/flask impact
and boss victim markers were rechecked in the refreshed strips. This is a concrete improvement;
no fabricated numeric pre-fix score is assigned.

The art study already corrected a cropped sword and moved ultimate controls into the 720px
viewport. The remaining quality limit is illustrated rather than concealed: several skills
share an arm pose, enemy motion has few unique frames, and clean procedural silhouettes are
not final commissioned animation. Further polish is Stage 2, not a reason to claim 8+ now.

## Evidence limits and pilot

Lossless strips show selected timestamps, not every video frame. Automated fixtures establish
causality/geometry, not subjective comprehension. The manual policy was operated by the same
agent, not a human. No retention, accessibility-user or battery study was performed.

Recruit five people unfamiliar with the build (a small usability sample). First session:
start patrol without the log, identify caster/victim/result for one combo, select the wave-two
healer, explain a bind and recover from defeat with one adjustment. Returning session after
24–48 hours: choose and explain a preset, use a manual ultimate on an exposed knot, complete
both training modes, and decide freely whether to replay. Record task success, incorrect
interpretations, time to first deliberate target, reasons for preset choice and voluntary retry.
Do not convert five opinions into a retention percentage or population claim.
