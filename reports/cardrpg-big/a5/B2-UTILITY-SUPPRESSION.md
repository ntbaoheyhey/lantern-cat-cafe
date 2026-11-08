# A5 B2 — utility suppression can create an attack

Status: causal TRAIN diagnosis; correction is isolated and not adopted.

Carrier12 found Inkcap's intended Velvetrim matchup winning 21/50, while the other seven sets won 50/50. Diagnostic13 preserves its gear, stats, allies, enemies and seeds, then ablates only setup effects. Removing row reach or Quiet spores restores 50/50 in both normalization arms. Removing the four-piece effect or its extra target preference leaves 21/50. All full-arm outcomes match the prior receipt exactly; twelve seed-1 replays reproduce exactly.

The first paired divergence in seed 1 is Inkcap's choice 16, round 6: Quiet spores instead of Ink thread, aimed at Teacup Healer. Hush stops the committed 65-HP refill, but the enemy resolver falls through to its attack branch. It consumes Mochi's 70 shield and 39 HP while still displaying the refill intent. Without the added choice the healer restores 65 HP instead. The Hush path subsequently loses; the ablated path wins. This is a hidden cost of suppression, not evidence that the set's opening shield is weak.

[Raw setup ablation](b2/rear-utility-13/results.json) · [exact divergence and round-6 events](b2/rear-utility-13/audit.json) · [full paired seed-1 replays](b2/rear-utility-13/seed1-replays.json).

Registered candidate15 changes one V4 branch: a Hushed, unimpaired heal/shield signature spends its committed utility turn without replacement damage. Ordinary basic attacks, Drowsy attacks, the damaging portion of summon/boss actions and OFF remain unchanged. The original AI, skills, stats, gear and fixtures remain fixed. This does not combine the Cinnamon, rear-reach, kit-fit or anchored-pacing trials.

Focused regression attempt 2: original source fails only the two intended V4 suppression cases (14 pass); candidate passes all 16. Attempt 1 mistakenly required positive HP damage from shield-absorbed OFF attacks and is retained. The correction accepts the existing damage event, including zero HP loss, without changing combat source.

Both unchanged TRAIN matrices are registered: 1,840 common-fixture cells and 1,024 single-carrier cells, each with seeds 1–50. Results are pending; the focused checks alone do not establish balance. Original failures and all negative pairs stay visible. No production change, gate relaxation or fresh acceptance sampling.

[Pre-run method](b2/utility-suppression-15/REGISTERED-METHOD.md) · [focused checks](b2/utility-suppression-15/regression-after-attempt2.json).
