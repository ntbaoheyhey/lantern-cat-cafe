# A5 H0 first-session baseline

Measured on unchanged A4 P7 artifact `067d2062f6836a6d0bb9f6753ece1b2f3ca923688f241866a7f42806c8f7b6a1`. These are automation proxies, **not a human playtest**. One fresh save; real clicks; x1; no skip, accelerated time, currency or level injection. Active play 60.37 minutes.

|Minutes|Meaningful offers|Rewards|Celebrations|Dead seconds (combat proxy)|Words median/max|Dev controls max|
|---|---:|---:|---:|---:|---:|---:|
|0–5|17|8|4|128.6|308/571|6|
|0–30|75|18|6|896.7|308/656|6|
|0–60|98|18|6|1886.9|307/673|6|

The largest reward-or-celebration gap in minutes 0–30 is 775.3 seconds. Counters use committed positive currency/gear/cat differences and visible invitation ceremonies. Unique offer contexts are counted once; changing final HP/actions qualifies independently of changing victory.

|Screen|Visits|Median words|Max words|
|---|---:|---:|---:|
|hub|55|359|361|
|prepare|64|493|507|
|map|147|63|129|
|result|63|339|673|
|gacha|7|320|350|
|inventory|32|567|621|
|collection|32|289|289|
|journal|11|214|214|

## Day7 defeat reproduction

Exact earned P6 save imported by real UI. DEFEAT after **52.368 s**, 10 rounds, 25 automatic party actions. First fallen: **Mochi**, round 6, source Yarn Giant.

Plan: finish/steady. HP damage by row at impact: front 1194, rear 1612. Remaining foes: Yarn Giant 183/1034 HP; Binding Thread 115/115 HP. This describes the observed failure; the B1 ablation will test causal explanations.

- Mochi: front; moonwick-weapon-rare, moonwick-outfit-rare, moonwick-charm-rare, hearthloom-relic-epic.
- Soot: rear; hearthloom-weapon-common, hearthloom-outfit-rare, mossbrew-charm-rare, mossbrew-relic-epic.
- Clover: rear; moonwick-weapon-common, hearthloom-outfit-common, mossbrew-charm-common, mossbrew-relic-common.

Active crews: Door team: +3% maximum HP. Kettle team: +4% healing.

## Measurement limits and retained attempts

- Counterfactual choice means differing final HP, action count or result on train seeds 1/2/3; it does not establish a win-probability improvement.
- Route, boon and event alternatives are recorded but not counted as meaningful without paired outcomes.
- Dead time is the registered conservative noninteractive combat proxy; enjoyable automatic animation may still engage a person.
- Other elapsed time includes navigation, computation, invitation reveals and browser readiness. It is not silently classified as dead time.
- Words include rendered content below the fold, selected option text, and no collapsed details or unselected dropdown choices.
- Shared-lock waits are excluded from active minutes; real cafe service time can accrue during these explicitly recorded wall-time handoffs.
- The retained browser was outside battle but ambient rendering was not suspended during shared-lock handoffs; timing isolation with lane B is NOT VERIFIED.
- The earned day7 fixture is imported through the UI; this reproduces A4 public-command progression, not seven elapsed browser days.
- Attempt1 is retained under h0/session-attempt-1; its equipment-policy loop is a harness failure, excluded from baseline. See registered correction before attempt2.

Evidence: [timeline](h0/timeline.json), [metrics](h0/metrics.json), [day7 full logs](h0/day7/checks.json), [protocol](h0/REGISTERED-JOURNEY.md), [contact sheet](h0/contact.png). No new acceptance seeds were sampled.

## Receipt and visual review

Four receipt integrity tests pass (`h0/receipt-tests-attempt-1.log`): completed-artifact identity, meaningful-offer paired differences, raw-window arithmetic, and all six successful gate-log hashes. Typecheck/lint/build pass; web 1,735, rules 1,106 (+2 expected failures/11 skipped), E2E 421 pass. Runtime source is unchanged from A4 P7; later report-only commits do not imply those gates tested new gameplay.

The 48-image contact sheet was visually reviewed, plus full-size Equipment compare and late Result captures. Capture budget retains the first 41 session images (through minute 10.1), plus seven day7 images; the text timeline continues for all 60.37 minutes. No screenshot of minute 30 or 60 is claimed. The Equipment comparison is below the fold; Result explains anonymous crew totals.

“Meaningful offers” count build-context/option comparisons with different simulated outputs, including HP and action count. They are not 75 distinct strategic ideas or proof of enjoyable choices. Reward scarcity is clear independently: no additional positive currency/gear/cat reward was observed between minutes 30 and 60 under this policy. Human engagement remains unmeasured.

## Closure and reproducibility

The complete OFF regression rechecked165cells/8,250routes in two bounded CPU slices: digest `47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3` PASS. Baseline-v1 bytes/SHA, thirteen historical sim hashes, protected-path scope and author checks PASS. [Closure receipt](h0/closure.json); [scope](h0/scope-pr.json).

Five receipt tests now verify original-commit provenance, paired offers, arithmetic, gate-log hashes and completed OFF/source evidence. Their first four-test run and the later expanded five-test run both remain. Contact generation failed once because system Python lacked Pillow; retry used the existing local evidence environment. No gameplay or timing run was repeated for that failure.
