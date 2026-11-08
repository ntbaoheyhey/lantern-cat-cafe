# A5 B2 — utility suppression can create an attack

Status: causal TRAIN diagnosis; correction is isolated and not adopted.

Carrier12 found Inkcap's intended Velvetrim matchup winning 21/50, while the other seven sets won 50/50. Diagnostic13 preserves its gear, stats, allies, enemies and seeds, then ablates only setup effects. Removing row reach or Quiet spores restores 50/50 in both normalization arms. Removing the four-piece effect or its extra target preference leaves 21/50. All full-arm outcomes match the prior receipt exactly; twelve seed-1 replays reproduce exactly.

The first paired divergence in seed 1 is Inkcap's choice 16, round 6: Quiet spores instead of Ink thread, aimed at Teacup Healer. Hush stops the committed 65-HP refill, but the enemy resolver falls through to its attack branch. It consumes Mochi's 70 shield and 39 HP while still displaying the refill intent. Without the added choice the healer restores 65 HP instead. The Hush path subsequently loses; the ablated path wins. This is a hidden cost of suppression, not evidence that the set's opening shield is weak.

[Raw setup ablation](b2/rear-utility-13/results.json) · [exact divergence and round-6 events](b2/rear-utility-13/audit.json) · [full paired seed-1 replays](b2/rear-utility-13/seed1-replays.json).

Registered candidate15 changes one V4 branch: a Hushed, unimpaired heal/shield signature spends its committed utility turn without replacement damage. Ordinary basic attacks, Drowsy attacks, the damaging portion of summon/boss actions and OFF remain unchanged. The original AI, skills, stats, gear and fixtures remain fixed. This does not combine the Cinnamon, rear-reach, kit-fit or anchored-pacing trials.

Focused regression attempt 2: original source fails only the two intended V4 suppression cases (14 pass); candidate passes all 16. Attempt 1 mistakenly required positive HP damage from shield-absorbed OFF attacks and is retained. The correction accepts the existing damage event, including zero HP loss, without changing combat source.

Both unchanged TRAIN matrices are registered: 1,840 common-fixture cells and 1,024 single-carrier cells, each with seeds 1–50. The common matrix is complete; the carrier matrix is pending. Original failures and all negative pairs stay visible. No production change, gate relaxation or fresh acceptance sampling.

Common-fixture Inkcap rises54.47%→56.35% (468 paired improvements/56 worsenings); Soot44.16%→47.25%, Sorrel52.31%→53.20%, Cinnamon83.63%→84.00%. The latter three remain outside55–75%. Crew advantage31.00→30.75pp still misses. Velvetrim homogeneous-set wins32.75%→47.50%, but Hearthloom, Bellsteel and Emberfelt stay below35%. All cats retain top-pick cells and every scene retains at least four near-best triples. This repairs one semantic defect; it does not close balance. [Common audit](b2/utility-suppression-15/common/summary.json).

The production regression suite adds19 behavioral cases, including summon/banquet attacks. Before correction only the two V4 heal/shield suppression cases fail; the other17 pass. Current16 separately registers composition with the already-shipped anchored60 curve, the original1,321-cell TRAIN50 matrix and all90 previously earned day7 saves. That saved-input comparison is not a fresh45-day cohort. [Current-source registration](b2/suppression-current-16/REGISTERED-METHOD.md).

[Pre-run method](b2/utility-suppression-15/REGISTERED-METHOD.md) · [focused checks](b2/utility-suppression-15/regression-after-attempt2.json).
