# A5 B2 — utility suppression can create an attack

Status: correction adopted after both registered TRAIN matrices; all six source checks and OFF compatibility PASS. Original current-source TRAIN composition is still running; broader balance remains open.

Carrier12 found Inkcap's intended Velvetrim matchup winning 21/50, while the other seven sets won 50/50. Diagnostic13 preserves its gear, stats, allies, enemies and seeds, then ablates only setup effects. Removing row reach or Quiet spores restores 50/50 in both normalization arms. Removing the four-piece effect or its extra target preference leaves 21/50. All full-arm outcomes match the prior receipt exactly; twelve seed-1 replays reproduce exactly.

The first paired divergence in seed 1 is Inkcap's choice 16, round 6: Quiet spores instead of Ink thread, aimed at Teacup Healer. Hush stops the committed 65-HP refill, but the enemy resolver falls through to its attack branch. It consumes Mochi's 70 shield and 39 HP while still displaying the refill intent. Without the added choice the healer restores 65 HP instead. The Hush path subsequently loses; the ablated path wins. This is a hidden cost of suppression, not evidence that the set's opening shield is weak.

[Raw setup ablation](b2/rear-utility-13/results.json) · [exact divergence and round-6 events](b2/rear-utility-13/audit.json) · [full paired seed-1 replays](b2/rear-utility-13/seed1-replays.json).

Registered candidate15 changes one V4 branch: a Hushed, unimpaired heal/shield signature spends its committed utility turn without replacement damage. Ordinary basic attacks, Drowsy attacks, the damaging portion of summon/boss actions and OFF remain unchanged. The original AI, skills, stats, gear and fixtures remain fixed. This does not combine the Cinnamon, rear-reach, kit-fit or anchored-pacing trials.

Focused regression attempt 2: original source fails only the two intended V4 suppression cases (14 pass); candidate passes all 16. Attempt 1 mistakenly required positive HP damage from shield-absorbed OFF attacks and is retained. The correction accepts the existing damage event, including zero HP loss, without changing combat source.

Both unchanged TRAIN matrices are registered: 1,840 common-fixture cells and 1,024 single-carrier cells, each with seeds 1–50. Both matrices are complete. Original failures and all negative pairs stay visible. No gate relaxation or fresh acceptance sampling.

Common-fixture Inkcap rises54.47%→56.35% (468 paired improvements/56 worsenings); Soot44.16%→47.25%, Sorrel52.31%→53.20%, Cinnamon83.63%→84.00%. The latter three remain outside55–75%. Crew advantage31.00→30.75pp still misses. Velvetrim homogeneous-set wins32.75%→47.50%, but Hearthloom, Bellsteel and Emberfelt stay below35%. All cats retain top-pick cells and every scene retains at least four near-best triples. This repairs one semantic defect; it does not close balance. [Common audit](b2/utility-suppression-15/common/summary.json).

The production regression suite adds19 behavioral cases, including summon/banquet attacks. Before correction only the two V4 heal/shield suppression cases fail; the other17 pass. Current16 separately registers composition with the already-shipped anchored60 curve, the original1,321-cell TRAIN50 matrix and all90 previously earned day7 saves. That saved-input comparison is not a fresh45-day cohort. [Current-source registration](b2/suppression-current-16/REGISTERED-METHOD.md).

[Pre-run method](b2/utility-suppression-15/REGISTERED-METHOD.md) · [focused checks](b2/utility-suppression-15/regression-after-attempt2.json).


The carrier audit verifies all1,024cells/51,200battles. Inkcap–Velvetrim's declared scene improves21→48wins in matched-utility and21→49 in fixed-core, with no negative pairs in those two cells. Across each full25,600battle arm,1,070/1,077 improve and321/328 worsen;6/8 cells have negative net gains. These outcomes remain in [the paired audit](b2/utility-suppression-15/paired-carriers.json). Velvetrim still does not lead its saturated primary scene, and Bellsteel's fixed-core primary falls37→35wins. No claim that all builds improve.

Production adopts only the three-line V4 branch, preserving the current fatal-followup guard formatting and anchored progression. All45 combat-source hashes must equal the registered current16 snapshot. Source regression passes19/19 after correction; the original2fail/17pass receipt is retained. Six source gates, OFF digest and current16 saved-input/balance regressions remain pending. No cooldown or fixture trial is adopted.

## Current-source saved-day7 regression

All90previously earned saves complete on current16. Casual26/30 and regular28/30 win within two attempts; heavy28/30 win first attempt. All24losses receive an available recommendation. Every first/first-two win outcome, advice and currency cost matches the anchored baseline. Of90first-encounter summaries,81are exact;89retry summaries and85without-advice summaries are exact. The independent audit preserves the changed pairs rather than claiming identical combat logs. Heavy advised retries still win0/2 while the paired without-advice attempts win2/2.

This is a saved-input regression, not a new45-day earned cohort. Source gates, OFF and the original1321-cell balance matrix remain pending. [Paired account audit](b2/suppression-current-16/day7-paired.json).

## Source validation checkpoint

Original source `edd8ac69e` passes typecheck, lint, 1,746 web tests, 1,154 rules tests (2 expected failures and 11 skips retained), all 421 E2E tests and build on their first attempts. All logs and 45 combat-source files were independently hash-verified. OFF remains exact across165cells/8,250routes; baseline-v1 and all13historical receipts remain unchanged. [Source and compatibility audit](b2-suppression/source-checks.json). No source-suite rerun.

The original1,321-cell TRAIN50 composition remains pending. Accurate Hush-credit eligibility is separately isolated in [the attribution review](B2-HUSH-ATTRIBUTION.md); no claim that source tests establish balance closure.
